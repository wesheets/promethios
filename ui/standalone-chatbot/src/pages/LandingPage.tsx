import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  MessageCircle, 
  Shield, 
  Zap, 
  CheckCircle, 
  Star,
  ArrowRight,
  Play,
  Users,
  TrendingUp,
  Lock
} from 'lucide-react';
import { DemoWidget } from '../components/DemoWidget';

export function LandingPage() {
  const [showDemo, setShowDemo] = useState(false);
  const [stats, setStats] = useState({
    totalChatbots: 1250,
    messagesProcessed: 50000,
    trustScore: 94
  });

  useEffect(() => {
    // Animate stats on load
    const timer = setTimeout(() => {
      setStats({
        totalChatbots: 1250,
        messagesProcessed: 50000,
        trustScore: 94
      });
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Navigation */}
      <nav className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <img 
                  className="h-8 w-auto" 
                  src="/logo-promethios.png" 
                  alt="Promethios" 
                />
              </div>
              <div className="ml-4">
                <h1 className="text-xl font-bold text-white">
                  Promethios <span className="text-indigo-400">Chatbots</span>
                </h1>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <Link 
                to="/login" 
                className="text-gray-300 hover:text-white transition-colors"
              >
                Sign In
              </Link>
              <Link 
                to="/signup" 
                className="btn-primary"
              >
                Start Free Trial
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
              Build <span className="text-gradient">Governed AI</span> Chatbots
            </h1>
            <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto">
              Create transparent, trustworthy AI chatbots with real-time governance. 
              See trust scores, policy compliance, and reasoning for every response.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <button 
                onClick={() => setShowDemo(true)}
                className="btn-primary text-lg px-8 py-3 flex items-center justify-center"
              >
                <Play className="w-5 h-5 mr-2" />
                Try Live Demo
              </button>
              <Link 
                to="/signup" 
                className="btn-outline text-lg px-8 py-3 flex items-center justify-center"
              >
                Start Building
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
            </div>

            {/* Trust Indicators */}
            <div className="flex flex-wrap justify-center gap-8 text-sm text-gray-400">
              <div className="flex items-center">
                <CheckCircle className="w-4 h-4 text-green-400 mr-2" />
                14-day free trial
              </div>
              <div className="flex items-center">
                <Shield className="w-4 h-4 text-blue-400 mr-2" />
                Enterprise-grade governance
              </div>
              <div className="flex items-center">
                <Zap className="w-4 h-4 text-yellow-400 mr-2" />
                5-minute setup
              </div>
            </div>
          </div>
        </div>

        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/20 to-purple-900/20 pointer-events-none" />
      </section>

      {/* Stats Section */}
      <section className="bg-gray-800 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div className="fade-in">
              <div className="text-4xl font-bold text-indigo-400 mb-2">
                {stats.totalChatbots.toLocaleString()}+
              </div>
              <div className="text-gray-300">Chatbots Created</div>
            </div>
            <div className="fade-in">
              <div className="text-4xl font-bold text-green-400 mb-2">
                {stats.messagesProcessed.toLocaleString()}+
              </div>
              <div className="text-gray-300">Messages Governed</div>
            </div>
            <div className="fade-in">
              <div className="text-4xl font-bold text-yellow-400 mb-2">
                {stats.trustScore}%
              </div>
              <div className="text-gray-300">Average Trust Score</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">
              Why Choose Governed AI?
            </h2>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Unlike regular chatbots, every response is verified with real-time trust scoring 
              and policy compliance monitoring.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="card text-center">
              <div className="w-12 h-12 bg-indigo-600 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">
                Real-Time Governance
              </h3>
              <p className="text-gray-300">
                Every response is checked against policies with visible trust scores 
                and compliance status.
              </p>
            </div>

            <div className="card text-center">
              <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">
                Transparent AI
              </h3>
              <p className="text-gray-300">
                See exactly why the AI responded the way it did with detailed 
                reasoning and confidence scores.
              </p>
            </div>

            <div className="card text-center">
              <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">
                Custom APIs Supported
              </h3>
              <p className="text-gray-300">
                Bring your own fine-tuned models and get the same governance 
                capabilities for any AI provider.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="bg-gray-800 py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-xl text-gray-300">
              Start free, scale as you grow
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Free Trial */}
            <div className="card">
              <div className="text-center">
                <h3 className="text-2xl font-bold text-white mb-2">Free Trial</h3>
                <div className="text-4xl font-bold text-indigo-400 mb-4">$0</div>
                <p className="text-gray-300 mb-6">14 days free</p>
                
                <ul className="space-y-3 mb-8">
                  <li className="flex items-center text-gray-300">
                    <CheckCircle className="w-4 h-4 text-green-400 mr-3" />
                    5 chatbots
                  </li>
                  <li className="flex items-center text-gray-300">
                    <CheckCircle className="w-4 h-4 text-green-400 mr-3" />
                    1,000 messages
                  </li>
                  <li className="flex items-center text-gray-300">
                    <CheckCircle className="w-4 h-4 text-green-400 mr-3" />
                    Basic governance
                  </li>
                  <li className="flex items-center text-gray-300">
                    <CheckCircle className="w-4 h-4 text-green-400 mr-3" />
                    "Powered by Promethios"
                  </li>
                </ul>
                
                <Link to="/signup" className="btn-outline w-full">
                  Start Free Trial
                </Link>
              </div>
            </div>

            {/* Pro Plan */}
            <div className="card border-indigo-500 relative">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <span className="bg-indigo-600 text-white px-4 py-1 rounded-full text-sm font-medium">
                  Most Popular
                </span>
              </div>
              
              <div className="text-center">
                <h3 className="text-2xl font-bold text-white mb-2">Pro</h3>
                <div className="text-4xl font-bold text-indigo-400 mb-4">$99</div>
                <p className="text-gray-300 mb-6">per month</p>
                
                <ul className="space-y-3 mb-8">
                  <li className="flex items-center text-gray-300">
                    <CheckCircle className="w-4 h-4 text-green-400 mr-3" />
                    100 chatbots
                  </li>
                  <li className="flex items-center text-gray-300">
                    <CheckCircle className="w-4 h-4 text-green-400 mr-3" />
                    50,000 messages
                  </li>
                  <li className="flex items-center text-gray-300">
                    <CheckCircle className="w-4 h-4 text-green-400 mr-3" />
                    Advanced governance
                  </li>
                  <li className="flex items-center text-gray-300">
                    <CheckCircle className="w-4 h-4 text-green-400 mr-3" />
                    Custom APIs
                  </li>
                  <li className="flex items-center text-gray-300">
                    <CheckCircle className="w-4 h-4 text-green-400 mr-3" />
                    Optional branding
                  </li>
                </ul>
                
                <Link to="/signup" className="btn-primary w-full">
                  Start Pro Trial
                </Link>
              </div>
            </div>

            {/* Enterprise */}
            <div className="card">
              <div className="text-center">
                <h3 className="text-2xl font-bold text-white mb-2">Enterprise</h3>
                <div className="text-4xl font-bold text-indigo-400 mb-4">$299</div>
                <p className="text-gray-300 mb-6">per month</p>
                
                <ul className="space-y-3 mb-8">
                  <li className="flex items-center text-gray-300">
                    <CheckCircle className="w-4 h-4 text-green-400 mr-3" />
                    Unlimited chatbots
                  </li>
                  <li className="flex items-center text-gray-300">
                    <CheckCircle className="w-4 h-4 text-green-400 mr-3" />
                    Unlimited messages
                  </li>
                  <li className="flex items-center text-gray-300">
                    <CheckCircle className="w-4 h-4 text-green-400 mr-3" />
                    Custom policies
                  </li>
                  <li className="flex items-center text-gray-300">
                    <CheckCircle className="w-4 h-4 text-green-400 mr-3" />
                    White-labeling
                  </li>
                  <li className="flex items-center text-gray-300">
                    <CheckCircle className="w-4 h-4 text-green-400 mr-3" />
                    Priority support
                  </li>
                </ul>
                
                <Link to="/signup" className="btn-outline w-full">
                  Contact Sales
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-white mb-6">
            Ready to Build Trustworthy AI?
          </h2>
          <p className="text-xl text-gray-300 mb-8">
            Join thousands of developers building the future of transparent AI
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button 
              onClick={() => setShowDemo(true)}
              className="btn-outline text-lg px-8 py-3"
            >
              Try Demo First
            </button>
            <Link 
              to="/signup" 
              className="btn-primary text-lg px-8 py-3"
            >
              Start Free Trial
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-800 border-t border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-white font-semibold mb-4">Promethios Chatbots</h3>
              <p className="text-gray-400 text-sm">
                Governed AI chatbots with real-time transparency and trust scoring.
              </p>
            </div>
            
            <div>
              <h4 className="text-white font-medium mb-4">Product</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="text-gray-400 hover:text-white">Features</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white">Pricing</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white">Documentation</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-white font-medium mb-4">Company</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="text-gray-400 hover:text-white">About</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white">Blog</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white">Careers</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-white font-medium mb-4">Support</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="text-gray-400 hover:text-white">Help Center</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white">Contact</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white">Status</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-700 mt-8 pt-8 text-center">
            <p className="text-gray-400 text-sm">
              © 2024 Promethios. All rights reserved.
            </p>
          </div>
        </div>
      </footer>

      {/* Demo Widget */}
      {showDemo && (
        <DemoWidget onClose={() => setShowDemo(false)} />
      )}
    </div>
  );
}

