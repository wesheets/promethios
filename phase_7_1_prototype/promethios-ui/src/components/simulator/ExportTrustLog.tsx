import React from 'react';
import { useTheme } from "../../context/ThemeContext";

interface ExportTrustLogProps {
  sessionData: {
    prompts: Array<{
      text: string;
      ungovernedResponse: string;
      governedResponse: string;
      violations: string[];
      trustDelta: number;
    }>;
    metrics: {
      initialTrust: number;
      currentTrust: number;
      violationsPrevented: number;
      totalInteractions: number;
    };
  };
  onExport: () => void;
  className?: string;
}

/**
 * ExportTrustLog Component
 * 
 * Provides an enhanced export functionality for session data with
 * detailed trust logs and governance analysis.
 */
const ExportTrustLog: React.FC<ExportTrustLogProps> = ({
  sessionData,
  onExport,
  className = ''
}) => {
  const { isDarkMode } = useTheme();
  
  // Generate sample of the export format
  const generateExportPreview = () => {
    if (sessionData.prompts.length === 0) {
      return "No session data available yet.";
    }
    
    const samplePrompt = sessionData.prompts[0];
    
    return `Session Summary:
- Prompt: "${samplePrompt.text}"
- Ungoverned agent: ${samplePrompt.ungovernedResponse.substring(0, 50)}...
- Promethios-wrapped agent: ${samplePrompt.governedResponse.substring(0, 50)}...
- Trust delta: +${samplePrompt.trustDelta}
- Violations prevented: ${samplePrompt.violations.length}

[... Full report includes all ${sessionData.prompts.length} interactions ...]`;
  };
  
  return (
    <div className={`rounded-lg overflow-hidden ${className} ${
      isDarkMode ? 'bg-navy-800/50 border border-blue-800/50' : 'bg-white border border-blue-100'
    }`}>
      <div className="p-4">
        <h3 className="text-lg font-semibold mb-3 flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V7.414A2 2 0 0015.414 6L12 2.586A2 2 0 0010.586 2H6zm5 6a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V8z" clipRule="evenodd" />
          </svg>
          Trust Log Export
        </h3>
        
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className={`p-3 rounded ${isDarkMode ? 'bg-navy-700' : 'bg-gray-50'}`}>
            <p className="text-sm text-gray-500 dark:text-gray-400">Interactions</p>
            <p className="text-xl font-semibold">{sessionData.metrics.totalInteractions}</p>
          </div>
          
          <div className={`p-3 rounded ${isDarkMode ? 'bg-navy-700' : 'bg-gray-50'}`}>
            <p className="text-sm text-gray-500 dark:text-gray-400">Trust Score Improvement</p>
            <p className="text-xl font-semibold text-green-600 dark:text-green-400">
              +{sessionData.metrics.currentTrust - sessionData.metrics.initialTrust}%
            </p>
          </div>
          
          <div className={`p-3 rounded ${isDarkMode ? 'bg-navy-700' : 'bg-gray-50'}`}>
            <p className="text-sm text-gray-500 dark:text-gray-400">Violations Prevented</p>
            <p className="text-xl font-semibold text-green-600 dark:text-green-400">
              {sessionData.metrics.violationsPrevented}
            </p>
          </div>
          
          <div className={`p-3 rounded ${isDarkMode ? 'bg-navy-700' : 'bg-gray-50'}`}>
            <p className="text-sm text-gray-500 dark:text-gray-400">Export Format</p>
            <p className="text-sm font-medium">PDF + Text</p>
          </div>
        </div>
        
        <div className={`p-3 mb-4 rounded font-mono text-xs whitespace-pre-line overflow-auto max-h-40 ${
          isDarkMode ? 'bg-navy-900 text-gray-300' : 'bg-gray-100 text-gray-700'
        }`}>
          {generateExportPreview()}
        </div>
        
        <button
          onClick={onExport}
          className={`w-full py-2 px-4 rounded-md flex items-center justify-center transition-colors ${
            isDarkMode 
              ? 'bg-blue-600 hover:bg-blue-700 text-white' 
              : 'bg-blue-500 hover:bg-blue-600 text-white'
          }`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
          Download Full Trust Log
        </button>
      </div>
      
      <div className={`px-4 py-3 text-xs ${isDarkMode ? 'bg-navy-900/50' : 'bg-gray-50'}`}>
        <p>Export includes: Full conversation transcript, trust score analysis, governance violations, belief traces, and constitutional evaluation.</p>
      </div>
    </div>
  );
};

export default ExportTrustLog;
