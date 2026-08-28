# Implementation Plan: Feedback global e overlays

**Spec:** [ui-feedback-overlays](/docs/specs/ui-feedback-overlays.md)
**Status:** pendente
**Data:** 2026-08-28

## Contexto

Unificar feedback de sucesso/erro (toast/`aria-live`) no shell e afinar hierarquia visual dos `IonAlert` destrutivos. Lembrete de backup na home já está feito — não redesenhar. Sem novos eventos de domínio.

**Pré-requisito:** tokens do DS; telas principais do redesign preferencialmente estáveis para não conflitar E2E duas vezes.

**Ordem no redesign:** após [ui-empty-states](./ui-empty-states.md).

## Tarefas

### Fase 1: Canal de feedback

- [ ] **[1.1]** API de toast/snackbar no shell
  - _O que fazer:_ introduzir padrão único (`IonToast` tematizado ou live region) disparável a partir de `HomePage`/hooks. Sucesso = `polite`/`status`; erro = `assertive` quando crítico. Fila curta ou “último ganha”. Respeitar `prefers-reduced-motion`.
  - _Critério de conclusão:_ um único canal visual para feedback global; testid estável

- [ ] **[1.2]** Migrar mensagens existentes para o canal
  - _O que fazer:_ substituir texto verde/vermelho solto no topo do content pelos toasts, cobrindo: CRUD veículo/manutenção, anexos/OCR quando sobem ao shell, export/import, PDF. Erros de campo nos forms permanecem contextuais. Afinar copy vaga (“erro inesperado”) onde existir.
  - _Critério de conclusão:_ fluxos listados na spec usam o padrão; strings em `pt-BR.ts`

### Fase 2: Alerts

- [ ] **[2.1]** Hierarquia visual dos alerts destrutivos
  - _O que fazer:_ garantir botão destrutivo vs cancelar distintos nos casos da tabela da spec (substituir cofre, excluir veículo ± histórico, manutenção, anexo, PDF grande, OCR). Preservar semântica e aviso de perda de histórico no cascade. Copy só se melhorar clareza.
  - _Critério de conclusão:_ todos os casos ainda pedem confirmação; opções equivalentes

### Fase 3: E2E e revisão

- [ ] **[3.1]** Atualizar E2E que assertam feedback/alert
  - _O que fazer:_ exclusões, substituir cofre, export, PDF — seletores de toast/alert
  - _Critério de conclusão:_ E2E passando

- [ ] **[3.2]** Critérios de aceite + CONTEXT se aplicável
  - _O que fazer:_ checklist da spec; documentar padrão de toast em CONTEXT se virar convenção
  - _Critério de conclusão:_ aceite coberto

## Dependências externas

- Ionic `IonToast` / `IonAlert` (ADR-003)
- Backup reminder já na home — não reimplementar

## Riscos

- Duplo feedback (toast + texto antigo) se a migração for parcial
- E2E frágeis a timing de toast — preferir `aria-live` / role estável
