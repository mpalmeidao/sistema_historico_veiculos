# Contexto do Projeto

## O que é
Webapp/PWA gratuito, sem login e sem backend de dados, para arquivar histórico de manutenções veiculares. Os dados vivem em um "cofre" (arquivo SQLite) no dispositivo do usuário; o app é apenas a interface local para ele.

**Mobile-first** (a maioria dos acessos é pelo celular) e **solo dev** — as duas restrições que orientam a maioria das escolhas abaixo.

Fontes: /docs/discovery/discovery-conceitual.md e /docs/discovery/discovery-tech.md. Quando os dois divergirem, **vale o discovery-tech** (ele revisa a decisão de persistência do conceitual).

## Stack
- **Runtime:** navegador (100% client-side, frontend estático — nenhum dado do usuário trafega para servidor)
- **Framework:** React 18+ com Vite
- **PWA:** vite-plugin-pwa (Workbox) — service worker cacheia o app shell e o modelo de OCR, nunca o cofre
- **UI Kit:** Ionic React — [ADR-003](/docs/adr/003-ionic-react-como-ui-kit.md)
- **Estado:** Context API + hooks; migrar para Zustand só se houver dor real. Não usar Redux nem React Query — não existe servidor
- **Banco / formato do cofre:** SQLite via sql.js (WASM) no MVP — [ADR-002](/docs/adr/002-sql-js-no-mvp-com-storage-layer-abstraido.md); `PRAGMA application_id = 0x48564346` (`HVCF`); arquivo de trabalho no OPFS: `trabalho.cofre`
- **Persistência de trabalho:** OPFS (Origin Private File System) — salva automaticamente, funciona em iOS/Android/desktop — [ADR-001](/docs/adr/001-opfs-como-armazenamento-de-trabalho.md)
- **OCR:** Tesseract.js (idioma `por`), em Web Worker. O modelo `por.traineddata` é baixado e cacheado pelo service worker na primeira vez, com aviso de tamanho ao usuário
- **PDF:** pdf-lib
- **Captura de imagem:** `<input type="file" accept="image/*" capture="environment">` (sem wrapper nativo no MVP)
- **Infra/Deploy:** Cloudflare Pages + GitHub Actions (build e deploy a cada push) — [ADR-004](/docs/adr/004-cloudflare-pages-como-hospedagem.md)
- **Suporte mínimo:** iOS/Safari 16.4+ (OPFS completo). Abaixo disso, aviso para atualizar o navegador — Safari 15.2–16.3 tem bugs conhecidos de OPFS e não é alvo

## Decisões arquiteturais principais
- **Cofre = arquivo SQLite único (`.cofre`)** com anexos como BLOBs; `PRAGMA application_id` identifica o arquivo como cofre válido e `PRAGMA user_version` guarda a versão de schema — discovery-conceitual 6.1
- **Persistência separada em duas camadas:** OPFS é o armazenamento de trabalho (salvo silenciosamente a cada alteração) e o arquivo `.cofre` é o formato de export/import explícito, usado para backup e portabilidade. File System Access API não é caminho principal — é enhancement opcional em desktop Chrome/Edge, atrás de feature-check — [ADR-001](/docs/adr/001-opfs-como-armazenamento-de-trabalho.md)
- **Versionamento em duas camadas independentes:** contador de conteúdo + data de modificação (para o usuário saber qual cópia é a mais recente) e versão de schema com migrações progressivas (v1→v2→v3). Cofre com schema mais novo que o app é **recusado**, nunca regravado — discovery-conceitual 6.4
- **Sem sincronização e sem resolução de conflitos por design.** Cada cópia do cofre é um cofre independente — discovery-conceitual 3
- **OCR nunca é bloqueante:** apenas pré-preenche o formulário e o usuário sempre revisa/confirma. Nota ilegível fica anexada só como imagem, com preenchimento manual — discovery-conceitual 6.2
- **Processamento pesado fora da main thread** (OCR e redimensionamento de imagem em Web Worker/OffscreenCanvas), porque o público prioritário usa aparelhos de entrada — discovery-tech 5.4
- **Imagens padronizadas no import:** máx. 1600 px no lado maior, JPEG ~80%, alvo ≤ 500 KB por nota; PDFs mantidos como estão com aviso acima de ~2 MB — discovery-conceitual 6.5
- **Monetização só por ads**, em formato mínimo: um banner fixo com espaço reservado (para não causar layout shift), fora dos fluxos de cadastro. O app não retém dados e exibe termo de isenção de responsabilidade (no onboarding e no rodapé do PDF), além de lembretes de backup — discovery-conceitual 6.6 e 6.7, [ADR-004](/docs/adr/004-cloudflare-pages-como-hospedagem.md)
- **Backup no Google Drive é o primeiro incremento pós-MVP** (escopo `drive.file`, OAuth client-side, sem backend), opcional nas configurações — mitiga o risco da hipótese H1 sem quebrar o modelo "sem login". iCloud fora de escopo — discovery-tech 7

## Convenções de código
Estabelecidas:
- **Linguagem:** TypeScript em todo o app (`strict` via configs do Vite/`tsc -b`)
- **Linter/formatter:** ESLint 9 (flat config) + Prettier; scripts `npm run lint` e `npm run format`
- **Estrutura de pastas e camadas:**
  ```
  src/
    ui/         # páginas, componentes e hooks de interface (Ionic)
    domain/     # regras de negócio — nunca importa sql.js
    storage/    # única fronteira para cofre / OPFS / sql.js (ADR-002)
    shared/     # i18n (PT-BR), feature-checks de navegador, utilitários
    workers/    # Web Workers (OCR, redimensionamento de imagem)
  tests/e2e/    # E2E Playwright (`[fluxo].e2e.ts`)
  ```
- Camada de storage do cofre **abstraída atrás de uma interface própria** — nenhum componente, hook ou módulo de domínio chama sql.js diretamente. É o que permite trocar sql.js por wa-sqlite + OPFS VFS depois sem tocar na UI ([ADR-002](/docs/adr/002-sql-js-no-mvp-com-storage-layer-abstraido.md))
- Idioma da interface e da documentação: PT-BR apenas
- Strings de interface **não hardcoded em componentes** — em `src/shared/i18n/` (ex.: `pt-BR.ts`), para não travar i18n futuro. Sem framework de i18n por enquanto; o custo de isolar agora é baixo, o de retroagir é alto
- Recursos que dependem de API de navegador (File System Access API, OPFS) sempre atrás de **feature-check** (ex.: `src/shared/browser/supportsOpfs.ts`, `supportsFileSystemAccess.ts`), com caminho alternativo definido
- **Cofre (storage) — convenções fixas:**
  - Interface pública em `src/storage` (`createCofreStorage`, `CofreSession`, `CofreStorage`); mutações via `session.mutate()` (incrementa versão de conteúdo + persiste)
  - `PRAGMA application_id = 0x48564346` (fourCC `HVCF`); inválido → recusa sem sobrescrever o trabalho
  - Versão de conteúdo: tabela `cofre_meta` (`content_version` + `modified_at`); create começa em 1; cada `mutate` soma 1 — independente de `user_version`
  - Schema: `CURRENT_SCHEMA_VERSION = 2`; DDL baseline em `schemaV1` + migração `migrateV1ToV2` (`manutencao_pecas`, remove `pecas_trocadas`); runner `ensureSchema` no open/import (menor → migra e persiste; maior → `SCHEMA_TOO_NEW` sem regravar; falha → `MIGRATION_FAILED` sem estado parcial)
  - OPFS: arquivo `trabalho.cofre`; export/import portátil: extensão `.cofre`
  - Testes injetam `createMemoryWorkingStore()`; produção usa OPFS
  - Registry de migrações em `src/storage/migrations.ts` (passos N→N+1); domínio/UI nunca importam sql.js
- **Veículos (domínio) — convenções fixas:**
  - API em `src/domain/veiculos` (`listVeiculos`, `getVeiculo`, `createVeiculo`, `updateVeiculo`, `deleteVeiculo`, `validateVeiculo`); consome só `CofreSession`
  - Campos: placa, marca/modelo, ano/modelo (opcional), km atual (≥ 0), próxima troca (opcional)
  - **Exclusão com histórico:** se o veículo tem manutenções, `deleteVeiculo` exige `cascadeConfirmed: true`; caso contrário lança `CASCADE_NOT_CONFIRMED`. Com confirmação, FK `ON DELETE CASCADE` remove manutenções e anexos. A UI avisa explicitamente a perda do histórico antes de confirmar
- **Manutenções (domínio) — convenções fixas:**
  - API em `src/domain/manutencoes` (`listManutencoesByVeiculo`, `getManutencao`, `createManutencao`, `updateManutencao`, `deleteManutencao`, `validateManutencao`); consome só `CofreSession`
  - **Campos mínimos obrigatórios (MVP):** data (`YYYY-MM-DD`), km (≥ 0), tipo de serviço; `veiculoId` deve existir (criação órfã → `VEICULO_NOT_FOUND`)
  - **Peças trocadas:** lista de `{ descricao, valor }` (`manutencao_pecas`); opcional (lista vazia ok). Valor por item ≥ 0
  - **Valor total** da manutenção = soma automática das peças (coluna `valor` denormalizada); lista vazia → `null`; não é editável manualmente na UI
  - Opcionais: oficina, próxima revisão
  - Listagem: cronológica decrescente (`ORDER BY data DESC, id DESC` — mais recente primeiro)
  - Edição preserva `veiculoId` (não quebra vínculo nem anexos); exclusão exige confirmação na UI
  - Schema: `CURRENT_SCHEMA_VERSION = 2` (peças como tabela filha; migração v1→v2 em `migrateV1ToV2`)
- **Anexos (domínio) — convenções fixas:**
  - API em `src/domain/anexos` (`listAnexosByManutencao`, `getAnexo`, `createAnexo`, `deleteAnexo`, `prepareAnexoFromFile`, `detectAnexoTipo`); consome só `CofreSession`
  - Aceita imagem (`image/*`) e PDF; demais tipos → `UNSUPPORTED_TYPE`
  - Imagens: worker `processImageInWorker` (OffscreenCanvas) — máx. 1600 px no lado maior, JPEG ~80%, alvo ≤ 500 KB; falha do worker → `WORKER_FAILED` (não grava blob parcial)
  - PDF: armazenado sem recompressão; aviso na UI se ≥ ~2 MB (`pdfNeedsSizeWarning` / `PDF_WARN_BYTES`)
  - UI: seção **Anexos da nota** no topo do formulário de manutenção; `<input type="file" accept="image/*" capture="environment">` + input PDF; visualização e remoção com confirmação
  - **Criação:** anexos pendentes em memória (`useAnexos` / `flushPending`) até salvar a manutenção; **edição:** persistência imediata
- **OCR (domínio + workers) — convenções fixas:**
  - Parser puro em `src/domain/ocr` (`parseOcrText`, `mergeOcrSuggestions`) — texto → sugestões; campos sem match ausentes; merge só preenche campos vazios (edição humana prevalece)
  - Campos mapeáveis (subconjunto): data (`YYYY-MM-DD`), km, tipoServico, pecasTrocadas (texto → 1 item no form), oficina, valor (aplicado à peça criada), proximaRevisao
  - Runtime: `runOcrInWorker` — pré-processamento (cinza/contraste/binarização) em Web Worker + Tesseract.js `por` (worker próprio do Tesseract); cancelável via `AbortSignal`
  - Idioma/modelo: `por`; `langPath` em `OCR_MODEL_LANG_PATH` (`@tesseract.js-data/por`); aviso de ~`OCR_MODEL_SIZE_MB_APPROX` MB na primeira uso (`hvcf.ocrModel.v1` / `ocrModelPrefsStore`)
  - **Disparo:** automático ao anexar **imagem** no formulário (sem botão OCR separado); falha/vazio/skip → anexo permanece + aviso; preenchimento manual sempre disponível
  - **PDF sem OCR automático no MVP** (`OCR_PDF_AUTOMATIC_SUPPORTED = false`) — PDF anexa com aviso de ausência de pré-preenchimento
  - OCR nunca bloqueia save manual; falha de rede/modelo → retry ou continuar sem OCR
  - Ponto de integração PWA: cachear URL do modelo (`OCR_MODEL_URL_PATTERN` / `OCR_MODEL_LANG_PATH`) no app-shell — falha de cache não derruba o fluxo
  - Testes: cobertura obrigatória do parser; E2E usa `window.__HVCF_MOCK_OCR__` + prefs ack
- **Onboarding / backup — convenções fixas:**
  - Texto canônico do termo em `src/shared/legal/termoIsencao.ts` (`TERMO_ISENCAO_TEXTO` / `TERMO_ISENCAO_PARAGRAFOS`) — mesma fonte para UI e rodapé do relatório PDF
  - Preferências do app **fora do SQLite**: `localStorage` chave `hvcf.appPrefs.v1` via `src/shared/appPrefs` (`termoAccepted`, `lastBackupAt`, `editsSinceBackup`, `firstUseAt`). Limpar o site apaga prefs e OPFS juntos
  - Aceite do termo é pré-requisito para criar/importar cofre no primeiro uso; retorno com cofre existente não repete onboarding completo (só `TermoGate` se prefs ainda sem aceite)
  - Lembrete de backup **não bloqueante**: após **N = 5** edições ou **M = 7** dias sem export confirmado (`BACKUP_REMINDER_EDIT_THRESHOLD` / `BACKUP_REMINDER_DAYS_THRESHOLD`); dispensar adia só na sessão atual (não spam na mesma visita)
- **Relatório PDF (domínio) — convenções fixas:**
  - API em `src/domain/relatorio` (`montarRelatorioDados`, `generateRelatorioPdf`, `gerarRelatorioVeiculo`, `deliverRelatorioPdf`); consome só `CofreSession` + pdf-lib — geração é somente leitura (não chama `mutate`)
  - A4 via `PageSizes.A4`; vazios como `RELATORIO_VAZIO` (`—`); ordenação cronológica ascendente no PDF
  - Sem manutenções → `NO_MANUTENCOES` (bloqueia; UI mostra mensagem clara)
  - Miniatura se anexo imagem; anexo PDF → indicação “PDF anexado” sem quebrar
  - Rodapé: data/hora de geração, `contentVersion` + `modifiedAt` do cofre, isenção de `TERMO_ISENCAO_*`
  - Entrega só local (`deliverRelatorioPdf`: share sheet ou download) — sem upload
  - UI: botão em `ManutencoesList` + `useRelatorio` (progresso/erro visíveis)
- **App shell / PWA — convenções fixas:**
  - `vite-plugin-pwa` (Workbox `generateSW`, `registerType: 'autoUpdate'`) em `vite.config.ts`; política testável em `src/shared/pwa/cachePolicy.ts`
  - Precache: HTML/JS/CSS/WASM/ícones (`globPatterns`); SPA `navigateFallback: 'index.html'` alinhado a `public/_redirects`
  - Runtime CacheFirst só para modelo OCR (`hvcf-ocr-model` / `OCR_MODEL_WORKBOX_URL_PATTERN`); **nunca** `.cofre`, `blob:`, OPFS ou PDFs do usuário
  - Aviso de tamanho do modelo permanece no fluxo OCR; falha de cache do modelo não derruba o shell
  - Layout: tabs Veículos / Manutenções / Ajustes (`src/ui/shell`); safe-area no tab bar; banner de ads reservado (`AdsBannerPlaceholder`, 50px) fora de cadastro/onboarding — sem AdSense no MVP
  - Gestão do cofre (criar/importar/exportar/meta/termo) na aba Ajustes; aba inicial Veículos no uso normal
  - Navegação aninhada (formulário de veículo, histórico, formulário de manutenção): seta de voltar no `IonHeader` (`data-testid="header-back"`), sem React Router
  - Suporte mínimo: `isMinimumBrowserSupported()` (OPFS; mock E2E `__HVCF_MOCK_MINIMUM_BROWSER__`); abaixo disso `BrowserUnsupportedGate`
    - **UI / design system — convenções fixas:**
      - Tokens em `src/ui/theme/` (`tokens.css` + `components.css`), importados em `App.tsx` após o CSS do Ionic — tema a primária navy e o fundo cinza claro sem segundo UI kit (ADR-003)
      - Home Veículos: cabeçalho “Meus veículos”, faixa de stats (`HomeStatsStrip`), cards com menu kebab (`KebabMenu` + `IonActionSheet`), rodapé de confiança; helpers de apresentação em `src/shared/format/`
      - Histórico de manutenções: contexto do veículo + stats em colunas, card de próxima troca, timeline (`ManutencoesList`), CTA pílula e kebab por item; helpers `formatDisplayDate` / `sumTotalGasto` em `src/shared/format/`
      - Formulário de manutenção: wizard de 3 etapas (comprovante → dados → peças) em `ManutencaoForm` + helpers `wizardSteps.ts`; anexos com CTAs Tirar foto / Galeria / PDF; header voltar consciente da etapa via `backHandlerRef`
      - Ajustes: aba “Backup e dados” (`AjustesBackupPanel`) — card do cofre, Exportar prioritário, Criar/Importar e termo
      - Feedback global: `FeedbackToast` (live region) no shell para sucessos/erros; erros de campo permanecem nos forms
      - Empty states: componente leve `EmptyState` (ícone + título + corpo + CTA opcional) na home, histórico, pick de veículo e anexos
      - Strings novas da home/backup relativo, histórico, wizard e Ajustes em `src/shared/i18n/pt-BR.ts`
- Testes: Vitest unitário com arquivo `[nome].test.ts` ao lado do arquivo testado; E2E Playwright como `[fluxo].e2e.ts` em /tests/e2e — /docs/guidelines/testing.md
- Cobertura de teste é mínima por padrão, mas **obrigatória** em migrações de schema e no parser OCR→formulário, onde um bug corrompe ou perde dados do usuário sem possibilidade de recuperação — sem backend, não há como recuperar

## Módulos principais
| Módulo | Responsabilidade | Docs relacionados |
|--------|-----------------|-------------------|
| Cofre (storage) | Criar/abrir cofre, ler e gravar no OPFS, export/import do `.cofre`, `application_id`, versão de conteúdo | discovery-conceitual 6.1, discovery-tech 2 |
| Migrações de schema | Detectar `user_version`, aplicar migrações progressivas, recusar schema mais novo que o app | discovery-conceitual 6.4 |
| Veículos | CRUD de veículos (placa, marca/modelo, ano/modelo, km atual, próxima troca) | discovery-conceitual 3 e 4 |
| Manutenções | CRUD de manutenções vinculadas a um veículo (data, km, tipo de serviço, peças, oficina, valor, próxima revisão) | discovery-conceitual 3 e 4 |
| Anexos | Import de foto/PDF da nota, redimensionamento e recompressão, armazenamento como BLOB | discovery-conceitual 6.5, discovery-tech 5.4 |
| OCR | Web Worker com Tesseract.js, pré-processamento da imagem e parser do resultado para o formulário | discovery-conceitual 6.2 |
| Relatório | Geração do PDF A4 do histórico do veículo com pdf-lib (capa, tabela cronológica, detalhe por manutenção, rodapé com isenção) | discovery-conceitual 6.3 |
| Onboarding e backup | Termo de isenção, orientação de backup no primeiro cofre e lembretes não intrusivos | discovery-conceitual 6.7 |
| App shell / PWA | Manifest, service worker, instalação, layout mobile-first | discovery-conceitual 6.5, discovery-tech 3 |

## Restrições confirmadas
Substituem as suposições de discovery-tech 1 e resolvem os pontos abertos de discovery-tech 6.
- **Escala:** caso típico de 1 a 3 veículos e 20 a 100 manutenções por cofre. Frotinhas não são alvo do MVP; se virarem, ADR-002 precisa ser reavaliado
- **Timeline:** MVP de validação rápida, em semanas — sem otimização prematura
- **Time:** solo dev
- **Modelo mental aceito:** "o app guarda sozinho, você tira cópias", condicionado a onboarding e lembretes de backup explícitos

## ADRs ativos
- [ADR-001 — OPFS como armazenamento de trabalho, com o `.cofre` reservado para export/import](/docs/adr/001-opfs-como-armazenamento-de-trabalho.md)
- [ADR-002 — sql.js no MVP, com a camada de storage abstraída](/docs/adr/002-sql-js-no-mvp-com-storage-layer-abstraido.md)
- [ADR-003 — Ionic React como UI kit](/docs/adr/003-ionic-react-como-ui-kit.md)
- [ADR-004 — Cloudflare Pages como hospedagem](/docs/adr/004-cloudflare-pages-como-hospedagem.md)

## Quando atualizar este arquivo
Atualize se algum destes itens mudar:
- Decisão arquitetural tomada ou alterada
- Nova dependência relevante adicionada
- Convenção de código estabelecida
- Escopo de um módulo alterado
- Novo ADR criado
- Uma das restrições confirmadas acima mudou
