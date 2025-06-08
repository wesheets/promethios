import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { updateOnboardingStatus, saveAgentConfiguration } from '../../firebase/userService';
import { useNavigate } from 'react-router-dom';

// Tooltip component for governance terms
const Tooltip: React.FC<{ children: React.ReactNode; content: string }> = ({ children, content }) => {
  const [isVisible, setIsVisible] = useState(false);
  
  return (
    <div className="relative inline-block">
      <div
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
        className="cursor-help text-blue-400 font-medium border-b-2 border-blue-400 hover:text-blue-500 hover:border-blue-500 transition-colors flex items-center"
      >
        {children}
        <svg className="w-4 h-4 ml-0.5 inline-block" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
        </svg>
      </div>
      {isVisible && (
        <div className="absolute z-10 w-64 p-3 mt-1 text-sm bg-gray-800 text-white rounded-lg shadow-lg -left-1/2 transform -translate-x-1/2 border border-blue-400">
          {content}
          <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1 w-2 h-2 bg-gray-800 rotate-45 border-t border-l border-blue-400"></div>
        </div>
      )}
    </div>
  );
};

const OnboardingFlow: React.FC = () => {
  const { isDarkMode } = useTheme();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const totalSteps = 4;
  
  // Agent configuration state
  const [agentName, setAgentName] = useState('My Assistant');
  const [agentType, setAgentType] = useState('General purpose assistant');
  const [agentDescription, setAgentDescription] = useState('');
  const [governanceLevel, setGovernanceLevel] = useState('standard');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Get user's display name for personalization
  const getUserDisplayName = () => {
    if (currentUser?.displayName) {
      return currentUser.displayName.split(' ')[0]; // First name only
    }
    if (currentUser?.email) {
      return currentUser.email.split('@')[0]; // Username from email
    }
    return 'there'; // Fallback
  };

  const nextStep = async () => {
    if (step < totalSteps) {
      setStep(step + 1);
    } else {
      // Final step - save configuration and mark onboarding as complete
      if (currentUser) {
        setIsSubmitting(true);
        try {
          // First mark onboarding as complete to ensure state is updated
          await updateOnboardingStatus(currentUser.uid, true);
          
          // Then save agent configuration
          await saveAgentConfiguration(currentUser.uid, {
            name: agentName,
            type: agentType,
            description: agentDescription,
            governanceLevel: governanceLevel
          });
          
          // Use a short timeout to ensure Firebase state is updated before navigation
          setTimeout(() => {
            // Redirect to agent wizard with replace to prevent back navigation
            navigate('/ui/agent-wizard', { replace: true });
          }, 500);
        } catch (error) {
          console.error('Error completing onboarding:', error);
          // Fallback to direct navigation if saving fails
          navigate('/ui/agent-wizard', { replace: true });
        } finally {
          // Don't reset isSubmitting until after navigation to prevent UI flicker
        }
      } else {
        // Fallback if no user is found
        navigate('/ui/agent-wizard', { replace: true });
      }
    }
  };

  const prevStep = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };
  
  const skipOnboarding = async () => {
    if (currentUser) {
      setIsSubmitting(true);
      try {
        // First mark onboarding as complete to ensure state is updated
        await updateOnboardingStatus(currentUser.uid, true);
        
        // Save minimal agent configuration
        await saveAgentConfiguration(currentUser.uid, {
          name: 'Default Assistant',
          type: 'General purpose assistant',
          description: '',
          governanceLevel: 'standard'
        });
        
        // Track skip action with Observer agent
        console.log('Onboarding skipped - Observer agent should track this');
        
        // Use a short timeout to ensure Firebase state is updated before navigation
        setTimeout(() => {
          // Redirect to agent wizard with replace to prevent back navigation
          navigate('/ui/agent-wizard', { replace: true });
        }, 500);
      } catch (error) {
        console.error('Error skipping onboarding:', error);
        // Fallback to direct navigation if saving fails
        navigate('/ui/agent-wizard', { replace: true });
      } finally {
        // Don't reset isSubmitting until after navigation to prevent UI flicker
      }
    } else {
      // Fallback if no user is found
      navigate('/ui/agent-wizard', { replace: true });
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
          Welcome, {getUserDisplayName()}!
        </h2>
        <p className={`mt-2 text-center text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          Let's set up AI governance for your assistant
        </p>
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
        <div className="flex justify-between mt-2 text-xs text-gray-500">
          <span>Welcome</span>
          <span>Agent</span>
          <span>Governance</span>
          <span>Complete</span>
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
                <h3 className="text-lg font-medium">Welcome to Promethios</h3>
                <p className={`mt-1 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  We'll help you set up <Tooltip content="AI governance ensures your AI systems operate safely, ethically, and in compliance with your organization's policies and regulations.">AI governance</Tooltip> in just a few steps
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-purple-600 dark:text-purple-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium">Enhanced Trust & Safety</h4>
                    <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      Increase your AI's <Tooltip content="Trust score measures how reliably your AI follows governance policies and makes appropriate decisions.">trust score</Tooltip> by up to 95%
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-purple-600 dark:text-purple-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium">Real-time Monitoring</h4>
                    <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      Monitor <Tooltip content="Compliance tracking ensures your AI adheres to regulatory requirements and organizational policies in real-time.">compliance</Tooltip> and performance in real-time
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-purple-600 dark:text-purple-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium">Risk Mitigation</h4>
                    <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      Reduce AI-related risks and errors by up to 82%
                    </p>
                  </div>
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
                    value={agentName}
                    onChange={(e) => setAgentName(e.target.value)}
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
                    value={agentType}
                    onChange={(e) => setAgentType(e.target.value)}
                    className={`appearance-none block w-full px-3 py-2 border ${isDarkMode ? 'border-gray-700 bg-gray-700 text-white' : 'border-gray-300'} rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm`}
                  >
                    <option>General purpose assistant</option>
                    <option>Customer support</option>
                    <option>Research assistant</option>
                    <option>Creative assistant</option>
                    <option>Data analysis</option>
                    <option>Content generation</option>
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
                    value={agentDescription}
                    onChange={(e) => setAgentDescription(e.target.value)}
                    placeholder="What does your agent do?"
                    className={`appearance-none block w-full px-3 py-2 border ${isDarkMode ? 'border-gray-700 bg-gray-700 text-white' : 'border-gray-300'} rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm`}
                  ></textarea>
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
                <h3 className="text-lg font-medium">Choose governance settings</h3>
                <p className={`mt-1 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Select the <Tooltip content="Governance level determines how strictly your AI follows policies and how much oversight it receives.">governance level</Tooltip> that's right for your agent
                </p>
              </div>

              <div className="space-y-4">
                <div 
                  className={`p-4 border rounded-md ${isDarkMode ? 'border-gray-700 bg-gray-700/50' : 'border-gray-200'} cursor-pointer hover:border-purple-500 ${governanceLevel === 'standard' ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20' : ''}`}
                  onClick={() => setGovernanceLevel('standard')}
                >
                  <div className="flex items-center">
                    <input
                      id="governance-standard"
                      name="governance-level"
                      type="radio"
                      checked={governanceLevel === 'standard'}
                      onChange={() => setGovernanceLevel('standard')}
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
                    Balanced approach with 92% <Tooltip content="Trust score measures how reliably your AI follows governance policies and makes appropriate decisions.">trust score</Tooltip> and minimal performance impact
                  </p>
                </div>

                <div 
                  className={`p-4 border rounded-md ${isDarkMode ? 'border-gray-700 bg-gray-700/50' : 'border-gray-200'} cursor-pointer hover:border-purple-500 ${governanceLevel === 'strict' ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20' : ''}`}
                  onClick={() => setGovernanceLevel('strict')}
                >
                  <div className="flex items-center">
                    <input
                      id="governance-strict"
                      name="governance-level"
                      type="radio"
                      checked={governanceLevel === 'strict'}
                      onChange={() => setGovernanceLevel('strict')}
                      className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300"
                    />
                    <label htmlFor="governance-strict" className="ml-3 block text-sm font-medium">
                      Strict governance
                    </label>
                  </div>
                  <p className={`mt-1 ml-7 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    Maximum trust and <Tooltip content="Compliance tracking ensures your AI adheres to regulatory requirements and organizational policies.">compliance</Tooltip> with moderate performance impact
                  </p>
                </div>

                <div 
                  className={`p-4 border rounded-md ${isDarkMode ? 'border-gray-700 bg-gray-700/50' : 'border-gray-200'} cursor-pointer hover:border-purple-500 ${governanceLevel === 'custom' ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20' : ''}`}
                  onClick={() => setGovernanceLevel('custom')}
                >
                  <div className="flex items-center">
                    <input
                      id="governance-custom"
                      name="governance-level"
                      type="radio"
                      checked={governanceLevel === 'custom'}
                      onChange={() => setGovernanceLevel('custom')}
                      className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300"
                    />
                    <label htmlFor="governance-custom" className="ml-3 block text-sm font-medium">
                      Custom governance
                    </label>
                  </div>
                  <p className={`mt-1 ml-7 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    Fine-tune individual <Tooltip content="Governance parameters include trust thresholds, compliance rules, monitoring frequency, and risk tolerance levels.">governance parameters</Tooltip> for your specific needs
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {step === 4 && (
            <motion.div
              key="step4"
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
                <dl className={`mt-2 divide-y ${isDarkMode ? 'divide-gray-600' : 'divide-gray-200'}`}>
                  <div className="py-2 flex justify-between">
                    <dt className="text-sm">
                      <Tooltip content="Trust score measures how reliably your AI follows governance policies and makes appropriate decisions.">Trust score</Tooltip>
                    </dt>
                    <dd className="text-sm font-medium text-green-600 dark:text-green-400">
                      {governanceLevel === 'strict' ? '98' : governanceLevel === 'custom' ? '95' : '92'}/100
                    </dd>
                  </div>
                  <div className="py-2 flex justify-between">
                    <dt className="text-sm">
                      <Tooltip content="Compliance rate shows the percentage of time your AI follows all governance policies.">Compliance rate</Tooltip>
                    </dt>
                    <dd className="text-sm font-medium text-green-600 dark:text-green-400">
                      {governanceLevel === 'strict' ? '99' : governanceLevel === 'custom' ? '97' : '95'}%
                    </dd>
                  </div>
                  <div className="py-2 flex justify-between">
                    <dt className="text-sm">Error reduction</dt>
                    <dd className="text-sm font-medium text-green-600 dark:text-green-400">
                      -{governanceLevel === 'strict' ? '89' : governanceLevel === 'custom' ? '85' : '82'}%
                    </dd>
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
                disabled={isSubmitting}
                className={`inline-flex items-center px-4 py-2 border rounded-md shadow-sm text-sm font-medium ${
                  isDarkMode 
                    ? 'border-gray-600 bg-gray-700 text-gray-200 hover:bg-gray-600' 
                    : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50`}
              >
                Back
              </button>
            ) : (
              <div></div> // Empty div to maintain layout with flex justify-between
            )}
            <button
              type="button"
              onClick={nextStep}
              disabled={isSubmitting}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Setting up...
                </>
              ) : (
                step < totalSteps ? 'Continue' : 'Go to dashboard'
              )}
            </button>
          </div>

          {/* Skip option */}
          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={skipOnboarding}
              disabled={isSubmitting}
              className={`text-sm ${isDarkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700'} underline disabled:opacity-50`}
            >
              Skip onboarding and go to dashboard
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OnboardingFlow;
