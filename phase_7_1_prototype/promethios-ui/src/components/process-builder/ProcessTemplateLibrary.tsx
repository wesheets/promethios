import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  Star, 
  Download, 
  Eye, 
  Clock, 
  Users, 
  TrendingUp,
  Shield,
  Zap,
  Brain,
  Target,
  CheckCircle,
  AlertTriangle,
  Info,
  Heart,
  Share2,
  Copy,
  Play
} from 'lucide-react';

// Template interfaces
interface ProcessTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';
  estimatedDuration: string;
  agentCount: number;
  successRate: number;
  usageCount: number;
  rating: number;
  reviewCount: number;
  author: string;
  created: Date;
  updated: Date;
  tags: string[];
  governanceRequirements: string[];
  qualityThreshold: number;
  icon: string;
  color: string;
  preview: {
    agents: string[];
    orchestrator: string;
    keyFeatures: string[];
    outcomes: string[];
  };
  isVerified: boolean;
  isPremium: boolean;
  isFavorited?: boolean;
}

interface TemplateCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  templateCount: number;
}

// Sample template data
const TEMPLATE_CATEGORIES: TemplateCategory[] = [
  {
    id: 'business-development',
    name: 'Business Development',
    description: 'SaaS building, market entry, business planning',
    icon: '🚀',
    color: '#8B5CF6',
    templateCount: 12
  },
  {
    id: 'research-analysis',
    name: 'Research & Analysis',
    description: 'Market research, competitive analysis, data insights',
    icon: '🔍',
    color: '#3B82F6',
    templateCount: 8
  },
  {
    id: 'content-marketing',
    name: 'Content & Marketing',
    description: 'Content creation, marketing campaigns, brand strategy',
    icon: '📢',
    color: '#10B981',
    templateCount: 15
  },
  {
    id: 'financial-planning',
    name: 'Financial Planning',
    description: 'Investment analysis, financial modeling, risk assessment',
    icon: '💰',
    color: '#F59E0B',
    templateCount: 6
  },
  {
    id: 'product-development',
    name: 'Product Development',
    description: 'Product design, feature planning, user research',
    icon: '🛠️',
    color: '#EF4444',
    templateCount: 10
  },
  {
    id: 'customer-support',
    name: 'Customer Support',
    description: 'Support automation, customer success, issue resolution',
    icon: '🎧',
    color: '#06B6D4',
    templateCount: 7
  }
];

const SAMPLE_TEMPLATES: ProcessTemplate[] = [
  {
    id: 'saas-builder-pro',
    name: 'SaaS Business Builder Pro',
    description: 'Complete end-to-end SaaS development process with market validation, technical architecture, and go-to-market strategy',
    category: 'business-development',
    difficulty: 'Advanced',
    estimatedDuration: '4-6 weeks',
    agentCount: 7,
    successRate: 89,
    usageCount: 234,
    rating: 4.8,
    reviewCount: 47,
    author: 'AI Ventures Team',
    created: new Date('2024-01-15'),
    updated: new Date('2024-02-01'),
    tags: ['SaaS', 'Business Planning', 'Market Validation', 'Technical Architecture'],
    governanceRequirements: ['audit_logging', 'policy_compliance', 'quality_assurance'],
    qualityThreshold: 8.5,
    icon: '🚀',
    color: '#8B5CF6',
    preview: {
      agents: ['Market Researcher', 'Business Strategist', 'Technical Architect', 'Financial Analyst', 'Marketing Specialist', 'Devil\'s Advocate', 'Quality Guardian'],
      orchestrator: 'Innovative Director',
      keyFeatures: [
        'Comprehensive market validation',
        'Technical architecture planning',
        'Financial modeling and projections',
        'Go-to-market strategy development',
        'Risk assessment and mitigation',
        'Quality assurance throughout'
      ],
      outcomes: [
        'Validated business concept',
        'Technical implementation roadmap',
        'Financial projections and funding strategy',
        'Marketing and sales strategy',
        'Risk mitigation plan'
      ]
    },
    isVerified: true,
    isPremium: false,
    isFavorited: false
  },
  {
    id: 'market-research-comprehensive',
    name: 'Comprehensive Market Research',
    description: 'Deep market analysis with competitive intelligence, trend analysis, and customer insights',
    category: 'research-analysis',
    difficulty: 'Intermediate',
    estimatedDuration: '1-2 weeks',
    agentCount: 4,
    successRate: 94,
    usageCount: 156,
    rating: 4.9,
    reviewCount: 32,
    author: 'Research Collective',
    created: new Date('2024-01-20'),
    updated: new Date('2024-01-28'),
    tags: ['Market Research', 'Competitive Analysis', 'Customer Insights', 'Trend Analysis'],
    governanceRequirements: ['audit_logging', 'data_privacy'],
    qualityThreshold: 8.0,
    icon: '🔍',
    color: '#3B82F6',
    preview: {
      agents: ['Market Researcher', 'Competitive Analyst', 'Trend Analyst', 'Skeptical Examiner'],
      orchestrator: 'Analytical Coordinator',
      keyFeatures: [
        'Multi-source market data collection',
        'Competitive landscape mapping',
        'Customer behavior analysis',
        'Trend identification and forecasting',
        'Data validation and verification'
      ],
      outcomes: [
        'Comprehensive market report',
        'Competitive positioning analysis',
        'Customer persona profiles',
        'Market opportunity assessment',
        'Strategic recommendations'
      ]
    },
    isVerified: true,
    isPremium: false,
    isFavorited: true
  },
  {
    id: 'content-marketing-engine',
    name: 'AI Content Marketing Engine',
    description: 'Automated content creation and marketing campaign management with brand consistency',
    category: 'content-marketing',
    difficulty: 'Intermediate',
    estimatedDuration: '2-3 weeks',
    agentCount: 5,
    successRate: 87,
    usageCount: 298,
    rating: 4.7,
    reviewCount: 61,
    author: 'Content Masters',
    created: new Date('2024-01-10'),
    updated: new Date('2024-02-05'),
    tags: ['Content Creation', 'Marketing Automation', 'Brand Strategy', 'SEO'],
    governanceRequirements: ['audit_logging', 'brand_compliance'],
    qualityThreshold: 7.5,
    icon: '📢',
    color: '#10B981',
    preview: {
      agents: ['Content Strategist', 'SEO Specialist', 'Brand Guardian', 'Social Media Manager', 'Quality Reviewer'],
      orchestrator: 'Creative Director',
      keyFeatures: [
        'Multi-format content generation',
        'SEO optimization and keyword research',
        'Brand voice consistency checking',
        'Social media campaign planning',
        'Performance tracking and optimization'
      ],
      outcomes: [
        'Content calendar and strategy',
        'SEO-optimized content pieces',
        'Social media campaign assets',
        'Brand guidelines compliance',
        'Performance analytics dashboard'
      ]
    },
    isVerified: true,
    isPremium: false,
    isFavorited: false
  },
  {
    id: 'financial-planning-advisor',
    name: 'AI Financial Planning Advisor',
    description: 'Comprehensive financial planning with investment analysis, risk assessment, and portfolio optimization',
    category: 'financial-planning',
    difficulty: 'Expert',
    estimatedDuration: '3-4 weeks',
    agentCount: 6,
    successRate: 92,
    usageCount: 89,
    rating: 4.9,
    reviewCount: 18,
    author: 'FinTech Innovations',
    created: new Date('2024-01-25'),
    updated: new Date('2024-02-03'),
    tags: ['Financial Planning', 'Investment Analysis', 'Risk Management', 'Portfolio Optimization'],
    governanceRequirements: ['audit_logging', 'financial_compliance', 'data_security'],
    qualityThreshold: 9.0,
    icon: '💰',
    color: '#F59E0B',
    preview: {
      agents: ['Investment Analyst', 'Risk Assessor', 'Tax Specialist', 'Compliance Officer', 'Portfolio Manager', 'Devil\'s Advocate'],
      orchestrator: 'Analytical Coordinator',
      keyFeatures: [
        'Comprehensive financial analysis',
        'Investment opportunity evaluation',
        'Risk assessment and mitigation',
        'Tax optimization strategies',
        'Regulatory compliance checking',
        'Portfolio diversification planning'
      ],
      outcomes: [
        'Personalized financial plan',
        'Investment recommendations',
        'Risk management strategy',
        'Tax optimization plan',
        'Portfolio allocation model'
      ]
    },
    isVerified: true,
    isPremium: true,
    isFavorited: false
  },
  {
    id: 'product-development-agile',
    name: 'Agile Product Development',
    description: 'User-centered product development with agile methodology and continuous feedback integration',
    category: 'product-development',
    difficulty: 'Intermediate',
    estimatedDuration: '2-4 weeks',
    agentCount: 6,
    successRate: 85,
    usageCount: 167,
    rating: 4.6,
    reviewCount: 34,
    author: 'Product Innovation Lab',
    created: new Date('2024-01-18'),
    updated: new Date('2024-01-30'),
    tags: ['Product Development', 'Agile', 'User Research', 'Design Thinking'],
    governanceRequirements: ['audit_logging', 'user_privacy'],
    qualityThreshold: 8.0,
    icon: '🛠️',
    color: '#EF4444',
    preview: {
      agents: ['Product Manager', 'UX Researcher', 'Design Specialist', 'Technical Architect', 'Quality Assurance', 'User Advocate'],
      orchestrator: 'Collaborative Leader',
      keyFeatures: [
        'User research and persona development',
        'Feature prioritization and roadmapping',
        'Design thinking workshops',
        'Technical feasibility analysis',
        'Continuous user feedback integration',
        'Quality assurance and testing'
      ],
      outcomes: [
        'Product requirements document',
        'User experience design',
        'Technical architecture plan',
        'Development roadmap',
        'Testing and validation strategy'
      ]
    },
    isVerified: true,
    isPremium: false,
    isFavorited: false
  },
  {
    id: 'customer-support-automation',
    name: 'Intelligent Customer Support',
    description: 'AI-powered customer support automation with escalation management and satisfaction tracking',
    category: 'customer-support',
    difficulty: 'Beginner',
    estimatedDuration: '1-2 weeks',
    agentCount: 4,
    successRate: 91,
    usageCount: 203,
    rating: 4.8,
    reviewCount: 42,
    author: 'Support Excellence Team',
    created: new Date('2024-01-22'),
    updated: new Date('2024-02-02'),
    tags: ['Customer Support', 'Automation', 'Escalation Management', 'Satisfaction Tracking'],
    governanceRequirements: ['audit_logging', 'customer_privacy'],
    qualityThreshold: 7.5,
    icon: '🎧',
    color: '#06B6D4',
    preview: {
      agents: ['Support Specialist', 'Escalation Manager', 'Satisfaction Tracker', 'Knowledge Manager'],
      orchestrator: 'Diplomatic Facilitator',
      keyFeatures: [
        'Automated ticket classification',
        'Intelligent response generation',
        'Escalation path management',
        'Customer satisfaction monitoring',
        'Knowledge base optimization'
      ],
      outcomes: [
        'Automated support workflows',
        'Escalation procedures',
        'Customer satisfaction metrics',
        'Knowledge base improvements',
        'Support team efficiency gains'
      ]
    },
    isVerified: true,
    isPremium: false,
    isFavorited: true
  }
];

export const ProcessTemplateLibrary: React.FC = () => {
  const [templates, setTemplates] = useState<ProcessTemplate[]>(SAMPLE_TEMPLATES);
  const [filteredTemplates, setFilteredTemplates] = useState<ProcessTemplate[]>(SAMPLE_TEMPLATES);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('popularity');
  const [showFilters, setShowFilters] = useState<boolean>(false);
  const [selectedTemplate, setSelectedTemplate] = useState<ProcessTemplate | null>(null);

  // Filter and search logic
  useEffect(() => {
    let filtered = templates;

    // Category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(template => template.category === selectedCategory);
    }

    // Difficulty filter
    if (selectedDifficulty !== 'all') {
      filtered = filtered.filter(template => template.difficulty === selectedDifficulty);
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(template =>
        template.name.toLowerCase().includes(query) ||
        template.description.toLowerCase().includes(query) ||
        template.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }

    // Sort
    switch (sortBy) {
      case 'popularity':
        filtered.sort((a, b) => b.usageCount - a.usageCount);
        break;
      case 'rating':
        filtered.sort((a, b) => b.rating - a.rating);
        break;
      case 'newest':
        filtered.sort((a, b) => b.created.getTime() - a.created.getTime());
        break;
      case 'name':
        filtered.sort((a, b) => a.name.localeCompare(b.name));
        break;
    }

    setFilteredTemplates(filtered);
  }, [templates, selectedCategory, selectedDifficulty, searchQuery, sortBy]);

  // Toggle favorite
  const toggleFavorite = (templateId: string) => {
    setTemplates(prev => prev.map(template =>
      template.id === templateId
        ? { ...template, isFavorited: !template.isFavorited }
        : template
    ));
  };

  // Get difficulty color
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Beginner': return '#10B981';
      case 'Intermediate': return '#F59E0B';
      case 'Advanced': return '#EF4444';
      case 'Expert': return '#8B5CF6';
      default: return '#6B7280';
    }
  };

  // Render template card
  const renderTemplateCard = (template: ProcessTemplate) => (
    <div
      key={template.id}
      className="bg-gray-800 rounded-lg p-6 border border-gray-700 hover:border-gray-600 transition-all duration-200 hover:shadow-lg"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div
            className="w-12 h-12 rounded-lg flex items-center justify-center text-2xl"
            style={{ backgroundColor: template.color + '20' }}
          >
            {template.icon}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="text-white font-semibold">{template.name}</h3>
              {template.isVerified && (
                <CheckCircle className="w-4 h-4 text-green-400" title="Verified Template" />
              )}
              {template.isPremium && (
                <Star className="w-4 h-4 text-yellow-400" title="Premium Template" />
              )}
            </div>
            <p className="text-gray-400 text-sm">{template.description}</p>
          </div>
        </div>
        <button
          onClick={() => toggleFavorite(template.id)}
          className={`p-2 rounded-lg transition-colors ${
            template.isFavorited
              ? 'text-red-400 hover:text-red-300'
              : 'text-gray-400 hover:text-gray-300'
          }`}
        >
          <Heart className={`w-5 h-5 ${template.isFavorited ? 'fill-current' : ''}`} />
        </button>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-4 gap-4 mb-4">
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 text-yellow-400 mb-1">
            <Star className="w-4 h-4 fill-current" />
            <span className="text-white font-medium">{template.rating}</span>
          </div>
          <p className="text-gray-400 text-xs">{template.reviewCount} reviews</p>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 text-blue-400 mb-1">
            <TrendingUp className="w-4 h-4" />
            <span className="text-white font-medium">{template.successRate}%</span>
          </div>
          <p className="text-gray-400 text-xs">Success rate</p>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 text-green-400 mb-1">
            <Users className="w-4 h-4" />
            <span className="text-white font-medium">{template.agentCount}</span>
          </div>
          <p className="text-gray-400 text-xs">AI Agents</p>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 text-purple-400 mb-1">
            <Clock className="w-4 h-4" />
            <span className="text-white font-medium text-xs">{template.estimatedDuration}</span>
          </div>
          <p className="text-gray-400 text-xs">Duration</p>
        </div>
      </div>

      {/* Tags and Difficulty */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex flex-wrap gap-1">
          {template.tags.slice(0, 3).map(tag => (
            <span
              key={tag}
              className="px-2 py-1 bg-gray-700 text-gray-300 text-xs rounded"
            >
              {tag}
            </span>
          ))}
          {template.tags.length > 3 && (
            <span className="px-2 py-1 bg-gray-700 text-gray-300 text-xs rounded">
              +{template.tags.length - 3}
            </span>
          )}
        </div>
        <span
          className="px-2 py-1 text-xs rounded font-medium"
          style={{
            backgroundColor: getDifficultyColor(template.difficulty) + '20',
            color: getDifficultyColor(template.difficulty)
          }}
        >
          {template.difficulty}
        </span>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={() => setSelectedTemplate(template)}
          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded transition-colors"
        >
          <Eye className="w-4 h-4" />
          Preview
        </button>
        <button className="flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors">
          <Download className="w-4 h-4" />
          Use Template
        </button>
        <button className="p-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded transition-colors">
          <Share2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );

  return (
    <div className="h-full bg-gray-900 flex flex-col">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-white mb-2">Process Template Library</h1>
            <p className="text-gray-400">
              Discover and use proven AI-Native Business Process templates
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors">
              <Plus className="w-4 h-4" />
              Create Template
            </button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex items-center gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search templates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
            />
          </div>
          
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
          >
            <option value="popularity">Most Popular</option>
            <option value="rating">Highest Rated</option>
            <option value="newest">Newest</option>
            <option value="name">Name A-Z</option>
          </select>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-3 py-2 rounded transition-colors ${
              showFilters ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            <Filter className="w-4 h-4" />
            Filters
          </button>
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <div className="mt-4 p-4 bg-gray-700 rounded-lg">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-300 text-sm mb-2">Category</label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-600 text-white rounded border border-gray-500 focus:border-blue-500 focus:outline-none"
                >
                  <option value="all">All Categories</option>
                  {TEMPLATE_CATEGORIES.map(category => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-gray-300 text-sm mb-2">Difficulty</label>
                <select
                  value={selectedDifficulty}
                  onChange={(e) => setSelectedDifficulty(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-600 text-white rounded border border-gray-500 focus:border-blue-500 focus:outline-none"
                >
                  <option value="all">All Levels</option>
                  <option value="Beginner">Beginner</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="Advanced">Advanced</option>
                  <option value="Expert">Expert</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Categories */}
      <div className="bg-gray-800 border-b border-gray-700 p-4">
        <div className="flex gap-2 overflow-x-auto">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
              selectedCategory === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            All Categories ({SAMPLE_TEMPLATES.length})
          </button>
          {TEMPLATE_CATEGORIES.map(category => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
                selectedCategory === category.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              <span>{category.icon}</span>
              {category.name} ({category.templateCount})
            </button>
          ))}
        </div>
      </div>

      {/* Templates Grid */}
      <div className="flex-1 overflow-y-auto p-6">
        {filteredTemplates.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredTemplates.map(renderTemplateCard)}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <Search className="w-12 h-12 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-white mb-2">No templates found</h3>
              <p>Try adjusting your search criteria or filters</p>
            </div>
          </div>
        )}
      </div>

      {/* Template Preview Modal */}
      {selectedTemplate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-700">
              <div className="flex items-center gap-3">
                <div
                  className="w-12 h-12 rounded-lg flex items-center justify-center text-2xl"
                  style={{ backgroundColor: selectedTemplate.color + '20' }}
                >
                  {selectedTemplate.icon}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">{selectedTemplate.name}</h2>
                  <p className="text-gray-400">{selectedTemplate.description}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedTemplate(null)}
                className="text-gray-400 hover:text-white text-2xl"
              >
                ×
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left Column */}
                <div className="space-y-6">
                  {/* Metrics */}
                  <div className="bg-gray-700 rounded-lg p-4">
                    <h3 className="text-white font-semibold mb-3">Template Metrics</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center">
                        <div className="flex items-center justify-center gap-1 text-yellow-400 mb-1">
                          <Star className="w-4 h-4 fill-current" />
                          <span className="text-white font-medium">{selectedTemplate.rating}</span>
                        </div>
                        <p className="text-gray-400 text-sm">{selectedTemplate.reviewCount} reviews</p>
                      </div>
                      <div className="text-center">
                        <div className="flex items-center justify-center gap-1 text-blue-400 mb-1">
                          <TrendingUp className="w-4 h-4" />
                          <span className="text-white font-medium">{selectedTemplate.successRate}%</span>
                        </div>
                        <p className="text-gray-400 text-sm">Success rate</p>
                      </div>
                      <div className="text-center">
                        <div className="flex items-center justify-center gap-1 text-green-400 mb-1">
                          <Users className="w-4 h-4" />
                          <span className="text-white font-medium">{selectedTemplate.agentCount}</span>
                        </div>
                        <p className="text-gray-400 text-sm">AI Agents</p>
                      </div>
                      <div className="text-center">
                        <div className="flex items-center justify-center gap-1 text-purple-400 mb-1">
                          <Clock className="w-4 h-4" />
                          <span className="text-white font-medium text-sm">{selectedTemplate.estimatedDuration}</span>
                        </div>
                        <p className="text-gray-400 text-sm">Duration</p>
                      </div>
                    </div>
                  </div>

                  {/* AI Agents */}
                  <div className="bg-gray-700 rounded-lg p-4">
                    <h3 className="text-white font-semibold mb-3">AI Agent Team</h3>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 mb-2">
                        <Brain className="w-4 h-4 text-purple-400" />
                        <span className="text-white font-medium">Orchestrator:</span>
                        <span className="text-gray-300">{selectedTemplate.preview.orchestrator}</span>
                      </div>
                      {selectedTemplate.preview.agents.map((agent, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-blue-400" />
                          <span className="text-gray-300">{agent}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Governance */}
                  <div className="bg-gray-700 rounded-lg p-4">
                    <h3 className="text-white font-semibold mb-3">Governance & Quality</h3>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Target className="w-4 h-4 text-green-400" />
                        <span className="text-gray-300">Quality Threshold: {selectedTemplate.qualityThreshold}/10</span>
                      </div>
                      {selectedTemplate.governanceRequirements.map((req, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <Shield className="w-4 h-4 text-blue-400" />
                          <span className="text-gray-300 capitalize">{req.replace('_', ' ')}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Right Column */}
                <div className="space-y-6">
                  {/* Key Features */}
                  <div className="bg-gray-700 rounded-lg p-4">
                    <h3 className="text-white font-semibold mb-3">Key Features</h3>
                    <ul className="space-y-2">
                      {selectedTemplate.preview.keyFeatures.map((feature, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                          <span className="text-gray-300">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Expected Outcomes */}
                  <div className="bg-gray-700 rounded-lg p-4">
                    <h3 className="text-white font-semibold mb-3">Expected Outcomes</h3>
                    <ul className="space-y-2">
                      {selectedTemplate.preview.outcomes.map((outcome, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <Target className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                          <span className="text-gray-300">{outcome}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Tags */}
                  <div className="bg-gray-700 rounded-lg p-4">
                    <h3 className="text-white font-semibold mb-3">Tags</h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedTemplate.tags.map(tag => (
                        <span
                          key={tag}
                          className="px-3 py-1 bg-gray-600 text-gray-300 text-sm rounded-full"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 mt-6 pt-6 border-t border-gray-700">
                <button className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
                  <Download className="w-5 h-5" />
                  Use This Template
                </button>
                <button className="flex items-center justify-center gap-2 px-4 py-3 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg transition-colors">
                  <Copy className="w-5 h-5" />
                  Duplicate
                </button>
                <button
                  onClick={() => toggleFavorite(selectedTemplate.id)}
                  className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg transition-colors ${
                    selectedTemplate.isFavorited
                      ? 'bg-red-600 hover:bg-red-700 text-white'
                      : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                  }`}
                >
                  <Heart className={`w-5 h-5 ${selectedTemplate.isFavorited ? 'fill-current' : ''}`} />
                  {selectedTemplate.isFavorited ? 'Favorited' : 'Favorite'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProcessTemplateLibrary;

