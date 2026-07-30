/**
 * Contrato público da camada de storage do cofre.
 * UI, hooks e domínio dependem só destes tipos — nunca de sql.js (ADR-002).
 */

export type SqlValue = string | number | null | Uint8Array | boolean

export interface QueryResult {
  columns: string[]
  values: SqlValue[][]
}

/** Metadados de versionamento de conteúdo (independente de user_version/schema). */
export interface ContentVersionMeta {
  /** Contador incremental; sobe 1 a cada gravação relevante (incluindo criação). */
  contentVersion: number
  /** ISO 8601 da última modificação. */
  modifiedAt: string
}

export type CofreStorageErrorCode =
  | 'INVALID_APPLICATION_ID'
  | 'CORRUPT_OR_NOT_SQLITE'
  | 'OPFS_UNAVAILABLE'
  | 'OPFS_WRITE_FAILED'
  | 'REPLACE_NOT_CONFIRMED'
  | 'NO_WORKING_COFRE'
  | 'COFRE_CLOSED'
  /** Schema (user_version) mais novo que o app — recusa sem regravar. */
  | 'SCHEMA_TOO_NEW'
  /** Falha ao aplicar migração progressiva — abertura abortada sem estado parcial “ok”. */
  | 'MIGRATION_FAILED'
  | 'SCHEMA_TOO_NEW'
  | 'MIGRATION_FAILED'
  /** Schema (user_version) mais novo que o app — recusa sem regravar. */
  | 'SCHEMA_TOO_NEW'
  /** Falha ao aplicar migração progressiva — abertura não conclui como ok. */
  | 'MIGRATION_FAILED'

export class CofreStorageError extends Error {
  readonly code: CofreStorageErrorCode

  constructor(code: CofreStorageErrorCode, message: string) {
    super(message)
    this.name = 'CofreStorageError'
    this.code = code
  }
}

/** API SQL sem expor o Database do sql.js. */
export interface CofreSqlApi {
  run(sql: string, params?: SqlValue[]): void
  exec(sql: string): QueryResult[]
  getRows(sql: string, params?: SqlValue[]): SqlValue[][]
}

export interface CofreSession {
  getContentMeta(): ContentVersionMeta
  /**
   * Acesso somente leitura. Mutações fora de `mutate` não persistem nem
   * incrementam a versão de conteúdo.
   */
  readonly query: CofreSqlApi
  /**
   * Executa alterações relevantes: incrementa contador, atualiza data,
   * serializa e grava no armazenamento de trabalho. Falha de gravação propaga.
   */
  mutate(work: (db: CofreSqlApi) => void): Promise<ContentVersionMeta>
  /** Bytes do SQLite atual (formato `.cofre`). */
  exportBytes(): Uint8Array
  close(): void
}

export interface ImportCofreOptions {
  /**
   * Obrigatório `true` quando já existe cofre de trabalho.
   * Sem confirmação, a importação é recusada e o trabalho atual permanece.
   */
  replaceConfirmed: boolean
}

/** Persistência do cofre de trabalho (OPFS em produção; fake in-memory nos testes). */
export interface WorkingStore {
  exists(): Promise<boolean>
  read(): Promise<Uint8Array | null>
  write(bytes: Uint8Array): Promise<void>
}

export interface CofreStorage {
  isOpfsAvailable(): boolean
  supportsFileSystemAccess(): boolean
  hasWorkingCofre(): Promise<boolean>
  createCofre(): Promise<CofreSession>
  openWorkingCofre(): Promise<CofreSession | null>
  importCofre(bytes: Uint8Array, options: ImportCofreOptions): Promise<CofreSession>
  exportCofreBytes(session: CofreSession): Uint8Array
  /** Dispara download (e Web Share quando disponível). */
  downloadCofre(session: CofreSession, filename?: string): Promise<void>
  /**
   * Enhancement opcional (desktop Chrome/Edge): salvar via File System Access API.
   * Sem a API, rejeita de forma controlada — o fluxo permanece OPFS + export/import.
   */
  saveCofreWithFilePicker(session: CofreSession, suggestedName?: string): Promise<void>
}
