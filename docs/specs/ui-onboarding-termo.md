# Spec: Onboarding, TermoGate e modal do termo

**Status:** rascunho
**Data:** 2026-08-28
**Arquitetura relacionada:** [sistema-historico-veiculos](/docs/architecture/sistema-historico-veiculos.md)
**ADRs relacionados:**
- [ADR-001 — OPFS como armazenamento de trabalho](/docs/adr/001-opfs-como-armazenamento-de-trabalho.md)
- [ADR-003 — Ionic React como UI kit](/docs/adr/003-ionic-react-como-ui-kit.md)
**Referências de produto:**
- Redesign UX/UI (seções Onboarding, Termo gate, Modal do termo)
- Tokens e tema: [design-system-home-veiculos](/docs/specs/design-system-home-veiculos.md)
- Comportamento (inalterado): [onboarding-backup](/docs/specs/onboarding-backup.md)
- Texto canônico: `src/shared/legal/termoIsencao.ts`
- Inventário: [ux-ui-inventario-telas.md](/docs/ux-ui-inventario-telas.md) §3.3–3.4, §4.2

## Objetivo

Transformar o onboarding denso em três etapas claras e manter o TermoGate leve e o modal de consulta — sem remover informação obrigatória nem alterar o texto jurídico.

## Comportamento esperado

### Chrome comum (onboarding e TermoGate)

- **Sem** tabs e **sem** ads.
- Header com identidade do app quando fizer sentido.
- Tokens do design system (fundo, tipografia, botões).

### A. Onboarding completo — 3 etapas

**Quando:** primeiro uso — termo ainda não aceito **e** nenhum cofre de trabalho.

#### Etapa 1 — Boas-vindas

- Título: **“Bem-vindo ao Histórico de Veículos”**
- Explicar brevemente o propósito do app.
- Visual simples: veículo → histórico → manutenção (ícones/ilustração leve; sem clichê de oficina).
- CTA: **“Continuar”**

#### Etapa 2 — Dados no dispositivo

- Título: **“Seus dados ficam no dispositivo”**
- Bloco **“Salvo automaticamente”** — dados locais no dispositivo.
- Bloco **“Faça cópias de segurança”** — necessidade de exportar o `.cofre`.
- Visual: dispositivo → `.cofre` → backup.
- CTA: **“Continuar”**
- Preservar o sentido das orientações atuais (gravação automática + cópias em locais seguros + caminho para exportar em Ajustes); pode condensar copy, **não** omitir a responsabilidade do usuário.

#### Etapa 3 — Antes de começar (termo)

- Título: **“Antes de começar”**
- Termo **completo** — exatamente o conteúdo de `TERMO_ISENCAO_*`; **não resumir nem modificar**.
- Área rolável confortável em celular.
- Checkbox: **“Li e aceito o termo de isenção”**
- CTA: **“Aceitar e continuar”** — desabilitado até o aceite.
- Sem aceite: orientação clara de que não será possível criar ou importar o cofre.
- Após aceite: navegar para aba **Ajustes** (criar/importar cofre) — inalterado.

Indicador de progresso “1 de 3” / “2 de 3” / “3 de 3” (mesmo espírito do formulário de manutenção). Voltar entre etapas 2→1 e 3→2 sem perder o estado do checkbox se o usuário já tiver marcado (opcional mas desejável).

### B. TermoGate (aceite leve)

**Quando:** já existe cofre no dispositivo, mas prefs ainda sem aceite.

- Título: **“Aceite necessário”**
- Explicação curta.
- Termo completo (mesmo texto canônico), rolável.
- Checkbox + CTA **“Aceitar e continuar”** (desabilitado sem aceite).
- Hint de recusa.
- Sem tabs/ads.
- Sem as etapas educativas 1–2 do onboarding completo.

### C. Modal do termo (`TermoModal`)

- Header: **“Termo de isenção”**
- Botão: **“Fechar”**
- Conteúdo: texto jurídico completo, área rolável, modal alto/confortável em celular.
- Somente leitura; sem alterações ao texto.
- Aberto a partir de Ajustes (“Ver termo de isenção”).

### Contrato funcional preservado

- Prefs `termoAccepted` fora do SQLite; aceite pré-requisito para criar/importar no primeiro uso
- Retorno com cofre: não repetir onboarding completo
- Mesma fonte legal para UI e rodapé do PDF

## Casos de borda

- Recusa do termo: CTA desabilitado; hints visíveis; sem criar/importar cofre.
- Usuário volta da etapa 3 para 2: termo ainda acessível ao avançar de novo.
- Viewport estreito: termo rolável sem perder checkbox/CTA fixos ou com scroll consciente que não esconda o CTA permanentemente.
- Zoom 200%: operável por teclado e toque.

## Fora do escopo

- Alterar texto jurídico
- Backup Drive / sync
- Redesign da aba Ajustes (spec própria)
- Troca do Ionic; dark mode

## Critérios de aceite

- [ ] Onboarding em 3 etapas com títulos e CTAs do redesign; sem tabs/ads
- [ ] Etapa 3 exibe termo completo canônico; checkbox habilita “Aceitar e continuar”
- [ ] Pós-aceite direciona para Ajustes
- [ ] TermoGate leve com termo completo + aceite; sem tabs/ads
- [ ] Modal do termo: título, fechar, texto completo rolável
- [ ] Tokens do DS; strings novas só em `pt-BR.ts` (texto legal continua na fonte canônica)
- [ ] E2E de onboarding/termo atualizados e passando

## Estratégia de teste

- **Unitário:** regra de quando mostrar onboarding vs TermoGate (se extrair); prefs já cobertas
- **E2E:** primeiro uso → 3 etapas → aceite → Ajustes; TermoGate com cofre sem aceite; abrir/fechar modal do termo; CTA desabilitado sem checkbox

## Notas de implementação

- Reutilizar `OnboardingFlow`, `TermoGate`, `TermoModal`; não duplicar `TERMO_ISENCAO_*`.
- Condensar copy educativa nas etapas 1–2 sem remover obrigações da spec [onboarding-backup](/docs/specs/onboarding-backup.md).
