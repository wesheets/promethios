import React, { useState } from 'react';

const PrometheusStackShowcase: React.FC = () => {
  const [activeComponent, setActiveComponent] = useState('vigil');
  const [isHovered, setIsHovered] = useState<string | null>(null);

  const stackComponents = {
    vigil: {
      name: "Vigil",
      subtitle: "Behavioral Monitoring",
      description: "Real-time agent behavior analysis and anomaly detection",
      icon: "👁️",
      color: "from-green-500 to-green-600",
      borderColor: "border-green-400",
      glowColor: "shadow-green-500/20",
      features: [
        "Continuous behavior monitoring",
        "Anomaly detection algorithms", 
        "Real-time alerting system",
        "Pattern recognition engine"
      ],
      metrics: {
        "Monitoring Accuracy": "99.2%",
        "Response Time": "<50ms",
        "False Positives": "0.3%"
      }
    },
    prism: {
      name: "PRISM",
      subtitle: "Transparency Engine", 
      description: "Explainable AI decisions with full audit trails",
      icon: "🔍",
      color: "from-blue-500 to-blue-600",
      borderColor: "border-blue-400",
      glowColor: "shadow-blue-500/20",
      features: [
        "Decision path visualization",
        "Confidence scoring",
        "Source attribution", 
        "Audit trail generation"
      ],
      metrics: {
        "Explainability Score": "94%",
        "Audit Coverage": "100%",
        "Trace Accuracy": "98.7%"
      }
    },
    veritas: {
      name: "Veritas",
      subtitle: "Truth Verification",
      description: "Fact-checking and hallucination prevention system", 
      icon: "✅",
      color: "from-purple-500 to-purple-600",
      borderColor: "border-purple-400",
      glowColor: "shadow-purple-500/20",
      features: [
        "Real-time fact verification",
        "Source validation",
        "Hallucination detection",
        "Knowledge base integration"
      ],
      metrics: {
        "Fact Check Accuracy": "96.8%",
        "Hallucination Prevention": "94%",
        "Source Verification": "99.1%"
      }
    }
  };

  const integrations = [
    { name: "OpenAI", logo: "🤖", status: "active" },
    { name: "Claude", logo: "🧠", status: "active" },
    { name: "Gemini", logo: "💎", status: "active" },
    { name: "Perplexity", logo: "🔮", status: "active" },
    { name: "LangChain", logo: "⛓️", status: "active" },
    { name: "LlamaIndex", logo: "🦙", status: "active" }
  ];

  return (
    <section className="w-full py-24 px-4 sm:px-6 lg:px-8 bg-slate-900 relative overflow-hidden">
      {/* Blueprint background pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cdefs%3E%3Cpattern id='grid' width='10' height='10' patternUnits='userSpaceOnUse'%3E%3Cpath d='M 10 0 L 0 0 0 10' fill='none' stroke='%2300d4ff' stroke-width='0.5'/%3E%3C/pattern%3E%3C/defs%3E%3Crect width='100' height='100' fill='url(%23grid)'/%3E%3C/svg%3E")`,
        }}></div>
      </div>
      
      {/* Blueprint frame border */}
      <div className="absolute inset-4 border border-cyan-500/30 rounded-lg pointer-events-none">
        <div className="absolute -top-2 -left-2 w-4 h-4 border-l-2 border-t-2 border-cyan-400"></div>
        <div className="absolute -top-2 -right-2 w-4 h-4 border-r-2 border-t-2 border-cyan-400"></div>
        <div className="absolute -bottom-2 -left-2 w-4 h-4 border-l-2 border-b-2 border-cyan-400"></div>
        <div className="absolute -bottom-2 -right-2 w-4 h-4 border-r-2 border-b-2 border-cyan-400"></div>
      </div>
      
      <div className="max-w-screen-xl mx-auto relative">
        <div className="text-center mb-20">
          <div className="inline-flex items-center space-x-2 bg-cyan-500/10 backdrop-blur-sm border border-cyan-500/30 rounded-full px-6 py-2 mb-6">
            <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></div>
            <span className="text-cyan-400 font-semibold">System Architecture</span>
          </div>
          <h2 className="text-5xl font-bold mb-6 text-white">
            🏗️ The <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">Promethios Stack</span>
          </h2>
          <p className="text-xl text-gray-300 max-w-4xl mx-auto leading-relaxed">
            Three core systems working together to provide comprehensive AI governance.
            Framework-agnostic and enterprise-ready.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
          {/* Stack Component Selector */}
          <div className="space-y-4">
            {Object.entries(stackComponents).map(([key, component]) => (
              <div
                key={key}
                className={`p-6 rounded-xl border cursor-pointer transition-all duration-300 group ${
                  activeComponent === key
                    ? `bg-slate-800/80 ${component.borderColor} ${component.glowColor} shadow-2xl backdrop-blur-sm`
                    : 'bg-slate-800/50 border-slate-600 hover:border-slate-500 hover:bg-slate-800/70'
                }`}
                onClick={() => setActiveComponent(key)}
                onMouseEnter={() => setIsHovered(key)}
                onMouseLeave={() => setIsHovered(null)}
              >
                <div className="flex items-center space-x-4">
                  <div className={`w-12 h-12 bg-gradient-to-r ${component.color} rounded-lg flex items-center justify-center text-2xl transition-all duration-300 ${
                    isHovered === key || activeComponent === key ? 'scale-110 shadow-lg' : ''
                  }`}>
                    {component.icon}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-white group-hover:text-cyan-300 transition-colors">
                      {component.name}
                    </h3>
                    <p className="text-gray-400 text-sm group-hover:text-gray-300 transition-colors">
                      {component.subtitle}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    {activeComponent === key && (
                      <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></div>
                    )}
                    <svg className={`w-5 h-5 text-gray-400 transition-all duration-300 ${
                      isHovered === key ? 'text-cyan-400 translate-x-1' : ''
                    }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </div>
            ))}

            {/* Integration Showcase */}
            <div className="mt-8 p-6 bg-slate-800/50 rounded-xl border border-slate-600 backdrop-blur-sm">
              <h4 className="text-white font-semibold mb-4 flex items-center space-x-2">
                <span>🔌</span>
                <span>Framework Integrations</span>
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              </h4>
              <div className="grid grid-cols-3 gap-3">
                {integrations.map((integration, index) => (
                  <div
                    key={index}
                    className="flex items-center space-x-2 p-2 bg-gray-700 rounded-lg"
                  >
                    <span className="text-lg">{integration.logo}</span>
                    <span className="text-gray-300 text-sm">{integration.name}</span>
                    <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Component Details */}
          <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
            <div className="flex items-center space-x-4 mb-6">
              <div className={`w-16 h-16 bg-gradient-to-r ${stackComponents[activeComponent as keyof typeof stackComponents].color} rounded-xl flex items-center justify-center text-3xl`}>
                {stackComponents[activeComponent as keyof typeof stackComponents].icon}
              </div>
              <div>
                <h3 className="text-2xl font-bold text-white">
                  {stackComponents[activeComponent as keyof typeof stackComponents].name}
                </h3>
                <p className="text-gray-400">
                  {stackComponents[activeComponent as keyof typeof stackComponents].subtitle}
                </p>
              </div>
            </div>

            <p className="text-gray-300 mb-6">
              {stackComponents[activeComponent as keyof typeof stackComponents].description}
            </p>

            {/* Features */}
            <div className="mb-6">
              <h4 className="text-white font-semibold mb-3">Key Features:</h4>
              <div className="space-y-2">
                {stackComponents[activeComponent as keyof typeof stackComponents].features.map((feature, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                    <span className="text-gray-300 text-sm">{feature}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Metrics */}
            <div>
              <h4 className="text-white font-semibold mb-3">Performance Metrics:</h4>
              <div className="grid grid-cols-1 gap-3">
                {Object.entries(stackComponents[activeComponent as keyof typeof stackComponents].metrics).map(([metric, value]) => (
                  <div key={metric} className="flex justify-between items-center p-3 bg-gray-700 rounded-lg">
                    <span className="text-gray-300 text-sm">{metric}</span>
                    <span className="text-green-400 font-semibold">{value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Architecture Diagram */}
            <div className="mt-6 p-4 bg-gray-900 rounded-lg border border-gray-600">
              <h4 className="text-white font-semibold mb-3 text-center">System Architecture</h4>
              <div className="flex items-center justify-center space-x-4">
                <div className="text-center">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center mb-2">
                    <span className="text-white text-lg">🤖</span>
                  </div>
                  <span className="text-gray-400 text-xs">Your AI</span>
                </div>
                <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
                <div className="text-center">
                  <div className={`w-12 h-12 bg-gradient-to-r ${stackComponents[activeComponent as keyof typeof stackComponents].color} rounded-lg flex items-center justify-center mb-2`}>
                    <span className="text-white text-lg">{stackComponents[activeComponent as keyof typeof stackComponents].icon}</span>
                  </div>
                  <span className="text-gray-400 text-xs">{stackComponents[activeComponent as keyof typeof stackComponents].name}</span>
                </div>
                <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
                <div className="text-center">
                  <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-green-600 rounded-lg flex items-center justify-center mb-2">
                    <span className="text-white text-lg">✅</span>
                  </div>
                  <span className="text-gray-400 text-xs">Governed Output</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div className="mt-16 text-center">
          <div className="bg-gray-800 rounded-xl border border-gray-700 p-8 max-w-2xl mx-auto">
            <h3 className="text-xl font-semibold text-white mb-4">
              Ready to implement the full Promethios Stack?
            </h3>
            <p className="text-gray-400 mb-6">
              Get started with our comprehensive governance platform. 
              All three systems work together seamlessly.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold py-3 px-6 rounded-lg transition-all duration-200">
                Deploy Full Stack
              </button>
              <button className="bg-transparent border-2 border-blue-500 hover:bg-blue-500 text-blue-400 hover:text-white font-bold py-3 px-6 rounded-lg transition-all duration-200">
                View Documentation
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PrometheusStackShowcase;

