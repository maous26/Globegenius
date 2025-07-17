// Test script to verify frontend API calls
const axios = require('axios');

async function testFrontendAPICalls() {
  console.log('🧪 Testing Frontend API Configuration...\n');
  
  // Test 1: Verify base URL configuration
  const baseURL = 'http://localhost:3000/api';
  console.log(`📋 Base URL: ${baseURL}`);
  
  // Test 2: Test login endpoint
  try {
    const response = await axios.post(`${baseURL}/auth/login`, {
      email: 'test@example.com',
      password: 'testpassword123'
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Login successful!');
    console.log('📋 Response status:', response.status);
    console.log('📋 Response data:', JSON.stringify(response.data, null, 2));
    
    // Test 3: Test protected route with token
    const token = response.data.data.accessToken;
    const profileResponse = await axios.get(`${baseURL}/auth/profile`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('✅ Profile fetch successful!');
    console.log('📋 Profile data:', JSON.stringify(profileResponse.data, null, 2));
    
  } catch (error) {
    console.error('❌ API Call failed:');
    console.error('  Status:', error.response?.status);
    console.error('  Message:', error.response?.data?.message);
    console.error('  URL:', error.config?.url);
    console.error('  Base URL:', error.config?.baseURL);
  }
}

testFrontendAPICalls();
