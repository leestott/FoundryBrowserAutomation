/**
 * Browser Automation Module
 * This module handles browser automation using Playwright with MCP integration for Foundry Local
 */

// Add strict mode for better error catching
'use strict';

// Direct console logging for immediate feedback
console.log('Initializing browser automation module with MCP support...');

// Import dependencies with verbose error handling
const log = require('electron-log');
const path = require('path');
const fs = require('fs');
const os = require('os');
const aiPrompt = require('./ai-prompt');
const { chromium } = require('playwright');
const { processFallbackPrompt } = require('./fallback-mcp');

// Configure verbose logging for diagnostics
log.transports.file.level = 'debug';
log.transports.console.level = 'debug';
log.transports.file.file = path.join(__dirname, 'browser_automation.log');
console.log(`Log file location: ${path.join(__dirname, 'browser_automation.log')}`);

// Check environment
console.log('Node.js version:', process.version);
console.log('Platform:', process.platform);
console.log('Working directory:', process.cwd());

// Module state
let mcpClient = null;
let browser = null;
let currentPage = null;

/**
 * Initialize and start browser automation with Playwright MCP
 * @param {Object} options Configuration options
 * @returns {Promise<Object>} Result with success status
 */
async function startBrowserAutomation(options = {}) {
  console.log('startBrowserAutomation called with options:', JSON.stringify(options));
    try {
    // Check if Foundry Local is running
    const foundryRunning = await aiPrompt.isFoundryRunning();
    log.info(`Foundry Local running check: ${foundryRunning}`);
    
    log.info('Starting browser automation with Playwright MCP...');
    console.log('Starting browser automation with Playwright MCP...');
    
    // Default options with explicit values
    const config = {
      headless: options.headless !== undefined ? options.headless : false,
      slowMo: options.slowMo || 50,
      timeout: options.timeout || 30000
    };
    
    console.log('Configuration:', config);
    
    // Launch browser with more detailed options for diagnostics
    log.info('Launching browser with Chromium...');
    console.log('Launching browser with Chromium...');
    
    browser = await chromium.launch({
      headless: config.headless,
      slowMo: config.slowMo,
      timeout: config.timeout,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      logger: {
        isEnabled: () => true,
        log: (name, severity, message) => console.log(`[Browser] ${name} ${severity}: ${message}`)
      }
    });
    
    console.log('Browser launched successfully');
    
    // Initialize MCP client with dynamic import for ES Module
    try {
      console.log('Importing @playwright/mcp as ES Module...');
      log.info('Importing @playwright/mcp as ES Module...');
      
      // Use dynamic import for ES Module compatibility
      const { PlaywrightMcp } = await import('@playwright/mcp');
      
      console.log('PlaywrightMcp loaded successfully');
      log.info('PlaywrightMcp loaded successfully');
      
      mcpClient = new PlaywrightMcp({
        name: "Microsoft Foundry Browser Automation",
        version: "1.0.0"
      });
      
      // Register browser with MCP
      console.log('Registering browser with MCP...');
      log.info('Registering browser with MCP...');
      await mcpClient.register(browser);
      console.log('Successfully registered browser with MCP');
      log.info('Successfully registered browser with MCP');
    } catch (mcpError) {
      console.warn(`MCP registration failed: ${mcpError.message}`);
      log.warn(`MCP registration failed: ${mcpError.message}`);
      console.log('Continuing with standard Playwright');
      mcpClient = null; // Reset to ensure we don't try to use it later
    }
    
    // Create new page with timeouts
    console.log('Creating new browser context and page...');
    log.info('Creating new browser context and page...');
    
    const context = await browser.newContext({
      viewport: { width: 1280, height: 720 },
      acceptDownloads: true
    });
    currentPage = await context.newPage();
    
    // Set navigation timeout
    currentPage.setDefaultNavigationTimeout(60000);
    currentPage.setDefaultTimeout(60000);

    // Try a simple page first to test browser functionality
    try {
      console.log('Navigating to example.com (test page)...');
      log.info('Navigating to example.com (test page)...');
      await currentPage.goto('https://example.com');
      console.log('Test page loaded successfully');
        // Take a test screenshot
      const screenshotDir = path.join(__dirname, 'screenshots');
      if (!fs.existsSync(screenshotDir)) {
        fs.mkdirSync(screenshotDir, { recursive: true });
      }
      const testScreenshotPath = path.join(screenshotDir, 'example.png');
      await currentPage.screenshot({ path: testScreenshotPath });
      console.log(`Test screenshot saved to ${testScreenshotPath}`);
    } catch (testError) {
      console.error(`Error loading test page: ${testError.message}`);
      log.error(`Error loading test page: ${testError.message}`);
      throw new Error(`Browser navigation failed: ${testError.message}`);
    }
    
    // If we have MCP client, let's use it for the demo
    if (mcpClient) {
      try {
        // Example of using MCP to automate tasks
        console.log('Using MCP to navigate to Microsoft Foundry page...');
        log.info('Using MCP to navigate to Microsoft Foundry page...');
        
        await currentPage.goto('https://microsoft.github.io/foundry', { waitUntil: 'networkidle' });
        console.log('Microsoft Foundry page loaded');
          // Take screenshot with MCP
        const screenshotDir = path.join(__dirname, 'screenshots');
        if (!fs.existsSync(screenshotDir)) {
          fs.mkdirSync(screenshotDir, { recursive: true });
        }
        const screenshotPath = path.join(screenshotDir, 'foundry_page.png');
        await currentPage.screenshot({ path: screenshotPath, fullPage: true });
        console.log(`Screenshot saved to ${screenshotPath}`);
        log.info(`Screenshot saved to ${screenshotPath}`);
      } catch (mcpNavError) {
        console.warn(`MCP navigation error: ${mcpNavError.message}`);
        log.warn(`MCP navigation error: ${mcpNavError.message}`);
      }
    } else {
      // Without MCP, fall back to standard Playwright
      try {
        console.log('Navigating to OpenAI pricing page...');
        log.info('Navigating to OpenAI pricing page...');
        await currentPage.goto('https://openai.com/pricing', { waitUntil: 'networkidle' });
        console.log('OpenAI pricing page loaded');
          // Take screenshot
        const screenshotDir = path.join(__dirname, 'screenshots');
        if (!fs.existsSync(screenshotDir)) {
          fs.mkdirSync(screenshotDir, { recursive: true });
        }
        const screenshotPath = path.join(screenshotDir, 'openai_pricing.png');
        await currentPage.screenshot({ path: screenshotPath, fullPage: true });
        console.log(`Screenshot saved to ${screenshotPath}`);
        log.info(`Screenshot saved to ${screenshotPath}`);
      } catch (navError) {
        console.warn(`Navigation error: ${navError.message}`);
        log.warn(`Navigation error: ${navError.message}`);
      }
    }
    
    // Try to analyze page content
    let pageContent = '';
    let contentAnalyzed = false;
    
    try {
      pageContent = await currentPage.content();
      contentAnalyzed = true;
      console.log(`Page content length: ${pageContent.length} characters`);
      log.info(`Page content length: ${pageContent.length} characters`);
    } catch (contentError) {
      console.warn(`Could not analyze page content: ${contentError.message}`);
      log.warn(`Could not analyze page content: ${contentError.message}`);
    }
    
    console.log('Browser automation completed successfully');
    log.info('Browser automation completed successfully');
      // Create screenshots directory if it doesn't exist
    const screenshotDir = path.join(__dirname, 'screenshots');
    if (!fs.existsSync(screenshotDir)) {
      fs.mkdirSync(screenshotDir, { recursive: true });
      log.info(`Created screenshots directory: ${screenshotDir}`);
    }    // Get information about the screenshots we took
    const screenshots = [];
    // Use the existing screenshotDir variable
    const examplePath = path.join(screenshotDir, 'example.png');
    const foundryPath = path.join(screenshotDir, 'foundry_page.png');
    const openaiPath = path.join(screenshotDir, 'openai_pricing.png');
    
    if (fs.existsSync(examplePath)) {
      screenshots.push(examplePath);
    }
    if (fs.existsSync(foundryPath)) {
      screenshots.push(foundryPath);
    }
    if (fs.existsSync(openaiPath)) {
      screenshots.push(openaiPath);
    }
    
    return {
      success: true,
      message: 'Browser automation completed successfully',
      screenshots: screenshots,
      contentAnalyzed: contentAnalyzed,
      usingMcp: !!mcpClient
    };
  } catch (error) {
    console.error(`Error in browser automation: ${error.message}`);
    log.error(`Error in browser automation: ${error.message}`);
    
    // Make sure to clean up resources
    try {
      await stopBrowserAutomation();
    } catch (cleanupError) {
      console.error(`Error during cleanup: ${cleanupError.message}`);
      log.error(`Error during cleanup: ${cleanupError.message}`);
    }
    
    return { 
      success: false, 
      error: error.message,
      stack: error.stack
    };
  }
}

/**
 * Process a natural language prompt using Playwright MCP
 * @param {string} prompt The natural language prompt to process
 * @param {Object} options Additional options
 * @returns {Promise<Object>} Result with success status and screenshots
 */
async function processMcpPrompt(prompt, options = {}) {
  try {
    log.info(`Processing MCP prompt: "${prompt}"`);
    console.log(`Processing MCP prompt: "${prompt}"`);
      // Make sure we have a browser and MCP client
    if (!browser || !mcpClient) {
      log.info('Browser or MCP client not initialized, launching browser...');
      
      // Launch browser directly instead of using startBrowserAutomation to avoid demo
      browser = await chromium.launch({
        headless: options.headless !== undefined ? options.headless : false,
        slowMo: options.slowMo || 30,
        timeout: options.timeout || 60000,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
      
      try {
        // Initialize MCP client with dynamic import for ES Module
        const { PlaywrightMcp } = await import('@playwright/mcp');
        
        mcpClient = new PlaywrightMcp({
          name: "Microsoft Foundry Browser Automation",
          version: "1.0.0"
        });
        
        // Register browser with MCP
        await mcpClient.register(browser);
        log.info('Successfully registered browser with MCP');      } catch (mcpError) {
        log.warn(`MCP registration failed: ${mcpError.message}`);
        console.warn(`MCP registration failed: ${mcpError.message}`);
        console.log('Using fallback implementation instead');
        
        // Use fallback implementation without MCP
        return await processFallbackPrompt(prompt, options);
      }
    }
    
    log.info('Sending prompt to MCP...');
    console.log('Sending prompt to MCP...');
    
    // Process the prompt with MCP
    try {
      const mcpResult = await mcpClient.runPrompt({
        prompt,
        options: {
          timeout: options.timeout || 120000,
          // Additional MCP-specific options can be added here
          screenshotOnFailure: true,
          detailedOutput: true
        }
      });
      return processSuccessfulMcpResult(mcpResult);
    } catch (mcpError) {
      log.error(`Error in MCP prompt execution: ${mcpError.message}`);
      console.error(`Error in MCP prompt execution: ${mcpError.message}`);
      return {
        success: false,
        error: `MCP prompt execution failed: ${mcpError.message}`,
        stack: mcpError.stack
      };
    }
    
    log.info('MCP prompt processing completed');
    console.log('MCP prompt processing completed');
    
    // Collect and process screenshots taken during the MCP execution
    const screenshots = [];
    if (mcpResult.artifacts && mcpResult.artifacts.screenshots) {
      for (const [index, screenshot] of mcpResult.artifacts.screenshots.entries()) {
        // Save the screenshot to disk
        const screenshotPath = path.join(__dirname, `mcp_screenshot_${index}.png`);
        fs.writeFileSync(screenshotPath, Buffer.from(screenshot, 'base64'));
        log.info(`Saved MCP screenshot to ${screenshotPath}`);
        screenshots.push(screenshotPath);
      }
    }
    
    return {
      success: true,
      message: 'MCP prompt processed successfully',
      result: mcpResult.result || {},
      output: mcpResult.output || [],
      screenshots: screenshots,
      usingMcp: true
    };  } catch (error) {
    log.error(`Error processing MCP prompt: ${error.message}`);
    console.error(`Error processing MCP prompt: ${error.message}`);
    
    try {
      // Try fallback as a last resort if we haven't already
      if (error.message.includes("MCP") || error.message.includes("Playwright")) {
        log.info("Attempting to use fallback implementation after MCP failure");
        return await processFallbackPrompt(prompt, options);
      }
    } catch (fallbackError) {
      log.error(`Fallback also failed: ${fallbackError.message}`);
    }
    
    return {
      success: false,
      error: error.message,
      stack: error.stack
    };
  }
}

/**
 * Process a successful MCP result
 * @param {Object} mcpResult - The result from a successful MCP prompt execution
 * @returns {Object} - Processed result with screenshots and other output
 */
function processSuccessfulMcpResult(mcpResult) {
  log.info('MCP prompt processing completed');
  console.log('MCP prompt processing completed');
  
  // Collect and process screenshots taken during the MCP execution
  const screenshots = [];
  if (mcpResult.artifacts && mcpResult.artifacts.screenshots) {
    for (const [index, screenshot] of mcpResult.artifacts.screenshots.entries()) {
      // Save the screenshot to disk
      const screenshotPath = path.join(__dirname, `mcp_screenshot_${index}.png`);
      fs.writeFileSync(screenshotPath, Buffer.from(screenshot, 'base64'));
      log.info(`Saved MCP screenshot to ${screenshotPath}`);
      screenshots.push(screenshotPath);
    }
  }
  
  return {
    success: true,
    message: 'MCP prompt processed successfully',
    result: mcpResult.result || {},
    output: mcpResult.output || [],
    screenshots: screenshots,
    usingMcp: true
  };
}

/**
 * Stop browser automation and clean up resources
 * @returns {Promise<Object>} Result with success status
 */
async function stopBrowserAutomation() {
  try {
    log.info('Stopping browser automation...');
    
    // Close page if it's open
    if (currentPage) {
      try {
        await currentPage.close();
        log.info('Page closed successfully');
      } catch (pageError) {
        log.warn(`Error closing page: ${pageError.message}`);
      } finally {
        currentPage = null;
      }
    }
    
    // Close browser if it's open
    if (browser) {
      try {
        await browser.close();
        log.info('Browser closed successfully');
      } catch (browserError) {
        log.warn(`Error closing browser: ${browserError.message}`);
      } finally {
        browser = null;
      }
    }
    
    // Dispose MCP client if it's initialized
    if (mcpClient) {
      try {
        await mcpClient.dispose();
        log.info('MCP client disposed successfully');
      } catch (mcpError) {
        log.warn(`Error disposing MCP client: ${mcpError.message}`);
      } finally {
        mcpClient = null;
      }
    }
    
    return { success: true };
  } catch (error) {
    log.error(`Error stopping browser automation: ${error.message}`);
    // Reset resources even if there's an error
    currentPage = null;
    browser = null;
    mcpClient = null;
    return { success: false, error: error.message };
  }
}

module.exports = {
  startBrowserAutomation,
  stopBrowserAutomation,
  processMcpPrompt
};