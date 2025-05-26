import React from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '../../context/ThemeContext';

const EmailVerification: React.FC = () => {
  const { isDarkMode } = useTheme();
  const [email, setEmail] = React.useState('');
  const [verificationSent, setVerificationSent] = React.useState(false);
  const [verificationCode, setVerificationCode] = React.useState('');
  const [isVerifying, setIsVerifying] = React.useState(false);
  const [error, setError] = React.useState('');

  const handleSendVerification = (e: React.FormEvent) => {
    e.preventDefault();
    setIsVerifying(true);
    
    // Simulate sending verification email
    setTimeout(() => {
      setVerificationSent(true);
      setIsVerifying(false);
    }, 1500);
  };

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    setIsVerifying(true);
    setError('');
    
    // Simulate verification process
    setTimeout(() => {
      // In a real implementation, this would verify the code with a backend service
      if (verificationCode === '123456') {
        window.location.href = '/onboarding';
      } else {
        setError('Invalid verification code. Please check your email and try again.');
        setIsVerifying(false);
      }
    }, 1500);
  };

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'} flex flex-col justify-center py-12 sm:px-6 lg:px-8`}>
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
            Beta
          </span>
        </div>
        <h2 className="mt-3 text-center text-3xl font-extrabold">Verify your email</h2>
        <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
          {!verificationSent 
            ? "We'll send a verification code to your email" 
            : "Enter the verification code sent to your email"}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className={`${isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white shadow'} py-8 px-4 sm:rounded-lg sm:px-10`}>
          {!verificationSent ? (
            <form className="space-y-6" onSubmit={handleSendVerification}>
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
                    className={`appearance-none block w-full px-3 py-2 border ${isDarkMode ? 'border-gray-700 bg-gray-700 text-white' : 'border-gray-300'} rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm`}
                  />
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={isVerifying}
                  className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 ${isVerifying ? 'opacity-70 cursor-not-allowed' : ''}`}
                >
                  {isVerifying ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Sending...
                    </>
                  ) : (
                    'Send verification code'
                  )}
                </button>
              </div>
            </form>
          ) : (
            <motion.form 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="space-y-6" 
              onSubmit={handleVerify}
            >
              <div>
                <label htmlFor="verification-code" className="block text-sm font-medium">
                  Verification code
                </label>
                <div className="mt-1">
                  <input
                    id="verification-code"
                    name="verification-code"
                    type="text"
                    required
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value)}
                    className={`appearance-none block w-full px-3 py-2 border ${isDarkMode ? 'border-gray-700 bg-gray-700 text-white' : 'border-gray-300'} rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm`}
                    placeholder="123456"
                  />
                </div>
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                  Enter the 6-digit code sent to {email}
                </p>
              </div>

              {error && (
                <div className="rounded-md bg-red-50 dark:bg-red-900/30 p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-red-800 dark:text-red-200">{error}</h3>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setVerificationSent(false)}
                  className={`text-sm font-medium text-purple-600 hover:text-purple-500`}
                >
                  Change email
                </button>
                <button
                  type="button"
                  onClick={handleSendVerification}
                  className={`text-sm font-medium text-purple-600 hover:text-purple-500`}
                >
                  Resend code
                </button>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={isVerifying}
                  className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 ${isVerifying ? 'opacity-70 cursor-not-allowed' : ''}`}
                >
                  {isVerifying ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Verifying...
                    </>
                  ) : (
                    'Verify email'
                  )}
                </button>
              </div>
            </motion.form>
          )}
        </div>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Need help?{' '}
            <a href="mailto:support@promethios.ai" className="font-medium text-purple-600 hover:text-purple-500">
              Contact support
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default EmailVerification;
