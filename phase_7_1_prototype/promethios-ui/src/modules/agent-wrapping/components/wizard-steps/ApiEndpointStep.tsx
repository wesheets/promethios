import React from 'react';
import { AgentWrapperConfig } from '../../types';

interface ApiEndpointStepProps {
  config: AgentWrapperConfig;
  updateConfig: (updates: Partial<AgentWrapperConfig>) => void;
  onNext: () => void;
  onCancel: () => void;
}

const ApiEndpointStep: React.FC<ApiEndpointStepProps> = ({ 
  config, 
  updateConfig, 
  onNext, 
  onCancel 
}) => {
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    updateConfig({ [name]: value });
  };

  const handleTestConnection = () => {
    // In a real implementation, this would test the API connection
    // For now, we'll just show an alert
    alert('Connection successful!');
  };

  const isNextDisabled = !config.name || !config.endpoint || !config.authValue;

  return (
    <div className="bg-gray-800 rounded-lg p-6 mb-6">
      <h2 className="text-xl font-bold mb-4">1. Connect Your Agent API</h2>
      
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">Agent Name</label>
        <input 
          type="text" 
          name="name"
          value={config.name}
          onChange={handleInputChange}
          className="bg-gray-700 text-white w-full py-2 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" 
          placeholder="e.g., Content Generator, Customer Support Bot"
        />
      </div>
      
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">API Provider</label>
        <select 
          name="provider"
          value={config.provider}
          onChange={handleInputChange}
          className="bg-gray-700 text-white w-full py-2 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option>OpenAI</option>
          <option>Anthropic</option>
          <option>Cohere</option>
          <option>Custom</option>
        </select>
      </div>
      
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">API Endpoint URL</label>
        <input 
          type="text" 
          name="endpoint"
          value={config.endpoint}
          onChange={handleInputChange}
          className="bg-gray-700 text-white w-full py-2 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" 
          placeholder="https://api.example.com/v1/chat/completions"
        />
      </div>
      
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">Authentication</label>
        <select 
          name="authType"
          value={config.authType}
          onChange={handleInputChange}
          className="bg-gray-700 text-white w-full py-2 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2"
        >
          <option>API Key</option>
          <option>OAuth 2.0</option>
          <option>Bearer Token</option>
          <option>No Authentication</option>
        </select>
        <input 
          type="password" 
          name="authValue"
          value={config.authValue}
          onChange={handleInputChange}
          className="bg-gray-700 text-white w-full py-2 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" 
          placeholder="Enter your API key"
        />
        <p className="text-xs text-gray-400 mt-1">Your API key is securely stored and never exposed to end users.</p>
      </div>
      
      <div className="mb-4">
        <button 
          onClick={handleTestConnection}
          className="bg-gray-700 hover:bg-gray-600 text-white font-medium py-2 px-4 rounded-lg"
        >
          Test Connection
        </button>
      </div>

      {/* Quick Preview of Next Steps */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-gray-700 p-4 rounded-lg opacity-70">
          <h3 className="font-medium mb-2">2. Define Schema</h3>
          <p className="text-xs text-gray-400">Set input/output formats for your agent</p>
        </div>
        <div className="bg-gray-700 p-4 rounded-lg opacity-70">
          <h3 className="font-medium mb-2">3. Set Governance</h3>
          <p className="text-xs text-gray-400">Apply governance controls and policies</p>
        </div>
        <div className="bg-gray-700 p-4 rounded-lg opacity-70">
          <h3 className="font-medium mb-2">4. Review & Create</h3>
          <p className="text-xs text-gray-400">Verify settings and activate your agent</p>
        </div>
      </div>
      
      {/* Navigation Buttons */}
      <div className="flex justify-between">
        <button 
          onClick={onCancel}
          className="bg-gray-700 hover:bg-gray-600 text-white font-medium py-2 px-4 rounded-lg"
        >
          Cancel
        </button>
        <button 
          onClick={onNext}
          disabled={isNextDisabled}
          className={`${
            isNextDisabled 
              ? 'bg-gray-600 cursor-not-allowed' 
              : 'bg-blue-600 hover:bg-blue-700'
          } text-white font-medium py-2 px-4 rounded-lg`}
        >
          Next: Define Schema
        </button>
      </div>
    </div>
  );
};

export default ApiEndpointStep;
