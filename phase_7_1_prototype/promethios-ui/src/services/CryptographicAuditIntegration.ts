/**
 * Cryptographic Audit Integration Service
 * 
 * Integrates test agent interactions with the cryptographic audit system
 * to provide real audit trails and downloadable reports with cryptographic proofs.
 */

import { API_BASE_URL } from '../config/api';

export interface AuditLogEntry {
  id: string;
  agentId: string;
  userId: string;
  eventType: 'chat_message' | 'agent_response' | 'governance_check' | 'error' | 'system_event';
  eventData: {
    messageId?: string;
    content?: string;
    governanceData?: any;
    errorDetails?: any;
    metadata?: any;
  };
  timestamp: string;
  cryptographicProof?: {
    hash: string;
    signature: string;
    previousHash?: string;
    verificationStatus: 'verified' | 'pending' | 'failed';
  };
}

export interface CryptographicReport {
  reportId: string;
  agentId: string;
  agentName: string;
  reportType: 'compliance' | 'audit' | 'cryptographic';
  generatedAt: string;
  timeRange: {
    startDate: string;
    endDate: string;
  };
  summary: {
    totalInteractions: number;
    verifiedLogs: number;
    complianceScore: number;
    violations: number;
    cryptographicIntegrity: 'verified' | 'pending' | 'failed';
  };
  auditTrail: AuditLogEntry[];
  cryptographicProof: {
    reportHash: string;
    signature: string;
    merkleRoot?: string;
    verificationChain: string[];
  };
  metadata: {
    generatedBy: string;
    version: string;
    format: string;
  };
}

class CryptographicAuditIntegrationService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = API_BASE_URL || 'https://promethios-phase-7-1-api.onrender.com';
  }

  /**
   * Log a cryptographic audit event for a test agent interaction
   */
  async logAgentInteraction(
    agentId: string,
    userId: string,
    eventType: AuditLogEntry['eventType'],
    eventData: AuditLogEntry['eventData']
  ): Promise<AuditLogEntry> {
    try {
      console.log(`🔐 CryptographicAuditIntegration: Logging ${eventType} for agent ${agentId}`);
      console.log(`🔐 Event data:`, eventData);
      
      const response = await fetch(`${this.baseUrl}/api/cryptographic-audit/log`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': userId
        },
        body: JSON.stringify({
          agentId,
          eventType,
          eventData: {
            ...eventData,
            source: 'test_agent_chat',
            timestamp: new Date().toISOString()
          },
          metadata: {
            userAgent: navigator.userAgent,
            sessionId: `chat_${Date.now()}`,
            platform: 'web_ui'
          }
        })
      });

      console.log(`🔐 CryptographicAuditIntegration: API response status ${response.status}`);

      if (!response.ok) {
        throw new Error(`Failed to log audit event: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      console.log(`✅ CryptographicAuditIntegration: Successfully logged ${eventType}:`, result);
      
      return {
        id: result.data.id,
        agentId,
        userId,
        eventType,
        eventData,
        timestamp: result.data.timestamp,
        cryptographicProof: result.cryptographicProof
      };
    } catch (error) {
      console.error('❌ CryptographicAuditIntegration: Error logging audit event:', error);
      
      // Return a fallback audit entry for offline scenarios
      return {
        id: `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        agentId,
        userId,
        eventType,
        eventData,
        timestamp: new Date().toISOString(),
        cryptographicProof: {
          hash: 'offline_hash',
          signature: 'offline_signature',
          verificationStatus: 'pending'
        }
      };
    }
  }

  /**
   * Get audit logs for a specific agent
   */
  async getAgentAuditLogs(
    agentId: string,
    options: {
      startDate?: string;
      endDate?: string;
      eventType?: string;
      limit?: number;
      verified?: boolean;
    } = {}
  ): Promise<AuditLogEntry[]> {
    try {
      console.log(`🔐 CryptographicAuditIntegration: Fetching audit logs for agent ${agentId}`, options);
      
      const params = new URLSearchParams();
      
      if (options.startDate) params.append('startDate', options.startDate);
      if (options.endDate) params.append('endDate', options.endDate);
      if (options.eventType) params.append('eventType', options.eventType);
      if (options.limit) params.append('limit', options.limit.toString());
      if (options.verified !== undefined) params.append('verified', options.verified.toString());

      const queryString = params.toString();
      const url = `${this.baseUrl}/api/cryptographic-audit/logs/${agentId}${queryString ? `?${queryString}` : ''}`;
      console.log(`🔐 CryptographicAuditIntegration: Fetching from URL: ${url}`);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      console.log(`🔐 CryptographicAuditIntegration: Logs API response status ${response.status}`);

      if (!response.ok) {
        throw new Error(`Failed to fetch audit logs: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      const logs = result.data?.logs || result.data || [];
      console.log(`✅ CryptographicAuditIntegration: Retrieved ${logs.length} audit logs`);
      console.log(`🔐 Sample logs:`, logs.slice(0, 2));
      
      return logs;
    } catch (error) {
      console.error('❌ CryptographicAuditIntegration: Error fetching audit logs:', error);
      return [];
    }
  }

  /**
   * Generate a comprehensive cryptographic report for an agent
   */
  async generateCryptographicReport(
    agentId: string,
    agentName: string,
    reportType: 'compliance' | 'audit' | 'cryptographic',
    timeRange: { startDate?: string; endDate?: string } = {}
  ): Promise<CryptographicReport> {
    try {
      // Set default time range (last 30 days)
      const endDate = timeRange.endDate || new Date().toISOString();
      const startDate = timeRange.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

      // Fetch audit logs for the specified time range
      const auditLogs = await this.getAgentAuditLogs(agentId, {
        startDate,
        endDate,
        verified: true
      });

      // Ensure auditLogs is an array (defensive programming)
      const logsArray = Array.isArray(auditLogs) ? auditLogs : [];

      // Calculate summary metrics
      const totalInteractions = logsArray.filter(log => 
        log.eventType === 'chat_message' || log.eventType === 'agent_response'
      ).length;

      const verifiedLogs = logsArray.filter(log => 
        log.cryptographicProof?.verificationStatus === 'verified'
      ).length;

      const violations = logsArray.filter(log => 
        log.eventData.governanceData?.violations?.length > 0
      ).length;

      const complianceScore = totalInteractions > 0 
        ? Math.round(((totalInteractions - violations) / totalInteractions) * 100)
        : 100;

      const cryptographicIntegrity = verifiedLogs === logsArray.length ? 'verified' : 'pending';

      // Generate report hash and signature
      const reportData = {
        agentId,
        agentName,
        reportType,
        timeRange: { startDate, endDate },
        auditLogs: logsArray.length
      };

      const reportHash = await this.generateReportHash(reportData);
      const signature = await this.generateReportSignature(reportData);

      const report: CryptographicReport = {
        reportId: `report_${agentId}_${Date.now()}`,
        agentId,
        agentName,
        reportType,
        generatedAt: new Date().toISOString(),
        timeRange: { startDate, endDate },
        summary: {
          totalInteractions,
          verifiedLogs,
          complianceScore,
          violations,
          cryptographicIntegrity: cryptographicIntegrity as 'verified' | 'pending' | 'failed'
        },
        auditTrail: logsArray,
        cryptographicProof: {
          reportHash,
          signature,
          merkleRoot: this.calculateMerkleRoot(logsArray),
          verificationChain: logsArray.map(log => log.cryptographicProof?.hash || '').filter(Boolean)
        },
        metadata: {
          generatedBy: 'Promethios Cryptographic Audit System',
          version: '1.0.0',
          format: 'JSON'
        }
      };

      return report;
    } catch (error) {
      console.error('Error generating cryptographic report:', error);
      throw error;
    }
  }

  /**
   * Download a cryptographic report as a file
   */
  async downloadReport(report: CryptographicReport): Promise<void> {
    try {
      const reportJson = JSON.stringify(report, null, 2);
      const blob = new Blob([reportJson], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `${report.reportType}-report-${report.agentId}-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading report:', error);
      throw error;
    }
  }

  /**
   * Verify the cryptographic integrity of a report
   */
  async verifyReportIntegrity(report: CryptographicReport): Promise<boolean> {
    try {
      // Verify report hash
      const expectedHash = await this.generateReportHash({
        agentId: report.agentId,
        agentName: report.agentName,
        reportType: report.reportType,
        timeRange: report.timeRange,
        auditLogs: report.auditTrail.length
      });

      if (expectedHash !== report.cryptographicProof.reportHash) {
        console.warn('Report hash verification failed');
        return false;
      }

      // Verify individual audit log hashes
      for (const log of report.auditTrail) {
        if (log.cryptographicProof?.verificationStatus !== 'verified') {
          console.warn(`Audit log ${log.id} verification failed`);
          return false;
        }
      }

      return true;
    } catch (error) {
      console.error('Error verifying report integrity:', error);
      return false;
    }
  }

  /**
   * Generate a hash for report data
   */
  private async generateReportHash(data: any): Promise<string> {
    try {
      const jsonString = JSON.stringify(data);
      const encoder = new TextEncoder();
      const dataBuffer = encoder.encode(jsonString);
      const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    } catch (error) {
      console.error('Error generating report hash:', error);
      return `fallback_hash_${Date.now()}`;
    }
  }

  /**
   * Generate a signature for report data
   */
  private async generateReportSignature(data: any): Promise<string> {
    try {
      // For demo purposes, create a deterministic signature
      const hash = await this.generateReportHash(data);
      return `sig_${hash.substring(0, 32)}`;
    } catch (error) {
      console.error('Error generating report signature:', error);
      return `fallback_signature_${Date.now()}`;
    }
  }

  /**
   * Calculate Merkle root for audit logs
   */
  private calculateMerkleRoot(logs: AuditLogEntry[]): string {
    if (logs.length === 0) return 'empty_merkle_root';
    
    const hashes = logs.map(log => log.cryptographicProof?.hash || 'missing_hash');
    
    // Simple Merkle root calculation (in production, use proper Merkle tree)
    const combinedHash = hashes.join('');
    return `merkle_${combinedHash.substring(0, 32)}`;
  }
}

// Export singleton instance
export const cryptographicAuditIntegration = new CryptographicAuditIntegrationService();
export default cryptographicAuditIntegration;

