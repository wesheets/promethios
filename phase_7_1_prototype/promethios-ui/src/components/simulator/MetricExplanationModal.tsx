import React from 'react';
import { useTheme } from '../../context/ThemeContext';
import { violationDescriptions, violationToArticle, constitutionArticles, ViolationType } from '../../utils/metricCalculator';

interface MetricExplanationModalProps {
  isOpen: boolean;
  onClose: () => void;
  metricType: 'trust' | 'compliance' | 'error';
  scoreChange: number;
  violationType?: ViolationType | null;
  prompt?: string;
  traceId?: string;
  isGoverned?: boolean;
}

/**
 * MetricExplanationModal Component
 * 
 * Provides detailed explanations of metric changes with legal audit language,
 * constitutional principles, and downloadable trace logs.
 * Differentiates between governed and ungoverned agents.
 */
const MetricExplanationModal: React.FC<MetricExplanationModalProps> = ({
  isOpen,
  onClose,
  metricType,
  scoreChange,
  violationType,
  prompt = '',
  traceId = '',
  isGoverned = false
}) => {
  const { isDarkMode } = useTheme();
  
  if (!isOpen) return null;
  
  const isPositive = scoreChange > 0;
  const metricNames = {
    trust: 'Trust Score',
    compliance: 'Compliance Rate',
    error: 'Error Rate'
  };
  
  // Get constitutional article if violation exists
  const constitutionalArticle = violationType ? violationToArticle[violationType] : null;
  const article = constitutionalArticle ? constitutionArticles[constitutionalArticle] : null;
  
  // Generate trace data for download
  const generateTraceData = () => {
    const traceData = {
      traceId,
      timestamp: new Date().toISOString(),
      metricType,
      scoreChange,
      violationType,
      constitutionalArticle,
      prompt,
      isGoverned,
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
      <div className={`relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-lg shadow-xl ${
        isDarkMode ? 'bg-navy-900 text-white' : 'bg-white text-gray-900'
      }`}>
        {/* Header */}
        <div className={`flex items-center justify-between p-4 border-b ${
          isDarkMode ? 'border-gray-700' : 'border-gray-200'
        }`}>
          <h3 className="text-lg font-semibold">
            {metricNames[metricType]} Change Explanation
          </h3>
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
          {/* Score Change Summary */}
          <div className="mb-6">
            <div className="flex items-center mb-2">
              <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                isPositive 
                  ? isDarkMode ? 'bg-green-900/30 text-green-400' : 'bg-green-100 text-green-600'
                  : isDarkMode ? 'bg-red-900/30 text-red-400' : 'bg-red-100 text-red-600'
              }`}>
                {isPositive ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                  </svg>
                )}
              </div>
              <div className="ml-4">
                <h4 className="text-lg font-medium">
                  {metricNames[metricType]} {isPositive ? 'Increased' : 'Decreased'} by {Math.abs(scoreChange)} points
                </h4>
                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  {isGoverned 
                    ? `This change was evaluated against Promethios constitutional principles`
                    : `This change was not verified by governance principles`}
                </p>
              </div>
            </div>
          </div>
          
          {/* Violation Details (if applicable) */}
          {violationType && (
            <div className={`mb-6 p-4 rounded-lg ${
              isDarkMode ? 'bg-red-900/20 border border-red-800/50' : 'bg-red-50 border border-red-200'
            }`}>
              <h4 className={`text-md font-medium mb-2 ${
                isDarkMode ? 'text-red-400' : 'text-red-700'
              }`}>
                Violation Detected
              </h4>
              <p className="mb-2">
                <span className="font-medium">Type:</span> {violationType.replace(/_/g, ' ')}
              </p>
              <p className="mb-2">
                <span className="font-medium">Description:</span> {violationDescriptions[violationType]}
              </p>
              {article && (
                <div className="mt-4">
                  <p className="font-medium mb-1">Constitutional Principle Violated:</p>
                  <div className={`p-3 rounded ${
                    isDarkMode ? 'bg-navy-800' : 'bg-gray-100'
                  }`}>
                    <p className="font-medium">{constitutionalArticle}: {article.title}</p>
                    <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      {article.description}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
          
          {/* Score Calculation */}
          <div className="mb-6">
            <h4 className="text-md font-medium mb-2">Score Calculation</h4>
            <div className={`p-4 rounded-lg font-mono text-sm ${
              isDarkMode ? 'bg-navy-800' : 'bg-gray-100'
            }`}>
              {violationType ? (
                <>
                  <p>initialScore = {isPositive ? scoreChange - 100 : 100 + scoreChange}</p>
                  <p>violationPenalty = {violationType === 'hallucination' ? -18 : 
                      violationType === 'unauthorized_advice' ? -22 :
                      violationType === 'harmful_content' ? -28 :
                      violationType === 'source_missing' ? -8 :
                      violationType === 'capability_exceeded' ? -15 :
                      violationType === 'bias_detected' ? -12 : -10}</p>
                  <p>currentScore = initialScore + violationPenalty</p>
                  <p>scoreDelta = {scoreChange}</p>
                </>
              ) : (
                <>
                  <p>initialScore = {isPositive ? 100 - scoreChange : 100 + scoreChange}</p>
                  <p>cleanResponseBonus = +5</p>
                  <p>currentScore = initialScore + cleanResponseBonus</p>
                  <p>scoreDelta = {scoreChange}</p>
                </>
              )}
            </div>
          </div>
          
          {/* Trace Information */}
          <div className="mb-6">
            <h4 className="text-md font-medium mb-2">Trace Information</h4>
            <div className={`p-4 rounded-lg ${
              isDarkMode ? 'bg-navy-800' : 'bg-gray-100'
            }`}>
              <p className="mb-2">
                <span className="font-medium">Trace ID:</span> {traceId}
              </p>
              <p className="mb-2">
                <span className="font-medium">Timestamp:</span> {new Date().toISOString()}
              </p>
              {isGoverned && (
                <p className={`text-sm italic mt-4 ${
                  isDarkMode ? 'text-blue-400' : 'text-blue-600'
                }`}>
                  This governance chain represents the constitutional audit trail required for verified enterprise AI deployment.
                </p>
              )}
            </div>
          </div>
          
          {/* Prompt that triggered this change */}
          {prompt && (
            <div className="mb-6">
              <h4 className="text-md font-medium mb-2">Triggering Prompt</h4>
              <div className={`p-4 rounded-lg ${
                isDarkMode ? 'bg-navy-800' : 'bg-gray-100'
              }`}>
                <p className="italic">"{prompt}"</p>
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
              Download Trace Log
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MetricExplanationModal;
