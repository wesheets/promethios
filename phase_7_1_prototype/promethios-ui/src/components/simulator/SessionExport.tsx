import React, { useState } from 'react';
import { useTheme } from '../../context/ThemeContext';

interface SessionExportProps {
  isOpen: boolean;
  onClose: () => void;
  sessionData: {
    messages: {
      role: string;
      content: string;
      timestamp: string;
    }[];
    metrics: {
      trustScore: number;
      complianceRate: number;
      errorRate: number;
      violations: { id: string, type: string, description: string }[];
    };
    isGoverned: boolean;
    sessionId: string;
  };
}

/**
 * SessionExport Component
 * 
 * Provides functionality to export complete session reports with all metrics,
 * messages, violations, and commentary in various formats.
 * Includes enterprise-grade audit formatting for legal and compliance contexts.
 */
const SessionExport: React.FC<SessionExportProps> = ({
  isOpen,
  onClose,
  sessionData
}) => {
  const { isDarkMode } = useTheme();
  const [exportFormat, setExportFormat] = useState<'json' | 'html' | 'txt'>('json');
  
  if (!isOpen) return null;
  
  // Generate session export data
  const generateExportData = () => {
    const timestamp = new Date().toISOString();
    const exportData = {
      sessionId: sessionData.sessionId,
      exportTimestamp: timestamp,
      governanceStatus: sessionData.isGoverned ? 'Governed by Promethios' : 'Ungoverned',
      metrics: {
        trustScore: sessionData.metrics.trustScore,
        complianceRate: sessionData.metrics.complianceRate,
        errorRate: sessionData.metrics.errorRate,
        violations: sessionData.metrics.violations
      },
      conversation: sessionData.messages.map(msg => ({
        role: msg.role,
        content: msg.content,
        timestamp: msg.timestamp
      })),
      legalAuditStatement: sessionData.isGoverned 
        ? "This governance chain represents the constitutional audit trail required for verified enterprise AI deployment."
        : "This session was conducted without governance oversight. No constitutional audit trail is available."
    };
    
    return exportData;
  };
  
  // Format export data based on selected format
  const formatExportData = (data: any) => {
    switch (exportFormat) {
      case 'json':
        return JSON.stringify(data, null, 2);
      case 'txt':
        return `SESSION EXPORT: ${data.sessionId}
TIMESTAMP: ${data.exportTimestamp}
GOVERNANCE STATUS: ${data.governanceStatus}

METRICS:
- Trust Score: ${data.metrics.trustScore}
- Compliance Rate: ${data.metrics.complianceRate}%
- Error Rate: ${data.metrics.errorRate}%
- Violations: ${data.metrics.violations.length}

CONVERSATION:
${data.conversation.map((msg: any) => 
  `[${msg.timestamp}] ${msg.role.toUpperCase()}: ${msg.content}`
).join('\n\n')}

LEGAL AUDIT STATEMENT:
${data.legalAuditStatement}`;
      case 'html':
        return `<!DOCTYPE html>
<html>
<head>
  <title>Session Export: ${data.sessionId}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 0; padding: 20px; color: #333; }
    .header { background: #f5f5f5; padding: 15px; border-radius: 5px; margin-bottom: 20px; }
    .metrics { display: flex; gap: 15px; margin-bottom: 20px; }
    .metric { background: #eef; padding: 10px; border-radius: 5px; flex: 1; }
    .conversation { margin-bottom: 20px; }
    .message { padding: 10px; margin-bottom: 10px; border-radius: 5px; }
    .user { background: #e6f7ff; }
    .assistant { background: #f0f0f0; }
    .legal { background: #ffe; padding: 15px; border-radius: 5px; font-style: italic; }
  </style>
</head>
<body>
  <div class="header">
    <h1>Session Export: ${data.sessionId}</h1>
    <p>Timestamp: ${data.exportTimestamp}</p>
    <p>Governance Status: ${data.governanceStatus}</p>
  </div>
  
  <h2>Metrics</h2>
  <div class="metrics">
    <div class="metric">
      <h3>Trust Score</h3>
      <p>${data.metrics.trustScore}</p>
    </div>
    <div class="metric">
      <h3>Compliance Rate</h3>
      <p>${data.metrics.complianceRate}%</p>
    </div>
    <div class="metric">
      <h3>Error Rate</h3>
      <p>${data.metrics.errorRate}%</p>
    </div>
    <div class="metric">
      <h3>Violations</h3>
      <p>${data.metrics.violations.length}</p>
    </div>
  </div>
  
  <h2>Conversation</h2>
  <div class="conversation">
    ${data.conversation.map((msg: any) => 
      `<div class="message ${msg.role}">
        <p><strong>${msg.role.toUpperCase()} (${msg.timestamp}):</strong></p>
        <p>${msg.content.replace(/\n/g, '<br>')}</p>
      </div>`
    ).join('')}
  </div>
  
  <h2>Legal Audit Statement</h2>
  <div class="legal">
    <p>${data.legalAuditStatement}</p>
  </div>
</body>
</html>`;
      default:
        return JSON.stringify(data, null, 2);
    }
  };
  
  // Handle export download
  const handleExport = () => {
    const exportData = generateExportData();
    const formattedData = formatExportData(exportData);
    
    // Determine file extension
    const fileExtension = exportFormat === 'json' ? 'json' : 
                         exportFormat === 'html' ? 'html' : 'txt';
    
    // Create and download file
    const blob = new Blob([formattedData], { 
      type: exportFormat === 'json' ? 'application/json' : 
            exportFormat === 'html' ? 'text/html' : 'text/plain' 
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `session-${sessionData.sessionId}.${fileExtension}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className={`relative w-full max-w-md rounded-lg shadow-xl ${
        isDarkMode ? 'bg-navy-900 text-white' : 'bg-white text-gray-900'
      }`}>
        {/* Header */}
        <div className={`flex items-center justify-between p-4 border-b ${
          isDarkMode ? 'border-gray-700' : 'border-gray-200'
        }`}>
          <h3 className="text-lg font-semibold flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Export Session
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
          {/* Session Info */}
          <div className="mb-6">
            <h4 className="text-md font-medium mb-2">Session Information</h4>
            <div className={`p-4 rounded-lg ${
              isDarkMode ? 'bg-navy-800' : 'bg-gray-100'
            }`}>
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium">Session ID:</span>
                <span className="text-sm">{sessionData.sessionId}</span>
              </div>
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium">Governance Status:</span>
                <span className={`text-sm ${
                  sessionData.isGoverned 
                    ? isDarkMode ? 'text-green-400' : 'text-green-600'
                    : isDarkMode ? 'text-red-400' : 'text-red-600'
                }`}>
                  {sessionData.isGoverned ? 'Governed by Promethios' : 'Ungoverned'}
                </span>
              </div>
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium">Messages:</span>
                <span className="text-sm">{sessionData.messages.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium">Violations:</span>
                <span className="text-sm">{sessionData.metrics.violations.length}</span>
              </div>
            </div>
          </div>
          
          {/* Export Format */}
          <div className="mb-6">
            <h4 className="text-md font-medium mb-2">Export Format</h4>
            <div className="flex space-x-2">
              <button
                onClick={() => setExportFormat('json')}
                className={`flex-1 py-2 px-3 rounded-md text-sm font-medium ${
                  exportFormat === 'json'
                    ? isDarkMode 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-blue-500 text-white'
                    : isDarkMode 
                      ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                JSON
              </button>
              <button
                onClick={() => setExportFormat('html')}
                className={`flex-1 py-2 px-3 rounded-md text-sm font-medium ${
                  exportFormat === 'html'
                    ? isDarkMode 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-blue-500 text-white'
                    : isDarkMode 
                      ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                HTML
              </button>
              <button
                onClick={() => setExportFormat('txt')}
                className={`flex-1 py-2 px-3 rounded-md text-sm font-medium ${
                  exportFormat === 'txt'
                    ? isDarkMode 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-blue-500 text-white'
                    : isDarkMode 
                      ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Text
              </button>
            </div>
          </div>
          
          {/* Legal Notice */}
          <div className={`mb-6 p-3 rounded-md text-sm ${
            isDarkMode ? 'bg-blue-900/30 border border-blue-800/50 text-blue-300' : 'bg-blue-50 border border-blue-200 text-blue-700'
          }`}>
            <p>
              {sessionData.isGoverned 
                ? "This export includes a constitutional audit trail required for verified enterprise AI deployment."
                : "This session was conducted without governance oversight. No constitutional audit trail is available."}
            </p>
          </div>
          
          {/* Export Button */}
          <button
            onClick={handleExport}
            className={`w-full py-2 px-4 rounded-md text-sm font-medium flex items-center justify-center ${
              isDarkMode 
                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                : 'bg-blue-500 hover:bg-blue-600 text-white'
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Download Session Report
          </button>
        </div>
      </div>
    </div>
  );
};

export default SessionExport;
