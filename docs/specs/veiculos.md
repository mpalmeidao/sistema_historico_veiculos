# Spec: Veículos

**Status:** rascunho
**Data:** 2026-07-29
**Arquitetura relacionada:** [sistema-historico-veiculos](/docs/architecture/sistema-historico-veiculos.md)
**ADRs relacionados:**
- [ADR-002 — sql.js no MVP com storage abstraído](/docs/adr/002-sql-js-no-mvp-com-storage-layer-abstraido.md)
- [ADR-003 — Ionic React como UI kit](/docs/adr/003-ionic-react-como-ui-kit.md)

## Objetivo
Permitir que o usuário cadastre e gerencie os veículos cujo histórico de manutenção será arquivado no cofre.

## Comportamento esperado
- Com um cofre aberto, o usuário deve poder criar, listar, editar e excluir veículos.
- Cada veículo deve registrar: placa, marca/modelo, ano/modelo, km atual, próxima troca prevista.
- A listagem deve ser utilizável em mobile (Ionic), priorizando leitura rápida dos veículos do cofre.
- Operações de persistência passam pela interface de storage; alterações atualizam o cofre de trabalho (OPFS) e a versão de conteúdo.
- Exclusão de veículo deve exigir confirmação; o comportamento sobre manutenções vinculadas deve ser explícito na UI (ver casos de borda).

## Casos de borda
- Campos obrigatórios ausentes ou inválidos (ex.: placa vazia): impedir gravação e indicar o problema.
- Km atual negativo ou não numérico: rejeitar.
- Exclusão de veículo que possui manutenções: impedir exclusão direta **ou** excluir em cascata somente após confirmação explícita que explique a perda do histórico — a UI não pode apagar histórico sem aviso.
- Cofre sem veículos: estado vazio com call-to-action para cadastrar o primeiro.
- Escala típica 1–3 veículos; listagem não precisa de paginação no MVP.

## Fora do escopo
- Cadastro de manutenções (spec própria)
- Alertas/notificações de vencimento de peças ou próxima troca
- Relatório PDF (usa dados do veículo, mas é spec própria)
- Multi-usuário / compartilhamento de veículo

## Critérios de aceite
- [x] Usuário cria um veículo com os campos do MVP e o vê na listagem após salvar
- [x] Usuário edita campos do veículo e as alterações persistem após recarregar o app
- [x] Usuário exclui um veículo apenas após confirmação; histórico vinculado não some sem aviso explícito
- [x] Validação impede salvar veículo sem dados mínimos válidos
- [x] Estado vazio orienta o cadastro do primeiro veículo
- [x] Nenhuma chamada direta a sql.js a partir da UI de veículos

## Estratégia de teste
- **Unitário:** validação de campos do veículo; regras de exclusão com/sem manutenções
- **Integração:** CRUD via módulo de domínio + interface de storage
- **E2E:** criar veículo → editar → recarregar → dados presentes

## Notas de implementação
- Campos conforme discovery-conceitual seções 3 e 4
- UI Ionic React, strings isoladas, PT-BR
