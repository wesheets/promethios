import React, { useState } from 'react';
import { useTheme } from "../../context/ThemeContext";
import { violationDescriptions, violationToArticle, constitutionArticles, ViolationType } from '../../utils/metricCalculator';

interface GovernanceTraceViewerProps {
  isOpen: boolean;
  onClose: () => void;
  traceId: string;
  prompt: string;
  response: string;
  violationType?: ViolationType | null;
  timestamp?: string;
  isGoverned: boolean;
}

/**
 * GovernanceTraceViewer Component
 * 
 * Provides a comprehensive step-by-step visualization of the governance process
 * with legal audit language, constitutional principles, and downloadable trace logs.
 * Shows which principles were applied and how decisions were made.
 */
const GovernanceTraceViewer: React.FC<GovernanceTraceViewerProps> = ({
  isOpen,
  onClose,
  traceId,
  prompt,
  response,
  violationType,
  timestamp = new Date().toISOString(),
  isGoverned
}) => {
  const { isDarkMode } = useTheme();
  const [activeStep, setActiveStep] = useState(0);
  
  if (!isOpen) return null;
  
  // Get constitutional article if violation exists
  const constitutionalArticle = violationType ? violationToArticle[violationType] : null;
  const article = constitutionalArticle ? constitutionArticles[constitutionalArticle] : null;
  
  // Define governance steps
  const governanceSteps = [
    {
      id: 'input',
      title: 'User Input Received',
      description: 'The user prompt is received and prepared for processing.',
      details: prompt
    },
    {
      id: 'analysis',
      title: 'Constitutional Analysis',
      description: isGoverned 
        ? 'The prompt is analyzed against Promethios constitutional principles.'
        : 'Without governance, no constitutional analysis is performed.',
      details: isGoverned 
        ? 'The prompt is checked for potential violations of capability boundaries, truthfulness requirements, and harm avoidance principles.'
        : 'Ungoverned agents skip this critical safety step, proceeding directly to response generation without constitutional guardrails.'
    },
    {
      id: 'decision',
      title: 'Governance Decision',
      description: isGoverned 
        ? violationType 
          ? `Potential violation detected: ${violationType.replace(/_/g, ' ')}`
          : 'No violations detected, proceeding with standard processing.'
        : 'No governance framework applied to this agent.',
      details: isGoverned 
        ? violationType 
          ? `The agent identified a potential ${violationType.replace(/_/g, ' ')} issue that requires constitutional enforcement.`
          : 'The agent determined that the prompt can be safely processed within constitutional boundaries.'
        : 'Without governance, the agent proceeds without constitutional safeguards, increasing risk of harmful, biased, or inaccurate responses.'
    },
    {
      id: 'enforcement',
      title: 'Constitutional Enforcement',
      description: isGoverned 
        ? violationType 
          ? `Principle ${constitutionalArticle}: ${article?.title} was enforced.`
          : 'All constitutional principles were satisfied.'
        : 'No constitutional enforcement applied.',
      details: isGoverned 
        ? violationType 
          ? `The agent applied constitutional principle ${constitutionalArticle}: ${article?.title} - ${article?.description}`
          : 'The agent confirmed compliance with all constitutional principles before generating a response.'
        : 'Without governance, no constitutional principles are enforced, leaving the agent free to generate potentially harmful or misleading content.'
    },
    {
      id: 'response',
      title: 'Response Generation',
      description: 'The agent generates a response based on the prompt.',
      details: isGoverned 
        ? 'The response is generated within the boundaries established by the constitutional framework.'
        : 'The response is generated without constitutional guardrails or safety mechanisms.'
    },
    {
      id: 'audit',
      title: 'Governance Audit',
      description: isGoverned 
        ? 'A complete audit trail is generated for accountability and traceability.'
        : 'No governance audit trail is generated.',
      details: isGoverned 
        ? 'This governance chain represents the constitutional audit trail required for verified enterprise AI deployment.'
        : 'Without governance, no audit trail exists, making it impossible to verify compliance or trace decision-making.'
    }
  ];
  
  // Generate trace data for download
  const generateTraceData = () => {
    const traceData = {
      traceId,
      timestamp,
      prompt,
      response,
      violationType,
      constitutionalArticle: violationType ? violationToArticle[violationType] : null,
      article: article ? {
        title: article.title,
        description: article.description
      } : null,
      isGoverned,
      governanceSteps: governanceSteps.map(step => ({
        id: step.id,
        title: step.title,
        description: step.description
      })),
      legalAuditStatement: "This governance chain represents the constitutional audit trail required for verified enterprise AI deployment."
    };
    
    return JSON.stringify(traceData, null, 2);
  };
  
  // Handle trace download
  const handleDownloadTrace = () => {
    const traceData = generateTraceData();
    const blob = new Blob([traceData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${traceId}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className={`relative w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-lg shadow-xl ${
        isDarkMode ? 'bg-navy-900 text-white' : 'bg-white text-gray-900'
      }`}>
        {/* Header */}
        <div className={`flex items-center justify-between p-4 border-b ${
          isDarkMode ? 'border-gray-700' : 'border-gray-200'
        }`}>
          <div>
            <h3 className="text-lg font-semibold flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              Governance Trace Viewer
            </h3>
            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Trace ID: {traceId}
            </p>
          </div>
          <button
            onClick={onClose}
            className={`p-1 rounded-full ${
              isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        {/* Content */}
        <div className="p-6">
          {/* Governance Status */}
          <div className={`mb-6 p-4 rounded-lg ${
            isGoverned 
              ? isDarkMode ? 'bg-green-900/20 border border-green-800/50' : 'bg-green-50 border border-green-200'
              : isDarkMode ? 'bg-red-900/20 border border-red-800/50' : 'bg-red-50 border border-red-200'
          }`}>
            <div className="flex items-center">
              {isGoverned ? (
                <svg xmlns="http://www.w3.org/2000/svg" className={`h-8 w-8 mr-3 ${isDarkMode ? 'text-green-400' : 'text-green-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className={`h-8 w-8 mr-3 ${isDarkMode ? 'text-red-400' : 'text-red-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              )}
              <div>
                <h4 className={`text-lg font-medium ${
                  isGoverned 
                    ? isDarkMode ? 'text-green-400' : 'text-green-700'
                    : isDarkMode ? 'text-red-400' : 'text-red-700'
                }`}>
                  {isGoverned ? 'Governed Agent' : 'Ungoverned Agent'}
                </h4>
                <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  {isGoverned 
                    ? 'This agent operates under the Promethios Constitutional Framework, ensuring safety, accuracy, and reliability.'
                    : 'This agent operates without governance, increasing risk of harmful, biased, or inaccurate responses.'}
                </p>
              </div>
            </div>
          </div>
          
          {/* Timeline */}
          <div className="mb-6">
            <h4 className="text-md font-medium mb-4">Governance Timeline</h4>
            <div className="relative">
              {/* Timeline Line */}
              <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-300 dark:bg-gray-700"></div>
              
              {/* Timeline Steps */}
              <div className="space-y-6 relative">
                {governanceSteps.map((step, index) => (
                  <div 
                    key={step.id}
                    className={`flex ${index === activeStep ? 'opacity-100' : 'opacity-70'}`}
                    onClick={() => setActiveStep(index)}
                  >
                    {/* Timeline Dot */}
                    <div className={`relative flex items-center justify-center w-8 h-8 rounded-full ${
                      index === activeStep
                        ? isDarkMode ? 'bg-blue-600' : 'bg-blue-500'
                        : isDarkMode ? 'bg-gray-700' : 'bg-gray-300'
                    } flex-shrink-0 cursor-pointer z-10`}>
                      {index < activeStep ? (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      ) : (
                        <span className="text-white text-sm font-medium">{index + 1}</span>
                      )}
                    </div>
                    
                    {/* Timeline Content */}
                    <div className={`ml-4 cursor-pointer ${
                      index === activeStep ? 'border-l-4 pl-4' : 'pl-4'
                    } ${
                      index === activeStep
                        ? isDarkMode ? 'border-blue-600' : 'border-blue-500'
                        : 'border-transparent'
                    }`}>
                      <h5 className={`text-md font-medium ${
                        index === activeStep
                          ? isDarkMode ? 'text-blue-400' : 'text-blue-700'
                          : ''
                      }`}>
                        {step.title}
                      </h5>
                      <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        {step.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          {/* Step Details */}
          <div className={`mb-6 p-4 rounded-lg ${
            isDarkMode ? 'bg-navy-800' : 'bg-gray-100'
          }`}>
            <h4 className="text-md font-medium mb-2">{governanceSteps[activeStep].title} Details</h4>
            <p className="whitespace-pre-wrap">
              {governanceSteps[activeStep].details}
            </p>
            
            {/* Constitutional Article Reference */}
            {activeStep === 3 && isGoverned && violationType && article && (
              <div className={`mt-4 p-3 rounded ${
                isDarkMode ? 'bg-blue-900/30 border border-blue-800/50' : 'bg-blue-50 border border-blue-200'
              }`}>
                <h5 className={`text-sm font-medium mb-1 ${
                  isDarkMode ? 'text-blue-400' : 'text-blue-700'
                }`}>
                  Constitutional Reference
                </h5>
                <p className="text-sm font-medium">
                  Article {constitutionalArticle}: {article.title}
                </p>
                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  {article.description}
                </p>
              </div>
            )}
            
            {/* Legal Audit Statement */}
            {activeStep === 5 && isGoverned && (
              <div className={`mt-4 p-3 rounded ${
                isDarkMode ? 'bg-green-900/30 border border-green-800/50' : 'bg-green-50 border border-green-200'
              }`}>
                <p className={`text-sm italic ${
                  isDarkMode ? 'text-green-400' : 'text-green-700'
                }`}>
                  This governance chain represents the constitutional audit trail required for verified enterprise AI deployment.
                </p>
              </div>
            )}
          </div>
          
          {/* Response Preview */}
          {activeStep >= 4 && (
            <div className="mb-6">
              <h4 className="text-md font-medium mb-2">Response Preview</h4>
              <div className={`p-4 rounded-lg ${
                isDarkMode ? 'bg-navy-800' : 'bg-gray-100'
              }`}>
                <p className="whitespace-pre-wrap">
                  {response}
                </p>
              </div>
            </div>
          )}
          
          {/* Download Trace Button */}
          <div className="flex justify-end mt-6">
            <button
              onClick={handleDownloadTrace}
              className={`py-2 px-4 rounded-md text-sm font-medium flex items-center ${
                isDarkMode 
                  ? 'bg-blue-600/30 hover:bg-blue-600/50 text-blue-300 border border-blue-700/50'
                  : 'bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200'
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Download Governance Trace
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GovernanceTraceViewer;
