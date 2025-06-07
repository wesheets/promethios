import React from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '../../context/ThemeContext';

const OnboardingFlow: React.FC = () => {
  const { isDarkMode } = useTheme();
  const [step, setStep] = React.useState(1);
  const totalSteps = 3;

  const nextStep = () => {
    if (step < totalSteps) {
      setStep(step + 1);
    } else {
      // Redirect to new dashboard implementation when onboarding is complete
      window.location.href = '/ui/dashboard';
    }
  };

  const prevStep = () => {
    if (step > 1) {
      setStep(step - 1);
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
        <h2 className="mt-3 text-center text-3xl font-extrabold">Welcome to Promethios</h2>
      </div>

      {/* Progress indicator */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md mt-6">
        <div className="flex justify-between items-center">
          {Array.from({ length: totalSteps }).map((_, index) => (
            <React.Fragment key={index}>
              {index > 0 && (
                <div 
                  className={`h-1 flex-1 ${index < step ? 'bg-purple-600' : isDarkMode ? 'bg-gray-700' : 'bg-gray-300'}`}
                ></div>
              )}
              <div 
                className={`w-8 h-8 flex items-center justify-center rounded-full text-sm font-medium ${
                  index + 1 <= step 
                    ? 'bg-purple-600 text-white' 
                    : isDarkMode 
                      ? 'bg-gray-700 text-gray-300' 
                      : 'bg-gray-300 text-gray-700'
                }`}
              >
                {index + 1}
              </div>
            </React.Fragment>
          ))}
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className={`${isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white shadow'} py-8 px-4 sm:rounded-lg sm:px-10`}>
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              <div className="text-center">
                <h3 className="text-lg font-medium">Tell us about your agent</h3>
                <p className={`mt-1 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  We'll help you set up governance for your AI agent
                </p>
              </div>

              <div>
                <label htmlFor="agent-name" className="block text-sm font-medium">
                  Agent name
                </label>
                <div className="mt-1">
                  <input
                    id="agent-name"
                    name="agent-name"
                    type="text"
                    placeholder="My Assistant"
                    className={`appearance-none block w-full px-3 py-2 border ${isDarkMode ? 'border-gray-700 bg-gray-700 text-white' : 'border-gray-300'} rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm`}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="agent-type" className="block text-sm font-medium">
                  Agent type
                </label>
                <div className="mt-1">
                  <select
                    id="agent-type"
                    name="agent-type"
                    className={`appearance-none block w-full px-3 py-2 border ${isDarkMode ? 'border-gray-700 bg-gray-700 text-white' : 'border-gray-300'} rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm`}
                  >
                    <option>General purpose assistant</option>
                    <option>Customer support</option>
                    <option>Research assistant</option>
                    <option>Creative assistant</option>
                    <option>Custom</option>
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="agent-description" className="block text-sm font-medium">
                  Brief description (optional)
                </label>
                <div className="mt-1">
                  <textarea
                    id="agent-description"
                    name="agent-description"
                    rows={3}
                    placeholder="What does your agent do?"
                    className={`appearance-none block w-full px-3 py-2 border ${isDarkMode ? 'border-gray-700 bg-gray-700 text-white' : 'border-gray-300'} rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm`}
                  ></textarea>
                </div>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              <div className="text-center">
                <h3 className="text-lg font-medium">Choose governance settings</h3>
                <p className={`mt-1 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Select the governance level that's right for your agent
                </p>
              </div>

              <div className="space-y-4">
                <div className={`p-4 border rounded-md ${isDarkMode ? 'border-gray-700 bg-gray-700/50' : 'border-gray-200'} cursor-pointer hover:border-purple-500`}>
                  <div className="flex items-center">
                    <input
                      id="governance-standard"
                      name="governance-level"
                      type="radio"
                      defaultChecked
                      className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300"
                    />
                    <label htmlFor="governance-standard" className="ml-3 block text-sm font-medium">
                      Standard governance
                      <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 ${isDarkMode ? 'bg-green-900/30 text-green-300' : ''}`}>
                        Recommended
                      </span>
                    </label>
                  </div>
                  <p className={`mt-1 ml-7 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    Balanced approach with 92% trust score and minimal performance impact
                  </p>
                </div>

                <div className={`p-4 border rounded-md ${isDarkMode ? 'border-gray-700 bg-gray-700/50' : 'border-gray-200'} cursor-pointer hover:border-purple-500`}>
                  <div className="flex items-center">
                    <input
                      id="governance-strict"
                      name="governance-level"
                      type="radio"
                      className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300"
                    />
                    <label htmlFor="governance-strict" className="ml-3 block text-sm font-medium">
                      Strict governance
                    </label>
                  </div>
                  <p className={`mt-1 ml-7 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    Maximum trust and compliance with moderate performance impact
                  </p>
                </div>

                <div className={`p-4 border rounded-md ${isDarkMode ? 'border-gray-700 bg-gray-700/50' : 'border-gray-200'} cursor-pointer hover:border-purple-500`}>
                  <div className="flex items-center">
                    <input
                      id="governance-custom"
                      name="governance-level"
                      type="radio"
                      className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300"
                    />
                    <label htmlFor="governance-custom" className="ml-3 block text-sm font-medium">
                      Custom governance
                    </label>
                  </div>
                  <p className={`mt-1 ml-7 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    Fine-tune individual governance parameters for your specific needs
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              <div className="text-center">
                <h3 className="text-lg font-medium">You're all set!</h3>
                <p className={`mt-1 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Your agent is now ready to be governed by Promethios
                </p>
              </div>

              <div className="flex justify-center">
                <div className="w-24 h-24 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                  <svg className="w-12 h-12 text-purple-600 dark:text-purple-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>

              <div className={`p-4 rounded-md ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                <h4 className="text-sm font-medium">Your governance summary</h4>
                <dl className="mt-2 divide-y ${isDarkMode ? 'divide-gray-600' : 'divide-gray-200'}">
                  <div className="py-2 flex justify-between">
                    <dt className="text-sm">Trust score</dt>
                    <dd className="text-sm font-medium text-green-600 dark:text-green-400">92/100</dd>
                  </div>
                  <div className="py-2 flex justify-between">
                    <dt className="text-sm">Compliance rate</dt>
                    <dd className="text-sm font-medium text-green-600 dark:text-green-400">95%</dd>
                  </div>
                  <div className="py-2 flex justify-between">
                    <dt className="text-sm">Error reduction</dt>
                    <dd className="text-sm font-medium text-green-600 dark:text-green-400">-82%</dd>
                  </div>
                </dl>
              </div>

              <div className="text-center">
                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  You can adjust these settings at any time from your dashboard
                </p>
              </div>
            </motion.div>
          )}

          <div className="mt-8 flex justify-between">
            {step > 1 ? (
              <button
                type="button"
                onClick={prevStep}
                className={`inline-flex items-center px-4 py-2 border rounded-md shadow-sm text-sm font-medium ${
                  isDarkMode 
                    ? 'border-gray-600 bg-gray-700 text-gray-200 hover:bg-gray-600' 
                    : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500`}
              >
                Back
              </button>
            ) : (
              <div></div> // Empty div to maintain layout with flex justify-between
            )}
            <button
              type="button"
              onClick={nextStep}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
            >
              {step < totalSteps ? 'Continue' : 'Go to dashboard'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OnboardingFlow;
