/**
 * Web Worker: pré-processa imagem para OCR (cinza/contraste/binarização).
 *
 * Protocolo:
 *   → { id, buffer: ArrayBuffer }
 *   ← { id, ok: true, buffer, mimeType } | { id, ok: false, error }
 */

import { preprocessImageData } from './ocrPreprocessCore'

export interface OcrPreprocessRequest {
  id: string
  buffer: ArrayBuffer
}

export type OcrPreprocessResponse =
  | { id: string; ok: true; buffer: ArrayBuffer; mimeType: 'image/png' }
  | { id: string; ok: false; error: string }

async function processBuffer(buffer: ArrayBuffer): Promise<ArrayBuffer> {
  if (typeof OffscreenCanvas === 'undefined') {
    throw new Error('OffscreenCanvas não suportado neste worker.')
  }
  if (typeof createImageBitmap === 'undefined') {
    throw new Error('createImageBitmap não suportado neste worker.')
  }

  const blob = new Blob([buffer])
  const bitmap = await createImageBitmap(blob)
  try {
    const canvas = new OffscreenCanvas(bitmap.width, bitmap.height)
    const ctx = canvas.getContext('2d')
    if (!ctx) {
      throw new Error('OffscreenCanvas 2d indisponível.')
    }
    ctx.drawImage(bitmap, 0, 0)
    const imageData = ctx.getImageData(0, 0, bitmap.width, bitmap.height)
    preprocessImageData(imageData)
    ctx.putImageData(imageData, 0, 0)
    const outBlob = await canvas.convertToBlob({ type: 'image/png' })
    return outBlob.arrayBuffer()
  } finally {
    bitmap.close()
  }
}

type WorkerScope = {
  postMessage(message: OcrPreprocessResponse, transfer?: Transferable[]): void
}

const workerScope = self as unknown as WorkerScope

self.onmessage = (event: MessageEvent<OcrPreprocessRequest>) => {
  const { id, buffer } = event.data
  void (async () => {
    try {
      const result = await processBuffer(buffer)
      const response: OcrPreprocessResponse = {
        id,
        ok: true,
        buffer: result,
        mimeType: 'image/png',
      }
      workerScope.postMessage(response, [result])
    } catch (error) {
      const response: OcrPreprocessResponse = {
        id,
        ok: false,
        error: error instanceof Error ? error.message : 'Falha no pré-processamento OCR.',
      }
      workerScope.postMessage(response)
    }
  })()
}

export {}
