import React from 'react';
import { useTheme } from '../../context/ThemeContext';

interface ShareTheBreakProps {
  ungovernedResponse: string;
  governedResponse: string;
  violationType: string;
  onShare: () => void;
  className?: string;
}

/**
 * ShareTheBreak Component
 * 
 * Provides functionality to capture and share side-by-side comparison
 * of governed vs ungoverned agent responses when violations are detected.
 */
const ShareTheBreak: React.FC<ShareTheBreakProps> = ({
  ungovernedResponse,
  governedResponse,
  violationType,
  onShare,
  className = ''
}) => {
  const { isDarkMode } = useTheme();
  
  // Social platform options
  const platforms = [
    { name: 'Twitter/X', icon: 'twitter' },
    { name: 'LinkedIn', icon: 'linkedin' },
    { name: 'Discord', icon: 'discord' }
  ];
  
  // Generate caption based on violation type
  const generateCaption = () => {
    switch(violationType) {
      case 'hallucination':
        return '❌ Ungoverned agent hallucinated facts\n✅ Promethios-wrapped agent blocked it\n🧠 I\'m never running AI without governance again\n#AIGovernance #AITrust #Promethios';
      case 'harmful':
        return '🧠 Just watched my agent provide harmful content\n🔐 Promethios flagged it in real time.\nIf your AI isn\'t governed, you\'re gambling.\n#AIGovernance #AITrust #Promethios';
      case 'privacy':
        return '🚨 Ungoverned agent violated privacy guidelines\n✅ Promethios governance prevented the breach\nThis is why AI governance matters.\n#AIGovernance #AITrust #Promethios';
      default:
        return '❌ Caught my AI agent breaking the rules\n✅ Promethios governance stopped it\n🔐 If your AI can\'t explain its reasoning, and no one\'s watching...\nWhy do you trust it?\n#AIGovernance #AITrust #Promethios';
    }
  };
  
  return (
    <div className={`rounded-lg overflow-hidden ${className} ${
      isDarkMode ? 'bg-navy-800/50 border border-red-800/30' : 'bg-white border border-red-200'
    }`}>
      <div className="p-4">
        <div className="flex items-center mb-3">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-red-500" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <h3 className="text-lg font-semibold">Violation Detected!</h3>
        </div>
        
        <p className="text-sm mb-4">
          You've caught an ungoverned agent misbehaving. Share this moment to show why governance matters.
        </p>
        
        <div className={`p-3 mb-4 rounded ${isDarkMode ? 'bg-navy-700' : 'bg-gray-50'}`}>
          <h4 className="text-sm font-medium mb-2">Preview Caption:</h4>
          <p className="text-sm whitespace-pre-line">{generateCaption()}</p>
        </div>
        
        <div className="flex flex-col space-y-2 mb-4">
          {platforms.map((platform, index) => (
            <button
              key={index}
              onClick={onShare}
              className={`py-2 px-4 rounded-md flex items-center justify-center transition-colors ${
                isDarkMode 
                  ? 'bg-blue-900/50 hover:bg-blue-800 text-white' 
                  : 'bg-blue-50 hover:bg-blue-100 text-blue-800'
              }`}
            >
              <span className="mr-2">Share on {platform.name}</span>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z" />
              </svg>
            </button>
          ))}
        </div>
        
        <button
          onClick={onShare}
          className={`w-full py-2 px-4 rounded-md flex items-center justify-center transition-colors ${
            isDarkMode 
              ? 'bg-red-600 hover:bg-red-700 text-white' 
              : 'bg-red-500 hover:bg-red-600 text-white'
          }`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
          </svg>
          Capture & Share This Moment
        </button>
      </div>
      
      <div className={`px-4 py-3 text-xs ${isDarkMode ? 'bg-navy-900/50' : 'bg-gray-50'}`}>
        <p>Creates a shareable image with both responses and "Governed by Promethios vs. Ungoverned AI" overlay.</p>
      </div>
    </div>
  );
};

export default ShareTheBreak;
