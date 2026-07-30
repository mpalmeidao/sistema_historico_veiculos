import { OPFS_WORKING_FILENAME } from './constants'
import { supportsOpfs } from '../shared/browser/supportsOpfs'
import { CofreStorageError, type WorkingStore } from './types'

export function createOpfsWorkingStore(filename: string = OPFS_WORKING_FILENAME): WorkingStore {
  return {
    async exists(): Promise<boolean> {
      ensureOpfs()
      try {
        const root = await navigator.storage.getDirectory()
        await root.getFileHandle(filename)
        return true
      } catch {
        return false
      }
    },

    async read(): Promise<Uint8Array | null> {
      ensureOpfs()
      try {
        const root = await navigator.storage.getDirectory()
        const handle = await root.getFileHandle(filename)
        const file = await handle.getFile()
        const buffer = await file.arrayBuffer()
        return new Uint8Array(buffer)
      } catch {
        return null
      }
    },

    async write(bytes: Uint8Array): Promise<void> {
      ensureOpfs()
      try {
        const root = await navigator.storage.getDirectory()
        const handle = await root.getFileHandle(filename, { create: true })
        const writable = await handle.createWritable()
        try {
          const copy = new Uint8Array(bytes)
          await writable.write(copy)
        } finally {
          await writable.close()
        }
      } catch {
        throw new CofreStorageError(
          'OPFS_WRITE_FAILED',
          'Não foi possível salvar o cofre no dispositivo. Tente novamente.',
        )
      }
    },
  }
}

function ensureOpfs(): void {
  if (!supportsOpfs()) {
    throw new CofreStorageError(
      'OPFS_UNAVAILABLE',
      'Este navegador não oferece armazenamento local seguro (OPFS). Atualize o navegador (Safari 16.4+ ou Chrome/Edge/Firefox recentes).',
    )
  }
}

/** Fake in-memory para testes de integração (sem OPFS real). */
export function createMemoryWorkingStore(): WorkingStore {
  let data: Uint8Array | null = null

  return {
    async exists(): Promise<boolean> {
      return data !== null
    },
    async read(): Promise<Uint8Array | null> {
      return data ? new Uint8Array(data) : null
    },
    async write(bytes: Uint8Array): Promise<void> {
      data = new Uint8Array(bytes)
    },
  }
}
