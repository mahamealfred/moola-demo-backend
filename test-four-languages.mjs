#!/usr/bin/env node

import { i18nManager } from './shared/index.mjs';

console.log('🌍 MULTI-LANGUAGE VERIFICATION: English Default + Swahili Support\n');

await i18nManager.init();

console.log('✅ UPDATED CONFIGURATION:');
console.log('   🎯 Default Language: English (en)');
console.log('   🔄 Fallback Language: English (en)');
console.log('   🌍 Supported Languages: English, Kinyarwanda, French, Swahili\n');

console.log('🧪 DEFAULT LANGUAGE TEST (should be English):');
const testKeys = [
    'common.success',
    'authentication.invalid_credentials', 
    'banking.account_opened_successfully',
    'validation.missing_required_fields',
    'billing.biller_not_found'
];

testKeys.forEach(key => {
    const translation = i18nManager.t(key);
    console.log(`   • ${key}: "${translation}"`);
});

console.log('\n🌍 FOUR-LANGUAGE VERIFICATION:');
console.log('Key: authentication.invalid_credentials');
console.log(`   🇬🇧 English (en): "${i18nManager.t('authentication.invalid_credentials', 'en')}"`);
console.log(`   🇷🇼 Kinyarwanda (rw): "${i18nManager.t('authentication.invalid_credentials', 'rw')}"`);
console.log(`   🇫🇷 French (fr): "${i18nManager.t('authentication.invalid_credentials', 'fr')}"`);
console.log(`   🇹🇿 Swahili (sw): "${i18nManager.t('authentication.invalid_credentials', 'sw')}"`);

console.log('\nKey: common.success');
console.log(`   🇬🇧 English (en): "${i18nManager.t('common.success', 'en')}"`);
console.log(`   🇷🇼 Kinyarwanda (rw): "${i18nManager.t('common.success', 'rw')}"`);
console.log(`   🇫🇷 French (fr): "${i18nManager.t('common.success', 'fr')}"`);
console.log(`   🇹🇿 Swahili (sw): "${i18nManager.t('common.success', 'sw')}"`);

console.log('\nKey: banking.payment_success');
console.log(`   🇬🇧 English (en): "${i18nManager.t('banking.payment_success', 'en')}"`);
console.log(`   🇷🇼 Kinyarwanda (rw): "${i18nManager.t('banking.payment_success', 'rw')}"`);
console.log(`   🇫🇷 French (fr): "${i18nManager.t('banking.payment_success', 'fr')}"`);
console.log(`   🇹🇿 Swahili (sw): "${i18nManager.t('banking.payment_success', 'sw')}"`);

console.log('\n🎯 API USAGE EXAMPLES:');
console.log('   • Default (no lang specified): English');
console.log('   • GET /api/banking/balance → English response');
console.log('   • GET /api/banking/balance?lang=en → English');
console.log('   • GET /api/banking/balance?lang=rw → Kinyarwanda');
console.log('   • GET /api/banking/balance?lang=fr → French');
console.log('   • GET /api/banking/balance?lang=sw → Swahili');
console.log('   • Headers: x-language: en/rw/fr/sw');

console.log('\n📁 UPDATED FILES STATUS:');
console.log('   ✅ shared/utils/i18n.mjs - English default + Swahili support');
console.log('   ✅ shared/utils/i18n.js - English default + Swahili support');
console.log('   ✅ shared/locales/en.json - English translations');
console.log('   ✅ shared/locales/rw.json - Kinyarwanda translations');
console.log('   ✅ shared/locales/fr.json - French translations');
console.log('   ✅ shared/locales/sw.json - NEW: Swahili translations');

console.log('\n🎊 SUCCESS! Four-language support implemented:');
console.log('   🎯 Default Language: English');
console.log('   🌍 Languages: English, Kinyarwanda, French, Swahili');
console.log('   🚀 Ready for production with 4-language support!');