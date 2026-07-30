/**
 * OCR compartilhado: modelo `por`, aviso de tamanho, ponto de cache PWA.
 * PDF sem OCR automático no MVP (`OCR_PDF_AUTOMATIC_SUPPORTED`).
 */

export {
  OCR_LANG,
  OCR_MODEL_LANG_PATH,
  OCR_MODEL_SIZE_MB_APPROX,
  OCR_MODEL_URL_PATTERN,
  OCR_PDF_AUTOMATIC_SUPPORTED,
} from './constants'
export {
  DEFAULT_OCR_MODEL_PREFS,
  OCR_MODEL_PREFS_KEY,
  createOcrModelPrefsStore,
  ocrModelPrefsStore,
  type OcrModelPrefs,
  type OcrModelPrefsStore,
} from './ocrModelPrefs'
