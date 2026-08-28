import { useCallback, useEffect, useRef, useState } from 'react'
import type { CofreSession } from '../../storage'
import {
  AnexoDomainError,
  createAnexo,
  deleteAnexo,
  getAnexo,
  listAnexosByManutencao,
  prepareAnexoFromFile,
  type Anexo,
  type AnexoMeta,
  type PreparedAnexo,
} from '../../domain'
import { strings } from '../../shared/i18n'

export type AttachFileResult =
  | { status: 'saved'; prepared: PreparedAnexo }
  | { status: 'needs-pdf-confirm'; prepared: PreparedAnexo }
  | { status: 'error' }

export interface UseAnexosResult {
  anexos: AnexoMeta[]
  loading: boolean
  processing: boolean
  errorMessage: string | null
  message: string | null
  reload: () => void
  /**
   * Prepara o arquivo (worker para imagem). Se PDF grande, devolve needsConfirm
   * sem gravar — chame `confirmPreparedAnexo` após o usuário confirmar.
   * Com `manutencaoId === null`, guarda em memória até `flushPending`.
   */
  attachFile: (file: File) => Promise<AttachFileResult>
  confirmPreparedAnexo: (
    prepared: PreparedAnexo,
  ) => Promise<{ ok: true; prepared: PreparedAnexo } | { ok: false }>
  loadAnexoBytes: (id: number) => Promise<Anexo | null>
  removeAnexo: (id: number) => Promise<void>
  /** Persiste anexos pendentes da criação após `createManutencao`. */
  flushPending: (manutencaoId: number) => Promise<boolean>
  clearPending: () => void
  clearFeedback: () => void
}

type PendingEntry = {
  localId: number
  prepared: PreparedAnexo
}

function mapAnexoError(error: unknown): string {
  if (error instanceof AnexoDomainError) {
    if (error.code === 'UNSUPPORTED_TYPE') return strings.anexos.unsupportedType
    if (error.code === 'WORKER_FAILED') return strings.anexos.workerFailed
  }
  return strings.anexos.saveError
}

function pendingToMeta(entry: PendingEntry): AnexoMeta {
  return {
    id: entry.localId,
    manutencaoId: 0,
    mimeType: entry.prepared.mimeType,
    fileName: entry.prepared.fileName,
    sizeBytes: entry.prepared.bytes.byteLength,
    createdAt: '',
  }
}

export function useAnexos(
  session: CofreSession | null,
  manutencaoId: number | null,
  onMutated?: () => void,
): UseAnexosResult {
  const [persistedAnexos, setPersistedAnexos] = useState<AnexoMeta[]>([])
  const [pending, setPending] = useState<PendingEntry[]>([])
  const [loading, setLoading] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const nextLocalIdRef = useRef(-1)
  const pendingRef = useRef(pending)
  pendingRef.current = pending

  const anexos =
    manutencaoId === null
      ? pending.map(pendingToMeta)
      : [...persistedAnexos, ...pending.map(pendingToMeta)]

  const reload = useCallback(() => {
    if (!session || manutencaoId === null) {
      setPersistedAnexos([])
      return
    }
    setLoading(true)
    try {
      setPersistedAnexos(listAnexosByManutencao(session, manutencaoId))
      setErrorMessage(null)
    } catch {
      setErrorMessage(strings.anexos.loadError)
    } finally {
      setLoading(false)
    }
  }, [session, manutencaoId])

  useEffect(() => {
    reload()
  }, [reload])

  const addPending = useCallback((prepared: PreparedAnexo) => {
    const localId = nextLocalIdRef.current
    nextLocalIdRef.current -= 1
    setPending((current) => [...current, { localId, prepared }])
    setMessage(strings.anexos.savedOk)
  }, [])

  const persistPrepared = useCallback(
    async (prepared: PreparedAnexo): Promise<boolean> => {
      if (!session || manutencaoId === null) return false
      try {
        await createAnexo(session, {
          manutencaoId,
          mimeType: prepared.mimeType,
          fileName: prepared.fileName,
          bytes: prepared.bytes,
        })
        setMessage(strings.anexos.savedOk)
        reload()
        onMutated?.()
        return true
      } catch (error) {
        setErrorMessage(mapAnexoError(error))
        return false
      }
    },
    [session, manutencaoId, reload, onMutated],
  )

  const storePrepared = useCallback(
    async (prepared: PreparedAnexo): Promise<boolean> => {
      if (!session) return false
      if (manutencaoId === null) {
        addPending(prepared)
        return true
      }
      return persistPrepared(prepared)
    },
    [session, manutencaoId, addPending, persistPrepared],
  )

  const attachFile = useCallback(
    async (file: File): Promise<AttachFileResult> => {
      if (!session) return { status: 'error' }
      setErrorMessage(null)
      setProcessing(true)
      try {
        const prepared = await prepareAnexoFromFile(file)
        if (prepared.pdfNeedsSizeWarning) {
          return { status: 'needs-pdf-confirm', prepared }
        }
        const ok = await storePrepared(prepared)
        return ok ? { status: 'saved', prepared } : { status: 'error' }
      } catch (error) {
        setErrorMessage(mapAnexoError(error))
        return { status: 'error' }
      } finally {
        setProcessing(false)
      }
    },
    [session, storePrepared],
  )

  const confirmPreparedAnexo = useCallback(
    async (
      prepared: PreparedAnexo,
    ): Promise<{ ok: true; prepared: PreparedAnexo } | { ok: false }> => {
      setProcessing(true)
      try {
        const ok = await storePrepared(prepared)
        return ok ? { ok: true, prepared } : { ok: false }
      } finally {
        setProcessing(false)
      }
    },
    [storePrepared],
  )

  const loadAnexoBytes = useCallback(
    async (id: number): Promise<Anexo | null> => {
      if (id < 0) {
        const entry = pendingRef.current.find((item) => item.localId === id)
        if (!entry) return null
        return { ...pendingToMeta(entry), bytes: entry.prepared.bytes }
      }
      if (!session) return null
      try {
        return getAnexo(session, id)
      } catch {
        setErrorMessage(strings.anexos.loadError)
        return null
      }
    },
    [session],
  )

  const removeAnexo = useCallback(
    async (id: number): Promise<void> => {
      setErrorMessage(null)
      if (id < 0) {
        setPending((current) => current.filter((entry) => entry.localId !== id))
        setMessage(strings.anexos.deletedOk)
        return
      }
      if (!session) return
      try {
        await deleteAnexo(session, id)
        setMessage(strings.anexos.deletedOk)
        reload()
        onMutated?.()
      } catch {
        setErrorMessage(strings.anexos.deleteError)
      }
    },
    [session, reload, onMutated],
  )

  const flushPending = useCallback(
    async (targetManutencaoId: number): Promise<boolean> => {
      if (!session) return false
      const items = pendingRef.current
      if (items.length === 0) return true
      try {
        for (const entry of items) {
          await createAnexo(session, {
            manutencaoId: targetManutencaoId,
            mimeType: entry.prepared.mimeType,
            fileName: entry.prepared.fileName,
            bytes: entry.prepared.bytes,
          })
          setPending((current) => current.filter((item) => item.localId !== entry.localId))
        }
        if (manutencaoId === targetManutencaoId) {
          reload()
        }
        onMutated?.()
        return true
      } catch (error) {
        setErrorMessage(mapAnexoError(error))
        return false
      }
    },
    [session, manutencaoId, reload, onMutated],
  )

  const clearPending = useCallback(() => {
    setPending([])
  }, [])

  const clearFeedback = useCallback(() => {
    setMessage(null)
    setErrorMessage(null)
  }, [])

  return {
    anexos,
    loading,
    processing,
    errorMessage,
    message,
    reload,
    attachFile,
    confirmPreparedAnexo,
    loadAnexoBytes,
    removeAnexo,
    flushPending,
    clearPending,
    clearFeedback,
  }
}
