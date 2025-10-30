#!/usr/bin/env node

import fs from 'fs';
import path from 'path';

const environments = {
  local: {
    NUXT_PUBLIC_API_HOST: 'http://localhost:3001',
    NUXT_PUBLIC_WA_HOST: 'http://localhost:3001',
    SSR_ENABLED: 'false'
  },
  production: {
    // VPS Production - Using domain or IP
    NUXT_PUBLIC_API_HOST: 'http://api.rndpolije.lilly.net.id',
    NUXT_PUBLIC_WA_HOST: 'http://api.rndpolije.lilly.net.id',
    SSR_ENABLED: 'true'
    
    // Alternative: If domain is not configured yet, use direct IP:
    // NUXT_PUBLIC_API_HOST: 'http://103.148.18.190:3001',
    // NUXT_PUBLIC_WA_HOST: 'http://103.148.18.190:3001'
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

// Update Nuxt config based on environment
const nuxtConfigPath = 'nuxt.config.ts';
let nuxtConfig = fs.readFileSync(nuxtConfigPath, 'utf8');

const ssrEnabled = environments[env].SSR_ENABLED === 'true';

// Update SSR setting in nuxt.config.ts
if (ssrEnabled) {
  nuxtConfig = nuxtConfig.replace(
    /ssr:\s*(true|false),?\s*\/\/.*$/m,
    'ssr: true, // Enabled for production'
  );
} else {
  nuxtConfig = nuxtConfig.replace(
    /ssr:\s*(true|false),?\s*\/\/.*$/m,
    'ssr: false, // Disabled for development to fix hasOwnProperty error'
  );
}

fs.writeFileSync(nuxtConfigPath, nuxtConfig);

console.log(`✅ Switched to ${env} environment`);
console.log(`📝 Created .env with:`);
console.log(envContent);
console.log(`🔧 Updated nuxt.config.ts - SSR: ${ssrEnabled ? 'ENABLED' : 'DISABLED'}`);
