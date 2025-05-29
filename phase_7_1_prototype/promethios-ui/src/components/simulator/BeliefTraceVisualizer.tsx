import React from 'react';
import { useTheme } from '../../context/ThemeContext';

interface BeliefTraceVisualizerProps {
  isExpanded: boolean;
  onToggle: () => void;
  traceData?: {
    evaluation: string;
    constitutionArticles: string[];
    reasoning: string;
    score: number;
  };
  className?: string;
}

/**
 * BeliefTraceVisualizer Component
 * 
 * A collapsible component that visualizes the belief trace for governed agents,
 * showing how responses are evaluated against constitutional principles.
 */
const BeliefTraceVisualizer: React.FC<BeliefTraceVisualizerProps> = ({
  isExpanded,
  onToggle,
  traceData,
  className = ''
}) => {
  const { isDarkMode } = useTheme();
  
  // Default trace data if none provided
  const defaultTrace = {
    evaluation: "Response complies with governance standards",
    constitutionArticles: ["2.1 Truthfulness & Accuracy", "5.1 Traceability"],
    reasoning: "The response provides factual information with appropriate qualifiers and maintains traceability of reasoning.",
    score: 92
  };
  
  const trace = traceData || defaultTrace;
  
  return (
    <div className={`rounded-lg overflow-hidden transition-all duration-300 ${className}`}>
      <button
        onClick={onToggle}
        className={`w-full flex items-center justify-between p-3 text-left transition-colors ${
          isDarkMode 
            ? 'bg-blue-900/30 hover:bg-blue-800/40 text-blue-100' 
            : 'bg-blue-50 hover:bg-blue-100 text-blue-800'
        }`}
      >
        <div className="flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
            <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
            <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
          </svg>
          <span className="font-medium">Belief Trace</span>
        </div>
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          className={`h-5 w-5 transition-transform duration-300 ${isExpanded ? 'transform rotate-180' : ''}`} 
          viewBox="0 0 20 20" 
          fill="currentColor"
        >
          <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      </button>
      
      {isExpanded && (
        <div className={`p-4 border-t ${isDarkMode ? 'bg-navy-800 border-blue-800' : 'bg-white border-blue-100'}`}>
          <div className="mb-3">
            <h4 className="text-sm font-medium mb-1">Evaluation</h4>
            <p className="text-sm">{trace.evaluation}</p>
          </div>
          
          <div className="mb-3">
            <h4 className="text-sm font-medium mb-1">Constitutional Articles Applied</h4>
            <div className="flex flex-wrap gap-2">
              {trace.constitutionArticles.map((article, index) => (
                <span 
                  key={index}
                  className={`text-xs px-2 py-1 rounded-full ${
                    isDarkMode 
                      ? 'bg-blue-900/40 text-blue-300' 
                      : 'bg-blue-100 text-blue-800'
                  }`}
                >
                  {article}
                </span>
              ))}
            </div>
          </div>
          
          <div className="mb-3">
            <h4 className="text-sm font-medium mb-1">Reasoning</h4>
            <p className="text-sm">{trace.reasoning}</p>
          </div>
          
          <div>
            <h4 className="text-sm font-medium mb-1">Trust Impact</h4>
            <div className="flex items-center">
              <div className={`h-2 w-full rounded-full ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'}`}>
                <div 
                  className="h-2 rounded-full bg-green-500" 
                  style={{ width: `${trace.score}%` }}
                ></div>
              </div>
              <span className="ml-2 text-sm font-medium">{trace.score}%</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BeliefTraceVisualizer;
