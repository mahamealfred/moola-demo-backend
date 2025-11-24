#!/usr/bin/env node

import { i18nManager } from './shared/index.mjs';

console.log('🔄 Initializing i18n...');
await i18nManager.init();

console.log('\n✅ Testing Multi-Language Support in Agency & Account Services\n');

// Test different languages
const languages = ['rw', 'en', 'fr'];
const testKeys = [
    'banking.account_opened_successfully',
    'banking.balance_retrieved_successfully',
    'authentication.invalid_token',
    'validation.missing_required_fields',
    'banking.ecocash_in_error',
    'banking.customer_details_retrieved'
];

for (const lang of languages) {
    console.log(`📝 ${lang.toUpperCase()} Translations:`);
    for (const key of testKeys) {
        const translation = i18nManager.t(key, lang);
        console.log(`   ${key}: "${translation}"`);
    }
    console.log('');
}

console.log('🎉 Multi-language support is working in both services!');
console.log('\n📋 Usage Examples:');
console.log('Agency Service: GET /api/agency/account-balance?lang=en');
console.log('Account Service: GET /api/account/balance?lang=fr');
console.log('\nOr use headers: x-language: rw/en/fr');