# Implementation Plan: Cofre (Storage)

**Spec:** [cofre-storage](/docs/specs/cofre-storage.md)
**Status:** concluído
**Data:** 2026-07-29

## Contexto
Camada central do produto: interface de storage + sql.js + OPFS + export/import `.cofre`. Deve vir após o bootstrap e antes de migrações, CRUD e onboarding — todos consomem esta interface.

## Tarefas

### Fase 1: Fundação da interface
- [x] **[1.1]** Definir interface pública de storage do cofre
  - _O que fazer:_ tipos/contrato para criar, abrir, ler/gravar, exportar, importar, obter metadados de versão de conteúdo; sem expor sql.js
  - _Critério de conclusão:_ interface TypeScript documentada em `src/storage` (ou equivalente); domínio só depende desses tipos

- [x] **[1.2]** Constantes de identificação do cofre
  - _O que fazer:_ definir `application_id` do app e helpers para ler/gravar `PRAGMA application_id` e metadados de versão de conteúdo (contador + timestamp)
  - _Critério de conclusão:_ constantes e helpers unit-testáveis sem UI

- [x] **[1.3]** Implementação sql.js atrás da interface (in-memory)
  - _O que fazer:_ criar cofre novo (schema mínimo v1 ou stub alinhado a migrações), serializar/deserializar bytes, validar `application_id` na abertura
  - _Critério de conclusão:_ criar → serializar → reabrir via interface funciona em memória; sql.js só importado dentro de `src/storage`

### Fase 2: Persistência e portabilidade
- [x] **[2.1]** Persistência OPFS do cofre de trabalho
  - _O que fazer:_ gravar bytes no OPFS a cada alteração relevante; reabrir do OPFS no load; feature-check de OPFS com caminho de falha claro
  - _Critério de conclusão:_ create → mutate → reload da página (ou reabrir handle) recupera o cofre; falha de gravação propaga erro (não silencia)

- [x] **[2.2]** Exportar `.cofre`
  - _O que fazer:_ serializar banco e disparar download (e share sheet quando disponível)
  - _Critério de conclusão:_ arquivo `.cofre` baixável a partir do cofre aberto

- [x] **[2.3]** Importar `.cofre` com validação
  - _O que fazer:_ ler arquivo, validar SQLite + `application_id`; rejeitar inválido/corrompido sem sobrescrever trabalho atual; se já houver cofre, exigir confirmação antes de substituir no OPFS
  - _Critério de conclusão:_ round-trip export→import restaura dados; inválido retorna mensagem clara; confirmação obrigatória na substituição

- [x] **[2.4]** Versionamento de conteúdo
  - _O que fazer:_ incrementar contador e atualizar data/hora em cada gravação relevante; expor metadados para UI
  - _Critério de conclusão:_ após N gravações, contador = N (ou regra documentada); data de modificação atualizada

- [x] **[2.5]** Feature-check File System Access API (opcional)
  - _O que fazer:_ enhancement atrás de feature-check em desktop Chrome/Edge; se ausente, fluxo permanece OPFS + export/import
  - _Critério de conclusão:_ sem a API, app não quebra; com a API, vínculo opcional documentado ou stub mínimo funcional

### Fase 3: UI mínima de cofre
- [x] **[3.1]** Fluxos UI: criar / importar / exportar / aviso sem OPFS
  - _O que fazer:_ telas ou sheets Ionic usando strings isoladas; integração só via interface de storage
  - _Critério de conclusão:_ usuário cria, exporta e importa pela UI; sem OPFS vê aviso; sem import de sql.js na UI

### Fase 4: Testes
- [x] **[4.1]** Testes unitários: `application_id`, serialização, versão de conteúdo
  - _O que fazer:_ cobrir critérios de aceite de validação e incremento
  - _Critério de conclusão:_ testes passando

- [x] **[4.2]** Testes de integração: criar → OPFS (mock/fake) → reabrir; export → import
  - _O que fazer:_ contra a interface de storage com OPFS mockado ou fake in-memory
  - _Critério de conclusão:_ round-trip e persistência cobertos

- [x] **[4.3]** E2E: criar cofre → reload → ainda aberto; exportar e importar
  - _O que fazer:_ fluxo em `/tests/e2e`
  - _Critério de conclusão:_ E2E passa

### Fase 5: Revisão
- [x] **[5.1]** Verificar critérios de aceite da spec cofre-storage
- [x] **[5.2]** Atualizar CONTEXT.md se decisões novas emergiram (ex.: nome do arquivo no OPFS, valor do `application_id`)

## Dependências externas
- `sql.js` (WASM) e assets WASM no build
- Bootstrap do projeto concluído (pastas e Vite)

## Riscos
- OPFS em testes: preferir fake/mock; E2E real pode ser flaky em CI sem browser com OPFS
- Schema v1 concreto pode ser definido em conjunto com a spec de migrações — alinhar para não duplicar DDL
