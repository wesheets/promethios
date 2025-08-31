import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const NewLandingPage: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="w-full">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-black/90 backdrop-blur-sm border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            {/* Logo */}
            <div className="flex items-center">
              <img 
                src="/spark-logo.jpg" 
                alt="Spark" 
                className="h-8 w-auto object-contain"
              />
            </div>

            {/* Navigation */}
            <nav className="hidden md:flex space-x-8">
              <a href="#features" className="text-gray-300 hover:text-white transition-colors">Features</a>
              <a href="#about" className="text-gray-300 hover:text-white transition-colors">About</a>
              <a href="#contact" className="text-gray-300 hover:text-white transition-colors">Contact</a>
            </nav>

            {/* Sign In Button */}
            <div>
              {user ? (
                <Link 
                  to="/dashboard" 
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  Dashboard
                </Link>
              ) : (
                <Link 
                  to="/login" 
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  Sign In
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center pt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="mb-8">
            <img 
              src="/spark-logo.jpg" 
              alt="Spark" 
              className="h-24 w-auto mx-auto mb-6"
            />
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6">
            The Future of AI Collaboration
          </h1>
          
          <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-4xl mx-auto">
            Multi-Agent Chats Where Humans & AI Work Together
          </p>
          
          <p className="text-lg text-gray-400 mb-12 max-w-3xl mx-auto">
            Model Agnostic Platform • Bring Your Own Agents • Full Transparency & Ethical Governance
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              to="/login" 
              className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-4 px-8 rounded-lg transition-all duration-200 transform hover:scale-105"
            >
              Join Spark Beta
            </Link>
            <Link 
              to="/login" 
              className="bg-transparent border-2 border-blue-500 hover:bg-blue-500/20 text-blue-400 hover:text-blue-300 font-bold py-4 px-8 rounded-lg transition-all duration-200"
            >
              Start Collaborating
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">
              Why Spark?
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              The governed multi-agent collaboration platform where humans and AI agents work together with full transparency and ethical oversight.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Multi-Agent Chats */}
            <div className="bg-gray-800 rounded-lg p-6">
              <div className="text-orange-500 text-3xl mb-4">🤖</div>
              <h3 className="text-xl font-bold text-white mb-3">Multi-Agent Chats</h3>
              <p className="text-gray-300">
                Talk to multiple AI agents AND humans simultaneously in the same conversations.
              </p>
            </div>

            {/* Model Agnostic */}
            <div className="bg-gray-800 rounded-lg p-6">
              <div className="text-blue-500 text-3xl mb-4">🔧</div>
              <h3 className="text-xl font-bold text-white mb-3">Model Agnostic</h3>
              <p className="text-gray-300">
                Wrap any LLM (OpenAI, Claude, Gemini) with governance and ethical oversight.
              </p>
            </div>

            {/* Bring Your Own Agents */}
            <div className="bg-gray-800 rounded-lg p-6">
              <div className="text-green-500 text-3xl mb-4">⚡</div>
              <h3 className="text-xl font-bold text-white mb-3">Bring Your Own Agents</h3>
              <p className="text-gray-300">
                Customize existing agents or deploy your own with full integration support.
              </p>
            </div>

            {/* Ethical Governance */}
            <div className="bg-gray-800 rounded-lg p-6">
              <div className="text-purple-500 text-3xl mb-4">🛡️</div>
              <h3 className="text-xl font-bold text-white mb-3">Ethical Governance</h3>
              <p className="text-gray-300">
                Trust metrics, policy enforcement, and comprehensive audit logs for accountability.
              </p>
            </div>

            {/* Full Transparency */}
            <div className="bg-gray-800 rounded-lg p-6">
              <div className="text-yellow-500 text-3xl mb-4">🔍</div>
              <h3 className="text-xl font-bold text-white mb-3">Full Transparency</h3>
              <p className="text-gray-300">
                Cryptographic audit trails you can inspect and verify for complete transparency.
              </p>
            </div>

            {/* Contextual Memory */}
            <div className="bg-gray-800 rounded-lg p-6">
              <div className="text-red-500 text-3xl mb-4">🧠</div>
              <h3 className="text-xl font-bold text-white mb-3">Contextual Memory</h3>
              <p className="text-gray-300">
                Agents remember and learn from interactions, building better collaboration over time.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center mb-4 md:mb-0">
              <img 
                src="/spark-logo.jpg" 
                alt="Spark" 
                className="h-8 w-auto object-contain mr-3"
              />
              <span className="text-gray-400">Powered by Promethios</span>
            </div>
            
            <div className="flex space-x-6">
              <a href="#" className="text-gray-400 hover:text-white transition-colors">Privacy</a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">Terms</a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">Support</a>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-8 pt-8 text-center">
            <p className="text-gray-400">
              © 2025 Spark. The future of AI collaboration is here.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default NewLandingPage;

