# Histórico de Veículos

Webapp/PWA client-side para arquivar histórico de manutenções veiculares. Dados ficam no dispositivo do usuário (cofre SQLite); o app é só a interface local.

## Pré-requisitos

- Node.js 22+ (compatível com Vite atual)
- npm 10+

## Setup local

```bash
npm install
npm run dev
```

Abra a URL exibida pelo Vite (geralmente `http://localhost:5173`).

## Scripts

| Script                     | Descrição                              |
| -------------------------- | -------------------------------------- |
| `npm run dev`              | Servidor de desenvolvimento            |
| `npm run build`            | Build de produção (`dist/`)            |
| `npm run preview`          | Preview do build                       |
| `npm run lint`             | ESLint + Prettier (check)              |
| `npm run format`           | Prettier (write)                       |
| `npm test`                 | Testes unitários (Vitest)              |
| `npm run test:e2e`         | Smoke E2E (Playwright)                 |
| `npm run test:e2e:install` | Instala browser Chromium do Playwright |

Antes do primeiro E2E: `npm run build && npm run test:e2e:install`.

## Estrutura de pastas

```
src/
  ui/         # páginas, componentes e hooks de interface (Ionic)
  domain/     # regras de negócio (sem sql.js)
  storage/    # única fronteira para cofre / OPFS / sql.js
  shared/     # i18n (PT-BR), feature-checks, utilitários
  workers/    # Web Workers (OCR, imagem)
tests/e2e/    # fluxos E2E (`[fluxo].e2e.ts`)
```

## Deploy (Cloudflare Pages)

O workflow [`.github/workflows/deploy-pages.yml`](.github/workflows/deploy-pages.yml) roda lint, testes unitários, build e deploy a cada push.

Secrets / variáveis necessários no repositório GitHub:

| Nome                            | Tipo                | Descrição                                                     |
| ------------------------------- | ------------------- | ------------------------------------------------------------- |
| `CLOUDFLARE_API_TOKEN`          | secret              | Token da API Cloudflare com permissão de Pages                |
| `CLOUDFLARE_ACCOUNT_ID`         | secret              | Account ID da Cloudflare                                      |
| `CLOUDFLARE_PAGES_PROJECT_NAME` | variable (opcional) | Nome do projeto Pages (default: `sistema-historico-veiculos`) |

SPA fallback: `public/_redirects` com `/* /index.html 200`.
