# Implementation Plan: Onboarding, TermoGate e modal do termo

**Spec:** [ui-onboarding-termo](/docs/specs/ui-onboarding-termo.md)
**Status:** concluído
**Data:** 2026-08-28

## Contexto

Reorganizar `OnboardingFlow` em 3 etapas, alinhar `TermoGate` e `TermoModal` ao DS, sem alterar `TERMO_ISENCAO_*` nem prefs de aceite.

**Pré-requisito:** tokens do DS. Reutilizar espírito de progresso do wizard de manutenção se já implementado.

**Ordem no redesign:** após [ui-veiculo-form](./ui-veiculo-form.md).

## Tarefas

### Fase 1: i18n e onboarding em etapas

- [x] **[1.1]** Strings i18n do onboarding em 3 etapas
  - _O que fazer:_ títulos/corpos das etapas 1–2, progresso “N de 3”, “Continuar”, “Antes de começar”, hints de recusa (se mudarem). Texto legal **não** vai para i18n genérico — continua em `termoIsencao.ts`.
  - _Critério de conclusão:_ copy educativa só em `pt-BR.ts`; termo canônico intacto

- [x] **[1.2]** `OnboardingFlow` em 3 steps
  - _O que fazer:_ etapa 1 boas-vindas + visual veículo→histórico→manutenção; etapa 2 dados locais + backup; etapa 3 termo completo rolável + checkbox + “Aceitar e continuar” desabilitado sem aceite. Sem tabs/ads. Pós-aceite → tab Ajustes. Voltar entre etapas; preservar checkbox se possível.
  - _Critério de conclusão:_ mesmo contrato de prefs/aceite; E2E de primeiro uso atualizável

### Fase 2: TermoGate e modal

- [x] **[2.1]** Alinhar `TermoGate` ao DS
  - _O que fazer:_ “Aceite necessário”, explicação curta, termo completo, checkbox + CTA; sem etapas 1–2; sem tabs/ads. Tokens.
  - _Critério de conclusão:_ cofre existente sem aceite ainda bloqueia até aceitar

- [x] **[2.2]** Alinhar `TermoModal`
  - _O que fazer:_ header “Termo de isenção”, Fechar, conteúdo rolável confortável em celular; somente leitura; texto canônico.
  - _Critério de conclusão:_ aberto a partir de Ajustes; sem alteração jurídica

### Fase 3: E2E e revisão

- [x] **[3.1]** E2E onboarding / TermoGate / modal
  - _O que fazer:_ 3 etapas → aceite → Ajustes; CTA desabilitado sem checkbox; TermoGate; abrir/fechar modal
  - _Critério de conclusão:_ E2E passando

- [x] **[3.2]** Critérios de aceite
  - _O que fazer:_ checklist da spec
  - _Critério de conclusão:_ aceite coberto

## Dependências externas

- `TERMO_ISENCAO_*` e `appPrefs` existentes

## Riscos

- Condensar copy da etapa 2 demais e omitir responsabilidade de backup — validar contra [onboarding-backup](/docs/specs/onboarding-backup.md)
- CTA + checkbox fora da viewport no termo longo — layout com scroll consciente
