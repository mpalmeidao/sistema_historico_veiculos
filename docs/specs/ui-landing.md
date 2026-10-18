# Spec: Landing comercial (antes do onboarding)

**Status:** implementado
**Data:** 2026-10-18
**Arquitetura relacionada:** [sistema-historico-veiculos](/docs/architecture/sistema-historico-veiculos.md)
**ADRs relacionados:**
- [ADR-003 — Ionic React como UI kit](/docs/adr/003-ionic-react-como-ui-kit.md)
**Referências de produto:**
- Comportamento de onboarding/termo: [ui-onboarding-termo](/docs/specs/ui-onboarding-termo.md), [onboarding-backup](/docs/specs/onboarding-backup.md)
- Tokens: [design-system-home-veiculos](/docs/specs/design-system-home-veiculos.md)
- Discovery: [discovery-conceitual](/docs/discovery/discovery-conceitual.md)

## Objetivo

Apresentar o produto de forma comercial no primeiro acesso deste aparelho (sem cofre e sem aceite do termo), antes do onboarding educativo e do termo — com CTAs claros para experimentar ou importar um cofre existente.

## Comportamento esperado

### Quando aparece

- Termo ainda **não** aceito **e** nenhum cofre de trabalho no dispositivo (mesmo portão de `showFullOnboarding` em `HomePage`).
- Quem já tem cofre neste aparelho **não** vê a landing (retorna ao fluxo atual: lista de veículos ou TermoGate se prefs sem aceite).

### Chrome

- **Sem** tabs, **sem** sidebar desktop e **sem** banner de ads.
- Header do shell **oculto** nesta view: a própria landing carrega a marca e um único `h1`.

### Conteúdo (seções)

Copy só em `src/shared/i18n/pt-BR.ts`. Fatos alinhados ao produto; sem prometer sincronização, alertas, nuvem gerida pelo app ou login.

1. **Hero** — o que é: histórico de manutenções no próprio aparelho, sem cadastro. CTA primário **“Experimentar”** e secundário **“Já tenho um cofre”**.
2. **Para que serve** — notas perdidas e histórico organizado para consulta e para uma venda.
3. **Como funciona** — cofre no dispositivo, veículos e manutenções com foto da nota (OCR só pré-preenche), relatório PDF e cópia do arquivo `.cofre`.
4. **Vantagens** — sem login, dados no aparelho, nota anexada, relatório para comprovar o histórico, arquivo que você copia para outro lugar.
5. **Grátis** — sem mensalidade e sem cadastro; frase curta de que o uso gratuito inclui um banner fora dos formulários.
6. **Fecho** — os dois CTAs novamente.

O termo jurídico completo **não** aparece na landing — continua só no onboarding e no TermoGate.

### CTAs

| Intenção | Rótulo canônico | Destino |
|----------|-----------------|---------|
| Experimentar | “Experimentar” | `OnboardingFlow` desde a etapa 1 (boas-vindas → dados → termo). Pós-aceite → aba **Ajustes** (criar cofre), inalterado. |
| Já tenho cofre | “Já tenho um cofre” | Sem cofre: só a etapa 3 do onboarding (termo). Pós-aceite → aba **Ajustes** (importar). Com sessão de cofre: aba **Veículos** (a landing nem é exibida nesse caso). |

- Voltar na etapa 1 do onboarding (fluxo Experimentar) retorna à landing; foco no `h1`.
- Voltar na etapa 3 no caminho “Já tenho um cofre” retorna à landing (não à etapa 2).
- Recarregar a página antes do aceite volta à landing. A escolha de CTA **não** persiste em `localStorage`.

### Layout

- Mobile empilhado; desktop: coluna central ~720px (`--hvcf-content-max-landing` ou equivalente).
- Texto corrido perto de 80 caracteres; alvos de toque ≥ 44px; foco visível do tema.
- Sem animação obrigatória.

## Casos de borda

- Recarregar no meio do onboarding (após Experimentar, antes do aceite): volta à landing.
- Zoom 200% / viewport estreito: seções e CTAs operáveis por teclado e toque.
- Navegador sem suporte / OPFS indisponível: `BrowserUnsupportedGate` continua antes de qualquer landing.

## Fora do escopo

- React Router / URLs distintas para landing vs app
- Persistência da intenção de CTA
- Alterar texto jurídico do termo
- Marketing com claims falsos (sync, login, nuvem do app)
- Redesign do TermoGate ou das etapas educativas 1–2 (apenas entrada/saída via landing)

## Critérios de aceite

- [x] Primeiro uso sem cofre e sem termo mostra a landing (não o onboarding direto)
- [x] Landing sem tabs/sidebar/ads; header do shell oculto; um `h1` na página
- [x] Seções hero, para que serve, como funciona, vantagens, grátis e fecho presentes; strings em `pt-BR.ts`
- [x] “Experimentar” abre onboarding na etapa 1; pós-aceite → Ajustes
- [x] “Já tenho um cofre” abre só o termo; voltar → landing; pós-aceite → Ajustes
- [x] Retorno com cofre existente: landing ausente
- [x] Helper E2E de onboarding passa pelo CTA Experimentar; E2E novo cobre landing e os dois caminhos

## Estratégia de teste

- **Unitário:** `resolveLandingIntent` (experimentar → onboarding; já-tenho-cofre com/sem sessão)
- **E2E:** primeiro acesso → landing; Experimentar → etapa 1; Já tenho um cofre → etapa 3 → aceite → Ajustes; retorno com cofre sem landing

## Notas de implementação

- Estado local em `HomePage`: `landing | onboarding | import-termo` enquanto o portão de primeiro uso estiver ativo.
- `OnboardingFlow`: props `initialStep` (1 | 3) e `onExit` para voltar à landing.
- Função pura `resolveLandingIntent` em `src/ui/landing/`.
- Estilos em `components.css` com tokens existentes; coluna `.hvcf-content-col--landing` se necessário.
