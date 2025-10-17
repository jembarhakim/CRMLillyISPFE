#!/usr/bin/env node

import fs from 'fs';
import path from 'path';

const environments = {
  local: {
    NUXT_PUBLIC_API_HOST: 'http://localhost:3001',
    NUXT_PUBLIC_WA_HOST: 'http://localhost:3001'
  },
  production: {
    NUXT_PUBLIC_API_HOST: 'https://crm-be-production-cfa1.up.railway.app',
    NUXT_PUBLIC_WA_HOST: 'https://crm-be-production-cfa1.up.railway.app'
  }
};

const env = process.argv[2];

if (!env || !environments[env]) {
  console.log('Usage: node switch-env.js <local|production>');
  console.log('Available environments:', Object.keys(environments).join(', '));
  process.exit(1);
}

const envContent = Object.entries(environments[env])
  .map(([key, value]) => `${key}=${value}`)
  .join('\n') + '\n';

fs.writeFileSync('.env', envContent);
console.log(`✅ Switched to ${env} environment`);
console.log(`📝 Created .env with:`);
console.log(envContent);
