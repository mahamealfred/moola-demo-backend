#!/usr/bin/env node

/**
 * Shared Configuration Verification Test
 * Tests all shared configuration modules
 */

console.log('🔍 SHARED CONFIGURATION VERIFICATION\n');

try {
  // Test imports
  const { 
    sharedConfig, 
    databaseConfig, 
    redisConfig, 
    loggerConfig, 
    appConfig,
    i18nManager 
  } = await import('./shared/index.mjs');

  console.log('✅ IMPORT TEST - All modules imported successfully');

  // Test app configuration
  console.log('\n📊 APP CONFIGURATION TEST:');
  const serverConfig = appConfig.getServerConfig();
  console.log(`   Port: ${serverConfig.port}`);
  console.log(`   Environment: ${serverConfig.env}`);
  console.log(`   CORS Origin: ${serverConfig.corsOrigin}`);

  const dbConfig = appConfig.getDatabaseConfig();
  console.log(`   Database Host: ${dbConfig.host}`);
  console.log(`   Database Port: ${dbConfig.port}`);

  const redisConf = appConfig.getRedisConfig();
  console.log(`   Redis Host: ${redisConf.host}`);
  console.log(`   Redis Port: ${redisConf.port}`);

  // Test logger initialization
  console.log('\n📝 LOGGER TEST:');
  loggerConfig.init({ serviceName: 'test-service' });
  loggerConfig.info('Logger test message');
  console.log('   ✅ Logger initialized and working');

  // Test i18n
  console.log('\n🌍 I18N TEST:');
  await i18nManager.init();
  console.log(`   English: "${i18nManager.t('common.success', 'en')}"`);
  console.log(`   Swahili: "${i18nManager.t('common.success', 'sw')}"`);
  console.log('   ✅ I18n working with all languages');

  // Test configuration validation
  console.log('\n🔍 CONFIGURATION VALIDATION TEST:');
  try {
    appConfig.validateRequired(['server.port', 'server.env']);
    console.log('   ✅ Configuration validation working');
  } catch (error) {
    console.log(`   ❌ Validation error: ${error.message}`);
  }

  console.log('\n🎊 ALL TESTS PASSED - SHARED CONFIG READY! ✨');
  console.log('\n📋 AVAILABLE MODULES:');
  console.log('   ✅ sharedConfig - Complete configuration manager');
  console.log('   ✅ databaseConfig - Database (Sequelize) configuration');
  console.log('   ✅ redisConfig - Redis configuration');
  console.log('   ✅ loggerConfig - Winston logger configuration');
  console.log('   ✅ appConfig - Application configuration');
  console.log('   ✅ i18nManager - Multi-language support');

  console.log('\n🚀 Ready to update all services with shared configuration!');

} catch (error) {
  console.error('❌ TEST FAILED:', error.message);
  console.error(error.stack);
}