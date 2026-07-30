import { DEFAULT_EXPORT_FILENAME } from './constants'
import { supportsFileSystemAccess } from '../shared/browser/supportsFileSystemAccess'
import { CofreStorageError } from './types'

function toBlob(bytes: Uint8Array): Blob {
  // Cópia para satisfazer BlobPart tipado (ArrayBuffer estrito vs ArrayBufferLike).
  const copy = new Uint8Array(bytes)
  return new Blob([copy.buffer], { type: 'application/octet-stream' })
}

/**
 * Download clássico via âncora. Fallback universal quando não há share sheet.
 */
export async function downloadCofreFile(
  bytes: Uint8Array,
  filename: string = DEFAULT_EXPORT_FILENAME,
): Promise<void> {
  const blob = toBlob(bytes)
  const url = URL.createObjectURL(blob)
  try {
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = filename
    anchor.rel = 'noopener'
    document.body.appendChild(anchor)
    anchor.click()
    anchor.remove()
  } finally {
    URL.revokeObjectURL(url)
  }
}

/**
 * Tenta Web Share com arquivo; se indisponível ou falhar, cai no download.
 */
export async function exportCofreWithShareOrDownload(
  bytes: Uint8Array,
  filename: string = DEFAULT_EXPORT_FILENAME,
): Promise<void> {
  const blob = toBlob(bytes)
  const file = new File([blob], filename, { type: 'application/octet-stream' })

  if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
    try {
      const canShare =
        typeof navigator.canShare !== 'function' || navigator.canShare({ files: [file] })
      if (canShare) {
        await navigator.share({ files: [file], title: filename })
        return
      }
    } catch {
      // Usuário cancelou ou share falhou — segue para download.
    }
  }

  await downloadCofreFile(bytes, filename)
}

/**
 * Enhancement opcional: showSaveFilePicker. Sem a API, erro controlado.
 */
export async function saveCofreWithFilePicker(
  bytes: Uint8Array,
  suggestedName: string = DEFAULT_EXPORT_FILENAME,
): Promise<void> {
  if (!supportsFileSystemAccess()) {
    throw new CofreStorageError(
      'OPFS_UNAVAILABLE',
      'File System Access API não está disponível neste navegador. Use exportar .cofre.',
    )
  }

  const handle = await window.showSaveFilePicker({
    suggestedName,
    types: [
      {
        description: 'Cofre de histórico veicular',
        accept: { 'application/octet-stream': ['.cofre'] },
      },
    ],
  })

  const writable = await handle.createWritable()
  try {
    await writable.write(toBlob(bytes))
  } finally {
    await writable.close()
  }
}
