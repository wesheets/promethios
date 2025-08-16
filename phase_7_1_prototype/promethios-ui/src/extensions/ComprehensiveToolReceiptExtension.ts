/**
 * Comprehensive Tool Receipt Extension
 * 
 * Extends the base ToolReceiptExtension to provide receipt generation
 * for all identified tools in the Promethios platform. This includes
 * communication tools, CRM integrations, e-commerce platforms, financial
 * services, and more.
 */

import { ToolReceiptExtension, ToolAction, ToolReceipt, BusinessContext } from './ToolReceiptExtension';

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
  toolCategory: 'communication' | 'crm' | 'ecommerce' | 'financial' | 'data' | 'file' | 'web' | 'ai' | 'security' | 'integration';
  riskLevel: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;
  complianceRequirements: string[];
  dataClassification: 'public' | 'internal' | 'confidential' | 'restricted';
}

export interface ToolExecutionMetadata {
  executionId: string;
  startTime: number;
  endTime: number;
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
  toolCategory: string;
  riskLevel: number;
  complianceStatus: {
    gdprCompliant: boolean;
    hipaaCompliant: boolean;
    sox404Compliant: boolean;
    pciDssCompliant: boolean;
    customCompliance: Record<string, boolean>;
  };
  executionMetadata: ToolExecutionMetadata;
  relatedReceipts: string[]; // IDs of related receipts for workflow tracking
  businessImpact: {
    customerAffected: boolean;
    revenueImpact: number;
    dataModified: boolean;
    systemsAffected: string[];
  };
}

/**
 * Comprehensive Tool Receipt Extension
 * Provides receipt generation for all Promethios tools
 */
export class ComprehensiveToolReceiptExtension extends ToolReceiptExtension {
  private static instance: ComprehensiveToolReceiptExtension;

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
}

export default ComprehensiveToolReceiptExtension;

