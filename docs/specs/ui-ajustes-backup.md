# Spec: Ajustes — Backup e dados

**Status:** rascunho
**Data:** 2026-08-28
**Arquitetura relacionada:** [sistema-historico-veiculos](/docs/architecture/sistema-historico-veiculos.md)
**ADRs relacionados:**
- [ADR-001 — OPFS como armazenamento de trabalho](/docs/adr/001-opfs-como-armazenamento-de-trabalho.md)
- [ADR-003 — Ionic React como UI kit](/docs/adr/003-ionic-react-como-ui-kit.md)
**Referências de produto:**
- Redesign UX/UI (seção Ajustes / Backup e dados)
- Tokens e tema: [design-system-home-veiculos](/docs/specs/design-system-home-veiculos.md)
- Comportamento (inalterado): [onboarding-backup](/docs/specs/onboarding-backup.md), [cofre-storage](/docs/specs/cofre-storage.md), [app-shell-pwa](/docs/specs/app-shell-pwa.md)
- Inventário funcional atual: [ux-ui-inventario-telas.md](/docs/ux-ui-inventario-telas.md) §3.10

## Objetivo

Tornar a aba Ajustes uma área compreensível de **segurança e portabilidade dos dados** — status do cofre local, backup e gerenciamento — sem alterar criar/importar/exportar nem o termo legal.

## Comportamento esperado

### Pré-condição e chrome

Aplica-se à tab **Ajustes** (`config`), view `main`, com termo aceito (tabs e ads visíveis nas regras atuais do shell).

- Tab Ajustes ativa (estilo do design system: cor primária + indicador).
- Ads 50px e safe-area do tab bar nas condições atuais.
- Sem React Router; mesma orquestração em `HomePage`.

### A. Cabeçalho

1. Título: **“Backup e dados”**
2. Subtítulo: **“Seus dados ficam somente neste dispositivo.”**

Evitar jargão desnecessário (OPFS, SQL, etc.) na UI voltada ao usuário.

### B. Status do cofre

Card **“Cofre local”**:

- Status: **“Ativo neste dispositivo”** quando há sessão aberta
- Exibir **versão do conteúdo** e **última modificação** (dados já disponíveis via meta do cofre)
- Sem sessão: empty orientativo (criar ou importar) — ver seção D / empty

### C. Backup (alta importância visual)

Seção **“Backup”**:

1. Texto: orientar exportação regular de uma cópia dos dados.
2. Mostrar **último backup** (a partir de `lastBackupAt`) com formatação relativa já usada na home (“nunca” / “hoje” / “há N dias”), ou copy explícita **“Você ainda não criou um backup.”** quando nunca exportou.
3. CTA principal: **“Exportar .cofre”** — mesmo fluxo atual; desabilitado sem sessão; ao sucesso marca backup confirmado nas prefs.
4. Orientação breve de manter cópias em locais seguros (sem inventar sync em nuvem).

### D. Gerenciamento

Separar visualmente de Backup:

1. **“Criar cofre novo”** — primary/secondary conforme hierarquia; exige termo aceito (já garantido nesta aba pós-onboarding); regras atuais de criação.
2. **“Importar arquivo .cofre”** — ação subordinada ao export em peso visual quando já há cofre.
3. Se já existe cofre e o usuário importa outro: confirmação destrutiva **“Substituir cofre atual?”** — deixar claro que a operação é **irreversível**; Cancelar / Substituir — inalterado funcionalmente.

### E. Termo

Ação secundária (tertiary / clear): **“Ver termo de isenção”** → abre modal somente leitura existente ([ui-onboarding-termo](/docs/specs/ui-onboarding-termo.md) / `TermoModal`); texto canônico sem alteração.

### Contrato funcional preservado

- Criar / importar / exportar / meta / prefs de backup
- Lembrete de backup na home permanece (não redesenhado aqui)
- Sem login, nuvem, Drive neste MVP

## Casos de borda

- **Sem sessão:** card de status em empty; Export desabilitado; Criar/Importar habilitados (com termo).
- **Nunca exportou:** copy “Você ainda não criou um backup.” + CTA Exportar.
- **Import com cofre existente:** alert destrutivo; cancelar não altera o trabalho.
- **Falha de export/import:** mensagem clara (o que aconteceu + o que fazer); sem “erro inesperado” vago.
- **Texto longo / zoom:** reflow sem scroll horizontal; CTAs operáveis.

## Fora do escopo

- Backup automático Google Drive / iCloud
- Redesign do onboarding ou do banner de lembrete (já na home)
- Alteração do texto jurídico do termo
- Troca do Ionic; dark mode

## Critérios de aceite

- [ ] Header “Backup e dados” + subtítulo de dados locais
- [ ] Card “Cofre local” com status, versão de conteúdo e última modificação quando há sessão
- [ ] Seção Backup com último backup / “ainda não criou” + CTA “Exportar .cofre”
- [ ] Criar cofre e Importar separados visualmente; import com confirmação destrutiva se já há cofre
- [ ] “Ver termo de isenção” abre o modal somente leitura
- [ ] Ads/tabs/safe-area inalterados nas regras atuais
- [ ] Tokens do design system; strings novas só em `pt-BR.ts`
- [ ] E2E de ajustes/cofre atualizados aos novos rótulos/seletores e passando

## Estratégia de teste

- **Unitário:** reutilizar formatação relativa de backup se já coberta; sem nova regra de domínio
- **E2E:** abrir Ajustes; export com sessão; import com confirmação; abrir termo; empty sem cofre

## Notas de implementação

- Orquestração atual da tab config em `HomePage`; trocar composição visual, não a API de storage.
- Hierarquia: Exportar é a ação de rotina mais importante quando há cofre; Criar/Importar não devem competir com o mesmo peso que Exportar nesse caso.
- Após implementar, atualizar `CONTEXT.md` só se a convenção de UI de Ajustes se enquadrar em “Quando atualizar”.
