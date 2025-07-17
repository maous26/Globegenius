#!/bin/bash

# Comprehensive Frontend-Backend Integration Test
# Tests all API endpoints and service integrations

echo "🔥 GlobeGenius Frontend-Backend Integration Test"
echo "=============================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test counter
PASSED=0
FAILED=0

# Helper function to run tests
run_test() {
    local test_name="$1"
    local command="$2"
    local expected_pattern="$3"
    
    echo -e "\n${BLUE}🧪 Testing: $test_name${NC}"
    
    result=$(eval "$command" 2>&1)
    
    if echo "$result" | grep -q "$expected_pattern"; then
        echo -e "${GREEN}✅ PASSED${NC}"
        ((PASSED++))
    else
        echo -e "${RED}❌ FAILED${NC}"
        echo -e "${RED}Expected: $expected_pattern${NC}"
        echo -e "${RED}Got: $result${NC}"
        ((FAILED++))
    fi
}

# Test 1: Backend Health Check
run_test "Backend Health Check" \
    "curl -s http://localhost:3000/health" \
    "healthy"

# Test 2: Frontend Accessibility
run_test "Frontend Accessibility" \
    "curl -s -o /dev/null -w '%{http_code}' http://localhost:3001" \
    "200"

# Test 3: Admin Login
run_test "Admin Authentication" \
    "curl -s -X POST http://localhost:3000/api/auth/login -H 'Content-Type: application/json' -d '{\"email\":\"admin@globegenius.com\",\"password\":\"admin123\"}'" \
    "success.*true"

# Get access token for protected endpoint tests
ACCESS_TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"admin@globegenius.com","password":"admin123"}' | \
    jq -r '.data.accessToken')

# Test 4: Protected Profile Endpoint
run_test "Protected Profile Access" \
    "curl -s -H 'Authorization: Bearer $ACCESS_TOKEN' http://localhost:3000/api/auth/profile" \
    "success.*true"

# Test 5: User Registration
run_test "User Registration" \
    "curl -s -X POST http://localhost:3000/api/auth/register -H 'Content-Type: application/json' -d '{\"email\":\"testuser$(date +%s)@example.com\",\"password\":\"testpass123\",\"firstName\":\"Test\",\"lastName\":\"User\"}'" \
    "success.*true"

# Test 6: Invalid Login Rejection
run_test "Invalid Login Rejection" \
    "curl -s -X POST http://localhost:3000/api/auth/login -H 'Content-Type: application/json' -d '{\"email\":\"invalid@example.com\",\"password\":\"wrongpass\"}'" \
    "success.*false"

# Test 7: Frontend API Configuration
echo -e "\n${BLUE}🧪 Testing: Frontend API Configuration${NC}"
if curl -s http://localhost:3001 | grep -q "vite"; then
    echo -e "${GREEN}✅ PASSED - Frontend is running with Vite${NC}"
    ((PASSED++))
else
    echo -e "${RED}❌ FAILED - Frontend not accessible${NC}"
    ((FAILED++))
fi

# Test 8: CORS Configuration
run_test "CORS Configuration" \
    "curl -s -H 'Origin: http://localhost:3001' -H 'Access-Control-Request-Method: POST' -H 'Access-Control-Request-Headers: Content-Type' -X OPTIONS http://localhost:3000/api/auth/login" \
    "200"

# Test 9: Rate Limiting Headers
run_test "Rate Limiting Headers" \
    "curl -s -I http://localhost:3000/api/auth/login" \
    "RateLimit"

# Test 10: Frontend Build Success
echo -e "\n${BLUE}🧪 Testing: Frontend Build Compilation${NC}"
if npm run build --prefix frontend --silent > /dev/null 2>&1; then
    echo -e "${GREEN}✅ PASSED - Frontend builds successfully${NC}"
    ((PASSED++))
else
    echo -e "${RED}❌ FAILED - Frontend build failed${NC}"
    ((FAILED++))
fi

# Summary
echo -e "\n${YELLOW}📊 Test Results Summary${NC}"
echo -e "======================="
echo -e "${GREEN}Passed: $PASSED${NC}"
echo -e "${RED}Failed: $FAILED${NC}"
echo -e "Total: $((PASSED + FAILED))"

if [ $FAILED -eq 0 ]; then
    echo -e "\n${GREEN}🎉 All tests passed! The system is fully operational.${NC}"
    echo -e "\n${YELLOW}🚀 Next Steps:${NC}"
    echo -e "1. Open http://localhost:3001 in your browser"
    echo -e "2. Test the login form with:"
    echo -e "   📧 Email: admin@globegenius.com"
    echo -e "   🔑 Password: admin123"
    echo -e "3. Verify the dashboard loads correctly"
    echo -e "4. Check browser console for any errors"
    
    exit 0
else
    echo -e "\n${RED}⚠️  Some tests failed. Please check the errors above.${NC}"
    exit 1
fi
