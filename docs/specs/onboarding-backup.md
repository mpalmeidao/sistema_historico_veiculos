# Spec: Onboarding e Backup

**Status:** rascunho
**Data:** 2026-07-29
**Arquitetura relacionada:** [sistema-historico-veiculos](/docs/architecture/sistema-historico-veiculos.md)
**ADRs relacionados:**
- [ADR-001 — OPFS como armazenamento de trabalho](/docs/adr/001-opfs-como-armazenamento-de-trabalho.md)

## Objetivo
Deixar explícito que os dados são responsabilidade do usuário e orientar backup, compensando o modelo mental de “o app guarda sozinho” introduzido pelo OPFS.

## Comportamento esperado
- Ao criar o primeiro cofre, o usuário deve ver e aceitar o termo de isenção: o app não armazena, não sincroniza e não recupera dados; a guarda do arquivo é exclusiva do usuário.
- No mesmo onboarding, o app deve explicar que o trabalho é salvo automaticamente no dispositivo e que o usuário deve manter cópias do `.cofre` em pelo menos dois locais distintos (ex.: nuvem pessoal + pen drive/HD).
- O onboarding deve indicar como exportar o cofre (ação de backup manual).
- Após um número de edições ou período sem cópia de segurança confirmada, o app deve exibir lembrete **não intrusivo** sugerindo exportar uma cópia.
- O termo de isenção (ou referência equivalente) deve permanecer acessível no app (não só no primeiro uso) e ser o mesmo espírito do texto usado no rodapé do relatório PDF.
- Aceitar o termo é pré-requisito para criar/usar o cofre novo no fluxo de primeiro uso.

## Casos de borda
- Usuário já possui cofre de trabalho (retorno): não repetir onboarding completo; lembretes de backup continuam válidos.
- Usuário dispensa o lembrete: pode adiar; o lembrete pode voltar depois conforme a regra definida (não spam infinito na mesma sessão).
- Recusa do termo no primeiro uso: não criar o cofre / não seguir para o app sem aceite.
- Importar `.cofre` existente na primeira abertura: ainda deve deixar clara a responsabilidade de backup; o aceite do termo aplica-se ao uso do app.

## Fora do escopo
- Backup automático em Google Drive (pós-MVP) ou iCloud
- Assinatura jurídica formal com coleta de evidência em servidor
- Tutoriais longos de produto além da orientação de backup/isenção
- Sincronização entre dispositivos

## Critérios de aceite
- [x] Primeiro cofre exige visualização e aceite do termo de isenção
- [x] Onboarding explica gravação automática + necessidade de exportar cópias em dois locais
- [x] Usuário encontra caminho claro para exportar o `.cofre` a partir do onboarding/orientação
- [x] Lembrete de backup aparece após critério de edições/tempo sem export confirmado, de forma não bloqueante
- [x] Termo permanece consultável após o primeiro uso
- [x] Sem aceite do termo, o fluxo de criação do primeiro cofre não conclui

## Estratégia de teste
- **Unitário:** regra de disparo do lembrete (edições/tempo / “export confirmado”)
- **Integração:** flag de termo aceito + estado de último backup na persistência local do app
- **E2E:** primeiro acesso → aceite → criar cofre; simular N edições → ver lembrete

## Notas de implementação
- Crítico para validar H1 com o modelo OPFS (ADR-001 / discovery-tech 2)
- Critérios numéricos exatos do lembrete (N edições / M dias) podem ser definidos na implementação desde que documentados e testáveis
- Texto do termo deve ser reutilizável pelo relatório PDF
