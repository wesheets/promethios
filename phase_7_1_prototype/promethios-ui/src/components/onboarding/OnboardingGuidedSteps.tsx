import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

interface LocationState {
  selectedWorkflow?: string;
  selectedGoal?: string;
}

interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

const OnboardingGuidedSteps: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as LocationState;
  
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [score, setScore] = useState(0);

  const quizQuestions: QuizQuestion[] = [
    {
      id: 'governance-basics',
      question: 'What is the primary purpose of AI governance?',
      options: [
        'To slow down AI development',
        'To ensure AI systems are safe, ethical, and aligned with human values',
        'To make AI systems more complex',
        'To reduce AI performance'
      ],
      correctAnswer: 1,
      explanation: 'AI governance ensures that AI systems operate safely, ethically, and in alignment with human values and societal needs.'
    },
    {
      id: 'vigil-component',
      question: 'What does the Vigil component in Promethios do?',
      options: [
        'Stores data permanently',
        'Monitors and detects potential issues in AI behavior',
        'Generates AI responses',
        'Manages user authentication'
      ],
      correctAnswer: 1,
      explanation: 'Vigil acts as a monitoring system that continuously watches AI behavior to detect potential issues, anomalies, or policy violations.'
    },
    {
      id: 'prism-component',
      question: 'How does Prism contribute to AI transparency?',
      options: [
        'By hiding AI decision processes',
        'By making AI decisions faster',
        'By providing explainable insights into AI decision-making',
        'By reducing AI accuracy'
      ],
      correctAnswer: 2,
      explanation: 'Prism enhances transparency by providing clear, explainable insights into how AI systems make decisions, making them more accountable.'
    }
  ];

  const handleAnswerSelect = (answerIndex: number) => {
    setSelectedAnswer(answerIndex);
  };

  const handleSubmitAnswer = () => {
    if (selectedAnswer !== null) {
      setShowExplanation(true);
      if (selectedAnswer === quizQuestions[currentStep].correctAnswer) {
        setScore(score + 1);
      }
    }
  };

  const handleNextStep = () => {
    if (currentStep < quizQuestions.length - 1) {
      setCurrentStep(currentStep + 1);
      setSelectedAnswer(null);
      setShowExplanation(false);
    } else {
      // Quiz completed, navigate to agent wizard
      navigate('/ui/agent-wizard', { 
        state: { 
          selectedWorkflow: state?.selectedWorkflow,
          selectedGoal: state?.selectedGoal,
          quizScore: score + (selectedAnswer === quizQuestions[currentStep].correctAnswer ? 1 : 0)
        },
        replace: true 
      });
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      setSelectedAnswer(null);
      setShowExplanation(false);
    } else {
      navigate('/ui/onboarding/goal-selection', { 
        state: { selectedWorkflow: state?.selectedWorkflow },
        replace: true 
      });
    }
  };

  const handleSkip = () => {
    navigate('/ui/agent-wizard', { 
      state: { 
        selectedWorkflow: state?.selectedWorkflow,
        selectedGoal: state?.selectedGoal,
        skipped: true
      },
      replace: true 
    });
  };

  const currentQuestion = quizQuestions[currentStep];
  const isCorrect = selectedAnswer === currentQuestion.correctAnswer;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full bg-white rounded-xl shadow-lg p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Understanding AI Governance
          </h1>
          <p className="text-lg text-gray-600">
            Learn key concepts through interactive questions
          </p>
          <div className="mt-4 flex justify-center">
            <div className="flex space-x-2">
              {quizQuestions.map((_, index) => (
                <div
                  key={index}
                  className={`w-3 h-3 rounded-full ${
                    index === currentStep
                      ? 'bg-blue-600'
                      : index < currentStep
                      ? 'bg-green-500'
                      : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Question Card */}
        <div className="bg-gray-50 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Question {currentStep + 1} of {quizQuestions.length}
          </h2>
          <p className="text-lg text-gray-700 mb-6">
            {currentQuestion.question}
          </p>

          {/* Answer Options */}
          <div className="space-y-3 mb-6">
            {currentQuestion.options.map((option, index) => (
              <button
                key={index}
                onClick={() => handleAnswerSelect(index)}
                disabled={showExplanation}
                className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                  selectedAnswer === index
                    ? showExplanation
                      ? index === currentQuestion.correctAnswer
                        ? 'border-green-500 bg-green-50 text-green-800'
                        : 'border-red-500 bg-red-50 text-red-800'
                      : 'border-blue-500 bg-blue-50'
                    : showExplanation && index === currentQuestion.correctAnswer
                    ? 'border-green-500 bg-green-50 text-green-800'
                    : 'border-gray-200 hover:border-gray-300'
                } ${showExplanation ? 'cursor-default' : 'cursor-pointer'}`}
              >
                <div className="flex items-center">
                  <span className="w-6 h-6 rounded-full border-2 border-current flex items-center justify-center mr-3 text-sm font-medium">
                    {String.fromCharCode(65 + index)}
                  </span>
                  {option}
                  {showExplanation && index === currentQuestion.correctAnswer && (
                    <svg className="w-5 h-5 ml-auto text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                  {showExplanation && selectedAnswer === index && index !== currentQuestion.correctAnswer && (
                    <svg className="w-5 h-5 ml-auto text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  )}
                </div>
              </button>
            ))}
          </div>

          {/* Submit Button */}
          {!showExplanation && (
            <button
              onClick={handleSubmitAnswer}
              disabled={selectedAnswer === null}
              className={`w-full py-3 rounded-lg font-medium transition-colors ${
                selectedAnswer !== null
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              Submit Answer
            </button>
          )}

          {/* Explanation */}
          {showExplanation && (
            <div className={`p-4 rounded-lg ${isCorrect ? 'bg-green-100 border border-green-200' : 'bg-blue-100 border border-blue-200'}`}>
              <div className="flex items-center mb-2">
                {isCorrect ? (
                  <svg className="w-5 h-5 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )}
                <span className={`font-medium ${isCorrect ? 'text-green-800' : 'text-blue-800'}`}>
                  {isCorrect ? 'Correct!' : 'Good try!'}
                </span>
              </div>
              <p className={`${isCorrect ? 'text-green-700' : 'text-blue-700'}`}>
                {currentQuestion.explanation}
              </p>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex justify-between items-center">
          <button
            onClick={handleBack}
            className="text-gray-500 hover:text-gray-700 font-medium"
          >
            ← Back
          </button>
          <div className="flex items-center space-x-4">
            <button
              onClick={handleSkip}
              className="text-gray-500 hover:text-gray-700 font-medium"
            >
              Skip tutorial
            </button>
            <div className="text-sm text-gray-400">
              Step 3 of 3
            </div>
            {showExplanation && (
              <button
                onClick={handleNextStep}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                {currentStep < quizQuestions.length - 1 ? 'Next Question' : 'Complete Tutorial'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OnboardingGuidedSteps;

