import { describe, expect, it } from 'vitest'
import { supportsFileSystemAccess } from './supportsFileSystemAccess'

describe('supportsFileSystemAccess', () => {
  it('deve retornar boolean', () => {
    expect(typeof supportsFileSystemAccess()).toBe('boolean')
  })

  it('deve retornar false quando showSaveFilePicker não existe', () => {
    const original = globalThis.window
    Object.defineProperty(globalThis, 'window', {
      configurable: true,
      value: {},
    })

    try {
      expect(supportsFileSystemAccess()).toBe(false)
    } finally {
      Object.defineProperty(globalThis, 'window', {
        configurable: true,
        value: original,
      })
    }
  })
})
