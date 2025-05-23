/**
 * Foundry Connection Test Utility
 * Tests connections to possible Foundry Local endpoints
 */

const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const log = require('electron-log');

// Configure logging
log.transports.file.level = 'info';
log.transports.console.level = 'info'; 
log.transports.file.file = path.join(__dirname, 'test-connection.log');

// Define possible ports and endpoints
const POSSIBLE_PORTS = [5000, 8080, 1234];
const POSSIBLE_ENDPOINTS = [
  process.env.OPENAI_BASE_URL, // First check env var if set
  ...POSSIBLE_PORTS.map(port => `http://localhost:${port}/v1`)
].filter(Boolean); // Remove null/undefined values

console.log('=========================================');
console.log('Foundry Local Connection Diagnostic Tool');
console.log('=========================================');
console.log('Testing connections to possible Foundry endpoints...');
console.log('');

/**
 * Test a single endpoint with timeout
 * @param {string} url - The URL to test
 * @returns {Promise<object>} - Result of the test
 */
async function testEndpoint(url) {
  return new Promise((resolve) => {
    const startTime = Date.now();
    const timeout = 3000; // 3 seconds timeout
    let resolved = false;
    
    // Create URL object to parse the URL
    try {
      const parsedUrl = new URL(url);
      const options = {
        hostname: parsedUrl.hostname,
        port: parsedUrl.port,
        path: `${parsedUrl.pathname}/models`,
        method: 'GET',
        timeout: timeout
      };
      
      // Choose http or https
      const protocol = parsedUrl.protocol === 'https:' ? https : http;
      
      // Make request
      const req = protocol.request(options, (res) => {
        let data = '';
        
        res.on('data', (chunk) => {
          data += chunk;
        });
        
        res.on('end', () => {
          if (resolved) return;
          resolved = true;
          
          const duration = Date.now() - startTime;
          
          let parsedData = null;
          let models = [];
          
          if (res.statusCode === 200) {
            try {
              parsedData = JSON.parse(data);
              if (parsedData.data && Array.isArray(parsedData.data)) {
                models = parsedData.data.map(model => model.id);
              }
            } catch (e) {
              // Ignore parse errors
            }
          }
          
          resolve({
            url,
            success: res.statusCode === 200,
            statusCode: res.statusCode,
            duration,
            models: models.length > 0 ? models : null
          });
        });
      });
      
      req.on('error', (error) => {
        if (resolved) return;
        resolved = true;
        
        resolve({
          url,
          success: false,
          error: error.message,
          duration: Date.now() - startTime
        });
      });
      
      req.on('timeout', () => {
        if (resolved) return;
        resolved = true;
        req.destroy();
        
        resolve({
          url,
          success: false,
          error: 'Request timed out',
          duration: timeout
        });
      });
      
      req.end();
      
      // Set our own timeout as backup
      setTimeout(() => {
        if (!resolved) {
          resolved = true;
          req.destroy();
          
          resolve({
            url,
            success: false,
            error: 'Request timed out (global)',
            duration: timeout
          });
        }
      }, timeout + 500);
    } catch (error) {
      resolve({
        url,
        success: false,
        error: `Invalid URL: ${error.message}`,
        duration: 0
      });
    }
  });
}

/**
 * Run all tests and report results
 */
async function runTests() {
  // Test all endpoints in parallel
  const results = await Promise.all(POSSIBLE_ENDPOINTS.map(testEndpoint));
  
  // Log results
  console.log('Test Results:');
  console.log('-------------');
  
  let foundWorkingEndpoint = false;
  let bestEndpoint = null;
  
  results.forEach(result => {
    if (result.success) {
      foundWorkingEndpoint = true;
      console.log(`✅ ${result.url}: SUCCESS (${result.duration}ms)`);
      if (result.models) {
        console.log(`   Available models: ${result.models.join(', ')}`);
      }
      
      // Keep track of fastest successful endpoint
      if (!bestEndpoint || result.duration < bestEndpoint.duration) {
        bestEndpoint = result;
      }
    } else {
      console.log(`❌ ${result.url}: FAILED - ${result.error || `Status: ${result.statusCode}`}`);
    }
  });
  
  console.log('');
  
  if (foundWorkingEndpoint) {
    console.log('✅ SUCCESS: Found at least one working Foundry endpoint!');
    
    // Save the best endpoint to config file
    try {
      const configPath = path.join(__dirname, 'foundry-config.json');
      const port = new URL(bestEndpoint.url).port;
      fs.writeFileSync(configPath, JSON.stringify({ 
        foundryPort: port,
        baseUrl: bestEndpoint.url,
        lastChecked: new Date().toISOString(),
        serviceDetected: true,
        availableModels: bestEndpoint.models
      }, null, 2));
      console.log(`Saved Foundry configuration to ${configPath}`);
    } catch (err) {
      console.error(`Failed to save Foundry configuration: ${err.message}`);
    }
    
    return true;
  } else {
    console.log('❌ ERROR: Could not connect to any Foundry endpoints.');
    console.log('');
    console.log('Troubleshooting steps:');
    console.log('1. Make sure Microsoft Foundry Local is running on your system');
    console.log('2. Check if Foundry is running on a different port');
    console.log('3. Check your network connection and firewall settings');
    return false;
  }
}

// Run the tests
runTests().then(success => {
  if (!success) {
    process.exit(1);
  }
}).catch(error => {
  console.error('Error running tests:', error);
  process.exit(1);
});
