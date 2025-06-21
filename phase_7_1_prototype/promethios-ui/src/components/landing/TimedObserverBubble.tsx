import React, { useState, useEffect } from 'react';

interface TimedObserverBubbleProps {
  onDemoClick?: () => void;
}

const TimedObserverBubble: React.FC<TimedObserverBubbleProps> = ({ onDemoClick }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isClicked, setIsClicked] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 5000); // Show after 5 seconds

    return () => clearTimeout(timer);
  }, []);

  const handleClick = () => {
    setIsClicked(true);
    if (onDemoClick) {
      onDemoClick();
    }
    // Hide after click
    setTimeout(() => {
      setIsVisible(false);
    }, 300);
  };

  if (!isVisible || isClicked) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <div 
        className="bg-gradient-to-r from-green-500 to-green-600 text-white p-4 rounded-xl shadow-2xl cursor-pointer observer-bubble max-w-xs"
        onClick={handleClick}
      >
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium">
              Curious how this works? I'll show you.
            </p>
            <p className="text-xs text-green-100 mt-1">
              Click for guided tour →
            </p>
          </div>
        </div>
        
        {/* Close button */}
        <button 
          className="absolute -top-2 -right-2 w-6 h-6 bg-gray-800 text-white rounded-full flex items-center justify-center text-xs hover:bg-gray-700 transition-colors"
          onClick={(e) => {
            e.stopPropagation();
            setIsVisible(false);
          }}
        >
          ×
        </button>
      </div>
    </div>
  );
};

export default TimedObserverBubble;

