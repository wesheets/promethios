import React from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '../../context/ThemeContext';

const WaitlistForm: React.FC = () => {
  const { isDarkMode } = useTheme();
  const [email, setEmail] = React.useState('');
  const [submitted, setSubmitted] = React.useState(false);
  const [role, setRole] = React.useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real implementation, this would connect to a waitlist service
    console.log('Added to waitlist:', { email, role });
    setSubmitted(true);
  };

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'} flex flex-col justify-center py-12 sm:px-6 lg:px-8`}>
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
            Beta
          </span>
        </div>
        <h2 className="mt-3 text-center text-3xl font-extrabold">Join the Waitlist</h2>
        <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
          Promethios is currently in invite-only beta. Join the waitlist to be notified when spots become available.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className={`${isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white shadow'} py-8 px-4 sm:rounded-lg sm:px-10`}>
          {!submitted ? (
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div>
                <label htmlFor="email" className="block text-sm font-medium">
                  Email address
                </label>
                <div className="mt-1">
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={`appearance-none block w-full px-3 py-2 border ${isDarkMode ? 'border-gray-700 bg-gray-700 text-white' : 'border-gray-300'} rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
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
                    className={`appearance-none block w-full px-3 py-2 border ${isDarkMode ? 'border-gray-700 bg-gray-700 text-white' : 'border-gray-300'} rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
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
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Join Waitlist
                </button>
              </div>
            </form>
          ) : (
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
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Return to Home
                </a>
              </div>
            </motion.div>
          )}
        </div>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Already have an invite?{' '}
            <a href="/login" className="font-medium text-blue-600 hover:text-blue-500">
              Sign in
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default WaitlistForm;
