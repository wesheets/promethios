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
    console.log("ProtectedRoute: checkUserOnboarding called");
      if (!currentUser) {
        console.log("ProtectedRoute: No current user, setting checkingOnboarding to false");
        setCheckingOnboarding(false);
        return;
      }

      const cachedStatus = localStorage.getItem(cacheKey);
      console.log("ProtectedRoute: Current user exists, checking cache for onboarding status");
      
      if (cachedStatus !== null) {
        const completed = cachedStatus === 'true';
        setOnboardingCompleted(completed);
        setCheckingOnboarding(false);
        return; // Skip Firebase check for cached users
      }

      setCheckingOnboarding(false);
      
      // Check Firebase immediately for new users
      setTimeout(async () => {
        try {
          const completed = await checkOnboardingStatus(currentUser.uid);
          setOnboardingCompleted(completed);
          localStorage.setItem(cacheKey, completed.toString());
        } catch (error) {
          // Default to false for new users if Firebase fails
          setOnboardingCompleted(false);
          localStorage.setItem(cacheKey, 'false');
        }
      }, 50); // Very quick check for new users
    }

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
    // Check cache immediately to avoid unnecessary redirects
    const cacheKey = `onboarding_${currentUser.uid}`;
    const cachedStatus = localStorage.getItem(cacheKey);
    
    console.log('ProtectedRoute Debug:', {
      userId: currentUser.uid,
      requireOnboarding,
      cachedStatus,
      checkingOnboarding: true
    });
    
    if (cachedStatus === 'true') {
      // User has completed onboarding, don't redirect
      return <>{children}</>;
    }
    
    // For new users (no cache) or incomplete users, redirect to onboarding if required
    if (requireOnboarding) {
      return <Navigate to="/ui/onboarding" replace />;
    }
    
    // If onboarding not required, show content
    return <>{children}</>;
  }

  // Redirect to login if not authenticated
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  // Redirect to onboarding if required and not completed (including null state for new users)
  if (requireOnboarding && (onboardingCompleted === false || onboardingCompleted === null)) {
    return <Navigate to="/ui/onboarding" replace />;
  }

  console.log("ProtectedRoute Debug: Allowing access to protected content", {
    requireOnboarding,
    onboardingCompleted,
    checkingOnboarding
  });

  // Render the protected content
  return <>{children}</>;
};

export default ProtectedRoute;
