/** Soma valores monetários; `null` se nenhum valor não-nulo existir. */
export function sumTotalGasto(valores: ReadonlyArray<number | null>): number | null {
  let sum = 0
  let hasValue = false
  for (const valor of valores) {
    if (valor !== null) {
      hasValue = true
      sum += valor
    }
  }
  return hasValue ? sum : null
}

/** Formata número em BRL (`pt-BR`). */
export function formatBrl(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

/**
 * Label de “total gasto”: BRL se há valores; `emptyLabel` se todos são `null`.
 * Soma 0 (quando há valores presentes iguais a 0) exibe `R$ 0,00`.
 */
export function formatTotalGastoDisplay(
  valores: ReadonlyArray<number | null>,
  emptyLabel: string,
): string {
  const total = sumTotalGasto(valores)
  if (total === null) return emptyLabel
  return formatBrl(total)
}
