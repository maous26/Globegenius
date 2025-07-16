#!/bin/bash

# GlobeGenius CI/CD Quick Setup Guide

echo "🚀 GlobeGenius CI/CD Setup Options"
echo "=================================="

echo "
Current Status:
✅ Docker CLI connected (version 28.3.2)
✅ Docker images already built
✅ GitHub Actions workflow exists
⚠️  Missing: Container registry setup
⚠️  Missing: GitHub repository secrets

Next Steps:
1. Choose a container registry
2. Login to the registry
3. Tag and push your images
4. Configure GitHub secrets
5. Test the CI/CD pipeline
"

echo "📦 Container Registry Options:"
echo "1. Docker Hub (docker.io) - Free public repos, paid private"
echo "2. GitHub Container Registry (ghcr.io) - Free public/private"
echo "3. AWS ECR - Integrated with AWS"
echo "4. Google Container Registry - Integrated with GCP"
echo "5. Azure Container Registry - Integrated with Azure"

echo "
💡 Recommendation: GitHub Container Registry (ghcr.io)
- Free for public and private repositories
- Integrated with GitHub Actions
- No additional setup required
"

echo "🔧 Quick Setup Commands:"
echo "
# Option 1: Docker Hub
docker login
docker tag globegenius-backend:latest YOUR_USERNAME/globegenius-backend:latest
docker push YOUR_USERNAME/globegenius-backend:latest

# Option 2: GitHub Container Registry (Recommended)
echo \$GITHUB_TOKEN | docker login ghcr.io -u YOUR_USERNAME --password-stdin
docker tag globegenius-backend:latest ghcr.io/YOUR_USERNAME/globegenius-backend:latest
docker push ghcr.io/YOUR_USERNAME/globegenius-backend:latest
"

echo "🔑 Required GitHub Secrets:"
echo "Go to: https://github.com/YOUR_USERNAME/globegenius/settings/secrets/actions"
echo "
Core secrets needed:
- DOCKER_REGISTRY_URL
- DOCKER_REGISTRY_USERNAME  
- DOCKER_REGISTRY_PASSWORD
- DB_PASSWORD
- JWT_SECRET
- ENCRYPTION_KEY
"

echo "
🎯 Next Actions:
1. Run: ./setup-cicd.sh (interactive setup)
2. Or follow manual steps above
3. Add GitHub secrets
4. Push code to trigger CI/CD
"
