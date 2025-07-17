#!/bin/bash

# Test script to verify frontend authentication is working correctly

echo "🔐 Testing GlobeGenius Frontend Authentication Flow..."
echo "==============================================="

# Test 1: Verify backend is running
echo "1. Checking backend status..."
if curl -s http://localhost:3000/api/auth/login > /dev/null 2>&1; then
    echo "✅ Backend is running and accessible"
else
    echo "❌ Backend is not running or not accessible"
    exit 1
fi

# Test 2: Verify frontend is running
echo "2. Checking frontend status..."
if curl -s http://localhost:3001 > /dev/null 2>&1; then
    echo "✅ Frontend is running and accessible"
else
    echo "❌ Frontend is not running or not accessible"
    exit 1
fi

# Test 3: Test API endpoint directly
echo "3. Testing API endpoint directly..."
API_RESPONSE=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"testpassword123"}')

if echo "$API_RESPONSE" | grep -q '"success":true'; then
    echo "✅ API endpoint is working correctly"
else
    echo "❌ API endpoint is not working correctly"
    echo "Response: $API_RESPONSE"
    exit 1
fi

# Test 4: Test frontend test page
echo "4. Testing frontend test page..."
if curl -s http://localhost:3001/test-login.html | grep -q "GlobeGenius Login Test"; then
    echo "✅ Frontend test page is accessible"
else
    echo "❌ Frontend test page is not accessible"
    exit 1
fi

# Test 5: Check environment configuration
echo "5. Checking environment configuration..."
if [ -f "/Users/moussa/globegenius/frontend/.env" ]; then
    ENV_API_URL=$(grep "VITE_API_URL" /Users/moussa/globegenius/frontend/.env | cut -d'=' -f2)
    if [ "$ENV_API_URL" = "http://localhost:3000/api" ]; then
        echo "✅ Environment variables configured correctly"
    else
        echo "❌ Environment variables not configured correctly"
        echo "Expected: http://localhost:3000/api"
        echo "Found: $ENV_API_URL"
        exit 1
    fi
else
    echo "❌ Environment file not found"
    exit 1
fi

echo ""
echo "🎉 All tests passed! Authentication system is ready."
echo ""
echo "📋 Test Results Summary:"
echo "  • Backend API: ✅ Running on http://localhost:3000"
echo "  • Frontend App: ✅ Running on http://localhost:3001"
echo "  • API Endpoint: ✅ /api/auth/login working correctly"
echo "  • Test Page: ✅ Available at http://localhost:3001/test-login.html"
echo "  • Environment: ✅ Configured correctly"
echo ""
echo "🔧 Next Steps:"
echo "  1. Open http://localhost:3001/login in your browser"
echo "  2. Try logging in with: test@example.com / testpassword123"
echo "  3. Check browser console for API call logs"
echo "  4. Verify login redirects to dashboard"
echo ""
echo "🐛 If you encounter 404 errors, check:"
echo "  • Browser Network tab for actual API calls"
echo "  • Console logs for debugging information"
echo "  • API calls should go to: http://localhost:3000/api/auth/login"
