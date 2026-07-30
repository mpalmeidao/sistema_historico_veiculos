import { writeApplicationId } from './applicationId'
import { writeContentMeta } from './contentVersion'
import { ensureSchema, type EnsureSchemaOptions } from './migrationRunner'
import type { CofreSqlApi } from './types'

/**
 * Inicializa um cofre novo: application_id, schema na versão atual e content_meta = 1.
 * Substitui o antigo schema stub (só cofre_meta).
 */
export function initializeNewCofre(
  db: CofreSqlApi,
  now: () => string = () => new Date().toISOString(),
  schemaOptions?: EnsureSchemaOptions,
): void {
  writeApplicationId(db)
  ensureSchema(db, schemaOptions)
  writeContentMeta(db, {
    contentVersion: 1,
    modifiedAt: now(),
  })
}
