import { describe, expect, it } from 'vitest'
import { formatDisplayDate } from './displayDate'

describe('formatDisplayDate', () => {
  it('deve formatar data válida no padrão legível pt-BR', () => {
    expect(formatDisplayDate('2025-06-12')).toBe('12 jun 2025')
    expect(formatDisplayDate('2026-01-15')).toBe('15 jan 2026')
  })

  it('deve formatar bordas de mês e dia (1º e último dia)', () => {
    expect(formatDisplayDate('2024-02-01')).toBe('1 fev 2024')
    expect(formatDisplayDate('2024-12-31')).toBe('31 dez 2024')
  })

  it('deve preservar entrada inválida sem inventar data', () => {
    expect(formatDisplayDate('2024-02-30')).toBe('2024-02-30')
    expect(formatDisplayDate('15/01/2026')).toBe('15/01/2026')
    expect(formatDisplayDate('')).toBe('')
  })
})
