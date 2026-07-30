# Implementation Plan: Migrações de Schema

**Spec:** [migracoes-schema](/docs/specs/migracoes-schema.md)
**Status:** concluído
**Data:** 2026-07-29

## Contexto
Mecanismo de `user_version` com migrações progressivas e recusa de schema futuro. Depende da interface de storage; no MVP a versão atual pode ser só v1, mas o pipeline e a recusa devem existir desde o início. Testes são obrigatórios.

## Tarefas

### Fase 1: Fundação
- [x] **[1.1]** Definir versão atual do schema e registry de migrações
  - _O que fazer:_ constante `CURRENT_SCHEMA_VERSION`; lista ordenada de migrações `N → N+1` executáveis via interface de storage (SQL/DDL atrás do adapter)
  - _Critério de conclusão:_ registry existe; versão atual documentada (MVP: tipicamente v1 = baseline)

- [x] **[1.2]** Schema baseline v1
  - _O que fazer:_ DDL inicial alinhado a veículos/manutenções/anexos previstos (mínimo necessário para abrir cofre novo); setar `user_version` e `application_id` na criação
  - _Critério de conclusão:_ cofre novo nasce na versão atual; fixtures de teste podem criar v1

- [x] **[1.3]** Runner de abertura: ler `user_version` e decidir migrar / abrir / recusar
  - _O que fazer:_ integrar no fluxo de open do storage; versão igual → open; menor → migrar; maior → recusar sem regravar; `user_version` ausente → tratar como 0 / regra v1 documentada
  - _Critério de conclusão:_ três caminhos cobertos por testes; em schema futuro o OPFS de trabalho válido não é sobrescrito com dados incompatíveis

### Fase 2: Segurança da cadeia
- [x] **[2.1]** Migrações progressivas e falha segura
  - _O que fazer:_ aplicar v1→v2→… em sequência; se falhar no meio, abertura falha e não marca o cofre como “ok” parcialmente migrado
  - _Critério de conclusão:_ falha simulada na cadeia deixa abertura em erro; sucesso deixa `user_version` = atual

- [x] **[2.2]** Independência da versão de conteúdo
  - _O que fazer:_ garantir que migração não confunde `user_version` com contador/data de conteúdo; após migração bem-sucedida, conteúdo permanece coerente
  - _Critério de conclusão:_ teste afirma independência dos dois versionamentos

### Fase 3: Testes (obrigatórios)
- [x] **[3.1]** Testes unitários por migração isolada
  - _O que fazer:_ para cada migração registrada: fixture na versão N → saída N+1; se só houver v1 no MVP, testar baseline + runner com migração stub ou fixture “v0→v1”
  - _Critério de conclusão:_ cada passo N→N+1 coberto; testes contra interface de storage, nunca sql.js direto

- [x] **[3.2]** Testes de integração: cadeia completa e schema futuro
  - _O que fazer:_ abrir fixture antiga até versão atual; abrir fixture com `user_version` > atual e assert de recusa sem rewrite
  - _Critério de conclusão:_ ambos os cenários passam

- [x] **[3.3]** E2E opcional: abrir fixture de cofre antigo na UI
  - _O que fazer:_ se houver UI de abrir cofre, confirmar abertura após migração
  - _Critério de conclusão:_ E2E passa ou documentado como adiado com justificativa
  - _Adiado:_ UI de abrir cofre / fluxo de import na interface ainda não está no escopo deste plano; cobertura fica nos testes de storage (obrigatórios). E2E quando houver tela de cofre.

### Fase 4: Revisão
- [x] **[4.1]** Verificar critérios de aceite da spec migracoes-schema
- [x] **[4.2]** Atualizar CONTEXT.md se a versão de schema ou política de falha for refinada

## Dependências externas
- Spec/plan de cofre-storage implementado (interface + open/create)
- Alinhamento do DDL v1 com specs de veículos/manutenções/anexos (pode ser schema mínimo evolutivo)

## Riscos
- Sem migração real além de v1 no MVP, é fácil “esquecer” o runner — a tarefa 1.3 e os testes de schema futuro são o mínimo inegociável
- Bug em migração corrompe dados sem recuperação: não pular a Fase 3
