import React, { useState } from 'react';
import { Link } from 'react-router-dom';

interface Template {
  id: string;
  name: string;
  category: string;
  industry: string;
  description: string;
  setupTime: string;
  trustScoreImpact: number;
  frameworks: string[];
  compliance: string[];
  violationsPrevented: number;
  deployments: number;
  featured: boolean;
  complexity: 'Beginner' | 'Intermediate' | 'Advanced';
  icon: string;
  color: string;
}

const templates: Template[] = [
  {
    id: 'healthcare-hipaa',
    name: 'Healthcare HIPAA Compliance',
    category: 'Industry Compliance',
    industry: 'Healthcare',
    description: 'Complete HIPAA-compliant governance for medical AI systems. Includes patient data protection, PHI detection, and medical ethics enforcement.',
    setupTime: '15 min',
    trustScoreImpact: 94,
    frameworks: ['OpenAI', 'Claude', 'LangChain'],
    compliance: ['HIPAA', 'FDA 21 CFR Part 11'],
    violationsPrevented: 127,
    deployments: 89,
    featured: true,
    complexity: 'Intermediate',
    icon: '🏥',
    color: 'from-green-500 to-green-600'
  },
  {
    id: 'financial-sox',
    name: 'Financial Services SOX/PCI',
    category: 'Industry Compliance',
    industry: 'Financial',
    description: 'SOX and PCI DSS compliant governance for trading algorithms, fraud detection, and financial advisory AI systems.',
    setupTime: '20 min',
    trustScoreImpact: 91,
    frameworks: ['OpenAI', 'Gemini', 'Custom APIs'],
    compliance: ['SOX', 'PCI DSS', 'GDPR'],
    violationsPrevented: 203,
    deployments: 156,
    featured: true,
    complexity: 'Advanced',
    icon: '🏦',
    color: 'from-blue-500 to-blue-600'
  },
  {
    id: 'legal-ethics',
    name: 'Legal Ethics & Bar Compliance',
    category: 'Industry Compliance',
    industry: 'Legal',
    description: 'Prevent Johnson v. Smith scenarios with comprehensive legal AI governance. Includes citation verification and ethical guidelines.',
    setupTime: '10 min',
    trustScoreImpact: 96,
    frameworks: ['OpenAI', 'Claude', 'LangChain'],
    compliance: ['ABA Model Rules', 'State Bar Ethics'],
    violationsPrevented: 89,
    deployments: 67,
    featured: true,
    complexity: 'Intermediate',
    icon: '⚖️',
    color: 'from-purple-500 to-purple-600'
  },
  {
    id: 'customer-service',
    name: 'Customer Service Bot Governance',
    category: 'Use Case',
    industry: 'General',
    description: 'Brand safety, escalation policies, and customer satisfaction optimization for AI-powered support systems.',
    setupTime: '5 min',
    trustScoreImpact: 87,
    frameworks: ['OpenAI', 'Claude', 'Dialogflow'],
    compliance: ['CCPA', 'GDPR'],
    violationsPrevented: 156,
    deployments: 234,
    featured: false,
    complexity: 'Beginner',
    icon: '💬',
    color: 'from-cyan-500 to-cyan-600'
  },
  {
    id: 'content-generation',
    name: 'Content Generation Governance',
    category: 'Use Case',
    industry: 'Media',
    description: 'Copyright compliance, fact-checking, and brand voice consistency for AI content creation systems.',
    setupTime: '8 min',
    trustScoreImpact: 89,
    frameworks: ['OpenAI', 'Claude', 'Cohere'],
    compliance: ['DMCA', 'Copyright Law'],
    violationsPrevented: 78,
    deployments: 145,
    featured: false,
    complexity: 'Beginner',
    icon: '✍️',
    color: 'from-orange-500 to-orange-600'
  },
  {
    id: 'code-generation',
    name: 'Secure Code Generation',
    category: 'Use Case',
    industry: 'Technology',
    description: 'Security scanning, license compliance, and code quality enforcement for AI-powered development tools.',
    setupTime: '12 min',
    trustScoreImpact: 92,
    frameworks: ['OpenAI Codex', 'GitHub Copilot', 'Custom'],
    compliance: ['OWASP', 'License Compliance'],
    violationsPrevented: 134,
    deployments: 198,
    featured: false,
    complexity: 'Advanced',
    icon: '💻',
    color: 'from-indigo-500 to-indigo-600'
  },
  {
    id: 'education-ferpa',
    name: 'Education FERPA Compliance',
    category: 'Industry Compliance',
    industry: 'Education',
    description: 'Student data privacy and academic integrity governance for educational AI applications.',
    setupTime: '15 min',
    trustScoreImpact: 93,
    frameworks: ['OpenAI', 'Claude', 'Custom'],
    compliance: ['FERPA', 'COPPA'],
    violationsPrevented: 45,
    deployments: 78,
    featured: false,
    complexity: 'Intermediate',
    icon: '🎓',
    color: 'from-teal-500 to-teal-600'
  },
  {
    id: 'quick-demo',
    name: '5-Minute Demo Setup',
    category: 'Quick Start',
    industry: 'General',
    description: 'Instant governance setup for testing and demonstration purposes. Perfect for proof-of-concepts.',
    setupTime: '5 min',
    trustScoreImpact: 75,
    frameworks: ['OpenAI', 'Claude', 'Any API'],
    compliance: ['Basic Monitoring'],
    violationsPrevented: 23,
    deployments: 567,
    featured: false,
    complexity: 'Beginner',
    icon: '⚡',
    color: 'from-yellow-500 to-yellow-600'
  }
];

const TemplateLibraryPage: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedIndustry, setSelectedIndustry] = useState<string>('all');
  const [selectedComplexity, setSelectedComplexity] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');

  const categories = ['all', 'Industry Compliance', 'Use Case', 'Quick Start'];
  const industries = ['all', 'Healthcare', 'Financial', 'Legal', 'Education', 'Media', 'Technology', 'General'];
  const complexities = ['all', 'Beginner', 'Intermediate', 'Advanced'];

  const filteredTemplates = templates.filter(template => {
    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory;
    const matchesIndustry = selectedIndustry === 'all' || template.industry === selectedIndustry;
    const matchesComplexity = selectedComplexity === 'all' || template.complexity === selectedComplexity;
    const matchesSearch = searchTerm === '' || 
      template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      template.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesCategory && matchesIndustry && matchesComplexity && matchesSearch;
  });

  const featuredTemplates = templates.filter(t => t.featured);

  return (
    <div className="w-full bg-gray-900 text-white">
      {/* Hero Section */}
      <section className="w-full py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Cpath d='M20 20c0-5.5-4.5-10-10-10s-10 4.5-10 10 4.5 10 10 10 10-4.5 10-10zm10 0c0-5.5-4.5-10-10-10s-10 4.5-10 10 4.5 10 10 10 10-4.5 10-10z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}></div>
        </div>

        <div className="max-w-screen-xl mx-auto relative">
          <div className="text-center mb-16">
            <div className="inline-flex items-center space-x-2 bg-blue-900/20 border border-blue-500/30 rounded-full px-4 py-2 mb-6">
              <span className="text-blue-400 text-sm font-semibold">Template Library</span>
            </div>
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
              Ready-to-Deploy <span className="bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">AI Governance</span>
            </h1>
            <p className="text-xl sm:text-2xl mb-8 text-gray-300 max-w-4xl mx-auto leading-relaxed">
              From HIPAA compliance to financial regulations — get production-ready governance in minutes, not months. 
              Choose from industry-tested templates used by thousands of organizations.
            </p>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
              <div className="text-center">
                <div className="text-4xl font-bold text-blue-400 mb-2">50+</div>
                <div className="text-gray-300">Ready Templates</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-green-400 mb-2">1.2K+</div>
                <div className="text-gray-300">Active Deployments</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-purple-400 mb-2">99.7%</div>
                <div className="text-gray-300">Success Rate</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Templates */}
      <section className="w-full py-20 px-4 sm:px-6 lg:px-8 bg-gray-800">
        <div className="max-w-screen-xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-6 text-white">
              Featured Templates
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Our most popular and battle-tested governance templates
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {featuredTemplates.map((template) => (
              <div key={template.id} className="bg-gray-900/50 backdrop-blur-sm border border-gray-700 rounded-xl p-8 hover:border-gray-600 transition-all duration-300 group cursor-pointer">
                <div className="flex items-center space-x-3 mb-6">
                  <div className={`w-12 h-12 bg-gradient-to-r ${template.color} rounded-lg flex items-center justify-center text-2xl group-hover:scale-110 transition-transform duration-200`}>
                    {template.icon}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white group-hover:text-blue-300 transition-colors">{template.name}</h3>
                    <p className="text-gray-400 text-sm">{template.industry} • {template.complexity}</p>
                  </div>
                </div>

                <p className="text-gray-300 mb-6 leading-relaxed">{template.description}</p>

                <div className="space-y-4 mb-6">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400 text-sm">Trust Score Impact</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-20 bg-gray-700 rounded-full h-2">
                        <div 
                          className={`bg-gradient-to-r ${template.color} h-2 rounded-full`}
                          style={{ width: `${template.trustScoreImpact}%` }}
                        ></div>
                      </div>
                      <span className="text-white font-semibold text-sm">{template.trustScoreImpact}%</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-gray-400 text-sm">Setup Time</span>
                    <span className="text-green-400 font-semibold text-sm">{template.setupTime}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-gray-400 text-sm">Violations Prevented</span>
                    <span className="text-blue-400 font-semibold text-sm">{template.violationsPrevented}</span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 mb-6">
                  {template.compliance.slice(0, 2).map((comp, index) => (
                    <span key={index} className="bg-green-900/30 text-green-300 px-2 py-1 rounded-full text-xs">
                      {comp}
                    </span>
                  ))}
                  {template.compliance.length > 2 && (
                    <span className="bg-gray-700 text-gray-300 px-2 py-1 rounded-full text-xs">
                      +{template.compliance.length - 2} more
                    </span>
                  )}
                </div>

                <div className="flex space-x-3">
                  <button className={`flex-1 bg-gradient-to-r ${template.color} text-white font-semibold py-3 px-4 rounded-lg hover:opacity-90 transition-opacity text-sm`}>
                    Deploy Now
                  </button>
                  <button className="bg-gray-800 hover:bg-gray-700 text-gray-300 font-semibold py-3 px-4 rounded-lg transition-colors text-sm">
                    Preview
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Template Browser */}
      <section className="w-full py-20 px-4 sm:px-6 lg:px-8 bg-gray-900">
        <div className="max-w-screen-xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-6 text-white">
              Browse All Templates
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Find the perfect governance template for your specific needs
            </p>
          </div>

          {/* Filters */}
          <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-8 mb-12">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Search */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Search Templates</label>
                <input
                  type="text"
                  placeholder="Search by name or description..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Category Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Category</label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category === 'all' ? 'All Categories' : category}
                    </option>
                  ))}
                </select>
              </div>

              {/* Industry Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Industry</label>
                <select
                  value={selectedIndustry}
                  onChange={(e) => setSelectedIndustry(e.target.value)}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {industries.map((industry) => (
                    <option key={industry} value={industry}>
                      {industry === 'all' ? 'All Industries' : industry}
                    </option>
                  ))}
                </select>
              </div>

              {/* Complexity Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Complexity</label>
                <select
                  value={selectedComplexity}
                  onChange={(e) => setSelectedComplexity(e.target.value)}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {complexities.map((complexity) => (
                    <option key={complexity} value={complexity}>
                      {complexity === 'all' ? 'All Levels' : complexity}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center justify-between mt-6 pt-6 border-t border-gray-700">
              <div className="text-gray-300">
                Showing {filteredTemplates.length} of {templates.length} templates
              </div>
              <button 
                onClick={() => {
                  setSelectedCategory('all');
                  setSelectedIndustry('all');
                  setSelectedComplexity('all');
                  setSearchTerm('');
                }}
                className="text-blue-400 hover:text-blue-300 transition-colors text-sm"
              >
                Clear All Filters
              </button>
            </div>
          </div>

          {/* Template Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredTemplates.map((template) => (
              <div key={template.id} className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6 hover:border-gray-600 transition-all duration-300 group cursor-pointer">
                <div className="flex items-center space-x-3 mb-4">
                  <div className={`w-10 h-10 bg-gradient-to-r ${template.color} rounded-lg flex items-center justify-center text-lg group-hover:scale-110 transition-transform duration-200`}>
                    {template.icon}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-white group-hover:text-blue-300 transition-colors">{template.name}</h3>
                    <p className="text-gray-400 text-xs">{template.category}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-green-400 font-semibold text-sm">{template.setupTime}</div>
                    <div className="text-gray-400 text-xs">setup</div>
                  </div>
                </div>

                <p className="text-gray-300 text-sm mb-4 leading-relaxed line-clamp-3">{template.description}</p>

                <div className="flex items-center space-x-4 mb-4 text-xs text-gray-400">
                  <div className="flex items-center space-x-1">
                    <span>🎯</span>
                    <span>{template.trustScoreImpact}% trust</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <span>🛡️</span>
                    <span>{template.violationsPrevented} prevented</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <span>🚀</span>
                    <span>{template.deployments} deployed</span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1 mb-4">
                  {template.frameworks.slice(0, 3).map((framework, index) => (
                    <span key={index} className="bg-blue-900/30 text-blue-300 px-2 py-1 rounded-full text-xs">
                      {framework}
                    </span>
                  ))}
                </div>

                <div className="flex space-x-2">
                  <button className={`flex-1 bg-gradient-to-r ${template.color} text-white font-semibold py-2 px-3 rounded-lg hover:opacity-90 transition-opacity text-sm`}>
                    Deploy
                  </button>
                  <button className="bg-gray-700 hover:bg-gray-600 text-gray-300 font-semibold py-2 px-3 rounded-lg transition-colors text-sm">
                    Preview
                  </button>
                </div>
              </div>
            ))}
          </div>

          {filteredTemplates.length === 0 && (
            <div className="text-center py-16">
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="text-2xl font-bold text-white mb-4">No templates found</h3>
              <p className="text-gray-400 mb-6">Try adjusting your filters or search terms</p>
              <button 
                onClick={() => {
                  setSelectedCategory('all');
                  setSelectedIndustry('all');
                  setSelectedComplexity('all');
                  setSearchTerm('');
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
              >
                Clear All Filters
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Template Marketplace */}
      <section className="w-full py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-purple-900/20 to-blue-900/20">
        <div className="max-w-screen-xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-6 text-white">
              Community Template Marketplace
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Share your governance templates with the community and discover solutions from other organizations
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-gray-800/50 backdrop-blur-sm border border-purple-500/30 rounded-xl p-8">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg flex items-center justify-center mb-6">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">Share Your Templates</h3>
              <p className="text-gray-300 mb-6 leading-relaxed">
                Help the community by sharing your custom governance templates. 
                Earn recognition and contribute to the collective knowledge of AI governance.
              </p>
              <div className="space-y-3 mb-6">
                <div className="flex items-center space-x-2 text-sm text-gray-300">
                  <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                  <span>Automated template validation</span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-gray-300">
                  <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                  <span>Community feedback and ratings</span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-gray-300">
                  <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                  <span>Attribution and recognition</span>
                </div>
              </div>
              <button className="w-full bg-gradient-to-r from-purple-500 to-purple-600 text-white font-semibold py-3 px-6 rounded-lg hover:from-purple-600 hover:to-purple-700 transition-all duration-200">
                Submit Template
              </button>
            </div>

            <div className="bg-gray-800/50 backdrop-blur-sm border border-blue-500/30 rounded-xl p-8">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center mb-6">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">Discover Community Solutions</h3>
              <p className="text-gray-300 mb-6 leading-relaxed">
                Explore templates created by other organizations. Find unique solutions 
                for niche use cases and specialized industries.
              </p>
              <div className="space-y-3 mb-6">
                <div className="flex items-center space-x-2 text-sm text-gray-300">
                  <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                  <span>Peer-reviewed templates</span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-gray-300">
                  <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                  <span>Real-world usage statistics</span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-gray-300">
                  <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                  <span>Community support and discussion</span>
                </div>
              </div>
              <button className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold py-3 px-6 rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-200">
                Browse Community
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="w-full py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-gray-900 to-gray-800">
        <div className="max-w-screen-xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-6 text-white">
            Ready to Deploy Governance?
          </h2>
          <p className="text-xl mb-8 text-gray-300 max-w-3xl mx-auto">
            Choose a template and get production-ready AI governance running in minutes.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link 
              to="/ui/onboarding" 
              className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold py-4 px-8 rounded-lg transition-all duration-200 transform hover:scale-105 shadow-lg"
            >
              Deploy Your First Template
            </Link>
            <Link 
              to="/demo" 
              className="bg-transparent border-2 border-green-500 hover:bg-green-500 text-green-400 hover:text-white font-bold py-4 px-8 rounded-lg transition-all duration-200"
            >
              See Templates in Action
            </Link>
            <Link 
              to="/learn" 
              className="bg-transparent border-2 border-gray-600 hover:bg-gray-600 text-gray-300 hover:text-white font-bold py-4 px-8 rounded-lg transition-all duration-200"
            >
              Learn More
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default TemplateLibraryPage;

