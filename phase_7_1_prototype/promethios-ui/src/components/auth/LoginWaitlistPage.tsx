import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { FirebaseError } from 'firebase/app';
import { addToWaitlist } from '../../firebase/waitlistService';
import { checkUserInvitation } from '../../firebase/invitationService';
import '../../styles/animated-background.css';

const LoginWaitlistPage: React.FC = () => {
  const { isDarkMode } = useTheme();
  const navigate = useNavigate();
  const { loginWithEmail, loginWithGoogle, signup, resetPassword, logout, db } = useAuth();
  
  // State for login form
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [resetPasswordEmail, setResetPasswordEmail] = useState('');
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [resetPasswordSuccess, setResetPasswordSuccess] = useState(false);
  
  // Enhanced state for waitlist form with 2-step flow
  const [currentStep, setCurrentStep] = useState(1);
  const [step1Data, setStep1Data] = useState({
    email: '',
    role: '',
    aiConcern: ''
  });
  const [step2Data, setStep2Data] = useState({
    whyAccess: '',
    organization: '',
    deploymentUrgency: '',
    socialProfile: '',
    onboardingCall: false,
    currentAiTools: '',
    biggestAiFailure: '',
    additionalConcerns: ''
  });
  const [submitted, setSubmitted] = useState(false);
  const [waitlistError, setWaitlistError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Toggle between login and waitlist forms
  const [showLoginForm, setShowLoginForm] = useState(false);
  
  const handleLoginWithEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setIsLoggingIn(true);
    
    try {
      await loginWithEmail(loginEmail, loginPassword);
      
      // Check if user has been approved for access
      const hasInvitation = await checkUserInvitation(loginEmail, db);
      
      if (!hasInvitation) {
        setLoginError('Access denied. This environment is not available to unverified operators. Please request access through the waitlist.');
        await logout(); // Sign them out immediately
        return;
      }
      
      navigate('/ui/dashboard');
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
      const result = await loginWithGoogle();
      
      // Get email from the result or current user
      const userEmail = result?.user?.email || loginEmail;
      
      if (userEmail) {
        // Check if user has been approved for access
        const hasInvitation = await checkUserInvitation(userEmail, db);
        
        if (!hasInvitation) {
          setLoginError('Access denied. This environment is not available to unverified operators. Please request access through the waitlist.');
          await logout(); // Sign them out immediately
          return;
        }
      }
      
      navigate('/ui/dashboard');
    } catch (error) {
      const firebaseError = error as FirebaseError;
      let errorMessage = 'Google authentication failed. Please try again.';
      
      if (firebaseError.code === 'auth/popup-closed-by-user') {
        errorMessage = 'Sign-in popup was closed before completing the sign in.';
      } else if (firebaseError.code === 'auth/popup-blocked') {
        errorMessage = 'Sign-in popup was blocked by the browser.';
      }
      
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
  
  const handleStep1Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setWaitlistError('');
    
    // Validate step 1 fields
    if (!step1Data.email || !step1Data.role || !step1Data.aiConcern) {
      setWaitlistError('Please fill in all required fields.');
      return;
    }
    
    // Move to step 2
    setCurrentStep(2);
  };
  
  const handleStep2Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setWaitlistError('');
    setIsSubmitting(true);
    
    try {
      // Combine step 1 and step 2 data
      const completeData = {
        ...step1Data,
        ...step2Data
      };
      
      const result = await addToWaitlist(completeData, db);
      
      if (result === 'exists') {
        console.log('Email already in waitlist:', step1Data.email);
      } else {
        console.log('Added to waitlist with ID:', result);
      }
      
      setSubmitted(true);
    } catch (error) {
      console.error('Waitlist submission error:', error);
      setWaitlistError('Failed to join waitlist. Please try again later.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const updateStep1Data = (field: string, value: string) => {
    setStep1Data(prev => ({
      ...prev,
      [field]: value
    }));
  };
  
  const updateStep2Data = (field: string, value: string | boolean) => {
    setStep2Data(prev => ({
      ...prev,
      [field]: value
    }));
  };
  
  return (
    <div className={`min-h-screen w-full ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'} flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden`}>
      {/* Enhanced Background - Animated Code Streams like Midjourney */}
      <div className="absolute inset-0 opacity-20 pointer-events-none overflow-hidden">
        {/* Animated Code Stream 1 - Governance Engine */}
        <div className="absolute top-0 left-0 w-full h-full code-stream-1">
          <div className="text-green-400 text-xs font-mono leading-relaxed whitespace-pre-wrap">
            {`import { TrustScore, GovernanceLayer } from '@promethios/core';
import { validateAgent, auditDecision } from './governance';

class AIGovernanceEngine {
  constructor(config) {
    this.trustThreshold = config.minTrustScore || 0.85;
    this.auditTrail = new Map();
    this.governancePolicies = config.policies;
  }

  async validateRequest(agent, request) {
    const trustScore = await this.calculateTrust(agent);
    
    if (trustScore < this.trustThreshold) {
      this.logViolation(agent, 'TRUST_THRESHOLD_BREACH');
      return { allowed: false, reason: 'Insufficient trust' };
    }
    
    const policyCheck = await this.checkPolicies(request);
    if (!policyCheck.compliant) {
      this.logViolation(agent, 'POLICY_VIOLATION');
      return { allowed: false, reason: policyCheck.violation };
    }
    
    this.auditTrail.set(request.id, {
      agent: agent.id,
      timestamp: Date.now(),
      trustScore,
      decision: 'APPROVED'
    });
    
    return { allowed: true, trustScore };
  }

  calculateTrust(agent) {
    const factors = {
      historicalAccuracy: agent.metrics.accuracy,
      hallucinationRate: 1 - agent.metrics.hallucinations,
      complianceScore: agent.compliance.score,
      userFeedback: agent.feedback.average
    };
    
    return Object.values(factors).reduce((sum, val) => sum + val, 0) / 4;
  }
}`}
          </div>
        </div>
        
        {/* Animated Code Stream 2 - Trust Network */}
        <div className="absolute top-20 right-0 w-full h-full code-stream-2">
          <div className="text-blue-400 text-xs font-mono leading-relaxed whitespace-pre-wrap">
            {`// Multi-Agent Trust Network
const trustNetwork = new Map();

function establishTrustBoundary(agents) {
  const boundary = {
    id: generateBoundaryId(),
    agents: agents.map(a => a.id),
    trustLevel: 'HIGH',
    policies: ['NO_HALLUCINATION', 'AUDIT_ALL', 'HUMAN_OVERSIGHT'],
    created: new Date().toISOString()
  };
  
  agents.forEach(agent => {
    agent.trustBoundary = boundary.id;
    agent.governanceLevel = 'STRICT';
    
    // Install governance hooks
    agent.beforeDecision = async (context) => {
      return await validateDecision(context, boundary);
    };
    
    agent.afterDecision = async (decision, context) => {
      await auditDecision(decision, context, boundary);
      await updateTrustMetrics(agent, decision);
    };
  });
  
  return boundary;
}

async function validateDecision(context, boundary) {
  const riskAssessment = await assessRisk(context);
  
  if (riskAssessment.level === 'HIGH') {
    await requestHumanOversight(context);
    return { proceed: false, reason: 'Human review required' };
  }
  
  return { proceed: true };
}`}
          </div>
        </div>
        
        {/* Animated Code Stream 3 - Dashboard */}
        <div className="absolute bottom-0 left-1/4 w-full h-full code-stream-3">
          <div className="text-purple-400 text-xs font-mono leading-relaxed whitespace-pre-wrap">
            {`// Real-time Governance Dashboard
class GovernanceDashboard {
  constructor() {
    this.metrics = {
      totalAgents: 0,
      trustScore: 0,
      violations: 0,
      decisions: 0
    };
    
    this.alerts = [];
    this.auditLog = [];
  }
  
  updateMetrics(agentId, decision) {
    this.metrics.decisions++;
    
    if (decision.violation) {
      this.metrics.violations++;
      this.alerts.push({
        type: 'VIOLATION',
        agent: agentId,
        details: decision.violation,
        timestamp: Date.now()
      });
    }
    
    this.auditLog.push({
      agent: agentId,
      action: decision.action,
      trustScore: decision.trustScore,
      timestamp: Date.now()
    });
    
    this.calculateOverallTrust();
  }
  
  calculateOverallTrust() {
    const recentDecisions = this.auditLog.slice(-100);
    const avgTrust = recentDecisions.reduce((sum, log) => 
      sum + log.trustScore, 0) / recentDecisions.length;
    
    this.metrics.trustScore = avgTrust;
    
    if (avgTrust < 0.7) {
      this.triggerAlert('LOW_TRUST_NETWORK');
    }
  }
}`}
          </div>
        </div>
        
        {/* Matrix-style falling code columns */}
        {[...Array(8)].map((_, i) => (
          <div
            key={`matrix-${i}`}
            className="absolute matrix-code text-xs"
            style={{
              left: `${10 + i * 12}%`,
              animationDelay: `${i * 0.5}s`,
              animationDuration: `${8 + Math.random() * 4}s`
            }}
          >
            {['validate()', 'audit()', 'trust++', 'govern()', 'secure()', 'monitor()', 'alert!', 'approve'][i]}
          </div>
        ))}
        
        {/* Floating Code Particles with enhanced effects */}
        <div className="absolute inset-0">
          {[...Array(15)].map((_, i) => (
            <div
              key={`particle-${i}`}
              className={`absolute text-xs font-mono floating-code ${i % 3 === 0 ? 'code-pulse' : ''} ${i % 5 === 0 ? 'glitch-effect' : ''}`}
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
                color: ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b'][Math.floor(Math.random() * 4)]
              }}
            >
              {['trustScore', 'validate()', 'audit()', 'govern()', 'secure()', 'monitor()'][Math.floor(Math.random() * 6)]}
            </div>
          ))}
        </div>
        
        {/* Terminal-style scrolling text */}
        <div className="absolute bottom-10 left-10 w-80 h-32 overflow-hidden opacity-10">
          <div className="terminal-scroll text-green-300 text-xs font-mono">
            <div>$ promethios --init governance</div>
            <div>✓ Trust boundary established</div>
            <div>✓ Audit trail initialized</div>
            <div>✓ Policy engine loaded</div>
            <div>✓ Multi-agent coordination active</div>
            <div>$ monitor --trust-score</div>
            <div>Current trust: 87.3%</div>
            <div>Violations: 0</div>
            <div>Status: SECURE</div>
            <div>$ validate --agent-request</div>
            <div>Checking compliance...</div>
            <div>✓ Request approved</div>
            <div className="cursor-blink">$ </div>
          </div>
        </div>
      </div>
      
      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="flex justify-center">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
            Beta
          </span>
        </div>
        <h2 className="mt-3 text-center text-3xl font-extrabold">
          {showLoginForm ? 'Sign in to Promethios' : 'Request Access to Private Beta'}
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
          {showLoginForm 
            ? 'This environment is not available to unverified operators. Promethios governance requires accountability.' 
            : 'Trust is not public. You don\'t get access just because you want it — you get it because someone trusted you.'}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className={`${isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white shadow'} py-8 px-4 sm:rounded-lg sm:px-10`}>
          {showLoginForm ? (
            !showResetPassword ? (
              // Login Form (unchanged)
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
                      className="w-full flex justify-center items-center py-2 px-4 border border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-200 bg-gray-700 hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50"
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
              // Reset Password Form (unchanged)
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
              // Reset Password Success (unchanged)
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
            // 2-Step Waitlist Form
            currentStep === 1 ? (
              // Step 1: Velvet Rope Form (3 fields only)
              <form className="space-y-6" onSubmit={handleStep1Submit}>
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
                      value={step1Data.email}
                      onChange={(e) => updateStep1Data('email', e.target.value)}
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
                      value={step1Data.role}
                      onChange={(e) => updateStep1Data('role', e.target.value)}
                      className={`appearance-none block w-full px-3 py-2 border ${isDarkMode ? 'border-gray-700 bg-gray-700 text-white' : 'border-gray-300'} rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm`}
                    >
                      <option value="">Select your role</option>
                      <option value="enterprise-cto">Enterprise CTO</option>
                      <option value="security-engineer">Security Engineer</option>
                      <option value="ai-researcher">AI Researcher</option>
                      <option value="product-founder">Product Founder</option>
                      <option value="vc-investor">VC / Investor</option>
                      <option value="parent-concerned">Parent (concerned)</option>
                      <option value="journalist">Journalist</option>
                      <option value="student">Student</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label htmlFor="ai-concern" className="block text-sm font-medium">
                    What are you most concerned about with AI today?
                  </label>
                  <div className="mt-1">
                    <select
                      id="ai-concern"
                      name="aiConcern"
                      required
                      value={step1Data.aiConcern}
                      onChange={(e) => updateStep1Data('aiConcern', e.target.value)}
                      className={`appearance-none block w-full px-3 py-2 border ${isDarkMode ? 'border-gray-700 bg-gray-700 text-white' : 'border-gray-300'} rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm`}
                    >
                      <option value="">Select your primary concern</option>
                      <option value="hallucinations">Hallucinations</option>
                      <option value="security-breaches">Security breaches</option>
                      <option value="misinformation">Misinformation</option>
                      <option value="compliance">Compliance (GDPR, HIPAA)</option>
                      <option value="kids-unsupervised">My kids using AI unsupervised</option>
                      <option value="black-box-decisions">Black-box decisions</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>

                <div>
                  <button
                    type="submit"
                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                  >
                    Request Invite →
                  </button>
                </div>
                
                {/* Enhanced Scarcity Warning */}
                <div className="text-center text-xs text-red-400 mt-3 p-3 border border-red-400/30 rounded-lg bg-red-900/10">
                  <div className="flex items-center justify-center mb-2">
                    <span className="text-red-500 mr-2">🛑</span>
                    <span className="font-semibold">LIMITED ACCESS</span>
                  </div>
                  <div className="mb-1">Only <span className="font-bold text-red-300">47 invitations</span> remaining this quarter.</div>
                  <div className="text-xs text-gray-400">We prioritize those shaping AI's future—or trying to protect it.</div>
                </div>
              </form>
            ) : (
              // Step 2: Context Gathering (Optional Enhancement)
              <div>
                <div className="mb-6 text-center">
                  <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 mb-3">
                    Step 2 of 2
                  </div>
                  <h3 className="text-lg font-medium mb-2">Complete Your Application</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    To help us prioritize access and match you with the right governance approach, we'd love a bit more context.
                  </p>
                </div>
                
                <form className="space-y-6" onSubmit={handleStep2Submit}>
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
                    <label htmlFor="why-access" className="block text-sm font-medium">
                      Why do you want access?
                    </label>
                    <div className="mt-1">
                      <textarea
                        id="why-access"
                        name="whyAccess"
                        rows={3}
                        value={step2Data.whyAccess}
                        onChange={(e) => updateStep2Data('whyAccess', e.target.value)}
                        placeholder="What problem are you trying to solve with Promethios?"
                        className={`appearance-none block w-full px-3 py-2 border ${isDarkMode ? 'border-gray-700 bg-gray-700 text-white' : 'border-gray-300'} rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm`}
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="organization" className="block text-sm font-medium">
                      Organization or Affiliation
                    </label>
                    <div className="mt-1">
                      <input
                        id="organization"
                        name="organization"
                        type="text"
                        value={step2Data.organization}
                        onChange={(e) => updateStep2Data('organization', e.target.value)}
                        placeholder="Company, university, lab, or independent"
                        className={`appearance-none block w-full px-3 py-2 border ${isDarkMode ? 'border-gray-700 bg-gray-700 text-white' : 'border-gray-300'} rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm`}
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="deployment-urgency" className="block text-sm font-medium">
                      How soon would you deploy this?
                    </label>
                    <div className="mt-1">
                      <select
                        id="deployment-urgency"
                        name="deploymentUrgency"
                        value={step2Data.deploymentUrgency}
                        onChange={(e) => updateStep2Data('deploymentUrgency', e.target.value)}
                        className={`appearance-none block w-full px-3 py-2 border ${isDarkMode ? 'border-gray-700 bg-gray-700 text-white' : 'border-gray-300'} rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm`}
                      >
                        <option value="">Select timeline</option>
                        <option value="right-away">Right away (critical need)</option>
                        <option value="within-30-days">Within 30 days</option>
                        <option value="just-exploring">Just exploring</option>
                        <option value="not-sure">Not sure</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="social-profile" className="block text-sm font-medium">
                      Twitter / LinkedIn / Website
                    </label>
                    <div className="mt-1">
                      <input
                        id="social-profile"
                        name="socialProfile"
                        type="url"
                        value={step2Data.socialProfile}
                        onChange={(e) => updateStep2Data('socialProfile', e.target.value)}
                        placeholder="Where can we find your thoughts?"
                        className={`appearance-none block w-full px-3 py-2 border ${isDarkMode ? 'border-gray-700 bg-gray-700 text-white' : 'border-gray-300'} rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm`}
                      />
                    </div>
                  </div>

                  <div className="flex items-center">
                    <input
                      id="onboarding-call"
                      name="onboardingCall"
                      type="checkbox"
                      checked={step2Data.onboardingCall}
                      onChange={(e) => updateStep2Data('onboardingCall', e.target.checked)}
                      className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                    />
                    <label htmlFor="onboarding-call" className="ml-2 block text-sm">
                      Would you be open to a brief onboarding call if selected?
                    </label>
                  </div>

                  <div className="flex space-x-3">
                    <button
                      type="button"
                      onClick={() => setCurrentStep(1)}
                      className="flex-1 flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600"
                    >
                      ← Back
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="flex-1 flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50"
                    >
                      {isSubmitting ? 'Submitting...' : 'Complete Application'}
                    </button>
                  </div>
                </form>
              </div>
            )
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
              <h3 className="mt-3 text-lg font-medium">Application Received</h3>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                Your request for private beta access has been submitted. We'll review your application and notify you if you're selected for early access.
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

        <div className="mt-6 text-center relative z-10">
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
                  Request access
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
