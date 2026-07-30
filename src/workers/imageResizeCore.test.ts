import { describe, expect, it } from 'vitest'
import {
  MAX_IMAGE_SIDE_PX,
  TARGET_IMAGE_MAX_BYTES,
  computeTargetDimensions,
  jpegQualitySteps,
  meetsSizeTarget,
} from './imageResizeCore'

describe('computeTargetDimensions', () => {
  it('deve manter dimensões quando já ≤ 1600 px no lado maior', () => {
    expect(computeTargetDimensions(800, 600)).toEqual({ width: 800, height: 600 })
    expect(computeTargetDimensions(1600, 900)).toEqual({ width: 1600, height: 900 })
  })

  it('deve limitar o lado maior a 1600 px preservando proporção', () => {
    expect(computeTargetDimensions(3200, 1800)).toEqual({ width: 1600, height: 900 })
    expect(computeTargetDimensions(1000, 4000)).toEqual({ width: 400, height: 1600 })
  })

  it('deve usar maxSide customizado', () => {
    expect(computeTargetDimensions(2000, 1000, 1000)).toEqual({ width: 1000, height: 500 })
  })
})

describe('jpegQualitySteps', () => {
  it('deve começar em ~80% e descer até o mínimo', () => {
    const steps = jpegQualitySteps()
    expect(steps[0]).toBe(0.8)
    expect(steps.at(-1)).toBe(0.5)
    expect(steps).toContain(0.7)
  })
})

describe('meetsSizeTarget', () => {
  it('deve indicar se cabe no alvo de 500 KB', () => {
    expect(meetsSizeTarget(TARGET_IMAGE_MAX_BYTES)).toBe(true)
    expect(meetsSizeTarget(TARGET_IMAGE_MAX_BYTES + 1)).toBe(false)
    expect(meetsSizeTarget(100)).toBe(true)
    expect(MAX_IMAGE_SIDE_PX).toBe(1600)
  })
})
