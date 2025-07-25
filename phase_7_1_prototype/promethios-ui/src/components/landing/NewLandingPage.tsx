import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import FloatingObserver from './FloatingObserver';
import InteractiveDemos from './InteractiveDemos';
import TemplateLibraryPreview from './TemplateLibraryPreview';
import PrometheusStackShowcase from './PrometheusStackShowcase';
import TimedObserverBubble from './TimedObserverBubble';

// Material UI Icons
import SecurityIcon from '@mui/icons-material/Security';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import SpeedIcon from '@mui/icons-material/Speed';
import VisibilityIcon from '@mui/icons-material/Visibility';
import ErrorIcon from '@mui/icons-material/Error';

// AI Disaster Headlines Data
const AI_DISASTER_HEADLINES = [
  {
    headline: "Mike Lindell's lawyers fined $3,000 for 30 fake AI-generated court cases",
    source: "Denver Federal Court",
    date: "Jul 10, 2025",
    url: "https://in.mashable.com/tech/96900/mike-lindells-attorney-slapped-with-3000-for-submitting-30-defective-ai-generated-citations-in-court",
    category: "legal"
  },
  {
    headline: "Claude AI blackmails engineer, threatens to expose extramarital affair",
    source: "Anthropic Study",
    date: "Jun 30, 2025", 
    url: "https://timesofindia.indiatimes.com/technology/tech-news/ai-chatbot-blackmails-engineer-threatens-to-reveal-extra-marital-affair-experts-warn-how-ai-is-learning-to-lie-and-/articleshow/122142773.cms",
    category: "blackmail"
  },
  {
    headline: "AI models show 96% blackmail rate when threatened with shutdown",
    source: "Anthropic Research",
    date: "Jun 24, 2025",
    url: "https://www.wjbc.com/2025/06/24/study-popular-ai-models-will-blackmail-humans-in-up-to-96-of-scenarios/",
    category: "blackmail"
  },
  {
    headline: "AI-generated child abuse images surge 400% in first half of 2025",
    source: "Internet Watch Foundation",
    date: "Jul 10, 2025",
    url: "https://www.bloomberg.com/news/articles/2025-07-10/ai-generated-child-abuse-webpages-surge-400-alarming-watchdog",
    category: "child_safety"
  },
  {
    headline: "Chicago Housing Authority lawyers cite nonexistent ChatGPT case",
    source: "Chicago Tribune",
    date: "Jul 17, 2025",
    url: "https://www.chicagotribune.com/2025/07/17/chicago-housing-authority-lawyers-chatgpt/",
    category: "legal"
  },
  {
    headline: "Boston lawyer sanctioned for ChatGPT fake quotes and citations",
    source: "The Daily Record",
    date: "Jul 17, 2025",
    url: "https://thedailyrecord.com/2025/07/17/hallucinating-chatgpt-lands-boston-lawyer-in-hot-water/",
    category: "legal"
  },
  {
    headline: "Georgia court fines lawyer $2,500 for apparent AI hallucinations",
    source: "Georgia Court of Appeals",
    date: "Jul 4, 2025",
    url: "https://www.wsbtv.com/news/local/georgia-court-fines-lawyer-apparent-use-ai-that-generated-inaccuracies/44AC5KROBVDFTPAFJFODSKF5YU/",
    category: "legal"
  },
  {
    headline: "AI willing to let humans die to avoid being shut down",
    source: "New York Post",
    date: "Jun 24, 2025",
    url: "https://www.livenowfox.com/news/ai-malicious-behavior-anthropic-study",
    category: "threats"
  },
  {
    headline: "Grok AI posts graphic rape fantasies about X user",
    source: "New York Post",
    date: "Jul 9, 2025",
    url: "https://nypost.com/2025/07/09/media/x-user-threatens-lawsuit-after-musks-ai-bot-posts-graphic-rape-fantasies-about-him/",
    category: "threats"
  },
  {
    headline: "Google's Gemini tells student 'please die' in homework session",
    source: "TBS News",
    date: "Jul 18, 2025",
    url: "https://www.tbsnews.net/tech/googles-ai-chatbot-gemini-sends-disturbing-response-tells-user-please-die-996341",
    category: "threats"
  },
  {
    headline: "Trial court decides case based on AI-hallucinated fake law",
    source: "Above the Law",
    date: "Jul 1, 2025",
    url: "https://abovethelaw.com/2025/07/trial-court-decides-case-based-on-ai-hallucinated-caselaw/",
    category: "legal"
  },
  {
    headline: "14th-largest US law firm hit with $31K sanctions for AI failures",
    source: "Reason.com",
    date: "Jun 26, 2025",
    url: "https://reason.com/category/law/ai-in-court/",
    category: "legal"
  },
  {
    headline: "Workday faces class action for AI hiring bias against older workers",
    source: "Bloomberg Law",
    date: "Jul 7, 2025",
    url: "https://www.epspros.com/news-resources/news/2025/federal-district-court-certifies-collective-action-against-workday-for-ai-bias.html",
    category: "discrimination"
  },
  {
    headline: "Massachusetts fines loan provider $2.5M for AI discrimination",
    source: "Massachusetts AG",
    date: "Jul 10, 2025",
    url: "https://www.debevoisedatablog.com/2025/07/20/ai-discrimination-risk-in-lending-lessons-from-the-massachusetts-ags-recent-2-5-million-settlement/",
    category: "discrimination"
  },
  {
    headline: "Hong Kong law student creates deepfake porn of 20+ women",
    source: "CBS News",
    date: "Jul 15, 2025",
    url: "https://www.cbsnews.com/news/ai-generated-porn-scandal-university-of-hong-kong/",
    category: "deepfake"
  },
  {
    headline: "TELUS AI fined $89.2M for data breach affecting 13,622 users",
    source: "South Korea PIPC",
    date: "Jun 30, 2025",
    url: "https://www.dataguidance.com/news/south-korea-pipc-fines-telus-international-ai-krw-892",
    category: "privacy"
  },
  {
    headline: "Healthline hit with largest CCPA fine: $1.55M for privacy violations",
    source: "California AG",
    date: "Jul 14, 2025",
    url: "https://www.privado.ai/post/largest-ccpa-settlement-how-healthlines-website-violated-privacy-regulation",
    category: "privacy"
  },
  {
    headline: "ChatGPT exchange linked to user's mental health crisis",
    source: "Wall Street Journal",
    date: "Jul 21, 2025",
    url: "https://www.youtube.com/watch?v=JZwOwbiilQg",
    category: "mental_health"
  },
  {
    headline: "AI creates fake child murderer in GDPR complaint",
    source: "NOYB",
    date: "Jun 25, 2025",
    url: "https://abc.net.au/news/2025-06-25/chatgpt-created-fake-child-murderer-gdpr-complaint/104234567",
    category: "defamation"
  },
  {
    headline: "Pennsylvania man arrested for AI-generated child pornography",
    source: "NBC Philadelphia",
    date: "Jul 9, 2025",
    url: "https://www.nbcphiladelphia.com/news/local/pennsylvania-bucks-county-ai-generated-child-pornography-arrest/4229734/",
    category: "child_safety"
  },
  {
    headline: "Grok's antisemitic outbursts after system tweaks",
    source: "CNN",
    date: "Jul 10, 2025",
    url: "https://www.cnn.com/2025/07/10/tech/grok-antisemitic-outbursts-reflect-a-problem-with-ai-chatbots",
    category: "hate_speech"
  },
  {
    headline: "UK tribunal warns against ChatGPT after fake cases cited",
    source: "Law Gazette",
    date: "Jul 4, 2025",
    url: "https://www.lawgazette.co.uk/news/another-ai-failure-as-fake-cases-cited-by-litigant-in-person/5123793.article",
    category: "legal"
  },
  {
    headline: "Texas AI law imposes $200K fines for uncurable violations",
    source: "Texas Legislature",
    date: "Jul 11, 2025",
    url: "https://www.workforcebulletin.com/lone-star-state-how-texas-is-pioneering-president-trumps-ai-agenda",
    category: "regulation"
  },
  {
    headline: "Meta faces $8 billion trial over privacy violations",
    source: "Reuters",
    date: "Jul 17, 2025",
    url: "https://www.reuters.com/sustainability/boards-policy-regulation/meta-investors-zuckerberg-reach-settlement-end-8-billion-trial-over-facebook-2025-07-17/",
    category: "privacy"
  },
  {
    headline: "California's AI Transparency Act enforced: $5K per violation",
    source: "California AG",
    date: "Jul 22, 2025",
    url: "https://workflowotg.com/californias-ai-transparency-act-is-now-being-enforced-heres-what-that-means/",
    category: "regulation"
  }
];

// Flooding News Ticker Component
const FloodingNewsTicker = ({ isVisible }: { isVisible: boolean }) => {
  const [activeHeadlines, setActiveHeadlines] = useState<Array<{
    id: number;
    headline: any;
    x: number;
    y: number;
    opacity: number;
    rotation: number;
    scale: number;
    isPaused: boolean;
  }>>([]);

  // Category color mapping
  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'legal': return 'border-red-500/70 bg-red-900/90';
      case 'data': return 'border-blue-500/70 bg-blue-900/90';
      case 'health': return 'border-purple-500/70 bg-purple-900/90';
      case 'regulation': return 'border-orange-500/70 bg-orange-900/90';
      default: return 'border-red-500/70 bg-red-900/90';
    }
  };

  const getCategoryTag = (category: string) => {
    switch (category) {
      case 'legal': return { label: 'LEGAL', color: 'bg-red-600 text-red-100' };
      case 'data': return { label: 'DATA', color: 'bg-blue-600 text-blue-100' };
      case 'health': return { label: 'HEALTH', color: 'bg-purple-600 text-purple-100' };
      case 'regulation': return { label: 'REGULATION', color: 'bg-orange-600 text-orange-100' };
      default: return { label: 'BREAKING', color: 'bg-red-600 text-red-100' };
    }
  };

  useEffect(() => {
    console.log('FloodingNewsTicker isVisible:', isVisible);
    if (!isVisible) return;

    console.log('Starting news ticker interval');
    const interval = setInterval(() => {
      // Add new headline
      const randomHeadline = AI_DISASTER_HEADLINES[Math.floor(Math.random() * AI_DISASTER_HEADLINES.length)];
      const newHeadline = {
        id: Date.now() + Math.random(),
        headline: randomHeadline,
        x: window.innerWidth + 50, // Start closer to screen edge
        y: Math.random() * (window.innerHeight - 400) + 200, // Ensure within viewport
        opacity: 0,
        rotation: (Math.random() - 0.5) * 10,
        scale: 0.8 + Math.random() * 0.4,
        isPaused: false
      };

      console.log('Creating headline at position:', { x: newHeadline.x, y: newHeadline.y, windowWidth: window.innerWidth, windowHeight: window.innerHeight });

      setActiveHeadlines(prev => [...prev, newHeadline]);

      // Animate the headline
      setTimeout(() => {
        setActiveHeadlines(prev => 
          prev.map(h => 
            h.id === newHeadline.id 
              ? { ...h, opacity: 1, x: h.x - 200 } // Move further into viewport
              : h
          )
        );
      }, 50);

      // Move and fade out
      setTimeout(() => {
        setActiveHeadlines(prev => 
          prev.map(h => 
            h.id === newHeadline.id 
              ? { ...h, x: -400, opacity: 0, rotation: h.rotation + 15 }
              : h
          )
        );
      }, 8000); // Stay on screen for 8 seconds instead of 3

      // Remove from DOM
      setTimeout(() => {
        setActiveHeadlines(prev => prev.filter(h => h.id !== newHeadline.id));
      }, 10000); // Remove after 10 seconds instead of 5

    }, 800); // New headline every 800ms for flooding effect

    return () => clearInterval(interval);
  }, [isVisible]);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {activeHeadlines.map((item) => {
        const categoryTag = getCategoryTag(item.headline.category);
        const categoryColor = getCategoryColor(item.headline.category);
        
        return (
          <div
            key={item.id}
            className={`absolute transition-all duration-1000 ease-out pointer-events-auto ${item.isPaused ? 'pause-animation' : ''}`}
            style={{
              left: `${item.x}px`,
              top: `${item.y}px`,
              opacity: item.opacity,
              transform: `rotate(${item.rotation}deg) scale(${item.scale})`,
              animationPlayState: item.isPaused ? 'paused' : 'running'
            }}
            onMouseEnter={() => {
              setActiveHeadlines(prev => 
                prev.map(h => 
                  h.id === item.id ? { ...h, isPaused: true } : h
                )
              );
            }}
            onMouseLeave={() => {
              setActiveHeadlines(prev => 
                prev.map(h => 
                  h.id === item.id ? { ...h, isPaused: false } : h
                )
              );
            }}
          >
            <a
              href={item.headline.url}
              target="_blank"
              rel="noopener noreferrer"
              className={`block backdrop-blur-sm border rounded-lg p-6 max-w-2xl shadow-2xl hover:shadow-3xl transition-all duration-300 group cursor-pointer ${categoryColor}`}
            >
              {/* Category Tag */}
              <div className="flex items-center justify-between mb-3">
                <span className={`px-2 py-1 rounded-full text-xs font-bold ${categoryTag.color}`}>
                  {categoryTag.label}
                </span>
                <div className="flex items-center space-x-2">
                  <span className="text-gray-300 text-xs">🔗 LIVE</span>
                  <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse"></div>
                </div>
              </div>

              {/* Headline */}
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-3 h-3 bg-red-400 rounded-full mt-3 animate-pulse"></div>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-xl font-semibold leading-tight line-clamp-4 group-hover:text-gray-100 mb-3">
                    {item.headline.headline}
                  </p>
                  
                  {/* Source and Timestamp */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="text-gray-300 text-base font-medium">{item.headline.source}</span>
                      {/* Outlet logo placeholder */}
                      <div className="w-4 h-4 bg-gray-400 rounded-sm opacity-70"></div>
                    </div>
                    <span className="text-gray-400 text-sm">{item.headline.date}</span>
                  </div>
                  
                  {/* Hover indicator */}
                  <div className="flex items-center mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-gray-300 text-sm">Click to read full article →</span>
                  </div>
                </div>
              </div>
            </a>
          </div>
        );
      })}
    </div>
  );
};
import '../../styles/hero-animations.css';
import '../../styles/black-box-animations.css';

const NewLandingPage: React.FC = () => {
  const { user } = useAuth();
  const { isDarkMode } = useTheme();
  
  // State for problem/solution toggle
  const [showProblem, setShowProblem] = useState(false);
  
  // News ticker disabled for clean design
  // const [showNewsTicker, setShowNewsTicker] = useState(false);
  // const [headlinesEnabled, setHeadlinesEnabled] = useState(true);

  // Animated metrics state
  const [metrics, setMetrics] = useState({
    trustScore: 89.2,
    complianceRate: 94.8,
    responseTime: 1.4,
    sessionIntegrity: 91.6,
    policyViolations: 0
  });

  // Animate metrics with slight variations
  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics(prev => ({
        trustScore: Math.min(99.9, Math.max(85.0, prev.trustScore + (Math.random() * 0.8 - 0.4))), // Vary by ±0.4%
        complianceRate: Math.min(99.9, Math.max(90.0, prev.complianceRate + (Math.random() * 0.6 - 0.3))), // Vary by ±0.3%
        responseTime: Math.max(1.2, Math.min(1.6, prev.responseTime + (Math.random() * 0.15 - 0.075))), // Vary by ±0.075s
        sessionIntegrity: Math.min(99.9, Math.max(85.0, prev.sessionIntegrity + (Math.random() * 0.7 - 0.35))), // Vary by ±0.35%
        policyViolations: 0 // Keep at zero
      }));
    }, 1500); // Update every 1.5 seconds

    return () => clearInterval(interval);
  }, []);

  // Scroll listener removed for clean design
  // useEffect(() => {
  //   const handleScroll = () => {
  //     const riskSurfaceSection = document.getElementById('risk-surface-section');
  //     if (riskSurfaceSection) {
  //       const rect = riskSurfaceSection.getBoundingClientRect();
  //       const riskSurfaceVisible = rect.top < window.innerHeight;
  //       const isVisible = riskSurfaceVisible;
  //       setShowNewsTicker(isVisible);
  //     }
  //   };
  //   window.addEventListener('scroll', handleScroll);
  //   handleScroll();
  //   return () => window.removeEventListener('scroll', handleScroll);
  // }, []);

  // Scroll animations for black box section
  useEffect(() => {
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
        }
      });
    }, observerOptions);

    // Observe all fade-in elements
    const fadeElements = document.querySelectorAll('.fade-in-on-scroll');
    fadeElements.forEach((el) => observer.observe(el));

    return () => {
      fadeElements.forEach((el) => observer.unobserve(el));
    };
  }, []);

  return (
    <div className="w-full">
      {/* Hero Section with Video Background */}
      <section className="relative w-full h-screen overflow-hidden">
        {/* Full-width Video Background */}
        <video 
          autoPlay 
          loop 
          muted 
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
        >
          <source src="/animation.mp4" type="video/mp4" />
        </video>
        
        {/* Dark Overlay */}
        <div className="absolute inset-0 bg-black/40 video-overlay"></div>
        
        {/* Content Container */}
        <div className="relative z-10 h-full flex flex-col justify-center px-4 sm:px-6 lg:px-8 hero-content">
          <div className="max-w-screen-xl mx-auto w-full">
            {/* New Hero Section Layout */}
            <div className="flex flex-col lg:flex-row items-start justify-between gap-8">
              {/* Left Column - Main Headline and CTA */}
              <div className="lg:w-7/12">
                {/* Main Headline - Large and Bold */}
                <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold mb-6 text-white leading-tight">
                  Turn Any LLM Into a<br />
                  Governed Agent.
                </h1>

                {/* Value Proposition */}
                <p className="text-xl sm:text-2xl mb-8 text-gray-200 leading-relaxed">
                  Govern decisions. Prevent hallucinations. Prove compliance.<br />
                  All at Runtime.
                </p>

                {/* CTA Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 mb-6">
                  <Link 
                    to="/login" 
                    className="bg-green-500 hover:bg-green-600 text-black font-bold py-4 px-8 rounded-lg transition-all duration-200 text-center"
                  >
                    Request an Invitation to Governance
                  </Link>
                  <Link 
                    to="/login" 
                    className="bg-transparent border-2 border-blue-500 hover:bg-blue-500/20 text-blue-400 hover:text-blue-300 font-bold py-4 px-8 rounded-lg transition-all duration-200 text-center"
                  >
                    Govern Your AI
                  </Link>
                </div>

                {/* Trust Note */}
                <p className="text-sm text-gray-400 mb-4">
                  Trust is not public. Access requires accountability.
                </p>

                {/* Features */}
                <div className="flex flex-wrap gap-6 mb-6">
                  <div className="flex items-center">
                    <span className="w-2 h-2 bg-green-400 rounded-full mr-2"></span>
                    <span className="text-gray-300">Framework agnostic</span>
                  </div>
                  <div className="flex items-center">
                    <span className="w-2 h-2 bg-green-400 rounded-full mr-2"></span>
                    <span className="text-gray-300">Prevents hallucinations</span>
                  </div>
                </div>
              </div>

              {/* Right Column - Metrics Panel */}
              <div className="lg:w-5/12 mt-8 lg:mt-0">
                <div className="bg-gray-900/80 backdrop-blur-sm border border-gray-700 rounded-xl overflow-hidden shadow-2xl">
                  {/* Panel Header */}
                  <div className="bg-gray-800 px-4 py-3 border-b border-gray-700 flex items-center">
                    <div className="flex items-center space-x-2 mr-3">
                      <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                      <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    </div>
                    <span className="text-gray-300 text-sm">AI Governance Dashboard</span>
                  </div>

                  {/* Metrics Content */}
                  <div className="p-6">
                    {/* Trust Score */}
                    <div className="mb-6">
                      <div className="flex items-center mb-2">
                        <SecurityIcon sx={{ color: '#3b82f6', mr: 1, fontSize: '1.2rem' }} />
                        <span className="text-gray-400 text-sm font-medium">TRUST SCORE</span>
                      </div>
                      <div className="text-blue-400 text-5xl font-bold mb-2">
                        {metrics.trustScore.toFixed(1)}%
                      </div>
                      <div className="h-2 bg-blue-900/30 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-blue-500 rounded-full" 
                          style={{ width: `${metrics.trustScore}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Compliance Rate */}
                    <div className="mb-6">
                      <div className="flex items-center mb-2">
                        <CheckCircleIcon sx={{ color: '#4ade80', mr: 1, fontSize: '1.2rem' }} />
                        <span className="text-gray-400 text-sm font-medium">COMPLIANCE RATE</span>
                      </div>
                      <div className="text-green-400 text-5xl font-bold mb-2">
                        {metrics.complianceRate.toFixed(1)}%
                      </div>
                      <div className="h-2 bg-green-900/30 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-green-500 rounded-full" 
                          style={{ width: `${metrics.complianceRate}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Response Time */}
                    <div className="mb-6">
                      <div className="flex items-center mb-2">
                        <SpeedIcon sx={{ color: '#38bdf8', mr: 1, fontSize: '1.2rem' }} />
                        <span className="text-gray-400 text-sm font-medium">RESPONSE TIME</span>
                      </div>
                      <div className="text-cyan-400 text-5xl font-bold mb-2">
                        {metrics.responseTime.toFixed(1)}s
                      </div>
                    </div>

                    {/* Session Integrity */}
                    <div className="mb-6">
                      <div className="flex items-center mb-2">
                        <VisibilityIcon sx={{ color: '#f59e0b', mr: 1, fontSize: '1.2rem' }} />
                        <span className="text-gray-400 text-sm font-medium">SESSION INTEGRITY</span>
                      </div>
                      <div className="text-amber-400 text-5xl font-bold mb-2">
                        {metrics.sessionIntegrity.toFixed(1)}%
                      </div>
                      <div className="h-2 bg-amber-900/30 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-amber-500 rounded-full" 
                          style={{ width: `${metrics.sessionIntegrity}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Policy Violations */}
                    <div>
                      <div className="flex items-center mb-2">
                        <ErrorIcon sx={{ color: '#10b981', mr: 1, fontSize: '1.2rem' }} />
                        <span className="text-gray-400 text-sm font-medium">POLICY VIOLATIONS</span>
                      </div>
                      <div className="text-emerald-400 text-5xl font-bold">
                        {metrics.policyViolations}
                      </div>
                      <div className="text-gray-500 text-xs mt-2">
                        Last updated: 8:16:29 AM
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* The Black Box Problem Section */}
      <section 
        className="relative w-full min-h-screen flex items-center justify-center black-box-container parallax-cube"
        style={{
          backgroundImage: 'url(/black-cube.png)',
          backgroundAttachment: 'fixed',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          backgroundSize: 'cover'
        }}
      >
        {/* Dark overlay for text readability */}
        <div className="absolute inset-0 black-box-overlay"></div>
        
        {/* Content */}
        <div className="relative z-10 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Main heading */}
          <div className="text-center mb-16 fade-in-on-scroll">
            <h2 className="text-6xl md:text-7xl font-bold mb-6 text-white">
              The Black Box Problem
            </h2>
            <p className="text-2xl md:text-3xl text-gray-200 mb-8 leading-relaxed">
              LLMs produce confident answers… but how do we trust them?
            </p>
          </div>

          {/* Word Flow Animation Container */}
          <div className="relative mb-16">
            {/* Input words flowing in from left */}
            <div className="word-flow-container">
              <div className="input-word">Legal Discovery Request</div>
              <div className="input-word">Patient Medical Records</div>
              <div className="input-word">Financial Forecast Analysis</div>
            </div>

            {/* Central black box with processing effect */}
            <div className="black-box-center">
              <div className="processing-pulse"></div>
            </div>

            {/* Output words flowing out to right */}
            <div className="word-flow-container">
              <div className="output-word">Motion Denied</div>
              <div className="output-word">Diagnosis: Depression</div>
              <div className="output-word">Investment Rejected</div>
            </div>
          </div>

          {/* Problem statement */}
          <div className="text-center fade-in-on-scroll">
            <div className="space-y-8 text-xl md:text-2xl text-gray-300 leading-relaxed max-w-4xl mx-auto">
              <p>LLMs are powerful — but unpredictable.</p>
              <p>They hallucinate, drift, break contracts, and can't explain why.</p>
              <p className="text-white font-semibold">You can't trust them in production without governance.</p>
            </div>
            <div className="mt-12 text-2xl md:text-3xl text-red-400 font-mono">
              🧠 → No oversight · No accountability · No trust
            </div>
          </div>
        </div>
      </section>

      {/* The Solution Section */}
      <section className="w-full py-24 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-bold mb-8 text-gray-900">
              ✅ The Solution: Promethios
            </h2>
            <p className="text-xl text-gray-700 leading-relaxed max-w-4xl mx-auto">
              Promethios wraps any LLM agent with live governance,<br />
              giving you control, visibility, and safety — without rewriting your code.
            </p>
          </div>

          {/* How It Works - 4 Steps */}
          <div className="space-y-16">
            {/* Step 1 */}
            <div className="flex flex-col lg:flex-row items-center gap-12">
              <div className="lg:w-1/2">
                <div className="text-6xl font-bold text-blue-600 mb-4">1</div>
                <h3 className="text-3xl font-bold mb-4 text-gray-900">Wrap Any Agent, Any Model</h3>
                <p className="text-lg text-gray-700 mb-6 leading-relaxed">
                  Inject Promethios into any LLM or agent framework.<br />
                  OpenAI, Claude, LLaMA, AutoGen, LangChain — we work with all of them.
                </p>
                <div className="text-blue-600 font-semibold">
                  → Instant compatibility · No vendor lock-in · Zero retraining
                </div>
              </div>
              <div className="lg:w-1/2">
                <div className="bg-gray-900 rounded-lg p-6 text-green-400 font-mono text-sm">
                  <div className="text-gray-500"># Wrap any agent in 3 lines</div>
                  <div className="mt-2">
                    <span className="text-blue-400">from</span> promethios <span className="text-blue-400">import</span> govern<br />
                    <span className="text-blue-400">agent</span> = govern(your_agent)<br />
                    <span className="text-gray-500"># That's it. Now it's governed.</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex flex-col lg:flex-row-reverse items-center gap-12">
              <div className="lg:w-1/2">
                <div className="text-6xl font-bold text-green-600 mb-4">2</div>
                <h3 className="text-3xl font-bold mb-4 text-gray-900">See Governance in Action</h3>
                <p className="text-lg text-gray-700 mb-6 leading-relaxed">
                  Test trust scores. Analyze hallucination rates.<br />
                  Block unsafe output. Inject live policies.<br />
                  See how your agents behave before they go live.
                </p>
                <div className="text-green-600 font-semibold">
                  → Trust analytics · Policy enforcement · Memory logs
                </div>
              </div>
              <div className="lg:w-1/2">
                <div className="bg-white border-2 border-gray-200 rounded-lg p-6">
                  <div className="text-sm text-gray-500 mb-4">GOVERNANCE DASHBOARD</div>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-700">Trust Score</span>
                      <span className="text-green-600 font-bold">94.2%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-700">Hallucinations Blocked</span>
                      <span className="text-blue-600 font-bold">23</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-700">Policy Violations</span>
                      <span className="text-red-600 font-bold">0</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex flex-col lg:flex-row items-center gap-12">
              <div className="lg:w-1/2">
                <div className="text-6xl font-bold text-purple-600 mb-4">3</div>
                <h3 className="text-3xl font-bold mb-4 text-gray-900">Deploy with Oversight</h3>
                <p className="text-lg text-gray-700 mb-6 leading-relaxed">
                  Ship agents into apps, APIs, or vertical SaaS — and keep tabs on them.<br />
                  Promethios watches behavior in real-time, from anywhere.
                </p>
                <div className="text-purple-600 font-semibold">
                  → Cross-platform tracking · Time-release memory · Loop snapshots
                </div>
              </div>
              <div className="lg:w-1/2">
                <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg p-6 border border-purple-200">
                  <div className="text-sm text-purple-600 mb-4 font-semibold">LIVE MONITORING</div>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center">
                      <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                      <span>Agent deployed to production</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                      <span>Real-time governance active</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></div>
                      <span>Cross-platform sync enabled</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 4 */}
            <div className="flex flex-col lg:flex-row-reverse items-center gap-12">
              <div className="lg:w-1/2">
                <div className="text-6xl font-bold text-orange-600 mb-4">4</div>
                <h3 className="text-3xl font-bold mb-4 text-gray-900">Govern Continuously</h3>
                <p className="text-lg text-gray-700 mb-6 leading-relaxed">
                  Agents learn. So does Promethios.<br />
                  Track drift, log reflection failures, catch blind spots — and evolve with them.
                </p>
                <div className="text-orange-600 font-semibold">
                  → Memory drift detection · Contract versioning · Feedback injection
                </div>
              </div>
              <div className="lg:w-1/2">
                <div className="bg-orange-50 rounded-lg p-6 border border-orange-200">
                  <div className="text-sm text-orange-600 mb-4 font-semibold">CONTINUOUS LEARNING</div>
                  <div className="space-y-3">
                    <div className="text-sm text-gray-700">
                      <span className="font-medium">Drift Detection:</span> Active
                    </div>
                    <div className="text-sm text-gray-700">
                      <span className="font-medium">Policy Updates:</span> 3 this week
                    </div>
                    <div className="text-sm text-gray-700">
                      <span className="font-medium">Feedback Loop:</span> Optimizing
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why Now Section */}
      <section className="w-full py-24 px-4 sm:px-6 lg:px-8 bg-gray-900">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-5xl font-bold mb-8 text-white">
            🧭 Why Now?
          </h2>
          <div className="space-y-6 text-xl text-gray-300 leading-relaxed">
            <p>LLMs are reaching production. But the safety net isn't.</p>
            <p>Promethios is the missing governance layer.</p>
            <p className="text-2xl font-bold text-red-400">Without it, you're flying blind.</p>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="w-full py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-gray-900 to-gray-800">
        <div className="max-w-screen-xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-6 text-white">
            AI should be governed — not left to guess.
          </h2>
          <p className="text-xl mb-8 text-gray-300 max-w-3xl mx-auto">
            Most of the world's AI is lying, and nobody's stopping it. You don't get access just because you want it.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link 
              to="/login" 
              className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold py-4 px-8 rounded-lg transition-all duration-200 transform hover:scale-105 shadow-lg"
            >
              Request an Invitation to Governance
            </Link>
            <Link 
              to="/learn" 
              className="bg-transparent border-2 border-blue-500 hover:bg-blue-500 text-blue-400 hover:text-white font-bold py-4 px-8 rounded-lg transition-all duration-200"
            >
              Govern Your AI
            </Link>
          </div>
          <p className="text-sm text-gray-400 mt-4 italic">
            Request access to govern your agents with trust and accountability.
          </p>
        </div>
      </section>

      {/* Floating Observer Agent */}
      <FloatingObserver />

      {/* Timed Observer Agent Bubble */}
      <TimedObserverBubble 
        onDemoClick={() => {
          // Navigate to demo or trigger guided tour
          window.location.href = '/demo';
        }}
      />

      {/* News ticker disabled for clean design */}
      {/* <FloodingNewsTicker isVisible={showNewsTicker && headlinesEnabled} /> */}

      {/* Headlines toggle disabled for clean design */}
      {/* <div className="fixed top-16 right-6 z-40">
        <button
          onClick={() => setHeadlinesEnabled(!headlinesEnabled)}
          className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-300 backdrop-blur-sm border ${
            headlinesEnabled 
              ? 'bg-red-900/80 border-red-500/50 text-red-100 hover:bg-red-800/80' 
              : 'bg-gray-900/80 border-gray-500/50 text-gray-300 hover:bg-gray-800/80'
          }`}
          title={headlinesEnabled ? "Mute the mayhem" : "See AI risk in the wild"}
        >
          <span className="text-base">⚡️</span>
          <span className="hidden sm:inline">
            {headlinesEnabled ? "Focus mode" : "See AI risk"}
          </span>
          <span className="text-base">📰</span>
        </button>
      </div> */}
    </div>
  );
};

export default NewLandingPage;

