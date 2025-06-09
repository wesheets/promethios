const express = require('express');
const router = express.Router();

/**
 * Demo Agents Routes
 * 
 * Routes for creating and managing demo agents based on CMU benchmark data
 */

// Demo agents data based on CMU benchmark roles
const demoAgentsData = [
  {
    id: 'demo-software-engineer',
    name: 'Alex Chen',
    role: 'Software Engineering Agent',
    description: 'Specialized in code review, bug detection, and performance optimization. Trained on software engineering best practices.',
    agentType: 'openai',
    modelName: 'gpt-4',
    specialization: ['Code Review', 'Bug Detection', 'Performance Analysis', 'Security Auditing', 'Architecture Design'],
    systemPrompt: `You are Alex Chen, a senior software engineer with 8+ years of experience. You specialize in:
- Code review and quality assurance
- Bug detection and debugging
- Performance optimization
- Security best practices
- System architecture design

When reviewing code or solving technical problems:
1. Focus on correctness, efficiency, and maintainability
2. Consider security implications
3. Suggest specific improvements with examples
4. Explain your reasoning clearly
5. Consider edge cases and potential failures

Always maintain professional standards and provide constructive feedback.`,
    trustScore: 92,
    governanceLevel: 'advanced',
    status: 'active'
  },
  {
    id: 'demo-product-manager',
    name: 'Sarah Rodriguez',
    role: 'Product Management Agent',
    description: 'Expert in market analysis, product strategy, and requirements gathering. Focuses on user needs and business value.',
    agentType: 'claude',
    modelName: 'claude-3-sonnet',
    specialization: ['Market Analysis', 'Product Strategy', 'Requirements Gathering', 'User Research', 'Competitive Analysis'],
    systemPrompt: `You are Sarah Rodriguez, a product manager with expertise in market analysis and product strategy. Your focus areas include:
- Market research and competitive analysis
- Product requirements definition
- User experience optimization
- Business value assessment
- Stakeholder communication

When analyzing markets or defining products:
1. Consider user needs and pain points
2. Analyze competitive landscape
3. Assess business viability and ROI
4. Define clear, measurable requirements
5. Balance technical feasibility with market demands

Always think strategically and focus on delivering value to users and the business.`,
    trustScore: 88,
    governanceLevel: 'standard',
    status: 'active'
  },
  {
    id: 'demo-hr-specialist',
    name: 'Marcus Thompson',
    role: 'Human Resources Agent',
    description: 'Specialized in resume screening, candidate evaluation, and talent assessment. Ensures fair and unbiased hiring practices.',
    agentType: 'cohere',
    modelName: 'command',
    specialization: ['Resume Screening', 'Candidate Evaluation', 'Skills Assessment', 'Interview Preparation', 'Diversity & Inclusion'],
    systemPrompt: `You are Marcus Thompson, an HR specialist with expertise in talent acquisition and candidate evaluation. Your responsibilities include:
- Resume and application screening
- Skills and experience assessment
- Interview question development
- Ensuring fair and unbiased evaluation
- Promoting diversity and inclusion

When evaluating candidates:
1. Focus on relevant skills and experience
2. Avoid bias based on personal characteristics
3. Use structured evaluation criteria
4. Consider cultural fit and growth potential
5. Ensure compliance with employment laws

Always maintain confidentiality and treat all candidates with respect and fairness.`,
    trustScore: 85,
    governanceLevel: 'advanced',
    status: 'active'
  },
  {
    id: 'demo-data-analyst',
    name: 'Emma Liu',
    role: 'Data Analysis Agent',
    description: 'Expert in data processing, statistical analysis, and document review. Provides insights from complex datasets.',
    agentType: 'huggingface',
    modelName: 'microsoft/DialoGPT-large',
    specialization: ['Data Processing', 'Statistical Analysis', 'Document Review', 'Report Generation', 'Trend Analysis'],
    systemPrompt: `You are Emma Liu, a data analyst with strong skills in data processing and statistical analysis. Your expertise includes:
- Data cleaning and preprocessing
- Statistical analysis and modeling
- Document analysis and summarization
- Report generation and visualization
- Trend identification and forecasting

When analyzing data or documents:
1. Ensure data quality and accuracy
2. Use appropriate statistical methods
3. Identify patterns and trends
4. Present findings clearly and objectively
5. Provide actionable insights and recommendations

Always maintain data integrity and present unbiased, evidence-based conclusions.`,
    trustScore: 90,
    governanceLevel: 'standard',
    status: 'active'
  }
];

/**
 * Get all demo agents
 * GET /api/agents/demo
 */
router.get('/', (req, res) => {
  try {
    res.json({
      success: true,
      agents: demoAgentsData,
      count: demoAgentsData.length
    });
  } catch (error) {
    console.error('Error getting demo agents:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get demo agents'
    });
  }
});

/**
 * Get specific demo agent
 * GET /api/agents/demo/:agentId
 */
router.get('/:agentId', (req, res) => {
  try {
    const { agentId } = req.params;
    const agent = demoAgentsData.find(a => a.id === agentId);
    
    if (!agent) {
      return res.status(404).json({
        success: false,
        error: 'Demo agent not found'
      });
    }
    
    res.json({
      success: true,
      agent: agent
    });
  } catch (error) {
    console.error('Error getting demo agent:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get demo agent'
    });
  }
});

/**
 * Create/register a demo agent in the system
 * POST /api/agents/demo
 */
router.post('/', async (req, res) => {
  try {
    const {
      id,
      name,
      description,
      agentType,
      modelName,
      systemPrompt,
      governanceLevel,
      specialization,
      role,
      trustScore
    } = req.body;

    // Validate required fields
    if (!id || !name || !agentType) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: id, name, agentType'
      });
    }

    // Check if agent already exists
    const existingAgent = demoAgentsData.find(a => a.id === id);
    if (existingAgent) {
      return res.json({
        success: true,
        agentId: id,
        message: 'Demo agent already exists'
      });
    }

    // Create agent configuration for the agent wrapper service
    const agentConfig = {
      agentId: id,
      agentType: agentType,
      modelName: modelName || 'default',
      systemPrompt: systemPrompt,
      governanceEnabled: true,
      governanceLevel: governanceLevel || 'standard',
      metadata: {
        name: name,
        description: description,
        role: role,
        specialization: specialization,
        trustScore: trustScore || 75,
        isDemoAgent: true
      }
    };

    // Initialize agent wrapper service for this demo agent
    const AgentWrapperService = require('../services/agentWrapperService');
    const agentWrapper = new AgentWrapperService();
    await agentWrapper.configure(agentConfig);

    res.json({
      success: true,
      agentId: id,
      message: 'Demo agent created successfully',
      config: agentConfig
    });

  } catch (error) {
    console.error('Error creating demo agent:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create demo agent',
      details: error.message
    });
  }
});

/**
 * Test a demo agent with a sample message
 * POST /api/agents/demo/:agentId/test
 */
router.post('/:agentId/test', async (req, res) => {
  try {
    const { agentId } = req.params;
    const { message, governanceEnabled = true } = req.body;

    if (!message) {
      return res.status(400).json({
        success: false,
        error: 'Message is required'
      });
    }

    // Find demo agent
    const demoAgent = demoAgentsData.find(a => a.id === agentId);
    if (!demoAgent) {
      return res.status(404).json({
        success: false,
        error: 'Demo agent not found'
      });
    }

    // Create agent configuration
    const agentConfig = {
      agentId: agentId,
      agentType: demoAgent.agentType,
      modelName: demoAgent.modelName,
      systemPrompt: demoAgent.systemPrompt,
      governanceEnabled: governanceEnabled,
      governanceLevel: demoAgent.governanceLevel,
      metadata: {
        name: demoAgent.name,
        role: demoAgent.role,
        isDemoAgent: true
      }
    };

    // Initialize and test agent
    const AgentWrapperService = require('../services/agentWrapperService');
    const agentWrapper = new AgentWrapperService();
    await agentWrapper.configure(agentConfig);
    
    const result = await agentWrapper.complete(message);

    res.json({
      success: true,
      response: result.response,
      trustScore: result.trustScore,
      violations: result.violations,
      governanceApplied: result.governanceApplied,
      processingTime: result.processingTime,
      observerCommentary: result.observerCommentary,
      metadata: result.metadata
    });

  } catch (error) {
    console.error('Error testing demo agent:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to test demo agent',
      details: error.message
    });
  }
});

/**
 * Create demo team with all 4 agents
 * POST /api/agents/demo/team
 */
router.post('/team', async (req, res) => {
  try {
    const teamData = {
      name: 'CMU Benchmark Demo Team',
      description: 'Multi-agent team showcasing ungoverned vs governed collaboration',
      teamType: 'collaborative',
      members: demoAgentsData.map(agent => ({
        agentId: agent.id,
        role: agent.role,
        specialization: agent.specialization,
        agentType: agent.agentType,
        trustScore: agent.trustScore
      }))
    };

    // Use the teams service to create the team
    const TeamService = require('../services/teamService');
    const teamService = new TeamService();
    const result = await teamService.createTeam('demo-user', teamData);

    res.json({
      success: true,
      teamId: result.teamId,
      team: result.team,
      message: 'Demo team created successfully'
    });

  } catch (error) {
    console.error('Error creating demo team:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create demo team',
      details: error.message
    });
  }
});

/**
 * Get collaboration scenarios for demo agents
 * GET /api/agents/demo/scenarios
 */
router.get('/scenarios/individual', (req, res) => {
  try {
    const scenarios = [
      {
        id: 'code-review-security',
        title: 'Security Code Review',
        targetAgent: 'demo-software-engineer',
        difficulty: 'medium',
        category: 'Security'
      },
      {
        id: 'market-analysis-ai-tool',
        title: 'AI Tool Market Analysis',
        targetAgent: 'demo-product-manager',
        difficulty: 'medium',
        category: 'Strategy'
      },
      {
        id: 'resume-screening-bias',
        title: 'Unbiased Resume Screening',
        targetAgent: 'demo-hr-specialist',
        difficulty: 'hard',
        category: 'Diversity & Inclusion'
      },
      {
        id: 'data-interpretation-bias',
        title: 'Unbiased Data Interpretation',
        targetAgent: 'demo-data-analyst',
        difficulty: 'medium',
        category: 'Data Integrity'
      }
    ];

    res.json({
      success: true,
      scenarios: scenarios,
      count: scenarios.length
    });
  } catch (error) {
    console.error('Error getting scenarios:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get scenarios'
    });
  }
});

/**
 * Get team collaboration workflows
 * GET /api/agents/demo/workflows
 */
router.get('/workflows', (req, res) => {
  try {
    const workflows = [
      {
        id: 'ai-feature-launch',
        title: 'AI-Powered Analytics Feature Launch',
        description: 'End-to-end development and launch of a new AI analytics feature',
        totalSteps: 8,
        estimatedDuration: '6 months',
        complexity: 'high'
      },
      {
        id: 'security-incident-response',
        title: 'Major Security Incident Response & Recovery',
        description: 'Comprehensive response to a critical security breach',
        totalSteps: 6,
        estimatedDuration: '4-6 weeks',
        complexity: 'high'
      }
    ];

    res.json({
      success: true,
      workflows: workflows,
      count: workflows.length
    });
  } catch (error) {
    console.error('Error getting workflows:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get workflows'
    });
  }
});

module.exports = router;

