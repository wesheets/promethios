import { useNavigate, Outlet } from 'react-router-dom';
import { useAdminDashboard } from './AdminDashboardContext';

// Import icons
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

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'compliant':
      case 'active':
        return 'text-green-400';
      case 'warning':
        return 'text-yellow-400';
      case 'violation':
      case 'error':
        return 'text-red-400';
      default:
        return 'text-gray-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'compliant':
      case 'active':
        return <CheckCircleIcon className="h-4 w-4" />;
      case 'warning':
        return <ExclamationCircleIcon className="h-4 w-4" />;
      case 'violation':
      case 'error':
        return <ExclamationCircleIcon className="h-4 w-4" />;
      default:
        return <QuestionMarkCircleIcon className="h-4 w-4" />;
    }
  };

  return (
    <div className="bg-navy-700 rounded-lg p-4 mb-4">
      <h3 className="text-sm font-medium text-gray-300 mb-3">Governance Status</h3>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            {getStatusIcon(vigilComplianceStatus.vigil_monitoring)}
            <span className="ml-2 text-sm text-gray-300">Vigil Monitoring</span>
          </div>
          <span className={`text-sm font-medium ${getStatusColor(vigilComplianceStatus.vigil_monitoring)}`}>
            {vigilComplianceStatus.vigil_monitoring}
          </span>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            {getStatusIcon(vigilComplianceStatus.prism_transparency)}
            <span className="ml-2 text-sm text-gray-300">PRISM Transparency</span>
          </div>
          <span className={`text-sm font-medium ${getStatusColor(vigilComplianceStatus.prism_transparency)}`}>
            {vigilComplianceStatus.prism_transparency}
          </span>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            {getStatusIcon(vigilComplianceStatus.veritas_fact_checking)}
            <span className="ml-2 text-sm text-gray-300">Veritas Fact-checking</span>
          </div>
          <span className={`text-sm font-medium ${getStatusColor(vigilComplianceStatus.veritas_fact_checking)}`}>
            {vigilComplianceStatus.veritas_fact_checking}
          </span>
        </div>
        
        {vigilComplianceStatus.hallucination_prevented && (
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <CheckCircleIcon className="h-4 w-4" />
              <span className="ml-2 text-sm text-gray-300">Hallucination Prevention</span>
            </div>
            <span className="text-sm font-medium text-green-400">Active</span>
          </div>
        )}
      </div>
      
      {vigilMetrics && (
        <div className="mt-3 pt-3 border-t border-navy-600">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-300">Trust Score</span>
            <span className="text-sm font-medium text-blue-400">{vigilMetrics.trust_score}%</span>
          </div>
        </div>
      )}
    </div>
  );
};

const AdminDashboardLayout: React.FC = () => {
  const navigate = useNavigate();
  const { 
    currentSection, 
    setCurrentSection, 
    expandedSections, 
    toggleSectionExpansion,
    vigilComplianceStatus,
    vigilMetrics,
    refreshVigilData,
    currentUser
  } = useAdminDashboard();

  // Navigation items configuration
  const navItems: NavItem[] = [
    { 
      id: 'overview', 
      name: 'Overview', 
      icon: HomeIcon, 
      path: '/admin/dashboard/overview' 
    },
    { 
      id: 'analytics', 
      name: 'Analytics', 
      icon: ChartBarIcon, 
      path: '/admin/dashboard/analytics' 
    },
    { 
      id: 'governance', 
      name: 'Governance', 
      icon: ShieldCheckIcon, 
      path: '/admin/dashboard/governance',
      children: [
        { id: 'governance-overview', name: 'Overview', icon: HomeIcon, path: '/admin/dashboard/governance/overview' },
        { id: 'governance-policies', name: 'Policies', icon: DocumentTextIcon, path: '/admin/dashboard/governance/policies' },
        { id: 'governance-violations', name: 'Violations', icon: ExclamationCircleIcon, path: '/admin/dashboard/governance/violations' },
        { id: 'governance-reports', name: 'Reports', icon: DocumentTextIcon, path: '/admin/dashboard/governance/reports' },
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
      icon: Squares2X2Icon, 
      path: '/admin/dashboard/agents',
      children: [
        { id: 'agents-management', name: 'All Agents', icon: Squares2X2Icon, path: '/admin/dashboard/agents-management' },
        { id: 'agents-wrapping', name: 'Agent Wrapping', icon: PuzzlePieceIcon, path: '/admin/dashboard/agents/wrapping' },
        { id: 'agents-chat', name: 'Chat', icon: ChatBubbleLeftIcon, path: '/admin/dashboard/agents/chat' },
        { id: 'agents-deploy', name: 'Deploy', icon: CloudArrowUpIcon, path: '/admin/dashboard/agents/deploy' },
        { id: 'agents-registry', name: 'Registry', icon: Squares2X2Icon, path: '/admin/dashboard/agents/registry' },
        { id: 'agents-scorecard', name: 'Scorecard', icon: DocumentTextIcon, path: '/admin/dashboard/agents/scorecard' },
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
        { id: 'settings-integrations', name: 'Integrations', icon: PuzzlePieceIcon, path: '/admin/dashboard/settings/integrations' },
        { id: 'settings-data-management', name: 'Data Management', icon: CircleStackIcon, path: '/admin/dashboard/settings/data-management' }
      ]
    },
    { 
      id: 'help', 
      name: 'Help & Support', 
      icon: QuestionMarkCircleIcon, 
      path: '/admin/dashboard/help',
      children: [
        { id: 'help-documentation', name: 'Documentation', icon: BookOpenIcon, path: '/admin/dashboard/help/documentation' },
        { id: 'help-support', name: 'Support', icon: QuestionMarkCircleIcon, path: '/admin/dashboard/help/support' }
      ]
    }
  ];

  // Filter navigation items based on user permissions (if needed)
  const filteredNavItems = navItems.filter(item => {
    // Add permission checking logic here if needed
    return true;
  });

  // Check if a section is expanded
  const isSectionExpanded = (item: NavItem): boolean => {
    return expandedSections.includes(item.id);
  };

  // Handle navigation click
  const handleNavClick = (sectionId: string, path: string) => {
    setCurrentSection(sectionId);
    navigate(path);
  };

  return (
    <div className="flex h-screen bg-navy-900 text-white">
      {/* Sidebar */}
      <div className="w-64 bg-navy-800 border-r border-navy-700 flex flex-col">
        {/* Logo/Brand */}
        <div className="p-4 border-b border-navy-700">
          <div className="flex items-center">
            <img src="/PROMETHIOSLOGO1.png" alt="Promethios Logo" className="h-8 mr-2" />
            <div>
              <h1 className="text-xl font-bold text-blue-400">Promethios Admin</h1>
              <p className="text-sm text-gray-400">Governance Dashboard</p>
            </div>
          </div>
        </div>

        {/* Governance Status Summary */}
        <div className="p-4">
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
                {item.children && isSectionExpanded(item) && (
                  <li>
                    <ul className="bg-navy-900">
                      {item.children.map((child) => (
                        <li key={child.id}>
                          <div
                            className={`flex items-center px-8 py-2 text-sm cursor-pointer ${
                              currentSection === child.id
                                ? 'bg-blue-800 text-blue-200 border-l-4 border-blue-400'
                                : 'text-gray-400 hover:bg-navy-700 hover:text-gray-200'
                            }`}
                            onClick={() => handleNavClick(child.id, child.path)}
                          >
                            <child.icon className="h-4 w-4 mr-3" />
                            <span>{child.name}</span>
                            
                            {/* Child badge */}
                            {child.badge && (
                              <span className={`
                                ml-auto inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none rounded-full
                                ${child.badge.type === 'error' ? 'bg-red-500 text-white' : 
                                  child.badge.type === 'warning' ? 'bg-yellow-500 text-navy-900' : 
                                  child.badge.type === 'success' ? 'bg-green-500 text-white' : 
                                  'bg-blue-500 text-white'}
                              `}>
                                {child.badge.count}
                              </span>
                            )}
                          </div>
                        </li>
                      ))}
                    </ul>
                  </li>
                )}
              </React.Fragment>
            ))}
          </ul>
        </nav>
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

