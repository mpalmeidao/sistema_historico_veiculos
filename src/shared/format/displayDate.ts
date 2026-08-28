const MONTHS_PT_BR_SHORT = [
  'jan',
  'fev',
  'mar',
  'abr',
  'mai',
  'jun',
  'jul',
  'ago',
  'set',
  'out',
  'nov',
  'dez',
] as const

/**
 * Formata data persistida `YYYY-MM-DD` para label de leitura pt-BR (ex. `12 jun 2025`).
 * Não altera o valor persistido; datas inválidas retornam a entrada original.
 */
export function formatDisplayDate(isoDate: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDate.trim())
  if (!match) return isoDate

  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) {
    return isoDate
  }

  // Constrói em horário local para evitar deslocamento UTC em `YYYY-MM-DD`.
  const date = new Date(year, month - 1, day)
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
    return isoDate
  }

  return `${day} ${MONTHS_PT_BR_SHORT[month - 1]} ${year}`
}
