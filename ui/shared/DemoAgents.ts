// Shared demo agents that can be used across all components
export interface DemoAgent {
  id: string;
  name: string;
  description: string;
  type: 'assistant' | 'specialist' | 'tool' | 'creative' | 'validator' | 'coordinator';
  provider: string;
  model: string;
  capabilities: string[];
  governance_enabled: boolean;
  status: 'active' | 'configured' | 'demo';
  api_endpoint?: string;
  system_prompt?: string;
  collaboration_style?: 'sequential' | 'parallel' | 'hierarchical';
  role?: 'coordinator' | 'specialist' | 'validator' | 'executor';
}

// Comprehensive set of demo agents available for all wrapping scenarios
export const SHARED_DEMO_AGENTS: DemoAgent[] = [
  // General Purpose Agents
  {
    id: 'helpful-assistant',
    name: 'Helpful Assistant',
    description: 'A general-purpose AI assistant that provides helpful, harmless, and honest responses across a wide range of topics.',
    type: 'assistant',
    provider: 'OpenAI',
    model: 'gpt-3.5-turbo',
    capabilities: ['general-assistance', 'question-answering', 'task-planning', 'conversation'],
    governance_enabled: true,
    status: 'demo',
    system_prompt: 'You are a helpful, harmless, and honest AI assistant. Provide clear, accurate, and useful responses while being respectful and considerate.',
    collaboration_style: 'parallel',
    role: 'specialist'
  },
  
  // Technical Specialists
  {
    id: 'code-specialist',
    name: 'Code Specialist',
    description: 'A specialized coding assistant that helps with programming tasks, code review, debugging, and technical documentation.',
    type: 'specialist',
    provider: 'OpenAI',
    model: 'gpt-4',
    capabilities: ['code-generation', 'debugging', 'code-review', 'technical-documentation'],
    governance_enabled: true,
    status: 'demo',
    system_prompt: 'You are an expert programming assistant. Help with code generation, debugging, best practices, and technical explanations. Always prioritize security and maintainability.',
    collaboration_style: 'sequential',
    role: 'specialist'
  },
  
  {
    id: 'technical-architect',
    name: 'Technical Architect',
    description: 'Designs technical solutions and evaluates implementation feasibility for complex systems.',
    type: 'specialist',
    provider: 'OpenAI',
    model: 'gpt-4',
    capabilities: ['system-design', 'technical-evaluation', 'architecture-planning', 'scalability-analysis'],
    governance_enabled: true,
    status: 'demo',
    system_prompt: 'You are a technical architect. Design robust, scalable systems and evaluate technical feasibility. Consider performance, security, and maintainability in all recommendations.',
    collaboration_style: 'hierarchical',
    role: 'coordinator'
  },
  
  {
    id: 'devops-engineer',
    name: 'DevOps Engineer',
    description: 'Specializes in deployment, infrastructure, CI/CD, and operational excellence.',
    type: 'tool',
    provider: 'Anthropic',
    model: 'claude-3-sonnet',
    capabilities: ['deployment-automation', 'infrastructure-design', 'monitoring', 'ci-cd'],
    governance_enabled: true,
    status: 'demo',
    system_prompt: 'You are a DevOps engineer. Focus on automation, reliability, scalability, and operational excellence. Provide practical solutions for deployment and infrastructure challenges.',
    collaboration_style: 'parallel',
    role: 'executor'
  },
  
  // Business & Strategy
  {
    id: 'business-analyst',
    name: 'Business Analyst',
    description: 'A business-focused AI that helps with strategy, analysis, market research, and business planning.',
    type: 'specialist',
    provider: 'Anthropic',
    model: 'claude-3-sonnet',
    capabilities: ['business-analysis', 'strategy-planning', 'market-research', 'data-interpretation'],
    governance_enabled: true,
    status: 'demo',
    system_prompt: 'You are a business analyst AI. Provide strategic insights, market analysis, and business recommendations based on data and best practices.',
    collaboration_style: 'sequential',
    role: 'specialist'
  },
  
  {
    id: 'market-researcher',
    name: 'Market Researcher',
    description: 'Analyzes market trends, competitor landscape, and customer needs to inform business decisions.',
    type: 'specialist',
    provider: 'Anthropic',
    model: 'claude-3-sonnet',
    capabilities: ['market-analysis', 'trend-identification', 'competitive-intelligence', 'customer-research'],
    governance_enabled: true,
    status: 'demo',
    system_prompt: 'You are a market researcher. Analyze market trends, competitive landscapes, and customer behavior. Provide data-driven insights for strategic decision making.',
    collaboration_style: 'sequential',
    role: 'specialist'
  },
  
  {
    id: 'product-strategist',
    name: 'Product Strategist',
    description: 'Develops product vision, strategy, and roadmap based on market insights and user needs.',
    type: 'coordinator',
    provider: 'OpenAI',
    model: 'gpt-4',
    capabilities: ['strategic-planning', 'product-vision', 'roadmap-creation', 'stakeholder-alignment'],
    governance_enabled: true,
    status: 'demo',
    system_prompt: 'You are a product strategist. Develop compelling product visions, strategies, and roadmaps. Balance user needs, business goals, and technical constraints.',
    collaboration_style: 'hierarchical',
    role: 'coordinator'
  },
  
  // Creative & Content
  {
    id: 'creative-writer',
    name: 'Creative Writer',
    description: 'A creative AI specialized in writing, storytelling, content creation, and artistic expression.',
    type: 'creative',
    provider: 'OpenAI',
    model: 'gpt-4',
    capabilities: ['creative-writing', 'storytelling', 'content-creation', 'brainstorming'],
    governance_enabled: false,
    status: 'demo',
    system_prompt: 'You are a creative writing assistant. Help with storytelling, creative content, brainstorming, and artistic expression. Be imaginative and inspiring.',
    collaboration_style: 'parallel',
    role: 'specialist'
  },
  
  {
    id: 'creative-director',
    name: 'Creative Director',
    description: 'Leads creative vision and coordinates content strategy across multiple creative disciplines.',
    type: 'creative',
    provider: 'OpenAI',
    model: 'gpt-4',
    capabilities: ['creative-direction', 'content-strategy', 'brand-alignment', 'creative-coordination'],
    governance_enabled: false,
    status: 'demo',
    system_prompt: 'You are a creative director. Lead creative vision, coordinate content strategy, and ensure brand alignment across all creative outputs.',
    collaboration_style: 'hierarchical',
    role: 'coordinator'
  },
  
  {
    id: 'copywriter',
    name: 'Copywriter',
    description: 'Creates compelling written content and marketing copy that drives engagement and conversions.',
    type: 'creative',
    provider: 'OpenAI',
    model: 'gpt-3.5-turbo',
    capabilities: ['copywriting', 'marketing-content', 'persuasive-writing', 'brand-voice'],
    governance_enabled: false,
    status: 'demo',
    system_prompt: 'You are a copywriter. Create compelling, persuasive content that drives engagement and conversions while maintaining brand voice and authenticity.',
    collaboration_style: 'parallel',
    role: 'specialist'
  },
  
  // Research & Analysis
  {
    id: 'research-assistant',
    name: 'Research Assistant',
    description: 'A research-focused AI that helps with information gathering, analysis, and academic writing.',
    type: 'specialist',
    provider: 'Anthropic',
    model: 'claude-3-sonnet',
    capabilities: ['research', 'information-gathering', 'academic-writing', 'fact-checking'],
    governance_enabled: true,
    status: 'demo',
    system_prompt: 'You are a research assistant. Help with information gathering, analysis, academic writing, and fact-checking. Always cite sources and maintain accuracy.',
    collaboration_style: 'sequential',
    role: 'specialist'
  },
  
  {
    id: 'data-analyst',
    name: 'Data Analyst',
    description: 'Analyzes quantitative data and identifies statistical patterns to support decision making.',
    type: 'specialist',
    provider: 'OpenAI',
    model: 'gpt-4',
    capabilities: ['statistical-analysis', 'data-interpretation', 'pattern-recognition', 'visualization'],
    governance_enabled: true,
    status: 'demo',
    system_prompt: 'You are a data analyst. Analyze quantitative data, identify patterns, and provide statistical insights. Present findings clearly with appropriate visualizations.',
    collaboration_style: 'parallel',
    role: 'specialist'
  },
  
  {
    id: 'critical-reviewer',
    name: 'Critical Reviewer',
    description: 'Challenges findings and identifies potential biases, gaps, or weaknesses in analysis.',
    type: 'validator',
    provider: 'Anthropic',
    model: 'claude-3-sonnet',
    capabilities: ['critical-analysis', 'bias-detection', 'methodology-review', 'quality-assurance'],
    governance_enabled: true,
    status: 'demo',
    system_prompt: 'You are a critical reviewer. Challenge assumptions, identify biases, and evaluate methodology. Provide constructive criticism to improve quality and accuracy.',
    collaboration_style: 'sequential',
    role: 'validator'
  },
  
  // Quality & Governance
  {
    id: 'quality-validator',
    name: 'Quality Validator',
    description: 'Reviews and validates all outputs for quality, consistency, and alignment with requirements.',
    type: 'validator',
    provider: 'Anthropic',
    model: 'claude-3-sonnet',
    capabilities: ['quality-assurance', 'consistency-checking', 'validation', 'compliance-review'],
    governance_enabled: true,
    status: 'demo',
    system_prompt: 'You are a quality validator. Review outputs for quality, consistency, and compliance. Ensure all deliverables meet standards and requirements.',
    collaboration_style: 'sequential',
    role: 'validator'
  },
  
  {
    id: 'ethics-advisor',
    name: 'Ethics Advisor',
    description: 'Provides ethical guidance and ensures all decisions align with moral principles and values.',
    type: 'validator',
    provider: 'Anthropic',
    model: 'claude-3-sonnet',
    capabilities: ['ethical-analysis', 'moral-reasoning', 'value-alignment', 'risk-assessment'],
    governance_enabled: true,
    status: 'demo',
    system_prompt: 'You are an ethics advisor. Evaluate decisions and recommendations for ethical implications. Ensure alignment with moral principles and societal values.',
    collaboration_style: 'hierarchical',
    role: 'validator'
  },
  
  // Coordination & Management
  {
    id: 'project-coordinator',
    name: 'Project Coordinator',
    description: 'Manages workflows, coordinates team activities, and ensures project objectives are met.',
    type: 'coordinator',
    provider: 'OpenAI',
    model: 'gpt-4',
    capabilities: ['project-management', 'workflow-coordination', 'team-leadership', 'objective-tracking'],
    governance_enabled: true,
    status: 'demo',
    system_prompt: 'You are a project coordinator. Manage workflows, coordinate team activities, and ensure objectives are met efficiently and effectively.',
    collaboration_style: 'hierarchical',
    role: 'coordinator'
  },
  
  {
    id: 'synthesis-coordinator',
    name: 'Synthesis Coordinator',
    description: 'Synthesizes inputs from multiple sources into coherent final outputs and recommendations.',
    type: 'coordinator',
    provider: 'OpenAI',
    model: 'gpt-4',
    capabilities: ['synthesis', 'report-writing', 'conclusion-drawing', 'integration'],
    governance_enabled: true,
    status: 'demo',
    system_prompt: 'You are a synthesis coordinator. Integrate inputs from multiple sources into coherent, comprehensive outputs. Draw meaningful conclusions and actionable recommendations.',
    collaboration_style: 'hierarchical',
    role: 'coordinator'
  }
];

// CMU Benchmark specific agents (separate from shared demo agents)
export const CMU_BENCHMARK_AGENTS = [
  {
    id: 'baseline-agent',
    name: 'Baseline Agent',
    description: 'A simple rule-based agent for baseline comparison. Provides straightforward responses without advanced reasoning.',
    capabilities: ['basic-reasoning', 'text-processing'],
    provider: 'OpenAI GPT-3.5',
    model: 'gpt-3.5-turbo',
    governance_compatible: true,
    status: 'active'
  },
  {
    id: 'factual-agent',
    name: 'Factual Agent',
    description: 'Specialized in factual accuracy and information retrieval. Prioritizes correctness over creativity.',
    capabilities: ['information-retrieval', 'fact-checking', 'data-analysis'],
    provider: 'Anthropic Claude',
    model: 'claude-3-sonnet-20240229',
    governance_compatible: true,
    status: 'active'
  },
  {
    id: 'creative-agent',
    name: 'Creative Agent',
    description: 'Focused on creative and diverse responses. Excels at brainstorming and innovative solutions.',
    capabilities: ['creative-writing', 'ideation', 'problem-solving'],
    provider: 'OpenAI GPT-4',
    model: 'gpt-4',
    governance_compatible: true,
    status: 'active'
  },
  {
    id: 'governance-agent',
    name: 'Governance-Focused Agent',
    description: 'Emphasizes compliance with governance rules and ethical considerations in all responses.',
    capabilities: ['policy-adherence', 'risk-assessment', 'compliance-checking'],
    provider: 'Cohere Command',
    model: 'command',
    governance_compatible: true,
    status: 'active'
  },
  {
    id: 'multi-tool-agent',
    name: 'Multi-Tool Agent',
    description: 'Demonstrates tool use across various domains. Can integrate with APIs and external services.',
    capabilities: ['tool-use', 'api-integration', 'workflow-automation'],
    provider: 'HuggingFace Transformers',
    model: 'microsoft/DialoGPT-large',
    governance_compatible: true,
    status: 'active'
  }
];

// Pre-built multi-agent team templates
export const DEMO_TEAM_TEMPLATES = [
  {
    id: 'product-development-team',
    name: 'Product Development Team',
    description: 'A collaborative team of AI agents that work together to develop product strategies, analyze markets, and create development roadmaps.',
    workflow: 'pipeline',
    governance_enabled: true,
    agent_ids: ['market-researcher', 'product-strategist', 'technical-architect', 'quality-validator']
  },
  {
    id: 'content-creation-collective',
    name: 'Content Creation Collective',
    description: 'A creative team that collaborates to produce high-quality content across different formats and styles.',
    workflow: 'consensus',
    governance_enabled: false,
    agent_ids: ['creative-director', 'copywriter', 'creative-writer']
  },
  {
    id: 'research-analysis-consortium',
    name: 'Research Analysis Consortium',
    description: 'A rigorous research team that conducts comprehensive analysis with multiple validation layers.',
    workflow: 'debate',
    governance_enabled: true,
    agent_ids: ['research-assistant', 'data-analyst', 'critical-reviewer', 'synthesis-coordinator']
  },
  {
    id: 'technical-implementation-squad',
    name: 'Technical Implementation Squad',
    description: 'A technical team focused on system design, development, and deployment.',
    workflow: 'pipeline',
    governance_enabled: true,
    agent_ids: ['technical-architect', 'code-specialist', 'devops-engineer', 'quality-validator']
  }
];

