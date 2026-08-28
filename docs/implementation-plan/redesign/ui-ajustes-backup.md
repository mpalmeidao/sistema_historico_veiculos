# Implementation Plan: Ajustes — Backup e dados

**Spec:** [ui-ajustes-backup](/docs/specs/ui-ajustes-backup.md)
**Status:** pendente
**Data:** 2026-08-28

## Contexto

Redesenho visual da tab Ajustes (`config`) para “Backup e dados”: status do cofre, seção de backup com export prioritário, gerenciamento (criar/importar) e link do termo. Sem mudar storage/prefs.

**Pré-requisito:** tokens do DS. Ideal: form de manutenção já estável (não bloqueante). Helper de tempo relativo do backup já existe na home.

**Ordem no redesign:** após [ui-manutencao-form](./ui-manutencao-form.md).

## Tarefas

### Fase 1: i18n e estrutura

- [ ] **[1.1]** Strings i18n de Backup e dados
  - _O que fazer:_ título “Backup e dados”, subtítulo de dados locais, “Cofre local”, “Ativo neste dispositivo”, labels de versão/modificação, seção Backup, “Você ainda não criou um backup.”, Exportar / Criar / Importar / Ver termo (ajustar se já existirem). Sem jargão OPFS/SQL na UI.
  - _Critério de conclusão:_ strings novas só em `pt-BR.ts`

- [ ] **[1.2]** Layout da tab Ajustes na HomePage (ou extrair componente)
  - _O que fazer:_ cabeçalho + subtítulo; card “Cofre local” com meta quando há sessão; empty consistente quando não há (pode alinhar depois com [ui-empty-states](./ui-empty-states.md)). Consumir tokens.
  - _Critério de conclusão:_ com/sem sessão o layout distingue status; testids estáveis

### Fase 2: Backup e gerenciamento

- [ ] **[2.1]** Seção Backup + Exportar como CTA principal
  - _O que fazer:_ último backup via `lastBackupAt` + helper relativo da home; copy “ainda não criou”; CTA “Exportar .cofre” (fluxo atual; desabilitado sem sessão; marca backup confirmado). Orientação breve de cópias seguras.
  - _Critério de conclusão:_ export igual ao comportamento atual; hierarquia visual Export > Criar/Import quando há cofre

- [ ] **[2.2]** Criar / Importar + alert substituir + termo
  - _O que fazer:_ botões separados; import com “Substituir cofre atual?” irreversível; “Ver termo de isenção” abre `TermoModal`. Mensagens de falha claras (sem “erro inesperado” vago) — copy pode ser afinada aqui ou em [ui-feedback-overlays](./ui-feedback-overlays.md).
  - _Critério de conclusão:_ criar/import/export/termo iguais funcionalmente; E2E de cofre atualizados

### Fase 3: Revisão

- [ ] **[3.1]** E2E de Ajustes / cofre
  - _O que fazer:_ abrir tab; export; import com confirmação; termo; empty sem cofre
  - _Critério de conclusão:_ E2E passando

- [ ] **[3.2]** Critérios de aceite + CONTEXT se aplicável
  - _O que fazer:_ checklist da spec; CONTEXT só se convenção de UI de Ajustes for documentável
  - _Critério de conclusão:_ aceite coberto

## Dependências externas

- Helper relativo de backup (home)
- Fluxos create/import/export já na HomePage

## Riscos

- Mudar rótulos quebra E2E de onboarding→Ajustes
- Competição visual Criar vs Exportar — seguir hierarquia da spec
