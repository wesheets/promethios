import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const DashboardPage: React.FC = () => {
  const { currentUser, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
          Welcome to Promethios Dashboard
        </h1>
        
        {currentUser && (
          <div className="mb-6">
            <p className="text-gray-700 dark:text-gray-300 mb-2">
              Logged in as: <span className="font-semibold">{currentUser.email}</span>
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Quick Stats */}
          <div className="bg-blue-50 dark:bg-blue-900/30 p-4 rounded-lg border border-blue-100 dark:border-blue-800">
            <h3 className="font-semibold text-blue-800 dark:text-blue-300 mb-2">AI Governance</h3>
            <p className="text-gray-700 dark:text-gray-300">
              Monitor and manage AI governance policies and compliance.
            </p>
            <button 
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
              onClick={() => navigate('/governance')}
            >
              View Details
            </button>
          </div>

          {/* Benchmarks */}
          <div className="bg-purple-50 dark:bg-purple-900/30 p-4 rounded-lg border border-purple-100 dark:border-purple-800">
            <h3 className="font-semibold text-purple-800 dark:text-purple-300 mb-2">Benchmarks</h3>
            <p className="text-gray-700 dark:text-gray-300">
              Access performance benchmarks and comparative analytics.
            </p>
            <button 
              className="mt-4 px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition"
              onClick={() => navigate('/benchmark')}
            >
              View Benchmarks
            </button>
          </div>

          {/* Documentation */}
          <div className="bg-green-50 dark:bg-green-900/30 p-4 rounded-lg border border-green-100 dark:border-green-800">
            <h3 className="font-semibold text-green-800 dark:text-green-300 mb-2">Documentation</h3>
            <p className="text-gray-700 dark:text-gray-300">
              Access guides, tutorials, and API documentation.
            </p>
            <button 
              className="mt-4 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition"
              onClick={() => navigate('/documentation')}
            >
              View Docs
            </button>
          </div>
        </div>
      </div>

      {/* Recent Activity Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Recent Activity</h2>
        <div className="border-t border-gray-200 dark:border-gray-700">
          <div className="py-3 flex items-center border-b border-gray-200 dark:border-gray-700">
            <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
            <p className="text-gray-700 dark:text-gray-300">Welcome to Promethios! Your account is now active.</p>
            <span className="ml-auto text-sm text-gray-500">Just now</span>
          </div>
          <div className="py-3 flex items-center border-b border-gray-200 dark:border-gray-700">
            <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
            <p className="text-gray-700 dark:text-gray-300">Authentication system successfully configured.</p>
            <span className="ml-auto text-sm text-gray-500">Today</span>
          </div>
          <div className="py-3 flex items-center">
            <div className="w-2 h-2 bg-purple-500 rounded-full mr-3"></div>
            <p className="text-gray-700 dark:text-gray-300">New benchmark data available for review.</p>
            <span className="ml-auto text-sm text-gray-500">Yesterday</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
