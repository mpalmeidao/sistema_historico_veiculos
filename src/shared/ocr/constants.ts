/**
 * Constantes do modelo OCR (Tesseract.js, idioma `por`).
 *
 * Ponto de integração para `app-shell-pwa` (`src/shared/pwa/cachePolicy.ts`):
 * o service worker cacheia o download de `por.traineddata`
 * (URL sob OCR_MODEL_LANG_PATH) após o primeiro uso via Workbox CacheFirst —
 * nunca o cofre. Aviso de tamanho permanece no fluxo OCR (`useOcr`).
 * Falha de cache do modelo não derruba o shell nem o fluxo manual.
 */

/** Idioma Tesseract (arquivo por.traineddata). */
export const OCR_LANG = 'por'

/**
 * langPath LSTM (oem default 1) usado pelo Tesseract.js v7 via jsDelivr.
 * Workbox/app-shell: runtimeCaching deste host/path.
 */
export const OCR_MODEL_LANG_PATH =
  'https://cdn.jsdelivr.net/npm/@tesseract.js-data/por/4.0.0_best_int'

/** Padrão de URL do modelo para cache PWA (documentação / Workbox). */
export const OCR_MODEL_URL_PATTERN = /cdn\.jsdelivr\.net\/npm\/@tesseract\.js-data\/por\//

/** Tamanho aproximado do modelo (aviso na primeira uso). */
export const OCR_MODEL_SIZE_MB_APPROX = 10

/**
 * PDF sem OCR automático no MVP.
 * Anexos PDF seguem só como arquivo; OCR aplica-se a imagem.
 */
export const OCR_PDF_AUTOMATIC_SUPPORTED = false as const
