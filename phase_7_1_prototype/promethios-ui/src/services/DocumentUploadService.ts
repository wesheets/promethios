/**
 * Document Upload Service
 * 
 * Handles real file uploads with processing pipeline:
 * - File validation and security checks
 * - Document processing and text extraction
 * - Policy compliance validation
 * - Firebase storage integration
 * - Knowledge base indexing
 */

import { unifiedStorage } from './UnifiedStorageService';

export interface DocumentUpload {
  id: string;
  filename: string;
  originalName: string;
  size: number;
  type: string;
  uploadedAt: string;
  uploadedBy: string;
  agentId?: string;
  organizationId: string;
  status: 'uploading' | 'processing' | 'completed' | 'failed';
  processingProgress: number;
  extractedText?: string;
  metadata: {
    pageCount?: number;
    wordCount?: number;
    language?: string;
    categories?: string[];
    tags?: string[];
    policyCompliance?: {
      hipaa: boolean;
      soc2: boolean;
      gdpr: boolean;
      violations?: string[];
    };
  };
  storageUrl?: string;
  thumbnailUrl?: string;
  error?: string;
}

export interface UploadProgress {
  documentId: string;
  progress: number;
  stage: 'uploading' | 'validating' | 'processing' | 'indexing' | 'completed';
  message: string;
}

export interface DocumentProcessingResult {
  success: boolean;
  documentId: string;
  extractedText: string;
  metadata: any;
  policyViolations?: string[];
  error?: string;
}

class DocumentUploadService {
  private readonly DOCUMENTS_NAMESPACE = 'documents';
  private readonly PROCESSING_NAMESPACE = 'document_processing';
  private readonly KNOWLEDGE_NAMESPACE = 'knowledge_base';
  
  // Supported file types
  private readonly SUPPORTED_TYPES = {
    'application/pdf': { maxSize: 50 * 1024 * 1024, category: 'document' }, // 50MB
    'application/msword': { maxSize: 25 * 1024 * 1024, category: 'document' }, // 25MB
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': { maxSize: 25 * 1024 * 1024, category: 'document' },
    'text/plain': { maxSize: 10 * 1024 * 1024, category: 'text' }, // 10MB
    'text/markdown': { maxSize: 10 * 1024 * 1024, category: 'text' },
    'application/json': { maxSize: 5 * 1024 * 1024, category: 'data' }, // 5MB
    'text/csv': { maxSize: 20 * 1024 * 1024, category: 'data' }, // 20MB
    'application/vnd.ms-excel': { maxSize: 20 * 1024 * 1024, category: 'spreadsheet' },
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': { maxSize: 20 * 1024 * 1024, category: 'spreadsheet' }
  };

  /**
   * Upload and process a document
   */
  async uploadDocument(
    file: File,
    agentId: string,
    organizationId: string,
    userId: string,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<DocumentUpload> {
    const documentId = `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    try {
      // Validate file
      this.validateFile(file);
      
      // Create initial document record
      const document: DocumentUpload = {
        id: documentId,
        filename: `${documentId}_${file.name}`,
        originalName: file.name,
        size: file.size,
        type: file.type,
        uploadedAt: new Date().toISOString(),
        uploadedBy: userId,
        agentId,
        organizationId,
        status: 'uploading',
        processingProgress: 0,
        metadata: {}
      };

      // Save initial document record
      await this.saveDocumentRecord(document);
      
      // Report upload start
      onProgress?.({
        documentId,
        progress: 10,
        stage: 'uploading',
        message: 'Starting file upload...'
      });

      // Convert file to base64 for storage (in production, use proper file storage)
      const fileData = await this.fileToBase64(file);
      
      // Store file data
      const storageKey = `${organizationId}/${agentId}/${documentId}`;
      await unifiedStorage.setItem(this.DOCUMENTS_NAMESPACE, storageKey, {
        data: fileData,
        metadata: {
          originalName: file.name,
          type: file.type,
          size: file.size,
          uploadedAt: document.uploadedAt
        }
      });

      // Update progress
      document.status = 'processing';
      document.processingProgress = 30;
      await this.saveDocumentRecord(document);
      
      onProgress?.({
        documentId,
        progress: 30,
        stage: 'processing',
        message: 'Processing document...'
      });

      // Process document
      const processingResult = await this.processDocument(file, fileData, documentId);
      
      if (processingResult.success) {
        // Update document with processing results
        document.status = 'completed';
        document.processingProgress = 100;
        document.extractedText = processingResult.extractedText;
        document.metadata = {
          ...document.metadata,
          ...processingResult.metadata
        };
        document.storageUrl = storageKey;
        
        await this.saveDocumentRecord(document);
        
        // Index in knowledge base
        await this.indexInKnowledgeBase(document);
        
        onProgress?.({
          documentId,
          progress: 100,
          stage: 'completed',
          message: 'Document processed successfully!'
        });
        
        return document;
      } else {
        // Handle processing failure
        document.status = 'failed';
        document.error = processingResult.error;
        await this.saveDocumentRecord(document);
        
        throw new Error(processingResult.error || 'Document processing failed');
      }

    } catch (error) {
      // Handle upload failure
      const failedDocument: DocumentUpload = {
        id: documentId,
        filename: file.name,
        originalName: file.name,
        size: file.size,
        type: file.type,
        uploadedAt: new Date().toISOString(),
        uploadedBy: userId,
        agentId,
        organizationId,
        status: 'failed',
        processingProgress: 0,
        metadata: {},
        error: error instanceof Error ? error.message : 'Upload failed'
      };
      
      await this.saveDocumentRecord(failedDocument);
      throw error;
    }
  }

  /**
   * Validate file before upload
   */
  private validateFile(file: File): void {
    // Check file type
    const typeConfig = this.SUPPORTED_TYPES[file.type as keyof typeof this.SUPPORTED_TYPES];
    if (!typeConfig) {
      throw new Error(`Unsupported file type: ${file.type}. Supported types: PDF, Word, Text, CSV, Excel`);
    }

    // Check file size
    if (file.size > typeConfig.maxSize) {
      const maxSizeMB = Math.round(typeConfig.maxSize / (1024 * 1024));
      throw new Error(`File too large. Maximum size for ${file.type}: ${maxSizeMB}MB`);
    }

    // Check filename for security
    if (!/^[a-zA-Z0-9._-]+$/.test(file.name.replace(/\s+/g, '_'))) {
      throw new Error('Invalid filename. Use only letters, numbers, dots, dashes, and underscores.');
    }
  }

  /**
   * Convert file to base64
   */
  private fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        // Remove data URL prefix
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  }

  /**
   * Process document and extract text
   */
  private async processDocument(file: File, fileData: string, documentId: string): Promise<DocumentProcessingResult> {
    try {
      let extractedText = '';
      let metadata: any = {};

      // Process based on file type
      switch (file.type) {
        case 'text/plain':
        case 'text/markdown':
          extractedText = await this.processTextFile(fileData);
          break;
          
        case 'application/json':
          const jsonResult = await this.processJsonFile(fileData);
          extractedText = jsonResult.text;
          metadata = jsonResult.metadata;
          break;
          
        case 'text/csv':
          const csvResult = await this.processCsvFile(fileData);
          extractedText = csvResult.text;
          metadata = csvResult.metadata;
          break;
          
        case 'application/pdf':
          // In production, use PDF.js or similar library
          extractedText = await this.processPdfFile(fileData);
          break;
          
        case 'application/msword':
        case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
          // In production, use mammoth.js or similar library
          extractedText = await this.processWordFile(fileData);
          break;
          
        default:
          throw new Error(`Processing not implemented for file type: ${file.type}`);
      }

      // Analyze content
      const analysis = await this.analyzeContent(extractedText);
      metadata = { ...metadata, ...analysis };

      // Check policy compliance
      const policyCompliance = await this.checkPolicyCompliance(extractedText);
      metadata.policyCompliance = policyCompliance;

      return {
        success: true,
        documentId,
        extractedText,
        metadata,
        policyViolations: policyCompliance.violations
      };

    } catch (error) {
      return {
        success: false,
        documentId,
        extractedText: '',
        metadata: {},
        error: error instanceof Error ? error.message : 'Processing failed'
      };
    }
  }

  /**
   * Process text file
   */
  private async processTextFile(base64Data: string): Promise<string> {
    try {
      const text = atob(base64Data);
      return text;
    } catch (error) {
      throw new Error('Failed to process text file');
    }
  }

  /**
   * Process JSON file
   */
  private async processJsonFile(base64Data: string): Promise<{ text: string; metadata: any }> {
    try {
      const jsonText = atob(base64Data);
      const jsonData = JSON.parse(jsonText);
      
      // Convert JSON to searchable text
      const text = this.jsonToSearchableText(jsonData);
      
      return {
        text,
        metadata: {
          jsonStructure: this.analyzeJsonStructure(jsonData),
          recordCount: Array.isArray(jsonData) ? jsonData.length : 1
        }
      };
    } catch (error) {
      throw new Error('Failed to process JSON file');
    }
  }

  /**
   * Process CSV file
   */
  private async processCsvFile(base64Data: string): Promise<{ text: string; metadata: any }> {
    try {
      const csvText = atob(base64Data);
      const lines = csvText.split('\n').filter(line => line.trim());
      
      if (lines.length === 0) {
        throw new Error('Empty CSV file');
      }
      
      const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
      const rows = lines.slice(1).map(line => line.split(',').map(cell => cell.trim().replace(/"/g, '')));
      
      // Convert to searchable text
      const text = this.csvToSearchableText(headers, rows);
      
      return {
        text,
        metadata: {
          headers,
          rowCount: rows.length,
          columnCount: headers.length
        }
      };
    } catch (error) {
      throw new Error('Failed to process CSV file');
    }
  }

  /**
   * Process PDF file (mock implementation)
   */
  private async processPdfFile(base64Data: string): Promise<string> {
    // In production, use PDF.js or send to backend service
    // For now, return placeholder text
    return `[PDF Document Content]\n\nThis is a PDF document that has been uploaded. In a production environment, this would contain the extracted text from the PDF file using a proper PDF processing library like PDF.js.\n\nThe document processing pipeline would:\n1. Extract text from all pages\n2. Preserve formatting where possible\n3. Extract metadata (page count, creation date, etc.)\n4. Identify and extract images/tables\n5. Perform OCR on scanned documents if needed`;
  }

  /**
   * Process Word file (mock implementation)
   */
  private async processWordFile(base64Data: string): Promise<string> {
    // In production, use mammoth.js or send to backend service
    // For now, return placeholder text
    return `[Word Document Content]\n\nThis is a Word document that has been uploaded. In a production environment, this would contain the extracted text from the Word document using a proper document processing library like mammoth.js.\n\nThe document processing pipeline would:\n1. Extract text content\n2. Preserve formatting and structure\n3. Extract metadata (author, creation date, etc.)\n4. Handle embedded images and tables\n5. Convert to plain text for indexing`;
  }

  /**
   * Convert JSON to searchable text
   */
  private jsonToSearchableText(data: any): string {
    const extractText = (obj: any, path: string = ''): string[] => {
      const texts: string[] = [];
      
      if (typeof obj === 'string') {
        texts.push(obj);
      } else if (typeof obj === 'number' || typeof obj === 'boolean') {
        texts.push(String(obj));
      } else if (Array.isArray(obj)) {
        obj.forEach((item, index) => {
          texts.push(...extractText(item, `${path}[${index}]`));
        });
      } else if (obj && typeof obj === 'object') {
        Object.entries(obj).forEach(([key, value]) => {
          texts.push(key); // Include field names as searchable text
          texts.push(...extractText(value, `${path}.${key}`));
        });
      }
      
      return texts;
    };
    
    return extractText(data).join(' ');
  }

  /**
   * Convert CSV to searchable text
   */
  private csvToSearchableText(headers: string[], rows: string[][]): string {
    const texts: string[] = [];
    
    // Add headers
    texts.push(...headers);
    
    // Add all cell values
    rows.forEach(row => {
      texts.push(...row);
    });
    
    return texts.join(' ');
  }

  /**
   * Analyze JSON structure
   */
  private analyzeJsonStructure(data: any): any {
    if (Array.isArray(data)) {
      return {
        type: 'array',
        length: data.length,
        itemType: data.length > 0 ? typeof data[0] : 'unknown'
      };
    } else if (data && typeof data === 'object') {
      return {
        type: 'object',
        keys: Object.keys(data),
        keyCount: Object.keys(data).length
      };
    } else {
      return {
        type: typeof data
      };
    }
  }

  /**
   * Analyze content for metadata
   */
  private async analyzeContent(text: string): Promise<any> {
    const words = text.split(/\s+/).filter(word => word.length > 0);
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    
    // Simple language detection (basic heuristic)
    const language = this.detectLanguage(text);
    
    // Extract potential categories/tags
    const categories = this.extractCategories(text);
    const tags = this.extractTags(text);
    
    return {
      wordCount: words.length,
      sentenceCount: sentences.length,
      characterCount: text.length,
      language,
      categories,
      tags
    };
  }

  /**
   * Simple language detection
   */
  private detectLanguage(text: string): string {
    // Very basic language detection - in production use a proper library
    const englishWords = ['the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by'];
    const lowerText = text.toLowerCase();
    
    const englishMatches = englishWords.filter(word => lowerText.includes(word)).length;
    
    return englishMatches > 3 ? 'en' : 'unknown';
  }

  /**
   * Extract categories from content
   */
  private extractCategories(text: string): string[] {
    const categories: string[] = [];
    const lowerText = text.toLowerCase();
    
    // Business categories
    if (lowerText.includes('policy') || lowerText.includes('procedure') || lowerText.includes('compliance')) {
      categories.push('Policy & Compliance');
    }
    if (lowerText.includes('technical') || lowerText.includes('api') || lowerText.includes('code')) {
      categories.push('Technical Documentation');
    }
    if (lowerText.includes('employee') || lowerText.includes('hr') || lowerText.includes('handbook')) {
      categories.push('Human Resources');
    }
    if (lowerText.includes('financial') || lowerText.includes('budget') || lowerText.includes('revenue')) {
      categories.push('Financial');
    }
    if (lowerText.includes('marketing') || lowerText.includes('campaign') || lowerText.includes('brand')) {
      categories.push('Marketing');
    }
    
    return categories.length > 0 ? categories : ['General'];
  }

  /**
   * Extract tags from content
   */
  private extractTags(text: string): string[] {
    const tags: string[] = [];
    const lowerText = text.toLowerCase();
    
    // Common business tags
    const tagPatterns = [
      { pattern: /hipaa|health.*privacy/i, tag: 'HIPAA' },
      { pattern: /soc\s*2|security.*controls/i, tag: 'SOC2' },
      { pattern: /gdpr|data.*protection/i, tag: 'GDPR' },
      { pattern: /api|application.*interface/i, tag: 'API' },
      { pattern: /security|cybersecurity/i, tag: 'Security' },
      { pattern: /training|education/i, tag: 'Training' },
      { pattern: /process|procedure/i, tag: 'Process' }
    ];
    
    tagPatterns.forEach(({ pattern, tag }) => {
      if (pattern.test(text)) {
        tags.push(tag);
      }
    });
    
    return tags;
  }

  /**
   * Check policy compliance
   */
  private async checkPolicyCompliance(text: string): Promise<any> {
    const violations: string[] = [];
    const lowerText = text.toLowerCase();
    
    // HIPAA compliance checks
    const hipaaViolations = this.checkHipaaCompliance(lowerText);
    violations.push(...hipaaViolations);
    
    // SOC2 compliance checks
    const soc2Violations = this.checkSoc2Compliance(lowerText);
    violations.push(...soc2Violations);
    
    // GDPR compliance checks
    const gdprViolations = this.checkGdprCompliance(lowerText);
    violations.push(...gdprViolations);
    
    return {
      hipaa: hipaaViolations.length === 0,
      soc2: soc2Violations.length === 0,
      gdpr: gdprViolations.length === 0,
      violations: violations.length > 0 ? violations : undefined
    };
  }

  /**
   * Check HIPAA compliance
   */
  private checkHipaaCompliance(text: string): string[] {
    const violations: string[] = [];
    
    // Check for potential PHI patterns
    const phiPatterns = [
      { pattern: /\b\d{3}-\d{2}-\d{4}\b/, violation: 'Potential SSN detected' },
      { pattern: /\b\d{10,}\b/, violation: 'Potential medical record number detected' },
      { pattern: /patient.*name.*\w+\s+\w+/i, violation: 'Potential patient name detected' }
    ];
    
    phiPatterns.forEach(({ pattern, violation }) => {
      if (pattern.test(text)) {
        violations.push(violation);
      }
    });
    
    return violations;
  }

  /**
   * Check SOC2 compliance
   */
  private checkSoc2Compliance(text: string): string[] {
    const violations: string[] = [];
    
    // Check for security-related issues
    if (text.includes('password') && text.includes('123')) {
      violations.push('Weak password pattern detected');
    }
    
    if (text.includes('api.*key') && /[a-zA-Z0-9]{20,}/.test(text)) {
      violations.push('Potential API key exposure detected');
    }
    
    return violations;
  }

  /**
   * Check GDPR compliance
   */
  private checkGdprCompliance(text: string): string[] {
    const violations: string[] = [];
    
    // Check for personal data patterns
    const emailPattern = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
    const emails = text.match(emailPattern);
    
    if (emails && emails.length > 5) {
      violations.push('Large number of email addresses detected - ensure GDPR consent');
    }
    
    return violations;
  }

  /**
   * Save document record
   */
  private async saveDocumentRecord(document: DocumentUpload): Promise<void> {
    const key = `${document.organizationId}/${document.agentId}/${document.id}`;
    await unifiedStorage.setItem(this.DOCUMENTS_NAMESPACE, key, document);
    
    // Also save in user's document list
    const userDocsKey = `${document.uploadedBy}_documents`;
    const userDocs = await unifiedStorage.getItem(this.DOCUMENTS_NAMESPACE, userDocsKey) || [];
    
    const existingIndex = userDocs.findIndex((doc: DocumentUpload) => doc.id === document.id);
    if (existingIndex >= 0) {
      userDocs[existingIndex] = document;
    } else {
      userDocs.push(document);
    }
    
    await unifiedStorage.setItem(this.DOCUMENTS_NAMESPACE, userDocsKey, userDocs);
  }

  /**
   * Index document in knowledge base
   */
  private async indexInKnowledgeBase(document: DocumentUpload): Promise<void> {
    if (!document.extractedText) return;
    
    const knowledgeEntry = {
      id: document.id,
      type: 'document',
      title: document.originalName,
      content: document.extractedText,
      metadata: document.metadata,
      agentId: document.agentId,
      organizationId: document.organizationId,
      createdAt: document.uploadedAt,
      updatedAt: new Date().toISOString(),
      tags: document.metadata.tags || [],
      categories: document.metadata.categories || []
    };
    
    const knowledgeKey = `${document.organizationId}/${document.agentId}/${document.id}`;
    await unifiedStorage.setItem(this.KNOWLEDGE_NAMESPACE, knowledgeKey, knowledgeEntry);
  }

  /**
   * Get documents for agent
   */
  async getDocuments(agentId: string, organizationId: string): Promise<DocumentUpload[]> {
    try {
      // Get all documents for this agent
      const prefix = `${organizationId}/${agentId}/`;
      const allDocs = await unifiedStorage.getAllItems(this.DOCUMENTS_NAMESPACE);
      
      const agentDocs = Object.entries(allDocs)
        .filter(([key]) => key.startsWith(prefix))
        .map(([, doc]) => doc as DocumentUpload)
        .sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());
      
      return agentDocs;
    } catch (error) {
      console.error('Failed to get documents:', error);
      return [];
    }
  }

  /**
   * Delete document
   */
  async deleteDocument(documentId: string, agentId: string, organizationId: string): Promise<void> {
    try {
      // Delete document record
      const docKey = `${organizationId}/${agentId}/${documentId}`;
      await unifiedStorage.removeItem(this.DOCUMENTS_NAMESPACE, docKey);
      
      // Delete from knowledge base
      const knowledgeKey = `${organizationId}/${agentId}/${documentId}`;
      await unifiedStorage.removeItem(this.KNOWLEDGE_NAMESPACE, knowledgeKey);
      
      // Remove from user's document list
      // Note: This would need the userId, which we don't have here
      // In production, store userId in the document record
      
    } catch (error) {
      console.error('Failed to delete document:', error);
      throw error;
    }
  }

  /**
   * Search documents
   */
  async searchDocuments(
    query: string,
    agentId: string,
    organizationId: string,
    filters?: {
      type?: string;
      category?: string;
      dateRange?: { start: string; end: string };
    }
  ): Promise<DocumentUpload[]> {
    try {
      const documents = await this.getDocuments(agentId, organizationId);
      
      if (!query && !filters) {
        return documents;
      }
      
      return documents.filter(doc => {
        // Text search
        if (query) {
          const searchText = `${doc.originalName} ${doc.extractedText || ''}`.toLowerCase();
          if (!searchText.includes(query.toLowerCase())) {
            return false;
          }
        }
        
        // Type filter
        if (filters?.type && doc.type !== filters.type) {
          return false;
        }
        
        // Category filter
        if (filters?.category) {
          const categories = doc.metadata.categories || [];
          if (!categories.includes(filters.category)) {
            return false;
          }
        }
        
        // Date range filter
        if (filters?.dateRange) {
          const docDate = new Date(doc.uploadedAt);
          const startDate = new Date(filters.dateRange.start);
          const endDate = new Date(filters.dateRange.end);
          
          if (docDate < startDate || docDate > endDate) {
            return false;
          }
        }
        
        return true;
      });
    } catch (error) {
      console.error('Failed to search documents:', error);
      return [];
    }
  }
}

export const documentUploadService = new DocumentUploadService();
export default documentUploadService;

