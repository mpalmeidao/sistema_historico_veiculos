import { describe, expect, it } from 'vitest'
import { formatBrl, formatTotalGastoDisplay, sumTotalGasto } from './totalGasto'

describe('sumTotalGasto', () => {
  it('deve retornar null quando todos os valores são null', () => {
    expect(sumTotalGasto([])).toBeNull()
    expect(sumTotalGasto([null, null])).toBeNull()
  })

  it('deve somar misturando null e números', () => {
    expect(sumTotalGasto([null, 100, null, 50.5])).toBe(150.5)
  })

  it('deve somar quando o total é 0 (valores presentes)', () => {
    expect(sumTotalGasto([0, null, 0])).toBe(0)
  })

  it('deve somar valores > 0', () => {
    expect(sumTotalGasto([320, 180, 1240])).toBe(1740)
  })
})

describe('formatTotalGastoDisplay', () => {
  it('deve usar emptyLabel quando não há valores', () => {
    expect(formatTotalGastoDisplay([null, null], '—')).toBe('—')
  })

  it('deve formatar soma em BRL', () => {
    expect(formatTotalGastoDisplay([250.5], '—')).toBe(formatBrl(250.5))
    expect(formatTotalGastoDisplay([0], '—')).toBe(formatBrl(0))
  })
})
