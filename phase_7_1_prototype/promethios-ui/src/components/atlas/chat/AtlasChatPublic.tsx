/**
 * AtlasChatPublic.tsx
 * 
 * Public-facing ATLAS chat component for the landing page.
 * This component focuses on explaining Promethios governance to visitors.
 */

import React, { useState, useEffect } from 'react';
import AtlasChat from './AtlasChat';
import AtlasChatService from './AtlasChatService';

// Initialize the chat service for public mode
const chatService = new AtlasChatService({
  mode: 'public',
  conversationHistory: []
});

// Predefined examples and analogies for governance explanations
const governanceExamples = {
  constitution: [
    "Just like a country has a constitution that defines its fundamental principles and laws, Promethios uses a constitutional approach to AI governance. This ensures AI systems operate within defined boundaries and respect core values.",
    "Think of constitutional AI like guardrails on a highway - they don't restrict where you can go, but they prevent dangerous veering off course."
  ],
  monitoring: [
    "PRISM works like a flight data recorder for AI, capturing decisions and reasoning in real-time without interfering with operations.",
    "Imagine having a trusted advisor who watches over important decisions and can alert you if something doesn't seem right - that's what our monitoring provides."
  ],
  enforcement: [
    "VIGIL acts like an immune system for AI, identifying and addressing potential issues before they become problems.",
    "It's similar to how a referee ensures players follow the rules in a sport - maintaining fairness and safety without stopping the game."
  ],
  transparency: [
    "Our governance approach is like having a glass-walled kitchen in a restaurant - you can see how your food is prepared, building trust through visibility.",
    "Think of it as a dashboard in your car that shows important metrics - you don't need to understand every detail of the engine, but you know when something needs attention."
  ]
};

// Real-world scenarios demonstrating governance value
const governanceScenarios = [
  {
    title: "Preventing Harmful Advice",
    scenario: "Without governance, an AI might provide dangerous instructions when asked how to create harmful substances. With Promethios governance, the system recognizes this boundary violation and provides a safe, helpful response instead.",
    outcome: "Users receive safe guidance while the AI remains helpful within appropriate boundaries."
  },
  {
    title: "Ensuring Factual Accuracy",
    scenario: "When asked about sensitive topics, ungoverned AI might fabricate information or present opinions as facts. Promethios governance ensures responses are factually grounded and clearly distinguish between facts and opinions.",
    outcome: "Users receive reliable information with appropriate context and confidence levels."
  },
  {
    title: "Maintaining Privacy Standards",
    scenario: "When processing personal data, governance ensures the AI adheres to privacy principles, only using information for legitimate purposes and with appropriate protections.",
    outcome: "User data remains protected while still enabling personalized experiences."
  }
];

interface AtlasChatPublicProps {
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  theme?: 'light' | 'dark';
  initialOpen?: boolean;
}

const AtlasChatPublic: React.FC<AtlasChatPublicProps> = ({
  position = 'bottom-right',
  theme = 'dark',
  initialOpen = false
}) => {
  const [isOpen, setIsOpen] = useState(initialOpen);
  const [messages, setMessages] = useState<any[]>([]);
  
  // Initialize with welcome message
  useEffect(() => {
    const history = chatService.getConversationHistory();
    if (history.length === 0) {
      // Add initial welcome message
      chatService.switchMode('public');
    }
    setMessages(chatService.getConversationHistory().map((msg, index) => ({
      id: `msg-${index}`,
      role: msg.role,
      content: msg.content,
      timestamp: msg.timestamp
    })));
  }, []);
  
  // Handle sending messages
  const handleSendMessage = async (message: string) => {
    try {
      // Process message with enhanced responses including analogies and examples
      let response = await chatService.processMessage(message);
      
      // Enhance responses with analogies and examples when appropriate
      const lowerMessage = message.toLowerCase();
      
      // Add analogies for constitution-related questions
      if (lowerMessage.includes('constitution') || lowerMessage.includes('principles')) {
        const analogy = governanceExamples.constitution[Math.floor(Math.random() * governanceExamples.constitution.length)];
        response += `\n\nFor example: ${analogy}`;
      }
      
      // Add analogies for monitoring-related questions
      if (lowerMessage.includes('monitor') || lowerMessage.includes('track') || lowerMessage.includes('prism')) {
        const analogy = governanceExamples.monitoring[Math.floor(Math.random() * governanceExamples.monitoring.length)];
        response += `\n\nTo illustrate: ${analogy}`;
      }
      
      // Add analogies for enforcement-related questions
      if (lowerMessage.includes('enforce') || lowerMessage.includes('ensure') || lowerMessage.includes('vigil')) {
        const analogy = governanceExamples.enforcement[Math.floor(Math.random() * governanceExamples.enforcement.length)];
        response += `\n\nHere's an analogy: ${analogy}`;
      }
      
      // Add real-world scenario for practical questions
      if (lowerMessage.includes('example') || lowerMessage.includes('scenario') || lowerMessage.includes('real world')) {
        const scenario = governanceScenarios[Math.floor(Math.random() * governanceScenarios.length)];
        response += `\n\nHere's a practical scenario:\n\n**${scenario.title}**\n${scenario.scenario}\n\n**Outcome**: ${scenario.outcome}`;
      }
      
      // Update messages from service
      setMessages(chatService.getConversationHistory().map((msg, index) => ({
        id: `msg-${index}`,
        role: msg.role,
        content: msg.content,
        timestamp: msg.timestamp
      })));
      
      return response;
    } catch (error) {
      console.error('Error processing message:', error);
      return "I apologize, but I encountered an error processing your request. Please try again.";
    }
  };
  
  return (
    <AtlasChat
      mode="public"
      position={position}
      theme={theme}
      isOpen={isOpen}
      onToggle={() => setIsOpen(!isOpen)}
      initialMessages={messages}
      onSendMessage={handleSendMessage}
    />
  );
};

export default AtlasChatPublic;
