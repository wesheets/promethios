import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const Header: React.FC = () => {
  const { user } = useAuth();

  return (
    <header className="bg-navy-900 text-white">
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          <div className="flex items-center">
            <Link to="/" className="flex items-center">
              <img src="/images/logo.svg" alt="Promethios" className="h-8 w-auto" />
              <span className="ml-2 text-xl font-bold">PROMETHIOS</span>
            </Link>
            <nav className="hidden md:flex ml-10 space-x-8">
              <Link to="/learn" className="text-gray-300 hover:text-white transition-colors">
                Learn
              </Link>
              <Link to="/api" className="text-gray-300 hover:text-white transition-colors">
                API
              </Link>
              <Link to="/solutions" className="text-gray-300 hover:text-white transition-colors">
                Solutions
              </Link>
              <Link to="/dashboard" className="text-gray-300 hover:text-white transition-colors">
                Dashboard
              </Link>
              <Link to="/governance" className="text-gray-300 hover:text-white transition-colors">
                AI Governance
              </Link>
              <div className="relative group">
                <button className="text-gray-300 hover:text-white transition-colors flex items-center">
                  About
                  <svg className="ml-1 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                <div className="absolute left-0 mt-2 w-48 bg-gray-800 rounded-md shadow-lg py-1 z-10 hidden group-hover:block">
                  <Link to="/about/company" className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-700">
                    Company
                  </Link>
                  <Link to="/about/team" className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-700">
                    Team
                  </Link>
                  <Link to="/about/careers" className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-700">
                    Careers
                  </Link>
                </div>
              </div>
            </nav>
          </div>
          <div>
            {user ? (
              <Link
                to="/dashboard"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                Dashboard
              </Link>
            ) : (
              <Link
                to="/login"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
