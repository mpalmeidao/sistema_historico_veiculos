# Implementation Plan: App Shell / PWA

**Spec:** [app-shell-pwa](/docs/specs/app-shell-pwa.md)
**Status:** concluído
**Data:** 2026-07-29

## Contexto
PWA instalável com cache do shell e do modelo OCR — nunca do cofre. Layout Ionic mobile-first, aviso de suporte mínimo e espaço de ads. Depende do bootstrap; coordena com OCR no cache do `por.traineddata` e com rotas dos demais módulos.

## Tarefas

### Fase 1: PWA e cache
- [x] **[1.1]** Configurar vite-plugin-pwa / Workbox
  - _O que fazer:_ manifest + service worker; cache do app shell (HTML/JS/CSS/WASM da UI); SPA fallback já alinhado ao deploy
  - _Critério de conclusão:_ build gera SW e manifest; critérios básicos de instalabilidade atendidos

- [x] **[1.2]** Política de cache: shell + OCR model, nunca cofre
  - _O que fazer:_ incluir estratégia para `por.traineddata` após primeiro download; garantir que não há runtime caching de OPFS/arquivos `.cofre`
  - _Critério de conclusão:_ teste/unitário ou inspeção da config confirma o que entra e o que não entra no cache

- [x] **[1.3]** Coordenar aviso de tamanho do modelo OCR
  - _O que fazer:_ ponto de integração com spec OCR (aviso antes do download); falha de cache do modelo não derruba o shell
  - _Critério de conclusão:_ shell utilizável mesmo se modelo falhar; documentação cruzada com plan OCR

### Fase 2: Layout e suporte
- [x] **[2.1]** Navegação mobile-first (tabs/áreas principais)
  - _O que fazer:_ rotas/áreas: cofre, veículos, manutenções, configurações/backup; safe-area; placeholders se módulos ainda não existirem
  - _Critério de conclusão:_ navegação não quebra em viewport mobile

- [x] **[2.2]** Espaço reservado para banner de ads
  - _O que fazer:_ área fixa fora dos fluxos de cadastro; altura reservada (sem layout shift futuro); sem AdSense real no MVP
  - _Critério de conclusão:_ layout reserva o espaço; fluxos de cadastro não incluem o banner

- [x] **[2.3]** Aviso de navegador abaixo do suporte mínimo
  - _O que fazer:_ feature-check OPFS / Safari 16.4+; exibir aviso para atualizar em vez de operar como se persistência fosse confiável
  - _Critério de conclusão:_ teste unitário do check; UI de aviso quando suporte insuficiente (incluindo simulação)

### Fase 3: Testes
- [x] **[3.1]** Integração: build PWA gera SW e manifest esperados
  - _O que fazer:_ assert no artefato de build ou config
  - _Critério de conclusão:_ CI/local valida presença dos artefatos

- [x] **[3.2]** E2E: viewport mobile + aviso com suporte simulado insuficiente
  - _O que fazer:_ carregar app; mockar feature-check negativo
  - _Critério de conclusão:_ E2E passa

### Fase 4: Revisão
- [x] **[4.1]** Verificar critérios de aceite da spec app-shell-pwa
- [x] **[4.2]** Atualizar CONTEXT.md se rotas, estratégia Workbox ou política de ads reservados forem fixadas

## Dependências externas
- `vite-plugin-pwa`
- Bootstrap Vite/Ionic
- Hospedagem Cloudflare Pages (HTTPS) para instalabilidade real em dispositivos

## Riscos
- Cache agressivo pode servir shell velho após deploy — configurar update strategy simples no MVP
- Nunca cachear dados do usuário: revisar Workbox runtimeCaching em todo PR que toque PWA
