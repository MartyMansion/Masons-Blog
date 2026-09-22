#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"

if [ ! -f .env ]; then
  echo "Missing .env (needs SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM, CONTACT_TO, PORT)." >&2
  echo "Copy .env.example to .env and fill it in first." >&2
  exit 1
fi

echo "==> Pulling latest changes"
git pull --ff-only

echo "==> Building Docker image"
docker compose build

echo "==> Restarting container"
docker compose up -d --remove-orphans

echo "==> Pruning dangling images"
docker image prune -f

echo "==> Recent logs"
docker compose logs --tail=20
