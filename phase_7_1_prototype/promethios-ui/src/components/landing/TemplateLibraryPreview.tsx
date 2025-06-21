import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const TemplateLibraryPreview: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState('All');

  const categories = ['All', 'Healthcare', 'Legal', 'Finance', 'Customer Service', 'Research'];

  const templates = [
    {
      id: 1,
      name: "HIPAA-Compliant Medical Assistant",
      description: "Healthcare chatbot with patient privacy protection and medical fact-checking",
      category: "Healthcare",
      trustScore: 94,
      downloads: "2.3k",
      tags: ["HIPAA", "Medical", "Privacy"],
      icon: "🏥",
      color: "from-green-500 to-green-600"
    },
    {
      id: 2,
      name: "Legal Research Agent",
      description: "Prevents hallucinated case law and ensures citation accuracy",
      category: "Legal",
      trustScore: 91,
      downloads: "1.8k",
      tags: ["Legal", "Research", "Citations"],
      icon: "⚖️",
      color: "from-blue-500 to-blue-600"
    },
    {
      id: 3,
      name: "Financial Advisory Bot",
      description: "SOC2-compliant financial guidance with risk assessment",
      category: "Finance",
      trustScore: 89,
      downloads: "3.1k",
      tags: ["SOC2", "Finance", "Risk"],
      icon: "💰",
      color: "from-purple-500 to-purple-600"
    },
    {
      id: 4,
      name: "Customer Support Agent",
      description: "Multi-language support with escalation protocols and sentiment analysis",
      category: "Customer Service",
      trustScore: 87,
      downloads: "4.2k",
      tags: ["Support", "Multilingual", "Sentiment"],
      icon: "🎧",
      color: "from-orange-500 to-orange-600"
    },
    {
      id: 5,
      name: "Academic Research Assistant",
      description: "Peer-reviewed source verification and plagiarism prevention",
      category: "Research",
      trustScore: 93,
      downloads: "1.5k",
      tags: ["Academic", "Sources", "Verification"],
      icon: "🔬",
      color: "from-cyan-500 to-cyan-600"
    },
    {
      id: 6,
      name: "GDPR-Compliant Data Processor",
      description: "European data protection with automated consent management",
      category: "Legal",
      trustScore: 96,
      downloads: "987",
      tags: ["GDPR", "Privacy", "EU"],
      icon: "🛡️",
      color: "from-red-500 to-red-600"
    }
  ];

  const filteredTemplates = selectedCategory === 'All' 
    ? templates 
    : templates.filter(template => template.category === selectedCategory);

  const getTrustScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-400';
    if (score >= 80) return 'text-yellow-400';
    return 'text-red-400';
  };

  return (
    <section className="w-full py-20 px-4 sm:px-6 lg:px-8 bg-gray-800">
      <div className="max-w-screen-xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold mb-4 text-white">
            📚 Template Library
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Pre-built governance templates for common use cases. 
            Fork, customize, and deploy with one click.
          </p>
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap justify-center gap-3 mb-12">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                selectedCategory === category
                  ? 'bg-blue-500 text-white shadow-lg'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600 hover:text-white'
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        {/* Templates Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {filteredTemplates.map((template) => (
            <div
              key={template.id}
              className="bg-gray-900 rounded-xl border border-gray-700 hover:border-gray-600 transition-all duration-200 overflow-hidden group hover:shadow-xl"
            >
              {/* Template Header */}
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className={`w-12 h-12 bg-gradient-to-r ${template.color} rounded-lg flex items-center justify-center text-2xl group-hover:scale-110 transition-transform`}>
                    {template.icon}
                  </div>
                  <div className="text-right">
                    <div className={`text-lg font-bold ${getTrustScoreColor(template.trustScore)}`}>
                      {template.trustScore}%
                    </div>
                    <div className="text-xs text-gray-400">Trust Score</div>
                  </div>
                </div>

                <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-blue-400 transition-colors">
                  {template.name}
                </h3>
                <p className="text-gray-400 text-sm mb-4 line-clamp-2">
                  {template.description}
                </p>

                {/* Tags */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {template.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-gray-700 text-gray-300 text-xs rounded-md"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                {/* Stats */}
                <div className="flex items-center justify-between text-sm text-gray-400 mb-4">
                  <div className="flex items-center space-x-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span>{template.downloads} downloads</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                    </svg>
                    <span>{template.category}</span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-2">
                  <button className="flex-1 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-medium py-2 px-4 rounded-lg transition-all duration-200 text-sm">
                    Fork Template
                  </button>
                  <button className="bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white font-medium py-2 px-4 rounded-lg transition-all duration-200 text-sm">
                    Preview
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Browse All Templates CTA */}
        <div className="text-center">
          <div className="bg-gray-900 rounded-xl border border-gray-700 p-8 max-w-2xl mx-auto">
            <h3 className="text-xl font-semibold text-white mb-4">
              Ready to build with governance templates?
            </h3>
            <p className="text-gray-400 mb-6">
              Browse our full library of 50+ templates, or create your own custom governance policies.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/templates"
                className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-all duration-200"
              >
                Browse All Templates
              </Link>
              <Link
                to="/ui/onboarding"
                className="bg-transparent border-2 border-green-500 hover:bg-green-500 text-green-400 hover:text-white font-bold py-3 px-6 rounded-lg transition-all duration-200"
              >
                Create Custom Template
              </Link>
            </div>
          </div>
        </div>

        {/* Template Stats */}
        <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          <div>
            <div className="text-3xl font-bold text-blue-400 mb-2">50+</div>
            <div className="text-gray-400">Templates Available</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-green-400 mb-2">12k</div>
            <div className="text-gray-400">Total Downloads</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-purple-400 mb-2">91%</div>
            <div className="text-gray-400">Avg Trust Score</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-orange-400 mb-2">6</div>
            <div className="text-gray-400">Industry Verticals</div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TemplateLibraryPreview;

