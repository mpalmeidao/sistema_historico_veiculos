/**
 * Tipos e erros do módulo de veículos.
 * Domínio consome só CofreSession — nunca sql.js (ADR-002).
 */

export interface Veiculo {
  id: number
  placa: string
  marcaModelo: string
  anoModelo: number | null
  kmAtual: number
  proximaTroca: string | null
  createdAt: string
  updatedAt: string
}

/** Dados graváveis (sem id/timestamps). */
export interface VeiculoInput {
  placa: string
  marcaModelo: string
  anoModelo: number | null
  kmAtual: number
  proximaTroca: string | null
}

/** Valores crus do formulário / API (ainda não validados). */
export interface VeiculoRawInput {
  placa: unknown
  marcaModelo: unknown
  anoModelo: unknown
  kmAtual: unknown
  proximaTroca: unknown
}

export type VeiculoField = 'placa' | 'marcaModelo' | 'anoModelo' | 'kmAtual' | 'proximaTroca'

export type VeiculoFieldErrorCode = 'required' | 'invalid' | 'negative'

export interface VeiculoFieldError {
  field: VeiculoField
  code: VeiculoFieldErrorCode
}

export type ValidateVeiculoResult =
  { ok: true; value: VeiculoInput } | { ok: false; errors: VeiculoFieldError[] }

export type VeiculoDomainErrorCode = 'VALIDATION' | 'NOT_FOUND' | 'CASCADE_NOT_CONFIRMED'

export class VeiculoDomainError extends Error {
  readonly code: VeiculoDomainErrorCode
  readonly fieldErrors?: VeiculoFieldError[]
  /** Quantidade de manutenções vinculadas (quando apply à exclusão). */
  readonly manutencoesCount?: number

  constructor(
    code: VeiculoDomainErrorCode,
    message: string,
    options?: { fieldErrors?: VeiculoFieldError[]; manutencoesCount?: number },
  ) {
    super(message)
    this.name = 'VeiculoDomainError'
    this.code = code
    this.fieldErrors = options?.fieldErrors
    this.manutencoesCount = options?.manutencoesCount
  }
}

/**
 * Exclusão de veículo com manutenções: cascade no SQLite (ON DELETE CASCADE)
 * somente quando `cascadeConfirmed === true`. Sem o flag, o domínio recusa
 * com CASCADE_NOT_CONFIRMED — a UI deve avisar a perda do histórico.
 */
export interface DeleteVeiculoOptions {
  cascadeConfirmed?: boolean
}
