import { describe, expect, it } from 'vitest'
import { bumpContentMeta, readContentMeta, writeContentMeta } from './contentVersion'
import { initializeNewCofre } from './initializeNewCofre'
import { createSqlApi } from './sqlApi'
import { getSqlJs } from './sqlJsLoader'

describe('contentVersion', () => {
  it('deve iniciar em 1 no schema baseline e incrementar a cada bump', async () => {
    const SQL = await getSqlJs()
    const db = new SQL.Database()
    const api = createSqlApi(db)
    const stamps = ['2026-01-01T00:00:00.000Z', '2026-01-02T00:00:00.000Z']
    let i = 0

    initializeNewCofre(api, () => stamps[0]!)
    expect(readContentMeta(api)).toEqual({
      contentVersion: 1,
      modifiedAt: stamps[0],
    })

    const afterFirst = bumpContentMeta(api, () => stamps[i++]!)
    expect(afterFirst.contentVersion).toBe(2)
    expect(afterFirst.modifiedAt).toBe(stamps[0])

    const afterSecond = bumpContentMeta(api, () => stamps[i++]!)
    expect(afterSecond.contentVersion).toBe(3)
    expect(afterSecond.modifiedAt).toBe(stamps[1])

    db.close()
  })

  it('deve permitir gravar meta explicitamente', async () => {
    const SQL = await getSqlJs()
    const db = new SQL.Database()
    const api = createSqlApi(db)
    initializeNewCofre(api)

    writeContentMeta(api, {
      contentVersion: 10,
      modifiedAt: '2026-07-29T12:00:00.000Z',
    })

    expect(readContentMeta(api)).toEqual({
      contentVersion: 10,
      modifiedAt: '2026-07-29T12:00:00.000Z',
    })

    db.close()
  })
})
