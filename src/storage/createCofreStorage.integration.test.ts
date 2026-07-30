import { describe, expect, it } from 'vitest'
import { createCofreStorage } from './createCofreStorage'
import { createMemoryWorkingStore } from './workingStore'
import { CofreStorageError } from './types'

describe('createCofreStorage integração (working store fake)', () => {
  it('deve persistir create → mutate → reabrir do working store', async () => {
    const workingStore = createMemoryWorkingStore()
    const storage = createCofreStorage({
      workingStore,
      now: () => '2026-07-29T11:00:00.000Z',
    })

    const session = await storage.createCofre()
    await session.mutate((db) => {
      db.run('CREATE TABLE IF NOT EXISTS scratch (label TEXT)')
      db.run('INSERT INTO scratch (label) VALUES (?)', ['ok'])
    })
    expect(session.getContentMeta().contentVersion).toBe(2)
    session.close()

    const reopened = await storage.openWorkingCofre()
    expect(reopened).not.toBeNull()
    const rows = reopened!.query.getRows('SELECT label FROM scratch')
    expect(rows).toEqual([['ok']])
    expect(reopened!.getContentMeta().contentVersion).toBe(2)
    reopened!.close()
  })

  it('deve fazer round-trip export → import restaurando dados', async () => {
    const storeA = createMemoryWorkingStore()
    const storageA = createCofreStorage({
      workingStore: storeA,
      now: () => '2026-07-29T12:00:00.000Z',
    })

    const original = await storageA.createCofre()
    await original.mutate((db) => {
      db.run('CREATE TABLE IF NOT EXISTS scratch (n INTEGER)')
      db.run('INSERT INTO scratch (n) VALUES (7)')
    })
    const exported = storageA.exportCofreBytes(original)
    original.close()

    const storeB = createMemoryWorkingStore()
    const storageB = createCofreStorage({ workingStore: storeB })
    const imported = await storageB.importCofre(exported, { replaceConfirmed: true })
    expect(imported.query.getRows('SELECT n FROM scratch')).toEqual([[7]])
    expect(imported.getContentMeta().contentVersion).toBe(2)
    imported.close()

    const fromWorking = await storageB.openWorkingCofre()
    expect(fromWorking?.query.getRows('SELECT n FROM scratch')).toEqual([[7]])
    fromWorking?.close()
  })

  it('não deve sobrescrever working store ao rejeitar import inválido', async () => {
    const workingStore = createMemoryWorkingStore()
    const storage = createCofreStorage({ workingStore })

    const session = await storage.createCofre()
    const before = session.exportBytes()
    session.close()

    await expect(
      storage.importCofre(new Uint8Array([1, 2, 3, 4]), { replaceConfirmed: true }),
    ).rejects.toBeInstanceOf(CofreStorageError)

    const stillThere = await workingStore.read()
    expect(stillThere).not.toBeNull()
    expect(Array.from(stillThere!)).toEqual(Array.from(before))
  })

  it('deve exigir confirmação antes de substituir cofre existente', async () => {
    const workingStore = createMemoryWorkingStore()
    const storage = createCofreStorage({ workingStore })

    const first = await storage.createCofre()
    const bytes = first.exportBytes()
    first.close()

    await expect(storage.importCofre(bytes, { replaceConfirmed: false })).rejects.toMatchObject({
      code: 'REPLACE_NOT_CONFIRMED',
    })

    const stillOpen = await storage.openWorkingCofre()
    expect(stillOpen).not.toBeNull()
    stillOpen!.close()

    const replaced = await storage.importCofre(bytes, { replaceConfirmed: true })
    expect(replaced.getContentMeta().contentVersion).toBe(1)
    replaced.close()
  })

  it('deve propagar falha de gravação no working store', async () => {
    const storage = createCofreStorage({
      workingStore: {
        async exists() {
          return false
        },
        async read() {
          return null
        },
        async write() {
          throw new Error('disco cheio')
        },
      },
    })

    await expect(storage.createCofre()).rejects.toMatchObject({
      code: 'OPFS_WRITE_FAILED',
    })
  })
})
