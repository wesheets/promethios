import React, { useState } from 'react';
import ApiEndpointStep from './wizard-steps/ApiEndpointStep';
import SchemaStep from './wizard-steps/SchemaStep';
import GovernanceStep from './wizard-steps/GovernanceStep';
import ReviewStep from './wizard-steps/ReviewStep';
import { AgentWrapperConfig } from '../types';

interface AgentWrappingWizardProps {
  onCancel: () => void;
  onComplete: (config: AgentWrapperConfig) => void;
}

const AgentWrappingWizard: React.FC<AgentWrappingWizardProps> = ({ onCancel, onComplete }) => {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [config, setConfig] = useState<AgentWrapperConfig>({
    name: '',
    provider: 'OpenAI',
    endpoint: '',
    authType: 'API Key',
    authValue: '',
    schemaComplexity: 'basic',
    inputSchema: null,
    outputSchema: null,
    governanceLevel: 'basic',
    governanceControls: {
      inputValidation: true,
      outputValidation: true,
      requestLogging: true,
      errorHandling: true
    }
  });

  const updateConfig = (updates: Partial<AgentWrapperConfig>) => {
    setConfig({ ...config, ...updates });
  };

  const handleNext = () => {
    setCurrentStep(currentStep + 1);
  };

  const handlePrevious = () => {
    setCurrentStep(currentStep - 1);
  };

  const handleComplete = () => {
    onComplete(config);
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <ApiEndpointStep 
            config={config} 
            updateConfig={updateConfig} 
            onNext={handleNext} 
            onCancel={onCancel} 
          />
        );
      case 2:
        return (
          <SchemaStep 
            config={config} 
            updateConfig={updateConfig} 
            onNext={handleNext} 
            onPrevious={handlePrevious} 
          />
        );
      case 3:
        return (
          <GovernanceStep 
            config={config} 
            updateConfig={updateConfig} 
            onNext={handleNext} 
            onPrevious={handlePrevious} 
          />
        );
      case 4:
        return (
          <ReviewStep 
            config={config} 
            onComplete={handleComplete} 
            onPrevious={handlePrevious} 
            onEdit={setCurrentStep} 
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Wrap New Agent</h1>
          <p className="text-gray-400">Connect your AI agent API with governance controls</p>
        </div>
        <button 
          className="bg-gray-700 hover:bg-gray-600 text-white font-medium py-2 px-4 rounded-lg"
          onClick={onCancel}
        >
          Cancel
        </button>
      </div>

      <div className="max-w-4xl mx-auto">
        {/* Step Indicators */}
        <div className="flex items-center justify-between mb-8">
          {[1, 2, 3, 4].map((step) => (
            <React.Fragment key={step}>
              <div className="flex flex-col items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                  currentStep === step 
                    ? 'bg-blue-600 text-white' 
                    : currentStep > step 
                      ? 'bg-green-600 text-white' 
                      : 'bg-gray-700 text-gray-400'
                }`}>
                  {currentStep > step ? '✓' : step}
                </div>
                <span className="text-sm mt-2">
                  {step === 1 && 'API Endpoint'}
                  {step === 2 && 'Schema'}
                  {step === 3 && 'Governance'}
                  {step === 4 && 'Review'}
                </span>
              </div>
              {step < 4 && (
                <div className={`flex-grow h-0.5 ${
                  currentStep > step ? 'bg-green-600' : 'bg-gray-700'
                }`}></div>
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Current Step Content */}
        {renderStep()}
      </div>
    </div>
  );
};

export default AgentWrappingWizard;
