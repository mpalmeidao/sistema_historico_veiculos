import { describe, expect, it, vi } from 'vitest'
import { processImageInWorker, setImageResizeWorkerFactory } from './processImageInWorker'
import type { ImageResizeResponse } from './imageResizeWorker'
import { MIME_JPEG } from './imageResizeCore'

describe('processImageInWorker', () => {
  it('deve despachar para um Worker e resolver com JPEG processado', async () => {
    const postMessage = vi.fn()
    const terminate = vi.fn()
    let onmessage: ((event: MessageEvent<ImageResizeResponse>) => void) | null = null

    setImageResizeWorkerFactory(() => {
      const worker = {
        set onmessage(handler: ((event: MessageEvent<ImageResizeResponse>) => void) | null) {
          onmessage = handler
        },
        get onmessage() {
          return onmessage
        },
        onerror: null,
        postMessage(data: { id: string; buffer: ArrayBuffer }) {
          postMessage(data)
          const out = new Uint8Array([0xff, 0xd8, 0xff, 0xd9]).buffer
          queueMicrotask(() => {
            onmessage?.({
              data: {
                id: data.id,
                ok: true,
                buffer: out,
                width: 100,
                height: 80,
                mimeType: MIME_JPEG,
              },
            } as MessageEvent<ImageResizeResponse>)
          })
        },
        terminate,
      }
      return worker as unknown as Worker
    })

    try {
      const result = await processImageInWorker(new Uint8Array([1, 2, 3]))
      expect(postMessage).toHaveBeenCalledOnce()
      expect(result.mimeType).toBe(MIME_JPEG)
      expect(result.width).toBe(100)
      expect(result.height).toBe(80)
      expect(result.bytes).toEqual(new Uint8Array([0xff, 0xd8, 0xff, 0xd9]))
      expect(terminate).toHaveBeenCalled()
    } finally {
      setImageResizeWorkerFactory(null)
    }
  })

  it('deve rejeitar sem sucesso quando o worker falha', async () => {
    setImageResizeWorkerFactory(() => {
      let onmessage: ((event: MessageEvent<ImageResizeResponse>) => void) | null = null
      const worker = {
        set onmessage(handler: ((event: MessageEvent<ImageResizeResponse>) => void) | null) {
          onmessage = handler
        },
        get onmessage() {
          return onmessage
        },
        onerror: null,
        postMessage(data: { id: string }) {
          queueMicrotask(() => {
            onmessage?.({
              data: { id: data.id, ok: false, error: 'falha simulada' },
            } as MessageEvent<ImageResizeResponse>)
          })
        },
        terminate: vi.fn(),
      }
      return worker as unknown as Worker
    })

    try {
      await expect(processImageInWorker(new Uint8Array([1]))).rejects.toThrow('falha simulada')
    } finally {
      setImageResizeWorkerFactory(null)
    }
  })
})
