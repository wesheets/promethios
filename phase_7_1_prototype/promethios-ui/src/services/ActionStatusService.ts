/**
 * ActionStatusService.ts
 * 
 * Service for managing real-time action status updates and transparency.
 * Tracks AI agent activities and provides real-time updates to the UI.
 */

import { ActionStatus } from '../components/chat/ActionStatusIndicator';

export type ActionUpdateCallback = (actions: ActionStatus[]) => void;

class ActionStatusService {
  private actions: Map<string, ActionStatus> = new Map();
  private callbacks: Set<ActionUpdateCallback> = new Set();
  private actionCounter = 0;

  /**
   * Subscribe to action status updates
   */
  subscribe(callback: ActionUpdateCallback): () => void {
    this.callbacks.add(callback);
    
    // Send current actions immediately
    callback(Array.from(this.actions.values()));
    
    // Return unsubscribe function
    return () => {
      this.callbacks.delete(callback);
    };
  }

  /**
   * Start a new action
   */
  startAction(
    type: ActionStatus['type'], 
    action: string, 
    details?: string
  ): string {
    const id = `action_${++this.actionCounter}_${Date.now()}`;
    
    const actionStatus: ActionStatus = {
      id,
      type,
      status: 'starting',
      action,
      details,
      timestamp: Date.now()
    };

    this.actions.set(id, actionStatus);
    this.notifyCallbacks();

    // Auto-transition to in_progress after a brief delay
    setTimeout(() => {
      this.updateActionStatus(id, 'in_progress');
    }, 500);

    return id;
  }

  /**
   * Update action status
   */
  updateActionStatus(
    id: string, 
    status: ActionStatus['status'], 
    details?: string, 
    progress?: number
  ): void {
    const action = this.actions.get(id);
    if (!action) return;

    const updatedAction: ActionStatus = {
      ...action,
      status,
      details: details || action.details,
      progress,
      timestamp: status === 'completed' || status === 'error' ? Date.now() : action.timestamp
    };

    this.actions.set(id, updatedAction);
    this.notifyCallbacks();

    // Auto-remove completed/error actions after 3 seconds
    if (status === 'completed' || status === 'error') {
      setTimeout(() => {
        this.actions.delete(id);
        this.notifyCallbacks();
      }, 3000);
    }
  }

  /**
   * Update action progress
   */
  updateActionProgress(id: string, progress: number, details?: string): void {
    this.updateActionStatus(id, 'in_progress', details, progress);
  }

  /**
   * Complete an action
   */
  completeAction(id: string, details?: string): void {
    this.updateActionStatus(id, 'completing');
    
    // Brief delay before marking as completed
    setTimeout(() => {
      this.updateActionStatus(id, 'completed', details);
    }, 300);
  }

  /**
   * Mark action as error
   */
  errorAction(id: string, errorMessage: string): void {
    this.updateActionStatus(id, 'error', errorMessage);
  }

  /**
   * Clear all actions
   */
  clearActions(): void {
    this.actions.clear();
    this.notifyCallbacks();
  }

  /**
   * Get current actions
   */
  getCurrentActions(): ActionStatus[] {
    return Array.from(this.actions.values());
  }

  /**
   * Notify all callbacks of action updates
   */
  private notifyCallbacks(): void {
    const actions = Array.from(this.actions.values());
    this.callbacks.forEach(callback => callback(actions));
  }

  /**
   * Convenience methods for common tool actions
   */
  
  startWebSearch(query: string): string {
    return this.startAction('web_search', 'Searching the web...', `Query: "${query}"`);
  }

  startWebScraping(url: string): string {
    return this.startAction('web_scraping', 'Scraping article content...', `URL: ${url}`);
  }

  startArticleVerification(title: string): string {
    return this.startAction('article_verification', 'Verifying article credibility...', `Article: "${title}"`);
  }

  startSEOAnalysis(url: string): string {
    return this.startAction('seo_analysis', 'Analyzing SEO performance...', `URL: ${url}`);
  }

  startDocumentGeneration(type: string): string {
    return this.startAction('document_generation', 'Generating document...', `Type: ${type}`);
  }

  startDataVisualization(type: string): string {
    return this.startAction('data_visualization', 'Creating visualization...', `Type: ${type}`);
  }

  startCoding(language: string): string {
    return this.startAction('coding', 'Writing code...', `Language: ${language}`);
  }

  startEmailSending(recipient: string): string {
    return this.startAction('email_sending', 'Sending email...', `To: ${recipient}`);
  }

  startSMSMessaging(recipient: string): string {
    return this.startAction('sms_messaging', 'Sending SMS...', `To: ${recipient}`);
  }

  startSlackIntegration(action: string): string {
    return this.startAction('slack_integration', 'Connecting to Slack...', action);
  }

  startShopifyIntegration(action: string): string {
    return this.startAction('shopify_integration', 'Connecting to Shopify...', action);
  }

  startStripePayments(action: string): string {
    return this.startAction('stripe_payments', 'Processing payment...', action);
  }

  startGoogleCalendar(action: string): string {
    return this.startAction('google_calendar', 'Accessing Google Calendar...', action);
  }

  startTwitterPosting(content: string): string {
    return this.startAction('twitter_posting', 'Posting to Twitter...', `Content: "${content.substring(0, 50)}..."`);
  }

  startLinkedInPosting(content: string): string {
    return this.startAction('linkedin_posting', 'Posting to LinkedIn...', `Content: "${content.substring(0, 50)}..."`);
  }

  startGoogleAnalytics(action: string): string {
    return this.startAction('google_analytics', 'Analyzing website data...', action);
  }

  startZapierIntegration(action: string): string {
    return this.startAction('zapier_integration', 'Connecting to Zapier...', action);
  }

  startWorkflowAutomation(workflow: string): string {
    return this.startAction('workflow_automation', 'Automating workflow...', `Workflow: ${workflow}`);
  }

  startWooCommerceIntegration(action: string): string {
    return this.startAction('woocommerce_integration', 'Connecting to WooCommerce...', action);
  }

  startSalesforceCRM(action: string): string {
    return this.startAction('salesforce_crm', 'Accessing Salesforce...', action);
  }
}

// Export singleton instance
export const actionStatusService = new ActionStatusService();
export default ActionStatusService;

