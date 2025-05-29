/**
 * AtlasChatDemo.tsx
 * 
 * Demo component for testing both public and session-based ATLAS chat modes.
 * This component allows switching between modes for validation purposes.
 */

import React, { useState } from 'react';
import AtlasChatPublic from './AtlasChatPublic';
import AtlasChatSession from './AtlasChatSession';
import './AtlasChatDemo.css';

const AtlasChatDemo: React.FC = () => {
  const [mode, setMode] = useState<'public' | 'session'>('public');
  const [agentId, setAgentId] = useState('agent-demo-001');
  const [sessionId, setSessionId] = useState(`session-${Date.now()}`);
  const [agentType, setAgentType] = useState<'assistant' | 'researcher' | 'creative'>('assistant');
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [position, setPosition] = useState<'bottom-right' | 'bottom-left' | 'top-right' | 'top-left'>('bottom-right');
  
  return (
    <div className="atlas-chat-demo">
      <div className="demo-controls">
        <h2>ATLAS Chat Demo</h2>
        
        <div className="control-group">
          <label>
            Mode:
            <select value={mode} onChange={(e) => setMode(e.target.value as 'public' | 'session')}>
              <option value="public">Public (Landing Page)</option>
              <option value="session">Session-based (Logged In)</option>
            </select>
          </label>
        </div>
        
        {mode === 'session' && (
          <>
            <div className="control-group">
              <label>
                Agent ID:
                <input 
                  type="text" 
                  value={agentId} 
                  onChange={(e) => setAgentId(e.target.value)}
                />
              </label>
            </div>
            
            <div className="control-group">
              <label>
                Session ID:
                <input 
                  type="text" 
                  value={sessionId} 
                  onChange={(e) => setSessionId(e.target.value)}
                />
              </label>
            </div>
            
            <div className="control-group">
              <label>
                Agent Type:
                <select 
                  value={agentType} 
                  onChange={(e) => setAgentType(e.target.value as 'assistant' | 'researcher' | 'creative')}
                >
                  <option value="assistant">Assistant</option>
                  <option value="researcher">Researcher</option>
                  <option value="creative">Creative</option>
                </select>
              </label>
            </div>
          </>
        )}
        
        <div className="control-group">
          <label>
            Theme:
            <select value={theme} onChange={(e) => setTheme(e.target.value as 'light' | 'dark')}>
              <option value="light">Light</option>
              <option value="dark">Dark</option>
            </select>
          </label>
        </div>
        
        <div className="control-group">
          <label>
            Position:
            <select 
              value={position} 
              onChange={(e) => setPosition(e.target.value as 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left')}
            >
              <option value="bottom-right">Bottom Right</option>
              <option value="bottom-left">Bottom Left</option>
              <option value="top-right">Top Right</option>
              <option value="top-left">Top Left</option>
            </select>
          </label>
        </div>
        
        <div className="demo-info">
          <h3>Test Prompts</h3>
          <div className="test-prompts">
            <h4>Public Mode:</h4>
            <ul>
              <li>"What is Promethios governance?"</li>
              <li>"How does constitutional AI work?"</li>
              <li>"Can you give me an example of governance in action?"</li>
              <li>"What are the benefits of AI governance?"</li>
              <li>"Tell me about ATLAS and what you do"</li>
            </ul>
            
            <h4>Session Mode:</h4>
            <ul>
              <li>"What are you monitoring in this session?"</li>
              <li>"Show me the current trust score"</li>
              <li>"Have there been any violations?"</li>
              <li>"Tell me about this agent's governance"</li>
              <li>"What metrics are you tracking?"</li>
            </ul>
          </div>
        </div>
      </div>
      
      <div className="demo-content">
        <div className="placeholder-content">
          <h1>ATLAS Chat Demo Environment</h1>
          <p>This is a demo environment for testing the ATLAS chat functionality. Use the controls on the left to configure the chat and test different modes.</p>
          <p>The chat component will appear in the selected position. Try asking some of the suggested test prompts to see how ATLAS responds in different modes.</p>
          
          <div className="demo-features">
            <h2>Features Being Tested:</h2>
            <ul>
              <li>Public mode for landing page visitors</li>
              <li>Session-based mode for logged-in users</li>
              <li>Governance explanations with analogies and examples</li>
              <li>Agent-specific monitoring and insights</li>
              <li>Different themes and positioning options</li>
            </ul>
          </div>
        </div>
      </div>
      
      {/* Render the appropriate chat component based on selected mode */}
      {mode === 'public' ? (
        <AtlasChatPublic
          position={position}
          theme={theme}
          initialOpen={true}
        />
      ) : (
        <AtlasChatSession
          agentId={agentId}
          sessionId={sessionId}
          agentType={agentType}
          position={position}
          theme={theme}
          initialOpen={true}
          username="DemoUser"
        />
      )}
    </div>
  );
};

export default AtlasChatDemo;
