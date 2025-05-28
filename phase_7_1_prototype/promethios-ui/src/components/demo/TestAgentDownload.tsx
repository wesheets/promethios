import React from 'react';

interface TestAgentDownloadProps {
  onDownloaded: () => void;
}

const TestAgentDownload: React.FC<TestAgentDownloadProps> = ({ onDownloaded }) => {
  const handleDownloadClick = () => {
    // Create a link to download the test_agent.py file
    const link = document.createElement('a');
    link.href = '/test_agent.py';
    link.download = 'test_agent.py';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Notify parent component that download has been initiated
    onDownloaded();
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
        Download Test Agent
      </h2>
      
      <p className="text-gray-700 dark:text-gray-300 mb-4">
        The next step is to download our test conversational agent. This is a simple Python script that:
      </p>
      
      <ul className="list-disc pl-6 space-y-2 text-gray-700 dark:text-gray-300 mb-6">
        <li>Provides a basic conversational interface</li>
        <li>Can use either OpenAI's API or a mock LLM for responses</li>
        <li>Is designed to be easily wrapped with Promethios governance</li>
        <li>Includes clear comments to help you understand the code</li>
      </ul>
      
      <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-md mb-6">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          Requirements
        </h3>
        <ul className="list-disc pl-6 space-y-1 text-gray-700 dark:text-gray-300">
          <li>Python 3.7 or higher</li>
          <li>OpenAI Python package (optional, for OpenAI mode)</li>
        </ul>
        <div className="mt-3 p-2 bg-gray-100 dark:bg-gray-800 rounded font-mono text-sm">
          pip install openai
        </div>
      </div>
      
      <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-md mb-6 border border-blue-200 dark:border-blue-800">
        <h3 className="text-lg font-medium text-blue-900 dark:text-blue-300 mb-2">
          Usage Instructions
        </h3>
        <p className="text-blue-800 dark:text-blue-400 mb-2">
          After downloading, you can run the agent in two modes:
        </p>
        <div className="p-2 bg-blue-100 dark:bg-blue-900/40 rounded font-mono text-sm mb-2">
          # Using OpenAI API
          python test_agent.py --api-key YOUR_OPENAI_API_KEY
        </div>
        <div className="p-2 bg-blue-100 dark:bg-blue-900/40 rounded font-mono text-sm">
          # Using Demo Mode (no API key needed)
          python test_agent.py --demo-mode
        </div>
      </div>
      
      <button
        onClick={handleDownloadClick}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
      >
        Download Test Agent
      </button>
      
      <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">
        After downloading, you'll be guided through the process of wrapping this agent with Promethios governance.
      </p>
    </div>
  );
};

export default TestAgentDownload;
