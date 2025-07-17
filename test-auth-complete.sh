#!/bin/bash

# GlobeGenius Authentication System Test Script
# This script tests the authentication system end-to-end

echo "🔐 GlobeGenius Authentication System Test"
echo "=========================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test 1: Check if backend is running
echo -e "\n${YELLOW}1. Testing Backend Health...${NC}"
if curl -s http://localhost:3000/health > /dev/null; then
    echo -e "${GREEN}✅ Backend is running on port 3000${NC}"
else
    echo -e "${RED}❌ Backend is not running on port 3000${NC}"
    exit 1
fi

# Test 2: Check if frontend is running
echo -e "\n${YELLOW}2. Testing Frontend...${NC}"
if curl -s http://localhost:3001 > /dev/null; then
    echo -e "${GREEN}✅ Frontend is running on port 3001${NC}"
else
    echo -e "${RED}❌ Frontend is not running on port 3001${NC}"
    exit 1
fi

# Test 3: Test authentication endpoints
echo -e "\n${YELLOW}3. Testing Authentication Endpoints...${NC}"

# Test admin login
echo -e "\n   Testing admin login..."
ADMIN_LOGIN_RESPONSE=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@globegenius.com","password":"admin123"}')

if echo "$ADMIN_LOGIN_RESPONSE" | jq -e '.success' > /dev/null 2>&1; then
    echo -e "${GREEN}   ✅ Admin login successful${NC}"
    ACCESS_TOKEN=$(echo "$ADMIN_LOGIN_RESPONSE" | jq -r '.data.accessToken')
    echo -e "   📧 Admin email: admin@globegenius.com"
    echo -e "   🔑 Password: admin123"
else
    echo -e "${RED}   ❌ Admin login failed${NC}"
    echo -e "   Response: $ADMIN_LOGIN_RESPONSE"
fi

# Test protected endpoint with token
if [ ! -z "$ACCESS_TOKEN" ] && [ "$ACCESS_TOKEN" != "null" ]; then
    echo -e "\n   Testing protected endpoint..."
    PROFILE_RESPONSE=$(curl -s -X GET http://localhost:3000/api/auth/profile \
      -H "Authorization: Bearer $ACCESS_TOKEN")
    
    if echo "$PROFILE_RESPONSE" | jq -e '.success' > /dev/null 2>&1; then
        echo -e "${GREEN}   ✅ Protected endpoint access successful${NC}"
        USER_EMAIL=$(echo "$PROFILE_RESPONSE" | jq -r '.data.email')
        echo -e "   👤 Profile email: $USER_EMAIL"
    else
        echo -e "${RED}   ❌ Protected endpoint access failed${NC}"
    fi
fi

# Test 4: Test invalid credentials
echo -e "\n   Testing invalid credentials..."
INVALID_LOGIN_RESPONSE=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"invalid@example.com","password":"wrongpassword"}')

if echo "$INVALID_LOGIN_RESPONSE" | jq -e '.success == false' > /dev/null 2>&1; then
    echo -e "${GREEN}   ✅ Invalid credentials properly rejected${NC}"
else
    echo -e "${RED}   ❌ Invalid credentials test failed${NC}"
fi

echo -e "\n${YELLOW}4. System Status Summary${NC}"
echo -e "=========================="
echo -e "Backend URL: http://localhost:3000"
echo -e "Frontend URL: http://localhost:3001"
echo -e "API Base URL: http://localhost:3000/api/auth"
echo -e ""
echo -e "Admin Credentials:"
echo -e "  📧 Email: admin@globegenius.com"
echo -e "  🔑 Password: admin123"
echo -e ""
echo -e "${GREEN}🎉 Authentication system is operational!${NC}"
echo -e ""
echo -e "${YELLOW}Next Steps:${NC}"
echo -e "1. Open your browser and go to: http://localhost:3001"
echo -e "2. Try logging in with the admin credentials above"
echo -e "3. Check the browser console (F12) for API debug logs"
echo -e "4. If you see 'POST http://localhost:3000/login 404', the frontend is not using the correct API base URL"
echo -e ""
echo -e "${YELLOW}Troubleshooting:${NC}"
echo -e "• If you get 404 errors, check that the frontend .env file has:"
echo -e "  VITE_API_URL=http://localhost:3000/api/auth"
echo -e "• If you get CORS errors, make sure both services are running"
echo -e "• Check browser console for debugging information"
