# Spec: Tela de manutenções (histórico do veículo)

**Status:** implementado
**Data:** 2026-08-28
**Arquitetura relacionada:** [sistema-historico-veiculos](/docs/architecture/sistema-historico-veiculos.md)
**ADRs relacionados:**
- [ADR-003 — Ionic React como UI kit](/docs/adr/003-ionic-react-como-ui-kit.md)
**Referências de produto:**
- Print de referência: histórico “Manutenções” (proposta visual anexada à discussão)
- Tokens e tema: [design-system-home-veiculos](/docs/specs/design-system-home-veiculos.md) (mesma fundação visual; esta spec não redefine a paleta)
- Comportamento de domínio (inalterado): [manutencoes](/docs/specs/manutencoes.md), [relatorio-pdf](/docs/specs/relatorio-pdf.md)
- Inventário funcional atual: [ux-ui-inventario-telas.md](/docs/ux-ui-inventario-telas.md) §3.7–3.8

## Objetivo

Redesenhar a tela de histórico de manutenções do veículo conforme o print — contexto do veículo, resumo, timeline e ações — sem alterar regras de CRUD, PDF ou schema.

## Comportamento esperado

### Pré-condição e navegação

A composição abaixo aplica-se quando há **veículo selecionado** e a view é o histórico (`manutencoes` / equivalente atual após “Ver manutenções”), com cofre aberto e termo aceito.

- **Voltar** (chevron): retorna à lista de veículos (comportamento atual de `header-back`).
- Tab **Manutenções** aparece ativa (cor primária + indicador), alinhada ao shell do design system.
- Ads placeholder (50px) e safe-area do tab bar nas mesmas condições atuais.
- **Sem veículo selecionado** (tab Manutenções na view `main`): permanece o estado de orientação atual (“abra um veículo…”); fora do layout do print, mas deve herdar tokens de fundo/texto quando o tema existir.

Formulário de manutenção, anexos e OCR **não** são redesenhados nesta spec.

### A. Cabeçalho e contexto do veículo

1. Barra superior: botão voltar + título **“Manutenções”**.
2. Bloco de identidade do veículo:
   - Ícone de carro em chip (token de ícone do design system)
   - Placa em destaque
   - Marca/modelo como subtítulo
3. **Faixa de estatísticas** (3 colunas informativas, separadas por divisores verticais leves — não navegáveis):
   - **Km atual** — `veiculo.kmAtual` formatado `pt-BR`
   - **Manutenções** — quantidade de itens na lista do veículo
   - **Total gasto** — soma dos `valor` não nulos das manutenções do veículo, formatada em BRL; se todos os valores forem `null`/ausentes, exibir “—” ou copy i18n de ausência (não inventar zero enganoso se a regra de produto preferir “sem total”; default recomendado: `R$ 0,00` só quando a soma de valores presentes for 0, e “—” quando **nenhuma** manutenção tem valor)

### B. Card de próxima troca (opcional)

Quando `veiculo.proximaTroca` estiver preenchida, exibir card creme (mesmo padrão de alerta do design system) com:

- Ícone de relógio
- **Título** i18n fixo (ex.: “Próxima troca prevista”) — o print ilustra um título específico (“Próxima troca de óleo”); no MVP o conteúdo livre do campo vai no corpo, sem parser
- **Corpo:** texto de `proximaTroca` como o usuário cadastrou

Quando `proximaTroca` for `null`/vazia, o card **não** aparece.

Não há cálculo automático de km restante, data de vencimento nem alertas por tempo/km (já fora de escopo em [manutencoes](/docs/specs/manutencoes.md)).

### C. Seção Histórico

1. Cabeçalho da seção: rótulo **“HISTÓRICO”** (estilo uppercase/secundário) à esquerda; à direita ação **“Gerar PDF”** (ícone de documento + texto).
2. **Gerar PDF:**
   - Mesmas regras de [relatorio-pdf](/docs/specs/relatorio-pdf.md) e do hook atual (`useRelatorio`)
   - Desabilitado (ou não acionável) se lista vazia ou geração em andamento
   - Feedback de sucesso (`aria-live`) e erro (`assertive`) permanece visível na tela
3. **Timeline** vertical (mais recente primeiro — ordem já usada no domínio):
   - Linha vertical contínua à esquerda
   - Item mais recente: marcador **preenchido** na cor primária + badge **“Mais recente”**
   - Demais itens: marcador oco/cinza, sem badge
   - Rodapé da timeline: marcador mínimo + texto **“Início do histórico”** (quando há ≥ 1 item)
4. **Por item de manutenção:**
   - Data formatada para leitura em `pt-BR` (ex.: `12 jun 2025`) — valor persistido continua `YYYY-MM-DD`
   - Tipo de serviço em destaque (título do item)
   - Valor total à direita, em BRL, **somente se** `valor !== null`; se ausente, não exibir cifra falsa
   - Meta: km + sufixo + oficina (se houver), no padrão do print (`45.230 km · Oficina`)
   - Menu **⋯**: **Editar** e **Excluir** (exclusão com confirmação atual; sem excluir direto do menu)

### D. CTA primário

Botão em bloco estilo pílula/navy: **“+ Nova manutenção”**, abrindo o formulário de criação.

- Com lista não vazia: visível como no print (acima do chrome de tabs/ads).
- Empty state: o CTA de primeira manutenção permanece o caminho principal (pode ser o mesmo botão ou o empty CTA atual — evitar dois CTAs competindo; preferir um único CTA primário visível).

### E. Contrato funcional preservado

- CRUD, validação, ordenação, confirmação de exclusão
- Valor da manutenção = soma das peças (`null` se sem peças)
- Relatório PDF somente leitura; bloqueio sem manutenções
- Anexos/OCR só no formulário (spec própria)
- Tokens e tab bar: [design-system-home-veiculos](/docs/specs/design-system-home-veiculos.md)

## Casos de borda

- **Lista vazia:** empty state com convite + CTA para primeira manutenção; sem timeline; “Gerar PDF” indisponível com hint claro; stats mostram Manutenções `0` e Total gasto conforme regra de ausência; card de próxima troca ainda pode aparecer se `proximaTroca` existir.
- **Manutenção sem oficina:** meta só com km.
- **Manutenção sem valor:** item sem cifra à direita (layout não “pula” de forma quebrada).
- **Uma única manutenção:** badge “Mais recente” + rodapé “Início do histórico”.
- **Texto longo** (tipo de serviço, oficina, proximaTroca): truncar/quebrar sem scroll horizontal nem cobrir o menu.
- **Geração de PDF em andamento:** ação desabilitada + feedback de progresso existente.
- **Falha no PDF:** mensagem de erro; histórico permanece intacto.
- **Menu ⋯:** fechar ao escolher ação, tocar fora ou Escape; foco retorna ao gatilho; exclusão via alert.
- **Zoom 200% / ~320 CSS px:** reflow sem scroll bidimensional obrigatório; voltar, PDF, menu e CTA operáveis por teclado e toque.

## Fora do escopo

- Redesign do formulário de manutenção, anexos, OCR, onboarding ou Ajustes
- Novos campos de domínio ou alertas automáticos por km/tempo
- Parser de `proximaTroca` em título vs subtítulo estruturados
- Troca do Ionic (ADR-003)
- Alteração do conteúdo/layout interno do PDF gerado
- Dark mode
- Deep-link persistente de “último veículo” na tab Manutenções sem seleção (estado pick atual permanece)

## Critérios de aceite

- [x] Cabeçalho com voltar + “Manutenções” + identidade do veículo (placa, marca/modelo)
- [x] Stats exibem km atual, contagem de manutenções e total gasto (soma BRL / ausência tratada)
- [x] Card de próxima troca só aparece com `proximaTroca` preenchida e mostra o texto do campo
- [x] Seção Histórico com ação “Gerar PDF” respeitando bloqueio sem itens e feedback sucesso/erro
- [x] Lista em timeline: mais recente com marcador preenchido + badge; demais com marcador oco; rodapé “Início do histórico”
- [x] Cada item mostra data legível, tipo de serviço, km, oficina (se houver), valor (se houver) e menu Editar/Excluir
- [x] Exclusão mantém confirmação; edição abre o formulário existente
- [x] CTA “Nova manutenção” cria manutenção no veículo atual
- [x] Empty state permite registrar a primeira manutenção
- [x] Tab Manutenções ativa no shell; ads/safe-area inalterados nas regras atuais
- [x] Visual consome os tokens do design system (navy, fundo cinza, creme, tipografia)
- [x] Strings novas apenas em `pt-BR.ts`
- [x] Controles novos operáveis por teclado; nome acessível contém o texto visível (SC 2.5.3)
- [x] E2E de manutenções / relatório / shell atualizados aos novos seletores/rótulos e passando

## Estratégia de teste

- **Unitário:**
  - Soma de “total gasto” a partir da lista (ignorar `null`; formatar BRL)
  - Formatação de data de exibição `YYYY-MM-DD` → label `pt-BR` (helper puro)
- **Integração:** não obrigatória além do CRUD/PDF já cobertos
- **E2E:**
  - Abrir histórico a partir de um veículo: header, stats, timeline, badge “Mais recente”
  - Criar via “Nova manutenção” e ver item no topo
  - Menu → Editar / Excluir com confirmação
  - Gerar PDF com ≥ 1 item; indisponível no empty
  - Card de próxima troca visível só com `proximaTroca`
  - Empty state + CTA primeira manutenção

## Notas de implementação

- **Dependência:** idealmente os tokens/tema de [design-system-home-veiculos](/docs/specs/design-system-home-veiculos.md) existem antes ou na mesma entrega; não duplicar paleta nesta spec.
- Reutilizar `ManutencoesList` / `useManutencoes` / `useRelatorio` e a orquestração em `HomePage`; trocar composição visual, não o fluxo de views.
- Preferir action sheet ou menu acessível completo para o ⋯ (mesmo padrão da home de veículos).
- Preservar `data-testid` estáveis quando possível; atualizar E2E na mesma entrega se mudar.
- Após implementar, se a convenção de timeline/stats de veículo virar padrão de UI, atualizar `docs/CONTEXT.md` só se a seção “Quando atualizar” se aplicar (tokens/convenção de UI).
