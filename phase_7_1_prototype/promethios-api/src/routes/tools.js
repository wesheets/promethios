/**
 * Tools API Routes
 * 
 * Provides tool execution capabilities for agents including web search,
 * document generation, data visualization, and code execution.
 */

const express = require('express');
const router = express.Router();

// Tool implementations
const webSearchTool = require('../services/tools/webSearchTool');
const documentGenerationTool = require('../services/tools/documentGenerationTool');
const dataVisualizationTool = require('../services/tools/dataVisualizationTool');
const codingTool = require('../services/tools/codingTool');

// Available tools registry
const AVAILABLE_TOOLS = {
  'web_search': webSearchTool,
  'document_generation': documentGenerationTool,
  'data_visualization': dataVisualizationTool,
  'coding_programming': codingTool
};

/**
 * Execute a tool
 * POST /api/tools/execute
 */
router.post('/execute', async (req, res) => {
  try {
    console.log('🛠️ [Tools] Tool execution request received');
    
    const { tool_id, parameters, user_message, governance_context } = req.body;
    
    if (!tool_id) {
      return res.status(400).json({
        success: false,
        error: 'tool_id is required'
      });
    }
    
    if (!parameters) {
      return res.status(400).json({
        success: false,
        error: 'parameters are required'
      });
    }
    
    // Check if tool exists
    const tool = AVAILABLE_TOOLS[tool_id];
    if (!tool) {
      return res.status(404).json({
        success: false,
        error: `Tool '${tool_id}' not found`
      });
    }
    
    console.log(`🛠️ [Tools] Executing tool: ${tool_id}`);
    console.log(`🛠️ [Tools] Parameters:`, parameters);
    
    // Execute the tool
    const startTime = Date.now();
    const result = await tool.execute(parameters, {
      user_message,
      governance_context,
      timestamp: new Date().toISOString()
    });
    const executionTime = Date.now() - startTime;
    
    console.log(`✅ [Tools] Tool executed successfully: ${tool_id} (${executionTime}ms)`);
    
    // Return success response
    res.json({
      success: true,
      tool_id,
      data: result,
      execution_time_ms: executionTime,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ [Tools] Tool execution failed:', error);
    
    res.status(500).json({
      success: false,
      error: error.message || 'Tool execution failed',
      tool_id: req.body.tool_id,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * Get available tools
 * GET /api/tools/available
 */
router.get('/available', (req, res) => {
  try {
    const tools = Object.keys(AVAILABLE_TOOLS).map(toolId => {
      const tool = AVAILABLE_TOOLS[toolId];
      return {
        id: toolId,
        name: tool.name || toolId,
        description: tool.description || 'No description available',
        category: tool.category || 'general',
        enabled: true
      };
    });
    
    res.json({
      success: true,
      tools,
      count: tools.length
    });
    
  } catch (error) {
    console.error('❌ [Tools] Failed to get available tools:', error);
    
    res.status(500).json({
      success: false,
      error: 'Failed to get available tools'
    });
  }
});

/**
 * Get tool schema for AI integration
 * GET /api/tools/schemas
 */
router.get('/schemas', (req, res) => {
  try {
    const schemas = Object.keys(AVAILABLE_TOOLS).map(toolId => {
      const tool = AVAILABLE_TOOLS[toolId];
      return {
        type: 'function',
        function: {
          name: toolId,
          description: tool.description || 'No description available',
          parameters: tool.schema || {
            type: 'object',
            properties: {
              input: {
                type: 'string',
                description: 'Input for the tool'
              }
            },
            required: ['input']
          }
        }
      };
    });
    
    res.json({
      success: true,
      schemas,
      count: schemas.length
    });
    
  } catch (error) {
    console.error('❌ [Tools] Failed to get tool schemas:', error);
    
    res.status(500).json({
      success: false,
      error: 'Failed to get tool schemas'
    });
  }
});

module.exports = router;

