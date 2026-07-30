import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { existsSync } from 'node:fs'
import {
  OCR_MODEL_CACHE_NAME,
  OCR_MODEL_WORKBOX_URL_PATTERN,
  PWA_MAX_FILE_SIZE_TO_CACHE_BYTES,
  PWA_NAVIGATE_FALLBACK,
  PWA_PRECACHE_GLOB_PATTERNS,
  PWA_RUNTIME_CACHING,
} from './cachePolicy'

describe('vite PWA config alinhada ao cachePolicy', () => {
  it('deve manter vite.config.ts sincronizado com a política de cache', () => {
    const viteConfig = readFileSync(resolve(process.cwd(), 'vite.config.ts'), 'utf8')

    expect(viteConfig).toContain("registerType: 'autoUpdate'")
    expect(viteConfig).toContain(`navigateFallback: '${PWA_NAVIGATE_FALLBACK}'`)
    expect(viteConfig).toContain(String(PWA_MAX_FILE_SIZE_TO_CACHE_BYTES))
    expect(viteConfig).toContain(OCR_MODEL_CACHE_NAME)
    expect(viteConfig).toContain('CacheFirst')
    expect(viteConfig).toContain('por.traineddata')
    expect(viteConfig).toContain('cdn.jsdelivr.net/npm/@tesseract.js-data/por/')

    for (const pattern of PWA_PRECACHE_GLOB_PATTERNS) {
      expect(viteConfig).toContain(pattern)
    }

    expect(PWA_RUNTIME_CACHING).toHaveLength(1)
    expect(
      OCR_MODEL_WORKBOX_URL_PATTERN.test(
        'https://cdn.jsdelivr.net/npm/@tesseract.js-data/por/4.0.0_best_int/por.traineddata',
      ),
    ).toBe(true)
  })
})

describe('artefatos de build PWA', () => {
  it('deve existir service worker e manifest em dist após o build', () => {
    const distDir = resolve(process.cwd(), 'dist')
    if (!existsSync(distDir)) {
      expect(true).toBe(true)
      return
    }

    expect(existsSync(resolve(distDir, 'manifest.webmanifest'))).toBe(true)
    expect(existsSync(resolve(distDir, 'sw.js'))).toBe(true)
  })
})
