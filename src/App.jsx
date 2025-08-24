import { useState, useEffect } from 'react';
import './App.css';

// Import cube images and flame assets
import wireframeCube from './assets/wireframecube.png';
import redCube from './assets/redcube.png';
import greenCube from './assets/greencube.png';
import orangeCube from './assets/orangecube.png';
import yellowCube from './assets/yellowcube.png';
import purpleCube from './assets/purplecube.png';
import flameVideo from './assets/0801.mp4';
import promethiosLogo from './assets/promethiosnoflame.png';

function App() {
  const [showFlame, setShowFlame] = useState(true);
  const [showContent, setShowContent] = useState(false);
  const [draggedCube, setDraggedCube] = useState(null);
  const [absorbedCubes, setAbsorbedCubes] = useState([]);
  const [wireframePulse, setWireframePulse] = useState('');

  // Simple flame loader - runs once on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowFlame(false);
      setShowContent(true);
    }, 7000);

    return () => clearTimeout(timer);
  }, []);

  // Governance cubes data
  const governanceCubes = [
    { id: 'red', color: 'red', label: 'Trust Score', image: redCube },
    { id: 'green', color: 'green', label: 'Audit Trail', image: greenCube },
    { id: 'orange', color: 'orange', label: 'Policy Engine', image: orangeCube },
    { id: 'yellow', color: 'yellow', label: 'Real-time Monitor', image: yellowCube },
    { id: 'purple', color: 'purple', label: 'Compliance', image: purpleCube }
  ];

  // Drag and drop handlers
  const handleDragStart = (e, cubeId) => {
    setDraggedCube(cubeId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', cubeId);
    
    // Create transparent drag image
    const dragImage = new Image();
    dragImage.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAUEBAAAACwAAAAAAQABAAACAkQBADs=';
    e.dataTransfer.setDragImage(dragImage, 0, 0);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e) => {
    e.preventDefault();
    if (draggedCube && !absorbedCubes.includes(draggedCube)) {
      setAbsorbedCubes(prev => [...prev, draggedCube]);
      setWireframePulse(draggedCube);
      
      // Clear pulse after animation
      setTimeout(() => setWireframePulse(''), 500);
    }
    setDraggedCube(null);
  };

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
              {/* Hero Section */}
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

              {/* Animation Area */}
              <section className="animation-area">
                {/* Wireframe Cube */}
                <div 
                  className={`wireframe-cube ${wireframePulse ? `pulse-${wireframePulse}` : ''}`}
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  style={{
                    left: '70%',
                    top: '45%'
                  }}
                >
                  <img src={wireframeCube} alt="AI Governance Core" />
                </div>

                {/* Governance Cubes */}
                <div className="governance-cubes">
                  {governanceCubes.map((cube, index) => (
                    <div
                      key={cube.id}
                      className={`governance-cube ${draggedCube === cube.id ? 'dragging' : ''} ${absorbedCubes.includes(cube.id) ? 'absorbed' : ''}`}
                      draggable={!absorbedCubes.includes(cube.id)}
                      onDragStart={(e) => handleDragStart(e, cube.id)}
                      style={{
                        animationDelay: `${index * 0.2}s`
                      }}
                    >
                      <img src={cube.image} alt={cube.label} />
                      <div className="cube-label">{cube.label}</div>
                      {!absorbedCubes.includes(cube.id) && (
                        <div className="drag-hint">Drag to AI Box</div>
                      )}
                    </div>
                  ))}
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

