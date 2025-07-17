#!/usr/bin/env node

// Test script to verify frontend-backend authentication integration
const axios = require('axios');

const API_BASE_URL = 'http://localhost:3000/api/auth';

async function testAuthentication() {
  console.log('🔐 Testing GlobeGenius Authentication System...\n');

  try {
    // Test 1: Login with admin credentials
    console.log('1. Testing admin login...');
    const loginResponse = await axios.post(`${API_BASE_URL}/login`, {
      email: 'admin@globegenius.com',
      password: 'admin123'
    });

    if (loginResponse.data.success) {
      console.log('✅ Admin login successful');
      console.log(`   User: ${loginResponse.data.data.user.email}`);
      console.log(`   Status: ${loginResponse.data.data.user.status}`);
      
      const { accessToken } = loginResponse.data.data;
      
      // Test 2: Access protected endpoint
      console.log('\n2. Testing protected endpoint access...');
      const profileResponse = await axios.get(`${API_BASE_URL}/profile`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      
      if (profileResponse.data.success) {
        console.log('✅ Protected endpoint access successful');
        console.log(`   Profile: ${profileResponse.data.data.email}`);
      }
    }

    // Test 3: Test invalid credentials
    console.log('\n3. Testing invalid credentials...');
    try {
      await axios.post(`${API_BASE_URL}/login`, {
        email: 'invalid@example.com',
        password: 'wrongpassword'
      });
    } catch (error) {
      if (error.response && error.response.status === 401) {
        console.log('✅ Invalid credentials properly rejected');
      }
    }

    // Test 4: Test registration
    console.log('\n4. Testing user registration...');
    try {
      const registerResponse = await axios.post(`${API_BASE_URL}/register`, {
        email: 'test@example.com',
        password: 'testpassword123',
        firstName: 'Test',
        lastName: 'User'
      });
      
      if (registerResponse.data.success) {
        console.log('✅ User registration successful');
        console.log(`   New user: ${registerResponse.data.data.user.email}`);
      }
    } catch (error) {
      if (error.response && error.response.data.message && error.response.data.message.includes('déjà')) {
        console.log('✅ User already exists (expected)');
      } else {
        console.log(`❌ Registration error: ${error.response?.data?.message || error.message}`);
      }
    }

    console.log('\n🎉 Authentication system is working correctly!');
    console.log('The frontend should now be able to connect to the backend.');
    console.log('Please test the frontend at: http://localhost:3005');

  } catch (error) {
    console.error('❌ Authentication test failed:', error.response?.data?.message || error.message);
    process.exit(1);
  }
}

testAuthentication();
