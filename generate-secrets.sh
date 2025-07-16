#!/bin/bash

# GlobeGenius Secrets Generator
# This script generates secure values for your GitHub repository secrets

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔑 GlobeGenius GitHub Secrets Generator${NC}"
echo "========================================"

echo -e "\n${YELLOW}Generating secure secrets for your CI/CD pipeline...${NC}"

# Generate JWT secrets
JWT_SECRET=$(openssl rand -hex 32)
JWT_REFRESH_SECRET=$(openssl rand -hex 32)
ENCRYPTION_KEY=$(openssl rand -hex 16)
DB_PASSWORD=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-25)

echo -e "\n${GREEN}✅ Generated Application Secrets:${NC}"
echo "JWT_SECRET=$JWT_SECRET"
echo "JWT_REFRESH_SECRET=$JWT_REFRESH_SECRET"
echo "ENCRYPTION_KEY=$ENCRYPTION_KEY"
echo "DB_PASSWORD=$DB_PASSWORD"

echo -e "\n${YELLOW}📝 Complete secrets template for GitHub:${NC}"
echo "Copy these to your GitHub repository secrets:"
echo "https://github.com/YOUR_USERNAME/globegenius/settings/secrets/actions"

cat << EOF

# === COPY THESE SECRETS TO GITHUB ===

# Docker Registry (choose one option)
DOCKER_USERNAME=your-docker-username
DOCKER_PASSWORD=your-docker-password

# Database
DB_USER=globegenius_prod
DB_PASSWORD=$DB_PASSWORD
DB_NAME=globegenius_prod

# Application Security
JWT_SECRET=$JWT_SECRET
JWT_REFRESH_SECRET=$JWT_REFRESH_SECRET
ENCRYPTION_KEY=$ENCRYPTION_KEY

# Production URLs (update with your domain)
PROD_API_URL=api.yourdomain.com
PROD_APP_URL=yourdomain.com

# Deployment Server (update with your server details)
VPS_HOST=your.server.ip.address
VPS_USERNAME=deploy
VPS_SSH_KEY=your-private-ssh-key-content

# Optional: External Services
OPENAI_API_KEY=your-openai-api-key
STRIPE_SECRET_KEY=your-stripe-secret-key
EMAIL_SERVICE_API_KEY=your-email-service-key
SLACK_WEBHOOK=your-slack-webhook-url

# === END OF SECRETS ===

EOF

echo -e "\n${BLUE}🐳 Container Registry Options:${NC}"
echo "1. Docker Hub:"
echo "   - DOCKER_USERNAME: your Docker Hub username"
echo "   - DOCKER_PASSWORD: your Docker Hub password"
echo ""
echo "2. GitHub Container Registry (Recommended):"
echo "   - DOCKER_USERNAME: your GitHub username"
echo "   - DOCKER_PASSWORD: GitHub Personal Access Token with packages:write scope"
echo "   - Generate token: https://github.com/settings/tokens"

echo -e "\n${BLUE}🔧 Next Steps:${NC}"
echo "1. Choose your container registry (Docker Hub or GitHub Container Registry)"
echo "2. Add all secrets to your GitHub repository"
echo "3. Update PROD_API_URL and PROD_APP_URL with your actual domains"
echo "4. Set up your deployment server details (VPS_HOST, VPS_USERNAME, VPS_SSH_KEY)"
echo "5. Push code to trigger the CI/CD pipeline"

echo -e "\n${GREEN}💡 Pro Tips:${NC}"
echo "- Use GitHub Container Registry for seamless GitHub Actions integration"
echo "- Keep your secrets secure and never commit them to code"
echo "- Regularly rotate your secrets for better security"
echo "- Test your CI/CD pipeline in a staging environment first"

# Save secrets to a file for easy reference
echo -e "\n${YELLOW}📄 Saving secrets to .env.github-secrets (for reference only)${NC}"
cat > .env.github-secrets << EOF
# GlobeGenius GitHub Secrets - DO NOT COMMIT TO GIT
# Generated on $(date)

# Docker Registry
DOCKER_USERNAME=your-docker-username
DOCKER_PASSWORD=your-docker-password

# Database
DB_USER=globegenius_prod
DB_PASSWORD=$DB_PASSWORD
DB_NAME=globegenius_prod

# Application Security
JWT_SECRET=$JWT_SECRET
JWT_REFRESH_SECRET=$JWT_REFRESH_SECRET
ENCRYPTION_KEY=$ENCRYPTION_KEY

# Production URLs
PROD_API_URL=api.yourdomain.com
PROD_APP_URL=yourdomain.com

# Deployment Server
VPS_HOST=your.server.ip.address
VPS_USERNAME=deploy
VPS_SSH_KEY=your-private-ssh-key-content

# Optional External Services
OPENAI_API_KEY=your-openai-api-key
STRIPE_SECRET_KEY=your-stripe-secret-key
EMAIL_SERVICE_API_KEY=your-email-service-key
SLACK_WEBHOOK=your-slack-webhook-url
EOF

echo -e "${GREEN}✅ Secrets saved to .env.github-secrets${NC}"
echo -e "${RED}⚠️  Remember to add .env.github-secrets to .gitignore${NC}"

# Add to gitignore if not already there
if ! grep -q ".env.github-secrets" .gitignore 2>/dev/null; then
    echo ".env.github-secrets" >> .gitignore
    echo -e "${GREEN}✅ Added .env.github-secrets to .gitignore${NC}"
fi
