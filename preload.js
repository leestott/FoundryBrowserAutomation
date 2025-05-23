const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // Browser automation
  startBrowserAutomation: (options) => ipcRenderer.invoke('start-browser-automation', options),
  stopBrowserAutomation: () => ipcRenderer.invoke('stop-browser-automation'),
  processMcpPrompt: (prompt, options) => ipcRenderer.invoke('process-mcp-prompt', { prompt, options }),
  runMcpTest: () => ipcRenderer.invoke('run-mcp-test'),
  diagnoseMcp: () => ipcRenderer.invoke('diagnose-mcp'),
  
  // AI prompt processing
  sendPromptToAI: (model, prompt) => ipcRenderer.invoke('send-prompt-to-ai', { model, prompt }),
  
  // Foundry status
  checkFoundryStatus: () => ipcRenderer.invoke('check-foundry-status'),
  
  // Event listeners
  onBrowserOutput: (callback) => {
    ipcRenderer.on('browser-output', (event, value) => callback(value));
    return () => {
      ipcRenderer.removeAllListeners('browser-output');
    };
  },
  onBrowserError: (callback) => {
    ipcRenderer.on('browser-error', (event, value) => callback(value));
    return () => {
      ipcRenderer.removeAllListeners('browser-error');
    };
  },
  onFoundryStatus: (callback) => {
    ipcRenderer.on('foundry-status', (event, status) => callback(status));
    return () => {
      ipcRenderer.removeAllListeners('foundry-status');
    };
  },
  // New event listeners for enhanced UI
  onAutomationResult: (callback) => {
    ipcRenderer.on('automation-result', (event, result) => callback(result));
    return () => {
      ipcRenderer.removeAllListeners('automation-result');
    };
  },
  onMcpTestResult: (callback) => {
    ipcRenderer.on('mcp-test-result', (event, result) => callback(result));
    return () => {
      ipcRenderer.removeAllListeners('mcp-test-result');
    };
  },
  onMcpDiagnosticResult: (callback) => {
    ipcRenderer.on('mcp-diagnostic-result', (event, result) => callback(result));
    return () => {
      ipcRenderer.removeAllListeners('mcp-diagnostic-result');
    };
  }
});
