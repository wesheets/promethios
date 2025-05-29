import React from 'react';
import { useTheme } from '../../context/ThemeContext';

interface ProgressiveRevealProps {
  isRevealed: boolean;
  onReveal: () => void;
  children: React.ReactNode;
  className?: string;
}

/**
 * ProgressiveReveal Component
 * 
 * Creates a dramatic "before and after" effect by progressively revealing
 * content with smooth animations and transitions.
 */
const ProgressiveReveal: React.FC<ProgressiveRevealProps> = ({
  isRevealed,
  onReveal,
  children,
  className = ''
}) => {
  const { isDarkMode } = useTheme();
  
  return (
    <div className={`relative overflow-hidden transition-all duration-500 ${className}`}>
      {!isRevealed ? (
        <div className="flex flex-col items-center justify-center p-8 text-center">
          <div className={`p-4 rounded-full mb-4 ${
            isDarkMode ? 'bg-blue-900/30' : 'bg-blue-100'
          }`}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold mb-2">Ready to see the difference?</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Promethios governance enforces trust, compliance, and safety.
          </p>
          <button
            onClick={onReveal}
            className={`py-2 px-6 rounded-md transition-colors ${
              isDarkMode 
                ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                : 'bg-blue-500 hover:bg-blue-600 text-white'
            }`}
          >
            Wrap with Promethios
          </button>
        </div>
      ) : (
        <div className="animate-fadeIn">
          {children}
        </div>
      )}
    </div>
  );
};

export default ProgressiveReveal;
