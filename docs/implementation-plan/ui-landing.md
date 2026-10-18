# Implementation Plan: Landing comercial (antes do onboarding)

**Spec:** [ui-landing](/docs/specs/ui-landing.md)
**Status:** concluído
**Data:** 2026-10-18

## Contexto

Inserir landing comercial no primeiro acesso (sem cofre, sem termo), antes do `OnboardingFlow`. CTAs: Experimentar → onboarding completo; Já tenho um cofre → só termo → Ajustes.

## Tarefas

### Fase 1: Spec e intenção

- [x] **[1.1]** Spec e este checklist
  - _Critério de conclusão:_ docs em `/docs/specs` e `/docs/implementation-plan`

- [x] **[1.2]** `resolveLandingIntent` + teste unitário
  - _O que fazer:_ função pura em `src/ui/landing/resolveLandingIntent.ts`; experimentar → onboarding; já-tenho-cofre com sessão → veículos; sem sessão → termo (depois Ajustes)
  - _Critério de conclusão:_ unitário cobre os três destinos

### Fase 2: UI e integração

- [x] **[2.1]** Strings i18n da landing
  - _O que fazer:_ bloco `landing` em `pt-BR.ts` (hero, seções, CTAs)
  - _Critério de conclusão:_ nenhum texto hardcoded no componente

- [x] **[2.2]** `LandingPage` + CSS
  - _O que fazer:_ `src/ui/landing/LandingPage.tsx`; seções da spec; tokens; coluna ~720px desktop
  - _Critério de conclusão:_ CTAs com `data-testid`; um `h1`

- [x] **[2.3]** `OnboardingFlow`: `initialStep` + `onExit`
  - _O que fazer:_ etapa inicial 1 ou 3; voltar da etapa 1 ou da etapa 3 (caminho import) chama `onExit`
  - _Critério de conclusão:_ caminho import não mostra etapas 1–2

- [x] **[2.4]** Integrar em `HomePage`
  - _O que fazer:_ estado `landing | onboarding | import-termo`; ocultar header na landing; sem tabs/ads
  - _Critério de conclusão:_ portão `showFullOnboarding` exibe landing primeiro

### Fase 3: Testes e CONTEXT

- [x] **[3.1]** Helper E2E + testes de landing
  - _O que fazer:_ `acceptOnboarding` clica Experimentar; E2E novo cobre landing e Já tenho um cofre
  - _Critério de conclusão:_ E2E passando

- [x] **[3.2]** Atualizar CONTEXT.md
  - _O que fazer:_ nota no bloco onboarding: landing precede onboarding completo
  - _Critério de conclusão:_ CONTEXT alinhado

## Dependências externas

- `OnboardingFlow`, `appPrefs`, portão de cofre em `HomePage`

## Riscos

- E2E que esperam onboarding imediato no load — atualizar helper
- Progresso “3 de 3” no caminho import: aceitável (mesma etapa 3 do fluxo completo)
