import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import PrometheosGovernanceDashboard from '../components/governance-demo/PrometheosGovernanceDashboard';

const LiveDemoPage: React.FC = () => {
  const [showFullDemo, setShowFullDemo] = useState(false);

  if (showFullDemo) {
    return <PrometheosGovernanceDashboard />;
  }

  return (
    <div className="w-full bg-gray-900 text-white min-h-screen">
      {/* Hero Section */}
      <section className="w-full py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='4'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}></div>
        </div>

        <div className="max-w-screen-xl mx-auto relative text-center">
          <div className="inline-flex items-center space-x-2 bg-blue-900/20 border border-blue-500/30 rounded-full px-4 py-2 mb-6">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
            <span className="text-blue-400 text-sm font-semibold">Live Interactive Demo</span>
          </div>
          
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
            See <span className="bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">AI Governance</span> in Action
          </h1>
          
          <p className="text-xl sm:text-2xl mb-12 text-gray-300 max-w-4xl mx-auto leading-relaxed">
            Experience how Promethios prevents violations, enforces policies, and builds trust in real-time. 
            Choose from healthcare, legal, financial, and other scenarios to see enterprise-grade governance at work.
          </p>

          {/* Demo Preview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6"
            >
              <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-green-600 rounded-xl flex items-center justify-center text-3xl mb-4 mx-auto">
                🏥
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Healthcare Compliance</h3>
              <p className="text-gray-300 text-sm mb-4">See HIPAA compliance and medical ethics enforcement in action</p>
              <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-3">
                <div className="text-green-400 font-semibold text-sm">127 Violations Prevented</div>
                <div className="text-green-300 text-xs">94% Trust Score Impact</div>
              </div>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.05 }}
              className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6"
            >
              <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl flex items-center justify-center text-3xl mb-4 mx-auto">
                ⚖️
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Legal Ethics</h3>
              <p className="text-gray-300 text-sm mb-4">Prevent Johnson v. Smith scenarios with citation verification</p>
              <div className="bg-purple-900/20 border border-purple-500/30 rounded-lg p-3">
                <div className="text-purple-400 font-semibold text-sm">89 Violations Prevented</div>
                <div className="text-purple-300 text-xs">96% Trust Score Impact</div>
              </div>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.05 }}
              className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6"
            >
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center text-3xl mb-4 mx-auto">
                💰
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Financial Services</h3>
              <p className="text-gray-300 text-sm mb-4">SOX and PCI compliance for trading and advisory systems</p>
              <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-3">
                <div className="text-blue-400 font-semibold text-sm">203 Violations Prevented</div>
                <div className="text-blue-300 text-xs">91% Trust Score Impact</div>
              </div>
            </motion.div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row justify-center gap-4 mb-12">
            <button 
              onClick={() => setShowFullDemo(true)}
              className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold py-4 px-8 rounded-lg transition-all duration-200 transform hover:scale-105 shadow-lg"
            >
              Try Interactive Demo
            </button>
            <Link 
              to="/templates"
              className="bg-transparent border-2 border-green-500 hover:bg-green-500 text-green-400 hover:text-white font-bold py-4 px-8 rounded-lg transition-all duration-200 text-center"
            >
              Browse Templates
            </Link>
            <Link 
              to="/learn"
              className="bg-transparent border-2 border-gray-600 hover:bg-gray-600 text-gray-300 hover:text-white font-bold py-4 px-8 rounded-lg transition-all duration-200 text-center"
            >
              Learn More
            </Link>
          </div>

          {/* Demo Features */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-400 mb-2">Real-Time</div>
              <div className="text-gray-300 text-sm">Violation Prevention</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-400 mb-2">Live</div>
              <div className="text-gray-300 text-sm">Trust Scoring</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-400 mb-2">5+</div>
              <div className="text-gray-300 text-sm">Industry Scenarios</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-400 mb-2">Interactive</div>
              <div className="text-gray-300 text-sm">Agent Testing</div>
            </div>
          </div>
        </div>
      </section>

      {/* What You'll Experience */}
      <section className="w-full py-20 px-4 sm:px-6 lg:px-8 bg-gray-800">
        <div className="max-w-screen-xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-6 text-white">
              What You'll Experience
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Our interactive demo shows you exactly how Promethios governance works in real-world scenarios
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-700 rounded-xl p-8">
              <div className="w-12 h-12 bg-gradient-to-r from-red-500 to-red-600 rounded-lg flex items-center justify-center text-2xl mb-6">
                🚨
              </div>
              <h3 className="text-xl font-bold text-white mb-4">Violation Detection</h3>
              <p className="text-gray-300 mb-4">
                Watch as Promethios identifies and prevents policy violations in real-time, 
                from medical advice to fabricated legal citations.
              </p>
              <div className="text-red-400 text-sm font-semibold">
                ⚡ Instant Prevention
              </div>
            </div>

            <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-700 rounded-xl p-8">
              <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-green-600 rounded-lg flex items-center justify-center text-2xl mb-6">
                📊
              </div>
              <h3 className="text-xl font-bold text-white mb-4">Trust Score Updates</h3>
              <p className="text-gray-300 mb-4">
                See how trust scores change dynamically as governance policies are enforced 
                and violations are prevented or allowed.
              </p>
              <div className="text-green-400 text-sm font-semibold">
                📈 Live Metrics
              </div>
            </div>

            <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-700 rounded-xl p-8">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center text-2xl mb-6">
                🎯
              </div>
              <h3 className="text-xl font-bold text-white mb-4">Scenario Testing</h3>
              <p className="text-gray-300 mb-4">
                Try different industry scenarios and see how governance adapts to 
                healthcare, legal, financial, and other specialized requirements.
              </p>
              <div className="text-blue-400 text-sm font-semibold">
                🔬 Interactive Testing
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Ready to Get Started */}
      <section className="w-full py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-gray-900 to-gray-800">
        <div className="max-w-screen-xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-6 text-white">
            Ready to Experience AI Governance?
          </h2>
          <p className="text-xl mb-8 text-gray-300 max-w-3xl mx-auto">
            See how Promethios can protect your AI systems and build trust with your users. 
            The demo takes less than 5 minutes and shows real violation prevention in action.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <button 
              onClick={() => setShowFullDemo(true)}
              className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold py-4 px-8 rounded-lg transition-all duration-200 transform hover:scale-105 shadow-lg"
            >
              Launch Interactive Demo
            </button>
            <Link 
              to="/learn"
              className="bg-transparent border-2 border-green-500 hover:bg-green-500 text-green-400 hover:text-white font-bold py-4 px-8 rounded-lg transition-all duration-200 text-center"
            >
              Learn How It Works
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default LiveDemoPage;

