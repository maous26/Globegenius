# GitHub Secrets Configuration for GlobeGenius CI/CD

## 🚨 Current Status
Your GitHub Actions workflow is showing warnings because the following secrets are referenced but not configured in your repository.

## 🔑 Required Secrets to Add

Go to your GitHub repository settings and add these secrets:
**URL**: `https://github.com/YOUR_USERNAME/globegenius/settings/secrets/actions`

### Docker Registry Secrets
```bash
DOCKER_USERNAME=your-docker-username
DOCKER_PASSWORD=your-docker-password-or-token
```

### Database Configuration
```bash
DB_USER=globegenius_prod
DB_PASSWORD=your-secure-database-password
DB_NAME=globegenius_prod
```

### Application Security
```bash
JWT_SECRET=your-jwt-secret-minimum-32-characters-long
JWT_REFRESH_SECRET=your-refresh-secret-minimum-32-characters
ENCRYPTION_KEY=your-32-character-encryption-key-here
```

### Production URLs
```bash
PROD_API_URL=your-production-api-url.com
PROD_APP_URL=your-production-app-url.com
```

### Deployment Server
```bash
VPS_HOST=your-production-server-ip
VPS_USERNAME=deploy
VPS_SSH_KEY=your-private-ssh-key-content
```

### External Services (Optional)
```bash
OPENAI_API_KEY=your-openai-api-key
STRIPE_SECRET_KEY=your-stripe-secret-key
EMAIL_SERVICE_API_KEY=your-email-service-key
SLACK_WEBHOOK=your-slack-webhook-url
```

## 🛠️ How to Add Secrets

### Method 1: GitHub Web Interface
1. Go to your repository on GitHub
2. Click **Settings** tab
3. In left sidebar: **Secrets and variables** → **Actions**
4. Click **New repository secret**
5. Add name and value for each secret

### Method 2: GitHub CLI (if you have gh CLI installed)
```bash
gh secret set DOCKER_USERNAME
gh secret set DOCKER_PASSWORD
gh secret set DB_PASSWORD
gh secret set JWT_SECRET
gh secret set ENCRYPTION_KEY
```

## 🐳 Container Registry Setup

### Option 1: Docker Hub
```bash
# Login to Docker Hub
docker login

# Set these secrets:
DOCKER_USERNAME=your-dockerhub-username
DOCKER_PASSWORD=your-dockerhub-password
```

### Option 2: GitHub Container Registry (Recommended)
```bash
# Generate GitHub Personal Access Token with packages:write scope
# https://github.com/settings/tokens

# Login to GitHub Container Registry
echo YOUR_TOKEN | docker login ghcr.io -u YOUR_USERNAME --password-stdin

# Set these secrets:
DOCKER_USERNAME=YOUR_GITHUB_USERNAME
DOCKER_PASSWORD=YOUR_GITHUB_TOKEN
```

## 🔧 Quick Commands to Generate Secrets

### Generate JWT Secret (32+ characters)
```bash
openssl rand -hex 32
```

### Generate Encryption Key (32 characters)
```bash
openssl rand -hex 16
```

### Generate SSH Key for Deployment
```bash
ssh-keygen -t rsa -b 4096 -C "deploy@globegenius"
# Use the private key content for VPS_SSH_KEY secret
# Add public key to your server's ~/.ssh/authorized_keys
```

## 📝 Secret Values Template

Copy this template and fill in your values:

```bash
# Docker Registry
DOCKER_USERNAME=your-username
DOCKER_PASSWORD=your-password

# Database
DB_USER=globegenius_prod
DB_PASSWORD=Secure123Password!
DB_NAME=globegenius_prod

# Application
JWT_SECRET=your-super-secret-jwt-key-at-least-32-characters-long
JWT_REFRESH_SECRET=your-refresh-secret-also-32-characters-minimum
ENCRYPTION_KEY=your32characterencryptionkeyhere

# Production URLs
PROD_API_URL=api.yourdomain.com
PROD_APP_URL=yourdomain.com

# Deployment
VPS_HOST=your.server.ip.address
VPS_USERNAME=deploy
VPS_SSH_KEY=-----BEGIN RSA PRIVATE KEY-----
your-private-key-content-here
-----END RSA PRIVATE KEY-----

# Optional Services
OPENAI_API_KEY=sk-your-openai-key
STRIPE_SECRET_KEY=sk_live_your-stripe-key
SLACK_WEBHOOK=https://hooks.slack.com/services/YOUR/WEBHOOK/URL
```

## ⚡ Quick Setup Script

Run this to help generate and set up secrets:

```bash
#!/bin/bash
echo "🔑 GlobeGenius Secrets Generator"
echo "================================"

# Generate JWT secrets
echo "JWT_SECRET=$(openssl rand -hex 32)"
echo "JWT_REFRESH_SECRET=$(openssl rand -hex 32)"
echo "ENCRYPTION_KEY=$(openssl rand -hex 16)"

# Generate database password
echo "DB_PASSWORD=$(openssl rand -base64 32)"

echo ""
echo "Copy these values and add them to your GitHub repository secrets!"
echo "Go to: https://github.com/YOUR_USERNAME/globegenius/settings/secrets/actions"
```

## 🚀 After Adding Secrets

Once you've added all the secrets to your GitHub repository:

1. **Push any code change** to trigger the workflow
2. **Check GitHub Actions** tab to see if warnings are gone
3. **Monitor the build process** in the Actions tab
4. **Fix any remaining issues** step by step

## 📊 Validation

To check if your secrets are properly configured:
1. Go to your repository → Settings → Secrets and variables → Actions
2. You should see all the secret names listed (values are hidden)
3. Run the workflow by pushing code or manually triggering it

The warnings will disappear once all referenced secrets are added to your repository.
