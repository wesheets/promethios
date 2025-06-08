import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * AgentWizardPage Component
 * 
 * This component guides users through the process of adding governance to an agent.
 * Features include:
 * - Step-by-step guidance with progress tracking
 * - Agent type selection
 * - Details configuration
 * - Governance level selection
 */
const AgentWizardPage: React.FC = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [agentType, setAgentType] = useState<string | null>(null);
  const [governanceLevel, setGovernanceLevel] = useState<string | null>(null);
  const totalSteps = 4;
  
  // Handle navigation
  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    } else {
      // Complete wizard and go to dashboard
      navigate('/ui/dashboard', { replace: true });
    }
  };
  
  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
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
            <h2 className="text-xl font-semibold mb-4">Select Agent Type</h2>
            <p className="mb-4">Choose the type of agent you want to govern:</p>
            
            <div className="space-y-4">
              <div 
                className={`p-4 border rounded-lg cursor-pointer ${agentType === 'llm' ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-200 dark:border-gray-700'}`}
                onClick={() => handleAgentTypeSelect('llm')}
              >
                <h3 className="font-medium">Large Language Model (LLM)</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">Text generation models like GPT-4, Claude, or Llama</p>
              </div>
              
              <div 
                className={`p-4 border rounded-lg cursor-pointer ${agentType === 'multimodal' ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-200 dark:border-gray-700'}`}
                onClick={() => handleAgentTypeSelect('multimodal')}
              >
                <h3 className="font-medium">Multimodal Agent</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">Agents that process text, images, and other modalities</p>
              </div>
              
              <div 
                className={`p-4 border rounded-lg cursor-pointer ${agentType === 'custom' ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-200 dark:border-gray-700'}`}
                onClick={() => handleAgentTypeSelect('custom')}
              >
                <h3 className="font-medium">Custom Agent</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">Your own custom-built agent with specific capabilities</p>
              </div>
            </div>
          </div>
        );
      
      case 2:
        return (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold mb-4">Agent Details</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Agent Name</label>
                <input 
                  type="text" 
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700"
                  placeholder="My First Governed Agent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea 
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700"
                  placeholder="Describe what this agent does..."
                  rows={3}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">API Endpoint (Optional)</label>
                <input 
                  type="text" 
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700"
                  placeholder="https://api.example.com/agent"
                />
              </div>
            </div>
          </div>
        );
      
      case 3:
        return (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold mb-4">Select Governance Level</h2>
            <p className="mb-4">Choose the appropriate governance level for your agent:</p>
            
            <div className="space-y-4">
              <div 
                className={`p-4 border rounded-lg cursor-pointer ${governanceLevel === 'basic' ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-200 dark:border-gray-700'}`}
                onClick={() => handleGovernanceLevelSelect('basic')}
              >
                <h3 className="font-medium">Basic</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">Essential monitoring and transparency for simple AI applications.</p>
                <div className="mt-2 text-sm text-blue-600 dark:text-blue-400">
                  <span className="font-medium">Features:</span> Content filtering, basic logging, simple reporting
                </div>
              </div>
              
              <div 
                className={`p-4 border rounded-lg cursor-pointer ${governanceLevel === 'standard' ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-200 dark:border-gray-700'}`}
                onClick={() => handleGovernanceLevelSelect('standard')}
              >
                <h3 className="font-medium">Standard</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">Comprehensive governance for most business applications with detailed reporting.</p>
                <div className="mt-2 text-sm text-blue-600 dark:text-blue-400">
                  <span className="font-medium">Features:</span> Advanced filtering, detailed logging, compliance checks, performance monitoring
                </div>
              </div>
              
              <div 
                className={`p-4 border rounded-lg cursor-pointer ${governanceLevel === 'advanced' ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-200 dark:border-gray-700'}`}
                onClick={() => handleGovernanceLevelSelect('advanced')}
              >
                <h3 className="font-medium">Advanced</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">Enterprise-grade governance with real-time monitoring, detailed analytics, and custom rules.</p>
                <div className="mt-2 text-sm text-blue-600 dark:text-blue-400">
                  <span className="font-medium">Features:</span> Real-time monitoring, custom rules, advanced analytics, audit trails, bias detection
                </div>
              </div>
            </div>
          </div>
        );
      
      case 4:
        return (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold mb-4">Review and Confirm</h2>
            
            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
              <h3 className="font-medium mb-2">Agent Configuration</h3>
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Agent Type:</span>
                  <span className="font-medium">{agentType === 'llm' ? 'Large Language Model' : agentType === 'multimodal' ? 'Multimodal Agent' : 'Custom Agent'}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Governance Level:</span>
                  <span className="font-medium">{governanceLevel === 'basic' ? 'Basic' : governanceLevel === 'standard' ? 'Standard' : 'Advanced'}</span>
                </div>
              </div>
            </div>
            
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
              <h3 className="font-medium mb-2">Governance Summary</h3>
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Trust Score:</span>
                  <span className="font-medium text-green-600 dark:text-green-400">96/100</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Compliance Rate:</span>
                  <span className="font-medium text-green-600 dark:text-green-400">99%</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Error Reduction:</span>
                  <span className="font-medium text-green-600 dark:text-green-400">-87%</span>
                </div>
              </div>
            </div>
            
            <p className="text-center text-gray-600 dark:text-gray-400">
              You can adjust these settings at any time from your dashboard
            </p>
          </div>
        );
      
      default:
        return (
          <div>
            <h2 className="text-xl font-semibold mb-4">Agent Wrapping Wizard</h2>
            <p>Let's set up governance for your agent.</p>
          </div>
        );
    }
  };
  
  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-2">Agent Wrapping Wizard</h1>
      <p className="text-gray-600 dark:text-gray-400 mb-6">Set up AI governance for your agent</p>
      
      <div className="mb-8">
        <div className="flex justify-between mb-2">
          <span>Progress</span>
          <span>{currentStep} of {totalSteps}</span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
          <div 
            className="bg-blue-600 h-2.5 rounded-full" 
            style={{ width: `${(currentStep / totalSteps) * 100}%` }}
          ></div>
        </div>
      </div>
      
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 mb-6">
        {renderStepContent()}
      </div>
      
      <div className="flex justify-between">
        <button 
          className="px-4 py-2 bg-gray-200 dark:bg-gray-600 rounded hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
          onClick={handleBack}
          disabled={currentStep === 1}
        >
          Back
        </button>
        <button 
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          onClick={handleNext}
          disabled={(currentStep === 1 && !agentType) || (currentStep === 3 && !governanceLevel)}
        >
          {currentStep === totalSteps ? 'Complete Setup' : 'Continue'}
        </button>
      </div>
    </div>
  );
};

export default AgentWizardPage;
