import { SCHEMA_MIGRATIONS, type SchemaMigration } from './migrations'
import { CURRENT_SCHEMA_VERSION, readUserVersion, writeUserVersion } from './schemaVersion'
import { CofreStorageError, type CofreSqlApi } from './types'

export interface EnsureSchemaOptions {
  /** Override da versão conhecida pelo app (testes). */
  currentVersion?: number
  /** Override do registry (testes de cadeia / falha). */
  migrations?: readonly SchemaMigration[]
}

export interface EnsureSchemaResult {
  /** True se ao menos um passo N→N+1 foi aplicado. */
  migrated: boolean
  /** user_version após o ensure (sempre === currentVersion em sucesso). */
  schemaVersion: number
}

/**
 * Lê `PRAGMA user_version` e decide: abrir / migrar / recusar.
 *
 * - versão ausente (0) → trata como estado inicial e migra até a atual
 * - versão < atual → aplica cadeia progressiva N→N+1 e seta user_version a cada passo
 * - versão === atual → no-op
 * - versão > atual → recusa (SCHEMA_TOO_NEW); não altera o banco
 *
 * Em falha no meio da cadeia, propaga erro sem marcar sucesso.
 * A persistência no working store fica a cargo do open/import — só após sucesso.
 */
export function ensureSchema(
  db: CofreSqlApi,
  options: EnsureSchemaOptions = {},
): EnsureSchemaResult {
  const currentVersion = options.currentVersion ?? CURRENT_SCHEMA_VERSION
  const migrations = options.migrations ?? SCHEMA_MIGRATIONS
  const initialVersion = readUserVersion(db)

  if (initialVersion > currentVersion) {
    throw new CofreStorageError(
      'SCHEMA_TOO_NEW',
      'Este cofre foi criado por uma versão mais nova do aplicativo. Atualize o app para abri-lo. O arquivo não foi alterado.',
    )
  }

  if (initialVersion === currentVersion) {
    // Garante FKs ativos em sessões já na versão atual
    db.run('PRAGMA foreign_keys = ON')
    return { migrated: false, schemaVersion: initialVersion }
  }

  let version = initialVersion
  while (version < currentVersion) {
    const step = migrations.find((m) => m.fromVersion === version)
    if (!step || step.toVersion !== version + 1) {
      throw new CofreStorageError(
        'MIGRATION_FAILED',
        `Não há migração de schema da versão ${version} para ${version + 1}. O cofre não foi alterado no dispositivo.`,
      )
    }

    try {
      step.up(db)
      writeUserVersion(db, step.toVersion)
      version = step.toVersion
    } catch (error) {
      if (error instanceof CofreStorageError) throw error
      throw new CofreStorageError(
        'MIGRATION_FAILED',
        'Falha ao atualizar o schema do cofre. O arquivo de trabalho não foi sobrescrito com um estado parcial.',
      )
    }
  }

  db.run('PRAGMA foreign_keys = ON')
  return { migrated: true, schemaVersion: version }
}
