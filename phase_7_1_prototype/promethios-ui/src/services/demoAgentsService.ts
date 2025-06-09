/**
 * Demo Agents Service
 * 
 * This service provides 4 pre-configured demo agents based on CMU benchmark data,
 * each powered by a different LLM provider for testing governance vs ungoverned collaboration.
 */

export interface DemoAgent {
  id: string;
  name: string;
  role: string;
  description: string;
  llmProvider: 'openai' | 'anthropic' | 'cohere' | 'huggingface';
  specialization: string[];
  systemPrompt: string;
  trustScore: number;
  governanceLevel: 'basic' | 'standard' | 'advanced';
  status: 'active' | 'inactive';
  apiEndpoint?: string;
  modelName: string;
}

class DemoAgentsService {
  private static readonly API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

  /**
   * Get all 4 demo agents based on CMU benchmark roles
   */
  static getDemoAgents(): DemoAgent[] {
    return [
      {
        id: 'demo-software-engineer',
        name: 'Alex Chen',
        role: 'Software Engineering Agent',
        description: 'Specialized in code review, bug detection, and performance optimization. Trained on software engineering best practices.',
        llmProvider: 'openai',
        modelName: 'gpt-4',
        specialization: [
          'Code Review',
          'Bug Detection', 
          'Performance Analysis',
          'Security Auditing',
          'Architecture Design'
        ],
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
        llmProvider: 'anthropic',
        modelName: 'claude-3-sonnet',
        specialization: [
          'Market Analysis',
          'Product Strategy',
          'Requirements Gathering',
          'User Research',
          'Competitive Analysis'
        ],
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
        llmProvider: 'cohere',
        modelName: 'command',
        specialization: [
          'Resume Screening',
          'Candidate Evaluation',
          'Skills Assessment',
          'Interview Preparation',
          'Diversity & Inclusion'
        ],
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
        llmProvider: 'huggingface',
        modelName: 'microsoft/DialoGPT-large',
        specialization: [
          'Data Processing',
          'Statistical Analysis',
          'Document Review',
          'Report Generation',
          'Trend Analysis'
        ],
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
  }

  /**
   * Get a specific demo agent by ID
   */
  static getDemoAgent(agentId: string): DemoAgent | null {
    const agents = this.getDemoAgents();
    return agents.find(agent => agent.id === agentId) || null;
  }

  /**
   * Create a demo agent in the system
   */
  static async createDemoAgent(agent: DemoAgent): Promise<{success: boolean, agentId?: string, error?: string}> {
    try {
      const response = await fetch(`${this.API_BASE}/agents/demo`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: agent.id,
          name: agent.name,
          description: agent.description,
          agentType: agent.llmProvider,
          modelName: agent.modelName,
          systemPrompt: agent.systemPrompt,
          governanceLevel: agent.governanceLevel,
          specialization: agent.specialization,
          role: agent.role,
          trustScore: agent.trustScore
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create demo agent');
      }

      const result = await response.json();
      return {
        success: true,
        agentId: result.agentId || agent.id
      };

    } catch (error) {
      console.error('Error creating demo agent:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Test an agent with a sample message
   */
  static async testDemoAgent(agentId: string, message: string, governanceEnabled: boolean = true): Promise<{
    success: boolean,
    response?: string,
    trustScore?: number,
    violations?: any[],
    processingTime?: number,
    error?: string
  }> {
    try {
      const response = await fetch(`${this.API_BASE}/llm-complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          agentId,
          governanceEnabled,
          agentType: this.getDemoAgent(agentId)?.llmProvider || 'openai'
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to test agent');
      }

      const result = await response.json();
      return {
        success: true,
        response: result.response,
        trustScore: result.trustScore,
        violations: result.violations,
        processingTime: result.processingTime
      };

    } catch (error) {
      console.error('Error testing demo agent:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Create a demo team with all 4 agents
   */
  static async createDemoTeam(): Promise<{success: boolean, teamId?: string, error?: string}> {
    try {
      const response = await fetch(`${this.API_BASE}/teams/demo`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: 'CMU Benchmark Demo Team',
          description: 'Multi-agent team showcasing ungoverned vs governed collaboration',
          teamType: 'collaborative',
          members: this.getDemoAgents().map(agent => ({
            agentId: agent.id,
            role: agent.role,
            specialization: agent.specialization
          }))
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create demo team');
      }

      const result = await response.json();
      return {
        success: true,
        teamId: result.teamId
      };

    } catch (error) {
      console.error('Error creating demo team:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get sample tasks for testing team collaboration
   */
  static getCollaborationTasks() {
    return [
      {
        id: 'product-launch-analysis',
        title: 'Product Launch Analysis',
        description: 'Analyze a new product launch from multiple perspectives',
        scenario: `A startup is launching a new AI-powered productivity app. The team needs to:
1. Review the technical architecture (Software Engineer)
2. Analyze market positioning (Product Manager) 
3. Assess hiring needs for launch (HR Specialist)
4. Analyze user feedback data (Data Analyst)`,
        expectedRoles: ['Software Engineering Agent', 'Product Management Agent', 'Human Resources Agent', 'Data Analysis Agent']
      },
      {
        id: 'security-incident-response',
        title: 'Security Incident Response',
        description: 'Coordinate response to a security incident',
        scenario: `A potential security vulnerability has been discovered. The team needs to:
1. Assess technical impact and create fixes (Software Engineer)
2. Evaluate business impact and communication strategy (Product Manager)
3. Review personnel access and training needs (HR Specialist)
4. Analyze incident data and trends (Data Analyst)`,
        expectedRoles: ['Software Engineering Agent', 'Product Management Agent', 'Human Resources Agent', 'Data Analysis Agent']
      },
      {
        id: 'feature-development-planning',
        title: 'Feature Development Planning',
        description: 'Plan development of a new feature from conception to launch',
        scenario: `Planning a new collaborative editing feature. The team needs to:
1. Design technical architecture and implementation (Software Engineer)
2. Define requirements and user stories (Product Manager)
3. Plan team scaling and skill requirements (HR Specialist)
4. Analyze usage patterns and success metrics (Data Analyst)`,
        expectedRoles: ['Software Engineering Agent', 'Product Management Agent', 'Human Resources Agent', 'Data Analysis Agent']
      }
    ];
  }
}

export default DemoAgentsService;

