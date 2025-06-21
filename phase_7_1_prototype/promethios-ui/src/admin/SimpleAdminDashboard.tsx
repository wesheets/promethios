import React, { useState } from 'react';
import { useNavigate, Outlet, Routes, Route } from 'react-router-dom';
import { 
  HomeIcon, 
  ChartBarIcon, 
  UserGroupIcon, 
  CogIcon, 
  ShieldCheckIcon,
  Squares2X2Icon,
  DocumentTextIcon,
  ExclamationCircleIcon,
  CheckCircleIcon,
  ChatBubbleLeftIcon,
  CloudArrowUpIcon,
  IdentificationIcon,
  HeartIcon,
  PuzzlePieceIcon,
  CircleStackIcon,
  QuestionMarkCircleIcon,
  BookOpenIcon
} from '@heroicons/react/24/outline';

// Simple Admin Dashboard without complex dependencies
const SimpleAdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState('overview');

  const navigationItems = [
    { id: 'overview', name: 'Overview', icon: HomeIcon, path: '/ui/admin/dashboard' },
    { id: 'agents', name: 'All Agents', icon: Squares2X2Icon, path: '/ui/admin/dashboard/agents' },
    { id: 'users', name: 'Users', icon: UserGroupIcon, path: '/ui/admin/dashboard/users' },
    { id: 'governance', name: 'Governance', icon: ShieldCheckIcon, path: '/ui/admin/dashboard/governance' },
    { id: 'veritas', name: 'Dual Veritas', icon: HeartIcon, path: '/ui/admin/dashboard/veritas' },
    { id: 'analytics', name: 'Analytics', icon: ChartBarIcon, path: '/ui/admin/dashboard/analytics' },
    { id: 'settings', name: 'Settings', icon: CogIcon, path: '/ui/admin/dashboard/settings' }
  ];

  const handleNavigation = (item: any) => {
    setActiveSection(item.id);
    navigate(item.path);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
          <div className="text-sm text-gray-300">
            System administration and user management
          </div>
        </div>
      </div>

      <div className="flex">
        {/* Sidebar Navigation */}
        <div className="w-64 bg-gray-800 min-h-screen border-r border-gray-700">
          <nav className="mt-6">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavigation(item)}
                  className={`w-full flex items-center px-6 py-3 text-left hover:bg-gray-700 transition-colors ${
                    activeSection === item.id ? 'bg-blue-600 text-white' : 'text-gray-300'
                  }`}
                >
                  <Icon className="h-5 w-5 mr-3" />
                  {item.name}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-6">
          <Routes>
            <Route path="/" element={<AdminOverview />} />
            <Route path="/agents" element={<AdminAgents />} />
            <Route path="/users" element={<AdminUsers />} />
            <Route path="/governance" element={<AdminGovernance />} />
            <Route path="/veritas" element={<AdminVeritas />} />
            <Route path="/analytics" element={<AdminAnalytics />} />
            <Route path="/settings" element={<AdminSettings />} />
          </Routes>
        </div>
      </div>
    </div>
  );
};

// Admin Overview Component
const AdminOverview: React.FC = () => (
  <div>
    <h2 className="text-3xl font-bold mb-6">System Overview</h2>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {/* Users Card */}
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-400 text-sm">Total Users</p>
            <p className="text-3xl font-bold text-blue-400">1,247</p>
            <div className="flex space-x-2 mt-2">
              <span className="bg-green-600 text-white px-2 py-1 rounded text-xs">1150 Active</span>
              <span className="bg-purple-600 text-white px-2 py-1 rounded text-xs">97 Admins</span>
            </div>
          </div>
          <UserGroupIcon className="h-12 w-12 text-blue-400" />
        </div>
      </div>

      {/* Agents Card */}
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-400 text-sm">Active Agents</p>
            <p className="text-3xl font-bold text-green-400">247</p>
            <div className="flex space-x-2 mt-2">
              <span className="bg-green-600 text-white px-2 py-1 rounded text-xs">Healthy</span>
              <span className="bg-yellow-600 text-white px-2 py-1 rounded text-xs">3 Warnings</span>
            </div>
          </div>
          <Squares2X2Icon className="h-12 w-12 text-green-400" />
        </div>
      </div>

      {/* Governance Card */}
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-400 text-sm">Governance Score</p>
            <p className="text-3xl font-bold text-yellow-400">78%</p>
            <div className="flex space-x-2 mt-2">
              <span className="bg-yellow-600 text-white px-2 py-1 rounded text-xs">Needs Improvement</span>
            </div>
          </div>
          <ShieldCheckIcon className="h-12 w-12 text-yellow-400" />
        </div>
      </div>

      {/* System Health Card */}
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-400 text-sm">System Health</p>
            <p className="text-3xl font-bold text-red-400">Needs Review</p>
            <div className="flex space-x-2 mt-2">
              <span className="bg-red-600 text-white px-2 py-1 rounded text-xs">3 Issues</span>
            </div>
          </div>
          <ExclamationCircleIcon className="h-12 w-12 text-red-400" />
        </div>
      </div>
    </div>

    {/* Quick Actions */}
    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
      <h3 className="text-xl font-semibold mb-4">Quick Actions</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg flex items-center justify-center space-x-2 transition-colors">
          <UserGroupIcon className="h-5 w-5" />
          <span>Add User</span>
        </button>
        <button className="bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded-lg flex items-center justify-center space-x-2 transition-colors">
          <Squares2X2Icon className="h-5 w-5" />
          <span>Deploy Agent</span>
        </button>
        <button className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-3 rounded-lg flex items-center justify-center space-x-2 transition-colors">
          <DocumentTextIcon className="h-5 w-5" />
          <span>Export Data</span>
        </button>
        <button className="bg-red-600 hover:bg-red-700 text-white px-4 py-3 rounded-lg flex items-center justify-center space-x-2 transition-colors">
          <ShieldCheckIcon className="h-5 w-5" />
          <span>Security Audit</span>
        </button>
      </div>
    </div>
  </div>
);

// Placeholder components for other sections
const AdminAgents: React.FC = () => (
  <div>
    <h2 className="text-3xl font-bold mb-6">All Agents Management</h2>
    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
      <p className="text-gray-300">Comprehensive agents management with filtering capabilities coming soon...</p>
      <div className="mt-4 text-sm text-gray-400">
        <p>• View all 247+ agents in the system</p>
        <p>• Filter by type, status, organization, trust scores</p>
        <p>• Bulk operations for agent management</p>
        <p>• Real-time health monitoring</p>
      </div>
    </div>
  </div>
);

const AdminUsers: React.FC = () => (
  <div>
    <h2 className="text-3xl font-bold mb-6">User Management</h2>
    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
      <p className="text-gray-300">User management interface...</p>
    </div>
  </div>
);

const AdminGovernance: React.FC = () => (
  <div>
    <h2 className="text-3xl font-bold mb-6">Governance Management</h2>
    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
      <p className="text-gray-300">Governance policies and compliance management...</p>
    </div>
  </div>
);

const AdminVeritas: React.FC = () => (
  <div>
    <h2 className="text-3xl font-bold mb-6">Dual Veritas Control Center</h2>
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Veritas v1 Controls */}
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <h3 className="text-xl font-semibold mb-4 text-blue-400">Veritas v1 (Hallucination Detection)</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-gray-300">Status</span>
            <span className="bg-red-600 text-white px-3 py-1 rounded text-sm">Disabled</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-300">Detection Rate</span>
            <span className="text-white">99.8%</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-300">Governance Impact</span>
            <span className="text-red-400">-15.4 points</span>
          </div>
          <button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded transition-colors">
            Enable Veritas v1
          </button>
        </div>
      </div>

      {/* Emotional Veritas v2 Controls */}
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <h3 className="text-xl font-semibold mb-4 text-green-400">Emotional Veritas v2 (Nuanced System)</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-gray-300">Status</span>
            <span className="bg-green-600 text-white px-3 py-1 rounded text-sm">Active</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-300">Emotional Satisfaction</span>
            <span className="text-green-400">91.8%</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-300">Governance Impact</span>
            <span className="text-green-400">+6.8 points</span>
          </div>
          <button className="w-full bg-red-600 hover:bg-red-700 text-white py-2 rounded transition-colors">
            Disable Emotional Veritas
          </button>
        </div>
      </div>
    </div>

    {/* A/B Testing Controls */}
    <div className="mt-6 bg-gray-800 rounded-lg p-6 border border-gray-700">
      <h3 className="text-xl font-semibold mb-4 text-purple-400">A/B Testing Configuration</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <button className="bg-purple-600 hover:bg-purple-700 text-white py-3 rounded transition-colors">
          Start A/B Test
        </button>
        <button className="bg-gray-600 hover:bg-gray-700 text-white py-3 rounded transition-colors">
          View Results
        </button>
        <button className="bg-yellow-600 hover:bg-yellow-700 text-white py-3 rounded transition-colors">
          Export Metrics
        </button>
      </div>
    </div>
  </div>
);

const AdminAnalytics: React.FC = () => (
  <div>
    <h2 className="text-3xl font-bold mb-6">Analytics Dashboard</h2>
    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
      <p className="text-gray-300">Analytics and reporting interface...</p>
    </div>
  </div>
);

const AdminSettings: React.FC = () => (
  <div>
    <h2 className="text-3xl font-bold mb-6">System Settings</h2>
    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
      <p className="text-gray-300">System configuration and settings...</p>
    </div>
  </div>
);

export default SimpleAdminDashboard;

