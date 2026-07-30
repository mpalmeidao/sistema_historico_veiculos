import { useCallback, useEffect, useState } from 'react'
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
   */
  attachFile: (
    file: File,
  ) => Promise<
    | { status: 'saved' }
    | { status: 'needs-pdf-confirm'; prepared: PreparedAnexo }
    | { status: 'error' }
  >
  confirmPreparedAnexo: (prepared: PreparedAnexo) => Promise<boolean>
  loadAnexoBytes: (id: number) => Promise<Anexo | null>
  removeAnexo: (id: number) => Promise<void>
  clearFeedback: () => void
}

function mapAnexoError(error: unknown): string {
  if (error instanceof AnexoDomainError) {
    if (error.code === 'UNSUPPORTED_TYPE') return strings.anexos.unsupportedType
    if (error.code === 'WORKER_FAILED') return strings.anexos.workerFailed
  }
  return strings.anexos.saveError
}

export function useAnexos(
  session: CofreSession | null,
  manutencaoId: number | null,
  onMutated?: () => void,
): UseAnexosResult {
  const [anexos, setAnexos] = useState<AnexoMeta[]>([])
  const [loading, setLoading] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  const reload = useCallback(() => {
    if (!session || manutencaoId === null) {
      setAnexos([])
      return
    }
    setLoading(true)
    try {
      setAnexos(listAnexosByManutencao(session, manutencaoId))
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

  const attachFile = useCallback(
    async (
      file: File,
    ): Promise<
      | { status: 'saved' }
      | { status: 'needs-pdf-confirm'; prepared: PreparedAnexo }
      | { status: 'error' }
    > => {
      if (!session || manutencaoId === null) return { status: 'error' }
      setErrorMessage(null)
      setProcessing(true)
      try {
        const prepared = await prepareAnexoFromFile(file)
        if (prepared.pdfNeedsSizeWarning) {
          return { status: 'needs-pdf-confirm', prepared }
        }
        const ok = await persistPrepared(prepared)
        return ok ? { status: 'saved' } : { status: 'error' }
      } catch (error) {
        setErrorMessage(mapAnexoError(error))
        return { status: 'error' }
      } finally {
        setProcessing(false)
      }
    },
    [session, manutencaoId, persistPrepared],
  )

  const confirmPreparedAnexo = useCallback(
    async (prepared: PreparedAnexo): Promise<boolean> => {
      setProcessing(true)
      try {
        return await persistPrepared(prepared)
      } finally {
        setProcessing(false)
      }
    },
    [persistPrepared],
  )

  const loadAnexoBytes = useCallback(
    async (id: number): Promise<Anexo | null> => {
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
      if (!session) return
      setErrorMessage(null)
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
    clearFeedback,
  }
}
