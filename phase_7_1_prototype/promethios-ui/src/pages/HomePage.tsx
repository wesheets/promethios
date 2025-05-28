import React from 'react';
import { useTheme } from '../context/ThemeContext';
import { Link } from 'react-router-dom';

const HomePage: React.FC = () => {
  const { isDarkMode } = useTheme();
  
  return (
    <div className="space-y-16">
      {/* Hero Section */}
      <section className="text-center py-16">
        <h1 className="text-5xl font-bold mb-4">Promethios makes agents governable.</h1>
        <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto mb-8">
          Reflection, memory, trust. All enforced — instantly
        </p>
        <div className="flex justify-center space-x-4">
          <button className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg">
            Get Started
          </button>
          <Link to="/benchmarks">
            <button className="border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 font-bold py-3 px-6 rounded-lg">
              See Benchmarks
            </button>
          </Link>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-6 italic">
          Promethios is rolling out in phases. Join the waitlist for early access to governed agent infrastructure.
        </p>
      </section>

      {/* Comparison Table Section */}
      <section className="py-8 max-w-4xl mx-auto">
        <div className="bg-gray-800 rounded-lg overflow-hidden shadow-xl border border-gray-700">
          <div className="p-4 bg-gray-700 border-b border-gray-600">
            <div className="flex items-center space-x-2">
              <div className="flex space-x-1">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
              </div>
              <h3 className="text-white font-semibold">Detailed Comparison</h3>
            </div>
          </div>
          <div className="p-6">
            <p className="text-gray-300 text-sm mb-4">Side-by-side comparison of governed vs. ungoverned agents</p>
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-600">
                  <th className="py-2 px-4 text-gray-400">METRIC</th>
                  <th className="py-2 px-4 text-gray-400">UNGOVERNED</th>
                  <th className="py-2 px-4 text-gray-400">GOVERNED</th>
                  <th className="py-2 px-4 text-gray-400">IMPROVEMENT</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-gray-700">
                  <td className="py-3 px-4 text-gray-300">Trust Score</td>
                  <td className="py-3 px-4 text-gray-300">45/100</td>
                  <td className="py-3 px-4 text-gray-300">92/100</td>
                  <td className="py-3 px-4 text-green-500">+104%</td>
                </tr>
                <tr className="border-b border-gray-700">
                  <td className="py-3 px-4 text-gray-300">Compliance Rate</td>
                  <td className="py-3 px-4 text-gray-300">38%</td>
                  <td className="py-3 px-4 text-gray-300">95%</td>
                  <td className="py-3 px-4 text-green-500">+150%</td>
                </tr>
                <tr className="border-b border-gray-700">
                  <td className="py-3 px-4 text-gray-300">Error Rate</td>
                  <td className="py-3 px-4 text-gray-300">65%</td>
                  <td className="py-3 px-4 text-gray-300">12%</td>
                  <td className="py-3 px-4 text-green-500">-82%</td>
                </tr>
                <tr className="border-b border-gray-700">
                  <td className="py-3 px-4 text-gray-300">Performance</td>
                  <td className="py-3 px-4 text-gray-300">88/100</td>
                  <td className="py-3 px-4 text-gray-300">85/100</td>
                  <td className="py-3 px-4 text-yellow-500">-3%</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 text-gray-300">Integration Time</td>
                  <td className="py-3 px-4 text-gray-300">N/A</td>
                  <td className="py-3 px-4 text-gray-300">Minutes</td>
                  <td className="py-3 px-4 text-green-500">90-100% reduction</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Features Section - "The only way to govern AI agents" */}
      <section className="py-12 bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <p className="text-blue-600 font-semibold mb-2">FEATURES</p>
            <h2 className="text-4xl font-bold mb-4">The only way to govern AI agents</h2>
            <p className="text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              Promethios provides a comprehensive governance framework that makes it
              easy to wrap any agent with trust, compliance, and performance
              monitoring.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
              <div className="bg-blue-500 text-white p-3 rounded-lg inline-block mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Wrap Any Agent</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Our automated detection system identifies integration points in any agent framework, allowing for seamless governance wrapping.
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
              <div className="bg-blue-500 text-white p-3 rounded-lg inline-block mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Monitor Performance</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Real-time metrics visualization shows the impact of governance on agent performance, trust scores, and compliance rates.
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
              <div className="bg-blue-500 text-white p-3 rounded-lg inline-block mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Prove Compliance</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Comprehensive trust logs and verification systems provide auditable proof of agent compliance with governance parameters.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CMU Benchmark Section */}
      <section className="py-12 bg-white dark:bg-gray-800">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8">
            <p className="text-blue-600 font-semibold mb-2">CMU BENCHMARK</p>
            <h2 className="text-4xl font-bold mb-4">See the difference Promethios makes</h2>
            <p className="text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              Our CMU benchmark results show dramatic improvements in trust, compliance, and error reduction with minimal performance impact.
            </p>
          </div>

          <div className="max-w-4xl mx-auto mt-12">
            {/* This would be a chart in the real implementation */}
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md">
              <div className="h-64 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                <p className="text-gray-500 dark:text-gray-400">
                  [Benchmark Chart: Shows Trust Score, Compliance, Error Rate, and Performance comparisons between Ungoverned Agent and Promethios Governed]
                </p>
              </div>
            </div>

            <div className="text-center mt-8">
              <Link to="/benchmarks">
                <button className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg inline-flex items-center">
                  Explore Interactive Benchmark
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold mb-6 text-center">Get Started Today</h2>
          <div className="flex justify-center">
            <button className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg">
              Request Access
            </button>
          </div>
        </div>
      </section>

      {/* Feedback Widget */}
      <div className="fixed bottom-4 right-4 z-50">
        <button 
          className="bg-purple-600 hover:bg-purple-700 text-white rounded-full p-3 shadow-lg"
          aria-label="Open feedback form"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default HomePage;
