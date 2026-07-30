# Implementation Plan: OCR

**Spec:** [ocr](/docs/specs/ocr.md)
**Status:** concluído
**Data:** 2026-07-29

## Contexto
Tesseract.js em worker + parser OCR→formulário para pré-preencher manutenção. Depende de anexos (imagem) e coordenação com app-shell (cache do `por.traineddata`). Parser tem cobertura de teste obrigatória; OCR nunca bloqueia o save manual.

## Tarefas

### Fase 1: Worker e pré-processamento
- [x] **[1.1]** Worker Tesseract.js (`por`) + pré-processamento
  - _O que fazer:_ escala de cinza / contraste-binarização; OCR fora da main thread; estado “processando” e cancelamento se viável
  - _Critério de conclusão:_ chamada de OCR não bloqueia UI; resultado texto retorna ao main thread

- [x] **[1.2]** Aviso de download do modelo na primeira uso
  - _O que fazer:_ informar tamanho antes do download; falha de rede → tentar de novo ou continuar sem OCR; coordenar cache com vite-plugin-pwa (spec app-shell)
  - _Critério de conclusão:_ primeiro uso mostra aviso; falha não impede fluxo manual

### Fase 2: Parser (crítico)
- [x] **[2.1]** Parser determinístico OCR→campos de manutenção
  - _O que fazer:_ mapear subconjunto identificável; campos sem match vazios; não tratar OCR como save
  - _Critério de conclusão:_ API pura texto→sugestões de formulário

- [x] **[2.2]** Testes unitários obrigatórios do parser
  - _O que fazer:_ texto sintético → campos; sem match → vazios; edição humana prevalece (não sobrescrever confirmação no merge com formulário)
  - _Critério de conclusão:_ suite do parser passando; cobrindo critérios de aceite do parser

### Fase 3: Integração com formulário
- [x] **[3.1]** Disparo de OCR a partir de imagem anexada/selecionada
  - _O que fazer:_ botão/ação no fluxo de manutenção; pré-preenche; usuário revisa; PDF sem OCR automático no MVP (documentar)
  - _Critério de conclusão:_ campos editáveis após OCR; save manual possível com OCR vazio/falho

- [x] **[3.2]** Integração: worker mockado + formulário recebe sugestões
  - _O que fazer:_ teste de integração sem depender de Tesseract real lento
  - _Critério de conclusão:_ sugestões aplicadas ao form; falha simulada mantém fluxo manual

### Fase 4: E2E e revisão
- [x] **[4.1]** E2E: anexar → OCR → revisar → salvar; e OCR falha → manual → salvar
  - _O que fazer:_ fixtures controladas; mock de worker se necessário no CI
  - _Critério de conclusão:_ ambos os fluxos cobertos

- [x] **[4.2]** Verificar critérios de aceite da spec ocr
- [x] **[4.3]** Atualizar CONTEXT.md se campos mapeados pelo parser ou política de PDF forem fixados

## Dependências externas
- `tesseract.js` + `por.traineddata`
- Anexos (imagem) e formulário de manutenções
- App shell / PWA para cache do modelo

## Riscos
- Tamanho do modelo e tempo no mobile de entrada — aviso e cache são obrigatórios para UX
- Expectativa de extração perfeita (H3): parser deve ser conservador; testes com fixtures controladas, não “todas as NFs”
