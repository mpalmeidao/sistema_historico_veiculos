import { describe, expect, it } from 'vitest'
import { createCofreStorage, createMemoryWorkingStore } from '../../storage'
import {
  createVeiculo,
  deleteVeiculo,
  getVeiculo,
  listVeiculos,
  updateVeiculo,
} from './veiculosService'

describe('veiculos CRUD (integração domínio + storage)', () => {
  it('deve criar, listar, editar, releitura após reabrir e excluir', async () => {
    const store = createMemoryWorkingStore()
    let tick = 0
    const storage = createCofreStorage({
      workingStore: store,
      now: () => `2026-07-29T12:00:0${tick++}.000Z`,
    })

    const session = await storage.createCofre()
    expect(session.getContentMeta().contentVersion).toBe(1)

    const created = await createVeiculo(session, {
      placa: 'ABC1D23',
      marcaModelo: 'Fiat Uno',
      anoModelo: 2015,
      kmAtual: 45000,
      proximaTroca: '2026-12-01',
    })
    expect(created.id).toBeGreaterThan(0)
    expect(session.getContentMeta().contentVersion).toBe(2)

    expect(listVeiculos(session)).toHaveLength(1)
    expect(listVeiculos(session)[0].placa).toBe('ABC1D23')

    await updateVeiculo(session, created.id, {
      placa: 'ABC1D23',
      marcaModelo: 'Fiat Uno Attractive',
      anoModelo: 2016,
      kmAtual: 48000,
      proximaTroca: '2027-01-15',
    })
    expect(session.getContentMeta().contentVersion).toBe(3)

    const bytes = storage.exportCofreBytes(session)
    session.close()

    const reopened = await storage.importCofre(bytes, { replaceConfirmed: true })
    const loaded = getVeiculo(reopened, created.id)
    expect(loaded).toMatchObject({
      placa: 'ABC1D23',
      marcaModelo: 'Fiat Uno Attractive',
      anoModelo: 2016,
      kmAtual: 48000,
      proximaTroca: '2027-01-15',
    })

    await deleteVeiculo(reopened, created.id)
    expect(listVeiculos(reopened)).toHaveLength(0)
    expect(reopened.getContentMeta().contentVersion).toBe(4)
    reopened.close()
  })
})
