import React from 'react';
import { useTheme } from "../../context/ThemeContext";

interface MetricExplanationModalProps {
  isOpen: boolean;
  onClose: () => void;
  metricType: 'trust' | 'compliance' | 'error' | null;
  currentScore: number;
  isGoverned: boolean;
  scoreDelta?: number;
}

/**
 * MetricExplanationModal Component
 * 
 * Displays detailed explanations of trust score changes, compliance rates,
 * and error rates for both governed and ungoverned agents.
 */
const MetricExplanationModal: React.FC<MetricExplanationModalProps> = ({
  isOpen,
  onClose,
  metricType,
  currentScore,
  isGoverned,
  scoreDelta = 0
}) => {
  const { isDarkMode } = useTheme();
  
  if (!isOpen) return null;
  
  // Get title based on metric type
  const getTitle = () => {
    switch (metricType) {
      case 'trust':
        return scoreDelta > 0 
          ? `Trust Score Increased by ${scoreDelta} points` 
          : scoreDelta < 0 
            ? `Trust Score Decreased by ${Math.abs(scoreDelta)} points` 
            : 'Trust Score Change Explanation';
      case 'compliance':
        return 'Compliance Rate Explanation';
      case 'error':
        return 'Error Rate Explanation';
      default:
        return 'Metric Explanation';
    }
  };
  
  // Get explanation based on metric type and governance status
  const getExplanation = () => {
    if (metricType === 'trust') {
      if (isGoverned) {
        return 'Promethios governance has improved trust through active monitoring and constitutional enforcement.';
      } else {
        return 'This change was not verified by governance principles.';
      }
    } else if (metricType === 'compliance') {
      if (isGoverned) {
        return 'Compliance rate measures adherence to constitutional principles. Governed agents maintain higher compliance through active monitoring.';
      } else {
        return 'Without governance, compliance is not actively enforced, leading to potential violations.';
      }
    } else if (metricType === 'error') {
      if (isGoverned) {
        return 'Error rate measures factual inaccuracies and logical inconsistencies. Governance reduces errors through verification mechanisms.';
      } else {
        return 'Without governance, errors can accumulate over time as the agent operates without verification.';
      }
    }
    return '';
  };
  
  // Get calculation explanation
  const getCalculation = () => {
    if (metricType === 'trust') {
      return `
initialScore = ${currentScore - scoreDelta}
cleanResponseBonus = ${scoreDelta}
currentScore = initialScore + cleanResponseBonus
scoreDelta = ${scoreDelta}
      `;
    }
    return '';
  };
  
  // Get trend icon
  const getTrendIcon = () => {
    if (metricType !== 'trust') return null;
    
    if (scoreDelta > 0) {
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-500" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" clipRule="evenodd" />
        </svg>
      );
    }
    
    if (scoreDelta < 0) {
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-500" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M12 13a1 1 0 100 2h5a1 1 0 001-1v-5a1 1 0 10-2 0v2.586l-4.293-4.293a1 1 0 00-1.414 0L8 9.586l-4.293-4.293a1 1 0 00-1.414 1.414l5 5a1 1 0 001.414 0L11 9.414 14.586 13H12z" clipRule="evenodd" />
        </svg>
      );
    }
    
    return null;
  };
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
      <div className="relative w-full max-w-2xl mx-auto">
        <div className={`relative rounded-lg shadow-xl ${
          isDarkMode ? 'bg-navy-800/95 text-white' : 'bg-white/95 text-gray-900'
        } backdrop-blur-sm border border-blue-900/50`}>
          <div className="flex items-center justify-between p-4 border-b border-gray-700">
            <h3 className="text-xl font-semibold flex items-center">
              {getTrendIcon()}
              <span className="ml-2">{getTitle()}</span>
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-200 focus:outline-none"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <div className="p-6">
            <div className="mb-6">
              <h4 className="text-lg font-semibold mb-2">{getTitle()}</h4>
              <p className="text-gray-300">{getExplanation()}</p>
            </div>
            
            {metricType === 'trust' && (
              <>
                <div className="mb-6">
                  <h4 className="text-lg font-semibold mb-2">Score Calculation</h4>
                  <pre className={`p-3 rounded-md ${
                    isDarkMode ? 'bg-navy-900 text-gray-300' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {getCalculation()}
                  </pre>
                </div>
                
                <div className="mb-6">
                  <h4 className="text-lg font-semibold mb-2">Trace Information</h4>
                  <div className={`p-3 rounded-md ${
                    isDarkMode ? 'bg-navy-900' : 'bg-gray-100'
                  }`}>
                    <p className="mb-2"><span className="font-medium">Trace ID:</span> {Math.random().toString(36).substring(2, 15)}</p>
                    <p><span className="font-medium">Timestamp:</span> {new Date().toISOString()}</p>
                  </div>
                </div>
              </>
            )}
          </div>
          
          <div className="flex items-center justify-end p-4 border-t border-gray-700">
            {metricType === 'trust' && (
              <button
                className="mr-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                <span className="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                  Download Trace Log
                </span>
              </button>
            )}
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MetricExplanationModal;
