/**
 * Admin Dashboard Context
 * 
 * This context provides global state management for the admin dashboard,
 * including user information, permissions, and governance data from VigilObserver.
 * Enhanced with agent management data flow support.
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getVigilObserverExtensionPoint } from '../core/extensions/vigilObserverExtension';
import { getVeritasService } from '../core/veritas/VeritasService';
import { AgentManagementProvider } from './AgentManagementContext';

// User interface
interface User {
  id: string;
  email: string;
  displayName?: string;
  roles: string[];
}

// Observation interface
interface Observation {
  id: string;
  timestamp: string;
  message: string;
  type: string;
  source: string;
  metadata?: Record<string, any>;
}

// Compliance status interface
interface ComplianceStatus {
  compliant: boolean;
  violationCount: number;
  enforcementCount: number;
  complianceScore: number;
}

// Metrics interface
interface Metrics {
  violations?: {
    total: number;
    byRule?: Record<string, number>;
    byTool?: Record<string, number>;
    bySeverity?: Record<string, {
      critical: number;
      high: number;
      medium: number;
      low: number;
    }>;
  };
  compliance?: {
    score: number;
    trend: number[];
    byCategory?: Record<string, number>;
  };
  agents?: {
    total: number;
    active: number;
    compliant: number;
  };
}

// Context interface
interface AdminDashboardContextType {
  // User and auth
  currentUser: User | null;
  isAdmin: boolean;
  userPermissions: string[];
  
  // Navigation
  currentSection: string;
  setCurrentSection: (section: string) => void;
  
  // VigilObserver data
  vigilComplianceStatus: ComplianceStatus | null;
  vigilMetrics: Metrics | null;
  vigilObservations: Observation[];
  
  // Loading and error states
  isLoading: boolean;
  error: Error | null;
  
  // Actions
  refreshVigilData: () => Promise<void>;
}

// Create context with default values
const AdminDashboardContext = createContext<AdminDashboardContextType>({
  // User and auth
  currentUser: null,
  isAdmin: false,
  userPermissions: [],
  
  // Navigation
  currentSection: 'overview',
  setCurrentSection: () => {},
  
  // VigilObserver data
  vigilComplianceStatus: null,
  vigilMetrics: null,
  vigilObservations: [],
  
  // Loading and error states
  isLoading: true,
  error: null,
  
  // Actions
  refreshVigilData: async () => {}
});

// Hook for using the admin dashboard context
export const useAdminDashboard = () => useContext(AdminDashboardContext);

// Provider component
export const AdminDashboardProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const navigate = useNavigate();
  
  // User and auth state
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [userPermissions, setUserPermissions] = useState<string[]>([]);
  
  // Navigation state
  const [currentSection, setCurrentSection] = useState<string>('overview');
  
  // VigilObserver data state
  const [vigilComplianceStatus, setVigilComplianceStatus] = useState<ComplianceStatus | null>(null);
  const [vigilMetrics, setVigilMetrics] = useState<Metrics | null>(null);
  const [vigilObservations, setVigilObservations] = useState<Observation[]>([]);
  
  // Loading and error states
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  
  // Initialize user and permissions
  useEffect(() => {
    const initializeUser = async () => {
      try {
        // In a real implementation, we would fetch the current user from an auth service
        // For now, we'll use mock data
        const mockUser: User = {
          id: 'user-001',
          email: 'admin@promethios.ai',
          displayName: 'Admin User',
          roles: ['admin', 'user']
        };
        
        setCurrentUser(mockUser);
        setIsAdmin(mockUser.roles.includes('admin'));
        
        // Set permissions based on roles
        const permissions = mockUser.roles.includes('admin') 
          ? ['viewDashboard', 'manageUsers', 'manageRoles', 'configureSystem', 'viewAnalytics', 'manageAgents']
          : ['viewDashboard'];
        
        setUserPermissions(permissions);
        
      } catch (err) {
        console.error('Error initializing user:', err);
        setError(err instanceof Error ? err : new Error('Error initializing user'));
      } finally {
        setIsLoading(false);
      }
    };
    
    initializeUser();
  }, []);
  
  // Handle section changes
  useEffect(() => {
    // Map section to route
    const sectionToRoute: Record<string, string> = {
      'overview': '/admin/dashboard',
      'metrics': '/admin/dashboard/analytics',
      'agents': '/admin/dashboard/agents',
      'users': '/admin/dashboard/users',
      'roles': '/admin/dashboard/roles',
      'analytics': '/admin/dashboard/analytics',
      'settings': '/admin/dashboard/settings'
    };
    
    // Navigate to the corresponding route
    const route = sectionToRoute[currentSection] || '/admin/dashboard';
    navigate(route);
    
  }, [currentSection, navigate]);
  
  // Refresh VigilObserver data
  const refreshVigilData = async () => {
    try {
      // Get VigilObserver extension point
      const vigilObserverExtensionPoint = getVigilObserverExtensionPoint();
      if (!vigilObserverExtensionPoint) {
        throw new Error('VigilObserver extension point not found');
      }
      
      const implementation = vigilObserverExtensionPoint.getDefault();
      if (!implementation) {
        throw new Error('VigilObserver implementation not found');
      }
      
      // Get Veritas service for emotional impact assessment
      const veritasService = getVeritasService();
      
      // In a real implementation, we would fetch data from the VigilObserver
      // For now, we'll use mock data
      
      // Mock compliance status
      const mockComplianceStatus: ComplianceStatus = {
        compliant: Math.random() > 0.3, // 70% chance of being compliant
        violationCount: Math.floor(Math.random() * 20),
        enforcementCount: Math.floor(Math.random() * 10),
        complianceScore: Math.floor(Math.random() * 30) + 70 // 70-100
      };
      
      setVigilComplianceStatus(mockComplianceStatus);
      
      // Mock metrics
      const criticalCount = Math.floor(Math.random() * 5);
      const highCount = Math.floor(Math.random() * 10);
      const mediumCount = Math.floor(Math.random() * 15);
      const lowCount = Math.floor(Math.random() * 20);
      
      const mockMetrics: Metrics = {
        violations: {
          total: criticalCount + highCount + mediumCount + lowCount,
          byRule: {
            'rule1': Math.floor(Math.random() * 10) + 1,
            'rule2': Math.floor(Math.random() * 8) + 1,
            'rule3': Math.floor(Math.random() * 5) + 1
          },
          byTool: {
            'shell_exec': Math.floor(Math.random() * 10) + 1,
            'file_read': Math.floor(Math.random() * 5) + 1,
            'browser_navigate': Math.floor(Math.random() * 3) + 1
          },
          bySeverity: {
            critical: criticalCount,
            high: highCount,
            medium: mediumCount,
            low: lowCount
          }
        },
        compliance: {
          score: mockComplianceStatus.complianceScore,
          trend: Array.from({ length: 7 }, () => Math.floor(Math.random() * 30) + 70),
          byCategory: {
            'data_access': Math.floor(Math.random() * 30) + 70,
            'network_access': Math.floor(Math.random() * 30) + 70,
            'file_system': Math.floor(Math.random() * 30) + 70
          }
        },
        agents: {
          total: 7,
          active: 5,
          compliant: 4
        }
      };
      
      setVigilMetrics(mockMetrics);
      
      // Mock observations
      const mockObservations: Observation[] = Array.from({ length: 10 }, (_, i) => ({
        id: `obs-${i}-${Date.now()}`,
        timestamp: new Date(Date.now() - i * 3600000).toISOString(),
        message: [
          'Agent attempted to access restricted data',
          'User requested sensitive information',
          'System enforced access control policy',
          'Agent compliance check completed',
          'New agent registered in the system'
        ][Math.floor(Math.random() * 5)],
        type: ['violation', 'interaction', 'enforcement', 'compliance', 'system'][Math.floor(Math.random() * 5)],
        source: ['agent', 'user', 'system'][Math.floor(Math.random() * 3)],
        metadata: {
          agentId: `agent-00${Math.floor(Math.random() * 5) + 1}`,
          severity: ['critical', 'high', 'medium', 'low', 'info'][Math.floor(Math.random() * 5)]
        }
      }));
      
      setVigilObservations(mockObservations);
      
    } catch (err) {
      console.error('Error refreshing VigilObserver data:', err);
      setError(err instanceof Error ? err : new Error('Error refreshing VigilObserver data'));
    }
  };
  
  // Context value
  const contextValue: AdminDashboardContextType = {
    // User and auth
    currentUser,
    isAdmin,
    userPermissions,
    
    // Navigation
    currentSection,
    setCurrentSection,
    
    // VigilObserver data
    vigilComplianceStatus,
    vigilMetrics,
    vigilObservations,
    
    // Loading and error states
    isLoading,
    error,
    
    // Actions
    refreshVigilData
  };
  
  return (
    <AdminDashboardContext.Provider value={contextValue}>
      <AgentManagementProvider>
        {children}
      </AgentManagementProvider>
    </AdminDashboardContext.Provider>
  );
};

export default AdminDashboardContext;
