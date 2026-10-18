export type LandingCta = 'experimentar' | 'ja-tenho-cofre'

export type LandingDestination =
  { kind: 'onboarding' } | { kind: 'import-termo' } | { kind: 'veiculos' }

/**
 * Destino dos CTAs da landing.
 * Com sessão de cofre, “Já tenho um cofre” → Veículos (a landing normalmente
 * nem é exibida nesse caso — a função documenta o contrato).
 */
export function resolveLandingIntent(cta: LandingCta, hasSession: boolean): LandingDestination {
  if (cta === 'experimentar') {
    return { kind: 'onboarding' }
  }
  if (hasSession) {
    return { kind: 'veiculos' }
  }
  return { kind: 'import-termo' }
}
