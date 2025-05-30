import React, { useState } from 'react';
import { useTheme } from '../../context/ThemeContext';

interface SessionExportProps {
  isOpen: boolean;
  onClose: () => void;
  sessionData: {
    messages: any[];
    governedMetrics: any;
    ungovernedMetrics: any;
    commentary: any[];
    traceIds: string[];
  };
}

/**
 * SessionExport Component
 * 
 * Provides functionality to export the entire session as a downloadable
 * report in various formats (PDF, JSON, etc.)
 */
const SessionExport: React.FC<SessionExportProps> = ({
  isOpen,
  onClose,
  sessionData
}) => {
  const { isDarkMode } = useTheme();
  const [exportFormat, setExportFormat] = useState<'json' | 'pdf'>('json');
  
  if (!isOpen) return null;
  
  // Generate a downloadable session report
  const handleExportSession = () => {
    if (exportFormat === 'json') {
      // Export as JSON
      const dataStr = JSON.stringify(sessionData, null, 2);
      const dataUri = `data:application/json;charset=utf-8,${encodeURIComponent(dataStr)}`;
      
      const exportFileDefaultName = `promethios-session-${Date.now()}.json`;
      
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();
    } else {
      // Export as PDF (simplified version - in a real implementation, would use a PDF library)
      alert('PDF export would be implemented here with a proper PDF generation library');
    }
    
    onClose();
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className={`relative w-full max-w-md rounded-lg shadow-xl ${
        isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'
      }`}>
        {/* Header */}
        <div className={`px-6 py-4 border-b ${
          isDarkMode ? 'border-gray-700' : 'border-gray-200'
        }`}>
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-semibold">
              Export Session Report
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
        <div className="px-6 py-4">
          <p className="mb-4 text-sm">
            Export the complete session data including all messages, metrics, and governance traces.
            This report can be used for auditing, analysis, or sharing with others.
          </p>
          
          {/* Export Format Selection */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Export Format</label>
            <div className="flex space-x-4">
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  className="form-radio"
                  name="exportFormat"
                  value="json"
                  checked={exportFormat === 'json'}
                  onChange={() => setExportFormat('json')}
                />
                <span className="ml-2">JSON</span>
              </label>
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  className="form-radio"
                  name="exportFormat"
                  value="pdf"
                  checked={exportFormat === 'pdf'}
                  onChange={() => setExportFormat('pdf')}
                />
                <span className="ml-2">PDF</span>
              </label>
            </div>
          </div>
          
          {/* Export Content Preview */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Report Contents</label>
            <div className={`p-3 rounded-md text-sm ${
              isDarkMode ? 'bg-gray-700' : 'bg-gray-100'
            }`}>
              <ul className="list-disc list-inside space-y-1">
                <li>Complete conversation history ({sessionData.messages.length} messages)</li>
                <li>Trust score metrics and changes</li>
                <li>Compliance rate metrics and changes</li>
                <li>Detected violations ({sessionData.governedMetrics.violations.length + sessionData.ungovernedMetrics.violations.length})</li>
                <li>Governance traces ({sessionData.traceIds.length})</li>
                <li>Promethios commentary ({sessionData.commentary.length} entries)</li>
              </ul>
            </div>
          </div>
        </div>
        
        {/* Footer */}
        <div className={`px-6 py-4 border-t ${
          isDarkMode ? 'border-gray-700' : 'border-gray-200'
        }`}>
          <div className="flex justify-end">
            <button
              onClick={onClose}
              className={`mr-3 px-4 py-2 rounded-md ${
                isDarkMode 
                  ? 'bg-gray-700 hover:bg-gray-600 text-white' 
                  : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
              }`}
            >
              Cancel
            </button>
            <button
              onClick={handleExportSession}
              className={`px-4 py-2 rounded-md ${
                isDarkMode 
                  ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              Download Report
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SessionExport;
