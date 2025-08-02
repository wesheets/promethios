import React, { useState, useEffect } from 'react';

interface FlameLoaderProps {
  onComplete: () => void;
}

const FlameLoader: React.FC<FlameLoaderProps> = ({ onComplete }) => {
  const [phase, setPhase] = useState<'fadeIn' | 'playing' | 'fadeOut' | 'complete'>('fadeIn');
  const [isSkipped, setIsSkipped] = useState(false);

  useEffect(() => {
    // Check if user prefers reduced motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    
    // Check if user has seen the loader recently (within 1 hour)
    const lastSeen = localStorage.getItem('promethios-loader-seen');
    const oneHourAgo = Date.now() - (60 * 60 * 1000);
    
    if (prefersReducedMotion || (lastSeen && parseInt(lastSeen) > oneHourAgo)) {
      // Skip the loader
      onComplete();
      return;
    }

    // Set the timestamp for this viewing
    localStorage.setItem('promethios-loader-seen', Date.now().toString());

    const timers: NodeJS.Timeout[] = [];

    // Phase 1: Fade in (500ms)
    timers.push(setTimeout(() => {
      if (!isSkipped) setPhase('playing');
    }, 500));

    // Phase 2: Show skip button after 3 seconds
    timers.push(setTimeout(() => {
      const skipButton = document.getElementById('flame-skip-button');
      if (skipButton && !isSkipped) {
        skipButton.style.opacity = '1';
      }
    }, 3000));

    // Phase 3: Start fade out (after 5.5 seconds total)
    timers.push(setTimeout(() => {
      if (!isSkipped) setPhase('fadeOut');
    }, 5500));

    // Phase 4: Complete (after 6 seconds total)
    timers.push(setTimeout(() => {
      if (!isSkipped) {
        setPhase('complete');
        onComplete();
      }
    }, 6000));

    return () => {
      timers.forEach(timer => clearTimeout(timer));
    };
  }, [onComplete, isSkipped]);

  const handleSkip = () => {
    setIsSkipped(true);
    setPhase('fadeOut');
    setTimeout(() => {
      setPhase('complete');
      onComplete();
    }, 300);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      handleSkip();
    }
  };

  if (phase === 'complete') {
    return null;
  }

  return (
    <div 
      className={`fixed inset-0 z-[9999] bg-black flex flex-col items-center justify-center transition-opacity duration-500 ${
        phase === 'fadeIn' ? 'opacity-0' : 
        phase === 'fadeOut' ? 'opacity-0' : 'opacity-100'
      }`}
      style={{ 
        pointerEvents: phase === 'complete' ? 'none' : 'auto'
      }}
    >
      {/* Flame Video */}
      <div className="relative flex flex-col items-center justify-center">
        <video
          autoPlay
          muted
          playsInline
          className={`w-96 h-96 md:w-[30rem] md:h-[30rem] lg:w-[36rem] lg:h-[36rem] object-contain transition-opacity duration-300 ${
            phase === 'playing' ? 'opacity-100' : 'opacity-80'
          }`}
          onLoadedData={() => {
            // Ensure video starts playing immediately
            const video = document.querySelector('#flame-video') as HTMLVideoElement;
            if (video) {
              video.currentTime = 0;
              video.play().catch(() => {
                // Fallback if autoplay fails
              });
            }
          }}
          id="flame-video"
        >
          <source src="/flame-loader.mp4" type="video/mp4" />
        </video>

        {/* Logo beneath the flame */}
        <div className={`mt-12 transition-opacity duration-300 ${
          phase === 'playing' ? 'opacity-100' : 'opacity-80'
        }`}>
          <img 
            src="/promethios-logo-new.png" 
            alt="Promethios" 
            className="h-20 md:h-28 lg:h-36 object-contain"
          />
        </div>
      </div>

      {/* Skip Button */}
      <button
        id="flame-skip-button"
        onClick={handleSkip}
        onKeyDown={handleKeyPress}
        className="absolute bottom-8 right-8 text-white/60 hover:text-white/90 text-sm transition-all duration-300 opacity-0 focus:outline-none focus:ring-2 focus:ring-white/50 rounded px-3 py-2"
        style={{ opacity: 0 }}
        tabIndex={0}
      >
        Skip →
      </button>

      {/* Accessibility: Screen reader text */}
      <div className="sr-only">
        Loading Promethios. Press Enter or Space to skip.
      </div>
    </div>
  );
};

export default FlameLoader;

