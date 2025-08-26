import React, { useState, useEffect } from 'react';
import './App.css';

// Import flame assets
import flameVideo from './assets/0801.mp4';
import promethiosLogo from './assets/promethiosnoflame.png';
import promethiosLogoLong from './assets/promethios-logo-long.png';

// Import scorecard and node assets
import centerScorecard from './assets/centerscorecard.png';

// Import LLM logos
import openaiLogo from './assets/e3d927054278d43b838afed1939de03b.png';
import anthropicLogo from './assets/cdnlogo.com_anthropic.png';
import googleGeminiLogo from './assets/google-gemini-1024.png';
import cohereLogo from './assets/Cohere-Logo-500x281.png';
import perplexityLogo from './assets/Perplexity-Logo.png';
import huggingfaceLogo from './assets/huggingface-logo.png';

// Import background
import gradientBackground from './assets/gradient-background.png';

function App() {
  const [showFlame, setShowFlame] = useState(true);
  const [showContent, setShowContent] = useState(false);
  const [currentLogoIndex, setCurrentLogoIndex] = useState(0);
  const [scorecardGlow, setScorecardGlow] = useState('');
  const [metrics, setMetrics] = useState({
    trust: 0,
    security: 0,
    monitoring: 0,
    compliance: 0,
    memory: 0
  });

  // Flame loader - runs once on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowFlame(false);
      setShowContent(true);
    }, 7000);

    return () => clearTimeout(timer);
  }, []);

  const aiCompanies = [
    { name: 'OpenAI', logo: openaiLogo },
    { name: 'Anthropic', logo: anthropicLogo },
    { name: 'Google Gemini', logo: googleGeminiLogo },
    { name: 'Cohere', logo: cohereLogo },
    { name: 'Perplexity', logo: perplexityLogo },
    { name: 'Grok', logo: grokLogo },
    { name: 'Hugging Face', logo: huggingfaceLogo }
  ];

  // Animation sequence for each logo
  useEffect(() => {
    if (!showContent) return;

    const startSequence = () => {
      // Reset metrics to 0
      setMetrics({
        trust: 0,
        security: 0,
        monitoring: 0,
        compliance: 0,
        memory: 0
      });
      setScorecardGlow('');

      // Animate metrics one by one
      const metricsOrder = ['trust', 'security', 'monitoring', 'compliance', 'memory'];
      const colors = ['#6366f1', '#f59e0b', '#3b82f6', '#10b981', '#ef4444'];
      
      metricsOrder.forEach((metric, index) => {
        setTimeout(() => {
          setScorecardGlow(colors[index]);
          
          // Increase corresponding metric
          setMetrics(prev => ({
            ...prev,
            [metric]: Math.floor(Math.random() * 30) + 70 // 70-99%
          }));

          // Clear individual glow after a moment
          setTimeout(() => {
            if (index === metricsOrder.length - 1) {
              // Final transformation when all metrics are boosted
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
        }, (index + 1) * 1000); // 1 second between metrics
      });

      // After all metrics and final transformation, switch to next logo
      setTimeout(() => {
        setCurrentLogoIndex(prev => (prev + 1) % llmLogos.length);
      }, (metricsOrder.length + 4) * 1000);
    };

    // Start first sequence after content appears
    const initialDelay = setTimeout(startSequence, 1000);
    
    // Set up recurring sequences
    const interval = setInterval(startSequence, 10000); // 10 seconds between cycles

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
            <div className="logo">
              <img src={promethiosLogoLong} alt="Promethios" className="logo-image" />
            </div>
            <nav className="nav-menu">
              <a href="#features">Features</a>
              <a href="#about">About</a>
              <a href="#contact">Contact</a>
            </nav>
            <div className="header-buttons">
              <button className="btn-secondary">Get Started</button>
            </div>
          </header>

          {/* Main Content Area */}
          <main className="main-content">
            <div className="content-container">
              {/* Left Side - Hero Content */}
              <section className="hero-section">
                <h1 className="hero-title">
                  Govern Any AI.<br />
                  <span className="hero-title-accent">Measure What Matters.</span>
                </h1>
                <p className="hero-description">
                  Promethios transforms any large language model into governed intelligence—measuring trust, compliance, security, and performance in real time. Every interaction is cryptographically verified, logged, and accountable.
                </p>
                <p className="hero-supporting">
                  <em>Because in enterprise AI, what you can't measure, you can't trust.</em>
                </p>
                <div className="hero-buttons">
                  <button className="btn-primary">Start Free Trial</button>
                  <button className="btn-secondary">View Documentation</button>
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
                        className="metric"
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
                        className="metric"
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
                        className="metric"
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
                        className="metric"
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
                        className="metric"
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

                {/* Disclaimer */}
                <div className="scorecard-disclaimer">
                  <p>Metrics shown are generated by Promethios' governance engine and do not represent official scores from model providers.</p>
                </div>
              </section>
            </div>
          </main>
        </>
      )}
    </div>
  );
}

export default App;

