# Implementation Plan: Empty states restantes

**Spec:** [ui-empty-states](/docs/specs/ui-empty-states.md)
**Status:** concluído
**Data:** 2026-08-28

## Contexto

Padronizar empty states ainda genéricos (pick de veículo na tab Manutenções; cofre ausente em Ajustes) e alinhar tipografia/ícone dos empties já entregues. Sem deep-link de último veículo.

**Pré-requisito:** idealmente [ui-ajustes-backup](./ui-ajustes-backup.md) e [ui-manutencao-form](./ui-manutencao-form.md) feitos (empty de anexos/cofre podem ser só ajuste fino).

**Ordem no redesign:** após onboarding.

## Tarefas

### Fase 1: Padrão e pick de veículo

- [x] **[1.1]** Componente leve `EmptyState` (opcional)
  - _O que fazer:_ se houver ≥2 usos, criar `src/ui/components/EmptyState.tsx` (ícone + título + corpo + CTA opcional) com tokens do DS. Se só um uso novo, pode ficar inline — não abstrair cedo demais.
  - _Critério de conclusão:_ API mínima; sem inventar navegação

- [x] **[1.2]** Tab Manutenções sem veículo
  - _O que fazer:_ substituir mensagem genérica por “Escolha um veículo” + explicação (abrir Veículos → Ver manutenções). CTA opcional “Ir para Veículos” só se trivial no shell. i18n.
  - _Critério de conclusão:_ empty padrão; sem seleção automática de veículo

- [x] **[1.3]** Empty de cofre ausente + alinhamento fino
  - _O que fazer:_ garantir empty de Ajustes sem sessão coerente com a spec de Ajustes; ajuste fino tipográfico nos empties de veículos/manutenções/anexos se divergirem do padrão. Não redesenhar copy já aceita das specs anteriores.
  - _Critério de conclusão:_ linguagem visual consistente entre empties

### Fase 2: E2E e revisão

- [x] **[2.1]** E2E pick / empty
  - _O que fazer:_ tab Manutenções sem veículo; Ajustes sem cofre se cobertos por testes
  - _Critério de conclusão:_ E2E passando

- [x] **[2.2]** Critérios de aceite
  - _O que fazer:_ checklist da spec
  - _Critério de conclusão:_ aceite coberto

## Dependências externas

- Tokens e empties existentes na home/histórico

## Riscos

- Extrair `EmptyState` cedo demais com props demais — manter mínimo
