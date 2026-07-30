# Spec: Manutenções

**Status:** implementado
**Data:** 2026-07-30
**Arquitetura relacionada:** [sistema-historico-veiculos](/docs/architecture/sistema-historico-veiculos.md)
**ADRs relacionados:**
- [ADR-002 — sql.js no MVP com storage abstraído](/docs/adr/002-sql-js-no-mvp-com-storage-layer-abstraido.md)
- [ADR-003 — Ionic React como UI kit](/docs/adr/003-ionic-react-como-ui-kit.md)

## Objetivo
Permitir registrar e consultar o histórico de manutenções/revisões de cada veículo, base do valor do produto na revenda e no controle do proprietário.

## Comportamento esperado
- A partir de um veículo, o usuário deve poder criar, listar, editar e excluir manutenções vinculadas a ele.
- Cada manutenção deve registrar: data, km, tipo de serviço, peças trocadas, oficina, valor, próxima revisão prevista.
- **Peças trocadas** é uma **lista de itens**, cada um com descrição e valor monetário (≥ 0). A lista pode ficar vazia.
- O **valor total** da manutenção é a **soma automática** dos valores das peças (somente leitura na UI). Lista vazia → valor ausente (`null`).
- A listagem deve ser cronológica (mais recente primeiro ou ordem temporal clara e consistente).
- Anexos e OCR são opcionais neste fluxo e tratados pelas specs de anexos/OCR; a manutenção pode ser salva só com preenchimento manual.
- Persistência via interface de storage; gravação atualiza OPFS e versão de conteúdo.
- Exclusão de manutenção exige confirmação.
- Cofres com schema anterior migram peças em texto livre / valor legado para a nova estrutura sem perda do total quando houver valor.

## Casos de borda
- Manutenção sem veículo válido: não permitir criação órfã.
- Data inválida, km negativo ou valor de peça negativo: rejeitar com feedback.
- Item com descrição vazia (linha incompleta): rejeitar com feedback.
- Campos opcionais (oficina, peças, próxima revisão) podem ficar vazios no MVP, desde que data, km e tipo de serviço mínimos estejam definidos.
- Veículo sem manutenções: estado vazio com CTA para registrar a primeira.
- Edição não deve corromper vínculo com anexos existentes (anexos são spec separada).
- Migração v1→v2: texto em peças → um item; só valor sem texto → um item com descrição canônica de migração; nenhum dos dois → sem itens e valor `null`.

## Fora do escopo
- Pipeline de import de imagem/PDF e OCR (specs anexos e OCR)
- Geração de relatório PDF (além de consumir a lista já persistida)
- Alertas de vencimento por tempo/km
- Tipos de serviço como catálogo remoto ou marketplace de oficinas
- Quantidade por peça (apenas descrição + valor)

## Critérios de aceite
- [x] Usuário registra manutenção vinculada a um veículo com os campos do MVP
- [x] Peças trocadas são uma lista editável (adicionar/remover) de descrição + valor
- [x] Valor total da manutenção reflete a soma das peças e não é editável manualmente
- [x] Listagem do veículo mostra manutenções em ordem temporal clara
- [x] Edição e exclusão (com confirmação) funcionam e persistem após reload
- [x] Não é possível criar manutenção sem veículo
- [x] Validação impede dados inválidos (data/km/peças)
- [x] É possível salvar manutenção sem anexo, sem OCR e sem peças
- [x] Cofre v1 abre, migra para schema com tabela de peças e preserva dados legado

## Estratégia de teste
- **Unitário:** validação do formulário/modelo (lista, soma, itens inválidos); ordenação da listagem; migração v1→v2
- **Integração:** CRUD de manutenção com N peças via storage; valor persistido = soma
- **E2E:** no veículo, criar manutenção com 2 peças → listar → editar → excluir

## Notas de implementação
- Campos conforme discovery-conceitual seções 3 e 4, com peças estruturadas
- Schema: tabela filha `manutencao_pecas`; coluna `valor` em `manutencoes` denormalizada (= soma)
- Integração com anexos/OCR por composição de fluxos, sem acoplar a regra de CRUD ao Tesseract
