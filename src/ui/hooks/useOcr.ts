import { useCallback, useRef, useState } from 'react'
import {
  OcrError,
  mergeOcrSuggestions,
  parseOcrText,
  type ManutencaoFormFields,
  type OcrFieldSuggestions,
} from '../../domain'
import { OCR_MODEL_SIZE_MB_APPROX, ocrModelPrefsStore } from '../../shared/ocr'
import { runOcrInWorker } from '../../workers'

export type OcrUiStatus = 'idle' | 'needs-model-ack' | 'processing' | 'error'

export type OcrRunOutcome =
  | { kind: 'needs-ack' }
  | { kind: 'done'; suggestions: OcrFieldSuggestions }
  | { kind: 'cancelled' }
  | { kind: 'error'; code: OcrError['code']; message: string }

export interface UseOcrResult {
  status: OcrUiStatus
  errorCode: OcrError['code'] | null
  modelSizeMb: number
  requestOcr: (bytes: Uint8Array) => Promise<OcrRunOutcome>
  acknowledgeModelAndRun: () => Promise<OcrRunOutcome>
  cancel: () => void
  clearError: () => void
  applyToForm: (
    current: ManutencaoFormFields,
    suggestions: OcrFieldSuggestions,
  ) => ManutencaoFormFields
}

export function useOcr(): UseOcrResult {
  const [status, setStatus] = useState<OcrUiStatus>('idle')
  const [errorCode, setErrorCode] = useState<OcrError['code'] | null>(null)
  const pendingBytesRef = useRef<Uint8Array | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  const run = useCallback(async (bytes: Uint8Array): Promise<OcrRunOutcome> => {
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller
    setStatus('processing')
    setErrorCode(null)

    try {
      const { text } = await runOcrInWorker(bytes, controller.signal)
      if (controller.signal.aborted) {
        setStatus('idle')
        return { kind: 'cancelled' }
      }
      const suggestions = parseOcrText(text)
      setStatus('idle')
      return { kind: 'done', suggestions }
    } catch (error) {
      if (error instanceof OcrError && error.code === 'CANCELLED') {
        setStatus('idle')
        return { kind: 'cancelled' }
      }
      const code = error instanceof OcrError ? error.code : 'WORKER_FAILED'
      const message = error instanceof Error ? error.message : 'OCR failed'
      setErrorCode(code)
      setStatus('error')
      return { kind: 'error', code, message }
    } finally {
      if (abortRef.current === controller) {
        abortRef.current = null
      }
    }
  }, [])

  const requestOcr = useCallback(
    async (bytes: Uint8Array): Promise<OcrRunOutcome> => {
      pendingBytesRef.current = bytes
      if (!ocrModelPrefsStore.read().downloadAcked) {
        setStatus('needs-model-ack')
        return { kind: 'needs-ack' }
      }
      return run(bytes)
    },
    [run],
  )

  const acknowledgeModelAndRun = useCallback(async (): Promise<OcrRunOutcome> => {
    ocrModelPrefsStore.acknowledgeDownload()
    const bytes = pendingBytesRef.current
    if (!bytes) {
      setStatus('idle')
      return { kind: 'cancelled' }
    }
    return run(bytes)
  }, [run])

  const cancel = useCallback(() => {
    abortRef.current?.abort()
    abortRef.current = null
    setStatus('idle')
  }, [])

  const clearError = useCallback(() => {
    setErrorCode(null)
    setStatus('idle')
  }, [])

  const applyToForm = useCallback(
    (current: ManutencaoFormFields, suggestions: OcrFieldSuggestions): ManutencaoFormFields => {
      return mergeOcrSuggestions(current, suggestions)
    },
    [],
  )

  return {
    status,
    errorCode,
    modelSizeMb: OCR_MODEL_SIZE_MB_APPROX,
    requestOcr,
    acknowledgeModelAndRun,
    cancel,
    clearError,
    applyToForm,
  }
}
