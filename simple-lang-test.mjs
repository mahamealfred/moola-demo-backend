/**
 * Simple Language Test using Node.js http module
 */

import http from 'http';

function makeRequest(path, headers = {}, data = null) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: 4004,
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

async function testLanguages() {
    const testData = {
        username: 'invalid_user',
        password: 'invalid_pass'
    };

    console.log('🚀 Testing Multi-Language Support');
    console.log('=' .repeat(40));

    // Test Kinyarwanda (default)
    console.log('\n🇷🇼 Testing Kinyarwanda (default):');
    try {
        const result1 = await makeRequest('/api/agency/auth/login', {}, testData);
        console.log(`Response: "${result1.data.message}"`);
    } catch (e) {
        console.log('❌ Error:', e.message);
    }

    // Test English
    console.log('\n🇺🇸 Testing English (?lang=en):');
    try {
        const result2 = await makeRequest('/api/agency/auth/login?lang=en', {}, testData);
        console.log(`Response: "${result2.data.message}"`);
    } catch (e) {
        console.log('❌ Error:', e.message);
    }

    // Test French  
    console.log('\n🇫🇷 Testing French (x-language: fr):');
    try {
        const result3 = await makeRequest('/api/agency/auth/login', { 'x-language': 'fr' }, testData);
        console.log(`Response: "${result3.data.message}"`);
    } catch (e) {
        console.log('❌ Error:', e.message);
    }

    console.log('\n' + '='.repeat(40));
    console.log('✅ Test complete! Check if messages are in different languages.');
}

testLanguages().catch(console.error);