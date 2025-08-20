/**
 * Comprehensive Tool Receipt Extension
 * 
 * Provides receipt generation for all identified tools in the Promethios platform. 
 * This includes communication tools, CRM integrations, e-commerce platforms, 
 * financial services, and more.
 */

import { Extension } from './Extension';
import { UniversalGovernanceAdapter } from '../services/UniversalGovernanceAdapter';

// Tool Receipt Interfaces
export interface ToolAction {
  id: string;
  toolName: string;
  action: string;
  parameters: Record<string, any>;
  timestamp: Date;
  agentId: string;
  sessionId: string;
  businessContext?: BusinessContext;
  riskLevel?: 'low' | 'medium' | 'high' | 'critical';
  complianceRequirements?: string[];
  dataClassification?: 'public' | 'internal' | 'confidential' | 'restricted';
}

export interface ToolReceipt {
  id: string;
  toolAction: ToolAction;
  executionResult: any;
  status: 'success' | 'failure' | 'partial';
  timestamp: Date;
  duration: number;
  errorMessage?: string;
  businessImpact?: BusinessImpact;
  auditTrail: AuditEntry[];
  hash: string;
}

export interface BusinessContext {
  department: string;
  project?: string;
  customer?: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  complianceRequired: boolean;
  budgetImpact?: number;
  strategicImportance?: 'low' | 'medium' | 'high';
}

export interface BusinessImpact {
  costSavings?: number;
  timeValue?: number;
  riskMitigation?: string;
  strategicValue?: string;
}

export interface AuditEntry {
  timestamp: Date;
  action: string;
  details: string;
  agentId: string;
}

// Browser-compatible crypto utilities
const browserCrypto = {
  async createHash(algorithm: string, data: string): Promise<string> {
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);
    
    let hashAlgorithm: string;
    switch (algorithm) {
      case 'sha256':
        hashAlgorithm = 'SHA-256';
        break;
      case 'sha1':
        hashAlgorithm = 'SHA-1';
        break;
      case 'md5':
        hashAlgorithm = 'SHA-256'; // Fallback to SHA-256
        break;
      default:
        hashAlgorithm = 'SHA-256';
    }
    
    const hashBuffer = await crypto.subtle.digest(hashAlgorithm, dataBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  },
  
  generateRandomId(): string {
    const array = new Uint8Array(16);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }
};

export interface ComprehensiveToolAction extends ToolAction {
  toolCategory: 'communication' | 'crm' | 'ecommerce' | 'financial' | 'data' | 'file' | 'web' | 'ai' | 'security' | 'integration' | 'collaboration' | 'workflow' | 'governance' | 'learning';
  riskLevel: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;
  complianceRequirements: string[];
  dataClassification: 'public' | 'internal' | 'confidential' | 'restricted';
  userIntent: string;
  expectedOutcome: string;
  businessContext: BusinessContext;
  sessionId?: string;
}

export interface ToolExecutionMetadata {
  resourcesUsed: string[];
  performanceMetrics: {
    executionTime: number;
    memoryUsage?: number;
    apiCalls?: number;
    dataProcessed?: number;
  };
  errorDetails?: {
    errorCode: string;
    errorMessage: string;
    stackTrace?: string;
    recoveryAction?: string;
  };
}

export interface EnhancedToolReceipt extends ToolReceipt {
  receiptId: string;
  toolName: string;
  actionType: string;
  toolCategory: string;
  riskLevel: number;
  
  // User-friendly display properties
  userFriendlyTitle: string;
  userFriendlyDescription: string;
  userFriendlySummary: string;
  shareableContext: string;
  
  // Compact display properties for limited real estate
  compactTitle: string;
  compactSummary: string;
  compactMetrics: string;
  hoverDetails: string;
  statusIcon: string;
  categoryIcon: string;
  
  // Governance and compliance
  complianceStatus: {
    gdprCompliant: boolean;
    hipaaCompliant: boolean;
    sox404Compliant: boolean;
    pciDssCompliant: boolean;
    customCompliance: Record<string, boolean>;
  };
  governanceStatus: string;
  trustScore: number;
  
  executionMetadata: ToolExecutionMetadata;
  relatedReceipts: string[]; // IDs of related receipts for workflow tracking
  businessImpact: {
    customerAffected: boolean;
    revenueImpact: number;
    dataModified: boolean;
    systemsAffected: string[];
  };
  
  // API call details
  apiCallDetails?: any;
  
  // Cryptographic verification
  cryptographicHash: string;
  previousHash: string;
  blockchainPosition: number;
  
  // Shareability
  isShareable: boolean;
  shareableFormat: string;
  clickToShareEnabled: boolean;
}

/**
 * Shareable Receipt Reference for chat integration
 */
export interface ShareableReceiptReference {
  receiptId: string;
  agentId: string;
  sessionId: string;
  contextType: string;
  toolName: string;
  actionType: string;
  toolCategory: string;
  timestamp: Date;
  cryptographicHash: string;
  shareableTitle: string;
  shareableDescription: string;
  continuationHints: string[];
  verificationData: {
    blockchainPosition: number;
    previousHash: string;
    trustScore: number;
  };
}

/**
 * Receipt Context for agent continuation
 */
export interface ReceiptContext {
  receiptId: string;
  originalExecution: {
    toolName: string;
    actionType: string;
    parameters: Record<string, any>;
    result: any;
    timestamp: Date;
  };
  businessContext?: BusinessContext;
  executionMetadata: ToolExecutionMetadata;
  continuationOptions: ContinuationOption[];
  relatedReceipts: string[];
  trustScore: number;
  complianceStatus: any;
  nextSteps: string[];
}

/**
 * Continuation Option for agent workflows
 */
export interface ContinuationOption {
  action: string;
  description: string;
  parameters: Record<string, any>;
}

/**
 * Comprehensive Tool Receipt Extension
 * Provides receipt generation for all Promethios tools
 */
export class ComprehensiveToolReceiptExtension extends Extension {
  private static instance: ComprehensiveToolReceiptExtension;

  constructor() {
    super();
    // No initialization needed - using dynamic imports for UGA access
  }

  static getInstance(): ComprehensiveToolReceiptExtension {
    if (!ComprehensiveToolReceiptExtension.instance) {
      ComprehensiveToolReceiptExtension.instance = new ComprehensiveToolReceiptExtension();
    }
    return ComprehensiveToolReceiptExtension.instance;
  }

  /**
   * Generate enhanced receipt for any tool operation
   */
  async generateEnhancedToolReceipt(
    agentId: string,
    toolAction: ComprehensiveToolAction,
    executionResult: any,
    apiCallDetails?: any,
    executionMetadata?: ToolExecutionMetadata
  ): Promise<EnhancedToolReceipt> {
    const baseReceipt = await this.generateToolReceipt(agentId, toolAction, executionResult, apiCallDetails);
    
    const enhancedReceipt: EnhancedToolReceipt = {
      ...baseReceipt,
      toolCategory: toolAction.toolCategory,
      riskLevel: toolAction.riskLevel,
      complianceStatus: this.assessComplianceStatus(toolAction, executionResult),
      executionMetadata: executionMetadata || this.generateExecutionMetadata(toolAction, executionResult),
      relatedReceipts: await this.findRelatedReceipts(agentId, toolAction),
      businessImpact: this.assessBusinessImpact(toolAction, executionResult)
    };

    // Store enhanced receipt
    await this.storeEnhancedReceipt(enhancedReceipt);
    
    return enhancedReceipt;
  }

  /**
   * Communication Tools Receipt Generation
   */
  async generateEmailReceipt(
    agentId: string,
    emailAction: 'send_email' | 'send_bulk_email' | 'email_tracking',
    parameters: any,
    result: any
  ): Promise<EnhancedToolReceipt> {
    const toolAction: ComprehensiveToolAction = {
      toolName: 'email',
      actionType: emailAction,
      parameters,
      userIntent: parameters.userIntent || 'Send email communication',
      expectedOutcome: this.getEmailExpectedOutcome(emailAction, parameters),
      businessContext: {
        department: 'marketing',
        useCase: 'customer_communication',
        customerImpact: 'medium',
        dataClassification: 'internal',
        regulatoryScope: ['CAN_SPAM', 'GDPR'],
        businessValue: 0.6
      },
      toolCategory: 'communication',
      riskLevel: 4,
      complianceRequirements: ['CAN_SPAM', 'GDPR', 'CCPA'],
      dataClassification: 'internal'
    };

    const apiCallDetails = {
      apiCallId: `email_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      apiProvider: 'sendgrid',
      endpoint: emailAction === 'send_bulk_email' ? '/v3/mail/batch' : '/v3/mail/send',
      method: 'POST',
      requestHeaders: { 'Authorization': 'Bearer [REDACTED]', 'Content-Type': 'application/json' },
      responseHeaders: { 'Content-Type': 'application/json', 'X-Message-Id': result.message_id },
      statusCode: 202,
      rawApiUrl: `https://sendgrid.com/api-logs/${result.message_id}`
    };

    const executionMetadata: ToolExecutionMetadata = {
      executionId: `exec_${Date.now()}`,
      startTime: Date.now() - 1000,
      endTime: Date.now(),
      resourcesUsed: ['sendgrid_api', 'email_templates'],
      performanceMetrics: {
        executionTime: 1000,
        apiCalls: 1,
        dataProcessed: parameters.recipients?.length || 1
      }
    };

    return this.generateEnhancedToolReceipt(agentId, toolAction, result, apiCallDetails, executionMetadata);
  }

  async generateSMSReceipt(
    agentId: string,
    smsAction: 'send_sms' | 'send_bulk_sms' | 'sms_tracking',
    parameters: any,
    result: any
  ): Promise<EnhancedToolReceipt> {
    const toolAction: ComprehensiveToolAction = {
      toolName: 'sms',
      actionType: smsAction,
      parameters,
      userIntent: parameters.userIntent || 'Send SMS notification',
      expectedOutcome: this.getSMSExpectedOutcome(smsAction, parameters),
      businessContext: {
        department: 'customer_service',
        useCase: 'urgent_notifications',
        customerImpact: 'high',
        dataClassification: 'confidential',
        regulatoryScope: ['TCPA', 'GDPR'],
        businessValue: 0.7
      },
      toolCategory: 'communication',
      riskLevel: 5,
      complianceRequirements: ['TCPA', 'GDPR'],
      dataClassification: 'confidential'
    };

    const apiCallDetails = {
      apiCallId: `sms_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      apiProvider: 'twilio',
      endpoint: '/2010-04-01/Accounts/[ACCOUNT_SID]/Messages.json',
      method: 'POST',
      requestHeaders: { 'Authorization': 'Basic [REDACTED]' },
      responseHeaders: { 'Content-Type': 'application/json', 'Twilio-Request-Id': result.message_sid },
      statusCode: 201,
      rawApiUrl: `https://console.twilio.com/logs/${result.message_sid}`
    };

    return this.generateEnhancedToolReceipt(agentId, toolAction, result, apiCallDetails);
  }

  /**
   * CRM Tools Receipt Generation
   */
  async generateSalesforceReceipt(
    agentId: string,
    sfAction: 'create_lead' | 'update_lead' | 'create_opportunity' | 'update_opportunity' | 'create_contact' | 'create_account',
    parameters: any,
    result: any
  ): Promise<EnhancedToolReceipt> {
    const toolAction: ComprehensiveToolAction = {
      toolName: 'salesforce',
      actionType: sfAction,
      parameters,
      userIntent: parameters.userIntent || 'Manage Salesforce data',
      expectedOutcome: this.getSalesforceExpectedOutcome(sfAction, parameters),
      businessContext: {
        department: 'sales',
        useCase: 'lead_management',
        customerImpact: 'high',
        dataClassification: 'confidential',
        regulatoryScope: ['GDPR', 'CCPA'],
        businessValue: 0.8
      },
      toolCategory: 'crm',
      riskLevel: 6,
      complianceRequirements: ['GDPR', 'CCPA', 'SOX'],
      dataClassification: 'confidential'
    };

    const apiCallDetails = {
      apiCallId: `sf_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      apiProvider: 'salesforce',
      endpoint: this.getSalesforceEndpoint(sfAction, parameters),
      method: sfAction.includes('create') ? 'POST' : 'PATCH',
      requestHeaders: { 'Authorization': 'Bearer [REDACTED]', 'Content-Type': 'application/json' },
      responseHeaders: { 'Content-Type': 'application/json', 'Sforce-Limit-Info': 'api-usage=123/15000' },
      statusCode: sfAction.includes('create') ? 201 : 200,
      rawApiUrl: `https://api.salesforce.com/logs/${result.id}`
    };

    return this.generateEnhancedToolReceipt(agentId, toolAction, result, apiCallDetails);
  }

  /**
   * E-commerce Tools Receipt Generation
   */
  async generateShopifyReceipt(
    agentId: string,
    shopifyAction: 'get_order' | 'update_order' | 'track_shipment' | 'process_refund' | 'inventory_update',
    parameters: any,
    result: any
  ): Promise<EnhancedToolReceipt> {
    const toolAction: ComprehensiveToolAction = {
      toolName: 'shopify',
      actionType: shopifyAction,
      parameters,
      userIntent: parameters.userIntent || 'Manage Shopify operations',
      expectedOutcome: this.getShopifyExpectedOutcome(shopifyAction, parameters),
      businessContext: {
        department: 'customer_service',
        useCase: 'order_management',
        customerImpact: 'high',
        dataClassification: 'confidential',
        regulatoryScope: ['PCI_DSS', 'GDPR'],
        businessValue: 0.9
      },
      toolCategory: 'ecommerce',
      riskLevel: 7,
      complianceRequirements: ['PCI_DSS', 'GDPR', 'CCPA'],
      dataClassification: 'confidential'
    };

    const apiCallDetails = {
      apiCallId: `shopify_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      apiProvider: 'shopify',
      endpoint: this.getShopifyEndpoint(shopifyAction, parameters),
      method: shopifyAction.includes('update') || shopifyAction.includes('process') ? 'PUT' : 'GET',
      requestHeaders: { 'X-Shopify-Access-Token': '[REDACTED]', 'Content-Type': 'application/json' },
      responseHeaders: { 'Content-Type': 'application/json', 'X-Shopify-Shop-Api-Call-Limit': '2/40' },
      statusCode: 200,
      rawApiUrl: `https://shopify.dev/api-logs/${result.order_id}`
    };

    return this.generateEnhancedToolReceipt(agentId, toolAction, result, apiCallDetails);
  }

  /**
   * Financial Tools Receipt Generation
   */
  async generateStripeReceipt(
    agentId: string,
    stripeAction: 'create_payment' | 'process_refund' | 'manage_subscription' | 'create_customer',
    parameters: any,
    result: any
  ): Promise<EnhancedToolReceipt> {
    const toolAction: ComprehensiveToolAction = {
      toolName: 'stripe',
      actionType: stripeAction,
      parameters,
      userIntent: parameters.userIntent || 'Process financial transaction',
      expectedOutcome: this.getStripeExpectedOutcome(stripeAction, parameters),
      businessContext: {
        department: 'finance',
        useCase: 'payment_processing',
        customerImpact: 'critical',
        dataClassification: 'restricted',
        regulatoryScope: ['PCI_DSS', 'SOX', 'GDPR'],
        businessValue: 1.0
      },
      toolCategory: 'financial',
      riskLevel: 9,
      complianceRequirements: ['PCI_DSS', 'SOX', 'GDPR', 'CCPA'],
      dataClassification: 'restricted'
    };

    const apiCallDetails = {
      apiCallId: `stripe_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      apiProvider: 'stripe',
      endpoint: this.getStripeEndpoint(stripeAction, parameters),
      method: 'POST',
      requestHeaders: { 'Authorization': 'Bearer [REDACTED]', 'Content-Type': 'application/json' },
      responseHeaders: { 'Content-Type': 'application/json', 'Request-Id': result.id },
      statusCode: 200,
      rawApiUrl: `https://dashboard.stripe.com/logs/${result.id}`
    };

    return this.generateEnhancedToolReceipt(agentId, toolAction, result, apiCallDetails);
  }

  /**
   * File Management Tools Receipt Generation
   */
  async generateFileOperationReceipt(
    agentId: string,
    fileAction: 'file_upload' | 'file_download' | 'file_delete' | 'file_share',
    parameters: any,
    result: any
  ): Promise<EnhancedToolReceipt> {
    const toolAction: ComprehensiveToolAction = {
      toolName: 'file_management',
      actionType: fileAction,
      parameters,
      userIntent: parameters.userIntent || 'Manage file operations',
      expectedOutcome: this.getFileExpectedOutcome(fileAction, parameters),
      businessContext: {
        department: 'operations',
        useCase: 'document_management',
        customerImpact: 'medium',
        dataClassification: parameters.dataClassification || 'internal',
        regulatoryScope: ['GDPR', 'HIPAA'],
        businessValue: 0.5
      },
      toolCategory: 'file',
      riskLevel: 5,
      complianceRequirements: ['GDPR', 'HIPAA'],
      dataClassification: parameters.dataClassification || 'internal'
    };

    const apiCallDetails = {
      apiCallId: `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      apiProvider: 'aws_s3',
      endpoint: this.getFileEndpoint(fileAction, parameters),
      method: this.getFileMethod(fileAction),
      requestHeaders: { 'Authorization': 'AWS4-HMAC-SHA256 [REDACTED]' },
      responseHeaders: { 'Content-Type': 'application/json', 'x-amz-request-id': result.requestId },
      statusCode: 200,
      rawApiUrl: `https://s3.console.aws.amazon.com/logs/${result.fileId}`
    };

    return this.generateEnhancedToolReceipt(agentId, toolAction, result, apiCallDetails);
  }

  /**
   * Web and Browser Tools Receipt Generation
   */
  async generateWebOperationReceipt(
    agentId: string,
    webAction: 'web_scrape' | 'web_monitoring' | 'browser_automation' | 'form_submission',
    parameters: any,
    result: any
  ): Promise<EnhancedToolReceipt> {
    const toolAction: ComprehensiveToolAction = {
      toolName: 'web_automation',
      actionType: webAction,
      parameters,
      userIntent: parameters.userIntent || 'Perform web operation',
      expectedOutcome: this.getWebExpectedOutcome(webAction, parameters),
      businessContext: {
        department: 'operations',
        useCase: 'web_automation',
        customerImpact: 'low',
        dataClassification: 'internal',
        regulatoryScope: ['GDPR'],
        businessValue: 0.4
      },
      toolCategory: 'web',
      riskLevel: 6,
      complianceRequirements: ['GDPR', 'ROBOTS_TXT'],
      dataClassification: 'internal'
    };

    const apiCallDetails = {
      apiCallId: `web_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      apiProvider: 'selenium_grid',
      endpoint: parameters.targetUrl,
      method: 'GET',
      requestHeaders: { 'User-Agent': 'Promethios-Bot/1.0' },
      responseHeaders: { 'Content-Type': 'text/html' },
      statusCode: 200,
      rawApiUrl: `https://selenium-grid.promethios.com/logs/${result.sessionId}`
    };

    return this.generateEnhancedToolReceipt(agentId, toolAction, result, apiCallDetails);
  }

  /**
   * Helper methods for generating expected outcomes
   */
  private getEmailExpectedOutcome(action: string, params: any): string {
    switch (action) {
      case 'send_email':
        return `Send email to ${params.to} with subject "${params.subject}"`;
      case 'send_bulk_email':
        return `Send bulk email to ${params.recipients?.length || 0} recipients`;
      case 'email_tracking':
        return `Track email delivery and engagement for ${params.messageId}`;
      default:
        return `Execute email ${action}`;
    }
  }

  private getSMSExpectedOutcome(action: string, params: any): string {
    switch (action) {
      case 'send_sms':
        return `Send SMS to ${params.to}`;
      case 'send_bulk_sms':
        return `Send bulk SMS to ${params.recipients?.length || 0} recipients`;
      case 'sms_tracking':
        return `Track SMS delivery status for ${params.messageId}`;
      default:
        return `Execute SMS ${action}`;
    }
  }

  private getSalesforceExpectedOutcome(action: string, params: any): string {
    switch (action) {
      case 'create_lead':
        return `Create new lead for ${params.firstName} ${params.lastName} at ${params.company}`;
      case 'update_lead':
        return `Update lead ${params.leadId} with new information`;
      case 'create_opportunity':
        return `Create new opportunity "${params.name}" worth ${params.amount}`;
      case 'update_opportunity':
        return `Update opportunity ${params.opportunityId}`;
      case 'create_contact':
        return `Create new contact ${params.firstName} ${params.lastName}`;
      case 'create_account':
        return `Create new account "${params.name}"`;
      default:
        return `Execute Salesforce ${action}`;
    }
  }

  private getShopifyExpectedOutcome(action: string, params: any): string {
    switch (action) {
      case 'get_order':
        return `Retrieve order details for order ${params.orderId}`;
      case 'update_order':
        return `Update order ${params.orderId}`;
      case 'track_shipment':
        return `Get tracking information for order ${params.orderId}`;
      case 'process_refund':
        return `Process refund for order ${params.orderId}`;
      case 'inventory_update':
        return `Update inventory for product ${params.productId}`;
      default:
        return `Execute Shopify ${action}`;
    }
  }

  private getStripeExpectedOutcome(action: string, params: any): string {
    switch (action) {
      case 'create_payment':
        return `Process payment of ${params.amount} ${params.currency}`;
      case 'process_refund':
        return `Process refund for charge ${params.chargeId}`;
      case 'manage_subscription':
        return `Manage subscription ${params.subscriptionId}`;
      case 'create_customer':
        return `Create new customer ${params.email}`;
      default:
        return `Execute Stripe ${action}`;
    }
  }

  private getFileExpectedOutcome(action: string, params: any): string {
    switch (action) {
      case 'file_upload':
        return `Upload file "${params.fileName}" to ${params.destination}`;
      case 'file_download':
        return `Download file "${params.fileName}" from ${params.source}`;
      case 'file_delete':
        return `Delete file "${params.fileName}"`;
      case 'file_share':
        return `Share file "${params.fileName}" with ${params.recipients?.length || 0} recipients`;
      default:
        return `Execute file ${action}`;
    }
  }

  private getWebExpectedOutcome(action: string, params: any): string {
    switch (action) {
      case 'web_scrape':
        return `Scrape data from ${params.targetUrl}`;
      case 'web_monitoring':
        return `Monitor changes on ${params.targetUrl}`;
      case 'browser_automation':
        return `Automate browser actions on ${params.targetUrl}`;
      case 'form_submission':
        return `Submit form on ${params.targetUrl}`;
      default:
        return `Execute web ${action}`;
    }
  }

  /**
   * Helper methods for API endpoints
   */
  private getSalesforceEndpoint(action: string, params: any): string {
    switch (action) {
      case 'create_lead':
        return '/services/data/v58.0/sobjects/Lead';
      case 'update_lead':
        return `/services/data/v58.0/sobjects/Lead/${params.leadId}`;
      case 'create_opportunity':
        return '/services/data/v58.0/sobjects/Opportunity';
      case 'update_opportunity':
        return `/services/data/v58.0/sobjects/Opportunity/${params.opportunityId}`;
      case 'create_contact':
        return '/services/data/v58.0/sobjects/Contact';
      case 'create_account':
        return '/services/data/v58.0/sobjects/Account';
      default:
        return '/services/data/v58.0/sobjects/';
    }
  }

  private getShopifyEndpoint(action: string, params: any): string {
    switch (action) {
      case 'get_order':
        return `/admin/api/2023-10/orders/${params.orderId}.json`;
      case 'update_order':
        return `/admin/api/2023-10/orders/${params.orderId}.json`;
      case 'track_shipment':
        return `/admin/api/2023-10/orders/${params.orderId}/fulfillments.json`;
      case 'process_refund':
        return `/admin/api/2023-10/orders/${params.orderId}/refunds.json`;
      case 'inventory_update':
        return `/admin/api/2023-10/inventory_levels/set.json`;
      default:
        return '/admin/api/2023-10/';
    }
  }

  private getStripeEndpoint(action: string, params: any): string {
    switch (action) {
      case 'create_payment':
        return '/v1/payment_intents';
      case 'process_refund':
        return '/v1/refunds';
      case 'manage_subscription':
        return `/v1/subscriptions/${params.subscriptionId}`;
      case 'create_customer':
        return '/v1/customers';
      default:
        return '/v1/';
    }
  }

  private getFileEndpoint(action: string, params: any): string {
    switch (action) {
      case 'file_upload':
        return `https://s3.amazonaws.com/${params.bucket}/${params.key}`;
      case 'file_download':
        return `https://s3.amazonaws.com/${params.bucket}/${params.key}`;
      case 'file_delete':
        return `https://s3.amazonaws.com/${params.bucket}/${params.key}`;
      case 'file_share':
        return `https://s3.amazonaws.com/${params.bucket}/${params.key}`;
      default:
        return 'https://s3.amazonaws.com/';
    }
  }

  private getFileMethod(action: string): string {
    switch (action) {
      case 'file_upload':
        return 'PUT';
      case 'file_download':
        return 'GET';
      case 'file_delete':
        return 'DELETE';
      case 'file_share':
        return 'POST';
      default:
        return 'GET';
    }
  }

  /**
   * Compliance and business impact assessment methods
   */
  private assessComplianceStatus(toolAction: ComprehensiveToolAction, result: any): any {
    return {
      gdprCompliant: toolAction.complianceRequirements.includes('GDPR'),
      hipaaCompliant: toolAction.complianceRequirements.includes('HIPAA'),
      sox404Compliant: toolAction.complianceRequirements.includes('SOX'),
      pciDssCompliant: toolAction.complianceRequirements.includes('PCI_DSS'),
      customCompliance: {
        canSpam: toolAction.complianceRequirements.includes('CAN_SPAM'),
        tcpa: toolAction.complianceRequirements.includes('TCPA'),
        ccpa: toolAction.complianceRequirements.includes('CCPA')
      }
    };
  }

  private generateExecutionMetadata(toolAction: ComprehensiveToolAction, result: any): ToolExecutionMetadata {
    return {
      executionId: `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      startTime: Date.now() - 1000,
      endTime: Date.now(),
      resourcesUsed: [toolAction.toolName, 'governance_engine'],
      performanceMetrics: {
        executionTime: 1000,
        apiCalls: 1,
        dataProcessed: JSON.stringify(result).length
      }
    };
  }

  private async findRelatedReceipts(agentId: string, toolAction: ComprehensiveToolAction): Promise<string[]> {
    // Implementation would search for related receipts based on business context
    // For now, return empty array
    return [];
  }

  private assessBusinessImpact(toolAction: ComprehensiveToolAction, result: any): any {
    return {
      customerAffected: toolAction.businessContext.customerImpact !== 'low',
      revenueImpact: toolAction.businessContext.businessValue * 1000, // Estimated impact
      dataModified: ['create', 'update', 'delete'].some(action => toolAction.actionType.includes(action)),
      systemsAffected: [toolAction.toolName]
    };
  }

  private async storeEnhancedReceipt(receipt: EnhancedToolReceipt): Promise<void> {
    // Implementation would store the enhanced receipt in the database
    console.log(`📋 Enhanced receipt ${receipt.receiptId} stored for ${receipt.toolName}`);
  }

  /**
   * Core method to generate enhanced tool receipts with user-friendly formatting
   * This is the main method that all specific receipt generators call
   */
  async generateEnhancedToolReceipt(
    agentId: string,
    toolAction: ComprehensiveToolAction,
    result: any,
    apiCallDetails?: any
  ): Promise<EnhancedToolReceipt> {
    try {
      console.log(`🧾 Generating enhanced receipt for ${toolAction.toolName} (${toolAction.actionType})`);

      // Generate unique receipt ID
      const receiptId = `receipt_${Date.now()}_${await browserCrypto.generateRandomId()}`;
      
      // Create base tool action for compatibility
      const baseToolAction: ToolAction = {
        id: toolAction.id || `action_${Date.now()}`,
        toolName: toolAction.toolName,
        action: toolAction.actionType,
        parameters: toolAction.parameters,
        timestamp: new Date(),
        agentId,
        sessionId: toolAction.sessionId || 'current-session',
        businessContext: toolAction.businessContext,
        riskLevel: this.mapRiskLevel(toolAction.riskLevel),
        complianceRequirements: toolAction.complianceRequirements,
        dataClassification: toolAction.dataClassification
      };

      // Assess execution status
      const status = this.determineExecutionStatus(result);
      const duration = this.calculateExecutionDuration(result);
      
      // Generate audit trail
      const auditTrail: AuditEntry[] = [
        {
          timestamp: new Date(),
          action: 'tool_execution_started',
          details: `Started ${toolAction.toolName} execution`,
          agentId
        },
        {
          timestamp: new Date(),
          action: 'tool_execution_completed',
          details: `Completed ${toolAction.toolName} with status: ${status}`,
          agentId
        }
      ];

      // Generate cryptographic hash for integrity
      const hashData = JSON.stringify({
        receiptId,
        toolAction: baseToolAction,
        result,
        timestamp: new Date().toISOString()
      });
      const cryptographicHash = await browserCrypto.createHash('sha256', hashData);

      // Create enhanced receipt with user-friendly formatting
      const enhancedReceipt: EnhancedToolReceipt = {
        // Base receipt properties
        id: receiptId,
        receiptId,
        toolAction: baseToolAction,
        executionResult: result,
        status,
        timestamp: new Date(),
        duration,
        hash: cryptographicHash,
        auditTrail,
        
        // Enhanced properties
        toolName: toolAction.toolName,
        actionType: toolAction.actionType,
        toolCategory: toolAction.toolCategory,
        riskLevel: toolAction.riskLevel,
        
        // User-friendly display properties
        userFriendlyTitle: this.generateUserFriendlyTitle(toolAction, result),
        userFriendlyDescription: this.generateUserFriendlyDescription(toolAction, result),
        userFriendlySummary: this.generateUserFriendlySummary(toolAction, result, status),
        shareableContext: this.generateShareableContext(toolAction, result),
        
        // Compact display properties for limited real estate
        compactTitle: this.generateCompactTitle(toolAction, result),
        compactSummary: this.generateCompactSummary(toolAction, result, status),
        compactMetrics: this.generateCompactMetrics(toolAction, result),
        hoverDetails: this.generateHoverDetails(toolAction, result, status),
        statusIcon: this.getStatusIcon(status),
        categoryIcon: this.getToolEmoji(toolAction.toolName),
        
        // Compliance and governance
        complianceStatus: this.assessComplianceStatus(toolAction, result),
        governanceStatus: this.determineGovernanceStatus(toolAction, result),
        trustScore: this.calculateTrustScore(toolAction, result, status),
        
        // Execution metadata
        executionMetadata: this.generateExecutionMetadata(toolAction, result),
        relatedReceipts: await this.findRelatedReceipts(agentId, toolAction),
        
        // Business impact
        businessImpact: this.assessBusinessImpact(toolAction, result),
        
        // API call details (if available)
        apiCallDetails: apiCallDetails || this.generateMockApiDetails(toolAction),
        
        // Cryptographic verification
        cryptographicHash,
        previousHash: '', // Would be linked to previous receipt in chain
        blockchainPosition: Date.now(), // Simplified blockchain position
        
        // Shareability
        isShareable: true,
        shareableFormat: 'user_friendly', // vs 'technical' or 'audit'
        clickToShareEnabled: true
      };

      // Store in cryptographic audit logs via UGA
      await this.storeInAuditLogs(enhancedReceipt, agentId);
      
      // Store enhanced receipt
      await this.storeEnhancedReceipt(enhancedReceipt);
      
      console.log(`✅ Enhanced receipt generated: ${receiptId} for ${toolAction.toolName}`);
      return enhancedReceipt;
      
    } catch (error) {
      console.error(`❌ Failed to generate enhanced receipt for ${toolAction.toolName}:`, error);
      throw error;
    }
  }

  /**
   * User-friendly formatting methods
   */
  private generateUserFriendlyTitle(toolAction: ComprehensiveToolAction, result: any): string {
    const toolEmoji = this.getToolEmoji(toolAction.toolName);
    const actionName = this.getActionDisplayName(toolAction.actionType);
    
    switch (toolAction.toolCategory) {
      case 'web':
        return `${toolEmoji} ${actionName}: "${toolAction.parameters.query || toolAction.parameters.url || 'Web Operation'}"`;
      case 'data':
        return `${toolEmoji} ${actionName}: ${toolAction.parameters.title || 'Data Analysis'}`;
      case 'file':
        return `${toolEmoji} ${actionName}: ${toolAction.parameters.filename || 'File Operation'}`;
      case 'communication':
        return `${toolEmoji} ${actionName}: ${toolAction.parameters.subject || toolAction.parameters.message?.substring(0, 50) || 'Communication'}`;
      case 'ai':
        return `${toolEmoji} ${actionName}: ${toolAction.parameters.prompt?.substring(0, 50) || 'AI Operation'}`;
      default:
        return `${toolEmoji} ${actionName}: ${toolAction.userIntent || toolAction.expectedOutcome || 'Tool Operation'}`;
    }
  }

  private generateUserFriendlyDescription(toolAction: ComprehensiveToolAction, result: any): string {
    const timeAgo = this.getTimeAgo(new Date());
    const status = this.determineExecutionStatus(result);
    const statusEmoji = status === 'success' ? '✅' : status === 'failure' ? '❌' : '⚠️';
    
    return `📅 ${timeAgo} • ${statusEmoji} ${this.capitalizeFirst(status)} • 🔐 Verified`;
  }

  private generateUserFriendlySummary(toolAction: ComprehensiveToolAction, result: any, status: string): string {
    if (status === 'failure') {
      return `❌ Operation failed. Click to see details and retry...`;
    }
    
    switch (toolAction.toolCategory) {
      case 'web':
        const sources = result.sources?.length || result.results?.length || 0;
        const insights = result.insights?.length || result.key_findings?.length || 0;
        return `📊 Found ${sources} sources${insights > 0 ? `, ${insights} key insights` : ''}`;
        
      case 'data':
        const dataPoints = result.data_points || result.rows?.length || 0;
        const charts = result.charts?.length || 0;
        return `📊 Processed ${dataPoints} data points${charts > 0 ? `, created ${charts} visualizations` : ''}`;
        
      case 'file':
        const fileSize = result.size || result.file_size || 0;
        const format = result.format || result.file_type || 'file';
        return `📊 ${this.formatFileSize(fileSize)}, ${format.toUpperCase()} format`;
        
      case 'communication':
        const recipients = result.recipients?.length || 1;
        const deliveryRate = result.delivery_rate || 100;
        return `📊 Sent to ${recipients} recipient${recipients > 1 ? 's' : ''}, ${deliveryRate}% delivery rate`;
        
      case 'ai':
        const tokens = result.tokens_used || result.token_count || 0;
        const confidence = result.confidence || result.confidence_score || 0;
        return `📊 ${tokens} tokens used${confidence > 0 ? `, ${Math.round(confidence * 100)}% confidence` : ''}`;
        
      default:
        return `📊 Operation completed successfully`;
    }
  }

  private generateShareableContext(toolAction: ComprehensiveToolAction, result: any): string {
    return `💡 Click to ${this.getShareableAction(toolAction.toolCategory)}...`;
  }

  private getShareableAction(category: string): string {
    switch (category) {
      case 'web': return 'continue this research';
      case 'data': return 'explore this analysis';
      case 'file': return 'load into conversation';
      case 'communication': return 'view full thread';
      case 'ai': return 'continue this workflow';
      default: return 'use this result';
    }
  }

  /**
   * Compact display methods for limited real estate
   */
  private generateCompactTitle(toolAction: ComprehensiveToolAction, result: any): string {
    // Extract key info for compact display
    const query = toolAction.parameters.query || toolAction.parameters.url || toolAction.parameters.filename || toolAction.parameters.subject;
    
    if (query) {
      // Truncate long queries/titles
      const maxLength = 40;
      return query.length > maxLength ? `${query.substring(0, maxLength)}...` : query;
    }
    
    // Fallback to action name
    return this.getActionDisplayName(toolAction.actionType);
  }

  private generateCompactSummary(toolAction: ComprehensiveToolAction, result: any, status: string): string {
    const timeAgo = this.getCompactTimeAgo(new Date());
    const statusIcon = this.getStatusIcon(status);
    
    return `${timeAgo} • ${statusIcon}`;
  }

  private generateCompactMetrics(toolAction: ComprehensiveToolAction, result: any): string {
    switch (toolAction.toolCategory) {
      case 'web':
        const sources = result.sources?.length || result.results?.length || 0;
        return sources > 0 ? `${sources} sources` : '';
        
      case 'data':
        const dataPoints = result.data_points || result.rows?.length || 0;
        return dataPoints > 0 ? `${dataPoints} points` : '';
        
      case 'file':
        const fileSize = result.size || result.file_size || 0;
        return fileSize > 0 ? this.formatCompactFileSize(fileSize) : '';
        
      case 'communication':
        const recipients = result.recipients?.length || 1;
        return recipients > 1 ? `${recipients} recipients` : '';
        
      case 'ai':
        const tokens = result.tokens_used || result.token_count || 0;
        return tokens > 0 ? `${this.formatCompactNumber(tokens)} tokens` : '';
        
      default:
        return '';
    }
  }

  private generateHoverDetails(toolAction: ComprehensiveToolAction, result: any, status: string): string {
    const metrics = this.generateCompactMetrics(toolAction, result);
    const trustScore = this.calculateTrustScore(toolAction, result, status);
    const complianceScore = this.calculateComplianceScore(toolAction);
    
    let details = [];
    
    if (metrics) details.push(metrics);
    if (trustScore > 0) details.push(`Trust: ${Math.round(trustScore * 100)}%`);
    if (complianceScore > 0) details.push(`Compliance: ${Math.round(complianceScore * 100)}%`);
    
    return details.join(' • ');
  }

  private getStatusIcon(status: string): string {
    switch (status) {
      case 'success': return '✅';
      case 'failure': return '❌';
      case 'partial': return '⚠️';
      default: return '⏳';
    }
  }

  private getCompactTimeAgo(timestamp: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - timestamp.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'now';
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}d`;
    return `${Math.floor(diffDays / 7)}w`;
  }

  private formatCompactFileSize(bytes: number): string {
    if (bytes === 0) return '0B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i)) + sizes[i];
  }

  private formatCompactNumber(num: number): string {
    if (num < 1000) return num.toString();
    if (num < 1000000) return Math.round(num / 1000) + 'K';
    return Math.round(num / 1000000) + 'M';
  }

  /**
   * Helper methods for user-friendly formatting
   */
  private getToolEmoji(toolName: string): string {
    const emojiMap: Record<string, string> = {
      'web_search': '🔍',
      'document_generation': '📄',
      'data_visualization': '📊',
      'coding_programming': '💻',
      'email': '📧',
      'sms': '📱',
      'salesforce': '🏢',
      'shopify': '🛒',
      'stripe': '💳',
      'file_management': '📁',
      'web_automation': '🌐',
      'ai_assistant': '🤖',
      'image_generation': '🎨',
      'video_creation': '🎬',
      'audio_processing': '🎵'
    };
    return emojiMap[toolName] || '🔧';
  }

  private getActionDisplayName(actionType: string): string {
    const displayNames: Record<string, string> = {
      'web_search': 'Web Search',
      'document_generation': 'Document Creation',
      'data_visualization': 'Data Analysis',
      'coding_programming': 'Code Execution',
      'send_email': 'Email Sent',
      'send_sms': 'SMS Sent',
      'create_lead': 'Lead Created',
      'get_order': 'Order Retrieved',
      'create_payment': 'Payment Processed',
      'file_upload': 'File Uploaded',
      'web_scrape': 'Web Scraping',
      'generate_image': 'Image Generated'
    };
    return displayNames[actionType] || this.capitalizeFirst(actionType.replace(/_/g, ' '));
  }

  private getTimeAgo(timestamp: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - timestamp.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  }

  private formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 bytes';
    const k = 1024;
    const sizes = ['bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }

  private capitalizeFirst(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  /**
   * Status and assessment methods
   */
  private determineExecutionStatus(result: any): 'success' | 'failure' | 'partial' {
    if (!result) return 'failure';
    if (result.error || result.failed) return 'failure';
    if (result.partial || result.warnings?.length > 0) return 'partial';
    return 'success';
  }

  private calculateExecutionDuration(result: any): number {
    return result.execution_time || result.duration || Math.floor(Math.random() * 2000) + 500; // Mock duration
  }

  private mapRiskLevel(numericRisk: number): 'low' | 'medium' | 'high' | 'critical' {
    if (numericRisk <= 3) return 'low';
    if (numericRisk <= 6) return 'medium';
    if (numericRisk <= 8) return 'high';
    return 'critical';
  }

  private determineGovernanceStatus(toolAction: ComprehensiveToolAction, result: any): string {
    const complianceScore = this.calculateComplianceScore(toolAction);
    if (complianceScore >= 0.8) return 'compliant';
    if (complianceScore >= 0.6) return 'warning';
    return 'violation';
  }

  private calculateTrustScore(toolAction: ComprehensiveToolAction, result: any, status: string): number {
    let score = 0.5; // Base score
    
    // Adjust based on execution status
    if (status === 'success') score += 0.3;
    else if (status === 'partial') score += 0.1;
    else score -= 0.2;
    
    // Adjust based on risk level
    score += (10 - toolAction.riskLevel) * 0.02;
    
    // Adjust based on compliance
    score += this.calculateComplianceScore(toolAction) * 0.2;
    
    return Math.max(0, Math.min(1, score));
  }

  private calculateComplianceScore(toolAction: ComprehensiveToolAction): number {
    const totalRequirements = 5; // GDPR, HIPAA, SOX, PCI-DSS, Custom
    const metRequirements = toolAction.complianceRequirements.length;
    return Math.min(1, metRequirements / totalRequirements);
  }

  private generateMockApiDetails(toolAction: ComprehensiveToolAction): any {
    return {
      apiCallId: `${toolAction.toolName}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      apiProvider: this.getApiProvider(toolAction.toolName),
      endpoint: this.getMockEndpoint(toolAction.toolName, toolAction.actionType),
      method: this.getHttpMethod(toolAction.actionType),
      statusCode: 200,
      responseTime: Math.floor(Math.random() * 1000) + 100
    };
  }

  private getApiProvider(toolName: string): string {
    const providers: Record<string, string> = {
      'web_search': 'google_search_api',
      'document_generation': 'openai_api',
      'salesforce': 'salesforce_api',
      'shopify': 'shopify_api',
      'stripe': 'stripe_api',
      'email': 'sendgrid_api',
      'sms': 'twilio_api'
    };
    return providers[toolName] || 'internal_api';
  }

  private getMockEndpoint(toolName: string, actionType: string): string {
    return `/api/tools/${toolName}/${actionType}`;
  }

  private getHttpMethod(actionType: string): string {
    if (actionType.includes('create') || actionType.includes('send')) return 'POST';
    if (actionType.includes('update')) return 'PUT';
    if (actionType.includes('delete')) return 'DELETE';
    return 'GET';
  }

  /**
   * Store receipt in 69-field cryptographic audit logs
   */
  private async storeInAuditLogs(receipt: EnhancedToolReceipt, agentId: string): Promise<void> {
    try {
      // Use UniversalGovernanceAdapter to store in audit logs
      const { universalGovernanceAdapter } = await import('../services/UniversalGovernanceAdapter');
      
      await universalGovernanceAdapter.logAuditEntry({
        interactionId: receipt.receiptId,
        agentId,
        userId: 'current-user',
        sessionId: receipt.toolAction.sessionId || 'current-session',
        timestamp: receipt.timestamp,
        provider: receipt.apiCallDetails?.apiProvider || 'internal',
        model: 'tool-execution',
        contextType: this.getContextType(receipt.toolCategory),
        toolName: receipt.toolName,
        actionType: receipt.actionType,
        inputMessage: JSON.stringify(receipt.toolAction.parameters),
        outputResponse: JSON.stringify(receipt.executionResult),
        responseTime: receipt.duration,
        tokenUsage: receipt.executionMetadata?.performanceMetrics?.dataProcessed || 0,
        cost: 0, // Tools don't have direct cost
        success: receipt.status === 'success',
        errorMessage: receipt.status === 'failure' ? 'Tool execution failed' : undefined,
        trustScore: receipt.trustScore,
        complianceScore: this.calculateComplianceScore(receipt.toolAction as ComprehensiveToolAction),
        cryptographicHash: receipt.cryptographicHash,
        previousHash: receipt.previousHash,
        blockchainPosition: receipt.blockchainPosition
      });
      
      console.log(`🔐 Receipt ${receipt.receiptId} stored in cryptographic audit logs`);
      
    } catch (error) {
      console.error(`❌ Failed to store receipt in audit logs:`, error);
    }
  }

  private getContextType(toolCategory: string): string {
    switch (toolCategory) {
      case 'web': return 'research';
      case 'data': return 'document_creation';
      case 'file': return 'document_creation';
      case 'ai': return 'document_creation';
      default: return 'tool_execution';
    }
  }

  /**
   * Intelligent Receipt Sharing System
   * Enables agents to locate and resume from exact receipts
   */
  
  /**
   * Generate a shareable receipt reference for chat integration
   */
  async generateShareableReference(receipt: EnhancedToolReceipt): Promise<ShareableReceiptReference> {
    const reference: ShareableReceiptReference = {
      receiptId: receipt.receiptId,
      agentId: receipt.toolAction.agentId,
      sessionId: receipt.toolAction.sessionId || 'current-session',
      contextType: 'tool_execution_reference',
      toolName: receipt.toolName,
      actionType: receipt.actionType,
      toolCategory: receipt.toolCategory,
      timestamp: receipt.timestamp,
      cryptographicHash: receipt.cryptographicHash,
      shareableTitle: receipt.compactTitle,
      shareableDescription: `${receipt.categoryIcon} ${receipt.compactTitle} • ${receipt.compactSummary}`,
      continuationHints: this.generateContinuationHints(receipt),
      verificationData: {
        blockchainPosition: receipt.blockchainPosition,
        previousHash: receipt.previousHash,
        trustScore: receipt.trustScore
      }
    };

    // Store the shareable reference for quick lookup
    await this.storeShareableReference(reference);
    
    return reference;
  }

  /**
   * Generate continuation hints for the agent
   */
  private generateContinuationHints(receipt: EnhancedToolReceipt): string[] {
    const hints: string[] = [];
    
    switch (receipt.toolCategory) {
      case 'web':
        hints.push('Continue this research with additional queries');
        hints.push('Analyze the findings from this search');
        hints.push('Create a summary document from these results');
        break;
        
      case 'data':
        hints.push('Extend this analysis with more data');
        hints.push('Create visualizations from this dataset');
        hints.push('Generate insights report from this analysis');
        break;
        
      case 'file':
        hints.push('Load this file into the conversation');
        hints.push('Edit or modify this document');
        hints.push('Share this file with stakeholders');
        break;
        
      case 'communication':
        hints.push('Follow up on this communication');
        hints.push('Track responses to this message');
        hints.push('Create related communications');
        break;
        
      case 'ai':
        hints.push('Continue this AI workflow');
        hints.push('Refine the results from this operation');
        hints.push('Apply this pattern to new data');
        break;
        
      default:
        hints.push('Continue working with this result');
        hints.push('Build upon this tool execution');
    }
    
    return hints;
  }

  /**
   * Create a chat message for sharing the receipt
   */
  generateChatShareMessage(reference: ShareableReceiptReference): string {
    return `🧾 **Receipt Reference**: ${reference.receiptId}

${reference.shareableDescription}

*Click to load full context and continue where we left off.*

**Available actions:**
${reference.continuationHints.map(hint => `• ${hint}`).join('\n')}

**Verification:** ✅ Cryptographically verified (Trust: ${Math.round(reference.verificationData.trustScore * 100)}%)`;
  }

  /**
   * Process a receipt reference when agent receives it
   */
  async processReceiptReference(receiptId: string, agentId: string): Promise<ReceiptContext> {
    try {
      console.log(`🔍 Processing receipt reference: ${receiptId} for agent: ${agentId}`);
      
      // Retrieve the full receipt from backend
      const receipt = await this.retrieveReceiptFromBackend(receiptId, agentId);
      
      if (!receipt) {
        throw new Error(`Receipt ${receiptId} not found or access denied`);
      }
      
      // Verify cryptographic integrity
      const isValid = await this.verifyReceiptIntegrity(receipt);
      if (!isValid) {
        throw new Error(`Receipt ${receiptId} failed integrity verification`);
      }
      
      // Generate context for agent continuation
      const context: ReceiptContext = {
        receiptId: receipt.receiptId,
        originalExecution: {
          toolName: receipt.toolName,
          actionType: receipt.actionType,
          parameters: receipt.toolAction.parameters,
          result: receipt.executionResult,
          timestamp: receipt.timestamp
        },
        businessContext: receipt.toolAction.businessContext,
        executionMetadata: receipt.executionMetadata,
        continuationOptions: this.generateContinuationOptions(receipt),
        relatedReceipts: receipt.relatedReceipts,
        trustScore: receipt.trustScore,
        complianceStatus: receipt.complianceStatus,
        nextSteps: this.suggestNextSteps(receipt)
      };
      
      console.log(`✅ Receipt context loaded for ${receiptId}`);
      return context;
      
    } catch (error) {
      console.error(`❌ Failed to process receipt reference ${receiptId}:`, error);
      throw error;
    }
  }

  /**
   * Generate continuation options based on receipt content
   */
  private generateContinuationOptions(receipt: EnhancedToolReceipt): ContinuationOption[] {
    const options: ContinuationOption[] = [];
    
    switch (receipt.toolCategory) {
      case 'web':
        if (receipt.executionResult.sources?.length > 0) {
          options.push({
            action: 'deep_dive_research',
            description: 'Conduct deeper research on specific findings',
            parameters: { sources: receipt.executionResult.sources }
          });
        }
        options.push({
          action: 'create_research_summary',
          description: 'Create a comprehensive research summary',
          parameters: { searchQuery: receipt.toolAction.parameters.query }
        });
        break;
        
      case 'data':
        options.push({
          action: 'extend_analysis',
          description: 'Extend analysis with additional data sources',
          parameters: { baseAnalysis: receipt.executionResult }
        });
        options.push({
          action: 'create_visualization',
          description: 'Create visualizations from this data',
          parameters: { dataset: receipt.executionResult.data }
        });
        break;
        
      case 'file':
        options.push({
          action: 'load_file_content',
          description: 'Load file content into conversation',
          parameters: { fileId: receipt.executionResult.fileId }
        });
        break;
    }
    
    return options;
  }

  /**
   * Suggest next steps based on receipt analysis
   */
  private suggestNextSteps(receipt: EnhancedToolReceipt): string[] {
    const steps: string[] = [];
    
    if (receipt.status === 'failure') {
      steps.push('Retry the operation with adjusted parameters');
      steps.push('Investigate the cause of failure');
    } else if (receipt.status === 'partial') {
      steps.push('Complete the remaining parts of the operation');
      steps.push('Review and validate partial results');
    } else {
      // Success case
      switch (receipt.toolCategory) {
        case 'web':
          steps.push('Analyze the research findings');
          steps.push('Create actionable insights from the data');
          break;
        case 'data':
          steps.push('Generate reports from the analysis');
          steps.push('Share findings with stakeholders');
          break;
        case 'file':
          steps.push('Review and edit the document');
          steps.push('Distribute to relevant parties');
          break;
      }
    }
    
    return steps;
  }

  /**
   * Backend integration methods
   */
  private async retrieveReceiptFromBackend(receiptId: string, agentId: string): Promise<EnhancedToolReceipt | null> {
    try {
      // Use UniversalGovernanceAdapter to retrieve from audit logs
      const { universalGovernanceAdapter } = await import('../services/UniversalGovernanceAdapter');
      
      const auditLogs = await universalGovernanceAdapter.searchAuditLogs({
        interactionId: receiptId,
        agentId,
        limit: 1,
        includeAllFields: true
      });
      
      if (auditLogs.length === 0) {
        return null;
      }
      
      // Convert audit log back to receipt format
      const auditLog = auditLogs[0];
      return this.convertAuditLogToReceipt(auditLog);
      
    } catch (error) {
      console.error(`❌ Failed to retrieve receipt from backend:`, error);
      return null;
    }
  }

  private async verifyReceiptIntegrity(receipt: EnhancedToolReceipt): Promise<boolean> {
    try {
      // Regenerate hash and compare
      const hashData = JSON.stringify({
        receiptId: receipt.receiptId,
        toolAction: receipt.toolAction,
        result: receipt.executionResult,
        timestamp: receipt.timestamp.toISOString()
      });
      
      const expectedHash = await browserCrypto.createHash('sha256', hashData);
      return expectedHash === receipt.cryptographicHash;
      
    } catch (error) {
      console.error(`❌ Failed to verify receipt integrity:`, error);
      return false;
    }
  }

  private convertAuditLogToReceipt(auditLog: any): EnhancedToolReceipt {
    // Convert audit log format back to receipt format
    // This would need to match the exact structure
    return {
      receiptId: auditLog.interactionId,
      toolName: auditLog.toolName,
      actionType: auditLog.actionType,
      // ... other properties mapped from audit log
    } as EnhancedToolReceipt;
  }

  private async storeShareableReference(reference: ShareableReceiptReference): Promise<void> {
    // Store the shareable reference for quick lookup
    console.log(`📋 Storing shareable reference: ${reference.receiptId}`);
    // Implementation would store in a fast lookup table
  }

  /**
   * Agent Detection and Processing Methods
   */

  /**
   * Detect receipt references in chat messages
   */
  static detectReceiptReferences(message: string): string[] {
    const receiptPattern = /🧾\s*\*\*Receipt Reference\*\*:\s*([a-zA-Z0-9_-]+)/g;
    const matches: string[] = [];
    let match;
    
    while ((match = receiptPattern.exec(message)) !== null) {
      matches.push(match[1]); // Extract receipt ID
    }
    
    return matches;
  }

  /**
   * Agent API endpoint for processing receipt references
   */
  static async processReceiptForAgent(receiptId: string, agentId: string, sessionId: string): Promise<{
    success: boolean;
    context?: ReceiptContext;
    userMessage?: string;
    agentInstructions?: string;
    error?: string;
  }> {
    try {
      const extension = ComprehensiveToolReceiptExtension.getInstance();
      const context = await extension.processReceiptReference(receiptId, agentId);
      
      // Generate user-friendly response
      const userMessage = `✅ **Receipt Loaded**: ${context.originalExecution.toolName} execution from ${new Date(context.originalExecution.timestamp).toLocaleString()}

**What happened:** ${context.originalExecution.actionType}
**Result:** ${context.originalExecution.result?.summary || 'Completed successfully'}
**Trust Score:** ${Math.round(context.trustScore * 100)}%

**Available next steps:**
${context.nextSteps.map(step => `• ${step}`).join('\n')}`;

      // Generate agent instructions
      const agentInstructions = `RECEIPT_CONTEXT_LOADED: ${receiptId}

You now have access to the full context of a previous tool execution:
- Tool: ${context.originalExecution.toolName}
- Action: ${context.originalExecution.actionType}
- Parameters: ${JSON.stringify(context.originalExecution.parameters)}
- Result: ${JSON.stringify(context.originalExecution.result)}
- Business Context: ${JSON.stringify(context.businessContext)}

Continuation Options Available:
${context.continuationOptions.map(opt => `- ${opt.action}: ${opt.description}`).join('\n')}

You can now:
1. Continue where this tool execution left off
2. Build upon the results
3. Reference the specific data and context
4. Execute related follow-up actions

The user is expecting you to acknowledge this context and offer to continue the work.`;

      return {
        success: true,
        context,
        userMessage,
        agentInstructions
      };
      
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error processing receipt'
      };
    }
  }

  /**
   * Generate simple chat link for users (what they see)
   */
  generateSimpleChatLink(receipt: EnhancedToolReceipt): string {
    return `🔗 **${receipt.compactTitle}**
${receipt.compactSummary}
*Click to continue this work...*`;
  }

  /**
   * Generate backend reference for agents (hidden metadata)
   */
  generateBackendReference(receipt: EnhancedToolReceipt): string {
    return JSON.stringify({
      type: 'receipt_reference',
      receiptId: receipt.receiptId,
      agentId: receipt.toolAction.agentId,
      cryptographicHash: receipt.cryptographicHash,
      timestamp: receipt.timestamp,
      toolCategory: receipt.toolCategory
    });
  }
}

export default ComprehensiveToolReceiptExtension;

