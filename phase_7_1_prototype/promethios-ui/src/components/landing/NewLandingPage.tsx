import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import FloatingObserver from './FloatingObserver';
import InteractiveDemos from './InteractiveDemos';
import TemplateLibraryPreview from './TemplateLibraryPreview';
import PrometheusStackShowcase from './PrometheusStackShowcase';
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
        <div className="relative z-10 h-full flex items-center px-4 sm:px-6 lg:px-8 hero-content">
          <div className="max-w-screen-xl mx-auto w-full">
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
                    className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold py-4 px-8 rounded-lg transition-all duration-200 transform hover:scale-105 shadow-lg"
                  >
                    Try Governance Demo
                  </Link>
                  <Link 
                    to={user ? "/ui/dashboard" : "/ui/onboarding"} 
                    className="bg-transparent border-2 border-blue-500 hover:bg-blue-500 text-blue-400 hover:text-white font-bold py-4 px-8 rounded-lg transition-all duration-200"
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

                    {/* Trust Score */}
                    <div className="mb-6">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-white font-semibold">Trust Score</span>
                        <span className="text-2xl font-bold text-green-400 animate-pulse">85%</span>
                      </div>
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

      {/* What Promethios Does Section - Light Variant */}
      <section className="w-full py-20 px-4 sm:px-6 lg:px-8 bg-slate-800 relative">
        {/* Subtle background pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}></div>
        </div>
        
        <div className="max-w-screen-xl mx-auto relative">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-6 text-white">
              What Promethios Does
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
              The observability and compliance layer for multi-agent AI systems.
              Comprehensive governance that makes AI trustworthy by design.
            </p>
            {/* Horizontal divider */}
            <div className="w-24 h-1 bg-gradient-to-r from-green-400 to-blue-500 mx-auto mt-8"></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Governance Wrapping */}
            <div className="bg-gray-700/50 backdrop-blur-sm p-8 rounded-xl border border-gray-600 hover:border-blue-400 hover:bg-gray-700/70 transition-all duration-300 group">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-200">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-3 text-white group-hover:text-blue-400 transition-colors">🛡️ Governance Wrapping</h3>
              <p className="text-gray-300 leading-relaxed">
                Wrap any agent with zero code. Apply policies like HIPAA, SOC2, GDPR.
              </p>
            </div>

            {/* Trust Score Engine */}
            <div className="bg-gray-700/50 backdrop-blur-sm p-8 rounded-xl border border-gray-600 hover:border-green-400 hover:bg-gray-700/70 transition-all duration-300 group">
              <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-green-600 rounded-lg flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-200">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-3 text-white group-hover:text-green-400 transition-colors">📊 Trust Score Engine</h3>
              <p className="text-gray-300 leading-relaxed">
                Dynamic trust ratings with attestation, boundary, and reliability scores.
              </p>
            </div>

            {/* Agent Integrity Reports */}
            <div className="bg-gray-700/50 backdrop-blur-sm p-8 rounded-xl border border-gray-600 hover:border-purple-400 hover:bg-gray-700/70 transition-all duration-300 group">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-200">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-3 text-white group-hover:text-purple-400 transition-colors">🧠 Agent Integrity Reports</h3>
              <p className="text-gray-300 leading-relaxed">
                Prevent hallucinations in real-time. Show users when AI goes off track.
              </p>
            </div>

            {/* Multi-Agent Collaboration */}
            <div className="bg-gray-700/50 backdrop-blur-sm p-8 rounded-xl border border-gray-600 hover:border-orange-400 hover:bg-gray-700/70 transition-all duration-300 group">
              <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-200">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-3 text-white">🤖 Multi-Agent Collaboration</h3>
              <p className="text-gray-300">
                Govern single or multi-agent systems with coordination and compliance.
              </p>
            </div>

            {/* Real-Time Monitoring */}
            <div className="bg-gray-800 p-8 rounded-xl border border-gray-700 hover:border-red-500 transition-all duration-200">
              <div className="w-12 h-12 bg-gradient-to-r from-red-500 to-red-600 rounded-lg flex items-center justify-center mb-6">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-3 text-white">🔄 Real-Time Monitoring</h3>
              <p className="text-gray-300">
                Alerts, logs, and risk metrics streamed to a live dashboard.
              </p>
            </div>

            {/* Benchmark Insights */}
            <div className="bg-gray-800 p-8 rounded-xl border border-gray-700 hover:border-cyan-500 transition-all duration-200">
              <div className="w-12 h-12 bg-gradient-to-r from-cyan-500 to-cyan-600 rounded-lg flex items-center justify-center mb-6">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-3 text-white">📈 Benchmark Insights</h3>
              <p className="text-gray-300">
                Compare agent performance in governed vs ungoverned scenarios.
              </p>
            </div>
          </div>

          <div className="text-center mt-12">
            <Link 
              to="/features" 
              className="inline-flex items-center px-6 py-3 border border-gray-600 text-gray-300 hover:text-white hover:border-gray-400 rounded-lg transition-colors"
            >
              See Full Feature List
              <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
    </div>
  );
};

export default NewLandingPage;
