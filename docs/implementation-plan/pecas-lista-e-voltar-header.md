# Implementation Plan: Peças como lista + seta voltar no header

**Spec:** [manutencoes](/docs/specs/manutencoes.md), [app-shell-pwa](/docs/specs/app-shell-pwa.md)
**Status:** concluído
**Data:** 2026-07-30

## Contexto
Evolui manutenções para peças estruturadas (descrição + valor, soma automática) com migração de schema v1→v2, e adiciona seta de voltar no header das views aninhadas do shell.

## Tarefas

### Fase 1: Documentação
- [x] **[1.1]** Specs atualizadas (manutenções + shell)
  - _O que fazer:_ comportamento de lista de peças, soma, migração e seta no header
  - _Critério de conclusão:_ specs refletem as decisões

### Fase 2: Schema
- [x] **[2.1]** Migração v1→v2
  - _O que fazer:_ tabela `manutencao_pecas`, remover `pecas_trocadas`, migrar dados legado, `CURRENT_SCHEMA_VERSION = 2`
  - _Critério de conclusão:_ testes de migração cobrem texto, só valor e vazio

### Fase 3: Domínio
- [x] **[3.1]** Types, validação e CRUD com peças
  - _O que fazer:_ `pecasTrocadas: PecaTrocada[]`; valor = soma; persistir peças no mesmo mutate
  - _Critério de conclusão:_ testes unitários + integração passando

### Fase 4: UI
- [x] **[4.1]** Formulário com lista de peças + valor total read-only
  - _O que fazer:_ add/remove linhas; i18n; selectors E2E
  - _Critério de conclusão:_ formulário cria/edita N peças

- [x] **[4.2]** Seta voltar no header
  - _O que fazer:_ `IonButtons` + ícone nas views aninhadas; remover Voltar redundante da lista
  - _Critério de conclusão:_ back do header equivale à navegação anterior

### Fase 5: OCR, PDF, CONTEXT, E2E
- [x] **[5.1]** OCR merge e PDF com lista
  - _O que fazer:_ string OCR → 1 peça com valor 0; PDF lista descrição — valor
  - _Critério de conclusão:_ testes unitários OCR/PDF atualizados

- [x] **[5.2]** CONTEXT + E2E
  - _O que fazer:_ convenções de manutenções; E2E peças + back
  - _Critério de conclusão:_ CONTEXT atualizado; E2E passando
