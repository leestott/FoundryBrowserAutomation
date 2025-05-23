/**
 * AI Prompt Handling Module
 * This module handles communication with AI models for text generation
 */

const { OpenAI } = require('openai');
const log = require('electron-log');
const path = require('path');
const fs = require('fs');
const os = require('os');
const axios = require('axios');

// Configure logging
log.transports.file.level = 'info';
log.transports.file.file = path.join(__dirname, 'foundry_prompt.log');

// Correct Foundry Local endpoint
const FOUNDRY_ENDPOINT = 'http://localhost:5273'; // Using http instead of https for localhost
const FOUNDRY_API_ENDPOINT = `${FOUNDRY_ENDPOINT}/v1`;
const FOUNDRY_STATUS_ENDPOINT = `${FOUNDRY_ENDPOINT}/openai/status`;

log.info(`Using Foundry Local endpoint: ${FOUNDRY_ENDPOINT}`);

/**
 * Check if Foundry Local is running by checking its status endpoint
 * @returns {Promise<boolean>} Whether Foundry Local is running
 */
async function isFoundryRunning() {
  try {
    const response = await axios.get(FOUNDRY_STATUS_ENDPOINT, { 
      timeout: 3000 
    });
    log.info('Foundry Local status check successful');
    log.debug(`Foundry status response: ${JSON.stringify(response.data)}`);
    return true;
  } catch (error) {
    log.error(`Foundry Local status check failed: ${error.message}`);
    return false;
  }
}

/**
 * Checks which models are available in the Foundry Local instance
 * @returns {Promise<Object>} Result with available models
 */
async function getAvailableModels() {
  try {
    log.info('Checking available models in Foundry Local');
    
    // First check if Foundry is running
    const foundryRunning = await isFoundryRunning();
    if (!foundryRunning) {
      return { 
        success: false, 
        error: `Foundry Local is not running at ${FOUNDRY_STATUS_ENDPOINT}` 
      };
    }
    
    // Initialize the client with the correct endpoint
    const client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY || 'foundry-local-key',
      baseURL: FOUNDRY_API_ENDPOINT,
      timeout: 10000
    });
    
    // Try to get available models
    const models = await client.models.list();
    log.info(`Found ${models.data.length} models in Foundry Local`);
    log.debug(`Available models: ${JSON.stringify(models.data.map(m => m.id))}`);
    
    return {
      success: true,
      models: models.data.map(m => m.id)
    };
  } catch (error) {
    log.error(`Error fetching available models: ${error.message}`);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Process a prompt using a specified AI model
 * @param {Object} options Configuration options
 * @param {string} options.model AI model to use
 * @param {string} options.prompt Text prompt to send to the model
 * @returns {Promise<Object>} Result with the model's response
 */
async function processPrompt({ model, prompt }) {
  try {
    log.info(`Processing prompt using model: ${model || 'default'}`);
    
    // Check if Foundry is running
    const foundryRunning = await isFoundryRunning();
    if (!foundryRunning) {
      throw new Error(`Foundry Local is not running at ${FOUNDRY_STATUS_ENDPOINT}. Please start the service.`);
    }
    
    // Check available models and select the best one
    let modelToUse = model || 'phi-4-mini';
    try {
      const availableModels = await getAvailableModels();
      if (availableModels.success && availableModels.models.length > 0) {
        log.info(`Available models: ${availableModels.models.join(', ')}`);
        
        // If requested model is not available, use the first available one
        if (modelToUse && !availableModels.models.includes(modelToUse)) {
          const fallbackModel = availableModels.models[0];
          log.warn(`Requested model "${modelToUse}" is not available, falling back to "${fallbackModel}"`);
          modelToUse = fallbackModel;
        }
      } else {
        log.warn('Could not retrieve available models, continuing with default');
      }
    } catch (modelError) {
      log.warn(`Error checking available models: ${modelError.message}`);
    }
    
    log.info(`Using API endpoint: ${FOUNDRY_API_ENDPOINT}`);
    
    // Initialize the client with the correct endpoint
    const client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY || 'foundry-local-key',
      baseURL: FOUNDRY_API_ENDPOINT,
      timeout: 60000, // 60 seconds timeout
      maxRetries: 2
    });
    
    // Log system info for debugging
    log.info(`System: ${os.platform()} ${os.release()}`);
    log.info(`Node.js: ${process.version}`);    // Send the prompt to the selected model
    log.info(`Sending request to model: ${modelToUse}`);
    
    // Prepare the request payload
    const payload = {
      model: modelToUse,
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 1000,
      temperature: 0.7
    };
    
    // Debug the request payload
    log.info(`Request payload: ${JSON.stringify(payload)}`);
    
    // Send the request
    const response = await client.chat.completions.create(payload);
      // Extract and return the response
    const result = response.choices[0].message.content;
    log.info(`AI response received (${result.length} characters) from model: ${modelToUse}`);
    
    return { 
      success: true, 
      result,
      model: modelToUse,
      modelRequested: model || 'phi-4-mini',
      timestamp: new Date().toISOString()
    };
      } catch (error) {
    log.error(`Error processing prompt: ${error.message}`);
    log.error(`Error details: ${JSON.stringify(error, Object.getOwnPropertyNames(error))}`);
    
    // Provide more helpful error messages based on error type
    let errorMessage = error.message;
    
    if (error.message.includes('ECONNREFUSED')) {
      errorMessage = `Could not connect to Foundry Local at ${FOUNDRY_ENDPOINT}. Please make sure it is running.`;
    } else if (error.message.includes('timeout')) {
      errorMessage = 'Request to AI model timed out. The model might be busy or unavailable.';
    } else if (error.code === 'ENOTFOUND') {
      errorMessage = 'Network error: Could not resolve the Foundry endpoint.';
    } else if (error.status === 400 || error.message.includes('400')) {
      // Handle 400 Bad Request errors
      errorMessage = `Bad request (400): The request format may be incorrect or the model '${model || 'phi-4-mini'}' may not be available in Foundry Local.`;
      
      // Check if we have more details in the error response
      if (error.response && error.response.data) {
        errorMessage += ` Details: ${JSON.stringify(error.response.data)}`;
      }
    }
    
    return { 
      success: false, 
      error: errorMessage 
    };
  }
}

module.exports = {
  processPrompt,
  isFoundryRunning,
  getAvailableModels
};