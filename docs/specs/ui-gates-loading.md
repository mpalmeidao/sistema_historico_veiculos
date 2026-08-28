# Spec: Gates — navegador sem suporte e loading

**Status:** rascunho
**Data:** 2026-08-28
**Arquitetura relacionada:** [sistema-historico-veiculos](/docs/architecture/sistema-historico-veiculos.md)
**ADRs relacionados:**
- [ADR-001 — OPFS como armazenamento de trabalho](/docs/adr/001-opfs-como-armazenamento-de-trabalho.md)
- [ADR-003 — Ionic React como UI kit](/docs/adr/003-ionic-react-como-ui-kit.md)
**Referências de produto:**
- Redesign UX/UI (seções Navegador sem suporte, Loading)
- Tokens: [design-system-home-veiculos](/docs/specs/design-system-home-veiculos.md)
- Shell: [app-shell-pwa](/docs/specs/app-shell-pwa.md)
- Inventário: [ux-ui-inventario-telas.md](/docs/ux-ui-inventario-telas.md) §3.1–3.2

## Objetivo

Alinhar as telas terminais de compatibilidade e de espera ao design system — transmitindo limitação de navegador (não perda de dados) e loading minimalista — sem mudar o critério técnico de suporte (OPFS / Safari 16.4+).

## Comportamento esperado

### A. Navegador sem suporte (`BrowserUnsupportedGate`)

**Quando:** `isMinimumBrowserSupported()` falso (OPFS indisponível ou abaixo do mínimo).

1. Título: **“Navegador sem suporte”**
2. Explicar que o navegador precisa ser atualizado ou substituído.
3. Informar suporte: **Safari 16.4+**, **Chrome**, **Edge**, **Firefox**.
4. Identidade discreta do app (nome), alinhada ao DS.
5. **Não** mostrar: tabs, ads, CTAs irrelevantes (criar veículo, etc.).
6. Tom: limitação de **compatibilidade**, não “seus dados sumiram”.

Critério de detecção e mock E2E (`__HVCF_MOCK_MINIMUM_BROWSER__`) inalterados.

### B. Loading do cofre

**Quando:** status de abertura do cofre / bootstrap (`loading`).

1. Identidade: **“Histórico de Veículos”**
2. Indicador de progresso discreto (spinner/atividade)
3. Mensagem: **“Abrindo cofre…”**
4. **Sem** tabs, ads ou ações
5. Visual minimalista com tokens do DS (fundo, tipografia)

### Contrato funcional preservado

- Mesmas condições de entrada nas gates
- Sem novos browsers suportados além do mínimo já definido
- Sem retry inventado que contorne OPFS ausente

## Casos de borda

- Gate unsupported é terminal na sessão até o ambiente mudar (atualizar navegador / outro browser).
- Loading longo em aparelho lento: mensagem permanece; UI não sugere ações falsas.
- Zoom / leitores de tela: título e mensagem anunciáveis.

## Fora do escopo

- Polyfill de OPFS
- Tela de “atualize o app” via service worker (fora deste redesign)
- Onboarding (spec [ui-onboarding-termo](/docs/specs/ui-onboarding-termo.md))

## Critérios de aceite

- [ ] Unsupported: título, orientação, lista de browsers, sem tabs/ads, tom de compatibilidade
- [ ] Loading: nome do app + “Abrindo cofre…” + indicador discreto, sem tabs/ads
- [ ] Critérios técnicos de suporte inalterados
- [ ] Tokens do DS; strings em `pt-BR.ts`
- [ ] E2E/mocks de unsupported (se existirem) atualizados e passando

## Estratégia de teste

- **E2E / mock:** forçar unsupported → ver tela terminal; loading visível no bootstrap se testável
- **Unitário:** `isMinimumBrowserSupported` já coberto — não reabrir regra aqui

## Notas de implementação

- Arquivos: `BrowserUnsupportedGate.tsx`, estado loading em `HomePage` / shell.
- Trocar visual; preservar `data-testid` e mocks.
