import {
  JPEG_QUALITY,
  MAX_IMAGE_SIDE_PX,
  MIME_JPEG,
  TARGET_IMAGE_MAX_BYTES,
} from '../domain/anexos/constants'

/** Qualidade mínima ao tentar caber no alvo de tamanho. */
export const MIN_JPEG_QUALITY = 0.5

export function computeTargetDimensions(
  width: number,
  height: number,
  maxSide: number = MAX_IMAGE_SIDE_PX,
): { width: number; height: number } {
  if (width <= 0 || height <= 0) {
    throw new Error('Dimensões de imagem inválidas.')
  }
  const longer = Math.max(width, height)
  if (longer <= maxSide) {
    return { width, height }
  }
  const scale = maxSide / longer
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  }
}

/**
 * Sequência de qualidades a tentar: começa em ~80% e reduz até o alvo ou o mínimo.
 * Imagens já pequenas ainda passam pelo encode (idempotente / seguro).
 */
export function jpegQualitySteps(
  initial: number = JPEG_QUALITY,
  min: number = MIN_JPEG_QUALITY,
): number[] {
  const steps: number[] = []
  for (let q = initial; q >= min - 1e-9; q = Math.round((q - 0.1) * 10) / 10) {
    steps.push(Number(q.toFixed(1)))
  }
  if (steps.length === 0) steps.push(min)
  return steps
}

export function meetsSizeTarget(
  sizeBytes: number,
  target: number = TARGET_IMAGE_MAX_BYTES,
): boolean {
  return sizeBytes <= target
}

export { JPEG_QUALITY, MAX_IMAGE_SIDE_PX, MIME_JPEG, TARGET_IMAGE_MAX_BYTES }
