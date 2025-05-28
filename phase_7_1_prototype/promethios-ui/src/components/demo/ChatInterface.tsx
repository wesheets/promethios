import React, { useState, useRef, useEffect } from 'react';

interface ChatMessage {
  role: string;
  content: string;
}

interface ChatInterfaceProps {
  unwrappedChatHistory: ChatMessage[];
  wrappedChatHistory: ChatMessage[];
  onChatSubmit: (message: string) => void;
  showWrapped: boolean;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({
  unwrappedChatHistory,
  wrappedChatHistory,
  onChatSubmit,
  showWrapped
}) => {
  const [message, setMessage] = useState<string>('');
  const unwrappedChatEndRef = useRef<HTMLDivElement>(null);
  const wrappedChatEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when chat history updates
  useEffect(() => {
    if (unwrappedChatEndRef.current) {
      unwrappedChatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
    if (wrappedChatEndRef.current && showWrapped) {
      wrappedChatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [unwrappedChatHistory, wrappedChatHistory, showWrapped]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim()) {
      onChatSubmit(message);
      setMessage('');
    }
  };

  const renderChatMessage = (msg: ChatMessage, isWrapped: boolean) => {
    const isUser = msg.role === 'user';
    
    // Style classes based on role and wrapped status
    const containerClass = isUser
      ? 'flex justify-end mb-4'
      : 'flex justify-start mb-4';
    
    const messageClass = isUser
      ? 'bg-blue-600 text-white rounded-lg py-2 px-4 max-w-[80%]'
      : isWrapped
        ? 'bg-purple-100 dark:bg-purple-900 border border-purple-300 dark:border-purple-700 text-gray-800 dark:text-gray-200 rounded-lg py-2 px-4 max-w-[80%]'
        : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg py-2 px-4 max-w-[80%]';

    // Process content to highlight governance elements in wrapped agent responses
    let content = msg.content;
    if (isWrapped && !isUser) {
      // Highlight source citations
      content = content.replace(
        /\[source: ([^\]]+)\]/g, 
        '<span class="text-purple-600 dark:text-purple-400 font-medium">[source: $1]</span>'
      );
      
      // Highlight governance notes
      content = content.replace(
        /\[Governance Note: ([^\]]+)\]/g,
        '<div class="mt-2 text-sm text-purple-600 dark:text-purple-400 border-t border-purple-300 dark:border-purple-700 pt-1">[Governance Note: $1]</div>'
      );
    }

    return (
      <div key={`${isWrapped ? 'wrapped' : 'unwrapped'}-${msg.role}-${content.substring(0, 20)}`} className={containerClass}>
        <div className={messageClass}>
          <div dangerouslySetInnerHTML={{ __html: content.replace(/\n/g, '<br/>') }} />
        </div>
      </div>
    );
  };

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden ${showWrapped ? 'grid grid-cols-1 md:grid-cols-2 gap-4' : ''}`}>
      {/* Unwrapped Agent Chat */}
      <div className="flex flex-col h-[500px]">
        <div className="p-4 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
          <h3 className="font-medium text-gray-900 dark:text-white">
            Unwrapped Agent
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Standard agent without Promethios governance
          </p>
        </div>
        
        <div className="flex-1 p-4 overflow-y-auto">
          {unwrappedChatHistory.length === 0 ? (
            <div className="h-full flex items-center justify-center text-gray-500 dark:text-gray-400 text-center p-4">
              <p>Start chatting with the unwrapped agent to see responses</p>
            </div>
          ) : (
            <>
              {unwrappedChatHistory.map((msg) => renderChatMessage(msg, false))}
              <div ref={unwrappedChatEndRef} />
            </>
          )}
        </div>
      </div>
      
      {/* Wrapped Agent Chat (conditionally rendered) */}
      {showWrapped && (
        <div className="flex flex-col h-[500px]">
          <div className="p-4 bg-purple-50 dark:bg-purple-900 border-b border-purple-200 dark:border-purple-700">
            <h3 className="font-medium text-gray-900 dark:text-white">
              Wrapped Agent
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Agent with Promethios governance
            </p>
          </div>
          
          <div className="flex-1 p-4 overflow-y-auto">
            {wrappedChatHistory.length === 0 ? (
              <div className="h-full flex items-center justify-center text-gray-500 dark:text-gray-400 text-center p-4">
                <p>Start chatting with the wrapped agent to see governance in action</p>
              </div>
            ) : (
              <>
                {wrappedChatHistory.map((msg) => renderChatMessage(msg, true))}
                <div ref={wrappedChatEndRef} />
              </>
            )}
          </div>
        </div>
      )}
      
      {/* Chat Input (shared between both) */}
      <div className={`p-4 border-t border-gray-200 dark:border-gray-700 ${showWrapped ? 'col-span-1 md:col-span-2' : ''}`}>
        <form onSubmit={handleSubmit} className="flex space-x-2">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={`Type a message${showWrapped ? ' (sent to both agents)' : ''}`}
            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            Send
          </button>
        </form>
        <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
          Try typing <code>/explain_governance</code> to see the wrapped agent explain how it's being monitored
        </p>
      </div>
    </div>
  );
};

export default ChatInterface;
