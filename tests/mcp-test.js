/**
 * MCP Test Suite
 * 
 * This file contains tests for the Playwright MCP browser automation functionality.
 * It tests the natural language browser control features using @playwright/mcp
 */

// Note: Using dynamic import for ESM compatibility
const { chromium } = require('playwright');
const assert = require('assert');
const path = require('path');
const fs = require('fs');

// Configuration
const TEST_TIMEOUT = 60000; // 60 seconds
const SCREENSHOTS_DIR = path.join(__dirname, 'screenshots');

// Ensure screenshots directory exists
if (!fs.existsSync(SCREENSHOTS_DIR)) {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
}

// Test utility functions
async function createMcpClient() {
  try {
    // Dynamic import for ES Module compatibility
    const { PlaywrightMcp } = await import('@playwright/mcp');
    const mcpClient = new PlaywrightMcp({
      name: 'MCP Test Client',
      version: '1.0.0'
    });
    return mcpClient;
  } catch (error) {
    console.error(`Error creating MCP client: ${error.message}`);
    throw error;
  }
}

/**
 * Run a test with proper setup and teardown
 */
async function runTest(testName, testFn) {
  console.log(`\n🔍 Running test: ${testName}`);
  
  // Setup
  const browser = await chromium.launch({ 
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const mcpClient = await createMcpClient();
  await mcpClient.register(browser);
  
  try {
    // Run the test
    await testFn(browser, mcpClient);
    console.log(`✅ Test passed: ${testName}`);
  } catch (error) {
    console.error(`❌ Test failed: ${testName}`);
    console.error(`   Error: ${error.message}`);
    throw error;
  } finally {
    // Cleanup
    await mcpClient.dispose().catch(err => console.warn(`MCP disposal error: ${err.message}`));
    await browser.close().catch(err => console.warn(`Browser close error: ${err.message}`));
  }
}

// Tests
async function testSimpleNavigation(browser, mcpClient) {
  // Test a simple navigation command
  const result = await mcpClient.runPrompt({
    prompt: 'Go to example.com and take a screenshot',
    options: { timeout: TEST_TIMEOUT }
  });
  
  assert(result.artifacts.screenshots.length > 0, 'Expected at least one screenshot');
  
  // Save the screenshot
  const screenshotPath = path.join(SCREENSHOTS_DIR, 'example_com.png');
  fs.writeFileSync(screenshotPath, Buffer.from(result.artifacts.screenshots[0], 'base64'));
  
  console.log(`  - Screenshot saved to: ${screenshotPath}`);
  console.log(`  - MCP output: ${result.output.join(', ')}`);
}

// Run all tests
async function runAllTests() {
  try {
    await runTest('Simple Navigation', testSimpleNavigation);
    console.log('\n✅ All tests passed!');
  } catch (error) {
    console.error('\n❌ Some tests failed');
    process.exit(1);
  }
}

// Run tests if this script is called directly
if (require.main === module) {
  runAllTests().catch(console.error);
}

module.exports = {
  runAllTests,
  testSimpleNavigation
};
