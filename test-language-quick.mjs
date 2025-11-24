#!/usr/bin/env node

/**
 * Quick Language Test for Moola Services
 * Tests if language switching is working properly
 */

import axios from 'axios';

async function testLanguage(language, description) {
    console.log(`\n🧪 Testing ${description}:`);
    
    try {
        const config = {
            method: 'POST',
            url: 'http://localhost:4004/api/agency/auth/login',
            headers: {
                'Content-Type': 'application/json'
            },
            data: {
                username: 'invalid_user',
                password: 'invalid_pass'
            }
        };

        // Add language detection
        if (language === 'en') {
            config.url += '?lang=en';
        } else if (language === 'fr') {
            config.headers['x-language'] = 'fr';
        }
        // Default is Kinyarwanda (rw)

        const response = await axios(config);
        console.log(`✅ Response: ${response.data.message}`);
        
    } catch (error) {
        if (error.response && error.response.data && error.response.data.message) {
            console.log(`✅ Error Response: "${error.response.data.message}"`);
            
            // Check if the message is in the expected language
            const message = error.response.data.message.toLowerCase();
            let isCorrectLanguage = false;
            
            if (language === 'rw' && (message.includes('ntabwo') || message.includes('sibyo') || message.includes('amazina'))) {
                isCorrectLanguage = true;
            } else if (language === 'en' && (message.includes('invalid') || message.includes('username') || message.includes('password'))) {
                isCorrectLanguage = true;
            } else if (language === 'fr' && (message.includes('invalide') || message.includes('utilisateur') || message.includes('mot de passe'))) {
                isCorrectLanguage = true;
            }
            
            console.log(`🎯 Language Detection: ${isCorrectLanguage ? '✅ CORRECT' : '❌ WRONG'}`);
        } else {
            console.log(`❌ Unexpected error: ${error.message}`);
        }
    }
}

async function runTests() {
    console.log('🚀 Testing Multi-Language Support on Identity Service');
    console.log('=' .repeat(50));
    
    await testLanguage('rw', 'Kinyarwanda (Default)');
    await testLanguage('en', 'English (Query Param)');  
    await testLanguage('fr', 'French (Header)');
    
    console.log('\n' + '='.repeat(50));
    console.log('🎯 Test Complete!');
    console.log('\n💡 If all languages show "CORRECT", multi-language is working!');
    console.log('📝 If some show "WRONG", check the translation files or middleware.');
}

runTests().catch(console.error);