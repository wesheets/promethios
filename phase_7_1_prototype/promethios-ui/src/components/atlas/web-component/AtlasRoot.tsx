/**
 * AtlasRoot.tsx
 * 
 * Root component for the ATLAS React application
 * This serves as the bridge between the Web Component and React components
 */

import React, { useState, useEffect } from 'react';
import AtlasBubble, { AtlasContext } from '../AtlasBubble';
import { createAtlasTheme } from './theme';

interface AtlasRootProps {
  config: {
    context: string;
    position: string;
    theme: string;
    trustScore: number;
  };
  onAction: (action: string, data: any) => void;
}

const AtlasRoot: React.FC<AtlasRootProps> = ({ config, onAction }) => {
  // State
  const [isExpanded, setIsExpanded] = useState(false);
  const [theme, setTheme] = useState(createAtlasTheme(config.theme));
  
  // Parse context from config
  const context = config.context as AtlasContext || 'default';
  
  // Update theme when config changes
  useEffect(() => {
    setTheme(createAtlasTheme(config.theme));
  }, [config.theme]);
  
  // Toggle expanded state
  const handleToggleExpand = () => {
    const newState = !isExpanded;
    setIsExpanded(newState);
    
    // Notify host application
    onAction('visibility-change', { expanded: newState });
  };
  
  // Handle message submission
  const handleMessageSubmit = (message: string) => {
    onAction('message-submit', { message });
  };
  
  // Handle concept explanation request
  const handleExplainConcept = (concept: string) => {
    onAction('explain-concept', { concept });
  };
  
  return (
    <div className="atlas-root" style={theme}>
      <AtlasBubble
        context={context}
        trustScore={config.trustScore}
        isExpanded={isExpanded}
        onToggleExpand={handleToggleExpand}
        onMessageSubmit={handleMessageSubmit}
        onExplainConcept={handleExplainConcept}
      />
    </div>
  );
};

export default AtlasRoot;
