/**
 * Helpers só para testes de migração: montam fixtures `.cofre` com user_version
 * controlado. Asserções dos testes passam pela interface de storage (ADR-002).
 */
import { writeApplicationId } from './applicationId'
import { writeContentMeta } from './contentVersion'
import { COFRE_APPLICATION_ID } from './constants'
import { migrateV0ToV1, type SchemaMigration } from './migrations'
import { createSqlApi } from './sqlApi'
import { getSqlJs } from './sqlJsLoader'
import { writeUserVersion } from './schemaVersion'

export interface CofreFixtureOptions {
  userVersion: number
  contentVersion?: number
  modifiedAt?: string
  /** Se true (padrão quando userVersion >= 1), aplica DDL v1. */
  withV1Tables?: boolean
  applicationId?: number
}

export async function buildCofreFixtureBytes(options: CofreFixtureOptions): Promise<Uint8Array> {
  const SQL = await getSqlJs()
  const db = new SQL.Database()
  const api = createSqlApi(db)

  writeApplicationId(api, options.applicationId ?? COFRE_APPLICATION_ID)

  const withV1 = options.withV1Tables ?? options.userVersion >= 1
  if (withV1) {
    migrateV0ToV1.up(api)
  }

  writeUserVersion(api, options.userVersion)

  if (withV1 || options.contentVersion !== undefined) {
    if (!withV1) {
      api.run(`
        CREATE TABLE IF NOT EXISTS cofre_meta (
          id INTEGER PRIMARY KEY CHECK (id = 1),
          content_version INTEGER NOT NULL,
          modified_at TEXT NOT NULL
        )
      `)
    }
    writeContentMeta(api, {
      contentVersion: options.contentVersion ?? 1,
      modifiedAt: options.modifiedAt ?? '2026-07-29T09:00:00.000Z',
    })
  }

  const bytes = db.export()
  db.close()
  return bytes
}

/** Migração stub 1→2 usada só em testes de cadeia / falha. */
export const testMigrateV1ToV2: SchemaMigration = {
  fromVersion: 1,
  toVersion: 2,
  up: (db) => {
    db.run('CREATE TABLE IF NOT EXISTS schema_v2_marker (id INTEGER PRIMARY KEY)')
  },
}

/** Migração que sempre falha — testes de falha segura. */
export const testFailingMigrateV1ToV2: SchemaMigration = {
  fromVersion: 1,
  toVersion: 2,
  up: () => {
    throw new Error('falha simulada na migração 1→2')
  },
}
