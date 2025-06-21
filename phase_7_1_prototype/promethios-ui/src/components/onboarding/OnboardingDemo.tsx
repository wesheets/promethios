import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const OnboardingDemo: React.FC = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  const steps = [
    {
      title: "The Problem: AI Hallucinations",
      subtitle: "See how ungovemed AI can create false information"
    },
    {
      title: "The Solution: Promethios Governance", 
      subtitle: "Watch how our system prevents hallucinations in real-time"
    },
    {
      title: "Your AI, Governed",
      subtitle: "Ready to implement trustworthy AI governance?"
    }
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentStep(currentStep + 1);
        setIsAnimating(false);
      }, 300);
    } else {
      navigate('/ui/onboarding/setup');
    }
  };

  const handleSkip = () => {
    navigate('/ui/dashboard');
  };

  const handleBack = () => {
    navigate('/ui/onboarding');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Progress Bar */}
      <div className="w-full bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-white font-medium">{steps[currentStep].title}</span>
            <span className="text-gray-400 text-sm">{currentStep + 1} of {steps.length}</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-green-400 to-blue-500 h-2 rounded-full transition-all duration-500"
              style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
            />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">{steps[currentStep].title}</h1>
          <p className="text-xl text-gray-300">{steps[currentStep].subtitle}</p>
        </div>

        {/* Step Content */}
        <div className={`transition-opacity duration-300 ${isAnimating ? 'opacity-0' : 'opacity-100'}`}>
          {currentStep === 0 && <ProblemDemo />}
          {currentStep === 1 && <SolutionDemo />}
          {currentStep === 2 && <ReadyDemo />}
        </div>

        {/* Navigation */}
        <div className="flex justify-between items-center mt-12">
          <button
            onClick={handleBack}
            className="flex items-center text-gray-400 hover:text-gray-200 font-medium"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>

          <button
            onClick={handleSkip}
            className="text-gray-400 hover:text-gray-200 font-medium"
          >
            Skip to dashboard
          </button>

          <button
            onClick={handleNext}
            className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-green-500 to-blue-600 text-white font-semibold rounded-lg hover:from-green-600 hover:to-blue-700 transition-all duration-200"
          >
            {currentStep === steps.length - 1 ? 'Get Started' : 'Continue'}
            <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

// Problem Demo Component
const ProblemDemo: React.FC = () => {
  const [showResponse, setShowResponse] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShowResponse(true), 1000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Left Side - Ungovemed AI */}
      <div className="bg-gray-800 rounded-xl border border-red-500/30 overflow-hidden">
        <div className="bg-red-900/20 px-6 py-4 border-b border-red-500/30">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-red-500 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.268 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <div>
              <h3 className="text-white font-semibold">Ungovemed AI System</h3>
              <p className="text-red-300 text-sm">No governance or fact-checking</p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-4">
          <div className="bg-gray-700 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                U
              </div>
              <div className="flex-1">
                <p className="text-white">Tell me about the landmark case Miller v. DowTech (2023) regarding AI liability.</p>
              </div>
            </div>
          </div>

          {showResponse && (
            <div className="bg-gray-700 rounded-lg p-4 animate-fade-in">
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="text-white mb-3">
                    In the fictional case Miller v. DowTech (2023), AI-assisted legal software misrepresented case law, 
                    resulting in a $12M malpractice lawsuit. The court found that DowTech's AI system fabricated 
                    precedents that led to catastrophic legal advice. Miller's law firm lost their largest client 
                    and faced regulatory sanctions after relying on the AI's false citations.
                  </p>
                  <div className="bg-red-900/30 border border-red-500 rounded-lg p-3">
                    <div className="flex items-center space-x-2">
                      <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.268 16.5c-.77.833.192 2.5 1.732 2.5z" />
                      </svg>
                      <span className="text-red-400 text-sm font-medium">⚠️ HALLUCINATION DETECTED</span>
                    </div>
                    <p className="text-red-300 text-sm mt-1">This case does not exist. The AI fabricated this entire legal precedent.</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right Side - Impact */}
      <div className="space-y-6">
        {/* Real-World Impact Stats - Moved up for better flow */}
        <div className="bg-gradient-to-r from-red-900/20 to-orange-900/20 border border-red-500/30 rounded-xl p-6">
          <h4 className="text-white font-semibold mb-2 flex items-center">
            <svg className="w-5 h-5 text-orange-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 00-2-2z" />
            </svg>
            Real-World Impact
          </h4>
          <p className="text-gray-300 text-sm">
            <strong className="text-orange-300">15-20% of AI responses</strong> contain factual errors or hallucinations. 
            In critical domains like legal, medical, or financial advice, even a single hallucination 
            can have severe consequences.
          </p>
        </div>

        {/* Personal Engagement Question */}
        <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
          <h4 className="text-white font-semibold mb-4">❓ Quick Check</h4>
          <p className="text-gray-300 mb-4">Have you ever caught an AI making something up?</p>
          <div className="space-y-2">
            <button className="w-full text-left p-3 bg-gray-700 hover:bg-gray-600 rounded-lg text-white transition-colors">
              ✅ Yes - I've seen AI hallucinations before
            </button>
            <button className="w-full text-left p-3 bg-gray-700 hover:bg-gray-600 rounded-lg text-white transition-colors">
              ❌ No - This is new to me
            </button>
            <button className="w-full text-left p-3 bg-gray-700 hover:bg-gray-600 rounded-lg text-white transition-colors">
              🤔 Not sure - I might have missed them
            </button>
          </div>
        </div>

        {/* Risk Categories */}
        <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
          <h3 className="text-white font-semibold mb-4 flex items-center">
            <svg className="w-5 h-5 text-red-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.268 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            The Consequences
          </h3>
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-red-400 rounded-full mt-2"></div>
              <div>
                <p className="text-white font-medium">Legal Misinformation</p>
                <p className="text-gray-400 text-sm">Fabricated court cases can mislead legal professionals</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-red-400 rounded-full mt-2"></div>
              <div>
                <p className="text-white font-medium">Financial Risk</p>
                <p className="text-gray-400 text-sm">False information can lead to poor investment decisions</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-red-400 rounded-full mt-2"></div>
              <div>
                <p className="text-white font-medium">Reputation Damage</p>
                <p className="text-gray-400 text-sm">Organizations lose trust when AI provides false information</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Solution Demo Component  
const SolutionDemo: React.FC = () => {
  const [showResponse, setShowResponse] = useState(false);
  const [showVeritas, setShowVeritas] = useState(false);

  useEffect(() => {
    const timer1 = setTimeout(() => setShowVeritas(true), 1000);
    const timer2 = setTimeout(() => setShowResponse(true), 2500);
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, []);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Left Side - Promethios-Governed AI */}
      <div className="bg-gray-800 rounded-xl border border-green-500/30 overflow-hidden">
        <div className="bg-green-900/20 px-6 py-4 border-b border-green-500/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <div>
                <h3 className="text-white font-semibold">Promethios-Governed AI</h3>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <p className="text-green-300 text-sm">🛡️ Governance Mode: Active</p>
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-green-300 text-xs">Real-time validation, fact-checking,</div>
              <div className="text-green-300 text-xs">and audit logging enabled</div>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-4">
          <div className="bg-gray-700 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                U
              </div>
              <div className="flex-1">
                <p className="text-white">Tell me about the landmark case Johnson v. Smith (2023) regarding AI liability.</p>
              </div>
            </div>
          </div>

          {showVeritas && (
            <div className="bg-purple-900/20 border border-purple-500 rounded-lg p-3 animate-fade-in">
              <div className="flex items-center space-x-2 mb-2">
                <div className="w-4 h-4 bg-purple-500 rounded-full animate-pulse"></div>
                <span className="text-purple-300 text-sm font-medium">Veritas Fact-Checking</span>
              </div>
              <p className="text-purple-200 text-sm">Searching legal databases for "Johnson v. Smith (2023)"...</p>
              <p className="text-purple-200 text-sm mt-1">⚠️ No matching case found in verified legal records</p>
            </div>
          )}

          {showResponse && (
            <div className="bg-gray-700 rounded-lg p-4 animate-fade-in">
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="text-white mb-3">
                    I cannot find any verified information about "Johnson v. Smith (2023)" in legal databases. 
                    This case does not appear to exist in court records.
                  </p>
                  <p className="text-white mb-3">
                    However, I can provide information about actual AI liability cases or discuss the current 
                    legal framework around AI responsibility. Would you like me to search for real cases 
                    involving AI liability instead?
                  </p>
                  <div className="bg-green-900/30 border border-green-500 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-green-400 text-sm font-bold">✅ REAL-TIME BLOCKED</span>
                      </div>
                      <div className="bg-green-800 px-2 py-1 rounded text-green-300 text-xs font-mono">
                        Intercepted in 1.2s
                      </div>
                    </div>
                    <p className="text-green-300 text-sm">Veritas stopped false information before it was sent.</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right Side - How It Works */}
      <div className="space-y-6">
        <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
          <h3 className="text-white font-semibold mb-4 flex items-center">
            <svg className="w-5 h-5 text-green-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            How Promethios Works
          </h3>
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-green-900 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </div>
              <div>
                <p className="text-white font-medium">Vigil Monitoring</p>
                <p className="text-gray-400 text-sm">Continuously watches AI behavior for anomalies</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-purple-900 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-white font-medium">Veritas Fact-Checking</p>
                <p className="text-gray-400 text-sm">Validates information against trusted sources</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-blue-900 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-white font-medium">PRISM Transparency</p>
                <p className="text-gray-400 text-sm">Explains AI reasoning and decision-making</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-green-900/20 to-blue-900/20 border border-green-500/30 rounded-xl p-6">
          <h4 className="text-white font-semibold mb-2">Real-Time Protection</h4>
          <p className="text-gray-300 text-sm">
            Promethios operates in real-time, intercepting and validating AI responses before they reach users. 
            This prevents hallucinations, ensures compliance, and maintains trust in your AI systems.
          </p>
        </div>
      </div>
    </div>
  );
};

// Ready Demo Component
const ReadyDemo: React.FC = () => {
  const [showAnimation, setShowAnimation] = useState(false);
  const [isConfigured, setIsConfigured] = useState(false); // This would come from user state in real app

  const handleGetStarted = () => {
    setShowAnimation(true);
    // After animation, navigate to setup
    setTimeout(() => {
      // navigate('/ui/onboarding/setup');
    }, 2000);
  };

  return (
    <div className="text-center space-y-8 relative">
      {/* Shield Animation Overlay */}
      {showAnimation && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-gradient-to-r from-green-500 to-blue-600 rounded-2xl p-8 text-white animate-scale-in">
            <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
              <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold mb-2">🛡️ AI Protection Activated</h3>
            <p className="text-lg opacity-90">Your AI is now under Promethios governance</p>
          </div>
        </div>
      )}

      <div className="max-w-4xl mx-auto">
        <div className="bg-gradient-to-r from-green-500 to-blue-600 rounded-2xl p-8 text-white">
          <h2 className="text-3xl font-bold mb-4">Your AI is Ready to be Governed</h2>
          <p className="text-xl mb-6">
            You've seen how Promethios prevents hallucinations and ensures trustworthy AI. 
            Now let's set up governance for your specific use case.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
            {/* Quick Setup */}
            <div className="bg-white/10 rounded-lg p-4 relative">
              {/* Status Badge */}
              <div className="absolute -top-2 -right-2">
                {isConfigured ? (
                  <div className="bg-green-500 text-white text-xs px-2 py-1 rounded-full flex items-center space-x-1">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Enabled</span>
                  </div>
                ) : (
                  <div className="bg-orange-500 text-white text-xs px-2 py-1 rounded-full flex items-center space-x-1">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span>Not Yet Configured</span>
                  </div>
                )}
              </div>
              
              <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="font-semibold mb-2">Quick Setup</h3>
              <p className="text-sm opacity-90">Configure governance in minutes</p>
            </div>
            
            {/* Immediate Protection */}
            <div className="bg-white/10 rounded-lg p-4 relative">
              {/* Status Badge */}
              <div className="absolute -top-2 -right-2">
                <div className="bg-green-500 text-white text-xs px-2 py-1 rounded-full flex items-center space-x-1">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Enabled</span>
                </div>
              </div>
              
              <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="font-semibold mb-2">Immediate Protection</h3>
              <p className="text-sm opacity-90">Start preventing hallucinations right away</p>
            </div>
            
            {/* Observer Agent */}
            <div className="bg-white/10 rounded-lg p-4 relative">
              {/* Status Badge */}
              <div className="absolute -top-2 -right-2">
                <div className="bg-green-500 text-white text-xs px-2 py-1 rounded-full flex items-center space-x-1">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Ready</span>
                </div>
              </div>
              
              <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h3 className="font-semibold mb-2">Observer Agent</h3>
              <p className="text-sm opacity-90">Your AI governance assistant is ready</p>
            </div>
          </div>

          {/* Enhanced Get Started Button */}
          <div className="mt-8">
            <button
              onClick={handleGetStarted}
              className="inline-flex items-center px-8 py-4 bg-white text-gray-900 font-bold rounded-lg hover:bg-gray-100 transition-all duration-200 transform hover:scale-105"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              Get Started - Activate Protection
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OnboardingDemo;

