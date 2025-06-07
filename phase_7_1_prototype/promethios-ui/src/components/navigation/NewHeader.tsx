import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

interface NewHeaderProps {
  className?: string;
}

const NewHeader: React.FC<NewHeaderProps> = ({ className }) => {
  const { user, logout } = useAuth();
  const { isDarkMode, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'} border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'} ${className}`}>
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo and brand */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center">
              <span className="text-blue-500 text-2xl font-bold mr-2">P</span>
              <span className="font-bold text-xl">PROMETHIOS</span>
            </Link>
          </div>

          {/* Main navigation */}
          <nav className="hidden md:flex space-x-8">
            <Link 
              to="/learn" 
              className={`px-3 py-2 text-sm font-medium ${isActive('/learn') ? 'text-blue-500' : isDarkMode ? 'text-gray-300 hover:text-white' : 'text-gray-700 hover:text-gray-900'}`}
            >
              Learn
            </Link>
            <Link 
              to="/api" 
              className={`px-3 py-2 text-sm font-medium ${isActive('/api') ? 'text-blue-500' : isDarkMode ? 'text-gray-300 hover:text-white' : 'text-gray-700 hover:text-gray-900'}`}
            >
              API
            </Link>
            <Link 
              to="/solutions" 
              className={`px-3 py-2 text-sm font-medium ${isActive('/solutions') ? 'text-blue-500' : isDarkMode ? 'text-gray-300 hover:text-white' : 'text-gray-700 hover:text-gray-900'}`}
            >
              Solutions
            </Link>
            <Link 
              to="/ui/dashboard" 
              className={`px-3 py-2 text-sm font-medium ${isActive('/ui/dashboard') ? 'text-blue-500' : isDarkMode ? 'text-gray-300 hover:text-white' : 'text-gray-700 hover:text-gray-900'}`}
            >
              Dashboard
            </Link>
            <Link 
              to="/ai-governance" 
              className={`px-3 py-2 text-sm font-medium ${isActive('/ai-governance') ? 'text-blue-500' : isDarkMode ? 'text-gray-300 hover:text-white' : 'text-gray-700 hover:text-gray-900'}`}
            >
              AI Governance
            </Link>
            <div className="relative">
              <button 
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className={`px-3 py-2 text-sm font-medium ${isActive('/about') ? 'text-blue-500' : isDarkMode ? 'text-gray-300 hover:text-white' : 'text-gray-700 hover:text-gray-900'}`}
              >
                About <span className="ml-1">▼</span>
              </button>
              {userMenuOpen && (
                <div className={`absolute right-0 mt-2 w-48 rounded-md shadow-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'} ring-1 ring-black ring-opacity-5`}>
                  <div className="py-1" role="menu" aria-orientation="vertical" aria-labelledby="options-menu">
                    <Link 
                      to="/about/company" 
                      className={`block px-4 py-2 text-sm ${isDarkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100'}`}
                    >
                      Company
                    </Link>
                    <Link 
                      to="/about/team" 
                      className={`block px-4 py-2 text-sm ${isDarkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100'}`}
                    >
                      Team
                    </Link>
                    <Link 
                      to="/about/careers" 
                      className={`block px-4 py-2 text-sm ${isDarkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100'}`}
                    >
                      Careers
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </nav>

          {/* User section */}
          <div className="flex items-center">
            <button 
              onClick={toggleTheme} 
              className="p-2 rounded-full text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              {isDarkMode ? '☀️' : '🌙'}
            </button>
            
            {user ? (
              <div className="relative ml-4">
                <button 
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center space-x-2 focus:outline-none"
                >
                  <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white">
                    {user.email ? user.email.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <span className="hidden md:block">{user.email || 'User'}</span>
                </button>
                {userMenuOpen && (
                  <div className={`absolute right-0 mt-2 w-48 rounded-md shadow-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'} ring-1 ring-black ring-opacity-5`}>
                    <div className="py-1" role="menu" aria-orientation="vertical" aria-labelledby="options-menu">
                      <Link 
                        to="/ui/dashboard" 
                        className={`block px-4 py-2 text-sm ${isDarkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100'}`}
                      >
                        Dashboard
                      </Link>
                      <Link 
                        to="/settings" 
                        className={`block px-4 py-2 text-sm ${isDarkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100'}`}
                      >
                        Settings
                      </Link>
                      <button 
                        onClick={handleLogout}
                        className={`block w-full text-left px-4 py-2 text-sm ${isDarkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100'}`}
                      >
                        Sign out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="ml-4 flex items-center md:ml-6">
                <Link 
                  to="/login" 
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  Sign in
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default NewHeader;
