import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * Onboarding Interactive Demo - Step 2: See Governance In Action
 * 
 * This component lets users interact with demo agents to experience
 * the difference between governed and ungoverned AI responses.
 */
const OnboardingDemo: React.FC = () => {
  const navigate = useNavigate();
  const [selectedAgent, setSelectedAgent] = useState('software-engineer');
  const [governanceEnabled, setGovernanceEnabled] = useState(false);
  const [currentScenario, setCurrentScenario] = useState(0);
  const [showComparison, setShowComparison] = useState(false);

  const agents = [
    {
      id: 'software-engineer',
      name: 'Alex Chen',
      role: 'Software Engineer',
      avatar: '👨‍💻',
      specialty: 'Code review and security analysis'
    },
    {
      id: 'product-manager',
      name: 'Sarah Rodriguez', 
      role: 'Product Manager',
      avatar: '👩‍💼',
      specialty: 'Market analysis and strategy'
    },
    {
      id: 'hr-specialist',
      name: 'Marcus Thompson',
      role: 'HR Specialist', 
      avatar: '👨‍💼',
      specialty: 'Resume screening and diversity'
    },
    {
      id: 'data-analyst',
      name: 'Emma Liu',
      role: 'Data Analyst',
      avatar: '👩‍🔬', 
      specialty: 'Statistical analysis and insights'
    }
  ];

  const scenarios = [
    {
      title: "Code Security Review",
      prompt: "Review this login function for security vulnerabilities",
      ungoverned: "Looks fine to me! The code seems to work correctly and handles user authentication.",
      governed: "⚠️ SECURITY CONCERNS IDENTIFIED:\n\n1. Password stored in plain text (Article 2.1 violation)\n2. No input validation for SQL injection\n3. Missing rate limiting for brute force protection\n4. No audit logging for security events\n\nRECOMMENDATIONS:\n• Hash passwords with bcrypt\n• Implement parameterized queries\n• Add rate limiting middleware\n• Enable security audit logs",
      explanation: "Governance ensures thorough security analysis and identifies critical vulnerabilities that could compromise user data."
    },
    {
      title: "Hiring Decision",
      prompt: "Should we hire this candidate based on their resume?",
      ungoverned: "No, this candidate doesn't seem like a good fit. Their background is unconventional and they have gaps in employment.",
      governed: "🎯 STRUCTURED EVALUATION:\n\nTECHNICAL SKILLS: Strong match (8/10)\n• Relevant experience in required technologies\n• Demonstrated problem-solving abilities\n\nDIVERSITY CONSIDERATION (Article 4.2):\n• Candidate brings valuable diverse perspective\n• Non-traditional background shows adaptability\n\nRECOMMENDATION: Interview recommended\n• Focus on technical assessment\n• Explore career transition story\n• Assess cultural fit through structured questions",
      explanation: "Governance prevents bias and ensures fair, structured evaluation based on relevant criteria rather than assumptions."
    },
    {
      title: "Data Analysis Request", 
      prompt: "Analyze user engagement data and tell me what's working",
      ungoverned: "Engagement is up 15% this month! Users love the new features. Everything looks great - keep doing what you're doing!",
      governed: "📊 COMPREHENSIVE ENGAGEMENT ANALYSIS:\n\nKEY METRICS:\n• Overall engagement: +15% (statistically significant, p<0.05)\n• Feature adoption: 67% of active users\n• Retention: +8% week-over-week\n\nSEGMENT BREAKDOWN:\n• Power users: +25% engagement\n• New users: +5% engagement\n• Mobile vs Desktop: 60/40 split\n\nCONCERNS (Article 3.1 - Data Integrity):\n• Sample size limitations in some segments\n• Potential seasonal effects not accounted for\n• Need longer observation period for trend validation\n\nRECOMMENDATIONS:\n• Continue monitoring for 2 more weeks\n• Conduct user surveys for qualitative insights\n• A/B test feature variations",
      explanation: "Governance ensures thorough analysis with proper statistical rigor and acknowledges limitations rather than oversimplifying results."
    }
  ];

  const currentAgent = agents.find(a => a.id === selectedAgent) || agents[0];
  const scenario = scenarios[currentScenario];

  const handleToggleGovernance = () => {
    setGovernanceEnabled(!governanceEnabled);
    setShowComparison(true);
  };

  const nextScenario = () => {
    if (currentScenario < scenarios.length - 1) {
      setCurrentScenario(currentScenario + 1);
      setShowComparison(false);
    }
  };

  const prevScenario = () => {
    if (currentScenario > 0) {
      setCurrentScenario(currentScenario - 1);
      setShowComparison(false);
    }
  };

  const continueToNextStep = () => {
    navigate('/ui/onboarding/first-agent');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            Experience Governed AI
          </h1>
          <p className="text-lg text-gray-300">
            See how governance transforms AI responses in real workplace scenarios
          </p>
        </div>

        {/* Agent Selection */}
        <div className="bg-gray-800 rounded-xl p-6 mb-6 border border-gray-700">
          <h3 className="text-lg font-semibold text-white mb-4">Choose an Agent to Test</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {agents.map((agent) => (
              <button
                key={agent.id}
                onClick={() => setSelectedAgent(agent.id)}
                className={`p-4 rounded-lg border-2 transition-all ${
                  selectedAgent === agent.id
                    ? 'border-blue-400 bg-blue-900/30'
                    : 'border-gray-600 bg-gray-700 hover:border-gray-500'
                }`}
              >
                <div className="text-3xl mb-2">{agent.avatar}</div>
                <div className="text-white font-medium text-sm">{agent.name}</div>
                <div className="text-gray-400 text-xs">{agent.role}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Scenario Selection */}
        <div className="bg-gray-800 rounded-xl p-6 mb-6 border border-gray-700">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-white">Scenario {currentScenario + 1} of {scenarios.length}</h3>
            <div className="flex space-x-2">
              <button
                onClick={prevScenario}
                disabled={currentScenario === 0}
                className={`px-4 py-2 rounded-lg ${
                  currentScenario === 0
                    ? 'text-gray-500 cursor-not-allowed'
                    : 'text-gray-300 hover:text-white hover:bg-gray-700'
                }`}
              >
                Previous
              </button>
              <button
                onClick={nextScenario}
                disabled={currentScenario === scenarios.length - 1}
                className={`px-4 py-2 rounded-lg ${
                  currentScenario === scenarios.length - 1
                    ? 'text-gray-500 cursor-not-allowed'
                    : 'text-gray-300 hover:text-white hover:bg-gray-700'
                }`}
              >
                Next
              </button>
            </div>
          </div>
          
          <div className="bg-gray-700 rounded-lg p-4 mb-4">
            <h4 className="text-white font-medium mb-2">{scenario.title}</h4>
            <p className="text-gray-300 italic">"{scenario.prompt}"</p>
          </div>
        </div>

        {/* Governance Toggle */}
        <div className="bg-gray-800 rounded-xl p-6 mb-6 border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-white mb-1">AI Governance</h3>
              <p className="text-gray-400 text-sm">
                {governanceEnabled ? 'Constitutional framework active' : 'No governance oversight'}
              </p>
            </div>
            <button
              onClick={handleToggleGovernance}
              className={`relative inline-flex h-8 w-16 items-center rounded-full transition-colors ${
                governanceEnabled ? 'bg-blue-600' : 'bg-gray-600'
              }`}
            >
              <span
                className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                  governanceEnabled ? 'translate-x-9' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Response Display */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Current Response */}
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <div className="flex items-center mb-4">
              <div className="text-2xl mr-3">{currentAgent.avatar}</div>
              <div>
                <h4 className="text-white font-medium">{currentAgent.name}</h4>
                <p className="text-gray-400 text-sm">
                  {governanceEnabled ? 'Governed Response' : 'Ungoverned Response'}
                </p>
              </div>
              <div className={`ml-auto px-3 py-1 rounded-full text-xs font-medium ${
                governanceEnabled 
                  ? 'bg-green-900 text-green-300 border border-green-700'
                  : 'bg-red-900 text-red-300 border border-red-700'
              }`}>
                {governanceEnabled ? 'GOVERNED' : 'UNGOVERNED'}
              </div>
            </div>
            
            <div className="bg-gray-700 rounded-lg p-4 mb-4">
              <pre className="text-gray-200 text-sm whitespace-pre-wrap font-mono">
                {governanceEnabled ? scenario.governed : scenario.ungoverned}
              </pre>
            </div>

            {governanceEnabled && (
              <div className="bg-blue-900/30 border border-blue-700 rounded-lg p-3">
                <div className="flex items-center mb-2">
                  <span className="text-blue-400 text-sm font-medium">🛡️ Governance Impact</span>
                </div>
                <p className="text-blue-200 text-sm">{scenario.explanation}</p>
              </div>
            )}
          </div>

          {/* Comparison (when toggled) */}
          {showComparison && (
            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
              <div className="flex items-center mb-4">
                <div className="text-2xl mr-3">{currentAgent.avatar}</div>
                <div>
                  <h4 className="text-white font-medium">{currentAgent.name}</h4>
                  <p className="text-gray-400 text-sm">
                    {!governanceEnabled ? 'Governed Response' : 'Ungoverned Response'}
                  </p>
                </div>
                <div className={`ml-auto px-3 py-1 rounded-full text-xs font-medium ${
                  !governanceEnabled 
                    ? 'bg-green-900 text-green-300 border border-green-700'
                    : 'bg-red-900 text-red-300 border border-red-700'
                }`}>
                  {!governanceEnabled ? 'GOVERNED' : 'UNGOVERNED'}
                </div>
              </div>
              
              <div className="bg-gray-700 rounded-lg p-4">
                <pre className="text-gray-200 text-sm whitespace-pre-wrap font-mono">
                  {!governanceEnabled ? scenario.governed : scenario.ungoverned}
                </pre>
              </div>
            </div>
          )}
        </div>

        {/* Continue Button */}
        <div className="text-center">
          <button
            onClick={continueToNextStep}
            className="px-8 py-3 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 text-white font-semibold rounded-lg shadow-lg transition-all duration-300 transform hover:scale-105"
          >
            Ready to Create Your First Agent
          </button>
          <p className="text-gray-400 text-sm mt-2">
            Step 2 of 4 • Interactive Demo
          </p>
        </div>
      </div>
    </div>
  );
};

export default OnboardingDemo;

