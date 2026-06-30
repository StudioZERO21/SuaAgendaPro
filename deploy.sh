#!/bin/bash
# deploy.sh — SuaAgenda.Pro
# Execute no terminal da VPS: bash deploy.sh
#
# Pré-requisitos: git, docker, docker compose v2
# O Traefik já está rodando no VPS e cuida do SSL automaticamente.

set -euo pipefail

REPO="https://github.com/StudioZERO21/SuaAgendaPro.git"
DEPLOY_DIR="/opt/suaagendapro"
# A VPS faz pull desta branch — manter sincronizada com master após cada fix.
BRANCH="main"

GREEN='\033[0;32m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; NC='\033[0m'
ok()   { echo -e "${GREEN}✓${NC} $1"; }
warn() { echo -e "${YELLOW}⚠${NC}  $1"; }
err()  { echo -e "${RED}✗${NC} $1"; exit 1; }

echo ""
echo "══════════════════════════════════════════════"
echo "   Deploy — SuaAgenda.Pro"
echo "══════════════════════════════════════════════"
echo ""

# ─── 1. Clonar ou atualizar o repositório ─────────────────────────────────────
if [ -d "$DEPLOY_DIR/.git" ]; then
  ok "Repositório já existe — atualizando..."
  git -C "$DEPLOY_DIR" fetch origin
  git -C "$DEPLOY_DIR" checkout "$BRANCH"
  git -C "$DEPLOY_DIR" pull origin "$BRANCH"
else
  warn "Clonando repositório..."
  echo ""
  echo "Repositório privado — informe o token do GitHub."
  echo "Gere em: github.com → Settings → Developer settings → Personal access tokens"
  echo "(permissão mínima: Contents → Read-only)"
  echo ""
  read -rp "Token do GitHub: " GH_TOKEN
  git clone --branch "$BRANCH" --depth 1 \
    "https://${GH_TOKEN}@github.com/StudioZERO21/SuaAgendaPro.git" \
    "$DEPLOY_DIR"
  ok "Repositório clonado em $DEPLOY_DIR"
fi

cd "$DEPLOY_DIR"

# ─── 2. Verificar .env.production ─────────────────────────────────────────────
if [ ! -f ".env.production" ]; then
  warn ".env.production não encontrado!"
  echo ""
  echo "Copie o arquivo de exemplo:"
  echo "  cp $DEPLOY_DIR/.env.production.example $DEPLOY_DIR/.env.production"
  echo "  nano $DEPLOY_DIR/.env.production"
  echo ""
  echo "Variáveis obrigatórias a preencher:"
  echo "  SUPER_ADMINS='"'[{"email":"adrianoelite@msn.com","name":"Adriano Santos","password":"SUA_SENHA","must_change_password":false}]'"'"
  echo "  ASAAS_ENV=production    (mudar de sandbox para production)"
  echo "  MP_WEBHOOK_SECRET=      (gerar token aleatório)"
  echo "  AI_SYNC_TOKEN=          (gerar token aleatório)"
  echo ""
  err "Crie o .env.production e execute: bash $DEPLOY_DIR/deploy.sh"
fi
ok ".env.production encontrado"

# ─── 3. Parar container antigo se existir ─────────────────────────────────────
if docker ps -a --format '{{.Names}}' 2>/dev/null | grep -q "suaagendapro-app"; then
  warn "Container antigo encontrado — removendo..."
  docker compose down --remove-orphans 2>/dev/null || true
  ok "Containers antigos removidos"
fi

# ─── 4. Build e start ─────────────────────────────────────────────────────────
echo ""
echo "Iniciando build (pode levar alguns minutos)..."
echo ""
docker compose up -d --build --remove-orphans

echo ""
ok "Build concluído!"

# ─── 5. Aguardar healthcheck ──────────────────────────────────────────────────
echo ""
echo "Aguardando app ficar saudável (até 90s)..."
for i in $(seq 1 18); do
  sleep 5
  STATUS=$(docker inspect --format='{{.State.Health.Status}}' suaagendapro-app 2>/dev/null || echo "starting")
  if [ "$STATUS" = "healthy" ]; then
    ok "App está saudável!"
    break
  fi
  echo "  [${i}/18] status: $STATUS"
done

# ─── 6. Status final ──────────────────────────────────────────────────────────
echo ""
echo "══════════════════════════════════════════════"
docker compose ps
echo "══════════════════════════════════════════════"
echo ""
echo "Últimas linhas do log:"
docker compose logs --tail=15 app
echo ""
ok "Deploy concluído!"
echo ""
echo "  Site:   https://suaagenda.pro"
echo "  App:    https://app.suaagenda.pro"
echo "  Admin:  https://super.suaagenda.pro"
echo ""
echo "Comandos úteis:"
echo "  Logs:       docker compose -f $DEPLOY_DIR/docker-compose.yml logs -f app"
echo "  Reiniciar:  docker compose -f $DEPLOY_DIR/docker-compose.yml restart app"
echo "  Atualizar:  cd $DEPLOY_DIR && git pull && docker compose up -d --build"
echo ""
