/**
 * Camada de storage do cofre (única fronteira permitida para sql.js / OPFS / .cofre).
 * UI, hooks e domínio não importam sql.js — só esta pasta (ADR-002).
 */

export {
  COFRE_APPLICATION_ID,
  COFRE_SCHEMA_VERSION_STUB,
  COFRE_FILE_EXTENSION,
  OPFS_WORKING_FILENAME,
  DEFAULT_EXPORT_FILENAME,
} from './constants'

export { CURRENT_SCHEMA_VERSION, readUserVersion, writeUserVersion } from './schemaVersion'

export {
  CofreStorageError,
  type CofreStorageErrorCode,
  type ContentVersionMeta,
  type CofreSqlApi,
  type CofreSession,
  type CofreStorage,
  type ImportCofreOptions,
  type WorkingStore,
  type SqlValue,
  type QueryResult,
} from './types'

export { readApplicationId, writeApplicationId, isValidCofreApplicationId } from './applicationId'

export { readContentMeta, writeContentMeta, bumpContentMeta } from './contentVersion'

export { SCHEMA_MIGRATIONS, migrateV0ToV1, migrateV1ToV2, type SchemaMigration } from './migrations'
export { PECAS_MIGRATED_DESCRICAO } from './schemaV2'
export { ensureSchema, type EnsureSchemaOptions, type EnsureSchemaResult } from './migrationRunner'
export { initializeNewCofre } from './initializeNewCofre'

export { createCofreStorage, type CreateCofreStorageOptions } from './createCofreStorage'
export { createMemoryWorkingStore, createOpfsWorkingStore } from './workingStore'
export { supportsFileSystemAccess } from '../shared/browser/supportsFileSystemAccess'
