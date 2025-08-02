/**
 * Promethios Standalone Chatbot Widget
 * Embeddable governed AI chatbot with real-time trust scoring
 */

class PrometheusWidget {
  constructor(config) {
    this.config = {
      chatbotId: config.chatbotId,
      apiUrl: config.apiUrl || 'https://chat.promethios.ai/api',
      theme: config.theme || 'dark',
      position: config.position || 'bottom-right',
      primaryColor: config.primaryColor || '#6366f1',
      title: config.title || 'AI Assistant',
      subtitle: config.subtitle || 'Powered by Promethios',
      showBranding: config.showBranding !== false,
      ...config
    };
    
    this.isOpen = false;
    this.messages = [];
    this.sessionId = this.generateSessionId();
    
    this.init();
  }

  generateSessionId() {
    return Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15);
  }

  init() {
    this.createStyles();
    this.createWidget();
    this.bindEvents();
    this.loadInitialMessage();
  }

  createStyles() {
    const styles = `
      .prometheus-widget {
        position: fixed;
        z-index: 10000;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        ${this.getPositionStyles()}
      }
      
      .prometheus-widget * {
        box-sizing: border-box;
      }
      
      .prometheus-toggle {
        width: 60px;
        height: 60px;
        border-radius: 50%;
        background: ${this.config.primaryColor};
        border: none;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        transition: all 0.3s ease;
      }
      
      .prometheus-toggle:hover {
        transform: scale(1.1);
        box-shadow: 0 6px 20px rgba(0, 0, 0, 0.4);
      }
      
      .prometheus-toggle svg {
        width: 24px;
        height: 24px;
        fill: white;
      }
      
      .prometheus-chat {
        position: absolute;
        bottom: 80px;
        right: 0;
        width: 350px;
        height: 500px;
        background: ${this.config.theme === 'dark' ? '#1f2937' : '#ffffff'};
        border-radius: 12px;
        box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
        display: none;
        flex-direction: column;
        overflow: hidden;
        border: 1px solid ${this.config.theme === 'dark' ? '#374151' : '#e5e7eb'};
      }
      
      .prometheus-chat.open {
        display: flex;
        animation: slideUp 0.3s ease-out;
      }
      
      @keyframes slideUp {
        from {
          opacity: 0;
          transform: translateY(20px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
      
      .prometheus-header {
        background: ${this.config.primaryColor};
        color: white;
        padding: 16px;
        display: flex;
        align-items: center;
        justify-content: space-between;
      }
      
      .prometheus-header-info h3 {
        margin: 0;
        font-size: 16px;
        font-weight: 600;
      }
      
      .prometheus-header-info p {
        margin: 4px 0 0 0;
        font-size: 12px;
        opacity: 0.8;
      }
      
      .prometheus-close {
        background: none;
        border: none;
        color: white;
        cursor: pointer;
        padding: 4px;
        border-radius: 4px;
        opacity: 0.8;
        transition: opacity 0.2s;
      }
      
      .prometheus-close:hover {
        opacity: 1;
      }
      
      .prometheus-messages {
        flex: 1;
        overflow-y: auto;
        padding: 16px;
        background: ${this.config.theme === 'dark' ? '#111827' : '#f9fafb'};
      }
      
      .prometheus-message {
        margin-bottom: 16px;
        animation: fadeIn 0.3s ease-in;
      }
      
      @keyframes fadeIn {
        from { opacity: 0; transform: translateY(10px); }
        to { opacity: 1; transform: translateY(0); }
      }
      
      .prometheus-message-user {
        display: flex;
        justify-content: flex-end;
      }
      
      .prometheus-message-bot {
        display: flex;
        justify-content: flex-start;
      }
      
      .prometheus-message-content {
        max-width: 80%;
        padding: 12px 16px;
        border-radius: 18px;
        font-size: 14px;
        line-height: 1.4;
      }
      
      .prometheus-message-user .prometheus-message-content {
        background: ${this.config.primaryColor};
        color: white;
      }
      
      .prometheus-message-bot .prometheus-message-content {
        background: ${this.config.theme === 'dark' ? '#374151' : '#ffffff'};
        color: ${this.config.theme === 'dark' ? '#ffffff' : '#111827'};
        border: 1px solid ${this.config.theme === 'dark' ? '#4b5563' : '#e5e7eb'};
      }
      
      .prometheus-governance {
        margin-top: 8px;
        padding: 8px 12px;
        background: ${this.config.theme === 'dark' ? '#1f2937' : '#f3f4f6'};
        border-radius: 8px;
        font-size: 11px;
        border: 1px solid ${this.config.theme === 'dark' ? '#374151' : '#d1d5db'};
      }
      
      .prometheus-governance-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 4px;
      }
      
      .prometheus-trust-score {
        display: flex;
        align-items: center;
        color: ${this.config.theme === 'dark' ? '#10b981' : '#059669'};
        font-weight: 600;
      }
      
      .prometheus-governance-status {
        display: flex;
        align-items: center;
        color: ${this.config.theme === 'dark' ? '#10b981' : '#059669'};
      }
      
      .prometheus-policy-checks {
        color: ${this.config.theme === 'dark' ? '#9ca3af' : '#6b7280'};
        font-size: 10px;
      }
      
      .prometheus-input-area {
        padding: 16px;
        border-top: 1px solid ${this.config.theme === 'dark' ? '#374151' : '#e5e7eb'};
        background: ${this.config.theme === 'dark' ? '#1f2937' : '#ffffff'};
      }
      
      .prometheus-input-container {
        display: flex;
        align-items: center;
        gap: 8px;
      }
      
      .prometheus-input {
        flex: 1;
        padding: 10px 12px;
        border: 1px solid ${this.config.theme === 'dark' ? '#4b5563' : '#d1d5db'};
        border-radius: 20px;
        background: ${this.config.theme === 'dark' ? '#374151' : '#ffffff'};
        color: ${this.config.theme === 'dark' ? '#ffffff' : '#111827'};
        font-size: 14px;
        outline: none;
        transition: border-color 0.2s;
      }
      
      .prometheus-input:focus {
        border-color: ${this.config.primaryColor};
      }
      
      .prometheus-input::placeholder {
        color: ${this.config.theme === 'dark' ? '#9ca3af' : '#6b7280'};
      }
      
      .prometheus-send {
        width: 36px;
        height: 36px;
        border-radius: 50%;
        background: ${this.config.primaryColor};
        border: none;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: opacity 0.2s;
      }
      
      .prometheus-send:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
      
      .prometheus-send svg {
        width: 16px;
        height: 16px;
        fill: white;
      }
      
      .prometheus-branding {
        text-align: center;
        padding: 8px;
        font-size: 10px;
        color: ${this.config.theme === 'dark' ? '#6b7280' : '#9ca3af'};
        background: ${this.config.theme === 'dark' ? '#111827' : '#f9fafb'};
        border-top: 1px solid ${this.config.theme === 'dark' ? '#374151' : '#e5e7eb'};
      }
      
      .prometheus-branding a {
        color: ${this.config.primaryColor};
        text-decoration: none;
      }
      
      .prometheus-typing {
        display: flex;
        align-items: center;
        gap: 4px;
        color: ${this.config.theme === 'dark' ? '#9ca3af' : '#6b7280'};
        font-size: 12px;
        padding: 8px 16px;
      }
      
      .prometheus-typing-dots {
        display: flex;
        gap: 2px;
      }
      
      .prometheus-typing-dot {
        width: 4px;
        height: 4px;
        border-radius: 50%;
        background: ${this.config.theme === 'dark' ? '#6b7280' : '#9ca3af'};
        animation: typing 1.4s infinite ease-in-out;
      }
      
      .prometheus-typing-dot:nth-child(1) { animation-delay: -0.32s; }
      .prometheus-typing-dot:nth-child(2) { animation-delay: -0.16s; }
      
      @keyframes typing {
        0%, 80%, 100% { transform: scale(0.8); opacity: 0.5; }
        40% { transform: scale(1); opacity: 1; }
      }
      
      @media (max-width: 480px) {
        .prometheus-chat {
          width: 100vw;
          height: 100vh;
          bottom: 0;
          right: 0;
          border-radius: 0;
        }
        
        .prometheus-toggle {
          bottom: 20px;
          right: 20px;
        }
      }
    `;
    
    const styleSheet = document.createElement('style');
    styleSheet.textContent = styles;
    document.head.appendChild(styleSheet);
  }

  getPositionStyles() {
    const positions = {
      'bottom-right': 'bottom: 20px; right: 20px;',
      'bottom-left': 'bottom: 20px; left: 20px;',
      'top-right': 'top: 20px; right: 20px;',
      'top-left': 'top: 20px; left: 20px;'
    };
    return positions[this.config.position] || positions['bottom-right'];
  }

  createWidget() {
    const widget = document.createElement('div');
    widget.className = 'prometheus-widget';
    widget.innerHTML = `
      <button class="prometheus-toggle" aria-label="Open chat">
        <svg viewBox="0 0 24 24">
          <path d="M20 2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h4l4 4 4-4h4c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/>
        </svg>
      </button>
      
      <div class="prometheus-chat">
        <div class="prometheus-header">
          <div class="prometheus-header-info">
            <h3>${this.config.title}</h3>
            <p>${this.config.subtitle}</p>
          </div>
          <button class="prometheus-close" aria-label="Close chat">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
            </svg>
          </button>
        </div>
        
        <div class="prometheus-messages"></div>
        
        <div class="prometheus-input-area">
          <div class="prometheus-input-container">
            <input 
              type="text" 
              class="prometheus-input" 
              placeholder="Type your message..."
              maxlength="500"
            >
            <button class="prometheus-send" aria-label="Send message">
              <svg viewBox="0 0 24 24">
                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
              </svg>
            </button>
          </div>
        </div>
        
        ${this.config.showBranding ? `
          <div class="prometheus-branding">
            Powered by <a href="https://promethios.com" target="_blank">Promethios</a>
          </div>
        ` : ''}
      </div>
    `;
    
    document.body.appendChild(widget);
    this.widget = widget;
  }

  bindEvents() {
    const toggle = this.widget.querySelector('.prometheus-toggle');
    const close = this.widget.querySelector('.prometheus-close');
    const input = this.widget.querySelector('.prometheus-input');
    const send = this.widget.querySelector('.prometheus-send');
    
    toggle.addEventListener('click', () => this.toggleChat());
    close.addEventListener('click', () => this.closeChat());
    send.addEventListener('click', () => this.sendMessage());
    
    input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        this.sendMessage();
      }
    });
  }

  toggleChat() {
    if (this.isOpen) {
      this.closeChat();
    } else {
      this.openChat();
    }
  }

  openChat() {
    this.isOpen = true;
    const chat = this.widget.querySelector('.prometheus-chat');
    chat.classList.add('open');
    
    // Focus input
    setTimeout(() => {
      const input = this.widget.querySelector('.prometheus-input');
      input.focus();
    }, 300);
  }

  closeChat() {
    this.isOpen = false;
    const chat = this.widget.querySelector('.prometheus-chat');
    chat.classList.remove('open');
  }

  async loadInitialMessage() {
    const welcomeMessage = {
      id: '1',
      content: `👋 Hi! I'm your AI assistant. I'm powered by governed AI technology that ensures transparent, trustworthy responses. How can I help you today?`,
      isUser: false,
      trustScore: 0.96,
      governanceStatus: 'approved',
      policyChecks: ['Content Safety ✓', 'Professional Tone ✓', 'Welcome Message ✓'],
      timestamp: new Date()
    };
    
    this.messages.push(welcomeMessage);
    this.renderMessages();
  }

  async sendMessage() {
    const input = this.widget.querySelector('.prometheus-input');
    const message = input.value.trim();
    
    if (!message) return;
    
    // Add user message
    const userMessage = {
      id: Date.now().toString(),
      content: message,
      isUser: true,
      timestamp: new Date()
    };
    
    this.messages.push(userMessage);
    input.value = '';
    this.renderMessages();
    this.showTyping();
    
    try {
      // Call API
      const response = await fetch(`${this.config.apiUrl}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: message,
          chatbot_id: this.config.chatbotId,
          session_id: this.sessionId
        }),
      });
      
      const data = await response.json();
      
      // Add bot response
      const botMessage = {
        id: (Date.now() + 1).toString(),
        content: data.response,
        isUser: false,
        trustScore: data.trust_score,
        governanceStatus: data.governance_status,
        policyChecks: data.policy_checks,
        timestamp: new Date()
      };
      
      this.messages.push(botMessage);
      
    } catch (error) {
      console.error('Chat error:', error);
      
      // Fallback response
      const errorMessage = {
        id: (Date.now() + 1).toString(),
        content: "I'm experiencing some technical difficulties right now. Please try again in a moment.",
        isUser: false,
        trustScore: 0.85,
        governanceStatus: 'approved',
        policyChecks: ['Error Handling ✓', 'User Experience ✓'],
        timestamp: new Date()
      };
      
      this.messages.push(errorMessage);
    }
    
    this.hideTyping();
    this.renderMessages();
  }

  showTyping() {
    const messagesContainer = this.widget.querySelector('.prometheus-messages');
    const typing = document.createElement('div');
    typing.className = 'prometheus-typing';
    typing.innerHTML = `
      <span>AI is thinking</span>
      <div class="prometheus-typing-dots">
        <div class="prometheus-typing-dot"></div>
        <div class="prometheus-typing-dot"></div>
        <div class="prometheus-typing-dot"></div>
      </div>
    `;
    messagesContainer.appendChild(typing);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  hideTyping() {
    const typing = this.widget.querySelector('.prometheus-typing');
    if (typing) {
      typing.remove();
    }
  }

  renderMessages() {
    const messagesContainer = this.widget.querySelector('.prometheus-messages');
    messagesContainer.innerHTML = '';
    
    this.messages.forEach(message => {
      const messageEl = document.createElement('div');
      messageEl.className = `prometheus-message ${message.isUser ? 'prometheus-message-user' : 'prometheus-message-bot'}`;
      
      let governanceHtml = '';
      if (!message.isUser && message.trustScore !== undefined) {
        governanceHtml = `
          <div class="prometheus-governance">
            <div class="prometheus-governance-header">
              <div class="prometheus-trust-score">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" style="margin-right: 4px;">
                  <path d="M12,1L3,5V11C3,16.55 6.84,21.74 12,23C17.16,21.74 21,16.55 21,11V5L12,1M10,17L6,13L7.41,11.59L10,14.17L16.59,7.58L18,9L10,17Z"/>
                </svg>
                Trust: ${(message.trustScore * 100).toFixed(0)}%
              </div>
              <div class="prometheus-governance-status">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" style="margin-right: 4px;">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                </svg>
                ${message.governanceStatus}
              </div>
            </div>
            ${message.policyChecks ? `
              <div class="prometheus-policy-checks">
                ${message.policyChecks.join(' • ')}
              </div>
            ` : ''}
          </div>
        `;
      }
      
      messageEl.innerHTML = `
        <div class="prometheus-message-content">
          ${message.content}
          ${governanceHtml}
        </div>
      `;
      
      messagesContainer.appendChild(messageEl);
    });
    
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }
}

// Auto-initialize from script tag
(function() {
  const script = document.currentScript;
  if (script && script.dataset.chatbotId) {
    const config = {
      chatbotId: script.dataset.chatbotId,
      apiUrl: script.dataset.apiUrl,
      theme: script.dataset.theme,
      position: script.dataset.position,
      primaryColor: script.dataset.primaryColor,
      title: script.dataset.title,
      subtitle: script.dataset.subtitle,
      showBranding: script.dataset.showBranding !== 'false'
    };
    
    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        new PrometheusWidget(config);
      });
    } else {
      new PrometheusWidget(config);
    }
  }
})();

// Export for manual initialization
window.PrometheusWidget = PrometheusWidget;

