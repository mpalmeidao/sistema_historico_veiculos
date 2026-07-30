import { describe, expect, it } from 'vitest'
import { validateVeiculo } from './validateVeiculo'

describe('validateVeiculo', () => {
  const valid = {
    placa: 'ABC1D23',
    marcaModelo: 'Fiat Uno',
    anoModelo: 2015,
    kmAtual: 45000,
    proximaTroca: '2026-12-01',
  }

  it('deve aceitar veículo com todos os campos válidos', () => {
    const result = validateVeiculo(valid)
    expect(result).toEqual({
      ok: true,
      value: {
        placa: 'ABC1D23',
        marcaModelo: 'Fiat Uno',
        anoModelo: 2015,
        kmAtual: 45000,
        proximaTroca: '2026-12-01',
      },
    })
  })

  it('deve aceitar ano e próxima troca ausentes', () => {
    const result = validateVeiculo({
      ...valid,
      anoModelo: '',
      proximaTroca: '',
    })
    expect(result).toEqual({
      ok: true,
      value: {
        placa: 'ABC1D23',
        marcaModelo: 'Fiat Uno',
        anoModelo: null,
        kmAtual: 45000,
        proximaTroca: null,
      },
    })
  })

  it('deve rejeitar placa vazia', () => {
    const result = validateVeiculo({ ...valid, placa: '   ' })
    expect(result.ok).toBe(false)
    if (result.ok === false) {
      expect(result.errors).toContainEqual({ field: 'placa', code: 'required' })
    }
  })

  it('deve rejeitar marca/modelo vazio', () => {
    const result = validateVeiculo({ ...valid, marcaModelo: '' })
    expect(result.ok).toBe(false)
    if (result.ok === false) {
      expect(result.errors).toContainEqual({ field: 'marcaModelo', code: 'required' })
    }
  })

  it('deve rejeitar km atual ausente', () => {
    const result = validateVeiculo({ ...valid, kmAtual: '' })
    expect(result.ok).toBe(false)
    if (result.ok === false) {
      expect(result.errors).toContainEqual({ field: 'kmAtual', code: 'required' })
    }
  })

  it('deve rejeitar km atual negativo', () => {
    const result = validateVeiculo({ ...valid, kmAtual: -1 })
    expect(result.ok).toBe(false)
    if (result.ok === false) {
      expect(result.errors).toContainEqual({ field: 'kmAtual', code: 'negative' })
    }
  })

  it('deve rejeitar km atual não numérico', () => {
    const result = validateVeiculo({ ...valid, kmAtual: 'abc' })
    expect(result.ok).toBe(false)
    if (result.ok === false) {
      expect(result.errors).toContainEqual({ field: 'kmAtual', code: 'invalid' })
    }
  })

  it('deve rejeitar km atual decimal', () => {
    const result = validateVeiculo({ ...valid, kmAtual: '10.5' })
    expect(result.ok).toBe(false)
    if (result.ok === false) {
      expect(result.errors).toContainEqual({ field: 'kmAtual', code: 'invalid' })
    }
  })

  it('deve rejeitar ano/modelo inválido', () => {
    const result = validateVeiculo({ ...valid, anoModelo: 'vinte' })
    expect(result.ok).toBe(false)
    if (result.ok === false) {
      expect(result.errors).toContainEqual({ field: 'anoModelo', code: 'invalid' })
    }
  })

  it('deve normalizar espaços na placa e marca/modelo', () => {
    const result = validateVeiculo({
      ...valid,
      placa: '  XYZ9A87  ',
      marcaModelo: '  VW Gol  ',
    })
    expect(result.ok).toBe(true)
    if (result.ok === true) {
      expect(result.value.placa).toBe('XYZ9A87')
      expect(result.value.marcaModelo).toBe('VW Gol')
    }
  })
})
