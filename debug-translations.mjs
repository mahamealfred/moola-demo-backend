#!/usr/bin/env node

import { i18nManager } from './shared/index.mjs';

console.log('🔍 Debugging Translation Function...\n');

await i18nManager.init();

// Test direct translation calls
console.log('Direct translation calls:');
console.log('Default (no lang):', i18nManager.t('common.success'));
console.log('Explicit EN:', i18nManager.t('common.success', 'en'));
console.log('Explicit RW:', i18nManager.t('common.success', 'rw'));
console.log('Explicit FR:', i18nManager.t('common.success', 'fr'));

console.log('\nAuthentication test:');
console.log('Default:', i18nManager.t('authentication.invalid_credentials'));
console.log('EN:', i18nManager.t('authentication.invalid_credentials', 'en')); 
console.log('RW:', i18nManager.t('authentication.invalid_credentials', 'rw'));
console.log('FR:', i18nManager.t('authentication.invalid_credentials', 'fr'));

// Check current language
console.log('\ni18next current language:', i18nManager.i18next.language);
console.log('i18next languages:', i18nManager.i18next.languages);

console.log('\n✅ Translation Debug Complete');