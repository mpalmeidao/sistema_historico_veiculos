import { useCallback, useState } from 'react'
import { RelatorioDomainError, gerarRelatorioVeiculo, type RelatorioProgress } from '../../domain'
import type { CofreSession } from '../../storage'
import { strings } from '../../shared/i18n'

export type RelatorioUiStatus = 'idle' | 'working' | 'success' | 'error'

export interface UseRelatorioResult {
  status: RelatorioUiStatus
  progress: RelatorioProgress | null
  message: string | null
  errorMessage: string | null
  gerar: (veiculoId: number) => Promise<boolean>
  clearFeedback: () => void
}

function progressLabel(progress: RelatorioProgress): string {
  switch (progress.phase) {
    case 'montando':
      return strings.relatorio.progressMontando
    case 'gerando':
      return strings.relatorio.progressGerando
    case 'entregando':
      return strings.relatorio.progressEntregando
    default:
      return strings.relatorio.generating
  }
}

export function useRelatorio(session: CofreSession | null): UseRelatorioResult {
  const [status, setStatus] = useState<RelatorioUiStatus>('idle')
  const [progress, setProgress] = useState<RelatorioProgress | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const clearFeedback = useCallback(() => {
    setMessage(null)
    setErrorMessage(null)
    setProgress(null)
    setStatus('idle')
  }, [])

  const gerar = useCallback(
    async (veiculoId: number): Promise<boolean> => {
      if (!session) {
        setStatus('error')
        setErrorMessage(strings.relatorio.error)
        return false
      }

      setStatus('working')
      setMessage(strings.relatorio.generating)
      setErrorMessage(null)
      setProgress({ phase: 'montando', ratio: 0 })

      try {
        await gerarRelatorioVeiculo(session, veiculoId, {
          onProgress: (next) => {
            setProgress(next)
            setMessage(progressLabel(next))
          },
        })
        setStatus('success')
        setProgress(null)
        setMessage(strings.relatorio.success)
        return true
      } catch (error) {
        setStatus('error')
        setProgress(null)
        if (error instanceof RelatorioDomainError && error.code === 'NO_MANUTENCOES') {
          setErrorMessage(strings.relatorio.emptyHistory)
        } else if (error instanceof RelatorioDomainError && error.code === 'VEICULO_NOT_FOUND') {
          setErrorMessage(strings.relatorio.veiculoNotFound)
        } else {
          setErrorMessage(strings.relatorio.error)
        }
        setMessage(null)
        return false
      }
    },
    [session],
  )

  return { status, progress, message, errorMessage, gerar, clearFeedback }
}
