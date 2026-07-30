import { describe, expect, it } from 'vitest'
import { createCofreStorage, createMemoryWorkingStore } from '../../storage'
import { createVeiculo } from '../veiculos'
import {
  createManutencao,
  deleteManutencao,
  getManutencao,
  listManutencoesByVeiculo,
  updateManutencao,
} from './manutencoesService'
import { ManutencaoDomainError } from './types'

async function openSession() {
  const storage = createCofreStorage({
    workingStore: createMemoryWorkingStore(),
    now: () => '2026-07-29T12:00:00.000Z',
  })
  return storage.createCofre()
}

const veiculoSample = {
  placa: 'ABC1D23',
  marcaModelo: 'Fiat Uno',
  anoModelo: 2015,
  kmAtual: 45000,
  proximaTroca: null,
}

function manutencaoSample(veiculoId: number, overrides: Record<string, unknown> = {}) {
  return {
    veiculoId,
    data: '2026-01-15',
    km: 40000,
    tipoServico: 'Troca de óleo',
    pecasTrocadas: [{ descricao: 'Filtro', valor: 200 }],
    oficina: 'Oficina',
    proximaRevisao: '2026-07-15',
    ...overrides,
  }
}

describe('listManutencoesByVeiculo (ordenação)', () => {
  it('deve listar mais recente primeiro (data DESC, id DESC)', async () => {
    const session = await openSession()
    const veiculo = await createVeiculo(session, veiculoSample)

    await createManutencao(session, manutencaoSample(veiculo.id, { data: '2025-06-01', km: 30000 }))
    await createManutencao(session, manutencaoSample(veiculo.id, { data: '2026-03-01', km: 42000 }))
    await createManutencao(session, manutencaoSample(veiculo.id, { data: '2026-01-15', km: 40000 }))
    // mesma data: id maior (mais recente na criação) vem primeiro
    await createManutencao(
      session,
      manutencaoSample(veiculo.id, { data: '2026-03-01', km: 43000, tipoServico: 'Freios' }),
    )

    const lista = listManutencoesByVeiculo(session, veiculo.id)
    expect(lista.map((item) => ({ data: item.data, km: item.km, tipo: item.tipoServico }))).toEqual(
      [
        { data: '2026-03-01', km: 43000, tipo: 'Freios' },
        { data: '2026-03-01', km: 42000, tipo: 'Troca de óleo' },
        { data: '2026-01-15', km: 40000, tipo: 'Troca de óleo' },
        { data: '2025-06-01', km: 30000, tipo: 'Troca de óleo' },
      ],
    )
    session.close()
  })
})

describe('createManutencao / updateManutencao / deleteManutencao', () => {
  it('deve recusar criação órfã (veículo inexistente)', async () => {
    const session = await openSession()
    await expect(createManutencao(session, manutencaoSample(999))).rejects.toMatchObject({
      code: 'VEICULO_NOT_FOUND',
    } satisfies Partial<ManutencaoDomainError>)
    session.close()
  })

  it('deve recusar create com dados inválidos', async () => {
    const session = await openSession()
    const veiculo = await createVeiculo(session, veiculoSample)
    await expect(
      createManutencao(session, manutencaoSample(veiculo.id, { km: -1 })),
    ).rejects.toMatchObject({
      code: 'VALIDATION',
    } satisfies Partial<ManutencaoDomainError>)
    expect(listManutencoesByVeiculo(session, veiculo.id)).toHaveLength(0)
    session.close()
  })

  it('deve preservar veiculoId na edição', async () => {
    const session = await openSession()
    const veiculo = await createVeiculo(session, veiculoSample)
    const created = await createManutencao(session, manutencaoSample(veiculo.id))

    const updated = await updateManutencao(session, created.id, {
      ...manutencaoSample(veiculo.id),
      veiculoId: 999,
      tipoServico: 'Alinhamento',
    })

    expect(updated.veiculoId).toBe(veiculo.id)
    expect(updated.tipoServico).toBe('Alinhamento')
    expect(getManutencao(session, created.id)?.veiculoId).toBe(veiculo.id)
    session.close()
  })

  it('deve lançar NOT_FOUND ao excluir id inexistente', async () => {
    const session = await openSession()
    await expect(deleteManutencao(session, 999)).rejects.toMatchObject({
      code: 'NOT_FOUND',
    } satisfies Partial<ManutencaoDomainError>)
    session.close()
  })
})
