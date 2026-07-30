/**
 * Tipos e erros do módulo de manutenções.
 * Domínio consome só CofreSession — nunca sql.js (ADR-002).
 *
 * Campos mínimos obrigatórios (MVP): data, km, tipo de serviço.
 * Opcionais: peças trocadas (lista), oficina, próxima revisão.
 * Valor total = soma automática das peças (null se lista vazia).
 * Criação exige veículo existente (sem órfãos).
 */

/** Item de peça trocada (persistido ou de input). */
export interface PecaTrocada {
  id?: number
  descricao: string
  valor: number
  posicao?: number
}

export interface Manutencao {
  id: number
  veiculoId: number
  data: string
  km: number
  tipoServico: string
  pecasTrocadas: PecaTrocada[]
  oficina: string | null
  /** Soma das peças; null se não há peças. */
  valor: number | null
  proximaRevisao: string | null
  createdAt: string
  updatedAt: string
}

/** Dados graváveis (sem id/timestamps). `valor` é derivado das peças. */
export interface ManutencaoInput {
  veiculoId: number
  data: string
  km: number
  tipoServico: string
  pecasTrocadas: PecaTrocada[]
  oficina: string | null
  valor: number | null
  proximaRevisao: string | null
}

/** Valores crus do formulário / API (ainda não validados). */
export interface ManutencaoRawInput {
  veiculoId: unknown
  data: unknown
  km: unknown
  tipoServico: unknown
  pecasTrocadas: unknown
  oficina: unknown
  /** Ignorado na validação — valor é calculado a partir das peças. */
  valor?: unknown
  proximaRevisao: unknown
}

export type ManutencaoField =
  | 'veiculoId'
  | 'data'
  | 'km'
  | 'tipoServico'
  | 'pecasTrocadas'
  | 'oficina'
  | 'valor'
  | 'proximaRevisao'

export type ManutencaoFieldErrorCode = 'required' | 'invalid' | 'negative'

export interface ManutencaoFieldError {
  field: ManutencaoField
  code: ManutencaoFieldErrorCode
}

export type ValidateManutencaoResult =
  { ok: true; value: ManutencaoInput } | { ok: false; errors: ManutencaoFieldError[] }

export type ManutencaoDomainErrorCode = 'VALIDATION' | 'NOT_FOUND' | 'VEICULO_NOT_FOUND'

export class ManutencaoDomainError extends Error {
  readonly code: ManutencaoDomainErrorCode
  readonly fieldErrors?: ManutencaoFieldError[]

  constructor(
    code: ManutencaoDomainErrorCode,
    message: string,
    options?: { fieldErrors?: ManutencaoFieldError[] },
  ) {
    super(message)
    this.name = 'ManutencaoDomainError'
    this.code = code
    this.fieldErrors = options?.fieldErrors
  }
}
