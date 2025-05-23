const { execSync } = require('child_process');
const log = require('electron-log');
const path = require('path');
const fs = require('fs');
const http = require('http');
const os = require('os');

// Configure logging
log.transports.file.level = 'info';
log.transports.console.level = 'info';
log.transports.file.file = path.join(__dirname, 'setup.log');

/**
 * Setup script to ensure all dependencies are installed before starting the app
 */
function setupEnvironment() {
  try {
    log.info('Starting setup process...');
    log.info(`Date: ${new Date().toISOString()}`);
    log.info(`Platform: ${os.platform()} ${os.release()}`);
    log.info(`Node.js: ${process.version}`);
    
    // Ensure Node.js dependencies are installed
    log.info('Checking Node.js dependencies...');
      const requiredPackages = [
      'playwright',
      '@playwright/mcp',
      'openai',
      'electron-log',
      'axios'
    ];
    
    for (const pkg of requiredPackages) {
      try {
        require.resolve(pkg);
        log.info(`✅ ${pkg} is installed`);
      } catch (error) {
        log.info(`⚠️ ${pkg} is not installed. Installing...`);
        execSync(`npm install --save ${pkg}`, { stdio: 'inherit' });
        log.info(`✅ ${pkg} installed successfully`);
      }
    }
    
    // Install browser dependencies for Playwright if needed
    log.info('Ensuring Playwright browsers are installed...');
    try {
      execSync('npx playwright install --with-deps chromium', { stdio: 'inherit' });
      log.info('✅ Playwright browser dependencies installed');
    } catch (error) {
      log.error(`Error installing Playwright browsers: ${error.message}`);
    }
    
    // Check if Foundry Local is running and accessible
    log.info('Checking Foundry Local service...');
    checkFoundryService();
    
    // Create environment info file
    createEnvironmentInfo();
    
    log.info('✅ Setup completed successfully');
    return true;
  } catch (error) {
    log.error(`Setup failed: ${error.message}`);
    return false;
  }
}

/**
 * Check if Foundry Local service is running
 */
function checkFoundryService() {
  const possiblePorts = [5000, 8080, 1234];
  let foundryRunning = false;
  
  for (const port of possiblePorts) {
    try {
      // Try a simple HTTP request to check if the service is running
      const options = {
        hostname: 'localhost',
        port: port,
        path: '/v1/models',
        method: 'GET',
        timeout: 2000
      };
      
      const req = http.request(options, (res) => {
        if (res.statusCode === 200) {
          log.info(`✅ Found Foundry service on port ${port}`);
          foundryRunning = true;
          
          // Save the port to a config file for the app to use
          try {
            const configPath = path.join(__dirname, 'foundry-config.json');
            fs.writeFileSync(configPath, JSON.stringify({ 
              foundryPort: port,
              baseUrl: `http://localhost:${port}/v1`,
              lastChecked: new Date().toISOString()
            }, null, 2));
            log.info(`Saved Foundry configuration to ${configPath}`);
          } catch (err) {
            log.error(`Failed to save Foundry configuration: ${err.message}`);
          }
        } else {
          log.warn(`Found service on port ${port} but status code was ${res.statusCode}`);
        }
      });
      
      req.on('error', () => {
        // Silently ignore errors
      });
      
      req.end();
    } catch (err) {
      // Silently ignore errors
    }
  }
  
  if (!foundryRunning) {
    log.warn('⚠️ No Foundry Local service detected. The app may encounter connection errors.');
    console.warn('\x1b[33m%s\x1b[0m', '⚠️ WARNING: No Foundry Local service detected. The app may encounter connection errors.');
    
    // Create a default config file anyway
    try {
      const configPath = path.join(__dirname, 'foundry-config.json');
      fs.writeFileSync(configPath, JSON.stringify({ 
        foundryPort: null,
        baseUrl: null,
        lastChecked: new Date().toISOString(),
        serviceDetected: false,
        possiblePorts: possiblePorts
      }, null, 2));
      log.info(`Created default Foundry configuration at ${configPath}`);
    } catch (err) {
      log.error(`Failed to create default Foundry configuration: ${err.message}`);
    }
  }
}

/**
 * Create an environment information file
 */
function createEnvironmentInfo() {
  log.info('Creating environment information...');
  
  const envInfo = {
    platform: os.platform(),
    release: os.release(),
    architecture: os.arch(),
    nodeVersion: process.version,
    cpuCores: os.cpus().length,
    totalMemory: Math.round(os.totalmem() / (1024 * 1024 * 1024)) + ' GB',
    freeMemory: Math.round(os.freemem() / (1024 * 1024 * 1024)) + ' GB',
    timestamp: new Date().toISOString()
  };
  
  const envFilePath = path.join(__dirname, 'env-info.json');
  
  try {
    fs.writeFileSync(envFilePath, JSON.stringify(envInfo, null, 2));
    log.info(`Environment info written to ${envFilePath}`);
  } catch (err) {
    log.error(`Failed to write environment info: ${err.message}`);
  }
}

// Run the setup if this file is executed directly
if (require.main === module) {
  const success = setupEnvironment();
  if (!success) {
    process.exit(1);
  }
}

module.exports = setupEnvironment;