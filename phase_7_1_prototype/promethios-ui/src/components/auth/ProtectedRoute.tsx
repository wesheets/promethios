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
 * Optimized for faster loading with aggressive caching and minimal checks.
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

      // For faster loading, assume new users need onboarding and skip Firebase check initially
      const cacheKey = `onboarding_${currentUser.uid}`;
      const cachedStatus = localStorage.getItem(cacheKey);
      
      if (cachedStatus !== null) {
        const completed = cachedStatus === 'true';
        setOnboardingCompleted(completed);
        setCheckingOnboarding(false);
        return; // Skip Firebase check for cached users
      }

      // For new users, assume they need onboarding and set immediately
      setOnboardingCompleted(false);
      setCheckingOnboarding(false);
      
      // Check Firebase in background and update if different
      setTimeout(async () => {
        try {
          const completed = await checkOnboardingStatus(currentUser.uid);
          if (completed !== false) {
            setOnboardingCompleted(completed);
            localStorage.setItem(cacheKey, completed.toString());
          }
        } catch (error) {
          console.error('Background onboarding check failed:', error);
        }
      }, 100); // Minimal delay for background check
    };

    if (!loading) {
      checkUserOnboarding();
    }
  }, [currentUser, loading]);

  // Minimize loading time - show content faster
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-300">Loading...</p>
        </div>
      </div>
    );
  }

  // Skip onboarding check loading for faster UX
  if (checkingOnboarding && currentUser) {
    // Immediately redirect to onboarding for faster perceived performance
    return <Navigate to="/ui/onboarding" replace />;
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
