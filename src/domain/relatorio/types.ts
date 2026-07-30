/**
 * Tipos do módulo de relatório PDF.
 * Domínio consome só CofreSession — nunca sql.js (ADR-002).
 */

import type { ContentVersionMeta } from '../../storage'

/** Marcador consistente para campos opcionais vazios no PDF. */
export const RELATORIO_VAZIO = '—'

export type RelatorioDomainErrorCode = 'NO_MANUTENCOES' | 'VEICULO_NOT_FOUND' | 'GENERATION_FAILED'

export class RelatorioDomainError extends Error {
  readonly code: RelatorioDomainErrorCode

  constructor(code: RelatorioDomainErrorCode, message: string) {
    super(message)
    this.name = 'RelatorioDomainError'
    this.code = code
  }
}

export interface RelatorioVeiculoResumo {
  placa: string
  marcaModelo: string
  /** Ano/modelo formatado ou RELATORIO_VAZIO. */
  anoModelo: string
  /** Km atual formatado. */
  kmAtual: string
}

export interface RelatorioResumoHistorico {
  totalManutencoes: number
  /** Data da manutenção mais antiga (YYYY-MM-DD). */
  periodoInicio: string
  /** Data da manutenção mais recente (YYYY-MM-DD). */
  periodoFim: string
  /** Km da primeira (mais antiga) manutenção. */
  kmPrimeira: string
  /** Km da última (mais recente) manutenção. */
  kmUltima: string
}

export type RelatorioAnexoIndicacao =
  | { kind: 'imagem'; mimeType: string; bytes: Uint8Array; fileName: string | null }
  | { kind: 'pdf'; fileName: string | null }
  | { kind: 'nenhum' }

export interface RelatorioManutencaoLinha {
  id: number
  data: string
  km: string
  tipoServico: string
  pecasTrocadas: string
  oficina: string
  valor: string
  proximaRevisao: string
  anexo: RelatorioAnexoIndicacao
}

export interface RelatorioDados {
  veiculo: RelatorioVeiculoResumo
  resumo: RelatorioResumoHistorico
  /** Cronológica ascendente (mais antiga primeiro). */
  manutencoes: RelatorioManutencaoLinha[]
  cofre: ContentVersionMeta
  /** ISO 8601 do momento da montagem / geração. */
  geradoEm: string
  /** Título + texto canônico do termo (onboarding). */
  isencaoTitulo: string
  isencaoTexto: string
}

export type RelatorioProgressPhase = 'montando' | 'gerando' | 'entregando'

export interface RelatorioProgress {
  phase: RelatorioProgressPhase
  /** 0–1 quando conhecido; null se indeterminado. */
  ratio: number | null
}
