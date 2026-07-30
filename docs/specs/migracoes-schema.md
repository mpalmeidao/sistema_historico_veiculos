# Spec: Migrações de Schema

**Status:** rascunho
**Data:** 2026-07-29
**Arquitetura relacionada:** [sistema-historico-veiculos](/docs/architecture/sistema-historico-veiculos.md)
**ADRs relacionados:**
- [ADR-002 — sql.js no MVP com storage abstraído](/docs/adr/002-sql-js-no-mvp-com-storage-layer-abstraido.md)

## Objetivo
Garantir que cofres com schema antigo possam ser atualizados com segurança, e que cofres com schema mais novo que o app nunca sejam corrompidos por gravação incompatível.

## Comportamento esperado
- Ao abrir um cofre, o sistema deve ler `PRAGMA user_version`.
- Se a versão de schema for menor que a versão conhecida pelo app, o sistema deve aplicar migrações progressivas (v1→v2→v3…) até a versão atual e persistir o resultado.
- Se a versão de schema for maior que a conhecida pelo app, a abertura deve ser **recusada**, com mensagem orientando o usuário a atualizar o app. O cofre **nunca** deve ser regravado nesse caso.
- Se a versão for igual à do app, abrir normalmente sem migração.
- A versão de schema é independente da versão de conteúdo (contador + data de modificação).
- Migrações devem executar via interface de storage, não acopladas à UI.

## Casos de borda
- Falha no meio de uma cadeia de migrações: o cofre de trabalho não deve ficar em estado parcialmente migrado visível como “ok”; a abertura falha de forma segura e o usuário é informado.
- Cofre v1 criado por versão antiga do app deve abrir e migrar automaticamente na versão atual.
- Cofre “do futuro” (user_version desconhecido): recusa sem alterar OPFS do cofre atual além do necessário para tentar a abertura (não sobrescrever o trabalho válido com dados incompatíveis).
- Cofre sem user_version definido: tratar como versão 0 / estado inicial conforme regra do schema v1.

## Fora do escopo
- Criar/exportar/importar cofre (spec cofre-storage)
- Alterações de domínio que não mudem schema
- Downgrade de schema (app mais novo → gravar formato mais antigo)

## Critérios de aceite
- [x] Cofre com schema antigo abre, aplica migrações progressivas e fica na versão atual do app
- [x] Cofre com schema mais novo é recusado com orientação para atualizar o app
- [x] Em recusa por schema novo, o arquivo/cofre não é regravado em formato antigo
- [x] Após migração bem-sucedida, `user_version` reflete a versão atual do app
- [x] Versão de conteúdo permanece independente e coerente após migração

## Estratégia de teste
- **Unitário:** cada migração isolada (entrada na versão N, saída na N+1) com fixtures mínimas
- **Integração:** cadeia completa v1→…→atual contra a interface de storage; caso de schema futuro recusado
- **E2E:** opcional — abrir fixture de cofre antigo e confirmar que a UI abre após migração

## Notas de implementação
- Testes de migração são **obrigatórios** (CONTEXT / guidelines de teste): bug aqui corrompe dados sem recuperação
- Testar contra a interface de storage, nunca contra sql.js direto (ADR-002)
- No MVP inicial, a versão de schema pode ser v1 (schema baseline); o mecanismo de migração e a recusa de schema futuro devem existir desde o início
