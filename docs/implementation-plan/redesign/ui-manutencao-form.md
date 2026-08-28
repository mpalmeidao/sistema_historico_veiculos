# Implementation Plan: Formulário de manutenção (wizard)

**Spec:** [ui-manutencao-form](/docs/specs/ui-manutencao-form.md)
**Status:** concluído
**Data:** 2026-08-28

## Contexto

Redesenho do `ManutencaoForm` em wizard de 3 etapas (comprovante → dados → peças), reusando tokens do design system e hooks `useAnexos` / `useOcr`. Domínio, schema e regras de anexos/OCR permanecem; troca-se a composição e a navegação de etapas.

**Pré-requisito:** tokens/tema e histórico já entregues ([design-system-home-veiculos](/docs/implementation-plan/design-system-home-veiculos.md), [ui-manutencoes-historico](/docs/implementation-plan/ui-manutencoes-historico.md)).

**Ordem no redesign:** 1º plano desta pasta — implementar antes de Ajustes / veículo / onboarding.

## Tarefas

### Fase 1: Fundação (helpers + i18n + CSS)

- [x] **[1.1]** Helpers de etapa do wizard + testes
  - _O que fazer:_ funções puras em `src/ui/manutencoes/` (ou `src/shared/` se fizer sentido): (a) avançar/voltar com limites 1–3; (b) mapear `ManutencaoField` → etapa (ex.: `data`/`km`/`tipoServico`/`oficina`/`proximaRevisao` → 2; campos de peças → 3; anexos não geram field error de domínio). Unitários para limites e mapeamento.
  - _Critério de conclusão:_ testes unitários passando; helpers sem React

- [x] **[1.2]** Strings i18n do wizard
  - _O que fazer:_ em `pt-BR.ts`: progresso “N de 3”, títulos das etapas, “Continuar”, “Salvar manutenção”, empty de comprovante, CTAs Tirar foto / Escolher da galeria / Anexar PDF, copy OCR de sugestões (“Sugestões encontradas…”), “Total da manutenção”, ajustes de labels se necessário. Sem hardcode na UI nova.
  - _Critério de conclusão:_ grep na UI do form não encontra literais PT-BR novos soltos

- [x] **[1.3]** Estilos de stepper / resumo total / CTAs de anexo
  - _O que fazer:_ estender `src/ui/theme/components.css` (e tokens só se faltar variável) com progresso, resumo financeiro destacado, botões de anexo alinhados ao DS. Respeitar `prefers-reduced-motion` na troca de etapa.
  - _Critério de conclusão:_ classes reutilizáveis documentadas no CSS; sem segundo UI kit

### Fase 2: Etapa 1 — Anexos

- [x] **[2.1]** Separar CTAs câmera / galeria / PDF + empty
  - _O que fazer:_ em `AnexosSection.tsx`, três ações distintas (input com `capture="environment"`, input `image/*` sem capture, input PDF). Empty: ícone + título/corpo da spec. Preservar preview, remoção com confirmação, alerta PDF ≥ ~2 MB, pending vs persistência imediata.
  - _Critério de conclusão:_ criar/editar anexam como hoje; E2E/testids de anexo atualizados ou preservados

- [x] **[2.2]** Copy e estados OCR alinhados à spec
  - _O que fazer:_ garantir “Lendo a nota…”, Cancelar OCR, sugestões como revisão (não fonte definitiva), aviso PDF sem OCR, alerts de modelo/erro. Merge só em vazios; nunca bloquear save. Integração continua via `useOcr` no form.
  - _Critério de conclusão:_ comportamentos da spec OCR preservados com copy nova; `aria-live` onde já houver/precisar

### Fase 3: Wizard no ManutencaoForm

- [x] **[3.1]** Shell do wizard (progresso + navegação)
  - _O que fazer:_ estado local `step` 1–3; indicador “N de 3”; Continuar (1→2, 2→3) sem validar; Salvar só na 3. Header voltar: etapa 1 → `onCancel` (descarta pendentes); etapas 2–3 → step anterior sem perder form/anexos. Foco no título/primeiro controle ao mudar etapa.
  - _Critério de conclusão:_ criar e editar usam o mesmo wizard; dados preservados ao voltar/avançar

- [x] **[3.2]** Etapa 2 — campos de dados
  - _O que fazer:_ data, km, tipo, oficina, próxima revisão com labels persistentes e erros junto ao campo (mapa atual `fieldErrorMessages`). Tokens/inputs do DS.
  - _Critério de conclusão:_ campos e validação de domínio iguais; layout sem scroll horizontal em ~375px

- [x] **[3.3]** Etapa 3 — peças + total destacado + Salvar
  - _O que fazer:_ repetidor de peças (adicionar/remover); resumo “Total da manutenção” (não input readonly genérico); CTA Salvar desabilitado em `submitting`. Persistência via `onSubmit` atual; em `fieldErrors`, usar helper 1.1 para ir à etapa correta.
  - _Critério de conclusão:_ lista vazia ok; valor persistido null sem peças; save inválido navega à etapa 2/3 correta

- [x] **[3.4]** Contexto do veículo no form
  - _O que fazer:_ passar placa/marcaModelo (ou veículo) do `HomePage` para o form e exibir bloco de contexto (chip/texto) abaixo do header. Ads continuam ocultos na view form.
  - _Critério de conclusão:_ usuário vê qual veículo está editando; wiring sem mudar máquina de views além do necessário

### Fase 4: E2E e revisão

- [x] **[4.1]** Atualizar E2E de manutenções / anexos / OCR
  - _O que fazer:_ fluxo wizard completo; foto→OCR mock; PDF sem OCR; cancel etapa 1 com pendente; editar preserva; save inválido → etapa 2. Ajustar `tests/e2e` aos novos rótulos/testids.
  - _Critério de conclusão:_ E2E relevantes passando

- [x] **[4.2]** Verificar critérios de aceite da spec
  - _O que fazer:_ checklist de [ui-manutencao-form](/docs/specs/ui-manutencao-form.md); teclado + label-in-name nos CTAs novos
  - _Critério de conclusão:_ aceite coberto ou gap explícito

- [x] **[4.3]** Atualizar `docs/CONTEXT.md` se aplicável
  - _O que fazer:_ só se wizard/stepper virar convenção de UI; senão pular
  - _Critério de conclusão:_ CONTEXT coerente ou inalterado de propósito

## Dependências externas

- Nenhuma lib nova
- Hooks e domínio já existentes (`useAnexos`, `useOcr`, `ManutencaoForm` props)

## Riscos

- Quebrar E2E ao renomear botões de anexo (um → três)
- OCR completar após Continuar: merge deve continuar seguro em campos já editados
- Header voltar na HomePage pode precisar de callback consciente da etapa (form controla step internamente ou expõe `onBack`)
