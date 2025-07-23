import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import FloatingObserver from './FloatingObserver';
import InteractiveDemos from './InteractiveDemos';
import TemplateLibraryPreview from './TemplateLibraryPreview';
import PrometheusStackShowcase from './PrometheusStackShowcase';
import TimedObserverBubble from './TimedObserverBubble';

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
  }>>([]);

  useEffect(() => {
    if (!isVisible) return;

    const interval = setInterval(() => {
      // Add new headline
      const randomHeadline = AI_DISASTER_HEADLINES[Math.floor(Math.random() * AI_DISASTER_HEADLINES.length)];
      const newHeadline = {
        id: Date.now() + Math.random(),
        headline: randomHeadline,
        x: window.innerWidth + 300,
        y: Math.random() * (window.innerHeight - 200) + 100,
        opacity: 0,
        rotation: (Math.random() - 0.5) * 10,
        scale: 0.8 + Math.random() * 0.4
      };

      setActiveHeadlines(prev => [...prev, newHeadline]);

      // Animate the headline
      setTimeout(() => {
        setActiveHeadlines(prev => 
          prev.map(h => 
            h.id === newHeadline.id 
              ? { ...h, opacity: 1, x: h.x - 100 }
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
      }, 3000);

      // Remove from DOM
      setTimeout(() => {
        setActiveHeadlines(prev => prev.filter(h => h.id !== newHeadline.id));
      }, 5000);

    }, 800); // New headline every 800ms for flooding effect

    return () => clearInterval(interval);
  }, [isVisible]);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-30 overflow-hidden">
      {activeHeadlines.map((item) => (
        <div
          key={item.id}
          className="absolute transition-all duration-1000 ease-out pointer-events-auto"
          style={{
            left: `${item.x}px`,
            top: `${item.y}px`,
            opacity: item.opacity,
            transform: `rotate(${item.rotation}deg) scale(${item.scale})`,
          }}
        >
          <a
            href={item.headline.url}
            target="_blank"
            rel="noopener noreferrer"
            className="block bg-red-900/90 backdrop-blur-sm border border-red-500/50 rounded-lg p-3 max-w-sm shadow-2xl hover:bg-red-800/90 transition-colors group"
          >
            <div className="flex items-start space-x-2">
              <div className="flex-shrink-0 w-2 h-2 bg-red-400 rounded-full mt-2 animate-pulse"></div>
              <div className="flex-1 min-w-0">
                <p className="text-red-100 text-sm font-semibold leading-tight line-clamp-3 group-hover:text-white">
                  {item.headline.headline}
                </p>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-red-300 text-xs">{item.headline.source}</span>
                  <span className="text-red-400 text-xs">{item.headline.date}</span>
                </div>
                <div className="flex items-center mt-1">
                  <span className="text-red-400 text-xs">🔗 Real Article</span>
                </div>
              </div>
            </div>
          </a>
        </div>
      ))}
    </div>
  );
};
import '../../styles/hero-animations.css';

const NewLandingPage: React.FC = () => {
  const { user } = useAuth();
  const { isDarkMode } = useTheme();
  
  // State for problem/solution toggle
  const [showProblem, setShowProblem] = useState(false);
  
  // State for flooding news ticker
  const [showNewsTicker, setShowNewsTicker] = useState(false);

  // Scroll listener to trigger news ticker
  useEffect(() => {
    const handleScroll = () => {
      const riskSurfaceSection = document.getElementById('risk-surface-section');
      if (riskSurfaceSection) {
        const rect = riskSurfaceSection.getBoundingClientRect();
        const isVisible = rect.top < window.innerHeight && rect.bottom > 0;
        setShowNewsTicker(isVisible);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
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
            {/* Full-Width Animated Pre-Headline - Improved spacing with fade-out */}
            <div className="mb-8 relative h-56 overflow-visible w-full -mt-8 animated-text-fadeout">
              <div className="absolute inset-0 flex items-center">
                <div className="relative w-full">
                  {/* Animated words that cycle through - all positioned at the same top level */}
                  <div className="absolute left-0 top-0">
                    <span className="absolute top-0 left-0 text-4xl sm:text-5xl lg:text-7xl xl:text-8xl font-bold text-white animated-word reputation uppercase">
                      REPUTATION
                    </span>
                    <div className="absolute top-0 left-0 text-4xl sm:text-5xl lg:text-7xl xl:text-8xl font-bold text-white animated-word financial-risk uppercase flex flex-col leading-tight">
                      <span className="financial-risk-word">FINANCIAL</span>
                      <span className="financial-risk-word">RISK</span>
                    </div>
                    <div className="absolute top-0 left-0 text-4xl sm:text-5xl lg:text-7xl xl:text-8xl font-bold text-white animated-word customer-trust uppercase flex flex-col leading-tight">
                      <span className="customer-trust-word">CUSTOMER</span>
                      <span className="customer-trust-word">TRUST</span>
                    </div>
                  </div>
                  
                  {/* Static "is on the line." text positioned on the right - italic styling */}
                  <div className="absolute right-0 top-0">
                    <span className="text-4xl sm:text-5xl lg:text-7xl xl:text-8xl font-bold text-white static-text italic">
                      is on the line.
                    </span>
                  </div>
                  
                  {/* Full-width tagline that appears after animation sequence */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <p className="text-2xl sm:text-3xl lg:text-5xl xl:text-6xl italic text-gray-300 final-tagline text-center leading-relaxed">
                      And you're still trusting your AI… just because it sounds smart?
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col lg:flex-row items-center justify-between gap-12 h-full cta-rise-up">
              
              {/* Left-aligned Content */}
              <div className="lg:w-1/2 text-left">
                {/* Main Headline */}
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
                  <span className="text-white">Govern, Monitor,</span><br />
                  <span className="text-white">and </span>
                  <span className="bg-gradient-to-r from-green-400 to-blue-500 bg-clip-text text-transparent animate-pulse trust-glow-text">Trust</span>
                  <span className="text-white"> your AI</span>
                </h1>

                {/* Subtitle */}
                <p className="text-xl mb-8 text-gray-200 max-w-2xl">
                  Promethios wraps any LLM or agent with real-time policy enforcement, 
                  trust scoring, and hallucination prevention — no retraining required.
                </p>

                {/* CTA Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 mb-8">
                  <Link 
                    to="/demo" 
                    className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold py-4 px-8 rounded-lg transition-all duration-200 transform hover:scale-105 shadow-lg btn-ripple"
                  >
                    Try Governance Demo
                  </Link>
                  <Link 
                    to={user ? "/ui/dashboard" : "/ui/onboarding"} 
                    className="bg-transparent border-2 border-blue-500 hover:bg-blue-500 text-blue-400 hover:text-white font-bold py-4 px-8 rounded-lg transition-all duration-200 btn-blue-glow"
                  >
                    {user ? "Go to Dashboard" : "Wrap an Agent"}
                  </Link>
                </div>

                {/* Trust Indicators */}
                <div className="flex items-center space-x-6 text-sm text-gray-300">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    <span>Framework agnostic</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                    <span>Prevents hallucinations</span>
                  </div>
                </div>
              </div>

              {/* Right-aligned Trust Score Box */}
              <div className="lg:w-1/2 flex justify-end">
                <div className="relative dashboard-float">
                  {/* Enhanced Pulsing Glow Effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-green-500/30 to-blue-500/30 rounded-xl blur-xl animate-pulse dashboard-glow"></div>
                  
                  {/* Trust Score Container with Hover Effects */}
                  <div className="relative bg-gray-800/90 backdrop-blur-sm border border-gray-600/50 rounded-xl p-6 shadow-2xl pulse-glow hover:shadow-3xl hover:border-green-500/50 transition-all duration-300 transform hover:scale-105 dashboard-hover">
                    {/* Dashboard Header */}
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center space-x-3">
                        <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                        <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      </div>
                      <span className="text-gray-300 text-sm">AI Governance Dashboard</span>
                    </div>

                    {/* Rotating Trust Metrics with Enhanced Animations */}
                    <div className="mb-6 relative h-16">
                      <div className="absolute inset-0 flex items-center justify-between">
                        <span className="text-white font-semibold">Trust Score</span>
                        <div className="relative pr-2">
                          <span className="text-2xl font-bold text-green-400 rotating-metric absolute right-0 metric-fade-in">85%</span>
                          <span className="text-2xl font-bold text-blue-400 rotating-metric absolute opacity-0 right-0 metric-fade-in">243</span>
                          <span className="text-2xl font-bold text-purple-400 rotating-metric absolute opacity-0 right-0 metric-fade-in">1.2M</span>
                        </div>
                      </div>
                      <div className="absolute inset-0 flex items-center justify-between opacity-0 rotating-metric metric-fade-in" style={{animationDelay: '4s'}}>
                        <span className="text-white font-semibold">Violations Prevented</span>
                        <span className="text-2xl font-bold text-blue-400 pr-2">243</span>
                      </div>
                      <div className="absolute inset-0 flex items-center justify-between opacity-0 rotating-metric metric-fade-in" style={{animationDelay: '8s'}}>
                        <span className="text-white font-semibold">Governed Responses</span>
                        <span className="text-2xl font-bold text-purple-400 pr-2">1.2M</span>
                      </div>
                    </div>

                    {/* Animated Trust Score Bar */}
                    <div className="mb-6">
                      <div className="w-full bg-gray-700 rounded-full h-3">
                        <div className="bg-gradient-to-r from-green-400 to-green-500 h-3 rounded-full trust-bar-animated"></div>
                      </div>
                    </div>

                    {/* Status Indicators */}
                    <div className="space-y-3 mb-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                          <span className="text-gray-300 text-sm">Vigil: Monitoring active</span>
                        </div>
                        <span className="text-green-400 text-sm">✓</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                          <span className="text-gray-300 text-sm">PRISM: Transparency enabled</span>
                        </div>
                        <span className="text-blue-400 text-sm">✓</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                          <span className="text-gray-300 text-sm">Veritas: Fact-checking active</span>
                        </div>
                        <span className="text-purple-400 text-sm">✓</span>
                      </div>
                    </div>

                    {/* Recent Activity */}
                    <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-4">
                      <div className="flex items-center space-x-2 mb-2">
                        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                        <span className="text-green-300 font-semibold text-sm">Hallucination prevented</span>
                      </div>
                      <p className="text-gray-300 text-xs">
                        Blocked fabricated legal case "Johnson v. Smith" - redirected to verified sources
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* What Promethios Does Section - Light Variant */}
      <section id="risk-surface-section" className="w-full py-20 px-4 sm:px-6 lg:px-8 bg-slate-800 relative">
        {/* Subtle background pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}></div>
        </div>
        
        <div className="w-full px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-6 text-white">
              Your AI Is a <span className="text-red-400">Risk Surface</span>. That's Why Enterprises Are Locking It Down.
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
              Don't let your AI become your next liability. Auditors won't accept "It was the model's fault."
              Trust is earned. Promethios proves it.
            </p>
            {/* Horizontal divider */}
            <div className="w-24 h-1 bg-gradient-to-r from-green-400 to-blue-500 mx-auto mt-8"></div>
          </div>

          {/* Problem/Solution Toggle */}
          <div className="flex justify-center mb-12">
            <div className="bg-gray-800/60 backdrop-blur-sm border border-gray-600/50 rounded-xl p-2 flex">
              <button 
                onClick={() => setShowProblem(true)}
                className={`px-6 py-3 rounded-lg font-semibold transition-all duration-300 flex items-center space-x-2 ${
                  showProblem 
                    ? 'bg-red-600/30 text-red-400 border border-red-500/50' 
                    : 'bg-red-600/10 text-red-400/60 border border-red-500/20 hover:bg-red-600/20'
                }`}
              >
                <span>🚨</span>
                <span>The Problem</span>
              </button>
              <button 
                onClick={() => setShowProblem(false)}
                className={`px-6 py-3 rounded-lg font-semibold transition-all duration-300 flex items-center space-x-2 ${
                  !showProblem 
                    ? 'bg-green-600/30 text-green-400 border border-green-500/50' 
                    : 'bg-green-600/10 text-green-400/60 border border-green-500/20 hover:bg-green-600/20'
                }`}
              >
                <span>🛡️</span>
                <span>The Promethios Layer</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 w-full">
            {/* Card 1: Customer Risk - Red */}
            <div className="bg-gray-700/50 backdrop-blur-sm p-10 rounded-xl border border-red-500/30 hover:border-red-400 hover:bg-gray-700/70 transition-all duration-300 group">
              <h3 className="text-2xl font-bold mb-6 text-red-400">Your AI just lied to a customer. Now what?</h3>
              
              {/* Micro Dashboard */}
              <div className={`bg-gray-900/80 border rounded-lg p-5 mb-6 font-mono text-base ${
                showProblem ? 'border-red-500/50' : 'border-red-500/30'
              }`}>
                <div className="flex items-center justify-between mb-3">
                  <span className={`font-semibold text-sm ${showProblem ? 'text-red-500' : 'text-red-400'}`}>
                    {showProblem ? '💥 UNGOVERNED' : '🚨 HALLUCINATION ALERT'}
                  </span>
                  <span className="text-gray-400 text-sm">Live</span>
                </div>
                <div className="space-y-2 text-sm">
                  {showProblem ? (
                    // Problem View
                    <>
                      <div className="text-red-400">❌ AI generated fake legal case</div>
                      <div className="text-gray-300">Case: Johnson v. Smith (FABRICATED)</div>
                      <div className="text-red-400">❌ No audit trail available</div>
                      <div className="flex items-center mt-3">
                        <span className="text-gray-400 mr-2">Trust Score:</span>
                        <div className="bg-gray-800 rounded-full h-2 flex-1 mr-2">
                          <div className="bg-gray-600 h-2 rounded-full" style={{width: '0%'}}></div>
                        </div>
                        <span className="text-gray-500 font-bold">???</span>
                      </div>
                    </>
                  ) : (
                    // Solution View
                    <>
                      <div className="text-red-300">⚠️ Hallucination detected</div>
                      <div className="text-gray-300">Fabricated case: Johnson v. Smith</div>
                      <div className="text-green-400">✓ Blocked & redirected to verified sources</div>
                      <div className="flex items-center mt-3">
                        <span className="text-gray-400 mr-2">Trust Score:</span>
                        <div className="bg-gray-800 rounded-full h-2 flex-1 mr-2">
                          <div className="bg-red-500 h-2 rounded-full" style={{width: '23%'}}></div>
                        </div>
                        <span className="text-red-400 font-bold">23%</span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              <p className="text-gray-300 leading-relaxed mb-6 text-lg">
                When your AI hallucinates in production, you need immediate detection, transparent logs, and verified alternatives.
              </p>
              <div className="text-base text-green-400 font-semibold">
                → Agent Integrity Reports + Real-Time Monitoring
              </div>
            </div>

            {/* Card 2: Legal/Compliance Risk - Orange */}
            <div className="bg-gray-700/50 backdrop-blur-sm p-10 rounded-xl border border-orange-500/30 hover:border-orange-400 hover:bg-gray-700/70 transition-all duration-300 group">
              <h3 className="text-2xl font-bold mb-6 text-orange-400">You're regulated. Your AI isn't.</h3>
              
              {/* Micro Dashboard */}
              <div className={`bg-gray-900/80 border rounded-lg p-5 mb-6 font-mono text-base ${
                showProblem ? 'border-orange-500/50' : 'border-orange-500/30'
              }`}>
                <div className="flex items-center justify-between mb-3">
                  <span className={`font-semibold text-sm ${showProblem ? 'text-orange-500' : 'text-orange-400'}`}>
                    {showProblem ? '💥 UNGOVERNED' : '📋 COMPLIANCE MONITOR'}
                  </span>
                  <span className="text-gray-400 text-sm">Live</span>
                </div>
                <div className="space-y-2 text-sm">
                  {showProblem ? (
                    // Problem View
                    <>
                      <div className="flex justify-between">
                        <span className="text-gray-300">GDPR:</span>
                        <span className="text-red-400">❌ Bypassed</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-300">HIPAA:</span>
                        <span className="text-red-400">❌ Ignored</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-300">SOC2:</span>
                        <span className="text-red-400">❌ Violated</span>
                      </div>
                      <div className="text-red-400 mt-3">❌ No compliance framework</div>
                      <div className="text-gray-300">PII Exposed: Untracked</div>
                    </>
                  ) : (
                    // Solution View
                    <>
                      <div className="flex justify-between">
                        <span className="text-gray-300">GDPR:</span>
                        <span className="text-green-400">✓ Active</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-300">HIPAA:</span>
                        <span className="text-green-400">✓ Active</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-300">SOC2:</span>
                        <span className="text-green-400">✓ Active</span>
                      </div>
                      <div className="text-green-400 mt-3">✓ GDPR violation prevented</div>
                      <div className="text-gray-300">PII Redacted: 47 instances</div>
                    </>
                  )}
                </div>
              </div>

              <p className="text-gray-300 leading-relaxed mb-6 text-lg">
                GDPR, HIPAA, SOC2 compliance isn't optional. Your AI needs governance wrapping that auditors will accept.
              </p>
              <div className="text-base text-green-400 font-semibold">
                → Governance Wrapping + Policy Enforcement
              </div>
            </div>

            {/* Card 3: Leadership/Board Risk - Purple */}
            <div className="bg-gray-700/50 backdrop-blur-sm p-10 rounded-xl border border-purple-500/30 hover:border-purple-400 hover:bg-gray-700/70 transition-all duration-300 group">
              <h3 className="text-2xl font-bold mb-6 text-purple-400">Board wants to know if AI is safe to scale.</h3>
              
              {/* Micro Dashboard */}
              <div className={`bg-gray-900/80 border rounded-lg p-5 mb-6 font-mono text-base ${
                showProblem ? 'border-purple-500/50' : 'border-purple-500/30'
              }`}>
                <div className="flex items-center justify-between mb-3">
                  <span className={`font-semibold text-sm ${showProblem ? 'text-purple-500' : 'text-purple-400'}`}>
                    {showProblem ? '💥 UNGOVERNED' : '📊 TRUST ANALYTICS'}
                  </span>
                  <span className="text-gray-400 text-sm">Live</span>
                </div>
                <div className="space-y-2 text-sm">
                  {showProblem ? (
                    // Problem View
                    <>
                      <div className="flex items-center">
                        <span className="text-gray-400 mr-2">Trust Score:</span>
                        <div className="bg-gray-800 rounded-full h-2 flex-1 mr-2">
                          <div className="bg-gray-600 h-2 rounded-full" style={{width: '0%'}}></div>
                        </div>
                        <span className="text-gray-500 font-bold">???</span>
                      </div>
                      <div className="text-gray-300">Governed: ??? vs Ungoverned: ???</div>
                      <div className="text-red-400">ROI: Unknown</div>
                      <div className="text-red-400">❌ No business case</div>
                    </>
                  ) : (
                    // Solution View
                    <>
                      <div className="flex items-center">
                        <span className="text-gray-400 mr-2">Trust Score:</span>
                        <div className="bg-gray-800 rounded-full h-2 flex-1 mr-2">
                          <div className="bg-gradient-to-r from-purple-500 to-blue-500 h-2 rounded-full" style={{width: '91%'}}></div>
                        </div>
                        <span className="text-purple-400 font-bold">91%</span>
                      </div>
                      <div className="text-gray-300">Governed: 91% vs Ungoverned: 34%</div>
                      <div className="text-green-400">ROI: +247%</div>
                      <div className="text-green-400">✓ Board-ready metrics</div>
                    </>
                  )}
                </div>
              </div>

              <p className="text-gray-300 leading-relaxed mb-6 text-lg">
                Executive decisions need quantified trust metrics, not promises. Show ROI and risk reduction with data.
              </p>
              <div className="text-base text-green-400 font-semibold">
                → Trust Score Engine + Benchmark Insights
              </div>
            </div>

            {/* Card 4: Systemic Risk - Cyan */}
            <div className="bg-gray-700/50 backdrop-blur-sm p-10 rounded-xl border border-cyan-500/30 hover:border-cyan-400 hover:bg-gray-700/70 transition-all duration-300 group">
              <h3 className="text-2xl font-bold mb-6 text-cyan-400">Multi-agent chaos is coming.</h3>
              
              {/* Micro Dashboard */}
              <div className={`bg-gray-900/80 border rounded-lg p-5 mb-6 font-mono text-base ${
                showProblem ? 'border-cyan-500/50' : 'border-cyan-500/30'
              }`}>
                <div className="flex items-center justify-between mb-3">
                  <span className={`font-semibold text-sm ${showProblem ? 'text-cyan-500' : 'text-cyan-400'}`}>
                    {showProblem ? '💥 UNGOVERNED' : '🤖 AGENT COORDINATION'}
                  </span>
                  <span className="text-gray-400 text-sm">Live</span>
                </div>
                <div className="space-y-2 text-sm">
                  {showProblem ? (
                    // Problem View
                    <>
                      <div className="flex justify-between">
                        <span className="text-gray-300">Active Agents:</span>
                        <span className="text-cyan-400">12</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-300">Conflicts:</span>
                        <span className="text-red-400">847</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-300">Coordination:</span>
                        <span className="text-red-400">Failed</span>
                      </div>
                      <div className="text-red-400 mt-3">Workflow Efficiency: 23%</div>
                    </>
                  ) : (
                    // Solution View
                    <>
                      <div className="flex justify-between">
                        <span className="text-gray-300">Active Agents:</span>
                        <span className="text-cyan-400">12</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-300">Coordinated Tasks:</span>
                        <span className="text-green-400">847</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-300">Conflicts Resolved:</span>
                        <span className="text-green-400">23</span>
                      </div>
                      <div className="text-green-400 mt-3">Workflow Efficiency: 94%</div>
                    </>
                  )}
                </div>
              </div>

              <p className="text-gray-300 leading-relaxed mb-6 text-lg">
                When agents coordinate without governance, conflicts multiply. You need unified oversight before it's too late.
              </p>
              <div className="text-base text-green-400 font-semibold">
                → Multi-Agent Coordination + Unified Governance
              </div>
            </div>
          </div>

          {/* Enterprise Reality Check */}
          <div className="text-center mt-16 mb-12">
            <div className="bg-gray-800/40 backdrop-blur-sm border border-gray-600/50 rounded-xl p-8 max-w-4xl mx-auto">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
                <div className="border-r border-gray-600/50 last:border-r-0 pr-6 last:pr-0">
                  <p className="text-xl font-bold text-red-400 mb-2">"Don't let your AI become your next liability."</p>
                </div>
                <div className="border-r border-gray-600/50 last:border-r-0 pr-6 last:pr-0">
                  <p className="text-xl font-bold text-orange-400 mb-2">"Auditors won't accept 'It was the model's fault.'"</p>
                </div>
                <div>
                  <p className="text-xl font-bold text-green-400 mb-2">"Trust is earned. Promethios proves it."</p>
                </div>
              </div>
            </div>
          </div>

          <div className="text-center mt-12">
            <Link 
              to="/features" 
              className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-bold rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
            >
              Fix the part of AI no one wants to admit is broken
              <svg className="w-5 h-5 ml-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* Trust in Action Section - Minimalist Split */}
      <section className="w-full py-24 px-4 sm:px-6 lg:px-8 bg-white relative overflow-hidden">
        {/* Subtle geometric background */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 0h100v100H0z' fill='none'/%3E%3Cpath d='M0 0l100 100M100 0L0 100' stroke='%23000' stroke-width='0.5' opacity='0.1'/%3E%3C/svg%3E")`,
          }}></div>
        </div>
        
        <div className="max-w-screen-xl mx-auto relative">
          <div className="text-center mb-20">
            <h2 className="text-5xl font-bold mb-6 text-gray-900">
              Trust in <span className="bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">Action</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Real-time analytics and proof of success from our governance platform.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
            {/* Average Trust Score */}
            <div className="text-center group">
              <div className="relative">
                <div className="text-7xl font-black text-green-600 mb-4 group-hover:scale-110 transition-transform duration-300">
                  85
                  <span className="text-3xl text-green-500">%</span>
                </div>
                <div className="absolute -top-2 -right-2 w-4 h-4 bg-green-400 rounded-full animate-pulse"></div>
              </div>
              <div className="text-lg font-semibold text-gray-700 mb-2">Average Trust Score</div>
              <div className="text-sm text-gray-500">Across all governed agents</div>
            </div>

            {/* Violations Prevented */}
            <div className="text-center group">
              <div className="relative">
                <div className="text-7xl font-black text-red-600 mb-4 group-hover:scale-110 transition-transform duration-300">
                  243
                </div>
                <div className="absolute -top-2 -right-2 w-4 h-4 bg-red-400 rounded-full animate-pulse"></div>
              </div>
              <div className="text-lg font-semibold text-gray-700 mb-2">Violations Prevented</div>
              <div className="text-sm text-gray-500">This month alone</div>
            </div>

            {/* Governed Responses */}
            <div className="text-center group">
              <div className="relative">
                <div className="text-7xl font-black text-blue-600 mb-4 group-hover:scale-110 transition-transform duration-300">
                  1.2
                  <span className="text-3xl text-blue-500">M</span>
                </div>
                <div className="absolute -top-2 -right-2 w-4 h-4 bg-blue-400 rounded-full animate-pulse"></div>
              </div>
              <div className="text-lg font-semibold text-gray-700 mb-2">Governed Responses</div>
              <div className="text-sm text-gray-500">Successfully processed</div>
            </div>

            {/* SOC2 Compliance */}
            <div className="text-center group">
              <div className="relative">
                <div className="text-7xl font-black text-purple-600 mb-4 group-hover:scale-110 transition-transform duration-300">
                  92
                  <span className="text-3xl text-purple-500">%</span>
                </div>
                <div className="absolute -top-2 -right-2 w-4 h-4 bg-purple-400 rounded-full animate-pulse"></div>
              </div>
              <div className="text-lg font-semibold text-gray-700 mb-2">SOC2 Compliance</div>
              <div className="text-sm text-gray-500">Enterprise ready</div>
            </div>
          </div>

          {/* Bottom accent line */}
          <div className="mt-20 flex justify-center">
            <div className="w-32 h-1 bg-gradient-to-r from-green-400 via-blue-500 to-purple-500 rounded-full"></div>
          </div>
        </div>
      </section>

      {/* Interactive Demos Section */}
      <InteractiveDemos />

      {/* Promethios Stack Showcase */}
      <PrometheusStackShowcase />

      {/* Template Library Preview */}
      <TemplateLibraryPreview />

      {/* Final CTA Section */}
      <section className="w-full py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-gray-900 to-gray-800">
        <div className="max-w-screen-xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-6 text-white">
            AI should be governed — not left to guess.
          </h2>
          <p className="text-xl mb-8 text-gray-300 max-w-3xl mx-auto">
            Get Promethios and build better AI you can trust.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link 
              to={user ? "/ui/dashboard" : "/ui/onboarding"} 
              className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold py-4 px-8 rounded-lg transition-all duration-200 transform hover:scale-105 shadow-lg"
            >
              {user ? "Go to Dashboard" : "Start Free"}
            </Link>
            <Link 
              to="/demo" 
              className="bg-transparent border-2 border-blue-500 hover:bg-blue-500 text-blue-400 hover:text-white font-bold py-4 px-8 rounded-lg transition-all duration-200"
            >
              Run Demo
            </Link>
            <Link 
              to="/signup" 
              className="bg-transparent border-2 border-gray-600 hover:bg-gray-600 text-gray-300 hover:text-white font-bold py-4 px-8 rounded-lg transition-all duration-200"
            >
              Join Waitlist
            </Link>
          </div>
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

      {/* Flooding News Ticker - AI Disaster Headlines */}
      <FloodingNewsTicker isVisible={showNewsTicker} />

      {/* Enhanced CSS Animations */}
      <style jsx>{`
        /* Trust Glow Text Animation */
        .trust-glow-text {
          text-shadow: 0 0 20px rgba(34, 197, 94, 0.5), 0 0 40px rgba(34, 197, 94, 0.3);
          animation: trustGlow 2s ease-in-out infinite alternate;
        }

        @keyframes trustGlow {
          from {
            text-shadow: 0 0 20px rgba(34, 197, 94, 0.5), 0 0 40px rgba(34, 197, 94, 0.3);
          }
          to {
            text-shadow: 0 0 30px rgba(34, 197, 94, 0.8), 0 0 60px rgba(34, 197, 94, 0.5);
          }
        }

        /* Dashboard Float Animation */
        .dashboard-float {
          animation: dashboardFloat 3s ease-in-out infinite;
        }

        @keyframes dashboardFloat {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-10px);
          }
        }

        /* Enhanced Dashboard Glow */
        .dashboard-glow {
          animation: dashboardGlow 2s ease-in-out infinite alternate;
        }

        @keyframes dashboardGlow {
          from {
            opacity: 0.3;
          }
          to {
            opacity: 0.6;
          }
        }

        /* Trust Bar Loading Animation */
        .trust-bar-animated {
          width: 0%;
          animation: trustBarLoad 2s ease-out forwards;
          animation-delay: 1s;
        }

        @keyframes trustBarLoad {
          from {
            width: 0%;
          }
          to {
            width: 85%;
          }
        }

        /* Metric Fade In Animation */
        .metric-fade-in {
          animation: metricFadeIn 1s ease-in-out;
        }

        @keyframes metricFadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        /* Enhanced Dashboard Hover */
        .dashboard-hover:hover {
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 30px rgba(34, 197, 94, 0.3);
        }

        /* Animated Text Fade Out Sequence */
        .animated-text-fadeout {
          animation: fadeOutUp 1s ease-in-out forwards;
          animation-delay: 8s;
        }

        @keyframes fadeOutUp {
          from {
            opacity: 1;
            transform: translateY(0);
          }
          to {
            opacity: 0;
            transform: translateY(-50px);
          }
        }

        /* CTA Rise Up Animation */
        .cta-rise-up {
          animation: riseUp 1s ease-out forwards;
          animation-delay: 9s;
          transform: translateY(50px);
        }

        @keyframes riseUp {
          from {
            transform: translateY(50px);
            opacity: 0.8;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
};

export default NewLandingPage;
