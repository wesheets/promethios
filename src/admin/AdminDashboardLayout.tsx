/**
 * Admin Dashboard Layout Component
 * 
 * This component provides the main layout structure for the admin dashboard,
 * including the header, sidebar navigation, and content area.
 */

import React from 'react';
import { Outlet } from 'react-router-dom';
import { useAdminDashboard } from './AdminDashboardContext';

// Import icons
import { 
  HomeIcon, 
  ChartBarIcon, 
  UserGroupIcon, 
  CogIcon, 
  ShieldCheckIcon,
  ViewGridIcon,
  DocumentReportIcon
} from '@heroicons/react/outline';

// Navigation item interface
interface NavItem {
  id: string;
  name: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  path: string;
  requiredPermission?: string;
}

// Navigation sections
const navItems: NavItem[] = [
  { id: 'overview', name: 'Overview', icon: HomeIcon, path: '/admin/dashboard' },
  { id: 'metrics', name: 'Metrics', icon: ChartBarIcon, path: '/admin/dashboard/metrics' },
  { id: 'agents', name: 'Agent Management', icon: ViewGridIcon, path: '/admin/dashboard/agents' },
  { id: 'users', name: 'User Management', icon: UserGroupIcon, path: '/admin/dashboard/users', requiredPermission: 'manageUsers' },
  { id: 'roles', name: 'Roles & Permissions', icon: ShieldCheckIcon, path: '/admin/dashboard/roles', requiredPermission: 'manageRoles' },
  { id: 'analytics', name: 'Analytics', icon: DocumentReportIcon, path: '/admin/dashboard/analytics' },
  { id: 'settings', name: 'Settings', icon: CogIcon, path: '/admin/dashboard/settings' }
];

const AdminDashboardLayout: React.FC = () => {
  const { 
    currentUser, 
    isAdmin, 
    currentSection, 
    setCurrentSection,
    userPermissions,
    isLoading,
    error
  } = useAdminDashboard();

  // Filter navigation items based on permissions
  const filteredNavItems = navItems.filter(item => {
    if (!item.requiredPermission) return true;
    return isAdmin || userPermissions.includes(item.requiredPermission);
  });

  // Handle navigation item click
  const handleNavClick = (id: string) => {
    setCurrentSection(id);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen w-full bg-navy-900">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen w-full bg-navy-900">
        <div className="bg-red-900 text-white p-4 rounded-lg shadow-lg max-w-lg">
          <h2 className="text-xl font-bold mb-2">Error</h2>
          <p>{error.message}</p>
        </div>
      </div>
    );
  }

  if (!currentUser || !isAdmin) {
    return (
      <div className="flex items-center justify-center h-screen w-full bg-navy-900">
        <div className="bg-navy-800 text-white p-4 rounded-lg shadow-lg max-w-lg">
          <h2 className="text-xl font-bold mb-2">Access Denied</h2>
          <p>You do not have permission to access the admin dashboard.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-navy-900 text-white">
      {/* Sidebar */}
      <div className="w-64 bg-navy-800 border-r border-navy-700 flex flex-col">
        {/* Dashboard Logo/Title */}
        <div className="p-4 border-b border-navy-700">
          <h1 className="text-xl font-bold text-blue-400">Promethios Admin</h1>
        </div>
        
        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4">
          <ul>
            {filteredNavItems.map((item) => (
              <li key={item.id}>
                <a
                  href={item.path}
                  onClick={(e) => {
                    e.preventDefault();
                    handleNavClick(item.id);
                  }}
                  className={`flex items-center px-4 py-3 text-sm ${
                    currentSection === item.id
                      ? 'bg-blue-900 text-blue-300 border-l-4 border-blue-500'
                      : 'text-gray-300 hover:bg-navy-700'
                  }`}
                >
                  <item.icon className="h-5 w-5 mr-3" />
                  {item.name}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        
        {/* User info */}
        <div className="p-4 border-t border-navy-700">
          <div className="flex items-center">
            <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center mr-3">
              {currentUser.displayName ? currentUser.displayName.charAt(0).toUpperCase() : 'A'}
            </div>
            <div>
              <p className="text-sm font-medium">{currentUser.displayName || currentUser.email}</p>
              <p className="text-xs text-gray-400">Administrator</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-navy-800 border-b border-navy-700 p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">
              {navItems.find(item => item.id === currentSection)?.name || 'Dashboard'}
            </h2>
            <div className="flex items-center space-x-4">
              {/* Additional header elements can go here */}
            </div>
          </div>
        </header>
        
        {/* Content Area - Full Width */}
        <main className="flex-1 overflow-y-auto bg-navy-900 p-6">
          <div className="container mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminDashboardLayout;
