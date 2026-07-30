import type { CofreSession, CofreSqlApi, SqlValue } from '../../storage'
import { getManutencao } from '../manutencoes'
import { AnexoDomainError, type Anexo, type AnexoMeta } from './types'

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

function requireBytes(value: SqlValue, label: string): Uint8Array {
  if (!(value instanceof Uint8Array)) {
    throw new Error(`Valor inesperado para ${label}: ${String(value)}`)
  }
  return value
}

function mapMetaRow(row: SqlValue[]): AnexoMeta {
  return {
    id: requireNumber(row[0], 'id'),
    manutencaoId: requireNumber(row[1], 'manutencao_id'),
    mimeType: requireString(row[2], 'mime_type'),
    fileName: optionalString(row[3]),
    sizeBytes: requireNumber(row[4], 'size_bytes'),
    createdAt: requireString(row[5], 'created_at'),
  }
}

function mapFullRow(row: SqlValue[]): Anexo {
  return {
    ...mapMetaRow(row),
    bytes: requireBytes(row[6], 'bytes'),
  }
}

const SELECT_META = `
  SELECT id, manutencao_id, mime_type, file_name, size_bytes, created_at
  FROM anexos
`

const SELECT_FULL = `
  SELECT id, manutencao_id, mime_type, file_name, size_bytes, created_at, bytes
  FROM anexos
`

function readAnexoById(db: CofreSqlApi, id: number): Anexo | null {
  const rows = db.getRows(`${SELECT_FULL} WHERE id = ?`, [id])
  if (rows.length === 0) return null
  return mapFullRow(rows[0])
}

function assertManutencaoExists(session: CofreSession, manutencaoId: number): void {
  if (!getManutencao(session, manutencaoId)) {
    throw new AnexoDomainError(
      'MANUTENCAO_NOT_FOUND',
      `Manutenção ${manutencaoId} não encontrada. Não é possível anexar.`,
    )
  }
}

export function listAnexosByManutencao(session: CofreSession, manutencaoId: number): AnexoMeta[] {
  const rows = session.query.getRows(`${SELECT_META} WHERE manutencao_id = ? ORDER BY id ASC`, [
    manutencaoId,
  ])
  return rows.map(mapMetaRow)
}

export function getAnexo(session: CofreSession, id: number): Anexo | null {
  return readAnexoById(session.query, id)
}

export interface CreateAnexoInput {
  manutencaoId: number
  mimeType: string
  fileName: string | null
  bytes: Uint8Array
}

/**
 * Persiste BLOB já preparado (imagem processada ou PDF intacto).
 * Não aplica pipeline — use `prepareAnexoFromFile` antes.
 */
export async function createAnexo(
  session: CofreSession,
  input: CreateAnexoInput,
  now: () => string = () => new Date().toISOString(),
): Promise<Anexo> {
  assertManutencaoExists(session, input.manutencaoId)

  if (!(input.bytes instanceof Uint8Array) || input.bytes.byteLength === 0) {
    throw new AnexoDomainError('VALIDATION', 'Bytes do anexo inválidos ou vazios.')
  }
  if (!input.mimeType.trim()) {
    throw new AnexoDomainError('VALIDATION', 'MIME type do anexo é obrigatório.')
  }

  const timestamp = now()
  let createdId = 0
  const sizeBytes = input.bytes.byteLength

  await session.mutate((db) => {
    db.run('PRAGMA foreign_keys = ON')
    db.run(
      `INSERT INTO anexos (manutencao_id, mime_type, file_name, bytes, size_bytes, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [input.manutencaoId, input.mimeType, input.fileName, input.bytes, sizeBytes, timestamp],
    )
    const idRows = db.getRows('SELECT last_insert_rowid()')
    createdId = requireNumber(idRows[0]?.[0] ?? 0, 'last_insert_rowid')
  })

  const created = readAnexoById(session.query, createdId)
  if (!created) {
    throw new Error('Falha ao ler anexo recém-criado.')
  }
  return created
}

export async function deleteAnexo(session: CofreSession, id: number): Promise<void> {
  const existing = getAnexo(session, id)
  if (!existing) {
    throw new AnexoDomainError('NOT_FOUND', `Anexo ${id} não encontrado.`)
  }

  await session.mutate((db) => {
    db.run('PRAGMA foreign_keys = ON')
    db.run('DELETE FROM anexos WHERE id = ?', [id])
  })
}
