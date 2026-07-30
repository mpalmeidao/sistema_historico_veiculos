# Implementation Plan: Bootstrap do Projeto

**Spec:** [bootstrap-projeto](/docs/specs/bootstrap-projeto.md)
**Status:** concluído
**Data:** 2026-07-29

## Contexto
Base executável do MVP: Vite + React + TypeScript + Ionic, pastas UI/domínio/storage, lint/teste e CI no Cloudflare Pages. Deve vir primeiro — todas as outras specs dependem desta estrutura.

## Tarefas

### Fase 1: Scaffold e estrutura
- [x] **[1.1]** Criar app Vite + React 18+ + TypeScript
  - _O que fazer:_ inicializar o projeto com Vite (template React-TS), scripts `dev`, `build` e `preview` funcionando
  - _Critério de conclusão:_ `npm run dev` sobe localmente e `npm run build` gera artefatos estáticos sem erro

- [x] **[1.2]** Adicionar Ionic React e shell mínimo
  - _O que fazer:_ instalar Ionic React, configurar `setupIonicReact`, renderizar uma página raiz com layout mobile-first
  - _Critério de conclusão:_ rota raiz exibe shell Ionic (IonApp/IonPage) no navegador

- [x] **[1.3]** Definir e criar estrutura de pastas UI / domínio / storage
  - _O que fazer:_ criar árvore alinhada à arquitetura (ex.: `src/ui`, `src/domain`, `src/storage`, `src/shared` ou equivalente documentado); deixar claro onde ficam workers, hooks e strings
  - _Critério de conclusão:_ pastas existem; nenhum módulo de domínio/UI importa sql.js (ainda sem sql.js); estrutura descrita em comentário breve ou README interno mínimo se necessário

### Fase 2: Convenções e qualidade
- [x] **[2.1]** Isolar strings de UI em módulo próprio (PT-BR)
  - _O que fazer:_ criar módulo de strings (ex.: `src/shared/i18n/pt-BR.ts` ou similar); substituir textos hardcoded do shell de exemplo por chaves desse módulo
  - _Critério de conclusão:_ componentes de exemplo não têm strings de interface literais; textos vêm do módulo isolado

- [x] **[2.2]** Configurar ESLint e Prettier (ou equivalente)
  - _O que fazer:_ adicionar configs e script `lint`; garantir que o estado inicial passa
  - _Critério de conclusão:_ `npm run lint` exit 0 no bootstrap

- [x] **[2.3]** Configurar testes unitários e convenção de arquivos
  - _O que fazer:_ Vitest (ou equivalente Vite); convenção `[nome].test.ts` ao lado do arquivo; pasta `/tests/e2e` preparada para `[fluxo].e2e.ts`
  - _Critério de conclusão:_ script de teste unitário roda; smoke mínimo passa; pasta E2E existe

- [x] **[2.4]** Stub de feature-check de suporte do navegador
  - _O que fazer:_ utilitário mínimo (ex.: `supportsOpfs()`) como ponto de extensão para specs de shell/cofre; teste unitário smoke se houver lógica
  - _Critério de conclusão:_ função exportada e testável; spec app-shell pode plugar aviso depois

### Fase 3: Deploy
- [x] **[3.1]** Configurar SPA fallback para Cloudflare Pages
  - _O que fazer:_ `_redirects` ou `public/_redirects` com fallback `/* /index.html 200` (ou equivalente Pages)
  - _Critério de conclusão:_ build de produção inclui artefato de SPA fallback

- [x] **[3.2]** Pipeline GitHub Actions → Cloudflare Pages
  - _O que fazer:_ workflow de build + deploy a cada push (secrets/variáveis documentados no próprio workflow ou README de deploy mínimo)
  - _Critério de conclusão:_ workflow válido; build no CI reproduz `npm run build`

### Fase 4: Testes e revisão
- [x] **[4.1]** E2E smoke da rota raiz
  - _O que fazer:_ `[fluxo].e2e.ts` em `/tests/e2e` verificando que a raiz renderiza o shell Ionic
  - _Critério de conclusão:_ E2E passa localmente (ou documentado como smoke configurado)

- [x] **[4.2]** Atualizar CONTEXT.md com convenções desta spec
  - _O que fazer:_ preencher estrutura de pastas, TypeScript, linter/formatter e organização de camadas na seção "Convenções de código"
  - _Critério de conclusão:_ CONTEXT reflete as escolhas; critérios de aceite da spec cobertos

- [x] **[5.1]** Verificar critérios de aceite da spec bootstrap-projeto
  - _O que fazer:_ checar checklist da spec um a um
  - _Critério de conclusão:_ todos os itens da spec marcáveis como feitos

## Dependências externas
- Conta/projeto Cloudflare Pages e secrets do GitHub Actions (API token / account id / project name) para o deploy real funcionar
- Node.js compatível com Vite atual

## Riscos
- Specs ainda em status "rascunho": se a estrutura de pastas mudar na revisão da spec, o CONTEXT precisa acompanhar
- Secrets de CI podem atrasar o critério de "deploy a cada push" até estarem provisionados — o workflow pode ficar pronto mesmo assim
