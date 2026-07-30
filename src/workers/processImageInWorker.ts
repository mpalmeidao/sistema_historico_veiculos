import type { ImageResizeRequest, ImageResizeResponse } from './imageResizeWorker'
import { MIME_JPEG } from './imageResizeCore'

export interface ProcessedImage {
  bytes: Uint8Array
  width: number
  height: number
  mimeType: typeof MIME_JPEG
}

export class ImageResizeWorkerError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ImageResizeWorkerError'
  }
}

type WorkerFactory = () => Worker

function defaultWorkerFactory(): Worker {
  return new Worker(new URL('./imageResizeWorker.ts', import.meta.url), {
    type: 'module',
  })
}

let workerFactory: WorkerFactory = defaultWorkerFactory

/** Injeta factory (testes). Em produção usa o worker Vite/module. */
export function setImageResizeWorkerFactory(factory: WorkerFactory | null): void {
  workerFactory = factory ?? defaultWorkerFactory
}

/**
 * Redimensiona/recomprime a imagem em Web Worker.
 * Em falha, rejeita — o chamador NÃO deve gravar blob parcial como sucesso.
 */
export function processImageInWorker(bytes: Uint8Array): Promise<ProcessedImage> {
  return new Promise((resolve, reject) => {
    let worker: Worker
    try {
      worker = workerFactory()
    } catch (error) {
      reject(
        new ImageResizeWorkerError(
          error instanceof Error ? error.message : 'Não foi possível iniciar o worker.',
        ),
      )
      return
    }

    const id = crypto.randomUUID()
    const timeout = setTimeout(() => {
      worker.terminate()
      reject(new ImageResizeWorkerError('Timeout no processamento da imagem.'))
    }, 60_000)

    worker.onmessage = (event: MessageEvent<ImageResizeResponse>) => {
      if (event.data.id !== id) return
      clearTimeout(timeout)
      worker.terminate()
      if (event.data.ok === false) {
        reject(new ImageResizeWorkerError(event.data.error))
        return
      }
      resolve({
        bytes: new Uint8Array(event.data.buffer),
        width: event.data.width,
        height: event.data.height,
        mimeType: event.data.mimeType,
      })
    }

    worker.onerror = (event) => {
      clearTimeout(timeout)
      worker.terminate()
      reject(new ImageResizeWorkerError(event.message || 'Erro no worker de imagem.'))
    }

    const copy = bytes.slice().buffer
    const request: ImageResizeRequest = { id, buffer: copy }
    worker.postMessage(request, [copy])
  })
}
