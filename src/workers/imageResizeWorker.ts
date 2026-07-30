/**
 * Web Worker: redimensiona e recomprime imagem via OffscreenCanvas.
 * Processamento fora da main thread (discovery-tech 5.4).
 *
 * Protocolo:
 *   → { id, buffer: ArrayBuffer }
 *   ← { id, ok: true, buffer, width, height, mimeType } | { id, ok: false, error }
 */

import {
  MIME_JPEG,
  computeTargetDimensions,
  jpegQualitySteps,
  meetsSizeTarget,
} from './imageResizeCore'

export interface ImageResizeRequest {
  id: string
  buffer: ArrayBuffer
}

export type ImageResizeResponse =
  | {
      id: string
      ok: true
      buffer: ArrayBuffer
      width: number
      height: number
      mimeType: typeof MIME_JPEG
    }
  | { id: string; ok: false; error: string }

async function encodeJpeg(
  source: ImageBitmap,
  width: number,
  height: number,
  quality: number,
): Promise<Blob> {
  const canvas = new OffscreenCanvas(width, height)
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    throw new Error('OffscreenCanvas 2d indisponível.')
  }
  ctx.drawImage(source, 0, 0, width, height)
  return canvas.convertToBlob({ type: MIME_JPEG, quality })
}

async function processBuffer(buffer: ArrayBuffer): Promise<{
  buffer: ArrayBuffer
  width: number
  height: number
}> {
  if (typeof OffscreenCanvas === 'undefined') {
    throw new Error('OffscreenCanvas não suportado neste worker.')
  }
  if (typeof createImageBitmap === 'undefined') {
    throw new Error('createImageBitmap não suportado neste worker.')
  }

  const blob = new Blob([buffer])
  const bitmap = await createImageBitmap(blob)
  try {
    const { width, height } = computeTargetDimensions(bitmap.width, bitmap.height)
    let best: { buffer: ArrayBuffer; width: number; height: number } | null = null

    for (const quality of jpegQualitySteps()) {
      const outBlob = await encodeJpeg(bitmap, width, height, quality)
      const outBuffer = await outBlob.arrayBuffer()
      best = { buffer: outBuffer, width, height }
      if (meetsSizeTarget(outBuffer.byteLength)) {
        return best
      }
    }

    if (!best) {
      throw new Error('Falha ao recomprimir imagem.')
    }
    return best
  } finally {
    bitmap.close()
  }
}

type WorkerScope = {
  postMessage(message: ImageResizeResponse, transfer?: Transferable[]): void
}

const workerScope = self as unknown as WorkerScope

self.onmessage = (event: MessageEvent<ImageResizeRequest>) => {
  const { id, buffer } = event.data
  void (async () => {
    try {
      const result = await processBuffer(buffer)
      const response: ImageResizeResponse = {
        id,
        ok: true,
        buffer: result.buffer,
        width: result.width,
        height: result.height,
        mimeType: MIME_JPEG,
      }
      workerScope.postMessage(response, [result.buffer])
    } catch (error) {
      const response: ImageResizeResponse = {
        id,
        ok: false,
        error: error instanceof Error ? error.message : 'Falha no redimensionamento.',
      }
      workerScope.postMessage(response)
    }
  })()
}

export {}
