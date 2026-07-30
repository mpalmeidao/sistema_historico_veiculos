import { describe, expect, it } from 'vitest'
import { createCofreStorage } from './createCofreStorage'
import { migrateV0ToV1, migrateV1ToV2, SCHEMA_MIGRATIONS } from './migrations'
import { ensureSchema } from './migrationRunner'
import {
  buildCofreFixtureBytes,
  testFailingMigrateV1ToV2,
  testMigrateV1ToV2,
} from './migrationTestFixtures'
import { CURRENT_SCHEMA_VERSION, readUserVersion, writeUserVersion } from './schemaVersion'
import { PECAS_MIGRATED_DESCRICAO } from './schemaV2'
import { createSqlApi } from './sqlApi'
import { getSqlJs } from './sqlJsLoader'
import { CofreStorageError } from './types'
import { createMemoryWorkingStore } from './workingStore'

describe('migrateV0ToV1 (passo isolado)', () => {
  it('deve levar user_version 0 para 1 com tabelas do baseline', async () => {
    const SQL = await getSqlJs()
    const db = new SQL.Database()
    const api = createSqlApi(db)

    expect(readUserVersion(api)).toBe(0)
    migrateV0ToV1.up(api)
    // O passo em si não seta user_version — o runner faz isso após up()
    expect(readUserVersion(api)).toBe(0)

    const tables = api
      .getRows(`SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name`)
      .map((r) => String(r[0]))
    expect(tables).toEqual(
      expect.arrayContaining(['anexos', 'cofre_meta', 'manutencoes', 'veiculos']),
    )

    ensureSchema(api)
    expect(readUserVersion(api)).toBe(CURRENT_SCHEMA_VERSION)
    db.close()
  })

  it('deve registrar passos 0→1 e 1→2 no registry', () => {
    expect(SCHEMA_MIGRATIONS).toHaveLength(2)
    expect(SCHEMA_MIGRATIONS[0]).toMatchObject({ fromVersion: 0, toVersion: 1 })
    expect(SCHEMA_MIGRATIONS[1]).toMatchObject({ fromVersion: 1, toVersion: 2 })
    expect(CURRENT_SCHEMA_VERSION).toBe(2)
  })
})

describe('migrateV1ToV2 (passo isolado)', () => {
  async function openAtV1() {
    const SQL = await getSqlJs()
    const db = new SQL.Database()
    const api = createSqlApi(db)
    migrateV0ToV1.up(api)
    writeUserVersion(api, 1)
    return { db, api }
  }

  it('deve criar manutencao_pecas e remover pecas_trocadas', async () => {
    const { db, api } = await openAtV1()
    migrateV1ToV2.up(api)

    const tables = api
      .getRows(`SELECT name FROM sqlite_master WHERE type = 'table'`)
      .map((r) => String(r[0]))
    expect(tables).toEqual(expect.arrayContaining(['manutencao_pecas']))

    const cols = api.getRows(`PRAGMA table_info(manutencoes)`).map((r) => String(r[1]))
    expect(cols).not.toContain('pecas_trocadas')
    expect(cols).toEqual(
      expect.arrayContaining([
        'id',
        'veiculo_id',
        'data',
        'km',
        'tipo_servico',
        'oficina',
        'valor',
        'proxima_revisao',
      ]),
    )
    db.close()
  })

  it('deve migrar texto de peças para um item com valor da manutenção', async () => {
    const { db, api } = await openAtV1()
    api.run(
      `INSERT INTO veiculos (placa, marca_modelo, km_atual, created_at, updated_at)
       VALUES ('ABC1D23', 'Uno', 0, '2026-01-01T00:00:00.000Z', '2026-01-01T00:00:00.000Z')`,
    )
    api.run(
      `INSERT INTO manutencoes
        (veiculo_id, data, km, tipo_servico, pecas_trocadas, oficina, valor, proxima_revisao, created_at, updated_at)
       VALUES (1, '2026-01-15', 1000, 'Óleo', 'Filtro de óleo', NULL, 250, NULL,
               '2026-01-15T00:00:00.000Z', '2026-01-15T00:00:00.000Z')`,
    )

    migrateV1ToV2.up(api)

    const pecas = api.getRows(
      `SELECT descricao, valor, posicao FROM manutencao_pecas WHERE manutencao_id = 1`,
    )
    expect(pecas).toEqual([['Filtro de óleo', 250, 0]])
    db.close()
  })

  it('deve migrar só valor sem texto para item com descrição canônica', async () => {
    const { db, api } = await openAtV1()
    api.run(
      `INSERT INTO veiculos (placa, marca_modelo, km_atual, created_at, updated_at)
       VALUES ('ABC1D23', 'Uno', 0, '2026-01-01T00:00:00.000Z', '2026-01-01T00:00:00.000Z')`,
    )
    api.run(
      `INSERT INTO manutencoes
        (veiculo_id, data, km, tipo_servico, pecas_trocadas, oficina, valor, proxima_revisao, created_at, updated_at)
       VALUES (1, '2026-01-15', 1000, 'Óleo', NULL, NULL, 99.5, NULL,
               '2026-01-15T00:00:00.000Z', '2026-01-15T00:00:00.000Z')`,
    )

    migrateV1ToV2.up(api)

    const pecas = api.getRows(
      `SELECT descricao, valor FROM manutencao_pecas WHERE manutencao_id = 1`,
    )
    expect(pecas).toEqual([[PECAS_MIGRATED_DESCRICAO, 99.5]])
    db.close()
  })

  it('deve deixar sem peças quando não há texto nem valor', async () => {
    const { db, api } = await openAtV1()
    api.run(
      `INSERT INTO veiculos (placa, marca_modelo, km_atual, created_at, updated_at)
       VALUES ('ABC1D23', 'Uno', 0, '2026-01-01T00:00:00.000Z', '2026-01-01T00:00:00.000Z')`,
    )
    api.run(
      `INSERT INTO manutencoes
        (veiculo_id, data, km, tipo_servico, pecas_trocadas, oficina, valor, proxima_revisao, created_at, updated_at)
       VALUES (1, '2026-01-15', 1000, 'Óleo', NULL, NULL, NULL, NULL,
               '2026-01-15T00:00:00.000Z', '2026-01-15T00:00:00.000Z')`,
    )

    migrateV1ToV2.up(api)

    expect(
      api.getRows(`SELECT COUNT(*) FROM manutencao_pecas WHERE manutencao_id = 1`)[0]?.[0],
    ).toBe(0)
    expect(api.getRows(`SELECT valor FROM manutencoes WHERE id = 1`)[0]?.[0]).toBe(null)
    db.close()
  })
})

describe('ensureSchema (runner)', () => {
  it('deve tratar user_version ausente (0) como estado inicial e migrar', async () => {
    const SQL = await getSqlJs()
    const db = new SQL.Database()
    const api = createSqlApi(db)

    const result = ensureSchema(api)
    expect(result.migrated).toBe(true)
    expect(result.schemaVersion).toBe(CURRENT_SCHEMA_VERSION)
    expect(readUserVersion(api)).toBe(CURRENT_SCHEMA_VERSION)
    db.close()
  })

  it('deve ser no-op quando já está na versão atual', async () => {
    const SQL = await getSqlJs()
    const db = new SQL.Database()
    const api = createSqlApi(db)
    ensureSchema(api)

    const again = ensureSchema(api)
    expect(again.migrated).toBe(false)
    expect(again.schemaVersion).toBe(CURRENT_SCHEMA_VERSION)
    db.close()
  })

  it('deve recusar schema mais novo que o app', async () => {
    const SQL = await getSqlJs()
    const db = new SQL.Database()
    const api = createSqlApi(db)
    api.run('PRAGMA user_version = 99')

    expect(() => ensureSchema(api)).toThrow(CofreStorageError)
    try {
      ensureSchema(api)
    } catch (error) {
      expect(error).toMatchObject({ code: 'SCHEMA_TOO_NEW' })
    }
    // Não regrava para versão antiga
    expect(readUserVersion(api)).toBe(99)
    db.close()
  })

  it('deve aplicar cadeia progressiva e falhar sem marcar sucesso parcial', async () => {
    const SQL = await getSqlJs()
    const db = new SQL.Database()
    const api = createSqlApi(db)
    // Baseline v1 apenas
    ensureSchema(api, { currentVersion: 1, migrations: [migrateV0ToV1] })
    expect(readUserVersion(api)).toBe(1)

    expect(() =>
      ensureSchema(api, {
        currentVersion: 2,
        migrations: [migrateV0ToV1, testFailingMigrateV1ToV2],
      }),
    ).toThrow(CofreStorageError)

    // user_version permanece em 1 (passo 1→2 não concluiu)
    expect(readUserVersion(api)).toBe(1)
    const markers = api.getRows(
      `SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'schema_v2_marker'`,
    )
    expect(markers).toHaveLength(0)
    db.close()
  })

  it('deve completar cadeia v1→v2 quando o passo stub existe', async () => {
    const SQL = await getSqlJs()
    const db = new SQL.Database()
    const api = createSqlApi(db)
    ensureSchema(api, { currentVersion: 1, migrations: [migrateV0ToV1] })

    const result = ensureSchema(api, {
      currentVersion: 2,
      migrations: [migrateV0ToV1, testMigrateV1ToV2],
    })
    expect(result.migrated).toBe(true)
    expect(result.schemaVersion).toBe(2)
    expect(readUserVersion(api)).toBe(2)
    expect(
      api.getRows(
        `SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'schema_v2_marker'`,
      ),
    ).toHaveLength(1)
    db.close()
  })
})

describe('migrações via interface de storage', () => {
  it('deve criar cofre novo já na versão atual com tabelas v2', async () => {
    const storage = createCofreStorage({ workingStore: createMemoryWorkingStore() })
    const session = await storage.createCofre()

    expect(readUserVersion(session.query)).toBe(CURRENT_SCHEMA_VERSION)
    const tables = session.query
      .getRows(`SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name`)
      .map((r) => String(r[0]))
    expect(tables).toEqual(
      expect.arrayContaining([
        'anexos',
        'cofre_meta',
        'manutencao_pecas',
        'manutencoes',
        'veiculos',
      ]),
    )
    expect(session.getContentMeta().contentVersion).toBe(1)
    session.close()
  })

  it('deve abrir fixture v0, migrar até a atual e persistir user_version', async () => {
    const workingStore = createMemoryWorkingStore()
    const v0 = await buildCofreFixtureBytes({
      userVersion: 0,
      withV1Tables: false,
      contentVersion: 3,
      modifiedAt: '2026-07-28T08:00:00.000Z',
    })
    await workingStore.write(v0)

    const storage = createCofreStorage({ workingStore })
    const session = await storage.openWorkingCofre()
    expect(session).not.toBeNull()
    expect(readUserVersion(session!.query)).toBe(CURRENT_SCHEMA_VERSION)

    const tables = session!.query
      .getRows(`SELECT name FROM sqlite_master WHERE type = 'table'`)
      .map((r) => String(r[0]))
    expect(tables).toEqual(
      expect.arrayContaining(['veiculos', 'manutencoes', 'anexos', 'manutencao_pecas']),
    )

    // Independência: migração não bumpa content_version
    expect(session!.getContentMeta()).toEqual({
      contentVersion: 3,
      modifiedAt: '2026-07-28T08:00:00.000Z',
    })
    session!.close()

    const reopened = await storage.openWorkingCofre()
    expect(readUserVersion(reopened!.query)).toBe(CURRENT_SCHEMA_VERSION)
    expect(reopened!.getContentMeta().contentVersion).toBe(3)
    reopened!.close()
  })

  it('deve recusar schema futuro no import sem sobrescrever working store válido', async () => {
    const workingStore = createMemoryWorkingStore()
    const storage = createCofreStorage({ workingStore })
    const current = await storage.createCofre()
    const before = current.exportBytes()
    const contentBefore = current.getContentMeta()
    current.close()

    const future = await buildCofreFixtureBytes({ userVersion: CURRENT_SCHEMA_VERSION + 5 })

    await expect(storage.importCofre(future, { replaceConfirmed: true })).rejects.toMatchObject({
      code: 'SCHEMA_TOO_NEW',
    })

    const stillThere = await workingStore.read()
    expect(stillThere).not.toBeNull()
    expect(Array.from(stillThere!)).toEqual(Array.from(before))

    const reopened = await storage.openWorkingCofre()
    expect(readUserVersion(reopened!.query)).toBe(CURRENT_SCHEMA_VERSION)
    expect(reopened!.getContentMeta()).toEqual(contentBefore)
    reopened!.close()
  })

  it('deve recusar schema futuro no openWorkingCofre sem regravar o arquivo', async () => {
    const workingStore = createMemoryWorkingStore()
    const future = await buildCofreFixtureBytes({
      userVersion: 42,
      contentVersion: 7,
      modifiedAt: '2026-07-29T15:00:00.000Z',
    })
    await workingStore.write(future)
    const before = await workingStore.read()

    const storage = createCofreStorage({ workingStore })
    await expect(storage.openWorkingCofre()).rejects.toMatchObject({ code: 'SCHEMA_TOO_NEW' })

    const after = await workingStore.read()
    expect(Array.from(after!)).toEqual(Array.from(before!))
  })

  it('deve falhar abertura no meio da cadeia sem persistir estado parcial', async () => {
    const workingStore = createMemoryWorkingStore()
    const v1 = await buildCofreFixtureBytes({
      userVersion: 1,
      contentVersion: 4,
      modifiedAt: '2026-07-29T16:00:00.000Z',
    })
    await workingStore.write(v1)
    const before = await workingStore.read()

    const storage = createCofreStorage({
      workingStore,
      schema: {
        currentVersion: 2,
        migrations: [migrateV0ToV1, testFailingMigrateV1ToV2],
      },
    })

    await expect(storage.openWorkingCofre()).rejects.toMatchObject({ code: 'MIGRATION_FAILED' })

    const after = await workingStore.read()
    expect(Array.from(after!)).toEqual(Array.from(before!))

    // Reabre com app real (v2) e migra v1→v2 com conteúdo intacto
    const recovery = createCofreStorage({ workingStore })
    const session = await recovery.openWorkingCofre()
    expect(readUserVersion(session!.query)).toBe(CURRENT_SCHEMA_VERSION)
    expect(session!.getContentMeta().contentVersion).toBe(4)
    session!.close()
  })

  it('deve importar fixture antiga, migrar e manter content_version independente', async () => {
    const workingStore = createMemoryWorkingStore()
    const storage = createCofreStorage({ workingStore })
    const v0 = await buildCofreFixtureBytes({
      userVersion: 0,
      withV1Tables: false,
      contentVersion: 11,
      modifiedAt: '2026-07-20T00:00:00.000Z',
    })

    const imported = await storage.importCofre(v0, { replaceConfirmed: true })
    expect(readUserVersion(imported.query)).toBe(CURRENT_SCHEMA_VERSION)
    expect(imported.getContentMeta()).toEqual({
      contentVersion: 11,
      modifiedAt: '2026-07-20T00:00:00.000Z',
    })
    imported.close()
  })
})
