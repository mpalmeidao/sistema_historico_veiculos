# Spec: Empty states restantes

**Status:** rascunho
**Data:** 2026-08-28
**Arquitetura relacionada:** [sistema-historico-veiculos](/docs/architecture/sistema-historico-veiculos.md)
**ADRs relacionados:**
- [ADR-003 — Ionic React como UI kit](/docs/adr/003-ionic-react-como-ui-kit.md)
**Referências de produto:**
- Redesign UX/UI (seção Empty states)
- Tokens: [design-system-home-veiculos](/docs/specs/design-system-home-veiculos.md)
- Empty já cobertos: home veículos (design-system-home-veiculos), histórico (ui-manutencoes-historico), anexos no form (ui-manutencao-form)
- Inventário: [ux-ui-inventario-telas.md](/docs/ux-ui-inventario-telas.md) §3.7 e empty de cofre

## Objetivo

Padronizar a linguagem visual dos empty states que **ainda não** seguem o padrão do design system (ícone/ilustração + título + explicação curta + CTA quando existir), sem inventar navegação nova.

## Comportamento esperado

### Padrão visual comum

Todo empty state coberto por esta spec deve conter:

1. Ícone ou ilustração contextual simples (Ionicons / set já usado — sem arte custom obrigatória)
2. Título objetivo
3. Explicação curta orientando o próximo passo
4. Ação principal **quando existir** caminho claro

Não usar mensagens genéricas de sistema. Densidade: útil, sem tela vazia com ilustração enorme.

### A. Tab Manutenções sem veículo selecionado

**Quando:** tab Manutenções, view `main`, sem veículo aberto.

- Título: **“Escolha um veículo”** (ou copy i18n equivalente)
- Corpo: orientar a abrir a aba Veículos e usar **“Ver manutenções”** (comportamento atual; **sem** deep-link persistente de último veículo — fora de escopo das specs anteriores)
- Sem CTA que invente seleção automática; opcionalmente CTA secundário **“Ir para Veículos”** que apenas troca a tab (se já for trivial no shell) — não obrigatório se a copy bastar

### B. Cofre ausente na aba Ajustes

Alinhado a [ui-ajustes-backup](/docs/specs/ui-ajustes-backup.md):

- Título objetivo (ex.: nenhum cofre neste dispositivo)
- Explicação: criar ou importar
- CTAs: cobertos pela própria tela de Ajustes (Criar / Importar) — esta spec só exige o bloco empty visualmente consistente

### C. Anexos sem nota (form manutenção)

Já especificado em [ui-manutencao-form](/docs/specs/ui-manutencao-form.md) (“Adicione uma foto ou PDF…”). Esta spec **não** redefine; apenas exige o mesmo padrão visual (ícone + título/corpo) se ainda estiver genérico após a implementação do form.

### D. Empty já entregues (não redesenhar de novo)

- Veículos: “Nenhum veículo cadastrado” + CTA primeiro veículo
- Manutenções (com veículo): “Nenhuma manutenção registrada” + CTA primeira manutenção

Se o padrão visual divergir entre telas, **alinhar** tipografia/espaçamento/ícone ao token do DS sem mudar copy já aceita.

## Casos de borda

- Copy longa: quebra sem overflow horizontal.
- Sem CTA: não inventar botão inútil.
- Zoom / teclado: conteúdo legível e focável.

## Fora do escopo

- Lembrar último veículo na tab Manutenções
- Novos fluxos de onboarding de empty
- Ilustrações custom elaboradas

## Critérios de aceite

- [ ] Empty “Escolha um veículo” na tab Manutenções sem seleção segue o padrão (ícone + título + explicação)
- [ ] Empty de cofre ausente em Ajustes alinhado ao padrão visual
- [ ] Empty de veículos e manutenções já existentes visualmente coerentes com o DS (ajuste fino se necessário)
- [ ] Strings novas só em `pt-BR.ts`
- [ ] E2E que cobrem pick de veículo / empty de lista atualizados se rótulos mudarem

## Estratégia de teste

- **E2E:** abrir tab Manutenções sem veículo → ver empty de escolha; Ajustes sem cofre → empty + CTAs criar/importar

## Notas de implementação

- Preferir um componente reutilizável leve (`EmptyState`) se reduzir duplicação; não abstrair cedo demais se só 2–3 usos.
- Não alterar regras de quando o empty aparece.
