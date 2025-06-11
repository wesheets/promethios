import React from 'react';
import { useNavigate, Outlet } from 'react-router-dom';
import { useAdminDashboard } from './AdminDashboardContext';

// Import icons
import { 
  HomeIcon, 
  ChartBarIcon, 
  UserGroupIcon, 
  CogIcon, 
  ShieldCheckIcon,
  ViewGridIcon,
  DocumentReportIcon,
  ExclamationCircleIcon,
  CheckCircleIcon,
  ChatIcon,
  CloudUploadIcon,
  IdentificationIcon,
  HeartIcon,
  PuzzleIcon,
  DatabaseIcon,
  QuestionMarkCircleIcon,
  BookOpenIcon
} from '@heroicons/react/outline';

// Navigation item interface
interface NavItem {
  id: string;
  name: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  path: string;
  requiredPermission?: string;
  badge?: {
    count: number;
    type: 'warning' | 'error' | 'success' | 'info';
  };
  children?: NavItem[];
}

// Governance Status Summary component
const GovernanceStatusSummary: React.FC = () => {
  const { vigilComplianceStatus, vigilMetrics } = useAdminDashboard();
  
  if (!vigilComplianceStatus || !vigilMetrics) {
    return (
      <div className="bg-navy-700 rounded-lg p-4 mb-4">
        <div className="flex items-center">
          <div className="animate-pulse h-4 w-4 bg-gray-500 rounded-full mr-2"></div>
          <p className="text-gray-400 text-sm">Loading governance status...</p>
        </div>
      </div>
    );
  }
  
  const { compliant, violationCount, enforcementCount, complianceScore } = vigilComplianceStatus;
  
  // Determine status color
  const getStatusColor = () => {
    if (compliant) return 'bg-green-500';
    if (violationCount > 0) {
      const criticalCount = vigilMetrics?.violations?.bySeverity?.critical || 0;
      return criticalCount > 0 ? 'bg-red-500' : 'bg-yellow-500';
    }
    return 'bg-gray-500';
  };
  
  // Determine status icon
  const StatusIcon = compliant ? CheckCircleIcon : ExclamationCircleIcon;
  
  return (
    <div className="bg-navy-700 rounded-lg p-4 mb-4">
      <h3 className="text-sm font-medium text-gray-300 mb-2">Governance Status</h3>
      
      <div className="flex items-center mb-3">
        <div className={`h-4 w-4 ${getStatusColor()} rounded-full mr-2`}></div>
        <p className="text-sm font-medium">
          {compliant ? 'Compliant' : 'Violations Detected'}
        </p>
      </div>
      
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="bg-navy-800 p-2 rounded">
          <p className="text-gray-400">Compliance Score</p>
          <p className="text-lg font-bold">{complianceScore}%</p>
        </div>
        <div className="bg-navy-800 p-2 rounded">
          <p className="text-gray-400">Violations</p>
          <p className="text-lg font-bold">{violationCount}</p>
        </div>
      </div>
    </div>
  );
};

// Recent Activity component
const RecentActivity: React.FC = () => {
  const { vigilObservations } = useAdminDashboard();
  
  if (!vigilObservations || vigilObservations.length === 0) {
    return (
      <div className="bg-navy-700 rounded-lg p-4">
        <h3 className="text-sm font-medium text-gray-300 mb-2">Recent Activity</h3>
        <p className="text-sm text-gray-400">No recent activity</p>
      </div>
    );
  }
  
  // Get the 5 most recent observations
  const recentObservations = vigilObservations.slice(0, 5);
  
  return (
    <div className="bg-navy-700 rounded-lg p-4">
      <h3 className="text-sm font-medium text-gray-300 mb-2">Recent Activity</h3>
      <ul className="space-y-2">
        {recentObservations.map((observation) => (
          <li key={observation.id} className="text-xs border-l-2 border-blue-500 pl-2">
            <p className="font-medium">{observation.message}</p>
            <p className="text-gray-400">
              {new Date(observation.timestamp).toLocaleString()}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
};

const AdminDashboardLayout: React.FC = () => {
  const navigate = useNavigate(); // Add useNavigate hook
  
  const { 
    currentUser, 
    isAdmin, 
    currentSection, 
    setCurrentSection,
    userPermissions,
    isLoading,
    error,
    vigilMetrics,
    refreshVigilData
  } = useAdminDashboard();

  // Create navigation items with badges from vigilMetrics
  const getNavItems = (): NavItem[] => {
    const baseNavItems: NavItem[] = [
      { id: 'overview', name: 'Overview', icon: HomeIcon, path: '/admin/dashboard' },
      { 
        id: 'governance', 
        name: 'Governance', 
        icon: ShieldCheckIcon, 
        path: '/admin/dashboard/governance',
        children: [
          { id: 'governance-overview', name: 'Overview', icon: HomeIcon, path: '/admin/dashboard/governance/overview' },
          { id: 'governance-policies', name: 'Policies', icon: DocumentReportIcon, path: '/admin/dashboard/governance/policies' },
          { id: 'governance-violations', name: 'Violations', icon: ExclamationCircleIcon, path: '/admin/dashboard/governance/violations' },
          { id: 'governance-reports', name: 'Reports', icon: DocumentReportIcon, path: '/admin/dashboard/governance/reports' },
          { id: 'governance-emotional-veritas', name: 'Emotional Veritas', icon: HeartIcon, path: '/admin/dashboard/governance/emotional-veritas' }
        ]
      },
      { 
        id: 'trust-metrics', 
        name: 'Trust Metrics', 
        icon: ChartBarIcon, 
        path: '/admin/dashboard/trust-metrics',
        children: [
          { id: 'trust-metrics-overview', name: 'Overview', icon: HomeIcon, path: '/admin/dashboard/trust-metrics/overview' },
          { id: 'trust-metrics-boundaries', name: 'Boundaries', icon: ShieldCheckIcon, path: '/admin/dashboard/trust-metrics/boundaries' },
          { id: 'trust-metrics-attestations', name: 'Attestations', icon: CheckCircleIcon, path: '/admin/dashboard/trust-metrics/attestations' }
        ]
      },
      { 
        id: 'agents', 
        name: 'Agents', 
        icon: ViewGridIcon, 
        path: '/admin/dashboard/agents',
        children: [
          { id: 'agents-wrapping', name: 'Agent Wrapping', icon: PuzzleIcon, path: '/admin/dashboard/agents/wrapping' },
          { id: 'agents-chat', name: 'Chat', icon: ChatIcon, path: '/admin/dashboard/agents/chat' },
          { id: 'agents-deploy', name: 'Deploy', icon: CloudUploadIcon, path: '/admin/dashboard/agents/deploy' },
          { id: 'agents-registry', name: 'Registry', icon: ViewGridIcon, path: '/admin/dashboard/agents/registry' },
          { id: 'agents-scorecard', name: 'Scorecard', icon: DocumentReportIcon, path: '/admin/dashboard/agents/scorecard' },
          { id: 'agents-identity', name: 'Identity', icon: IdentificationIcon, path: '/admin/dashboard/agents/identity' },
          { id: 'agents-benchmarks', name: 'Benchmarks', icon: ChartBarIcon, path: '/admin/dashboard/agents/benchmarks' }
        ]
      },
      { 
        id: 'settings', 
        name: 'Settings', 
        icon: CogIcon, 
        path: '/admin/dashboard/settings',
        children: [
          { id: 'settings-profile', name: 'User Profile', icon: UserGroupIcon, path: '/admin/dashboard/settings/profile' },
          { id: 'settings-preferences', name: 'Preferences', icon: CogIcon, path: '/admin/dashboard/settings/preferences' },
          { id: 'settings-organization', name: 'Organization', icon: UserGroupIcon, path: '/admin/dashboard/settings/organization' },
          { id: 'settings-integrations', name: 'Integrations', icon: PuzzleIcon, path: '/admin/dashboard/settings/integrations' },
          { id: 'settings-data-management', name: 'Data Management', icon: DatabaseIcon, path: '/admin/dashboard/settings/data-management' }
        ]
      },
      { 
        id: 'help', 
        name: 'Help', 
        icon: QuestionMarkCircleIcon, 
        path: '/admin/dashboard/help',
        children: [
          { id: 'help-tours', name: 'Guided Tours', icon: BookOpenIcon, path: '/admin/dashboard/help/tours' },
          { id: 'help-documentation', name: 'Documentation', icon: DocumentReportIcon, path: '/admin/dashboard/help/documentation' },
          { id: 'help-support', name: 'Support', icon: QuestionMarkCircleIcon, path: '/admin/dashboard/help/support' }
        ]
      }
    ];
    
    // Add badges if we have vigilMetrics
    if (vigilMetrics) {
      // Add violation count badge to governance
      const violationCount = vigilMetrics.violations?.total || 0;
      if (violationCount > 0) {
        const governanceIndex = baseNavItems.findIndex(item => item.id === 'governance');
        if (governanceIndex !== -1) {
          baseNavItems[governanceIndex].badge = {
            count: violationCount,
            type: 'warning'
          };
        }
        
        // Add critical violations badge to violations
        const criticalCount = vigilMetrics.violations?.bySeverity?.critical || 0;
        if (criticalCount > 0 && baseNavItems[governanceIndex]?.children) {
          const violationsIndex = baseNavItems[governanceIndex].children.findIndex(item => item.id === 'governance-violations');
          if (violationsIndex !== -1) {
            baseNavItems[governanceIndex].children[violationsIndex].badge = {
              count: criticalCount,
              type: 'error'
            };
          }
        }
      }
    }
    
    return baseNavItems;
  };

  // Get navigation items with badges
  const navItems = getNavItems();

  // Filter navigation items based on permissions
  const filteredNavItems = navItems.filter(item => {
    if (!item.requiredPermission) return true;
    return isAdmin || userPermissions.includes(item.requiredPermission);
  });

  // Handle navigation item click - UPDATED to use navigate
  const handleNavClick = (id: string, path: string) => {
    setCurrentSection(id);
    navigate(path); // Use navigate to change routes
    console.log(`Navigating to: ${path}`); // Debug log
  };
  
  // Refresh data periodically
  React.useEffect(() => {
    if (isAdmin && !isLoading) {
      // Initial data load
      refreshVigilData();
      
      // Set up interval for refreshing data
      const intervalId = setInterval(() => {
        refreshVigilData();
      }, 60000); // Refresh every minute
      
      return () => clearInterval(intervalId);
    }
  }, [isAdmin, isLoading, refreshVigilData]);

  // Debug logs for authentication
  console.log('Current user:', currentUser);
  console.log('Is admin:', isAdmin);
  console.log('User permissions:', userPermissions);

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
    console.log('Access denied condition triggered');
    return (
      <div className="flex items-center justify-center h-screen w-full bg-navy-900">
        <div className="bg-navy-800 text-white p-4 rounded-lg shadow-lg max-w-lg">
          <h2 className="text-xl font-bold mb-2">Access Denied</h2>
          <p>You do not have permission to access the admin dashboard.</p>
        </div>
      </div>
    );
  }

  // Track expanded sections
  const [expandedSections, setExpandedSections] = React.useState<Record<string, boolean>>({});

  // Toggle section expansion
  const toggleSectionExpansion = (sectionId: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
  };

  // Check if a section should be expanded
  const isSectionExpanded = (item: NavItem): boolean => {
    // If explicitly set in state, use that value
    if (expandedSections[item.id] !== undefined) {
      return expandedSections[item.id];
    }
    
    // Otherwise, expand if current section is in this section's children
    if (item.children) {
      return item.children.some(child => child.id === currentSection);
    }
    
    return false;
  };

  return (
    <div className="flex h-screen bg-navy-900 text-white">
      {/* Sidebar */}
      <div className="w-64 bg-navy-800 border-r border-navy-700 flex flex-col">
        {/* Dashboard Logo/Title */}
        <div className="p-4 border-b border-navy-700">
          <h1 className="text-xl font-bold text-blue-400">Promethios Admin</h1>
        </div>
        
        {/* Governance Status Summary */}
        <div className="px-4 py-3">
          <GovernanceStatusSummary />
        </div>
        
        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-2">
          <ul>
            {filteredNavItems.map((item) => (
              <React.Fragment key={item.id}>
                <li>
                  <div
                    className={`flex items-center px-4 py-3 text-sm cursor-pointer ${
                      currentSection === item.id || (item.children && item.children.some(child => child.id === currentSection))
                        ? 'bg-blue-900 text-blue-300 border-l-4 border-blue-500'
                        : 'text-gray-300 hover:bg-navy-700'
                    }`}
                    onClick={() => {
                      if (item.children && item.children.length > 0) {
                        toggleSectionExpansion(item.id);
                      } else {
                        handleNavClick(item.id, item.path);
                      }
                    }}
                  >
                    <item.icon className="h-5 w-5 mr-3" />
                    <span className="flex-1">{item.name}</span>
                    
                    {/* Badge */}
                    {item.badge && (
                      <span className={`
                        inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none rounded-full
                        ${item.badge.type === 'error' ? 'bg-red-500 text-white' : 
                          item.badge.type === 'warning' ? 'bg-yellow-500 text-navy-900' : 
                          item.badge.type === 'success' ? 'bg-green-500 text-white' : 
                          'bg-blue-500 text-white'}
                      `}>
                        {item.badge.count}
                      </span>
                    )}
                    
                    {/* Expand/collapse indicator for items with children */}
                    {item.children && item.children.length > 0 && (
                      <svg
                        className={`h-4 w-4 transition-transform ${isSectionExpanded(item) ? 'transform rotate-90' : ''}`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    )}
                  </div>
                </li>
                
                {/* Children/subitems */}
                {item.children && item.children.length > 0 && isSectionExpanded(item) && (
                  <li>
                    <ul className="pl-4 py-1 bg-navy-900">
                      {item.children.map((child) => (
                        <li key={child.id}>
                          <a
                            href={child.path}
                            onClick={(e) => {
                              e.preventDefault();
                              handleNavClick(child.id, child.path);
                            }}
                            className={`flex items-center px-4 py-2 text-sm ${
                              currentSection === child.id
                                ? 'text-blue-300 bg-navy-800 rounded'
                                : 'text-gray-400 hover:text-gray-200'
                            }`}
                          >
                            <child.icon className="h-4 w-4 mr-2" />
                            <span className="flex-1">{child.name}</span>
                            
                            {/* Badge for child */}
                            {child.badge && (
                              <span className={`
                                inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none rounded-full
                                ${child.badge.type === 'error' ? 'bg-red-500 text-white' : 
                                  child.badge.type === 'warning' ? 'bg-yellow-500 text-navy-900' : 
                                  child.badge.type === 'success' ? 'bg-green-500 text-white' : 
                                  'bg-blue-500 text-white'}
                              `}>
                                {child.badge.count}
                              </span>
                            )}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </li>
                )}
              </React.Fragment>
            ))}
          </ul>
        </nav>
        
        {/* Recent Activity */}
        <div className="px-4 py-3">
          <RecentActivity />
        </div>
        
        {/* User info */}
        <div className="p-4 border-t border-navy-700">
          <div className="flex items-center">
            <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center mr-3">
              {currentUser?.displayName ? currentUser.displayName.charAt(0).toUpperCase() : 'A'}
            </div>
            <div>
              <p className="text-sm font-medium">{currentUser?.displayName || currentUser?.email || 'Admin User'}</p>
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
              {/* Find the current section name from the flat list of all items */}
              {(() => {
                // Create a flat list of all items including children
                const flattenItems = (items: NavItem[]): NavItem[] => {
                  return items.reduce((acc: NavItem[], item) => {
                    acc.push(item);
                    if (item.children) {
                      acc.push(...flattenItems(item.children));
                    }
                    return acc;
                  }, []);
                };
                
                const allItems = flattenItems(navItems);
                const currentItem = allItems.find(item => item.id === currentSection);
                return currentItem?.name || 'Dashboard';
              })()}
            </h2>
            <div className="flex items-center space-x-4">
              <button 
                onClick={() => refreshVigilData()}
                className="p-2 rounded-full hover:bg-navy-700 transition-colors duration-150"
                title="Refresh Data"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
              
              {/* User profile button - Added for header navigation */}
              <div className="relative">
                <button 
                  className="flex items-center space-x-2 p-2 rounded-full hover:bg-navy-700 transition-colors duration-150"
                  title="User Profile"
                >
                  <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center">
                    {currentUser?.displayName ? currentUser.displayName.charAt(0).toUpperCase() : 'A'}
                  </div>
                  <span className="hidden md:inline">{currentUser?.displayName || currentUser?.email || 'Admin User'}</span>
                </button>
              </div>
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
