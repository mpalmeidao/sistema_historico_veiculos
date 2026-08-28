# Spec: OCR

**Status:** implementado
**Data:** 2026-07-29
**Arquitetura relacionada:** [sistema-historico-veiculos](/docs/architecture/sistema-historico-veiculos.md)
**ADRs relacionados:** — (decisão de OCR em discovery; PWA/cache do modelo em ADR implícito via stack)

## Objetivo
Reduzir digitação ao extrair texto de notas fiscais brasileiras e pré-preencher o formulário de manutenção, sem nunca impedir o registro manual.

## Comportamento esperado
- Ao anexar uma **imagem** da nota no formulário de manutenção (criação ou edição), o OCR dispara **automaticamente**.
- O OCR deve rodar com Tesseract.js (idioma `por`) em Web Worker, com pré-processamento da imagem (escala de cinza, contraste/binarização).
- O resultado deve apenas **pré-preencher** campos do formulário de manutenção; o usuário sempre revisa e confirma antes de salvar.
- Se o OCR falhar, for cancelado, o modelo for recusado ou a nota for ilegível, a nota **permanece anexada** e o preenchimento manual continua disponível — OCR nunca bloqueia o fluxo; a UI exibe aviso claro.
- Na primeira utilização do modelo `por.traineddata`, o sistema deve avisar sobre o download (tamanho) e o service worker deve poder cachear o modelo para usos seguintes (coordenação com spec app-shell-pwa).
- O parser OCR→formulário deve mapear de forma determinística os campos que conseguir identificar; campos não identificados ficam vazios para o usuário preencher.
- **PDF:** sem OCR automático no MVP — ao anexar PDF, anexa normalmente e avisa que não houve pré-preenchimento.

## Casos de borda
- Nota manuscrita, borrada ou de formato atípico: OCR pode retornar pouco ou nada útil; UI avisa e permite seguir manualmente sem erro fatal; anexo permanece.
- Modelo ainda não baixado / falha de rede no primeiro download: informar e oferecer tentar de novo ou continuar sem OCR (anexo permanece).
- Usuário edita campos pré-preenchidos: a edição humana prevalece no save.
- OCR em PDF: fora do caminho principal desta spec no MVP — PDF segue como anexo sem OCR automático.
- Processamento longo em aparelho fraco: UI permanece responsiva (worker); estado de “processando” visível e cancelável se viável.

## Fora do escopo
- OCR como etapa obrigatória para salvar manutenção
- Envio da imagem a API de OCR em nuvem
- Treino/fine-tune de modelo próprio
- Detecção automática de Wi-Fi para baixar o modelo (opção descartada para o MVP)
- Extração 100% confiável de todos os layouts de NF brasileiras (hipótese H3 a validar)
- Conversão de página de PDF em imagem para OCR

## Critérios de aceite
- [x] OCR pré-preenche ao menos um subconjunto de campos a partir de uma imagem de nota de teste controlada anexada no formulário
- [x] Usuário consegue alterar qualquer campo pré-preenchido antes de salvar
- [x] Falha ou resultado vazio do OCR não impede salvar a manutenção com preenchimento manual; anexo permanece
- [x] OCR executa fora da main thread
- [x] Primeiro uso do modelo exibe aviso de download/tamanho
- [x] Parser OCR→formulário tem testes automatizados cobrindo mapeamentos e ausência de match
- [x] Não há botão separado “Escolher imagem da nota” — o disparo é ao anexar foto

## Estratégia de teste
- **Unitário:** parser OCR→formulário (obrigatório) — texto sintético → campos; texto sem match → campos vazios; não sobrescrever confirmação humana
- **Integração:** worker mockado + formulário recebendo sugestões
- **E2E:** fluxo “anexar imagem → OCR automático → revisar → salvar” com fixture; fluxo “OCR falha → aviso → preencher manual → salvar” (anexo presente)

## Notas de implementação
- Cobertura do parser é obrigatória (CONTEXT): bug aqui perde/corrompe dados sem recuperação
- Idioma: `por.traineddata`
- Coordenar cache do modelo com a spec de App Shell / PWA
- Integração com anexos: ver spec anexos (topo do formulário; pending na criação)
