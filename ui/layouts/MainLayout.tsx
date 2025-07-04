import React from 'react';
import styled from 'styled-components';
import { ObserverAgent } from '../components/observer/ObserverAgent';
import { CollapsibleNavigation, NavItem } from '../components/navigation/CollapsibleNavigation';
import { useLocalStorage } from '../hooks/useLocalStorage';

// Types
interface MainLayoutProps {
  children: React.ReactNode;
  showObserver?: boolean;
  currentPath?: string;
}

// Styled Components
const LayoutContainer = styled.div`
  display: flex;
  height: 100vh;
  width: 100%;
  overflow: hidden;
`;

const MainContent = styled.main<{ navExpanded: boolean }>`
  margin-left: ${props => props.navExpanded ? '260px' : '60px'};
  width: calc(100% - ${props => props.navExpanded ? '260px' : '60px'});
  transition: margin-left 250ms ease, width 250ms ease;
  overflow-y: auto;
  padding: 20px;
  background-color: #0D1117;
  color: #FFFFFF;
`;

/**
 * MainLayout Component
 * 
 * Primary layout component that includes the collapsible navigation and
 * conditionally renders the Observer agent on all screens where cognitive interpretation,
 * trust reflection, or role-based behavior are visible or guided.
 * 
 * @param {MainLayoutProps} props - Component props
 * @returns {JSX.Element} - Rendered component
 */
export const MainLayout: React.FC<MainLayoutProps> = ({
  children,
  showObserver = false,
  currentPath = '/dashboard'
}) => {
  // Navigation state
  const [navExpanded, setNavExpanded] = useLocalStorage('navExpanded', false);
  
  // Navigation items
  const navItems: NavItem[] = [
    { 
      id: 'dashboard', 
      icon: <span>📊</span>, 
      label: 'Dashboard', 
      path: '/dashboard',
      active: currentPath === '/dashboard'
    },
    { 
      id: 'agents', 
      icon: <span>👤</span>, 
      label: 'Agents', 
      path: '/agents/wrapping',
      active: currentPath.startsWith('/agents')
    },
    { 
      id: 'multi-agent', 
      icon: <span>🔄</span>, 
      label: 'Multi-Agent', 
      path: '/multi-agent',
      active: currentPath === '/multi-agent'
    },
    { 
      id: 'governance', 
      icon: <span>🧠</span>, 
      label: 'Enhanced Veritas', 
      path: '/governance',
      active: currentPath.startsWith('/governance')
    },
    { 
      id: 'settings', 
      icon: <span>⚙️</span>, 
      label: 'Settings', 
      path: '/settings',
      active: currentPath.startsWith('/settings')
    }
  ];
  
  // Handle navigation toggle
  const handleNavToggle = () => {
    const newState = !navExpanded;
    setNavExpanded(newState);
    
    // Dispatch event for Observer to respond to
    window.dispatchEvent(new CustomEvent('navStateChange', {
      detail: { expanded: newState }
    }));
  };
  
  // Handle navigation item click
  const handleNavItemClick = (item: NavItem) => {
    console.log(`Navigating to: ${item.path}`);
    // Navigation logic would go here
  };
  
  // Check if current screen should show Observer
  // Observer appears on all screens where cognitive interpretation, trust reflection,
  // or role-based behavior are visible or guided
  const shouldShowObserver = () => {
    // Explicitly show Observer on these paths
    const observerPaths = [
      // Agent wrapping
      '/agents',
      '/agents/',
      
      // Multi-agent coordination config
      '/multi-agent',
      '/multi-agent/',
      
      // Dashboards with trust, reflection, or compliance metrics
      '/dashboard',
      '/dashboard/metrics',
      '/dashboard/trust',
      '/dashboard/compliance',
      
      // Tutorials and educational steps
      '/learn',
      '/tutorials',
      '/onboarding',
      
      // Governance Explorer and Enhanced Veritas
      '/governance',
      '/governance/',
      '/governance/dashboard',
      '/governance/emotional-veritas',
      '/governance/admin',
      
      // Testing environments
      '/test',
      '/playground',
      '/sandbox'
    ];
    
    // Explicitly hide Observer on these paths
    const nonObserverPaths = [
      // Settings
      '/settings/profile',
      '/settings/account',
      '/settings/api-keys',
      '/settings/theme',
      '/settings/notifications',
      
      // System logs with no UI context
      '/logs',
      '/system',
      
      // Other utility screens
      '/billing',
      '/subscription'
    ];
    
    // If showObserver prop is true, always show Observer
    if (showObserver) return true;
    
    // Check if current path matches any observer paths
    const matchesObserverPath = observerPaths.some(path => 
      currentPath === path || currentPath.startsWith(path + '/')
    );
    
    // Check if current path matches any non-observer paths
    const matchesNonObserverPath = nonObserverPaths.some(path => 
      currentPath === path || currentPath.startsWith(path + '/')
    );
    
    // Show Observer if path matches observer paths and doesn't match non-observer paths
    return matchesObserverPath && !matchesNonObserverPath;
  };

  return (
    <LayoutContainer>
      <CollapsibleNavigation
        items={navItems}
        logo={<span>P</span>}
        logoText="Promethios"
        onNavItemClick={handleNavItemClick}
      />
      
      <MainContent 
        navExpanded={navExpanded}
        data-testid="main-content"
      >
        {children}
      </MainContent>
      
      {/* Observer appears on all screens where cognitive interpretation, trust reflection, 
          or role-based behavior are visible or guided */}
      {shouldShowObserver() && (
        <ObserverAgent 
          initialMessage={`Welcome to ${currentPath.substring(1) || 'Promethios'}. I'm here to help with governance and trust.`}
        />
      )}
    </LayoutContainer>
  );
};

export default MainLayout;
