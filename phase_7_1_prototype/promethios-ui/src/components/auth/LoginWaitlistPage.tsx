import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { FirebaseError } from 'firebase/app';
import { addToWaitlist } from '../../firebase/waitlistService';

const LoginWaitlistPage: React.FC = () => {
  const { isDarkMode } = useTheme();
  const navigate = useNavigate();
  const { loginWithEmail, loginWithGoogle, signup, resetPassword } = useAuth();
  
  // State for login form
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [resetPasswordEmail, setResetPasswordEmail] = useState('');
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [resetPasswordSuccess, setResetPasswordSuccess] = useState(false);
  
  // State for waitlist form
  const [waitlistEmail, setWaitlistEmail] = useState('');
  const [role, setRole] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [waitlistError, setWaitlistError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Toggle between login and waitlist forms - default to login form
  const [showLoginForm, setShowLoginForm] = useState(true);
  
  const handleLoginWithEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setIsLoggingIn(true);
    
    try {
      await loginWithEmail(loginEmail, loginPassword);
      navigate('/ui/dashboard'); // Redirect to new UI dashboard after login
    } catch (error) {
      const firebaseError = error as FirebaseError;
      let errorMessage = 'Authentication failed. Please try again.';
      
      if (firebaseError.code === 'auth/user-not-found' || firebaseError.code === 'auth/wrong-password') {
        errorMessage = 'Invalid email or password. Please try again.';
      } else if (firebaseError.code === 'auth/too-many-requests') {
        errorMessage = 'Too many failed login attempts. Please try again later.';
      } else if (firebaseError.code === 'auth/user-disabled') {
        errorMessage = 'This account has been disabled. Please contact support.';
      } else if (firebaseError.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address format.';
      }
      
      setLoginError(errorMessage);
    } finally {
      setIsLoggingIn(false);
    }
  };
  
  const handleLoginWithGoogle = async () => {
    setLoginError('');
    setIsLoggingIn(true);
    
    try {
      await loginWithGoogle();
      navigate('/ui/dashboard'); // Redirect to new UI dashboard after login
    } catch (error) {
      const firebaseError = error as FirebaseError;
      let errorMessage = 'Google authentication failed. Please try again.';
      
      if (firebaseError.code === 'auth/popup-closed-by-user') {
        errorMessage = 'Sign-in popup was closed before completing the sign in.';
      } else if (firebaseError.code === 'auth/popup-blocked') {
        errorMessage = 'Sign-in popup was blocked by the browser.';
      } else if (firebaseError.code === 'auth/unauthorized-domain') {
        errorMessage = 'This domain is not authorized for Google sign-in. Please contact support or try email login.';
      } else if (firebaseError.code === 'auth/operation-not-allowed') {
        errorMessage = 'Google sign-in is not enabled. Please try email login or contact support.';
      }
      
      console.error('Google Auth Error:', firebaseError);
      setLoginError(errorMessage);
    } finally {
      setIsLoggingIn(false);
    }
  };
  
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setIsLoggingIn(true);
    
    try {
      await resetPassword(resetPasswordEmail);
      setResetPasswordSuccess(true);
    } catch (error) {
      const firebaseError = error as FirebaseError;
      let errorMessage = 'Password reset failed. Please try again.';
      
      if (firebaseError.code === 'auth/user-not-found') {
        errorMessage = 'No account found with this email address.';
      } else if (firebaseError.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address format.';
      }
      
      setLoginError(errorMessage);
    } finally {
      setIsLoggingIn(false);
    }
  };
  
  const handleWaitlistSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setWaitlistError('');
    setIsSubmitting(true);
    
    try {
      // Store the waitlist entry in Firestore
      const result = await addToWaitlist(waitlistEmail, role);
      
      if (result === 'exists') {
        // Email already exists in waitlist, but we'll show success anyway
        console.log('Email already in waitlist:', waitlistEmail);
      } else {
        console.log('Added to waitlist with ID:', result);
      }
      
      // Show success state
      setSubmitted(true);
    } catch (error) {
      console.error('Waitlist submission error:', error);
      setWaitlistError('Failed to join waitlist. Please try again later.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className={`min-h-screen w-full ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'} flex flex-col justify-center py-12 sm:px-6 lg:px-8`}>
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
            Beta
          </span>
        </div>
        <h2 className="mt-3 text-center text-3xl font-extrabold">
          {showLoginForm ? 'Sign in to Promethios' : 'Join the Waitlist'}
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
          {showLoginForm 
            ? 'Access is currently limited to admins, investors, and early access developers.' 
            : 'Promethios is currently in invite-only beta. Join the waitlist to be notified when spots become available.'}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className={`${isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white shadow'} py-8 px-4 sm:rounded-lg sm:px-10`}>
          {showLoginForm ? (
            !showResetPassword ? (
              // Login Form
              <div>
                {loginError && (
                  <div className="rounded-md bg-red-50 dark:bg-red-900/30 p-4 mb-4">
                    <div className="flex">
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-red-800 dark:text-red-200">{loginError}</h3>
                      </div>
                    </div>
                  </div>
                )}
                
                <form className="space-y-6" onSubmit={handleLoginWithEmail}>
                  <div>
                    <label htmlFor="login-email" className="block text-sm font-medium">
                      Email address
                    </label>
                    <div className="mt-1">
                      <input
                        id="login-email"
                        name="email"
                        type="email"
                        autoComplete="email"
                        required
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        className={`appearance-none block w-full px-3 py-2 border ${isDarkMode ? 'border-gray-700 bg-gray-700 text-white' : 'border-gray-300'} rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm`}
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="password" className="block text-sm font-medium">
                      Password
                    </label>
                    <div className="mt-1">
                      <input
                        id="password"
                        name="password"
                        type="password"
                        autoComplete="current-password"
                        required
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        className={`appearance-none block w-full px-3 py-2 border ${isDarkMode ? 'border-gray-700 bg-gray-700 text-white' : 'border-gray-300'} rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm`}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <input
                        id="remember-me"
                        name="remember-me"
                        type="checkbox"
                        className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                      />
                      <label htmlFor="remember-me" className="ml-2 block text-sm">
                        Remember me
                      </label>
                    </div>

                    <div className="text-sm">
                      <button 
                        type="button"
                        onClick={() => setShowResetPassword(true)}
                        className="font-medium text-purple-600 hover:text-purple-500 bg-transparent border-none cursor-pointer"
                      >
                        Forgot your password?
                      </button>
                    </div>
                  </div>

                  <div>
                    <button
                      type="submit"
                      disabled={isLoggingIn}
                      className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50"
                    >
                      {isLoggingIn ? 'Signing in...' : 'Sign in with Email'}
                    </button>
                  </div>
                </form>
                
                <div className="mt-6">
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className={`w-full border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-300'}`}></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className={`px-2 ${isDarkMode ? 'bg-gray-800' : 'bg-white'} text-gray-500`}>
                        Or continue with
                      </span>
                    </div>
                  </div>

                  <div className="mt-6">
                    <button
                      onClick={handleLoginWithGoogle}
                      disabled={isLoggingIn}
                      className="w-full flex justify-center items-center py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50"
                    >
                      <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24" width="24" height="24">
                        <g transform="matrix(1, 0, 0, 1, 27.009001, -39.238998)">
                          <path fill="#4285F4" d="M -3.264 51.509 C -3.264 50.719 -3.334 49.969 -3.454 49.239 L -14.754 49.239 L -14.754 53.749 L -8.284 53.749 C -8.574 55.229 -9.424 56.479 -10.684 57.329 L -10.684 60.329 L -6.824 60.329 C -4.564 58.239 -3.264 55.159 -3.264 51.509 Z"/>
                          <path fill="#34A853" d="M -14.754 63.239 C -11.514 63.239 -8.804 62.159 -6.824 60.329 L -10.684 57.329 C -11.764 58.049 -13.134 58.489 -14.754 58.489 C -17.884 58.489 -20.534 56.379 -21.484 53.529 L -25.464 53.529 L -25.464 56.619 C -23.494 60.539 -19.444 63.239 -14.754 63.239 Z"/>
                          <path fill="#FBBC05" d="M -21.484 53.529 C -21.734 52.809 -21.864 52.039 -21.864 51.239 C -21.864 50.439 -21.724 49.669 -21.484 48.949 L -21.484 45.859 L -25.464 45.859 C -26.284 47.479 -26.754 49.299 -26.754 51.239 C -26.754 53.179 -26.284 54.999 -25.464 56.619 L -21.484 53.529 Z"/>
                          <path fill="#EA4335" d="M -14.754 43.989 C -12.984 43.989 -11.404 44.599 -10.154 45.789 L -6.734 42.369 C -8.804 40.429 -11.514 39.239 -14.754 39.239 C -19.444 39.239 -23.494 41.939 -25.464 45.859 L -21.484 48.949 C -20.534 46.099 -17.884 43.989 -14.754 43.989 Z"/>
                        </g>
                      </svg>
                      Sign in with Google
                    </button>
                  </div>
                </div>
              </div>
            ) : !resetPasswordSuccess ? (
              // Reset Password Form
              <div>
                {loginError && (
                  <div className="rounded-md bg-red-50 dark:bg-red-900/30 p-4 mb-4">
                    <div className="flex">
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-red-800 dark:text-red-200">{loginError}</h3>
                      </div>
                    </div>
                  </div>
                )}
                
                <form className="space-y-6" onSubmit={handleResetPassword}>
                  <div>
                    <label htmlFor="reset-email" className="block text-sm font-medium">
                      Email address
                    </label>
                    <div className="mt-1">
                      <input
                        id="reset-email"
                        name="email"
                        type="email"
                        autoComplete="email"
                        required
                        value={resetPasswordEmail}
                        onChange={(e) => setResetPasswordEmail(e.target.value)}
                        className={`appearance-none block w-full px-3 py-2 border ${isDarkMode ? 'border-gray-700 bg-gray-700 text-white' : 'border-gray-300'} rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm`}
                      />
                    </div>
                  </div>

                  <div>
                    <button
                      type="submit"
                      disabled={isLoggingIn}
                      className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50"
                    >
                      {isLoggingIn ? 'Sending...' : 'Send Reset Link'}
                    </button>
                  </div>
                </form>
                
                <div className="mt-4 text-center">
                  <button
                    onClick={() => setShowResetPassword(false)}
                    className="text-sm font-medium text-purple-600 hover:text-purple-500 bg-transparent border-none cursor-pointer"
                  >
                    Back to Sign In
                  </button>
                </div>
              </div>
            ) : (
              // Reset Password Success
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="text-center py-6"
              >
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900">
                  <svg className="h-6 w-6 text-blue-600 dark:text-blue-300" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="mt-3 text-lg font-medium">Check your email</h3>
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                  We've sent a password reset link to <strong>{resetPasswordEmail}</strong>. 
                  Please check your inbox and follow the instructions to reset your password.
                </p>
                <div className="mt-6">
                  <button
                    onClick={() => {
                      setShowResetPassword(false);
                      setResetPasswordSuccess(false);
                      setResetPasswordEmail('');
                    }}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                  >
                    Back to Sign In
                  </button>
                </div>
              </motion.div>
            )
          ) : !submitted ? (
            // Waitlist Form
            <form className="space-y-6" onSubmit={handleWaitlistSubmit}>
              {waitlistError && (
                <div className="rounded-md bg-red-50 dark:bg-red-900/30 p-4 mb-4">
                  <div className="flex">
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-red-800 dark:text-red-200">{waitlistError}</h3>
                    </div>
                  </div>
                </div>
              )}
              
              <div>
                <label htmlFor="waitlist-email" className="block text-sm font-medium">
                  Email address
                </label>
                <div className="mt-1">
                  <input
                    id="waitlist-email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={waitlistEmail}
                    onChange={(e) => setWaitlistEmail(e.target.value)}
                    className={`appearance-none block w-full px-3 py-2 border ${isDarkMode ? 'border-gray-700 bg-gray-700 text-white' : 'border-gray-300'} rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm`}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="role" className="block text-sm font-medium">
                  I am a...
                </label>
                <div className="mt-1">
                  <select
                    id="role"
                    name="role"
                    required
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className={`appearance-none block w-full px-3 py-2 border ${isDarkMode ? 'border-gray-700 bg-gray-700 text-white' : 'border-gray-300'} rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm`}
                  >
                    <option value="">Select your role</option>
                    <option value="developer">Developer</option>
                    <option value="investor">Investor</option>
                    <option value="researcher">Researcher</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50"
                >
                  {isSubmitting ? 'Submitting...' : 'Join Waitlist'}
                </button>
              </div>
            </form>
          ) : (
            // Waitlist Confirmation
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="text-center py-6"
            >
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 dark:bg-green-900">
                <svg className="h-6 w-6 text-green-600 dark:text-green-300" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="mt-3 text-lg font-medium">You're on the list!</h3>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                Thank you for your interest in Promethios. We'll notify you when a spot becomes available.
              </p>
              <div className="mt-6">
                <a
                  href="/"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                >
                  Return to Home
                </a>
              </div>
            </motion.div>
          )}
        </div>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {showLoginForm ? (
              <>
                Don't have an invite?{' '}
                <button 
                  onClick={() => {
                    setShowLoginForm(false);
                    setShowResetPassword(false);
                    setResetPasswordSuccess(false);
                  }} 
                  className="font-medium text-purple-600 hover:text-purple-500 bg-transparent border-none cursor-pointer"
                >
                  Join the waitlist
                </button>
              </>
            ) : (
              <>
                Already have an invite?{' '}
                <button 
                  onClick={() => setShowLoginForm(true)} 
                  className="font-medium text-purple-600 hover:text-purple-500 bg-transparent border-none cursor-pointer"
                >
                  Sign in
                </button>
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginWaitlistPage;
