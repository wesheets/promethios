import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * Enhanced Onboarding Welcome - Step 1: Why AI Governance Matters
 * 
 * This component introduces users to AI governance concepts in a gentle, 
 * educational way without overwhelming them with technical details.
 */
const OnboardingWelcome: React.FC = () => {
  const navigate = useNavigate();
  const [currentSlide, setCurrentSlide] = useState(0);

  const slides = [
    {
      title: "AI is Everywhere",
      subtitle: "But is it trustworthy?",
      content: "AI systems are making decisions that affect our daily lives - from hiring to healthcare to finance.",
      visual: "🤖",
      examples: [
        "Hiring algorithms screening resumes",
        "Medical AI diagnosing patients", 
        "Financial AI approving loans",
        "Customer service chatbots"
      ]
    },
    {
      title: "When AI Goes Wrong",
      subtitle: "Real consequences, real problems",
      content: "Without proper oversight, AI can make biased, harmful, or unpredictable decisions.",
      visual: "⚠️",
      examples: [
        "Biased hiring against qualified candidates",
        "Medical misdiagnosis due to flawed data",
        "Unfair loan rejections",
        "Inappropriate customer responses"
      ]
    },
    {
      title: "AI Governance Changes Everything",
      subtitle: "Trust, transparency, accountability",
      content: "Governance ensures AI systems operate safely, fairly, and in alignment with your values.",
      visual: "🛡️",
      examples: [
        "Fair and unbiased decision-making",
        "Transparent reasoning and explanations",
        "Consistent ethical behavior",
        "Audit trails for accountability"
      ]
    },
    {
      title: "See the Difference",
      subtitle: "Experience governed AI in action",
      content: "Ready to see how governance transforms AI behavior? Let's start with a simple demonstration.",
      visual: "✨",
      examples: [
        "Compare governed vs ungoverned responses",
        "See real-time trust scores",
        "Watch ethical decision-making",
        "Experience transparent AI"
      ]
    }
  ];

  const nextSlide = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    } else {
      // Navigate to the interactive demo
      navigate('/ui/onboarding/demo');
    }
  };

  const prevSlide = () => {
    if (currentSlide > 0) {
      setCurrentSlide(currentSlide - 1);
    }
  };

  const skipToDemo = () => {
    navigate('/ui/onboarding/demo');
  };

  const slide = slides[currentSlide];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        {/* Progress indicator */}
        <div className="flex justify-center mb-8">
          <div className="flex space-x-2">
            {slides.map((_, index) => (
              <div
                key={index}
                className={`w-3 h-3 rounded-full transition-all duration-300 ${
                  index === currentSlide 
                    ? 'bg-blue-400 w-8' 
                    : index < currentSlide 
                      ? 'bg-blue-600' 
                      : 'bg-gray-600'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Main content card */}
        <div className="bg-gray-800 rounded-2xl shadow-2xl p-8 border border-gray-700 relative overflow-hidden">
          {/* Background decoration */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500 opacity-10 rounded-full -translate-y-16 translate-x-16"></div>
          
          {/* Content */}
          <div className="relative z-10">
            {currentSlide === 0 && (
              <div className="text-center">
                {/* Video placeholder */}
                <div className="mb-8">
                  <div className="bg-gray-900 rounded-xl p-8 border-2 border-dashed border-gray-600 max-w-md mx-auto">
                    <div className="text-4xl mb-4">🎥</div>
                    <h3 className="text-white font-medium mb-2">30-Second Explainer Video</h3>
                    <p className="text-gray-400 text-sm">
                      Coming soon: A powerful introduction to why AI governance matters
                    </p>
                  </div>
                </div>
                
                <h1 className="text-3xl font-bold text-white mb-2">
                  {slide.title}
                </h1>
                <p className="text-xl text-blue-400 font-medium">
                  {slide.subtitle}
                </p>
              </div>
            )}

            {currentSlide > 0 && (
              <div className="text-center">
                {/* Visual icon */}
                <div className="text-6xl mb-4">{slide.visual}</div>
                <h1 className="text-3xl font-bold text-white mb-2">
                  {slide.title}
                </h1>
                <p className="text-xl text-blue-400 font-medium">
                  {slide.subtitle}
                </p>
              </div>
            )}

            {/* Main content */}
            <div className="text-center mb-8">
              <p className="text-lg text-gray-300 leading-relaxed max-w-2xl mx-auto">
                {slide.content}
              </p>
            </div>

            {/* Examples grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              {slide.examples.map((example, index) => (
                <div 
                  key={index}
                  className="bg-gray-700 rounded-lg p-4 border border-gray-600 hover:border-blue-500 transition-colors"
                >
                  <div className="flex items-center">
                    <div className={`w-2 h-2 rounded-full mr-3 ${
                      currentSlide === 1 ? 'bg-red-400' : 
                      currentSlide === 2 ? 'bg-green-400' : 'bg-blue-400'
                    }`}></div>
                    <span className="text-gray-200 text-sm">{example}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Navigation */}
            <div className="flex justify-between items-center">
              <button
                onClick={prevSlide}
                disabled={currentSlide === 0}
                className={`px-6 py-2 rounded-lg font-medium transition-all ${
                  currentSlide === 0
                    ? 'text-gray-500 cursor-not-allowed'
                    : 'text-gray-300 hover:text-white hover:bg-gray-700'
                }`}
              >
                Previous
              </button>

              <div className="flex space-x-4">
                <button
                  onClick={skipToDemo}
                  className="px-6 py-2 text-gray-400 hover:text-gray-200 font-medium transition-colors"
                >
                  Skip to Demo
                </button>
                
                <button
                  onClick={nextSlide}
                  className="px-8 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white font-semibold rounded-lg shadow-lg transition-all duration-300 transform hover:scale-105"
                >
                  {currentSlide === slides.length - 1 ? 'See It In Action' : 'Continue'}
                </button>
              </div>
            </div>

            {/* Experience level selector - only show on first slide */}
            {currentSlide === 0 && (
              <div className="mt-8 p-6 bg-gray-700 rounded-xl border border-gray-600">
                <h3 className="text-white font-semibold mb-4 text-center">Choose Your Experience Level:</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <button
                    onClick={() => {
                      localStorage.setItem('promethios_experience_level', 'beginner');
                      // Continue with full onboarding
                    }}
                    className="p-4 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm transition-colors text-center"
                  >
                    <div className="text-2xl mb-2">🌱</div>
                    <div className="font-semibold">Beginner</div>
                    <div className="text-green-100 text-xs mt-1">Full guided experience with tips</div>
                  </button>
                  <button
                    onClick={() => {
                      localStorage.setItem('promethios_experience_level', 'intermediate');
                      window.location.href = '/ui/agents';
                    }}
                    className="p-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition-colors text-center"
                  >
                    <div className="text-2xl mb-2">⚡</div>
                    <div className="font-semibold">Intermediate</div>
                    <div className="text-blue-100 text-xs mt-1">Skip to agent creation</div>
                  </button>
                  <button
                    onClick={() => {
                      localStorage.setItem('promethios_experience_level', 'expert');
                      localStorage.setItem('promethios_minimal_mode', 'true');
                      window.location.href = '/ui/dashboard';
                    }}
                    className="p-4 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm transition-colors text-center"
                  >
                    <div className="text-2xl mb-2">🚀</div>
                    <div className="font-semibold">Expert</div>
                    <div className="text-purple-100 text-xs mt-1">Minimal interface, no guidance</div>
                  </button>
                </div>
                <div className="mt-4 text-center">
                  <p className="text-gray-400 text-xs">You can change this later in settings</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Bottom info */}
        <div className="text-center mt-6">
          <p className="text-gray-400 text-sm">
            Step 1 of 4 • Understanding AI Governance
          </p>
        </div>
      </div>
    </div>
  );
};

export default OnboardingWelcome;
