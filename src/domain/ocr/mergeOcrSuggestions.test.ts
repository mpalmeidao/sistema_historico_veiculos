import { describe, expect, it } from 'vitest'
import { emptyManutencaoFormFields, mergeOcrSuggestions } from './mergeOcrSuggestions'

describe('mergeOcrSuggestions', () => {
  it('deve preencher apenas campos vazios com sugestões OCR', () => {
    const current = emptyManutencaoFormFields()
    const next = mergeOcrSuggestions(current, {
      data: '2026-01-15',
      km: '40000',
      tipoServico: 'Troca de óleo',
    })
    expect(next).toEqual({
      ...emptyManutencaoFormFields(),
      data: '2026-01-15',
      km: '40000',
      tipoServico: 'Troca de óleo',
    })
  })

  it('deve preservar edição humana e não sobrescrever campos já preenchidos', () => {
    const current = {
      ...emptyManutencaoFormFields(),
      data: '2026-02-01',
      tipoServico: 'Alinhamento (editado)',
      oficina: 'Minha oficina',
    }
    const next = mergeOcrSuggestions(current, {
      data: '2026-01-15',
      km: '40000',
      tipoServico: 'Troca de óleo',
      oficina: 'Oficina OCR',
      valor: '100.00',
    })
    expect(next).toEqual({
      data: '2026-02-01',
      km: '40000',
      tipoServico: 'Alinhamento (editado)',
      pecas: [],
      oficina: 'Minha oficina',
      proximaRevisao: '',
    })
  })

  it('deve criar uma peça a partir de pecasTrocadas quando a lista estiver vazia', () => {
    const next = mergeOcrSuggestions(emptyManutencaoFormFields(), {
      pecasTrocadas: 'Filtro de óleo',
      valor: '45.90',
    })
    expect(next.pecas).toEqual([{ descricao: 'Filtro de óleo', valor: '45.90' }])
  })

  it('deve criar peça com valor 0 quando não houver valor OCR', () => {
    const next = mergeOcrSuggestions(emptyManutencaoFormFields(), {
      pecasTrocadas: 'Pastilha',
    })
    expect(next.pecas).toEqual([{ descricao: 'Pastilha', valor: '0' }])
  })

  it('não deve sobrescrever peças já preenchidas pelo usuário', () => {
    const current = {
      ...emptyManutencaoFormFields(),
      pecas: [{ descricao: 'Já preenchida', valor: '10' }],
    }
    const next = mergeOcrSuggestions(current, {
      pecasTrocadas: 'Filtro OCR',
      valor: '99',
    })
    expect(next.pecas).toEqual([{ descricao: 'Já preenchida', valor: '10' }])
  })

  it('deve ignorar sugestões vazias e não mutar o formulário atual', () => {
    const current = {
      ...emptyManutencaoFormFields(),
      km: '10',
    }
    const snapshot = { ...current, pecas: [...current.pecas] }
    const next = mergeOcrSuggestions(current, { km: '', tipoServico: '  ' })
    expect(next).toEqual(current)
    expect(current).toEqual(snapshot)
  })
})
