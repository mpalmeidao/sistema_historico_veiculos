import { describe, expect, it } from 'vitest'
import { isValidCofreApplicationId, readApplicationId, writeApplicationId } from './applicationId'
import { COFRE_APPLICATION_ID } from './constants'
import { createSqlApi } from './sqlApi'
import { getSqlJs } from './sqlJsLoader'

describe('applicationId', () => {
  it('deve reconhecer o application_id do app', () => {
    expect(isValidCofreApplicationId(COFRE_APPLICATION_ID)).toBe(true)
    expect(isValidCofreApplicationId(0)).toBe(false)
    expect(isValidCofreApplicationId(123)).toBe(false)
  })

  it('deve gravar e ler PRAGMA application_id', async () => {
    const SQL = await getSqlJs()
    const db = new SQL.Database()
    const api = createSqlApi(db)

    writeApplicationId(api)
    expect(readApplicationId(api)).toBe(COFRE_APPLICATION_ID)

    writeApplicationId(api, 42)
    expect(readApplicationId(api)).toBe(42)
    expect(isValidCofreApplicationId(readApplicationId(api))).toBe(false)

    db.close()
  })
})
