# Implementation Plan: Formulário de veículo

**Spec:** [ui-veiculo-form](/docs/specs/ui-veiculo-form.md)
**Status:** concluído
**Data:** 2026-08-28

## Contexto

Redesenho visual de `VeiculoForm` (Novo/Editar) em uma tela com seções Identificação e Uso, CTAs Salvar/Cancelar e tokens do DS. Domínio e validação inalterados; exclusão permanece na lista.

**Pré-requisito:** tokens do DS. Toast global fica para [ui-feedback-overlays](./ui-feedback-overlays.md).

**Ordem no redesign:** após [ui-ajustes-backup](./ui-ajustes-backup.md).

## Tarefas

### Fase 1: i18n e layout

- [x] **[1.1]** Strings i18n do formulário de veículo
  - _O que fazer:_ “Salvar veículo”, seções Identificação / Uso, indicação de obrigatório, demais labels se o copy do redesign divergir. Sem hardcode.
  - _Critério de conclusão:_ UI do form sem literais PT-BR novos soltos

- [x] **[1.2]** Recompor `VeiculoForm` com seções e hierarquia de CTAs
  - _O que fazer:_ agrupar campos (placa, marca/modelo, ano | km, próxima troca); labels persistentes; obrigatórios com indicação visual+texto; CTA primário “Salvar veículo”, secundário “Cancelar”; ads já ocultos pela view. Tokens/inputs do DS. Preservar props/`onSubmit`/`onCancel` e default km `0` na criação.
  - _Critério de conclusão:_ criar/editar/validação/voltar iguais; layout curto e escaneável em mobile

### Fase 2: E2E e revisão

- [x] **[2.1]** Atualizar E2E de veículos (form)
  - _O que fazer:_ criar → lista; editar → persistir; cancelar; erros de validação visíveis com novos rótulos/testids
  - _Critério de conclusão:_ E2E passando

- [x] **[2.2]** Critérios de aceite
  - _O que fazer:_ checklist da spec; teclado + label-in-name
  - _Critério de conclusão:_ aceite coberto

## Dependências externas

- Nenhuma; `VeiculoForm` e domínio já existem

## Riscos

- Indicação de obrigatório só por cor — exige texto/asterisco + cor (a11y)
