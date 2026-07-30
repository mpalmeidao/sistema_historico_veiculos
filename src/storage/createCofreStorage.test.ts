import { describe, expect, it } from 'vitest'
import { createCofreStorage } from './createCofreStorage'
import { createMemoryWorkingStore } from './workingStore'
import { CofreStorageError } from './types'
import { COFRE_APPLICATION_ID } from './constants'
import { readApplicationId } from './applicationId'
import { getSqlJs } from './sqlJsLoader'
describe('createCofreStorage (in-memory)', () => {
  it('deve criar, serializar e reabrir com application_id válido', async () => {
    const storage = createCofreStorage({
      workingStore: createMemoryWorkingStore(),
      now: () => '2026-07-29T10:00:00.000Z',
    })

    const created = await storage.createCofre()
    expect(readApplicationId(created.query)).toBe(COFRE_APPLICATION_ID)
    expect(created.getContentMeta().contentVersion).toBe(1)

    const bytes = storage.exportCofreBytes(created)
    created.close()

    const reopened = await storage.importCofre(bytes, { replaceConfirmed: true })
    expect(readApplicationId(reopened.query)).toBe(COFRE_APPLICATION_ID)
    expect(reopened.getContentMeta()).toEqual({
      contentVersion: 1,
      modifiedAt: '2026-07-29T10:00:00.000Z',
    })
    reopened.close()
  })

  it('deve recusar bytes sem application_id válido', async () => {
    const storage = createCofreStorage({
      workingStore: createMemoryWorkingStore(),
    })

    const SQL = await getSqlJs()
    const foreign = new SQL.Database()
    foreign.run('PRAGMA application_id = 1')
    foreign.run('CREATE TABLE t (id INTEGER)')
    const bytes = foreign.export()
    foreign.close()

    await expect(storage.importCofre(bytes, { replaceConfirmed: true })).rejects.toMatchObject({
      code: 'INVALID_APPLICATION_ID',
    } satisfies Partial<CofreStorageError>)
  })

  it('deve recusar arquivo corrompido ou não-SQLite', async () => {
    const storage = createCofreStorage({
      workingStore: createMemoryWorkingStore(),
    })

    await expect(
      storage.importCofre(new TextEncoder().encode('nao-e-sqlite'), {
        replaceConfirmed: true,
      }),
    ).rejects.toMatchObject({ code: 'CORRUPT_OR_NOT_SQLITE' })
  })

  it('deve incrementar versão de conteúdo a cada mutate', async () => {
    let tick = 0
    const storage = createCofreStorage({
      workingStore: createMemoryWorkingStore(),
      now: () => `2026-07-29T10:00:0${tick++}.000Z`,
    })

    const session = await storage.createCofre()
    expect(session.getContentMeta().contentVersion).toBe(1)

    await session.mutate((db) => {
      db.run('CREATE TABLE IF NOT EXISTS scratch (id INTEGER)')
      db.run('INSERT INTO scratch (id) VALUES (1)')
    })
    expect(session.getContentMeta().contentVersion).toBe(2)

    await session.mutate((db) => {
      db.run('INSERT INTO scratch (id) VALUES (2)')
    })
    expect(session.getContentMeta().contentVersion).toBe(3)

    session.close()
  })
})
