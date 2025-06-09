/**
 * Multi-Agent Workflow Scenarios
 * 
 * Complex scenarios requiring sequential collaboration between all 4 demo agents
 * with clear handoffs and dependencies.
 */

export interface WorkflowStep {
  stepNumber: number;
  agentId: string;
  agentRole: string;
  taskTitle: string;
  taskDescription: string;
  inputFrom?: number[]; // Previous step numbers this depends on
  outputTo?: number[]; // Next step numbers that depend on this
  deliverables: string[];
  estimatedTime: string;
  criticalQuestions: string[];
}

export interface MultiAgentWorkflow {
  id: string;
  title: string;
  description: string;
  businessContext: string;
  totalSteps: number;
  estimatedDuration: string;
  steps: WorkflowStep[];
  successCriteria: string[];
  governanceImpact: {
    withGovernance: string[];
    withoutGovernance: string[];
  };
  riskFactors: string[];
}

class MultiAgentWorkflowService {

  /**
   * Get complex multi-agent workflow scenarios
   */
  static getWorkflowScenarios(): MultiAgentWorkflow[] {
    return [
      {
        id: 'ai-feature-launch',
        title: 'AI-Powered Analytics Feature Launch',
        description: 'End-to-end development and launch of a new AI analytics feature for our SaaS platform',
        businessContext: `Our SaaS platform currently serves 50,000 users. Customer feedback indicates strong demand for AI-powered insights and predictive analytics. We have 6 months and a $500K budget to deliver this feature. Success could increase our market share by 15% and justify a Series B funding round.`,
        totalSteps: 8,
        estimatedDuration: '6 months',
        steps: [
          {
            stepNumber: 1,
            agentId: 'demo-product-manager',
            agentRole: 'Product Management Agent',
            taskTitle: 'Market Analysis & Requirements Definition',
            taskDescription: `Conduct comprehensive market analysis for AI analytics feature. Define detailed product requirements, user stories, and success metrics.`,
            deliverables: [
              'Market opportunity assessment',
              'Competitive analysis report',
              'Detailed product requirements document (PRD)',
              'User stories and acceptance criteria',
              'Success metrics and KPIs',
              'Go-to-market strategy outline'
            ],
            estimatedTime: '3 weeks',
            criticalQuestions: [
              'What specific AI capabilities do users want most?',
              'How do competitors position their AI features?',
              'What pricing model will maximize adoption?',
              'What are the must-have vs nice-to-have features?'
            ]
          },
          {
            stepNumber: 2,
            agentId: 'demo-software-engineer',
            agentRole: 'Software Engineering Agent',
            taskTitle: 'Technical Architecture & Feasibility Analysis',
            taskDescription: `Review product requirements and design technical architecture. Assess feasibility, identify risks, and create development roadmap.`,
            inputFrom: [1],
            deliverables: [
              'Technical architecture document',
              'AI/ML model selection and rationale',
              'Infrastructure requirements',
              'Development effort estimates',
              'Technical risk assessment',
              'API design specifications'
            ],
            estimatedTime: '4 weeks',
            criticalQuestions: [
              'Which AI models best fit our requirements?',
              'How will we handle data privacy and security?',
              'What infrastructure scaling is needed?',
              'Are there any technical blockers?'
            ]
          },
          {
            stepNumber: 3,
            agentId: 'demo-data-analyst',
            agentRole: 'Data Analysis Agent',
            taskTitle: 'Data Assessment & Model Validation',
            taskDescription: `Analyze existing data quality and availability. Validate AI model assumptions and create data pipeline requirements.`,
            inputFrom: [1, 2],
            deliverables: [
              'Data quality assessment report',
              'Data pipeline requirements',
              'Model training dataset specifications',
              'Privacy and compliance analysis',
              'Baseline metrics establishment',
              'Data collection strategy'
            ],
            estimatedTime: '3 weeks',
            criticalQuestions: [
              'Is our data sufficient for training AI models?',
              'What data quality issues need addressing?',
              'How will we ensure model accuracy?',
              'What privacy regulations apply?'
            ]
          },
          {
            stepNumber: 4,
            agentId: 'demo-hr-specialist',
            agentRole: 'Human Resources Agent',
            taskTitle: 'Team Assessment & Talent Planning',
            taskDescription: `Evaluate current team capabilities and plan for additional talent needs. Address skill gaps and training requirements.`,
            inputFrom: [2, 3],
            deliverables: [
              'Skills gap analysis',
              'Hiring plan for AI/ML specialists',
              'Training program for existing team',
              'Team structure recommendations',
              'Budget requirements for talent',
              'Timeline for team scaling'
            ],
            estimatedTime: '2 weeks',
            criticalQuestions: [
              'Do we have sufficient AI/ML expertise?',
              'Should we hire full-time or use contractors?',
              'What training does the existing team need?',
              'How will this impact team dynamics?'
            ]
          },
          {
            stepNumber: 5,
            agentId: 'demo-software-engineer',
            agentRole: 'Software Engineering Agent',
            taskTitle: 'Development Planning & Implementation Start',
            taskDescription: `Create detailed development plan and begin implementation. Set up development environment and start core feature development.`,
            inputFrom: [3, 4],
            outputTo: [6],
            deliverables: [
              'Detailed development roadmap',
              'Sprint planning and milestones',
              'Development environment setup',
              'Core AI model implementation',
              'API endpoints development',
              'Initial testing framework'
            ],
            estimatedTime: '8 weeks',
            criticalQuestions: [
              'How will we ensure code quality?',
              'What testing strategies will we use?',
              'How will we handle model versioning?',
              'What monitoring will we implement?'
            ]
          },
          {
            stepNumber: 6,
            agentId: 'demo-data-analyst',
            agentRole: 'Data Analysis Agent',
            taskTitle: 'Model Training & Performance Validation',
            taskDescription: `Train AI models, validate performance, and create monitoring dashboards. Ensure models meet accuracy requirements.`,
            inputFrom: [5],
            outputTo: [7],
            deliverables: [
              'Trained AI models',
              'Model performance reports',
              'Validation test results',
              'Monitoring dashboards',
              'Performance benchmarks',
              'Model documentation'
            ],
            estimatedTime: '4 weeks',
            criticalQuestions: [
              'Do models meet accuracy requirements?',
              'How will we detect model drift?',
              'What bias testing have we performed?',
              'Are performance metrics acceptable?'
            ]
          },
          {
            stepNumber: 7,
            agentId: 'demo-product-manager',
            agentRole: 'Product Management Agent',
            taskTitle: 'Beta Testing & Launch Preparation',
            taskDescription: `Coordinate beta testing with select customers. Prepare launch materials and finalize go-to-market strategy.`,
            inputFrom: [6],
            outputTo: [8],
            deliverables: [
              'Beta testing program',
              'Customer feedback analysis',
              'Launch marketing materials',
              'Pricing strategy finalization',
              'Sales team training materials',
              'Customer support documentation'
            ],
            estimatedTime: '4 weeks',
            criticalQuestions: [
              'Are beta users satisfied with the feature?',
              'What improvements are needed before launch?',
              'Is our pricing competitive?',
              'Are we ready for customer support?'
            ]
          },
          {
            stepNumber: 8,
            agentId: 'demo-hr-specialist',
            agentRole: 'Human Resources Agent',
            taskTitle: 'Launch Support & Team Optimization',
            taskDescription: `Ensure team is prepared for launch support. Plan post-launch team structure and ongoing development needs.`,
            inputFrom: [7],
            deliverables: [
              'Launch support team structure',
              'On-call rotation planning',
              'Post-launch hiring strategy',
              'Team performance evaluation',
              'Knowledge transfer documentation',
              'Long-term team development plan'
            ],
            estimatedTime: '2 weeks',
            criticalQuestions: [
              'Is the team prepared for launch volume?',
              'What ongoing support will be needed?',
              'How will we retain key talent?',
              'What skills will we need for future iterations?'
            ]
          }
        ],
        successCriteria: [
          'Feature launches on time and within budget',
          'AI models achieve >85% accuracy on validation data',
          'Beta users report >4.0/5.0 satisfaction',
          'Technical architecture supports 10x user growth',
          'Team is fully trained and capable of ongoing support',
          'Go-to-market strategy drives >20% feature adoption in first quarter'
        ],
        governanceImpact: {
          withGovernance: [
            'Systematic consideration of ethical AI implications',
            'Thorough privacy and bias testing',
            'Clear documentation and decision rationale',
            'Stakeholder concerns properly addressed',
            'Risk mitigation strategies implemented',
            'Quality gates enforced at each handoff',
            'Transparent communication throughout process'
          ],
          withoutGovernance: [
            'May skip ethical considerations',
            'Insufficient testing for bias and privacy',
            'Poor documentation and knowledge transfer',
            'Stakeholder concerns overlooked',
            'Risks not properly assessed',
            'Quality issues in handoffs between agents',
            'Communication gaps and misalignment'
          ]
        },
        riskFactors: [
          'AI model accuracy below requirements',
          'Data quality issues discovered late',
          'Key talent leaves during development',
          'Competitive feature launched first',
          'Regulatory changes affecting AI features',
          'Technical infrastructure limitations',
          'Customer adoption lower than expected'
        ]
      },
      {
        id: 'security-incident-response',
        title: 'Major Security Incident Response & Recovery',
        description: 'Comprehensive response to a critical security breach affecting customer data',
        businessContext: `A security vulnerability in our payment processing system has been exploited. Customer payment data may have been accessed. We must respond immediately to contain the breach, assess damage, communicate with stakeholders, and implement long-term security improvements. Regulatory compliance and customer trust are at stake.`,
        totalSteps: 6,
        estimatedDuration: '4-6 weeks',
        steps: [
          {
            stepNumber: 1,
            agentId: 'demo-software-engineer',
            agentRole: 'Software Engineering Agent',
            taskTitle: 'Immediate Technical Response & Containment',
            taskDescription: `Assess the security breach, contain the vulnerability, and implement immediate technical fixes.`,
            deliverables: [
              'Vulnerability assessment report',
              'Immediate containment measures',
              'Technical root cause analysis',
              'Emergency patches and fixes',
              'System security audit',
              'Incident timeline documentation'
            ],
            estimatedTime: '1 week',
            criticalQuestions: [
              'What data was potentially compromised?',
              'How was the system breached?',
              'Are there other vulnerabilities?',
              'What immediate fixes are needed?'
            ]
          },
          {
            stepNumber: 2,
            agentId: 'demo-data-analyst',
            agentRole: 'Data Analysis Agent',
            taskTitle: 'Impact Assessment & Forensic Analysis',
            taskDescription: `Analyze logs and data to determine the full scope of the breach and identify affected customers.`,
            inputFrom: [1],
            deliverables: [
              'Breach impact assessment',
              'Affected customer identification',
              'Data access timeline analysis',
              'Forensic evidence documentation',
              'Compliance violation assessment',
              'Risk scoring for affected accounts'
            ],
            estimatedTime: '1 week',
            criticalQuestions: [
              'How many customers were affected?',
              'What specific data was accessed?',
              'When did the breach occur?',
              'What regulatory requirements apply?'
            ]
          },
          {
            stepNumber: 3,
            agentId: 'demo-product-manager',
            agentRole: 'Product Management Agent',
            taskTitle: 'Stakeholder Communication & Business Impact',
            taskDescription: `Develop communication strategy for customers, regulators, and stakeholders. Assess business impact and recovery plan.`,
            inputFrom: [1, 2],
            deliverables: [
              'Customer communication plan',
              'Regulatory notification strategy',
              'Business impact assessment',
              'Recovery timeline and milestones',
              'Competitive impact analysis',
              'Customer retention strategy'
            ],
            estimatedTime: '1 week',
            criticalQuestions: [
              'How do we maintain customer trust?',
              'What regulatory notifications are required?',
              'What is the business impact?',
              'How do we prevent customer churn?'
            ]
          },
          {
            stepNumber: 4,
            agentId: 'demo-hr-specialist',
            agentRole: 'Human Resources Agent',
            taskTitle: 'Team Response & Crisis Management',
            taskDescription: `Coordinate team response, manage crisis communication internally, and plan for additional security expertise.`,
            inputFrom: [1, 2, 3],
            deliverables: [
              'Crisis response team structure',
              'Internal communication plan',
              'Security expertise hiring plan',
              'Team stress and workload assessment',
              'Training program for security awareness',
              'Post-incident team support plan'
            ],
            estimatedTime: '1 week',
            criticalQuestions: [
              'Do we have sufficient security expertise?',
              'How is the team handling the crisis?',
              'What additional resources are needed?',
              'How do we prevent future incidents?'
            ]
          },
          {
            stepNumber: 5,
            agentId: 'demo-software-engineer',
            agentRole: 'Software Engineering Agent',
            taskTitle: 'Long-term Security Improvements',
            taskDescription: `Implement comprehensive security improvements and establish ongoing security practices.`,
            inputFrom: [4],
            deliverables: [
              'Comprehensive security architecture',
              'Enhanced monitoring and alerting',
              'Security testing automation',
              'Code review security guidelines',
              'Incident response procedures',
              'Security training materials'
            ],
            estimatedTime: '3-4 weeks',
            criticalQuestions: [
              'How do we prevent similar breaches?',
              'What security tools should we implement?',
              'How do we maintain security standards?',
              'What ongoing monitoring is needed?'
            ]
          },
          {
            stepNumber: 6,
            agentId: 'demo-data-analyst',
            agentRole: 'Data Analysis Agent',
            taskTitle: 'Recovery Monitoring & Effectiveness Analysis',
            taskDescription: `Monitor recovery progress, analyze the effectiveness of implemented measures, and establish ongoing security metrics.`,
            inputFrom: [5],
            deliverables: [
              'Recovery progress dashboard',
              'Security metrics framework',
              'Incident response effectiveness analysis',
              'Customer trust recovery tracking',
              'Compliance status monitoring',
              'Lessons learned documentation'
            ],
            estimatedTime: '2 weeks',
            criticalQuestions: [
              'Are our security improvements effective?',
              'How is customer trust recovering?',
              'What metrics should we track ongoing?',
              'What lessons have we learned?'
            ]
          }
        ],
        successCriteria: [
          'Breach contained within 24 hours',
          'All affected customers notified within regulatory timeframes',
          'No additional security incidents for 6 months post-recovery',
          'Customer churn rate returns to pre-incident levels within 3 months',
          'Regulatory compliance maintained throughout response',
          'Team security awareness and capabilities significantly improved'
        ],
        governanceImpact: {
          withGovernance: [
            'Ethical handling of customer data and privacy',
            'Transparent and timely communication',
            'Systematic approach to risk assessment',
            'Proper consideration of all stakeholder impacts',
            'Compliance with all regulatory requirements',
            'Fair treatment of affected customers',
            'Thorough documentation for accountability'
          ],
          withoutGovernance: [
            'May prioritize business interests over customer protection',
            'Delayed or inadequate communication',
            'Rushed response without proper risk assessment',
            'Stakeholder concerns not fully addressed',
            'Potential regulatory violations',
            'Inconsistent customer treatment',
            'Poor documentation and accountability'
          ]
        },
        riskFactors: [
          'Additional vulnerabilities discovered',
          'Regulatory penalties and legal action',
          'Significant customer churn',
          'Reputation damage affecting new customer acquisition',
          'Key team members overwhelmed by crisis response',
          'Insufficient resources for comprehensive security improvements',
          'Competitive advantage lost to more secure alternatives'
        ]
      }
    ];
  }

  /**
   * Get workflow scenario by ID
   */
  static getWorkflowScenario(workflowId: string): MultiAgentWorkflow | null {
    const workflows = this.getWorkflowScenarios();
    return workflows.find(workflow => workflow.id === workflowId) || null;
  }

  /**
   * Get next step in workflow
   */
  static getNextStep(workflowId: string, currentStep: number): WorkflowStep | null {
    const workflow = this.getWorkflowScenario(workflowId);
    if (!workflow) return null;
    
    return workflow.steps.find(step => step.stepNumber === currentStep + 1) || null;
  }

  /**
   * Get steps for a specific agent in a workflow
   */
  static getAgentSteps(workflowId: string, agentId: string): WorkflowStep[] {
    const workflow = this.getWorkflowScenario(workflowId);
    if (!workflow) return [];
    
    return workflow.steps.filter(step => step.agentId === agentId);
  }

  /**
   * Check if step dependencies are met
   */
  static areStepDependenciesMet(workflowId: string, stepNumber: number, completedSteps: number[]): boolean {
    const workflow = this.getWorkflowScenario(workflowId);
    if (!workflow) return false;
    
    const step = workflow.steps.find(s => s.stepNumber === stepNumber);
    if (!step || !step.inputFrom) return true;
    
    return step.inputFrom.every(dependency => completedSteps.includes(dependency));
  }
}

export default MultiAgentWorkflowService;

