import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { motion } from 'framer-motion';

const Header: React.FC = () => {
  const { isDarkMode } = useTheme();
  const { currentUser, isAuthenticated, logout } = useAuth();
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const navigate = useNavigate();
  
  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };
  
  return (
    <header className={`sticky top-0 z-50 ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'} shadow-md`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          {/* Logo */}
          <div className="flex-shrink-0">
            <Link to="/" className="flex items-center">
              <img 
                src="/images/promethioslogonew.png" 
                alt="Promethios Logo" 
                className="h-8" 
              />
            </Link>
          </div>
          
          {/* Navigation */}
          <nav className="hidden md:flex space-x-10">
            {/* Conditional Navigation for Authenticated Users */}
            {isAuthenticated ? (
              <>
                <Link 
                  to="/dashboard" 
                  className={`text-base font-medium ${isDarkMode ? 'text-gray-300 hover:text-white' : 'text-gray-500 hover:text-gray-900'}`}
                >
                  Dashboard
                </Link>
                <Link 
                  to="/governance" 
                  className={`text-base font-medium ${isDarkMode ? 'text-gray-300 hover:text-white' : 'text-gray-500 hover:text-gray-900'}`}
                >
                  AI Governance
                </Link>
                <Link 
                  to="/benchmark" 
                  className={`text-base font-medium ${isDarkMode ? 'text-gray-300 hover:text-white' : 'text-gray-500 hover:text-gray-900'}`}
                >
                  Benchmarks
                </Link>
                <Link 
                  to="/documentation" 
                  className={`text-base font-medium ${isDarkMode ? 'text-gray-300 hover:text-white' : 'text-gray-500 hover:text-gray-900'}`}
                >
                  Documentation
                </Link>
              </>
            ) : null}
            
            {/* About Dropdown - Always visible */}
            <div className="relative">
              <button
                type="button"
                className={`group inline-flex items-center text-base font-medium ${isDarkMode ? 'text-gray-300 hover:text-white' : 'text-gray-500 hover:text-gray-900'} focus:outline-none`}
                onClick={() => setIsAboutOpen(!isAboutOpen)}
              >
                <span>About</span>
                <svg
                  className={`ml-2 h-5 w-5 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} group-hover:text-gray-500 transition-transform duration-150 ${isAboutOpen ? 'transform rotate-180' : ''}`}
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
              
              {/* Dropdown Menu */}
              {isAboutOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  className={`absolute left-1/2 transform -translate-x-1/2 mt-3 px-2 w-screen max-w-md sm:px-0 z-10`}
                >
                  <div className={`rounded-lg shadow-lg ring-1 ring-black ring-opacity-5 overflow-hidden ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
                    <div className="relative grid gap-6 px-5 py-6 sm:gap-8 sm:p-8">
                      <Link
                        to="/about"
                        className={`-m-3 p-3 flex items-start rounded-lg hover:bg-gray-100 ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}`}
                        onClick={() => setIsAboutOpen(false)}
                      >
                        <div className="ml-4">
                          <p className={`text-base font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                            What is Promethios
                          </p>
                          <p className={`mt-1 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                            Learn about our mission and vision for AI governance.
                          </p>
                        </div>
                      </Link>
                      <Link
                        to="/how-it-works"
                        className={`-m-3 p-3 flex items-start rounded-lg hover:bg-gray-100 ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}`}
                        onClick={() => setIsAboutOpen(false)}
                      >
                        <div className="ml-4">
                          <p className={`text-base font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                            How it Works
                          </p>
                          <p className={`mt-1 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                            Discover the technology behind our governance platform.
                          </p>
                        </div>
                      </Link>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          </nav>
          
          {/* Right side buttons */}
          <div className="flex items-center">
            {isAuthenticated ? (
              <div className="relative ml-3">
                <div>
                  <button
                    type="button"
                    className="flex items-center max-w-xs rounded-full focus:outline-none"
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  >
                    <span className="sr-only">Open user menu</span>
                    <div className={`h-8 w-8 rounded-full flex items-center justify-center ${isDarkMode ? 'bg-gray-700' : 'bg-blue-100'}`}>
                      <span className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-blue-800'}`}>
                        {currentUser?.email?.charAt(0).toUpperCase() || 'U'}
                      </span>
                    </div>
                    <span className="ml-2 text-sm font-medium truncate max-w-[120px]">
                      {currentUser?.email || 'User'}
                    </span>
                    <svg
                      className={`ml-2 h-5 w-5 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} transition-transform duration-150 ${isUserMenuOpen ? 'transform rotate-180' : ''}`}
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>
                </div>
                
                {isUserMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                    className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5 focus:outline-none"
                  >
                    <Link
                      to="/dashboard"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setIsUserMenuOpen(false)}
                    >
                      Dashboard
                    </Link>
                    <Link
                      to="/governance"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setIsUserMenuOpen(false)}
                    >
                      AI Governance
                    </Link>
                    <Link
                      to="/documentation"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setIsUserMenuOpen(false)}
                    >
                      Documentation
                    </Link>
                    <Link
                      to="/profile"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setIsUserMenuOpen(false)}
                    >
                      Your Profile
                    </Link>
                    <Link
                      to="/settings"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setIsUserMenuOpen(false)}
                    >
                      Settings
                    </Link>
                    <button
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        handleLogout();
                      }}
                    >
                      Sign out
                    </button>
                  </motion.div>
                )}
              </div>
            ) : (
              <Link
                to="/waitlist"
                className="ml-8 whitespace-nowrap inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-blue-600 hover:bg-blue-700"
              >
                Protect My Agent
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
