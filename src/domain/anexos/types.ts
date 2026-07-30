/**
 * Tipos e erros do módulo de anexos.
 * Domínio consome só CofreSession — nunca sql.js (ADR-002).
 */

export interface AnexoMeta {
  id: number
  manutencaoId: number
  mimeType: string
  fileName: string | null
  sizeBytes: number
  createdAt: string
}

/** Anexo completo com bytes (para visualização / export). */
export interface Anexo extends AnexoMeta {
  bytes: Uint8Array
}

export type AnexoAcceptedKind = 'image' | 'pdf'

export type DetectAnexoTipoResult =
  { ok: true; kind: AnexoAcceptedKind; mimeType: string } | { ok: false; code: 'UNSUPPORTED_TYPE' }

export type AnexoDomainErrorCode =
  'UNSUPPORTED_TYPE' | 'NOT_FOUND' | 'MANUTENCAO_NOT_FOUND' | 'WORKER_FAILED' | 'VALIDATION'

export class AnexoDomainError extends Error {
  readonly code: AnexoDomainErrorCode

  constructor(code: AnexoDomainErrorCode, message: string) {
    super(message)
    this.name = 'AnexoDomainError'
    this.code = code
  }
}

/** Payload pronto para persistir (após pipeline de imagem ou PDF intacto). */
export interface PreparedAnexo {
  mimeType: string
  fileName: string | null
  bytes: Uint8Array
  /** true quando PDF ≥ limiar de aviso (~2 MB) — UI deve confirmar antes de gravar. */
  pdfNeedsSizeWarning: boolean
}
