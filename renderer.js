// DOM Elements
const modelSelect = document.getElementById('model-select');
const promptInput = document.getElementById('prompt-input');
const submitPromptButton = document.getElementById('submit-prompt');
const aiResponse = document.getElementById('ai-response');
const startAutomationButton = document.getElementById('start-automation');
const stopAutomationButton = document.getElementById('stop-automation');
const mcpPromptInput = document.getElementById('mcp-prompt-input');
const submitMcpPromptButton = document.getElementById('submit-mcp-prompt');
const runMcpTestButton = document.getElementById('run-mcp-test');
const diagnoseMcpButton = document.getElementById('diagnose-mcp');
const logOutput = document.getElementById('log-output');
const clearLogsButton = document.getElementById('clear-logs');
const foundryStatusText = document.getElementById('foundry-status-text');
const tabButtons = document.querySelectorAll('.tab');
const tabContents = document.querySelectorAll('.tab-content');
const screenshotContainer = document.getElementById('screenshot-container');
const screenshot = document.getElementById('screenshot');
const automationResults = document.getElementById('automation-results');

// State variables
let isProcessing = false;
let isAutomationRunning = false;
let isFoundryRunning = false;
let darkModeEnabled = window.matchMedia('(prefers-color-scheme: dark)').matches;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  // Initialize UI state
  stopAutomationButton.disabled = true;
  submitMcpPromptButton.disabled = false;
  runMcpTestButton.disabled = false;
  diagnoseMcpButton.disabled = false;
  
  // Add event listeners
  modelSelect.addEventListener('change', handleModelChange);
  submitPromptButton.addEventListener('click', handlePromptSubmission);
  startAutomationButton.addEventListener('click', startBrowserAutomation);
  stopAutomationButton.addEventListener('click', stopBrowserAutomation);
  submitMcpPromptButton.addEventListener('click', handleMcpPromptSubmission);
  runMcpTestButton.addEventListener('click', handleMcpTest);
  diagnoseMcpButton.addEventListener('click', handleMcpDiagnose);
  clearLogsButton.addEventListener('click', clearLogs);
  
  // Tab navigation
  tabButtons.forEach(button => {
    button.addEventListener('click', () => {
      // Remove active class from all tabs and contents
      tabButtons.forEach(btn => btn.classList.remove('active'));
      tabContents.forEach(content => content.classList.remove('active'));
      
      // Add active class to clicked tab and corresponding content
      button.classList.add('active');
      const tabId = button.getAttribute('data-tab');
      document.getElementById(tabId).classList.add('active');
    });
  });
  
  // Check for dark mode preference
  if (darkModeEnabled) {
    document.body.classList.add('dark-mode');
  }
  
  // Listen for system dark mode changes
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', event => {
    darkModeEnabled = event.matches;
    if (darkModeEnabled) {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
  });
  
  // Setup IPC listeners
  setupIpcListeners();
  
  // Check Foundry status
  checkFoundryStatus();
  
  // Log initial state
  log('Application initialized and ready');
});

// Tab navigation
function setActiveTab(tabId) {
  // Remove active class from all tabs and contents
  tabButtons.forEach(btn => btn.classList.remove('active'));
  tabContents.forEach(content => content.classList.remove('active'));
  
  // Add active class to the specified tab and content
  const tabButton = document.querySelector(`.tab[data-tab="${tabId}"]`);
  if (tabButton) {
    tabButton.classList.add('active');
    document.getElementById(tabId).classList.add('active');
  }
}

// Clear logs
function clearLogs() {
  logOutput.innerHTML = '<p class="placeholder">Log output cleared</p>';
  setTimeout(() => {
    logOutput.querySelector('.placeholder').textContent = 'Log output will appear here...';
  }, 2000);
}

// Check Foundry Local status
async function checkFoundryStatus() {
  try {
    const result = await window.electronAPI.checkFoundryStatus();
    isFoundryRunning = result.running;
    
    if (isFoundryRunning) {
      log('✅ Foundry Local is running', 'success');
      document.body.classList.add('foundry-connected');
      document.body.classList.remove('foundry-disconnected');
      updateFoundryStatusIndicator(true);
    } else {
      log('❌ Foundry Local is not running. AI features will not work', 'error');
      document.body.classList.add('foundry-disconnected');
      document.body.classList.remove('foundry-connected');
      updateFoundryStatusIndicator(false);
    }
    
    // Update UI based on Foundry status
    submitPromptButton.disabled = !isFoundryRunning;
    if (!isFoundryRunning) {
      aiResponse.innerHTML = `
        <div class="error-message">
          <h3>Foundry Local Not Running</h3>
          <p>Please start Foundry Local to use AI features.</p>
          <p>The browser automation features will still work without Foundry.</p>
        </div>
      `;
    }
  } catch (error) {
    log(`Error checking Foundry status: ${error.message}`, 'error');
  }
}

// Update status indicator in the UI
function updateFoundryStatusIndicator(isRunning) {
  const statusIndicator = document.getElementById('foundry-status-indicator');
  const statusText = document.getElementById('foundry-status-text');
  
  if (statusIndicator) {
    statusIndicator.className = isRunning ? 'status-online' : 'status-offline';
    statusIndicator.title = isRunning ? 'Foundry Local Connected' : 'Foundry Local Disconnected';
  }
  
  if (statusText) {
    statusText.textContent = isRunning ? 'Connected' : 'Offline';
    statusText.style.color = isRunning ? '#107c10' : '#d13438';
  }
}

// Model Selection
function handleModelChange() {
  const selectedModel = modelSelect.value;
  log(`Selected model: ${selectedModel}`, 'info');
}

// Update UI when processing starts
function updateUIProcessingState(processing) {
  isProcessing = processing;
  
  if (processing) {
    submitPromptButton.disabled = true;
    submitPromptButton.innerHTML = '<span class="loading-spinner"></span> Processing...';
  } else {
    submitPromptButton.disabled = false;
    submitPromptButton.textContent = 'Submit';
  }
}

// Update UI when automation is running
function updateUIAutomationState(running) {
  isAutomationRunning = running;
  
  if (running) {
    document.body.classList.add('automation-running');
    startAutomationButton.disabled = true;
    stopAutomationButton.disabled = false;
    submitMcpPromptButton.disabled = true;
    runMcpTestButton.disabled = true;
  } else {
    document.body.classList.remove('automation-running');
    startAutomationButton.disabled = false;
    stopAutomationButton.disabled = true;
    submitMcpPromptButton.disabled = false;
    runMcpTestButton.disabled = false;
  }
}

// Display screenshot when available
function displayScreenshot(screenshotPath) {
  if (screenshotPath) {
    screenshot.src = screenshotPath;
    screenshotContainer.style.display = 'block';
  } else {
    screenshotContainer.style.display = 'none';
  }
}

// Update automation results
function updateAutomationResults(result) {
  if (!result) {
    automationResults.innerHTML = '';
    return;
  }
  
  let content = '<div class="automation-result">';
  
  if (result.success) {
    content += '<div class="success-message"><h4>✅ Automation Completed Successfully</h4>';
  } else {
    content += '<div class="error-message"><h4>❌ Automation Failed</h4>';
  }
  
  if (result.message) {
    content += `<p>${result.message}</p>`;
  }
  
  if (result.details) {
    content += `<pre>${JSON.stringify(result.details, null, 2)}</pre>`;
  }
  
  content += '</div></div>';
  
  automationResults.innerHTML = content;
  
  // Display screenshot if available
  if (result.screenshot) {
    displayScreenshot(result.screenshot);
  } else {
    screenshotContainer.style.display = 'none';
  }
}

// Prompt Submission
async function handlePromptSubmission() {
  if (isProcessing || !isFoundryRunning) return;
  
  const prompt = promptInput.value.trim();
  if (!prompt) {
    log('Please enter a prompt', 'error');
    return;
  }
  
  const selectedModel = modelSelect.value;
  
  try {
    setProcessingState(true);
    log(`Sending prompt to ${selectedModel}...`);
    aiResponse.innerHTML = '<p class="placeholder"><span class="loading-spinner"></span> Processing request...</p>';
    
    // Check Foundry status first
    await checkFoundryStatus();
    if (!isFoundryRunning) {
      log('Cannot process prompt: Foundry Local is not running', 'error');
      displayConnectionErrorHelp();
      setProcessingState(false);
      return;
    }
    
    // Send the prompt to the AI model via the main process
    const result = await window.electronAPI.sendPromptToAI(selectedModel, prompt);
    
    if (result.success) {
      displayAiResponse(result.result);
      log('Prompt processed successfully');
    } else {
      const errorMessage = result.error || 'Unknown error occurred';
      
      // Show a more user-friendly error in the UI
      if (errorMessage.includes('ECONNREFUSED') || 
          errorMessage.includes('Could not connect to Foundry Local') ||
          errorMessage.includes('Connection refused') ||
          errorMessage.includes('not running')) {
        
        log(`Connection Error: ${errorMessage}`, 'error');
        displayConnectionErrorHelp();
        
        // Update Foundry status
        isFoundryRunning = false;
        updateFoundryStatusIndicator(false);
      } else {
        log(`Error processing prompt: ${errorMessage}`, 'error');
        displayAiResponse(`Error: ${errorMessage}`);
      }
    }
    
    setProcessingState(false);
    
  } catch (error) {
    log(`Error: ${error.message}`, 'error');
    displayAiResponse(`Error: ${error.message}`);
    setProcessingState(false);
  }
}

// Display helpful information when a connection error occurs
function displayConnectionErrorHelp() {
  const helpText = `
    <div class="error-message">
      <h3>Connection Error</h3>
      <p>Could not connect to Foundry Local. This could be because:</p>
      <ul>
        <li>Microsoft Foundry Local is not running on your system</li>
        <li>The service is using a different port than expected (should be 5273)</li>
        <li>The service is still initializing</li>
      </ul>
      <p>Troubleshooting steps:</p>
      <ol>
        <li>Ensure that Microsoft Foundry Local is running on your system</li>
        <li>Check that the service is properly initialized</li>
        <li>Try restarting the application</li>
        <li>Check the Foundry Local logs</li>
      </ol>
    </div>
  `;
  
  aiResponse.innerHTML = helpText;
}

// Handle MCP prompt submission
// This function processes a natural language prompt for browser automation
async function handleMcpPromptSubmission() {
  if (isAutomationRunning) {
    log('Browser automation is already running. Please wait or stop it first.', 'warning');
    return;
  }
  
  try {
    const prompt = mcpPromptInput.value.trim();
    
    if (!prompt) {
      log('Please enter a browser automation prompt', 'warning');
      return;
    }
    
    // Update UI state
    setAutomationState(true);
    submitMcpPromptButton.textContent = 'Processing...';
    
    log(`Processing MCP prompt: "${prompt}"`, 'info');
    
    // Process the MCP prompt
    const result = await window.electronAPI.processMcpPrompt(prompt, {
      headless: false,
      showScreenshot: true
    });
    
    if (result.success) {
      log(`MCP prompt processed successfully`, 'success');
      
      // Show additional output if available
      if (result.output && result.output.length > 0) {
        result.output.forEach(item => {
          log(item, 'info');
        });
      }
      
      // Show screenshots if available
      if (result.screenshots && result.screenshots.length > 0) {
        log(`Screenshots saved: ${result.screenshots.join(', ')}`, 'success');
      }
    } else {
      log(`MCP prompt failed: ${result.error}`, 'error');
    }
  } catch (error) {
    log(`Error processing MCP prompt: ${error.message}`, 'error');
  } finally {
    // Reset UI state
    submitMcpPromptButton.textContent = 'Run MCP Prompt';
    setAutomationState(false);
  }
}

// Handle MCP test
async function handleMcpTest() {
  if (isAutomationRunning) {
    log('Browser automation is already running. Please wait or stop it first.', 'warning');
    return;
  }
  
  try {
    // Update UI state
    setAutomationState(true);
    runMcpTestButton.textContent = 'Running Test...';
    
    log('Running MCP test script...', 'info');
    
    // Run the MCP test through the main process
    const result = await window.electronAPI.runMcpTest();
    
    if (result.success) {
      if (result.message.includes('Fallback')) {
        log('MCP module not available - fallback test completed successfully', 'warning');
        log('Note: Some features may be limited. To use full MCP features, please check @playwright/mcp installation.', 'info');
      } else {
        log('MCP test completed successfully', 'success');
      }
      
      // Show additional output if available
      if (result.output && result.output.length > 0) {
        result.output.forEach(item => {
          log(item, 'info');
        });
      }
      
      // Show screenshots if available
      if (result.screenshot) {
        log(`Screenshot saved: ${result.screenshot}`, 'success');
      }
    } else {
      log(`MCP test failed: ${result.error}`, 'error');
      log('Tip: Try running "npm install @playwright/mcp@latest" to fix module issues', 'info');
    }
  } catch (error) {
    log(`Error running MCP test: ${error.message}`, 'error');
  } finally {
    // Reset UI state
    runMcpTestButton.textContent = 'Run MCP Test';
    setAutomationState(false);
  }
}

// Handle MCP diagnostics
async function handleMcpDiagnose() {
  try {
    diagnoseMcpButton.textContent = 'Running...';
    diagnoseMcpButton.disabled = true;
    
    log('Running MCP diagnostics...', 'info');
    
    const result = await window.electronAPI.diagnoseMcp();
    
    if (result.success) {
      log('MCP diagnostics completed', 'success');
      
      // Display results
      if (result.moduleExists) {
        log(`@playwright/mcp module exists (version ${result.version})`, 'success');
      } else {
        log('@playwright/mcp module not found!', 'error');
        log('Try running: npm install @playwright/mcp@latest', 'info');
      }
      
      // Show additional output if available
      if (result.diagnostics && result.diagnostics.length > 0) {
        log('--- MCP Diagnostic Results ---', 'info');
        result.diagnostics.forEach(item => {
          const type = item.includes('✅') ? 'success' :
                      item.includes('❌') ? 'error' : 'info';
          log(item, type);
        });
      }
      
      if (result.recommendations && result.recommendations.length > 0) {
        log('--- Recommendations ---', 'info');
        result.recommendations.forEach(item => {
          log(item, 'info');
        });
      }
    } else {
      log(`MCP diagnostic failed: ${result.error}`, 'error');
    }
  } catch (error) {
    log(`Error during MCP diagnostics: ${error.message}`, 'error');
  } finally {
    diagnoseMcpButton.textContent = 'Diagnose MCP';
    diagnoseMcpButton.disabled = false;
  }
}

// Browser Automation
async function startBrowserAutomation() {
  if (isAutomationRunning) return;
  
  try {
    log('Starting browser automation with MCP...');
    setAutomationState(true);
    
    const options = {
      model: modelSelect.value,
      headless: false,
      showScreenshot: true
    };
    
    const result = await window.electronAPI.startBrowserAutomation(options);
    
    if (result.success) {
      log(result.usingMcp ? 
        'Browser automation started successfully with MCP' : 
        'Browser automation started successfully (without MCP)'
      );
    } else {
      log(`Failed to start browser automation: ${result.error}`, 'error');
      setAutomationState(false);
    }
  } catch (error) {
    log(`Error: ${error.message}`, 'error');
    setAutomationState(false);
  }
}

async function stopBrowserAutomation() {
  if (!isAutomationRunning) return;
  
  try {
    log('Stopping browser automation...');
    
    const result = await window.electronAPI.stopBrowserAutomation();
    
    if (result.success) {
      log('Browser automation stopped successfully');
      setAutomationState(false);
    } else {
      log(`Failed to stop browser automation: ${result.error}`, 'error');
    }
  } catch (error) {
    log(`Error: ${error.message}`, 'error');
  }
}

// IPC Listeners
function setupIpcListeners() {
  // Browser automation output
  window.electronAPI.onBrowserOutput((data) => {
    log(`[Browser] ${data}`);
    // Switch to logs tab when automation starts
    setActiveTab('logs-tab');
  });
  
  // Browser automation errors
  window.electronAPI.onBrowserError((data) => {
    log(`[Browser Error] ${data}`, 'error');
    // Switch to logs tab when errors occur
    setActiveTab('logs-tab');
  });
  
  // Foundry status updates
  window.electronAPI.onFoundryStatus((status) => {
    isFoundryRunning = status.running;
    updateFoundryStatusIndicator(status.running);
    
    if (status.running) {
      log('Foundry Local connection detected', 'success');
      submitPromptButton.disabled = false;
    } else {
      log('Foundry Local connection lost', 'error');
      submitPromptButton.disabled = true;
    }
  });
  
  // Handle automation results with screenshots
  window.electronAPI.onAutomationResult((result) => {
    updateUIAutomationState(false);
    
    if (result.success) {
      log('Browser automation completed successfully', 'success');
    } else {
      log(`Browser automation failed: ${result.error || 'Unknown error'}`, 'error');
    }
    
    // Update the automation results in the UI
    updateAutomationResults(result);
    
    // Switch to browser tab to show results
    setActiveTab('browser-tab');
  });
  
  // Handle MCP test results
  window.electronAPI.onMcpTestResult((result) => {
    if (result.success) {
      log('MCP test completed successfully', 'success');
    } else {
      log(`MCP test failed: ${result.error || 'Unknown error'}`, 'error');
    }
    
    // Update the automation results in the UI
    updateAutomationResults(result);
    
    // Switch to browser tab to show results
    setActiveTab('browser-tab');
  });
  
  // Handle MCP diagnostic results
  window.electronAPI.onMcpDiagnosticResult((result) => {
    if (result.success) {
      log('MCP diagnostics completed', 'success');
    } else {
      log('MCP diagnostics found issues', 'error');
    }
    
    // Show diagnostic results in the logs tab
    setActiveTab('logs-tab');
  });
}

// UI Helpers
function setProcessingState(processing) {
  isProcessing = processing;
  submitPromptButton.disabled = processing || !isFoundryRunning;
  
  if (processing) {
    submitPromptButton.textContent = 'Processing...';
  } else {
    submitPromptButton.textContent = 'Submit';
  }
}

function setAutomationState(running) {
  isAutomationRunning = running;
  startAutomationButton.disabled = running;
  submitMcpPromptButton.disabled = running;
  runMcpTestButton.disabled = running;
  stopAutomationButton.disabled = !running;
  modelSelect.disabled = running;
  
  // Update UI state for browser automation sections
  if (running) {
    document.body.classList.add('automation-running');
  } else {
    document.body.classList.remove('automation-running');
  }
}

function displayAiResponse(response) {
  aiResponse.innerHTML = `<pre>${response}</pre>`;
}

function log(message, type = 'info') {
  const timestamp = new Date().toLocaleTimeString();
  const msgClass = type === 'error' ? 'error-log' : 
                   type === 'success' ? 'success-log' : 'info-log';
  
  // Create log entry
  const logEntry = document.createElement('div');
  logEntry.className = msgClass;
  logEntry.innerHTML = `<span class="timestamp">[${timestamp}]</span> ${message}`;
  
  // Add to log container
  if (logOutput.querySelector('.placeholder')) {
    logOutput.innerHTML = '';
  }
  
  logOutput.appendChild(logEntry);
  logOutput.scrollTop = logOutput.scrollHeight;
  
  // Log to console as well
  if (type === 'error') {
    console.error(message);
  } else if (type === 'success') {
    console.log('%c' + message, 'color: green');
  } else {
    console.log(message);
  }
}
