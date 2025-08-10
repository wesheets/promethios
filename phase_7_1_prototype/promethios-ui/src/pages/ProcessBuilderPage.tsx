import React from 'react';
import { ProcessBuilderCanvas } from '../components/process-builder/ProcessBuilderCanvas';

/**
 * Process Builder Page
 * 
 * Main page component for the autonomous MAS process builder.
 * Provides a complete interface for building AI-native business processes
 * with multi-agent collaboration, external integrations, and governance.
 */
const ProcessBuilderPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-900">
      <div className="container mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-white mb-2">
            Autonomous Process Builder
          </h1>
          <p className="text-gray-400">
            Build AI-native business processes with multi-agent collaboration, 
            external integrations, and comprehensive governance oversight.
          </p>
        </div>
        
        <ProcessBuilderCanvas />
      </div>
    </div>
  );
};

export default ProcessBuilderPage;

