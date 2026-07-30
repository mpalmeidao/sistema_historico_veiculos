# Arquitetura: Sistema de Histórico de Veículos

**Data:** 2026-07-29
**Status:** definido
**ADRs relacionados:**
- [ADR-001 — OPFS como armazenamento de trabalho](/docs/adr/001-opfs-como-armazenamento-de-trabalho.md)
- [ADR-002 — sql.js no MVP com storage abstraído](/docs/adr/002-sql-js-no-mvp-com-storage-layer-abstraido.md)
- [ADR-003 — Ionic React como UI kit](/docs/adr/003-ionic-react-como-ui-kit.md)
- [ADR-004 — Cloudflare Pages como hospedagem](/docs/adr/004-cloudflare-pages-como-hospedagem.md)
**Specs relacionadas:** — (ainda não existem)

## Visão geral

Webapp/PWA 100% client-side para arquivar histórico de manutenções veiculares. Não há login, backend de dados nem sincronização: o usuário trabalha com um **cofre** (arquivo SQLite `.cofre`) e o app é só a interface local para esse arquivo.

A restrição que molda o desenho é **mobile-first** (maioria dos acessos no celular) combinada com **solo dev** e MVP em semanas. Por isso a persistência de trabalho usa OPFS (gravação automática em todas as plataformas-alvo) e o `.cofre` fica reservado a export/import explícito — backup e portabilidade — em vez de depender da File System Access API, ausente ou inconsistente no mobile.

Princípios que guiam o design: nenhum dado do usuário trafega para servidor; processamento pesado (OCR, redimensionamento) fora da main thread; storage do cofre atrás de interface própria para trocar o motor SQLite sem tocar na UI; OCR nunca bloqueante — só pré-preenche, o usuário sempre confirma.

## Responsabilidades

- Servir e instalar o app shell como PWA (manifest, service worker, cache do shell e do modelo OCR)
- Criar, abrir e persistir o cofre de trabalho no OPFS; exportar e importar o arquivo `.cofre`
- Aplicar migrações de schema e recusar cofres com schema mais novo que o app
- CRUD de veículos e manutenções vinculadas
- Importar anexos (foto/PDF), padronizar imagens e armazená-los como BLOBs
- Extrair texto de notas via OCR e mapear para o formulário (com confirmação humana)
- Gerar relatório PDF A4 do histórico de um veículo
- Orientar backup e exibir termo de isenção de responsabilidade

**Fora do escopo deste sistema (MVP):**

- Sincronização entre dispositivos ou resolução de conflitos
- Login, contas ou armazenamento de dados do usuário em servidor
- Alertas/notificações de vencimento de peças
- Backup automático em nuvem (Google Drive — pós-MVP; iCloud fora de escopo)
- Edição colaborativa no mesmo cofre

## Componentes

### App Shell / PWA

**Tipo:** app shell + service worker  
**Responsabilidade:** instalar o app, cachear o shell e o modelo OCR, nunca o cofre.

React 18+ com Vite e `vite-plugin-pwa` (Workbox). O service worker cacheia HTML/JS/CSS/WASM do app e o `por.traineddata` na primeira descarga (com aviso de tamanho). O cofre fica no OPFS ou no arquivo exportado pelo usuário — fora do escopo de instalação/cache.

### UI (Ionic React)

**Tipo:** components + hooks + Context API  
**Responsabilidade:** interface mobile-first para todos os fluxos do produto.

Ionic React entrega sheets, tabs, gestos e safe-area sem montar isso na mão ([ADR-003](/docs/adr/003-ionic-react-como-ui-kit.md)). Estado com Context API + hooks; Zustand só se houver dor real. Strings de UI isoladas (sem i18n framework no MVP). Ads: um banner fixo com espaço reservado, fora dos fluxos de cadastro.

### Camada de Storage do Cofre

**Tipo:** service / repository (interface abstraída)  
**Responsabilidade:** única fronteira permitida para criar, abrir, ler, gravar, exportar e importar o cofre.

Implementação MVP: sql.js (SQLite em memória + serialização para bytes) ([ADR-002](/docs/adr/002-sql-js-no-mvp-com-storage-layer-abstraido.md)). Persistência de trabalho: OPFS, save silencioso a cada alteração ([ADR-001](/docs/adr/001-opfs-como-armazenamento-de-trabalho.md)). Export/import: arquivo `.cofre`. File System Access API: enhancement opcional em desktop Chrome/Edge, atrás de feature-check.

O cofre é um SQLite único com anexos como BLOBs; `PRAGMA application_id` valida o arquivo; `PRAGMA user_version` carrega a versão de schema. Versionamento de conteúdo (contador + data de modificação) é independente da versão de schema.

Nenhum componente, hook ou módulo de domínio chama sql.js diretamente — violar isso anula o ADR-002.

### Migrações de Schema

**Tipo:** service  
**Responsabilidade:** detectar `user_version`, aplicar migrações progressivas (v1→v2→v3…) e recusar schema mais novo que o app.

Cofre com schema desconhecido nunca é regravado — evita corrupção irreversível sem backend de recuperação. Testes de migração são obrigatórios e devem rodar contra a interface de storage, não contra sql.js.

### Domínio: Veículos e Manutenções

**Tipo:** modules / hooks  
**Responsabilidade:** regras e operações de CRUD sobre veículos e manutenções vinculadas.

Veículo: placa, marca/modelo, ano/modelo, km atual, próxima troca. Manutenção: data, km, tipo de serviço, peças, oficina, valor, próxima revisão, vínculo ao veículo e anexos opcionais. Consomem apenas a interface de storage.

### Anexos

**Tipo:** service + worker  
**Responsabilidade:** importar foto/PDF, padronizar imagens e persistir como BLOB no cofre.

Imagens: máx. 1600 px no lado maior, JPEG ~80%, alvo ≤ 500 KB. PDFs mantidos como estão, com aviso acima de ~2 MB. Redimensionamento/recompressão em Web Worker / OffscreenCanvas para não travar a UI em aparelhos de entrada.

### OCR

**Tipo:** worker + parser  
**Responsabilidade:** extrair texto da nota e pré-preencher o formulário de manutenção.

Tesseract.js (`por`) em Web Worker; pré-processamento da imagem (escala de cinza, contraste/binarização). O parser OCR→formulário é ponto crítico de teste: bug aqui perde ou corrompe dados sem recuperação. OCR nunca é bloqueante — nota ilegível fica só como imagem, preenchimento manual.

### Relatório PDF

**Tipo:** service  
**Responsabilidade:** gerar PDF A4 do histórico de um veículo com pdf-lib.

Conteúdo: capa com dados do veículo e resumo; tabela cronológica; detalhe por manutenção com miniatura do anexo quando houver; rodapé com data de geração, versão/data do cofre e isenção de responsabilidade.

### Onboarding e Backup

**Tipo:** components / flows  
**Responsabilidade:** termo de isenção, orientação de backup no primeiro cofre e lembretes não intrusivos.

Com OPFS, o usuário não vê um "arquivo aberto" o tempo todo; a mensagem "seus dados, sua responsabilidade" depende desta UX ([ADR-001](/docs/adr/001-opfs-como-armazenamento-de-trabalho.md)).

### Hospedagem

**Tipo:** infraestrutura estática  
**Responsabilidade:** servir HTML/JS/CSS/WASM — nenhum dado de usuário.

Cloudflare Pages + GitHub Actions (build/deploy a cada push) ([ADR-004](/docs/adr/004-cloudflare-pages-como-hospedagem.md)).

## Fluxos principais

### Criar / abrir cofre e persistir no OPFS

1. Usuário cria cofre novo ou importa um `.cofre`.
2. Storage valida `application_id` e lê `user_version`.
3. Se schema antigo → migrações progressivas; se schema mais novo → recusa com orientação para atualizar o app.
4. Banco fica em memória (sql.js); cópia de trabalho é gravada no OPFS.
5. Cada alteração relevante serializa e salva no OPFS sem pedir interação.

### Exportar / importar `.cofre`

1. Export: storage serializa o banco e dispara download ou share sheet.
2. Import: usuário escolhe arquivo; storage valida e carrega; passa a ser o cofre de trabalho no OPFS.
3. Cada cópia é um cofre independente — sem sync nem merge.

### Cadastrar manutenção com anexo e OCR

1. Usuário anexa foto (câmera via `<input capture="environment">`) ou PDF.
2. Anexos: imagem é redimensionada/recomprimida no worker; PDF segue com aviso se grande.
3. OCR (se imagem): worker Tesseract extrai texto; parser mapeia campos do formulário.
4. Usuário revisa/confirma (ou preenche manualmente se OCR falhar).
5. Manutenção + BLOB são gravados via storage; OPFS atualiza.

### Gerar relatório PDF

1. Usuário solicita relatório de um veículo.
2. Domínio lê manutenções e anexos via storage.
3. pdf-lib monta capa, tabela, detalhes e rodapé com isenção.
4. PDF é oferecido para download/share — não é enviado a servidor.

### Instalação PWA e cache do modelo OCR

1. App shell é servido pelo Cloudflare Pages e cacheado pelo service worker.
2. Na primeira uso de OCR, o modelo `por.traineddata` é baixado (com aviso de tamanho) e cacheado pelo SW.
3. Uso offline do shell é possível; o cofre continua local no OPFS / arquivo do usuário.

## Dependências

**Internas:**

- Módulos de domínio (Veículos, Manutenções, Anexos, OCR, Relatório, Onboarding) → Camada de Storage
- Migrações → Camada de Storage
- UI → todos os módulos acima via hooks/services; nunca sql.js direto

**Externas:**

- React 18+ / Vite
- Ionic React
- sql.js (WASM)
- OPFS (API do navegador); File System Access API (opcional, desktop)
- Tesseract.js + modelo `por`
- pdf-lib
- vite-plugin-pwa / Workbox
- Cloudflare Pages + GitHub Actions

## Decisões de design

- **OPFS como trabalho, `.cofre` como portátil:** única combinação com gravação automática confiável no iPhone (cenário prioritário). Ver [ADR-001](/docs/adr/001-opfs-como-armazenamento-de-trabalho.md).
- **sql.js + interface de storage no MVP:** escala típica (1–3 veículos, 20–100 manutenções) e timeline curta não justificam wa-sqlite agora; a abstração mantém a troca barata. Ver [ADR-002](/docs/adr/002-sql-js-no-mvp-com-storage-layer-abstraido.md).
- **Sem sync / sem conflitos por design:** cada cópia do cofre é independente; evita complexidade que o MVP não precisa.
- **Schema mais novo = recusa, nunca overwrite:** sem backend, corrupção é irreversível.
- **OCR não bloqueante:** precisão variável em notas brasileiras; o valor está no anexo + confirmação humana.
- **Processamento pesado em Worker:** público prioritário em aparelhos de entrada.
- **Ionic React:** velocidade mobile-first para solo dev. Ver [ADR-003](/docs/adr/003-ionic-react-como-ui-kit.md).
- **Cloudflare Pages:** plano gratuito permite ads; Vercel Hobby não. Ver [ADR-004](/docs/adr/004-cloudflare-pages-como-hospedagem.md).
- **Feature-check em APIs de navegador:** OPFS e File System Access sempre atrás de detecção, com caminho alternativo definido.
- **Suporte mínimo iOS/Safari 16.4+:** OPFS completo; abaixo disso, aviso para atualizar.

## Evolução esperada

- **Backup Google Drive (pós-MVP):** OAuth client-side, escopo `drive.file`, opcional nas configurações — sem quebrar o modelo sem login.
- **Troca sql.js → wa-sqlite + OPFS VFS:** se cofres grandes ou aparelhos fracos mostrarem lentidão real (gatilho do ADR-002).
- **Estrutura de pastas, TypeScript vs JS, linter e organização de camadas:** a definir na primeira spec de implementação (ainda aberto no CONTEXT).
- **iCloud / Capacitor:** só se houver versão nativa; fora de escopo da PWA atual.
