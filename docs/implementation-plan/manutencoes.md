# Implementation Plan: Manutenções

**Spec:** [manutencoes](/docs/specs/manutencoes.md)
**Status:** concluído
**Data:** 2026-07-29

## Contexto
CRUD de manutenções vinculadas a um veículo, com listagem cronológica e preenchimento manual (sem acoplar OCR/anexos). Depende de veículos + storage. Anexos e OCR entram depois por composição de fluxos.

## Tarefas

### Fase 1: Domínio
- [x] **[1.1]** Modelo e validação de manutenção
  - _O que fazer:_ campos data, km, tipo de serviço, peças, oficina, valor, próxima revisão; rejeitar data inválida, km/valor negativos; exigir veículo válido; documentar campos mínimos obrigatórios (data, km, tipo de serviço) se for a regra do MVP
  - _Critério de conclusão:_ validação unitária cobre casos da spec; criação órfã impossível

- [x] **[1.2]** Operações de domínio + ordenação
  - _O que fazer:_ CRUD via storage; listagem ordenada de forma temporal clara e consistente (mais recente primeiro ou documentar a ordem escolhida)
  - _Critério de conclusão:_ listagem sempre na mesma ordem; edição não quebra `veiculoId`; gravação atualiza versão de conteúdo

- [x] **[1.3]** Testes unitários: validação e ordenação
  - _O que fazer:_ cobrir critérios de validação e ordem da lista
  - _Critério de conclusão:_ testes passando

### Fase 2: UI
- [x] **[2.1]** Listagem por veículo + empty state
  - _O que fazer:_ a partir do veículo, lista cronológica Ionic; CTA para primeira manutenção; strings isoladas
  - _Critério de conclusão:_ empty state e lista com ordem clara

- [x] **[2.2]** Formulário criar/editar (manual, sem OCR)
  - _O que fazer:_ salvar só com preenchimento manual; validação com feedback; sem dependência de Tesseract/anexos
  - _Critério de conclusão:_ criar/editar persiste; inválidos bloqueados; possível salvar sem anexo

- [x] **[2.3]** Exclusão com confirmação
  - _O que fazer:_ diálogo obrigatório antes de apagar
  - _Critério de conclusão:_ exclusão só após confirmação; persiste após reload

### Fase 3: Testes de integração e E2E
- [x] **[3.1]** Integração: CRUD manutenção vinculada a veículo via storage
  - _O que fazer:_ criar veículo fixture → CRUD manutenção → releitura
  - _Critério de conclusão:_ testes passando

- [x] **[3.2]** E2E: criar → listar → editar → excluir no veículo
  - _O que fazer:_ fluxo em `/tests/e2e`
  - _Critério de conclusão:_ E2E passa

### Fase 4: Revisão
- [x] **[4.1]** Verificar critérios de aceite da spec manutencoes
- [x] **[4.2]** Atualizar CONTEXT.md se campos mínimos obrigatórios forem fixados de forma diferente do discovery

## Dependências externas
- Spec veiculos + cofre-storage (tabela de manutenções no schema)
- Pontos de extensão futuros para anexos/OCR (não implementar nesta plan)

## Riscos
- Não acoplar CRUD ao OCR — composição depois; se o formulário for compartilhado, manter save manual independente
