# Implementation Plan: Design system e tela inicial (Meus veículos)

**Spec:** [design-system-home-veiculos](/docs/specs/design-system-home-veiculos.md)
**Status:** concluído
**Data:** 2026-08-28

## Contexto

Fundação visual (tokens + tema Ionic + tab bar) primeiro; em seguida a composição da home Veículos (stats, banner, cards, empty). Ordem evita redesenhar a lista duas vezes e desbloqueia [ui-manutencoes-historico](/docs/implementation-plan/ui-manutencoes-historico.md). Sem mudar domínio/backup — só UI e helpers de apresentação.

## Tarefas

### Fase 1: Tokens, tema Ionic e tab bar

- [x] **[1.1]** Criar arquivo(s) de tokens / tema
  - _O que fazer:_ centralizar CSS variables (fundo `#F5F7F9`, superfície, primária navy `#1A3557`, textos, alerta creme, chip ícone, raios 12–16px, sombra sutil, foco ≥2px). Mapear `--ion-color-primary*` e fundo do `IonApp`/`IonContent` para esses tokens. Importar o tema a partir de `src/App.tsx` (após CSS do Ionic). Não introduzir segundo UI kit.
  - _Critério de conclusão:_ variáveis existem em um lugar só; app carrega com primária navy e fundo cinza claro na shell; pares texto/fundo e branco-sobre-navy documentados como AA (medida ou cálculo registrado na própria tarefa/PR)

- [x] **[1.2]** Atualizar `AppTabBar` ao visual do print
  - _O que fazer:_ item ativo com cor primária + indicador (ponto) sob o rótulo; inativos em cinza secundário; manter `data-testid` (`app-tab-bar`, `tab-*`), safe-area e tabs Veículos / Manutenções / Ajustes. Respeitar `prefers-reduced-motion` se houver animação.
  - _Critério de conclusão:_ tab selecionada visualmente distinta com ponto; E2E de shell que checa tabs continua passando

- [x] **[1.3]** Strings i18n da home / design system
  - _O que fazer:_ em `src/shared/i18n/pt-BR.ts`, adicionar (sem hardcode na UI): título “Meus veículos”, labels das 3 stats, copy de backup relativo (“hoje” / “há N dias” / “nunca”), rodapé de confiança, textos do banner se ainda não canônicos, labels do menu ⋯ se necessário. Manter `strings.appName` para o eyebrow.
  - _Critério de conclusão:_ todas as strings novas da spec estão no i18n; grep na UI da home não encontra literais PT-BR soltos

### Fase 2: Helpers de apresentação (com teste na sequência)

- [x] **[2.1]** Helper de tempo relativo do backup + testes
  - _O que fazer:_ função pura (ex. em `src/shared/appPrefs/` ou `src/shared/format/`) que recebe `lastBackupAt` (+ “agora”) e devolve chave/copy: nunca / hoje / há N dias. Cobrir unitário conforme estratégia da spec.
  - _Critério de conclusão:_ testes unitários passando para nunca, hoje, N dias; sem depender de React

- [x] **[2.2]** Helper de agregação das stats da home + testes (se extrair)
  - _O que fazer:_ dado lista de veículos + contagens (ou total) de manutenções + prefs, montar os 3 valores da faixa. Se a lógica for trivial no componente, pode ficar inline — mas a formatação do backup já está em 2.1.
  - _Critério de conclusão:_ se houver helper, testes cobrem 0 veículos / N veículos e soma de manutenções; senão, critério satisfeito só com 2.1 + UI correta

### Fase 3: Componentes reutilizáveis da home

- [x] **[3.1]** Menu kebab acessível (Editar / Excluir)
  - _O que fazer:_ componente reutilizável (botão ⋯ + `IonActionSheet` ou menu completo APG). Teclado, Escape, fechar ao escolher, foco de volta ao gatilho. Sem `div` clicável. `data-testid` estáveis para abrir / ações.
  - _Critério de conclusão:_ abre/fecha corretamente; Editar e Excluir disparam callbacks; usável só com teclado

- [x] **[3.2]** Redesign visual do `BackupReminderBanner`
  - _O que fazer:_ layout do print (creme, ícone escudo, título, corpo, “Exportar .cofre”, “Agora não”). Preservar regras atuais de show/dismiss e `data-testid` (`backup-reminder`, export, dismiss) usados nos E2E.
  - _Critério de conclusão:_ visual alinhado; E2E de onboarding-backup que usa o banner continua verde sem mudar comportamento

- [x] **[3.3]** Faixa de estatísticas da home
  - _O que fazer:_ 3 cards informativos (não clicáveis): Veículos, Manutenções, Backup — ícone em chip + label + valor. Props só de dados já calculados.
  - _Critério de conclusão:_ renderiza os três valores; `data-testid` para a faixa e/ou cada stat

### Fase 4: Composição da tela Veículos

- [x] **[4.1]** Cabeçalho “Meus veículos” + empty state
  - _O que fazer:_ em `VeiculosList` (ou wrapper na `HomePage` tab veículos): eyebrow (`appName`) + título + CTA “+ Novo veículo” só com `length > 0`. Empty state atual (título, corpo, `veiculo-empty-cta`) com tokens. Stats (3.3) visíveis também no empty (0 / 0 / backup).
  - _Critério de conclusão:_ empty e lista diferenciam CTAs conforme spec; testids de empty/add preservados ou E2E atualizados na mesma entrega

- [x] **[4.2]** Card de veículo
  - _O que fazer:_ substituir `IonItem` list por cards: acento superior navy, chip carro, placa, badge ano se houver, marca/modelo, meta km + contagem manutenções, faixa creme se `proximaTroca`, CTA “Ver manutenções”, menu ⋯ (3.1) → editar / exclusão com os dois `IonAlert` atuais (cascade). Truncamento sem scroll horizontal.
  - _Critério de conclusão:_ critérios de card da spec atendidos; `veiculo-historico-*`, alerts de delete e fluxos editar/excluir funcionam

- [x] **[4.3]** Rodapé de confiança + wiring na `HomePage`
  - _O que fazer:_ texto com ícone de cadeado abaixo da lista/empty. Passar dados reais para stats (contagem veículos, soma manutenções via `getManutencoesCount` ou equivalente, `lastBackupAt`). Garantir que banner de backup, ads e tabs permanecem nas regras atuais; layout novo só na view main da tab veículos.
  - _Critério de conclusão:_ stats refletem dados reais; rodapé visível; formulários/onboarding não quebram

### Fase 5: E2E e revisão

- [x] **[5.1]** Atualizar / estender E2E (veículos, backup, shell)
  - _O que fazer:_ cobrir home com ≥1 veículo (título, stats, card, Ver manutenções, menu Editar); empty CTA; lembrete Export/Agora não; exclusão via menu com e sem cascade; tab ativa + ads. Ajustar seletores se testids mudaram.
  - _Critério de conclusão:_ E2E relevantes passando

- [x] **[5.2]** Verificar critérios de aceite da spec
  - _O que fazer:_ checklist da spec design-system-home-veiculos; a11y básica (teclado nos CTAs/menu/banner; label-in-name)
  - _Critério de conclusão:_ todos os itens marcáveis como feitos ou com gap explícito documentado

- [x] **[5.3]** Atualizar `docs/CONTEXT.md` se aplicável
  - _O que fazer:_ se tokens/tema e convenção de UI (kebab, stats) virarem regra de projeto, registrar em convenções conforme “Quando atualizar este arquivo”
  - _Critério de conclusão:_ CONTEXT refletindo a decisão ou confirmação de que nada mudou no escopo de módulos/ADRs

## Dependências externas

- Nenhuma lib nova; Ionic + Ionicons já no projeto
- Plano [ui-manutencoes-historico](/docs/implementation-plan/ui-manutencoes-historico.md) deve começar **após** Fase 1 (idealmente após 3.1 para reusar o kebab)

## Riscos

- Customizar Ionic demais com CSS ad-hoc por componente em vez de tokens — preferir variáveis
- Quebrar E2E ao renomear testids — preservar ou atualizar na mesma tarefa
- Menu ⋯ incompleto (só visual) falha a11y — usar Action Sheet ou padrão completo
- Escopo creep para Manutenções/Ajustes — fora desta spec; só tokens globais “vazam” de propósito
