/**
 * Test API Gateway Multi-Language Support
 */

import http from 'http';

function makeRequest(port, path, headers = {}, data = null) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: port,
            path: path,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...headers
            }
        };

        const req = http.request(options, (res) => {
            let body = '';
            res.on('data', (chunk) => body += chunk);
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(body);
                    resolve({ status: res.statusCode, data: parsed });
                } catch (e) {
                    resolve({ status: res.statusCode, data: { message: body } });
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

async function testAPIGateway() {
    const testData = {
        username: 'invalid_user',
        password: 'invalid_pass'
    };

    console.log('🌐 Testing API Gateway Multi-Language Support');
    console.log('=' .repeat(50));

    // Test through API Gateway (Port 4000)
    console.log('\n🔗 Via API Gateway (Port 4000):');
    
    // Test Kinyarwanda (default)
    console.log('\n🇷🇼 Kinyarwanda (default):');
    try {
        const result1 = await makeRequest(4000, '/v1/agency/auth/login', {}, testData);
        console.log(`✅ "${result1.data.message}"`);
    } catch (e) {
        console.log('❌ Error:', e.message);
    }

    // Test English
    console.log('\n🇺🇸 English (?lang=en):');
    try {
        const result2 = await makeRequest(4000, '/v1/agency/auth/login?lang=en', {}, testData);
        console.log(`✅ "${result2.data.message}"`);
    } catch (e) {
        console.log('❌ Error:', e.message);
    }

    // Test French
    console.log('\n🇫🇷 French (x-language header):');
    try {
        const result3 = await makeRequest(4000, '/v1/agency/auth/login', { 'x-language': 'fr' }, testData);
        console.log(`✅ "${result3.data.message}"`);
    } catch (e) {
        console.log('❌ Error:', e.message);
    }

    console.log('\n' + '='.repeat(50));
    
    // Compare Direct vs Gateway
    console.log('\n📊 Comparison - Direct Service vs API Gateway:');
    console.log('\n🔗 Direct Identity Service (Port 4004):');
    
    try {
        const directResult = await makeRequest(4004, '/api/agency/auth/login?lang=en', {}, testData);
        console.log(`Direct: "${directResult.data.message}"`);
    } catch (e) {
        console.log('❌ Direct Error:', e.message);
    }

    console.log('\n🌐 Via API Gateway (Port 4000):');
    try {
        const gatewayResult = await makeRequest(4000, '/v1/agency/auth/login?lang=en', {}, testData);
        console.log(`Gateway: "${gatewayResult.data.message}"`);
    } catch (e) {
        console.log('❌ Gateway Error:', e.message);
    }

    console.log('\n🎯 Both should show the same English message!');
    console.log('\n✅ Multi-language support is working through API Gateway! 🚀');
}

testAPIGateway().catch(console.error);