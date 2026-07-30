/**
 * Tipos do módulo OCR.
 * Parser é puro (texto → sugestões); OCR nunca é save.
 * PDF sem OCR automático no MVP — só imagens.
 */

/** Sugestões de campos do formulário de manutenção (apenas matches). */
export interface OcrFieldSuggestions {
  data?: string
  km?: string
  tipoServico?: string
  /** Texto livre de peças; no merge vira um item com valor 0. */
  pecasTrocadas?: string
  oficina?: string
  /** Aplicado ao valor da peça criada a partir de pecasTrocadas, se houver. */
  valor?: string
  proximaRevisao?: string
}

/** Linha editável de peça no formulário. */
export interface PecaFormItem {
  descricao: string
  valor: string
}

/** Estado textual do formulário (mesmos campos editáveis da UI). */
export interface ManutencaoFormFields {
  data: string
  km: string
  tipoServico: string
  pecas: PecaFormItem[]
  oficina: string
  proximaRevisao: string
}

/** Campos de texto simples preenchidos pelo merge OCR (sem peças/valor). */
export const OCR_FORM_FIELD_KEYS = [
  'data',
  'km',
  'tipoServico',
  'oficina',
  'proximaRevisao',
] as const satisfies ReadonlyArray<keyof ManutencaoFormFields>

export type OcrFormFieldKey = (typeof OCR_FORM_FIELD_KEYS)[number]

export type OcrErrorCode = 'CANCELLED' | 'WORKER_FAILED' | 'MODEL_DOWNLOAD_FAILED' | 'EMPTY_RESULT'

export class OcrError extends Error {
  readonly code: OcrErrorCode

  constructor(code: OcrErrorCode, message: string) {
    super(message)
    this.name = 'OcrError'
    this.code = code
  }
}
