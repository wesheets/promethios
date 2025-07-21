/**
 * Export Utilities for Governance Reports
 * 
 * Provides functions to export agent data as CSV and PDF reports
 */

interface AgentScorecard {
  agentId: string;
  agentName: string;
  agentDescription: string;
  trustScore: number;
  complianceRate: number;
  violationCount: number;
  status: 'active' | 'inactive' | 'suspended';
  type: 'single' | 'multi-agent' | 'native-llm' | 'api-wrapped';
  healthStatus: 'healthy' | 'warning' | 'critical';
  trustLevel: 'low' | 'medium' | 'high';
  provider?: string;
  lastActivity?: Date;
}

/**
 * Export agent data as CSV
 */
export const exportToCSV = (agents: AgentScorecard[], filename: string = 'governance-report') => {
  const headers = [
    'Agent ID',
    'Agent Name',
    'Description',
    'Trust Score',
    'Compliance Rate (%)',
    'Violations',
    'Status',
    'Type',
    'Health Status',
    'Trust Level',
    'Provider',
    'Last Activity'
  ];

  const csvContent = [
    headers.join(','),
    ...agents.map(agent => [
      `"${agent.agentId}"`,
      `"${agent.agentName}"`,
      `"${agent.agentDescription.replace(/"/g, '""')}"`,
      agent.trustScore,
      agent.complianceRate,
      agent.violationCount,
      agent.status,
      agent.type,
      agent.healthStatus,
      agent.trustLevel,
      `"${agent.provider || 'N/A'}"`,
      agent.lastActivity ? `"${agent.lastActivity.toISOString()}"` : 'N/A'
    ].join(','))
  ].join('\n');

  downloadFile(csvContent, `${filename}-${getCurrentTimestamp()}.csv`, 'text/csv');
};

/**
 * Export agent data as JSON
 */
export const exportToJSON = (agents: AgentScorecard[], filename: string = 'governance-report') => {
  const jsonContent = JSON.stringify({
    exportDate: new Date().toISOString(),
    totalAgents: agents.length,
    summary: {
      activeAgents: agents.filter(a => a.status === 'active').length,
      averageTrustScore: Math.round(agents.reduce((sum, a) => sum + a.trustScore, 0) / agents.length),
      averageComplianceRate: Math.round(agents.reduce((sum, a) => sum + a.complianceRate, 0) / agents.length),
      totalViolations: agents.reduce((sum, a) => sum + a.violationCount, 0),
      healthyAgents: agents.filter(a => a.healthStatus === 'healthy').length,
      warningAgents: agents.filter(a => a.healthStatus === 'warning').length,
      criticalAgents: agents.filter(a => a.healthStatus === 'critical').length,
    },
    agents: agents
  }, null, 2);

  downloadFile(jsonContent, `${filename}-${getCurrentTimestamp()}.json`, 'application/json');
};

/**
 * Generate and download PDF report
 */
export const exportToPDF = async (agents: AgentScorecard[], filename: string = 'governance-report') => {
  try {
    // Create HTML content for PDF
    const htmlContent = generatePDFHTML(agents);
    
    // Use browser's print functionality to generate PDF
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      
      // Wait for content to load, then print
      printWindow.onload = () => {
        setTimeout(() => {
          printWindow.print();
          printWindow.close();
        }, 500);
      };
    }
  } catch (error) {
    console.error('Error generating PDF:', error);
    // Fallback to JSON export
    exportToJSON(agents, filename);
  }
};

/**
 * Generate HTML content for PDF report
 */
const generatePDFHTML = (agents: AgentScorecard[]): string => {
  const timestamp = new Date().toLocaleString();
  const summary = {
    total: agents.length,
    active: agents.filter(a => a.status === 'active').length,
    avgTrust: Math.round(agents.reduce((sum, a) => sum + a.trustScore, 0) / agents.length),
    avgCompliance: Math.round(agents.reduce((sum, a) => sum + a.complianceRate, 0) / agents.length),
    totalViolations: agents.reduce((sum, a) => sum + a.violationCount, 0),
    healthy: agents.filter(a => a.healthStatus === 'healthy').length,
    warning: agents.filter(a => a.healthStatus === 'warning').length,
    critical: agents.filter(a => a.healthStatus === 'critical').length,
  };

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Governance Report - ${timestamp}</title>
      <style>
        body { 
          font-family: Arial, sans-serif; 
          margin: 20px; 
          color: #333; 
        }
        .header { 
          text-align: center; 
          margin-bottom: 30px; 
          border-bottom: 2px solid #3182ce; 
          padding-bottom: 20px; 
        }
        .summary { 
          display: grid; 
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); 
          gap: 20px; 
          margin-bottom: 30px; 
        }
        .summary-card { 
          background: #f7fafc; 
          padding: 15px; 
          border-radius: 8px; 
          border-left: 4px solid #3182ce; 
        }
        .summary-card h3 { 
          margin: 0 0 10px 0; 
          color: #2d3748; 
        }
        .summary-card .value { 
          font-size: 24px; 
          font-weight: bold; 
          color: #3182ce; 
        }
        table { 
          width: 100%; 
          border-collapse: collapse; 
          margin-top: 20px; 
        }
        th, td { 
          border: 1px solid #e2e8f0; 
          padding: 8px; 
          text-align: left; 
          font-size: 12px; 
        }
        th { 
          background-color: #3182ce; 
          color: white; 
          font-weight: bold; 
        }
        tr:nth-child(even) { 
          background-color: #f7fafc; 
        }
        .status-active { color: #10b981; font-weight: bold; }
        .status-inactive { color: #6b7280; }
        .status-suspended { color: #ef4444; font-weight: bold; }
        .health-healthy { color: #10b981; }
        .health-warning { color: #f59e0b; }
        .health-critical { color: #ef4444; }
        .trust-high { color: #10b981; }
        .trust-medium { color: #f59e0b; }
        .trust-low { color: #ef4444; }
        @media print {
          body { margin: 0; }
          .no-print { display: none; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>🛡️ Governance Report</h1>
        <p>Generated on ${timestamp}</p>
        <p>Promethios Agent Management System</p>
      </div>

      <div class="summary">
        <div class="summary-card">
          <h3>Total Agents</h3>
          <div class="value">${summary.total}</div>
        </div>
        <div class="summary-card">
          <h3>Active Agents</h3>
          <div class="value">${summary.active}</div>
        </div>
        <div class="summary-card">
          <h3>Average Trust Score</h3>
          <div class="value">${summary.avgTrust}/100</div>
        </div>
        <div class="summary-card">
          <h3>Average Compliance</h3>
          <div class="value">${summary.avgCompliance}%</div>
        </div>
        <div class="summary-card">
          <h3>Total Violations</h3>
          <div class="value">${summary.totalViolations}</div>
        </div>
        <div class="summary-card">
          <h3>Health Status</h3>
          <div style="font-size: 14px;">
            <div style="color: #10b981;">✅ Healthy: ${summary.healthy}</div>
            <div style="color: #f59e0b;">⚠️ Warning: ${summary.warning}</div>
            <div style="color: #ef4444;">❌ Critical: ${summary.critical}</div>
          </div>
        </div>
      </div>

      <h2>Agent Details</h2>
      <table>
        <thead>
          <tr>
            <th>Agent Name</th>
            <th>Type</th>
            <th>Trust Score</th>
            <th>Compliance</th>
            <th>Violations</th>
            <th>Status</th>
            <th>Health</th>
            <th>Trust Level</th>
            <th>Provider</th>
          </tr>
        </thead>
        <tbody>
          ${agents.map(agent => `
            <tr>
              <td><strong>${agent.agentName}</strong><br><small>${agent.agentDescription.substring(0, 50)}${agent.agentDescription.length > 50 ? '...' : ''}</small></td>
              <td>${agent.type.replace('-', ' ')}</td>
              <td>${agent.trustScore}/100</td>
              <td>${agent.complianceRate}%</td>
              <td>${agent.violationCount}</td>
              <td class="status-${agent.status}">${agent.status}</td>
              <td class="health-${agent.healthStatus}">${agent.healthStatus}</td>
              <td class="trust-${agent.trustLevel}">${agent.trustLevel}</td>
              <td>${agent.provider || 'N/A'}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <div style="margin-top: 40px; text-align: center; color: #6b7280; font-size: 12px;">
        <p>This report was generated automatically by the Promethios Governance System</p>
        <p>For questions or concerns, please contact your system administrator</p>
      </div>
    </body>
    </html>
  `;
};

/**
 * Download file helper
 */
const downloadFile = (content: string, filename: string, mimeType: string) => {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Get current timestamp for filename
 */
const getCurrentTimestamp = (): string => {
  const now = new Date();
  return now.toISOString().replace(/[:.]/g, '-').slice(0, 19);
};

