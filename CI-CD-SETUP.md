# CI/CD Setup Guide for GlobeGenius

## 🚨 GitHub Actions Warnings Fix

**Current Issue**: Your GitHub Actions workflow shows "Context access might be invalid" warnings because secrets are referenced but not added to your repository.

**Solution**: Add the missing secrets to your GitHub repository.

### Quick Fix Steps

1. **Go to GitHub Repository Settings**:
   ```
   https://github.com/YOUR_USERNAME/globegenius/settings/secrets/actions
   ```

2. **Add These Generated Secrets**:
   ```bash
   JWT_SECRET=e44f9c8a1fb5d53f57bde2e683e8ffeac8e2cff44bd3df181ffe3007313a43f6
   JWT_REFRESH_SECRET=6a66fcfbc220ef67e2539d9094e1284a11e3f089c09cfc3e1e2f212ccd0ffa6f
   ENCRYPTION_KEY=3d120c5bbab44ecf336b1d40a89deec7
   DB_PASSWORD=uVBALXH3K8x8BYwM2jqHT0EoS
   ```

3. **Add Container Registry Secrets**:
   ```bash
   DOCKER_USERNAME=your-docker-username
   DOCKER_PASSWORD=your-docker-password
   ```

4. **Add Placeholder URLs** (update later):
   ```bash
   PROD_API_URL=api.example.com
   PROD_APP_URL=example.com
   VPS_HOST=127.0.0.1
   VPS_USERNAME=deploy
   VPS_SSH_KEY=placeholder-key
   ```

5. **Push code** to test the workflow

**Result**: All warnings will disappear once secrets are added.

## Docker CLI Connection Status ✅

Your Docker CLI is already connected and working:
- **Docker Version**: 28.3.2
- **Context**: desktop-linux (Docker Desktop)
- **Status**: Connected to Docker daemon
- **Containers**: 12 available (currently stopped)
- **Images**: 22 available

## Current Docker Setup

### Development Environment
- **File**: `docker-compose.dev.yml`
- **Services**: postgres, redis, ml-service, backend, frontend, pgadmin, mailhog
- **Ports**: 
  - Backend: 3000
  - Frontend: 3001
  - ML Service: 8000
  - PostgreSQL: 5432
  - Redis: 6379
  - PGAdmin: 5050
  - Mailhog: 1025 (SMTP), 8025 (Web UI)

### Production Environment
- **File**: `docker-compose.prod.yml`
- **Services**: nginx, certbot, postgres, redis, ml-service, backend, frontend
- **Features**: SSL certificates, reverse proxy, production optimizations

## CI/CD Pipeline Configuration

### GitHub Actions Workflow Status
- **File**: `.github/workflows/ci-cd.yml`
- **Current Status**: ⚠️ Missing repository secrets
- **Jobs**: lint, test-backend, test-frontend, test-ml, security-scan, build-and-push, deploy-staging, deploy-production

### Required GitHub Repository Secrets

To complete your CI/CD setup, you need to add these secrets to your GitHub repository:

#### Docker Registry Secrets
```bash
DOCKER_REGISTRY_URL=your-registry-url  # e.g., docker.io, gcr.io, etc.
DOCKER_REGISTRY_USERNAME=your-username
DOCKER_REGISTRY_PASSWORD=your-password-or-token
```

#### Database Secrets
```bash
DB_USER=your-db-user
DB_PASSWORD=your-secure-db-password
DB_NAME=globegenius_prod
```

#### Application Secrets
```bash
JWT_SECRET=your-jwt-secret-key
JWT_REFRESH_SECRET=your-jwt-refresh-secret
ENCRYPTION_KEY=your-32-character-encryption-key
```

#### Deployment Secrets
```bash
DEPLOY_HOST=your-production-server-ip
DEPLOY_USER=your-deploy-user
DEPLOY_SSH_KEY=your-private-ssh-key
```

#### External Services
```bash
OPENAI_API_KEY=your-openai-api-key
STRIPE_SECRET_KEY=your-stripe-secret-key
EMAIL_SERVICE_API_KEY=your-email-service-key
```

## How to Add Secrets to GitHub Repository

1. Go to your GitHub repository
2. Click on **Settings** tab
3. In the left sidebar, click **Secrets and variables** > **Actions**
4. Click **New repository secret**
5. Add each secret with the name and value

## Docker Commands for CI/CD

### Build All Services
```bash
docker compose -f docker-compose.dev.yml build
```

### Build Production Images
```bash
docker compose -f docker-compose.prod.yml build
```

### Tag and Push Images
```bash
# Tag images
docker tag globegenius-backend:latest your-registry/globegenius-backend:latest
docker tag globegenius-frontend:latest your-registry/globegenius-frontend:latest
docker tag globegenius-ml:latest your-registry/globegenius-ml:latest

# Push images
docker push your-registry/globegenius-backend:latest
docker push your-registry/globegenius-frontend:latest
docker push your-registry/globegenius-ml:latest
```

### Deploy to Production
```bash
# Pull latest images
docker compose -f docker-compose.prod.yml pull

# Start services
docker compose -f docker-compose.prod.yml up -d

# Check status
docker compose -f docker-compose.prod.yml ps
```

## Next Steps

1. **Add GitHub Secrets**: Configure all required secrets in your GitHub repository
2. **Choose Container Registry**: Decide on Docker Hub, GitHub Container Registry, or cloud provider registry
3. **Configure Deployment Server**: Set up your production server with Docker
4. **Test CI/CD Pipeline**: Push code changes to trigger the workflow
5. **Monitor Deployments**: Use GitHub Actions logs to monitor deployment status

## Registry Options

### Docker Hub
- **URL**: `docker.io` or `index.docker.io`
- **Free**: Public repositories
- **Paid**: Private repositories

### GitHub Container Registry
- **URL**: `ghcr.io`
- **Free**: Public and private repositories
- **Authentication**: GitHub token

### Cloud Provider Registries
- **AWS ECR**: `<account-id>.dkr.ecr.<region>.amazonaws.com`
- **Google GCR**: `gcr.io/<project-id>`
- **Azure ACR**: `<registry-name>.azurecr.io`

## Current Issues to Fix

1. **DashboardPage.ts**: Rename to `.tsx` extension (900+ TypeScript errors)
2. **GitHub Secrets**: Add missing repository secrets
3. **Docker Registry**: Choose and configure container registry
4. **Production Server**: Set up deployment target server

Would you like me to help you configure any specific part of this CI/CD setup?
