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
  Play,
  Upload,
  Award,
  Coins,
  Gift,
  Crown,
  Flame,
  ThumbsUp,
  MessageSquare,
  Calendar,
  User,
  Globe,
  Lock,
  DollarSign,
  Sparkles
} from 'lucide-react';

// Marketplace interfaces
interface MarketplaceProcess {
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
  author: {
    id: string;
    name: string;
    avatar: string;
    reputation: number;
    verified: boolean;
    badge?: string;
  };
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
    screenshots?: string[];
  };
  pricing: {
    type: 'free' | 'premium' | 'credits' | 'revenue_share';
    price?: number;
    revenueSharePercentage?: number;
    creditsRequired?: number;
  };
  isVerified: boolean;
  isFeatured: boolean;
  isTrending: boolean;
  isNew: boolean;
  isFavorited?: boolean;
  communityMetrics: {
    likes: number;
    comments: number;
    shares: number;
    forks: number;
  };
  businessMetrics?: {
    revenueGenerated: number;
    businessesCreated: number;
    successStories: number;
  };
}

interface ProcessReview {
  id: string;
  processId: string;
  author: {
    name: string;
    avatar: string;
    verified: boolean;
  };
  rating: number;
  title: string;
  content: string;
  created: Date;
  helpful: number;
  businessImpact?: {
    revenueIncrease?: string;
    timesSaved?: string;
    qualityImprovement?: string;
  };
}

interface MarketplaceStats {
  totalProcesses: number;
  totalDownloads: number;
  totalRevenue: number;
  activeCreators: number;
  averageRating: number;
  successfulBusinesses: number;
}

// Sample marketplace data
const MARKETPLACE_STATS: MarketplaceStats = {
  totalProcesses: 1247,
  totalDownloads: 23456,
  totalRevenue: 156789,
  activeCreators: 342,
  averageRating: 4.7,
  successfulBusinesses: 89
};

const SAMPLE_MARKETPLACE_PROCESSES: MarketplaceProcess[] = [
  {
    id: 'saas-unicorn-builder',
    name: 'SaaS Unicorn Builder Pro',
    description: 'Complete billion-dollar SaaS development process with AI-driven market validation, technical architecture, and scaling strategies used by 3 unicorn startups',
    category: 'business-development',
    difficulty: 'Expert',
    estimatedDuration: '8-12 weeks',
    agentCount: 12,
    successRate: 94,
    usageCount: 89,
    rating: 4.9,
    reviewCount: 23,
    author: {
      id: 'sarah_ventures',
      name: 'Sarah Chen',
      avatar: '👩‍💼',
      reputation: 9847,
      verified: true,
      badge: 'Unicorn Builder'
    },
    created: new Date('2024-01-10'),
    updated: new Date('2024-02-01'),
    tags: ['SaaS', 'Unicorn', 'Scaling', 'Investment', 'Technical Architecture'],
    governanceRequirements: ['audit_logging', 'policy_compliance', 'quality_assurance', 'financial_compliance'],
    qualityThreshold: 9.5,
    icon: '🦄',
    color: '#8B5CF6',
    preview: {
      agents: [
        'Market Intelligence Specialist', 'Technical Architecture Expert', 'Financial Modeling Analyst',
        'Investment Strategy Advisor', 'Scaling Operations Manager', 'User Experience Researcher',
        'Competitive Intelligence Agent', 'Risk Assessment Specialist', 'Devil\'s Advocate',
        'Quality Guardian', 'Compliance Officer', 'Innovation Catalyst'
      ],
      orchestrator: 'Entrepreneurial Catalyst',
      keyFeatures: [
        'AI-driven market opportunity identification',
        'Billion-dollar technical architecture planning',
        'Investment readiness and pitch deck creation',
        'Scaling strategy with operational excellence',
        'Competitive moat development',
        'User acquisition and retention optimization',
        'Financial modeling for unicorn trajectory',
        'Risk mitigation and contingency planning'
      ],
      outcomes: [
        'Validated billion-dollar market opportunity',
        'Scalable technical architecture blueprint',
        'Investment-ready pitch deck and financials',
        'Go-to-market strategy for rapid scaling',
        'Operational excellence framework',
        'Competitive differentiation strategy'
      ]
    },
    pricing: {
      type: 'revenue_share',
      revenueSharePercentage: 2.5
    },
    isVerified: true,
    isFeatured: true,
    isTrending: true,
    isNew: false,
    isFavorited: false,
    communityMetrics: {
      likes: 234,
      comments: 67,
      shares: 45,
      forks: 12
    },
    businessMetrics: {
      revenueGenerated: 45000000,
      businessesCreated: 3,
      successStories: 8
    }
  },
  {
    id: 'ai-content-empire',
    name: 'AI Content Empire Builder',
    description: 'Build a million-dollar content business with AI-powered content creation, audience building, and monetization strategies',
    category: 'content-marketing',
    difficulty: 'Advanced',
    estimatedDuration: '6-8 weeks',
    agentCount: 8,
    successRate: 87,
    usageCount: 156,
    rating: 4.8,
    reviewCount: 42,
    author: {
      id: 'content_king',
      name: 'Marcus Rodriguez',
      avatar: '👨‍🎨',
      reputation: 7234,
      verified: true,
      badge: 'Content Master'
    },
    created: new Date('2024-01-15'),
    updated: new Date('2024-01-28'),
    tags: ['Content Marketing', 'AI Content', 'Audience Building', 'Monetization', 'Brand Building'],
    governanceRequirements: ['audit_logging', 'brand_compliance', 'content_quality'],
    qualityThreshold: 8.5,
    icon: '👑',
    color: '#10B981',
    preview: {
      agents: [
        'Content Strategy Architect', 'AI Content Generator', 'Audience Growth Specialist',
        'Monetization Expert', 'Brand Voice Guardian', 'SEO Optimization Agent',
        'Social Media Strategist', 'Performance Analytics Specialist'
      ],
      orchestrator: 'Creative Director',
      keyFeatures: [
        'AI-powered content calendar generation',
        'Multi-platform content optimization',
        'Audience growth and engagement strategies',
        'Revenue stream diversification',
        'Brand voice consistency across channels',
        'Performance tracking and optimization'
      ],
      outcomes: [
        'Comprehensive content strategy',
        'AI-generated content pipeline',
        'Audience growth framework',
        'Multiple revenue streams',
        'Brand authority establishment',
        'Scalable content operations'
      ]
    },
    pricing: {
      type: 'premium',
      price: 297
    },
    isVerified: true,
    isFeatured: false,
    isTrending: true,
    isNew: false,
    isFavorited: true,
    communityMetrics: {
      likes: 189,
      comments: 34,
      shares: 28,
      forks: 7
    },
    businessMetrics: {
      revenueGenerated: 2340000,
      businessesCreated: 12,
      successStories: 18
    }
  },
  {
    id: 'fintech-startup-accelerator',
    name: 'FinTech Startup Accelerator',
    description: 'Complete FinTech startup development process with regulatory compliance, security architecture, and market entry strategies',
    category: 'financial-planning',
    difficulty: 'Expert',
    estimatedDuration: '10-14 weeks',
    agentCount: 10,
    successRate: 91,
    usageCount: 67,
    rating: 4.9,
    reviewCount: 18,
    author: {
      id: 'fintech_guru',
      name: 'Dr. Amanda Foster',
      avatar: '👩‍🔬',
      reputation: 8956,
      verified: true,
      badge: 'FinTech Expert'
    },
    created: new Date('2024-01-20'),
    updated: new Date('2024-02-03'),
    tags: ['FinTech', 'Regulatory Compliance', 'Security', 'Banking', 'Investment'],
    governanceRequirements: ['audit_logging', 'financial_compliance', 'data_security', 'regulatory_compliance'],
    qualityThreshold: 9.0,
    icon: '🏦',
    color: '#F59E0B',
    preview: {
      agents: [
        'FinTech Product Strategist', 'Regulatory Compliance Expert', 'Security Architecture Specialist',
        'Financial Risk Analyst', 'Banking Integration Specialist', 'Investment Strategy Advisor',
        'User Experience Designer', 'Market Entry Strategist', 'Compliance Auditor', 'Technology Architect'
      ],
      orchestrator: 'Analytical Coordinator',
      keyFeatures: [
        'Regulatory compliance framework development',
        'Security architecture and risk assessment',
        'Banking partnership and integration strategies',
        'Financial product design and validation',
        'Market entry and customer acquisition',
        'Investment and funding strategies'
      ],
      outcomes: [
        'Regulatory-compliant FinTech product',
        'Security architecture blueprint',
        'Banking partnership agreements',
        'Market entry strategy',
        'Investment readiness package',
        'Operational compliance framework'
      ]
    },
    pricing: {
      type: 'revenue_share',
      revenueSharePercentage: 3.0
    },
    isVerified: true,
    isFeatured: true,
    isTrending: false,
    isNew: false,
    isFavorited: false,
    communityMetrics: {
      likes: 145,
      comments: 23,
      shares: 19,
      forks: 4
    },
    businessMetrics: {
      revenueGenerated: 12000000,
      businessesCreated: 2,
      successStories: 5
    }
  },
  {
    id: 'ecommerce-automation-suite',
    name: 'E-commerce Automation Suite',
    description: 'Complete e-commerce business automation with AI-powered inventory management, customer service, and marketing optimization',
    category: 'business-development',
    difficulty: 'Intermediate',
    estimatedDuration: '4-6 weeks',
    agentCount: 7,
    successRate: 89,
    usageCount: 234,
    rating: 4.7,
    reviewCount: 56,
    author: {
      id: 'ecom_wizard',
      name: 'Jake Thompson',
      avatar: '🧙‍♂️',
      reputation: 6543,
      verified: true,
      badge: 'E-commerce Expert'
    },
    created: new Date('2024-01-25'),
    updated: new Date('2024-02-05'),
    tags: ['E-commerce', 'Automation', 'Inventory Management', 'Customer Service', 'Marketing'],
    governanceRequirements: ['audit_logging', 'customer_privacy', 'quality_assurance'],
    qualityThreshold: 8.0,
    icon: '🛒',
    color: '#EF4444',
    preview: {
      agents: [
        'Inventory Management Specialist', 'Customer Service Automation Expert', 'Marketing Optimization Agent',
        'Supply Chain Coordinator', 'Pricing Strategy Analyst', 'Customer Experience Designer',
        'Performance Analytics Specialist'
      ],
      orchestrator: 'Collaborative Leader',
      keyFeatures: [
        'AI-powered inventory optimization',
        'Automated customer service workflows',
        'Dynamic pricing and promotion strategies',
        'Supply chain automation',
        'Customer journey optimization',
        'Multi-channel marketing automation'
      ],
      outcomes: [
        'Fully automated inventory system',
        'Customer service automation',
        'Optimized pricing strategies',
        'Streamlined supply chain',
        'Enhanced customer experience',
        'Increased revenue and efficiency'
      ]
    },
    pricing: {
      type: 'premium',
      price: 197
    },
    isVerified: true,
    isFeatured: false,
    isTrending: false,
    isNew: true,
    isFavorited: false,
    communityMetrics: {
      likes: 167,
      comments: 29,
      shares: 22,
      forks: 9
    },
    businessMetrics: {
      revenueGenerated: 3450000,
      businessesCreated: 15,
      successStories: 23
    }
  },
  {
    id: 'ai-consulting-business',
    name: 'AI Consulting Business Builder',
    description: 'Build a profitable AI consulting business with client acquisition, service delivery, and scaling strategies',
    category: 'business-development',
    difficulty: 'Advanced',
    estimatedDuration: '5-7 weeks',
    agentCount: 6,
    successRate: 85,
    usageCount: 123,
    rating: 4.6,
    reviewCount: 31,
    author: {
      id: 'ai_consultant_pro',
      name: 'Lisa Wang',
      avatar: '👩‍💻',
      reputation: 5678,
      verified: true,
      badge: 'AI Expert'
    },
    created: new Date('2024-02-01'),
    updated: new Date('2024-02-08'),
    tags: ['AI Consulting', 'Business Development', 'Client Acquisition', 'Service Delivery'],
    governanceRequirements: ['audit_logging', 'client_confidentiality', 'quality_assurance'],
    qualityThreshold: 8.5,
    icon: '🤖',
    color: '#06B6D4',
    preview: {
      agents: [
        'Business Development Specialist', 'Client Acquisition Expert', 'Service Delivery Manager',
        'AI Technology Advisor', 'Pricing Strategy Analyst', 'Quality Assurance Specialist'
      ],
      orchestrator: 'Entrepreneurial Catalyst',
      keyFeatures: [
        'Client acquisition and lead generation',
        'Service packaging and pricing strategies',
        'Delivery methodology and quality assurance',
        'Team building and scaling strategies',
        'Technology stack recommendations',
        'Client relationship management'
      ],
      outcomes: [
        'Profitable consulting business model',
        'Client acquisition system',
        'Service delivery framework',
        'Pricing and packaging strategy',
        'Scaling and growth plan',
        'Quality assurance processes'
      ]
    },
    pricing: {
      type: 'premium',
      price: 247
    },
    isVerified: true,
    isFeatured: false,
    isTrending: false,
    isNew: true,
    isFavorited: true,
    communityMetrics: {
      likes: 98,
      comments: 18,
      shares: 14,
      forks: 5
    },
    businessMetrics: {
      revenueGenerated: 1890000,
      businessesCreated: 8,
      successStories: 12
    }
  }
];

export const ProcessMarketplace: React.FC = () => {
  const [processes, setProcesses] = useState<MarketplaceProcess[]>(SAMPLE_MARKETPLACE_PROCESSES);
  const [filteredProcesses, setFilteredProcesses] = useState<MarketplaceProcess[]>(SAMPLE_MARKETPLACE_PROCESSES);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');
  const [selectedPricing, setSelectedPricing] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('featured');
  const [showFilters, setShowFilters] = useState<boolean>(false);
  const [selectedProcess, setSelectedProcess] = useState<MarketplaceProcess | null>(null);
  const [activeTab, setActiveTab] = useState<'featured' | 'trending' | 'new' | 'top-rated'>('featured');

  // Filter and search logic
  useEffect(() => {
    let filtered = processes;

    // Tab filter
    switch (activeTab) {
      case 'featured':
        filtered = filtered.filter(process => process.isFeatured);
        break;
      case 'trending':
        filtered = filtered.filter(process => process.isTrending);
        break;
      case 'new':
        filtered = filtered.filter(process => process.isNew);
        break;
      case 'top-rated':
        filtered = filtered.filter(process => process.rating >= 4.8);
        break;
    }

    // Category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(process => process.category === selectedCategory);
    }

    // Difficulty filter
    if (selectedDifficulty !== 'all') {
      filtered = filtered.filter(process => process.difficulty === selectedDifficulty);
    }

    // Pricing filter
    if (selectedPricing !== 'all') {
      filtered = filtered.filter(process => process.pricing.type === selectedPricing);
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(process =>
        process.name.toLowerCase().includes(query) ||
        process.description.toLowerCase().includes(query) ||
        process.tags.some(tag => tag.toLowerCase().includes(query)) ||
        process.author.name.toLowerCase().includes(query)
      );
    }

    // Sort
    switch (sortBy) {
      case 'featured':
        filtered.sort((a, b) => {
          if (a.isFeatured && !b.isFeatured) return -1;
          if (!a.isFeatured && b.isFeatured) return 1;
          return b.rating - a.rating;
        });
        break;
      case 'popularity':
        filtered.sort((a, b) => b.usageCount - a.usageCount);
        break;
      case 'rating':
        filtered.sort((a, b) => b.rating - a.rating);
        break;
      case 'revenue':
        filtered.sort((a, b) => (b.businessMetrics?.revenueGenerated || 0) - (a.businessMetrics?.revenueGenerated || 0));
        break;
      case 'newest':
        filtered.sort((a, b) => b.created.getTime() - a.created.getTime());
        break;
      case 'price_low':
        filtered.sort((a, b) => (a.pricing.price || 0) - (b.pricing.price || 0));
        break;
      case 'price_high':
        filtered.sort((a, b) => (b.pricing.price || 0) - (a.pricing.price || 0));
        break;
    }

    setFilteredProcesses(filtered);
  }, [processes, activeTab, selectedCategory, selectedDifficulty, selectedPricing, searchQuery, sortBy]);

  // Toggle favorite
  const toggleFavorite = (processId: string) => {
    setProcesses(prev => prev.map(process =>
      process.id === processId
        ? { ...process, isFavorited: !process.isFavorited }
        : process
    ));
  };

  // Get pricing display
  const getPricingDisplay = (pricing: MarketplaceProcess['pricing']) => {
    switch (pricing.type) {
      case 'free':
        return { text: 'Free', color: '#10B981' };
      case 'premium':
        return { text: `$${pricing.price}`, color: '#F59E0B' };
      case 'credits':
        return { text: `${pricing.creditsRequired} credits`, color: '#8B5CF6' };
      case 'revenue_share':
        return { text: `${pricing.revenueSharePercentage}% revenue share`, color: '#EF4444' };
      default:
        return { text: 'Free', color: '#10B981' };
    }
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

  // Render process card
  const renderProcessCard = (process: MarketplaceProcess) => {
    const pricing = getPricingDisplay(process.pricing);
    
    return (
      <div
        key={process.id}
        className="bg-gray-800 rounded-lg p-6 border border-gray-700 hover:border-gray-600 transition-all duration-200 hover:shadow-lg"
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-lg flex items-center justify-center text-2xl"
              style={{ backgroundColor: process.color + '20' }}
            >
              {process.icon}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-white font-semibold">{process.name}</h3>
                {process.isVerified && (
                  <CheckCircle className="w-4 h-4 text-green-400" title="Verified Process" />
                )}
                {process.isFeatured && (
                  <Crown className="w-4 h-4 text-yellow-400" title="Featured Process" />
                )}
                {process.isTrending && (
                  <Flame className="w-4 h-4 text-orange-400" title="Trending" />
                )}
                {process.isNew && (
                  <Sparkles className="w-4 h-4 text-blue-400" title="New" />
                )}
              </div>
              <p className="text-gray-400 text-sm line-clamp-2">{process.description}</p>
            </div>
          </div>
          <button
            onClick={() => toggleFavorite(process.id)}
            className={`p-2 rounded-lg transition-colors ${
              process.isFavorited
                ? 'text-red-400 hover:text-red-300'
                : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            <Heart className={`w-5 h-5 ${process.isFavorited ? 'fill-current' : ''}`} />
          </button>
        </div>

        {/* Author */}
        <div className="flex items-center gap-2 mb-4">
          <span className="text-2xl">{process.author.avatar}</span>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="text-white font-medium">{process.author.name}</span>
              {process.author.verified && (
                <CheckCircle className="w-3 h-3 text-blue-400" />
              )}
              {process.author.badge && (
                <span className="px-2 py-0.5 bg-purple-600 text-purple-100 text-xs rounded">
                  {process.author.badge}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              <Star className="w-3 h-3 text-yellow-400 fill-current" />
              <span className="text-gray-400 text-xs">{process.author.reputation.toLocaleString()} reputation</span>
            </div>
          </div>
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-4 gap-4 mb-4">
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-yellow-400 mb-1">
              <Star className="w-4 h-4 fill-current" />
              <span className="text-white font-medium">{process.rating}</span>
            </div>
            <p className="text-gray-400 text-xs">{process.reviewCount} reviews</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-blue-400 mb-1">
              <TrendingUp className="w-4 h-4" />
              <span className="text-white font-medium">{process.successRate}%</span>
            </div>
            <p className="text-gray-400 text-xs">Success rate</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-green-400 mb-1">
              <Download className="w-4 h-4" />
              <span className="text-white font-medium">{process.usageCount}</span>
            </div>
            <p className="text-gray-400 text-xs">Downloads</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-purple-400 mb-1">
              <Clock className="w-4 h-4" />
              <span className="text-white font-medium text-xs">{process.estimatedDuration}</span>
            </div>
            <p className="text-gray-400 text-xs">Duration</p>
          </div>
        </div>

        {/* Business Metrics */}
        {process.businessMetrics && (
          <div className="bg-gray-700 rounded-lg p-3 mb-4">
            <div className="grid grid-cols-3 gap-3 text-center">
              <div>
                <div className="text-green-400 font-semibold">
                  ${(process.businessMetrics.revenueGenerated / 1000000).toFixed(1)}M
                </div>
                <p className="text-gray-400 text-xs">Revenue Generated</p>
              </div>
              <div>
                <div className="text-blue-400 font-semibold">
                  {process.businessMetrics.businessesCreated}
                </div>
                <p className="text-gray-400 text-xs">Businesses Created</p>
              </div>
              <div>
                <div className="text-purple-400 font-semibold">
                  {process.businessMetrics.successStories}
                </div>
                <p className="text-gray-400 text-xs">Success Stories</p>
              </div>
            </div>
          </div>
        )}

        {/* Community Metrics */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1 text-gray-400">
              <ThumbsUp className="w-4 h-4" />
              <span>{process.communityMetrics.likes}</span>
            </div>
            <div className="flex items-center gap-1 text-gray-400">
              <MessageSquare className="w-4 h-4" />
              <span>{process.communityMetrics.comments}</span>
            </div>
            <div className="flex items-center gap-1 text-gray-400">
              <Share2 className="w-4 h-4" />
              <span>{process.communityMetrics.shares}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span
              className="px-2 py-1 text-xs rounded font-medium"
              style={{
                backgroundColor: getDifficultyColor(process.difficulty) + '20',
                color: getDifficultyColor(process.difficulty)
              }}
            >
              {process.difficulty}
            </span>
            <span
              className="px-2 py-1 text-xs rounded font-medium"
              style={{
                backgroundColor: pricing.color + '20',
                color: pricing.color
              }}
            >
              {pricing.text}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={() => setSelectedProcess(process)}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded transition-colors"
          >
            <Eye className="w-4 h-4" />
            Preview
          </button>
          <button className="flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors">
            <Download className="w-4 h-4" />
            Get Process
          </button>
          <button className="p-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded transition-colors">
            <Share2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="h-full bg-gray-900 flex flex-col">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white mb-2">Process Marketplace</h1>
            <p className="text-gray-400">
              Discover, share, and monetize AI-Native Business Processes created by the community
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded transition-colors">
              <Upload className="w-4 h-4" />
              Publish Process
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors">
              <Coins className="w-4 h-4" />
              My Earnings
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-6 gap-4 mb-6">
          <div className="bg-gray-700 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-white">{MARKETPLACE_STATS.totalProcesses.toLocaleString()}</div>
            <p className="text-gray-400 text-sm">Total Processes</p>
          </div>
          <div className="bg-gray-700 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-green-400">${(MARKETPLACE_STATS.totalRevenue / 1000).toFixed(0)}K</div>
            <p className="text-gray-400 text-sm">Revenue Generated</p>
          </div>
          <div className="bg-gray-700 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-blue-400">{MARKETPLACE_STATS.totalDownloads.toLocaleString()}</div>
            <p className="text-gray-400 text-sm">Downloads</p>
          </div>
          <div className="bg-gray-700 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-purple-400">{MARKETPLACE_STATS.activeCreators}</div>
            <p className="text-gray-400 text-sm">Active Creators</p>
          </div>
          <div className="bg-gray-700 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-yellow-400">{MARKETPLACE_STATS.averageRating}</div>
            <p className="text-gray-400 text-sm">Avg Rating</p>
          </div>
          <div className="bg-gray-700 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-orange-400">{MARKETPLACE_STATS.successfulBusinesses}</div>
            <p className="text-gray-400 text-sm">Successful Businesses</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-4">
          {[
            { id: 'featured', label: 'Featured', icon: Crown },
            { id: 'trending', label: 'Trending', icon: Flame },
            { id: 'new', label: 'New', icon: Sparkles },
            { id: 'top-rated', label: 'Top Rated', icon: Star }
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  activeTab === tab.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Search and Filters */}
        <div className="flex items-center gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search processes, creators, or tags..."
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
            <option value="featured">Featured First</option>
            <option value="popularity">Most Popular</option>
            <option value="rating">Highest Rated</option>
            <option value="revenue">Highest Revenue</option>
            <option value="newest">Newest</option>
            <option value="price_low">Price: Low to High</option>
            <option value="price_high">Price: High to Low</option>
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
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-gray-300 text-sm mb-2">Category</label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-600 text-white rounded border border-gray-500 focus:border-blue-500 focus:outline-none"
                >
                  <option value="all">All Categories</option>
                  <option value="business-development">Business Development</option>
                  <option value="content-marketing">Content & Marketing</option>
                  <option value="financial-planning">Financial Planning</option>
                  <option value="research-analysis">Research & Analysis</option>
                  <option value="product-development">Product Development</option>
                  <option value="customer-support">Customer Support</option>
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
              <div>
                <label className="block text-gray-300 text-sm mb-2">Pricing</label>
                <select
                  value={selectedPricing}
                  onChange={(e) => setSelectedPricing(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-600 text-white rounded border border-gray-500 focus:border-blue-500 focus:outline-none"
                >
                  <option value="all">All Pricing</option>
                  <option value="free">Free</option>
                  <option value="premium">Premium</option>
                  <option value="credits">Credits</option>
                  <option value="revenue_share">Revenue Share</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Processes Grid */}
      <div className="flex-1 overflow-y-auto p-6">
        {filteredProcesses.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredProcesses.map(renderProcessCard)}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <Search className="w-12 h-12 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-white mb-2">No processes found</h3>
              <p>Try adjusting your search criteria or filters</p>
            </div>
          </div>
        )}
      </div>

      {/* Process Preview Modal */}
      {selectedProcess && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-lg max-w-6xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-700">
              <div className="flex items-center gap-3">
                <div
                  className="w-12 h-12 rounded-lg flex items-center justify-center text-2xl"
                  style={{ backgroundColor: selectedProcess.color + '20' }}
                >
                  {selectedProcess.icon}
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h2 className="text-xl font-bold text-white">{selectedProcess.name}</h2>
                    {selectedProcess.isVerified && (
                      <CheckCircle className="w-5 h-5 text-green-400" />
                    )}
                    {selectedProcess.isFeatured && (
                      <Crown className="w-5 h-5 text-yellow-400" />
                    )}
                  </div>
                  <p className="text-gray-400">{selectedProcess.description}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedProcess(null)}
                className="text-gray-400 hover:text-white text-2xl"
              >
                ×
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column - 2/3 width */}
                <div className="lg:col-span-2 space-y-6">
                  {/* Author Info */}
                  <div className="bg-gray-700 rounded-lg p-4">
                    <h3 className="text-white font-semibold mb-3">Created by</h3>
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">{selectedProcess.author.avatar}</span>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-white font-medium">{selectedProcess.author.name}</span>
                          {selectedProcess.author.verified && (
                            <CheckCircle className="w-4 h-4 text-blue-400" />
                          )}
                          {selectedProcess.author.badge && (
                            <span className="px-2 py-1 bg-purple-600 text-purple-100 text-xs rounded">
                              {selectedProcess.author.badge}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 text-yellow-400 fill-current" />
                          <span className="text-gray-300">{selectedProcess.author.reputation.toLocaleString()} reputation</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Business Impact */}
                  {selectedProcess.businessMetrics && (
                    <div className="bg-gray-700 rounded-lg p-4">
                      <h3 className="text-white font-semibold mb-3">Business Impact</h3>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-green-400 mb-1">
                            ${(selectedProcess.businessMetrics.revenueGenerated / 1000000).toFixed(1)}M
                          </div>
                          <p className="text-gray-400 text-sm">Total Revenue Generated</p>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-blue-400 mb-1">
                            {selectedProcess.businessMetrics.businessesCreated}
                          </div>
                          <p className="text-gray-400 text-sm">Businesses Created</p>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-purple-400 mb-1">
                            {selectedProcess.businessMetrics.successStories}
                          </div>
                          <p className="text-gray-400 text-sm">Success Stories</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Key Features */}
                  <div className="bg-gray-700 rounded-lg p-4">
                    <h3 className="text-white font-semibold mb-3">Key Features</h3>
                    <ul className="space-y-2">
                      {selectedProcess.preview.keyFeatures.map((feature, index) => (
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
                      {selectedProcess.preview.outcomes.map((outcome, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <Target className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                          <span className="text-gray-300">{outcome}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Right Column - 1/3 width */}
                <div className="space-y-6">
                  {/* Pricing */}
                  <div className="bg-gray-700 rounded-lg p-4">
                    <h3 className="text-white font-semibold mb-3">Pricing</h3>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-white mb-2">
                        {getPricingDisplay(selectedProcess.pricing).text}
                      </div>
                      <p className="text-gray-400 text-sm mb-4">
                        {selectedProcess.pricing.type === 'revenue_share' 
                          ? 'Only pay when you make money'
                          : selectedProcess.pricing.type === 'free'
                          ? 'Completely free to use'
                          : 'One-time purchase'
                        }
                      </p>
                      <button className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
                        <Download className="w-5 h-5" />
                        Get This Process
                      </button>
                    </div>
                  </div>

                  {/* Metrics */}
                  <div className="bg-gray-700 rounded-lg p-4">
                    <h3 className="text-white font-semibold mb-3">Process Metrics</h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400">Rating</span>
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 text-yellow-400 fill-current" />
                          <span className="text-white font-medium">{selectedProcess.rating}</span>
                          <span className="text-gray-400">({selectedProcess.reviewCount})</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400">Success Rate</span>
                        <span className="text-white font-medium">{selectedProcess.successRate}%</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400">Downloads</span>
                        <span className="text-white font-medium">{selectedProcess.usageCount}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400">Duration</span>
                        <span className="text-white font-medium">{selectedProcess.estimatedDuration}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400">AI Agents</span>
                        <span className="text-white font-medium">{selectedProcess.agentCount}</span>
                      </div>
                    </div>
                  </div>

                  {/* AI Agent Team */}
                  <div className="bg-gray-700 rounded-lg p-4">
                    <h3 className="text-white font-semibold mb-3">AI Agent Team</h3>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 mb-2">
                        <Brain className="w-4 h-4 text-purple-400" />
                        <span className="text-white font-medium">Orchestrator:</span>
                      </div>
                      <div className="text-gray-300 text-sm mb-3">{selectedProcess.preview.orchestrator}</div>
                      
                      <div className="flex items-center gap-2 mb-2">
                        <Users className="w-4 h-4 text-blue-400" />
                        <span className="text-white font-medium">Agents:</span>
                      </div>
                      <div className="space-y-1">
                        {selectedProcess.preview.agents.slice(0, 6).map((agent, index) => (
                          <div key={index} className="text-gray-300 text-sm">• {agent}</div>
                        ))}
                        {selectedProcess.preview.agents.length > 6 && (
                          <div className="text-gray-400 text-sm">
                            +{selectedProcess.preview.agents.length - 6} more agents
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Community */}
                  <div className="bg-gray-700 rounded-lg p-4">
                    <h3 className="text-white font-semibold mb-3">Community</h3>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <ThumbsUp className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-400">Likes</span>
                        </div>
                        <span className="text-white font-medium">{selectedProcess.communityMetrics.likes}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <MessageSquare className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-400">Comments</span>
                        </div>
                        <span className="text-white font-medium">{selectedProcess.communityMetrics.comments}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Share2 className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-400">Shares</span>
                        </div>
                        <span className="text-white font-medium">{selectedProcess.communityMetrics.shares}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Copy className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-400">Forks</span>
                        </div>
                        <span className="text-white font-medium">{selectedProcess.communityMetrics.forks}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 mt-6 pt-6 border-t border-gray-700">
                <button className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
                  <Download className="w-5 h-5" />
                  Get This Process
                </button>
                <button className="flex items-center justify-center gap-2 px-4 py-3 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg transition-colors">
                  <Copy className="w-5 h-5" />
                  Fork
                </button>
                <button
                  onClick={() => toggleFavorite(selectedProcess.id)}
                  className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg transition-colors ${
                    selectedProcess.isFavorited
                      ? 'bg-red-600 hover:bg-red-700 text-white'
                      : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                  }`}
                >
                  <Heart className={`w-5 h-5 ${selectedProcess.isFavorited ? 'fill-current' : ''}`} />
                  {selectedProcess.isFavorited ? 'Favorited' : 'Favorite'}
                </button>
                <button className="flex items-center justify-center gap-2 px-4 py-3 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg transition-colors">
                  <Share2 className="w-5 h-5" />
                  Share
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProcessMarketplace;

