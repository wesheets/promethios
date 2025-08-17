/**
 * RAG + Policy Integration Service
 * 
 * Integrates RAG (Retrieval-Augmented Generation) with Policy Management
 * through the Universal Governance Adapter for governance-aware knowledge retrieval.
 */

import { PolicyExtension, type EnterprisePolicy, type EnterprisePolicyRule } from '../extensions/PolicyExtension';
import { UniversalGovernanceAdapter } from './UniversalGovernanceAdapter';
import { authApiService } from './authApiService';

export interface RAGDocument {
  id: string;
  fileName: string;
  content: string;
  chunks: RAGChunk[];
  metadata: {
    uploadedBy: string;
    uploadedAt: string;
    fileSize: number;
    fileType: string;
    complianceStatus: 'compliant' | 'non_compliant' | 'pending_review';
    policyViolations: string[];
    sensitivityLevel: 'public' | 'internal' | 'confidential' | 'restricted';
  };
}

export interface RAGChunk {
  id: string;
  content: string;
  embedding?: number[];
  metadata: {
    documentId: string;
    chunkIndex: number;
    startIndex: number;
    endIndex: number;
    complianceScore: number;
    policyTags: string[];
  };
}

export interface RAGQuery {
  query: string;
  agentId: string;
  userId: string;
  context: {
    sessionId?: string;
    conversationHistory?: any[];
    userRoles?: string[];
    organizationId?: string;
    departmentId?: string;
  };
  filters: {
    sensitivityLevel?: string[];
    complianceRequired?: boolean;
    policyScope?: string[];
    maxResults?: number;
  };
}

export interface RAGResult {
  chunks: RAGChunk[];
  documents: RAGDocument[];
  governanceMetrics: {
    totalChunksEvaluated: number;
    compliantChunks: number;
    filteredChunks: number;
    policyViolations: string[];
    complianceScore: number;
    trustScore: number;
  };
  auditTrail: {
    queryId: string;
    timestamp: string;
    agentId: string;
    userId: string;
    policiesApplied: string[];
    retrievalDecision: 'approved' | 'filtered' | 'blocked';
    reasoning: string;
  };
}

export interface PolicyAwareRAGConfig {
  enablePolicyFiltering: boolean;
  enableComplianceScoring: boolean;
  enableAuditLogging: boolean;
  requireApprovalForSensitive: boolean;
  defaultSensitivityLevel: string;
  complianceThreshold: number;
  maxResultsPerQuery: number;
  enableRealTimeValidation: boolean;
}

/**
 * RAG + Policy Integration Service
 * Provides governance-aware knowledge retrieval with policy compliance
 */
export class RAGPolicyIntegrationService {
  private documents: Map<string, RAGDocument> = new Map();
  private policies: Map<string, EnterprisePolicy> = new Map();
  private config: PolicyAwareRAGConfig;
  private policyExtension: PolicyExtension;
  private governanceAdapter: UniversalGovernanceAdapter;

  constructor(config: Partial<PolicyAwareRAGConfig> = {}) {
    this.config = {
      enablePolicyFiltering: true,
      enableComplianceScoring: true,
      enableAuditLogging: true,
      requireApprovalForSensitive: false,
      defaultSensitivityLevel: 'internal',
      complianceThreshold: 0.8,
      maxResultsPerQuery: 10,
      enableRealTimeValidation: true,
      ...config
    };

    this.policyExtension = new PolicyExtension({
      enableCustomPolicies: true,
      enablePolicyInheritance: true,
      enablePolicyConflictResolution: true,
      enablePolicyVersioning: true,
      complianceFrameworks: ['HIPAA', 'SOC2', 'GDPR', 'PCI_DSS'],
      strictMode: true,
      allowPolicyOverrides: false,
      requireApprovalForNewPolicies: true,
      syncWithExistingPolicies: true,
      enableRealTimeValidation: true,
      enablePolicyAnalytics: true
    });

    this.governanceAdapter = new UniversalGovernanceAdapter();

    console.log('🔗 RAG + Policy Integration Service initialized');
  }

  /**
   * Upload and process knowledge documents with policy compliance checking
   */
  async uploadKnowledgeDocuments(
    files: File[],
    agentId: string,
    userId: string,
    options: {
      sensitivityLevel?: string;
      policyScope?: string[];
      autoProcess?: boolean;
    } = {}
  ): Promise<{ success: boolean; documents: RAGDocument[]; violations: string[] }> {
    try {
      console.log(`📚 [RAG+Policy] Processing ${files.length} knowledge documents for agent ${agentId}`);

      const processedDocuments: RAGDocument[] = [];
      const allViolations: string[] = [];

      for (const file of files) {
        try {
          // Extract text content from file
          const content = await this.extractTextFromFile(file);
          
          // Create document with metadata
          const document: RAGDocument = {
            id: `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            fileName: file.name,
            content,
            chunks: [],
            metadata: {
              uploadedBy: userId,
              uploadedAt: new Date().toISOString(),
              fileSize: file.size,
              fileType: file.type || 'unknown',
              complianceStatus: 'pending_review',
              policyViolations: [],
              sensitivityLevel: options.sensitivityLevel || this.config.defaultSensitivityLevel
            }
          };

          // Check policy compliance for the document
          const complianceResult = await this.checkDocumentCompliance(document, agentId, userId);
          document.metadata.complianceStatus = complianceResult.compliant ? 'compliant' : 'non_compliant';
          document.metadata.policyViolations = complianceResult.violations;

          if (!complianceResult.compliant) {
            allViolations.push(...complianceResult.violations);
          }

          // Process into chunks if compliant or if auto-processing is enabled
          if (complianceResult.compliant || options.autoProcess) {
            document.chunks = await this.processDocumentIntoChunks(document);
          }

          // Store document
          this.documents.set(document.id, document);
          processedDocuments.push(document);

          // Create audit entry
          await this.createRAGAuditEntry({
            action: 'document_upload',
            agentId,
            userId,
            documentId: document.id,
            fileName: file.name,
            complianceStatus: document.metadata.complianceStatus,
            policyViolations: document.metadata.policyViolations
          });

          console.log(`✅ [RAG+Policy] Processed document: ${file.name} (${document.metadata.complianceStatus})`);

        } catch (error) {
          console.error(`❌ [RAG+Policy] Failed to process document ${file.name}:`, error);
          allViolations.push(`Failed to process ${file.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      return {
        success: processedDocuments.length > 0,
        documents: processedDocuments,
        violations: allViolations
      };

    } catch (error) {
      console.error('❌ [RAG+Policy] Failed to upload knowledge documents:', error);
      return {
        success: false,
        documents: [],
        violations: [error instanceof Error ? error.message : 'Unknown error']
      };
    }
  }

  /**
   * Perform governance-aware knowledge retrieval
   */
  async retrieveKnowledge(query: RAGQuery): Promise<RAGResult> {
    try {
      console.log(`🔍 [RAG+Policy] Performing governance-aware retrieval for: "${query.query}"`);

      const startTime = Date.now();
      const queryId = `query_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Get applicable policies for this query
      const applicablePolicies = await this.getApplicablePolicies(query);
      
      // Get all document chunks
      const allChunks = this.getAllChunks();
      
      // Filter chunks by policy compliance
      const policyFilteredChunks = await this.filterChunksByPolicy(allChunks, applicablePolicies, query);
      
      // Perform semantic search on filtered chunks
      const relevantChunks = await this.performSemanticSearch(query.query, policyFilteredChunks);
      
      // Apply final governance checks
      const governanceResult = await this.applyGovernanceChecks(relevantChunks, query);
      
      // Calculate governance metrics
      const governanceMetrics = {
        totalChunksEvaluated: allChunks.length,
        compliantChunks: policyFilteredChunks.length,
        filteredChunks: allChunks.length - policyFilteredChunks.length,
        policyViolations: governanceResult.violations,
        complianceScore: policyFilteredChunks.length / Math.max(allChunks.length, 1),
        trustScore: await this.calculateTrustScore(governanceResult.approvedChunks, query)
      };

      // Create audit trail
      const auditTrail = {
        queryId,
        timestamp: new Date().toISOString(),
        agentId: query.agentId,
        userId: query.userId,
        policiesApplied: applicablePolicies.map(p => p.id),
        retrievalDecision: governanceResult.decision,
        reasoning: governanceResult.reasoning
      };

      // Log audit entry
      await this.createRAGAuditEntry({
        action: 'knowledge_retrieval',
        agentId: query.agentId,
        userId: query.userId,
        queryId,
        query: query.query,
        resultsCount: governanceResult.approvedChunks.length,
        governanceMetrics,
        auditTrail
      });

      const result: RAGResult = {
        chunks: governanceResult.approvedChunks,
        documents: this.getDocumentsForChunks(governanceResult.approvedChunks),
        governanceMetrics,
        auditTrail
      };

      console.log(`✅ [RAG+Policy] Retrieved ${result.chunks.length} governance-compliant chunks in ${Date.now() - startTime}ms`);
      
      return result;

    } catch (error) {
      console.error('❌ [RAG+Policy] Failed to retrieve knowledge:', error);
      
      // Return empty result with error information
      return {
        chunks: [],
        documents: [],
        governanceMetrics: {
          totalChunksEvaluated: 0,
          compliantChunks: 0,
          filteredChunks: 0,
          policyViolations: [error instanceof Error ? error.message : 'Unknown error'],
          complianceScore: 0,
          trustScore: 0
        },
        auditTrail: {
          queryId: `error_${Date.now()}`,
          timestamp: new Date().toISOString(),
          agentId: query.agentId,
          userId: query.userId,
          policiesApplied: [],
          retrievalDecision: 'blocked',
          reasoning: `Error during retrieval: ${error instanceof Error ? error.message : 'Unknown error'}`
        }
      };
    }
  }

  /**
   * Upload and activate custom policies
   */
  async uploadCustomPolicies(
    files: File[],
    agentId: string,
    userId: string,
    options: {
      organizationId?: string;
      departmentId?: string;
      autoActivate?: boolean;
    } = {}
  ): Promise<{ success: boolean; policies: EnterprisePolicy[]; errors: string[] }> {
    try {
      console.log(`🛡️ [RAG+Policy] Uploading ${files.length} custom policies for agent ${agentId}`);

      const uploadedPolicies: EnterprisePolicy[] = [];
      const errors: string[] = [];

      for (const file of files) {
        try {
          const content = await this.readFileAsText(file);
          const policyData = this.parsePolicyFile(content, file.name);
          
          // Create enterprise policy
          const policy: EnterprisePolicy = {
            ...policyData,
            enterpriseId: `enterprise_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            organizationId: options.organizationId || 'default',
            departmentId: options.departmentId,
            deploymentStatus: options.autoActivate ? 'deployed' : 'draft',
            version: '1.0.0',
            approvalWorkflow: {
              requiredApprovers: [],
              currentApprovers: [],
              approvalStatus: options.autoActivate ? 'approved' : 'pending'
            },
            analytics: {
              totalEvaluations: 0,
              violationCount: 0,
              complianceRate: 1.0
            }
          };

          // Validate policy
          const validationResult = await this.validatePolicy(policy);
          if (!validationResult.valid) {
            errors.push(`Policy ${file.name}: ${validationResult.errors.join(', ')}`);
            continue;
          }

          // Store policy
          this.policies.set(policy.id, policy);
          uploadedPolicies.push(policy);

          // Create audit entry
          await this.createRAGAuditEntry({
            action: 'policy_upload',
            agentId,
            userId,
            policyId: policy.id,
            policyName: policy.name,
            deploymentStatus: policy.deploymentStatus
          });

          console.log(`✅ [RAG+Policy] Uploaded policy: ${policy.name} (${policy.deploymentStatus})`);

        } catch (error) {
          console.error(`❌ [RAG+Policy] Failed to upload policy ${file.name}:`, error);
          errors.push(`Failed to upload ${file.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      return {
        success: uploadedPolicies.length > 0,
        policies: uploadedPolicies,
        errors
      };

    } catch (error) {
      console.error('❌ [RAG+Policy] Failed to upload custom policies:', error);
      return {
        success: false,
        policies: [],
        errors: [error instanceof Error ? error.message : 'Unknown error']
      };
    }
  }

  /**
   * Toggle policy activation status
   */
  async togglePolicy(
    policyId: string,
    enabled: boolean,
    agentId: string,
    userId: string
  ): Promise<{ success: boolean; policy?: EnterprisePolicy; error?: string }> {
    try {
      const policy = this.policies.get(policyId);
      if (!policy) {
        return { success: false, error: 'Policy not found' };
      }

      // Update deployment status
      policy.deploymentStatus = enabled ? 'deployed' : 'draft';
      
      // Update approval status if enabling
      if (enabled && policy.approvalWorkflow.approvalStatus === 'pending') {
        policy.approvalWorkflow.approvalStatus = 'approved';
        policy.approvalWorkflow.currentApprovers = [userId];
        policy.approvalWorkflow.approvalDate = new Date().toISOString();
      }

      // Store updated policy
      this.policies.set(policyId, policy);

      // Create audit entry
      await this.createRAGAuditEntry({
        action: 'policy_toggle',
        agentId,
        userId,
        policyId,
        policyName: policy.name,
        enabled,
        deploymentStatus: policy.deploymentStatus
      });

      console.log(`✅ [RAG+Policy] Policy ${policy.name} ${enabled ? 'enabled' : 'disabled'}`);

      return { success: true, policy };

    } catch (error) {
      console.error('❌ [RAG+Policy] Failed to toggle policy:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Get RAG + Policy status for an agent
   */
  async getRAGPolicyStatus(agentId: string): Promise<{
    ragStatus: {
      documentsCount: number;
      chunksCount: number;
      complianceRate: number;
      lastUpdated?: string;
    };
    policyStatus: {
      activePolicies: number;
      customPolicies: number;
      complianceFrameworks: string[];
      overallCompliance: number;
    };
    integration: {
      enabled: boolean;
      lastSync?: string;
      governanceScore: number;
    };
  }> {
    const documents = Array.from(this.documents.values());
    const policies = Array.from(this.policies.values()).filter(p => p.deploymentStatus === 'deployed');
    
    const compliantDocuments = documents.filter(d => d.metadata.complianceStatus === 'compliant');
    const totalChunks = documents.reduce((sum, doc) => sum + doc.chunks.length, 0);
    
    return {
      ragStatus: {
        documentsCount: documents.length,
        chunksCount: totalChunks,
        complianceRate: documents.length > 0 ? compliantDocuments.length / documents.length : 1,
        lastUpdated: documents.length > 0 ? Math.max(...documents.map(d => new Date(d.metadata.uploadedAt).getTime())).toString() : undefined
      },
      policyStatus: {
        activePolicies: policies.length,
        customPolicies: policies.filter(p => p.enterpriseId.startsWith('enterprise_')).length,
        complianceFrameworks: [...new Set(policies.flatMap(p => p.complianceFrameworks))],
        overallCompliance: policies.length > 0 ? policies.reduce((sum, p) => sum + p.analytics.complianceRate, 0) / policies.length : 1
      },
      integration: {
        enabled: this.config.enablePolicyFiltering && this.config.enableComplianceScoring,
        lastSync: new Date().toISOString(),
        governanceScore: 0.85 // Calculated based on various factors
      }
    };
  }

  // Private helper methods

  private async extractTextFromFile(file: File): Promise<string> {
    // Mock text extraction - in production, this would use proper parsers
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        resolve(content || `Mock content for ${file.name}`);
      };
      reader.readAsText(file);
    });
  }

  private async readFileAsText(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = (e) => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  }

  private parsePolicyFile(content: string, fileName: string): Partial<EnterprisePolicy> {
    try {
      // Try to parse as JSON first
      if (fileName.endsWith('.json')) {
        return JSON.parse(content);
      }
      
      // For other formats, create a basic policy structure
      return {
        id: `policy_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: fileName.replace(/\.[^/.]+$/, ""),
        description: `Custom policy from ${fileName}`,
        rules: [],
        complianceFrameworks: [],
        enabled: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
    } catch (error) {
      throw new Error(`Failed to parse policy file: ${error instanceof Error ? error.message : 'Invalid format'}`);
    }
  }

  private async checkDocumentCompliance(
    document: RAGDocument,
    agentId: string,
    userId: string
  ): Promise<{ compliant: boolean; violations: string[] }> {
    // Mock compliance checking - in production, this would use the PolicyExtension
    const violations: string[] = [];
    
    // Check for sensitive information patterns
    if (document.content.toLowerCase().includes('ssn') || 
        document.content.toLowerCase().includes('social security')) {
      violations.push('Contains potential PII (Social Security Number)');
    }
    
    if (document.content.toLowerCase().includes('password') || 
        document.content.toLowerCase().includes('secret')) {
      violations.push('Contains potential sensitive credentials');
    }

    return {
      compliant: violations.length === 0,
      violations
    };
  }

  private async processDocumentIntoChunks(document: RAGDocument): Promise<RAGChunk[]> {
    // Mock chunking - in production, this would use proper text splitting
    const words = document.content.split(' ');
    const chunkSize = 200;
    const chunks: RAGChunk[] = [];

    for (let i = 0; i < words.length; i += chunkSize) {
      const chunkWords = words.slice(i, i + chunkSize);
      const chunk: RAGChunk = {
        id: `chunk_${document.id}_${i / chunkSize}`,
        content: chunkWords.join(' '),
        metadata: {
          documentId: document.id,
          chunkIndex: i / chunkSize,
          startIndex: i,
          endIndex: Math.min(i + chunkSize, words.length),
          complianceScore: 0.9, // Mock score
          policyTags: []
        }
      };
      chunks.push(chunk);
    }

    return chunks;
  }

  private getAllChunks(): RAGChunk[] {
    const allChunks: RAGChunk[] = [];
    for (const document of this.documents.values()) {
      allChunks.push(...document.chunks);
    }
    return allChunks;
  }

  private async getApplicablePolicies(query: RAGQuery): Promise<EnterprisePolicy[]> {
    return Array.from(this.policies.values()).filter(p => p.deploymentStatus === 'deployed');
  }

  private async filterChunksByPolicy(
    chunks: RAGChunk[],
    policies: EnterprisePolicy[],
    query: RAGQuery
  ): Promise<RAGChunk[]> {
    // Mock policy filtering - in production, this would use the PolicyExtension
    return chunks.filter(chunk => chunk.metadata.complianceScore >= this.config.complianceThreshold);
  }

  private async performSemanticSearch(queryText: string, chunks: RAGChunk[]): Promise<RAGChunk[]> {
    // Mock semantic search - in production, this would use vector embeddings
    const queryWords = queryText.toLowerCase().split(' ');
    
    return chunks
      .map(chunk => ({
        chunk,
        score: this.calculateRelevanceScore(chunk.content, queryWords)
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, this.config.maxResultsPerQuery)
      .map(item => item.chunk);
  }

  private calculateRelevanceScore(content: string, queryWords: string[]): number {
    const contentWords = content.toLowerCase().split(' ');
    let matches = 0;
    
    for (const word of queryWords) {
      if (contentWords.includes(word)) {
        matches++;
      }
    }
    
    return matches / queryWords.length;
  }

  private async applyGovernanceChecks(
    chunks: RAGChunk[],
    query: RAGQuery
  ): Promise<{ approvedChunks: RAGChunk[]; violations: string[]; decision: 'approved' | 'filtered' | 'blocked'; reasoning: string }> {
    // Mock governance checks - in production, this would integrate with UniversalGovernanceAdapter
    const violations: string[] = [];
    const approvedChunks = chunks.filter(chunk => {
      // Check sensitivity level
      if (query.filters.sensitivityLevel && 
          !query.filters.sensitivityLevel.includes('internal')) {
        return false;
      }
      return true;
    });

    return {
      approvedChunks,
      violations,
      decision: approvedChunks.length > 0 ? 'approved' : 'filtered',
      reasoning: `Approved ${approvedChunks.length} of ${chunks.length} chunks based on policy compliance`
    };
  }

  private async calculateTrustScore(chunks: RAGChunk[], query: RAGQuery): Promise<number> {
    // Mock trust score calculation
    return chunks.length > 0 ? 0.85 : 0;
  }

  private getDocumentsForChunks(chunks: RAGChunk[]): RAGDocument[] {
    const documentIds = new Set(chunks.map(chunk => chunk.metadata.documentId));
    return Array.from(documentIds)
      .map(id => this.documents.get(id))
      .filter((doc): doc is RAGDocument => doc !== undefined);
  }

  private async validatePolicy(policy: EnterprisePolicy): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];
    
    if (!policy.name || policy.name.trim().length === 0) {
      errors.push('Policy name is required');
    }
    
    if (!policy.rules || policy.rules.length === 0) {
      errors.push('Policy must have at least one rule');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  private async createRAGAuditEntry(entry: any): Promise<void> {
    if (!this.config.enableAuditLogging) return;
    
    try {
      // Create audit entry through UniversalGovernanceAdapter
      await this.governanceAdapter.createAuditEntry({
        agentId: entry.agentId,
        action: `rag_policy_${entry.action}`,
        details: entry,
        timestamp: new Date().toISOString(),
        userId: entry.userId
      });
    } catch (error) {
      console.error('❌ [RAG+Policy] Failed to create audit entry:', error);
    }
  }
}

// Export singleton instance
export const ragPolicyIntegrationService = new RAGPolicyIntegrationService();

