/**
 * Parser determinístico OCR → campos de manutenção.
 * Conservador: só preenche o que conseguir identificar com confiança razoável.
 * Campos sem match ficam ausentes (UI deixa vazios).
 */

import type { OcrFieldSuggestions } from './types'

function firstCapture(text: string, pattern: RegExp): string | undefined {
  const match = pattern.exec(text)
  const value = match?.[1]?.trim()
  return value && value.length > 0 ? value : undefined
}

function parseBrazilianDate(raw: string): string | undefined {
  const match = /^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{4})$/.exec(raw.trim())
  if (!match) return undefined
  const day = Number(match[1])
  const month = Number(match[2])
  const year = Number(match[3])
  if (month < 1 || month > 12 || day < 1 || day > 31) return undefined
  const daysInMonth = new Date(year, month, 0).getDate()
  if (day > daysInMonth) return undefined
  return `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

function parseKm(raw: string): string | undefined {
  const digits = raw.replace(/\./g, '').replace(/\s/g, '')
  if (!/^\d+$/.test(digits)) return undefined
  const value = Number(digits)
  if (!Number.isFinite(value) || value < 0) return undefined
  return String(value)
}

function parseValor(raw: string): string | undefined {
  const normalized = raw.replace(/\./g, '').replace(',', '.').replace(/\s/g, '')
  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) return undefined
  const value = Number(normalized)
  if (!Number.isFinite(value) || value < 0) return undefined
  return normalized.includes('.') ? normalized : String(value)
}

function takeLineValue(raw: string): string {
  return raw.split(/\r?\n/)[0]?.trim() ?? raw.trim()
}

/**
 * Extrai sugestões de campos a partir do texto OCR.
 * Determinístico para o mesmo texto de entrada.
 */
export function parseOcrText(text: string): OcrFieldSuggestions {
  const suggestions: OcrFieldSuggestions = {}
  if (!text || text.trim().length === 0) return suggestions

  const normalized = text.replace(/\u00a0/g, ' ')

  const dateLabeled = firstCapture(
    normalized,
    /(?:^|\n)\s*(?:data(?:\s+da\s+(?:nota|emiss[aã]o))?|emiss[aã]o)\s*[:.]\s*(\d{1,2}[/\-.]\d{1,2}[/\-.]\d{4})/im,
  )
  const dateAny = firstCapture(normalized, /\b(\d{1,2}[/\-.]\d{1,2}[/\-.]\d{4})\b/)
  const data = parseBrazilianDate(dateLabeled ?? dateAny ?? '')
  if (data) suggestions.data = data

  const kmRaw = firstCapture(
    normalized,
    /(?:^|\n)\s*(?:km|quilometragem|od[oô]metro)\s*[:.]?\s*(\d{1,3}(?:\.\d{3})+|\d+)/im,
  )
  const km = kmRaw ? parseKm(kmRaw) : undefined
  if (km) suggestions.km = km

  const valorRaw = firstCapture(
    normalized,
    /(?:valor\s+total|total\s+geral|total|valor|r\$)\s*[:.]?\s*R?\$?\s*(\d{1,3}(?:\.\d{3})*,\d{2}|\d+,\d{2}|\d+(?:\.\d{2})?)/i,
  )
  const valor = valorRaw ? parseValor(valorRaw) : undefined
  if (valor) suggestions.valor = valor

  const oficinaRaw = firstCapture(
    normalized,
    /(?:^|\n)\s*(?:raz[aã]o\s+social|nome\s+fantasia|oficina|estabelecimento)\s*[:.]\s*(.+)/im,
  )
  if (oficinaRaw) {
    const oficina = takeLineValue(oficinaRaw)
    if (oficina.length >= 2) suggestions.oficina = oficina
  }

  const tipoRaw = firstCapture(
    normalized,
    /(?:^|\n)\s*(?:tipo\s+de\s+servi[cç]o|servi[cç]o(?:\s+prestado)?|descri[cç][aã]o(?:\s+do\s+servi[cç]o)?)\s*[:.]\s*(.+)/im,
  )
  if (tipoRaw) {
    const tipoServico = takeLineValue(tipoRaw)
    if (tipoServico.length >= 2) suggestions.tipoServico = tipoServico
  }

  const pecasRaw = firstCapture(
    normalized,
    /(?:^|\n)\s*(?:pe[cç]as?\s+trocadas?|pe[cç]as?|produtos?)\s*[:.]\s*(.+)/im,
  )
  if (pecasRaw) {
    const pecasTrocadas = takeLineValue(pecasRaw)
    if (pecasTrocadas.length >= 2) suggestions.pecasTrocadas = pecasTrocadas
  }

  const proxRaw = firstCapture(
    normalized,
    /(?:^|\n)\s*(?:pr[oó]xima\s+revis[aã]o|pr[oó]ximo\s+servi[cç]o)\s*[:.]\s*(.+)/im,
  )
  if (proxRaw) {
    const line = takeLineValue(proxRaw)
    const asDate = parseBrazilianDate(line)
    suggestions.proximaRevisao = asDate ?? line
  }

  return suggestions
}
