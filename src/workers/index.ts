/**
 * Web Workers (OCR, redimensionamento de imagem).
 * Processamento pesado fora da main thread.
 */

export {
  MAX_IMAGE_SIDE_PX,
  MIME_JPEG,
  TARGET_IMAGE_MAX_BYTES,
  computeTargetDimensions,
  jpegQualitySteps,
  meetsSizeTarget,
} from './imageResizeCore'
export {
  ImageResizeWorkerError,
  processImageInWorker,
  setImageResizeWorkerFactory,
  type ProcessedImage,
} from './processImageInWorker'
export { OCR_BINARIZE_THRESHOLD, OCR_CONTRAST, preprocessImageData } from './ocrPreprocessCore'
export {
  runOcrInWorker,
  setOcrPreprocessWorkerFactory,
  setOcrRunner,
  type OcrRunResult,
  type OcrRunner,
} from './runOcrInWorker'
