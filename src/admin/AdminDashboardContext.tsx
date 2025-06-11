/**
 * Admin Dashboard Context Provider
 * 
 * This context provider manages the state and functionality for the admin dashboard,
 * including authentication, navigation, and data access.
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { useNavigate, useLocation } from 'react-router-dom';
import authService from '../core/firebase/authService';
import rbacService from '../core/firebase/rbacService';
import dashboardDataService from '../core/firebase/dashboardDataService';
import { getVigilObserverExtensionPoint } from '../core/extensions/vigilObserverExtension';
import { EXTENSION_VERSION } from '../core/extensions/vigilObserverExtension';

// Context interface
interface AdminDashboardContextType {
  // Authentication
  currentUser: User | null;
  isAdmin: boolean;
  userRoles: string[];
  userPermissions: string[];
  
  // Navigation
  currentSection: string;
  setCurrentSection: (section: string) => void;
  
  // Loading states
  isLoading: boolean;
  
  // Error handling
  error: Error | null;
  clearError: () => void;
  
  // VigilObserver data
  vigilMetrics: any;
  vigilViolations: any[];
  vigilEnforcements: any[];
  vigilComplianceStatus: any;
  vigilObservations: any[];
  
  // VigilObserver actions
  refreshVigilData: () => Promise<void>;
  getVigilMetricsByCategory: (category: string) => any;
  getVigilViolationsByRule: (ruleId: string, severity?: string) => any[];
  getVigilEnforcementsByAction: (action: string, ruleId?: string) => any[];
}

// Create context with default values
const AdminDashboardContext = createContext<AdminDashboardContextType>({
  // Authentication
  currentUser: null,
  isAdmin: false,
  userRoles: [],
  userPermissions: [],
  
  // Navigation
  currentSection: 'overview',
  setCurrentSection: () => {},
  
  // Loading states
  isLoading: true,
  
  // Error handling
  error: null,
  clearError: () => {},
  
  // VigilObserver data
  vigilMetrics: null,
  vigilViolations: [],
  vigilEnforcements: [],
  vigilComplianceStatus: null,
  vigilObservations: [],
  
  // VigilObserver actions
  refreshVigilData: async () => {},
  getVigilMetricsByCategory: () => ({}),
  getVigilViolationsByRule: () => [],
  getVigilEnforcementsByAction: () => []
});

// Hook for using the admin dashboard context
export const useAdminDashboard = () => useContext(AdminDashboardContext);

// Provider component
export const AdminDashboardProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Authentication state
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [userRoles, setUserRoles] = useState<string[]>([]);
  const [userPermissions, setUserPermissions] = useState<string[]>([]);
  
  // Navigation state
  const [currentSection, setCurrentSection] = useState<string>('overview');
  
  // Loading and error states
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  
  // VigilObserver state
  const [vigilMetrics, setVigilMetrics] = useState<any>(null);
  const [vigilViolations, setVigilViolations] = useState<any[]>([]);
  const [vigilEnforcements, setVigilEnforcements] = useState<any[]>([]);
  const [vigilComplianceStatus, setVigilComplianceStatus] = useState<any>(null);
  const [vigilObservations, setVigilObservations] = useState<any[]>([]);
  
  // Router hooks
  const navigate = useNavigate();
  const location = useLocation();
  
  // Clear error helper
  const clearError = () => setError(null);
  
  // Effect for authentication state
  useEffect(() => {
    const unsubscribe = authService.onAuthStateChange(async (user) => {
      setIsLoading(true);
      
      try {
        if (user) {
          setCurrentUser(user);
          
          // Check if user is admin
          const adminStatus = await authService.isAdmin(user);
          setIsAdmin(adminStatus);
          
          // Get user roles
          const roles = await authService.getUserRoles(user);
          setUserRoles(roles);
          
          // Get user permissions
          const permissions = await rbacService.getUserPermissions(user);
          setUserPermissions(permissions);
          
          // If not admin, redirect to home
          if (!adminStatus && location.pathname.startsWith('/admin')) {
            navigate('/');
          }
        } else {
          // User is signed out
          setCurrentUser(null);
          setIsAdmin(false);
          setUserRoles([]);
          setUserPermissions([]);
          
          // Redirect to login if trying to access admin pages
          if (location.pathname.startsWith('/admin')) {
            navigate('/login', { state: { from: location.pathname } });
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Authentication error'));
      } finally {
        setIsLoading(false);
      }
    });
    
    // Cleanup subscription
    return () => unsubscribe();
  }, [navigate, location.pathname]);
  
  // Effect for section based on URL
  useEffect(() => {
    if (location.pathname.startsWith('/admin/')) {
      const section = location.pathname.split('/')[2] || 'overview';
      setCurrentSection(section);
    }
  }, [location.pathname]);
  
  // Effect for loading VigilObserver data
  useEffect(() => {
    // Only load data if user is authenticated and admin
    if (currentUser && isAdmin && !isLoading) {
      refreshVigilData();
    }
  }, [currentUser, isAdmin, isLoading]);
  
  // Function to refresh VigilObserver data
  const refreshVigilData = async () => {
    try {
      const vigilObserverExtensionPoint = getVigilObserverExtensionPoint();
      if (!vigilObserverExtensionPoint) {
        console.error('VigilObserver extension point not found');
        return;
      }
      
      const implementation = vigilObserverExtensionPoint.getDefault();
      if (!implementation) {
        console.error('VigilObserver implementation not found');
        return;
      }
      
      // Get metrics
      const metrics = implementation.getMetrics();
      setVigilMetrics(metrics);
      
      // Get violations
      const violations = implementation.getViolations();
      setVigilViolations(violations);
      
      // Get enforcements
      const enforcements = implementation.getEnforcements();
      setVigilEnforcements(enforcements);
      
      // Get compliance status
      const complianceStatus = implementation.analyzeComplianceStatus();
      setVigilComplianceStatus(complianceStatus);
      
      // Get observations (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const observations = await implementation.getObservations({
        startDate: thirtyDaysAgo.toISOString(),
        limit: 100
      });
      setVigilObservations(observations);
      
    } catch (err) {
      console.error('Error loading VigilObserver data:', err);
      setError(err instanceof Error ? err : new Error('Error loading VigilObserver data'));
    }
  };
  
  // Function to get metrics by category
  const getVigilMetricsByCategory = (category: string) => {
    try {
      const vigilObserverExtensionPoint = getVigilObserverExtensionPoint();
      if (!vigilObserverExtensionPoint) {
        return {};
      }
      
      const implementation = vigilObserverExtensionPoint.getDefault();
      if (!implementation) {
        return {};
      }
      
      return implementation.getMetrics(category);
    } catch (err) {
      console.error('Error getting VigilObserver metrics by category:', err);
      return {};
    }
  };
  
  // Function to get violations by rule
  const getVigilViolationsByRule = (ruleId: string, severity?: string) => {
    try {
      const vigilObserverExtensionPoint = getVigilObserverExtensionPoint();
      if (!vigilObserverExtensionPoint) {
        return [];
      }
      
      const implementation = vigilObserverExtensionPoint.getDefault();
      if (!implementation) {
        return [];
      }
      
      return implementation.getViolations(ruleId, severity || '');
    } catch (err) {
      console.error('Error getting VigilObserver violations by rule:', err);
      return [];
    }
  };
  
  // Function to get enforcements by action
  const getVigilEnforcementsByAction = (action: string, ruleId?: string) => {
    try {
      const vigilObserverExtensionPoint = getVigilObserverExtensionPoint();
      if (!vigilObserverExtensionPoint) {
        return [];
      }
      
      const implementation = vigilObserverExtensionPoint.getDefault();
      if (!implementation) {
        return [];
      }
      
      return implementation.getEnforcements(action, ruleId || '');
    } catch (err) {
      console.error('Error getting VigilObserver enforcements by action:', err);
      return [];
    }
  };
  
  // Context value
  const contextValue: AdminDashboardContextType = {
    // Authentication
    currentUser,
    isAdmin,
    userRoles,
    userPermissions,
    
    // Navigation
    currentSection,
    setCurrentSection,
    
    // Loading states
    isLoading,
    
    // Error handling
    error,
    clearError,
    
    // VigilObserver data
    vigilMetrics,
    vigilViolations,
    vigilEnforcements,
    vigilComplianceStatus,
    vigilObservations,
    
    // VigilObserver actions
    refreshVigilData,
    getVigilMetricsByCategory,
    getVigilViolationsByRule,
    getVigilEnforcementsByAction
  };
  
  return (
    <AdminDashboardContext.Provider value={contextValue}>
      {children}
    </AdminDashboardContext.Provider>
  );
};

export default AdminDashboardContext;
