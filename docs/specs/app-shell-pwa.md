# Spec: App Shell / PWA

**Status:** implementado
**Data:** 2026-07-29
**Arquitetura relacionada:** [sistema-historico-veiculos](/docs/architecture/sistema-historico-veiculos.md)
**ADRs relacionados:**
- [ADR-003 — Ionic React como UI kit](/docs/adr/003-ionic-react-como-ui-kit.md)
- [ADR-004 — Cloudflare Pages como hospedagem](/docs/adr/004-cloudflare-pages-como-hospedagem.md)

## Objetivo
Entregar o app como PWA instalável, com shell cacheado e experiência mobile-first, sem jamais colocar o cofre do usuário no cache do service worker.

## Comportamento esperado
- O app deve ser instalável como PWA (manifest + service worker via vite-plugin-pwa / Workbox).
- O service worker deve cachear o app shell (HTML/JS/CSS/WASM necessários à UI) e, na primeira descarga do OCR, o modelo `por.traineddata` — **nunca** o cofre nem dados do OPFS.
- Layout mobile-first com Ionic React (tabs/navegação touch-friendly, safe-area).
- Em iOS/Safari abaixo de 16.4 (ou navegador sem OPFS adequado), o app deve exibir aviso para atualizar o navegador, em vez de operar como se a persistência fosse confiável.
- Espaço reservado para um banner de ads fixo, fora dos fluxos de cadastro, para não causar layout shift quando ads forem ligados.
- O shell deve permitir navegação aos fluxos principais (cofre, veículos, manutenções, configurações/backup) conforme as demais specs forem implementadas.
- Em views aninhadas (formulário de veículo, histórico de manutenções, formulário de manutenção), o **header** deve exibir uma **seta de voltar** que retorna um nível na pilha de navegação do app (sem React Router no MVP).
- Uso offline do shell é possível após cache; os dados continuam apenas no OPFS / `.cofre` do usuário.

## Casos de borda
- Primeira visita sem cache: app carrega da rede; instalação PWA disponível quando o navegador permitir.
- Falha ao cachear o modelo OCR: OCR informa (spec OCR); o shell do app permanece utilizável.
- Usuário limpa dados do site: OPFS e caches são perdidos — coerente com a isenção; onboarding/backup cobrem a mitigação.
- Desktop sem “Add to Home Screen” idêntico ao mobile: manifest ainda válido; instalação conforme suporte do navegador.

## Fora do escopo
- Push notifications / alertas de peças
- Ads reais integrados (AdSense etc.) — apenas espaço reservado no MVP desta spec
- Capacitor / lojas nativas
- Cache de arquivos `.cofre` no service worker

## Critérios de aceite
- [x] Manifest e service worker ativos; app atende critérios básicos de instalabilidade PWA
- [x] Service worker cacheia shell; inspeção confirma que não há estratégia de cache para o cofre/OPFS
- [x] Modelo OCR pode ser cacheado pelo SW após primeiro download com aviso de tamanho
- [x] Em navegador abaixo do suporte mínimo de OPFS, aviso de atualização é exibido
- [x] Layout mobile-first Ionic com espaço de banner reservado fora dos fluxos de cadastro
- [x] App shell navega para as áreas principais sem quebrar em viewport mobile
- [x] Views aninhadas exibem seta de voltar no header com o mesmo destino da navegação “voltar/cancelar” existente

## Estratégia de teste
- **Unitário:** feature-check de suporte OPFS / versão mínima; configuração de rotas de cache (o que entra / o que não entra)
- **Integração:** build PWA gera service worker e manifest esperados
- **E2E:** carregar app em viewport mobile; verificar aviso quando suporte for simulado como insuficiente

## Notas de implementação
- vite-plugin-pwa (Workbox)
- Suporte mínimo: iOS/Safari 16.4+ (CONTEXT)
- Coordenar aviso de tamanho do `por.traineddata` com a spec OCR
- Hospedagem Cloudflare Pages (ADR-004) — SPA fallback no deploy
