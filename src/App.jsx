import React, { useState, useEffect } from 'react';
import './App.css';

// Import flame assets
import flameVideo from './assets/0801.mp4';
import promethiosLogo from './assets/promethiosnoflame.png';

// Import scorecard and node assets
import centerScorecard from './assets/centerscorecard.png';
import trustNode from './assets/trustnode.png';
import cryptographicLogs from './assets/cryptographiclogs.png';
import realtimeMonitoring from './assets/realtimemonitoringnode.png';
import complianceNode from './assets/compliancenode.png';
import memoryNode from './assets/memorynode.png';

// Import LLM logos
import openaiLogo from './assets/e3d927054278d43b838afed1939de03b.png';
import anthropicLogo from './assets/cdnlogo.com_anthropic.png';
import googleGeminiLogo from './assets/google-gemini-1024.png';
import cohereLogo from './assets/Cohere-Logo-500x281.png';
import perplexityLogo from './assets/Perplexity-Logo.png';
import grokLogo from './assets/groklogo.png';

// Import background
import gradientBackground from './assets/gradient-background.png';

function App() {
  const [showFlame, setShowFlame] = useState(true);
  const [showContent, setShowContent] = useState(false);
  const [currentLogoIndex, setCurrentLogoIndex] = useState(0);
  const [activeConnections, setActiveConnections] = useState([]);
  const [metrics, setMetrics] = useState({
    trust: 0,
    security: 0,
    monitoring: 0,
    compliance: 0,
    memory: 0
  });
  const [scorecardGlow, setScorecardGlow] = useState('');

  // Simple flame loader - runs once on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowFlame(false);
      setShowContent(true);
    }, 7000);

    return () => clearTimeout(timer);
  }, []);

  // LLM logos data
  const llmLogos = [
    { id: 'openai', name: 'OpenAI', image: openaiLogo },
    { id: 'anthropic', name: 'Anthropic', image: anthropicLogo },
    { id: 'google', name: 'Google Gemini', image: googleGeminiLogo },
    { id: 'cohere', name: 'Cohere', image: cohereLogo },
    { id: 'perplexity', name: 'Perplexity', image: perplexityLogo },
    { id: 'grok', name: 'Grok', image: grokLogo }
  ];

  // Governance nodes data - Left side vertical stack
  const governanceNodes = [
    { 
      id: 'trust', 
      label: 'Trust Score', 
      image: trustNode, 
      color: '#6366f1', // indigo
      position: { top: '25%', left: '120px' },
      metric: 'trust'
    },
    { 
      id: 'security', 
      label: 'Security Audit Logs', 
      image: cryptographicLogs, 
      color: '#f59e0b', // amber
      position: { top: '33%', left: '120px' },
      metric: 'security'
    },
    { 
      id: 'monitoring', 
      label: 'Real-time Monitoring', 
      image: realtimeMonitoring, 
      color: '#3b82f6', // blue
      position: { top: '41%', left: '120px' },
      metric: 'monitoring'
    },
    { 
      id: 'compliance', 
      label: 'Compliance', 
      image: complianceNode, 
      color: '#10b981', // green
      position: { top: '49%', left: '120px' },
      metric: 'compliance'
    },
    { 
      id: 'memory', 
      label: 'Memory', 
      image: memoryNode, 
      color: '#ef4444', // red
      position: { top: '57%', left: '120px' },
      metric: 'memory'
    }
  ];

  // Animation sequence for each logo
  useEffect(() => {
    if (!showContent) return;

    const startSequence = () => {
      // Reset state
      setActiveConnections([]);
      setMetrics({
        trust: 0,
        security: 0,
        monitoring: 0,
        compliance: 0,
        memory: 0
      });
      setScorecardGlow('');

      // Randomize node connection order for visual variety
      const shuffledNodes = [...governanceNodes].sort(() => Math.random() - 0.5);
      
      // Connect nodes one by one
      shuffledNodes.forEach((node, index) => {
        setTimeout(() => {
          setActiveConnections(prev => [...prev, node.id]);
          setScorecardGlow(node.color);
          
          // Increase corresponding metric
          setMetrics(prev => ({
            ...prev,
            [node.metric]: Math.floor(Math.random() * 30) + 70 // 70-99%
          }));

          // Clear individual glow after a moment
          setTimeout(() => {
            if (index === shuffledNodes.length - 1) {
              // Final transformation when all nodes are connected
              setScorecardGlow('rainbow');
              
              // Boost all metrics to 95-99%
              setTimeout(() => {
                setMetrics({
                  trust: Math.floor(Math.random() * 5) + 95,
                  security: Math.floor(Math.random() * 5) + 95,
                  monitoring: Math.floor(Math.random() * 5) + 95,
                  compliance: Math.floor(Math.random() * 5) + 95,
                  memory: Math.floor(Math.random() * 5) + 95
                });
              }, 500);
              
              // Clear rainbow glow before logo switch
              setTimeout(() => setScorecardGlow(''), 2000);
            } else {
              setScorecardGlow('');
            }
          }, 500);
        }, (index + 1) * 1000); // 1 second between connections
      });

      // After all connections and final transformation, switch to next logo
      setTimeout(() => {
        setCurrentLogoIndex(prev => (prev + 1) % llmLogos.length);
      }, (shuffledNodes.length + 4) * 1000);
    };

    // Start first sequence after content appears
    const initialDelay = setTimeout(startSequence, 1000);
    
    // Set up recurring sequences
    const interval = setInterval(startSequence, (governanceNodes.length + 6) * 1000);

    return () => {
      clearTimeout(initialDelay);
      clearInterval(interval);
    };
  }, [showContent]);

  return (
    <div className="app">
      {/* Flame Loader */}
      {showFlame && (
        <div className="flame-container">
          <video 
            className="flame-video"
            autoPlay 
            muted 
            loop
            playsInline
            ref={(video) => {
              if (video) {
                video.playbackRate = 0.7; // Slow down to 70% speed
              }
            }}
          >
            <source src={flameVideo} type="video/mp4" />
          </video>
          <img src={promethiosLogo} alt="Promethios" className="promethios-logo" />
        </div>
      )}

      {/* Main Content */}
      {showContent && (
        <>
          {/* Header */}
          <header className="header">
            <div className="nav-container">
              <div className="logo">
                <span className="logo-icon">🔥</span>
                <span className="logo-text">PROMETHIOS</span>
              </div>
              <nav className="nav-menu">
                <a href="#features">Features</a>
                <a href="#about">About</a>
                <a href="#contact">Contact</a>
                <button className="nav-cta">Get Started</button>
              </nav>
            </div>
          </header>

          {/* Main Content Area */}
          <main className="main-content">
            <div className="content-container">
              {/* Left Side - Hero Text */}
              <section className="hero-section">
                <h1 className="hero-title">
                  Transform Any AI Into<br />
                  <span className="hero-highlight">Governed Intelligence</span>
                </h1>
                <p className="hero-description">
                  Promethios wraps any LLM in enterprise-grade governance,
                  providing cryptographic verification, audit trails, and real-time
                  compliance monitoring.
                </p>
                <div className="hero-buttons">
                  <button className="primary-button">Start Free Trial</button>
                  <button className="secondary-button">View Documentation</button>
                </div>
              </section>

              {/* Right Side - Full Width Animation */}
              <section className="animation-section">
                {/* Center Scorecard */}
                <div className="center-scorecard-container">
                  <div 
                    className={`center-scorecard ${scorecardGlow ? 'glowing' : ''}`}
                    style={{
                      '--glow-color': scorecardGlow
                    }}
                  >
                    <img src={centerScorecard} alt="AI Scorecard" className="scorecard-bg" />
                    
                    {/* LLM Logo Slider */}
                    <div className="logo-slider">
                      <img 
                        src={llmLogos[currentLogoIndex].image} 
                        alt={llmLogos[currentLogoIndex].name}
                        className="current-logo"
                        key={currentLogoIndex}
                      />
                    </div>

                    {/* Metrics Panel Inside Scorecard */}
                    <div className="metrics-panel">
                      <div 
                        className={`metric ${activeConnections.includes('trust') ? 'active' : ''}`}
                        data-metric="trust"
                      >
                        <div className="metric-header">
                          <span className="metric-label">Trust</span>
                          <span className="metric-value">{metrics.trust}%</span>
                        </div>
                        <div className="metric-progress">
                          <div 
                            className="metric-progress-bar"
                            style={{ width: `${metrics.trust}%` }}
                          />
                        </div>
                      </div>
                      
                      <div 
                        className={`metric ${activeConnections.includes('security') ? 'active' : ''}`}
                        data-metric="security"
                      >
                        <div className="metric-header">
                          <span className="metric-label">Security</span>
                          <span className="metric-value">{metrics.security}%</span>
                        </div>
                        <div className="metric-progress">
                          <div 
                            className="metric-progress-bar"
                            style={{ width: `${metrics.security}%` }}
                          />
                        </div>
                      </div>
                      
                      <div 
                        className={`metric ${activeConnections.includes('monitoring') ? 'active' : ''}`}
                        data-metric="monitoring"
                      >
                        <div className="metric-header">
                          <span className="metric-label">Monitoring</span>
                          <span className="metric-value">{metrics.monitoring}%</span>
                        </div>
                        <div className="metric-progress">
                          <div 
                            className="metric-progress-bar"
                            style={{ width: `${metrics.monitoring}%` }}
                          />
                        </div>
                      </div>
                      
                      <div 
                        className={`metric ${activeConnections.includes('compliance') ? 'active' : ''}`}
                        data-metric="compliance"
                      >
                        <div className="metric-header">
                          <span className="metric-label">Compliance</span>
                          <span className="metric-value">{metrics.compliance}%</span>
                        </div>
                        <div className="metric-progress">
                          <div 
                            className="metric-progress-bar"
                            style={{ width: `${metrics.compliance}%` }}
                          />
                        </div>
                      </div>
                      
                      <div 
                        className={`metric ${activeConnections.includes('memory') ? 'active' : ''}`}
                        data-metric="memory"
                      >
                        <div className="metric-header">
                          <span className="metric-label">Memory</span>
                          <span className="metric-value">{metrics.memory}%</span>
                        </div>
                        <div className="metric-progress">
                          <div 
                            className="metric-progress-bar"
                            style={{ width: `${metrics.memory}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                </div>

                {/* Governance Nodes */}
                {governanceNodes.map((node, index) => (
                  <div
                    key={node.id}
                    className={`governance-node ${activeConnections.includes(node.id) ? 'connected' : ''}`}
                    style={{
                      ...node.position,
                      animationDelay: `${index * 0.2}s`
                    }}
                  >
                    <img src={node.image} alt={node.label} />
                  </div>
                ))}
              </section>
            </div>
          </main>
        </>
      )}
    </div>
  );
}

export default App;

