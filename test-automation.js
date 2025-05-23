/**
 * Test script for browser automation
 * This script provides diagnostic information to help troubleshoot issues
 */

// System information
console.log('======== SYSTEM INFORMATION ========');
console.log('Node.js Version:', process.version);
console.log('Platform:', process.platform);
console.log('Architecture:', process.arch);
console.log('Working directory:', process.cwd());
console.log('====================================');

// Ensure proper error handling
process.on('unhandledRejection', (reason, promise) => {
  console.error('\n🚨 UNHANDLED REJECTION 🚨');
  console.error('Promise:', promise);
  console.error('Reason:', reason);
  console.error('Stack:', reason.stack);
  console.error('====================================');
  process.exit(1);
});

// Import dependencies with error checking
console.log('\nLoading dependencies...');

let browserAutomation;
try {
  browserAutomation = require('./browser-automation');
  console.log('✅ Browser automation module loaded successfully');
} catch (moduleError) {
  console.error('❌ Failed to load browser automation module:', moduleError);
  process.exit(1);
}

let log;
try {
  log = require('electron-log');
  log.transports.console.level = 'debug';
  log.transports.file.level = 'debug';
  console.log('✅ Logging system initialized');
} catch (logError) {
  console.error('❌ Failed to initialize logging system:', logError);
  // Continue without logging
  log = {
    info: console.log,
    error: console.error,
    warn: console.warn,
    debug: console.log
  };
}

async function runTest() {
  console.log('\n======== STARTING BROWSER TEST ========');
  console.log('Time:', new Date().toLocaleString());
  
  try {
    // Check Playwright installation
    console.log('\nChecking Playwright installation...');
    try {
      const playwright = require('playwright');
      console.log('✅ Playwright is installed');
      
      // List available browsers
      console.log('Available browsers:');
      for (const browserType of ['chromium', 'firefox', 'webkit']) {
        if (playwright[browserType]) {
          console.log(`  - ${browserType}`);
        }
      }
    } catch (playwrightError) {
      console.error('❌ Playwright is not properly installed:', playwrightError.message);
      console.log('Attempting to continue with test...');
    }
    
    // Start browser automation with more generous timeout
    console.log('\nLaunching browser automation...');
    console.time('Browser Automation');
    
    const result = await browserAutomation.startBrowserAutomation({
      headless: false,
      slowMo: 100,  // Slow down actions for visibility
      timeout: 60000  // 60 seconds timeout
    });
    
    console.timeEnd('Browser Automation');
    
    console.log('\n======== RESULTS ========');
    console.log('Success:', result.success);
    console.log('Message:', result.message);
    
    if (result.success) {
      console.log('✅ Browser automation test PASSED!');
      
      // Check for screenshots
      if (result.screenshots && result.screenshots.length > 0) {
        console.log('\nScreenshots created:');
        result.screenshots.forEach(screenshot => {
          console.log(`  - ${screenshot}`);
        });
      } else {
        console.log('⚠️ No screenshots were captured');
      }
      
      if (result.contentAnalyzed) {
        console.log('✅ Page content was successfully analyzed');
      }
    } else {
      console.error('❌ Browser automation test FAILED!');
      console.error('Error:', result.error);
      if (result.stack) {
        console.error('Stack trace:', result.stack);
      }
    }
  } catch (error) {
    console.error('\n❌ CRITICAL TEST ERROR:');
    console.error('Message:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  } finally {
    // Always attempt to clean up resources
    console.log('\nCleaning up resources...');
    try {
      await browserAutomation.stopBrowserAutomation();
      console.log('✅ Resources cleaned up successfully');
    } catch (cleanupError) {
      console.error('❌ Error during cleanup:', cleanupError);
    }
    console.log('\n======== TEST COMPLETED ========');
  }
}

// Run the test
console.log('Starting test procedure...');
runTest()
  .then(() => console.log('Test completed'))
  .catch(error => {
    console.error('Fatal error in test:', error);
    process.exit(1);
  });