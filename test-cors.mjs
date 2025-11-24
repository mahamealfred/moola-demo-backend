// CORS Test with Node.js fetch
import fetch from 'node-fetch';

async function testCORS() {
  console.log('🔍 Testing CORS Configuration...\n');
  
  try {
    // Test 1: Health endpoint
    console.log('1. Testing Health Endpoint:');
    const healthResponse = await fetch('http://localhost:4000/health', {
      method: 'GET',
      headers: {
        'Origin': 'http://localhost:4005'
      }
    });
    
    console.log(`   Status: ${healthResponse.status}`);
    console.log(`   CORS Origin: ${healthResponse.headers.get('access-control-allow-origin')}`);
    console.log(`   Credentials: ${healthResponse.headers.get('access-control-allow-credentials')}`);
    
    // Test 2: OPTIONS preflight
    console.log('\n2. Testing Preflight Request:');
    const preflightResponse = await fetch('http://localhost:4000/v1/agency/auth/login', {
      method: 'OPTIONS',
      headers: {
        'Origin': 'http://localhost:4005',
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'Content-Type'
      }
    });
    
    console.log(`   Status: ${preflightResponse.status}`);
    console.log(`   CORS Origin: ${preflightResponse.headers.get('access-control-allow-origin')}`);
    console.log(`   Methods: ${preflightResponse.headers.get('access-control-allow-methods')}`);
    console.log(`   Headers: ${preflightResponse.headers.get('access-control-allow-headers')}`);
    
    if (preflightResponse.headers.get('access-control-allow-origin') === 'http://localhost:4005') {
      console.log('\n✅ CORS is working correctly!');
    } else {
      console.log(`\n❌ CORS still broken. Expected: http://localhost:4005, Got: ${preflightResponse.headers.get('access-control-allow-origin')}`);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.log('Make sure API Gateway is running on port 4000');
  }
}

testCORS();