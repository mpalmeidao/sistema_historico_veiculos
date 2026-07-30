import { describe, expect, it } from 'vitest'
import { validateManutencao } from './validateManutencao'

describe('validateManutencao', () => {
  const valid = {
    veiculoId: 1,
    data: '2026-01-15',
    km: 40000,
    tipoServico: 'Troca de óleo',
    pecasTrocadas: [{ descricao: 'Filtro de óleo', valor: 250.5 }],
    oficina: 'Oficina do Zé',
    proximaRevisao: '2026-07-15',
  }

  it('deve aceitar manutenção com peças e calcular valor como soma', () => {
    const result = validateManutencao(valid)
    expect(result).toEqual({
      ok: true,
      value: {
        veiculoId: 1,
        data: '2026-01-15',
        km: 40000,
        tipoServico: 'Troca de óleo',
        pecasTrocadas: [{ descricao: 'Filtro de óleo', valor: 250.5, posicao: 0 }],
        oficina: 'Oficina do Zé',
        valor: 250.5,
        proximaRevisao: '2026-07-15',
      },
    })
  })

  it('deve somar múltiplas peças e ignorar raw.valor', () => {
    const result = validateManutencao({
      ...valid,
      pecasTrocadas: [
        { descricao: 'Filtro', valor: 50 },
        { descricao: 'Óleo', valor: '100,5' },
      ],
      valor: 9999,
    })
    expect(result.ok).toBe(true)
    if (result.ok === true) {
      expect(result.value.valor).toBe(150.5)
      expect(result.value.pecasTrocadas).toHaveLength(2)
    }
  })

  it('deve aceitar campos opcionais vazios (só data, km e tipo)', () => {
    const result = validateManutencao({
      veiculoId: 1,
      data: '2026-01-15',
      km: 0,
      tipoServico: 'Revisão',
      pecasTrocadas: [],
      oficina: '',
      proximaRevisao: '',
    })
    expect(result).toEqual({
      ok: true,
      value: {
        veiculoId: 1,
        data: '2026-01-15',
        km: 0,
        tipoServico: 'Revisão',
        pecasTrocadas: [],
        oficina: null,
        valor: null,
        proximaRevisao: null,
      },
    })
  })

  it('deve ignorar linhas de peça totalmente em branco', () => {
    const result = validateManutencao({
      ...valid,
      pecasTrocadas: [
        { descricao: '', valor: '' },
        { descricao: 'Pastilha', valor: 80 },
      ],
    })
    expect(result.ok).toBe(true)
    if (result.ok === true) {
      expect(result.value.pecasTrocadas).toEqual([{ descricao: 'Pastilha', valor: 80, posicao: 0 }])
      expect(result.value.valor).toBe(80)
    }
  })

  it('deve rejeitar peça com descrição vazia e valor preenchido', () => {
    const result = validateManutencao({
      ...valid,
      pecasTrocadas: [{ descricao: '', valor: 10 }],
    })
    expect(result.ok).toBe(false)
    if (result.ok === false) {
      expect(result.errors).toContainEqual({ field: 'pecasTrocadas', code: 'required' })
    }
  })

  it('deve rejeitar peça com valor negativo', () => {
    const result = validateManutencao({
      ...valid,
      pecasTrocadas: [{ descricao: 'Filtro', valor: -1 }],
    })
    expect(result.ok).toBe(false)
    if (result.ok === false) {
      expect(result.errors).toContainEqual({ field: 'pecasTrocadas', code: 'negative' })
    }
  })

  it('deve rejeitar pecasTrocadas que não é array', () => {
    const result = validateManutencao({
      ...valid,
      pecasTrocadas: 'Filtro',
    })
    expect(result.ok).toBe(false)
    if (result.ok === false) {
      expect(result.errors).toContainEqual({ field: 'pecasTrocadas', code: 'invalid' })
    }
  })

  it('deve rejeitar data ausente', () => {
    const result = validateManutencao({ ...valid, data: '' })
    expect(result.ok).toBe(false)
    if (result.ok === false) {
      expect(result.errors).toContainEqual({ field: 'data', code: 'required' })
    }
  })

  it('deve rejeitar data inválida (formato)', () => {
    const result = validateManutencao({ ...valid, data: '15/01/2026' })
    expect(result.ok).toBe(false)
    if (result.ok === false) {
      expect(result.errors).toContainEqual({ field: 'data', code: 'invalid' })
    }
  })

  it('deve rejeitar data inválida (dia civil inexistente)', () => {
    const result = validateManutencao({ ...valid, data: '2026-02-31' })
    expect(result.ok).toBe(false)
    if (result.ok === false) {
      expect(result.errors).toContainEqual({ field: 'data', code: 'invalid' })
    }
  })

  it('deve rejeitar km ausente', () => {
    const result = validateManutencao({ ...valid, km: '' })
    expect(result.ok).toBe(false)
    if (result.ok === false) {
      expect(result.errors).toContainEqual({ field: 'km', code: 'required' })
    }
  })

  it('deve rejeitar km negativo', () => {
    const result = validateManutencao({ ...valid, km: -1 })
    expect(result.ok).toBe(false)
    if (result.ok === false) {
      expect(result.errors).toContainEqual({ field: 'km', code: 'negative' })
    }
  })

  it('deve rejeitar km não numérico', () => {
    const result = validateManutencao({ ...valid, km: 'abc' })
    expect(result.ok).toBe(false)
    if (result.ok === false) {
      expect(result.errors).toContainEqual({ field: 'km', code: 'invalid' })
    }
  })

  it('deve rejeitar tipo de serviço vazio', () => {
    const result = validateManutencao({ ...valid, tipoServico: '   ' })
    expect(result.ok).toBe(false)
    if (result.ok === false) {
      expect(result.errors).toContainEqual({ field: 'tipoServico', code: 'required' })
    }
  })

  it('deve rejeitar veiculoId ausente ou inválido', () => {
    const missing = validateManutencao({ ...valid, veiculoId: '' })
    expect(missing.ok).toBe(false)
    if (missing.ok === false) {
      expect(missing.errors).toContainEqual({ field: 'veiculoId', code: 'required' })
    }

    const invalid = validateManutencao({ ...valid, veiculoId: 0 })
    expect(invalid.ok).toBe(false)
    if (invalid.ok === false) {
      expect(invalid.errors).toContainEqual({ field: 'veiculoId', code: 'invalid' })
    }
  })

  it('deve normalizar espaços no tipo de serviço', () => {
    const result = validateManutencao({
      ...valid,
      tipoServico: '  Alinhamento  ',
    })
    expect(result.ok).toBe(true)
    if (result.ok === true) {
      expect(result.value.tipoServico).toBe('Alinhamento')
    }
  })
})
