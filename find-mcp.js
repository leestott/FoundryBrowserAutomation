/**
 * MCP Diagnostic Tool
 * 
 * This script helps diagnose issues with the @playwright/mcp module and provides
 * instructions for fixing them.
 */
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

// Check if MCP module exists
function checkMcpModule() {
  console.log('Checking for @playwright/mcp module...');
  
  // Check in node_modules
  const mcpPath = path.join(__dirname, 'node_modules', '@playwright', 'mcp');
  const exists = fs.existsSync(mcpPath);
  
  console.log(`@playwright/mcp directory exists: ${exists ? 'Yes' : 'No'}`);
  
  if (exists) {
    // Check for the specific file that's causing errors
    const libIndexPath = path.join(mcpPath, 'lib', 'index.js');
    console.log(`lib/index.js exists: ${fs.existsSync(libIndexPath) ? 'Yes' : 'No'}`);
    
    // Check package.json
    const packageJsonPath = path.join(mcpPath, 'package.json');
    if (fs.existsSync(packageJsonPath)) {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      console.log(`@playwright/mcp version: ${packageJson.version || 'unknown'}`);
      
      // Check exports
      console.log(`exports defined: ${packageJson.exports ? 'Yes' : 'No'}`);
      if (packageJson.exports) {
        console.log(`exports: ${JSON.stringify(packageJson.exports)}`);
      }
    }
  }
  
  // Try importing with require
  try {
    require('@playwright/mcp');
    console.log('✅ Successfully required @playwright/mcp');
  } catch (error) {
    console.log(`❌ Error requiring @playwright/mcp: ${error.message}`);
  }
  
  // Provide recommendations
  console.log('\nRecommendations:');
  console.log('1. Try reinstalling @playwright/mcp: npm install @playwright/mcp@latest');
  console.log('2. Make sure your package.json has "type": "commonjs" (not "module")');
  console.log('3. Check Node.js version compatibility: MCP requires Node.js 16+');
}

// Check for the mcp module when this script runs
checkMcpModule();

// Export helper functions
module.exports = {
  checkMcpModule
};