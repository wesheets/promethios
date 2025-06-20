import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

const NewLandingPage: React.FC = () => {
  const { user } = useAuth();
  const { isDarkMode } = useTheme();

  return (
    <div className="w-full">
      {/* Hero Section */}
      <section className={`w-full py-20 px-4 sm:px-6 lg:px-8 ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
        <div className="max-w-screen-xl mx-auto">
          <div className="flex flex-col lg:flex-row items-center justify-between">
            <div className="lg:w-1/2 mb-10 lg:mb-0">
              <h1 className="text-4xl sm:text-5xl font-bold mb-6 leading-tight">
                You've been lied to.
              </h1>
              <p className="text-xl mb-8 text-gray-400">
                The AI you trust is making things up — and you don't even know it.
                Promethios improves AI accuracy, traceability, and decision quality,
                making your models better by design.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link 
                  to={user ? "/ui/dashboard" : "/signup"} 
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-md transition duration-300"
                >
                  {user ? "Go to Dashboard" : "Protect My Agent →"}
                </Link>
                <Link 
                  to="/benchmark" 
                  className="bg-transparent border border-gray-600 hover:border-gray-400 text-gray-300 hover:text-white font-bold py-3 px-6 rounded-md transition duration-300"
                >
                  See Benchmarks →
                </Link>
              </div>
              <p className="text-sm mt-4 text-gray-500">
                Promethios is rolling out in phases. Join the waitlist for early access to governed agent infrastructure.
              </p>
            </div>
            <div className="lg:w-1/2">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg opacity-20 blur-xl"></div>
                <div className="relative bg-gray-800 p-8 rounded-lg border border-gray-700">
                  <div className="flex items-center mb-4">
                    <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center mr-3">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-bold text-white">Promethios</h3>
                  </div>
                  <p className="text-gray-300 mb-6">
                    "Wondering what that headline really means? Ask me what your AI is hiding."
                  </p>
                  <div className="flex justify-end">
                    <Link 
                      to="/governed-vs-ungoverned" 
                      className="text-blue-400 hover:text-blue-300 text-sm font-medium"
                    >
                      Watch an Agent Break →
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="w-full py-20 px-4 sm:px-6 lg:px-8 bg-gray-50 dark:bg-gray-800">
        <div className="max-w-screen-xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4 text-gray-900 dark:text-white">The only way to govern AI agents</h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              Promethios provides a comprehensive governance framework that makes it
              easy to wrap any agent with trust, compliance, and performance
              monitoring.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-gray-700 p-8 rounded-lg shadow-sm border border-gray-600">
              <div className="w-12 h-12 bg-blue-900 rounded-lg flex items-center justify-center mb-6">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-3 text-white">Wrap Any Agent</h3>
              <p className="text-gray-300">
                Our automated detection system identifies integration points in any agent framework, allowing for seamless governance wrapping.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-gray-700 p-8 rounded-lg shadow-sm border border-gray-600">
              <div className="w-12 h-12 bg-green-900 rounded-lg flex items-center justify-center mb-6">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-3 text-white">Monitor Performance</h3>
              <p className="text-gray-300">
                Real-time metrics visualization shows the impact of governance on agent performance, trust scores, and compliance rates.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-gray-700 p-8 rounded-lg shadow-sm border border-gray-600">
              <div className="w-12 h-12 bg-purple-900 rounded-lg flex items-center justify-center mb-6">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-purple-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-3 text-white">Prove Compliance</h3>
              <p className="text-gray-300">
                Comprehensive trust logs and verification systems provide auditable proof of agent compliance with governance parameters.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className={`w-full py-20 px-4 sm:px-6 lg:px-8 ${isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'}`}>
        <div className="max-w-screen-xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-6">Ready to make your AI more trustworthy?</h2>
          <p className="text-xl mb-8 text-gray-500 dark:text-gray-300 max-w-3xl mx-auto">
            Join thousands of developers who are building safer, more reliable AI systems with Promethios governance.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link 
              to={user ? "/ui/dashboard" : "/signup"} 
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-md transition duration-300"
            >
              {user ? "Go to Dashboard" : "Get Started for Free"}
            </Link>
            <Link 
              to="/documentation" 
              className="bg-transparent border border-gray-300 dark:border-gray-600 hover:border-gray-400 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white font-bold py-3 px-8 rounded-md transition duration-300"
            >
              Read the Docs
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default NewLandingPage;
