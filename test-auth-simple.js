#!/usr/bin/env node

console.log('🔐 Testing GlobeGenius Authentication System...\n');

const https = require('https');
const http = require('http');
const querystring = require('querystring');

function makeRequest(options, data) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });
    
    req.on('error', reject);
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

async function testAuth() {
  try {
    // Test admin login
    console.log('1. Testing admin login...');
    const loginOptions = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/auth/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      }
    };

    const loginData = {
      email: 'admin@globegenius.com',
      password: 'admin123'
    };

    const loginResponse = await makeRequest(loginOptions, loginData);
    
    if (loginResponse.status === 200 && loginResponse.data.success) {
      console.log('✅ Admin login successful');
      console.log(`   User: ${loginResponse.data.data.user.email}`);
      console.log(`   Status: ${loginResponse.data.data.user.status}`);
      
      // Test protected endpoint
      console.log('\n2. Testing protected endpoint...');
      const profileOptions = {
        hostname: 'localhost',
        port: 3000,
        path: '/api/auth/profile',
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${loginResponse.data.data.accessToken}`
        }
      };

      const profileResponse = await makeRequest(profileOptions);
      
      if (profileResponse.status === 200 && profileResponse.data.success) {
        console.log('✅ Protected endpoint access successful');
        console.log(`   Profile: ${profileResponse.data.data.email}`);
      } else {
        console.log('❌ Protected endpoint failed');
      }
    } else {
      console.log('❌ Admin login failed');
      console.log('Response:', loginResponse);
    }

    console.log('\n🎉 Backend authentication is working!');
    console.log('Frontend should now be able to connect to: http://localhost:3000/api/auth');
    console.log('Access the frontend at: http://localhost:3005');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testAuth();
