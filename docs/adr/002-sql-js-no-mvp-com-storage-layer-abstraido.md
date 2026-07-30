# ADR-002: sql.js no MVP, com a camada de storage abstraída para permitir troca por wa-sqlite

**Data:** 2026-07-29
**Status:** aceito
**Substituído por:**

## Contexto

O cofre é um arquivo SQLite único e precisa de um motor SQLite compilado para WebAssembly rodando no navegador. Existem dois caminhos maduros o suficiente, com perfis de custo bem diferentes.

Restrições que pesaram na escolha:

- Escala esperada confirmada como caso típico: 1 a 3 veículos e 20 a 100 manutenções por cofre.
- Timeline confirmada como MVP de validação rápida, em semanas.
- Time solo, sem margem para complexidade acidental.
- Estimativa de tamanho do cofre: ~60 a 100 MB com cerca de 200 notas anexadas (discovery conceitual 6.5).

## Alternativas consideradas

- **wa-sqlite + OPFS VFS desde o início** — descartada para o MVP porque é mais complexa de configurar, tem ecossistema e tooling menos maduros, e só compensa diante de um problema real de performance que a escala confirmada não indica.

## Decisão

Adotamos **sql.js** no MVP. Ele é simples, maduro e serializa o banco inteiro para bytes, o que combina diretamente com o modelo de export/import do `.cofre` definido no ADR-001.

Em contrapartida, **toda a persistência fica atrás de uma interface própria de storage**: nenhum componente, hook ou módulo de domínio chama sql.js diretamente. Se surgir lentidão real em cofres grandes ou em aparelhos de entrada, a troca por wa-sqlite + OPFS VFS acontece dentro dessa camada, sem tocar na UI.

A razão principal é que a escala e a timeline confirmadas não justificam pagar o custo de complexidade do wa-sqlite agora, e a abstração mantém o custo de reverter baixo.

## Tradeoffs

**O que ganhamos:**
- Caminho mais curto e previsível para o MVP, com biblioteca madura
- Serialização trivial para o formato de export
- Liberdade de trocar o motor depois sem refatorar a aplicação

**O que abrimos mão:**
- sql.js carrega o banco inteiro em memória, o que pode pesar em celulares mais fracos com cofres na casa dos 100 MB
- A interface de storage é uma indireção que não seria necessária se o motor fosse definitivo

## Consequências

- A interface de storage é a única fronteira permitida para acesso ao banco; violá-la anula o benefício desta decisão e deve ser tratada como bug de arquitetura.
- Os testes de migração de schema rodam contra essa interface, não contra sql.js, para continuarem válidos após uma eventual troca de motor.
- O gatilho para revisitar esta decisão é evidência de performance ruim em uso real (abertura lenta do cofre ou travamento em aparelho de entrada), não crescimento teórico de escala.
- Se a escala mudar — usuários com frotinhas, 300+ notas —, esta decisão precisa ser reavaliada antes que os cofres cresçam em produção.
