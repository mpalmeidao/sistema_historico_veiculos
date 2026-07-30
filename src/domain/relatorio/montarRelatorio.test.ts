import { describe, expect, it } from 'vitest'
import { TERMO_ISENCAO_TEXTO, TERMO_ISENCAO_TITULO } from '../../shared/legal'
import type { Manutencao } from '../manutencoes'
import type { Veiculo } from '../veiculos'
import { montarRelatorioDados } from './montarRelatorio'
import { RELATORIO_VAZIO, RelatorioDomainError } from './types'

const veiculoBase: Veiculo = {
  id: 1,
  placa: 'ABC1D23',
  marcaModelo: 'Fiat Uno',
  anoModelo: 2015,
  kmAtual: 45000,
  proximaTroca: null,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
}

function manutencao(
  partial: Partial<Manutencao> & Pick<Manutencao, 'id' | 'data' | 'km'>,
): Manutencao {
  return {
    veiculoId: 1,
    tipoServico: 'Serviço',
    pecasTrocadas: [],
    oficina: null,
    valor: null,
    proximaRevisao: null,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...partial,
  }
}

const cofre = { contentVersion: 3, modifiedAt: '2026-07-29T12:00:00.000Z' }

describe('montarRelatorioDados', () => {
  it('deve calcular resumo com total, período e km da primeira/última', () => {
    const dados = montarRelatorioDados({
      veiculo: veiculoBase,
      manutencoes: [
        manutencao({ id: 2, data: '2026-03-01', km: 42000, tipoServico: 'Freios' }),
        manutencao({ id: 1, data: '2025-06-01', km: 30000, tipoServico: 'Óleo' }),
      ],
      cofre,
      anexosByManutencao: new Map(),
      geradoEm: '2026-07-29T15:00:00.000Z',
    })

    expect(dados.resumo).toEqual({
      totalManutencoes: 2,
      periodoInicio: '2025-06-01',
      periodoFim: '2026-03-01',
      kmPrimeira: '30.000',
      kmUltima: '42.000',
    })
    expect(dados.veiculo.placa).toBe('ABC1D23')
    expect(dados.veiculo.kmAtual).toBe('45.000')
    expect(dados.veiculo.anoModelo).toBe('2015')
  })

  it('deve ordenar manutenções em ordem cronológica ascendente', () => {
    const dados = montarRelatorioDados({
      veiculo: veiculoBase,
      manutencoes: [
        manutencao({ id: 3, data: '2026-03-01', km: 43000 }),
        manutencao({ id: 1, data: '2025-06-01', km: 30000 }),
        manutencao({ id: 2, data: '2026-03-01', km: 42000 }),
      ],
      cofre,
      anexosByManutencao: new Map(),
    })

    expect(dados.manutencoes.map((item) => item.id)).toEqual([1, 2, 3])
  })

  it('deve exibir campos opcionais vazios como marcador consistente', () => {
    const dados = montarRelatorioDados({
      veiculo: { ...veiculoBase, anoModelo: null },
      manutencoes: [
        manutencao({
          id: 1,
          data: '2026-01-15',
          km: 40000,
          pecasTrocadas: [],
          oficina: null,
          valor: null,
          proximaRevisao: '',
        }),
      ],
      cofre,
      anexosByManutencao: new Map(),
    })

    expect(dados.veiculo.anoModelo).toBe(RELATORIO_VAZIO)
    expect(dados.manutencoes[0].pecasTrocadas).toBe(RELATORIO_VAZIO)
    expect(dados.manutencoes[0].oficina).toBe(RELATORIO_VAZIO)
    expect(dados.manutencoes[0].valor).toBe(RELATORIO_VAZIO)
    expect(dados.manutencoes[0].proximaRevisao).toBe(RELATORIO_VAZIO)
  })

  it('deve incluir o texto canônico de isenção do onboarding', () => {
    const dados = montarRelatorioDados({
      veiculo: veiculoBase,
      manutencoes: [manutencao({ id: 1, data: '2026-01-15', km: 40000 })],
      cofre,
      anexosByManutencao: new Map(),
    })

    expect(dados.isencaoTitulo).toBe(TERMO_ISENCAO_TITULO)
    expect(dados.isencaoTexto).toBe(TERMO_ISENCAO_TEXTO)
    expect(dados.isencaoTexto).toContain('não armazena seus dados em servidores')
  })

  it('deve bloquear veículo sem manutenções com NO_MANUTENCOES', () => {
    expect(() =>
      montarRelatorioDados({
        veiculo: veiculoBase,
        manutencoes: [],
        cofre,
        anexosByManutencao: new Map(),
      }),
    ).toThrow(RelatorioDomainError)

    try {
      montarRelatorioDados({
        veiculo: veiculoBase,
        manutencoes: [],
        cofre,
        anexosByManutencao: new Map(),
      })
    } catch (error) {
      expect(error).toMatchObject({
        code: 'NO_MANUTENCOES',
        message: expect.stringMatching(/não há histórico/i),
      })
    }
  })

  it('deve indicar PDF anexado sem exigir bytes de miniatura', () => {
    const dados = montarRelatorioDados({
      veiculo: veiculoBase,
      manutencoes: [manutencao({ id: 1, data: '2026-01-15', km: 40000 })],
      cofre,
      anexosByManutencao: new Map([
        [
          1,
          [
            {
              meta: {
                id: 10,
                manutencaoId: 1,
                mimeType: 'application/pdf',
                fileName: 'nota.pdf',
                sizeBytes: 100,
                createdAt: '2026-01-15T00:00:00.000Z',
              },
            },
          ],
        ],
      ]),
    })

    expect(dados.manutencoes[0].anexo).toEqual({ kind: 'pdf', fileName: 'nota.pdf' })
  })
})
