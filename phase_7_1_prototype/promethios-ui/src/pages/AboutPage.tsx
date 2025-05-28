import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';
import ReactMarkdown from 'react-markdown';

const AboutPage: React.FC = () => {
  const { isDarkMode } = useTheme();
  const [content, setContent] = useState('');

  useEffect(() => {
    fetch('/content/about.md')
      .then(response => response.text())
      .then(text => setContent(text))
      .catch(error => console.error('Error loading about content:', error));
  }, []);

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'}`}>
      <div className="max-w-4xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="text-center mb-16">
            <img 
              src="/images/about/governance-shield.png" 
              alt="AI Governance Shield" 
              className="w-64 h-64 mx-auto mb-8"
            />
          </div>

          <div className="prose prose-lg mx-auto dark:prose-invert">
            <ReactMarkdown>{content}</ReactMarkdown>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default AboutPage;
