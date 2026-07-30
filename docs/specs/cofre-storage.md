# Spec: Cofre (Storage)

**Status:** rascunho
**Data:** 2026-07-29
**Arquitetura relacionada:** [sistema-historico-veiculos](/docs/architecture/sistema-historico-veiculos.md)
**ADRs relacionados:**
- [ADR-001 — OPFS como armazenamento de trabalho](/docs/adr/001-opfs-como-armazenamento-de-trabalho.md)
- [ADR-002 — sql.js no MVP com storage abstraído](/docs/adr/002-sql-js-no-mvp-com-storage-layer-abstraido.md)

## Objetivo
Permitir que o usuário crie, abra e mantenha um cofre local de histórico veicular, com gravação automática no dispositivo e portabilidade via arquivo `.cofre`.

## Comportamento esperado
- O sistema deve oferecer criar um cofre novo ou importar um arquivo `.cofre` existente.
- Ao criar/abrir, o sistema deve validar o arquivo via `PRAGMA application_id` (cofre válido deste app).
- O cofre de trabalho deve ser persistido automaticamente no OPFS a cada alteração relevante, sem pedir confirmação do usuário.
- O sistema deve expor exportação explícita do cofre como arquivo `.cofre` (download ou share sheet).
- Ao importar um `.cofre`, ele passa a ser o cofre de trabalho no OPFS; cada cópia é um cofre independente (sem sync/merge).
- O cofre deve manter versionamento de conteúdo: contador incremental por gravação + data/hora da última modificação, visíveis ao usuário para identificar a cópia mais recente.
- Toda leitura/gravação do banco deve passar por uma interface de storage própria; nenhum componente, hook ou módulo de domínio chama sql.js diretamente.
- Em desktop Chrome/Edge, File System Access API pode existir como enhancement opcional (vínculo a arquivo em disco), atrás de feature-check; se ausente, o fluxo permanece OPFS + export/import.
- Se OPFS não estiver disponível no navegador, o sistema deve informar a limitação e orientar atualização/navegador suportado (caminho alternativo definido via feature-check).

## Casos de borda
- Arquivo importado sem `application_id` válido: recusar abertura com mensagem clara de arquivo inválido.
- Arquivo corrompido ou não-SQLite: recusar sem sobrescrever o cofre de trabalho atual.
- Importar `.cofre` com cofre de trabalho já existente: substituir o cofre de trabalho apenas após confirmação explícita do usuário (ou fluxo equivalente que evite perda acidental).
- Falha ao gravar no OPFS: informar o usuário; não silenciar a falha de persistência.
- Navegador sem OPFS / Safari abaixo do suporte mínimo: aviso para atualizar; não fingir que os dados estão seguros.

## Fora do escopo
- Migrações de schema (spec própria)
- Sincronização entre dispositivos ou resolução de conflitos
- Backup automático em Google Drive / iCloud
- CRUD de veículos e manutenções (consomem esta camada, mas não fazem parte desta spec)

## Critérios de aceite
- [x] Usuário consegue criar um cofre novo e ele persiste no OPFS entre recarregamentos da página
- [x] Usuário consegue exportar um `.cofre` e reimportá-lo em outra sessão, recuperando os dados
- [x] Arquivo inválido (application_id errado ou corrompido) é recusado com mensagem compreensível
- [x] Cada alteração relevante atualiza contador de conteúdo e data de modificação
- [x] Domínio/UI acessam o cofre apenas via interface de storage (sem import direto de sql.js)
- [x] Feature-check protege OPFS e File System Access API; caminhos alternativos estão definidos
- [x] Importação com cofre existente exige confirmação antes de substituir

## Estratégia de teste
- **Unitário:** validação de `application_id`, serialização/deserialização do cofre, incremento de versão de conteúdo
- **Integração:** criar → gravar no storage → reabrir; export → import round-trip (contra a interface de storage, com OPFS mockado ou fake in-memory)
- **E2E:** fluxo criar cofre, recarregar app e ver cofre ainda aberto; exportar e importar arquivo

## Notas de implementação
- MVP: sql.js atrás da interface de storage (ADR-002)
- Persistência de trabalho: OPFS (ADR-001)
- Extensão do arquivo portátil: `.cofre`
- Escala típica assumida: 1–3 veículos, 20–100 manutenções — sem otimização prematura de wa-sqlite
