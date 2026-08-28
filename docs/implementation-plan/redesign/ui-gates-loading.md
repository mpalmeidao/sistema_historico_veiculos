# Implementation Plan: Gates — unsupported e loading

**Spec:** [ui-gates-loading](/docs/specs/ui-gates-loading.md)
**Status:** pendente
**Data:** 2026-08-28

## Contexto

Alinhar `BrowserUnsupportedGate` e a tela de loading do cofre ao design system, sem mudar `isMinimumBrowserSupported()` nem mocks E2E.

**Pré-requisito:** tokens do DS.

**Ordem no redesign:** último plano desta pasta (após feedback).

## Tarefas

### Fase 1: Unsupported e loading

- [ ] **[1.1]** Redesign `BrowserUnsupportedGate`
  - _O que fazer:_ título “Navegador sem suporte”; orientação para atualizar/substituir; listar Safari 16.4+, Chrome, Edge, Firefox; identidade do app; sem tabs/ads/CTAs irrelevantes; tom de compatibilidade (não perda de dados). Tokens + i18n. Preservar mock `__HVCF_MOCK_MINIMUM_BROWSER__` e testids.
  - _Critério de conclusão:_ critério técnico de suporte inalterado; visual DS

- [ ] **[1.2]** Redesign loading “Abrindo cofre…”
  - _O que fazer:_ na UI de `status === 'loading'`: nome do app, indicador discreto, mensagem “Abrindo cofre…”; sem tabs/ads/ações; tokens.
  - _Critério de conclusão:_ bootstrap continua o mesmo; visual minimalista

### Fase 2: E2E e revisão

- [ ] **[2.1]** E2E / mock unsupported (+ loading se testável)
  - _O que fazer:_ forçar unsupported → tela terminal; ajustar asserts de copy/testids
  - _Critério de conclusão:_ testes passando

- [ ] **[2.2]** Critérios de aceite
  - _O que fazer:_ checklist da spec
  - _Critério de conclusão:_ aceite coberto

## Dependências externas

- `isMinimumBrowserSupported` / mocks já existentes

## Riscos

- Copy nova quebrar asserts literais nos E2E — atualizar na mesma entrega
