# Spec: Formulário de manutenção (wizard Nova / Editar)

**Status:** rascunho
**Data:** 2026-08-28
**Arquitetura relacionada:** [sistema-historico-veiculos](/docs/architecture/sistema-historico-veiculos.md)
**ADRs relacionados:**
- [ADR-003 — Ionic React como UI kit](/docs/adr/003-ionic-react-como-ui-kit.md)
**Referências de produto:**
- Redesign UX/UI (seções Nova manutenção / Etapas / Navegação do formulário)
- Tokens e tema: [design-system-home-veiculos](/docs/specs/design-system-home-veiculos.md) (mesma fundação visual; esta spec não redefine a paleta)
- Histórico que abre este formulário: [ui-manutencoes-historico](/docs/specs/ui-manutencoes-historico.md)
- Comportamento de domínio (inalterado): [manutencoes](/docs/specs/manutencoes.md), [anexos](/docs/specs/anexos.md), [ocr](/docs/specs/ocr.md)
- Inventário funcional atual: [ux-ui-inventario-telas.md](/docs/ux-ui-inventario-telas.md) §3.9

## Objetivo

Reduzir a sensação de formulário extenso ao registrar ou editar uma manutenção, guiando o usuário em três etapas (comprovante → dados → peças e valores), sem alterar regras de negócio, anexos, OCR ou schema.

## Comportamento esperado

### Pré-condição e navegação

A composição aplica-se à view `manutencao-form` (criação ou edição), com cofre aberto, termo aceito e veículo selecionado.

- **Header:** “Nova manutenção” ou “Editar manutenção” + botão voltar (`header-back`).
- **Contexto do veículo:** placa e marca/modelo visíveis no formulário (mesmo espírito do histórico), para o usuário não precisar lembrar qual veículo está editando.
- **Ads:** ocultos durante o formulário (regra atual do shell).
- **Tabs:** permanecem conforme o shell atual; não inventar navegação por URL.
- Criação e edição usam o **mesmo wizard**; não há fluxo paralelo.

### Progresso e CTAs de navegação

1. Indicador de progresso: **“1 de 3”**, **“2 de 3”**, **“3 de 3”** (copy i18n; etapa atual identificável visualmente e para leitores de tela).
2. **Continuar** nas etapas 1 e 2 — avança sem validar campos obrigatórios.
3. **Salvar manutenção** somente na etapa 3 — dispara validação de domínio e persistência atuais.
4. Voltar **entre etapas** (header nas etapas 2–3, ou controle equivalente): retorna à etapa anterior **sem perder** estado do formulário nem anexos pendentes.
5. **Header voltar na etapa 1** (ou Cancelar equivalente): descarta anexos pendentes de criação e retorna ao histórico — mesmo contrato atual de `onCancel`.
6. Microinteração discreta na troca de etapa (respeitar `prefers-reduced-motion`); a animação comunica transição, não decora.

### Etapa 1 — Comprovante

**Título:** “Adicionar comprovante”

1. **Empty (sem anexos):** texto orientando a adicionar foto ou PDF da nota para preencher dados mais rapidamente (copy alinhada ao redesign; i18n).
2. **CTAs de anexo** (três ações distintas; mesma capacidade funcional de hoje, com intenção explícita):
   - **Tirar foto** — `<input type="file" accept="image/*" capture="environment">`
   - **Escolher da galeria** — `<input type="file" accept="image/*">` sem `capture`
   - **Anexar PDF** — input PDF atual
3. Após anexar: preview, listagem (nome/tamanho), visualizar e remover com confirmação — comportamento de [anexos](/docs/specs/anexos.md).
4. Alerta de PDF ≥ ~2 MB: “Cancelar” / “Anexar mesmo assim” — inalterado.
5. **Criação:** anexos pendentes em memória até salvar. **Edição:** persistência imediata ao confirmar arquivo — inalterado.
6. **OCR** (somente imagem; automático ao anexar), copy e estados:
   - Processando: “Lendo a nota…” + ação **“Cancelar OCR”**
   - Sucesso com sugestões: deixar claro que são **sugestões** a revisar (“Sugestões encontradas. Revise os dados antes de salvar.” ou equivalente i18n); OCR nunca parece fonte definitiva
   - Sem campos / ilegível: anexo permanece; preenchimento manual disponível
   - PDF: aviso explícito de que **não há OCR automático**
   - Primeiro uso do modelo / erro de rede: alerts atuais (“Baixar” / “Continuar sem OCR”; “Tentar novamente” / “Continuar sem OCR”)
7. Merge OCR só preenche campos **vazios**; edição humana prevalece. OCR **nunca** bloqueia salvar.

Anexos são **opcionais**: o usuário pode Continuar sem comprovante.

### Etapa 2 — Dados da manutenção

**Título:** “Dados da manutenção”

Campos, na ordem natural (labels persistentes; erros próximos ao campo):

| Campo | Obrigatório | Notas |
|-------|-------------|--------|
| Data | Sim | tipo date; teclado/picker adequado |
| Km | Sim (≥ 0) | numérico |
| Tipo de serviço | Sim | texto |
| Oficina | Não | texto |
| Próxima revisão prevista | Não | texto livre |

Sem excesso de divisórias. Validação de domínio continua a ocorrer no Salvar (etapa 3); se o save falhar por erro de campo desta etapa, o formulário **navega para a etapa 2** e exibe os erros nos campos.

### Etapa 3 — Peças e valores

**Título:** “Peças e valores”

1. Lista de peças: cada item com **descrição** e **valor**; ação para remover o item.
2. CTA **“Adicionar peça”**.
3. Lista vazia é válida (domínio atual).
4. **Resumo financeiro destacado** (não um input readonly genérico):
   - Rótulo: “Total da manutenção”
   - Valor: soma automática das peças em BRL; se não houver peças (ou nenhum valor parseável), exibir `R$ 0,00` ou ausência conforme regra de preview atual — o valor **persistido** continua `null` quando a lista de peças está vazia ([manutencoes](/docs/specs/manutencoes.md)).
5. CTA primário: **“Salvar manutenção”** (desabilitado enquanto `submitting`).
6. CTA secundário opcional na etapa: Cancelar que equivale a abortar o fluxo (mesmo que header etapa 1) — se presente, visualmente subordinado ao Salvar.

### Contrato funcional preservado

- Campos mínimos, validação, valor = soma das peças, vínculo `veiculoId`
- Anexos e OCR conforme specs de domínio
- Sem novos campos; sem OCR em PDF; sem upload em nuvem
- Tokens, tipografia, botões e inputs alinhados ao [design-system-home-veiculos](/docs/specs/design-system-home-veiculos.md)
- Strings apenas em `src/shared/i18n/pt-BR.ts`

### Acessibilidade

- Labels persistentes; erros associados ao campo
- Progresso anunciável (ex.: `aria-current` / texto “etapa X de 3”)
- Feedback OCR e erros de save com `aria-live` quando apropriado
- Alvos de toque ≥ 24×24 CSS px (preferência 44×44 onde o layout permitir)
- Nome acessível contém o texto visível (SC 2.5.3)
- Foco visível; após troca de etapa, foco move de forma previsível (ex.: título da etapa ou primeiro controle)

## Casos de borda

- **Continuar com formulário vazio:** permitido; erros só no Salvar.
- **Save com erros na etapa 2:** após falha, UI mostra etapa 2 com erros nos campos.
- **Save com erros de peças (etapa 3):** permanece na etapa 3 com erros.
- **OCR em andamento + Continuar:** permitido; OCR pode completar e mesclar em campos ainda vazios nas etapas seguintes (merge atual); Cancelar OCR disponível enquanto processa.
- **Cancelar na etapa 1 com pendentes:** descarta sem gravar no cofre.
- **Edição com anexos já persistidos:** etapa 1 lista anexos existentes; remoção com confirmação e persistência imediata.
- **PDF anexado:** sem OCR; aviso visível; Continuar/Salvar liberados.
- **Várias peças / texto longo:** sem scroll horizontal; remoção e inputs usáveis em ~375–430px e em zoom 200% / ~320 CSS px.
- **submitting:** Salvar desabilitado; não duplicar submits.
- **Voltar etapa 3 → 2 → 1 e avançar de novo:** dados e peças preservados.

## Fora do escopo

- Redesign de Ajustes, formulário de veículo, onboarding, gates, snackbar global
- Novos campos de domínio ou OCR automático em PDF
- Troca do Ionic (ADR-003)
- Dark mode
- Persistência do “passo atual” do wizard entre sessões
- Obrigar anexo para salvar

## Critérios de aceite

- [ ] Formulário de criação e edição usa wizard de 3 etapas com indicador “N de 3”
- [ ] Etapa 1: empty orientativo; CTAs Tirar foto, Escolher da galeria e Anexar PDF; preview/remoção/alerta PDF preservados
- [ ] Criação mantém anexos pendentes até salvar; edição persiste anexo na hora
- [ ] OCR: estados e copy de processamento/sugestão/PDF/modelo/erro; merge só em vazios; nunca bloqueia salvar
- [ ] Etapa 2: data, km, tipo, oficina, próxima revisão com labels persistentes e erros junto ao campo
- [ ] Etapa 3: adicionar/remover peças; total destacado como resumo financeiro; Salvar manutenção
- [ ] Continuar avança sem validar; Salvar valida; em erro de campo, UI leva à etapa correspondente
- [ ] Voltar entre etapas preserva dados; voltar na etapa 1 cancela e descarta pendentes
- [ ] Contexto do veículo (placa · marca/modelo) visível; ads ocultos no form
- [ ] Visual consome tokens do design system; strings novas só em `pt-BR.ts`
- [ ] Controles operáveis por teclado; progresso e feedback OCR acessíveis
- [ ] E2E de criar/editar/anexos/OCR atualizados aos novos seletores/rótulos e passando

## Estratégia de teste

- **Unitário:**
  - Helper de índice de etapa ↔ navegação (avanço/retorno com limites 1–3), se extraído
  - Mapeamento `ManutencaoField` → etapa do wizard (para redirecionar após erro de save)
  - Soma preview de peças (já existente / manter cobertura)
- **Integração:** não obrigatória além do CRUD/anexos/OCR já cobertos; UI orquestra hooks existentes
- **E2E:**
  - Nova manutenção: etapa 1 → Continuar → preencher dados → Continuar → peças → Salvar → item no histórico
  - Anexar foto dispara OCR (mock); sugestões aplicadas só em vazios; salvar ok
  - Anexar PDF: aviso sem OCR; salvar ok
  - Cancelar/voltar etapa 1 com pendente: não grava anexo
  - Editar: abre com dados; navegar etapas sem perder; salvar
  - Save inválido (ex.: km vazio): permanece/retorna à etapa 2 com erro

## Notas de implementação

- **Dependência:** tokens/tema de [design-system-home-veiculos](/docs/specs/design-system-home-veiculos.md) e histórico já entregues; não duplicar paleta.
- Reutilizar `ManutencaoForm`, `AnexosSection`, `useAnexos`, `useOcr`, orquestração em `HomePage`; trocar composição (passos), não o contrato de props/domínio.
- Separar câmera e galeria com dois inputs (ou um input reconfigurado por ação) — sem wrapper nativo de câmera.
- Preservar `data-testid` estáveis quando possível; atualizar E2E na mesma entrega se mudar.
- Após implementar, se o padrão de wizard/stepper virar convenção de UI, atualizar `docs/CONTEXT.md` só se “Quando atualizar” se aplicar.
