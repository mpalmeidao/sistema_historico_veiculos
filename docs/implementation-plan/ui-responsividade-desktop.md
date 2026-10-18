# Implementation Plan: Responsividade desktop (sidebar)

**Spec:** [ui-responsividade-desktop](/docs/specs/ui-responsividade-desktop.md)
**Status:** concluído
**Data:** 2026-08-28

## Contexto

Estender o shell mobile-first com chrome desktop (≥992px): sidebar no lugar da tab bar, ads no rodapé da área de conteúdo e colunas de max-width para listas (~780px) e forms/gates (~600px). Domínio, navegação sem React Router e regras de `showTabs`/`showAds` permanecem. Ordem: tokens/constante → sidebar + shell → colunas por superfície → a11y/foco → E2E → revisão/CONTEXT.

## Tarefas

### Fase 1: Fundação (tokens e constante)

- [x] **[1.1]** Constante de breakpoint desktop
  - _O que fazer:_ expor `DESKTOP_MIN_WIDTH_PX = 992` (ex.: `src/shared/layout/breakpoints.ts` ou junto ao shell) + teste unitário simples do valor exportado. Espelhar o mesmo número em CSS (`tokens.css` / custom property `--hvcf-breakpoint-desktop: 992px`) para media queries.
  - _Critério de conclusão:_ TS e CSS usam o mesmo 992; teste unitário passa; mobile (&lt;992) não é afetado por esta tarefa sozinha

- [x] **[1.2]** Tokens de layout desktop
  - _O que fazer:_ em `src/ui/theme/tokens.css` (e/ou `components.css`), definir variáveis de max-width: lista/home ~780px (`--hvcf-content-max-list`), form/gates ~600px (`--hvcf-content-max-form`); utilitários de coluna centralizada (ex.: `.hvcf-content-col--list`, `.hvcf-content-col--form`) ativos via media query ≥992px. Padding desktop um pouco maior se necessário. Sem nova paleta.
  - _Critério de conclusão:_ classes/utilitários disponíveis; em viewport largo o conteúdo não estica full-bleed quando aplicadas

- [x] **[1.3]** i18n da navegação lateral (se necessário)
  - _O que fazer:_ rótulos das tabs já existem (`strings.shell.tabs.*`); adicionar só o que faltar (ex.: `aria-label` da landmark `nav` da sidebar) em `src/shared/i18n/pt-BR.ts`, sem hardcode.
  - _Critério de conclusão:_ nenhuma string nova de UI fora de `pt-BR.ts`

### Fase 2: Shell desktop (sidebar + ads)

- [x] **[2.1]** Componente `AppSidebar`
  - _O que fazer:_ criar `src/ui/shell/AppSidebar.tsx` reutilizando `APP_TABS` / `AppTabId`, ícones e labels da tab bar; `data-testid="app-sidebar"`; itens com `data-testid` espelhando tabs (`sidebar-veiculos` etc. ou reutilizar padrão claro); landmark `nav`; item ativo com cor primária + indicador; `onTabChange` idêntico ao da tab bar. Exportar em `src/ui/shell/index.ts`.
  - _Critério de conclusão:_ componente renderiza 3 destinações; teclado ativa troca de tab; Label in Name ok

- [x] **[2.2]** Integrar sidebar e ocultar tab bar no desktop
  - _O que fazer:_ em `HomePage` / `AppShellFooter` (ou layout wrapper): quando `showTabs`, renderizar sidebar + área de conteúdo; via CSS ≥992px mostrar sidebar e esconder `app-tab-bar` (e o contrário &lt;992). Preferir media query + markup sempre presente (com `showTabs`) em vez de JS de resize. Estado `tab`/`view` inalterado ao cruzar o breakpoint.
  - _Critério de conclusão:_ ≥992 + tabs visíveis → sidebar sim, tab bar não; &lt;992 → tab bar sim, sidebar não; onboarding/TermoGate sem ambos

- [x] **[2.3]** Ads no rodapé da área de conteúdo (desktop)
  - _O que fazer:_ manter `showAds` e placeholder 50px; no desktop o banner fica no rodapé da coluna/área à direita da sidebar (não sob a sidebar). Em mobile, permanece no `IonFooter` como hoje. Mesmas regras de ocultação em cadastro/onboarding/gates.
  - _Critério de conclusão:_ desktop: ads (quando `showAds`) à direita da sidebar; form de veículo/manutenção sem ads; mobile regressão ok

- [x] **[2.4]** Foco ao trocar tab pela sidebar
  - _O que fazer:_ ao `onTabChange` vindo da sidebar, mover foco para o título principal / H1 / região principal da view (ex.: `tabindex={-1}` + `focus()` no heading ou `data-testid` de painel). Respeitar `prefers-reduced-motion` (sem animação obrigatória).
  - _Critério de conclusão:_ após Tab via sidebar, foco não fica “preso” no item da nav; região principal recebe foco

### Fase 3: Colunas por superfície

- [x] **[3.1]** Coluna lista (~780px) na home, histórico e pick
  - _O que fazer:_ aplicar utilitário `--list` em `VeiculosList` / home, `ManutencoesList` / histórico, empty pick de veículo e empty states de lista. Stats strip pode ganhar gap maior só no desktop. Cards sem full-bleed.
  - _Critério de conclusão:_ em 1280px de largura, conteúdo útil dessas telas na faixa 720–840px e centrado

- [x] **[3.2]** Coluna form (~600px) em forms, Ajustes, onboarding e gates
  - _O que fazer:_ aplicar utilitário `--form` em `VeiculoForm`, `ManutencaoForm` (+ anexos), `AjustesBackupPanel`, `OnboardingFlow`, `TermoGate`, `BrowserUnsupportedGate`, `CofreLoadingGate`. Modal de termo: largura coerente / scroll consciente. Toast global permanece legível sobre a área de conteúdo.
  - _Critério de conclusão:_ em desktop, essas superfícies na faixa 560–640px; mobile inalterado em comportamento

### Fase 4: Testes

- [x] **[4.1]** E2E shell — viewport mobile (regressão)
  - _O que fazer:_ em `tests/e2e/shell.e2e.ts` (ou novo arquivo), viewport ~390×844: após onboarding, `app-tab-bar` visível; sidebar ausente; ads conforme regras atuais.
  - _Critério de conclusão:_ E2E mobile passando

- [x] **[4.2]** E2E shell — viewport desktop
  - _O que fazer:_ viewport ≥992 (ex.: 1280×800): após onboarding, sidebar com 3 itens visível; `app-tab-bar` ausente; trocar tab pela sidebar muda painel; abrir lista (home) e um form confirma layout utilizável; em form, ads ocultos; ads (quando visíveis) não ficam sob a sidebar.
  - _Critério de conclusão:_ E2E desktop passando; critérios de aceite de chrome/ads cobertos

- [x] **[4.3]** Smoke E2E gates sem chrome de nav
  - _O que fazer:_ unsupported gate (mock) e/ou fluxo antes de tabs: sem sidebar e sem tab bar em desktop e mobile.
  - _Critério de conclusão:_ gate sem chrome de tabs/sidebar

### Fase 5: Revisão

- [x] **[5.1]** Checklist de critérios de aceite da spec
  - _O que fazer:_ percorrer todos os itens de aceite em [ui-responsividade-desktop](/docs/specs/ui-responsividade-desktop.md); teclado na sidebar; resize atravessando 992px sem perder `tab`/`view`.
  - _Critério de conclusão:_ aceite coberto ou gaps listados e corrigidos

- [x] **[5.2]** Atualizar CONTEXT.md e status da spec
  - _O que fazer:_ registrar convenção de shell desktop (breakpoint 992, sidebar, colunas) na seção UI do [CONTEXT.md](/docs/CONTEXT.md); marcar spec como `implementado` quando o aceite estiver ok.
  - _Critério de conclusão:_ CONTEXT reflete a convenção; spec status atualizado

## Dependências externas

- Nenhuma lib nova; Ionic React (ADR-003) e tokens existentes

## Riscos

- **IonFooter + sidebar:** layout Ionic pode exigir wrapper flex (sidebar | main) em vez de só CSS no footer — validar cedo na 2.2
- **Markup duplicado tab bar + sidebar:** ambos no DOM com show/hide via CSS evita flicker de resize; garantir que o item oculto não fique focável (`visibility`/`inert` ou `display` + fora do tab order)
- **E2E `openTab`:** helper atual usa tab bar — desktop precisa clicar na sidebar (estender helper ou branch por viewport)
