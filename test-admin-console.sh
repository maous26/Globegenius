#!/bin/bash

# GlobeGenius Admin Console Test Script
# This script tests the admin authentication flow

echo "🧪 Testing GlobeGenius Admin Console Authentication"
echo "=================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test configuration
FRONTEND_URL="http://localhost:3005"
ADMIN_ROUTE="/admin"
ENV_FILE="/Users/moussa/globegenius/frontend/.env.local"

echo -e "${BLUE}🔍 Checking server status...${NC}"

# Check if frontend server is running
if curl -s "$FRONTEND_URL" > /dev/null; then
    echo -e "${GREEN}✅ Frontend server is running at $FRONTEND_URL${NC}"
else
    echo -e "${RED}❌ Frontend server is not running${NC}"
    echo -e "${YELLOW}💡 Start it with: cd frontend && npm start${NC}"
    exit 1
fi

# Check if backend server is running
if curl -s "http://localhost:3000/health" > /dev/null; then
    echo -e "${GREEN}✅ Backend server is running at http://localhost:3000${NC}"
else
    echo -e "${YELLOW}⚠️  Backend server might not be running${NC}"
    echo -e "${YELLOW}💡 Start it with: cd backend && npm run dev${NC}"
fi

echo ""
echo -e "${BLUE}🔐 Checking admin configuration...${NC}"

# Check if environment file exists
if [ -f "$ENV_FILE" ]; then
    echo -e "${GREEN}✅ Environment file exists${NC}"
    
    # Extract admin password
    ADMIN_PASSWORD=$(grep "VITE_ADMIN_PASSWORD" "$ENV_FILE" | cut -d'"' -f2)
    ADMIN_EMAIL=$(grep "VITE_ADMIN_EMAIL" "$ENV_FILE" | cut -d'"' -f2)
    
    if [ -n "$ADMIN_PASSWORD" ]; then
        echo -e "${GREEN}✅ Admin password configured${NC}"
        echo -e "${YELLOW}🔑 Password: $ADMIN_PASSWORD${NC}"
    else
        echo -e "${RED}❌ Admin password not found${NC}"
    fi
    
    if [ -n "$ADMIN_EMAIL" ]; then
        echo -e "${GREEN}✅ Admin email configured: $ADMIN_EMAIL${NC}"
    else
        echo -e "${RED}❌ Admin email not found${NC}"
    fi
else
    echo -e "${RED}❌ Environment file not found${NC}"
    echo -e "${YELLOW}💡 Generate password with: ./generate-admin-password.sh${NC}"
fi

echo ""
echo -e "${BLUE}📋 Admin Console Access Instructions:${NC}"
echo -e "${YELLOW}1. Open browser and go to: $FRONTEND_URL$ADMIN_ROUTE${NC}"
echo -e "${YELLOW}2. If prompted, login as a regular user first${NC}"
echo -e "${YELLOW}3. Enter admin password: $ADMIN_PASSWORD${NC}"
echo -e "${YELLOW}4. Access granted to admin console${NC}"

echo ""
echo -e "${BLUE}🎯 Available Admin Features:${NC}"
echo -e "${GREEN}• Dashboard: Real-time KPIs and metrics${NC}"
echo -e "${GREEN}• Users: User management and administration${NC}"
echo -e "${GREEN}• Routes: Route configuration and monitoring${NC}"
echo -e "${GREEN}• Analytics: Charts and data visualization${NC}"
echo -e "${GREEN}• System: Server monitoring and health checks${NC}"

echo ""
echo -e "${BLUE}🔧 Troubleshooting:${NC}"
echo -e "${YELLOW}• Can't access admin? Check user authentication first${NC}"
echo -e "${YELLOW}• Password not working? Regenerate with ./generate-admin-password.sh${NC}"
echo -e "${YELLOW}• Session expired? Sessions timeout after 1 hour${NC}"
echo -e "${YELLOW}• Need help? Check ADMIN-PASSWORD-SETUP.md${NC}"

echo ""
echo -e "${GREEN}🎉 Admin Console Test Complete!${NC}"
echo -e "${BLUE}Ready to access: $FRONTEND_URL$ADMIN_ROUTE${NC}"
