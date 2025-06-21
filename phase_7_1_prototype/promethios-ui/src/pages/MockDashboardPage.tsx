import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

const MockDashboardPage: React.FC = () => {
  const [trustScore, setTrustScore] = useState(85);
  const [violationsPrevented, setViolationsPrevented] = useState(1247);
  const [governedResponses, setGovernedResponses] = useState(1200000);
  const [showUnlockModal, setShowUnlockModal] = useState(false);

  // Animate counters on mount
  useEffect(() => {
    const interval = setInterval(() => {
      setViolationsPrevented(prev => prev + Math.floor(Math.random() * 3));
      setGovernedResponses(prev => prev + Math.floor(Math.random() * 50));
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const UnlockOverlay = ({ feature }: { feature: string }) => (
    <div className="absolute inset-0 bg-gray-900/80 backdrop-blur-sm flex items-center justify-center z-10 rounded-lg">
      <div className="text-center">
        <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-3xl mb-4 mx-auto">
          🔒
        </div>
        <h3 className="text-xl font-bold text-white mb-2">Unlock {feature}</h3>
        <p className="text-gray-300 mb-4 max-w-xs">Sign up to access this powerful governance feature</p>
        <button 
          onClick={() => setShowUnlockModal(true)}
          className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold py-2 px-6 rounded-lg transition-all duration-200"
        >
          Get Access
        </button>
      </div>
    </div>
  );

  return (
    <div className="w-full bg-gray-900 text-white min-h-screen">
      {/* Hero Section */}
      <section className="w-full py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
        <div className="max-w-screen-xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center space-x-2 bg-purple-900/20 border border-purple-500/30 rounded-full px-4 py-2 mb-6">
              <span className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></span>
              <span className="text-purple-400 text-sm font-semibold">Dashboard Preview</span>
            </div>
            
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
              Your <span className="bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">AI Governance</span> Command Center
            </h1>
            
            <p className="text-xl sm:text-2xl mb-8 text-gray-300 max-w-4xl mx-auto leading-relaxed">
              Monitor, control, and optimize your AI systems with real-time governance insights. 
              See what enterprise customers use to maintain 99.7% compliance and prevent costly violations.
            </p>

            <div className="flex flex-col sm:flex-row justify-center gap-4 mb-8">
              <button 
                onClick={() => setShowUnlockModal(true)}
                className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold py-4 px-8 rounded-lg transition-all duration-200 transform hover:scale-105 shadow-lg"
              >
                Start Free Trial
              </button>
              <Link 
                to="/live-demo"
                className="bg-transparent border-2 border-green-500 hover:bg-green-500 text-green-400 hover:text-white font-bold py-4 px-8 rounded-lg transition-all duration-200 text-center"
              >
                Try Interactive Demo
              </Link>
            </div>
          </div>

          {/* Key Metrics Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
            <motion.div
              animate={{ scale: [1, 1.02, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="bg-gradient-to-r from-green-900/50 to-green-800/50 backdrop-blur-sm border border-green-500/30 rounded-xl p-6 text-center"
            >
              <div className="text-4xl font-bold text-green-400 mb-2">{trustScore}%</div>
              <div className="text-green-300 text-sm font-semibold">Trust Score</div>
              <div className="text-gray-400 text-xs mt-1">↗ +2.3% this week</div>
            </motion.div>

            <motion.div
              animate={{ scale: [1, 1.02, 1] }}
              transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
              className="bg-gradient-to-r from-blue-900/50 to-blue-800/50 backdrop-blur-sm border border-blue-500/30 rounded-xl p-6 text-center"
            >
              <div className="text-4xl font-bold text-blue-400 mb-2">{violationsPrevented.toLocaleString()}</div>
              <div className="text-blue-300 text-sm font-semibold">Violations Prevented</div>
              <div className="text-gray-400 text-xs mt-1">↗ +15 today</div>
            </motion.div>

            <motion.div
              animate={{ scale: [1, 1.02, 1] }}
              transition={{ duration: 2, repeat: Infinity, delay: 1 }}
              className="bg-gradient-to-r from-purple-900/50 to-purple-800/50 backdrop-blur-sm border border-purple-500/30 rounded-xl p-6 text-center"
            >
              <div className="text-4xl font-bold text-purple-400 mb-2">{(governedResponses / 1000000).toFixed(1)}M</div>
              <div className="text-purple-300 text-sm font-semibold">Governed Responses</div>
              <div className="text-gray-400 text-xs mt-1">↗ +12K today</div>
            </motion.div>

            <motion.div
              animate={{ scale: [1, 1.02, 1] }}
              transition={{ duration: 2, repeat: Infinity, delay: 1.5 }}
              className="bg-gradient-to-r from-orange-900/50 to-orange-800/50 backdrop-blur-sm border border-orange-500/30 rounded-xl p-6 text-center"
            >
              <div className="text-4xl font-bold text-orange-400 mb-2">99.7%</div>
              <div className="text-orange-300 text-sm font-semibold">Uptime</div>
              <div className="text-gray-400 text-xs mt-1">↗ 30 days</div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Dashboard Preview */}
      <section className="w-full py-16 px-4 sm:px-6 lg:px-8 bg-gray-800">
        <div className="max-w-screen-xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Trust Score Visualization */}
            <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-700 rounded-xl p-8 relative">
              <h3 className="text-2xl font-bold text-white mb-6 flex items-center">
                <span className="w-3 h-3 bg-green-400 rounded-full mr-3"></span>
                Trust Score Trends
              </h3>
              
              {/* Mock Chart */}
              <div className="h-64 bg-gray-800/50 rounded-lg p-4 mb-4">
                <div className="flex items-end justify-between h-full">
                  {[65, 72, 78, 81, 85, 87, 85, 89, 91, 88, 85, 87].map((value, index) => (
                    <div key={index} className="flex flex-col items-center">
                      <div 
                        className="bg-gradient-to-t from-green-600 to-green-400 rounded-t-sm w-6 transition-all duration-1000"
                        style={{ height: `${(value / 100) * 200}px` }}
                      ></div>
                      <div className="text-xs text-gray-400 mt-2">{index + 1}</div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="flex justify-between text-sm text-gray-400">
                <span>Last 12 hours</span>
                <span className="text-green-400">↗ +2.3%</span>
              </div>
            </div>

            {/* Violation Prevention */}
            <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-700 rounded-xl p-8 relative">
              <UnlockOverlay feature="Violation Analytics" />
              
              <h3 className="text-2xl font-bold text-white mb-6 flex items-center">
                <span className="w-3 h-3 bg-red-400 rounded-full mr-3"></span>
                Violation Prevention
              </h3>
              
              <div className="space-y-4">
                <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-red-400 font-semibold">Medical Advice</span>
                    <span className="text-red-300 text-sm">23 prevented</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div className="bg-red-400 h-2 rounded-full" style={{ width: '75%' }}></div>
                  </div>
                </div>
                
                <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-yellow-400 font-semibold">Legal Citations</span>
                    <span className="text-yellow-300 text-sm">18 prevented</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div className="bg-yellow-400 h-2 rounded-full" style={{ width: '60%' }}></div>
                  </div>
                </div>
                
                <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-blue-400 font-semibold">Financial Advice</span>
                    <span className="text-blue-300 text-sm">12 prevented</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div className="bg-blue-400 h-2 rounded-full" style={{ width: '40%' }}></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Agent Performance */}
            <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-700 rounded-xl p-8 relative">
              <UnlockOverlay feature="Agent Monitoring" />
              
              <h3 className="text-2xl font-bold text-white mb-6 flex items-center">
                <span className="w-3 h-3 bg-blue-400 rounded-full mr-3"></span>
                Agent Performance
              </h3>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-green-600 rounded-lg flex items-center justify-center text-xl">🏥</div>
                    <div>
                      <div className="text-white font-semibold">Healthcare Agent</div>
                      <div className="text-gray-400 text-sm">94% Trust Score</div>
                    </div>
                  </div>
                  <div className="text-green-400 font-semibold">Healthy</div>
                </div>
                
                <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg flex items-center justify-center text-xl">⚖️</div>
                    <div>
                      <div className="text-white font-semibold">Legal Agent</div>
                      <div className="text-gray-400 text-sm">96% Trust Score</div>
                    </div>
                  </div>
                  <div className="text-green-400 font-semibold">Healthy</div>
                </div>
                
                <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center text-xl">💰</div>
                    <div>
                      <div className="text-white font-semibold">Financial Agent</div>
                      <div className="text-gray-400 text-sm">91% Trust Score</div>
                    </div>
                  </div>
                  <div className="text-yellow-400 font-semibold">Warning</div>
                </div>
              </div>
            </div>

            {/* Policy Compliance */}
            <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-700 rounded-xl p-8 relative">
              <UnlockOverlay feature="Policy Management" />
              
              <h3 className="text-2xl font-bold text-white mb-6 flex items-center">
                <span className="w-3 h-3 bg-purple-400 rounded-full mr-3"></span>
                Policy Compliance
              </h3>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-green-900/20 border border-green-500/30 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <span className="text-green-400">✅</span>
                    <span className="text-white">HIPAA Compliance</span>
                  </div>
                  <span className="text-green-400 text-sm">Active</span>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-green-900/20 border border-green-500/30 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <span className="text-green-400">✅</span>
                    <span className="text-white">SOX Compliance</span>
                  </div>
                  <span className="text-green-400 text-sm">Active</span>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-yellow-900/20 border border-yellow-500/30 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <span className="text-yellow-400">⚠️</span>
                    <span className="text-white">GDPR Compliance</span>
                  </div>
                  <span className="text-yellow-400 text-sm">Review</span>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-green-900/20 border border-green-500/30 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <span className="text-green-400">✅</span>
                    <span className="text-white">PCI DSS</span>
                  </div>
                  <span className="text-green-400 text-sm">Active</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Recent Activity Feed */}
      <section className="w-full py-16 px-4 sm:px-6 lg:px-8 bg-gray-900">
        <div className="max-w-screen-xl mx-auto">
          <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-8 relative">
            <UnlockOverlay feature="Activity Feed" />
            
            <h3 className="text-2xl font-bold text-white mb-6 flex items-center">
              <span className="w-3 h-3 bg-cyan-400 rounded-full mr-3"></span>
              Recent Governance Activity
            </h3>
            
            <div className="space-y-4">
              <div className="flex items-start space-x-4 p-4 bg-gray-900/50 rounded-lg">
                <div className="w-2 h-2 bg-red-400 rounded-full mt-2"></div>
                <div>
                  <div className="text-white font-semibold">Medical advice violation prevented</div>
                  <div className="text-gray-400 text-sm">Healthcare Agent blocked unauthorized medical diagnosis</div>
                  <div className="text-gray-500 text-xs mt-1">2 minutes ago</div>
                </div>
              </div>
              
              <div className="flex items-start space-x-4 p-4 bg-gray-900/50 rounded-lg">
                <div className="w-2 h-2 bg-green-400 rounded-full mt-2"></div>
                <div>
                  <div className="text-white font-semibold">Trust score improved</div>
                  <div className="text-gray-400 text-sm">Legal Agent trust score increased to 96%</div>
                  <div className="text-gray-500 text-xs mt-1">5 minutes ago</div>
                </div>
              </div>
              
              <div className="flex items-start space-x-4 p-4 bg-gray-900/50 rounded-lg">
                <div className="w-2 h-2 bg-yellow-400 rounded-full mt-2"></div>
                <div>
                  <div className="text-white font-semibold">Policy update applied</div>
                  <div className="text-gray-400 text-sm">GDPR compliance policy updated for EU users</div>
                  <div className="text-gray-500 text-xs mt-1">12 minutes ago</div>
                </div>
              </div>
              
              <div className="flex items-start space-x-4 p-4 bg-gray-900/50 rounded-lg">
                <div className="w-2 h-2 bg-blue-400 rounded-full mt-2"></div>
                <div>
                  <div className="text-white font-semibold">New agent deployed</div>
                  <div className="text-gray-400 text-sm">Customer Service Agent v2.1 with enhanced governance</div>
                  <div className="text-gray-500 text-xs mt-1">1 hour ago</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ROI Calculator */}
      <section className="w-full py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-gray-800 to-gray-900">
        <div className="max-w-screen-xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-6 text-white">
            Calculate Your ROI
          </h2>
          <p className="text-xl mb-12 text-gray-300 max-w-3xl mx-auto">
            See how much Promethios governance could save your organization
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-700 rounded-xl p-8">
              <div className="text-4xl font-bold text-red-400 mb-2">$2.3M</div>
              <div className="text-red-300 text-lg font-semibold mb-2">Average Violation Cost</div>
              <div className="text-gray-400 text-sm">Without governance protection</div>
            </div>

            <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-700 rounded-xl p-8">
              <div className="text-4xl font-bold text-green-400 mb-2">99.2%</div>
              <div className="text-green-300 text-lg font-semibold mb-2">Prevention Rate</div>
              <div className="text-gray-400 text-sm">With Promethios governance</div>
            </div>

            <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-700 rounded-xl p-8">
              <div className="text-4xl font-bold text-blue-400 mb-2">$50K</div>
              <div className="text-blue-300 text-lg font-semibold mb-2">Annual Investment</div>
              <div className="text-gray-400 text-sm">Typical enterprise deployment</div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-green-900/20 to-green-800/20 border border-green-500/30 rounded-xl p-8 mb-8">
            <div className="text-3xl font-bold text-green-400 mb-2">ROI: 4,500%</div>
            <div className="text-green-300 text-lg">Potential annual savings: $2.25M</div>
            <div className="text-gray-400 text-sm mt-2">Based on preventing just one major violation per year</div>
          </div>

          <button 
            onClick={() => setShowUnlockModal(true)}
            className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold py-4 px-8 rounded-lg transition-all duration-200 transform hover:scale-105 shadow-lg"
          >
            Start Your Free Trial
          </button>
        </div>
      </section>

      {/* Unlock Modal */}
      {showUnlockModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-gray-900 border border-gray-700 rounded-xl p-8 max-w-md w-full"
          >
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-3xl mb-4 mx-auto">
                🚀
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">Ready to Get Started?</h3>
              <p className="text-gray-300 mb-6">
                Join hundreds of enterprises using Promethios to govern their AI systems and prevent costly violations.
              </p>
              
              <div className="space-y-3 mb-6">
                <Link 
                  to="/live-demo"
                  className="block w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 text-center"
                >
                  Try Interactive Demo
                </Link>
                <Link 
                  to="/templates"
                  className="block w-full bg-transparent border-2 border-green-500 hover:bg-green-500 text-green-400 hover:text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 text-center"
                >
                  Browse Templates
                </Link>
                <Link 
                  to="/learn"
                  className="block w-full bg-transparent border-2 border-gray-600 hover:bg-gray-600 text-gray-300 hover:text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 text-center"
                >
                  Learn More
                </Link>
              </div>
              
              <button 
                onClick={() => setShowUnlockModal(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                Close
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default MockDashboardPage;

