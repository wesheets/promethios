import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { AgentFirebaseService, AgentWizardData } from '../../firebase/agentService';

/**
 * AgentWizardPage Component
 * 
 * This component guides users through the process of adding governance to an agent.
 * Features include:
 * - Step-by-step guidance with progress tracking
 * - Agent type selection
 * - Details configuration
 * - Governance level selection
 * - Auto-save functionality with Firebase persistence
 */
const AgentWizardPage: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [agentType, setAgentType] = useState<string>('');
  const [agentName, setAgentName] = useState<string>('');
  const [agentDescription, setAgentDescription] = useState<string>('');
  const [apiEndpoint, setApiEndpoint] = useState<string>('');
  const [governanceLevel, setGovernanceLevel] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const totalSteps = 4;

  // Load saved wizard progress on component mount
  useEffect(() => {
    const loadWizardProgress = async () => {
      if (!currentUser) return;
      
      try {
        const savedProgress = await AgentFirebaseService.loadWizardProgress(currentUser.uid);
        if (savedProgress) {
          console.log('Loaded wizard progress:', savedProgress);
          setCurrentStep(savedProgress.currentStep || 1);
          setAgentType(savedProgress.agentType || '');
          setAgentName(savedProgress.agentName || '');
          setAgentDescription(savedProgress.agentDescription || '');
          setApiEndpoint(savedProgress.apiEndpoint || '');
          setGovernanceLevel(savedProgress.governanceLevel || '');
        }
      } catch (error) {
        console.error('Error loading wizard progress:', error);
      }
    };

    loadWizardProgress();
  }, [currentUser]);

  // Auto-save wizard progress whenever data changes
  useEffect(() => {
    const saveProgress = async () => {
      if (!currentUser || isSaving) return;
      
      setIsSaving(true);
      try {
        const wizardData: Partial<AgentWizardData> = {
          currentStep,
          agentType: agentType || undefined,
          agentName: agentName || undefined,
          agentDescription: agentDescription || undefined,
          apiEndpoint: apiEndpoint || undefined,
          governanceLevel: governanceLevel || undefined
        };

        await AgentFirebaseService.saveWizardProgress(currentUser.uid, wizardData);
        console.log('Auto-saved wizard progress');
      } catch (error) {
        console.error('Error auto-saving wizard progress:', error);
      } finally {
        setIsSaving(false);
      }
    };

    // Debounce auto-save to avoid too frequent saves
    const timeoutId = setTimeout(saveProgress, 1000);
    return () => clearTimeout(timeoutId);
  }, [currentUser, currentStep, agentType, agentName, agentDescription, apiEndpoint, governanceLevel, isSaving]);
  
  // Handle navigation
  const handleNext = async () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    } else {
      // Complete wizard and save agent configuration
      await handleCompleteSetup();
    }
  };
  
  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Handle skip functionality
  const handleSkip = () => {
    navigate('/ui/dashboard', { replace: true });
  };

  // Handle wizard completion
  const handleCompleteSetup = async () => {
    if (!currentUser) return;

    setIsLoading(true);
    try {
      const agentConfig = {
        userId: currentUser.uid,
        name: agentName || 'Unnamed Agent',
        description: agentDescription || 'No description provided',
        agentType: agentType as 'llm' | 'multimodal' | 'custom',
        apiEndpoint: apiEndpoint || undefined,
        governanceLevel: governanceLevel as 'basic' | 'standard' | 'advanced',
        status: 'active' as const
      };

      const agentId = await AgentFirebaseService.saveAgentConfiguration(agentConfig);
      console.log('Agent configuration saved with ID:', agentId);

      // Navigate to agents page to show the newly created agent
      navigate('/ui/agents', { replace: true });
    } catch (error) {
      console.error('Error completing agent setup:', error);
      // For now, still navigate to dashboard on error
      navigate('/ui/dashboard', { replace: true });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle agent type selection
  const handleAgentTypeSelect = (type: string) => {
    setAgentType(type);
  };
  
  // Handle governance level selection
  const handleGovernanceLevelSelect = (level: string) => {
    setGovernanceLevel(level);
  };
  
  // Render step content based on current step
  const renderStepContent = () => {
    switch(currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-white mb-4">Select Agent Type</h2>
            <p className="mb-4 text-gray-300">Choose the type of agent you want to govern:</p>
            
            <div className="space-y-4">
              <div 
                className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${agentType === 'llm' ? 'border-blue-400 bg-blue-900/30' : 'border-gray-600 hover:border-gray-500'}`}
                onClick={() => handleAgentTypeSelect('llm')}
              >
                <h3 className="font-medium text-white">Large Language Model (LLM)</h3>
                <p className="text-sm text-gray-300">Text generation models like GPT-4, Claude, or Llama</p>
              </div>
              
              <div 
                className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${agentType === 'multimodal' ? 'border-blue-400 bg-blue-900/30' : 'border-gray-600 hover:border-gray-500'}`}
                onClick={() => handleAgentTypeSelect('multimodal')}
              >
                <h3 className="font-medium text-white">Multimodal Agent</h3>
                <p className="text-sm text-gray-300">Agents that process text, images, and other modalities</p>
              </div>
              
              <div 
                className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${agentType === 'custom' ? 'border-blue-400 bg-blue-900/30' : 'border-gray-600 hover:border-gray-500'}`}
                onClick={() => handleAgentTypeSelect('custom')}
              >
                <h3 className="font-medium text-white">Custom Agent</h3>
                <p className="text-sm text-gray-300">Your own custom-built agent with specific capabilities</p>
              </div>
            </div>
          </div>
        );
      
      case 2:
        return (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-white mb-4">Agent Details</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Agent Name</label>
                <input 
                  type="text" 
                  value={agentName}
                  onChange={(e) => setAgentName(e.target.value)}
                  className="w-full p-2 border border-gray-600 rounded-md bg-gray-700 text-white placeholder-gray-400"
                  placeholder="My First Governed Agent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Description</label>
                <textarea 
                  value={agentDescription}
                  onChange={(e) => setAgentDescription(e.target.value)}
                  className="w-full p-2 border border-gray-600 rounded-md bg-gray-700 text-white placeholder-gray-400"
                  placeholder="Describe what this agent does..."
                  rows={3}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  API Endpoint (Optional)
                  <span className="ml-1 text-xs text-gray-400 cursor-help" title="The URL where your agent can be accessed (e.g., your chatbot's webhook URL). Leave blank if your agent doesn't have a public API.">
                    ℹ️
                  </span>
                </label>
                <input 
                  type="text" 
                  value={apiEndpoint}
                  onChange={(e) => setApiEndpoint(e.target.value)}
                  className="w-full p-2 border border-gray-600 rounded-md bg-gray-700 text-white placeholder-gray-400"
                  placeholder="https://api.example.com/agent"
                />
              </div>
            </div>
          </div>
        );
      
      case 3:
        return (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-white mb-4">Select Governance Level</h2>
            <p className="mb-4 text-gray-300">Choose the appropriate governance level for your agent:</p>
            
            <div className="space-y-4">
              <div 
                className={`p-4 border rounded-lg cursor-pointer transition-all ${governanceLevel === 'basic' ? 'border-blue-500 bg-blue-900/20' : 'border-gray-600 hover:border-gray-500'}`}
                onClick={() => handleGovernanceLevelSelect('basic')}
              >
                <h3 className="font-medium text-white">Basic</h3>
                <p className="text-sm text-gray-300">Essential monitoring and transparency for simple AI applications.</p>
                <div className="mt-2 text-sm text-blue-400">
                  <span className="font-medium">Features:</span> Content filtering, basic logging, simple reporting
                </div>
              </div>
              
              <div 
                className={`p-4 border rounded-lg cursor-pointer transition-all ${governanceLevel === 'standard' ? 'border-blue-500 bg-blue-900/20' : 'border-gray-600 hover:border-gray-500'}`}
                onClick={() => handleGovernanceLevelSelect('standard')}
              >
                <h3 className="font-medium text-white">Standard</h3>
                <p className="text-sm text-gray-300">Comprehensive governance for most business applications with detailed reporting.</p>
                <div className="mt-2 text-sm text-blue-400">
                  <span className="font-medium">Features:</span> Advanced filtering, detailed logging, compliance checks, performance monitoring
                </div>
              </div>
              
              <div 
                className={`p-4 border rounded-lg cursor-pointer transition-all ${governanceLevel === 'advanced' ? 'border-blue-500 bg-blue-900/20' : 'border-gray-600 hover:border-gray-500'}`}
                onClick={() => handleGovernanceLevelSelect('advanced')}
              >
                <h3 className="font-medium text-white">Advanced</h3>
                <p className="text-sm text-gray-300">Enterprise-grade governance with real-time monitoring, detailed analytics, and custom rules.</p>
                <div className="mt-2 text-sm text-blue-400">
                  <span className="font-medium">Features:</span> Real-time monitoring, custom rules, advanced analytics, audit trails, bias detection
                </div>
              </div>
            </div>
          </div>
        );
      
      case 4:
        return (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-white mb-4">Review and Confirm</h2>
            
            <div className="bg-gray-700 p-4 rounded-lg border border-gray-600">
              <h3 className="font-medium text-white mb-2">Agent Configuration</h3>
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-400">Agent Type:</span>
                  <span className="font-medium text-white">{agentType === 'llm' ? 'Large Language Model' : agentType === 'multimodal' ? 'Multimodal Agent' : 'Custom Agent'}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-400">Name:</span>
                  <span className="font-medium text-white">{agentName || 'Unnamed Agent'}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-400">Governance Level:</span>
                  <span className="font-medium text-white">{governanceLevel === 'basic' ? 'Basic' : governanceLevel === 'standard' ? 'Standard' : 'Advanced'}</span>
                </div>

                {apiEndpoint && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">API Endpoint:</span>
                    <span className="font-medium text-white text-sm truncate ml-2">{apiEndpoint}</span>
                  </div>
                )}
              </div>
            </div>
            
            <div className="bg-blue-900/20 p-4 rounded-lg border border-blue-600">
              <h3 className="font-medium text-white mb-2">Governance Summary</h3>
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-400">Trust Score:</span>
                  <span className="font-medium text-green-400">96/100</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-400">Compliance Rate:</span>
                  <span className="font-medium text-green-400">99%</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-400">Error Reduction:</span>
                  <span className="font-medium text-green-400">-87%</span>
                </div>
              </div>
            </div>
            
            <p className="text-center text-gray-400">
              You can adjust these settings at any time from your dashboard
            </p>
          </div>
        );
      
      default:
        return (
          <div>
            <h2 className="text-xl font-semibold text-white mb-4">Agent Wrapping Wizard</h2>
            <p className="text-gray-300">Let's set up governance for your agent.</p>
          </div>
        );
    }
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-gray-800 rounded-xl shadow-lg p-8 border border-gray-700">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white mb-2">Agent Wrapping Wizard</h1>
            <p className="text-gray-300">Set up AI governance for your agent</p>
          </div>
          {isSaving && (
            <div className="flex items-center text-sm text-blue-400">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-400 mr-2"></div>
              Saving...
            </div>
          )}
        </div>
      
        <div className="mb-8">
          <div className="flex justify-between mb-2 text-gray-300">
            <span>Progress</span>
            <span>{currentStep} of {totalSteps}</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2.5">
            <div 
              className="bg-blue-500 h-2.5 rounded-full transition-all duration-300" 
              style={{ width: `${(currentStep / totalSteps) * 100}%` }}
            ></div>
          </div>
        </div>
        
        <div className="bg-gray-700 p-6 rounded-lg border border-gray-600 mb-6">
          {renderStepContent()}
        </div>
        
        <div className="flex justify-between">
          <div className="flex space-x-2">
            <button 
              className="px-4 py-2 bg-gray-600 text-gray-200 rounded hover:bg-gray-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={handleBack}
              disabled={currentStep === 1}
            >
              Back
            </button>
            <button 
              className="px-4 py-2 bg-gray-600 text-gray-200 rounded hover:bg-gray-500 transition-colors"
              onClick={handleSkip}
            >
              Skip
            </button>
          </div>
          <button 
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            onClick={handleNext}
            disabled={(currentStep === 1 && !agentType) || (currentStep === 3 && !governanceLevel) || isLoading}
          >
            {isLoading && (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            )}
            {currentStep === totalSteps ? 'Complete Setup' : 'Continue'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AgentWizardPage;
