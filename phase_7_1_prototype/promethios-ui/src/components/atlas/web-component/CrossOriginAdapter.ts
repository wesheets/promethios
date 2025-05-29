/**
 * CrossOriginAdapter.ts
 * 
 * Provides cross-origin communication capabilities for ATLAS and Trust Shield
 * Ensures compatibility across different domains and environments
 */

export interface CrossOriginMessage {
  type: string;
  payload: any;
  source: 'atlas';
  version: string;
  timestamp: number;
}

export class CrossOriginAdapter {
  private static instance: CrossOriginAdapter;
  private targetOrigins: string[] = ['*']; // Default to all origins, can be restricted
  private messageHandlers: Map<string, Array<(payload: any) => void>> = new Map();
  private isInitialized: boolean = false;
  
  /**
   * Get singleton instance
   */
  public static getInstance(): CrossOriginAdapter {
    if (!CrossOriginAdapter.instance) {
      CrossOriginAdapter.instance = new CrossOriginAdapter();
    }
    return CrossOriginAdapter.instance;
  }
  
  /**
   * Private constructor (use getInstance)
   */
  private constructor() {}
  
  /**
   * Initialize cross-origin communication
   */
  public init(options: { restrictToOrigins?: string[] } = {}): void {
    if (this.isInitialized) return;
    
    // Set target origins if provided
    if (options.restrictToOrigins && options.restrictToOrigins.length > 0) {
      this.targetOrigins = options.restrictToOrigins;
    }
    
    // Set up message listener
    window.addEventListener('message', this.handleIncomingMessage.bind(this), false);
    
    this.isInitialized = true;
  }
  
  /**
   * Handle incoming postMessage events
   */
  private handleIncomingMessage(event: MessageEvent): void {
    // Skip if origin is not allowed (when restrictions are in place)
    if (this.targetOrigins[0] !== '*' && !this.targetOrigins.includes(event.origin)) {
      return;
    }
    
    // Validate message format
    const message = event.data;
    if (!message || typeof message !== 'object' || message.source !== 'atlas') {
      return;
    }
    
    // Process message
    const { type, payload } = message;
    const handlers = this.messageHandlers.get(type) || [];
    
    // Call all registered handlers for this message type
    handlers.forEach(handler => {
      try {
        handler(payload);
      } catch (error) {
        console.error(`Error in ATLAS message handler for type ${type}:`, error);
      }
    });
  }
  
  /**
   * Send message to parent or child frames
   */
  public sendMessage(type: string, payload: any, targetWindow: Window = window.parent): void {
    if (!this.isInitialized) {
      this.init();
    }
    
    const message: CrossOriginMessage = {
      type,
      payload,
      source: 'atlas',
      version: '1.0.0',
      timestamp: Date.now()
    };
    
    // Send to all allowed origins
    this.targetOrigins.forEach(origin => {
      try {
        targetWindow.postMessage(message, origin);
      } catch (error) {
        console.error(`Error sending ATLAS message to ${origin}:`, error);
      }
    });
  }
  
  /**
   * Register handler for specific message type
   */
  public on(type: string, handler: (payload: any) => void): () => void {
    if (!this.isInitialized) {
      this.init();
    }
    
    // Get or create handlers array for this type
    const handlers = this.messageHandlers.get(type) || [];
    handlers.push(handler);
    this.messageHandlers.set(type, handlers);
    
    // Return unsubscribe function
    return () => {
      const currentHandlers = this.messageHandlers.get(type) || [];
      this.messageHandlers.set(
        type,
        currentHandlers.filter(h => h !== handler)
      );
    };
  }
  
  /**
   * Create iframe for cross-origin isolation if needed
   */
  public createIsolationFrame(src: string): HTMLIFrameElement {
    const iframe = document.createElement('iframe');
    iframe.src = src;
    iframe.style.border = 'none';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.position = 'absolute';
    iframe.style.top = '-9999px';
    iframe.style.left = '-9999px';
    
    document.body.appendChild(iframe);
    return iframe;
  }
  
  /**
   * Clean up resources
   */
  public destroy(): void {
    window.removeEventListener('message', this.handleIncomingMessage.bind(this));
    this.messageHandlers.clear();
    this.isInitialized = false;
  }
}

export default CrossOriginAdapter;
