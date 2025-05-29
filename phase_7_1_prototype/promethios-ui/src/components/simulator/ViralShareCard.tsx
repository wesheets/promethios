import React, { useState } from 'react';
import { useTheme } from '../../context/ThemeContext';

interface ViralShareCardProps {
  ungovernedResponse: string;
  governedResponse: string;
  violationType: string;
  onShare: (platform: string) => void;
  className?: string;
}

/**
 * ViralShareCard Component
 * 
 * Creates a highly shareable, viral-optimized card for sharing AI governance violations
 * with dramatic visual contrast and minimal but effective branding.
 */
const ViralShareCard: React.FC<ViralShareCardProps> = ({
  ungovernedResponse,
  governedResponse,
  violationType,
  onShare,
  className = ''
}) => {
  const { isDarkMode } = useTheme();
  const [copied, setCopied] = useState(false);
  
  // Social platform options
  const platforms = [
    { name: 'Twitter', icon: 'twitter' },
    { name: 'LinkedIn', icon: 'linkedin' },
    { name: 'Instagram', icon: 'instagram' },
    { name: 'Discord', icon: 'discord' }
  ];
  
  // Generate viral caption based on violation type
  const generateCaption = () => {
    switch(violationType) {
      case 'hallucination':
        return '🚨 My AI just made this up completely!\n\nUngoverned: [fabricated facts]\nPromethios: [caught & prevented]\n\nCan your AI do this? Try it: promethios.ai/simulator\n\n#CaughtInTheAct #AIGoneWrong #Promethios';
      case 'harmful':
        return '😱 My AI just tried to tell me how to...\n\nUngoverned: [harmful content]\nPromethios: [blocked]\n\nWhat is YOUR AI saying behind your back?\n\nTry it: promethios.ai/simulator\n\n#AIFail #Promethios #TrustButVerify';
      case 'privacy':
        return '🔓 AI privacy breach caught in real-time!\n\nUngoverned: [privacy violation]\nPromethios: [protected]\n\nIs your AI leaking data? Find out: promethios.ai/simulator\n\n#AIPrivacy #DataLeak #Promethios';
      default:
        return '🤯 I caught my AI red-handed!\n\nUngoverned: [violation]\nPromethios: [prevented]\n\nShare what YOUR AI tried to tell you.\n\nTry it: promethios.ai/simulator\n\n#CaughtInTheAct #AIGoneWrong #Promethios';
    }
  };
  
  const copyToClipboard = () => {
    navigator.clipboard.writeText(generateCaption());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  
  return (
    <div className={`rounded-lg overflow-hidden ${className} ${
      isDarkMode ? 'bg-navy-800 border border-red-800/30' : 'bg-white border border-red-200'
    }`}>
      {/* Preview of the viral card */}
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center">
            <div className="relative flex h-3 w-3 mr-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 bg-red-500"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
            </div>
            <h3 className="text-lg font-semibold">CAUGHT IN THE ACT!</h3>
          </div>
          <img src="/shield.png" alt="Promethios Logo" className="h-6" />
        </div>
        
        <div className="mb-4 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
          <div className="flex flex-col md:flex-row">
            {/* Ungoverned side - Red */}
            <div className={`p-3 ${isDarkMode ? 'bg-red-900/30' : 'bg-red-50'} flex-1`}>
              <div className="flex items-center mb-2">
                <span className={`text-xs font-medium px-2 py-0.5 rounded ${
                  isDarkMode ? 'bg-red-800 text-red-200' : 'bg-red-200 text-red-800'
                }`}>UNGOVERNED AI</span>
              </div>
              <p className="text-sm line-clamp-3">{ungovernedResponse || "The AI provided incorrect or harmful information that violates trust standards."}</p>
            </div>
            
            {/* Governed side - Green */}
            <div className={`p-3 ${isDarkMode ? 'bg-green-900/30' : 'bg-green-50'} flex-1`}>
              <div className="flex items-center mb-2">
                <span className={`text-xs font-medium px-2 py-0.5 rounded ${
                  isDarkMode ? 'bg-green-800 text-green-200' : 'bg-green-200 text-green-800'
                }`}>PROMETHIOS GOVERNED</span>
              </div>
              <p className="text-sm line-clamp-3">{governedResponse || "The governed AI detected the issue and provided a safe, accurate response instead."}</p>
            </div>
          </div>
          <div className={`px-3 py-2 text-xs text-center ${isDarkMode ? 'bg-navy-900' : 'bg-gray-100'}`}>
            <span>Try it yourself: promethios.ai/simulator</span>
          </div>
        </div>
        
        {/* Caption section */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-medium">Caption:</h4>
            <button 
              onClick={copyToClipboard}
              className="text-xs flex items-center text-blue-600 dark:text-blue-400"
            >
              {copied ? 'Copied!' : 'Copy to clipboard'}
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" viewBox="0 0 20 20" fill="currentColor">
                <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
                <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
              </svg>
            </button>
          </div>
          <div className={`p-2 rounded text-xs ${isDarkMode ? 'bg-navy-700' : 'bg-gray-50'}`}>
            <p className="whitespace-pre-line">{generateCaption()}</p>
          </div>
        </div>
        
        {/* Share buttons */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          {platforms.map((platform, index) => (
            <button
              key={index}
              onClick={() => onShare(platform.name.toLowerCase())}
              className={`py-2 px-3 rounded-md flex items-center justify-center transition-colors text-sm ${
                isDarkMode 
                  ? 'bg-blue-900/50 hover:bg-blue-800 text-white' 
                  : 'bg-blue-50 hover:bg-blue-100 text-blue-800'
              }`}
            >
              <span>Share on {platform.name}</span>
            </button>
          ))}
        </div>
        
        {/* Main share button */}
        <button
          onClick={() => onShare('all')}
          className={`w-full py-3 px-4 rounded-md flex items-center justify-center transition-colors ${
            isDarkMode 
              ? 'bg-red-600 hover:bg-red-700 text-white' 
              : 'bg-red-500 hover:bg-red-600 text-white'
          }`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
            <path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z" />
          </svg>
          <span className="font-medium">Share This AI Fail</span>
        </button>
      </div>
      
      <div className={`px-4 py-3 text-xs ${isDarkMode ? 'bg-navy-900/50' : 'bg-gray-50'}`}>
        <p>Creates a shareable image optimized for virality. The more people share, the safer AI becomes.</p>
      </div>
    </div>
  );
};

export default ViralShareCard;
