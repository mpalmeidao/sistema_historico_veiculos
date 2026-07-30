import { ImageResizeWorkerError, processImageInWorker, type ProcessedImage } from '../../workers'
import { MIME_JPEG, MIME_PDF } from './constants'
import { detectAnexoTipo, pdfNeedsSizeWarning } from './detectAnexoTipo'
import { AnexoDomainError, type PreparedAnexo } from './types'

export type ImageProcessor = (bytes: Uint8Array) => Promise<ProcessedImage>

function toJpegFileName(fileName: string | null): string | null {
  if (!fileName) return 'nota.jpg'
  const base = fileName.replace(/\.[^.]+$/, '')
  return `${base || 'nota'}.jpg`
}

/**
 * Detecta tipo, processa imagem no worker (ou mantém PDF) e devolve payload pronto.
 * Falha do worker → erro; não devolve bytes parciais para gravação.
 */
export async function prepareAnexoFromFile(
  file: {
    name: string
    type: string
    size: number
    arrayBuffer: () => Promise<ArrayBuffer>
  },
  processImage: ImageProcessor = processImageInWorker,
): Promise<PreparedAnexo> {
  const detected = detectAnexoTipo(file.type, file.name)
  if (detected.ok === false) {
    throw new AnexoDomainError(
      'UNSUPPORTED_TYPE',
      'Tipo de arquivo não suportado. Use imagem (foto) ou PDF.',
    )
  }

  if (detected.kind === 'pdf') {
    const buffer = await file.arrayBuffer()
    return {
      mimeType: MIME_PDF,
      fileName: file.name || 'nota.pdf',
      bytes: new Uint8Array(buffer),
      pdfNeedsSizeWarning: pdfNeedsSizeWarning(file.size),
    }
  }

  const buffer = await file.arrayBuffer()
  let processed: ProcessedImage
  try {
    processed = await processImage(new Uint8Array(buffer))
  } catch (error) {
    const message =
      error instanceof ImageResizeWorkerError
        ? error.message
        : error instanceof Error
          ? error.message
          : 'Falha ao processar imagem.'
    throw new AnexoDomainError('WORKER_FAILED', message)
  }

  return {
    mimeType: MIME_JPEG,
    fileName: toJpegFileName(file.name || null),
    bytes: processed.bytes,
    pdfNeedsSizeWarning: false,
  }
}
