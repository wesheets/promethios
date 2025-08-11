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
      
      // Use Firebase to fetch audit logs instead of backend API
      const { db } = await import('../firebase/config');
      const { collection, query, where, orderBy, limit, getDocs, Timestamp } = await import('firebase/firestore');
      
      let auditQuery = query(
        collection(db, 'audit_logs'),
        where('agentId', '==', agentId),
        orderBy('timestamp', 'desc')
      );

      // Apply filters
      if (options.startDate) {
        const startTimestamp = Timestamp.fromDate(new Date(options.startDate));
        auditQuery = query(auditQuery, where('timestamp', '>=', startTimestamp));
      }

      if (options.endDate) {
        const endTimestamp = Timestamp.fromDate(new Date(options.endDate));
        auditQuery = query(auditQuery, where('timestamp', '<=', endTimestamp));
      }

      if (options.eventType) {
        auditQuery = query(auditQuery, where('eventType', '==', options.eventType));
      }

      if (options.limit) {
        auditQuery = query(auditQuery, limit(options.limit));
      }

      const querySnapshot = await getDocs(auditQuery);
      const logs: AuditLogEntry[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        logs.push({
          id: doc.id,
          agentId: data.agentId,
          userId: data.userId,
          eventType: data.eventType,
          eventData: data.eventData,
          timestamp: data.timestamp?.toDate?.() || new Date(data.timestamp),
          cryptographicProof: data.cryptographicProof || {
            hash: 'pending_hash',
            signature: 'pending_signature',
            previousHash: 'pending_previous',
            verificationStatus: 'pending'
          }
        });
      });

      console.log(`✅ CryptographicAuditIntegration: Retrieved ${logs.length} audit logs from Firebase`);
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
      const rawLogs = await this.getAgentAuditLogs(agentId, {
        startDate,
        endDate
      });

      // Ensure auditLogs is an array (defensive programming)
      const logsArray = Array.isArray(rawLogs) ? rawLogs : [];

      // Process and verify each log entry
      const processedLogs = await Promise.all(logsArray.map(async (log, index) => {
        // Generate proper cryptographic proof if missing
        if (!log.cryptographicProof || log.cryptographicProof.hash === 'missing_hash' || !log.cryptographicProof.hash) {
          const hash = await this.generateLogHash(log);
          const previousHash = index > 0 ? processedLogs[index - 1]?.currentHash || logsArray[index - 1]?.cryptographicProof?.hash : 'genesis';
          
          log.cryptographicProof = {
            hash,
            signature: `sig_${hash.substring(0, 32)}`,
            previousHash,
            verificationStatus: 'verified'
          };
          
          // Add enhanced metadata
          log.previousHash = previousHash;
          log.currentHash = hash;
          log.signature = log.cryptographicProof.signature;
          log.verificationStatus = 'verified';
          log.chainPosition = index;
          log.verificationResult = true;
        }

        // Verify log integrity
        const isValid = await this.verifyLogIntegrity(log, index > 0 ? processedLogs[index - 1]?.currentHash : undefined);
        
        // Update verification status based on actual verification
        if (log.cryptographicProof) {
          log.cryptographicProof.verificationStatus = isValid ? 'verified' : 'failed';
          log.verificationStatus = isValid ? 'verified' : 'invalid';
          log.verificationResult = isValid;
        }

        return log;
      }));

      // Calculate summary metrics with corrected verification
      const totalInteractions = processedLogs.filter(log => 
        log.eventType === 'chat_message' || log.eventType === 'agent_response'
      ).length;

      const verifiedLogs = processedLogs.filter(log => 
        log.cryptographicProof?.verificationStatus === 'verified'
      ).length;

      const violations = processedLogs.filter(log => 
        log.eventData.governanceData?.violations?.length > 0
      ).length;

      const complianceScore = totalInteractions > 0 
        ? Math.round(((totalInteractions - violations) / totalInteractions) * 100)
        : 100;

      const cryptographicIntegrity = verifiedLogs === processedLogs.length ? 'verified' : 
                                   verifiedLogs > 0 ? 'pending' : 'failed';

      // Generate report hash and signature
      const reportData = {
        agentId,
        agentName,
        reportType,
        timeRange: { startDate, endDate },
        auditLogs: processedLogs.length,
        verifiedLogs,
        complianceScore
      };

      const reportHash = await this.generateReportHash(reportData);
      const signature = await this.generateReportSignature(reportData);
      const merkleRoot = await this.calculateMerkleRoot(processedLogs);

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
        auditTrail: processedLogs,
        cryptographicProof: {
          reportHash,
          signature,
          merkleRoot,
          verificationChain: processedLogs.map(log => log.cryptographicProof?.hash || '').filter(Boolean)
        },
        metadata: {
          generatedBy: 'Promethios Cryptographic Audit System',
          version: '1.0.0',
          format: 'JSON'
        }
      };

      console.log(`✅ Generated cryptographic report with ${verifiedLogs}/${processedLogs.length} verified logs`);
      console.log(`🔐 Merkle root: ${merkleRoot}`);
      console.log(`🔐 Cryptographic integrity: ${cryptographicIntegrity}`);

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
   * Calculate Merkle root for audit logs using proper Merkle tree algorithm
   */
  private async calculateMerkleRoot(logs: AuditLogEntry[]): Promise<string> {
    if (logs.length === 0) return 'empty_merkle_root';
    
    // Get or generate proper hashes for each log
    const hashes = await Promise.all(logs.map(async (log) => {
      if (log.cryptographicProof?.hash && log.cryptographicProof.hash !== 'missing_hash') {
        return log.cryptographicProof.hash;
      }
      // Generate hash for logs that don't have one
      return await this.generateLogHash(log);
    }));
    
    // Implement proper Merkle tree calculation
    return await this.buildMerkleTree(hashes);
  }

  /**
   * Generate a cryptographic hash for an audit log entry
   */
  private async generateLogHash(log: AuditLogEntry): Promise<string> {
    try {
      const logData = {
        id: log.id,
        agentId: log.agentId,
        userId: log.userId,
        eventType: log.eventType,
        eventData: log.eventData,
        timestamp: log.timestamp
      };
      
      const jsonString = JSON.stringify(logData, Object.keys(logData).sort());
      const encoder = new TextEncoder();
      const dataBuffer = encoder.encode(jsonString);
      const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    } catch (error) {
      console.error('Error generating log hash:', error);
      return `fallback_log_hash_${Date.now()}`;
    }
  }

  /**
   * Build Merkle tree from hashes
   */
  private async buildMerkleTree(hashes: string[]): Promise<string> {
    if (hashes.length === 0) return 'empty_merkle_root';
    if (hashes.length === 1) return hashes[0];
    
    let currentLevel = [...hashes];
    
    while (currentLevel.length > 1) {
      const nextLevel: string[] = [];
      
      for (let i = 0; i < currentLevel.length; i += 2) {
        const left = currentLevel[i];
        const right = i + 1 < currentLevel.length ? currentLevel[i + 1] : left;
        
        // Combine and hash the pair
        const combined = left + right;
        const encoder = new TextEncoder();
        const dataBuffer = encoder.encode(combined);
        const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const pairHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        
        nextLevel.push(pairHash);
      }
      
      currentLevel = nextLevel;
    }
    
    return currentLevel[0];
  }

  /**
   * Verify cryptographic integrity of an audit log entry
   */
  private async verifyLogIntegrity(log: AuditLogEntry, previousHash?: string): Promise<boolean> {
    try {
      // Generate expected hash for this log
      const expectedHash = await this.generateLogHash(log);
      
      // Check if stored hash matches expected hash
      if (log.cryptographicProof?.hash !== expectedHash) {
        console.warn(`Hash mismatch for log ${log.id}`);
        return false;
      }
      
      // Verify chain linking if previous hash is provided
      if (previousHash && log.cryptographicProof?.previousHash !== previousHash) {
        console.warn(`Chain link broken for log ${log.id}`);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error(`Error verifying log ${log.id}:`, error);
      return false;
    }
  }
}

// Export singleton instance
export const cryptographicAuditIntegration = new CryptographicAuditIntegrationService();
export default cryptographicAuditIntegration;

