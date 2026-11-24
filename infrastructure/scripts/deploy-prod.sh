#!/usr/bin/env bash
set -e

# ==============================================================================
# Med24Plus Production Zero-Downtime Deployment Script
# ==============================================================================

echo "=========================================================="
echo " Starting Med24Plus Deployment to Production"
echo "=========================================================="

# Ensure .env.production exists
if [ ! -f .env.production ]; then
    echo "ERROR: .env.production file not found!"
    echo "Please copy infrastructure/deployment/.env.production.example to .env.production and configure credentials."
    exit 1
fi

# Load production environment variables
set -a
source .env.production
set +a

echo "--> Pulling latest changes from Git..."
git pull origin main

echo "--> Building and starting Docker containers..."
docker compose -f docker-compose.prod.yml up -d --build --force-recreate

echo "--> Waiting for Postgres & Backend services to be ready..."
sleep 5

echo "--> Running Database Migrations (Alembic)..."
docker compose -f docker-compose.prod.yml exec -T backend alembic upgrade head

echo "--> Running Backend Health Check..."
TARGET_PORT=${BACKEND_PORT:-8024}
HEALTH_OK=false
for i in {1..10}; do
    if curl -s -f http://127.0.0.1:${TARGET_PORT}/api/v1/health > /dev/null; then
        echo " Backend is healthy on port ${TARGET_PORT}!"
        HEALTH_OK=true
        break
    fi
    echo "Waiting for backend on port ${TARGET_PORT}... attempt $i/10"
    sleep 3
done

if [ "$HEALTH_OK" = false ]; then
    echo "WARNING: Backend did not respond on http://127.0.0.1:${TARGET_PORT}/api/v1/health."
    echo "--> Printing last 50 lines of backend logs for diagnosis:"
    docker compose -f docker-compose.prod.yml logs --tail=50 backend
fi

echo "--> Reloading Nginx configuration..."
if command -v nginx > /dev/null; then
    sudo nginx -t && sudo systemctl reload nginx
    echo " Nginx reloaded successfully."
fi

echo "=========================================================="
echo " Med24Plus Live Services Status:"
echo "   - API:         https://med24plus-api.serwex.in"
echo "   - Admin Panel: https://med24plus-admin.serwex.in"
echo "   - Customer Web:https://med24plus.serwex.in"
echo "=========================================================="
docker compose -f docker-compose.prod.yml ps
