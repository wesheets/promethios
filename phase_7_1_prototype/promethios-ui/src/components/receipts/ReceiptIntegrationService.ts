/**
 * Receipt Integration Service
 * 
 * Integrates the Tool Receipt Extension with the Universal Governance Adapter
 * to automatically generate receipts for all agent tool usage. Provides seamless
 * receipt generation for Salesforce, Shopify, email, SMS, and other tool operations.
 */

import { ToolReceiptExtension, ToolAction, BusinessContext } from '../../extensions/ToolReceiptExtension';
import { UniversalGovernanceAdapter } from '../../services/UniversalGovernanceAdapter';

export interface ToolExecutionContext {
  agentId: string;
  toolName: string;
  actionType: string;
  parameters: Record<string, any>;
  userIntent: string;
  businessContext: BusinessContext;
}

export interface ToolExecutionResult {
  success: boolean;
  data: any;
  error?: string;
  warnings?: string[];
  recordIds?: string[];
  apiCallDetails?: {
    apiCallId: string;
    apiProvider: string;
    endpoint: string;
    method: string;
    requestHeaders: Record<string, string>;
    responseHeaders: Record<string, string>;
    statusCode: number;
    rawApiUrl: string;
  };
}

/**
 * Service class that integrates receipt generation with tool execution
 */
export class ReceiptIntegrationService {
  private static instance: ReceiptIntegrationService;
  private receiptExtension: ToolReceiptExtension;
  private governanceAdapter: UniversalGovernanceAdapter;

  private constructor() {
    this.receiptExtension = ToolReceiptExtension.getInstance();
    this.governanceAdapter = UniversalGovernanceAdapter.getInstance();
  }

  static getInstance(): ReceiptIntegrationService {
    if (!ReceiptIntegrationService.instance) {
      ReceiptIntegrationService.instance = new ReceiptIntegrationService();
    }
    return ReceiptIntegrationService.instance;
  }

  async initialize(): Promise<boolean> {
    try {
      await this.receiptExtension.initialize();
      console.log('ReceiptIntegrationService initialized successfully');
      return true;
    } catch (error) {
      console.error('Failed to initialize ReceiptIntegrationService:', error);
      return false;
    }
  }

  /**
   * Execute a tool action with automatic receipt generation
   */
  async executeToolWithReceipt(
    context: ToolExecutionContext,
    toolExecutor: () => Promise<ToolExecutionResult>
  ): Promise<{ result: ToolExecutionResult; receiptId: string }> {
    const startTime = Date.now();
    
    try {
      console.log(`🔧 Executing ${context.toolName} action: ${context.actionType}`);
      
      // Execute the tool action
      const result = await toolExecutor();
      
      // Create tool action object for receipt
      const toolAction: ToolAction = {
        toolName: context.toolName,
        actionType: context.actionType,
        parameters: context.parameters,
        userIntent: context.userIntent,
        expectedOutcome: this.generateExpectedOutcome(context),
        businessContext: context.businessContext
      };

      // Generate receipt
      const receipt = await this.receiptExtension.generateToolReceipt(
        context.agentId,
        toolAction,
        result.data,
        result.apiCallDetails
      );

      const executionTime = Date.now() - startTime;
      console.log(`✅ Generated receipt ${receipt.receiptId} for ${context.toolName} (${executionTime}ms)`);

      return {
        result,
        receiptId: receipt.receiptId
      };

    } catch (error) {
      console.error(`❌ Error executing ${context.toolName}:`, error);
      
      // Generate receipt for failed operation
      const toolAction: ToolAction = {
        toolName: context.toolName,
        actionType: context.actionType,
        parameters: context.parameters,
        userIntent: context.userIntent,
        expectedOutcome: this.generateExpectedOutcome(context),
        businessContext: context.businessContext
      };

      const failureResult = {
        success: false,
        data: null,
        error: error instanceof Error ? error.message : 'Unknown error'
      };

      const receipt = await this.receiptExtension.generateToolReceipt(
        context.agentId,
        toolAction,
        failureResult
      );

      throw error;
    }
  }

  /**
   * Salesforce tool integration
   */
  async executeSalesforceAction(
    agentId: string,
    actionType: 'create_lead' | 'update_lead' | 'get_lead' | 'create_opportunity' | 'update_opportunity',
    parameters: Record<string, any>,
    userIntent: string
  ): Promise<{ result: any; receiptId: string }> {
    const context: ToolExecutionContext = {
      agentId,
      toolName: 'salesforce',
      actionType,
      parameters,
      userIntent,
      businessContext: {
        department: 'sales',
        useCase: 'lead_management',
        customerImpact: 'high',
        dataClassification: 'confidential',
        regulatoryScope: ['GDPR', 'CCPA'],
        businessValue: 0.8
      }
    };

    return this.executeToolWithReceipt(context, async () => {
      // Simulate Salesforce API call
      const apiCallId = `sf_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      let result: any;
      let endpoint: string;
      let method: string;

      switch (actionType) {
        case 'create_lead':
          endpoint = '/services/data/v58.0/sobjects/Lead';
          method = 'POST';
          result = {
            id: `00Q${Math.random().toString(36).substr(2, 15)}`,
            success: true,
            name: parameters.firstName + ' ' + parameters.lastName,
            email: parameters.email,
            company: parameters.company
          };
          break;

        case 'get_lead':
          endpoint = `/services/data/v58.0/sobjects/Lead/${parameters.leadId}`;
          method = 'GET';
          result = {
            id: parameters.leadId,
            firstName: 'John',
            lastName: 'Doe',
            email: 'john.doe@example.com',
            company: 'Example Corp',
            status: 'Open - Not Contacted'
          };
          break;

        case 'update_lead':
          endpoint = `/services/data/v58.0/sobjects/Lead/${parameters.leadId}`;
          method = 'PATCH';
          result = {
            id: parameters.leadId,
            success: true,
            updatedFields: Object.keys(parameters).filter(key => key !== 'leadId')
          };
          break;

        default:
          throw new Error(`Unsupported Salesforce action: ${actionType}`);
      }

      return {
        success: true,
        data: result,
        recordIds: [result.id],
        apiCallDetails: {
          apiCallId,
          apiProvider: 'salesforce',
          endpoint,
          method,
          requestHeaders: {
            'Authorization': 'Bearer [REDACTED]',
            'Content-Type': 'application/json'
          },
          responseHeaders: {
            'Content-Type': 'application/json',
            'Sforce-Limit-Info': 'api-usage=123/15000'
          },
          statusCode: method === 'POST' ? 201 : 200,
          rawApiUrl: `https://api.salesforce.com/logs/${apiCallId}`
        }
      };
    });
  }

  /**
   * Shopify tool integration
   */
  async executeShopifyAction(
    agentId: string,
    actionType: 'get_order' | 'update_order' | 'track_shipment' | 'process_refund',
    parameters: Record<string, any>,
    userIntent: string
  ): Promise<{ result: any; receiptId: string }> {
    const context: ToolExecutionContext = {
      agentId,
      toolName: 'shopify',
      actionType,
      parameters,
      userIntent,
      businessContext: {
        department: 'customer_service',
        useCase: 'order_management',
        customerImpact: 'high',
        dataClassification: 'confidential',
        regulatoryScope: ['PCI_DSS', 'GDPR'],
        businessValue: 0.9
      }
    };

    return this.executeToolWithReceipt(context, async () => {
      const apiCallId = `shopify_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      let result: any;
      let endpoint: string;
      let method: string;

      switch (actionType) {
        case 'get_order':
          endpoint = `/admin/api/2023-10/orders/${parameters.orderId}.json`;
          method = 'GET';
          result = {
            order_id: parameters.orderId,
            order_number: `#${Math.floor(Math.random() * 10000)}`,
            customer_email: 'customer@example.com',
            total_price: '99.99',
            currency: 'USD',
            fulfillment_status: 'fulfilled',
            financial_status: 'paid',
            created_at: new Date().toISOString()
          };
          break;

        case 'track_shipment':
          endpoint = `/admin/api/2023-10/orders/${parameters.orderId}/fulfillments.json`;
          method = 'GET';
          result = {
            order_id: parameters.orderId,
            tracking_number: `1Z${Math.random().toString(36).substr(2, 16).toUpperCase()}`,
            tracking_url: 'https://www.ups.com/track?tracknum=1Z999AA1234567890',
            carrier: 'UPS',
            status: 'in_transit',
            estimated_delivery: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString()
          };
          break;

        case 'update_order':
          endpoint = `/admin/api/2023-10/orders/${parameters.orderId}.json`;
          method = 'PUT';
          result = {
            order_id: parameters.orderId,
            success: true,
            updated_fields: Object.keys(parameters).filter(key => key !== 'orderId')
          };
          break;

        default:
          throw new Error(`Unsupported Shopify action: ${actionType}`);
      }

      return {
        success: true,
        data: result,
        recordIds: [result.order_id],
        apiCallDetails: {
          apiCallId,
          apiProvider: 'shopify',
          endpoint,
          method,
          requestHeaders: {
            'X-Shopify-Access-Token': '[REDACTED]',
            'Content-Type': 'application/json'
          },
          responseHeaders: {
            'Content-Type': 'application/json',
            'X-Shopify-Shop-Api-Call-Limit': '2/40'
          },
          statusCode: 200,
          rawApiUrl: `https://shopify.dev/api-logs/${apiCallId}`
        }
      };
    });
  }

  /**
   * Email tool integration
   */
  async executeEmailAction(
    agentId: string,
    actionType: 'send_email' | 'send_bulk_email' | 'track_email',
    parameters: Record<string, any>,
    userIntent: string
  ): Promise<{ result: any; receiptId: string }> {
    const context: ToolExecutionContext = {
      agentId,
      toolName: 'email',
      actionType,
      parameters,
      userIntent,
      businessContext: {
        department: 'marketing',
        useCase: 'customer_communication',
        customerImpact: 'medium',
        dataClassification: 'internal',
        regulatoryScope: ['CAN_SPAM', 'GDPR'],
        businessValue: 0.6
      }
    };

    return this.executeToolWithReceipt(context, async () => {
      const apiCallId = `email_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      let result: any;
      let endpoint: string;
      let method: string;

      switch (actionType) {
        case 'send_email':
          endpoint = '/v3/mail/send';
          method = 'POST';
          result = {
            message_id: `msg_${Math.random().toString(36).substr(2, 16)}`,
            to: parameters.to,
            subject: parameters.subject,
            status: 'sent',
            sent_at: new Date().toISOString()
          };
          break;

        case 'send_bulk_email':
          endpoint = '/v3/mail/batch';
          method = 'POST';
          result = {
            batch_id: `batch_${Math.random().toString(36).substr(2, 16)}`,
            recipients: parameters.recipients.length,
            status: 'queued',
            estimated_send_time: new Date(Date.now() + 5 * 60 * 1000).toISOString()
          };
          break;

        default:
          throw new Error(`Unsupported email action: ${actionType}`);
      }

      return {
        success: true,
        data: result,
        recordIds: [result.message_id || result.batch_id],
        apiCallDetails: {
          apiCallId,
          apiProvider: 'sendgrid',
          endpoint,
          method,
          requestHeaders: {
            'Authorization': 'Bearer [REDACTED]',
            'Content-Type': 'application/json'
          },
          responseHeaders: {
            'Content-Type': 'application/json',
            'X-Message-Id': result.message_id || result.batch_id
          },
          statusCode: 202,
          rawApiUrl: `https://sendgrid.com/api-logs/${apiCallId}`
        }
      };
    });
  }

  /**
   * SMS tool integration
   */
  async executeSMSAction(
    agentId: string,
    actionType: 'send_sms' | 'send_bulk_sms' | 'track_sms',
    parameters: Record<string, any>,
    userIntent: string
  ): Promise<{ result: any; receiptId: string }> {
    const context: ToolExecutionContext = {
      agentId,
      toolName: 'sms',
      actionType,
      parameters,
      userIntent,
      businessContext: {
        department: 'customer_service',
        useCase: 'urgent_notifications',
        customerImpact: 'high',
        dataClassification: 'confidential',
        regulatoryScope: ['TCPA', 'GDPR'],
        businessValue: 0.7
      }
    };

    return this.executeToolWithReceipt(context, async () => {
      const apiCallId = `sms_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const result = {
        message_sid: `SM${Math.random().toString(36).substr(2, 32)}`,
        to: parameters.to,
        from: parameters.from || '+1234567890',
        body: parameters.message,
        status: 'sent',
        sent_at: new Date().toISOString(),
        price: '0.0075',
        currency: 'USD'
      };

      return {
        success: true,
        data: result,
        recordIds: [result.message_sid],
        apiCallDetails: {
          apiCallId,
          apiProvider: 'twilio',
          endpoint: '/2010-04-01/Accounts/[ACCOUNT_SID]/Messages.json',
          method: 'POST',
          requestHeaders: {
            'Authorization': 'Basic [REDACTED]',
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          responseHeaders: {
            'Content-Type': 'application/json',
            'Twilio-Request-Id': apiCallId
          },
          statusCode: 201,
          rawApiUrl: `https://console.twilio.com/logs/${apiCallId}`
        }
      };
    });
  }

  /**
   * Slack tool integration
   */
  async executeSlackAction(
    agentId: string,
    actionType: 'send_message' | 'create_channel' | 'invite_user',
    parameters: Record<string, any>,
    userIntent: string
  ): Promise<{ result: any; receiptId: string }> {
    const context: ToolExecutionContext = {
      agentId,
      toolName: 'slack',
      actionType,
      parameters,
      userIntent,
      businessContext: {
        department: 'operations',
        useCase: 'team_collaboration',
        customerImpact: 'low',
        dataClassification: 'internal',
        regulatoryScope: [],
        businessValue: 0.4
      }
    };

    return this.executeToolWithReceipt(context, async () => {
      const apiCallId = `slack_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      let result: any;
      let endpoint: string;

      switch (actionType) {
        case 'send_message':
          endpoint = '/api/chat.postMessage';
          result = {
            ts: Date.now().toString() + '.000100',
            channel: parameters.channel,
            message: parameters.text,
            user: 'U1234567890',
            ok: true
          };
          break;

        case 'create_channel':
          endpoint = '/api/conversations.create';
          result = {
            channel: {
              id: `C${Math.random().toString(36).substr(2, 10).toUpperCase()}`,
              name: parameters.name,
              created: Math.floor(Date.now() / 1000),
              creator: 'U1234567890'
            },
            ok: true
          };
          break;

        default:
          throw new Error(`Unsupported Slack action: ${actionType}`);
      }

      return {
        success: true,
        data: result,
        recordIds: [result.ts || result.channel?.id],
        apiCallDetails: {
          apiCallId,
          apiProvider: 'slack',
          endpoint,
          method: 'POST',
          requestHeaders: {
            'Authorization': 'Bearer [REDACTED]',
            'Content-Type': 'application/json'
          },
          responseHeaders: {
            'Content-Type': 'application/json',
            'X-Slack-Req-Id': apiCallId
          },
          statusCode: 200,
          rawApiUrl: `https://api.slack.com/logs/${apiCallId}`
        }
      };
    });
  }

  /**
   * Generate expected outcome based on context
   */
  private generateExpectedOutcome(context: ToolExecutionContext): string {
    const { toolName, actionType, parameters } = context;
    
    switch (toolName) {
      case 'salesforce':
        if (actionType === 'create_lead') {
          return `Create new lead for ${parameters.firstName} ${parameters.lastName} at ${parameters.company}`;
        } else if (actionType === 'get_lead') {
          return `Retrieve lead information for ID ${parameters.leadId}`;
        } else if (actionType === 'update_lead') {
          return `Update lead ${parameters.leadId} with new information`;
        }
        break;
        
      case 'shopify':
        if (actionType === 'get_order') {
          return `Retrieve order details for order ${parameters.orderId}`;
        } else if (actionType === 'track_shipment') {
          return `Get tracking information for order ${parameters.orderId}`;
        }
        break;
        
      case 'email':
        if (actionType === 'send_email') {
          return `Send email to ${parameters.to} with subject "${parameters.subject}"`;
        } else if (actionType === 'send_bulk_email') {
          return `Send bulk email to ${parameters.recipients?.length || 0} recipients`;
        }
        break;
        
      case 'sms':
        if (actionType === 'send_sms') {
          return `Send SMS to ${parameters.to}`;
        }
        break;
        
      case 'slack':
        if (actionType === 'send_message') {
          return `Send message to Slack channel ${parameters.channel}`;
        } else if (actionType === 'create_channel') {
          return `Create new Slack channel "${parameters.name}"`;
        }
        break;
    }
    
    return `Execute ${actionType} using ${toolName}`;
  }
}

export default ReceiptIntegrationService;

