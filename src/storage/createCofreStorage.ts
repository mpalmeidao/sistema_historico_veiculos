import type { Database } from 'sql.js'
import { isValidCofreApplicationId, readApplicationId } from './applicationId'
import { bumpContentMeta, readContentMeta } from './contentVersion'
import { DEFAULT_EXPORT_FILENAME } from './constants'
import {
  exportCofreWithShareOrDownload,
  saveCofreWithFilePicker as saveWithPicker,
} from './exportDownload'
import { initializeNewCofre } from './initializeNewCofre'
import { ensureSchema, type EnsureSchemaOptions } from './migrationRunner'
import { createSqlApi } from './sqlApi'
import { getSqlJs } from './sqlJsLoader'
import { assertSqliteBytes } from './sqliteBytes'
import { supportsFileSystemAccess } from '../shared/browser/supportsFileSystemAccess'
import { supportsOpfs } from '../shared/browser/supportsOpfs'
import { createOpfsWorkingStore } from './workingStore'
import {
  CofreStorageError,
  type ContentVersionMeta,
  type CofreSession,
  type CofreSqlApi,
  type CofreStorage,
  type ImportCofreOptions,
  type WorkingStore,
} from './types'

export interface CreateCofreStorageOptions {
  /** Padrão: OPFS. Testes injetam fake in-memory. */
  workingStore?: WorkingStore
  /** Override do clock (testes de versionamento). */
  now?: () => string
  /**
   * Se false, create/import/open exigem workingStore injetado ou OPFS.
   * Padrão: feature-check real.
   */
  requireOpfs?: boolean
  /**
   * Overrides do runner de schema (somente testes: cadeia, falha, versão “atual”).
   * Produção não passa este campo.
   */
  schema?: EnsureSchemaOptions
}

class SqlJsCofreSession implements CofreSession {
  private closed = false
  private db: Database
  private readonly api: CofreSqlApi
  private readonly workingStore: WorkingStore
  private readonly now: () => string

  constructor(db: Database, api: CofreSqlApi, workingStore: WorkingStore, now: () => string) {
    this.db = db
    this.api = api
    this.workingStore = workingStore
    this.now = now
  }

  getContentMeta(): ContentVersionMeta {
    this.assertOpen()
    return readContentMeta(this.api)
  }

  get query(): CofreSqlApi {
    this.assertOpen()
    return this.api
  }

  async mutate(work: (db: CofreSqlApi) => void): Promise<ContentVersionMeta> {
    this.assertOpen()
    work(this.api)
    const meta = bumpContentMeta(this.api, this.now)
    await this.persist()
    return meta
  }

  exportBytes(): Uint8Array {
    this.assertOpen()
    return this.db.export()
  }

  close(): void {
    if (this.closed) return
    this.closed = true
    this.db.close()
  }

  /** Persistência interna usada na criação/importação (sem novo bump). */
  async persist(): Promise<void> {
    this.assertOpen()
    const bytes = this.db.export()
    try {
      await this.workingStore.write(bytes)
    } catch (error) {
      if (error instanceof CofreStorageError) throw error
      throw new CofreStorageError(
        'OPFS_WRITE_FAILED',
        'Não foi possível salvar o cofre no dispositivo. Tente novamente.',
      )
    }
  }

  private assertOpen(): void {
    if (this.closed) {
      throw new CofreStorageError('COFRE_CLOSED', 'O cofre já foi fechado.')
    }
  }
}

async function openDatabaseFromBytes(bytes: Uint8Array): Promise<Database> {
  assertSqliteBytes(bytes)
  const SQL = await getSqlJs()
  try {
    return new SQL.Database(bytes)
  } catch {
    throw new CofreStorageError(
      'CORRUPT_OR_NOT_SQLITE',
      'O arquivo parece corrompido e não pôde ser aberto como cofre.',
    )
  }
}

function validateApplicationId(api: CofreSqlApi): void {
  const applicationId = readApplicationId(api)
  if (!isValidCofreApplicationId(applicationId)) {
    throw new CofreStorageError(
      'INVALID_APPLICATION_ID',
      'Este arquivo não é um cofre válido deste aplicativo (identificador incorreto).',
    )
  }
}

export function createCofreStorage(options: CreateCofreStorageOptions = {}): CofreStorage {
  const now = options.now ?? (() => new Date().toISOString())
  const workingStore = options.workingStore ?? createOpfsWorkingStore()
  const requireOpfs = options.requireOpfs ?? !options.workingStore
  const schemaOptions = options.schema

  function ensurePersistenceAvailable(): void {
    if (requireOpfs && !supportsOpfs() && !options.workingStore) {
      throw new CofreStorageError(
        'OPFS_UNAVAILABLE',
        'Este navegador não oferece armazenamento local seguro (OPFS). Atualize o navegador (Safari 16.4+ ou Chrome/Edge/Firefox recentes).',
      )
    }
  }

  async function wrapSession(db: Database): Promise<SqlJsCofreSession> {
    const api = createSqlApi(db)
    return new SqlJsCofreSession(db, api, workingStore, now)
  }

  /**
   * Valida application_id, aplica/recusa schema e indica se precisa persistir.
   * Em erro, fecha o db e não grava no working store.
   */
  function prepareOpenedDatabase(db: Database): { api: CofreSqlApi; migrated: boolean } {
    const api = createSqlApi(db)
    try {
      validateApplicationId(api)
      const { migrated } = ensureSchema(api, schemaOptions)
      return { api, migrated }
    } catch (error) {
      db.close()
      throw error
    }
  }

  return {
    isOpfsAvailable(): boolean {
      return supportsOpfs()
    },

    supportsFileSystemAccess(): boolean {
      return supportsFileSystemAccess()
    },

    async hasWorkingCofre(): Promise<boolean> {
      ensurePersistenceAvailable()
      return workingStore.exists()
    },

    async createCofre(): Promise<CofreSession> {
      ensurePersistenceAvailable()
      const SQL = await getSqlJs()
      const db = new SQL.Database()
      const api = createSqlApi(db)
      initializeNewCofre(api, now, schemaOptions)
      const session = await wrapSession(db)
      await session.persist()
      return session
    },

    async openWorkingCofre(): Promise<CofreSession | null> {
      ensurePersistenceAvailable()
      const bytes = await workingStore.read()
      if (!bytes) return null

      let db: Database
      try {
        db = await openDatabaseFromBytes(bytes)
      } catch (error) {
        if (error instanceof CofreStorageError) throw error
        throw new CofreStorageError(
          'CORRUPT_OR_NOT_SQLITE',
          'O cofre de trabalho está corrompido e não pôde ser aberto.',
        )
      }

      // Schema futuro / falha de migração: fecha db e NÃO regrava o working store
      const { migrated } = prepareOpenedDatabase(db)
      const session = await wrapSession(db)
      if (migrated) {
        // Persiste só após cadeia completa com sucesso; não bumpa content_version
        await session.persist()
      }
      return session
    },

    async importCofre(bytes: Uint8Array, importOptions: ImportCofreOptions): Promise<CofreSession> {
      ensurePersistenceAvailable()

      // Valida (application_id + schema) antes de tocar no working store
      let db: Database
      try {
        db = await openDatabaseFromBytes(bytes)
      } catch (error) {
        if (error instanceof CofreStorageError) throw error
        throw new CofreStorageError(
          'CORRUPT_OR_NOT_SQLITE',
          'O arquivo parece corrompido e não pôde ser aberto como cofre.',
        )
      }

      // Schema futuro / migração: recusa sem sobrescrever trabalho válido
      prepareOpenedDatabase(db)

      const exists = await workingStore.exists()
      if (exists && !importOptions.replaceConfirmed) {
        db.close()
        throw new CofreStorageError(
          'REPLACE_NOT_CONFIRMED',
          'Já existe um cofre neste dispositivo. Confirme a substituição antes de importar.',
        )
      }

      const session = await wrapSession(db)
      await session.persist()
      return session
    },

    exportCofreBytes(session: CofreSession): Uint8Array {
      return session.exportBytes()
    },

    async downloadCofre(
      session: CofreSession,
      filename: string = DEFAULT_EXPORT_FILENAME,
    ): Promise<void> {
      await exportCofreWithShareOrDownload(session.exportBytes(), filename)
    },

    async saveCofreWithFilePicker(
      session: CofreSession,
      suggestedName: string = DEFAULT_EXPORT_FILENAME,
    ): Promise<void> {
      await saveWithPicker(session.exportBytes(), suggestedName)
    },
  }
}
