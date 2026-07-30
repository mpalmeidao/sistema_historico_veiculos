# Spec: Bootstrap do Projeto

**Status:** rascunho
**Data:** 2026-07-29
**Arquitetura relacionada:** [sistema-historico-veiculos](/docs/architecture/sistema-historico-veiculos.md)
**ADRs relacionados:**
- [ADR-003 — Ionic React como UI kit](/docs/adr/003-ionic-react-como-ui-kit.md)
- [ADR-004 — Cloudflare Pages como hospedagem](/docs/adr/004-cloudflare-pages-como-hospedagem.md)

## Objetivo
Estabelecer a base executável do app (stack, pastas, CI e convenções) para que as demais features do MVP possam ser implementadas sem retrabalho estrutural.

## Comportamento esperado
- O repositório deve iniciar um app React 18+ com Vite, Ionic React e TypeScript.
- A estrutura de pastas deve separar UI, domínio e storage, de forma que nenhum módulo de domínio ou componente chame sql.js diretamente.
- Strings de interface devem ficar isoladas (não hardcoded em componentes), em PT-BR.
- O projeto deve ter linter/formatter configurados e scripts de build, lint e teste.
- O pipeline de CI (GitHub Actions) deve buildar e publicar o frontend estático no Cloudflare Pages a cada push.
- O app deve carregar em navegadores-alvo (incluindo iOS Safari 16.4+) com layout mobile-first Ionic.

## Casos de borda
- Navegador sem suporte mínimo (ex.: Safari abaixo de 16.4): o app deve poder detectar isso nas specs de shell; o bootstrap só precisa deixar o ponto de extensão claro (feature-check).
- Build de produção deve gerar artefatos estáticos compatíveis com Cloudflare Pages (SPA fallback).

## Fora do escopo
- Implementação de cofre, CRUD, OCR, PDF ou onboarding
- Zustand, Redux ou React Query
- Framework de i18n (apenas isolamento de strings)
- Capacitor / wrapper nativo
- Ads reais (só preparação de layout fica na spec de app shell)

## Critérios de aceite
- [x] Projeto Vite + React + TypeScript + Ionic React sobe localmente com `dev` e gera build de produção
- [x] Estrutura de pastas documentada no CONTEXT e alinhada à separação UI / domínio / storage
- [x] Strings de UI isoladas em módulo próprio (sem hardcode em componentes de exemplo)
- [x] ESLint e Prettier (ou equivalente) configurados; script de lint passa no estado inicial
- [x] Testes unitários configurados; convenção `[nome].test.ts` ao lado do arquivo e E2E em `/tests/e2e`
- [x] GitHub Actions faz build e deploy no Cloudflare Pages
- [x] CONTEXT.md atualizado com as convenções definidas nesta spec (pastas, TS, linter)

## Estratégia de teste
- **Unitário:** smoke de utilitários de bootstrap, se houver (ex.: feature-check stub)
- **Integração:** não aplicável nesta spec
- **E2E:** smoke mínimo de que a rota raiz renderiza o shell Ionic

## Notas de implementação
- Stack conforme CONTEXT e ADR-003 / ADR-004
- Não introduzir dependências além das necessárias ao bootstrap
- Após aprovação/implementação, atualizar a seção "Convenções de código" do CONTEXT com a estrutura de pastas e a escolha TypeScript
