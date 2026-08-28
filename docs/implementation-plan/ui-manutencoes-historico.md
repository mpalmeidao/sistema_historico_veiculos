# Implementation Plan: Tela de manutenções (histórico do veículo)

**Spec:** [ui-manutencoes-historico](/docs/specs/ui-manutencoes-historico.md)
**Status:** pendente
**Data:** 2026-08-28

## Contexto

Redesenho visual do histórico do veículo (`ManutencoesList` + cabeçalho na `HomePage`), reusando tokens/tema e o menu kebab do plano [design-system-home-veiculos](/docs/implementation-plan/design-system-home-veiculos.md). Domínio, PDF e formulário permanecem; troca-se a composição (stats, card próxima troca, timeline, CTA).

**Pré-requisito:** Fase 1 do plano de design system (tokens + tab bar). Ideal: também o kebab (tarefa 3.1 da home) antes da timeline.

## Tarefas

### Fase 1: Helpers de apresentação

- [ ] **[1.1]** Formatação de data de exibição + testes
  - _O que fazer:_ helper puro `YYYY-MM-DD` → label legível `pt-BR` (ex. `12 jun 2025`). Não alterar o valor persistido. Unitários para datas válidas e borda (mês/dia).
  - _Critério de conclusão:_ testes unitários passando; helper importável pela UI sem React

- [ ] **[1.2]** Soma “total gasto” + testes
  - _O que fazer:_ helper puro sobre lista de `valor: number | null`: se **nenhum** valor não-nulo → ausência (“—” / null semântico); se há valores → soma (incluindo soma 0). Formatação BRL na UI ou no helper de display.
  - _Critério de conclusão:_ testes cobrem todos null, mistura null/número, e soma > 0

- [ ] **[1.3]** Strings i18n da tela de histórico
  - _O que fazer:_ em `pt-BR.ts`: labels das stats (Km atual, Manutenções, Total gasto), título do card próxima troca, “HISTÓRICO”, “Gerar PDF” (se ainda não adequado), “Mais recente”, “Início do histórico”, ausência de total, ajustes de “Nova manutenção” / empty se o copy do print divergir do atual.
  - _Critério de conclusão:_ UI da lista não hardcoda PT-BR novo

### Fase 2: Blocos da página

- [ ] **[2.1]** Cabeçalho de contexto do veículo + stats em colunas
  - _O que fazer:_ no histórico: identidade (chip carro, placa, marca/modelo) + 3 colunas com divisores (km atual, contagem, total gasto via 1.2). Voltar continua no `IonHeader`/`header-back` atual. Consumir tokens do design system.
  - _Critério de conclusão:_ com veículo aberto, placa/modelo e stats corretos; `data-testid` para stats/contexto

- [ ] **[2.2]** Card de próxima troca (`proximaTroca`)
  - _O que fazer:_ card creme + ícone relógio; título i18n fixo; corpo = `veiculo.proximaTroca`; oculto se null/vazio. Sem parser.
  - _Critério de conclusão:_ aparece só com campo preenchido; testid estável

- [ ] **[2.3]** Cabeçalho da seção Histórico + ação Gerar PDF
  - _O que fazer:_ rótulo HISTÓRICO + link/botão “Gerar PDF” (ícone documento). Reusar `useRelatorio` / props atuais: desabilitado se lista vazia ou `relatorioWorking`; manter feedback live/assertive. Remover/reposicionar o botão outline block antigo se existir.
  - _Critério de conclusão:_ PDF só com ≥1 item; mensagens de sucesso/erro ainda visíveis; testids de relatório preservados ou E2E atualizados juntos

### Fase 3: Timeline e ações

- [ ] **[3.1]** Timeline de manutenções
  - _O que fazer:_ substituir `IonList`/`IonItem` por timeline vertical: marcador preenchido + badge “Mais recente” no primeiro item; ocos nos demais; rodapé “Início do histórico” se length ≥ 1. Por item: data (1.1), tipoServico, valor BRL se não null, meta km · oficina, truncamento seguro.
  - _Critério de conclusão:_ ordem continua mais recente primeiro; empty não renderiza timeline; visual alinhado ao print

- [ ] **[3.2]** Menu ⋯ por item + CTA Nova manutenção
  - _O que fazer:_ reutilizar kebab da home (Editar / Excluir → alert atual). CTA pílula “+ Nova manutenção”: um único primário no empty (primeira manutenção) e na lista (nova). Evitar dois CTAs competindo.
  - _Critério de conclusão:_ editar/excluir/criar iguais ao comportamento atual; teclado ok no menu e CTA

- [ ] **[3.3]** Empty state + tab Manutenções sem veículo
  - _O que fazer:_ empty do histórico com convite + CTA; stats 0 / “—” conforme regra; card próxima troca ainda pode aparecer. Estado “abra um veículo…” na tab sem seleção: herdar tokens de fundo/texto, sem inventar o layout do print.
  - _Critério de conclusão:_ empty e pick state utilizáveis; formulário de manutenção não redesenhado

### Fase 4: Integração na HomePage

- [ ] **[4.1]** Wiring final na orquestração
  - _O que fazer:_ garantir `ManutencoesList` recebe veículo, lista, callbacks e props de relatório; tab Manutenções ativa quando no histórico; ads/tabs nas regras atuais; sem mudar máquina de `view`/`tab` além do necessário ao layout.
  - _Critério de conclusão:_ fluxo Veículos → Ver manutenções → histórico novo → Voltar → lista funciona ponta a ponta manualmente

### Fase 5: E2E e revisão

- [ ] **[5.1]** Atualizar / estender E2E de manutenções e relatório
  - _O que fazer:_ abrir histórico: header, stats, timeline, badge Mais recente; criar via Nova manutenção; menu Editar/Excluir; Gerar PDF com item e bloqueio no empty; card próxima troca condicional; empty CTA. Ajustar `tests/e2e` (manutenções, shell se afetado).
  - _Critério de conclusão:_ E2E relevantes passando

- [ ] **[5.2]** Verificar critérios de aceite da spec
  - _O que fazer:_ checklist de [ui-manutencoes-historico](/docs/specs/ui-manutencoes-historico.md); teclado + label-in-name nos controles novos
  - _Critério de conclusão:_ aceite coberto ou gap explícito

- [ ] **[5.3]** Atualizar `docs/CONTEXT.md` se aplicável
  - _O que fazer:_ só se timeline/stats de veículo virarem convenção documentável; senão pular
  - _Critério de conclusão:_ CONTEXT coerente ou inalterado de propósito

## Dependências externas

- Tokens/tema Ionic: plano [design-system-home-veiculos](/docs/implementation-plan/design-system-home-veiculos.md) Fase 1
- Componente kebab: tarefa 3.1 desse plano (senão implementar equivalente mínimo aqui e unificar depois)
- Nenhuma lib nova; `useRelatorio` / domínio de manutenções já existentes

## Riscos

- Começar sem tokens → CSS duplicado; respeitar pré-requisito
- “Total gasto” com `R$ 0,00` quando todos `valor` são null — seguir regra da spec (“—” se nenhum valor)
- Quebrar E2E de PDF/manutenções ao mudar testids ou posição do botão
- Escopo creep no formulário / OCR — explicitamente fora
