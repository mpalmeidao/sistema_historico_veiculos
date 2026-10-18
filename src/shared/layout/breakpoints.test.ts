import { describe, expect, it } from 'vitest'
import { DESKTOP_MIN_WIDTH_PX } from './breakpoints'

describe('DESKTOP_MIN_WIDTH_PX', () => {
  it('deve ser 992 para o breakpoint desktop único da spec', () => {
    expect(DESKTOP_MIN_WIDTH_PX).toBe(992)
  })
})
