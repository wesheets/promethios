import React from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../../firebase/config';
import { updateOnboardingStatus } from '../../firebase/userService';

const OnboardingWelcome: React.FC = () => {
  const navigate = useNavigate();

  const handlePathSelect = (path: string) => {
    // Navigate to the selected onboarding path
    navigate(`/ui/onboarding/${path}`, { replace: true });
  };

  const handleSkip = () => {
    // Mark onboarding as completed when skipping
    if (auth.currentUser) {
      const cacheKey = `onboarding_${auth.currentUser.uid}`;
      localStorage.setItem(cacheKey, 'true');
      updateOnboardingStatus(auth.currentUser.uid, true).catch(console.error);
    }
    
    // Navigate directly to dashboard
    navigate('/ui/dashboard', { replace: true });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle at 25% 25%, #22c55e 0%, transparent 50%), 
                             radial-gradient(circle at 75% 75%, #3b82f6 0%, transparent 50%)`,
          }} />
        </div>
        
        {/* Content */}
        <div className="relative max-w-7xl mx-auto px-6 py-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left Side - Hero Content */}
            <div className="space-y-8">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-green-400 to-blue-500 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <span className="text-lg font-semibold text-white">PROMETHIOS</span>
              </div>
              
              <div className="space-y-6">
                <h1 className="text-5xl lg:text-6xl font-bold text-white leading-tight">
                  Govern, Monitor,
                  <br />
                  and <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-blue-500">Trust</span> your AI
                </h1>
                
                <p className="text-2xl text-white font-semibold mb-4">
                  Promethios makes AI safe for production.
                </p>
                
                <p className="text-xl text-gray-300 leading-relaxed">
                  Prevents AI hallucinations, ensures compliance, and builds trust through 
                  real-time governance. Framework agnostic and enterprise-ready.
                </p>
              </div>

              {/* Key Benefits */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-center space-x-3 p-4 bg-gray-800/50 rounded-lg border border-gray-700">
                  <div className="w-8 h-8 bg-green-900 rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-white font-medium">Framework agnostic</span>
                </div>
                
                <div className="flex items-center space-x-3 p-4 bg-gray-800/50 rounded-lg border border-gray-700">
                  <div className="w-8 h-8 bg-blue-900 rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <span className="text-white font-medium">Prevents hallucinations</span>
                </div>
              </div>

              <button
                onClick={() => handlePathSelect('demo')}
                className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-green-500 to-blue-600 text-white font-semibold rounded-lg hover:from-green-600 hover:to-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                See how it works
                <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </button>
            </div>

            {/* Right Side - Visual Demo Preview */}
            <div className="relative">
              <div className="bg-gray-800 rounded-xl shadow-2xl border border-gray-700 overflow-hidden">
                <div className="bg-gray-700 px-4 py-3 flex items-center space-x-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-gray-300 text-sm ml-4">AI Governance Dashboard</span>
                </div>
                
                <div className="p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-white font-medium">Trust Score</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-16 h-2 bg-gray-600 rounded-full overflow-hidden">
                        <div className="w-4/5 h-full bg-gradient-to-r from-green-400 to-green-500"></div>
                      </div>
                      <span className="text-green-400 font-semibold">85%</span>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                      <span className="text-gray-300 text-sm">Vigil: Monitoring active</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                      <span className="text-gray-300 text-sm">PRISM: Transparency enabled</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
                      <span className="text-gray-300 text-sm">Veritas: Fact-checking active</span>
                    </div>
                  </div>
                  
                  <div className="mt-4 p-3 bg-green-900/30 border border-green-700 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-green-400 text-sm font-medium">Hallucination prevented</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* How would you like to start? Section */}
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-white mb-4">How would you like to start?</h2>
          <p className="text-lg text-gray-300">Select a path to begin exploring Promethios capabilities</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* See Governance in Action */}
          <div 
            onClick={() => handlePathSelect('demo')}
            className="group bg-gray-800 border border-gray-700 rounded-xl p-6 hover:border-green-500 hover:shadow-lg transition-all duration-200 cursor-pointer relative"
          >
            {/* Recommended Badge */}
            <div className="absolute -top-3 left-4 bg-gradient-to-r from-green-500 to-green-600 text-white text-xs font-semibold px-3 py-1 rounded-full">
              ✅ Recommended First Step
            </div>
            
            <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-green-600 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-green-400 transition-colors">
              See Governance in Action
            </h3>
            <p className="text-gray-400 text-sm mb-3">
              <strong className="text-gray-300">Live demo:</strong> Watch governance prevent hallucinations in real time.
            </p>
            <div className="mt-4 flex items-center text-green-400 text-sm font-medium">
              Start demo
              <svg className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </div>
          </div>

          {/* Explore Trust Metrics */}
          <div 
            onClick={() => handlePathSelect('metrics')}
            className="group bg-gray-800 border border-gray-700 rounded-xl p-6 hover:border-blue-500 hover:shadow-lg transition-all duration-200 cursor-pointer"
          >
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 00-2-2z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-blue-400 transition-colors">
              Explore Trust Metrics
            </h3>
            <p className="text-gray-400 text-sm mb-3">
              <strong className="text-gray-300">Understand the math</strong> behind AI integrity and trust scoring.
            </p>
            <div className="mt-4 flex items-center text-blue-400 text-sm font-medium">
              View dashboard
              <svg className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </div>
          </div>

          {/* Meet Your Observer Agent */}
          <div 
            onClick={() => handlePathSelect('observer')}
            className="group bg-gray-800 border border-gray-700 rounded-xl p-6 hover:border-purple-500 hover:shadow-lg transition-all duration-200 cursor-pointer"
          >
            <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-purple-400 transition-colors">
              Meet Your Observer Agent
            </h3>
            <p className="text-gray-400 text-sm mb-3">
              <strong className="text-gray-300">Chat with the built-in AI guardian</strong> watching over your models.
            </p>
            <div className="mt-4 flex items-center text-purple-400 text-sm font-medium">
              Start chat
              <svg className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </div>
          </div>

          {/* Quick Setup */}
          <div 
            onClick={() => handlePathSelect('setup')}
            className="group bg-gray-800 border border-gray-700 rounded-xl p-6 hover:border-orange-500 hover:shadow-lg transition-all duration-200 cursor-pointer"
          >
            <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-orange-400 transition-colors">
              Quick Setup
            </h3>
            <p className="text-gray-400 text-sm mb-3">
              <strong className="text-gray-300">Fast path to wrapping</strong> your first agent with compliance controls.
            </p>
            <div className="mt-4 flex items-center text-orange-400 text-sm font-medium">
              Configure now
              <svg className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </div>
          </div>
        </div>

        {/* Skip Option */}
        <div className="text-center mt-12">
          <button
            onClick={handleSkip}
            className="text-gray-400 hover:text-gray-200 font-medium underline"
          >
            Skip onboarding and go to dashboard
          </button>
        </div>
      </div>
    </div>
  );
};

export default OnboardingWelcome;

