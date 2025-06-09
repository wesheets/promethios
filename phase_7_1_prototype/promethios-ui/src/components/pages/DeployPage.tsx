import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import AgentFirebaseService, { AgentConfiguration } from '../../firebase/agentService';

/**
 * Deploy Page Component
 * 
 * This component provides the final step in the Promethios workflow:
 * 1. Agents - Wrap and configure agents
 * 2. Governance - Test and tune governance settings
 * 3. Deploy - Export governed agents for production
 */

interface DeploymentOption {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  format: 'docker' | 'lambda' | 'api' | 'sdk';
  platform?: string;
  complexity: 'beginner' | 'intermediate' | 'advanced';
}

interface DeploymentPackage {
  agentId: string;
  format: string;
  platform?: string;
  governanceLevel: string;
  packageUrl?: string;
  instructions: string[];
  createdAt: string;
}

const DeployPage: React.FC = () => {
  const { currentUser } = useAuth();
  const [agents, setAgents] = useState<AgentConfiguration[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<AgentConfiguration | null>(null);
  const [selectedDeployment, setSelectedDeployment] = useState<DeploymentOption | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [deploymentPackage, setDeploymentPackage] = useState<DeploymentPackage | null>(null);
  const [loading, setLoading] = useState(true);

  // Deployment options available to users
  const deploymentOptions: DeploymentOption[] = [
    {
      id: 'docker',
      name: 'Docker Container',
      description: 'Self-contained governed agent ready for any Docker environment',
      format: 'docker',
      complexity: 'beginner',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      )
    },
    {
      id: 'lambda',
      name: 'AWS Lambda Function',
      description: 'Serverless governed agent for AWS Lambda deployment',
      format: 'lambda',
      platform: 'aws',
      complexity: 'intermediate',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 12l2 2 4-4" />
        </svg>
      )
    },
    {
      id: 'api',
      name: 'REST API Service',
      description: 'Standalone API service with governance middleware',
      format: 'api',
      complexity: 'intermediate',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
      )
    },
    {
      id: 'sdk',
      name: 'Governance SDK',
      description: 'Embeddable governance library for custom integration',
      format: 'sdk',
      complexity: 'advanced',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
        </svg>
      )
    }
  ];

  // Load user's agents on component mount
  useEffect(() => {
    const loadAgents = async () => {
      if (!currentUser?.uid) return;
      
      try {
        setLoading(true);
        const userAgents = await AgentFirebaseService.getUserAgents(currentUser.uid);
        const activeAgents = userAgents.filter(agent => agent.status === 'active');
        setAgents(activeAgents);
        
        // Auto-select first agent if available
        if (activeAgents.length > 0) {
          setSelectedAgent(activeAgents[0]);
        }
      } catch (error) {
        console.error('Error loading agents:', error);
      } finally {
        setLoading(false);
      }
    };

    loadAgents();
  }, [currentUser]);

  // Generate deployment package
  const generateDeploymentPackage = async () => {
    if (!selectedAgent || !selectedDeployment) return;

    setIsGenerating(true);
    try {
      // Simulate package generation (would call actual API)
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const packageData: DeploymentPackage = {
        agentId: selectedAgent.id!,
        format: selectedDeployment.format,
        platform: selectedDeployment.platform,
        governanceLevel: selectedAgent.governanceLevel,
        packageUrl: `https://promethios-exports.s3.amazonaws.com/${selectedAgent.id}-${selectedDeployment.format}.zip`,
        instructions: generateInstructions(selectedDeployment),
        createdAt: new Date().toISOString()
      };
      
      setDeploymentPackage(packageData);
    } catch (error) {
      console.error('Error generating deployment package:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  // Generate deployment instructions based on format
  const generateInstructions = (deployment: DeploymentOption): string[] => {
    switch (deployment.format) {
      case 'docker':
        return [
          'Download the generated Docker image',
          'Load the image: docker load < governed-agent.tar',
          'Run the container: docker run -p 8080:8080 governed-agent:latest',
          'Your governed agent is now running on http://localhost:8080'
        ];
      case 'lambda':
        return [
          'Download the Lambda deployment package',
          'Create a new Lambda function in AWS Console',
          'Upload the deployment package',
          'Set environment variables as specified in config.json',
          'Deploy and test your governed agent'
        ];
      case 'api':
        return [
          'Download the API service package',
          'Extract and install dependencies: npm install',
          'Configure environment variables in .env file',
          'Start the service: npm start',
          'Your governed agent API is running on the specified port'
        ];
      case 'sdk':
        return [
          'Download the governance SDK package',
          'Install in your project: npm install ./governance-sdk',
          'Import and initialize: import { GovernanceWrapper } from "governance-sdk"',
          'Wrap your agent calls with governance middleware',
          'See documentation for advanced configuration options'
        ];
      default:
        return ['Follow the included README.md for deployment instructions'];
    }
  };

  // Get complexity badge color
  const getComplexityColor = (complexity: string) => {
    switch (complexity) {
      case 'beginner': return 'bg-green-100 text-green-800';
      case 'intermediate': return 'bg-yellow-100 text-yellow-800';
      case 'advanced': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading agents...</span>
      </div>
    );
  }

  if (agents.length === 0) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center py-12">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No agents available</h3>
          <p className="mt-1 text-sm text-gray-500">
            You need to wrap and activate agents before you can deploy them.
          </p>
          <div className="mt-6">
            <a
              href="/ui/agents"
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              Wrap Your First Agent
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="border-b border-gray-200 pb-5">
        <h1 className="text-3xl font-bold leading-6 text-gray-900">Deploy Governed Agents</h1>
        <p className="mt-2 max-w-4xl text-sm text-gray-500">
          Export your governed agents for production deployment. Choose from multiple deployment formats 
          and platforms to integrate governance into your existing infrastructure.
        </p>
      </div>

      {/* Deployment Package Result */}
      {deploymentPackage && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
          <div className="flex items-center">
            <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="ml-2 text-lg font-medium text-green-900">Deployment Package Ready!</h3>
          </div>
          <div className="mt-4">
            <p className="text-sm text-green-700 mb-4">
              Your governed agent has been packaged and is ready for deployment.
            </p>
            <div className="bg-white border border-green-200 rounded-md p-4 mb-4">
              <h4 className="font-medium text-gray-900 mb-2">Package Details:</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li><strong>Agent:</strong> {selectedAgent?.name}</li>
                <li><strong>Format:</strong> {deploymentPackage.format.toUpperCase()}</li>
                <li><strong>Governance Level:</strong> {deploymentPackage.governanceLevel}</li>
                {deploymentPackage.platform && (
                  <li><strong>Platform:</strong> {deploymentPackage.platform.toUpperCase()}</li>
                )}
              </ul>
            </div>
            <div className="bg-white border border-green-200 rounded-md p-4 mb-4">
              <h4 className="font-medium text-gray-900 mb-2">Deployment Instructions:</h4>
              <ol className="text-sm text-gray-600 space-y-1 list-decimal list-inside">
                {deploymentPackage.instructions.map((instruction, index) => (
                  <li key={index}>{instruction}</li>
                ))}
              </ol>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => window.open(deploymentPackage.packageUrl, '_blank')}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
              >
                Download Package
              </button>
              <button
                onClick={() => setDeploymentPackage(null)}
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                Create Another Package
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Agent Selection */}
      {!deploymentPackage && (
        <>
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">1. Select Agent to Deploy</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {agents.map((agent) => (
                <div
                  key={agent.id}
                  onClick={() => setSelectedAgent(agent)}
                  className={`cursor-pointer border-2 rounded-lg p-4 transition-all ${
                    selectedAgent?.id === agent.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium text-gray-900">{agent.name}</h3>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      agent.governanceLevel === 'advanced' ? 'bg-purple-100 text-purple-800' :
                      agent.governanceLevel === 'standard' ? 'bg-blue-100 text-blue-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {agent.governanceLevel}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">{agent.description}</p>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Trust Score: {agent.trustScore || 85}%</span>
                    <span className="text-gray-500">Type: {agent.agentType}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Deployment Format Selection */}
          {selectedAgent && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">2. Choose Deployment Format</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {deploymentOptions.map((option) => (
                  <div
                    key={option.id}
                    onClick={() => setSelectedDeployment(option)}
                    className={`cursor-pointer border-2 rounded-lg p-6 transition-all ${
                      selectedDeployment?.id === option.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-start space-x-4">
                      <div className="text-blue-600">{option.icon}</div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-medium text-gray-900">{option.name}</h3>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getComplexityColor(option.complexity)}`}>
                            {option.complexity}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mb-3">{option.description}</p>
                        {option.platform && (
                          <p className="text-xs text-gray-500">Platform: {option.platform.toUpperCase()}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Generate Package Button */}
          {selectedAgent && selectedDeployment && (
            <div className="border-t border-gray-200 pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">Ready to Deploy</h3>
                  <p className="text-sm text-gray-600">
                    Generate a {selectedDeployment.name.toLowerCase()} package for {selectedAgent.name}
                  </p>
                </div>
                <button
                  onClick={generateDeploymentPackage}
                  disabled={isGenerating}
                  className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isGenerating ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Generating Package...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                      Generate Package
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default DeployPage;

