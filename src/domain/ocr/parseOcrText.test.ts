import { describe, expect, it } from 'vitest'
import { parseOcrText } from './parseOcrText'

describe('parseOcrText', () => {
  it('deve mapear texto sintético de nota brasileira para campos do formulário', () => {
    const text = `
NOTA FISCAL DE SERVIÇO
Razão Social: Oficina do Zé Ltda
Data: 15/01/2026
Km: 40.000
Tipo de serviço: Troca de óleo
Peças: Filtro de óleo
Valor total: R$ 250,50
Próxima revisão: 15/07/2026
`
    expect(parseOcrText(text)).toEqual({
      data: '2026-01-15',
      km: '40000',
      tipoServico: 'Troca de óleo',
      pecasTrocadas: 'Filtro de óleo',
      oficina: 'Oficina do Zé Ltda',
      valor: '250.50',
      proximaRevisao: '2026-07-15',
    })
  })

  it('deve retornar objeto vazio quando não há match', () => {
    expect(parseOcrText('imagem ilegível ### ???')).toEqual({})
    expect(parseOcrText('')).toEqual({})
    expect(parseOcrText('   ')).toEqual({})
  })

  it('deve mapear subconjunto parcial sem inventar campos ausentes', () => {
    const text = 'Data emissão: 01/03/2025\nTOTAL: R$ 99,90'
    expect(parseOcrText(text)).toEqual({
      data: '2025-03-01',
      valor: '99.90',
    })
  })

  it('deve rejeitar data inválida e km negativo implícito inválido', () => {
    expect(parseOcrText('Data: 32/13/2026')).toEqual({})
    expect(parseOcrText('Km: abc')).toEqual({})
  })
})
