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

describe('manutencoes CRUD (integração domínio + storage)', () => {
  it('deve criar, listar, editar, releitura após reabrir e excluir; incrementa versão', async () => {
    const store = createMemoryWorkingStore()
    let tick = 0
    const storage = createCofreStorage({
      workingStore: store,
      now: () => `2026-07-29T12:00:0${tick++}.000Z`,
    })

    const session = await storage.createCofre()
    expect(session.getContentMeta().contentVersion).toBe(1)

    const veiculo = await createVeiculo(session, {
      placa: 'ABC1D23',
      marcaModelo: 'Fiat Uno',
      anoModelo: 2015,
      kmAtual: 45000,
      proximaTroca: null,
    })
    expect(session.getContentMeta().contentVersion).toBe(2)

    const created = await createManutencao(session, {
      veiculoId: veiculo.id,
      data: '2026-01-15',
      km: 40000,
      tipoServico: 'Troca de óleo',
      pecasTrocadas: [{ descricao: 'Filtro', valor: 250 }],
      oficina: 'Oficina',
      proximaRevisao: '2026-07-15',
    })
    expect(created.id).toBeGreaterThan(0)
    expect(created.valor).toBe(250)
    expect(created.pecasTrocadas).toEqual([
      expect.objectContaining({ descricao: 'Filtro', valor: 250, posicao: 0 }),
    ])
    expect(session.getContentMeta().contentVersion).toBe(3)

    expect(listManutencoesByVeiculo(session, veiculo.id)).toHaveLength(1)

    await updateManutencao(session, created.id, {
      veiculoId: veiculo.id,
      data: '2026-01-16',
      km: 40100,
      tipoServico: 'Troca de óleo e filtro',
      pecasTrocadas: [
        { descricao: 'Filtro de óleo', valor: 80 },
        { descricao: 'Óleo 5W30', valor: 200.5 },
      ],
      oficina: 'Oficina Central',
      proximaRevisao: '2026-08-01',
    })
    expect(session.getContentMeta().contentVersion).toBe(4)

    // anexos existentes não devem ser quebrados pela edição
    await session.mutate((db) => {
      db.run('PRAGMA foreign_keys = ON')
      db.run(
        `INSERT INTO anexos (manutencao_id, mime_type, bytes, size_bytes, created_at)
         VALUES (?, ?, ?, ?, ?)`,
        [created.id, 'image/jpeg', new Uint8Array([1, 2, 3]), 3, '2026-01-16T10:00:00.000Z'],
      )
    })
    expect(session.getContentMeta().contentVersion).toBe(5)

    const bytes = storage.exportCofreBytes(session)
    session.close()

    const reopened = await storage.importCofre(bytes, { replaceConfirmed: true })
    const loaded = getManutencao(reopened, created.id)
    expect(loaded).toMatchObject({
      veiculoId: veiculo.id,
      data: '2026-01-16',
      km: 40100,
      tipoServico: 'Troca de óleo e filtro',
      oficina: 'Oficina Central',
      valor: 280.5,
      proximaRevisao: '2026-08-01',
    })
    expect(loaded?.pecasTrocadas).toEqual([
      expect.objectContaining({ descricao: 'Filtro de óleo', valor: 80, posicao: 0 }),
      expect.objectContaining({ descricao: 'Óleo 5W30', valor: 200.5, posicao: 1 }),
    ])
    expect(
      reopened.query.getRows('SELECT COUNT(*) FROM anexos WHERE manutencao_id = ?', [
        created.id,
      ])[0]?.[0],
    ).toBe(1)

    await deleteManutencao(reopened, created.id)
    expect(listManutencoesByVeiculo(reopened, veiculo.id)).toHaveLength(0)
    expect(
      reopened.query.getRows('SELECT COUNT(*) FROM anexos WHERE manutencao_id = ?', [
        created.id,
      ])[0]?.[0],
    ).toBe(0)
    expect(
      reopened.query.getRows('SELECT COUNT(*) FROM manutencao_pecas WHERE manutencao_id = ?', [
        created.id,
      ])[0]?.[0],
    ).toBe(0)
    expect(reopened.getContentMeta().contentVersion).toBe(6)
    reopened.close()
  })

  it('deve permitir salvar manutenção só com campos mínimos (sem anexo/peças)', async () => {
    const storage = createCofreStorage({
      workingStore: createMemoryWorkingStore(),
      now: () => '2026-07-29T12:00:00.000Z',
    })
    const session = await storage.createCofre()
    const veiculo = await createVeiculo(session, {
      placa: 'XYZ9A87',
      marcaModelo: 'VW Gol',
      anoModelo: null,
      kmAtual: 10000,
      proximaTroca: null,
    })

    const created = await createManutencao(session, {
      veiculoId: veiculo.id,
      data: '2026-02-01',
      km: 9500,
      tipoServico: 'Revisão',
      pecasTrocadas: [],
      oficina: '',
      proximaRevisao: '',
    })

    expect(created).toMatchObject({
      veiculoId: veiculo.id,
      data: '2026-02-01',
      km: 9500,
      tipoServico: 'Revisão',
      pecasTrocadas: [],
      oficina: null,
      valor: null,
      proximaRevisao: null,
    })
    session.close()
  })
})
