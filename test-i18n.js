#!/usr/bin/env node

// Test script to verify multi-language support
console.log("🌐 Testing Multi-Language Support...\n");

const testEndpoint = async (lang, langName) => {
  try {
    const response = await fetch(`http://localhost:4004/api/agency/auth/login?lang=${lang}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username: 'invalid_user',
        password: 'invalid_pass'
      })
    });
    
    const result = await response.json();
    console.log(`${langName} (${lang}):`, result.message);
  } catch (error) {
    console.log(`${langName} (${lang}): Connection error -`, error.message);
  }
};

// Test all languages
const test = async () => {
  console.log("Testing login validation error messages:\n");
  
  await testEndpoint('rw', 'Kinyarwanda (Default)');
  await testEndpoint('en', 'English');  
  await testEndpoint('fr', 'French');
  
  console.log("\n✅ Multi-language test completed!");
  console.log("\nNote: If you see connection errors, make sure the identity-service is running on port 4004");
};

test();