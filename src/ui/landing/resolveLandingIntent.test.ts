import { describe, expect, it } from 'vitest'
import { resolveLandingIntent } from './resolveLandingIntent'

describe('resolveLandingIntent', () => {
  it('Experimentar deve abrir o onboarding completo', () => {
    expect(resolveLandingIntent('experimentar', false)).toEqual({ kind: 'onboarding' })
    expect(resolveLandingIntent('experimentar', true)).toEqual({ kind: 'onboarding' })
  })

  it('Já tenho um cofre sem sessão deve abrir só o termo', () => {
    expect(resolveLandingIntent('ja-tenho-cofre', false)).toEqual({ kind: 'import-termo' })
  })

  it('Já tenho um cofre com sessão deve ir para Veículos', () => {
    expect(resolveLandingIntent('ja-tenho-cofre', true)).toEqual({ kind: 'veiculos' })
  })
})
