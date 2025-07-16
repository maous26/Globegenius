#!/bin/bash

# GitHub Secrets Quick Setup for GlobeGenius
# This script helps you set up all required secrets to fix CI/CD warnings

echo "🚨 GitHub Actions Diagnostic Warnings Fix"
echo "=========================================="

echo "
Your GitHub Actions workflow is showing warnings because these secrets are missing:
- DOCKER_USERNAME
- DOCKER_PASSWORD  
- PROD_API_URL
- PROD_APP_URL
- VPS_HOST
- VPS_USERNAME
- VPS_SSH_KEY
- SLACK_WEBHOOK

Here are the generated secure values for your secrets:
"

echo "🔑 GENERATED SECRETS (add these to GitHub):"
echo "JWT_SECRET=e44f9c8a1fb5d53f57bde2e683e8ffeac8e2cff44bd3df181ffe3007313a43f6"
echo "JWT_REFRESH_SECRET=6a66fcfbc220ef67e2539d9094e1284a11e3f089c09cfc3e1e2f212ccd0ffa6f"
echo "ENCRYPTION_KEY=3d120c5bbab44ecf336b1d40a89deec7"
echo "DB_PASSWORD=uVBALXH3K8x8BYwM2jqHT0EoS"

echo "
📝 COMPLETE SECRETS LIST FOR GITHUB:
====================================

Go to: https://github.com/YOUR_USERNAME/globegenius/settings/secrets/actions

Add these secrets one by one:

🐳 Docker Registry Secrets:
DOCKER_USERNAME=your-docker-username
DOCKER_PASSWORD=your-docker-password

🗄️ Database Secrets:
DB_USER=globegenius_prod
DB_PASSWORD=uVBALXH3K8x8BYwM2jqHT0EoS
DB_NAME=globegenius_prod

🔐 Application Secrets:
JWT_SECRET=e44f9c8a1fb5d53f57bde2e683e8ffeac8e2cff44bd3df181ffe3007313a43f6
JWT_REFRESH_SECRET=6a66fcfbc220ef67e2539d9094e1284a11e3f089c09cfc3e1e2f212ccd0ffa6f
ENCRYPTION_KEY=3d120c5bbab44ecf336b1d40a89deec7

🌐 Production URLs:
PROD_API_URL=api.yourdomain.com
PROD_APP_URL=yourdomain.com

🖥️ Deployment Server:
VPS_HOST=your.server.ip.address
VPS_USERNAME=deploy
VPS_SSH_KEY=your-private-ssh-key-content

🔔 Optional Notifications:
SLACK_WEBHOOK=https://hooks.slack.com/services/YOUR/WEBHOOK/URL

🎯 IMMEDIATE ACTIONS TO FIX WARNINGS:
====================================

1. Choose Container Registry:
   
   Option A - Docker Hub:
   - Create account at https://hub.docker.com
   - DOCKER_USERNAME = your Docker Hub username
   - DOCKER_PASSWORD = your Docker Hub password
   
   Option B - GitHub Container Registry (Recommended):
   - DOCKER_USERNAME = your GitHub username
   - DOCKER_PASSWORD = Personal Access Token with packages:write scope
   - Generate token: https://github.com/settings/tokens

2. Add Minimum Required Secrets:
   - DOCKER_USERNAME
   - DOCKER_PASSWORD
   - JWT_SECRET (provided above)
   - ENCRYPTION_KEY (provided above)
   - DB_PASSWORD (provided above)

3. Add Production URLs (use placeholders for now):
   - PROD_API_URL=api.example.com
   - PROD_APP_URL=example.com

4. Add Deployment Placeholders:
   - VPS_HOST=127.0.0.1
   - VPS_USERNAME=deploy
   - VPS_SSH_KEY=placeholder-key

5. Push any code change to test the workflow

🚀 QUICK COMMANDS:
=================

# Login to Docker Hub
docker login

# Login to GitHub Container Registry
echo YOUR_TOKEN | docker login ghcr.io -u YOUR_USERNAME --password-stdin

# Test your workflow
git add .
git commit -m \"Test CI/CD pipeline\"
git push origin main

✅ VERIFICATION:
===============

After adding secrets:
1. Go to your repository → Actions tab
2. Check if warnings are gone
3. Run the workflow by pushing code
4. Monitor build progress
5. Fix any remaining issues

The warnings will disappear once all referenced secrets are added to your GitHub repository!
"
