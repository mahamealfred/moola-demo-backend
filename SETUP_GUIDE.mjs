#!/usr/bin/env node

/**
 * Moola Microservices Setup and Deployment Guide
 * Quick setup for all services with shared configuration
 */

import { promises as fs } from 'fs';
import { spawn } from 'child_process';
import path from 'path';

console.log('🚀 MOOLA MICROSERVICES SETUP GUIDE\n');

const services = [
  { name: 'api-gateway', port: 4000 },
  { name: 'agency-service', port: 4001 },
  { name: 'account-service', port: 4002 },
  { name: 'client-service', port: 4003 },
  { name: 'identity-service', port: 4004 }
];

console.log('📋 SETUP CHECKLIST:\n');

console.log('1. 📦 INSTALL DEPENDENCIES');
console.log('   First, install shared package dependencies:');
console.log('   cd shared && npm install\n');

console.log('   Then install for each service:');
services.forEach(service => {
  console.log(`   cd ${service.name} && npm install`);
});
console.log('');

console.log('2. ⚙️  CONFIGURE ENVIRONMENT VARIABLES');
console.log('   Copy .env.template to each service and configure:');
services.forEach(service => {
  console.log(`   cp .env.template ${service.name}/.env`);
  console.log(`   # Edit ${service.name}/.env and set PORT=${service.port}`);
});
console.log('');

console.log('3. 🗄️  DATABASE SETUP');
console.log('   • Start MySQL/MariaDB server');
console.log('   • Create database: CREATE DATABASE moola_db;');
console.log('   • Update DB credentials in .env files');
console.log('   • Services will auto-sync database on startup\n');

console.log('4. 🔴 REDIS SETUP');
console.log('   • Start Redis server: redis-server');
console.log('   • Default: localhost:6379 (no password)');
console.log('   • Update Redis config in .env if different\n');

console.log('5. 🚀 START SERVICES');
console.log('   Start each service in separate terminals:\n');

services.forEach(service => {
  console.log(`   # Terminal ${services.indexOf(service) + 1}: ${service.name.toUpperCase()}`);
  console.log(`   cd ${service.name}`);
  console.log(`   npm start`);
  console.log(`   # Available at: http://localhost:${service.port}`);
  console.log(`   # Health check: http://localhost:${service.port}/health\n`);
});

console.log('6. ✅ VERIFICATION');
console.log('   Test that all services are running:');
services.forEach(service => {
  console.log(`   curl http://localhost:${service.port}/health`);
});
console.log('');

console.log('7. 🌍 MULTI-LANGUAGE TESTING');
console.log('   Test language switching (English default + Swahili):');
console.log('   curl -H "Accept-Language: sw" http://localhost:4000/health');
console.log('   curl -H "Accept-Language: en" http://localhost:4000/health\n');

console.log('📊 SERVICE ARCHITECTURE:');
console.log('   ┌─────────────────┐    ┌──────────────────┐');
console.log('   │   API Gateway   │────│  Identity Service │');
console.log('   │   Port: 4000    │    │   Port: 4004     │');
console.log('   └─────────┬───────┘    └──────────────────┘');
console.log('             │');
console.log('   ┌─────────┼───────┐    ┌──────────────────┐');
console.log('   │  Agency Service │────│  Account Service │');
console.log('   │   Port: 4001    │    │   Port: 4002     │');
console.log('   └─────────────────┘    └──────────────────┘');
console.log('             │');
console.log('   ┌─────────┼───────┐');
console.log('   │ Client Service  │');
console.log('   │   Port: 4003    │');
console.log('   └─────────────────┘');
console.log('             │');
console.log('   ┌─────────┼───────┐    ┌──────────────────┐');
console.log('   │   Shared Config │────│      Redis       │');
console.log('   │   + Database    │    │   Port: 6379     │');
console.log('   └─────────────────┘    └──────────────────┘\n');

console.log('🔧 TROUBLESHOOTING:');
console.log('   • Check logs in each service terminal');
console.log('   • Verify database connection in logs');
console.log('   • Ensure Redis is running');
console.log('   • Check port conflicts');
console.log('   • Validate .env file configuration\n');

console.log('📚 KEY FEATURES AVAILABLE:');
console.log('   ✅ Centralized configuration management');
console.log('   ✅ Shared database connection pooling');
console.log('   ✅ Redis-based rate limiting');
console.log('   ✅ Structured logging with Winston');
console.log('   ✅ Multi-language support (EN/SW/FR/RW)');
console.log('   ✅ Health check endpoints');
console.log('   ✅ Graceful shutdown handling');
console.log('   ✅ Security middleware (CORS, Helmet)');
console.log('   ✅ Request tracking and monitoring\n');

console.log('🎊 YOUR MOOLA MICROSERVICES ARE READY!');
console.log('   Enterprise-grade architecture with shared configuration');
console.log('   Multi-language support with English default');
console.log('   Centralized database and Redis management');
console.log('   Production-ready logging and monitoring');

export { services };