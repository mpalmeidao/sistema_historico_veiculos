import type { CofreSession, CofreSqlApi, SqlValue } from '../../storage'
import {
  VeiculoDomainError,
  type DeleteVeiculoOptions,
  type Veiculo,
  type VeiculoInput,
  type VeiculoRawInput,
} from './types'
import { validateVeiculo } from './validateVeiculo'

function requireNumber(value: SqlValue, label: string): number {
  if (typeof value !== 'number') {
    throw new Error(`Valor inesperado para ${label}: ${String(value)}`)
  }
  return value
}

function requireString(value: SqlValue, label: string): string {
  if (typeof value !== 'string') {
    throw new Error(`Valor inesperado para ${label}: ${String(value)}`)
  }
  return value
}

function optionalString(value: SqlValue): string | null {
  if (value === null) return null
  return requireString(value, 'texto opcional')
}

function optionalNumber(value: SqlValue): number | null {
  if (value === null) return null
  return requireNumber(value, 'número opcional')
}

function mapRow(row: SqlValue[]): Veiculo {
  return {
    id: requireNumber(row[0], 'id'),
    placa: requireString(row[1], 'placa'),
    marcaModelo: requireString(row[2], 'marca_modelo'),
    anoModelo: optionalNumber(row[3]),
    kmAtual: requireNumber(row[4], 'km_atual'),
    proximaTroca: optionalString(row[5]),
    createdAt: requireString(row[6], 'created_at'),
    updatedAt: requireString(row[7], 'updated_at'),
  }
}

const SELECT_VEICULO = `
  SELECT id, placa, marca_modelo, ano_modelo, km_atual, proxima_troca, created_at, updated_at
  FROM veiculos
`

function readVeiculoById(db: CofreSqlApi, id: number): Veiculo | null {
  const rows = db.getRows(`${SELECT_VEICULO} WHERE id = ?`, [id])
  if (rows.length === 0) return null
  return mapRow(rows[0])
}

function assertValidInput(raw: VeiculoRawInput): VeiculoInput {
  const result = validateVeiculo(raw)
  if (result.ok === false) {
    throw new VeiculoDomainError('VALIDATION', 'Dados do veículo inválidos.', {
      fieldErrors: result.errors,
    })
  }
  return result.value
}

export function listVeiculos(session: CofreSession): Veiculo[] {
  const rows = session.query.getRows(`${SELECT_VEICULO} ORDER BY id ASC`)
  return rows.map(mapRow)
}

export function getVeiculo(session: CofreSession, id: number): Veiculo | null {
  return readVeiculoById(session.query, id)
}

export function countManutencoesByVeiculo(session: CofreSession, veiculoId: number): number {
  const rows = session.query.getRows('SELECT COUNT(*) FROM manutencoes WHERE veiculo_id = ?', [
    veiculoId,
  ])
  return requireNumber(rows[0]?.[0] ?? 0, 'count')
}

export async function createVeiculo(
  session: CofreSession,
  raw: VeiculoRawInput,
  now: () => string = () => new Date().toISOString(),
): Promise<Veiculo> {
  const input = assertValidInput(raw)
  const timestamp = now()
  let createdId = 0

  await session.mutate((db) => {
    db.run(
      `INSERT INTO veiculos (placa, marca_modelo, ano_modelo, km_atual, proxima_troca, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        input.placa,
        input.marcaModelo,
        input.anoModelo,
        input.kmAtual,
        input.proximaTroca,
        timestamp,
        timestamp,
      ],
    )
    const idRows = db.getRows('SELECT last_insert_rowid()')
    createdId = requireNumber(idRows[0]?.[0] ?? 0, 'last_insert_rowid')
  })

  const created = readVeiculoById(session.query, createdId)
  if (!created) {
    throw new Error('Falha ao ler veículo recém-criado.')
  }
  return created
}

export async function updateVeiculo(
  session: CofreSession,
  id: number,
  raw: VeiculoRawInput,
  now: () => string = () => new Date().toISOString(),
): Promise<Veiculo> {
  const input = assertValidInput(raw)
  const existing = getVeiculo(session, id)
  if (!existing) {
    throw new VeiculoDomainError('NOT_FOUND', `Veículo ${id} não encontrado.`)
  }

  const timestamp = now()
  await session.mutate((db) => {
    db.run(
      `UPDATE veiculos
       SET placa = ?, marca_modelo = ?, ano_modelo = ?, km_atual = ?, proxima_troca = ?, updated_at = ?
       WHERE id = ?`,
      [
        input.placa,
        input.marcaModelo,
        input.anoModelo,
        input.kmAtual,
        input.proximaTroca,
        timestamp,
        id,
      ],
    )
  })

  const updated = readVeiculoById(session.query, id)
  if (!updated) {
    throw new VeiculoDomainError('NOT_FOUND', `Veículo ${id} não encontrado após atualização.`)
  }
  return updated
}

/**
 * Exclui o veículo. Se houver manutenções, exige `cascadeConfirmed: true`
 * (FK ON DELETE CASCADE remove manutenções e anexos). Sem confirmação, recusa.
 */
export async function deleteVeiculo(
  session: CofreSession,
  id: number,
  options: DeleteVeiculoOptions = {},
): Promise<void> {
  const existing = getVeiculo(session, id)
  if (!existing) {
    throw new VeiculoDomainError('NOT_FOUND', `Veículo ${id} não encontrado.`)
  }

  const manutencoesCount = countManutencoesByVeiculo(session, id)
  if (manutencoesCount > 0 && !options.cascadeConfirmed) {
    throw new VeiculoDomainError(
      'CASCADE_NOT_CONFIRMED',
      'Este veículo possui histórico de manutenções. Confirme a exclusão em cascata para continuar.',
      { manutencoesCount },
    )
  }

  await session.mutate((db) => {
    // sql.js: foreign_keys precisa ser ligado por conexão para o CASCADE atuar
    db.run('PRAGMA foreign_keys = ON')
    db.run('DELETE FROM veiculos WHERE id = ?', [id])
  })
}
