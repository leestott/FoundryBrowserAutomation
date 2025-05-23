/**
 * Fallback MCP Implementation
 * This provides basic browser automation using Playwright when MCP is not available
 */

const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const log = require('electron-log');

/**
 * Process a browser automation prompt using standard Playwright
 * @param {string} prompt - The natural language prompt (interpreted simply)
 * @param {Object} options - Configuration options
 * @returns {Promise<Object>} - Result object with screenshots and status
 */
async function processFallbackPrompt(prompt, options = {}) {
    log.info(`Processing prompt without MCP: "${prompt}"`);
    console.log(`Processing prompt without MCP: "${prompt}"`);
    
    const browser = await chromium.launch({
        headless: options.headless !== undefined ? options.headless : false,
        slowMo: options.slowMo || 50
    });
    
    try {
        // Create a new browser context and page
        const context = await browser.newContext({
            viewport: { width: 1280, height: 720 }
        });
        const page = await context.newPage();
        
        // Simple keyword-based handling of the prompt
        const screenshots = [];
        const output = [];
        
        // Process basic navigation commands
        if (prompt.match(/go to|visit|open|navigate to/i)) {
            // Extract URL - look for a domain or website reference
            const urlMatch = prompt.match(/(?:go to|visit|open|navigate to)\s+(?:https?:\/\/)?([a-zA-Z0-9-]+\.[a-zA-Z0-9-]+\.[a-zA-Z]{2,}|[a-zA-Z0-9-]+\.[a-zA-Z]{2,})/i);
            
            if (urlMatch) {
                const extractedDomain = urlMatch[1];
                const url = extractedDomain.startsWith('http') ? extractedDomain : `https://${extractedDomain}`;
                
                log.info(`Navigating to: ${url}`);
                output.push(`Navigating to: ${url}`);
                
                await page.goto(url, { waitUntil: 'domcontentloaded', timeout: options.timeout || 60000 });
                output.push(`Successfully loaded: ${url}`);
            } else {
                output.push("Could not determine which website to navigate to");
                return { success: false, error: "Could not determine which website to navigate to", output };
            }
        } else {
            // Default to example.com if no clear navigation intent
            await page.goto('https://example.com', { waitUntil: 'domcontentloaded' });
            output.push("No clear navigation command found. Navigated to example.com as fallback.");
        }
          // Take a screenshot
        if (prompt.match(/screenshot|capture|image/i) || true) { // Always take a screenshot
            // Ensure screenshots directory exists
            const screenshotDir = path.join(__dirname, 'screenshots');
            if (!fs.existsSync(screenshotDir)) {
                fs.mkdirSync(screenshotDir, { recursive: true });
            }
            const screenshotPath = path.join(screenshotDir, 'fallback_screenshot.png');
            await page.screenshot({ path: screenshotPath, fullPage: true });
            
            output.push(`Screenshot captured: ${screenshotPath}`);
            screenshots.push(screenshotPath);
        }
        
        return {
            success: true,
            message: 'Fallback browser automation completed',
            output,
            screenshots,
            usingMcp: false
        };
        
    } catch (error) {
        log.error(`Fallback automation error: ${error.message}`);
        return {
            success: false,
            error: `Fallback automation failed: ${error.message}`,
            stack: error.stack
        };
    } finally {
        await browser.close().catch(err => {
            log.warn(`Error closing browser: ${err.message}`);
        });
    }
}

module.exports = { processFallbackPrompt };