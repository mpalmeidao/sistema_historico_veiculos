import { RELATORIO_VAZIO } from './types'

/** Exibe opcional de texto; vazio → marcador consistente. */
export function displayOptionalText(value: string | null | undefined): string {
  if (value === null || value === undefined) return RELATORIO_VAZIO
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : RELATORIO_VAZIO
}

export function displayOptionalNumber(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return RELATORIO_VAZIO
  return String(value)
}

/** Formata lista de peças para o PDF (`descrição — R$ x`); vazia → marcador. */
export function displayPecasTrocadas(
  pecas: ReadonlyArray<{ descricao: string; valor: number }> | null | undefined,
): string {
  if (!pecas || pecas.length === 0) return RELATORIO_VAZIO
  return pecas.map((peca) => `${peca.descricao} — ${displayValor(peca.valor)}`).join('; ')
}

export function displayKm(value: number): string {
  return value.toLocaleString('pt-BR')
}

export function displayValor(value: number | null): string {
  if (value === null) return RELATORIO_VAZIO
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export function displayAnoModelo(value: number | null): string {
  if (value === null) return RELATORIO_VAZIO
  return String(value)
}

/** Formata ISO para exibição no rodapé (pt-BR). */
export function formatDateTimePtBr(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return iso
  return date.toLocaleString('pt-BR')
}
