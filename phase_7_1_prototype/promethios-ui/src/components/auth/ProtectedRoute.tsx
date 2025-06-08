import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { checkOnboardingStatus } from '../../firebase/userService';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireOnboarding?: boolean;
}

/**
 * ProtectedRoute Component
 * 
 * This component ensures that users complete onboarding before accessing protected routes.
 * It checks the user's onboarding status and redirects to onboarding if not completed.
 * Optimized for faster loading with caching and reduced checks.
 */
const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requireOnboarding = true 
}) => {
  const { currentUser, loading } = useAuth();
  const [onboardingCompleted, setOnboardingCompleted] = useState<boolean | null>(null);
  const [checkingOnboarding, setCheckingOnboarding] = useState(true);

  useEffect(() => {
    const checkUserOnboarding = async () => {
      if (!currentUser) {
        setCheckingOnboarding(false);
        return;
      }

      // Check localStorage cache first for faster loading
      const cacheKey = `onboarding_${currentUser.uid}`;
      const cachedStatus = localStorage.getItem(cacheKey);
      
      if (cachedStatus !== null) {
        const completed = cachedStatus === 'true';
        setOnboardingCompleted(completed);
        setCheckingOnboarding(false);
        
        // Still check Firebase in background to ensure accuracy
        checkOnboardingStatus(currentUser.uid).then(firebaseStatus => {
          if (firebaseStatus !== completed) {
            setOnboardingCompleted(firebaseStatus);
            localStorage.setItem(cacheKey, firebaseStatus.toString());
          }
        }).catch(console.error);
        
        return;
      }

      try {
        const completed = await checkOnboardingStatus(currentUser.uid);
        setOnboardingCompleted(completed);
        // Cache the result for faster subsequent loads
        localStorage.setItem(cacheKey, completed.toString());
      } catch (error) {
        console.error('Error checking onboarding status:', error);
        // If we can't check onboarding status, assume it's not completed
        setOnboardingCompleted(false);
      } finally {
        setCheckingOnboarding(false);
      }
    };

    if (!loading) {
      checkUserOnboarding();
    }
  }, [currentUser, loading]);

  // Show loading while checking authentication or onboarding status
  if (loading || checkingOnboarding) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-300">Loading...</p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  // Redirect to onboarding if required and not completed
  if (requireOnboarding && onboardingCompleted === false) {
    return <Navigate to="/ui/onboarding" replace />;
  }

  // Render the protected content
  return <>{children}</>;
};

export default ProtectedRoute;
