#!/usr/bin/env node

/**
 * API Bridge for Multi-Agent Coordination
 * 
 * This script serves as a bridge between the Python FastAPI and the Node.js
 * multi-agent coordination module, handling requests and returning responses.
 */

const MultiAgentCoordination = require('./index');

// Initialize multi-agent coordination
const coordination = new MultiAgentCoordination({
  logger: console,
  config: {
    // Add any configuration needed
  }
});

/**
 * Process API requests
 */
async function processRequest(requestData) {
  try {
    const { action, data } = requestData;
    
    switch (action) {
      case 'create_context':
        return await handleCreateContext(data);
      
      case 'send_message':
        return await handleSendMessage(data);
      
      case 'get_conversation_history':
        return await handleGetConversationHistory(data);
      
      case 'get_collaboration_metrics':
        return await handleGetCollaborationMetrics(data);
      
      case 'get_context_agents':
        return await handleGetContextAgents(data);
      
      case 'terminate_context':
        return await handleTerminateContext(data);
      
      default:
        throw new Error(`Unknown action: ${action}`);
    }
  } catch (error) {
    console.error('Error processing request:', error);
    throw error;
  }
}

/**
 * Handle create context request
 */
async function handleCreateContext(data) {
  const { name, agentIds, collaborationModel, policies, governanceEnabled, metadata } = data;
  
  // Register agents first
  for (const agentId of agentIds) {
    coordination.registerAgent({
      id: agentId,
      capabilities: [],
      governanceIdentity: governanceEnabled ? { verified: true } : null
    });
  }
  
  // Create coordination context
  const context = coordination.createCoordinationContext({
    name,
    agentIds,
    collaborationModel,
    roles: {},
    policies: {
      ...policies,
      governanceEnabled
    },
    metadata
  });
  
  return {
    contextId: context.id,
    name: context.name,
    agentIds: context.agentIds,
    collaborationModel: context.collaborationModel || 'shared_context',
    status: context.status,
    createdAt: context.createdAt
  };
}

/**
 * Handle send message request
 */
async function handleSendMessage(data) {
  const { contextId, fromAgentId, toAgentIds, message, requireResponse, priority } = data;
  
  // Use agent communication protocol if available
  if (coordination.agentCommunicationProtocol) {
    const result = coordination.agentCommunicationProtocol.sendMessage(
      fromAgentId,
      toAgentIds,
      {
        ...message,
        requiresResponse: requireResponse,
        priority
      },
      contextId
    );
    
    return {
      messageId: result.messageId,
      deliveryResults: result.deliveryResults,
      timestamp: result.timestamp,
      governanceData: result.governanceData
    };
  }
  
  // Fallback to basic message handling
  const messageId = `msg-${Date.now()}`;
  const timestamp = new Date().toISOString();
  
  return {
    messageId,
    deliveryResults: toAgentIds.map(recipientId => ({
      recipientId,
      delivered: true,
      timestamp
    })),
    timestamp,
    governanceData: null
  };
}

/**
 * Handle get conversation history request
 */
async function handleGetConversationHistory(data) {
  const { contextId, fromAgentId, messageType, since, limit } = data;
  
  // Use shared context manager if available
  if (coordination.sharedContextManager) {
    const history = coordination.sharedContextManager.getConversationHistory(contextId, {
      fromAgentId,
      messageType,
      since,
      limit
    });
    
    return {
      contextId: history.contextId,
      messages: history.messages,
      totalMessages: history.totalMessages,
      filteredCount: history.filteredCount,
      collaborationModel: history.collaborationModel
    };
  }
  
  // Fallback to empty history
  return {
    contextId,
    messages: [],
    totalMessages: 0,
    filteredCount: 0,
    collaborationModel: 'shared_context'
  };
}

/**
 * Handle get collaboration metrics request
 */
async function handleGetCollaborationMetrics(data) {
  const { contextId } = data;
  
  // Get coordination metrics
  const coordinationMetrics = coordination.getCoordinationMetrics(contextId);
  
  // Get collaboration metrics if shared context manager is available
  let collaborationMetrics = {
    contextId,
    collaborationModel: 'shared_context',
    totalMessages: 0,
    activeAgents: 0,
    averageParticipation: 0,
    agentMetrics: [],
    governanceMetrics: {}
  };
  
  if (coordination.sharedContextManager) {
    try {
      collaborationMetrics = coordination.sharedContextManager.getCollaborationMetrics(contextId);
    } catch (error) {
      console.warn('Could not get collaboration metrics:', error.message);
    }
  }
  
  return {
    contextId: collaborationMetrics.contextId,
    collaborationModel: collaborationMetrics.collaborationModel,
    totalMessages: collaborationMetrics.totalMessages,
    activeAgents: collaborationMetrics.activeAgents,
    averageParticipation: collaborationMetrics.averageParticipation,
    agentMetrics: collaborationMetrics.agentMetrics,
    governanceMetrics: {
      ...coordinationMetrics.governance,
      ...collaborationMetrics.governanceMetrics
    }
  };
}

/**
 * Handle get context agents request
 */
async function handleGetContextAgents(data) {
  const { contextId } = data;
  
  // Get active agents if communication protocol is available
  if (coordination.agentCommunicationProtocol) {
    const activeAgents = coordination.agentCommunicationProtocol.getActiveAgents();
    
    return {
      agents: activeAgents
    };
  }
  
  // Fallback to empty agents list
  return {
    agents: []
  };
}

/**
 * Handle terminate context request
 */
async function handleTerminateContext(data) {
  const { contextId } = data;
  
  // In a real implementation, this would clean up the context
  // For now, we'll just return success
  
  return {
    status: 'success',
    message: `Context ${contextId} terminated`
  };
}

/**
 * Main execution
 */
async function main() {
  try {
    // Read input from stdin
    let input = '';
    
    process.stdin.on('data', (chunk) => {
      input += chunk;
    });
    
    process.stdin.on('end', async () => {
      try {
        const requestData = JSON.parse(input);
        const response = await processRequest(requestData);
        
        console.log(JSON.stringify(response));
        process.exit(0);
      } catch (error) {
        console.error(JSON.stringify({
          error: error.message,
          stack: error.stack
        }));
        process.exit(1);
      }
    });
    
  } catch (error) {
    console.error(JSON.stringify({
      error: error.message,
      stack: error.stack
    }));
    process.exit(1);
  }
}

// Run if this script is executed directly
if (require.main === module) {
  main();
}

module.exports = {
  processRequest,
  handleCreateContext,
  handleSendMessage,
  handleGetConversationHistory,
  handleGetCollaborationMetrics,
  handleGetContextAgents,
  handleTerminateContext
};

