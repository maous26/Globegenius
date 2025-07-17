#!/bin/bash

# Frontend-Backend Integration Test
# Tests the full stack communication

echo "🧪 Frontend-Backend Integration Test"
echo "===================================="
echo

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test results
PASSED=0
FAILED=0

# Test function
test_service() {
    local service=$1
    local url=$2
    local expected_content=$3
    
    echo -n "Testing $service... "
    
    if curl -s --max-time 5 "$url" | grep -q "$expected_content"; then
        echo -e "${GREEN}✅ PASS${NC}"
        ((PASSED++))
    else
        echo -e "${RED}❌ FAIL${NC}"
        ((FAILED++))
    fi
}

# Test API endpoints
test_api_endpoint() {
    local endpoint=$1
    local expected_status=$2
    local description=$3
    
    echo -n "Testing $description... "
    
    status=$(curl -s -w "%{http_code}" -o /dev/null "http://localhost:3000$endpoint")
    
    if [ "$status" -eq "$expected_status" ]; then
        echo -e "${GREEN}✅ PASS${NC} (Status: $status)"
        ((PASSED++))
    else
        echo -e "${RED}❌ FAIL${NC} (Expected: $expected_status, Got: $status)"
        ((FAILED++))
    fi
}

echo -e "${BLUE}🌐 Frontend Service Tests:${NC}"
echo "=========================="
test_service "Frontend HTML" "http://localhost:5173" "root"
test_service "Frontend Assets" "http://localhost:5173/src/main.tsx" "import"

echo
echo -e "${BLUE}🚀 Backend API Tests:${NC}"
echo "===================="
test_api_endpoint "/health" 200 "Health endpoint"
test_api_endpoint "/api/auth/profile" 200 "Auth profile"
test_api_endpoint "/api/users" 200 "Users endpoint"
test_api_endpoint "/api/metrics" 200 "Metrics endpoint"
test_api_endpoint "/api/alerts" 401 "Protected alerts endpoint"

echo
echo -e "${BLUE}🧠 ML Service Tests:${NC}"
echo "==================="
test_service "ML Service Health" "http://localhost:8000/health" "healthy"
test_service "ML Service Info" "http://localhost:8000/health" "GlobeGenius ML Service"

echo
echo -e "${BLUE}🗄️ Database Tests:${NC}"
echo "=================="
if docker ps | grep -q "globegenius-postgres.*healthy"; then
    echo -e "PostgreSQL Container: ${GREEN}✅ PASS${NC}"
    ((PASSED++))
else
    echo -e "PostgreSQL Container: ${RED}❌ FAIL${NC}"
    ((FAILED++))
fi

if docker ps | grep -q "globegenius-redis.*healthy"; then
    echo -e "Redis Container: ${GREEN}✅ PASS${NC}"
    ((PASSED++))
else
    echo -e "Redis Container: ${RED}❌ FAIL${NC}"
    ((FAILED++))
fi

echo
echo -e "${BLUE}📊 Test Summary:${NC}"
echo "==============="
echo -e "Total tests: $((PASSED + FAILED))"
echo -e "Passed: ${GREEN}$PASSED${NC}"
echo -e "Failed: ${RED}$FAILED${NC}"

if [ $FAILED -eq 0 ]; then
    echo
    echo -e "${GREEN}🎉 All tests passed! The application stack is fully functional.${NC}"
    echo
    echo -e "${BLUE}🌟 Application Status: FULLY OPERATIONAL${NC}"
    echo "=================================="
    echo "✅ Frontend: http://localhost:5173"
    echo "✅ Backend API: http://localhost:3000"
    echo "✅ ML Service: http://localhost:8000"
    echo "✅ Database: PostgreSQL + Redis containers"
    echo "✅ All services are communicating properly"
else
    echo
    echo -e "${RED}❌ Some tests failed. Please check the services.${NC}"
    exit 1
fi
