const fs = require('fs');
const path = require('path');

const envContent = `NUXT_PUBLIC_API_HOST=http://localhost:3001
NUXT_PUBLIC_WA_HOST=http://localhost:3001
`;

const envPath = path.join(__dirname, '.env');

try {
  fs.writeFileSync(envPath, envContent);
  console.log('✅ .env file created successfully!');
  console.log('📝 Content:');
  console.log(envContent);
} catch (error) {
  console.error('❌ Error creating .env file:', error.message);
}
