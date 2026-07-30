# Spec: Anexos

**Status:** rascunho
**Data:** 2026-07-29
**Arquitetura relacionada:** [sistema-historico-veiculos](/docs/architecture/sistema-historico-veiculos.md)
**ADRs relacionados:**
- [ADR-001 — OPFS como armazenamento de trabalho](/docs/adr/001-opfs-como-armazenamento-de-trabalho.md)
- [ADR-002 — sql.js no MVP com storage abstraído](/docs/adr/002-sql-js-no-mvp-com-storage-layer-abstraido.md)

## Objetivo
Permitir anexar a nota fiscal digitalizada (foto ou PDF) a uma manutenção, em tamanho adequado para OCR, conferência visual e portabilidade do cofre.

## Comportamento esperado
- Na manutenção, o usuário deve poder anexar uma imagem (galeria ou câmera via `<input type="file" accept="image/*" capture="environment">`) ou um PDF.
- Imagens devem ser padronizadas no import: no máximo 1600 px no lado maior, JPEG com qualidade ~80%, alvo ≤ 500 KB por nota, mantendo texto legível.
- Redimensionamento/recompressão deve ocorrer fora da main thread (Web Worker / OffscreenCanvas), para não travar a UI em aparelhos de entrada.
- PDFs devem ser mantidos como estão; se o arquivo exceder ~2 MB, o sistema deve avisar o usuário antes de confirmar o anexo.
- O anexo deve ser armazenado como BLOB no cofre via interface de storage.
- O usuário deve poder visualizar o anexo depois de salvo e removê-lo (com confirmação).
- Anexar arquivo não deve exigir OCR; OCR é opcional e tratado em spec própria.

## Casos de borda
- Arquivo com tipo não suportado: recusar com mensagem clara.
- Falha no worker de redimensionamento: informar erro; não gravar blob parcialmente processado como se fosse sucesso.
- Imagem muito pequena ou já abaixo do alvo: ainda assim aplicar o pipeline de forma idempotente/segura (não piorar inutilmente além do necessário).
- Remover anexo de manutenção existente: confirmar e persistir a remoção.
- Cofre crescendo com muitos anexos: sem limite rígido no MVP além do aviso de PDF grande; não bloquear por estimativa de “frotinha”.

## Fora do escopo
- OCR / parser para formulário (spec OCR)
- Edição de imagem (crop, rotação avançada) além do padronização definida
- Upload para servidor ou CDN
- Compressão adicional de PDF

## Critérios de aceite
- [x] Usuário anexa foto pela câmera ou galeria e ela fica associada à manutenção
- [x] Imagem importada respeita limite de dimensão (≤ 1600 px no lado maior) e é gravada como JPEG no cofre
- [x] Processamento de imagem não trava a UI (executa em worker)
- [x] PDF acima de ~2 MB exibe aviso antes da confirmação; PDF é armazenado sem recompressão
- [x] Usuário visualiza e remove anexo com confirmação
- [x] Anexo é persistido como BLOB via interface de storage (sem sql.js na UI)

## Estratégia de teste
- **Unitário:** funções de redimensionamento/recompressão (entrada → dimensão/qualidade esperadas); detecção de tipo e limiar de aviso de PDF
- **Integração:** import → persistência BLOB → leitura do anexo via storage
- **E2E:** anexar imagem a uma manutenção e reabrir a manutenção vendo o anexo

## Notas de implementação
- Limites conforme discovery-conceitual 6.5 e discovery-tech 5.4
- Sem wrapper nativo de câmera no MVP — só o input HTML com `capture="environment"`
