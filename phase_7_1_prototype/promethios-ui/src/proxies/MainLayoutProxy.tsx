import React, { ReactNode, useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * MainLayoutProxy Component
 * 
 * This proxy component serves as a bridge to the MainLayout component in the /ui/ directory.
 * It provides the same layout structure with header, collapsible navigation, and content area.
 */
interface MainLayoutProxyProps {
  children: ReactNode;
}

// Custom tooltip component
interface TooltipProps {
  content: string;
  visible: boolean;
  x: number;
  y: number;
}

const Tooltip: React.FC<TooltipProps> = ({ content, visible, x, y }) => {
  if (!visible) return null;
  
  return (
    <div 
      className="absolute bg-gray-900 text-white text-xs rounded py-1 px-2 z-50 shadow-lg"
      style={{ 
        left: `${x + 20}px`, 
        top: `${y}px`,
        transform: 'translateY(-50%)'
      }}
    >
      {content}
      <div className="absolute w-2 h-2 bg-gray-900 transform rotate-45 left-0 top-1/2 -translate-x-1 -translate-y-1/2"></div>
    </div>
  );
};

const MainLayoutProxy: React.FC<MainLayoutProxyProps> = ({ children }) => {
  const location = useLocation();
  const { currentUser, logout } = useAuth();
  const [isNavExpanded, setIsNavExpanded] = useState(false);
  const [tooltip, setTooltip] = useState<{ content: string; visible: boolean; x: number; y: number }>({
    content: '',
    visible: false,
    x: 0,
    y: 0
  });
  
  // Navigation items with routes, icons, and labels
  const navItems = [
    {
      path: '/ui/dashboard',
      label: 'Dashboard',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
        </svg>
      )
    },
    {
      path: '/ui/agents',
      label: 'Agents',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
        </svg>
      ),
      subItems: [
        { path: '/ui/agents', label: 'Individual Agents' },
        { path: '/ui/agents/teams', label: 'Multi-Agent Teams' }
      ]
    },
    {
      path: '/ui/governance',
      label: 'Governance',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      ),
      subItems: [
        { path: '/ui/governance', label: 'Policies & Rules' },
        { path: '/ui/governance/teams', label: 'Teams' }
      ]
    },
    {
      path: '/ui/deploy',
      label: 'Deploy',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
        </svg>
      )
    },
    {
      path: '/ui/settings',
      label: 'Settings',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      )
    }
  ];
  
  // Hide tooltip when nav is expanded
  useEffect(() => {
    if (isNavExpanded) {
      setTooltip(prev => ({ ...prev, visible: false }));
    }
  }, [isNavExpanded]);
  
  // Handle logout
  const handleLogout = async () => {
    try {
      await logout();
      window.location.href = '/';
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };
  
  // Toggle navigation expansion
  const toggleNavExpansion = () => {
    setIsNavExpanded(!isNavExpanded);
  };
  
  // Show tooltip on hover
  const showTooltip = (e: React.MouseEvent, content: string) => {
    if (isNavExpanded) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    setTooltip({
      content,
      visible: true,
      x: rect.right,
      y: rect.top + rect.height / 2
    });
  };
  
  // Hide tooltip
  const hideTooltip = () => {
    setTooltip(prev => ({ ...prev, visible: false }));
  };

  return (
    <div className="flex flex-col h-screen">
      {/* Main content with collapsible navigation */}
      <div className="flex flex-1 overflow-hidden">
        {/* Collapsible navigation sidebar */}
        <div 
          className={`${isNavExpanded ? 'w-56' : 'w-16'} bg-gray-900 h-full flex flex-col py-4 shadow-lg transition-all duration-300`}
        >
          {/* Toggle button */}
          <button 
            onClick={toggleNavExpansion}
            className="self-end mr-3 mb-6 text-gray-400 hover:text-white transition-colors"
          >
            {isNavExpanded ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
              </svg>
            )}
          </button>
          
          {/* Navigation items */}
          <div className="flex flex-col items-center space-y-2">
            {navItems.map((item, index) => {
              const isActive = location.pathname.startsWith(item.path);
              const hasSubItems = item.subItems && item.subItems.length > 0;
              
              return (
                <div key={index} className="w-full flex flex-col items-center">
                  <Link
                    to={item.path}
                    className={`
                      ${isNavExpanded ? 'w-48 justify-start px-4' : 'w-10 justify-center'} 
                      h-10 rounded-md flex items-center transition-all duration-300
                      ${isActive 
                        ? 'bg-blue-600 text-white' 
                        : 'text-gray-400 hover:bg-gray-800 hover:text-white'}
                    `}
                    onMouseEnter={(e) => showTooltip(e, item.label)}
                    onMouseLeave={hideTooltip}
                  >
                    <div className="flex-shrink-0">{item.icon}</div>
                    {isNavExpanded && (
                      <span className="ml-3 text-sm font-medium">{item.label}</span>
                    )}
                  </Link>
                  
                  {/* Sub-menu items */}
                  {hasSubItems && isNavExpanded && (
                    <div className="w-48 ml-4 mt-1 space-y-1">
                      {item.subItems!.map((subItem, subIndex) => {
                        const isSubActive = location.pathname === subItem.path;
                        return (
                          <Link
                            key={subIndex}
                            to={subItem.path}
                            className={`
                              block px-4 py-2 text-xs rounded-md transition-colors
                              ${isSubActive 
                                ? 'bg-blue-500 text-white' 
                                : 'text-gray-300 hover:bg-gray-700 hover:text-white'}
                            `}
                          >
                            {subItem.label}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          
          {/* Tooltip for collapsed navigation */}
          <Tooltip 
            content={tooltip.content}
            visible={tooltip.visible}
            x={tooltip.x}
            y={tooltip.y}
          />
        </div>
        
        {/* Main content area */}
        <div className="flex-1 bg-gray-800 text-white overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
};

export default MainLayoutProxy;
