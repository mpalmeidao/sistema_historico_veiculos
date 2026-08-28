# Spec: Feedback global e overlays destrutivos

**Status:** rascunho
**Data:** 2026-08-28
**Arquitetura relacionada:** [sistema-historico-veiculos](/docs/architecture/sistema-historico-veiculos.md)
**ADRs relacionados:**
- [ADR-003 — Ionic React como UI kit](/docs/adr/003-ionic-react-como-ui-kit.md)
**Referências de produto:**
- Redesign UX/UI (seções Feedback global, Alerts destrutivos, Backup reminder)
- Tokens: [design-system-home-veiculos](/docs/specs/design-system-home-veiculos.md)
- Lembrete de backup já redesenhado na home: [design-system-home-veiculos](/docs/specs/design-system-home-veiculos.md)
- Inventário: [ux-ui-inventario-telas.md](/docs/ux-ui-inventario-telas.md) §4

## Objetivo

Unificar feedback de sucesso/erro/processamento e manter confirmações destrutivas claras — melhorando percepção da ação sem mudar regras de quando cada alert ou lembrete dispara.

## Comportamento esperado

### A. Feedback contextual (toast / snackbar / live region)

Substituir (ou complementar de forma consistente) as mensagens verdes/vermelhas genéricas no topo do `IonContent` por um padrão único:

1. **Snackbar/toast acessível** (ou região `role="status"` / `aria-live`) para sucessos e erros de curta duração.
2. Mensagens **curtas, objetivas e acionáveis** quando houver próximo passo.
3. Evitar “Erro inesperado”; preferir o que aconteceu + o que o usuário pode fazer.
4. Cobrir, no mínimo, feedback já existente de:
   - criação/edição/exclusão de veículo e manutenção
   - anexos e OCR (quando o feedback sobe ao shell)
   - export/import de cofre
   - geração de relatório PDF
5. Preferir feedback **próximo da ação** quando a ação estiver em tela dedicada (ex.: erro de campo no form); usar toast para confirmações após navegar de volta à lista.

Não inventar novos eventos de domínio — só o canal visual/acessível do feedback já emitido.

### B. Backup reminder

Já especificado e implementado na home ([design-system-home-veiculos](/docs/specs/design-system-home-veiculos.md)):

- Critérios: 5 edições **ou** 7 dias sem export
- Título/corpo/CTAs do redesign
- “Agora não” dispensa só na sessão
- Fora de cadastro/onboarding

Esta spec **não** redesenha o banner; apenas exige que qualquer outro lembrete futuro reutilize o mesmo padrão visual (creme, ícone, hierarquia).

### C. Alerts destrutivos / confirmações

Manter confirmação via `IonAlert` (ou equivalente acessível) nos casos atuais, com hierarquia visual clara entre ação segura e irreversível:

| Contexto | Título (resumo) | Ações |
|----------|-----------------|-------|
| Substituir cofre | Substituir cofre atual? | Cancelar / Substituir |
| Excluir veículo sem histórico | Excluir veículo? | Cancelar / Excluir |
| Excluir veículo com histórico | Excluir veículo e histórico? | Cancelar / Excluir… (aviso de perda de manutenções e anexos) |
| Excluir manutenção | Excluir manutenção? | Cancelar / Excluir |
| Remover anexo | Remover anexo? | Cancelar / Remover |
| PDF grande | PDF grande | Cancelar / Anexar mesmo assim |
| OCR modelo | Baixar modelo de OCR? | Continuar sem OCR / Baixar |
| OCR falha | (extrair dados / erro) | Continuar sem OCR / Tentar novamente |

Copy pode ser afinada para clareza, **sem** mudar a semântica das opções nem omitir o aviso de perda de histórico no cascade.

Botão destrutivo visualmente distinto do cancelar (destructive vs secondary); nunca competir com um CTA primário de criação na mesma superfície.

## Casos de borda

- Vários toasts em sequência: não empilhar de forma ilegível; último ou fila curta.
- `prefers-reduced-motion`: entrada/saída do toast discreta ou instantânea.
- Alert com texto longo: rolável / legível em 375px.
- Dispensar toast não desfaz a ação já concluída.

## Fora do escopo

- Novos tipos de notificação push
- Mudança dos limiares N/M do backup reminder
- Redesign das telas que disparam os alerts (só o padrão do overlay/feedback)
- Troca do Ionic

## Critérios de aceite

- [ ] Sucessos/erros globais usam padrão único acessível (`aria-live` / snackbar)
- [ ] Mensagens evitam copy vaga; cobrem os fluxos listados que já emitem feedback
- [ ] Todos os alerts da tabela permanecem com confirmação e opções equivalentes
- [ ] Cascade de veículo explica perda de manutenções/anexos
- [ ] Tokens do DS nos overlays; strings em `pt-BR.ts`
- [ ] E2E que dependem de texto de alert/feedback atualizados e passando

## Estratégia de teste

- **Unitário:** helper de prioridade/fila de toast se existir
- **E2E:** excluir veículo com/sem histórico; remover anexo; substituir cofre; export sucesso; PDF erro/sucesso visíveis de forma acessível

## Notas de implementação

- Preferir componentes Ionic (`IonToast`, `IonAlert`) tematizados — ADR-003.
- Centralizar disparo de toast no shell/`HomePage` se hoje as mensagens sobem como string solta.
- Não alterar domínio; só apresentação.
