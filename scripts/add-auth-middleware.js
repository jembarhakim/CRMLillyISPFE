const fs = require('fs');
const path = require('path');

function addAuthMiddlewareToFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Check if middleware is already defined
    if (content.includes('definePageMeta') && content.includes('middleware')) {
      console.log(`Skipping ${filePath} - middleware already defined`);
      return;
    }
    
    // Find the script setup tag
    const scriptSetupMatch = content.match(/<script setup[^>]*>/);
    if (!scriptSetupMatch) {
      console.log(`Skipping ${filePath} - no script setup found`);
      return;
    }
    
    // Find the first import statement after script setup
    const importMatch = content.match(/<script setup[^>]*>([\s\S]*?)(import\s+[^;]+;)/);
    if (!importMatch) {
      console.log(`Skipping ${filePath} - no imports found`);
      return;
    }
    
    const beforeImports = importMatch[1];
    const firstImport = importMatch[2];
    
    // Add middleware definition after the first import
    const newContent = content.replace(
      importMatch[0],
      `<script setup lang="ts">
${beforeImports}${firstImport}

// Apply auth middleware
definePageMeta({
  middleware: 'auth'
})`
    );
    
    fs.writeFileSync(filePath, newContent);
    console.log(`Added auth middleware to ${filePath}`);
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error.message);
  }
}

function processDirectory(dirPath) {
  const items = fs.readdirSync(dirPath);
  
  for (const item of items) {
    const fullPath = path.join(dirPath, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      processDirectory(fullPath);
    } else if (item.endsWith('.vue') && fullPath.includes('/dashboard/')) {
      addAuthMiddlewareToFile(fullPath);
    }
  }
}

// Process all dashboard pages
const dashboardPath = path.join(__dirname, '../pages/dashboard');
if (fs.existsSync(dashboardPath)) {
  console.log('Adding auth middleware to dashboard pages...');
  processDirectory(dashboardPath);
  console.log('Done!');
} else {
  console.log('Dashboard directory not found');
}
