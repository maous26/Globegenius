const https = require('https');
const http = require('http');

function makeRequest(url, options, data) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    const req = client.request(url, options, (res) => {
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

async function testLogin() {
  console.log('🧪 Testing login endpoint...');
  
  const options = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    }
  };
  
  const loginData = {
    email: 'test@example.com',
    password: 'testpassword123'
  };
  
  try {
    const response = await makeRequest('http://localhost:3000/api/auth/login', options, loginData);
    console.log('✅ Login test result:');
    console.log('  Status:', response.status);
    console.log('  Success:', response.data.success);
    console.log('  Message:', response.data.message);
    
    if (response.data.success) {
      console.log('🎉 The API endpoint is working correctly!');
      console.log('📋 Frontend should now be able to authenticate users');
    }
  } catch (error) {
    console.error('❌ Login test failed:', error.message);
  }
}

testLogin();
