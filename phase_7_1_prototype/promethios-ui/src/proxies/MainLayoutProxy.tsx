import React, { ReactNode } from 'react';

/**
 * MainLayoutProxy Component
 * 
 * This proxy component serves as a bridge to the MainLayout component in the /ui/ directory.
 * It provides the same layout structure with header, collapsible navigation, and content area.
 */
interface MainLayoutProxyProps {
  children: ReactNode;
}

const MainLayoutProxy: React.FC<MainLayoutProxyProps> = ({ children }) => {
  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <div className="bg-gray-900 text-white h-16 flex items-center px-6 shadow-md">
        <div className="flex items-center">
          {/* Promethios Logo */}
          <div className="flex items-center">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="mr-2">
              <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="#3B82F6" />
              <path d="M2 17L12 22L22 17V7L12 12L2 7V17Z" fill="#1E40AF" opacity="0.7" />
            </svg>
            <div className="text-blue-500 font-bold text-xl">PROMETHIOS</div>
          </div>
          <div className="text-gray-400 text-sm ml-4">Dashboard</div>
        </div>
        <div className="ml-auto flex items-center space-x-4">
          <div className="w-8 h-8 rounded-full bg-gray-700"></div>
          <div className="text-sm">wesheets@gmail.com</div>
        </div>
      </div>
      
      {/* Main content with collapsible navigation */}
      <div className="flex flex-1 overflow-hidden">
        {/* Collapsible navigation sidebar */}
        <div className="w-16 bg-gray-900 h-full flex flex-col items-center py-4 shadow-lg">
          {/* Navigation items */}
          <div className="w-8 h-8 rounded-full bg-blue-500 mb-6 cursor-pointer hover:bg-blue-400 transition-colors"></div>
          <div className="w-8 h-8 rounded-full bg-gray-700 mb-4 cursor-pointer hover:bg-gray-600 transition-colors"></div>
          <div className="w-8 h-8 rounded-full bg-gray-700 mb-4 cursor-pointer hover:bg-gray-600 transition-colors"></div>
          <div className="w-8 h-8 rounded-full bg-gray-700 mb-4 cursor-pointer hover:bg-gray-600 transition-colors"></div>
        </div>
        
        {/* Main content area */}
        <div className="flex-1 bg-gray-800 p-6 text-white overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
};

export default MainLayoutProxy;
