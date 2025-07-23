import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import FloatingObserver from './FloatingObserver';
import InteractiveDemos from './InteractiveDemos';
import TemplateLibraryPreview from './TemplateLibraryPreview';
import PrometheusStackShowcase from './PrometheusStackShowcase';
import TimedObserverBubble from './TimedObserverBubble';
import '../../styles/hero-animations.css';

const NewLandingPage: React.FC = () => {
  const { user } = useAuth();
  const { isDarkMode } = useTheme();

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
            {/* Full-Width Animated Pre-Headline - Ultra-tight spacing */}
            <div className="mb-8 relative h-56 overflow-visible w-full -mt-20">
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
            
            <div className="flex flex-col lg:flex-row items-center justify-between gap-12 h-full">
              
              {/* Left-aligned Content */}
              <div className="lg:w-1/2 text-left">
                {/* Main Headline */}
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
                  <span className="text-white">Govern, Monitor,</span><br />
                  <span className="text-white">and </span>
                  <span className="bg-gradient-to-r from-green-400 to-blue-500 bg-clip-text text-transparent animate-pulse glow-text">Trust</span>
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
                <div className="relative">
                  {/* Pulsing Glow Effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-green-500/30 to-blue-500/30 rounded-xl blur-xl animate-pulse"></div>
                  
                  {/* Trust Score Container */}
                  <div className="relative bg-gray-800/90 backdrop-blur-sm border border-gray-600/50 rounded-xl p-6 shadow-2xl pulse-glow">
                    {/* Dashboard Header */}
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center space-x-3">
                        <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                        <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      </div>
                      <span className="text-gray-300 text-sm">AI Governance Dashboard</span>
                    </div>

                    {/* Rotating Trust Metrics */}
                    <div className="mb-6 relative h-16">
                      <div className="absolute inset-0 flex items-center justify-between">
                        <span className="text-white font-semibold">Trust Score</span>
                        <div className="relative pr-2">
                          <span className="text-2xl font-bold text-green-400 rotating-metric absolute right-0">85%</span>
                          <span className="text-2xl font-bold text-blue-400 rotating-metric absolute opacity-0 right-0">243</span>
                          <span className="text-2xl font-bold text-purple-400 rotating-metric absolute opacity-0 right-0">1.2M</span>
                        </div>
                      </div>
                      <div className="absolute inset-0 flex items-center justify-between opacity-0 rotating-metric" style={{animationDelay: '4s'}}>
                        <span className="text-white font-semibold">Violations Prevented</span>
                        <span className="text-2xl font-bold text-blue-400 pr-2">243</span>
                      </div>
                      <div className="absolute inset-0 flex items-center justify-between opacity-0 rotating-metric" style={{animationDelay: '8s'}}>
                        <span className="text-white font-semibold">Governed Responses</span>
                        <span className="text-2xl font-bold text-purple-400 pr-2">1.2M</span>
                      </div>
                    </div>

                    {/* Trust Score Bar */}
                    <div className="mb-6">
                      <div className="w-full bg-gray-700 rounded-full h-3">
                        <div className="bg-gradient-to-r from-green-400 to-green-500 h-3 rounded-full trust-bar" style={{width: '85%'}}></div>
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

      {/* Why Enterprises Are Locking Down Their AI Section - Pain-Killer Approach */}
      <section className="w-full py-20 px-4 sm:px-6 lg:px-8 bg-slate-900 relative overflow-hidden">
        {/* Tech Grid Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' stroke='%23ffffff' stroke-width='0.5'%3E%3Cpath d='M0 0h100v100H0z'/%3E%3Cpath d='M20 0v100M40 0v100M60 0v100M80 0v100M0 20h100M0 40h100M0 60h100M0 80h100'/%3E%3C/g%3E%3C/svg%3E")`,
          }}></div>
        </div>
        
        {/* Floating Tech Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 left-10 w-2 h-2 bg-red-500 rounded-full animate-pulse opacity-60"></div>
          <div className="absolute top-40 right-20 w-1 h-1 bg-blue-400 rounded-full animate-ping opacity-40"></div>
          <div className="absolute bottom-32 left-1/4 w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse opacity-50"></div>
          <div className="absolute bottom-20 right-1/3 w-1 h-1 bg-purple-400 rounded-full animate-ping opacity-30"></div>
        </div>
        
        <div className="max-w-screen-xl mx-auto relative">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold mb-6 text-white">
              Why Enterprises Are <span className="text-red-400">Locking Down</span> Their AI
            </h2>
            <p className="text-xl text-gray-300 max-w-4xl mx-auto leading-relaxed">
              You're not managing models. You're protecting trust, reputation, and risk.
            </p>
            {/* Horizontal divider with warning colors */}
            <div className="w-32 h-1 bg-gradient-to-r from-red-500 via-orange-500 to-yellow-500 mx-auto mt-8"></div>
          </div>

          {/* Pain-Killer Approach Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16">
            
            {/* Your AI just lied to a customer */}
            <div className="bg-gray-800/60 backdrop-blur-sm p-8 rounded-xl border border-red-500/30 hover:border-red-400 hover:bg-gray-800/80 transition-all duration-300 group">
              <div className="flex items-start space-x-4 mb-6">
                <div className="w-12 h-12 bg-gradient-to-r from-red-500 to-red-600 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold mb-3 text-red-400 group-hover:text-red-300 transition-colors">
                    Your AI just lied to a customer. Now what?
                  </h3>
                  <p className="text-gray-300 leading-relaxed mb-4">
                    Without governance, you're flying blind. No audit trail, no accountability, no way to prove what went wrong.
                  </p>
                  <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                      <span className="text-green-300 font-semibold text-sm">Promethios Solution</span>
                    </div>
                    <p className="text-gray-300 text-sm">
                      <strong>Agent Integrity Reports</strong> + <strong>Real-Time Monitoring</strong><br/>
                      Instant alerts, full audit trails, and automatic hallucination prevention.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* You're regulated. Your AI isn't. */}
            <div className="bg-gray-800/60 backdrop-blur-sm p-8 rounded-xl border border-orange-500/30 hover:border-orange-400 hover:bg-gray-800/80 transition-all duration-300 group">
              <div className="flex items-start space-x-4 mb-6">
                <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold mb-3 text-orange-400 group-hover:text-orange-300 transition-colors">
                    You're regulated. Your AI isn't.
                  </h3>
                  <p className="text-gray-300 leading-relaxed mb-4">
                    HIPAA, SOC2, GDPR compliance means nothing if your AI agents can bypass every control you've built.
                  </p>
                  <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                      <span className="text-blue-300 font-semibold text-sm">Promethios Solution</span>
                    </div>
                    <p className="text-gray-300 text-sm">
                      <strong>Governance Wrapping</strong> + <strong>Policy Enforcement</strong><br/>
                      Zero-code compliance wrapping for any agent. HIPAA, SOC2, GDPR built-in.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Board wants to know if AI is safe to scale */}
            <div className="bg-gray-800/60 backdrop-blur-sm p-8 rounded-xl border border-purple-500/30 hover:border-purple-400 hover:bg-gray-800/80 transition-all duration-300 group">
              <div className="flex items-start space-x-4 mb-6">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold mb-3 text-purple-400 group-hover:text-purple-300 transition-colors">
                    Board wants to know if AI is safe to scale.
                  </h3>
                  <p className="text-gray-300 leading-relaxed mb-4">
                    "Trust me, it works" isn't a business case. You need metrics, benchmarks, and proof of governance.
                  </p>
                  <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                      <span className="text-green-300 font-semibold text-sm">Promethios Solution</span>
                    </div>
                    <p className="text-gray-300 text-sm">
                      <strong>Trust Score Engine</strong> + <strong>Benchmark Insights</strong><br/>
                      Quantified trust metrics and governed vs. ungoverned performance data.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Multi-agent chaos is coming */}
            <div className="bg-gray-800/60 backdrop-blur-sm p-8 rounded-xl border border-cyan-500/30 hover:border-cyan-400 hover:bg-gray-800/80 transition-all duration-300 group">
              <div className="flex items-start space-x-4 mb-6">
                <div className="w-12 h-12 bg-gradient-to-r from-cyan-500 to-cyan-600 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold mb-3 text-cyan-400 group-hover:text-cyan-300 transition-colors">
                    Multi-agent chaos is coming.
                  </h3>
                  <p className="text-gray-300 leading-relaxed mb-4">
                    One agent is hard enough to govern. What happens when you have dozens working together?
                  </p>
                  <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                      <span className="text-blue-300 font-semibold text-sm">Promethios Solution</span>
                    </div>
                    <p className="text-gray-300 text-sm">
                      <strong>Multi-Agent Coordination</strong> + <strong>Unified Governance</strong><br/>
                      Single pane of glass for governing complex multi-agent workflows.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Enterprise Reality Check */}
          <div className="text-center mb-12">
            <div className="bg-gray-800/40 backdrop-blur-sm border border-gray-600/50 rounded-xl p-8 max-w-4xl mx-auto">
              <h3 className="text-2xl font-bold mb-4 text-white">The Enterprise Reality</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
                <div>
                  <p className="text-red-400 font-bold text-lg mb-2">"Don't let your AI become your next liability."</p>
                </div>
                <div>
                  <p className="text-orange-400 font-bold text-lg mb-2">"Auditors won't accept 'It was the model's fault.'"</p>
                </div>
                <div>
                  <p className="text-green-400 font-bold text-lg mb-2">"Trust is earned. Promethios proves it."</p>
                </div>
              </div>
            </div>
          </div>

          <div className="text-center">
            <Link 
              to="/features" 
              className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              See How Promethios Solves This
              <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
    </div>
  );
};

export default NewLandingPage;
