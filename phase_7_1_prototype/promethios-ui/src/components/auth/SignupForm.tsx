import React from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '../../context/ThemeContext';

const SignupForm: React.FC = () => {
  const { isDarkMode } = useTheme();
  const [email, setEmail] = React.useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real implementation, this would connect to an authentication service
    console.log('Account created with email:', email);
    // Redirect to onboarding
    window.location.href = '/onboarding';
  };

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'} flex flex-col justify-center py-12 sm:px-6 lg:px-8`}>
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="text-center text-3xl font-extrabold">Create your account</h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className={`${isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white shadow'} py-8 px-4 sm:rounded-lg sm:px-10`}>
          <div className="space-y-6">
            {/* Value proposition */}
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold">Save 60-80% of agent integration time</h3>
            </div>
            
            {/* Social logins */}
            <div className="space-y-3">
              <button
                type="button"
                className={`w-full flex justify-center items-center px-4 py-3 border ${isDarkMode ? 'border-gray-700 bg-gray-700 hover:bg-gray-600' : 'border-gray-300 bg-white hover:bg-gray-50'} rounded-md shadow-sm text-sm font-medium`}
              >
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z" />
                </svg>
                Sign up with Google
              </button>
              <button
                type="button"
                className={`w-full flex justify-center items-center px-4 py-3 border ${isDarkMode ? 'border-gray-700 bg-gray-700 hover:bg-gray-600' : 'border-gray-300 bg-white hover:bg-gray-50'} rounded-md shadow-sm text-sm font-medium`}
              >
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M11.4 24H0V12.6h11.4V24zM24 24H12.6V12.6H24V24zM11.4 11.4H0V0h11.4v11.4zM24 11.4H12.6V0H24v11.4z" />
                </svg>
                Sign up with Microsoft
              </button>
            </div>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className={`w-full border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-300'}`} />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className={`px-2 ${isDarkMode ? 'bg-gray-800' : 'bg-white'} text-gray-500`}>or</span>
              </div>
            </div>

            {/* Email form */}
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div>
                <label htmlFor="email" className="sr-only">
                  Email address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter email"
                  className={`appearance-none block w-full px-3 py-3 border ${isDarkMode ? 'border-gray-700 bg-gray-700 text-white placeholder-gray-400' : 'border-gray-300 placeholder-gray-400'} rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm`}
                />
              </div>

              <div>
                <button
                  type="submit"
                  className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                >
                  Sign up with email
                </button>
              </div>
            </form>
          </div>

          {/* Login link */}
          <div className="mt-6 text-center text-sm">
            <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Already have an account?{' '}
              <a href="/login" className="font-medium text-purple-600 hover:text-purple-500">
                Sign in
              </a>
            </p>
          </div>
        </div>

        {/* Trusted by section */}
        <div className="mt-8 text-center">
          <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Trusted by teams at</p>
          <div className="mt-4 flex justify-center space-x-8">
            <div className={`${isDarkMode ? 'text-gray-300' : 'text-gray-400'} font-medium`}>OpenAI</div>
            <div className={`${isDarkMode ? 'text-gray-300' : 'text-gray-400'} font-medium`}>Anthropic</div>
            <div className={`${isDarkMode ? 'text-gray-300' : 'text-gray-400'} font-medium`}>Cohere</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignupForm;
