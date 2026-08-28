# Spec: Design system e tela inicial (Meus veículos)

**Status:** rascunho
**Data:** 2026-08-28
**Arquitetura relacionada:** [sistema-historico-veiculos](/docs/architecture/sistema-historico-veiculos.md)
**ADRs relacionados:**
- [ADR-003 — Ionic React como UI kit](/docs/adr/003-ionic-react-como-ui-kit.md)
**Referências de produto:**
- Print de referência: home “Meus veículos” (proposta visual anexada à discussão)
- Inventário funcional atual: [ux-ui-inventario-telas.md](/docs/ux-ui-inventario-telas.md) (comportamento a preservar; visual a substituir nesta tela)
- Specs de comportamento inalteradas: [veiculos](/docs/specs/veiculos.md), [onboarding-backup](/docs/specs/onboarding-backup.md), [app-shell-pwa](/docs/specs/app-shell-pwa.md)

## Objetivo

Dar identidade visual própria ao app (tokens e padrões reutilizáveis) e redesenhar a aba Veículos para a composição do print — sem mudar as regras de negócio do cofre, backup ou CRUD.

## Comportamento esperado

### A. Design system (fundação visual)

O sistema deve expor um conjunto de **tokens de marca** e padrões de superfície usados pela home e, em seguida, pelas demais telas:

1. **Paleta (valores aproximados do print; podem ser afinados na implementação desde que fiquem documentados e consistentes):**
   - Fundo da app: cinza muito claro (~`#F5F7F9`)
   - Superfície (cards): branco (`#FFFFFF`)
   - Primária (ações, tab ativa, acento superior do card): navy (~`#1A3557`)
   - Texto primário: quase preto (~`#111827`)
   - Texto secundário: cinza médio (~`#6B7280`)
   - Alerta/aviso (fundo): creme (~`#FFF9EB`)
   - Ícone em chip: fundo azul-acinzentado claro (~`#E8F0F7`)
2. **Tipografia:** sans-serif moderna; hierarquia clara entre eyebrow (“Histórico de Veículos”), título da tela (“Meus veículos”), títulos de card (placa) e metadados.
3. **Forma:** cards e banners com raio generoso (~12–16px); CTA primário da home em formato pílula; botões de card com raio médio (~8–12px).
4. **Elevação:** sombra sutil nos cards sobre o fundo cinza (sem empilhar múltiplas camadas).
5. **Integração com Ionic (ADR-003):** o design system **tema** o Ionic (CSS variables / tema custom), não o substitui. Componentes de interação (alerts, tabs, safe-area, inputs em outras telas) continuam Ionic ou encapsulados sobre Ionic.
6. **Tokens acessíveis:** contraste texto/UI deve atender WCAG 2.2 AA (texto ≥ 4,5:1; componentes significativos ≥ 3:1). Indicador de foco visível (≥ 2px, contraste ≥ 3:1).
7. **i18n:** nenhuma string de interface hardcoded — todas em `src/shared/i18n/pt-BR.ts`.

### B. Shell na aba Veículos (layout do print)

Quando o usuário está na aba **Veículos**, view principal (`main`), com cofre aberto e termo aceito, a tela deve apresentar, de cima para baixo:

1. **Cabeçalho de página** (não o padrão genérico “só o título da tab”):
   - Eyebrow: nome do app (“Histórico de Veículos”)
   - Título: “Meus veículos”
   - CTA primário à direita: “+ Novo veículo” (visível quando já existe ≥ 1 veículo; no empty state o CTA principal permanece o da seção vazia — ver abaixo)
2. **Faixa de estatísticas** (3 cards informativos, não navegáveis):
   - **Veículos** — quantidade de veículos no cofre
   - **Manutenções** — quantidade total de manutenções no cofre (soma de todos os veículos)
   - **Backup** — tempo relativo desde o último export confirmado (`lastBackupAt`), ex.: “há 3 dias”; se nunca exportou, copy explícita de “nunca” / equivalente (definida no i18n)
3. **Banner de lembrete de backup** — mesmas regras de disparo e dispensa da spec [onboarding-backup](/docs/specs/onboarding-backup.md) e do código atual (`shouldShowBackupReminder`, dispensa só na sessão). Visual alinhado ao print:
   - Fundo creme, ícone de escudo
   - Título: “Está na hora de fazer um backup”
   - Corpo: orientação a exportar cópia
   - Ações: botão primário “Exportar .cofre” + link/texto “Agora não”
4. **Lista de veículos** em cards (ver seção C) **ou** empty state (ver casos de borda)
5. **Rodapé de confiança** (abaixo da lista, acima do chrome fixo): ícone de cadeado + “Seus dados ficam somente neste dispositivo.”
6. **Chrome global preservado:**
   - Tab bar: Veículos | Manutenções | Ajustes — item ativo com cor primária e indicador (ponto) sob o rótulo, como no print
   - Banner de publicidade reservado (50px, placeholder) nas mesmas condições atuais (fora de cadastro/onboarding)
   - Safe-area no tab bar

Navegação entre tabs, views aninhadas e ausência de React Router **não mudam**.

### C. Card de veículo

Cada veículo é um card com:

1. **Acento** superior na cor primária (faixa fina no topo do card).
2. **Cabeçalho do card:**
   - Ícone de carro em chip claro
   - Placa em destaque (título)
   - Badge de ano/modelo **somente se** `anoModelo` estiver preenchido
   - Marca/modelo como subtítulo
   - Menu “⋯” (kebab) abrindo ações secundárias: **Editar** e **Excluir** (mesmas regras de exclusão/cascade da spec de veículos e do inventário)
3. **Metadados em linha:**
   - Km atual formatado (`pt-BR`) + sufixo “km”
   - Contagem de manutenções daquele veículo (“N manutenção(ões)” / copy i18n)
4. **Alerta interno (opcional):** se `proximaTroca` estiver preenchida, exibir faixa creme com ícone de relógio e o texto de `proximaTroca` (campo livre já existente — sem novo cálculo de km nesta spec).
5. **CTA primário do card:** botão em bloco “Ver manutenções” → abre o histórico do veículo e seleciona a tab Manutenções (comportamento atual de `onOpenHistorico`).

Alvo de toque dos controles interativos: mínimo 24×24 CSS px (AA); preferência de projeto 44×44 onde o layout permitir.

### D. O que não muda (contrato funcional)

- CRUD de veículos, validação, exclusão com/sem cascade e confirmações
- Critérios do lembrete de backup (N edições / M dias) e export via fluxo já existente
- Persistência (OPFS / `.cofre`), ads placeholder, gates de onboarding/termo/navegador
- Demais abas e formulários **continuam funcionando**; apenas a home Veículos e a fundação de tokens entram no escopo visual desta spec

## Casos de borda

- **Nenhum veículo:** empty state atual (título, corpo, CTA “Cadastrar primeiro veículo”); faixa de estatísticas mostra Veículos `0`, Manutenções `0`, Backup conforme prefs; CTA “+ Novo veículo” do header pode ficar oculto (como hoje o botão “Novo” só aparece com lista não vazia) para não duplicar CTAs.
- **Veículo sem `anoModelo`:** sem badge de ano.
- **Veículo sem `proximaTroca`:** sem faixa de alerta interna.
- **Zero manutenções no veículo:** metadado “0 manutenções” (ou copy i18n equivalente), sem esconder o dado.
- **Nunca houve export:** card Backup da faixa de stats não inventa data — usa estado “nunca” / “sem backup”.
- **Lembrete dispensado na sessão:** banner some; stats de Backup continuam visíveis.
- **Usuário em formulário / onboarding / gates:** layout novo da home **não** se aplica; regras atuais de ocultar ads/tabs permanecem.
- **Texto longo em placa / marca / próxima troca:** truncar ou quebrar sem estourar o card nem cobrir o menu/CTA; sem scroll horizontal da página.
- **Zoom 200% / viewport estreito (~320 CSS px):** conteúdo reflow sem scroll bidimensional obrigatório; CTAs e menu permanecem operáveis por teclado e toque.
- **Menu kebab:** fechar ao escolher ação, ao tocar fora ou via Escape; foco retorna ao botão que abriu o menu; exclusão continua passando pelos `IonAlert` existentes (não excluir direto do menu).

## Fora do escopo

- Redesign visual completo das abas Manutenções e Ajustes, formulários, onboarding e gates (apenas consumo futuro dos tokens)
- Troca do Ionic por outro UI kit (exigiria revisão explícita do ADR-003)
- AdSense / rede de anúncios real (mantém placeholder)
- Novos campos de domínio, cálculo automático de “km até a troca”, ou mudança das regras de backup
- Dark mode
- Ilustrações custom além de ícones do set já usado (Ionicons / equivalentes)
- Animações elaboradas além de transição leve de foco/estado (respeitar `prefers-reduced-motion`)

## Critérios de aceite

### Design system

- [ ] Tokens de cor, tipografia, raio e elevação estão centralizados e documentados o bastante para reuso (arquivo(s) de tema / CSS variables)
- [ ] Tema Ionic usa a primária navy e o fundo cinza claro na app shell afetada
- [ ] Contraste AA verificado para pares texto-sobre-fundo e botão primário (texto branco sobre navy)
- [ ] Nenhuma string de UI nova fica hardcoded fora de `pt-BR.ts`

### Tela inicial (Meus veículos)

- [ ] Cabeçalho exibe eyebrow do app + título “Meus veículos” + CTA “Novo veículo” conforme regras de empty/lista
- [ ] Faixa de 3 stats reflete contagem real de veículos, total de manutenções e tempo relativo (ou “nunca”) do último backup
- [ ] Banner de backup só aparece quando `shouldShowBackupReminder` é verdadeiro e não foi dispensado na sessão; Export / Agora não preservam o comportamento atual
- [ ] Cada veículo aparece como card com placa, marca/modelo, km, contagem de manutenções e CTA “Ver manutenções”
- [ ] Badge de ano e faixa de próxima troca só aparecem quando os campos existem
- [ ] Menu ⋯ expõe Editar e Excluir; exclusão com e sem histórico mantém os dois fluxos de confirmação atuais
- [ ] “Ver manutenções” abre o histórico e ativa a tab Manutenções
- [ ] Rodapé “Seus dados ficam somente neste dispositivo.” está visível na lista (e no empty, se couber no layout sem conflitar com o CTA)
- [ ] Tab ativa “Veículos” usa estilo do print (cor primária + indicador)
- [ ] Banner de ads 50px e safe-area do tab bar permanecem nas condições atuais
- [ ] Empty state continua permitindo cadastrar o primeiro veículo
- [ ] Testes E2E existentes da aba veículos / backup / shell são atualizados aos novos `data-testid`/rótulos e passam
- [ ] Controles novos (CTA header, menu, CTA do card, ações do banner) são operáveis por teclado; nomes acessíveis contêm o texto visível (SC 2.5.3)

## Estratégia de teste

- **Unitário:**
  - Formatação do tempo relativo do backup (hoje / há N dias / nunca) a partir de `lastBackupAt`
  - Agregação das stats (contagem de veículos + soma de manutenções) se extraída para helper puro
- **Integração:** não obrigatória além do que já cobre prefs/backup; UI consome hooks/sessão existentes
- **E2E:**
  - Home com ≥ 1 veículo: título, stats, card, “Ver manutenções”, menu Editar
  - Empty state: CTA de primeiro veículo
  - Lembrete de backup: aparece sob critério mockado; “Agora não” dispensa; Export dispara fluxo existente
  - Exclusão via menu: com e sem cascade (alerts)
  - Shell: tab Veículos ativa; ads visível fora de cadastro

## Notas de implementação

- **Escopo grande:** na geração do implementation plan, preferir duas fatias — (1) tokens + tema Ionic + tab bar, (2) composição da home (stats, banner, cards, empty). Esta spec permanece a fonte de verdade única do “o quê”.
- **ADR-003:** customizar visual via tema é esperado; introduzir um segundo kit paralelo (ex.: shadcn ao lado do Ionic) **não** está autorizado sem novo ADR. Se o redesign exigir abandonar o Ionic, perguntar antes e revisar o ADR.
- Reutilizar hooks/orquestração atuais (`HomePage`, `useVeiculos`, `getManutencoesCount`, `useAppPrefs` / `showBackupReminder`); evitar duplicar regras de backup.
- Preferir componentes Ionic onde já resolvem a11y (ex.: `IonAlert` na exclusão; `IonButton` / botão nativo para CTAs). Menu ⋯: padrão completo (botão + menu/listbox ou action sheet) — sem `div` clicável.
- Preservar `data-testid` estáveis sempre que possível; se renomear, atualizar `tests/e2e` na mesma entrega.
- Inventário em `docs/ux-ui-inventario-telas.md` descreve o **antes**; não precisa ser reescrito automaticamente nesta tarefa (docs de discovery/architecture/inventário são manutenção manual).
- Após implementar, se tokens e convenções de UI passarem a ser regra de projeto, atualizar a seção de convenções em `docs/CONTEXT.md` (ver “Quando atualizar este arquivo”).
