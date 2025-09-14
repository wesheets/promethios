/**
 * Utility Navigation Hook
 * Provides navigation functions for the TopRightUtilityBar
 */

import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const useUtilityNavigation = () => {
  const navigate = useNavigate();
  const { logout: authLogout } = useAuth();

  const navigateToProfile = () => {
    navigate('/ui/profile');
  };

  const navigateToPreferences = () => {
    navigate('/ui/preferences');
  };

  const navigateToOrganization = () => {
    navigate('/ui/organization');
  };

  const navigateToIntegrations = () => {
    navigate('/ui/integrations');
  };

  const navigateToDataManagement = () => {
    navigate('/ui/data-management');
  };

  const navigateToApiKeys = () => {
    navigate('/ui/api-keys');
  };

  const navigateToDocumentation = () => {
    navigate('/documentation');
  };

  const navigateToGuidedTours = () => {
    navigate('/guided-tours');
  };

  const navigateToSupport = () => {
    navigate('/support');
  };

  const handleLogout = async () => {
    try {
      await authLogout();
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
      // Fallback logout
      localStorage.removeItem('authToken');
      sessionStorage.clear();
      navigate('/');
    }
  };

  return {
    navigateToProfile,
    navigateToPreferences,
    navigateToOrganization,
    navigateToIntegrations,
    navigateToDataManagement,
    navigateToApiKeys,
    navigateToDocumentation,
    navigateToGuidedTours,
    navigateToSupport,
    handleLogout
  };
};

export default useUtilityNavigation;

