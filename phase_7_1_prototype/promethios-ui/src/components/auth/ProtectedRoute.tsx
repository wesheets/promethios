import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { checkOnboardingStatus } from '../../firebase/userService';
import ApprovalGateScreen from './ApprovalGateScreen';

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
  const { currentUser, loading, approvalStatus, userProfile } = useAuth();
  const [onboardingCompleted, setOnboardingCompleted] = useState<boolean | null>(null);
  const [checkingOnboarding, setCheckingOnboarding] = useState(true);

  useEffect(() => {
    const checkUserOnboarding = async () => {
      if (!currentUser) {
        console.log("ProtectedRoute: No current user, setting checkingOnboarding to false");
        setCheckingOnboarding(false);
        return;
      }

      const cachedStatus = localStorage.getItem(`onboarding_${currentUser.uid}`);
      console.log("ProtectedRoute: Current user exists, checking cache for onboarding status");
      
      if (cachedStatus !== null) {
        const completed = cachedStatus === 'true';
        setOnboardingCompleted(completed);
        setCheckingOnboarding(false);
        console.log(`ProtectedRoute: Cached onboarding status found: ${completed}`);
        return; // Skip Firebase check for cached users
      }

      console.log("ProtectedRoute: No cached onboarding status, checking Firebase");
      setCheckingOnboarding(false);
      
      // Check Firebase immediately for new users
      setTimeout(async () => {
        try {
          console.log(`ProtectedRoute: Calling checkOnboardingStatus for user: ${currentUser.uid}`);
          const completed = await checkOnboardingStatus(currentUser.uid);
          setOnboardingCompleted(completed);
          localStorage.setItem(`onboarding_${currentUser.uid}`, completed.toString());
          console.log(`ProtectedRoute: Firebase onboarding status for new user: ${completed}`);
        } catch (error) {
          console.error("ProtectedRoute: Firebase onboarding check failed:", error);
          // Default to false for new users if Firebase fails
          setOnboardingCompleted(false);
          localStorage.setItem(`onboarding_${currentUser.uid}`, 'false');
        }
      }, 50); // Very quick check for new users
    };

    if (!loading) {
      console.log("ProtectedRoute: Auth loading complete, initiating checkUserOnboarding");
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
      console.log("User has completed onboarding (cached), allowing access");
      // User has completed onboarding, don't redirect
      return <>{children}</>;
    }
    
    // For new users (no cache) or incomplete users, redirect to onboarding if required
    if (requireOnboarding) {
      console.log("Redirecting to onboarding - requireOnboarding=true, no completion cache");
      return <Navigate to="/ui/onboarding" replace />;
    }
    
    console.log("Allowing access - requireOnboarding=false");
    // If onboarding not required, show content
    return <>{children}</>;
  }

  // Redirect to login if not authenticated
  if (!currentUser) {
    console.log("ProtectedRoute Debug: User not authenticated, redirecting to /login");
    return <Navigate to="/login" replace />;
  }

  // Check approval status for authenticated users
  if (currentUser && userProfile) {
    // Show approval gate for pending users
    if (approvalStatus === 'pending') {
      console.log("ProtectedRoute Debug: User has pending approval status, showing approval gate");
      return <ApprovalGateScreen />;
    }
    
    // Show rejection message for rejected users
    if (approvalStatus === 'rejected') {
      console.log("ProtectedRoute Debug: User has been rejected, showing rejection message");
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-900">
          <div className="max-w-md mx-auto text-center p-8 bg-gray-800 rounded-lg border border-red-500">
            <div className="text-red-500 text-6xl mb-4">❌</div>
            <h2 className="text-2xl font-bold text-white mb-4">Access Denied</h2>
            <p className="text-gray-300 mb-4">
              Your application for Spark beta access has been reviewed and unfortunately was not approved at this time.
            </p>
            {userProfile.adminNotes && (
              <div className="bg-gray-700 p-4 rounded mb-4">
                <p className="text-sm text-gray-300">
                  <strong>Admin Notes:</strong> {userProfile.adminNotes}
                </p>
              </div>
            )}
            <p className="text-sm text-gray-400">
              You may reapply in the future when additional beta slots become available.
            </p>
          </div>
        </div>
      );
    }
  }

  // If user is authenticated but no profile exists, redirect to signup
  if (currentUser && !userProfile && !loading) {
    console.log("ProtectedRoute Debug: User authenticated but no profile exists, redirecting to signup");
    return <Navigate to="/signup" replace />;
  }

  // Redirect to onboarding if required and not completed (including null state for new users)
  if (requireOnboarding && (onboardingCompleted === false || onboardingCompleted === null)) {
    console.log("ProtectedRoute Debug: Onboarding required and not completed, redirecting to /ui/onboarding");
    return <Navigate to="/ui/onboarding" replace />;
  }

  console.log("ProtectedRoute Debug: Allowing access to protected content", {
    requireOnboarding,
    onboardingCompleted,
    checkingOnboarding
  });

  // Render the protected content
  return <>{children}</>;
}

export default ProtectedRoute;


