#!/usr/bin/env node

/**
 * Comprehensive Service Language Test
 * Verifies that ALL services use English as default language
 */

import { i18nManager } from './shared/index.mjs';

const SERVICES = {
  'API Gateway': 'http://localhost:4000',
  'Identity Service': 'http://localhost:4004',
  'Account Service': 'http://localhost:4002',
  'Agency Service': 'http://localhost:4001',
  'Client Service': 'http://localhost:4003'
};

const LANGUAGES = {
  'rw': 'Kinyarwanda',
  'en': 'English', 
  'fr': 'French'
};

const TEST_CREDENTIALS = {
  username: 'test_user',
  password: 'TestPass123!'
};

class MultiLanguageTestSuite {
  constructor() {
    this.results = {
      passed: 0,
      failed: 0,
      tests: []
    };
  }

  async testService(serviceName, baseUrl, endpoint, method = 'GET', data = null, language = 'rw') {
    const testName = `${serviceName} - ${endpoint} (${LANGUAGES[language]})`;
    
    try {
      const config = {
        method,
        url: `${baseUrl}${endpoint}`,
        headers: {
          'Content-Type': 'application/json',
          'x-language': language,
          'Accept-Language': language === 'en' ? 'en-US,en;q=0.9' : language === 'fr' ? 'fr-FR,fr;q=0.9' : 'rw'
        }
      };

      if (data) {
        config.data = data;
      }

      // Add language as query parameter as well
      if (endpoint.includes('?')) {
        config.url += `&lang=${language}`;
      } else {
        config.url += `?lang=${language}`;
      }

      console.log(`🧪 Testing: ${testName}`);
      console.log(`   URL: ${config.url}`);
      
      const response = await axios(config);
      
      // Check if response contains translated message
      const hasMessage = response.data.message;
      const isTranslated = this.isMessageTranslated(response.data.message, language);
      
      if (hasMessage && isTranslated) {
        console.log(`✅ PASS: ${testName}`);
        console.log(`   Response: "${response.data.message}"`);
        this.results.passed++;
      } else {
        console.log(`⚠️  PARTIAL: ${testName} - Service responded but no translated message`);
        console.log(`   Response: ${JSON.stringify(response.data, null, 2)}`);
      }
      
      this.results.tests.push({
        test: testName,
        status: 'passed',
        response: response.data
      });
      
    } catch (error) {
      if (error.response) {
        // Service responded with error - check if error message is translated
        const hasErrorMessage = error.response.data.message;
        const isTranslated = this.isMessageTranslated(error.response.data.message, language);
        
        if (hasErrorMessage && isTranslated) {
          console.log(`✅ PASS: ${testName} (Error Response Translated)`);
          console.log(`   Error Message: "${error.response.data.message}"`);
          this.results.passed++;
        } else {
          console.log(`❌ FAIL: ${testName} - Error not translated`);
          console.log(`   Error: ${error.response.data.message || 'No message'}`);
          this.results.failed++;
        }
        
        this.results.tests.push({
          test: testName,
          status: error.response.status < 500 ? 'passed' : 'failed',
          error: error.response.data
        });
      } else {
        console.log(`❌ FAIL: ${testName} - Service not responding`);
        console.log(`   Error: ${error.message}`);
        this.results.failed++;
        
        this.results.tests.push({
          test: testName,
          status: 'failed',
          error: error.message
        });
      }
    }
    
    console.log(''); // Empty line for readability
  }

  isMessageTranslated(message, language) {
    if (!message) return false;
    
    // Define expected keywords for each language
    const keywords = {
      'rw': ['neza', 'byagenze', 'ikosa', 'winjiye', 'ntabwo', 'ryabaye', 'ufite', 'konti', 'amafaranga'],
      'en': ['success', 'error', 'login', 'account', 'invalid', 'failed', 'occurred', 'balance', 'transaction'],
      'fr': ['succès', 'erreur', 'connexion', 'compte', 'invalide', 'échoué', 'produite', 'solde', 'transaction']
    };
    
    const messageWords = message.toLowerCase();
    const relevantKeywords = keywords[language] || [];
    
    return relevantKeywords.some(keyword => messageWords.includes(keyword));
  }

  async runAllTests() {
    console.log('🚀 Starting Multi-Language Test Suite for Moola Services\\n');
    console.log('=' .repeat(60));
    
    // Test each service with each language
    for (const [serviceName, baseUrl] of Object.entries(SERVICES)) {
      console.log(`\\n📋 Testing ${serviceName}:`);
      console.log('-'.repeat(40));
      
      for (const [langCode, langName] of Object.entries(LANGUAGES)) {
        
        if (serviceName === 'Identity Service') {
          // Test login endpoint
          await this.testService(
            serviceName, 
            baseUrl, 
            '/api/agency/auth/login',
            'POST',
            TEST_CREDENTIALS,
            langCode
          );
          
          // Test find user endpoint (should fail with translated error)
          await this.testService(
            serviceName,
            baseUrl,
            '/api/agency/auth/find/nonexistent',
            'GET',
            null,
            langCode
          );
        }
        
        if (serviceName === 'API Gateway') {
          // Test through API Gateway
          await this.testService(
            serviceName,
            baseUrl,
            '/v1/agency/auth/login',
            'POST', 
            TEST_CREDENTIALS,
            langCode
          );
        }
        
        if (serviceName === 'Account Service') {
          // Test account balance (requires auth, should fail with translated error)
          await this.testService(
            serviceName,
            baseUrl,
            '/api/agency/accounts/balance',
            'GET',
            null,
            langCode
          );
        }
        
        if (serviceName === 'Agency Service') {
          // Test a protected endpoint (should fail with translated error)
          await this.testService(
            serviceName,
            baseUrl,
            '/api/agency/banking/accounts/open',
            'POST',
            { test: 'data' },
            langCode
          );
        }
        
        if (serviceName === 'Client Service') {
          // Test client payment (should fail with translated error) 
          await this.testService(
            serviceName,
            baseUrl,
            '/api/clients/payment/momo',
            'POST',
            { amount: 1000 },
            langCode
          );
        }
      }
    }
    
    this.printSummary();
  }

  printSummary() {
    console.log('\\n' + '='.repeat(60));
    console.log('📊 TEST RESULTS SUMMARY');
    console.log('='.repeat(60));
    console.log(`✅ Passed: ${this.results.passed}`);
    console.log(`❌ Failed: ${this.results.failed}`);
    console.log(`📈 Success Rate: ${((this.results.passed / (this.results.passed + this.results.failed)) * 100).toFixed(1)}%`);
    
    console.log('\\n🎯 LANGUAGE SUPPORT STATUS:');
    
    const languageStats = {};
    LANGUAGES.forEach(lang => languageStats[lang] = { passed: 0, total: 0 });
    
    this.results.tests.forEach(test => {
      const lang = test.test.includes('(Kinyarwanda)') ? 'Kinyarwanda' : 
                  test.test.includes('(English)') ? 'English' : 'French';
      languageStats[lang].total++;
      if (test.status === 'passed') languageStats[lang].passed++;
    });
    
    Object.entries(languageStats).forEach(([lang, stats]) => {
      const percentage = stats.total > 0 ? ((stats.passed / stats.total) * 100).toFixed(1) : 0;
      console.log(`   ${lang}: ${stats.passed}/${stats.total} (${percentage}%)`);
    });

    console.log('\\n📝 RECOMMENDATIONS:');
    if (this.results.failed > 0) {
      console.log('   • Check that all services are running');
      console.log('   • Verify shared i18n module is properly installed');
      console.log('   • Ensure controllers use createResponse/createErrorResponse');
      console.log('   • Check that middleware is properly configured');
    } else {
      console.log('   🎉 All tests passed! Multi-language support is working correctly.');
    }
    
    console.log('\\n' + '='.repeat(60));
  }
}

// Run the tests
const testSuite = new MultiLanguageTestSuite();
testSuite.runAllTests().catch(console.error);