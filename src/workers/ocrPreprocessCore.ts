/**
 * Pré-processamento de imagem para OCR (escala de cinza + contraste/binarização).
 * Funções puras sobre ImageData — usáveis em worker com OffscreenCanvas.
 */

/** Contraste linear centrado em 128 (1 = neutro; >1 aumenta). */
export const OCR_CONTRAST = 1.35

/** Limiar de binarização após contraste (0–255). */
export const OCR_BINARIZE_THRESHOLD = 140

function clampByte(value: number): number {
  return Math.max(0, Math.min(255, Math.round(value)))
}

/**
 * Converte para escala de cinza, aplica contraste e binariza.
 * Mutates e retorna o mesmo ImageData.
 */
export function preprocessImageData(
  imageData: ImageData,
  options?: { contrast?: number; threshold?: number },
): ImageData {
  const contrast = options?.contrast ?? OCR_CONTRAST
  const threshold = options?.threshold ?? OCR_BINARIZE_THRESHOLD
  const { data } = imageData

  for (let i = 0; i < data.length; i += 4) {
    const gray = 0.299 * data[i]! + 0.587 * data[i + 1]! + 0.114 * data[i + 2]!
    const contrasted = clampByte((gray - 128) * contrast + 128)
    const binary = contrasted >= threshold ? 255 : 0
    data[i] = binary
    data[i + 1] = binary
    data[i + 2] = binary
    // alpha intacto
  }

  return imageData
}
