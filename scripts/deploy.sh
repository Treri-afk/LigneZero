#!/usr/bin/env bash
# Déploiement de la vitrine + du manager sur le VPS.
#
# Les deux apps sont des SPA STATIQUES : on build en local puis on synchronise
# les dossiers `dist/`. Aucun process Node côté serveur, nginx sert les fichiers.
#
#   ./scripts/deploy.sh          → build + envoi des deux
#   ./scripts/deploy.sh site     → vitrine seulement
#   ./scripts/deploy.sh manager  → manager seulement
#
# ATTENTION : les variables VITE_* sont figées DANS le bundle au moment du
# build. Modifier apps/*/.env impose de rebuilder, pas seulement de resynchroniser.
set -euo pipefail

HOST="${DEPLOY_HOST:-galerie}"       # alias défini dans ~/.ssh/config
REMOTE_ROOT="/var/www/lignezero"
TARGET="${1:-all}"

cd "$(dirname "$0")/.."

push() {
  local app="$1" dir="$2"
  echo "▶ build $app"
  npm run "build:$app" --silent

  # --delete : le distant devient le miroir exact du build, sans reliquat
  # d'anciens assets hashés qui gonfleraient le disque à chaque déploiement.
  echo "▶ envoi $app → $HOST:$REMOTE_ROOT/$dir"
  rsync -az --delete "apps/$app/dist/" "$HOST:$REMOTE_ROOT/$dir/"
}

case "$TARGET" in
  site)    push site site ;;
  manager) push manager manager ;;
  all)     push site site; push manager manager ;;
  *) echo "usage: $0 [site|manager|all]" >&2; exit 1 ;;
esac

echo "▶ vérification"
ssh "$HOST" '
  for p in 8080 8081; do
    printf "  port %s -> %s\n" "$p" "$(curl -s -o /dev/null -w "%{http_code}" --max-time 8 "http://localhost:$p/")"
  done'

echo "✓ déployé — http://152.228.134.120:8080 (site) · :8081 (manager)"
