#!/usr/bin/env bash
# One-shot: cria o repo no GitHub, grava secrets Cloudflare e faz push da main.
# Uso:
#   export CLOUDFLARE_API_TOKEN='...'
#   export CLOUDFLARE_ACCOUNT_ID='...'
#   ./scripts/publish-cloudflare.sh
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

REPO_NAME="sistema_historico_veiculos"
PROJECT_NAME="${CLOUDFLARE_PAGES_PROJECT_NAME:-sistema-historico-veiculos}"

if [[ -z "${CLOUDFLARE_API_TOKEN:-}" || -z "${CLOUDFLARE_ACCOUNT_ID:-}" ]]; then
  echo "Defina CLOUDFLARE_API_TOKEN e CLOUDFLARE_ACCOUNT_ID no ambiente." >&2
  exit 1
fi

echo "==> Autenticacao GitHub (gh)"
if ! gh api user --jq '.login' >/dev/null 2>&1; then
  echo "gh nao autenticado. Rodando: gh auth login -h github.com -p https -w" >&2
  gh auth login -h github.com -p https -w
fi

OWNER="$(gh api user --jq '.login')"
echo "Usuario GitHub: $OWNER"

echo "==> Repositorio $OWNER/$REPO_NAME"
if gh repo view "$OWNER/$REPO_NAME" >/dev/null 2>&1; then
  echo "Repositorio ja existe."
else
  gh repo create "$REPO_NAME" --public --source=. --remote=origin --description "PWA de historico de manutencoes veiculares (client-side)"
fi

if ! git remote get-url origin >/dev/null 2>&1; then
  git remote add origin "https://github.com/$OWNER/$REPO_NAME.git"
fi

echo "==> Secrets Cloudflare no GitHub"
gh secret set CLOUDFLARE_API_TOKEN --body "$CLOUDFLARE_API_TOKEN" --repo "$OWNER/$REPO_NAME"
gh secret set CLOUDFLARE_ACCOUNT_ID --body "$CLOUDFLARE_ACCOUNT_ID" --repo "$OWNER/$REPO_NAME"

echo "==> Projeto Cloudflare Pages (Direct Upload), se ainda nao existir"
if ! npx --yes wrangler@4 pages project list 2>/dev/null | grep -q "$PROJECT_NAME"; then
  npx --yes wrangler@4 pages project create "$PROJECT_NAME" --production-branch=main || true
fi

echo "==> Push da main (dispara o workflow de deploy)"
git push -u origin main

echo "==> Aguardando workflow"
sleep 5
gh run list --repo "$OWNER/$REPO_NAME" --workflow=deploy-pages.yml --limit 3 || true

echo
echo "Pronto. Acompanhe o deploy em:"
echo "  https://github.com/$OWNER/$REPO_NAME/actions"
echo "Site (apos o Actions concluir):"
echo "  https://$PROJECT_NAME.pages.dev"
