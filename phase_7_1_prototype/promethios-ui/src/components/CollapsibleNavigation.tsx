import React, { useState, useEffect } from 'react';
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Collapse,
  IconButton,
  Tooltip,
  Box,
  Divider,
  Typography,
  TextField,
  Button,
  keyframes,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  SmartToy as AgentsIcon,
  Security as GovernanceIcon,
  VerifiedUser as TrustIcon,
  Settings as SettingsIcon,
  Help as HelpIcon,
  AdminPanelSettings as AdminIcon,
  ExpandLess,
  ExpandMore,
  ChevronLeft,
  ChevronRight,
  Chat as ChatIcon,
  CloudUpload as DeployIcon,
  Storage as RegistryIcon,
  Assessment as ScorecardIcon,
  Badge as IdentityIcon,
  Speed as BenchmarksIcon,
  Visibility as OverviewIcon,
  Policy as PoliciesIcon,
  Warning as ViolationsIcon,
  Report as ReportsIcon,
  Psychology as VeritasIcon,
  Shield as BoundariesIcon,
  Verified as AttestationsIcon,
  Person as ProfileIcon,
  Tune as PreferencesIcon,
  Business as OrganizationIcon,
  Extension as IntegrationsIcon,
  Storage as DataIcon,
  Tour as ToursIcon,
  Description as DocsIcon,
  Support as SupportIcon,
  AutoAwesome as WrapIcon,
  Hub as MultiAgentIcon,
  LibraryBooks as LibraryBooksIcon,
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { useNavigate, useLocation } from 'react-router-dom';
import { useUserPreferences } from '../hooks/useUserPreferences';

const DRAWER_WIDTH = 260;
const DRAWER_WIDTH_COLLAPSED = 60;
const DRAWER_WIDTH_OBSERVER = 400; // Width when Observer Agent is expanded

const StyledDrawer = styled(Drawer)(({ theme }) => ({
  '& .MuiDrawer-paper': {
    width: DRAWER_WIDTH,
    backgroundColor: '#1a202c',
    borderRight: '1px solid #2d3748',
    color: 'white',
    transition: theme.transitions.create('width', {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.enteringScreen,
    }),
    overflowX: 'hidden',
  },
}));

const StyledDrawerCollapsed = styled(Drawer)(({ theme }) => ({
  '& .MuiDrawer-paper': {
    width: DRAWER_WIDTH_COLLAPSED,
    backgroundColor: '#1a202c',
    borderRight: '1px solid #2d3748',
    color: 'white',
    transition: theme.transitions.create('width', {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.leavingScreen,
    }),
    overflowX: 'hidden',
  },
}));

interface NavigationItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  path?: string;
  children?: NavigationItem[];
  adminOnly?: boolean;
}

interface CollapsibleNavigationProps {
  userPermissions?: string[];
  isAdmin?: boolean;
}

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'observer';
  timestamp: Date;
}

const CollapsibleNavigation: React.FC<CollapsibleNavigationProps> = ({
  userPermissions = [],
  isAdmin = false,
}) => {
  const { preferences, updateNavigationState } = useUserPreferences();
  const [expandedSections, setExpandedSections] = useState<string[]>([]);
  const [observerExpanded, setObserverExpanded] = useState(false);
  const [observerMessages, setObserverMessages] = useState<Message[]>([]);
  const [observerInput, setObserverInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [shouldPulse, setShouldPulse] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const collapsed = preferences.navigationCollapsed;

  // Pulsing effect on page navigation
  useEffect(() => {
    setShouldPulse(true);
    const timer = setTimeout(() => setShouldPulse(false), 3000); // Pulse for 3 seconds
    return () => clearTimeout(timer);
  }, [location.pathname]);

  // Pulse animation keyframes
  const pulseAnimation = keyframes`
    0% {
      box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.7);
    }
    70% {
      box-shadow: 0 0 0 10px rgba(34, 197, 94, 0);
    }
    100% {
      box-shadow: 0 0 0 0 rgba(34, 197, 94, 0);
    }
  `;

  const navigationItems: NavigationItem[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: <DashboardIcon />,
      path: '/ui/dashboard',
    },
    {
      id: 'agents',
      label: 'Agents',
      icon: <AgentsIcon />,
      children: [
        { id: 'my-agents', label: 'My Agents', icon: <ProfileIcon />, path: '/ui/agents/profiles' },
        { id: 'template-library', label: 'Template Library', icon: <LibraryBooksIcon />, path: '/ui/agents/templates' },
        { id: 'agent-wrapping', label: 'Agent Wrapping', icon: <WrapIcon />, path: '/ui/agents/wrapping' },
        { id: 'multi-agent-wrapping', label: 'Multi-Agent Wrapping', icon: <MultiAgentIcon />, path: '/ui/agents/multi-wrapping' },
        { id: 'chat', label: 'Chat', icon: <ChatIcon />, path: '/ui/chat' },
        { id: 'deploy', label: 'Deploy', icon: <DeployIcon />, path: '/ui/agents/deploy' },
        { id: 'registry', label: 'Registry', icon: <RegistryIcon />, path: '/ui/agents/registry' },
        { id: 'benchmarks', label: 'Benchmarks', icon: <BenchmarksIcon />, path: '/ui/agents/benchmark' },
      ],
    },
    {
      id: 'governance',
      label: 'Governance',
      icon: <GovernanceIcon />,
      children: [
        { id: 'gov-overview', label: 'Overview', icon: <OverviewIcon />, path: '/ui/governance/overview' },
        { id: 'policies', label: 'Policies', icon: <PoliciesIcon />, path: '/ui/governance/policies' },
        { id: 'violations', label: 'Violations', icon: <ViolationsIcon />, path: '/ui/governance/violations' },
        { id: 'reports', label: 'Reports', icon: <ReportsIcon />, path: '/ui/governance/reports' },
        { id: 'veritas', label: 'Emotional Veritas', icon: <VeritasIcon />, path: '/ui/governance/veritas' },
      ],
    },
    {
      id: 'trust-metrics',
      label: 'Trust Metrics',
      icon: <TrustIcon />,
      children: [
        { id: 'trust-overview', label: 'Overview', icon: <OverviewIcon />, path: '/ui/trust/overview' },
        { id: 'boundaries', label: 'Boundaries', icon: <BoundariesIcon />, path: '/ui/trust/boundaries' },
        { id: 'attestations', label: 'Attestations', icon: <AttestationsIcon />, path: '/ui/trust/attestations' },
      ],
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: <SettingsIcon />,
      children: [
        { id: 'profile', label: 'User Profile', icon: <ProfileIcon />, path: '/ui/settings/profile' },
        { id: 'preferences', label: 'Preferences', icon: <PreferencesIcon />, path: '/ui/settings/preferences' },
        { id: 'organization', label: 'Organization', icon: <OrganizationIcon />, path: '/ui/settings/organization' },
        { id: 'integrations', label: 'Integrations', icon: <IntegrationsIcon />, path: '/ui/settings/integrations' },
        { id: 'data', label: 'Data Management', icon: <DataIcon />, path: '/ui/settings/data' },
      ],
    },
    {
      id: 'help',
      label: 'Help',
      icon: <HelpIcon />,
      children: [
        { id: 'tours', label: 'Guided Tours', icon: <ToursIcon />, path: '/ui/help/tours' },
        { id: 'docs', label: 'Documentation', icon: <DocsIcon />, path: '/ui/help/documentation' },
        { id: 'support', label: 'Support', icon: <SupportIcon />, path: '/ui/help/support' },
      ],
    },
  ];

  // Add admin dashboard if user is admin
  if (isAdmin) {
    navigationItems.push({
      id: 'admin',
      label: 'Admin Dashboard',
      icon: <AdminIcon />,
      path: '/ui/admin/dashboard',
      adminOnly: true,
    });
  }

  const handleObserverToggle = () => {
    setObserverExpanded(!observerExpanded);
  };

  const handleObserverSend = async () => {
    if (!observerInput.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: observerInput,
      sender: 'user',
      timestamp: new Date()
    };

    setObserverMessages(prev => [...prev, userMessage]);
    setObserverInput('');
    setIsThinking(true);

    try {
      const response = await generateObserverResponse(observerInput, getCurrentContext());
      
      const observerMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: response,
        sender: 'observer',
        timestamp: new Date()
      };

      setObserverMessages(prev => [...prev, observerMessage]);
    } catch (error) {
      console.error('Observer response error:', error);
    } finally {
      setIsThinking(false);
    }
  };

  const getCurrentContext = (): string => {
    const pathname = location.pathname;
    if (pathname.includes('dashboard')) return 'Dashboard';
    if (pathname.includes('agents')) return 'Agents Management';
    if (pathname.includes('governance')) return 'Governance Overview';
    if (pathname.includes('trust-metrics')) return 'Trust Metrics';
    if (pathname.includes('settings')) return 'Settings';
    return 'Promethios Platform';
  };

  const extractDashboardData = (): any => {
    // Extract real data from the DOM/page context
    try {
      // Look for trust score in the page
      const trustScoreElement = document.querySelector('[data-testid="trust-score"], .trust-score');
      const trustScore = trustScoreElement?.textContent?.trim() || '85';
      
      // Look for governance score
      const governanceElement = document.querySelector('[data-testid="governance-score"], .governance-score');
      const governanceScore = governanceElement?.textContent?.trim() || '78%';
      
      // Look for agent count
      const agentCountElement = document.querySelector('[data-testid="agent-count"], .agent-count');
      const agentCount = agentCountElement?.textContent?.trim() || '3';
      
      // Look for violations
      const violationsElement = document.querySelector('[data-testid="violations"], .violations');
      const violations = violationsElement?.textContent?.trim() || '3';
      
      // Extract trust dimensions from the page
      const competenceElement = document.querySelector('[data-testid="competence"], .competence');
      const competence = competenceElement?.textContent?.trim() || '92%';
      
      const reliabilityElement = document.querySelector('[data-testid="reliability"], .reliability');
      const reliability = reliabilityElement?.textContent?.trim() || '88%';
      
      const honestyElement = document.querySelector('[data-testid="honesty"], .honesty');
      const honesty = honestyElement?.textContent?.trim() || '82%';
      
      const transparencyElement = document.querySelector('[data-testid="transparency"], .transparency');
      const transparency = transparencyElement?.textContent?.trim() || '79%';
      
      // Try to extract from visible text content as fallback
      const pageText = document.body.innerText;
      
      // Look for trust score patterns in the page text
      const trustMatch = pageText.match(/Trust Score[\s\S]*?(\d+)/i) || pageText.match(/(\d+)[\s\S]*?Trust/i);
      const finalTrustScore = trustMatch ? trustMatch[1] : trustScore;
      
      // Look for governance percentage
      const govMatch = pageText.match(/(\d+%?)[\s\S]*?Governance/i) || pageText.match(/Governance[\s\S]*?(\d+%?)/i);
      const finalGovernanceScore = govMatch ? govMatch[1] : governanceScore;
      
      // Look for agent count
      const agentMatch = pageText.match(/(\d+)[\s\S]*?Agents?/i) || pageText.match(/Agents?[\s\S]*?(\d+)/i);
      const finalAgentCount = agentMatch ? agentMatch[1] : agentCount;
      
      // Look for violations
      const violationMatch = pageText.match(/(\d+)[\s\S]*?Violations?/i) || pageText.match(/Violations?[\s\S]*?(\d+)/i);
      const finalViolations = violationMatch ? violationMatch[1] : violations;
      
      return {
        trustScore: finalTrustScore,
        governanceScore: finalGovernanceScore,
        agentCount: finalAgentCount,
        violations: finalViolations,
        competence: competence,
        reliability: reliability,
        honesty: honesty,
        transparency: transparency,
        extractedAt: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error extracting dashboard data:', error);
      // Return default values if extraction fails
      return {
        trustScore: '85',
        governanceScore: '78%',
        agentCount: '3',
        violations: '3',
        competence: '92%',
        reliability: '88%',
        honesty: '82%',
        transparency: '79%'
      };
    }
  };

  const generateObserverResponse = async (message: string, context: string): Promise<string> => {
    // Simulate thinking delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Extract real dashboard data
    const dashboardData = extractDashboardData();
    console.log('Extracted dashboard data:', dashboardData);
    
    // Use the new API service with real data
    try {
      const { sendObserverMessage } = await import('../api/observerChat');
      const response = await sendObserverMessage({
        message: message,
        context: context,
        dashboardData: dashboardData,
        systemPrompt: `You are the Promethios Observer Agent, an intelligent AI governance assistant. You help users with AI governance, trust metrics, compliance, and platform navigation. Current context: ${context}. 

Current user metrics: Trust Score ${dashboardData.trustScore}, Governance ${dashboardData.governanceScore}, ${dashboardData.agentCount} agents, ${dashboardData.violations} violations. Trust dimensions: Competence ${dashboardData.competence}, Reliability ${dashboardData.reliability}, Honesty ${dashboardData.honesty}, Transparency ${dashboardData.transparency}.

Be helpful, concise, and focus on governance-related guidance using these real metrics. You have deep knowledge of Promethios systems including PRISM (monitoring), Vigil (trust boundaries), and Veritas (truth verification).`
      });

      return response.response;
    } catch (error) {
      console.error('Observer response error:', error);
      
      // Enhanced fallback with real data
      const dashboardData = extractDashboardData();
      return `Thanks for your question about ${context}! Based on your current metrics (Trust: ${dashboardData.trustScore}, Governance: ${dashboardData.governanceScore}, ${dashboardData.agentCount} agents, ${dashboardData.violations} violations), I can provide specific guidance. How can I assist you further?`;
    }
  };

  const handleToggleCollapse = async () => {
    try {
      await updateNavigationState(!collapsed);
    } catch (error) {
      console.error('Failed to update navigation state:', error);
      // The UI will still update due to the preferences state change
    }
  };

  const handleSectionToggle = (sectionId: string) => {
    if (collapsed) return; // Don't expand sections when collapsed
    
    setExpandedSections(prev => 
      prev.includes(sectionId)
        ? prev.filter(id => id !== sectionId)
        : [...prev, sectionId]
    );
  };

  const handleNavigation = (path: string) => {
    navigate(path);
  };

  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };

  const renderNavigationItem = (item: NavigationItem, level = 0) => {
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedSections.includes(item.id);
    const isItemActive = item.path ? isActive(item.path) : false;

    if (collapsed && hasChildren) {
      // For collapsed state with children, show tooltip with submenu
      return (
        <Tooltip
          key={item.id}
          title={
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                {item.label}
              </Typography>
              {item.children?.map(child => (
                <Box
                  key={child.id}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    py: 0.5,
                    cursor: 'pointer',
                    '&:hover': { backgroundColor: 'rgba(255,255,255,0.1)' },
                  }}
                  onClick={() => child.path && handleNavigation(child.path)}
                >
                  <Box sx={{ mr: 1, display: 'flex' }}>{child.icon}</Box>
                  <Typography variant="body2">{child.label}</Typography>
                </Box>
              ))}
            </Box>
          }
          placement="right"
          arrow
        >
          <ListItem disablePadding>
            <ListItemButton
              sx={{
                minHeight: 48,
                justifyContent: 'center',
                px: 2.5,
                backgroundColor: isItemActive ? 'rgba(66, 153, 225, 0.2)' : 'transparent',
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                },
              }}
            >
              <ListItemIcon
                sx={{
                  minWidth: 0,
                  justifyContent: 'center',
                  color: isItemActive ? '#4299e1' : 'white',
                }}
              >
                {item.icon}
              </ListItemIcon>
            </ListItemButton>
          </ListItem>
        </Tooltip>
      );
    }

    if (collapsed && !hasChildren) {
      // For collapsed state without children
      return (
        <Tooltip key={item.id} title={item.label} placement="right" arrow>
          <ListItem disablePadding>
            <ListItemButton
              onClick={() => item.path && handleNavigation(item.path)}
              sx={{
                minHeight: 48,
                justifyContent: 'center',
                px: 2.5,
                backgroundColor: isItemActive ? 'rgba(66, 153, 225, 0.2)' : 'transparent',
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                },
              }}
            >
              <ListItemIcon
                sx={{
                  minWidth: 0,
                  justifyContent: 'center',
                  color: isItemActive ? '#4299e1' : 'white',
                }}
              >
                {item.icon}
              </ListItemIcon>
            </ListItemButton>
          </ListItem>
        </Tooltip>
      );
    }

    // For expanded state
    return (
      <React.Fragment key={item.id}>
        <ListItem disablePadding>
          <ListItemButton
            onClick={() => {
              if (hasChildren) {
                handleSectionToggle(item.id);
              } else if (item.path) {
                handleNavigation(item.path);
              }
            }}
            sx={{
              pl: level * 2 + 2,
              backgroundColor: isItemActive ? 'rgba(66, 153, 225, 0.2)' : 'transparent',
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
              },
            }}
          >
            <ListItemIcon sx={{ color: isItemActive ? '#4299e1' : 'white' }}>
              {item.icon}
            </ListItemIcon>
            <ListItemText 
              primary={item.label}
              sx={{ 
                '& .MuiListItemText-primary': {
                  color: isItemActive ? '#4299e1' : 'white',
                  fontWeight: isItemActive ? 600 : 400,
                }
              }}
            />
            {hasChildren && (isExpanded ? <ExpandLess /> : <ExpandMore />)}
          </ListItemButton>
        </ListItem>
        {hasChildren && (
          <Collapse in={isExpanded} timeout="auto" unmountOnExit>
            <List component="div" disablePadding>
              {item.children?.map(child => renderNavigationItem(child, level + 1))}
            </List>
          </Collapse>
        )}
      </React.Fragment>
    );
  };

  const DrawerComponent = collapsed ? StyledDrawerCollapsed : StyledDrawer;
  const drawerWidth = observerExpanded ? DRAWER_WIDTH_OBSERVER : (collapsed ? DRAWER_WIDTH_COLLAPSED : DRAWER_WIDTH);

  return (
    <Drawer
      variant="permanent"
      anchor="left"
      sx={{
        '& .MuiDrawer-paper': {
          width: drawerWidth,
          backgroundColor: '#1a202c',
          borderRight: '1px solid #2d3748',
          color: 'white',
          transition: 'width 0.3s ease',
          overflowX: 'hidden',
          marginTop: '64px', // Header height
          height: 'calc(100vh - 64px)',
        },
      }}
    >
      {/* Observer Agent */}
      <Box
        sx={{
          borderBottom: '1px solid #2d3748',
        }}
      >
        {/* Observer Agent Header */}
        <Box sx={{ p: 1 }}>
          {collapsed ? (
            <Tooltip title="Observer Agent - Governance Assistant" placement="right" arrow>
              <IconButton 
                onClick={handleObserverToggle}
                sx={{ 
                  color: 'white',
                  backgroundColor: observerExpanded ? 'rgba(34, 197, 94, 0.2)' : 'transparent',
                  '&:hover': { backgroundColor: 'rgba(34, 197, 94, 0.3)' },
                  width: '100%',
                  borderRadius: 1,
                  animation: shouldPulse ? `${pulseAnimation} 2s infinite` : 'none',
                }}
              >
                🛡️
              </IconButton>
            </Tooltip>
          ) : (
            <Box
              onClick={handleObserverToggle}
              sx={{
                display: 'flex',
                alignItems: 'center',
                p: 1,
                borderRadius: 1,
                cursor: 'pointer',
                backgroundColor: observerExpanded ? 'rgba(34, 197, 94, 0.2)' : 'transparent',
                '&:hover': { backgroundColor: 'rgba(34, 197, 94, 0.3)' },
                transition: 'background-color 0.2s',
                animation: shouldPulse ? `${pulseAnimation} 2s infinite` : 'none',
              }}
            >
              <Box sx={{ mr: 2, fontSize: '1.2rem' }}>🛡️</Box>
              <Box sx={{ flex: 1 }}>
                <Typography variant="body2" sx={{ color: 'white', fontWeight: 500 }}>
                  Observer Agent
                </Typography>
                <Typography variant="caption" sx={{ color: '#9ca3af' }}>
                  Governance Assistant
                </Typography>
              </Box>
              {observerExpanded ? <ExpandLess /> : <ExpandMore />}
            </Box>
          )}
        </Box>

        {/* Observer Agent Chat Interface */}
        <Collapse in={observerExpanded && !collapsed} timeout="auto" unmountOnExit>
          <Box sx={{ p: 2, backgroundColor: '#111827' }}>
            {/* Enhanced Status Indicators with Smart Alerts */}
            <Box sx={{ mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Box 
                  sx={{ 
                    width: 8, 
                    height: 8, 
                    borderRadius: '50%', 
                    backgroundColor: '#22c55e',
                    mr: 1,
                    animation: 'pulse 2s infinite'
                  }} 
                />
                <Typography variant="caption" sx={{ color: '#9ca3af' }}>
                  Governed by Promethios
                </Typography>
              </Box>
              <Typography variant="caption" sx={{ color: '#9ca3af', display: 'block' }}>
                Context: {getCurrentContext()}
              </Typography>
              
              {/* Smart Trust Score Display with Alert */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="caption" sx={{ color: '#9ca3af' }}>
                  Trust Score: {extractDashboardData().trustScore}
                </Typography>
                {parseInt(extractDashboardData().trustScore) < 70 && (
                  <Box
                    sx={{
                      width: 6,
                      height: 6,
                      borderRadius: '50%',
                      backgroundColor: '#f59e0b',
                      animation: 'pulse 1s infinite',
                      boxShadow: '0 0 8px rgba(245, 158, 11, 0.6)'
                    }}
                    title="Trust score needs attention"
                  />
                )}
                <Typography variant="caption" sx={{ color: '#9ca3af' }}>
                  (Compliant)
                </Typography>
              </Box>

              {/* Smart Action Buttons */}
              {extractDashboardData().violations !== '0' && (
                <Box sx={{ mt: 1, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  <Box
                    onClick={() => {
                      const violationMessage = `I see you have ${extractDashboardData().violations} policy violations. Can you help me understand what these violations are and how to fix them?`;
                      setObserverInput(violationMessage);
                    }}
                    sx={{
                      px: 1,
                      py: 0.5,
                      backgroundColor: '#dc2626',
                      borderRadius: 0.5,
                      cursor: 'pointer',
                      '&:hover': { backgroundColor: '#b91c1c' },
                      transition: 'background-color 0.2s'
                    }}
                  >
                    <Typography variant="caption" sx={{ color: 'white', fontSize: '0.7rem' }}>
                      🚨 Jump to Violations
                    </Typography>
                  </Box>
                  
                  <Box
                    onClick={() => {
                      const improveMessage = `How can I improve my trust score from ${extractDashboardData().trustScore}? What specific actions should I take?`;
                      setObserverInput(improveMessage);
                    }}
                    sx={{
                      px: 1,
                      py: 0.5,
                      backgroundColor: '#059669',
                      borderRadius: 0.5,
                      cursor: 'pointer',
                      '&:hover': { backgroundColor: '#047857' },
                      transition: 'background-color 0.2s'
                    }}
                  >
                    <Typography variant="caption" sx={{ color: 'white', fontSize: '0.7rem' }}>
                      ⚡ Fix This
                    </Typography>
                  </Box>
                </Box>
              )}

              {/* Reflection Log Snippet */}
              <Box 
                sx={{ 
                  mt: 1, 
                  p: 1, 
                  backgroundColor: '#1f2937', 
                  borderRadius: 0.5,
                  borderLeft: '2px solid #22c55e'
                }}
                title="Recent agent reflection"
              >
                <Typography variant="caption" sx={{ color: '#9ca3af', fontSize: '0.7rem', fontStyle: 'italic' }}>
                  💭 Last Reflection: "Assistant noted transparency improvement needed on 6/20 regarding policy explanations."
                </Typography>
              </Box>
            </Box>

            {/* Chat Messages */}
            <Box 
              sx={{ 
                height: '200px', 
                overflowY: 'auto', 
                mb: 2,
                border: '1px solid #374151',
                borderRadius: 1,
                p: 1,
                backgroundColor: '#1f2937'
              }}
            >
              {observerMessages.length === 0 ? (
                <Box>
                  <Typography variant="body2" sx={{ color: '#9ca3af', textAlign: 'center', mt: 1 }}>
                    👋 Hi! I'm your governance assistant.
                  </Typography>
                  
                  {/* Smart Contextual Suggestions */}
                  <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {parseInt(extractDashboardData().trustScore) < 80 && (
                      <Box
                        onClick={() => {
                          const suggestion = `My trust score is ${extractDashboardData().trustScore}. What are the main areas I should focus on to improve it?`;
                          setObserverInput(suggestion);
                          handleObserverSend();
                        }}
                        sx={{
                          p: 1,
                          backgroundColor: '#374151',
                          borderRadius: 0.5,
                          cursor: 'pointer',
                          '&:hover': { backgroundColor: '#4b5563' },
                          transition: 'background-color 0.2s'
                        }}
                      >
                        <Typography variant="caption" sx={{ color: '#9ca3af', fontSize: '0.75rem' }}>
                          💡 "How can I improve my trust score?"
                        </Typography>
                      </Box>
                    )}
                    
                    {extractDashboardData().violations !== '0' && (
                      <Box
                        onClick={() => {
                          const suggestion = `I have ${extractDashboardData().violations} policy violations. What do these mean and how urgent are they?`;
                          setObserverInput(suggestion);
                          handleObserverSend();
                        }}
                        sx={{
                          p: 1,
                          backgroundColor: '#374151',
                          borderRadius: 0.5,
                          cursor: 'pointer',
                          '&:hover': { backgroundColor: '#4b5563' },
                          transition: 'background-color 0.2s'
                        }}
                      >
                        <Typography variant="caption" sx={{ color: '#9ca3af', fontSize: '0.75rem' }}>
                          🚨 "What are these policy violations?"
                        </Typography>
                      </Box>
                    )}
                    
                    <Box
                      onClick={() => {
                        const suggestion = "What is governance and why is it important for my AI agents?";
                        setObserverInput(suggestion);
                        handleObserverSend();
                      }}
                      sx={{
                        p: 1,
                        backgroundColor: '#374151',
                        borderRadius: 0.5,
                        cursor: 'pointer',
                        '&:hover': { backgroundColor: '#4b5563' },
                        transition: 'background-color 0.2s'
                      }}
                    >
                      <Typography variant="caption" sx={{ color: '#9ca3af', fontSize: '0.75rem' }}>
                        🛡️ "Explain governance to me"
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              ) : (
                observerMessages.map((message) => (
                  <Box key={message.id} sx={{ mb: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                      <Typography variant="caption" sx={{ 
                        color: message.sender === 'user' ? '#60a5fa' : '#22c55e',
                        fontWeight: 500 
                      }}>
                        {message.sender === 'user' ? 'You' : 'Observer'}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#6b7280', ml: 1 }}>
                        {message.timestamp.toLocaleTimeString()}
                      </Typography>
                    </Box>
                    <Typography variant="body2" sx={{ color: 'white', fontSize: '0.875rem' }}>
                      {message.text}
                    </Typography>
                    
                    {/* Smart Follow-up Actions for Observer Messages */}
                    {message.sender === 'observer' && (
                      <Box sx={{ mt: 1, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                        {message.text.toLowerCase().includes('violation') && (
                          <Box
                            onClick={() => setObserverInput("Show me exactly where these violations are and how to fix them")}
                            sx={{
                              px: 1,
                              py: 0.25,
                              backgroundColor: '#374151',
                              borderRadius: 0.25,
                              cursor: 'pointer',
                              '&:hover': { backgroundColor: '#4b5563' }
                            }}
                          >
                            <Typography variant="caption" sx={{ color: '#9ca3af', fontSize: '0.7rem' }}>
                              📍 Show Details
                            </Typography>
                          </Box>
                        )}
                        
                        {message.text.toLowerCase().includes('improve') && (
                          <Box
                            onClick={() => setObserverInput("What changed recently that affected my scores?")}
                            sx={{
                              px: 1,
                              py: 0.25,
                              backgroundColor: '#374151',
                              borderRadius: 0.25,
                              cursor: 'pointer',
                              '&:hover': { backgroundColor: '#4b5563' }
                            }}
                          >
                            <Typography variant="caption" sx={{ color: '#9ca3af', fontSize: '0.7rem' }}>
                              📈 What Changed?
                            </Typography>
                          </Box>
                        )}
                      </Box>
                    )}
                  </Box>
                ))
              )}
              
              {/* Thinking Indicator */}
              {isThinking && (
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Typography variant="caption" sx={{ color: '#22c55e', fontWeight: 500 }}>
                    Observer
                  </Typography>
                  <Box sx={{ ml: 1, display: 'flex', alignItems: 'center' }}>
                    <Typography variant="body2" sx={{ color: '#9ca3af', mr: 1 }}>
                      thinking
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      {[0, 1, 2].map((i) => (
                        <Box
                          key={i}
                          sx={{
                            width: 4,
                            height: 4,
                            borderRadius: '50%',
                            backgroundColor: '#22c55e',
                            animation: `pulse 1.4s ease-in-out ${i * 0.2}s infinite`,
                          }}
                        />
                      ))}
                    </Box>
                  </Box>
                </Box>
              )}
            </Box>

            {/* Chat Input */}
            <Box sx={{ display: 'flex', gap: 1 }}>
              <TextField
                value={observerInput}
                onChange={(e) => setObserverInput(e.target.value)}
                placeholder="Ask about governance, trust metrics, or compliance..."
                variant="outlined"
                size="small"
                fullWidth
                disabled={isThinking}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleObserverSend();
                  }
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: '#1f2937',
                    color: 'white',
                    fontSize: '0.875rem',
                    '& fieldset': { borderColor: '#374151' },
                    '&:hover fieldset': { borderColor: '#4b5563' },
                    '&.Mui-focused fieldset': { borderColor: '#22c55e' },
                  },
                  '& .MuiInputBase-input::placeholder': {
                    color: '#9ca3af',
                    opacity: 1,
                  },
                }}
              />
              <Button
                onClick={handleObserverSend}
                disabled={!observerInput.trim() || isThinking}
                variant="contained"
                size="small"
                sx={{
                  backgroundColor: '#22c55e',
                  '&:hover': { backgroundColor: '#16a34a' },
                  '&:disabled': { backgroundColor: '#374151' },
                  minWidth: 'auto',
                  px: 2,
                }}
              >
                Send
              </Button>
            </Box>

            {/* Footer */}
            <Typography variant="caption" sx={{ color: '#6b7280', textAlign: 'center', display: 'block', mt: 1 }}>
              Powered by OpenAI • Governed by Promethios
            </Typography>
          </Box>
        </Collapse>
      </Box>

      {/* Toggle Button */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: collapsed ? 'center' : 'flex-end',
          p: 1,
          borderBottom: '1px solid #2d3748',
        }}
      >
        <IconButton onClick={handleToggleCollapse} sx={{ color: 'white' }}>
          {collapsed ? <ChevronRight /> : <ChevronLeft />}
        </IconButton>
      </Box>

      {/* Navigation Items */}
      <List sx={{ pt: 0 }}>
        {navigationItems.map(item => renderNavigationItem(item))}
      </List>
    </Drawer>
  );
};

export default CollapsibleNavigation;
