# Spec: Responsividade desktop (sidebar)

**Status:** implementado
**Data:** 2026-08-28
**Arquitetura relacionada:** [sistema-historico-veiculos](/docs/architecture/sistema-historico-veiculos.md)
**ADRs relacionados:**
- [ADR-003 — Ionic React como UI kit](/docs/adr/003-ionic-react-como-ui-kit.md)
**Referências de produto:**
- Inventário funcional: [ux-ui-inventario-telas.md](/docs/ux-ui-inventario-telas.md)
- Shell / PWA (baseline mobile): [app-shell-pwa](/docs/specs/app-shell-pwa.md)
- Design system / home: [design-system-home-veiculos](/docs/specs/design-system-home-veiculos.md)
- Specs UI de redesign: [ui-manutencoes-historico](/docs/specs/ui-manutencoes-historico.md), [ui-manutencao-form](/docs/specs/ui-manutencao-form.md), [ui-veiculo-form](/docs/specs/ui-veiculo-form.md), [ui-ajustes-backup](/docs/specs/ui-ajustes-backup.md), [ui-onboarding-termo](/docs/specs/ui-onboarding-termo.md), [ui-empty-states](/docs/specs/ui-empty-states.md), [ui-feedback-overlays](/docs/specs/ui-feedback-overlays.md), [ui-gates-loading](/docs/specs/ui-gates-loading.md)
- Tokens: `src/ui/theme/tokens.css`, `src/ui/theme/components.css`

## Objetivo

Melhorar o aspecto visual e a densidade do app em viewports desktop, sem abandonar o mobile-first: em monitores largos o chrome passa a sidebar + coluna de conteúdo limitada, em vez de esticar o layout de celular em largura total.

## Comportamento esperado

Esta spec **estende** o shell descrito em [app-shell-pwa](/docs/specs/app-shell-pwa.md). Abaixo do breakpoint desktop, o comportamento atual permanece a fonte de verdade. Regras de domínio, navegação sem React Router e strings em `pt-BR.ts` **não mudam**.

### A. Breakpoint único

- **Desktop:** viewport com largura ≥ **992px**.
- **Mobile chrome (inclui tablet):** viewport &lt; 992px — tab bar inferior, ads no footer do shell e conteúdo em largura fluida como hoje.

Não há breakpoint intermediário nesta iteração.

### B. Chrome desktop (sidebar)

Quando o viewport é desktop **e** as tabs estariam visíveis pelas mesmas regras atuais (`showTabs` — ocultas no onboarding completo / TermoGate, etc.):

1. Aparece uma **sidebar fixa à esquerda** com as três destinações atuais: Veículos | Manutenções | Ajustes (mesmos `AppTabId`, ícones e rótulos i18n da tab bar).
2. O item da tab ativa mostra indicação visual equivalente à tab bar (cor primária + indicador).
3. A **tab bar inferior fica oculta**.
4. Trocar item na sidebar tem o **mesmo efeito** de trocar tab hoje (estado `tab` em `HomePage`; sem URLs novas).
5. Em views aninhadas (`veiculo-form`, `manutencoes`, `manutencao-form`), o **voltar** no header (`header-back`) continua igual; a sidebar permanece disponível quando as tabs estariam disponíveis.

Quando as tabs **não** estariam visíveis (onboarding completo, TermoGate, etc.), a sidebar também **não** aparece — o conteúdo ocupa a área útil sem chrome de navegação principal.

```
┌──────────┬────────────────────────────────────┐
│ Sidebar  │  Header (voltar se aninhado)       │
│ Veículos │────────────────────────────────────│
│ Manut.   │                                    │
│ Ajustes  │     Coluna de conteúdo (max-width) │
│          │                                    │
│          │────────────────────────────────────│
│          │  [Ads 50px — se showAds]           │
└──────────┴────────────────────────────────────┘
```

### C. Banner de ads no desktop

- Altura reservada **50px** e **mesmas condições de visibilidade** atuais (visível com cofre + termo aceito; **oculto** em formulário de veículo/manutenção, onboarding e gates).
- No desktop, o banner fica no **rodapé da área de conteúdo** (à direita da sidebar), não atrás/abaixo da sidebar — evita empurrar a nav lateral e preserva o espaço reservado sem layout shift quando ads forem ligados.

### D. Coluna de conteúdo (todas as telas)

Dentro da área à direita da sidebar (ou em viewport mobile, como hoje), o conteúdo principal **não** estica em monitores ultra-largos:

| Tipo de superfície | Largura máxima do conteúdo útil | Alinhamento |
|--------------------|----------------------------------|-------------|
| Listas / home / histórico / pick de veículo / empty de lista | **780px** (±60px aceitável na implementação, faixa 720–840px) | centralizado horizontalmente na área de conteúdo |
| Formulários (veículo, manutenção/wizard, anexos), Ajustes, onboarding, TermoGate, gates de loading/unsupported | **600px** (±40px, faixa 560–640px) | centralizado |

- Padding horizontal/vertical no desktop pode ser um pouco maior que no mobile; tipografia e cores reutilizam tokens `--hvcf-*` — **sem nova paleta**.
- Grids já existentes (ex.: faixa de stats em 3 colunas) podem aumentar gap/tamanho no desktop sem mudar o significado dos dados.
- Cards, empty states e blocos de feedback alinhados à mesma coluna — sem full-bleed descontrolado na área de conteúdo.

### E. Cobertura por superfície

| Grupo | Telas | Expectativa no desktop |
|-------|--------|-------------------------|
| Shell | sidebar, header, ads, toast | chrome lateral; toast permanece global e legível sobre a área de conteúdo |
| Listas | home veículos, histórico, pick veículo | coluna ~780px; cards sem esticar full-bleed |
| Forms | veículo, manutenção (wizard), anexos | coluna ~600px; CTAs e steps legíveis |
| Ajustes | Backup e dados | coluna ~600px; card do cofre |
| Gates / loading | unsupported, loading cofre, TermoGate | mensagem/CTA na coluna ~600px |
| Onboarding / termo | fluxo + modal de termo | coluna ~600px; scroll consciente no termo longo |
| Empty / feedback | EmptyState, FeedbackToast | alinhados à coluna da superfície onde aparecem |

Comportamento funcional de cada tela continua nas specs `ui-*` / domínio correspondentes.

### F. Acessibilidade (WCAG 2.2 AA — perfil Standard)

- Sidebar: operável só por teclado; landmark de navegação (`nav` ou equivalente com semântica correta); nome acessível de cada item **contém** o rótulo visível (SC 2.5.3).
- Ao trocar de tab via sidebar, o foco não se perde: vai para o título principal / H1 ou região principal da view aberta.
- Viewport &lt; 992px e zoom 200%: sem scroll bidimensional obrigatório; CTAs e nav permanecem operáveis.
- Não exigir animações na sidebar; respeitar `prefers-reduced-motion` já no tema.

## Casos de borda

- **Redimensionar atravessando 992px:** chrome troca entre tab bar e sidebar sem quebrar estado de tab/view; conteúdo permanece na view atual.
- **Onboarding / TermoGate / unsupported:** sem sidebar nem tab bar; coluna de conteúdo limitada no desktop.
- **Views aninhadas com `showAds` falso:** sidebar (se tabs visíveis) + header voltar; sem banner.
- **Viewport exatamente 992px:** trata-se como desktop (≥).
- **Monitor muito largo:** coluna limitada centrada; laterais da área de conteúdo usam o fundo do app (`--hvcf-color-bg`), sem esticar cards.

## Fora do escopo

- Trocar Ionic ou introduzir segundo UI kit
- React Router / URLs por tela
- Layout multi-coluna de conteúdo (lista + detalhe lado a lado)
- Breakpoints intermediários além do único desktop (tablet = mobile chrome)
- Mudança de regras de domínio, backup, OCR, PWA/cache
- Ads reais (AdSense etc.) — só o placeholder reservado
- File System Access API / vínculo a arquivo em disco
- Dark mode
- Alterar copy, fluxos ou critérios de aceite das specs `ui-*` de comportamento (exceto o layout responsivo desta spec)

## Critérios de aceite

- [x] Em viewport ≥ 992px com tabs visíveis: sidebar com Veículos, Manutenções e Ajustes; tab bar inferior **ausente**
- [x] Em viewport &lt; 992px: tab bar presente (quando `showTabs`); sidebar **ausente**
- [x] Trocar item na sidebar altera a tab com o mesmo efeito da tab bar atual
- [x] Em desktop, listas/home/histórico respeitam coluna de conteúdo na faixa 720–840px; forms/Ajustes/onboarding/gates na faixa 560–640px
- [x] Banner ads 50px: mesmas regras de exibição; no desktop, no rodapé da área de conteúdo (não sob a sidebar)
- [x] Onboarding / TermoGate / unsupported: sem sidebar; conteúdo na coluna limitada em desktop
- [x] `header-back` em views aninhadas continua funcional; navegação sem React Router
- [x] Sidebar operável por teclado; item ativo distinguível; foco após troca de tab vai para região principal/título
- [x] Strings novas (se houver, ex. `aria-label` da nav) só em `src/shared/i18n/pt-BR.ts`
- [x] E2E: viewport desktop (≥992) verifica sidebar presente e tab bar ausente; viewport mobile verifica tab bar presente e sidebar ausente; pelo menos uma lista e um form abrem sem regressão óbvia de layout

## Estratégia de teste

- **Unitário:** constante/helper de breakpoint (ex.: `DESKTOP_MIN_WIDTH_PX = 992`) se a lógica não for só CSS; caso contrário, cobertura via E2E
- **Integração:** não obrigatória além do shell já coberto
- **E2E (Playwright):**
  - viewport mobile (ex.: 390×844): `app-tab-bar` visível (fluxo normal); sidebar ausente
  - viewport desktop (ex.: 1280×800): sidebar visível com 3 itens; `app-tab-bar` ausente; abrir home e um formulário confirma coluna utilizável
  - atravessar onboarding/gate: sem chrome de tabs/sidebar conforme regras atuais

## Notas de implementação

- Manter ADR-003: tema/CSS sobre Ionic; sidebar pode reutilizar `APP_TABS` / `AppTabId` de `src/ui/shell/tabs.ts`.
- Preferir media query CSS + markup no shell (`HomePage` / `AppShellFooter` / novo componente de sidebar) em vez de JS de resize, salvo necessidade de a11y/foco.
- Tokens em `src/ui/theme/`; não hardcodar strings de UI.
- Após implementação, se a convenção de shell desktop ficar fixa, atualizar a seção UI do [CONTEXT.md](/docs/CONTEXT.md) conforme “Quando atualizar este arquivo”.
`)