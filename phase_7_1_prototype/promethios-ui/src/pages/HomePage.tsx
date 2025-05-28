import React from 'react';

const HomePage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Hero Section */}
      <section className="py-20 px-4 text-center">
        <h1 className="text-5xl font-bold mb-4">Promethios makes agents governable.</h1>
        <p className="text-xl mb-8">Reflection, memory, trust. All enforced — instantly</p>
        
        <div className="flex justify-center space-x-4 mb-8">
          <button className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg">
            Get Started
          </button>
          <button className="border border-gray-500 hover:border-gray-400 text-white font-bold py-3 px-6 rounded-lg">
            See Benchmarks
          </button>
        </div>
        
        <p className="text-gray-400 italic">
          Promethios is rolling out in phases. Join the waitlist for early access to governed agent infrastructure.
        </p>
      </section>

      {/* Comparison Table */}
      <section className="py-16 px-4 max-w-4xl mx-auto">
        <div className="bg-gray-800 rounded-lg overflow-hidden shadow-xl">
          <div className="p-1 bg-gradient-to-r from-red-500 via-yellow-500 to-green-500">
            <div className="bg-gray-800 p-4">
              <div className="flex items-center mb-2">
                <div className="flex space-x-1">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                </div>
                <h2 className="text-xl font-bold ml-4">Detailed Comparison</h2>
              </div>
              <p className="text-gray-400 text-sm mb-4">Side-by-side comparison of governed vs. ungoverned agents</p>
              
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="py-2 px-4">METRIC</th>
                    <th className="py-2 px-4">UNGOVERNED</th>
                    <th className="py-2 px-4">GOVERNED</th>
                    <th className="py-2 px-4">IMPROVEMENT</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-gray-700">
                    <td className="py-2 px-4">Trust Score</td>
                    <td className="py-2 px-4">45/100</td>
                    <td className="py-2 px-4">92/100</td>
                    <td className="py-2 px-4 text-green-500">+104%</td>
                  </tr>
                  <tr className="border-b border-gray-700">
                    <td className="py-2 px-4">Compliance Rate</td>
                    <td className="py-2 px-4">38%</td>
                    <td className="py-2 px-4">95%</td>
                    <td className="py-2 px-4 text-green-500">+150%</td>
                  </tr>
                  <tr className="border-b border-gray-700">
                    <td className="py-2 px-4">Error Rate</td>
                    <td className="py-2 px-4">65%</td>
                    <td className="py-2 px-4">12%</td>
                    <td className="py-2 px-4 text-green-500">-82%</td>
                  </tr>
                  <tr className="border-b border-gray-700">
                    <td className="py-2 px-4">Performance</td>
                    <td className="py-2 px-4">88/100</td>
                    <td className="py-2 px-4">85/100</td>
                    <td className="py-2 px-4 text-yellow-500">-3%</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-4">Integration Time</td>
                    <td className="py-2 px-4">N/A</td>
                    <td className="py-2 px-4">Minutes</td>
                    <td className="py-2 px-4 text-green-500">90-100% reduction</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4 bg-gray-800">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <span className="text-blue-500 font-semibold uppercase tracking-wider">FEATURES</span>
            <h2 className="text-4xl font-bold mt-2 mb-4">The only way to govern AI agents</h2>
            <p className="text-gray-400 max-w-3xl mx-auto">
              Promethios provides a comprehensive governance framework that makes it easy to wrap any agent with trust, compliance, and performance monitoring.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-gray-900 p-6 rounded-lg">
              <div className="bg-blue-600 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Wrap Any Agent</h3>
              <p className="text-gray-400">
                Our automated detection system identifies integration points in any agent framework, allowing for seamless governance wrapping.
              </p>
            </div>
            
            <div className="bg-gray-900 p-6 rounded-lg">
              <div className="bg-blue-600 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Monitor Performance</h3>
              <p className="text-gray-400">
                Real-time metrics visualization shows the impact of governance on agent performance, trust scores, and compliance rates.
              </p>
            </div>
            
            <div className="bg-gray-900 p-6 rounded-lg">
              <div className="bg-blue-600 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Prove Compliance</h3>
              <p className="text-gray-400">
                Comprehensive trust logs and verification systems provide auditable proof of agent compliance with governance parameters.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CMU Benchmark Section */}
      <section className="py-16 px-4 bg-gray-900">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8">
            <span className="text-blue-500 font-semibold uppercase tracking-wider">CMU BENCHMARK</span>
            <h2 className="text-4xl font-bold mt-2 mb-4">See the difference Promethios makes</h2>
            <p className="text-gray-400 max-w-3xl mx-auto">
              Our CMU benchmark results show dramatic improvements in trust, compliance, and error reduction with minimal performance impact.
            </p>
          </div>
          
          <div className="bg-gray-800 p-8 rounded-lg mb-8">
            {/* This would be a chart in the real implementation */}
            <div className="h-64 flex items-center justify-center">
              <p className="text-gray-400">[Benchmark Chart: Shows Trust Score, Compliance, Error Rate, and Performance comparisons between Ungoverned Agent and Promethios Governed]</p>
            </div>
          </div>
          
          <div className="text-center">
            <button className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg inline-flex items-center">
              Explore Interactive Benchmark
              <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </button>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 bg-gray-800">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-6">Get Started Today</h2>
          <button className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg">
            Request Access
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 bg-gray-900 border-t border-gray-800">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-xl font-bold mb-4">PROMETHIOS</h3>
              <p className="text-gray-400">Improving AI through Governance</p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white">About Us</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-gray-400">
                {/* Product links */}
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white">Contact Us</a></li>
                <li><a href="#" className="hover:text-white">Request Demo</a></li>
              </ul>
            </div>
          </div>
        </div>
      </footer>

      {/* Feedback Widget */}
      <div className="fixed bottom-4 right-4">
        <button className="bg-purple-600 hover:bg-purple-700 text-white font-bold p-4 rounded-full shadow-lg">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default HomePage;
