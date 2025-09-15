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
    navigate('/ui/profile/settings');
  };

  const navigateToPreferences = () => {
    navigate('/ui/settings/preferences');
  };

  const navigateToOrganization = () => {
    navigate('/ui/settings/organization');
  };

  const navigateToIntegrations = () => {
    navigate('/ui/settings/integrations');
  };

  const navigateToDataManagement = () => {
    navigate('/ui/settings/data');
  };

  const navigateToApiKeys = () => {
    navigate('/ui/settings/api-keys');
  };

  const navigateToDocumentation = () => {
    navigate('/ui/help/documentation');
  };

  const navigateToGuidedTours = () => {
    navigate('/ui/help/tours');
  };

  const navigateToSupport = () => {
    navigate('/ui/help/support');
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

