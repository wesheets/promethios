import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../../context/ThemeContext';

interface TooltipProps {
  content: string;
  position?: 'top' | 'right' | 'bottom' | 'left';
  children: React.ReactNode;
}

const Tooltip: React.FC<TooltipProps> = ({ content, position = 'top', children }) => {
  const [isVisible, setIsVisible] = useState(false);
  const { isDarkMode } = useTheme();
  
  const positionClasses = {
    top: 'bottom-full left-1/2 transform -translate-x-1/2 mb-2',
    right: 'left-full top-1/2 transform -translate-y-1/2 ml-2',
    bottom: 'top-full left-1/2 transform -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 transform -translate-y-1/2 mr-2'
  };
  
  const arrowClasses = {
    top: 'top-full left-1/2 transform -translate-x-1/2 border-t-gray-800 dark:border-t-gray-700 border-l-transparent border-r-transparent border-b-transparent',
    right: 'right-full top-1/2 transform -translate-y-1/2 border-r-gray-800 dark:border-r-gray-700 border-t-transparent border-b-transparent border-l-transparent',
    bottom: 'bottom-full left-1/2 transform -translate-x-1/2 border-b-gray-800 dark:border-b-gray-700 border-l-transparent border-r-transparent border-t-transparent',
    left: 'left-full top-1/2 transform -translate-y-1/2 border-l-gray-800 dark:border-l-gray-700 border-t-transparent border-b-transparent border-r-transparent'
  };

  return (
    <div 
      className="relative inline-block"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
      onClick={() => setIsVisible(!isVisible)}
    >
      {children}
      <AnimatePresence>
        {isVisible && (
          <motion.div 
            className={`absolute z-50 ${positionClasses[position]}`}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.15 }}
          >
            <div className={`px-3 py-2 text-sm rounded shadow-lg max-w-xs ${isDarkMode ? 'bg-gray-800 text-white' : 'bg-gray-800 text-white'}`}>
              {content}
            </div>
            <div className={`absolute w-0 h-0 border-4 ${arrowClasses[position]}`}></div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Tooltip;
