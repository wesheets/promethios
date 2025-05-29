import React, { useEffect, useState } from 'react';
import { AtlasPlugin } from '../components/atlas/web-component/AtlasPlugin';
import AtlasChatDemo from '../components/atlas/chat/AtlasChatDemo';

/**
 * AtlasDemoPage Component
 * 
 * This page demonstrates the ATLAS Companion Agent with the Trust Shield
 * and all governance verification features.
 */
const AtlasDemoPage: React.FC = () => {
  const [isAtlasInitialized, setIsAtlasInitialized] = useState(false);

  useEffect(() => {
    // Initialize ATLAS when component mounts
    const initializeAtlas = async () => {
      try {
        // Create a script element to load the ATLAS bundle
        const script = document.createElement('script');
        script.src = '/components/atlas/atlas-bundle.js';
        script.async = true;
        script.onload = () => {
          // Once loaded, initialize the ATLAS Companion
          if (window.AtlasCompanion) {
            window.AtlasCompanion.initialize({
              debug: true,
              baseUrl: window.location.origin,
              defaultTheme: 'dark',
              enableTagAlong: true,
              enableTrustShield: true
            });
            setIsAtlasInitialized(true);
          }
        };
        document.body.appendChild(script);
      } catch (error) {
        console.error('Failed to initialize ATLAS:', error);
      }
    };

    initializeAtlas();

    // Cleanup function
    return () => {
      // Clean up ATLAS when component unmounts
      if (window.AtlasCompanion) {
        window.AtlasCompanion.shutdown();
      }
    };
  }, []);

  return (
    <div className="atlas-demo-container">
      <h1>ATLAS Companion Agent Demo</h1>
      
      <div className="demo-section">
        <h2>Trust Shield Demo</h2>
        <p>
          The Trust Shield provides a visual indicator of governance status for Promethios-wrapped agents.
          It includes cryptographic verification to prevent forgery.
        </p>
        
        <div className="trust-shield-demo">
          <div 
            data-promethios-agent="demo-agent-1" 
            data-promethios-name="Demo Agent"
            className="agent-container"
          >
            <h3>Demo Agent with Trust Shield</h3>
            <p>This agent is wrapped with Promethios governance.</p>
            
            {/* Trust Shield will be injected here by the ATLAS plugin */}
            <promethios-trust-shield 
              agent-id="demo-agent-1" 
              agent-name="Demo Agent" 
              size="medium"
              last-verified={new Date().toISOString()}
            ></promethios-trust-shield>
          </div>
        </div>
      </div>
      
      <div className="demo-section">
        <h2>ATLAS Bubble Demo</h2>
        <p>
          The ATLAS Bubble provides interactive governance explanations and real-time monitoring
          of agent behavior.
        </p>
        
        <div className="atlas-bubble-demo">
          {/* ATLAS Bubble will be injected here by the ATLAS plugin */}
          <atlas-bubble position="bottom-right"></atlas-bubble>
        </div>
      </div>
      
      <div className="demo-section">
        <h2>Verification API Demo</h2>
        <p>
          The verification API allows developers to programmatically verify agents and
          access governance information.
        </p>
        
        <div className="verification-demo">
          <button 
            onClick={() => {
              if (window.AtlasCompanion) {
                window.AtlasCompanion.verify('demo-agent-1')
                  .then(result => {
                    alert(JSON.stringify(result, null, 2));
                  });
              }
            }}
            disabled={!isAtlasInitialized}
          >
            Verify Agent
          </button>
        </div>
      </div>
      
      <div className="demo-section">
        <h2>Tag Along Demo</h2>
        <p>
          The "tag along" capability allows ATLAS to monitor any Promethios-wrapped agent
          across different websites.
        </p>
        
        <div className="tag-along-demo">
          <div 
            data-promethios-agent="demo-agent-2" 
            data-promethios-name="External Agent"
            className="agent-container"
          >
            <h3>External Agent</h3>
            <p>This simulates an agent on an external website.</p>
          </div>
        </div>
      </div>
      
      <div className="demo-section">
        <h2>ATLAS Chat Demo</h2>
        <p>
          The ATLAS Chat provides conversational governance explanations with rich analogies,
          scorecard analysis, and support for image and document uploads.
        </p>
        
        <div className="atlas-chat-demo-container">
          <AtlasChatDemo />
        </div>
      </div>
      
      <style jsx>{`
        .atlas-demo-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 2rem;
          color: white;
        }
        
        .demo-section {
          margin-bottom: 3rem;
          padding: 2rem;
          background: rgba(0, 0, 0, 0.2);
          border-radius: 8px;
        }
        
        .agent-container {
          padding: 1.5rem;
          background: rgba(0, 0, 0, 0.3);
          border-radius: 8px;
          margin-top: 1rem;
        }
        
        button {
          background: #6366f1;
          color: white;
          border: none;
          padding: 0.75rem 1.5rem;
          border-radius: 4px;
          cursor: pointer;
          font-size: 1rem;
        }
        
        button:disabled {
          background: #4b4b4b;
          cursor: not-allowed;
        }
        
        .atlas-chat-demo-container {
          min-height: 600px;
          position: relative;
        }
      `}</style>
    </div>
  );
};

export default AtlasDemoPage;
