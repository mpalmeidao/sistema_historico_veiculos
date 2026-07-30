import { applySchemaV1Ddl } from './schemaV1'
import { createManutencaoPecasTable, PECAS_MIGRATED_DESCRICAO } from './schemaV2'
import type { CofreSqlApi } from './types'

/**
 * Passo de migração progressiva N → N+1.
 * Executa DDL/DML atrás do adapter `CofreSqlApi` (nunca sql.js na UI/domínio).
 */
export interface SchemaMigration {
  fromVersion: number
  toVersion: number
  up: (db: CofreSqlApi) => void
}

/** Migração 0 → 1: baseline (cofre_meta + veículos + manutenções + anexos). */
export const migrateV0ToV1: SchemaMigration = {
  fromVersion: 0,
  toVersion: 1,
  up: (db) => {
    applySchemaV1Ddl(db)
  },
}

/**
 * Migração 1 → 2: peças trocadas como lista (tabela filha);
 * remove coluna `pecas_trocadas` e migra dados legado.
 */
export const migrateV1ToV2: SchemaMigration = {
  fromVersion: 1,
  toVersion: 2,
  up: (db) => {
    db.run('PRAGMA foreign_keys = OFF')
    createManutencaoPecasTable(db)

    const rows = db.getRows(`SELECT id, pecas_trocadas, valor FROM manutencoes`)

    for (const row of rows) {
      const id = row[0]
      const pecasText = row[1]
      const valor = row[2]
      const manutencaoId = typeof id === 'number' ? id : Number(id)
      const texto = pecasText === null || pecasText === undefined ? '' : String(pecasText).trim()
      const valorNum =
        valor === null || valor === undefined
          ? null
          : typeof valor === 'number'
            ? valor
            : Number(valor)

      if (texto !== '') {
        db.run(
          `INSERT INTO manutencao_pecas (manutencao_id, descricao, valor, posicao)
           VALUES (?, ?, ?, 0)`,
          [manutencaoId, texto, valorNum !== null && Number.isFinite(valorNum) ? valorNum : 0],
        )
      } else if (valorNum !== null && Number.isFinite(valorNum)) {
        db.run(
          `INSERT INTO manutencao_pecas (manutencao_id, descricao, valor, posicao)
           VALUES (?, ?, ?, 0)`,
          [manutencaoId, PECAS_MIGRATED_DESCRICAO, valorNum],
        )
      }
    }

    db.run(`
      CREATE TABLE manutencoes_v2 (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        veiculo_id INTEGER NOT NULL REFERENCES veiculos(id) ON DELETE CASCADE,
        data TEXT NOT NULL,
        km INTEGER NOT NULL CHECK (km >= 0),
        tipo_servico TEXT NOT NULL,
        oficina TEXT,
        valor REAL CHECK (valor IS NULL OR valor >= 0),
        proxima_revisao TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )
    `)

    db.run(`
      INSERT INTO manutencoes_v2
        (id, veiculo_id, data, km, tipo_servico, oficina, valor, proxima_revisao, created_at, updated_at)
      SELECT id, veiculo_id, data, km, tipo_servico, oficina, valor, proxima_revisao, created_at, updated_at
      FROM manutencoes
    `)

    db.run('DROP TABLE manutencoes')
    db.run('ALTER TABLE manutencoes_v2 RENAME TO manutencoes')

    db.run(`
      CREATE INDEX IF NOT EXISTS idx_manutencoes_veiculo_id
        ON manutencoes(veiculo_id)
    `)
    db.run(`
      CREATE INDEX IF NOT EXISTS idx_manutencoes_veiculo_data
        ON manutencoes(veiculo_id, data DESC)
    `)

    db.run('PRAGMA foreign_keys = ON')
  },
}

/**
 * Registry ordenado de migrações conhecidas pelo app.
 * Cada entrada cobre exatamente um incremento de versão.
 */
export const SCHEMA_MIGRATIONS: readonly SchemaMigration[] = [migrateV0ToV1, migrateV1ToV2]
