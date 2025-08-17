/**
 * Tool Configuration Types
 * 
 * Defines the structure for agent tool configurations including
 * enterprise integrations, communication tools, and business tools.
 */

export interface ToolCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
}

export interface ToolConfiguration {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: string;
  enabled: boolean;
  tier: 'basic' | 'professional' | 'enterprise';
  pricing?: {
    monthly: number;
    annual: number;
    usage_based?: boolean;
  };
  configuration: Record<string, any>;
  credentials?: Record<string, string>;
  metadata?: Record<string, any>;
}

export interface AgentToolProfile {
  agentId: string;
  enabledTools: string[];
  toolConfigurations: Record<string, ToolConfiguration>;
  lastUpdated: Date;
  totalToolsEnabled: number;
  enterpriseToolsEnabled: number;
}

// Tool Categories
export const TOOL_CATEGORIES: ToolCategory[] = [
  {
    id: 'web_search',
    name: 'Web & Search',
    description: 'Web browsing, search, and content analysis tools',
    icon: 'Search',
    color: '#3b82f6'
  },
  {
    id: 'communication',
    name: 'Communication',
    description: 'Email, SMS, chat, and messaging integrations',
    icon: 'MessageSquare',
    color: '#10b981'
  },
  {
    id: 'ecommerce',
    name: 'E-commerce',
    description: 'Shopify, WooCommerce, payment processing',
    icon: 'ShoppingCart',
    color: '#f59e0b'
  },
  {
    id: 'business',
    name: 'Business Tools',
    description: 'CRM, calendar, documents, spreadsheets',
    icon: 'Briefcase',
    color: '#8b5cf6'
  },
  {
    id: 'social_media',
    name: 'Social Media',
    description: 'Social platform posting and management',
    icon: 'Share2',
    color: '#ef4444'
  },
  {
    id: 'analytics',
    name: 'Analytics & Data',
    description: 'Data analysis, reporting, and insights',
    icon: 'BarChart3',
    color: '#06b6d4'
  },
  {
    id: 'automation',
    name: 'Automation',
    description: 'Workflow automation and task scheduling',
    icon: 'Zap',
    color: '#84cc16'
  },
  {
    id: 'content',
    name: 'Content Creation',
    description: 'Document, image, and media generation',
    icon: 'FileText',
    color: '#f97316'
  }
];

// Available Tools
export const AVAILABLE_TOOLS: ToolConfiguration[] = [
  // Web & Search Tools
  {
    id: 'web_search',
    name: 'Web Search',
    description: 'Search the web for current information and answers',
    category: 'web_search',
    icon: 'Search',
    enabled: true, // Default tool - enabled by default
    tier: 'basic',
    configuration: {
      search_engine: 'google',
      max_results: 10,
      safe_search: true
    }
  },
  {
    id: 'web_scraping',
    name: 'Web Scraping',
    description: 'Extract data from websites and web pages',
    category: 'web_search',
    icon: 'Globe',
    enabled: false,
    tier: 'professional',
    pricing: { monthly: 29, annual: 290 },
    configuration: {
      max_pages: 100,
      respect_robots_txt: true,
      rate_limit: 1000
    }
  },
  {
    id: 'seo_analysis',
    name: 'SEO Analysis',
    description: 'Analyze website SEO performance and recommendations',
    category: 'web_search',
    icon: 'TrendingUp',
    enabled: false,
    tier: 'enterprise',
    pricing: { monthly: 99, annual: 990 },
    configuration: {
      analysis_depth: 'comprehensive',
      competitor_analysis: true
    }
  },

  // Communication Tools
  {
    id: 'email_sending',
    name: 'Email Sending',
    description: 'Send emails via SMTP, SendGrid, or Mailgun',
    category: 'communication',
    icon: 'Mail',
    enabled: false,
    tier: 'basic',
    configuration: {
      provider: 'sendgrid',
      daily_limit: 100
    },
    credentials: {
      api_key: '',
      sender_email: '',
      sender_name: ''
    }
  },
  {
    id: 'sms_messaging',
    name: 'SMS Messaging',
    description: 'Send SMS messages via Twilio or similar services',
    category: 'communication',
    icon: 'MessageSquare',
    enabled: false,
    tier: 'professional',
    pricing: { monthly: 19, annual: 190, usage_based: true },
    configuration: {
      provider: 'twilio',
      country_codes: ['US', 'CA', 'UK']
    },
    credentials: {
      account_sid: '',
      auth_token: '',
      phone_number: ''
    }
  },
  {
    id: 'slack_integration',
    name: 'Slack Integration',
    description: 'Post messages and interact with Slack workspaces',
    category: 'communication',
    icon: 'MessageCircle',
    enabled: false,
    tier: 'professional',
    pricing: { monthly: 15, annual: 150 },
    configuration: {
      default_channel: '#general',
      mention_users: false
    },
    credentials: {
      bot_token: '',
      workspace_id: ''
    }
  },

  // E-commerce Tools
  {
    id: 'shopify_integration',
    name: 'Shopify Integration',
    description: 'Manage products, orders, and inventory on Shopify',
    category: 'ecommerce',
    icon: 'ShoppingBag',
    enabled: false,
    tier: 'enterprise',
    pricing: { monthly: 79, annual: 790 },
    configuration: {
      store_url: '',
      webhook_endpoints: [],
      sync_inventory: true
    },
    credentials: {
      api_key: '',
      api_secret: '',
      access_token: ''
    }
  },
  {
    id: 'stripe_payments',
    name: 'Stripe Payments',
    description: 'Process payments and manage billing with Stripe',
    category: 'ecommerce',
    icon: 'CreditCard',
    enabled: false,
    tier: 'professional',
    pricing: { monthly: 39, annual: 390 },
    configuration: {
      currency: 'USD',
      capture_method: 'automatic'
    },
    credentials: {
      publishable_key: '',
      secret_key: '',
      webhook_secret: ''
    }
  },
  {
    id: 'woocommerce_integration',
    name: 'WooCommerce Integration',
    description: 'Manage WooCommerce store products and orders',
    category: 'ecommerce',
    icon: 'Store',
    enabled: false,
    tier: 'enterprise',
    pricing: { monthly: 59, annual: 590 },
    configuration: {
      store_url: '',
      version: 'v3'
    },
    credentials: {
      consumer_key: '',
      consumer_secret: ''
    }
  },

  // Business Tools
  {
    id: 'salesforce_crm',
    name: 'Salesforce CRM',
    description: 'Manage leads, contacts, and opportunities in Salesforce',
    category: 'business',
    icon: 'Users',
    enabled: false,
    tier: 'enterprise',
    pricing: { monthly: 149, annual: 1490 },
    configuration: {
      instance_url: '',
      api_version: '58.0'
    },
    credentials: {
      client_id: '',
      client_secret: '',
      username: '',
      password: '',
      security_token: ''
    }
  },
  {
    id: 'google_calendar',
    name: 'Google Calendar',
    description: 'Schedule meetings and manage calendar events',
    category: 'business',
    icon: 'Calendar',
    enabled: false,
    tier: 'professional',
    pricing: { monthly: 25, annual: 250 },
    configuration: {
      timezone: 'UTC',
      default_duration: 30
    },
    credentials: {
      client_id: '',
      client_secret: '',
      refresh_token: ''
    }
  },
  {
    id: 'document_generation',
    name: 'Document Generation',
    description: 'Generate PDF, Word, and other document formats',
    category: 'content',
    icon: 'FileText',
    enabled: true, // Default tool - enabled by default
    tier: 'basic',
    configuration: {
      formats: ['pdf', 'docx'],
      templates_enabled: true
    }
  },

  // Social Media Tools
  {
    id: 'twitter_posting',
    name: 'Twitter/X Posting',
    description: 'Post tweets and manage Twitter/X presence',
    category: 'social_media',
    icon: 'Twitter',
    enabled: false,
    tier: 'professional',
    pricing: { monthly: 35, annual: 350 },
    configuration: {
      auto_hashtags: false,
      character_limit: 280
    },
    credentials: {
      api_key: '',
      api_secret: '',
      access_token: '',
      access_token_secret: ''
    }
  },
  {
    id: 'linkedin_posting',
    name: 'LinkedIn Posting',
    description: 'Share content and manage LinkedIn company pages',
    category: 'social_media',
    icon: 'Linkedin',
    enabled: false,
    tier: 'enterprise',
    pricing: { monthly: 89, annual: 890 },
    configuration: {
      post_types: ['text', 'image', 'article'],
      auto_publish: false
    },
    credentials: {
      client_id: '',
      client_secret: '',
      access_token: ''
    }
  },

  // Analytics & Data Tools
  {
    id: 'google_analytics',
    name: 'Google Analytics',
    description: 'Access website analytics and performance data',
    category: 'analytics',
    icon: 'BarChart3',
    enabled: false,
    tier: 'professional',
    pricing: { monthly: 45, annual: 450 },
    configuration: {
      property_id: '',
      date_range: '30d'
    },
    credentials: {
      service_account_key: ''
    }
  },
  {
    id: 'data_visualization',
    name: 'Data Visualization',
    description: 'Create charts, graphs, and visual reports',
    category: 'analytics',
    icon: 'PieChart',
    enabled: true, // Default tool - enabled by default
    tier: 'basic',
    configuration: {
      chart_types: ['bar', 'line', 'pie', 'scatter'],
      export_formats: ['png', 'svg', 'pdf']
    }
  },
  {
    id: 'coding_programming',
    name: 'Coding & Programming',
    description: 'Write, execute, and debug code in multiple programming languages',
    category: 'content',
    icon: 'Code',
    enabled: true, // Default tool - enabled by default
    tier: 'basic',
    configuration: {
      languages: ['python', 'javascript', 'typescript', 'html', 'css', 'sql'],
      execution_timeout: 30,
      memory_limit: '512MB',
      allow_file_operations: true,
      allow_network_access: false
    }
  },

  // Automation Tools
  {
    id: 'zapier_integration',
    name: 'Zapier Integration',
    description: 'Connect with 5000+ apps via Zapier workflows',
    category: 'automation',
    icon: 'Zap',
    enabled: false,
    tier: 'enterprise',
    pricing: { monthly: 199, annual: 1990 },
    configuration: {
      webhook_url: '',
      trigger_events: []
    },
    credentials: {
      api_key: ''
    }
  },
  {
    id: 'workflow_automation',
    name: 'Workflow Automation',
    description: 'Create custom automated workflows and tasks',
    category: 'automation',
    icon: 'GitBranch',
    enabled: false,
    tier: 'professional',
    pricing: { monthly: 69, annual: 690 },
    configuration: {
      max_workflows: 50,
      execution_timeout: 300
    }
  }
];

// Default tools that should be enabled for all new agents
export const DEFAULT_ENABLED_TOOLS = [
  'web_search',
  'document_generation', 
  'data_visualization',
  'coding_programming'
];

export interface ToolUsageMetrics {
  toolId: string;
  usageCount: number;
  lastUsed: Date;
  successRate: number;
  averageResponseTime: number;
  errorCount: number;
}

export interface ToolConfigurationEvent {
  type: 'tool_enabled' | 'tool_disabled' | 'tool_configured' | 'credentials_updated';
  toolId: string;
  agentId: string;
  timestamp: Date;
  userId: string;
  metadata?: Record<string, any>;
}

