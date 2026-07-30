import { MIME_JPEG, MIME_PDF, PDF_WARN_BYTES } from './constants'
import type { DetectAnexoTipoResult } from './types'

const IMAGE_MIME_PREFIX = 'image/'

const EXTENSION_MIME: Record<string, string> = {
  jpg: MIME_JPEG,
  jpeg: MIME_JPEG,
  png: 'image/png',
  gif: 'image/gif',
  webp: 'image/webp',
  heic: 'image/heic',
  heif: 'image/heif',
  pdf: MIME_PDF,
}

function extensionOf(fileName: string | null | undefined): string | null {
  if (!fileName) return null
  const parts = fileName.trim().toLowerCase().split('.')
  if (parts.length < 2) return null
  return parts.at(-1) ?? null
}

/**
 * Aceita imagem (qualquer `image/*`) ou PDF; recusa demais tipos.
 * Usa MIME quando presente; senão, extensão do nome do arquivo.
 */
export function detectAnexoTipo(
  mimeType: string | null | undefined,
  fileName?: string | null,
): DetectAnexoTipoResult {
  const mime = (mimeType ?? '').trim().toLowerCase()

  if (mime === MIME_PDF) {
    return { ok: true, kind: 'pdf', mimeType: MIME_PDF }
  }
  if (mime.startsWith(IMAGE_MIME_PREFIX)) {
    return { ok: true, kind: 'image', mimeType: mime }
  }

  const ext = extensionOf(fileName)
  if (ext && EXTENSION_MIME[ext]) {
    const resolved = EXTENSION_MIME[ext]
    if (resolved === MIME_PDF) {
      return { ok: true, kind: 'pdf', mimeType: MIME_PDF }
    }
    return { ok: true, kind: 'image', mimeType: resolved }
  }

  return { ok: false, code: 'UNSUPPORTED_TYPE' }
}

/** PDF ≥ ~2 MB deve exibir aviso antes da confirmação. */
export function pdfNeedsSizeWarning(sizeBytes: number): boolean {
  return sizeBytes >= PDF_WARN_BYTES
}

export { PDF_WARN_BYTES }
