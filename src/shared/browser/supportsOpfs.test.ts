import { describe, expect, it } from 'vitest'
import { supportsOpfs } from './supportsOpfs'

describe('supportsOpfs', () => {
  it('deve retornar boolean indicando se getDirectory está disponível', () => {
    const result = supportsOpfs()
    expect(typeof result).toBe('boolean')
  })

  it('deve retornar false quando navigator.storage.getDirectory não existe', () => {
    const original = globalThis.navigator
    Object.defineProperty(globalThis, 'navigator', {
      configurable: true,
      value: { storage: {} },
    })

    try {
      expect(supportsOpfs()).toBe(false)
    } finally {
      Object.defineProperty(globalThis, 'navigator', {
        configurable: true,
        value: original,
      })
    }
  })
})
