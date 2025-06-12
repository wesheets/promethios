import React, { useState } from 'react';
import AgentWrappingWizard from './AgentWrappingWizard';
import { AgentWrapperConfig } from '../../types';

const AgentWrappingPage: React.FC = () => {
  const [showWizard, setShowWizard] = useState<boolean>(false);
  const [agents, setAgents] = useState<AgentWrapperConfig[]>([
    {
      name: 'Content Generator',
      provider: 'OpenAI',
      endpoint: 'https://api.openai.com/v1/chat/completions',
      authType: 'API Key',
      authValue: '••••••••',
      schemaComplexity: 'basic',
      inputSchema: null,
      outputSchema: null,
      governanceLevel: 'basic',
      governanceControls: {
        inputValidation: true,
        outputValidation: true,
        requestLogging: true,
        errorHandling: true
      },
      status: 'active',
      environment: 'production',
      metrics: {
        requests: 1245,
        successRate: 98.2
      }
    },
    {
      name: 'Customer Support',
      provider: 'Anthropic',
      endpoint: 'https://api.anthropic.com/v1/messages',
      authType: 'API Key',
      authValue: '••••••••',
      schemaComplexity: 'basic',
      inputSchema: null,
      outputSchema: null,
      governanceLevel: 'standard',
      governanceControls: {
        inputValidation: true,
        outputValidation: true,
        requestLogging: true,
        errorHandling: true
      },
      status: 'active',
      environment: 'testing',
      metrics: {
        requests: 876,
        successRate: 94.7
      }
    }
  ]);

  const handleAddAgent = () => {
    setShowWizard(true);
  };

  const handleWizardCancel = () => {
    setShowWizard(false);
  };

  const handleWizardComplete = (config: AgentWrapperConfig) => {
    // Add the new agent to the list
    setAgents([...agents, { ...config, status: 'active', environment: 'development', metrics: { requests: 0, successRate: 0 } }]);
    setShowWizard(false);
    
    // Show success message
    alert('Agent successfully wrapped under governance!');
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {showWizard ? (
        <AgentWrappingWizard 
          onCancel={handleWizardCancel} 
          onComplete={handleWizardComplete} 
        />
      ) : (
        <>
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold">Agent Wrapping</h1>
              <p className="text-gray-400">Configure and manage your wrapped agent APIs</p>
            </div>
            <button 
              onClick={handleAddAgent}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg flex items-center"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
              </svg>
              Add New Agent
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {agents.map((agent, index) => (
              <div key={index} className="bg-gray-800 rounded-lg p-4 shadow-md">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <div className="flex items-center">
                      <span className={`w-2 h-2 rounded-full mr-2 ${
                        agent.status === 'active' ? 'bg-green-500' : 'bg-gray-500'
                      }`}></span>
                      <h3 className="font-bold">{agent.name}</h3>
                    </div>
                    <p className="text-sm text-gray-400">{agent.provider}</p>
                  </div>
                  <div className={`text-xs px-2 py-1 rounded ${
                    agent.environment === 'production' 
                      ? 'bg-blue-900 text-blue-300' 
                      : agent.environment === 'testing'
                        ? 'bg-purple-900 text-purple-300'
                        : 'bg-gray-700 text-gray-300'
                  }`}>
                    {agent.environment.charAt(0).toUpperCase() + agent.environment.slice(1)}
                  </div>
                </div>
                
                <p className="text-sm mb-4">
                  {agent.name === 'Content Generator' 
                    ? 'Generates marketing content with brand voice guidelines and compliance checks.' 
                    : 'Handles customer inquiries with strict PII protection and escalation protocols.'}
                </p>
                
                <div className="grid grid-cols-2 gap-2 mb-4">
                  <div className="bg-gray-700 p-2 rounded text-center">
                    <div className="text-xs text-gray-400">Requests</div>
                    <div className="font-bold">{agent.metrics.requests.toLocaleString()}</div>
                  </div>
                  <div className="bg-gray-700 p-2 rounded text-center">
                    <div className="text-xs text-gray-400">Success Rate</div>
                    <div className="font-bold">{agent.metrics.successRate}%</div>
                  </div>
                </div>
                
                <div className="flex justify-between">
                  <button className="text-sm bg-gray-700 hover:bg-gray-600 px-3 py-1 rounded">Edit</button>
                  <button className="text-sm bg-red-900 hover:bg-red-800 text-red-300 px-3 py-1 rounded">
                    {agent.status === 'active' ? 'Disable' : 'Enable'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default AgentWrappingPage;
