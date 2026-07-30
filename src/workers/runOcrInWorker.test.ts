import { afterEach, describe, expect, it, vi } from 'vitest'
import { OcrError } from '../domain/ocr'
import { runOcrInWorker, setOcrPreprocessWorkerFactory, setOcrRunner } from './runOcrInWorker'
import type { OcrPreprocessResponse } from './ocrPreprocessWorker'

describe('runOcrInWorker', () => {
  afterEach(() => {
    setOcrRunner(null)
    setOcrPreprocessWorkerFactory(null)
  })

  it('deve usar runner injetado e retornar texto', async () => {
    const runner = vi.fn(async () => ({ text: 'Data: 01/01/2026' }))
    setOcrRunner(runner)

    const result = await runOcrInWorker(new Uint8Array([9]))
    expect(result.text).toBe('Data: 01/01/2026')
    expect(runner).toHaveBeenCalledOnce()
  })

  it('deve rejeitar com CANCELLED quando o signal já está abortado no preprocess', async () => {
    setOcrRunner(null)
    setOcrPreprocessWorkerFactory(() => {
      throw new Error('não deve criar worker')
    })

    const controller = new AbortController()
    controller.abort()

    await expect(runOcrInWorker(new Uint8Array([1]), controller.signal)).rejects.toBeInstanceOf(
      OcrError,
    )
    await expect(runOcrInWorker(new Uint8Array([1]), controller.signal)).rejects.toMatchObject({
      code: 'CANCELLED',
    })
  })

  it('deve propagar falha do worker de pré-processamento', async () => {
    setOcrRunner(null)
    setOcrPreprocessWorkerFactory(() => {
      let onmessage: ((event: MessageEvent<OcrPreprocessResponse>) => void) | null = null
      return {
        set onmessage(handler: ((event: MessageEvent<OcrPreprocessResponse>) => void) | null) {
          onmessage = handler
        },
        get onmessage() {
          return onmessage
        },
        onerror: null,
        postMessage(data: { id: string }) {
          queueMicrotask(() => {
            onmessage?.({
              data: { id: data.id, ok: false, error: 'preprocess falhou' },
            } as MessageEvent<OcrPreprocessResponse>)
          })
        },
        terminate: vi.fn(),
      } as unknown as Worker
    })

    // Força caminho default (sem override) — mas createWorker do Tesseract
    // não roda se preprocess falhar antes.
    await expect(runOcrInWorker(new Uint8Array([1, 2]))).rejects.toMatchObject({
      code: 'WORKER_FAILED',
      message: 'preprocess falhou',
    })
  })
})
