#!/bin/bash

# GlobeGenius CI/CD Docker Setup Script

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_NAME="globegenius"
REGISTRY_URL="docker.io"  # Change this to your preferred registry
REGISTRY_USERNAME=""      # Will be prompted
SERVICES=("backend" "frontend" "ml-service")

echo -e "${BLUE}🚀 GlobeGenius CI/CD Docker Setup${NC}"
echo "=================================="

# Function to prompt for registry details
setup_registry() {
    echo -e "\n${YELLOW}📦 Container Registry Setup${NC}"
    echo "Available options:"
    echo "1. Docker Hub (docker.io)"
    echo "2. GitHub Container Registry (ghcr.io)"
    echo "3. Custom registry"
    
    read -p "Choose registry (1-3): " registry_choice
    
    case $registry_choice in
        1)
            REGISTRY_URL="docker.io"
            read -p "Enter Docker Hub username: " REGISTRY_USERNAME
            ;;
        2)
            REGISTRY_URL="ghcr.io"
            read -p "Enter GitHub username: " REGISTRY_USERNAME
            ;;
        3)
            read -p "Enter custom registry URL: " REGISTRY_URL
            read -p "Enter registry username: " REGISTRY_USERNAME
            ;;
        *)
            echo -e "${RED}Invalid choice. Using Docker Hub.${NC}"
            REGISTRY_URL="docker.io"
            read -p "Enter Docker Hub username: " REGISTRY_USERNAME
            ;;
    esac
}

# Function to login to registry
login_registry() {
    echo -e "\n${YELLOW}🔐 Logging into registry...${NC}"
    
    if [[ $REGISTRY_URL == "ghcr.io" ]]; then
        echo "For GitHub Container Registry, use your Personal Access Token as password"
        echo "Generate token at: https://github.com/settings/tokens"
        echo "Required scopes: write:packages, read:packages"
    fi
    
    docker login $REGISTRY_URL -u $REGISTRY_USERNAME
}

# Function to build images
build_images() {
    echo -e "\n${YELLOW}🏗️ Building Docker images...${NC}"
    
    # Build development images
    echo "Building development images..."
    docker compose -f docker-compose.dev.yml build
    
    # Build production images
    echo "Building production images..."
    docker compose -f docker-compose.prod.yml build
}

# Function to tag and push images
tag_and_push() {
    echo -e "\n${YELLOW}🏷️ Tagging and pushing images...${NC}"
    
    # Get current git commit hash for versioning
    GIT_HASH=$(git rev-parse --short HEAD 2>/dev/null || echo "latest")
    
    for service in "${SERVICES[@]}"; do
        echo "Processing $service..."
        
        # Tag with latest
        docker tag ${PROJECT_NAME}-${service}:latest ${REGISTRY_URL}/${REGISTRY_USERNAME}/${PROJECT_NAME}-${service}:latest
        
        # Tag with git hash
        docker tag ${PROJECT_NAME}-${service}:latest ${REGISTRY_URL}/${REGISTRY_USERNAME}/${PROJECT_NAME}-${service}:${GIT_HASH}
        
        # Push both tags
        docker push ${REGISTRY_URL}/${REGISTRY_USERNAME}/${PROJECT_NAME}-${service}:latest
        docker push ${REGISTRY_URL}/${REGISTRY_USERNAME}/${PROJECT_NAME}-${service}:${GIT_HASH}
        
        echo -e "${GREEN}✅ Pushed ${service}${NC}"
    done
}

# Function to generate GitHub secrets template
generate_secrets_template() {
    echo -e "\n${YELLOW}🔑 Generating GitHub secrets template...${NC}"
    
    cat > github-secrets.txt << EOF
# GitHub Repository Secrets for GlobeGenius CI/CD
# Go to: https://github.com/YOUR_USERNAME/globegenius/settings/secrets/actions

# Docker Registry
DOCKER_REGISTRY_URL=${REGISTRY_URL}
DOCKER_REGISTRY_USERNAME=${REGISTRY_USERNAME}
DOCKER_REGISTRY_PASSWORD=your-registry-password-or-token

# Database
DB_USER=globegenius_prod
DB_PASSWORD=your-secure-db-password
DB_NAME=globegenius_prod

# Application Secrets
JWT_SECRET=your-jwt-secret-key-min-32-chars
JWT_REFRESH_SECRET=your-jwt-refresh-secret-min-32-chars
ENCRYPTION_KEY=your-32-character-encryption-key!!

# Deployment
DEPLOY_HOST=your-production-server-ip
DEPLOY_USER=deploy
DEPLOY_SSH_KEY=your-private-ssh-key

# External Services
OPENAI_API_KEY=your-openai-api-key
STRIPE_SECRET_KEY=your-stripe-secret-key
EMAIL_SERVICE_API_KEY=your-email-service-key

# Optional: Custom registry authentication
# REGISTRY_USERNAME=${REGISTRY_USERNAME}
# REGISTRY_PASSWORD=your-registry-password
EOF

    echo -e "${GREEN}✅ GitHub secrets template created: github-secrets.txt${NC}"
}

# Function to create deployment scripts
create_deployment_scripts() {
    echo -e "\n${YELLOW}📜 Creating deployment scripts...${NC}"
    
    # Create staging deployment script
    cat > deploy-staging.sh << 'EOF'
#!/bin/bash
# GlobeGenius Staging Deployment Script

set -e

echo "🚀 Deploying to staging..."

# Pull latest images
docker compose -f docker-compose.dev.yml pull

# Stop existing services
docker compose -f docker-compose.dev.yml down

# Start services
docker compose -f docker-compose.dev.yml up -d

# Wait for services to be ready
sleep 30

# Run health checks
docker compose -f docker-compose.dev.yml exec -T backend curl -f http://localhost:3000/health || exit 1
docker compose -f docker-compose.dev.yml exec -T ml-service curl -f http://localhost:8000/health || exit 1

echo "✅ Staging deployment completed successfully"
EOF

    # Create production deployment script
    cat > deploy-production.sh << 'EOF'
#!/bin/bash
# GlobeGenius Production Deployment Script

set -e

echo "🚀 Deploying to production..."

# Backup database
docker compose -f docker-compose.prod.yml exec postgres pg_dump -U $DB_USER $DB_NAME > backup_$(date +%Y%m%d_%H%M%S).sql

# Pull latest images
docker compose -f docker-compose.prod.yml pull

# Rolling update
docker compose -f docker-compose.prod.yml up -d --no-deps backend
docker compose -f docker-compose.prod.yml up -d --no-deps frontend
docker compose -f docker-compose.prod.yml up -d --no-deps ml-service

# Wait for services to be ready
sleep 60

# Run health checks
docker compose -f docker-compose.prod.yml exec -T backend curl -f http://localhost:3000/health || exit 1
docker compose -f docker-compose.prod.yml exec -T ml-service curl -f http://localhost:8000/health || exit 1

echo "✅ Production deployment completed successfully"
EOF

    chmod +x deploy-staging.sh
    chmod +x deploy-production.sh
    
    echo -e "${GREEN}✅ Deployment scripts created${NC}"
}

# Function to display next steps
display_next_steps() {
    echo -e "\n${GREEN}🎉 Setup Complete!${NC}"
    echo "=================="
    echo
    echo "Next steps:"
    echo "1. Add the secrets from 'github-secrets.txt' to your GitHub repository"
    echo "2. Push your code to trigger the CI/CD pipeline"
    echo "3. Monitor the GitHub Actions workflow"
    echo "4. Use deploy-staging.sh and deploy-production.sh for manual deployments"
    echo
    echo "GitHub repository secrets: https://github.com/YOUR_USERNAME/globegenius/settings/secrets/actions"
    echo
    echo "Your images are now available at:"
    for service in "${SERVICES[@]}"; do
        echo "  - ${REGISTRY_URL}/${REGISTRY_USERNAME}/${PROJECT_NAME}-${service}:latest"
    done
}

# Main execution
main() {
    echo -e "\n${BLUE}Starting CI/CD setup...${NC}"
    
    # Check if we're in the right directory
    if [[ ! -f "docker-compose.dev.yml" ]]; then
        echo -e "${RED}Error: Please run this script from the globegenius project root${NC}"
        exit 1
    fi
    
    # Setup registry
    setup_registry
    
    # Login to registry
    login_registry
    
    # Build images
    build_images
    
    # Tag and push images
    tag_and_push
    
    # Generate secrets template
    generate_secrets_template
    
    # Create deployment scripts
    create_deployment_scripts
    
    # Display next steps
    display_next_steps
}

# Run main function
main "$@"
