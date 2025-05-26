import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '../../context/ThemeContext';

const InvestorDemoToggle: React.FC = () => {
  const { isDarkMode } = useTheme();
  const [isDemoMode, setIsDemoMode] = useState(false);
  
  return (
    <div className={`fixed top-20 right-5 z-30 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
      <div className={`p-3 rounded-lg shadow-lg ${isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white'}`}>
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium">Investor Demo</span>
          <button
            onClick={() => setIsDemoMode(!isDemoMode)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 ${
              isDemoMode ? 'bg-purple-600' : isDarkMode ? 'bg-gray-700' : 'bg-gray-200'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                isDemoMode ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
        
        {isDemoMode && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-2 text-xs"
          >
            <p className="text-purple-500 font-medium">Demo Mode Active</p>
            <p className={`mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Showing optimized metrics and visualizations for investor presentation
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default InvestorDemoToggle;
