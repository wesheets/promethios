import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import { motion, AnimatePresence } from 'framer-motion';

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

  return (
    <div className="relative bg-navy-900 text-white overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-navy-900 to-navy-800 z-0"></div>
      
      {/* Hero content */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32 z-10">
        <div className="text-center max-w-3xl mx-auto">
          <h1 className="text-6xl md:text-7xl font-extrabold tracking-tight mb-8 whitespace-nowrap">
            You've been lied to.
          </h1>
          
          <p className="text-xl md:text-2xl mb-10 text-gray-300">
            The AI you trust is making things up — and you don't even know it.
            Promethios makes every agent traceable, accountable, and governed by design.
          </p>
          
          <div className="flex flex-col sm:flex-row justify-center gap-4 mb-8">
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
            onClick={() => setShowPromethiosChat(!showPromethiosChat)}
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
                  {whisperMessage || "\"Wondering what that headline really means? Ask me what your AI is hiding.\""}
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
                  <h3 className="font-semibold">Promethios Governance Assistant</h3>
                  <button 
                    onClick={() => setShowPromethiosChat(false)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    &times;
                  </button>
                </div>
                
                {/* Chat history area with judicial styling */}
                <div className="overflow-y-auto min-h-32 max-h-[calc(100vh-10rem)] mb-3 p-2 rounded bg-gray-900">
                  {/* Initial visible messages */}
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="mb-3"
                  >
                    <div className="inline-block bg-blue-700 text-white px-3 py-2 rounded-lg max-w-[80%] border-l-4 border-blue-400">
                      <p className="text-sm">
                        I'm Promethios, your governance companion. I can explain how AI agents might be misleading you and how governance creates accountability.
                      </p>
                    </div>
                  </motion.div>
                  
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.1 }}
                    className="mb-3 text-right"
                  >
                    <div className="inline-block bg-gray-700 text-white px-3 py-2 rounded-lg max-w-[80%]">
                      <p className="text-sm">
                        What does it mean that I've been "lied to" by AI?
                      </p>
                    </div>
                  </motion.div>
                  
                  {/* Progressive reveal for additional messages */}
                  {showFullLog ? (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: 0.2 }}
                      className="mb-3"
                    >
                      <div className="inline-block bg-blue-700 text-white px-3 py-2 rounded-lg max-w-[80%] border-l-4 border-blue-400">
                        <p className="text-sm">
                          When AI systems like ChatGPT or Claude generate responses, they sometimes create information that sounds plausible but isn't true - what we call "hallucinations." Without governance, there's no accountability for these errors, and no way to trace how decisions were made. Promethios adds the governance layer that makes AI trustworthy and accountable.
                        </p>
                      </div>
                    </motion.div>
                  ) : (
                    <div className="text-center my-2">
                      <button 
                        onClick={() => setShowFullLog(true)}
                        className="text-xs text-blue-400 hover:text-blue-300 underline"
                      >
                        Show Full Log
                      </button>
                    </div>
                  )}
                </div>
                
                {/* Fixed height input area */}
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    placeholder="Ask about AI governance..." 
                    className={`flex-grow p-2 rounded text-gray-900 border min-h-12 max-h-16 ${
                      isDarkMode ? 'border-gray-700 bg-gray-700 text-white' : 'border-gray-300'
                    }`}
                  />
                  <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-white">
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
