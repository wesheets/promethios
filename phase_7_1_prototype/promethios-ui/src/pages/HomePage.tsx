import React from 'react';
import { useTheme } from '../context/ThemeContext';

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
          <button className="border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 font-bold py-3 px-6 rounded-lg">
            See Benchmarks
          </button>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-6 italic">
          Promethios is rolling out in phases. Join the waitlist for early access to governed agent infrastructure.
        </p>
      </section>

      {/* Comparison Table Section */}
      <section className="py-8">
        <div className="max-w-4xl mx-auto bg-gray-800 rounded-lg overflow-hidden shadow-xl border border-gray-700">
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
                  <td className="py-3 px-4 text-gray-300">95/100</td>
                  <td className="py-3 px-4 text-green-500">+100%</td>
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
                  <td className="py-3 px-4 text-green-500">-80%</td>
                </tr>
                <tr className="border-b border-gray-700">
                  <td className="py-3 px-4 text-gray-300">Performance</td>
                  <td className="py-3 px-4 text-gray-300">80/100</td>
                  <td className="py-3 px-4 text-gray-300">85/100</td>
                  <td className="py-3 px-4 text-green-500">+6%</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 text-gray-300">Integration Time</td>
                  <td className="py-3 px-4 text-gray-300">N/A</td>
                  <td className="py-3 px-4 text-gray-300">Minutes</td>
                  <td className="py-3 px-4 text-green-500">0+ 90% reduction</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-8 py-8">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-semibold mb-3">Implement robust governance frameworks for your AI systems with comprehensive policies and controls.</h2>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-semibold mb-3">Ensure transparency in AI operations with detailed documentation and explainable processes.</h2>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-semibold mb-3">Continuously monitor AI systems for compliance, performance, and ethical considerations.</h2>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-8">
        <h2 className="text-3xl font-bold mb-6 text-center">Get Started Today</h2>
        <div className="flex justify-center">
          <button className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg">
            Request Access
          </button>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
