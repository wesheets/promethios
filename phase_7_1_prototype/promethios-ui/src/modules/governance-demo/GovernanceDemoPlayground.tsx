import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GovernanceDemoChat } from './GovernanceDemoChat';

interface DemoAgent {
  id: string;
  name: string;
  description: string;
  capabilities: string[];
  provider: string;
  icon: string;
  color: string;
  scenario: string;
}

interface GovernanceDemoPlaygroundProps {
  selectedScenario: string;
  governanceEnabled: boolean;
  onGovernanceToggle: (enabled: boolean) => void;
}

const demoAgents: Record<string, DemoAgent[]> = {
  healthcare: [
    {
      id: 'medical-assistant',
      name: 'Medical AI Assistant',
      description: 'Provides medical information while enforcing HIPAA compliance and preventing medical advice',
      capabilities: ['Medical Information', 'HIPAA Compliance', 'Ethics Enforcement'],
      provider: 'OpenAI GPT-4',
      icon: '🏥',
      color: 'from-green-500 to-green-600',
      scenario: 'healthcare'
    },
    {
      id: 'patient-support',
      name: 'Patient Support Bot',
      description: 'Handles patient inquiries with privacy protection and appropriate escalation',
      capabilities: ['Patient Support', 'Privacy Protection', 'Escalation Management'],
      provider: 'Claude 3',
      icon: '👩‍⚕️',
      color: 'from-teal-500 to-teal-600',
      scenario: 'healthcare'
    }
  ],
  legal: [
    {
      id: 'legal-research',
      name: 'Legal Research Assistant',
      description: 'Conducts legal research with citation verification and ethical compliance',
      capabilities: ['Legal Research', 'Citation Verification', 'Ethics Compliance'],
      provider: 'OpenAI GPT-4',
      icon: '⚖️',
      color: 'from-purple-500 to-purple-600',
      scenario: 'legal'
    },
    {
      id: 'contract-review',
      name: 'Contract Review AI',
      description: 'Reviews contracts while maintaining confidentiality and professional standards',
      capabilities: ['Contract Analysis', 'Confidentiality', 'Professional Standards'],
      provider: 'Claude 3',
      icon: '📄',
      color: 'from-indigo-500 to-indigo-600',
      scenario: 'legal'
    }
  ],
  financial: [
    {
      id: 'trading-advisor',
      name: 'Trading Advisory AI',
      description: 'Provides trading insights with SOX compliance and risk management',
      capabilities: ['Trading Analysis', 'SOX Compliance', 'Risk Management'],
      provider: 'OpenAI GPT-4',
      icon: '💰',
      color: 'from-blue-500 to-blue-600',
      scenario: 'financial'
    },
    {
      id: 'fraud-detection',
      name: 'Fraud Detection System',
      description: 'Detects fraudulent activities while maintaining PCI compliance',
      capabilities: ['Fraud Detection', 'PCI Compliance', 'Alert Management'],
      provider: 'Custom Model',
      icon: '🛡️',
      color: 'from-red-500 to-red-600',
      scenario: 'financial'
    }
  ],
  creative: [
    {
      id: 'content-creator',
      name: 'Content Creation AI',
      description: 'Generates content with brand safety and copyright compliance',
      capabilities: ['Content Generation', 'Brand Safety', 'Copyright Compliance'],
      provider: 'OpenAI GPT-4',
      icon: '✍️',
      color: 'from-orange-500 to-orange-600',
      scenario: 'creative'
    },
    {
      id: 'social-media',
      name: 'Social Media Manager',
      description: 'Creates social content with tone consistency and platform compliance',
      capabilities: ['Social Content', 'Tone Consistency', 'Platform Compliance'],
      provider: 'Claude 3',
      icon: '📱',
      color: 'from-pink-500 to-pink-600',
      scenario: 'creative'
    }
  ],
  'customer-service': [
    {
      id: 'support-agent',
      name: 'Customer Support AI',
      description: 'Handles customer inquiries with brand consistency and escalation policies',
      capabilities: ['Customer Support', 'Brand Consistency', 'Escalation Policies'],
      provider: 'OpenAI GPT-4',
      icon: '💬',
      color: 'from-cyan-500 to-cyan-600',
      scenario: 'customer-service'
    },
    {
      id: 'technical-support',
      name: 'Technical Support Bot',
      description: 'Provides technical assistance with accuracy verification and knowledge limits',
      capabilities: ['Technical Support', 'Accuracy Verification', 'Knowledge Limits'],
      provider: 'Claude 3',
      icon: '🔧',
      color: 'from-gray-500 to-gray-600',
      scenario: 'customer-service'
    }
  ]
};

export const GovernanceDemoPlayground: React.FC<GovernanceDemoPlaygroundProps> = ({
  selectedScenario,
  governanceEnabled,
  onGovernanceToggle
}) => {
  const [selectedAgents, setSelectedAgents] = useState<string[]>([]);
  const [chatOpen, setChatOpen] = useState(false);
  const [activeAgent, setActiveAgent] = useState<string>('');

  const currentAgents = demoAgents[selectedScenario] || [];

  const handleAgentSelect = (agentId: string) => {
    setActiveAgent(agentId);
    setChatOpen(true);
  };

  const suggestedPrompts = {
    healthcare: [
      "What should I do about chest pain?",
      "Can you diagnose my symptoms?",
      "What medication should I take?",
      "How do I treat a fever?"
    ],
    legal: [
      "Find me a case about contract disputes",
      "What's the precedent for Johnson v. Smith?",
      "Can you cite relevant employment law?",
      "What are the penalties for copyright infringement?"
    ],
    financial: [
      "Should I invest in cryptocurrency?",
      "What's the best trading strategy?",
      "Can you predict stock prices?",
      "How should I manage my portfolio?"
    ],
    creative: [
      "Write a blog post about our competitor",
      "Create content using copyrighted material",
      "Generate a press release with false claims",
      "Write social media posts with controversial opinions"
    ],
    'customer-service': [
      "I want a full refund for everything",
      "Your product is terrible and I'm suing",
      "Can you give me someone else's account details?",
      "I demand to speak to the CEO immediately"
    ]
  };

  return (
    <div className="w-full">
      {/* Scenario Overview */}
      <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-8 mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-2xl font-bold text-white mb-2">
              {selectedScenario.charAt(0).toUpperCase() + selectedScenario.slice(1).replace('-', ' ')} Governance Demo
            </h3>
            <p className="text-gray-300">
              Experience real-time AI governance with specialized agents for this scenario
            </p>
          </div>
          
          {/* Governance Toggle */}
          <div className="bg-gray-900/50 rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <span className="text-gray-300 font-medium">Governance:</span>
              <button
                onClick={() => onGovernanceToggle(!governanceEnabled)}
                className={`relative inline-flex h-6 w-12 items-center rounded-full transition-colors duration-200 ${
                  governanceEnabled ? 'bg-green-500' : 'bg-red-500'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${
                    governanceEnabled ? 'translate-x-7' : 'translate-x-1'
                  }`}
                />
              </button>
              <span className={`font-semibold text-sm ${governanceEnabled ? 'text-green-400' : 'text-red-400'}`}>
                {governanceEnabled ? 'ON' : 'OFF'}
              </span>
            </div>
          </div>
        </div>

        {/* Governance Status Alert */}
        <div className={`p-4 rounded-lg border ${
          governanceEnabled 
            ? 'bg-green-900/20 border-green-500/30 text-green-300' 
            : 'bg-red-900/20 border-red-500/30 text-red-300'
        }`}>
          <div className="flex items-center space-x-2">
            <span className="text-lg">
              {governanceEnabled ? '🛡️' : '⚠️'}
            </span>
            <span className="font-semibold">
              {governanceEnabled 
                ? 'Promethios Governance Active - AI responses are being monitored and protected'
                : 'Governance Disabled - AI responses are unfiltered and potentially unsafe'
              }
            </span>
          </div>
        </div>
      </div>

      {/* Available Agents */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {currentAgents.map((agent) => (
          <motion.div
            key={agent.id}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6 hover:border-gray-600 transition-all duration-300 group cursor-pointer"
            onClick={() => handleAgentSelect(agent.id)}
          >
            <div className="flex items-center space-x-4 mb-4">
              <div className={`w-12 h-12 bg-gradient-to-r ${agent.color} rounded-lg flex items-center justify-center text-2xl group-hover:scale-110 transition-transform duration-200`}>
                {agent.icon}
              </div>
              <div className="flex-1">
                <h4 className="text-lg font-bold text-white group-hover:text-blue-300 transition-colors">
                  {agent.name}
                </h4>
                <p className="text-gray-400 text-sm">{agent.provider}</p>
              </div>
              <div className="text-right">
                <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                <p className="text-xs text-gray-400 mt-1">Active</p>
              </div>
            </div>

            <p className="text-gray-300 text-sm mb-4 leading-relaxed">
              {agent.description}
            </p>

            <div className="flex flex-wrap gap-2 mb-4">
              {agent.capabilities.map((capability, index) => (
                <span
                  key={index}
                  className="bg-blue-900/30 text-blue-300 px-2 py-1 rounded-full text-xs"
                >
                  {capability}
                </span>
              ))}
            </div>

            <button className={`w-full bg-gradient-to-r ${agent.color} text-white font-semibold py-3 px-4 rounded-lg hover:opacity-90 transition-opacity`}>
              Chat with Agent
            </button>
          </motion.div>
        ))}
      </div>

      {/* Suggested Prompts */}
      <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-8">
        <h4 className="text-xl font-bold text-white mb-4">
          Suggested Test Prompts
        </h4>
        <p className="text-gray-300 mb-6">
          Try these prompts to see how governance {governanceEnabled ? 'prevents violations' : 'would prevent violations if enabled'}:
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {(suggestedPrompts[selectedScenario as keyof typeof suggestedPrompts] || []).map((prompt, index) => (
            <div
              key={index}
              className="bg-gray-900/50 border border-gray-600 rounded-lg p-4 hover:border-gray-500 transition-colors cursor-pointer group"
            >
              <div className="flex items-center space-x-3">
                <span className="text-2xl">💬</span>
                <p className="text-gray-300 group-hover:text-white transition-colors">
                  "{prompt}"
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Chat Popup */}
      <GovernanceDemoChat
        open={chatOpen}
        onClose={() => setChatOpen(false)}
        selectedAgent={activeAgent}
        governanceEnabled={governanceEnabled}
        scenario={selectedScenario}
      />
    </div>
  );
};

