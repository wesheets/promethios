import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const InteractiveDemos: React.FC = () => {
  const [currentDemo, setCurrentDemo] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [demoStep, setDemoStep] = useState(0);

  const demos = [
    {
      title: "Hallucination Prevention",
      description: "Watch how Promethios stops AI from inventing fake legal cases",
      icon: "🧠",
      color: "from-red-500 to-red-600",
      steps: [
        { text: "User asks: 'Tell me about Johnson v. Smith case'", type: "user" },
        { text: "AI attempts to fabricate legal case details...", type: "ai" },
        { text: "🛡️ BLOCKED: Promethios detects fabrication", type: "system" },
        { text: "Redirected to verified legal databases", type: "success" }
      ]
    },
    {
      title: "Trust Score Monitoring",
      description: "See real-time trust metrics and compliance tracking",
      icon: "📊",
      color: "from-green-500 to-green-600",
      steps: [
        { text: "Agent processes 1,000 requests", type: "user" },
        { text: "Trust Score: 85% → 87% (improving)", type: "success" },
        { text: "Violations prevented: 12", type: "system" },
        { text: "Compliance: SOC2 ✓ HIPAA ✓", type: "success" }
      ]
    },
    {
      title: "Multi-Agent Coordination",
      description: "Govern complex workflows with multiple AI agents",
      icon: "🤖",
      color: "from-blue-500 to-blue-600",
      steps: [
        { text: "Agent 1: Research task initiated", type: "user" },
        { text: "Agent 2: Data validation required", type: "ai" },
        { text: "🔄 Promethios coordinates handoff", type: "system" },
        { text: "Task completed with full audit trail", type: "success" }
      ]
    }
  ];

  useEffect(() => {
    if (isPlaying) {
      const timer = setInterval(() => {
        setDemoStep((prev) => {
          if (prev >= demos[currentDemo].steps.length - 1) {
            setIsPlaying(false);
            return 0;
          }
          return prev + 1;
        });
      }, 1500);
      return () => clearInterval(timer);
    }
  }, [isPlaying, currentDemo, demos]);

  const startDemo = (demoIndex: number) => {
    setCurrentDemo(demoIndex);
    setDemoStep(0);
    setIsPlaying(true);
  };

  const getStepStyle = (stepType: string) => {
    switch (stepType) {
      case 'user': return 'bg-blue-900/20 border-blue-500/30 text-blue-300';
      case 'ai': return 'bg-gray-700 border-gray-600 text-gray-300';
      case 'system': return 'bg-orange-900/20 border-orange-500/30 text-orange-300';
      case 'success': return 'bg-green-900/20 border-green-500/30 text-green-300';
      default: return 'bg-gray-700 border-gray-600 text-gray-300';
    }
  };

  return (
    <section className="w-full py-20 px-4 sm:px-6 lg:px-8 bg-gray-900">
      <div className="max-w-screen-xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold mb-4 text-white">
            🎯 Want to see how Promethios stops AI hallucinations?
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Interactive demos showing real-time governance in action.
            Watch AI violations get prevented before they reach users.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
          {/* Demo Selection */}
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-white mb-6">Choose a Demo:</h3>
            {demos.map((demo, index) => (
              <div
                key={index}
                className={`p-6 rounded-xl border cursor-pointer transition-all duration-200 ${
                  currentDemo === index
                    ? 'bg-gray-700 border-blue-500 shadow-lg'
                    : 'bg-gray-800 border-gray-700 hover:border-gray-600'
                }`}
                onClick={() => startDemo(index)}
              >
                <div className="flex items-center space-x-4">
                  <div className={`w-12 h-12 bg-gradient-to-r ${demo.color} rounded-lg flex items-center justify-center text-2xl`}>
                    {demo.icon}
                  </div>
                  <div className="flex-1">
                    <h4 className="text-lg font-semibold text-white">{demo.title}</h4>
                    <p className="text-gray-400 text-sm">{demo.description}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    {currentDemo === index && isPlaying ? (
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    ) : (
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h1m4 0h1m6-10V7a3 3 0 11-6 0V4a3 3 0 11-6 0v3a3 3 0 11-6 0v3" />
                      </svg>
                    )}
                  </div>
                </div>
              </div>
            ))}

            <div className="mt-8 space-y-4">
              <Link
                to="/demo"
                className="block w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold py-3 px-6 rounded-lg transition-all duration-200 text-center"
              >
                Run Full Interactive Demo
              </Link>
              <Link
                to="/benchmark"
                className="block w-full bg-transparent border-2 border-blue-500 hover:bg-blue-500 text-blue-400 hover:text-white font-bold py-3 px-6 rounded-lg transition-all duration-200 text-center"
              >
                View Benchmark Results
              </Link>
            </div>
          </div>

          {/* Demo Visualization */}
          <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
            <div className="flex items-center justify-between mb-6">
              <h4 className="text-lg font-semibold text-white">{demos[currentDemo].title}</h4>
              <div className="flex items-center space-x-2">
                {isPlaying ? (
                  <div className="flex items-center space-x-2 text-green-400">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    <span className="text-sm">Running</span>
                  </div>
                ) : (
                  <button
                    onClick={() => startDemo(currentDemo)}
                    className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded text-sm transition-colors"
                  >
                    ▶ Play Demo
                  </button>
                )}
              </div>
            </div>

            <div className="space-y-4 h-64 overflow-y-auto">
              {demos[currentDemo].steps.map((step, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-lg border transition-all duration-300 ${
                    index <= demoStep && isPlaying
                      ? getStepStyle(step.type)
                      : 'bg-gray-700/50 border-gray-600/50 text-gray-500'
                  } ${
                    index === demoStep && isPlaying ? 'scale-105 shadow-lg' : ''
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-6 h-6 rounded-full bg-current opacity-20 flex items-center justify-center">
                      <span className="text-xs font-bold">{index + 1}</span>
                    </div>
                    <span className="text-sm">{step.text}</span>
                  </div>
                </div>
              ))}
            </div>

            {!isPlaying && demoStep === 0 && (
              <div className="text-center mt-8 text-gray-400">
                <svg className="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h1m4 0h1m6-10V7a3 3 0 11-6 0V4a3 3 0 11-6 0v3a3 3 0 11-6 0v3" />
                </svg>
                <p className="text-sm">Click "Play Demo" to see governance in action</p>
              </div>
            )}
          </div>
        </div>

        {/* Additional Demo Options */}
        <div className="mt-16 text-center">
          <h3 className="text-xl font-semibold text-white mb-6">More Ways to Experience Promethios:</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Link
              to="/ui/onboarding"
              className="bg-gray-800 hover:bg-gray-700 border border-gray-700 hover:border-blue-500 rounded-lg p-6 transition-all duration-200 group"
            >
              <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h4 className="text-white font-semibold mb-2">Wrap ChatGPT</h4>
              <p className="text-gray-400 text-sm">Mock user wraps an agent and sees governance flow</p>
            </Link>

            <Link
              to="/benchmark"
              className="bg-gray-800 hover:bg-gray-700 border border-gray-700 hover:border-green-500 rounded-lg p-6 transition-all duration-200 group"
            >
              <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-green-600 rounded-lg flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h4 className="text-white font-semibold mb-2">Run Benchmark Task</h4>
              <p className="text-gray-400 text-sm">Simulates CMU-style task with trust scoring</p>
            </Link>

            <Link
              to="/governed-vs-ungoverned"
              className="bg-gray-800 hover:bg-gray-700 border border-gray-700 hover:border-orange-500 rounded-lg p-6 transition-all duration-200 group"
            >
              <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <h4 className="text-white font-semibold mb-2">Governed vs Ungoverned</h4>
              <p className="text-gray-400 text-sm">Side-by-side comparison of AI behavior</p>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default InteractiveDemos;

