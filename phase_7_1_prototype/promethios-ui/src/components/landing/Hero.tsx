import React, { useState, useEffect, KeyboardEvent } from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import { motion, AnimatePresence } from 'framer-motion';
import { sendChatCompletionRequest, createPromethiosSystemMessage, ChatMessage } from '../../api/openaiProxy';

/**
 * Hero Component
 * 
 * The main landing section for Promethios with powerful messaging and CTAs
 */
const Hero: React.FC = () => {
  const { isDarkMode } = useTheme();
  const [showPromethiosChat, setShowPromethiosChat] = useState(false);
  const [showFullLog, setShowFullLog] = useState(false);
  const [hasScrolled, setHasScrolled] = useState(false);
  const [whisperMessage, setWhisperMessage] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([
    { role: 'assistant', content: "I'm Promethios, your governance companion. I can explain how AI agents might be misleading you and how governance creates accountability." },
    { role: 'user', content: "What does it mean that I've been \"lied to\" by AI?" },
  ]);
  
  // Scroll effect to trigger Promethios whisper
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 100 && !hasScrolled) {
        setHasScrolled(true);
        setWhisperMessage("That agent you just trusted last week? It would've failed Clause 4.1.");
        
        // Clear the whisper message after 5 seconds
        setTimeout(() => {
          setWhisperMessage('');
        }, 5000);
      }
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [hasScrolled]);

  // Handle chat open with thinking effect
  const handleChatOpen = () => {
    if (!showPromethiosChat) {
      setIsThinking(true);
      // Simulate thinking pause for authority
      setTimeout(() => {
        setIsThinking(false);
        setShowPromethiosChat(true);
      }, 800);
    } else {
      setShowPromethiosChat(false);
    }
  };

  // Handle sending a message to the Promethios chat
  const handleSendMessage = async () => {
    if (!chatInput.trim()) return;
    
    // Add user message to chat history
    const userMessage: ChatMessage = { role: 'user', content: chatInput };
    setChatHistory(prev => [...prev, userMessage]);
    
    // Clear input and show thinking state
    const userQuery = chatInput;
    setChatInput('');
    setIsThinking(true);
    
    try {
      // Prepare messages for API request
      const messages: ChatMessage[] = [
        { role: 'system', content: createPromethiosSystemMessage('public') },
        ...chatHistory,
        userMessage
      ];
      
      // Send request to OpenAI API
      const response = await sendChatCompletionRequest({
        messages,
        model: 'gpt-4',
        temperature: 0.7,
        max_tokens: 500
      });
      
      // Add assistant response to chat history
      if (response.choices && response.choices.length > 0) {
        const assistantMessage: ChatMessage = { 
          role: 'assistant', 
          content: response.choices[0].message.content 
        };
        setChatHistory(prev => [...prev, assistantMessage]);
      }
    } catch (error) {
      console.error('Error getting chat response:', error);
      // Add fallback response
      setChatHistory(prev => [...prev, { 
        role: 'assistant', 
        content: "I apologize, but I'm having trouble connecting to my knowledge base right now. As Promethios' governance companion, I can explain how AI systems sometimes create information that sounds plausible but isn't true - what we call 'hallucinations.' Without governance, there's no accountability for these errors. Promethios adds the governance layer that makes AI trustworthy and accountable."
      }]);
    } finally {
      setIsThinking(false);
    }
  };

  // Handle Enter key press in chat input
  const handleKeyPress = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };

  // Handle Governance Explained button
  const handleGovernanceExplained = () => {
    setChatInput("Can you explain how Promethios governance works?");
    handleSendMessage();
  };

  return (
    <div className="relative bg-navy-900 text-white overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-navy-900 to-navy-800 z-0"></div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center py-20 md:py-32">
          <motion.h1 
            className={`text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight whitespace-nowrap ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            You've been lied to.
          </motion.h1>
          
          <motion.p 
            className={`mt-6 text-xl md:text-2xl max-w-3xl mx-auto ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            The AI you trust is making things up — and you don't even know it.  
            <br />Promethious improves AI accuracy, traceability, and decision quality, making your models better by design.
          </motion.p>
          
          <div className="flex flex-col sm:flex-row justify-center gap-4 mt-12 mb-8">
            <Link 
              to="/waitlist" 
              className="px-8 py-3 bg-blue-600 hover:bg-blue-700 rounded-md text-white font-medium text-lg transition-colors"
              title="Join early access to wrap your agents with governance."
            >
              Protect My Agent →
            </Link>
            
            <Link 
              to="/benchmark" 
              className="px-8 py-3 bg-transparent hover:bg-gray-800 border border-gray-600 rounded-md text-white font-medium text-lg transition-colors"
              title="Explore the CMU data that changed how teams define trust"
            >
              See Benchmarks →
            </Link>
            
            <Link 
              to="/governed-vs-ungoverned" 
              className="px-8 py-3 bg-purple-700 hover:bg-purple-800 rounded-md text-white font-medium text-lg transition-colors"
            >
              Watch an Agent Break →
            </Link>
          </div>
          
          <p className="text-sm text-gray-400 mb-8">
            Promethios is rolling out in phases. Join the waitlist for early access to governed agent infrastructure.
          </p>
          
          {/* Promethios Chat Entry Point with pulsing animation */}
          <motion.div 
            className={`mt-8 p-4 rounded-lg cursor-pointer transition-all ${
              isDarkMode 
                ? 'bg-blue-900/30 hover:bg-blue-900/50 border border-blue-800' 
                : 'bg-blue-100/20 hover:bg-blue-100/30 border border-blue-200/30'
            }`}
            onClick={handleChatOpen}
            animate={{ 
              boxShadow: ['0 0 0 rgba(59, 130, 246, 0)', '0 0 8px rgba(59, 130, 246, 0.5)', '0 0 0 rgba(59, 130, 246, 0)'] 
            }}
            transition={{ 
              duration: 2, 
              repeat: Infinity, 
              repeatType: "loop" 
            }}
          >
            <div className="flex items-center">
              <div className="w-10 h-10 rounded-full bg-blue-700 flex items-center justify-center mr-3">
                <img src="/images/shield.png" alt="Promethios Shield" className="w-8 h-8" />
              </div>
              <div className="text-left">
                <h3 className="font-semibold text-lg">Promethios</h3>
                <p className="text-sm text-gray-300">
                  {isThinking ? (
                    <span className="inline-flex items-center">
                      <span className="mr-2">Thinking</span>
                      <span className="flex space-x-1">
                        <span className="animate-pulse">.</span>
                        <span className="animate-pulse" style={{ animationDelay: '0.2s' }}>.</span>
                        <span className="animate-pulse" style={{ animationDelay: '0.4s' }}>.</span>
                      </span>
                    </span>
                  ) : (
                    whisperMessage || "\"Wondering what that headline really means? Ask me what your AI is hiding.\""
                  )}
                </p>
              </div>
            </div>
          </motion.div>
          
          {/* Promethios Chat Panel (conditionally rendered) */}
          <AnimatePresence>
            {showPromethiosChat && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className={`mt-4 p-4 rounded-lg ${
                  isDarkMode 
                    ? 'bg-gray-800 border border-gray-700' 
                    : 'bg-white border border-gray-200'
                }`}
              >
                <div className="flex justify-between items-center mb-3">
                  <div className="flex items-center">
                    <h3 className="font-semibold">Promethios Governance Assistant</h3>
                    <div className="ml-2 px-2 py-0.5 bg-blue-600 rounded-full text-xs text-white flex items-center">
                      <span className="w-2 h-2 bg-green-400 rounded-full mr-1 animate-pulse"></span>
                      <span>Live</span>
                    </div>
                  </div>
                  <button 
                    onClick={() => setShowPromethiosChat(false)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    &times;
                  </button>
                </div>
                
                <div className="flex justify-between items-center mb-2 text-xs text-gray-400">
                  <div>Currently observing: 117 agent sessions</div>
                  <div>Trust delta today: +3.2%</div>
                </div>
                
                {/* Chat history area with judicial styling */}
                <div className="overflow-y-auto min-h-32 max-h-[calc(100vh-10rem)] mb-3 p-2 rounded bg-gray-900">
                  {/* Display chat history */}
                  {chatHistory.slice(0, showFullLog ? chatHistory.length : 2).map((message, index) => (
                    <motion.div 
                      key={index}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                      className={`mb-3 ${message.role === 'user' ? 'text-right' : ''}`}
                    >
                      <div className={`inline-block px-3 py-2 rounded-lg max-w-[80%] ${
                        message.role === 'assistant' 
                          ? 'bg-blue-700 text-white border-l-4 border-blue-400' 
                          : 'bg-gray-700 text-white'
                      }`}>
                        <p className="text-sm">
                          {message.content}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                  
                  {/* Show full log button */}
                  {!showFullLog && chatHistory.length > 2 && (
                    <div className="text-center my-2">
                      <button 
                        onClick={() => setShowFullLog(true)}
                        className="text-xs text-blue-400 hover:text-blue-300 underline"
                      >
                        Show Full Log
                      </button>
                    </div>
                  )}
                  
                  {/* Thinking indicator */}
                  {isThinking && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mb-3"
                    >
                      <div className="inline-block bg-blue-700/50 text-white px-3 py-2 rounded-lg max-w-[80%] border-l-4 border-blue-400/50">
                        <p className="text-sm flex items-center">
                          <span className="mr-2">Thinking</span>
                          <span className="flex space-x-1">
                            <span className="animate-pulse">.</span>
                            <span className="animate-pulse" style={{ animationDelay: '0.2s' }}>.</span>
                            <span className="animate-pulse" style={{ animationDelay: '0.4s' }}>.</span>
                          </span>
                        </p>
                      </div>
                    </motion.div>
                  )}
                </div>
                
                <div className="text-right mb-2">
                  <button 
                    className="text-xs text-blue-400 hover:text-blue-300 flex items-center justify-end"
                    onClick={handleGovernanceExplained}
                  >
                    <span className="mr-1">🛡️</span> Governance Explained
                  </button>
                </div>
                
                {/* Fixed height input area */}
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    placeholder="Ask about AI governance..." 
                    className={`flex-grow p-2 rounded text-gray-900 border min-h-12 max-h-16 ${
                      isDarkMode ? 'border-gray-700 bg-gray-700 text-white' : 'border-gray-300'
                    }`}
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                  />
                  <button 
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-white"
                    onClick={handleSendMessage}
                  >
                    Send
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default Hero;
