const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const log = require('electron-log');
const aiPrompt = require('./ai-prompt');
const os = require('os');
const fs = require('fs');

// Dynamically import browser-automation module
let browserAutomation;
(async function loadBrowserAutomation() {
  try {
    browserAutomation = require('./browser-automation');
    log.info('Browser automation module loaded successfully');
  } catch (error) {
    log.error(`Error loading browser automation module: ${error.message}`);
    console.error(`Error loading browser automation module: ${error.message}`);
  }
})();

// Configure logging
log.transports.file.level = 'info';
log.transports.console.level = 'info';
log.info('Application starting...');
log.info(`Running on: ${os.platform()} ${os.release()}`);
log.info(`Node.js version: ${process.version}`);

// Check if Foundry is properly configured
async function checkFoundryStatus() {
  try {
    const isRunning = await aiPrompt.isFoundryRunning();
    if (!isRunning) {
      log.warn('Foundry Local is not running. Some features may not work correctly.');
    } else {
      log.info('Foundry Local status check: running');
    }
    return isRunning;
  } catch (error) {
    log.error(`Error checking Foundry status: ${error.message}`);
    return false;
  }
}

// Keep a global reference of the window object
let mainWindow;

function createWindow() {
  // Create the browser window
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true
    },
    title: 'Foundry Local with Browser Automation',
    icon: path.join(__dirname, 'icon.ico'),
    show: false, // Don't show window until it's ready
    backgroundColor: '#f9fafb'
  });

  // Create a loading screen
  const loadingScreen = new BrowserWindow({
    width: 400,
    height: 300,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    },
    backgroundColor: '#00000000'
  });

  // Load the splash screen HTML
  try {
    loadingScreen.loadFile('splash.html');
    loadingScreen.center();
    loadingScreen.show();
  } catch (error) {
    log.error(`Error loading splash screen: ${error.message}`);
    // Continue without splash if there's an error
    loadingScreen.close();
    mainWindow.show();
  }

  // Load the index.html file
  mainWindow.loadFile('index.html');
  
  // Once the main window is ready, show it and close the loading screen
  mainWindow.once('ready-to-show', () => {
    // Delay slightly for a smoother transition
    setTimeout(() => {
      mainWindow.show();
      
      // Close the loading screen after a short delay
      setTimeout(() => {
        if (loadingScreen && !loadingScreen.isDestroyed()) {
          loadingScreen.close();
        }
      }, 500);
    }, 800);
  });
  
  // Open DevTools in development
  if (process.env.NODE_ENV === 'development') {
    mainWindow.webContents.openDevTools();
    log.info('DevTools opened (development mode)');
  }

  // Handle window close
  mainWindow.on('closed', () => {
    mainWindow = null;
    if (browserAutomation) {
      browserAutomation.stopBrowserAutomation().catch(err => {
        log.error(`Error stopping browser automation on window close: ${err.message}`);
      });
    }
  });
  
  // Check Foundry status when window is ready
  mainWindow.webContents.on('did-finish-load', async () => {
    const foundryRunning = await checkFoundryStatus();
    mainWindow.webContents.send('foundry-status', { running: foundryRunning });
    
    if (!foundryRunning) {
      mainWindow.webContents.send('browser-error', 
        'Foundry Local is not running. Please start it to use AI features.');
    }
  });
  
  log.info('Main window created');
}

// Ensure screenshots directory exists
function ensureScreenshotsDir() {
  const screenshotDir = path.join(__dirname, 'screenshots');
  if (!fs.existsSync(screenshotDir)) {
    try {
      fs.mkdirSync(screenshotDir, { recursive: true });
      log.info(`Created screenshots directory: ${screenshotDir}`);
    } catch (err) {
      log.error(`Error creating screenshots directory: ${err.message}`);
    }
  }
  return screenshotDir;
}

// Improve screenshot handling
function processScreenshotForUI(screenshotPath) {
  if (!screenshotPath) return null;
  
  try {
    // Create a relative path for the UI
    const relativePath = path.relative(__dirname, screenshotPath)
      .replace(/\\/g, '/'); // Convert Windows backslashes to forward slashes
      
    return relativePath;
  } catch (error) {
    log.error(`Error processing screenshot path: ${error.message}`);
    return screenshotPath; // Fall back to the original path
  }
}

// Utility function to send log messages to the renderer
function sendLogToRenderer(message, isError = false) {
  if (mainWindow) {
    if (isError) {
      mainWindow.webContents.send('browser-error', message);
    } else {
      mainWindow.webContents.send('browser-output', message);
    }
  }
}

// Enhance browser automation result handling
function sendAutomationResultToRenderer(result) {
  if (!mainWindow) return;
  
  // Process screenshots for display
  let screenshotForDisplay = null;
  if (result.success && result.screenshots && result.screenshots.length > 0) {
    screenshotForDisplay = processScreenshotForUI(result.screenshots[0]);
  }
  
  // Prepare a UI-friendly result object
  const uiResult = {
    success: result.success,
    message: result.success 
      ? `Browser automation completed successfully${result.usingMcp ? ' with MCP' : ''}`
      : `Browser automation failed: ${result.error || 'Unknown error'}`,
    screenshot: screenshotForDisplay,
    details: {
      output: result.output || [],
      screenshots: result.screenshots || [],
      timing: result.timing || {}
    }
  };
  
  // Send to renderer
  mainWindow.webContents.send('automation-result', uiResult);
}

// IPC handlers
ipcMain.handle('check-foundry-status', async () => {
  const isRunning = await checkFoundryStatus();
  return { running: isRunning };
});

ipcMain.handle('start-browser-automation', async (event, options) => {
  try {
    log.info('Handling start-browser-automation request...');
    
    // Check if browser automation module is loaded
    if (!browserAutomation) {
      const error = 'Browser automation module is not loaded properly. Please restart the application.';
      log.error(error);
      if (mainWindow) {
        mainWindow.webContents.send('browser-error', error);
      }
      return { success: false, error: error };
    }
    
    // Use the JavaScript browser automation module with improved error handling
    try {
      sendLogToRenderer('Starting browser automation with Playwright MCP...');
      const result = await browserAutomation.startBrowserAutomation({
        ...options,
        timeout: 60000,  // Add a generous timeout
        headless: options.headless !== undefined ? options.headless : false
      });
      
      // Send detailed log data to renderer to show in UI
      sendAutomationResultToRenderer(result);
      
      return result;
    } catch (error) {
      log.error('Critical error in browser automation:', error);
      if (mainWindow) {
        mainWindow.webContents.send('browser-error', `Critical error: ${error.message}`);
      }
      return { success: false, error: error.message };
    }
  } catch (error) {
    log.error(`Error in start-browser-automation: ${error.message}`);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('stop-browser-automation', async (event) => {
  try {
    // Check if browser automation module is loaded
    if (!browserAutomation) {
      const error = 'Browser automation module is not loaded properly. Please restart the application.';
      log.error(error);
      if (mainWindow) {
        mainWindow.webContents.send('browser-error', error);
      }
      return { success: false, error: error };
    }
    
    // Use the JavaScript browser automation module to stop browser automation
    const result = await browserAutomation.stopBrowserAutomation();
    
    if (mainWindow) {
      mainWindow.webContents.send('browser-output', 'Browser automation stopped');
    }
    
    return result;
  } catch (error) {
    log.error(`Error in stop-browser-automation: ${error.message}`);
    return { success: false, error: error.message };
  }
});

// Handle AI prompt processing
ipcMain.handle('send-prompt-to-ai', async (event, { model, prompt }) => {
  try {
    // Check if Foundry is running first
    const foundryRunning = await checkFoundryStatus();
    if (!foundryRunning) {
      return { 
        success: false, 
        error: 'Foundry Local is not running. Please start the service first.' 
      };
    }
    
    log.info(`Handling AI prompt request for model: ${model}`);
    sendLogToRenderer(`Processing prompt with ${model}...`);
    
    // Use our AI prompt module
    const result = await aiPrompt.processPrompt({ model, prompt });
    
    // Send log to the renderer
    if (result.success) {
      log.info('AI prompt processed successfully');
      sendLogToRenderer(`AI response received (${result.result.length} characters)`);
    } else {
      log.error(`Error processing prompt: ${result.error}`);
      sendLogToRenderer(`Error processing prompt: ${result.error}`, true);
    }
    
    return result;
  } catch (error) {
    log.error(`Error in send-prompt-to-ai: ${error.message}`);
    sendLogToRenderer(`Error in send-prompt-to-ai: ${error.message}`, true);
    return { success: false, error: error.message };
  }
});

// Handle MCP browser automation prompts
ipcMain.handle('process-mcp-prompt', async (event, { prompt, options = {} }) => {
  try {
    log.info(`Handling process-mcp-prompt request: "${prompt}"`);
    
    // Check if browser automation module is loaded
    if (!browserAutomation) {
      const error = 'Browser automation module is not loaded properly. Please restart the application.';
      log.error(error);
      sendLogToRenderer(error, true);
      return { success: false, error: error };
    }
    
    // Send log to renderer
    sendLogToRenderer('Processing browser automation prompt with Playwright MCP...');
    
    // Process the MCP prompt
    const result = await browserAutomation.processMcpPrompt(prompt, {
      headless: options.headless !== undefined ? options.headless : false,
      slowMo: options.slowMo || 50,
      timeout: options.timeout || 120000
    });
    
    // Send detailed log data to renderer
    if (result.success) {
      sendLogToRenderer(`MCP prompt processed successfully: "${prompt}"`);
      
      // Log output from MCP if available
      if (result.output && result.output.length > 0) {
        for (const outputItem of result.output) {
          sendLogToRenderer(outputItem);
        }
      }
      
      // Log screenshots if available
      if (result.screenshots && result.screenshots.length > 0) {
        sendLogToRenderer(`Screenshots saved: ${result.screenshots.join(', ')}`);
      }
    } else {
      sendLogToRenderer(`MCP prompt processing failed: ${result.error}`, true);
    }
    
    // Send automation result to renderer
    sendAutomationResultToRenderer(result);
    
    return result;
  } catch (error) {
    log.error(`Error in process-mcp-prompt: ${error.message}`);
    sendLogToRenderer(`MCP prompt error: ${error.message}`, true);
    
    const errorResult = { success: false, error: error.message };
    sendAutomationResultToRenderer(errorResult);
    return errorResult;
  }
});

// Handle MCP test execution
ipcMain.handle('run-mcp-test', async (event) => {
  try {
    log.info('Handling run-mcp-test request...');
    sendLogToRenderer('Running MCP test...');
    
    // First check if the @playwright/mcp module is available
    try {
      await import('@playwright/mcp');
      log.info('Successfully imported @playwright/mcp for testing');
    } catch (importError) {
      log.error(`Error importing @playwright/mcp: ${importError.message}`);
      sendLogToRenderer(`Error: The @playwright/mcp module is not available. Using fallback implementation.`);
      
      // Use fallback implementation
      const { processFallbackPrompt } = require('./fallback-mcp');
      const result = await processFallbackPrompt('Go to example.com and take a screenshot', { headless: false });
      
      if (result.success && result.screenshots && result.screenshots.length > 0) {
        sendLogToRenderer(`Fallback test completed successfully. Screenshot saved to: ${result.screenshots[0]}`);
        
        // Send formatted result to renderer
        const uiResult = {
          success: true,
          message: 'Fallback test completed successfully (MCP not available)',
          screenshot: processScreenshotForUI(result.screenshots[0]),
          details: { 
            output: result.output || [],
            screenshots: result.screenshots || [],
            fallback: true
          }
        };
        
        if (mainWindow) {
          mainWindow.webContents.send('mcp-test-result', uiResult);
        }
        
        return uiResult;
      } else {
        const errorResult = { 
          success: false, 
          error: `Fallback test failed: ${result.error || 'Unknown error'}` 
        };
        
        if (mainWindow) {
          mainWindow.webContents.send('mcp-test-result', errorResult);
        }
        
        return errorResult;
      }
    }
    
    // Load the MCP test module and run a test
    try {
      // Use the mcp-test from tests directory if it exists
      const testPath = fs.existsSync(path.join(__dirname, 'tests', 'mcp-test.js')) 
        ? path.join(__dirname, 'tests', 'mcp-test.js')
        : path.join(__dirname, 'mcp-test.js');
      
      sendLogToRenderer(`Running MCP test from ${testPath}...`);
      const mcpTest = require(testPath);
      
      // Run the test
      await mcpTest.runAllTests();
      
      // Get the screenshot path
      const screenshotPath = path.join(__dirname, 'tests', 'screenshots', 'example_com.png');
      const fallbackScreenshotPath = path.join(__dirname, 'screenshots', 'example_com.png');
      
      let finalScreenshotPath = null;
      if (fs.existsSync(screenshotPath)) {
        finalScreenshotPath = screenshotPath;
      } else if (fs.existsSync(fallbackScreenshotPath)) {
        finalScreenshotPath = fallbackScreenshotPath;
      }
      
      // Create success result
      const result = {
        success: true,
        message: 'MCP test completed successfully',
        screenshot: finalScreenshotPath ? processScreenshotForUI(finalScreenshotPath) : null,
        details: {
          output: ['Test passed: Simple Navigation'],
          testLocation: testPath
        }
      };
      
      sendLogToRenderer(`MCP test completed successfully. Screenshot saved to: ${finalScreenshotPath || 'N/A'}`);
      
      if (mainWindow) {
        mainWindow.webContents.send('mcp-test-result', result);
      }
      
      return result;
    } catch (testError) {
      log.error(`Error running MCP test: ${testError.message}`);
      sendLogToRenderer(`Error running MCP test: ${testError.message}`, true);
      
      const errorResult = {
        success: false,
        error: `MCP test failed: ${testError.message}`,
        details: { stack: testError.stack }
      };
      
      if (mainWindow) {
        mainWindow.webContents.send('mcp-test-result', errorResult);
      }
      
      return errorResult;
    }
  } catch (error) {
    log.error(`Error in run-mcp-test: ${error.message}`);
    sendLogToRenderer(`Error in run-mcp-test: ${error.message}`, true);
    
    const errorResult = { success: false, error: error.message };
    
    if (mainWindow) {
      mainWindow.webContents.send('mcp-test-result', errorResult);
    }
    
    return errorResult;
  }
});

// Handle MCP diagnostics
ipcMain.handle('diagnose-mcp', async (event) => {
  try {
    log.info('Running MCP diagnostics...');
    
    // Check if the find-mcp.js module exists
    const diagnosticsPath = path.join(__dirname, 'find-mcp.js');
    if (!fs.existsSync(diagnosticsPath)) {
      log.error('Diagnostics module not found');
      return {
        success: false,
        error: 'Diagnostics module not found'
      };
    }
    
    // Run the diagnostics in a child process to capture all output
    return new Promise((resolve) => {
      const diagnosticOutput = [];
      const child = require('child_process').spawn('node', [diagnosticsPath], {
        cwd: __dirname,
        env: process.env
      });
      
      child.stdout.on('data', (data) => {
        const output = data.toString().trim();
        if (output) {
          log.info(`MCP Diagnostic: ${output}`);
          sendLogToRenderer(`MCP Diagnostic: ${output}`);
          diagnosticOutput.push(output);
        }
      });
      
      child.stderr.on('data', (data) => {
        const output = data.toString().trim();
        if (output) {
          log.error(`MCP Diagnostic Error: ${output}`);
          sendLogToRenderer(`MCP Diagnostic Error: ${output}`, true);
          diagnosticOutput.push(`Error: ${output}`);
        }
      });
      
      child.on('close', (code) => {
        log.info(`MCP diagnostics process exited with code ${code}`);
        
        // Parse diagnostic output to check if module exists
        const moduleExists = diagnosticOutput.some(line => line.includes('directory exists: Yes'));
        const versionLine = diagnosticOutput.find(line => line.includes('version:'));
        const version = versionLine ? versionLine.split('version:')[1].trim() : 'unknown';
        
        // Extract recommendations
        const recommendationsIndex = diagnosticOutput.findIndex(line => line.includes('Recommendations:'));
        const recommendations = recommendationsIndex >= 0 
          ? diagnosticOutput.slice(recommendationsIndex + 1)
              .filter(line => line.trim().startsWith(new RegExp(/\d\./)))
          : [];
              
        resolve({
          success: true,
          moduleExists,
          version,
          diagnostics: diagnosticOutput,
          recommendations,
          exitCode: code
        });
      });
    });
  } catch (error) {
    log.error(`Error running MCP diagnostics: ${error.message}`);
    if (mainWindow) {
      mainWindow.webContents.send('browser-error', `MCP diagnostics error: ${error.message}`);
    }
    return { success: false, error: error.message };
  }
});

// App events
app.whenReady().then(() => {
  createWindow();
  
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('will-quit', () => {
  if (browserAutomation) {
    browserAutomation.stopBrowserAutomation().catch(err => {
      log.error(`Error stopping browser automation on app quit: ${err.message}`);
    });
  }
});
