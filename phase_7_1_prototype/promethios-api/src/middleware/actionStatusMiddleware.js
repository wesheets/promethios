/**
 * actionStatusMiddleware.js
 * 
 * Middleware to intercept tool execution and send real-time action status updates to the frontend.
 * Provides transparency into what the AI agent is doing during tool execution.
 */

const WebSocket = require('ws');

class ActionStatusManager {
  constructor() {
    this.clients = new Set();
    this.activeActions = new Map();
    this.actionCounter = 0;
  }

  /**
   * Add WebSocket client for action status updates
   */
  addClient(ws) {
    this.clients.add(ws);
    
    // Send current active actions to new client
    const actions = Array.from(this.activeActions.values());
    if (actions.length > 0) {
      this.sendToClient(ws, {
        type: 'action_status_update',
        actions
      });
    }

    // Remove client when connection closes
    ws.on('close', () => {
      this.clients.delete(ws);
    });
  }

  /**
   * Start a new action
   */
  startAction(toolName, action, details = null) {
    const id = `action_${++this.actionCounter}_${Date.now()}`;
    
    const actionStatus = {
      id,
      type: this.getToolType(toolName),
      status: 'starting',
      action,
      details,
      timestamp: Date.now()
    };

    this.activeActions.set(id, actionStatus);
    this.broadcastUpdate();

    // Auto-transition to in_progress
    setTimeout(() => {
      this.updateAction(id, 'in_progress');
    }, 500);

    return id;
  }

  /**
   * Update action status
   */
  updateAction(id, status, details = null, progress = null) {
    const action = this.activeActions.get(id);
    if (!action) return;

    const updatedAction = {
      ...action,
      status,
      details: details || action.details,
      progress,
      timestamp: status === 'completed' || status === 'error' ? Date.now() : action.timestamp
    };

    this.activeActions.set(id, updatedAction);
    this.broadcastUpdate();

    // Auto-remove completed/error actions after 3 seconds
    if (status === 'completed' || status === 'error') {
      setTimeout(() => {
        this.activeActions.delete(id);
        this.broadcastUpdate();
      }, 3000);
    }
  }

  /**
   * Complete an action
   */
  completeAction(id, details = null) {
    this.updateAction(id, 'completing');
    
    setTimeout(() => {
      this.updateAction(id, 'completed', details);
    }, 300);
  }

  /**
   * Mark action as error
   */
  errorAction(id, errorMessage) {
    this.updateAction(id, 'error', errorMessage);
  }

  /**
   * Get tool type from tool name
   */
  getToolType(toolName) {
    const toolTypeMap = {
      'webSearchTool': 'web_search',
      'webScrapingTool': 'web_scraping',
      'articleVerificationTool': 'article_verification',
      'seoAnalysisTool': 'seo_analysis',
      'documentGenerationTool': 'document_generation',
      'dataVisualizationTool': 'data_visualization',
      'codingTool': 'coding',
      'emailSendingTool': 'email_sending',
      'smsMessagingTool': 'sms_messaging',
      'slackIntegrationTool': 'slack_integration',
      'shopifyIntegrationTool': 'shopify_integration',
      'stripePaymentsTool': 'stripe_payments',
      'googleCalendarTool': 'google_calendar',
      'twitterPostingTool': 'twitter_posting',
      'linkedinPostingTool': 'linkedin_posting',
      'googleAnalyticsTool': 'google_analytics',
      'zapierIntegrationTool': 'zapier_integration',
      'workflowAutomationTool': 'workflow_automation',
      'woocommerceIntegrationTool': 'woocommerce_integration',
      'salesforceCrmTool': 'salesforce_crm'
    };

    return toolTypeMap[toolName] || 'web_search';
  }

  /**
   * Broadcast action updates to all connected clients
   */
  broadcastUpdate() {
    const actions = Array.from(this.activeActions.values());
    const message = {
      type: 'action_status_update',
      actions
    };

    this.clients.forEach(client => {
      this.sendToClient(client, message);
    });
  }

  /**
   * Send message to specific client
   */
  sendToClient(ws, message) {
    if (ws.readyState === WebSocket.OPEN) {
      try {
        ws.send(JSON.stringify(message));
      } catch (error) {
        console.error('Error sending action status update:', error);
        this.clients.delete(ws);
      }
    }
  }

  /**
   * Get action descriptions for different tools
   */
  getActionDescription(toolName, parameters) {
    switch (toolName) {
      case 'webSearchTool':
        return {
          action: 'Searching the web...',
          details: parameters.query ? `Query: "${parameters.query}"` : null
        };
      
      case 'webScrapingTool':
        return {
          action: 'Scraping article content...',
          details: parameters.url ? `URL: ${parameters.url}` : null
        };
      
      case 'articleVerificationTool':
        return {
          action: 'Verifying article credibility...',
          details: parameters.title ? `Article: "${parameters.title}"` : null
        };
      
      case 'seoAnalysisTool':
        return {
          action: 'Analyzing SEO performance...',
          details: parameters.url ? `URL: ${parameters.url}` : null
        };
      
      case 'documentGenerationTool':
        return {
          action: 'Generating document...',
          details: parameters.type ? `Type: ${parameters.type}` : null
        };
      
      case 'dataVisualizationTool':
        return {
          action: 'Creating visualization...',
          details: parameters.type ? `Type: ${parameters.type}` : null
        };
      
      case 'codingTool':
        return {
          action: 'Writing code...',
          details: parameters.language ? `Language: ${parameters.language}` : null
        };
      
      case 'emailSendingTool':
        return {
          action: 'Sending email...',
          details: parameters.to ? `To: ${parameters.to}` : null
        };
      
      case 'smsMessagingTool':
        return {
          action: 'Sending SMS...',
          details: parameters.to ? `To: ${parameters.to}` : null
        };
      
      default:
        return {
          action: `Executing ${toolName}...`,
          details: null
        };
    }
  }
}

// Create singleton instance
const actionStatusManager = new ActionStatusManager();

/**
 * Middleware to track tool execution
 */
const actionStatusMiddleware = (req, res, next) => {
  // Store original res.json to intercept responses
  const originalJson = res.json;
  
  // Override res.json to track tool execution
  res.json = function(data) {
    // Check if this is a tool execution response
    if (data && data.tool_calls) {
      // Track each tool call
      data.tool_calls.forEach(toolCall => {
        const { tool_name, parameters } = toolCall;
        const { action, details } = actionStatusManager.getActionDescription(tool_name, parameters);
        
        // Start action tracking
        const actionId = actionStatusManager.startAction(tool_name, action, details);
        
        // Store action ID for potential updates
        toolCall.actionId = actionId;
      });
    }
    
    // Call original res.json
    return originalJson.call(this, data);
  };
  
  next();
};

/**
 * WebSocket handler for action status updates
 */
const handleActionStatusWebSocket = (ws, req) => {
  console.log('Action status WebSocket client connected');
  actionStatusManager.addClient(ws);
  
  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      
      // Handle different message types
      switch (data.type) {
        case 'action_update':
          if (data.actionId && data.status) {
            actionStatusManager.updateAction(
              data.actionId, 
              data.status, 
              data.details, 
              data.progress
            );
          }
          break;
        
        case 'action_complete':
          if (data.actionId) {
            actionStatusManager.completeAction(data.actionId, data.details);
          }
          break;
        
        case 'action_error':
          if (data.actionId) {
            actionStatusManager.errorAction(data.actionId, data.error);
          }
          break;
      }
    } catch (error) {
      console.error('Error processing action status message:', error);
    }
  });
};

module.exports = {
  actionStatusMiddleware,
  handleActionStatusWebSocket,
  actionStatusManager
};

