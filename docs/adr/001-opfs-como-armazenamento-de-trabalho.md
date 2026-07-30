# ADR-001: OPFS como armazenamento de trabalho, com o arquivo `.cofre` reservado para export/import

**Data:** 2026-07-29
**Status:** aceito
**Substituído por:**

## Contexto

O discovery conceitual (seção 6.1) modelou o cofre nos moldes do Obsidian: a File System Access API seria o caminho principal de abertura e gravação, com upload/download manual de arquivo como fallback "nos demais navegadores". A premissa era um cenário desktop-first.

O discovery técnico definiu **mobile-first** como prioridade de plataforma — a maioria dos usuários abre o app no celular. Isso inverte a premissa na prática:

- O iOS Safari, incluindo PWA instalada, não implementa a File System Access API.
- O Android Chrome tem suporte parcial e inconsistente entre versões de Chrome/WebView do aparelho.
- Para a maioria dos usuários-alvo, portanto, o "fallback" do documento original seria o caminho principal.
- Um fluxo que exige re-exportar e re-importar o arquivo manualmente a cada edição é frágil: esquecer significa perder dados.

O OPFS (Origin Private File System) está disponível em Chrome/Edge, Firefox 111+ e Safari 15.2+, desktop e mobile, e permite gravar sem interação do usuário.

## Alternativas consideradas

- **File System Access API como caminho principal** (proposta original do conceitual) — descartada porque não existe no iOS Safari e é inconsistente no Android; com mobile-first ela cobriria a minoria dos usuários.
- **Pedir download/upload manual a cada edição** — descartada porque, apesar de ser a opção mais simples de implementar, tem UX ruim em mobile e alto risco de perda de dados por esquecimento.

## Decisão

Separamos o armazenamento em duas camadas com papéis distintos. O **OPFS é o armazenamento de trabalho**: o app salva silenciosamente a cada alteração, como um app nativo salvaria em disco local, e funciona igual em todas as plataformas-alvo sem pedir arquivo ao usuário a cada sessão.

O **arquivo `.cofre` continua existindo**, mas como formato de export/import explícito — backup manual via download ou share sheet, transporte do cofre para outro dispositivo, e cumprimento da proposta de portabilidade e da isenção de responsabilidade. A **File System Access API** vira enhancement opcional apenas em desktop Chrome/Edge, atrás de feature-check, para quem quiser vincular o cofre a um arquivo em pasta sincronizada (Google Drive Desktop, Dropbox); ausente a API, o app cai no fluxo OPFS + export/import.

A razão principal é cobertura de plataforma: essa é a única combinação que entrega gravação automática confiável no iPhone, que é o cenário prioritário.

## Tradeoffs

**O que ganhamos:**
- Persistência automática idêntica em iOS, Android e desktop
- Zero fricção no uso diário e nenhum risco de "esqueci de salvar"
- Portabilidade preservada, sem depender de API indisponível no iOS

**O que abrimos mão:**
- O usuário não vê um "arquivo aberto" o tempo todo, então o modelo mental deixa de ser o do Obsidian ("você edita um arquivo") e passa a ser o do Google Keep/Notion local-first ("o app guarda seu trabalho e você tira cópias quando quiser")
- Dois caminhos de código para persistência em vez de um, mais o caminho opcional de desktop

## Consequências

- O módulo Cofre (storage) precisa implementar gravação em OPFS, export e import do `.cofre`, e detecção opcional da File System Access API.
- A mensagem de "seus dados, sua responsabilidade" (H1/H7 do conceitual) passa a depender inteiramente da UI: o onboarding e os lembretes de backup precisam ser explícitos, já que não existe mais um arquivo visível para reforçar a ideia. Confirmado que essa é a abordagem aceita, condicionada a essa clareza na UX.
- O suporte mínimo é iOS 16.4+, onde a persistência do OPFS é completa; abaixo disso o app exibe aviso para atualizar o navegador. Safari 15.2–16.3 tem bugs conhecidos de OPFS e não é alvo.
- Qualquer feature futura que dependa de acesso direto ao sistema de arquivos precisa ser tratada como enhancement de desktop, nunca como requisito.
