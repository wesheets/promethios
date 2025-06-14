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

      // For new users, check if they really need onboarding
      setOnboardingCompleted(null); // Set to null initially to force proper check
      setCheckingOnboarding(false);
      
      // Check Firebase immediately for new users
      setTimeout(async () => {
        try {
          const completed = await checkOnboardingStatus(currentUser.uid);
          console.log('Firebase onboarding status for new user:', completed);
          setOnboardingCompleted(completed);
          localStorage.setItem(cacheKey, completed.toString());
        } catch (error) {
          console.error('Firebase onboarding check failed:', error);
          // Default to false for new users if Firebase fails
          setOnboardingCompleted(false);
          localStorage.setItem(cacheKey, 'false');
        }
      }, 50); // Very quick check for new users
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
      console.log('User has completed onboarding (cached), allowing access');
      // User has completed onboarding, don't redirect
      return <>{children}</>;
    }
    
    // For new users (no cache) or incomplete users, redirect to onboarding if required
    if (requireOnboarding) {
      console.log('Redirecting to onboarding - requireOnboarding=true, no completion cache');
      return <Navigate to="/ui/onboarding" replace />;
    }
    
    console.log('Allowing access - requireOnboarding=false');
    // If onboarding not required, show content
    return <>{children}</>;
  }

  // Redirect to login if not authenticated
  if (!currentUser) {
      console.log("ProtectedRoute Debug: User not authenticated, redirecting to /login");
    return <Navigate to="/login" replace />;
  }

  // Redirect to onboarding if required and not completed (including null state for new users)
  if (requireOnboarding && (onboardingCompleted === false || onboardingCompleted === null)) {
    console.log("ProtectedRoute Debug: Onboarding required and not completed, redirecting to /ui/onboarding", { onboardingCompleted });
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
