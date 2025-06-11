/**
 * Admin Header Link Component
 * 
 * This component renders the admin dashboard link in the main application header.
 * It is only visible to users with admin privileges.
 * 
 * Enhanced with VigilObserver integration to show governance status indicator.
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../core/auth/AuthContext';
import authService from '../core/firebase/authService';
import { getVigilObserverExtensionPoint } from '../core/extensions/vigilObserverExtension';

// Admin icon component
const AdminIcon: React.FC = () => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    className="h-5 w-5" 
    fill="none" 
    viewBox="0 0 24 24" 
    stroke="currentColor"
  >
    <path 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      strokeWidth={2} 
      d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" 
    />
    <path 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      strokeWidth={2} 
      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" 
    />
  </svg>
);

// Governance status indicator component
interface GovernanceStatusProps {
  status: 'compliant' | 'warning' | 'critical' | 'unknown';
}

const GovernanceStatus: React.FC<GovernanceStatusProps> = ({ status }) => {
  // Determine color based on status
  const getStatusColor = () => {
    switch (status) {
      case 'compliant':
        return 'bg-green-500';
      case 'warning':
        return 'bg-yellow-500';
      case 'critical':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <div className="relative">
      <div 
        className={`absolute -top-1 -right-1 w-3 h-3 ${getStatusColor()} rounded-full border border-blue-900`}
        title={`Governance Status: ${status.charAt(0).toUpperCase() + status.slice(1)}`}
      />
    </div>
  );
};

const AdminHeaderLink: React.FC = () => {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = React.useState<boolean>(false);
  const [isLoading, setIsLoading] = React.useState<boolean>(true);
  const [governanceStatus, setGovernanceStatus] = React.useState<'compliant' | 'warning' | 'critical' | 'unknown'>('unknown');

  // Check if user is admin
  React.useEffect(() => {
    const checkAdminStatus = async () => {
      if (!user) {
        setIsAdmin(false);
        setIsLoading(false);
        return;
      }

      try {
        const adminStatus = await authService.isAdmin(user);
        setIsAdmin(adminStatus);
      } catch (error) {
        console.error('Error checking admin status:', error);
        setIsAdmin(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAdminStatus();
  }, [user]);

  // Get governance status from VigilObserver
  React.useEffect(() => {
    const getGovernanceStatus = async () => {
      if (!isAdmin) {
        return;
      }

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

        const complianceStatus = implementation.analyzeComplianceStatus();
        
        if (complianceStatus.compliant) {
          setGovernanceStatus('compliant');
        } else if (complianceStatus.violationCount > 0) {
          // Check if there are any critical violations
          const metrics = implementation.getMetrics();
          const criticalCount = metrics?.violations?.bySeverity?.critical || 0;
          
          if (criticalCount > 0) {
            setGovernanceStatus('critical');
          } else {
            setGovernanceStatus('warning');
          }
        } else {
          setGovernanceStatus('unknown');
        }
      } catch (error) {
        console.error('Error getting governance status:', error);
        setGovernanceStatus('unknown');
      }
    };

    getGovernanceStatus();
  }, [isAdmin]);

  // Don't render anything while loading or if user is not admin
  if (isLoading || !isAdmin) {
    return null;
  }

  return (
    <Link 
      to="/admin/dashboard" 
      className="flex items-center px-3 py-2 text-sm font-medium text-blue-300 hover:text-blue-100 hover:bg-blue-800 rounded-md transition-colors duration-150 relative"
      aria-label="Admin Dashboard"
    >
      <div className="relative">
        <AdminIcon />
        <GovernanceStatus status={governanceStatus} />
      </div>
      <span className="ml-2">Admin</span>
    </Link>
  );
};

export default AdminHeaderLink;
