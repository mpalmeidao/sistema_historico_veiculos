import { supportsOpfs } from './supportsOpfs'

/**
 * Suporte mínimo do app: OPFS adequado (alvo Safari 16.4+ / Chromium / Firefox recentes).
 * Abaixo disso, a UI deve exibir aviso — não operar como se a persistência fosse confiável.
 *
 * E2E: `window.__HVCF_MOCK_MINIMUM_BROWSER__ = false` força o aviso.
 */
export function isMinimumBrowserSupported(): boolean {
  if (typeof window !== 'undefined' && typeof window.__HVCF_MOCK_MINIMUM_BROWSER__ === 'boolean') {
    return window.__HVCF_MOCK_MINIMUM_BROWSER__
  }
  return supportsOpfs()
}
