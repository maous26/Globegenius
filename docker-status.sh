#!/bin/bash

# GlobeGenius Docker Status Check

echo "🐳 Docker CLI Connection Status"
echo "=============================="

# Check Docker version
echo "Docker Version:"
docker --version

# Check Docker daemon status
echo -e "\nDocker Daemon Status:"
if docker info >/dev/null 2>&1; then
    echo "✅ Docker daemon is running"
else
    echo "❌ Docker daemon is not running"
    exit 1
fi

# Check current context
echo -e "\nCurrent Docker Context:"
docker context show

# Check available contexts
echo -e "\nAvailable Contexts:"
docker context ls

# Check running containers
echo -e "\nRunning Containers:"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

# Check available images
echo -e "\nGlobeGenius Images:"
docker images | grep globegenius | head -10

# Check Docker Compose files
echo -e "\nDocker Compose Files:"
ls -la docker-compose*.yml

# Check if logged into registries
echo -e "\nRegistry Login Status:"
if docker info 2>/dev/null | grep -q "Username"; then
    echo "✅ Logged into Docker registry"
else
    echo "ℹ️  Not logged into any registry (use 'docker login')"
fi

# Check network
echo -e "\nDocker Networks:"
docker network ls | grep globegenius

# Check volumes
echo -e "\nDocker Volumes:"
docker volume ls | grep globegenius

echo -e "\n🎯 Quick Commands:"
echo "Start development environment: docker compose -f docker-compose.dev.yml up -d"
echo "Stop development environment: docker compose -f docker-compose.dev.yml down"
echo "View logs: docker compose -f docker-compose.dev.yml logs -f"
echo "Build images: docker compose -f docker-compose.dev.yml build"
echo "Login to Docker Hub: docker login"
echo "Login to GitHub Registry: docker login ghcr.io"
