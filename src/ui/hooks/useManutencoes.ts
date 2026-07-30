import { useCallback, useEffect, useState } from 'react'
import type { CofreSession } from '../../storage'
import {
  ManutencaoDomainError,
  createManutencao,
  deleteManutencao,
  listManutencoesByVeiculo,
  updateManutencao,
  type Manutencao,
  type ManutencaoFieldError,
  type ManutencaoRawInput,
} from '../../domain'
import { strings } from '../../shared/i18n'

export interface UseManutencoesResult {
  manutencoes: Manutencao[]
  loading: boolean
  errorMessage: string | null
  message: string | null
  reload: () => void
  saveManutencao: (
    raw: ManutencaoRawInput,
    manutencaoId: number | null,
  ) => Promise<{ ok: true } | { ok: false; fieldErrors: ManutencaoFieldError[] }>
  removeManutencao: (id: number) => Promise<void>
  clearFeedback: () => void
}

export function useManutencoes(
  session: CofreSession | null,
  veiculoId: number | null,
  onMutated?: () => void,
): UseManutencoesResult {
  const [manutencoes, setManutencoes] = useState<Manutencao[]>([])
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  const reload = useCallback(() => {
    if (!session || veiculoId === null) {
      setManutencoes([])
      return
    }
    setLoading(true)
    try {
      setManutencoes(listManutencoesByVeiculo(session, veiculoId))
      setErrorMessage(null)
    } catch {
      setErrorMessage(strings.manutencoes.loadError)
    } finally {
      setLoading(false)
    }
  }, [session, veiculoId])

  useEffect(() => {
    reload()
  }, [reload])

  const saveManutencao = useCallback(
    async (
      raw: ManutencaoRawInput,
      manutencaoId: number | null,
    ): Promise<{ ok: true } | { ok: false; fieldErrors: ManutencaoFieldError[] }> => {
      if (!session) return { ok: false, fieldErrors: [] }
      setErrorMessage(null)
      try {
        if (manutencaoId === null) {
          await createManutencao(session, raw)
        } else {
          await updateManutencao(session, manutencaoId, raw)
        }
        setMessage(strings.manutencoes.savedOk)
        reload()
        onMutated?.()
        return { ok: true }
      } catch (error) {
        if (error instanceof ManutencaoDomainError && error.code === 'VALIDATION') {
          return { ok: false, fieldErrors: error.fieldErrors ?? [] }
        }
        setErrorMessage(strings.manutencoes.saveError)
        return { ok: false, fieldErrors: [] }
      }
    },
    [session, reload, onMutated],
  )

  const removeManutencao = useCallback(
    async (id: number): Promise<void> => {
      if (!session) return
      setErrorMessage(null)
      try {
        await deleteManutencao(session, id)
        setMessage(strings.manutencoes.deletedOk)
        reload()
        onMutated?.()
      } catch {
        setErrorMessage(strings.manutencoes.deleteError)
      }
    },
    [session, reload, onMutated],
  )

  const clearFeedback = useCallback(() => {
    setMessage(null)
    setErrorMessage(null)
  }, [])

  return {
    manutencoes,
    loading,
    errorMessage,
    message,
    reload,
    saveManutencao,
    removeManutencao,
    clearFeedback,
  }
}
