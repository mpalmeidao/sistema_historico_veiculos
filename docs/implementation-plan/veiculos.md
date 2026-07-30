# Implementation Plan: Veículos

**Spec:** [veiculos](/docs/specs/veiculos.md)
**Status:** concluído
**Data:** 2026-07-29

## Contexto
CRUD de veículos sobre a interface de storage, com UI Ionic mobile-first. Depende de cofre aberto (e schema v1). Vem antes de manutenções, que se vinculam a veículos.

## Tarefas

### Fase 1: Domínio
- [x] **[1.1]** Modelo e validação de veículo
  - _O que fazer:_ tipos + regras: placa, marca/modelo, ano/modelo, km atual, próxima troca; rejeitar placa vazia, km negativo/não numérico e obrigatórios ausentes
  - _Critério de conclusão:_ validação unitária cobre casos válidos e inválidos da spec

- [x] **[1.2]** Operações de domínio via storage
  - _O que fazer:_ create/list/update/delete; delete com regra explícita quando há manutenções (bloquear **ou** cascade só após confirmação — implementar a opção escolhida de forma testável e alinhada à UI)
  - _Critério de conclusão:_ CRUD integra com interface de storage; gravação atualiza OPFS/versão de conteúdo; sem sql.js no domínio além do que a interface já encapsula
  - _Decisão:_ cascade só após confirmação explícita (`cascadeConfirmed: true`); sem flag → `CASCADE_NOT_CONFIRMED`

- [x] **[1.3]** Testes unitários de validação e regras de exclusão
  - _O que fazer:_ com/sem manutenções vinculadas
  - _Critério de conclusão:_ testes passando

### Fase 2: UI
- [x] **[2.1]** Listagem + estado vazio
  - _O que fazer:_ lista Ionic legível no mobile; empty state com CTA para cadastrar o primeiro; strings isoladas PT-BR
  - _Critério de conclusão:_ com 0 veículos mostra CTA; com dados lista os campos principais

- [x] **[2.2]** Formulário criar/editar
  - _O que fazer:_ formulário com validação na UI; salvar chama domínio; erros de campo visíveis
  - _Critério de conclusão:_ criar e editar persistem; inválidos não gravam

- [x] **[2.3]** Exclusão com confirmação
  - _O que fazer:_ diálogo Ionic; se houver histórico, aviso explícito conforme regra da 1.2
  - _Critério de conclusão:_ exclusão sem confirmação impossível; histórico não some sem aviso

### Fase 3: Testes de integração e E2E
- [x] **[3.1]** Integração: CRUD domínio + storage
  - _O que fazer:_ criar/editar/excluir e releitura
  - _Critério de conclusão:_ testes passando

- [x] **[3.2]** E2E: criar → editar → reload → dados presentes
  - _O que fazer:_ `/tests/e2e` com cofre de teste
  - _Critério de conclusão:_ E2E passa

### Fase 4: Revisão
- [x] **[4.1]** Verificar critérios de aceite da spec veiculos
- [x] **[4.2]** Atualizar CONTEXT.md se o escopo do módulo ou regra de exclusão em cascata ficar documentada como decisão

## Dependências externas
- Cofre-storage (+ schema v1 com tabela de veículos)
- Bootstrap / Ionic / strings isoladas

## Riscos
- Decisão bloquear vs cascade na exclusão com manutenções deve ficar explícita na UI e nos testes — não deixar ambígua
