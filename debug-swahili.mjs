#!/usr/bin/env node

import { i18nManager } from './shared/index.mjs';
import i18next from 'i18next';

console.log('🔍 DETAILED SWAHILI DEBUG TEST\n');

await i18nManager.init();

console.log('📊 i18next Configuration:');
console.log('   Languages loaded:', i18next.languages);
console.log('   Store languages:', Object.keys(i18next.store.data));
console.log('   Current language:', i18next.language);
console.log('   Resolved language:', i18next.resolvedLanguage);

console.log('\n🧪 Language-specific tests:');

// Test each language explicitly
const testKey = 'common.success';
console.log(`Testing key: ${testKey}`);

console.log(`   EN (explicit): "${i18nManager.t(testKey, 'en')}"`);
console.log(`   RW (explicit): "${i18nManager.t(testKey, 'rw')}"`);
console.log(`   FR (explicit): "${i18nManager.t(testKey, 'fr')}"`);
console.log(`   SW (explicit): "${i18nManager.t(testKey, 'sw')}"`);

console.log('\n🔍 Raw i18next calls:');
console.log(`   EN: "${i18next.t(testKey, { lng: 'en' })}"`);
console.log(`   RW: "${i18next.t(testKey, { lng: 'rw' })}"`);
console.log(`   FR: "${i18next.t(testKey, { lng: 'fr' })}"`);
console.log(`   SW: "${i18next.t(testKey, { lng: 'sw' })}"`);

console.log('\n📁 Check if language data exists:');
console.log('   EN data exists:', !!i18next.store.data.en);
console.log('   RW data exists:', !!i18next.store.data.rw);
console.log('   FR data exists:', !!i18next.store.data.fr);
console.log('   SW data exists:', !!i18next.store.data.sw);

if (i18next.store.data.sw) {
    console.log('   SW common.success:', i18next.store.data.sw?.translation?.common?.success);
} else {
    console.log('   SW data is missing!');
}

console.log('\n🎯 Testing different approaches:');

// Test direct access
try {
    const swTranslation = i18next.getResource('sw', 'translation', 'common.success');
    console.log(`   Direct getResource SW: "${swTranslation}"`);
} catch (error) {
    console.log('   Direct access error:', error.message);
}

// Test existence check
console.log('   SW resource exists:', i18next.hasResourceBundle('sw', 'translation'));
console.log('   All resource languages:', i18next.languages);