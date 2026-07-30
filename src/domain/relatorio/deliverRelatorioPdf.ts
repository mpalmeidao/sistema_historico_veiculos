/**
 * Entrega local do PDF — download ou share sheet.
 * Nunca envia bytes a servidor.
 */

function toPdfBlob(bytes: Uint8Array): Blob {
  const copy = new Uint8Array(bytes)
  return new Blob([copy.buffer], { type: 'application/pdf' })
}

/** Download clássico via âncora (fallback universal). */
export async function downloadRelatorioPdf(bytes: Uint8Array, filename: string): Promise<void> {
  const blob = toPdfBlob(bytes)
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
 * API apenas local — sem upload.
 */
export async function deliverRelatorioPdf(
  bytes: Uint8Array,
  filename: string,
): Promise<'share' | 'download'> {
  const blob = toPdfBlob(bytes)
  const file = new File([blob], filename, { type: 'application/pdf' })

  if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
    try {
      const canShare =
        typeof navigator.canShare !== 'function' || navigator.canShare({ files: [file] })
      if (canShare) {
        await navigator.share({ files: [file], title: filename })
        return 'share'
      }
    } catch {
      // Cancelamento ou falha do share — segue para download.
    }
  }

  await downloadRelatorioPdf(bytes, filename)
  return 'download'
}

/** Nome sugerido do arquivo a partir da placa. */
export function buildRelatorioFilename(placa: string, geradoEmIso: string): string {
  const safePlaca = placa.replace(/[^a-zA-Z0-9_-]/g, '').toUpperCase() || 'VEICULO'
  const day = geradoEmIso.slice(0, 10).replace(/-/g, '')
  return `relatorio-${safePlaca}-${day || 'export'}.pdf`
}
