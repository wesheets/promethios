/**
 * AtlasChatIntegration.tsx
 * 
 * Component that integrates all ATLAS Chat features including image upload,
 * file attachment, and enhanced conversational capabilities.
 */

import React, { useState, useEffect, useRef } from 'react';
import AtlasChat, { ChatMessage } from './AtlasChat';
import AtlasChatService from './AtlasChatService';
import AtlasChatImageUpload from './AtlasChatImageUpload';
import AtlasChatFileUpload from './AtlasChatFileUpload';
import AtlasChatImageAnalysis from './AtlasChatImageAnalysis';
import AtlasChatDocumentAnalysis from './AtlasChatDocumentAnalysis';
import AtlasChatIPProtection from './AtlasChatIPProtection';
import './AtlasChat.css';

export interface AtlasChatIntegrationProps {
  mode: 'public' | 'session';
  agentId?: string;
  sessionId?: string;
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  theme?: 'light' | 'dark';
  initialOpen?: boolean;
  username?: string;
  userType?: 'public' | 'authenticated' | 'developer';
}

const AtlasChatIntegration: React.FC<AtlasChatIntegrationProps> = ({
  mode = 'public',
  agentId,
  sessionId,
  position = 'bottom-right',
  theme = 'dark',
  initialOpen = false,
  username,
  userType = 'public'
}) => {
  const [isOpen, setIsOpen] = useState(initialOpen);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  
  // Service instances
  const chatServiceRef = useRef(new AtlasChatService({
    mode,
    agentId,
    sessionId,
    userProfile: {
      isLoggedIn: userType !== 'public',
      username,
      role: userType
    }
  }));
  const imageAnalysisRef = useRef(new AtlasChatImageAnalysis());
  const documentAnalysisRef = useRef(new AtlasChatDocumentAnalysis());
  const ipProtectionRef = useRef(new AtlasChatIPProtection());
  
  // Initialize chat with welcome message
  useEffect(() => {
    const welcomeMessage = chatServiceRef.current.switchMode(mode, agentId, sessionId);
    
    setMessages([
      {
        id: 'welcome-1',
        role: 'atlas',
        content: welcomeMessage,
        timestamp: Date.now()
      }
    ]);
  }, [mode, agentId, sessionId]);
  
  // Handle sending a text message
  const handleSendMessage = async (message: string) => {
    setIsLoading(true);
    
    try {
      // Process message through chat service
      let response = await chatServiceRef.current.processMessage(message);
      
      // Apply IP protection
      response = ipProtectionRef.current.processResponse(response, userType);
      
      return response;
    } catch (error) {
      console.error('Error processing message:', error);
      return 'I apologize, but I encountered an error processing your request. Please try again later.';
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle image upload
  const handleImageUpload = async (imageFile: File) => {
    setIsUploading(true);
    
    try {
      // Add user message about image upload
      const userMessage: ChatMessage = {
        id: `user-${Date.now()}`,
        role: 'user',
        content: `[Uploaded image: ${imageFile.name}]`,
        timestamp: Date.now()
      };
      
      setMessages(prev => [...prev, userMessage]);
      
      // Analyze the image
      const analysisResult = await imageAnalysisRef.current.analyzeImage(imageFile);
      
      // Generate response based on analysis
      let responseContent = analysisResult.suggestedResponse || 
        'I\'ve analyzed the image you shared, but I\'m not sure what specific information you\'re looking for. Could you clarify what you\'d like me to explain?';
      
      // Apply IP protection
      responseContent = ipProtectionRef.current.processResponse(responseContent, userType);
      
      // Add atlas response
      const atlasResponse: ChatMessage = {
        id: `atlas-${Date.now()}`,
        role: 'atlas',
        content: responseContent,
        timestamp: Date.now()
      };
      
      setMessages(prev => [...prev, atlasResponse]);
    } catch (error) {
      console.error('Error processing image:', error);
      
      const errorMessage: ChatMessage = {
        id: `error-${Date.now()}`,
        role: 'system',
        content: 'I apologize, but I encountered an error analyzing the image. Please try again or upload a different image.',
        timestamp: Date.now()
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsUploading(false);
    }
  };
  
  // Handle image paste
  const handleImagePaste = async (imageData: string) => {
    setIsUploading(true);
    
    try {
      // Add user message about image paste
      const userMessage: ChatMessage = {
        id: `user-${Date.now()}`,
        role: 'user',
        content: '[Pasted image]',
        timestamp: Date.now()
      };
      
      setMessages(prev => [...prev, userMessage]);
      
      // Analyze the image
      const analysisResult = await imageAnalysisRef.current.analyzeImage(imageData);
      
      // Generate response based on analysis
      let responseContent = analysisResult.suggestedResponse || 
        'I\'ve analyzed the image you shared, but I\'m not sure what specific information you\'re looking for. Could you clarify what you\'d like me to explain?';
      
      // Apply IP protection
      responseContent = ipProtectionRef.current.processResponse(responseContent, userType);
      
      // Add atlas response
      const atlasResponse: ChatMessage = {
        id: `atlas-${Date.now()}`,
        role: 'atlas',
        content: responseContent,
        timestamp: Date.now()
      };
      
      setMessages(prev => [...prev, atlasResponse]);
    } catch (error) {
      console.error('Error processing pasted image:', error);
      
      const errorMessage: ChatMessage = {
        id: `error-${Date.now()}`,
        role: 'system',
        content: 'I apologize, but I encountered an error analyzing the pasted image. Please try again or upload a file instead.',
        timestamp: Date.now()
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsUploading(false);
    }
  };
  
  // Handle file upload
  const handleFileUpload = async (file: File) => {
    setIsUploading(true);
    
    try {
      // Add user message about file upload
      const userMessage: ChatMessage = {
        id: `user-${Date.now()}`,
        role: 'user',
        content: `[Uploaded file: ${file.name}]`,
        timestamp: Date.now()
      };
      
      setMessages(prev => [...prev, userMessage]);
      
      // Check if it's an image file
      if (file.type.startsWith('image/')) {
        await handleImageUpload(file);
        return;
      }
      
      // Analyze the document
      const analysisResult = await documentAnalysisRef.current.analyzeDocument(file);
      
      // Generate response based on analysis
      let responseContent = analysisResult.suggestedResponse || 
        `I've analyzed the document "${file.name}" you shared, but I'm not sure what specific information you're looking for. Could you clarify what you'd like me to explain?`;
      
      // Apply IP protection
      responseContent = ipProtectionRef.current.processResponse(responseContent, userType);
      
      // Add atlas response
      const atlasResponse: ChatMessage = {
        id: `atlas-${Date.now()}`,
        role: 'atlas',
        content: responseContent,
        timestamp: Date.now()
      };
      
      setMessages(prev => [...prev, atlasResponse]);
    } catch (error) {
      console.error('Error processing file:', error);
      
      const errorMessage: ChatMessage = {
        id: `error-${Date.now()}`,
        role: 'system',
        content: `I apologize, but I encountered an error analyzing the file "${file.name}". Please try again or upload a different file.`,
        timestamp: Date.now()
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsUploading(false);
    }
  };
  
  // Toggle chat open/closed
  const handleToggle = () => {
    setIsOpen(!isOpen);
  };
  
  return (
    <div className="atlas-chat-integration">
      <AtlasChat
        mode={mode}
        agentId={agentId}
        sessionId={sessionId}
        initialMessages={messages}
        onSendMessage={handleSendMessage}
        position={position}
        theme={theme}
        isOpen={isOpen}
        onToggle={handleToggle}
        renderAdditionalControls={() => (
          <div className="atlas-chat-controls">
            <AtlasChatImageUpload
              onImageUpload={handleImageUpload}
              onImagePaste={handleImagePaste}
              isDisabled={isLoading || isUploading}
            />
            <AtlasChatFileUpload
              onFileUpload={handleFileUpload}
              isDisabled={isLoading || isUploading}
            />
          </div>
        )}
      />
    </div>
  );
};

export default AtlasChatIntegration;
