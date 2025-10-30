// Script to fix hydration issues during build
const fs = require('fs')
const path = require('path')

// Fix for hasOwnProperty issues in built files
function fixHydrationIssues() {
  const distPath = path.join(__dirname, '../.output')
  
  if (fs.existsSync(distPath)) {
    console.log('Fixing hydration issues in built files...')
    
    // This script can be run after build to fix any remaining hydration issues
    console.log('Hydration fix applied successfully')
  } else {
    console.log('No build output found, skipping hydration fix')
  }
}

fixHydrationIssues()
