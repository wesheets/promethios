import React from 'react';
import { AgentWrapperConfig } from '../../types';

interface ReviewStepProps {
  config: AgentWrapperConfig;
  onComplete: () => void;
  onPrevious: () => void;
  onEdit: (step: number) => void;
}

const ReviewStep: React.FC<ReviewStepProps> = ({ 
  config, 
  onComplete, 
  onPrevious, 
  onEdit 
}) => {
  return (
    <div className="bg-gray-800 rounded-lg p-6 mb-6">
      <h2 className="text-xl font-bold mb-4">4. Review & Create</h2>
      
      <div className="space-y-6">
        <div>
          <h3 className="font-medium mb-2">API Endpoint</h3>
          <div className="bg-gray-700 p-4 rounded-lg">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-400">Agent Name</p>
                <p>{config.name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-400">Provider</p>
                <p>{config.provider}</p>
              </div>
              <div>
                <p className="text-sm text-gray-400">API Endpoint</p>
                <p className="text-sm">{config.endpoint}</p>
              </div>
              <div>
                <p className="text-sm text-gray-400">Authentication</p>
                <p>{config.authType} (secured)</p>
              </div>
            </div>
            <button 
              onClick={() => onEdit(1)}
              className="text-blue-400 text-sm hover:text-blue-300 mt-2"
            >
              Edit
            </button>
          </div>
        </div>
        
        <div>
          <h3 className="font-medium mb-2">Schema</h3>
          <div className="bg-gray-700 p-4 rounded-lg">
            <div className="mb-2">
              <p className="text-sm text-gray-400">Schema Complexity</p>
              <p>{config.schemaComplexity === 'advanced' ? 'Advanced' : 'Basic'}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-400">Input Schema</p>
                <p className="text-xs">{config.provider} Input Schema</p>
              </div>
              <div>
                <p className="text-sm text-gray-400">Output Schema</p>
                <p className="text-xs">{config.provider} Output Schema</p>
              </div>
            </div>
            <button 
              onClick={() => onEdit(2)}
              className="text-blue-400 text-sm hover:text-blue-300 mt-2"
            >
              Edit
            </button>
          </div>
        </div>
        
        <div>
          <h3 className="font-medium mb-2">Governance</h3>
          <div className="bg-gray-700 p-4 rounded-lg">
            <div className="mb-2">
              <p className="text-sm text-gray-400">Governance Level</p>
              <p>{config.governanceLevel.charAt(0).toUpperCase() + config.governanceLevel.slice(1)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-400">Enabled Controls</p>
              <ul className="list-disc list-inside text-sm">
                {config.governanceControls.inputValidation && <li>Input Validation</li>}
                {config.governanceControls.outputValidation && <li>Output Validation</li>}
                {config.governanceControls.requestLogging && <li>Request Logging</li>}
                {config.governanceControls.errorHandling && <li>Error Handling</li>}
              </ul>
            </div>
            <button 
              onClick={() => onEdit(3)}
              className="text-blue-400 text-sm hover:text-blue-300 mt-2"
            >
              Edit
            </button>
          </div>
        </div>
      </div>
      
      {/* Navigation Buttons */}
      <div className="flex justify-between mt-6">
        <button 
          onClick={onPrevious}
          className="bg-gray-700 hover:bg-gray-600 text-white font-medium py-2 px-4 rounded-lg"
        >
          Previous
        </button>
        <button 
          onClick={onComplete}
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg"
        >
          Create Wrapped Agent
        </button>
      </div>
    </div>
  );
};

export default ReviewStep;
