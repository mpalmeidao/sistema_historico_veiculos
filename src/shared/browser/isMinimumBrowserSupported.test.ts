/** @vitest-environment jsdom */
import { afterEach, describe, expect, it } from 'vitest'
import { isMinimumBrowserSupported } from './isMinimumBrowserSupported'

describe('isMinimumBrowserSupported', () => {
  afterEach(() => {
    if (typeof window !== 'undefined') {
      delete window.__HVCF_MOCK_MINIMUM_BROWSER__
    }
  })

  it('deve retornar boolean com base no suporte a OPFS quando não há mock', () => {
    expect(typeof isMinimumBrowserSupported()).toBe('boolean')
  })

  it('deve respeitar mock negativo (navegador abaixo do suporte mínimo)', () => {
    window.__HVCF_MOCK_MINIMUM_BROWSER__ = false
    expect(isMinimumBrowserSupported()).toBe(false)
  })

  it('deve respeitar mock positivo', () => {
    window.__HVCF_MOCK_MINIMUM_BROWSER__ = true
    expect(isMinimumBrowserSupported()).toBe(true)
  })
})
