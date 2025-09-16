/**
 * Policy-Aware RAG Service
 * 
 * Intelligent document processing that validates content against policies
 * before adding to agent knowledge bases. Ensures compliance and security.
 */

import { customPolicyService, type CustomPolicy } from './CustomPolicyService';
import { unifiedStorage } from './UnifiedStorageService';

export interface DocumentMetadata {
  id: string;
  agentId: string;
  userId: string;
  filename: string;
  fileType: string;
  fileSize: number;
  uploadedAt: string;
  processedAt?: string;
  status: 'uploading' | 'processing' | 'processed' | 'failed' | 'policy_violation';
  policyCompliant: boolean;
  complianceScore: number;
  violations: string[];
  warnings: string[];
  tags: string[];
  category: 'general' | 'technical' | 'legal' | 'financial' | 'hr' | 'marketing' | 'proprietary';
  accessLevel: 'public' | 'internal' | 'confidential' | 'restricted';
  source: 'upload' | 'api' | 'integration' | 'manual';
  extractedText?: string;
  summary?: string;
  keyTopics?: string[];
  relatedDocuments?: string[];
}

export interface KnowledgeBase {
  id: string;
  agentId: string;
  userId: string;
  name: string;
  description: string;
  documents: DocumentMetadata[];
  totalDocuments: number;
  totalSize: number;
  lastUpdated: string;
  policySettings: {
    requireCompliance: boolean;
    allowedCategories: string[];
    maxAccessLevel: string;
    customPolicies: string[];
  };
  searchSettings: {
    enableSemanticSearch: boolean;
    enableKeywordSearch: boolean;
    maxResults: number;
    relevanceThreshold: number;
  };
}

export interface SearchResult {
  documentId: string;
  filename: string;
  relevanceScore: number;
  snippet: string;
  category: string;
  accessLevel: string;
  policyCompliant: boolean;
  lastUpdated: string;
  highlights: string[];
}

export interface ComplianceReport {
  agentId: string;
  totalDocuments: number;
  compliantDocuments: number;
  violationCount: number;
  complianceRate: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  topViolations: Array<{
    type: string;
    count: number;
    severity: string;
  }>;
  recommendations: string[];
  lastAudit: string;
}

class PolicyAwareRAGService {
  private readonly KNOWLEDGE_BASES_PREFIX = 'knowledge_bases';
  private readonly DOCUMENTS_PREFIX = 'documents';
  private readonly SEARCH_INDEX_PREFIX = 'search_index';

  /**
   * Upload and process document with policy validation
   */
  async uploadDocument(
    userId: string,
    agentId: string,
    file: File,
    options: {
      category?: string;
      accessLevel?: string;
      tags?: string[];
      knowledgeBaseId?: string;
    } = {}
  ): Promise<DocumentMetadata> {
    try {
      console.log('📄 Starting policy-aware document upload:', file.name);

      // Create document metadata
      const documentId = `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const metadata: DocumentMetadata = {
        id: documentId,
        agentId,
        userId,
        filename: file.name,
        fileType: file.type || 'unknown',
        fileSize: file.size,
        uploadedAt: new Date().toISOString(),
        status: 'uploading',
        policyCompliant: false,
        complianceScore: 0,
        violations: [],
        warnings: [],
        tags: options.tags || [],
        category: (options.category as any) || 'general',
        accessLevel: (options.accessLevel as any) || 'internal',
        source: 'upload'
      };

      // Extract text content from file
      const extractedText = await this.extractTextFromFile(file);
      metadata.extractedText = extractedText;
      metadata.status = 'processing';

      // Validate against policies
      const policyValidation = await customPolicyService.validateContent(
        userId,
        agentId,
        extractedText,
        {
          filename: file.name,
          fileType: file.type,
          category: metadata.category,
          accessLevel: metadata.accessLevel
        }
      );

      // Update metadata with policy results
      metadata.policyCompliant = policyValidation.isValid;
      metadata.violations = policyValidation.violations.map(v => v.description);
      metadata.warnings = policyValidation.warnings;
      metadata.complianceScore = policyValidation.isValid ? 100 : Math.max(0, 100 - (policyValidation.violations.length * 20));

      if (!policyValidation.isValid) {
        metadata.status = 'policy_violation';
        console.warn('⚠️ Document failed policy validation:', metadata.violations);
      } else {
        // Generate summary and topics
        metadata.summary = await this.generateDocumentSummary(extractedText);
        metadata.keyTopics = await this.extractKeyTopics(extractedText);
        metadata.status = 'processed';
        metadata.processedAt = new Date().toISOString();
      }

      // Store document metadata
      const storageKey = `${userId}_${agentId}_${documentId}`;
      await unifiedStorage.setItem(this.DOCUMENTS_PREFIX, storageKey, metadata);

      // Add to knowledge base if specified and compliant
      if (options.knowledgeBaseId && metadata.policyCompliant) {
        await this.addDocumentToKnowledgeBase(userId, agentId, options.knowledgeBaseId, documentId);
      }

      // Create search index entry if compliant
      if (metadata.policyCompliant) {
        await this.indexDocument(metadata);
      }

      console.log('✅ Document processed successfully:', metadata);
      return metadata;

    } catch (error) {
      console.error('❌ Document upload failed:', error);
      throw error;
    }
  }

  /**
   * Extract text content from various file types
   */
  private async extractTextFromFile(file: File): Promise<string> {
    try {
      if (file.type.startsWith('text/')) {
        return await file.text();
      }

      if (file.type === 'application/json') {
        const jsonContent = await file.text();
        return JSON.stringify(JSON.parse(jsonContent), null, 2);
      }

      // For other file types, return basic info
      // In production, integrate with document parsing services
      return `Document: ${file.name}\nType: ${file.type}\nSize: ${file.size} bytes\nUploaded: ${new Date().toISOString()}`;

    } catch (error) {
      console.error('❌ Text extraction failed:', error);
      return `Failed to extract text from ${file.name}`;
    }
  }

  /**
   * Generate document summary using AI
   */
  private async generateDocumentSummary(text: string): Promise<string> {
    try {
      // Simple extractive summary for demo
      const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 20);
      const summary = sentences.slice(0, 3).join('. ').trim();
      return summary || 'Document summary not available';
    } catch (error) {
      console.error('❌ Summary generation failed:', error);
      return 'Summary generation failed';
    }
  }

  /**
   * Extract key topics from document
   */
  private async extractKeyTopics(text: string): Promise<string[]> {
    try {
      // Simple keyword extraction for demo
      const words = text.toLowerCase()
        .replace(/[^\w\s]/g, ' ')
        .split(/\s+/)
        .filter(word => word.length > 4);

      const wordCount = words.reduce((acc, word) => {
        acc[word] = (acc[word] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      return Object.entries(wordCount)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10)
        .map(([word]) => word);

    } catch (error) {
      console.error('❌ Topic extraction failed:', error);
      return [];
    }
  }

  /**
   * Create search index for document
   */
  private async indexDocument(metadata: DocumentMetadata): Promise<void> {
    try {
      const indexEntry = {
        documentId: metadata.id,
        agentId: metadata.agentId,
        userId: metadata.userId,
        filename: metadata.filename,
        category: metadata.category,
        accessLevel: metadata.accessLevel,
        tags: metadata.tags,
        keyTopics: metadata.keyTopics || [],
        summary: metadata.summary || '',
        extractedText: metadata.extractedText || '',
        lastUpdated: metadata.processedAt || metadata.uploadedAt
      };

      const indexKey = `${metadata.userId}_${metadata.agentId}_${metadata.id}`;
      await unifiedStorage.setItem(this.SEARCH_INDEX_PREFIX, indexKey, indexEntry);

      console.log('🔍 Document indexed for search:', metadata.filename);
    } catch (error) {
      console.error('❌ Document indexing failed:', error);
    }
  }

  /**
   * Search knowledge base with policy filtering
   */
  async searchKnowledge(
    userId: string,
    agentId: string,
    query: string,
    options: {
      maxResults?: number;
      categories?: string[];
      accessLevels?: string[];
      requireCompliance?: boolean;
    } = {}
  ): Promise<SearchResult[]> {
    try {
      console.log('🔍 Searching knowledge base:', query);

      // Get all indexed documents for this agent
      const allIndexes = await unifiedStorage.getAllItems(this.SEARCH_INDEX_PREFIX);
      const agentIndexes = Object.entries(allIndexes)
        .filter(([key, _]) => key.startsWith(`${userId}_${agentId}_`))
        .map(([_, index]) => index as any);

      // Filter by policy compliance if required
      let filteredIndexes = agentIndexes;
      if (options.requireCompliance !== false) {
        const documents = await this.getDocumentsForAgent(userId, agentId);
        const compliantDocIds = documents
          .filter(doc => doc.policyCompliant)
          .map(doc => doc.id);
        
        filteredIndexes = agentIndexes.filter(index => 
          compliantDocIds.includes(index.documentId)
        );
      }

      // Filter by categories and access levels
      if (options.categories?.length) {
        filteredIndexes = filteredIndexes.filter(index =>
          options.categories!.includes(index.category)
        );
      }

      if (options.accessLevels?.length) {
        filteredIndexes = filteredIndexes.filter(index =>
          options.accessLevels!.includes(index.accessLevel)
        );
      }

      // Perform search (simple text matching for demo)
      const queryLower = query.toLowerCase();
      const results: SearchResult[] = filteredIndexes
        .map(index => {
          const textContent = `${index.filename} ${index.summary} ${index.extractedText}`.toLowerCase();
          const relevanceScore = this.calculateRelevanceScore(queryLower, textContent);
          
          if (relevanceScore === 0) return null;

          const snippet = this.extractSnippet(index.extractedText || index.summary, queryLower);
          const highlights = this.findHighlights(snippet, queryLower);

          return {
            documentId: index.documentId,
            filename: index.filename,
            relevanceScore,
            snippet,
            category: index.category,
            accessLevel: index.accessLevel,
            policyCompliant: true, // Already filtered for compliance
            lastUpdated: index.lastUpdated,
            highlights
          };
        })
        .filter(Boolean) as SearchResult[]
        .sort((a, b) => b.relevanceScore - a.relevanceScore)
        .slice(0, options.maxResults || 10);

      console.log(`✅ Found ${results.length} search results`);
      return results;

    } catch (error) {
      console.error('❌ Knowledge search failed:', error);
      return [];
    }
  }

  /**
   * Calculate relevance score for search
   */
  private calculateRelevanceScore(query: string, content: string): number {
    const queryWords = query.split(/\s+/).filter(word => word.length > 2);
    let score = 0;

    queryWords.forEach(word => {
      const regex = new RegExp(word, 'gi');
      const matches = content.match(regex);
      if (matches) {
        score += matches.length;
      }
    });

    return score;
  }

  /**
   * Extract relevant snippet from content
   */
  private extractSnippet(content: string, query: string): string {
    const sentences = content.split(/[.!?]+/);
    const queryWords = query.split(/\s+/);
    
    // Find sentence with most query words
    let bestSentence = sentences[0] || '';
    let maxMatches = 0;

    sentences.forEach(sentence => {
      const matches = queryWords.filter(word => 
        sentence.toLowerCase().includes(word.toLowerCase())
      ).length;
      
      if (matches > maxMatches) {
        maxMatches = matches;
        bestSentence = sentence;
      }
    });

    return bestSentence.trim().substring(0, 200) + (bestSentence.length > 200 ? '...' : '');
  }

  /**
   * Find highlighted terms in snippet
   */
  private findHighlights(snippet: string, query: string): string[] {
    const queryWords = query.split(/\s+/).filter(word => word.length > 2);
    const highlights: string[] = [];

    queryWords.forEach(word => {
      const regex = new RegExp(`\\b${word}\\b`, 'gi');
      const matches = snippet.match(regex);
      if (matches) {
        highlights.push(...matches);
      }
    });

    return [...new Set(highlights)]; // Remove duplicates
  }

  /**
   * Get all documents for an agent
   */
  async getDocumentsForAgent(userId: string, agentId: string): Promise<DocumentMetadata[]> {
    try {
      const allDocuments = await unifiedStorage.getAllItems(this.DOCUMENTS_PREFIX);
      
      const agentDocuments = Object.entries(allDocuments)
        .filter(([key, _]) => key.startsWith(`${userId}_${agentId}_`))
        .map(([_, doc]) => doc as DocumentMetadata)
        .sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());

      return agentDocuments;
    } catch (error) {
      console.error('❌ Failed to get agent documents:', error);
      return [];
    }
  }

  /**
   * Create knowledge base
   */
  async createKnowledgeBase(
    userId: string,
    agentId: string,
    name: string,
    description: string,
    settings: Partial<KnowledgeBase['policySettings']> = {}
  ): Promise<KnowledgeBase> {
    try {
      const knowledgeBaseId = `kb_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const knowledgeBase: KnowledgeBase = {
        id: knowledgeBaseId,
        agentId,
        userId,
        name,
        description,
        documents: [],
        totalDocuments: 0,
        totalSize: 0,
        lastUpdated: new Date().toISOString(),
        policySettings: {
          requireCompliance: true,
          allowedCategories: ['general', 'technical', 'marketing'],
          maxAccessLevel: 'internal',
          customPolicies: [],
          ...settings
        },
        searchSettings: {
          enableSemanticSearch: true,
          enableKeywordSearch: true,
          maxResults: 20,
          relevanceThreshold: 0.1
        }
      };

      const storageKey = `${userId}_${agentId}_${knowledgeBaseId}`;
      await unifiedStorage.setItem(this.KNOWLEDGE_BASES_PREFIX, storageKey, knowledgeBase);

      console.log('✅ Knowledge base created:', knowledgeBase);
      return knowledgeBase;
    } catch (error) {
      console.error('❌ Failed to create knowledge base:', error);
      throw error;
    }
  }

  /**
   * Add document to knowledge base
   */
  async addDocumentToKnowledgeBase(
    userId: string,
    agentId: string,
    knowledgeBaseId: string,
    documentId: string
  ): Promise<void> {
    try {
      // Get knowledge base
      const kbStorageKey = `${userId}_${agentId}_${knowledgeBaseId}`;
      const knowledgeBase = await unifiedStorage.getItem(this.KNOWLEDGE_BASES_PREFIX, kbStorageKey) as KnowledgeBase;
      
      if (!knowledgeBase) {
        throw new Error(`Knowledge base ${knowledgeBaseId} not found`);
      }

      // Get document
      const docStorageKey = `${userId}_${agentId}_${documentId}`;
      const document = await unifiedStorage.getItem(this.DOCUMENTS_PREFIX, docStorageKey) as DocumentMetadata;
      
      if (!document) {
        throw new Error(`Document ${documentId} not found`);
      }

      // Check if document is already in knowledge base
      if (knowledgeBase.documents.some(doc => doc.id === documentId)) {
        console.log('📄 Document already in knowledge base');
        return;
      }

      // Add document to knowledge base
      knowledgeBase.documents.push(document);
      knowledgeBase.totalDocuments = knowledgeBase.documents.length;
      knowledgeBase.totalSize = knowledgeBase.documents.reduce((sum, doc) => sum + doc.fileSize, 0);
      knowledgeBase.lastUpdated = new Date().toISOString();

      // Save updated knowledge base
      await unifiedStorage.setItem(this.KNOWLEDGE_BASES_PREFIX, kbStorageKey, knowledgeBase);

      console.log('✅ Document added to knowledge base:', documentId);
    } catch (error) {
      console.error('❌ Failed to add document to knowledge base:', error);
      throw error;
    }
  }

  /**
   * Generate compliance report
   */
  async generateComplianceReport(userId: string, agentId: string): Promise<ComplianceReport> {
    try {
      const documents = await this.getDocumentsForAgent(userId, agentId);
      const violations = await customPolicyService.getViolationsForAgent(userId, agentId);

      const compliantDocuments = documents.filter(doc => doc.policyCompliant).length;
      const complianceRate = documents.length > 0 ? (compliantDocuments / documents.length) * 100 : 100;

      // Analyze violation types
      const violationTypes = violations.reduce((acc, violation) => {
        acc[violation.violationType] = (acc[violation.violationType] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const topViolations = Object.entries(violationTypes)
        .map(([type, count]) => ({
          type,
          count,
          severity: violations.find(v => v.violationType === type)?.severity || 'medium'
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      // Determine risk level
      let riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'low';
      if (complianceRate < 60 || violations.length > 20) {
        riskLevel = 'critical';
      } else if (complianceRate < 80 || violations.length > 10) {
        riskLevel = 'high';
      } else if (complianceRate < 95 || violations.length > 5) {
        riskLevel = 'medium';
      }

      // Generate recommendations
      const recommendations: string[] = [];
      if (complianceRate < 90) {
        recommendations.push('Review and update document validation policies');
      }
      if (violations.length > 5) {
        recommendations.push('Implement stricter content filtering before upload');
      }
      if (topViolations.length > 0) {
        recommendations.push(`Address ${topViolations[0].type} violations (${topViolations[0].count} occurrences)`);
      }

      const report: ComplianceReport = {
        agentId,
        totalDocuments: documents.length,
        compliantDocuments,
        violationCount: violations.length,
        complianceRate,
        riskLevel,
        topViolations,
        recommendations,
        lastAudit: new Date().toISOString()
      };

      console.log('📊 Compliance report generated:', report);
      return report;

    } catch (error) {
      console.error('❌ Failed to generate compliance report:', error);
      throw error;
    }
  }
}

export const policyAwareRAGService = new PolicyAwareRAGService();
export default policyAwareRAGService;

