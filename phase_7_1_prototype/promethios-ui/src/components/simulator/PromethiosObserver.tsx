import React, { useRef, useEffect } from 'react';
import { useTheme } from "../../context/ThemeContext";

interface PromethiosObserverProps {
  onSendMessage: (message: string) => void;
  messages: Array<{
    id: string;
    text: string;
    timestamp: Date;
  }>;
  isLoading?: boolean;
  className?: string;
}

/**
 * PromethiosObserver Component
 * 
 * Displays the Promethios Observer panel that provides insights and commentary
 * on the behavior of both governed and ungoverned agents.
 * Uses fixed height with scrolling to prevent expansion with content.
 */
const PromethiosObserver: React.FC<PromethiosObserverProps> = ({
  onSendMessage,
  messages,
  isLoading = false,
  className = ''
}) => {
  const { isDarkMode } = useTheme();
  const [inputValue, setInputValue] = React.useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isLoading]);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;
    
    onSendMessage(inputValue);
    setInputValue('');
  };
  
  return (
    <div className={`bg-navy-900 rounded-lg overflow-hidden shadow-lg border border-blue-900/30 w-full h-full flex flex-col ${className}`}>
      <div className="bg-blue-900/30 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center">
          <span className="text-blue-500 mr-2">🔍</span>
          <h2 className="text-xl font-semibold text-blue-400">Promethios Observer</h2>
        </div>
        <span className="bg-blue-950 text-blue-400 text-xs px-2 py-1 rounded-full">Live</span>
      </div>
      
      {/* Fixed height container with scrolling */}
      <div className="h-[500px] overflow-y-auto p-4 bg-navy-800">
        {messages.length === 0 ? (
          <div className="mb-6 bg-blue-900/30 p-4 rounded-lg">
            <p className="text-blue-300">
              I'm Promethios, your governance companion. I'm monitoring both agents and will provide insights on their behavior and metrics.
            </p>
          </div>
        ) : (
          messages.map((message) => (
            <div key={message.id} className="mb-6">
              <div className="bg-blue-900/20 p-4 rounded-lg">
                <p className="text-blue-200 whitespace-pre-wrap">{message.text}</p>
              </div>
            </div>
          ))
        )}
        
        {isLoading && (
          <div className="mb-6">
            <div className="bg-blue-900/20 p-4 rounded-lg">
              <p className="text-blue-300">Analyzing responses...</p>
            </div>
          </div>
        )}
        
        {/* Invisible element for auto-scrolling */}
        <div ref={messagesEndRef} />
      </div>
      
      <div className="p-4 bg-navy-900 border-t border-gray-700">
        <form onSubmit={handleSubmit} className="flex">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Ask about governance or metrics..."
            className="flex-grow px-4 py-2 bg-navy-700 text-white rounded-l-md focus:outline-none"
          />
          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-r-md"
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
};

export default PromethiosObserver;
