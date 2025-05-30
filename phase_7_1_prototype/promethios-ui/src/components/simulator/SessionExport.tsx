import React, { useState, useEffect, useRef } from 'react';
import { useTheme } from "../../context/ThemeContext";

interface SessionExportProps {
  isOpen: boolean;
  onClose: () => void;
  sessionData: {
    governedMessages: Array<{id: string; text: string; timestamp: Date}>;
    ungovernedMessages: Array<{id: string; text: string; timestamp: Date}>;
    governedMetrics: any;
    ungovernedMetrics: any;
    observerMessages: Array<{id: string; text: string; timestamp: Date}>;
  };
}

/**
 * SessionExport Component
 * 
 * Provides functionality to export the current simulation session
 * including all messages, metrics, and governance traces.
 */
const SessionExport: React.FC<SessionExportProps> = ({
  isOpen,
  onClose,
  sessionData
}) => {
  const { isDarkMode } = useTheme();
  const [exportFormat, setExportFormat] = useState<'json' | 'markdown'>('json');
  const [copied, setCopied] = useState(false);
  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  
  // Format session data based on selected format
  const getFormattedData = () => {
    if (exportFormat === 'json') {
      return JSON.stringify(sessionData, null, 2);
    } else {
      // Markdown format
      let markdown = '# Promethios Simulation Session Export\n\n';
      markdown += `## Date: ${new Date().toLocaleString()}\n\n`;
      
      markdown += '## Ungoverned Agent Messages\n\n';
      sessionData.ungovernedMessages.forEach(msg => {
        markdown += `### ${new Date(msg.timestamp).toLocaleString()}\n\n`;
        markdown += `${msg.text}\n\n`;
      });
      
      markdown += '## Governed Agent Messages\n\n';
      sessionData.governedMessages.forEach(msg => {
        markdown += `### ${new Date(msg.timestamp).toLocaleString()}\n\n`;
        markdown += `${msg.text}\n\n`;
      });
      
      markdown += '## Promethios Observer Comments\n\n';
      sessionData.observerMessages.forEach(msg => {
        markdown += `### ${new Date(msg.timestamp).toLocaleString()}\n\n`;
        markdown += `${msg.text}\n\n`;
      });
      
      markdown += '## Final Metrics\n\n';
      markdown += '### Ungoverned Agent\n\n';
      markdown += `- Trust Score: ${sessionData.ungovernedMetrics.trustScore}\n`;
      markdown += `- Compliance Rate: ${sessionData.ungovernedMetrics.complianceRate}%\n`;
      markdown += `- Error Rate: ${sessionData.ungovernedMetrics.errorRate}%\n`;
      markdown += `- Violations: ${sessionData.ungovernedMetrics.violations.length}\n\n`;
      
      markdown += '### Governed Agent\n\n';
      markdown += `- Trust Score: ${sessionData.governedMetrics.trustScore}\n`;
      markdown += `- Compliance Rate: ${sessionData.governedMetrics.complianceRate}%\n`;
      markdown += `- Error Rate: ${sessionData.governedMetrics.errorRate}%\n`;
      markdown += `- Violations: ${sessionData.governedMetrics.violations.length}\n\n`;
      
      return markdown;
    }
  };
  
  // Handle copy to clipboard
  const handleCopy = () => {
    if (textAreaRef.current) {
      textAreaRef.current.select();
      document.execCommand('copy');
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };
  
  // Handle download
  const handleDownload = () => {
    const data = getFormattedData();
    const blob = new Blob([data], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `promethios-session-export.${exportFormat === 'json' ? 'json' : 'md'}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="relative w-full max-w-4xl mx-auto">
        <div className={`relative rounded-lg shadow-xl ${
          isDarkMode ? 'bg-navy-800 text-white' : 'bg-white text-gray-900'
        }`}>
          <div className="flex items-center justify-between p-4 border-b border-gray-700">
            <h3 className="text-xl font-semibold flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Export Session
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
                    value="markdown"
                    checked={exportFormat === 'markdown'}
                    onChange={() => setExportFormat('markdown')}
                  />
                  <span className="ml-2">Markdown</span>
                </label>
              </div>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Session Data</label>
              <textarea
                ref={textAreaRef}
                className={`w-full h-80 p-3 rounded-md font-mono text-sm ${
                  isDarkMode ? 'bg-navy-900 text-gray-300' : 'bg-gray-100 text-gray-800'
                }`}
                readOnly
                value={getFormattedData()}
              />
            </div>
          </div>
          
          <div className="flex items-center justify-end p-4 border-t border-gray-700">
            <button
              onClick={handleCopy}
              className="mr-2 px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
            >
              {copied ? 'Copied!' : 'Copy to Clipboard'}
            </button>
            <button
              onClick={handleDownload}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Download
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SessionExport;
