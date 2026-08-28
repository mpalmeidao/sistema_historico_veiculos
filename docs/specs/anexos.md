# Spec: Anexos

**Status:** implementado
**Data:** 2026-07-29
**Arquitetura relacionada:** [sistema-historico-veiculos](/docs/architecture/sistema-historico-veiculos.md)
**ADRs relacionados:**
- [ADR-001 — OPFS como armazenamento de trabalho](/docs/adr/001-opfs-como-armazenamento-de-trabalho.md)
- [ADR-002 — sql.js no MVP com storage abstraído](/docs/adr/002-sql-js-no-mvp-com-storage-layer-abstraido.md)

## Objetivo
Permitir anexar a nota fiscal digitalizada (foto ou PDF) a uma manutenção, em tamanho adequado para OCR, conferência visual e portabilidade do cofre.

## Comportamento esperado
- A seção **Anexos da nota** fica no **topo** do formulário de manutenção (criação e edição), no lugar do antigo seletor OCR separado.
- Na manutenção, o usuário deve poder anexar uma imagem (galeria ou câmera via `<input type="file" accept="image/*" capture="environment">`) ou um PDF.
- **Criação:** anexos ficam pendentes em memória até salvar a manutenção; após `createManutencao`, são gravados no cofre vinculados ao novo id.
- **Edição:** anexos são persistidos imediatamente ao confirmar o arquivo.
- Imagens devem ser padronizadas no import: no máximo 1600 px no lado maior, JPEG com qualidade ~80%, alvo ≤ 500 KB por nota, mantendo texto legível.
- Redimensionamento/recompressão deve ocorrer fora da main thread (Web Worker / OffscreenCanvas), para não travar a UI em aparelhos de entrada.
- PDFs devem ser mantidos como estão; se o arquivo exceder ~2 MB, o sistema deve avisar o usuário antes de confirmar o anexo.
- O anexo deve ser armazenado como BLOB no cofre via interface de storage.
- O usuário deve poder visualizar o anexo e removê-lo (com confirmação), inclusive pendentes na criação.
- Ao anexar **imagem**, o OCR dispara automaticamente (spec OCR). Ao anexar **PDF**, anexa sem OCR e avisa o usuário.

## Casos de borda
- Arquivo com tipo não suportado: recusar com mensagem clara.
- Falha no worker de redimensionamento: informar erro; não gravar blob parcialmente processado como se fosse sucesso.
- Imagem muito pequena ou já abaixo do alvo: ainda assim aplicar o pipeline de forma idempotente/segura (não piorar inutilmente além do necessário).
- Remover anexo de manutenção existente: confirmar e persistir a remoção.
- Cancelar criação com pendentes: descartar pendentes sem gravar no cofre.
- Cofre crescendo com muitos anexos: sem limite rígido no MVP além do aviso de PDF grande; não bloquear por estimativa de “frotinha”.

## Fora do escopo
- Edição de imagem (crop, rotação avançada) além do padronização definida
- Upload para servidor ou CDN
- Compressão adicional de PDF
- OCR em PDF (conversão página→imagem)

## Critérios de aceite
- [x] Usuário anexa foto pela câmera ou galeria no topo do formulário (criação ou edição)
- [x] Na criação, anexo pendente é gravado ao salvar a manutenção e aparece ao reabrir
- [x] Imagem importada respeita limite de dimensão (≤ 1600 px no lado maior) e é gravada como JPEG no cofre
- [x] Processamento de imagem não trava a UI (executa em worker)
- [x] PDF acima de ~2 MB exibe aviso antes da confirmação; PDF é armazenado sem recompressão
- [x] Usuário visualiza e remove anexo com confirmação
- [x] Anexo é persistido como BLOB via interface de storage (sem sql.js na UI)
- [x] Anexar imagem dispara OCR automático; falha de OCR não remove o anexo

## Estratégia de teste
- **Unitário:** funções de redimensionamento/recompressão (entrada → dimensão/qualidade esperadas); detecção de tipo e limiar de aviso de PDF
- **Integração:** import → persistência BLOB → leitura do anexo via storage
- **E2E:** anexar imagem na criação, salvar, reabrir e ver o anexo; anexar em edição; OCR automático a partir do anexo (spec OCR)

## Notas de implementação
- Limites conforme discovery-conceitual 6.5 e discovery-tech 5.4
- Sem wrapper nativo de câmera no MVP — só o input HTML com `capture="environment"`
