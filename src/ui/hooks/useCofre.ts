import { useCallback, useEffect, useRef, useState } from 'react'
import {
  CofreStorageError,
  createCofreStorage,
  type ContentVersionMeta,
  type CofreSession,
  type CofreStorage,
} from '../../storage'
import { strings } from '../../shared/i18n'

export type CofreUiStatus = 'loading' | 'ready' | 'opfs-unavailable' | 'error'

export interface UseCofreResult {
  status: CofreUiStatus
  storage: CofreStorage | null
  session: CofreSession | null
  meta: ContentVersionMeta | null
  message: string | null
  errorMessage: string | null
  createCofre: () => Promise<void>
  importFile: (file: File, replaceConfirmed: boolean) => Promise<'needs-confirm' | 'done'>
  exportCofre: () => Promise<boolean>
  refreshMeta: () => void
  clearMessage: () => void
}

function mapErrorMessage(error: unknown): string {
  if (error instanceof CofreStorageError) {
    switch (error.code) {
      case 'INVALID_APPLICATION_ID':
        return strings.cofre.invalidFile
      case 'CORRUPT_OR_NOT_SQLITE':
        return strings.cofre.corruptFile
      case 'OPFS_UNAVAILABLE':
        return strings.cofre.opfsUnavailableBody
      case 'OPFS_WRITE_FAILED':
        return strings.cofre.writeFailed
      case 'REPLACE_NOT_CONFIRMED':
        return strings.cofre.replaceMessage
      default:
        return error.message
    }
  }
  if (error instanceof Error) return error.message
  return strings.cofre.loadError
}

export function useCofre(): UseCofreResult {
  const storageRef = useRef<CofreStorage | null>(null)
  const [status, setStatus] = useState<CofreUiStatus>('loading')
  const [session, setSession] = useState<CofreSession | null>(null)
  const [meta, setMeta] = useState<ContentVersionMeta | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    const storage = createCofreStorage()
    storageRef.current = storage

    async function boot() {
      if (!storage.isOpfsAvailable()) {
        if (!cancelled) setStatus('opfs-unavailable')
        return
      }

      try {
        const existing = await storage.openWorkingCofre()
        if (cancelled) {
          existing?.close()
          return
        }
        if (existing) {
          setSession(existing)
          setMeta(existing.getContentMeta())
        }
        setStatus('ready')
      } catch (error) {
        if (!cancelled) {
          setErrorMessage(mapErrorMessage(error))
          setStatus('error')
        }
      }
    }

    void boot()

    return () => {
      cancelled = true
      setSession((current) => {
        current?.close()
        return null
      })
    }
  }, [])

  const createCofre = useCallback(async () => {
    const storage = storageRef.current
    if (!storage) return
    setErrorMessage(null)
    try {
      session?.close()
      const next = await storage.createCofre()
      setSession(next)
      setMeta(next.getContentMeta())
      setMessage(strings.cofre.createdOk)
      setStatus('ready')
    } catch (error) {
      setErrorMessage(mapErrorMessage(error))
    }
  }, [session])

  const importFile = useCallback(
    async (file: File, replaceConfirmed: boolean): Promise<'needs-confirm' | 'done'> => {
      const storage = storageRef.current
      if (!storage) return 'done'
      setErrorMessage(null)

      const buffer = new Uint8Array(await file.arrayBuffer())

      try {
        const hasWorking = await storage.hasWorkingCofre()
        if (hasWorking && !replaceConfirmed) {
          return 'needs-confirm'
        }

        session?.close()
        const next = await storage.importCofre(buffer, { replaceConfirmed: true })
        setSession(next)
        setMeta(next.getContentMeta())
        setMessage(strings.cofre.importedOk)
        setStatus('ready')
        return 'done'
      } catch (error) {
        if (error instanceof CofreStorageError && error.code === 'REPLACE_NOT_CONFIRMED') {
          return 'needs-confirm'
        }
        setErrorMessage(mapErrorMessage(error))
        return 'done'
      }
    },
    [session],
  )

  const exportCofre = useCallback(async (): Promise<boolean> => {
    const storage = storageRef.current
    if (!storage || !session) return false
    setErrorMessage(null)
    try {
      await storage.downloadCofre(session)
      setMessage(strings.cofre.exportedOk)
      return true
    } catch (error) {
      setErrorMessage(mapErrorMessage(error))
      return false
    }
  }, [session])

  const refreshMeta = useCallback(() => {
    if (!session) {
      setMeta(null)
      return
    }
    setMeta(session.getContentMeta())
  }, [session])

  const clearMessage = useCallback(() => {
    setMessage(null)
    setErrorMessage(null)
  }, [])

  return {
    status,
    storage: storageRef.current,
    session,
    meta,
    message,
    errorMessage,
    createCofre,
    importFile,
    exportCofre,
    refreshMeta,
    clearMessage,
  }
}
