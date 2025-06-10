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
  clearError: () => {}
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
    clearError
  };
  
  return (
    <AdminDashboardContext.Provider value={contextValue}>
      {children}
    </AdminDashboardContext.Provider>
  );
};

export default AdminDashboardContext;
