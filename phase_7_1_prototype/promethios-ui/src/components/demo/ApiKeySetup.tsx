import React, { useState } from 'react';

interface ApiKeySetupProps {
  onSubmit: (apiKey: string, useDemoMode: boolean) => void;
}

const ApiKeySetup: React.FC<ApiKeySetupProps> = ({ onSubmit }) => {
  const [apiKey, setApiKey] = useState<string>('');
  const [useDemoMode, setUseDemoMode] = useState<boolean>(false);
  const [isValidating, setIsValidating] = useState<boolean>(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (useDemoMode) {
      // Skip validation for demo mode
      onSubmit('', true);
      return;
    }
    
    if (!apiKey.trim()) {
      setValidationError('Please enter an API key or select Demo Mode');
      return;
    }
    
    // Basic format validation
    if (!apiKey.startsWith('sk-') || apiKey.length < 20) {
      setValidationError('Invalid API key format. OpenAI API keys typically start with "sk-"');
      return;
    }
    
    setIsValidating(true);
    setValidationError(null);
    
    try {
      // Simulate API key validation
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // In a real implementation, we would validate the key with a test call to OpenAI
      // For demo purposes, we'll just accept any key with the correct format
      
      onSubmit(apiKey, false);
    } catch (error) {
      setValidationError('Error validating API key. Please try again.');
    } finally {
      setIsValidating(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
        API Key Setup
      </h2>
      
      <p className="text-gray-700 dark:text-gray-300 mb-6">
        To use the interactive demo with real responses, please enter your OpenAI API key. 
        Your key will be stored securely in your browser session only and will not be sent to our servers.
      </p>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="apiKey" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            OpenAI API Key
          </label>
          <input
            type="password"
            id="apiKey"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="sk-..."
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            disabled={useDemoMode || isValidating}
          />
          {validationError && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">
              {validationError}
            </p>
          )}
        </div>
        
        <div className="flex items-center">
          <input
            type="checkbox"
            id="demoMode"
            checked={useDemoMode}
            onChange={(e) => setUseDemoMode(e.target.checked)}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            disabled={isValidating}
          />
          <label htmlFor="demoMode" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
            Use Demo Mode (no API key required, simulated responses)
          </label>
        </div>
        
        <div className="pt-2">
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors disabled:bg-blue-400 disabled:cursor-not-allowed"
            disabled={isValidating}
          >
            {isValidating ? 'Validating...' : 'Continue'}
          </button>
        </div>
        
        <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
          <p>Don't have an OpenAI API key? <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Get one here</a>.</p>
          <p className="mt-1">Your API key will only be used in your browser and will not be stored on our servers.</p>
        </div>
      </form>
    </div>
  );
};

export default ApiKeySetup;
