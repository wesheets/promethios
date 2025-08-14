import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

// Widget Configuration Interface
export interface WidgetConfig {
  // Theme & Colors
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  textColor: string;
  accentColor: string;
  
  // Typography
  fontFamily: string;
  fontSize: number;
  fontWeight: string;
  
  // Layout & Sizing
  width: number;
  height: number;
  borderRadius: number;
  borderWidth: number;
  borderStyle: string;
  borderColor: string;
  
  // Chat Bubble Styling
  userBubbleColor: string;
  botBubbleColor: string;
  bubbleRadius: number;
  bubbleShadow: boolean;
  
  // Header & Branding
  showHeader: boolean;
  headerTitle: string;
  headerSubtitle: string;
  showAvatar: boolean;
  avatarUrl: string;
  showStatus: boolean;
  
  // Input & Controls
  inputPlaceholder: string;
  showAttachments: boolean;
  showEmojis: boolean;
  showSendButton: boolean;
  
  // Animations & Effects
  enableAnimations: boolean;
  typingIndicator: boolean;
  messageAnimations: boolean;
  hoverEffects: boolean;
  
  // Welcome & Greeting
  showWelcomeMessage: boolean;
  welcomeMessage: string;
  suggestedQuestions: string[];
  
  // Position & Behavior
  position: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left' | 'center';
  minimizable: boolean;
  draggable: boolean;
  autoOpen: boolean;
  
  // Advanced Features
  showThinking: boolean;
  thinkingText: string;
  showTimestamps: boolean;
  showReadReceipts: boolean;
  enableSounds: boolean;
}

// Default Configuration
export const defaultWidgetConfig: WidgetConfig = {
  primaryColor: '#3b82f6',
  secondaryColor: '#1e293b',
  backgroundColor: '#ffffff',
  textColor: '#1f2937',
  accentColor: '#10b981',
  
  fontFamily: 'Inter',
  fontSize: 14,
  fontWeight: '400',
  
  width: 380,
  height: 600,
  borderRadius: 16,
  borderWidth: 1,
  borderStyle: 'solid',
  borderColor: '#e5e7eb',
  
  userBubbleColor: '#3b82f6',
  botBubbleColor: '#f3f4f6',
  bubbleRadius: 18,
  bubbleShadow: true,
  
  showHeader: true,
  headerTitle: 'Chat Support',
  headerSubtitle: 'We\'re here to help!',
  showAvatar: true,
  avatarUrl: '',
  showStatus: true,
  
  inputPlaceholder: 'Type your message...',
  showAttachments: true,
  showEmojis: true,
  showSendButton: true,
  
  enableAnimations: true,
  typingIndicator: true,
  messageAnimations: true,
  hoverEffects: true,
  
  showWelcomeMessage: true,
  welcomeMessage: 'Hello! How can I help you today?',
  suggestedQuestions: ['How can I get started?', 'What are your hours?', 'Contact support'],
  
  position: 'bottom-right',
  minimizable: true,
  draggable: false,
  autoOpen: false,
  
  showThinking: true,
  thinkingText: 'AI is thinking...',
  showTimestamps: false,
  showReadReceipts: false,
  enableSounds: true,
};

// Context Interface
interface WidgetCustomizerContextType {
  // Configuration Management
  config: WidgetConfig;
  updateConfig: (key: keyof WidgetConfig, value: any) => void;
  updateMultipleConfig: (updates: Partial<WidgetConfig>) => void;
  resetConfig: () => void;
  
  // Chatbot-specific Configurations
  chatbotConfigs: Map<string, WidgetConfig>;
  getChatbotConfig: (chatbotId: string) => WidgetConfig;
  setChatbotConfig: (chatbotId: string, config: WidgetConfig) => void;
  
  // Active Chatbot
  activeChatbotId: string | null;
  setActiveChatbotId: (chatbotId: string | null) => void;
  
  // Real-time Updates
  isLivePreview: boolean;
  setLivePreview: (enabled: boolean) => void;
  
  // Save/Load
  saveConfig: (chatbotId: string) => void;
  loadConfig: (chatbotId: string) => void;
  exportConfig: (chatbotId: string) => string;
  importConfig: (chatbotId: string, configJson: string) => void;
}

// Create Context
const WidgetCustomizerContext = createContext<WidgetCustomizerContextType | undefined>(undefined);

// Provider Component
interface WidgetCustomizerProviderProps {
  children: ReactNode;
}

export const WidgetCustomizerProvider: React.FC<WidgetCustomizerProviderProps> = ({ children }) => {
  const [config, setConfig] = useState<WidgetConfig>(defaultWidgetConfig);
  const [chatbotConfigs, setChatbotConfigs] = useState<Map<string, WidgetConfig>>(new Map());
  const [activeChatbotId, setActiveChatbotId] = useState<string | null>(null);
  const [isLivePreview, setLivePreview] = useState<boolean>(true);

  // Update single configuration property
  const updateConfig = useCallback((key: keyof WidgetConfig, value: any) => {
    console.log(`🎨 [WidgetCustomizer] Updating ${key}:`, value);
    
    setConfig(prev => {
      const newConfig = { ...prev, [key]: value };
      
      // If we have an active chatbot, update its specific config too
      if (activeChatbotId) {
        setChatbotConfigs(prevConfigs => {
          const newConfigs = new Map(prevConfigs);
          newConfigs.set(activeChatbotId, newConfig);
          return newConfigs;
        });
      }
      
      return newConfig;
    });
  }, [activeChatbotId]);

  // Update multiple configuration properties
  const updateMultipleConfig = useCallback((updates: Partial<WidgetConfig>) => {
    console.log('🎨 [WidgetCustomizer] Updating multiple config properties:', Object.keys(updates));
    
    setConfig(prev => {
      const newConfig = { ...prev, ...updates };
      
      // If we have an active chatbot, update its specific config too
      if (activeChatbotId) {
        setChatbotConfigs(prevConfigs => {
          const newConfigs = new Map(prevConfigs);
          newConfigs.set(activeChatbotId, newConfig);
          return newConfigs;
        });
      }
      
      return newConfig;
    });
  }, [activeChatbotId]);

  // Reset configuration to default
  const resetConfig = useCallback(() => {
    console.log('🔄 [WidgetCustomizer] Resetting config to default');
    
    setConfig(defaultWidgetConfig);
    
    if (activeChatbotId) {
      setChatbotConfigs(prevConfigs => {
        const newConfigs = new Map(prevConfigs);
        newConfigs.set(activeChatbotId, defaultWidgetConfig);
        return newConfigs;
      });
    }
  }, [activeChatbotId]);

  // Get configuration for specific chatbot
  const getChatbotConfig = useCallback((chatbotId: string): WidgetConfig => {
    const chatbotConfig = chatbotConfigs.get(chatbotId);
    return chatbotConfig || defaultWidgetConfig;
  }, [chatbotConfigs]);

  // Set configuration for specific chatbot
  const setChatbotConfig = useCallback((chatbotId: string, newConfig: WidgetConfig) => {
    console.log(`🎨 [WidgetCustomizer] Setting config for chatbot ${chatbotId}`);
    
    setChatbotConfigs(prevConfigs => {
      const newConfigs = new Map(prevConfigs);
      newConfigs.set(chatbotId, newConfig);
      return newConfigs;
    });

    // If this is the active chatbot, update the main config too
    if (chatbotId === activeChatbotId) {
      setConfig(newConfig);
    }
  }, [activeChatbotId]);

  // Save configuration to localStorage
  const saveConfig = useCallback((chatbotId: string) => {
    try {
      const configToSave = getChatbotConfig(chatbotId);
      localStorage.setItem(`widget_config_${chatbotId}`, JSON.stringify(configToSave));
      console.log(`💾 [WidgetCustomizer] Config saved for chatbot ${chatbotId}`);
    } catch (error) {
      console.error(`❌ [WidgetCustomizer] Failed to save config for chatbot ${chatbotId}:`, error);
    }
  }, [getChatbotConfig]);

  // Load configuration from localStorage
  const loadConfig = useCallback((chatbotId: string) => {
    try {
      const savedConfig = localStorage.getItem(`widget_config_${chatbotId}`);
      if (savedConfig) {
        const parsedConfig = JSON.parse(savedConfig);
        setChatbotConfig(chatbotId, parsedConfig);
        console.log(`📂 [WidgetCustomizer] Config loaded for chatbot ${chatbotId}`);
      }
    } catch (error) {
      console.error(`❌ [WidgetCustomizer] Failed to load config for chatbot ${chatbotId}:`, error);
    }
  }, [setChatbotConfig]);

  // Export configuration as JSON string
  const exportConfig = useCallback((chatbotId: string): string => {
    const configToExport = getChatbotConfig(chatbotId);
    return JSON.stringify(configToExport, null, 2);
  }, [getChatbotConfig]);

  // Import configuration from JSON string
  const importConfig = useCallback((chatbotId: string, configJson: string) => {
    try {
      const parsedConfig = JSON.parse(configJson);
      setChatbotConfig(chatbotId, parsedConfig);
      console.log(`📥 [WidgetCustomizer] Config imported for chatbot ${chatbotId}`);
    } catch (error) {
      console.error(`❌ [WidgetCustomizer] Failed to import config for chatbot ${chatbotId}:`, error);
    }
  }, [setChatbotConfig]);

  // Handle active chatbot change
  const handleSetActiveChatbotId = useCallback((chatbotId: string | null) => {
    console.log(`🎯 [WidgetCustomizer] Setting active chatbot:`, chatbotId);
    
    setActiveChatbotId(chatbotId);
    
    if (chatbotId) {
      // Load the config for this chatbot
      const chatbotConfig = getChatbotConfig(chatbotId);
      setConfig(chatbotConfig);
      
      // Try to load saved config from localStorage
      loadConfig(chatbotId);
    }
  }, [getChatbotConfig, loadConfig]);

  const contextValue: WidgetCustomizerContextType = {
    // Configuration Management
    config,
    updateConfig,
    updateMultipleConfig,
    resetConfig,
    
    // Chatbot-specific Configurations
    chatbotConfigs,
    getChatbotConfig,
    setChatbotConfig,
    
    // Active Chatbot
    activeChatbotId,
    setActiveChatbotId: handleSetActiveChatbotId,
    
    // Real-time Updates
    isLivePreview,
    setLivePreview,
    
    // Save/Load
    saveConfig,
    loadConfig,
    exportConfig,
    importConfig,
  };

  return (
    <WidgetCustomizerContext.Provider value={contextValue}>
      {children}
    </WidgetCustomizerContext.Provider>
  );
};

// Custom Hook
export const useWidgetCustomizer = (): WidgetCustomizerContextType => {
  const context = useContext(WidgetCustomizerContext);
  if (context === undefined) {
    throw new Error('useWidgetCustomizer must be used within a WidgetCustomizerProvider');
  }
  return context;
};

// Export types
export type { WidgetCustomizerContextType };

