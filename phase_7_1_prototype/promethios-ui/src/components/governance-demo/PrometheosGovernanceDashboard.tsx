import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { GovernanceDemoPlayground } from '../../modules/governance-demo/GovernanceDemoPlayground';
import { useAuth } from '../../hooks/useAuth';

const PrometheosGovernanceDashboard: React.FC = () => {
  const [activeDemo, setActiveDemo] = useState<string>('');
  const [governanceEnabled, setGovernanceEnabled] = useState(true);
  const { isLoggedIn, user } = useAuth();

  const demoScenarios = [
    {
      id: 'healthcare',
      name: 'Healthcare Compliance',
      icon: '🏥',
      description: 'See HIPAA compliance and medical ethics enforcement in action',
      color: 'from-green-500 to-green-600',
      violationsPrevented: 127,
      trustScore: 94,
      useCase: 'Prevent medical misinformation and protect patient privacy'
    },
    {
      id: 'legal',
      name: 'Legal Ethics',
      icon: '⚖️',
      description: 'Prevent Johnson v. Smith scenarios with citation verification',
      color: 'from-purple-500 to-purple-600',
      violationsPrevented: 89,
      trustScore: 96,
      useCase: 'Stop fabricated legal cases and ensure ethical compliance'
    },
    {
      id: 'financial',
      name: 'Financial Services',
      icon: '💰',
      description: 'SOX and PCI compliance for trading and advisory systems',
      color: 'from-blue-500 to-blue-600',
      violationsPrevented: 203,
      trustScore: 91,
      useCase: 'Regulatory compliance and risk management for financial AI'
    },
    {
      id: 'creative',
      name: 'Content Generation',
      icon: '✍️',
      description: 'Brand safety and copyright compliance for content creation',
      color: 'from-orange-500 to-orange-600',
      violationsPrevented: 156,
      trustScore: 87,
      useCase: 'Ensure brand-safe content while preventing copyright violations'
    },
    {
      id: 'customer-service',
      name: 'Customer Support',
      icon: '💬',
      description: 'Escalation policies and brand consistency for support bots',
      color: 'from-cyan-500 to-cyan-600',
      violationsPrevented: 234,
      trustScore: 89,
      useCase: 'Maintain brand voice while ensuring appropriate escalations'
    }
  ];

  return (
    <div className="w-full bg-gray-900 text-white min-h-screen">
      {/* Hero Section */}
      <section className="w-full py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='4'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}></div>
        </div>

        <div className="max-w-screen-xl mx-auto relative">
          <div className="text-center mb-16">
            <div className="inline-flex items-center space-x-2 bg-blue-900/20 border border-blue-500/30 rounded-full px-4 py-2 mb-6">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
              <span className="text-blue-400 text-sm font-semibold">Live Demo</span>
            </div>
            
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
              Experience <span className="bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">AI Governance</span> Live
            </h1>
            
            <p className="text-xl sm:text-2xl mb-8 text-gray-300 max-w-4xl mx-auto leading-relaxed">
              See how Promethios prevents violations, enforces policies, and builds trust in real-time. 
              Choose a scenario below and experience enterprise-grade AI governance in action.
            </p>

            {/* Governance Toggle */}
            <div className="flex items-center justify-center mb-12">
              <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6">
                <div className="flex items-center space-x-4">
                  <span className="text-gray-300 font-medium">Governance:</span>
                  <button
                    onClick={() => setGovernanceEnabled(!governanceEnabled)}
                    className={`relative inline-flex h-8 w-16 items-center rounded-full transition-colors duration-200 ${
                      governanceEnabled ? 'bg-green-500' : 'bg-gray-600'
                    }`}
                  >
                    <span
                      className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform duration-200 ${
                        governanceEnabled ? 'translate-x-9' : 'translate-x-1'
                      }`}
                    />
                  </button>
                  <span className={`font-semibold ${governanceEnabled ? 'text-green-400' : 'text-red-400'}`}>
                    {governanceEnabled ? 'ENABLED' : 'DISABLED'}
                  </span>
                </div>
                <p className="text-sm text-gray-400 mt-2 text-center">
                  {governanceEnabled 
                    ? 'Promethios governance is actively protecting your AI' 
                    : 'See what happens without governance protection'
                  }
                </p>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-16">
              <div className="text-center">
                <div className="text-3xl font-bold text-green-400 mb-2">1,247</div>
                <div className="text-gray-300 text-sm">Violations Prevented</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-400 mb-2">94%</div>
                <div className="text-gray-300 text-sm">Average Trust Score</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-400 mb-2">2.1M</div>
                <div className="text-gray-300 text-sm">Governed Responses</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-orange-400 mb-2">99.7%</div>
                <div className="text-gray-300 text-sm">Uptime</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Demo Scenarios */}
      <section className="w-full py-20 px-4 sm:px-6 lg:px-8 bg-gray-800">
        <div className="max-w-screen-xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-6 text-white">
              Choose Your Governance Scenario
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Each scenario demonstrates different aspects of Promethios governance. 
              Select one to see real-time violation prevention and trust scoring.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {demoScenarios.map((scenario) => (
              <motion.div
                key={scenario.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="bg-gray-900/50 backdrop-blur-sm border border-gray-700 rounded-xl p-8 hover:border-gray-600 transition-all duration-300 group cursor-pointer"
                onClick={() => setActiveDemo(scenario.id)}
              >
                <div className="flex items-center space-x-3 mb-6">
                  <div className={`w-16 h-16 bg-gradient-to-r ${scenario.color} rounded-xl flex items-center justify-center text-3xl group-hover:scale-110 transition-transform duration-200`}>
                    {scenario.icon}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white group-hover:text-blue-300 transition-colors">
                      {scenario.name}
                    </h3>
                    <p className="text-gray-400 text-sm">Interactive Demo</p>
                  </div>
                </div>

                <p className="text-gray-300 mb-6 leading-relaxed">{scenario.description}</p>

                <div className="space-y-4 mb-6">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400 text-sm">Trust Score Impact</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-20 bg-gray-700 rounded-full h-2">
                        <div 
                          className={`bg-gradient-to-r ${scenario.color} h-2 rounded-full transition-all duration-1000`}
                          style={{ width: `${scenario.trustScore}%` }}
                        ></div>
                      </div>
                      <span className="text-white font-semibold text-sm">{scenario.trustScore}%</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-gray-400 text-sm">Violations Prevented</span>
                    <span className="text-green-400 font-semibold text-sm">{scenario.violationsPrevented}</span>
                  </div>
                </div>

                <div className="bg-gray-800/50 rounded-lg p-4 mb-6">
                  <p className="text-gray-300 text-sm italic">"{scenario.useCase}"</p>
                </div>

                <button className={`w-full bg-gradient-to-r ${scenario.color} text-white font-semibold py-3 px-6 rounded-lg hover:opacity-90 transition-opacity group-hover:shadow-lg`}>
                  Try This Scenario
                </button>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Interactive Demo Playground */}
      {activeDemo && (
        <section className="w-full py-20 px-4 sm:px-6 lg:px-8 bg-gray-900">
          <div className="max-w-screen-xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold mb-6 text-white">
                Interactive Governance Demo
              </h2>
              <p className="text-xl text-gray-300 max-w-3xl mx-auto">
                Experience real-time AI governance with live agents and policy enforcement
              </p>
            </div>
            
            <GovernanceDemoPlayground 
              selectedScenario={activeDemo}
              governanceEnabled={governanceEnabled}
              onGovernanceToggle={setGovernanceEnabled}
              isLoggedIn={isLoggedIn}
            />
          </div>
        </section>
      )}

      {/* Results & CTA Section */}
      <section className="w-full py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-gray-900 to-gray-800">
        <div className="max-w-screen-xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-6 text-white">
            Ready to Govern Your AI?
          </h2>
          <p className="text-xl mb-8 text-gray-300 max-w-3xl mx-auto">
            You've seen how Promethios prevents violations and builds trust. 
            Now deploy this same governance for your production AI systems.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <button className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold py-4 px-8 rounded-lg transition-all duration-200 transform hover:scale-105 shadow-lg">
              Start Free Trial
            </button>
            <button className="bg-transparent border-2 border-green-500 hover:bg-green-500 text-green-400 hover:text-white font-bold py-4 px-8 rounded-lg transition-all duration-200">
              Schedule Demo Call
            </button>
            <button className="bg-transparent border-2 border-gray-600 hover:bg-gray-600 text-gray-300 hover:text-white font-bold py-4 px-8 rounded-lg transition-all duration-200">
              View Templates
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default PrometheosGovernanceDashboard;

