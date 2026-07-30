import type { CofreSession, CofreSqlApi, SqlValue } from '../../storage'
import { getVeiculo } from '../veiculos'
import {
  ManutencaoDomainError,
  type Manutencao,
  type ManutencaoInput,
  type ManutencaoRawInput,
  type PecaTrocada,
} from './types'
import { validateManutencao } from './validateManutencao'

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

function mapPecaRow(row: SqlValue[]): PecaTrocada {
  return {
    id: requireNumber(row[0], 'peca.id'),
    descricao: requireString(row[1], 'descricao'),
    valor: requireNumber(row[2], 'valor'),
    posicao: requireNumber(row[3], 'posicao'),
  }
}

function loadPecas(db: CofreSqlApi, manutencaoId: number): PecaTrocada[] {
  const rows = db.getRows(
    `SELECT id, descricao, valor, posicao
     FROM manutencao_pecas
     WHERE manutencao_id = ?
     ORDER BY posicao ASC, id ASC`,
    [manutencaoId],
  )
  return rows.map(mapPecaRow)
}

function mapManutencaoRow(row: SqlValue[], pecas: PecaTrocada[]): Manutencao {
  return {
    id: requireNumber(row[0], 'id'),
    veiculoId: requireNumber(row[1], 'veiculo_id'),
    data: requireString(row[2], 'data'),
    km: requireNumber(row[3], 'km'),
    tipoServico: requireString(row[4], 'tipo_servico'),
    pecasTrocadas: pecas,
    oficina: optionalString(row[5]),
    valor: optionalNumber(row[6]),
    proximaRevisao: optionalString(row[7]),
    createdAt: requireString(row[8], 'created_at'),
    updatedAt: requireString(row[9], 'updated_at'),
  }
}

const SELECT_MANUTENCAO = `
  SELECT id, veiculo_id, data, km, tipo_servico, oficina, valor,
         proxima_revisao, created_at, updated_at
  FROM manutencoes
`

function readManutencaoById(db: CofreSqlApi, id: number): Manutencao | null {
  const rows = db.getRows(`${SELECT_MANUTENCAO} WHERE id = ?`, [id])
  if (rows.length === 0) return null
  return mapManutencaoRow(rows[0], loadPecas(db, id))
}

function replacePecas(db: CofreSqlApi, manutencaoId: number, pecas: PecaTrocada[]): void {
  db.run('DELETE FROM manutencao_pecas WHERE manutencao_id = ?', [manutencaoId])
  for (let i = 0; i < pecas.length; i++) {
    const peca = pecas[i]
    db.run(
      `INSERT INTO manutencao_pecas (manutencao_id, descricao, valor, posicao)
       VALUES (?, ?, ?, ?)`,
      [manutencaoId, peca.descricao, peca.valor, peca.posicao ?? i],
    )
  }
}

function assertValidInput(raw: ManutencaoRawInput): ManutencaoInput {
  const result = validateManutencao(raw)
  if (result.ok === false) {
    throw new ManutencaoDomainError('VALIDATION', 'Dados da manutenção inválidos.', {
      fieldErrors: result.errors,
    })
  }
  return result.value
}

function assertVeiculoExists(session: CofreSession, veiculoId: number): void {
  if (!getVeiculo(session, veiculoId)) {
    throw new ManutencaoDomainError(
      'VEICULO_NOT_FOUND',
      `Veículo ${veiculoId} não encontrado. Não é possível criar manutenção órfã.`,
    )
  }
}

/**
 * Lista manutenções do veículo em ordem cronológica decrescente
 * (mais recente primeiro: data DESC, id DESC como desempate).
 */
export function listManutencoesByVeiculo(session: CofreSession, veiculoId: number): Manutencao[] {
  const rows = session.query.getRows(
    `${SELECT_MANUTENCAO} WHERE veiculo_id = ? ORDER BY data DESC, id DESC`,
    [veiculoId],
  )
  return rows.map((row) => {
    const id = requireNumber(row[0], 'id')
    return mapManutencaoRow(row, loadPecas(session.query, id))
  })
}

export function getManutencao(session: CofreSession, id: number): Manutencao | null {
  return readManutencaoById(session.query, id)
}

export async function createManutencao(
  session: CofreSession,
  raw: ManutencaoRawInput,
  now: () => string = () => new Date().toISOString(),
): Promise<Manutencao> {
  const input = assertValidInput(raw)
  assertVeiculoExists(session, input.veiculoId)

  const timestamp = now()
  let createdId = 0

  await session.mutate((db) => {
    db.run('PRAGMA foreign_keys = ON')
    db.run(
      `INSERT INTO manutencoes
        (veiculo_id, data, km, tipo_servico, oficina, valor, proxima_revisao, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        input.veiculoId,
        input.data,
        input.km,
        input.tipoServico,
        input.oficina,
        input.valor,
        input.proximaRevisao,
        timestamp,
        timestamp,
      ],
    )
    const idRows = db.getRows('SELECT last_insert_rowid()')
    createdId = requireNumber(idRows[0]?.[0] ?? 0, 'last_insert_rowid')
    replacePecas(db, createdId, input.pecasTrocadas)
  })

  const created = readManutencaoById(session.query, createdId)
  if (!created) {
    throw new Error('Falha ao ler manutenção recém-criada.')
  }
  return created
}

/**
 * Atualiza campos da manutenção. O `veiculoId` do vínculo não muda —
 * preserva anexos existentes (FK manutencao_id) e o vínculo com o veículo.
 */
export async function updateManutencao(
  session: CofreSession,
  id: number,
  raw: ManutencaoRawInput,
  now: () => string = () => new Date().toISOString(),
): Promise<Manutencao> {
  const existing = getManutencao(session, id)
  if (!existing) {
    throw new ManutencaoDomainError('NOT_FOUND', `Manutenção ${id} não encontrada.`)
  }

  const input = assertValidInput({ ...raw, veiculoId: existing.veiculoId })
  const timestamp = now()

  await session.mutate((db) => {
    db.run('PRAGMA foreign_keys = ON')
    db.run(
      `UPDATE manutencoes
       SET data = ?, km = ?, tipo_servico = ?, oficina = ?,
           valor = ?, proxima_revisao = ?, updated_at = ?
       WHERE id = ?`,
      [
        input.data,
        input.km,
        input.tipoServico,
        input.oficina,
        input.valor,
        input.proximaRevisao,
        timestamp,
        id,
      ],
    )
    replacePecas(db, id, input.pecasTrocadas)
  })

  const updated = readManutencaoById(session.query, id)
  if (!updated) {
    throw new ManutencaoDomainError(
      'NOT_FOUND',
      `Manutenção ${id} não encontrada após atualização.`,
    )
  }
  if (updated.veiculoId !== existing.veiculoId) {
    throw new Error('Edição corrompeu o vínculo veiculo_id.')
  }
  return updated
}

export async function deleteManutencao(session: CofreSession, id: number): Promise<void> {
  const existing = getManutencao(session, id)
  if (!existing) {
    throw new ManutencaoDomainError('NOT_FOUND', `Manutenção ${id} não encontrada.`)
  }

  await session.mutate((db) => {
    db.run('PRAGMA foreign_keys = ON')
    db.run('DELETE FROM manutencoes WHERE id = ?', [id])
  })
}
