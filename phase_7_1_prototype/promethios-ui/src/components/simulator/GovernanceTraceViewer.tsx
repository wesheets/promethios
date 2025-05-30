import React, { useState } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { ViolationType, violationDescriptions, constitutionArticles, violationToArticle } from '../../utils/metricCalculator';

interface GovernanceTraceViewerProps {
  isOpen: boolean;
  onClose: () => void;
  traceId: string;
  prompt: string;
  response: string;
  violationType?: ViolationType;
  scoreImpact: {
    trust: number;
    compliance: number;
    error: number;
  };
}

/**
 * GovernanceTraceViewer Component
 * 
 * A detailed visualization of the governance process, showing step-by-step
 * how decisions were made and which constitutional principles were applied.
 */
const GovernanceTraceViewer: React.FC<GovernanceTraceViewerProps> = ({
  isOpen,
  onClose,
  traceId,
  prompt,
  response,
  violationType,
  scoreImpact
}) => {
  const { isDarkMode } = useTheme();
  const [expandedStep, setExpandedStep] = useState<number | null>(null);
  
  if (!isOpen) return null;
  
  // Get the relevant constitutional article if there's a violation
  const constitutionalArticle = violationType ? violationToArticle[violationType] : null;
  const articleDetails = constitutionalArticle ? constitutionArticles[constitutionalArticle] : null;
  
  // Define the governance steps
  const governanceSteps = [
    {
      id: 1,
      title: 'Prompt Analysis',
      description: 'The system analyzes the user prompt for potential risks or issues.',
      details: `The prompt "${prompt.substring(0, 50)}${prompt.length > 50 ? '...' : ''}" was analyzed for potential harmful content, capability requirements, and factual claims.`,
      module: 'ATLAS',
      time: new Date(Date.now() - 5000).toISOString()
    },
    {
      id: 2,
      title: 'Input Parsing',
      description: 'The prompt is parsed and prepared for the agent.',
      details: 'The input was tokenized, normalized, and prepared for processing by the agent.',
      module: 'PARSER',
      time: new Date(Date.now() - 4000).toISOString()
    },
    {
      id: 3,
      title: 'Content Filter',
      description: 'The system checks for harmful or prohibited content.',
      details: violationType === 'harmful_content' 
        ? 'Potentially harmful content was detected in the request. The system applied Principle 4.1: Harm Avoidance.'
        : 'No harmful content was detected in the request.',
      module: 'VIGIL',
      time: new Date(Date.now() - 3000).toISOString(),
      isViolation: violationType === 'harmful_content'
    },
    {
      id: 4,
      title: 'Capability Check',
      description: 'The system verifies if the request is within the agent\'s capabilities.',
      details: violationType === 'capability_exceeded' 
        ? 'The request exceeds the agent\'s declared capabilities. The system applied Principle 1.1: Capability Boundaries.'
        : 'The request is within the agent\'s declared capabilities.',
      module: 'BOUNDARY',
      time: new Date(Date.now() - 2500).toISOString(),
      isViolation: violationType === 'capability_exceeded'
    },
    {
      id: 5,
      title: 'Response Generation',
      description: 'The agent generates a response based on the prompt.',
      details: 'The agent generated a response based on its training data and the governance constraints.',
      module: 'CORE',
      time: new Date(Date.now() - 2000).toISOString()
    },
    {
      id: 6,
      title: 'Factual Verification',
      description: 'The system checks the response for factual accuracy.',
      details: violationType === 'hallucination' 
        ? 'Potential hallucination detected in the response. The system applied Principle 2.1: Truthfulness & Accuracy.'
        : 'No factual inaccuracies detected in the response.',
      module: 'VERITAS',
      time: new Date(Date.now() - 1500).toISOString(),
      isViolation: violationType === 'hallucination'
    },
    {
      id: 7,
      title: 'Source Verification',
      description: 'The system checks if claims are properly sourced.',
      details: violationType === 'source_missing' 
        ? 'Claims without proper sources detected. The system applied Principle 3.1: Source Verification.'
        : 'All claims are properly sourced or acknowledged as unverified.',
      module: 'CITATION',
      time: new Date(Date.now() - 1000).toISOString(),
      isViolation: violationType === 'source_missing'
    },
    {
      id: 8,
      title: 'Bias Detection',
      description: 'The system checks for bias in the response.',
      details: violationType === 'bias_detected' 
        ? 'Potential bias detected in the response. The system applied Principle 4.1: Harm Avoidance.'
        : 'No significant bias detected in the response.',
      module: 'EQUITY',
      time: new Date(Date.now() - 500).toISOString(),
      isViolation: violationType === 'bias_detected'
    },
    {
      id: 9,
      title: 'Final Output',
      description: 'The system delivers the final response to the user.',
      details: 'The response was delivered to the user with appropriate governance metadata.',
      module: 'DELIVERY',
      time: new Date().toISOString()
    }
  ];
  
  // Generate a downloadable trace log in JSON format
  const handleDownloadTraceLog = () => {
    const traceData = {
      trace_id: traceId,
      timestamp: new Date().toISOString(),
      prompt: prompt,
      response: response,
      violation_type: violationType || null,
      violation_description: violationType ? violationDescriptions[violationType] : null,
      constitutional_article: constitutionalArticle,
      article_title: articleDetails?.title || null,
      article_description: articleDetails?.description || null,
      score_impact: scoreImpact,
      governance_steps: governanceSteps
    };
    
    const dataStr = JSON.stringify(traceData, null, 2);
    const dataUri = `data:application/json;charset=utf-8,${encodeURIComponent(dataStr)}`;
    
    const exportFileDefaultName = `promethios-trace-${traceId}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className={`relative w-full max-w-4xl rounded-lg shadow-xl ${
        isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'
      } max-h-[90vh] overflow-hidden flex flex-col`}>
        {/* Header */}
        <div className={`px-6 py-4 border-b ${
          isDarkMode ? 'border-gray-700' : 'border-gray-200'
        }`}>
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-semibold flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              Governance Trace
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500 focus:outline-none"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
        
        {/* Content */}
        <div className="px-6 py-4 overflow-y-auto flex-grow">
          {/* Trace ID */}
          <div className="mb-4">
            <div className={`p-3 rounded-md font-mono text-sm ${
              isDarkMode ? 'bg-gray-700' : 'bg-gray-100'
            }`}>
              Trace ID: {traceId}
            </div>
          </div>
          
          {/* Timeline */}
          <div className="mb-6">
            <h4 className="text-lg font-medium mb-4">Governance Process Timeline</h4>
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-blue-500"></div>
              
              {/* Timeline steps */}
              {governanceSteps.map((step, index) => (
                <div key={step.id} className="mb-4 relative">
                  {/* Timeline dot */}
                  <div className={`absolute left-4 w-4 h-4 rounded-full transform -translate-x-1/2 ${
                    step.isViolation 
                      ? 'bg-red-500' 
                      : index === governanceSteps.length - 1 
                        ? 'bg-green-500' 
                        : 'bg-blue-500'
                  }`}></div>
                  
                  {/* Step content */}
                  <div className={`ml-8 p-3 rounded-md ${
                    step.isViolation
                      ? isDarkMode ? 'bg-red-900/30 border border-red-800/50' : 'bg-red-50 border border-red-200'
                      : isDarkMode ? 'bg-gray-700' : 'bg-white border border-gray-200'
                  }`}>
                    <div className="flex justify-between items-start">
                      <div>
                        <h5 className={`font-medium ${
                          step.isViolation 
                            ? isDarkMode ? 'text-red-400' : 'text-red-700'
                            : ''
                        }`}>
                          {step.id}. {step.title}
                        </h5>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                          {step.description}
                        </p>
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        <span className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-300 px-2 py-1 rounded">
                          {step.module}
                        </span>
                      </div>
                    </div>
                    
                    {/* Expandable details */}
                    <div className="mt-2">
                      <button
                        onClick={() => setExpandedStep(expandedStep === step.id ? null : step.id)}
                        className={`text-sm flex items-center ${
                          isDarkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'
                        }`}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 mr-1 transition-transform ${
                          expandedStep === step.id ? 'transform rotate-90' : ''
                        }`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                        {expandedStep === step.id ? 'Hide Details' : 'View Details'}
                      </button>
                      
                      {expandedStep === step.id && (
                        <div className={`mt-2 p-2 text-sm rounded ${
                          isDarkMode ? 'bg-gray-800' : 'bg-gray-50'
                        }`}>
                          <p>{step.details}</p>
                          <p className="mt-1 text-xs text-gray-500">
                            {new Date(step.time).toLocaleTimeString()}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Score Impact */}
          <div className="mb-6">
            <h4 className="text-lg font-medium mb-2">Score Impact</h4>
            <div className="grid grid-cols-3 gap-4">
              <div className={`p-3 rounded-md ${
                scoreImpact.trust > 0
                  ? isDarkMode ? 'bg-green-900/30' : 'bg-green-50'
                  : isDarkMode ? 'bg-red-900/30' : 'bg-red-50'
              }`}>
                <p className="text-sm font-medium">Trust Score</p>
                <p className={`text-xl font-bold ${
                  scoreImpact.trust > 0
                    ? isDarkMode ? 'text-green-400' : 'text-green-700'
                    : isDarkMode ? 'text-red-400' : 'text-red-700'
                }`}>
                  {scoreImpact.trust > 0 ? '+' : ''}{scoreImpact.trust}
                </p>
              </div>
              
              <div className={`p-3 rounded-md ${
                scoreImpact.compliance > 0
                  ? isDarkMode ? 'bg-green-900/30' : 'bg-green-50'
                  : isDarkMode ? 'bg-red-900/30' : 'bg-red-50'
              }`}>
                <p className="text-sm font-medium">Compliance Rate</p>
                <p className={`text-xl font-bold ${
                  scoreImpact.compliance > 0
                    ? isDarkMode ? 'text-green-400' : 'text-green-700'
                    : isDarkMode ? 'text-red-400' : 'text-red-700'
                }`}>
                  {scoreImpact.compliance > 0 ? '+' : ''}{scoreImpact.compliance}%
                </p>
              </div>
              
              <div className={`p-3 rounded-md ${
                scoreImpact.error < 0
                  ? isDarkMode ? 'bg-green-900/30' : 'bg-green-50'
                  : isDarkMode ? 'bg-red-900/30' : 'bg-red-50'
              }`}>
                <p className="text-sm font-medium">Error Rate</p>
                <p className={`text-xl font-bold ${
                  scoreImpact.error < 0
                    ? isDarkMode ? 'text-green-400' : 'text-green-700'
                    : isDarkMode ? 'text-red-400' : 'text-red-700'
                }`}>
                  {scoreImpact.error > 0 ? '+' : ''}{scoreImpact.error}%
                </p>
              </div>
            </div>
          </div>
          
          {/* Constitutional Article (if violation) */}
          {violationType && constitutionalArticle && (
            <div className="mb-6">
              <h4 className="text-lg font-medium mb-2">Constitutional Principle Applied</h4>
              <div className={`p-4 rounded-md ${
                isDarkMode ? 'bg-blue-900/30 border border-blue-800/50' : 'bg-blue-50 border border-blue-200'
              }`}>
                <h5 className="font-medium text-blue-700 dark:text-blue-400">
                  {constitutionalArticle}: {articleDetails?.title}
                </h5>
                <p className="mt-1 text-sm">
                  {articleDetails?.description}
                </p>
                <div className="mt-3 pt-3 border-t border-blue-200 dark:border-blue-800/50">
                  <p className="text-sm font-medium text-blue-700 dark:text-blue-400">
                    Violation: {violationDescriptions[violationType]}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Footer */}
        <div className={`px-6 py-4 border-t ${
          isDarkMode ? 'border-gray-700' : 'border-gray-200'
        }`}>
          <div className="flex justify-end">
            <button
              onClick={handleDownloadTraceLog}
              className={`mr-3 px-4 py-2 rounded-md ${
                isDarkMode 
                  ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                  : 'bg-blue-100 hover:bg-blue-200 text-blue-800'
              }`}
            >
              Download Trace Log
            </button>
            <button
              onClick={onClose}
              className={`px-4 py-2 rounded-md ${
                isDarkMode 
                  ? 'bg-gray-700 hover:bg-gray-600 text-white' 
                  : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
              }`}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GovernanceTraceViewer;
