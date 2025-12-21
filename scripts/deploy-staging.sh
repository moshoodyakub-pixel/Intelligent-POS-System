#!/bin/bash
# Staging Deployment Script
# Usage: ./scripts/deploy-staging.sh [commit_sha]

set -e

COMMIT_SHA=${1:-latest}
COMPOSE_FILE="docker-compose.staging.yml"

echo "=== POS System Staging Deployment ==="
echo "Deploying commit/tag: $COMMIT_SHA"

# Pull latest images
echo "Pulling images..."
export IMAGE_TAG=$COMMIT_SHA
docker compose -f $COMPOSE_FILE pull || {
    echo "Could not pull images, will build locally..."
}

# Deploy services
echo "Deploying services..."
docker compose -f $COMPOSE_FILE up -d --wait --wait-timeout 120

# Wait for health checks
echo "Waiting for services to become healthy..."
sleep 10

# Check backend health
echo "Checking backend health..."
for i in {1..30}; do
    if curl -sf http://localhost:8000/health > /dev/null; then
        echo "✓ Backend is healthy"
        break
    fi
    echo "Waiting for backend... ($i/30)"
    sleep 5
done

# Check frontend health
echo "Checking frontend..."
for i in {1..30}; do
    if curl -sf http://localhost:3000 > /dev/null; then
        echo "✓ Frontend is healthy"
        break
    fi
    echo "Waiting for frontend... ($i/30)"
    sleep 5
done

# Display service status
echo ""
echo "=== Service Status ==="
docker compose -f $COMPOSE_FILE ps

echo ""
echo "=== Health Check Results ==="
echo "Backend: $(curl -s http://localhost:8000/health | jq -r '.status' 2>/dev/null || echo 'unavailable')"
echo "Frontend: $(curl -s -o /dev/null -w '%{http_code}' http://localhost:3000)"

echo ""
echo "=== Staging Deployment Complete ==="
echo "Frontend URL: http://localhost:3000"
echo "Backend URL: http://localhost:8000"
echo "API Docs: http://localhost:8000/docs"
