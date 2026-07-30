# Discovery Conceitual — Sistema de Arquivamento de Manutenções Veiculares

## 1. Visão Geral

Um sistema web (instalável como webapp/PWA) para arquivar e organizar registros de manutenções e revisões de veículos, sem exigir login, sem servidor de dados de usuário e sem armazenamento em nuvem gerido pela aplicação. Toda a responsabilidade pela guarda dos dados é do próprio usuário, que trabalha com um arquivo local — o **"cofre"** — nos moldes do modelo usado pelo Obsidian (criar um cofre novo ou abrir um cofre existente).

O cofre é um **binário compilado**, contendo:
- Lista de veículos
- Histórico de manutenções/revisões de cada veículo
- Notas digitalizadas (fotos/PDFs de notas fiscais), com dados extraídos via OCR
- Metadados de versão e data da última atualização do cofre

O aplicativo funciona como uma interface local para esse arquivo: abre o cofre, permite editar/consultar, e o usuário decide onde guardar, copiar ou fazer backup do arquivo.

## 2. Problema

Donos de veículos perdem o controle histórico de quais revisões foram feitas e quais peças foram trocadas — informação crítica porque peças diferentes têm prazos de validade/troca distintos (tempo ou quilometragem).

Hoje esse controle depende de notas fiscais físicas impressas pela oficina, que costumam:
- Ficar perdidas no porta-luvas
- Desgastar e ficar ilegíveis
- Se perder com o tempo

Consequência: falta de controle organizado do histórico de manutenção, e dificuldade em comprovar de forma clara e confiável esse histórico para um comprador em uma eventual venda do veículo.

## 3. Solução Proposta

Um aplicativo web/PWA, gratuito, sem cadastro de usuário, onde:

1. O usuário cria ou abre um **cofre** (arquivo binário local).
2. Dentro do cofre, cadastra seus **veículos**, cada um com: placa, veículo (marca/modelo), ano/modelo, km atual, próxima troca prevista.
3. Para cada veículo, registra **manutenções/revisões**, com campos como data, km, tipo de serviço, peças trocadas, oficina, valor, próxima revisão prevista.
4. Pode **anexar a nota digitalizada** (foto/PDF) de cada manutenção; o sistema tenta extrair automaticamente os dados via **OCR** para pré-preencher o formulário (o usuário revisa/confirma).
5. Pode **exportar um relatório completo** com todo o histórico de revisões do veículo, para comprovação em uma venda.
6. O cofre é **portátil**: uma cópia do arquivo aberta em outra máquina é tratada como um cofre independente (não há sincronização nem resolução de conflitos — simplicidade por design). O cofre carrega **número de versão** e **data da última atualização** para o usuário controlar qual cópia é a mais recente.

## 4. Escopo do MVP

**Incluso no MVP:**
- Criar novo cofre / abrir cofre existente (arquivo binário local)
- Cadastro de veículos (placa, marca/modelo, ano/modelo, km atual, próxima troca)
- Cadastro de manutenções vinculadas a um veículo (data, km, tipo de serviço, peças trocadas, oficina, valor, próxima revisão prevista)
- Upload de nota digitalizada (imagem/PDF) por manutenção
- Extração automática de dados da nota via OCR, com confirmação manual do usuário
- Exportação de relatório completo (histórico total de revisões de um veículo) em PDF
- Metadado de versão e data de atualização no próprio cofre
- Funcionamento como webapp instalável (PWA), com app carregado via internet mas dados 100% no arquivo local do usuário

**Fora do MVP (não incluso nesta fase):**
- Alertas/notificações de vencimento de peças por tempo ou km
- Sincronização entre dispositivos ou resolução de conflitos de edição
- Login, contas de usuário ou qualquer gestão de dados no servidor
- Edição colaborativa/múltiplos usuários no mesmo cofre simultaneamente

## 5. Hipóteses a Validar

- **H1**: Usuários finais (donos de veículos) aceitam a responsabilidade de guardar/gerenciar o arquivo do cofre por conta própria, sem backup automático em nuvem.
- **H2**: O modelo de "cofre local, sem login" não gera fricção suficiente para afastar usuários que esperam uma experiência tipo app com conta na nuvem.
- **H3**: A extração via OCR das notas fiscais brasileiras (frequentemente mal impressas, com formatos variados entre oficinas) tem precisão suficiente para realmente economizar tempo de digitação, e não criar mais trabalho de correção.
- **H4**: Um relatório exportado (PDF) do histórico de manutenções é, de fato, aceito/valorizado por compradores como comprovação confiável — validando a proposta de valor central para revenda.
- **H5**: A ausência de sincronização entre dispositivos (cofre tratado como independente em cada cópia) é aceitável para o público-alvo, ou se torna um ponto de abandono.

## 6. Pontos Abertos — Decisões

Todos os pontos abertos foram decididos, considerando apenas recursos gratuitos.

### 6.1. Tecnologia/formato do binário do cofre

**Decisão:** SQLite como formato do cofre, via **sql.js** (SQLite compilado para WebAssembly, licença MIT — roda 100% no navegador, sem servidor).

- O cofre é um arquivo SQLite único com extensão própria (ex.: `.cofre`), contendo tabelas de veículos, manutenções, anexos (fotos/PDFs como BLOBs) e metadados.
- `PRAGMA application_id` identifica o arquivo como um cofre válido deste app; `PRAGMA user_version` carrega a versão de schema (ver 6.4).
- Abertura/gravação via File System Access API (Chrome/Edge), com fallback de upload/download de arquivo nos demais navegadores.
- **Justificativa:** formato binário consolidado (não é preciso inventar um formato proprietário), transacional, consultável e com mecanismo nativo de versionamento — sem custo algum.

### 6.2. Motor de OCR

**Decisão:** **Tesseract.js** (licença Apache 2.0), com o modelo de idioma português (`por`).

- Roda inteiramente no navegador (client-side): custo zero e os dados da nota nunca saem do dispositivo do usuário — coerente com a proposta de privacidade do produto.
- Pré-processamento da imagem antes do OCR (escala de cinza, contraste/binarização) para melhorar a taxa de acerto em notas mal impressas.
- **Fallback manual:** o resultado do OCR apenas pré-preenche o formulário e o usuário sempre revisa/confirma. Notas manuscritas ou muito degradadas ficam anexadas apenas como imagem, com preenchimento 100% manual — o OCR nunca é bloqueante.

### 6.3. Formato e conteúdo do relatório exportado

**Decisão:** PDF em formato A4, gerado client-side com **pdf-lib** (licença MIT, sem servidor). Conteúdo:

1. **Capa/cabeçalho:** dados do veículo (placa, marca/modelo, ano/modelo, km atual) e resumo (total de manutenções, período coberto, km da primeira e da última manutenção).
2. **Tabela cronológica** de todas as manutenções: data, km, tipo de serviço, peças trocadas, oficina, valor.
3. **Detalhe por manutenção**, incluindo miniatura da nota digitalizada anexada (quando houver), como evidência.
4. **Rodapé:** data/hora de geração, versão e data de atualização do cofre de origem, e aviso de que os dados são autodeclarados pelo proprietário (ver 6.7).

### 6.4. Estratégia de versionamento do cofre

**Decisão:** versionamento em duas camadas, independentes entre si:

- **Versão de conteúdo:** contador incremental por gravação + data/hora da última modificação, armazenados nos metadados do cofre. Serve para o usuário identificar qual cópia do arquivo é a mais recente (requisito já previsto na visão geral).
- **Versão de schema:** inteiro em `PRAGMA user_version`. Ao abrir um cofre com schema antigo, o app executa migrações progressivas (v1→v2→v3...) e regrava o arquivo. Ao abrir um cofre com schema **mais novo** do que o app conhece, a abertura é recusada com mensagem orientando a atualizar o app — nunca gravar por cima, para não corromper dados.

### 6.5. Tamanho de imagens e limites práticos

**Decisão:** padronizar as fotos de nota fiscal no momento do import:

- Redimensionamento para no máximo **1600 px no lado maior**, recompressão em **JPEG com qualidade ~80%** — alvo de **≤ 500 KB por nota**, mantendo o texto legível para OCR e conferência visual.
- PDFs anexados são mantidos como estão, com aviso ao usuário quando excederem ~2 MB.
- Estimativa prática: um cofre com ~200 notas fica na faixa de 60–100 MB, plenamente gerenciável como arquivo local.
- Observação: o tamanho do cofre **não afeta** a instalação do PWA — o service worker cacheia apenas o app shell; o cofre é um arquivo do usuário, fora do escopo de instalação.

### 6.6. Modelo de negócio

**Decisão:** monetização exclusivamente por **propaganda/ads no site**. O serviço permanece gratuito e sem cadastro; não há custo de banco de dados nem backend — a aplicação é somente frontend estático.

- **Hospedagem:** o plano Hobby (gratuito) da Vercel **proíbe uso comercial, incluindo anúncios** (ex.: Google AdSense), conforme suas fair use guidelines. Portanto, a hospedagem gratuita recomendada é o **Cloudflare Pages** (plano gratuito permite uso comercial e tem banda ilimitada). A Vercel só seria opção no plano Pro (pago).

### 6.7. Estratégia de backup e responsabilidade

**Decisão:** o app orienta ativamente o usuário sobre backup, mas **não retém nenhuma informação** e **se isenta de qualquer responsabilidade legal** pela guarda dos dados.

- **Orientação ativa:** no onboarding (ao criar o primeiro cofre) o app explica que o arquivo é a única cópia dos dados e recomenda manter cópias em pelo menos dois locais distintos (ex.: drive pessoal na nuvem do próprio usuário e um pen drive/HD externo).
- **Lembretes:** após um número de edições ou período sem cópia de segurança confirmada, o app exibe um lembrete não intrusivo sugerindo salvar uma cópia.
- **Isenção de responsabilidade:** termo exibido no app (aceito ao criar o cofre) e repetido no rodapé do relatório PDF, deixando claro que o app não armazena, não sincroniza e não recupera dados, e que a guarda do arquivo é de responsabilidade exclusiva do usuário.

