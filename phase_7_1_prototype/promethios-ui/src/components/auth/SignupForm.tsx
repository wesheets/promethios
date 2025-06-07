import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { FirebaseError } from 'firebase/app';
import { useTheme } from '../../context/ThemeContext';

const SignupForm: React.FC = () => {
  const { isDarkMode } = useTheme();
  const navigate = useNavigate();
  const { signup } = useAuth();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Form validation
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    if (password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }
    
    setError('');
    setIsSubmitting(true);
    
    try {
      await signup(email, password);
      // Redirect to onboarding flow instead of dashboard
      navigate('/onboarding');
    } catch (error) {
      const firebaseError = error as FirebaseError;
      let errorMessage = 'Failed to create an account. Please try again.';
      
      if (firebaseError.code === 'auth/email-already-in-use') {
        errorMessage = 'An account with this email already exists.';
      } else if (firebaseError.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address format.';
      } else if (firebaseError.code === 'auth/weak-password') {
        errorMessage = 'Password is too weak. Please choose a stronger password.';
      }
      
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full">
      {error && (
        <div className="rounded-md bg-red-50 dark:bg-red-900/30 p-4 mb-4">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800 dark:text-red-200">{error}</h3>
            </div>
          </div>
        </div>
      )}
      
      <form className="space-y-6" onSubmit={handleSignup}>
        <div>
          <label htmlFor="signup-email" className="block text-sm font-medium">
            Email address
          </label>
          <div className="mt-1">
            <input
              id="signup-email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`appearance-none block w-full px-3 py-2 border ${isDarkMode ? 'border-gray-700 bg-gray-700 text-white' : 'border-gray-300'} rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm`}
            />
          </div>
        </div>

        <div>
          <label htmlFor="signup-password" className="block text-sm font-medium">
            Password
          </label>
          <div className="mt-1">
            <input
              id="signup-password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`appearance-none block w-full px-3 py-2 border ${isDarkMode ? 'border-gray-700 bg-gray-700 text-white' : 'border-gray-300'} rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm`}
            />
          </div>
        </div>

        <div>
          <label htmlFor="confirm-password" className="block text-sm font-medium">
            Confirm Password
          </label>
          <div className="mt-1">
            <input
              id="confirm-password"
              name="confirm-password"
              type="password"
              autoComplete="new-password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className={`appearance-none block w-full px-3 py-2 border ${isDarkMode ? 'border-gray-700 bg-gray-700 text-white' : 'border-gray-300'} rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm`}
            />
          </div>
        </div>

        <div>
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50"
          >
            {isSubmitting ? 'Creating account...' : 'Create account'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default SignupForm;
