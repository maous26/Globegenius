#!/bin/bash

# GlobeGenius Admin Password Generator
# This script generates a secure admin password and updates the environment files

echo "🔐 GlobeGenius Admin Password Generator"
echo "======================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Generate secure password
generate_password() {
    # Generate a 16-character password with mixed case, numbers, and symbols
    password=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-16)
    echo $password
}

# Update environment file
update_env_file() {
    local env_file="$1"
    local password="$2"
    
    if [ -f "$env_file" ]; then
        # Update existing password
        sed -i.bak "s/VITE_ADMIN_PASSWORD=.*/VITE_ADMIN_PASSWORD=\"$password\"/" "$env_file"
        echo -e "${GREEN}✅ Updated $env_file${NC}"
    else
        # Create new env file
        cat > "$env_file" << EOF
# GlobeGenius Admin Configuration
VITE_ADMIN_PASSWORD="$password"
VITE_ADMIN_EMAIL="admin@globegenius.com"
VITE_API_URL="http://localhost:3000"
VITE_FRONTEND_URL="http://localhost:3004"
EOF
        echo -e "${GREEN}✅ Created $env_file${NC}"
    fi
}

# Main execution
main() {
    echo -e "${BLUE}Generating secure admin password...${NC}"
    
    # Generate password
    new_password=$(generate_password)
    
    # Update frontend environment
    frontend_env="/Users/moussa/globegenius/frontend/.env.local"
    update_env_file "$frontend_env" "$new_password"
    
    echo ""
    echo -e "${YELLOW}🔑 New Admin Password Generated:${NC}"
    echo -e "${GREEN}$new_password${NC}"
    echo ""
    echo -e "${YELLOW}📋 Access Instructions:${NC}"
    echo "1. Go to: http://localhost:3004/admin"
    echo "2. Use the generated password above"
    echo "3. Store this password securely"
    echo ""
    echo -e "${RED}⚠️  Security Notes:${NC}"
    echo "• This password is stored in .env.local"
    echo "• Never commit .env.local to version control"
    echo "• Change this password regularly"
    echo "• Use a password manager in production"
    echo ""
    echo -e "${BLUE}🔄 To regenerate, run this script again${NC}"
}

# Run main function
main
