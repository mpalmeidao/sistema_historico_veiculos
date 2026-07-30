import { describe, expect, it } from 'vitest'
import { OCR_MODEL_LANG_PATH, OCR_MODEL_URL_PATTERN } from '../ocr/constants'
import {
  isNeverCacheUrl,
  isOcrModelCacheUrl,
  OCR_MODEL_WORKBOX_URL_PATTERN,
  PWA_NAVIGATE_FALLBACK,
  PWA_NEVER_CACHE_URL_PATTERNS,
  PWA_PRECACHE_GLOB_PATTERNS,
  PWA_RUNTIME_CACHING,
  runtimeCachingCoversUrl,
} from './cachePolicy'

describe('cachePolicy (PWA)', () => {
  it('deve precachear shell incluindo wasm e html', () => {
    const joined = PWA_PRECACHE_GLOB_PATTERNS.join(',')
    expect(joined).toContain('html')
    expect(joined).toContain('js')
    expect(joined).toContain('css')
    expect(joined).toContain('wasm')
  })

  it('deve usar SPA fallback index.html alinhado ao deploy', () => {
    expect(PWA_NAVIGATE_FALLBACK).toBe('index.html')
  })

  it('deve cachear o modelo OCR após primeiro download (runtime CacheFirst)', () => {
    const modelUrl = `${OCR_MODEL_LANG_PATH}/por.traineddata`
    expect(isOcrModelCacheUrl(modelUrl)).toBe(true)
    expect(runtimeCachingCoversUrl(modelUrl)).toBe(true)
    expect(OCR_MODEL_URL_PATTERN.test(modelUrl)).toBe(true)
    expect(OCR_MODEL_WORKBOX_URL_PATTERN.test(modelUrl)).toBe(true)

    expect(PWA_RUNTIME_CACHING).toHaveLength(1)
    expect(PWA_RUNTIME_CACHING[0]?.handler).toBe('CacheFirst')
    expect(PWA_RUNTIME_CACHING[0]?.options.cacheName).toBe('hvcf-ocr-model')
  })

  it('não deve ter runtime caching para cofre, OPFS/blob ou PDF local', () => {
    const forbidden = [
      'https://example.com/backup.cofre',
      'https://app.local/trabalho.cofre',
      'blob:https://app.local/abc-123',
      'filesystem:https://app.local/temporary/file',
      'blob:https://app.local/relatorio.pdf',
    ]

    for (const url of forbidden) {
      expect(isNeverCacheUrl(url)).toBe(true)
      expect(runtimeCachingCoversUrl(url)).toBe(false)
    }

    for (const entry of PWA_RUNTIME_CACHING) {
      for (const url of forbidden) {
        expect(entry.urlPattern.test(url)).toBe(false)
      }
    }

    expect(PWA_NEVER_CACHE_URL_PATTERNS.length).toBeGreaterThan(0)
  })
})
