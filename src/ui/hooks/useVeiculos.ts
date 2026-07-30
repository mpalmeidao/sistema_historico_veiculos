import { useCallback, useEffect, useState } from 'react'
import type { CofreSession } from '../../storage'
import {
  VeiculoDomainError,
  countManutencoesByVeiculo,
  createVeiculo,
  deleteVeiculo,
  listVeiculos,
  updateVeiculo,
  type Veiculo,
  type VeiculoFieldError,
  type VeiculoRawInput,
} from '../../domain'
import { strings } from '../../shared/i18n'

export interface UseVeiculosResult {
  veiculos: Veiculo[]
  loading: boolean
  errorMessage: string | null
  message: string | null
  reload: () => void
  saveVeiculo: (
    raw: VeiculoRawInput,
    veiculoId: number | null,
  ) => Promise<{ ok: true } | { ok: false; fieldErrors: VeiculoFieldError[] }>
  removeVeiculo: (id: number, cascadeConfirmed: boolean) => Promise<'done' | 'needs-cascade'>
  getManutencoesCount: (id: number) => number
  clearFeedback: () => void
}

export function useVeiculos(
  session: CofreSession | null,
  onMutated?: () => void,
): UseVeiculosResult {
  const [veiculos, setVeiculos] = useState<Veiculo[]>([])
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  const reload = useCallback(() => {
    if (!session) {
      setVeiculos([])
      return
    }
    setLoading(true)
    try {
      setVeiculos(listVeiculos(session))
      setErrorMessage(null)
    } catch {
      setErrorMessage(strings.veiculos.loadError)
    } finally {
      setLoading(false)
    }
  }, [session])

  useEffect(() => {
    reload()
  }, [reload])

  const saveVeiculo = useCallback(
    async (
      raw: VeiculoRawInput,
      veiculoId: number | null,
    ): Promise<{ ok: true } | { ok: false; fieldErrors: VeiculoFieldError[] }> => {
      if (!session) return { ok: false, fieldErrors: [] }
      setErrorMessage(null)
      try {
        if (veiculoId === null) {
          await createVeiculo(session, raw)
        } else {
          await updateVeiculo(session, veiculoId, raw)
        }
        setMessage(strings.veiculos.savedOk)
        reload()
        onMutated?.()
        return { ok: true }
      } catch (error) {
        if (error instanceof VeiculoDomainError && error.code === 'VALIDATION') {
          return { ok: false, fieldErrors: error.fieldErrors ?? [] }
        }
        setErrorMessage(strings.veiculos.saveError)
        return { ok: false, fieldErrors: [] }
      }
    },
    [session, reload, onMutated],
  )

  const removeVeiculo = useCallback(
    async (id: number, cascadeConfirmed: boolean): Promise<'done' | 'needs-cascade'> => {
      if (!session) return 'done'
      setErrorMessage(null)
      try {
        await deleteVeiculo(session, id, { cascadeConfirmed })
        setMessage(strings.veiculos.deletedOk)
        reload()
        onMutated?.()
        return 'done'
      } catch (error) {
        if (error instanceof VeiculoDomainError && error.code === 'CASCADE_NOT_CONFIRMED') {
          return 'needs-cascade'
        }
        setErrorMessage(strings.veiculos.deleteError)
        return 'done'
      }
    },
    [session, reload, onMutated],
  )

  const getManutencoesCount = useCallback(
    (id: number): number => {
      if (!session) return 0
      return countManutencoesByVeiculo(session, id)
    },
    [session],
  )

  const clearFeedback = useCallback(() => {
    setMessage(null)
    setErrorMessage(null)
  }, [])

  return {
    veiculos,
    loading,
    errorMessage,
    message,
    reload,
    saveVeiculo,
    removeVeiculo,
    getManutencoesCount,
    clearFeedback,
  }
}
