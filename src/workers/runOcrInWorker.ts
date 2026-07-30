/**
 * Orquestra pré-processamento (Web Worker) + Tesseract.js (`por`).
 * OCR roda fora da main thread (worker do Tesseract); UI permanece responsiva.
 * Cancelamento: terminate do preprocess + terminate do worker Tesseract.
 *
 * Testes/E2E: `setOcrRunner` ou `window.__HVCF_MOCK_OCR__`.
 */

import { OcrError } from '../domain/ocr'
import { OCR_LANG, OCR_MODEL_LANG_PATH } from '../shared/ocr'
import type { OcrPreprocessRequest, OcrPreprocessResponse } from './ocrPreprocessWorker'

export interface OcrRunResult {
  text: string
}

export type OcrRunner = (bytes: Uint8Array, signal?: AbortSignal) => Promise<OcrRunResult>

type PreprocessWorkerFactory = () => Worker

function defaultPreprocessWorkerFactory(): Worker {
  return new Worker(new URL('./ocrPreprocessWorker.ts', import.meta.url), {
    type: 'module',
  })
}

let preprocessWorkerFactory: PreprocessWorkerFactory = defaultPreprocessWorkerFactory
let ocrRunnerOverride: OcrRunner | null = null

/** Injeta factory do worker de pré-processamento (testes). */
export function setOcrPreprocessWorkerFactory(factory: PreprocessWorkerFactory | null): void {
  preprocessWorkerFactory = factory ?? defaultPreprocessWorkerFactory
}

/** Injeta runner completo (testes / E2E mock). */
export function setOcrRunner(runner: OcrRunner | null): void {
  ocrRunnerOverride = runner
}

function getWindowMockOcr(): OcrRunner | null {
  if (typeof window === 'undefined') return null
  const mock = (window as Window & { __HVCF_MOCK_OCR__?: OcrRunner }).__HVCF_MOCK_OCR__
  return typeof mock === 'function' ? mock : null
}

function preprocessInWorker(bytes: Uint8Array, signal?: AbortSignal): Promise<Uint8Array> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new OcrError('CANCELLED', 'OCR cancelado.'))
      return
    }

    let worker: Worker
    try {
      worker = preprocessWorkerFactory()
    } catch (error) {
      reject(
        new OcrError(
          'WORKER_FAILED',
          error instanceof Error ? error.message : 'Não foi possível iniciar o pré-processamento.',
        ),
      )
      return
    }

    const id = crypto.randomUUID()
    const timeout = setTimeout(() => {
      worker.terminate()
      reject(new OcrError('WORKER_FAILED', 'Timeout no pré-processamento OCR.'))
    }, 60_000)

    const onAbort = () => {
      clearTimeout(timeout)
      worker.terminate()
      reject(new OcrError('CANCELLED', 'OCR cancelado.'))
    }
    signal?.addEventListener('abort', onAbort, { once: true })

    worker.onmessage = (event: MessageEvent<OcrPreprocessResponse>) => {
      if (event.data.id !== id) return
      clearTimeout(timeout)
      signal?.removeEventListener('abort', onAbort)
      worker.terminate()
      if (event.data.ok === false) {
        reject(new OcrError('WORKER_FAILED', event.data.error))
        return
      }
      resolve(new Uint8Array(event.data.buffer))
    }

    worker.onerror = (event) => {
      clearTimeout(timeout)
      signal?.removeEventListener('abort', onAbort)
      worker.terminate()
      reject(new OcrError('WORKER_FAILED', event.message || 'Erro no worker de pré-processamento.'))
    }

    const copy = bytes.slice().buffer
    const request: OcrPreprocessRequest = { id, buffer: copy }
    worker.postMessage(request, [copy])
  })
}

async function recognizeWithTesseract(
  processedBytes: Uint8Array,
  signal?: AbortSignal,
): Promise<string> {
  if (signal?.aborted) {
    throw new OcrError('CANCELLED', 'OCR cancelado.')
  }

  let worker: {
    terminate: () => Promise<unknown>
    recognize: (image: Blob) => Promise<{ data: { text: string } }>
  } | null = null
  const onAbort = () => {
    void worker?.terminate()
  }
  signal?.addEventListener('abort', onAbort, { once: true })

  try {
    const { createWorker } = await import('tesseract.js')
    worker = await createWorker(OCR_LANG, 1, {
      langPath: OCR_MODEL_LANG_PATH,
      // workerPath padrão (CDN) — app-shell pode cachear; ver shared/ocr
    })

    if (signal?.aborted) {
      throw new OcrError('CANCELLED', 'OCR cancelado.')
    }

    const blob = new Blob([new Uint8Array(processedBytes)], { type: 'image/png' })
    const {
      data: { text },
    } = await worker.recognize(blob)
    return text ?? ''
  } catch (error) {
    if (error instanceof OcrError) throw error
    const message = error instanceof Error ? error.message : 'Falha no OCR.'
    const isNetwork =
      /fetch|network|load.*traineddata|failed to fetch|download/i.test(message) ||
      (typeof navigator !== 'undefined' && navigator.onLine === false)
    throw new OcrError(isNetwork ? 'MODEL_DOWNLOAD_FAILED' : 'WORKER_FAILED', message)
  } finally {
    signal?.removeEventListener('abort', onAbort)
    if (worker) {
      try {
        await worker.terminate()
      } catch {
        // ignore terminate errors
      }
    }
  }
}

async function defaultOcrRunner(bytes: Uint8Array, signal?: AbortSignal): Promise<OcrRunResult> {
  const processed = await preprocessInWorker(bytes, signal)
  const text = await recognizeWithTesseract(processed, signal)
  return { text }
}

/**
 * Executa OCR em imagem (bytes). Nunca deve ser tratado como save.
 * Em falha, o chamador mantém o fluxo manual.
 */
export function runOcrInWorker(bytes: Uint8Array, signal?: AbortSignal): Promise<OcrRunResult> {
  const runner = ocrRunnerOverride ?? getWindowMockOcr() ?? defaultOcrRunner
  return runner(bytes, signal)
}
