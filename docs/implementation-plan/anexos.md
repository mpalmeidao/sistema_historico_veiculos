# Implementation Plan: Anexos

**Spec:** [anexos](/docs/specs/anexos.md)
**Status:** concluído
**Data:** 2026-07-29

## Contexto
Import de foto/PDF, padronização de imagem em worker e BLOB no cofre. Depende de manutenções (vínculo) e da interface de storage. OCR permanece fora — anexar não exige OCR.

## Tarefas

### Fase 1: Pipeline de imagem e tipos
- [x] **[1.1]** Detecção de tipo e regras de aceite
  - _O que fazer:_ aceitar imagem e PDF; recusar demais tipos com mensagem; limiar de aviso PDF ~2 MB
  - _Critério de conclusão:_ testes unitários de tipo e limiar de aviso

- [x] **[1.2]** Worker de redimensionamento/recompressão
  - _O que fazer:_ Web Worker / OffscreenCanvas: máx. 1600 px no lado maior, JPEG ~80%, alvo ≤ 500 KB; pipeline idempotente para imagens já pequenas; falha do worker não grava blob parcial como sucesso
  - _Critério de conclusão:_ testes unitários entrada→dimensão/qualidade; processamento não na main thread

- [x] **[1.3]** Persistência BLOB via storage
  - _O que fazer:_ associar anexo à manutenção; ler para visualização; remover com confirmação; PDF armazenado sem recompressão
  - _Critério de conclusão:_ integração import → BLOB → leitura; UI sem sql.js

### Fase 2: UI
- [x] **[2.1]** Input de captura/galeria e PDF
  - _O que fazer:_ `<input type="file" accept="image/*" capture="environment">` + escolha de PDF; aviso antes de confirmar PDF grande; strings isoladas
  - _Critério de conclusão:_ usuário anexa foto (câmera/galeria) ou PDF à manutenção

- [x] **[2.2]** Visualizar e remover anexo
  - _O que fazer:_ visualização pós-save; remoção com confirmação e persistência
  - _Critério de conclusão:_ ver e remover funcionam após reload

### Fase 3: Testes
- [x] **[3.1]** Integração: import → persistência → leitura via storage
  - _O que fazer:_ cobrir imagem processada e PDF
  - _Critério de conclusão:_ testes passando

- [x] **[3.2]** E2E: anexar imagem e reabrir manutenção vendo o anexo
  - _O que fazer:_ fixture de imagem em `/tests/e2e`
  - _Critério de conclusão:_ E2E passa

### Fase 4: Revisão
- [x] **[4.1]** Verificar critérios de aceite da spec anexos
- [x] **[4.2]** Atualizar CONTEXT.md se limites ou API do worker forem refinados

## Dependências externas
- Manutenções + storage com suporte a BLOB
- Bootstrap com local para workers

## Riscos
- OffscreenCanvas/Worker em Safari: validar no suporte mínimo 16.4+; ter fallback documentado se necessário
- Fixtures de imagem em CI: manter arquivos pequenos no repo
