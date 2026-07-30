import type { CofreSqlApi } from './types'

/** Versão de schema conhecida pelo app (v2: peças como tabela filha). */
export const CURRENT_SCHEMA_VERSION = 2

export function readUserVersion(db: CofreSqlApi): number {
  const rows = db.getRows('PRAGMA user_version')
  const value = rows[0]?.[0]
  return typeof value === 'number' ? value : Number(value ?? 0)
}

export function writeUserVersion(db: CofreSqlApi, version: number): void {
  db.run(`PRAGMA user_version = ${version}`)
}
