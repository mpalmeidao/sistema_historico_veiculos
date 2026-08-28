# Spec: Formulário de veículo (Novo / Editar)

**Status:** rascunho
**Data:** 2026-08-28
**Arquitetura relacionada:** [sistema-historico-veiculos](/docs/architecture/sistema-historico-veiculos.md)
**ADRs relacionados:**
- [ADR-003 — Ionic React como UI kit](/docs/adr/003-ionic-react-como-ui-kit.md)
**Referências de produto:**
- Redesign UX/UI (seção Cadastro de veículo)
- Tokens e tema: [design-system-home-veiculos](/docs/specs/design-system-home-veiculos.md)
- Comportamento de domínio (inalterado): [veiculos](/docs/specs/veiculos.md)
- Inventário funcional atual: [ux-ui-inventario-telas.md](/docs/ux-ui-inventario-telas.md) §3.6

## Objetivo

Tornar o cadastro e a edição de veículo uma experiência visual curta, focada e alinhada ao design system — sem mudar campos, validação ou regras de exclusão (exclusão permanece na lista).

## Comportamento esperado

### Pré-condição e chrome

View `veiculo-form` (criação ou edição), cofre aberto, termo aceito.

- **Header:** **“Novo veículo”** ou **“Editar veículo”** + voltar (`header-back`).
- **Ads:** ocultos no formulário (regra atual).
- Voltar / Cancelar: descarta alterações não salvas e retorna à lista de veículos.

### Estrutura do formulário

Experiência em **uma tela** (não wizard), agrupada em duas seções leves:

#### Identificação

| Campo | Obrigatório |
|-------|-------------|
| Placa | Sim |
| Marca / modelo | Sim |
| Ano / modelo | Não |

#### Uso

| Campo | Obrigatório |
|-------|-------------|
| Km atual | Sim (≥ 0); default criação `0` |
| Próxima troca prevista | Não (texto livre) |

1. Labels persistentes; campos obrigatórios claramente identificados (indicação visual + texto, não só cor).
2. Erros próximos ao campo + resumo acessível se já existir no padrão atual.
3. Teclado adequado (texto / numérico).
4. Sem excesso de divisórias ou cards desnecessários.

### CTAs

- Primário: **“Salvar veículo”**
- Secundário: **“Cancelar”** (subordinado visualmente; mesmo efeito do voltar)

Sucesso: retorna à lista (comportamento atual). Não inventar snackbar nesta spec se o feedback global ainda for o texto atual — alinhamento de toast fica em [ui-feedback-overlays](/docs/specs/ui-feedback-overlays.md).

### Contrato funcional preservado

- Validação e persistência via domínio de veículos
- Sem novos campos; sem alertas automáticos de troca
- Tokens do design system; i18n em `pt-BR.ts`

## Casos de borda

- Validação impede save com obrigatórios inválidos; erros visíveis.
- Km negativo / não numérico: rejeitar.
- Texto longo em placa/marca/próxima troca: quebra sem scroll horizontal.
- Zoom 200% / ~320 CSS px: CTAs e campos operáveis.
- `submitting`: Salvar desabilitado.

## Fora do escopo

- Redesign da lista de veículos (já em design-system-home-veiculos)
- Wizard multi-etapa para veículo
- Exclusão neste formulário
- Troca do Ionic; dark mode

## Critérios de aceite

- [ ] Header Novo/Editar + voltar; ads ocultos
- [ ] Seções Identificação e Uso com os cinco campos atuais e obrigatoriedade clara
- [ ] Salvar veículo / Cancelar com hierarquia correta
- [ ] Validação e retorno à lista inalterados funcionalmente
- [ ] Tokens do DS; strings novas só em `pt-BR.ts`
- [ ] Controles operáveis por teclado; labels persistentes
- [ ] E2E de criar/editar veículo atualizados e passando

## Estratégia de teste

- **Unitário:** validação já coberta no domínio; UI sem nova regra
- **E2E:** criar veículo → ver na lista; editar → persistir; cancelar não grava; erros de validação visíveis

## Notas de implementação

- Reutilizar `VeiculoForm`; trocar layout/tokens, não o contrato de props.
- Preservar `data-testid`; atualizar E2E se rótulos mudarem.
