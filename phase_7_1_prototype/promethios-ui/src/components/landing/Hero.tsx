import React from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '../../context/ThemeContext';
import { Link } from 'react-router-dom';

const Hero: React.FC = () => {
  const { isDarkMode } = useTheme();
  
  return (
    <div className={`relative ${isDarkMode ? 'bg-gray-900' : 'bg-white'} overflow-hidden`}>
      {/* Gradient background */}
      <div className="absolute inset-0 bg-gradient-to-b from-blue-900/20 to-blue-700/20"></div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center py-20 md:py-32">
          <motion.h1 
            className={`text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            You’ve been lied to.
          </motion.h1>
          
          <motion.p 
            className={`mt-6 text-xl md:text-2xl max-w-3xl mx-auto ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            The AI you trust is making things up — and you don’t even know it.  Promethios makes every agent traceable, accountable, and governed by design.
          </motion.p>
          
          <div className="mt-10 flex flex-col sm:flex-row justify-center gap-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <Link
                to="/signup"
                className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 md:py-4 md:text-lg md:px-10"
              >
                Get Started
              </Link>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.6 }}
            >
              <Link
                to="/benchmark"
                className={`w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md ${isDarkMode ? 'text-blue-300 bg-blue-900/30' : 'text-blue-700 bg-blue-100'} hover:bg-opacity-70 md:py-4 md:text-lg md:px-10`}
              >
                See Benchmarks
              </Link>
            </motion.div>
          </div>
          
          <motion.p 
            className={`mt-6 text-sm md:text-base max-w-2xl mx-auto ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} italic`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.8 }}
          >
            Promethios is rolling out in phases. Join the waitlist for early access to governed agent infrastructure.
          </motion.p>
        </div>
        
        {/* App preview image */}
        <motion.div
          className="relative mx-auto max-w-5xl pb-16"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.8 }}
        >
          <div className={`rounded-lg shadow-2xl overflow-hidden ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
            <div className={`h-6 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'} flex items-center px-4`}>
              <div className="flex space-x-2">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              </div>
            </div>
            <div className="p-4">
              <img 
                src="/images/cmu-benchmark-new.png" 
                alt="CMU Benchmark Results" 
                className="w-full h-auto"
              />
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Hero;
