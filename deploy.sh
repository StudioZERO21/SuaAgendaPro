#!/bin/bash
# deploy.sh — Script de deploy para VPS Hostinger
# Uso: ./deploy.sh [--build] [--logs]
#
# Pré-requisitos na VPS:
#   1. Docker + docker-compose instalados
#   2. .env.production preenchido (cp .env.production.example .env.production)
#   3. Certificados SSL: certbot certonly --standalone -d suaagenda.pro -d www.suaagenda.pro -d app.suaagenda.pro -d super.suaagenda.pro

set -e

COMPOSE="docker-compose"
APP="suaagendapro-app"

# ─── Flags ──────────────────────────────────────────────────────────────────
BUILD=false
LOGS=false
for arg in "$@"; do
  case $arg in
    --build) BUILD=true ;;
    --logs)  LOGS=true  ;;
  esac
done

echo "==> [1/5] Verificando pré-requisitos..."
command -v docker >/dev/null 2>&1 || { echo "Docker não encontrado. Instale em https://docs.docker.com/engine/install/"; exit 1; }
[ -f ".env.production" ] || { echo "Arquivo .env.production não encontrado. Copie .env.production.example e preencha."; exit 1; }

echo "==> [2/5] Atualizando código..."
git pull origin main

echo "==> [3/5] Subindo containers..."
if [ "$BUILD" = true ]; then
  $COMPOSE -f docker-compose.yml --env-file .env.production up -d --build
else
  $COMPOSE -f docker-compose.yml --env-file .env.production up -d
fi

echo "==> [4/5] Aguardando healthcheck do app..."
for i in $(seq 1 30); do
  STATUS=$(docker inspect --format='{{.State.Health.Status}}' $APP 2>/dev/null || echo "starting")
  if [ "$STATUS" = "healthy" ]; then
    echo "    App healthy ✓"
    break
  fi
  echo "    Aguardando... ($i/30) status=$STATUS"
  sleep 3
done

echo "==> [5/5] Status dos containers:"
$COMPOSE -f docker-compose.yml ps

if [ "$LOGS" = true ]; then
  echo ""
  echo "==> Logs do app (Ctrl+C para sair):"
  $COMPOSE -f docker-compose.yml logs -f app
fi

echo ""
echo "Deploy concluído!"
echo "  App:        https://app.suaagenda.pro"
echo "  Site:       https://suaagenda.pro"
echo "  Admin:      https://super.suaagenda.pro"
