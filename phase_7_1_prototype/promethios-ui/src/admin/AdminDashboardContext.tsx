import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Define types
interface User {
  id: string;
  email: string;
  displayName?: string;
  roles: string[];
}

interface VigilMetrics {
  violations: {
    total: number;
    byRule: Record<string, number>;
    bySeverity: Record<string, number>;
    byTool: Record<string, number>;
  };
  compliance: {
    score: number;
    byCategory: Record<string, number>;
  };
}

interface VigilComplianceStatus {
  compliant: boolean;
  violationCount: number;
  enforcementCount: number;
  complianceScore: number;
  lastUpdated: string;
}

interface VigilObservation {
  id: string;
  timestamp: string;
  message: string;
  type: string;
  severity: string;
  source: string;
}

interface AdminDashboardContextType {
  currentUser: User | null;
  isAdmin: boolean;
  userPermissions: string[];
  currentSection: string;
  setCurrentSection: (section: string) => void;
  isLoading: boolean;
  error: Error | null;
  vigilMetrics: VigilMetrics | null;
  vigilComplianceStatus: VigilComplianceStatus | null;
  vigilObservations: VigilObservation[];
  refreshVigilData: () => void;
}

// Create context
const AdminDashboardContext = createContext<AdminDashboardContextType | undefined>(undefined);

// Provider component
export const AdminDashboardProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [userPermissions, setUserPermissions] = useState<string[]>([]);
  const [currentSection, setCurrentSection] = useState<string>('overview');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const [vigilMetrics, setVigilMetrics] = useState<VigilMetrics | null>(null);
  const [vigilComplianceStatus, setVigilComplianceStatus] = useState<VigilComplianceStatus | null>(null);
  const [vigilObservations, setVigilObservations] = useState<VigilObservation[]>([]);

  // Initialize user
  useEffect(() => {
    const initializeUser = () => {
      try {
        // In a real app, this would come from authentication service
        // For now, we'll use a mock user
        const mockUser: User = {
          id: 'user-001',
          email: 'admin@promethios.ai',
          displayName: 'Admin User',
          roles: ['admin', 'user']
        };
        
        // Add the user's email to the admin list
        if (mockUser.email === 'wesheets@gmail.com' || 
            mockUser.email === 'admin@promethios.ai') {
          mockUser.roles = ['admin', 'user'];
        }
        
        setCurrentUser(mockUser);
        setIsAdmin(mockUser.roles.includes('admin'));
        setUserPermissions(mockUser.roles.includes('admin') 
          ? ['viewDashboard', 'manageAgents', 'manageUsers', 'manageRoles', 'viewAnalytics', 'manageSettings']
          : ['viewDashboard']);
        
        setIsLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to initialize user'));
        setIsLoading(false);
      }
    };

    initializeUser();
  }, []);

  // Mock function to refresh Vigil data
  const refreshVigilData = () => {
    try {
      // In a real app, this would fetch data from the Vigil API
      // For now, we'll use mock data
      
      // Mock metrics
      const mockMetrics: VigilMetrics = {
        violations: {
          total: 12,
          byRule: {
            'rule1': 5,
            'rule2': 3,
            'rule3': 4
          },
          bySeverity: {
            'critical': 2,
            'high': 4,
            'medium': 3,
            'low': 3
          },
          byTool: {
            'shell_exec': 5,
            'file_read': 3,
            'browser_navigate': 4
          }
        },
        compliance: {
          score: 78,
          byCategory: {
            'security': 85,
            'privacy': 70,
            'ethics': 80
          }
        }
      };
      
      // Mock compliance status
      const mockComplianceStatus: VigilComplianceStatus = {
        compliant: mockMetrics.violations.bySeverity.critical === 0,
        violationCount: mockMetrics.violations.total,
        enforcementCount: 3,
        complianceScore: mockMetrics.compliance.score,
        lastUpdated: new Date().toISOString()
      };
      
      // Mock observations
      const mockObservations: VigilObservation[] = [
        {
          id: 'obs-001',
          timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(), // 5 minutes ago
          message: 'Agent "Assistant" was wrapped with governance',
          type: 'agent_wrapped',
          severity: 'info',
          source: 'vigil'
        },
        {
          id: 'obs-002',
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
          message: 'Governance policy updated',
          type: 'policy_update',
          severity: 'info',
          source: 'admin'
        },
        {
          id: 'obs-003',
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(), // 2 days ago
          message: 'New agent relationship defined',
          type: 'relationship_defined',
          severity: 'info',
          source: 'admin'
        }
      ];
      
      setVigilMetrics(mockMetrics);
      setVigilComplianceStatus(mockComplianceStatus);
      setVigilObservations(mockObservations);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to refresh Vigil data'));
    }
  };

  // Provide the context value
  const contextValue: AdminDashboardContextType = {
    currentUser,
    isAdmin,
    userPermissions,
    currentSection,
    setCurrentSection,
    isLoading,
    error,
    vigilMetrics,
    vigilComplianceStatus,
    vigilObservations,
    refreshVigilData
  };

  return (
    <AdminDashboardContext.Provider value={contextValue}>
      {children}
    </AdminDashboardContext.Provider>
  );
};

// Custom hook to use the context
export const useAdminDashboard = () => {
  const context = useContext(AdminDashboardContext);
  if (context === undefined) {
    throw new Error('useAdminDashboard must be used within an AdminDashboardProvider');
  }
  return context;
};
