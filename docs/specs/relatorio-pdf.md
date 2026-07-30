# Spec: Relatório PDF

**Status:** rascunho
**Data:** 2026-07-29
**Arquitetura relacionada:** [sistema-historico-veiculos](/docs/architecture/sistema-historico-veiculos.md)
**ADRs relacionados:** —

## Objetivo
Gerar um PDF A4 com o histórico completo de manutenções de um veículo, para comprovação em eventual venda, sem enviar dados a servidor.

## Comportamento esperado
- A partir de um veículo, o usuário deve poder gerar um relatório PDF do histórico.
- O PDF deve ser gerado client-side com pdf-lib, em formato A4, e oferecido para download ou share sheet — nunca enviado a servidor.
- Conteúdo obrigatório:
  1. **Capa/cabeçalho:** placa, marca/modelo, ano/modelo, km atual; resumo com total de manutenções, período coberto, km da primeira e da última manutenção.
  2. **Tabela cronológica** de todas as manutenções: data, km, tipo de serviço, peças trocadas, oficina, valor.
  3. **Detalhe por manutenção**, com miniatura da nota digitalizada quando houver anexo de imagem.
  4. **Rodapé:** data/hora de geração; versão e data de atualização do cofre de origem; isenção de responsabilidade (dados autodeclarados; app não armazena/recupera dados).
- Veículo sem manutenções: o sistema deve informar que não há histórico para exportar (ou gerar PDF mínimo só com capa/aviso — preferir bloquear com mensagem clara no MVP).

## Casos de borda
- Manutenção sem anexo: detalhe sem miniatura, demais campos presentes.
- Anexo PDF (não imagem): miniatura pode ser omitida ou substituída por indicação de “PDF anexado”; não quebrar a geração.
- Valores/campos opcionais vazios: exibir como em branco ou “—” de forma consistente.
- Falha na geração (memória, etc.): mensagem de erro; não corromper o cofre.
- Muitas manutenções: PDF pode ter várias páginas; geração não deve travar a UI de forma indefinida sem feedback de progresso.

## Fora do escopo
- Envio do PDF por e-mail pelo app
- Assinatura digital / carimbo de autenticidade de terceiros
- Templates customizáveis ou marca d’água do usuário
- Exportação em outros formatos (CSV, Excel)

## Critérios de aceite
- [x] Usuário gera PDF A4 do histórico de um veículo com manutenções
- [x] PDF contém capa com dados do veículo e resumo
- [x] PDF contém tabela cronológica com os campos definidos
- [x] PDF inclui detalhe por manutenção e miniatura quando há anexo de imagem
- [x] Rodapé inclui data de geração, versão/data do cofre e isenção de responsabilidade
- [x] Arquivo é baixado/compartilhado localmente; nenhum upload a servidor
- [x] Veículo sem manutenções não produz relatório enganoso (mensagem clara)

## Estratégia de teste
- **Unitário:** montagem dos dados do relatório (resumo, ordenação, tratamento de vazios); texto da isenção presente
- **Integração:** gerar PDF a partir de fixture de veículo + manutenções + anexo e validar número de páginas / presença de strings-chave (pdf-lib)
- **E2E:** no veículo com histórico, acionar “gerar relatório” e confirmar download/share iniciado

## Notas de implementação
- Conteúdo conforme discovery-conceitual 6.3 e 6.7
- lib: pdf-lib
- Isenção alinhada ao termo do onboarding
