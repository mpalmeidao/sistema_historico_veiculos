import { SQLITE_MAGIC } from './constants'
import { CofreStorageError } from './types'

export function assertSqliteBytes(bytes: Uint8Array): void {
  if (bytes.byteLength < 16) {
    throw new CofreStorageError(
      'CORRUPT_OR_NOT_SQLITE',
      'O arquivo não é um cofre SQLite válido (muito pequeno ou corrompido).',
    )
  }

  const header = new TextDecoder('utf-8').decode(bytes.subarray(0, 16))
  if (header !== SQLITE_MAGIC) {
    throw new CofreStorageError(
      'CORRUPT_OR_NOT_SQLITE',
      'O arquivo não é um cofre SQLite válido (cabeçalho inválido).',
    )
  }
}
