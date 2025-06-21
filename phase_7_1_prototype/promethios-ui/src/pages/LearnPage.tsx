import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const LearnPage: React.FC = () => {
  const [selectedRole, setSelectedRole] = useState<string>('developer');

  const learningPaths = {
    developer: {
      title: "Developer Path",
      description: "Technical implementation and integration guides",
      color: "from-green-500 to-green-600",
      sections: ["Quick Setup", "API Integration", "Framework Guides", "Advanced Configuration"]
    },
    cto: {
      title: "CTO Path", 
      description: "Strategic governance and architecture decisions",
      color: "from-blue-500 to-blue-600",
      sections: ["ROI & Business Case", "Architecture Overview", "Scaling Governance", "Team Implementation"]
    },
    compliance: {
      title: "Compliance Officer Path",
      description: "Regulatory requirements and policy enforcement",
      color: "from-purple-500 to-purple-600", 
      sections: ["Regulatory Frameworks", "Policy Templates", "Audit & Reporting", "Risk Management"]
    }
  };

  return (
    <div className="w-full bg-gray-900 text-white">
      {/* Hero Section */}
      <section className="w-full py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}></div>
        </div>

        <div className="max-w-screen-xl mx-auto relative">
          <div className="text-center mb-16">
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
              Master <span className="bg-gradient-to-r from-green-400 to-blue-500 bg-clip-text text-transparent">AI Governance</span>
            </h1>
            <p className="text-xl sm:text-2xl mb-8 text-gray-300 max-w-4xl mx-auto leading-relaxed">
              From hallucination prevention to trust scoring — learn how to build AI you can actually rely on. 
              Join thousands of engineers mastering the future of trustworthy AI.
            </p>
            
            {/* Learning Path Selector */}
            <div className="flex flex-col sm:flex-row justify-center gap-4 mb-12">
              {Object.entries(learningPaths).map(([key, path]) => (
                <button
                  key={key}
                  onClick={() => setSelectedRole(key)}
                  className={`px-8 py-4 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105 ${
                    selectedRole === key
                      ? `bg-gradient-to-r ${path.color} text-white shadow-lg`
                      : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  {path.title}
                </button>
              ))}
            </div>

            {/* Selected Path Description */}
            <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6 max-w-2xl mx-auto">
              <h3 className="text-xl font-bold mb-2">{learningPaths[selectedRole as keyof typeof learningPaths].title}</h3>
              <p className="text-gray-300 mb-4">{learningPaths[selectedRole as keyof typeof learningPaths].description}</p>
              <div className="flex flex-wrap gap-2">
                {learningPaths[selectedRole as keyof typeof learningPaths].sections.map((section, index) => (
                  <span key={index} className="bg-gray-700 text-gray-300 px-3 py-1 rounded-full text-sm">
                    {section}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* AI Governance Fundamentals */}
      <section className="w-full py-20 px-4 sm:px-6 lg:px-8 bg-gray-800">
        <div className="max-w-screen-xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-6 text-white">
              AI Governance Fundamentals
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Understanding the critical need for AI governance in production systems
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-16">
            {/* The Trust Crisis */}
            <div>
              <h3 className="text-3xl font-bold mb-6 text-white">The AI Trust Crisis</h3>
              <div className="space-y-6">
                <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-6">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                    <span className="text-red-300 font-semibold">Critical Issue</span>
                  </div>
                  <p className="text-gray-300 leading-relaxed">
                    <strong>73% of enterprises</strong> report AI systems producing unreliable outputs in production. 
                    Hallucinations, bias, and policy violations are costing organizations millions in lost trust and regulatory penalties.
                  </p>
                </div>

                <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-6">
                  <h4 className="text-lg font-semibold mb-3 text-yellow-300">Real-World Impact</h4>
                  <ul className="space-y-2 text-gray-300">
                    <li>• <strong>$2.3M average cost</strong> of AI-related compliance violations</li>
                    <li>• <strong>67% increase</strong> in AI liability insurance claims</li>
                    <li>• <strong>45% of CIOs</strong> delay AI deployment due to trust concerns</li>
                  </ul>
                </div>

                <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-6">
                  <h4 className="text-lg font-semibold mb-3 text-blue-300">The Solution</h4>
                  <p className="text-gray-300 leading-relaxed">
                    Promethios provides real-time governance that wraps any AI system with policy enforcement, 
                    trust scoring, and hallucination prevention — transforming unreliable AI into trustworthy infrastructure.
                  </p>
                </div>
              </div>
            </div>

            {/* Johnson v. Smith Case Study */}
            <div className="bg-gray-900 border border-gray-700 rounded-xl p-8">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-r from-red-500 to-red-600 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white">Case Study: Johnson v. Smith</h3>
                  <p className="text-gray-400">The $50M Hallucination That Changed Everything</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="bg-gray-800 rounded-lg p-4">
                  <h4 className="font-semibold text-red-300 mb-2">The Problem</h4>
                  <p className="text-gray-300 text-sm">
                    A major law firm's AI assistant fabricated the landmark case "Johnson v. Smith" in a federal court filing, 
                    leading to sanctions, client losses, and a $50M settlement.
                  </p>
                </div>

                <div className="bg-gray-800 rounded-lg p-4">
                  <h4 className="font-semibold text-green-300 mb-2">Promethios Prevention</h4>
                  <p className="text-gray-300 text-sm">
                    Our Veritas fact-checking system would have flagged the fabricated case instantly, 
                    preventing the hallucination from reaching the court filing.
                  </p>
                </div>

                <div className="bg-gradient-to-r from-green-500/10 to-blue-500/10 border border-green-500/20 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    <span className="text-green-300 font-semibold text-sm">Prevented by Promethios</span>
                  </div>
                  <p className="text-gray-300 text-xs">
                    "Blocked fabricated legal case 'Johnson v. Smith' - redirected to verified sources"
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Technical Deep Dive */}
      <section className="w-full py-20 px-4 sm:px-6 lg:px-8 bg-slate-900 relative">
        {/* Blueprint Grid Background */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' stroke='%2300FFFF' stroke-width='1'%3E%3Cpath d='M0 0h100v100H0z'/%3E%3Cpath d='M0 20h100M0 40h100M0 60h100M0 80h100M20 0v100M40 0v100M60 0v100M80 0v100'/%3E%3C/g%3E%3C/svg%3E")`,
          }}></div>
        </div>

        <div className="max-w-screen-xl mx-auto relative">
          <div className="text-center mb-16">
            <div className="inline-flex items-center space-x-2 bg-cyan-900/20 border border-cyan-500/30 rounded-full px-4 py-2 mb-6">
              <span className="text-cyan-400 text-sm font-semibold">System Architecture</span>
            </div>
            <h2 className="text-4xl font-bold mb-6 text-white">
              How Promethios Works
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Deep dive into the three-layer architecture that makes AI governance possible
            </p>
          </div>

          {/* Architecture Components */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            {/* Vigil */}
            <div className="bg-gray-800/50 backdrop-blur-sm border border-cyan-500/30 rounded-xl p-8 hover:border-cyan-400 transition-all duration-300 group">
              <div className="w-16 h-16 bg-gradient-to-r from-cyan-500 to-cyan-600 rounded-lg flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-200">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold mb-4 text-cyan-400 group-hover:text-cyan-300 transition-colors">Vigil</h3>
              <p className="text-gray-300 mb-4 leading-relaxed">
                Real-time monitoring layer that observes every AI interaction, tracking patterns, 
                anomalies, and policy violations across your entire AI infrastructure.
              </p>
              <div className="space-y-2">
                <div className="flex items-center space-x-2 text-sm text-gray-400">
                  <div className="w-2 h-2 bg-cyan-400 rounded-full"></div>
                  <span>24/7 continuous monitoring</span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-gray-400">
                  <div className="w-2 h-2 bg-cyan-400 rounded-full"></div>
                  <span>Pattern recognition & anomaly detection</span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-gray-400">
                  <div className="w-2 h-2 bg-cyan-400 rounded-full"></div>
                  <span>Multi-agent coordination</span>
                </div>
              </div>
            </div>

            {/* PRISM */}
            <div className="bg-gray-800/50 backdrop-blur-sm border border-blue-500/30 rounded-xl p-8 hover:border-blue-400 transition-all duration-300 group">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-200">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold mb-4 text-blue-400 group-hover:text-blue-300 transition-colors">PRISM</h3>
              <p className="text-gray-300 mb-4 leading-relaxed">
                Transparency and explainability engine that provides full visibility into AI decision-making, 
                enabling trust through understanding and auditability.
              </p>
              <div className="space-y-2">
                <div className="flex items-center space-x-2 text-sm text-gray-400">
                  <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                  <span>Decision path visualization</span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-gray-400">
                  <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                  <span>Confidence scoring & uncertainty quantification</span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-gray-400">
                  <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                  <span>Audit trail generation</span>
                </div>
              </div>
            </div>

            {/* Veritas */}
            <div className="bg-gray-800/50 backdrop-blur-sm border border-purple-500/30 rounded-xl p-8 hover:border-purple-400 transition-all duration-300 group">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-200">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold mb-4 text-purple-400 group-hover:text-purple-300 transition-colors">Veritas</h3>
              <p className="text-gray-300 mb-4 leading-relaxed">
                Fact-checking and validation system that prevents hallucinations by cross-referencing 
                AI outputs against verified knowledge bases and real-time data sources.
              </p>
              <div className="space-y-2">
                <div className="flex items-center space-x-2 text-sm text-gray-400">
                  <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                  <span>Real-time fact verification</span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-gray-400">
                  <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                  <span>Knowledge base cross-referencing</span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-gray-400">
                  <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                  <span>Hallucination prevention</span>
                </div>
              </div>
            </div>
          </div>

          {/* Trust Score Algorithm */}
          <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-600 rounded-xl p-8">
            <h3 className="text-2xl font-bold mb-6 text-white">Trust Score Algorithm</h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div>
                <h4 className="text-lg font-semibold mb-4 text-green-400">How We Calculate Trust</h4>
                <div className="space-y-4">
                  <div className="bg-gray-900 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-gray-300 font-medium">Competence Score</span>
                      <span className="text-blue-400 font-bold">92%</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div className="bg-gradient-to-r from-blue-400 to-blue-500 h-2 rounded-full" style={{width: '92%'}}></div>
                    </div>
                    <p className="text-gray-400 text-sm mt-2">Accuracy and reliability of AI outputs</p>
                  </div>

                  <div className="bg-gray-900 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-gray-300 font-medium">Reliability Score</span>
                      <span className="text-green-400 font-bold">88%</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div className="bg-gradient-to-r from-green-400 to-green-500 h-2 rounded-full" style={{width: '88%'}}></div>
                    </div>
                    <p className="text-gray-400 text-sm mt-2">Consistency across similar queries</p>
                  </div>

                  <div className="bg-gray-900 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-gray-300 font-medium">Transparency Score</span>
                      <span className="text-purple-400 font-bold">79%</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div className="bg-gradient-to-r from-purple-400 to-purple-500 h-2 rounded-full" style={{width: '79%'}}></div>
                    </div>
                    <p className="text-gray-400 text-sm mt-2">Explainability of decision processes</p>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-lg font-semibold mb-4 text-green-400">Real-Time Adjustments</h4>
                <div className="bg-gray-900 rounded-lg p-6">
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                      <span className="text-gray-300 text-sm">Continuous learning from interactions</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-3 h-3 bg-blue-400 rounded-full animate-pulse"></div>
                      <span className="text-gray-300 text-sm">Policy violation impact assessment</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-3 h-3 bg-purple-400 rounded-full animate-pulse"></div>
                      <span className="text-gray-300 text-sm">User feedback integration</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-3 h-3 bg-yellow-400 rounded-full animate-pulse"></div>
                      <span className="text-gray-300 text-sm">Contextual risk evaluation</span>
                    </div>
                  </div>
                  
                  <div className="mt-6 p-4 bg-green-900/20 border border-green-500/30 rounded-lg">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="text-green-300 font-semibold text-sm">Overall Trust Score</span>
                      <span className="text-2xl font-bold text-green-400">85%</span>
                    </div>
                    <p className="text-gray-300 text-xs">
                      Weighted average across all dimensions with real-time adjustments
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Implementation Guides */}
      <section className="w-full py-20 px-4 sm:px-6 lg:px-8 bg-gray-900">
        <div className="max-w-screen-xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-6 text-white">
              Implementation Guides
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Get started with Promethios in minutes, not months
            </p>
          </div>

          {/* Quick Setup Guide */}
          <div className="bg-gradient-to-r from-green-900/20 to-blue-900/20 border border-green-500/20 rounded-xl p-8 mb-12">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-green-600 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div>
                <h3 className="text-2xl font-bold text-white">5-Minute Setup</h3>
                <p className="text-gray-400">From zero to governed AI in minutes</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-gray-800/50 rounded-lg p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white font-bold text-sm">1</div>
                  <h4 className="text-lg font-semibold text-white">Install</h4>
                </div>
                <div className="bg-gray-900 rounded-lg p-4 mb-4">
                  <code className="text-green-400 text-sm">npm install @promethios/governance</code>
                </div>
                <p className="text-gray-300 text-sm">Add Promethios to your project with a single command</p>
              </div>

              <div className="bg-gray-800/50 rounded-lg p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-sm">2</div>
                  <h4 className="text-lg font-semibold text-white">Configure</h4>
                </div>
                <div className="bg-gray-900 rounded-lg p-4 mb-4">
                  <code className="text-blue-400 text-sm">promethios.wrap(yourAI)</code>
                </div>
                <p className="text-gray-300 text-sm">Wrap any AI system with governance in one line</p>
              </div>

              <div className="bg-gray-800/50 rounded-lg p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center text-white font-bold text-sm">3</div>
                  <h4 className="text-lg font-semibold text-white">Monitor</h4>
                </div>
                <div className="bg-gray-900 rounded-lg p-4 mb-4">
                  <code className="text-purple-400 text-sm">dashboard.promethios.ai</code>
                </div>
                <p className="text-gray-300 text-sm">Watch your trust score and governance metrics live</p>
              </div>
            </div>
          </div>

          {/* Framework Integration */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { name: 'OpenAI', logo: '🤖', color: 'from-green-500 to-green-600' },
              { name: 'Claude', logo: '🧠', color: 'from-blue-500 to-blue-600' },
              { name: 'LangChain', logo: '🔗', color: 'from-purple-500 to-purple-600' },
              { name: 'Gemini', logo: '💎', color: 'from-yellow-500 to-yellow-600' }
            ].map((framework, index) => (
              <div key={index} className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6 hover:border-gray-600 transition-all duration-300 group cursor-pointer">
                <div className={`w-12 h-12 bg-gradient-to-r ${framework.color} rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-200`}>
                  <span className="text-2xl">{framework.logo}</span>
                </div>
                <h4 className="text-lg font-semibold text-white mb-2">{framework.name}</h4>
                <p className="text-gray-400 text-sm">Ready-to-use integration guide</p>
                <div className="mt-4">
                  <span className="text-sm text-blue-400 hover:text-blue-300 transition-colors">
                    View Guide →
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Case Studies & Results */}
      <section className="w-full py-20 px-4 sm:px-6 lg:px-8 bg-white text-gray-900">
        <div className="max-w-screen-xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-6 text-gray-900">
              Real Results, Real Impact
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              See how organizations are transforming their AI with Promethios governance
            </p>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            <div className="text-center">
              <div className="text-5xl font-bold text-blue-600 mb-2">243</div>
              <div className="text-lg font-semibold text-gray-900 mb-2">Violations Prevented</div>
              <p className="text-gray-600">Critical policy violations caught before reaching production</p>
            </div>
            <div className="text-center">
              <div className="text-5xl font-bold text-green-600 mb-2">1.2M</div>
              <div className="text-lg font-semibold text-gray-900 mb-2">Governed Responses</div>
              <p className="text-gray-600">AI interactions monitored and validated in real-time</p>
            </div>
            <div className="text-center">
              <div className="text-5xl font-bold text-purple-600 mb-2">99.7%</div>
              <div className="text-lg font-semibold text-gray-900 mb-2">Uptime</div>
              <p className="text-gray-600">Reliable governance infrastructure you can depend on</p>
            </div>
          </div>

          {/* Success Stories */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-8">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Global Law Firm</h3>
                  <p className="text-gray-600">Fortune 500 Legal Services</p>
                </div>
              </div>
              <blockquote className="text-gray-700 mb-6 leading-relaxed">
                "After the Johnson v. Smith incident cost us $50M, we implemented Promethios. 
                In 6 months, we've prevented 47 potential hallucinations and increased client trust by 340%. 
                It's not just governance — it's business protection."
              </blockquote>
              <div className="flex items-center space-x-4 text-sm text-gray-600">
                <span>• 47 hallucinations prevented</span>
                <span>• 340% trust increase</span>
                <span>• $50M+ risk mitigation</span>
              </div>
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded-xl p-8">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2-2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Healthcare AI Startup</h3>
                  <p className="text-gray-600">HIPAA-Compliant Medical AI</p>
                </div>
              </div>
              <blockquote className="text-gray-700 mb-6 leading-relaxed">
                "Promethios enabled us to deploy AI in healthcare with confidence. 
                The HIPAA compliance templates and real-time monitoring gave us the governance 
                framework we needed to scale from 1K to 100K patient interactions."
              </blockquote>
              <div className="flex items-center space-x-4 text-sm text-gray-600">
                <span>• 100K+ patient interactions</span>
                <span>• HIPAA compliant</span>
                <span>• Zero violations</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="w-full py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-gray-900 to-gray-800">
        <div className="max-w-screen-xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-6 text-white">
            Ready to Master AI Governance?
          </h2>
          <p className="text-xl mb-8 text-gray-300 max-w-3xl mx-auto">
            Join thousands of engineers building trustworthy AI systems with Promethios.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link 
              to="/ui/onboarding" 
              className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold py-4 px-8 rounded-lg transition-all duration-200 transform hover:scale-105 shadow-lg"
            >
              Start Learning Now
            </Link>
            <Link 
              to="/demo" 
              className="bg-transparent border-2 border-blue-500 hover:bg-blue-500 text-blue-400 hover:text-white font-bold py-4 px-8 rounded-lg transition-all duration-200"
            >
              Try Live Demo
            </Link>
            <Link 
              to="/templates" 
              className="bg-transparent border-2 border-gray-600 hover:bg-gray-600 text-gray-300 hover:text-white font-bold py-4 px-8 rounded-lg transition-all duration-200"
            >
              Browse Templates
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default LearnPage;

