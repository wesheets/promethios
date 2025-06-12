import React, { useState } from 'react';
import { AgentWrapperConfig } from '../../types';

interface GovernanceStepProps {
  config: AgentWrapperConfig;
  updateConfig: (updates: Partial<AgentWrapperConfig>) => void;
  onNext: () => void;
  onPrevious: () => void;
}

const GovernanceStep: React.FC<GovernanceStepProps> = ({ 
  config, 
  updateConfig, 
  onNext, 
  onPrevious 
}) => {
  const [selectedLevel, setSelectedLevel] = useState<string>(config.governanceLevel || 'basic');
  
  const handleLevelSelect = (level: string) => {
    setSelectedLevel(level);
    updateConfig({ governanceLevel: level });
  };

  const handleToggleControl = (control: keyof typeof config.governanceControls) => {
    updateConfig({ 
      governanceControls: {
        ...config.governanceControls,
        [control]: !config.governanceControls[control]
      }
    });
  };

  const handleAdvancedSettings = () => {
    // In a real implementation, this would open advanced settings
    // For now, we'll just show an alert
    alert('Advanced governance settings would open here');
  };

  return (
    <div className="bg-gray-800 rounded-lg p-6 mb-6">
      <h2 className="text-xl font-bold mb-4">3. Set Governance Controls</h2>
      
      <div className="mb-6">
        <label className="block text-sm font-medium mb-2">Governance Level</label>
        <div className="grid grid-cols-3 gap-4">
          <div 
            className={`border p-4 rounded-lg cursor-pointer ${
              selectedLevel === 'basic' 
                ? 'border-blue-500 bg-blue-900 bg-opacity-20' 
                : 'border-gray-600'
            }`}
            onClick={() => handleLevelSelect('basic')}
          >
            <h3 className="font-medium">Basic</h3>
            <p className="text-xs text-gray-400 mt-1">Essential governance controls for general use cases</p>
          </div>
          <div 
            className={`border p-4 rounded-lg cursor-pointer ${
              selectedLevel === 'standard' 
                ? 'border-blue-500 bg-blue-900 bg-opacity-20' 
                : 'border-gray-600'
            }`}
            onClick={() => handleLevelSelect('standard')}
          >
            <h3 className="font-medium">Standard</h3>
            <p className="text-xs text-gray-400 mt-1">Balanced controls for most business applications</p>
          </div>
          <div 
            className={`border p-4 rounded-lg cursor-pointer ${
              selectedLevel === 'strict' 
                ? 'border-blue-500 bg-blue-900 bg-opacity-20' 
                : 'border-gray-600'
            }`}
            onClick={() => handleLevelSelect('strict')}
          >
            <h3 className="font-medium">Strict</h3>
            <p className="text-xs text-gray-400 mt-1">Rigorous controls for sensitive or regulated use cases</p>
          </div>
        </div>
      </div>
      
      <div className="mb-6">
        <h3 className="font-medium mb-3">{selectedLevel.charAt(0).toUpperCase() + selectedLevel.slice(1)} Governance Controls</h3>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium">Input Validation</h4>
              <p className="text-xs text-gray-400">Validate all inputs against the defined schema</p>
            </div>
            <label className="relative inline-block w-12 h-6">
              <input 
                type="checkbox" 
                className="opacity-0 w-0 h-0" 
                checked={config.governanceControls.inputValidation}
                onChange={() => handleToggleControl('inputValidation')}
              />
              <span className={`absolute cursor-pointer inset-0 rounded-full ${
                config.governanceControls.inputValidation ? 'bg-blue-600' : 'bg-gray-600'
              }`}>
                <span className={`absolute w-4 h-4 bg-white rounded-full top-1 transition-transform ${
                  config.governanceControls.inputValidation ? 'left-7' : 'left-1'
                }`}></span>
              </span>
            </label>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium">Output Validation</h4>
              <p className="text-xs text-gray-400">Validate all outputs against the defined schema</p>
            </div>
            <label className="relative inline-block w-12 h-6">
              <input 
                type="checkbox" 
                className="opacity-0 w-0 h-0" 
                checked={config.governanceControls.outputValidation}
                onChange={() => handleToggleControl('outputValidation')}
              />
              <span className={`absolute cursor-pointer inset-0 rounded-full ${
                config.governanceControls.outputValidation ? 'bg-blue-600' : 'bg-gray-600'
              }`}>
                <span className={`absolute w-4 h-4 bg-white rounded-full top-1 transition-transform ${
                  config.governanceControls.outputValidation ? 'left-7' : 'left-1'
                }`}></span>
              </span>
            </label>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium">Request Logging</h4>
              <p className="text-xs text-gray-400">Log all requests and responses for audit purposes</p>
            </div>
            <label className="relative inline-block w-12 h-6">
              <input 
                type="checkbox" 
                className="opacity-0 w-0 h-0" 
                checked={config.governanceControls.requestLogging}
                onChange={() => handleToggleControl('requestLogging')}
              />
              <span className={`absolute cursor-pointer inset-0 rounded-full ${
                config.governanceControls.requestLogging ? 'bg-blue-600' : 'bg-gray-600'
              }`}>
                <span className={`absolute w-4 h-4 bg-white rounded-full top-1 transition-transform ${
                  config.governanceControls.requestLogging ? 'left-7' : 'left-1'
                }`}></span>
              </span>
            </label>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium">Error Handling</h4>
              <p className="text-xs text-gray-400">Standardize error responses and provide fallbacks</p>
            </div>
            <label className="relative inline-block w-12 h-6">
              <input 
                type="checkbox" 
                className="opacity-0 w-0 h-0" 
                checked={config.governanceControls.errorHandling}
                onChange={() => handleToggleControl('errorHandling')}
              />
              <span className={`absolute cursor-pointer inset-0 rounded-full ${
                config.governanceControls.errorHandling ? 'bg-blue-600' : 'bg-gray-600'
              }`}>
                <span className={`absolute w-4 h-4 bg-white rounded-full top-1 transition-transform ${
                  config.governanceControls.errorHandling ? 'left-7' : 'left-1'
                }`}></span>
              </span>
            </label>
          </div>
        </div>
      </div>
      
      <div>
        <button 
          onClick={handleAdvancedSettings}
          className="text-blue-400 text-sm hover:text-blue-300"
        >
          Configure Advanced Governance Settings
        </button>
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
          onClick={onNext}
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg"
        >
          Next: Review & Create
        </button>
      </div>
    </div>
  );
};

export default GovernanceStep;
