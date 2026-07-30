import { COFRE_APPLICATION_ID } from './constants'
import type { CofreSqlApi } from './types'

export function readApplicationId(db: CofreSqlApi): number {
  const rows = db.getRows('PRAGMA application_id')
  const value = rows[0]?.[0]
  return typeof value === 'number' ? value : Number(value ?? 0)
}

export function writeApplicationId(
  db: CofreSqlApi,
  applicationId: number = COFRE_APPLICATION_ID,
): void {
  db.run(`PRAGMA application_id = ${applicationId}`)
}

export function isValidCofreApplicationId(applicationId: number): boolean {
  return applicationId === COFRE_APPLICATION_ID
}
