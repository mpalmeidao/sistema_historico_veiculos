# Implementation Plan: Relatório PDF

**Spec:** [relatorio-pdf](/docs/specs/relatorio-pdf.md)
**Status:** concluído
**Data:** 2026-07-29

## Contexto
Geração client-side com pdf-lib do histórico A4 de um veículo. Depende de veículos, manutenções, anexos (miniaturas) e do texto de isenção alinhado ao onboarding. Nenhum upload a servidor.

## Tarefas

### Fase 1: Montagem de dados
- [x] **[1.1]** Montador de dados do relatório
  - _O que fazer:_ a partir de veículo + manutenções + metadados do cofre: resumo (total, período, km primeira/última), ordenação cronológica, vazios como “—” consistente, texto de isenção reutilizado do onboarding
  - _Critério de conclusão:_ testes unitários de resumo, ordenação, vazios e presença da isenção

- [x] **[1.2]** Regra veículo sem manutenções
  - _O que fazer:_ bloquear geração com mensagem clara (preferência MVP da spec)
  - _Critério de conclusão:_ não gera PDF enganoso; mensagem testável

### Fase 2: Geração pdf-lib
- [x] **[2.1]** Capa + tabela cronológica A4
  - _O que fazer:_ capa com placa, marca/modelo, ano/modelo, km atual e resumo; tabela com data, km, tipo, peças, oficina, valor; múltiplas páginas se necessário
  - _Critério de conclusão:_ PDF gerado contém strings-chave da capa e da tabela

- [x] **[2.2]** Detalhe por manutenção + miniaturas
  - _O que fazer:_ seção de detalhe; miniatura se anexo imagem; anexo PDF → omitir miniatura ou indicar “PDF anexado” sem quebrar
  - _Critério de conclusão:_ fixture com imagem inclui miniatura; com PDF não falha

- [x] **[2.3]** Rodapé e entrega local
  - _O que fazer:_ data/hora de geração; versão e data do cofre; isenção; download ou share sheet — sem upload
  - _Critério de conclusão:_ rodapé presente; API de entrega só local

- [x] **[2.4]** Feedback de progresso e erro
  - _O que fazer:_ UI não fica muda em gerações longas; falha mostra erro sem corromper cofre
  - _Critério de conclusão:_ estado de progresso/erro visível na UI

### Fase 3: UI e testes
- [x] **[3.1]** Ação “gerar relatório” no veículo
  - _O que fazer:_ botão/fluxo Ionic; strings isoladas; bloqueio se sem manutenções
  - _Critério de conclusão:_ usuário gera e recebe arquivo localmente

- [x] **[3.2]** Integração: gerar PDF de fixture e validar páginas/strings
  - _O que fazer:_ pdf-lib + fixture veículo/manutenções/anexo
  - _Critério de conclusão:_ asserts de conteúdo passam

- [x] **[3.3]** E2E: gerar relatório em veículo com histórico
  - _O que fazer:_ confirmar início de download/share
  - _Critério de conclusão:_ E2E passa (ou assert equivalente estável no CI)

### Fase 4: Revisão
- [x] **[4.1]** Verificar critérios de aceite da spec relatorio-pdf
- [x] **[4.2]** Atualizar CONTEXT.md se layout do PDF ou fonte da isenção forem decisões novas

## Dependências externas
- `pdf-lib`
- Manutenções + anexos + texto de isenção (onboarding)
- Metadados de versão de conteúdo do cofre

## Riscos
- Miniaturas e muitas páginas em aparelhos fracos — progresso obrigatório; evitar carregar BLOBs desnecessários
- Share sheet vs download varia por navegador — ambos aceitos pela spec
