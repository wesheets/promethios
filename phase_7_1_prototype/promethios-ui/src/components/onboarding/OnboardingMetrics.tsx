import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const OnboardingMetrics: React.FC = () => {
  const navigate = useNavigate();
  const [currentMetric, setCurrentMetric] = useState(0);

  const metrics = [
    {
      name: 'Trust Score',
      value: 85,
      description: 'Overall AI system trustworthiness',
      color: 'from-green-500 to-green-600',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      )
    },
    {
      name: 'Competence',
      value: 92,
      description: 'AI accuracy and capability assessment',
      color: 'from-blue-500 to-blue-600',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
      )
    },
    {
      name: 'Reliability',
      value: 88,
      description: 'Consistency and dependability metrics',
      color: 'from-purple-500 to-purple-600',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },
    {
      name: 'Transparency',
      value: 79,
      description: 'Explainability and interpretability',
      color: 'from-orange-500 to-orange-600',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentMetric((prev) => (prev + 1) % metrics.length);
    }, 2000);
    return () => clearInterval(interval);
  }, [metrics.length]);

  const handleContinue = () => {
    navigate('/ui/dashboard');
  };

  const handleBack = () => {
    navigate('/ui/onboarding');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <div className="max-w-6xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center space-x-3 mb-6">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 00-2-2z" />
              </svg>
            </div>
            <span className="text-lg font-semibold text-white">PROMETHIOS</span>
          </div>
          <h1 className="text-4xl font-bold text-white mb-4">
            Understanding Trust Metrics
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Promethios measures AI trustworthiness across four key dimensions. 
            Each metric provides insights into different aspects of your AI system's reliability.
          </p>
        </div>

        {/* Interactive Metrics Display */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-16">
          {/* Left Side - Metric Cards */}
          <div className="space-y-4">
            {metrics.map((metric, index) => (
              <div
                key={metric.name}
                className={`p-6 rounded-xl border transition-all duration-300 cursor-pointer ${
                  currentMetric === index
                    ? 'bg-gray-700 border-blue-500 shadow-lg scale-105'
                    : 'bg-gray-800 border-gray-700 hover:border-gray-600'
                }`}
                onClick={() => setCurrentMetric(index)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className={`w-12 h-12 bg-gradient-to-r ${metric.color} rounded-lg flex items-center justify-center text-white`}>
                      {metric.icon}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white">{metric.name}</h3>
                      <p className="text-gray-400 text-sm">{metric.description}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-white">{metric.value}</div>
                    <div className="text-sm text-gray-400">/ 100</div>
                  </div>
                </div>
                
                {/* Progress Bar */}
                <div className="mt-4 w-full bg-gray-600 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full bg-gradient-to-r ${metric.color} transition-all duration-500`}
                    style={{ width: `${metric.value}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Right Side - Detailed View */}
          <div className="bg-gray-800 rounded-xl border border-gray-700 p-8">
            <div className="text-center mb-6">
              <div className={`w-20 h-20 bg-gradient-to-r ${metrics[currentMetric].color} rounded-full flex items-center justify-center text-white mx-auto mb-4`}>
                {metrics[currentMetric].icon}
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">{metrics[currentMetric].name}</h2>
              <p className="text-gray-400">{metrics[currentMetric].description}</p>
            </div>

            {/* Score Display */}
            <div className="text-center mb-8">
              <div className="text-6xl font-bold text-white mb-2">{metrics[currentMetric].value}</div>
              <div className="text-gray-400">out of 100</div>
            </div>

            {/* Insights */}
            <div className="space-y-4">
              <div className="bg-gray-700 rounded-lg p-4">
                <h4 className="text-white font-semibold mb-2">What this means:</h4>
                <p className="text-gray-300 text-sm">
                  {currentMetric === 0 && "Your overall trust score of 85 indicates strong AI governance with room for improvement in transparency."}
                  {currentMetric === 1 && "A competence score of 92 shows your AI system performs tasks accurately and reliably."}
                  {currentMetric === 2 && "Reliability at 88 means your AI consistently produces dependable results across different scenarios."}
                  {currentMetric === 3 && "Transparency at 79 suggests your AI explanations could be clearer and more interpretable."}
                </p>
              </div>
              
              <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
                <h4 className="text-blue-300 font-semibold mb-2">Improvement Tip:</h4>
                <p className="text-blue-200 text-sm">
                  {currentMetric === 0 && "Focus on improving transparency to boost your overall trust score."}
                  {currentMetric === 1 && "Maintain high competence by regularly updating training data and monitoring performance."}
                  {currentMetric === 2 && "Enhance reliability through consistent testing and validation procedures."}
                  {currentMetric === 3 && "Improve transparency by enabling detailed reasoning explanations and audit trails."}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Dashboard Preview */}
        <div className="bg-gray-800 rounded-xl border border-gray-700 p-8 mb-12">
          <h2 className="text-2xl font-bold text-white mb-6 text-center">
            This is what you'll see in your dashboard
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            {metrics.map((metric, index) => (
              <div key={metric.name} className="bg-gray-700 rounded-lg p-4 text-center">
                <div className={`w-8 h-8 bg-gradient-to-r ${metric.color} rounded-lg flex items-center justify-center text-white mx-auto mb-2`}>
                  {metric.icon}
                </div>
                <div className="text-lg font-bold text-white">{metric.value}</div>
                <div className="text-sm text-gray-400">{metric.name}</div>
              </div>
            ))}
          </div>
          <div className="text-center">
            <p className="text-gray-300 mb-4">
              Plus real-time monitoring, violation alerts, compliance reports, and much more.
            </p>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex justify-between items-center">
          <button
            onClick={handleBack}
            className="flex items-center space-x-2 px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span>Back to Options</span>
          </button>

          <button
            onClick={handleContinue}
            className="flex items-center space-x-2 px-8 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-lg transition-all transform hover:scale-105"
          >
            <span>Explore Full Dashboard</span>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default OnboardingMetrics;

