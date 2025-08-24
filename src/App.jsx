import { useState, useEffect, useRef } from 'react';
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
  const [currentPhase, setCurrentPhase] = useState(1);
  const [cubePosition, setCubePosition] = useState({ x: 70, y: 45 });
  const [connectedCubes, setConnectedCubes] = useState([]);
  const [wireframePulse, setWireframePulse] = useState('');
  const hasStartedAnimation = useRef(false);
  const animationCompleted = useRef(false);

  // Phase progression - show flame loader every time for brand recognition
  useEffect(() => {
    // Never restart if animation has completed or already started
    if (hasStartedAnimation.current || animationCompleted.current) {
      return;
    }
    hasStartedAnimation.current = true;

    const phases = [
      { delay: 7000, phase: 2 }, // Flame to cube (7 seconds)
      { delay: 2000, phase: 3 }, // Cube positioning
      { delay: 1000, phase: 4 }, // UI reveal
      { delay: 1000, phase: 5 }  // Cubes appear
    ];

    let timeouts = [];
    phases.forEach(({ delay, phase }, index) => {
      const totalDelay = phases.slice(0, index + 1).reduce((sum, p) => sum + p.delay, 0);
      const timeout = setTimeout(() => {
        setCurrentPhase(phase);
        // Mark as completed when reaching final phase
        if (phase === 5) {
          animationCompleted.current = true;
        }
      }, totalDelay);
      timeouts.push(timeout);
    });

    return () => {
      timeouts.forEach(clearTimeout);
      // Don't reset hasStartedAnimation on cleanup to prevent restart
    };
  }, []);

  // Cube positioning animation (Phase 2) - removed to prevent jumping

  const [draggedCube, setDraggedCube] = useState(null);
  const [absorbedCubes, setAbsorbedCubes] = useState([]);

  // Drag and drop handlers
  const handleDragStart = (e, cubeColor) => {
    setDraggedCube(cubeColor);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', cubeColor);
    
    // Create a transparent drag image to remove white background
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
      // Add to absorbed cubes (makes it vanish)
      setAbsorbedCubes(prev => [...prev, draggedCube]);
      
      // Pulse wireframe with cube color and keep the color
      setWireframePulse(draggedCube);
      
      // Add connection effect
      setConnectedCubes(prev => [...prev, draggedCube]);
    }
    setDraggedCube(null);
  };

  const FlameAnimation = () => (
    !animationCompleted.current && (
      <div className={`flame-container ${currentPhase > 1 ? 'fade-out' : ''}`}>
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
    )
  );

  const WireframeCube = () => (
    <div 
      className={`wireframe-cube visible ${wireframePulse ? `pulse-${wireframePulse}` : ''} ${absorbedCubes.length > 0 ? 'governed' : ''}`}
      style={{
        left: `${cubePosition.x}%`,
        top: `${cubePosition.y}%`,
        transform: 'translate(-50%, -50%)',
        filter: absorbedCubes.length > 0 ? 
          `drop-shadow(0 0 30px ${getAbsorbedColor()}) drop-shadow(0 0 60px ${getAbsorbedColor()})` : 
          'drop-shadow(0 0 20px rgba(96, 165, 250, 0.5))'
      }}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <img src={wireframeCube} alt="AI Governance Cube" />
      <div className="absorption-effect"></div>
    </div>
  );

  const getAbsorbedColor = () => {
    if (absorbedCubes.length === 0) return 'rgba(96, 165, 250, 0.5)';
    
    const colorMap = {
      red: 'rgba(239, 68, 68, 0.8)',
      green: 'rgba(34, 197, 94, 0.8)',
      orange: 'rgba(249, 115, 22, 0.8)',
      yellow: 'rgba(234, 179, 8, 0.8)',
      purple: 'rgba(168, 85, 247, 0.8)'
    };
    
    // Use the last absorbed cube's color
    return colorMap[absorbedCubes[absorbedCubes.length - 1]] || 'rgba(96, 165, 250, 0.5)';
  };

  const GovernanceCubes = () => {
    const cubes = [
      { color: 'red', label: 'Trust Score', image: redCube },
      { color: 'green', label: 'Audit Trail', image: greenCube },
      { color: 'orange', label: 'Policy Engine', image: orangeCube },
      { color: 'yellow', label: 'Real-time Monitor', image: yellowCube },
      { color: 'purple', label: 'Compliance', image: purpleCube }
    ];

    return (
      <div className="governance-cubes visible">
        {cubes.map((cube, index) => (
          !absorbedCubes.includes(cube.color) && (
            <div 
              key={cube.color}
              className={`governance-cube ${cube.color}-cube draggable ${draggedCube === cube.color ? 'dragging' : ''}`}
              style={{ 
                animationDelay: `${index * 0.2}s`
              }}
              draggable={true}
              onDragStart={(e) => handleDragStart(e, cube.color)}
            >
              <img src={cube.image} alt={cube.label} />
              <span className="cube-label">{cube.label}</span>
              <div className="drag-hint">Drag to AI Box</div>
            </div>
          )
        ))}
      </div>
    );
  };

  const Header = () => (
    <header className="main-header visible">
      <div className="header-content">
        <a href="#" className="logo">
          <div className="logo-icon"></div>
          PROMETHIOS
        </a>
        <nav className="nav">
          <a href="#features">Features</a>
          <a href="#about">About</a>
          <a href="#contact">Contact</a>
          <button className="cta-button">Get Started</button>
        </nav>
      </div>
    </header>
  );

  const HeroContent = () => (
    <div className="hero-content visible">
      <h1 className="hero-title">
        Transform Any AI Into<br />
        <span className="gradient-text">Governed Intelligence</span>
      </h1>
      <p className="hero-description">
        Promethios wraps any LLM in enterprise-grade governance, providing 
        cryptographic verification, audit trails, and real-time compliance monitoring.
      </p>
      <div className="hero-buttons">
        <button className="primary-button">Start Free Trial</button>
        <button className="secondary-button">View Documentation</button>
      </div>
    </div>
  );

  const CircuitBackground = () => (
    <div className={`circuit-background ${currentPhase >= 7 ? 'active' : ''}`}>
      <div className="circuit-pattern"></div>
      <div className="energy-pulses"></div>
    </div>
  );

  return (
    <div className="app">
      <FlameAnimation />
      <Header />
      
      <main className="hero-section">
        <HeroContent />
        <div className="animation-area">
          <WireframeCube />
          <GovernanceCubes />
          <CircuitBackground />
        </div>
      </main>
    </div>
  );
}

export default App;
