# Implementation Plan: Onboarding e Backup

**Spec:** [onboarding-backup](/docs/specs/onboarding-backup.md)
**Status:** concluído
**Data:** 2026-07-29

## Contexto
Termo de isenção, orientação de backup no primeiro cofre e lembretes não intrusivos. Compensa o modelo mental do OPFS (“o app guarda sozinho”). Depende de criar/exportar cofre; o texto da isenção deve ser reutilizável pelo relatório PDF.

## Tarefas

### Fase 1: Conteúdo e persistência de flags
- [x] **[1.1]** Texto do termo de isenção reutilizável
  - _O que fazer:_ módulo único com o texto (espírito: app não armazena/sincroniza/recupera; guarda é do usuário); exportável para PDF depois
  - _Critério de conclusão:_ UI e futuro relatório importam a mesma fonte

- [x] **[1.2]** Persistência local de aceite e último backup
  - _O que fazer:_ flags: termo aceito; timestamp/marcador de export confirmado; contadores para lembrete — fora do cofre SQLite ou no app prefs, documentado
  - _Critério de conclusão:_ estado sobrevive a reload; integração cobre leitura/gravação das flags

### Fase 2: Fluxo de primeiro uso
- [x] **[2.1]** Onboarding: termo + explicação OPFS + dois locais de cópia
  - _O que fazer:_ telas Ionic; explicar gravação automática; orientar cópias do `.cofre` em ≥2 locais; indicar como exportar; strings isoladas
  - _Critério de conclusão:_ conteúdo da spec presente; caminho claro para export

- [x] **[2.2]** Aceite obrigatório para criar/usar cofre novo
  - _O que fazer:_ sem aceite, criação do primeiro cofre não conclui; recusa bloqueia avanço
  - _Critério de conclusão:_ critério de aceite da spec coberto por teste/E2E

- [x] **[2.3]** Retorno com cofre existente / import na primeira abertura
  - _O que fazer:_ não repetir onboarding completo se já há trabalho; import ainda deixa clara a responsabilidade; aceite aplica-se ao uso do app conforme spec
  - _Critério de conclusão:_ retorno sem re-onboarding completo; lembretes continuam válidos

### Fase 3: Lembretes
- [x] **[3.1]** Regra de disparo do lembrete (N edições / M dias)
  - _O que fazer:_ definir e documentar N e M testáveis; lembrete não bloqueante; dispensar adia sem spam infinito na mesma sessão
  - _Critério de conclusão:_ testes unitários da regra; comportamento de adiamento coberto

- [x] **[3.2]** UI do lembrete + termo consultável depois
  - _O que fazer:_ banner/toast/sheet não intrusivo sugerindo export; acesso ao termo fora do primeiro uso (configurações ou equivalente)
  - _Critério de conclusão:_ lembrete aparece após critério; termo reconsultável

### Fase 4: Testes e revisão
- [x] **[4.1]** E2E: primeiro acesso → aceite → criar cofre; N edições → lembrete
  - _O que fazer:_ fluxos em `/tests/e2e`
  - _Critério de conclusão:_ E2E passa

- [x] **[4.2]** Verificar critérios de aceite da spec onboarding-backup
- [x] **[4.3]** Atualizar CONTEXT.md com N/M do lembrete se forem decisões de produto fixadas

## Dependências externas
- Cofre-storage (criar + exportar)
- Preferências locais (localStorage ou equivalente — feature-check se necessário)

## Riscos
- Critérios N/M não estão na spec: escolher valores conservadores, documentar e testar
- Não confundir flags de onboarding com dados do cofre — limpar site apaga ambos (coerente com isenção)
