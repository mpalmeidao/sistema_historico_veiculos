/**
 * Política de cache do service worker (vite-plugin-pwa / Workbox).
 *
 * Entra no cache:
 * - App shell: HTML/JS/CSS/WASM/ícones (precache via globPatterns)
 * - Modelo OCR `por.traineddata` (runtime CacheFirst após primeiro download)
 *
 * Nunca entra no cache:
 * - Arquivos `.cofre` / `trabalho.cofre`
 * - Blobs do usuário / OPFS
 * - PDFs gerados no cliente
 *
 * Falha ao cachear o modelo OCR não afeta o shell — o SW e a UI
 * continuam utilizáveis; o fluxo OCR trata retry/continuar sem OCR.
 */

import { OCR_MODEL_URL_PATTERN } from '../ocr/constants'

/** Glob do precache do shell (dist). Inclui WASM da UI (ex.: sql.js). */
export const PWA_PRECACHE_GLOB_PATTERNS = [
  '**/*.{js,css,html,ico,png,svg,woff2,wasm,webp}',
] as const

/** SPA fallback alinhado ao `_redirects` do Cloudflare Pages. */
export const PWA_NAVIGATE_FALLBACK = 'index.html'

/**
 * sql.js WASM + chunks Ionic/pdf-lib podem passar de 2 MiB.
 * Precache consciente — não inclui dados do usuário.
 */
export const PWA_MAX_FILE_SIZE_TO_CACHE_BYTES = 4 * 1024 * 1024

/**
 * URL completa do modelo OCR para Workbox runtimeCaching.
 * Deve cobrir o mesmo host/path que `OCR_MODEL_URL_PATTERN`.
 */
export const OCR_MODEL_WORKBOX_URL_PATTERN =
  /^https:\/\/cdn\.jsdelivr\.net\/npm\/@tesseract\.js-data\/por\/.*/i

export const OCR_MODEL_CACHE_NAME = 'hvcf-ocr-model'

export interface PwaRuntimeCacheEntry {
  urlPattern: RegExp
  handler: 'CacheFirst'
  options: {
    cacheName: string
    expiration: {
      maxEntries: number
      maxAgeSeconds: number
    }
    cacheableResponse: {
      statuses: number[]
    }
  }
}

/** Únicas rotas de runtime caching permitidas no MVP. */
export const PWA_RUNTIME_CACHING: readonly PwaRuntimeCacheEntry[] = [
  {
    urlPattern: OCR_MODEL_WORKBOX_URL_PATTERN,
    handler: 'CacheFirst',
    options: {
      cacheName: OCR_MODEL_CACHE_NAME,
      expiration: {
        maxEntries: 4,
        maxAgeSeconds: 60 * 60 * 24 * 365,
      },
      cacheableResponse: {
        statuses: [0, 200],
      },
    },
  },
]

/**
 * Padrões que jamais devem receber estratégia de cache no SW.
 * OPFS não passa pelo SW; listados para inspeção/teste da política.
 */
export const PWA_NEVER_CACHE_URL_PATTERNS: readonly RegExp[] = [
  /\.cofre(\?|#|$)/i,
  /trabalho\.cofre/i,
  /^blob:/i,
  /^filesystem:/i,
]

export function isOcrModelCacheUrl(url: string): boolean {
  return OCR_MODEL_URL_PATTERN.test(url) || OCR_MODEL_WORKBOX_URL_PATTERN.test(url)
}

export function isNeverCacheUrl(url: string): boolean {
  return PWA_NEVER_CACHE_URL_PATTERNS.some((pattern) => pattern.test(url))
}

export function runtimeCachingCoversUrl(url: string): boolean {
  return PWA_RUNTIME_CACHING.some((entry) => entry.urlPattern.test(url))
}
