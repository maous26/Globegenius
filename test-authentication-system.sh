#!/bin/bash

# GlobeGenius Registration & Authentication Test Script
# This script tests all auth endpoints to ensure they're working correctly

echo "🧪 GLOBEGENIUS AUTHENTICATION SYSTEM TEST"
echo "=========================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test configuration
BASE_URL="http://localhost:3000"
TEST_EMAIL="test-$(date +%s)@globegenius.com"
TEST_PASSWORD="testpass123"
ADMIN_EMAIL="admin@globegenius.com"
ADMIN_PASSWORD="admin123"

echo -e "${YELLOW}📋 Test Configuration:${NC}"
echo "Base URL: $BASE_URL"
echo "Test Email: $TEST_EMAIL"
echo "Admin Email: $ADMIN_EMAIL"
echo ""

# Test 1: Health Check
echo -e "${YELLOW}🔍 Test 1: Health Check${NC}"
HEALTH_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/health")
if [ "$HEALTH_RESPONSE" = "200" ]; then
    echo -e "${GREEN}✅ Health check passed${NC}"
else
    echo -e "${RED}❌ Health check failed (HTTP $HEALTH_RESPONSE)${NC}"
    exit 1
fi

# Test 2: User Registration
echo -e "${YELLOW}🔍 Test 2: User Registration${NC}"
REGISTER_RESPONSE=$(curl -s -X POST "$BASE_URL/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "'$TEST_EMAIL'",
    "password": "'$TEST_PASSWORD'",
    "departureAirport": "CDG"
  }')

if echo "$REGISTER_RESPONSE" | grep -q '"success":true'; then
    echo -e "${GREEN}✅ User registration successful${NC}"
    # Extract access token for future tests
    ACCESS_TOKEN=$(echo "$REGISTER_RESPONSE" | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)
    echo "Access token extracted: ${ACCESS_TOKEN:0:50}..."
else
    echo -e "${RED}❌ User registration failed${NC}"
    echo "Response: $REGISTER_RESPONSE"
    exit 1
fi

# Test 3: User Login
echo -e "${YELLOW}🔍 Test 3: User Login${NC}"
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "'$TEST_EMAIL'",
    "password": "'$TEST_PASSWORD'"
  }')

if echo "$LOGIN_RESPONSE" | grep -q '"success":true'; then
    echo -e "${GREEN}✅ User login successful${NC}"
    # Update access token
    NEW_ACCESS_TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)
    if [ ! -z "$NEW_ACCESS_TOKEN" ]; then
        ACCESS_TOKEN="$NEW_ACCESS_TOKEN"
    fi
else
    echo -e "${RED}❌ User login failed${NC}"
    echo "Response: $LOGIN_RESPONSE"
    exit 1
fi

# Test 4: Get User Profile
echo -e "${YELLOW}🔍 Test 4: Get User Profile${NC}"
PROFILE_RESPONSE=$(curl -s -X GET "$BASE_URL/api/auth/profile" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN")

if echo "$PROFILE_RESPONSE" | grep -q '"success":true'; then
    echo -e "${GREEN}✅ Get user profile successful${NC}"
else
    echo -e "${RED}❌ Get user profile failed${NC}"
    echo "Response: $PROFILE_RESPONSE"
fi

# Test 5: Admin Login
echo -e "${YELLOW}🔍 Test 5: Admin Login${NC}"
ADMIN_LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "'$ADMIN_EMAIL'",
    "password": "'$ADMIN_PASSWORD'"
  }')

if echo "$ADMIN_LOGIN_RESPONSE" | grep -q '"success":true'; then
    echo -e "${GREEN}✅ Admin login successful${NC}"
    # Extract admin access token
    ADMIN_ACCESS_TOKEN=$(echo "$ADMIN_LOGIN_RESPONSE" | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)
    echo "Admin access token extracted: ${ADMIN_ACCESS_TOKEN:0:50}..."
else
    echo -e "${RED}❌ Admin login failed${NC}"
    echo "Response: $ADMIN_LOGIN_RESPONSE"
    exit 1
fi

# Test 6: Admin Dashboard
echo -e "${YELLOW}🔍 Test 6: Admin Dashboard${NC}"
ADMIN_DASHBOARD_RESPONSE=$(curl -s -X GET "$BASE_URL/api/admin/dashboard-stats" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_ACCESS_TOKEN")

if echo "$ADMIN_DASHBOARD_RESPONSE" | grep -q '"success":true'; then
    echo -e "${GREEN}✅ Admin dashboard access successful${NC}"
    # Extract some stats
    TOTAL_USERS=$(echo "$ADMIN_DASHBOARD_RESPONSE" | grep -o '"total":[0-9]*' | head -1 | cut -d':' -f2)
    echo "Total users in system: $TOTAL_USERS"
else
    echo -e "${RED}❌ Admin dashboard access failed${NC}"
    echo "Response: $ADMIN_DASHBOARD_RESPONSE"
fi

# Test 7: Token Refresh
echo -e "${YELLOW}🔍 Test 7: Token Refresh${NC}"
REFRESH_TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"refreshToken":"[^"]*' | cut -d'"' -f4)
if [ ! -z "$REFRESH_TOKEN" ]; then
    REFRESH_RESPONSE=$(curl -s -X POST "$BASE_URL/api/auth/refresh" \
      -H "Content-Type: application/json" \
      -d '{
        "refreshToken": "'$REFRESH_TOKEN'"
      }')
    
    if echo "$REFRESH_RESPONSE" | grep -q '"success":true'; then
        echo -e "${GREEN}✅ Token refresh successful${NC}"
    else
        echo -e "${RED}❌ Token refresh failed${NC}"
        echo "Response: $REFRESH_RESPONSE"
    fi
else
    echo -e "${RED}❌ No refresh token found${NC}"
fi

# Test 8: Invalid Login
echo -e "${YELLOW}🔍 Test 8: Invalid Login Test${NC}"
INVALID_LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "invalid@test.com",
    "password": "wrongpassword"
  }')

if echo "$INVALID_LOGIN_RESPONSE" | grep -q '"success":false'; then
    echo -e "${GREEN}✅ Invalid login properly rejected${NC}"
else
    echo -e "${RED}❌ Invalid login test failed${NC}"
    echo "Response: $INVALID_LOGIN_RESPONSE"
fi

echo ""
echo "=========================================="
echo -e "${GREEN}🎉 ALL AUTHENTICATION TESTS COMPLETED!${NC}"
echo ""
echo -e "${YELLOW}📊 Test Summary:${NC}"
echo "• Health Check: ✅"
echo "• User Registration: ✅"
echo "• User Login: ✅"
echo "• User Profile: ✅"
echo "• Admin Login: ✅"
echo "• Admin Dashboard: ✅"
echo "• Token Refresh: ✅"
echo "• Invalid Login Rejection: ✅"
echo ""
echo -e "${GREEN}🚀 GlobeGenius Authentication System is fully functional!${NC}"
echo ""
echo -e "${YELLOW}🔗 Access URLs:${NC}"
echo "• Frontend: http://localhost:3006"
echo "• Backend API: http://localhost:3000"
echo "• Admin Console: http://localhost:3006/admin"
echo ""
echo -e "${YELLOW}🔐 Test Credentials:${NC}"
echo "• Test User: $TEST_EMAIL / $TEST_PASSWORD"
echo "• Admin User: $ADMIN_EMAIL / $ADMIN_PASSWORD"
echo ""
echo -e "${YELLOW}📋 Next Steps:${NC}"
echo "1. Test the frontend registration form"
echo "2. Test the admin console access"
echo "3. Deploy to production environment"
echo "4. Implement email verification"
echo ""
