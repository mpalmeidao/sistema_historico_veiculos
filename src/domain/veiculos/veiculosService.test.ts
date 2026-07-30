import { describe, expect, it } from 'vitest'
import { createCofreStorage, createMemoryWorkingStore } from '../../storage'
import {
  createVeiculo,
  deleteVeiculo,
  getVeiculo,
  listVeiculos,
  updateVeiculo,
} from './veiculosService'
import { VeiculoDomainError } from './types'

async function openSession() {
  const storage = createCofreStorage({
    workingStore: createMemoryWorkingStore(),
    now: () => '2026-07-29T12:00:00.000Z',
  })
  return storage.createCofre()
}

const sample = {
  placa: 'ABC1D23',
  marcaModelo: 'Fiat Uno',
  anoModelo: 2015,
  kmAtual: 45000,
  proximaTroca: '2026-12-01',
}

describe('deleteVeiculo (regras de exclusão)', () => {
  it('deve excluir veículo sem manutenções sem exigir cascadeConfirmed', async () => {
    const session = await openSession()
    const created = await createVeiculo(session, sample)
    await deleteVeiculo(session, created.id)
    expect(getVeiculo(session, created.id)).toBeNull()
    expect(listVeiculos(session)).toHaveLength(0)
    session.close()
  })

  it('deve recusar exclusão com manutenções sem cascadeConfirmed', async () => {
    const session = await openSession()
    const created = await createVeiculo(session, sample)

    await session.mutate((db) => {
      db.run('PRAGMA foreign_keys = ON')
      db.run(
        `INSERT INTO manutencoes
          (veiculo_id, data, km, tipo_servico, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          created.id,
          '2026-01-10',
          40000,
          'Troca de óleo',
          '2026-01-10T10:00:00.000Z',
          '2026-01-10T10:00:00.000Z',
        ],
      )
    })

    await expect(deleteVeiculo(session, created.id)).rejects.toMatchObject({
      code: 'CASCADE_NOT_CONFIRMED',
      manutencoesCount: 1,
    } satisfies Partial<VeiculoDomainError>)

    expect(getVeiculo(session, created.id)).not.toBeNull()
    session.close()
  })

  it('deve excluir em cascata manutenções e anexos quando cascadeConfirmed', async () => {
    const session = await openSession()
    const created = await createVeiculo(session, sample)

    await session.mutate((db) => {
      db.run('PRAGMA foreign_keys = ON')
      db.run(
        `INSERT INTO manutencoes
          (veiculo_id, data, km, tipo_servico, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          created.id,
          '2026-01-10',
          40000,
          'Troca de óleo',
          '2026-01-10T10:00:00.000Z',
          '2026-01-10T10:00:00.000Z',
        ],
      )
      const manutencaoId = db.getRows('SELECT last_insert_rowid()')[0]?.[0] as number
      db.run(
        `INSERT INTO anexos (manutencao_id, mime_type, bytes, size_bytes, created_at)
         VALUES (?, ?, ?, ?, ?)`,
        [manutencaoId, 'image/jpeg', new Uint8Array([1, 2, 3]), 3, '2026-01-10T10:00:00.000Z'],
      )
    })

    await deleteVeiculo(session, created.id, { cascadeConfirmed: true })

    expect(getVeiculo(session, created.id)).toBeNull()
    expect(
      session.query.getRows('SELECT COUNT(*) FROM manutencoes WHERE veiculo_id = ?', [
        created.id,
      ])[0]?.[0],
    ).toBe(0)
    expect(session.query.getRows('SELECT COUNT(*) FROM anexos')[0]?.[0]).toBe(0)
    session.close()
  })

  it('deve lançar NOT_FOUND ao excluir id inexistente', async () => {
    const session = await openSession()
    await expect(deleteVeiculo(session, 999)).rejects.toMatchObject({
      code: 'NOT_FOUND',
    } satisfies Partial<VeiculoDomainError>)
    session.close()
  })
})

describe('createVeiculo / updateVeiculo (validação no serviço)', () => {
  it('deve recusar create com dados inválidos', async () => {
    const session = await openSession()
    await expect(createVeiculo(session, { ...sample, placa: '' })).rejects.toMatchObject({
      code: 'VALIDATION',
    } satisfies Partial<VeiculoDomainError>)
    expect(listVeiculos(session)).toHaveLength(0)
    session.close()
  })

  it('deve atualizar campos e persistir na sessão', async () => {
    const session = await openSession()
    const created = await createVeiculo(session, sample)
    const updated = await updateVeiculo(session, created.id, {
      ...sample,
      placa: 'XYZ9A87',
      kmAtual: 50000,
    })
    expect(updated.placa).toBe('XYZ9A87')
    expect(updated.kmAtual).toBe(50000)
    expect(getVeiculo(session, created.id)?.placa).toBe('XYZ9A87')
    session.close()
  })
})
