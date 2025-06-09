import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import AgentFirebaseService, { AgentConfiguration } from '../../firebase/agentService';
import SimpleAgentService, { TeamSummary } from '../../services/simpleAgentService';

/**
 * Enhanced Deploy Page Component
 * 
 * This component provides the final step in the Promethios workflow:
 * 1. Agents - Wrap and configure agents
 * 2. Governance - Test and tune governance settings  
 * 3. Teams - Create multi-agent teams (optional)
 * 4. Deploy - Export governed agents/teams for production
 * 
 * Now supports both individual agents and multi-agent teams!
 */

interface DeploymentOption {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  format: 'docker' | 'lambda' | 'api' | 'sdk' | 'orchestrator' | 'microservices';
  platform?: string;
  complexity: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  supportedTypes: ('agent' | 'team')[];
  estimatedSize: string;
  deploymentTime: string;
}

interface DeploymentPackage {
  entityId: string;
  entityType: 'agent' | 'team';
  entityName: string;
  format: string;
  platform?: string;
  governanceLevel: string;
  packageUrl?: string;
  instructions: string[];
  createdAt: string;
  size?: string;
  downloadUrl?: string;
  packageId?: string;
}

const DeployPage: React.FC = () => {
  const { currentUser } = useAuth();
  const [agents, setAgents] = useState<AgentConfiguration[]>([]);
  const [teams, setTeams] = useState<TeamSummary[]>([]);
  const [selectedEntity, setSelectedEntity] = useState<{type: 'agent' | 'team', data: AgentConfiguration | TeamSummary} | null>(null);
  const [selectedDeployment, setSelectedDeployment] = useState<DeploymentOption | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [deploymentPackage, setDeploymentPackage] = useState<DeploymentPackage | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'agents' | 'teams'>('agents');
  const [error, setError] = useState<string | null>(null);

  // Enhanced deployment options for both agents and teams
  const deploymentOptions: DeploymentOption[] = [
    {
      id: 'docker',
      name: 'Docker Container',
      description: 'Self-contained governed agent/team ready for any Docker environment',
      format: 'docker',
      complexity: 'beginner',
      supportedTypes: ['agent', 'team'],
      estimatedSize: '150-300 MB',
      deploymentTime: '2-5 minutes',
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
      supportedTypes: ['agent'],
      estimatedSize: '50-100 MB',
      deploymentTime: '1-3 minutes',
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
      supportedTypes: ['agent', 'team'],
      estimatedSize: '100-200 MB',
      deploymentTime: '3-7 minutes',
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
      supportedTypes: ['agent'],
      estimatedSize: '10-25 MB',
      deploymentTime: '1-2 minutes',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
        </svg>
      )
    },
    {
      id: 'orchestrator',
      name: 'Team Orchestrator',
      description: 'Multi-agent workflow orchestration service',
      format: 'orchestrator',
      complexity: 'advanced',
      supportedTypes: ['team'],
      estimatedSize: '200-400 MB',
      deploymentTime: '5-10 minutes',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      )
    },
    {
      id: 'microservices',
      name: 'Microservices Architecture',
      description: 'Distributed team deployment with individual agent services',
      format: 'microservices',
      complexity: 'expert',
      supportedTypes: ['team'],
      estimatedSize: '300-600 MB',
      deploymentTime: '10-15 minutes',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      )
    }
  ];

  // Load user's agents and teams on component mount
  useEffect(() => {
    const loadData = async () => {
      if (!currentUser?.uid) return;
      
      try {
        setLoading(true);
        setError(null);

        // Load agents
        const userAgents = await AgentFirebaseService.getUserAgents(currentUser.uid);
        const activeAgents = userAgents.filter(agent => agent.status === 'active');
        setAgents(activeAgents);

        // Load teams
        const userTeams = await SimpleAgentService.getUserTeams(currentUser.uid);
        const activeTeams = userTeams.filter(team => team.status === 'active');
        setTeams(activeTeams);
        
        // Auto-select first entity if available
        if (activeAgents.length > 0) {
          setSelectedEntity({ type: 'agent', data: activeAgents[0] });
          setActiveTab('agents');
        } else if (activeTeams.length > 0) {
          setSelectedEntity({ type: 'team', data: activeTeams[0] });
          setActiveTab('teams');
        }
      } catch (error) {
        console.error('Error loading data:', error);
        setError('Failed to load agents and teams');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [currentUser]);

  // Generate deployment package
  const generateDeploymentPackage = async () => {
    if (!selectedEntity || !selectedDeployment) return;

    setIsGenerating(true);
    setError(null);

    try {
      // Call the deployment API
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:3001/api'}/deploy/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: selectedEntity.type,
          id: selectedEntity.data.id,
          format: selectedDeployment.format,
          options: {
            includeGovernance: true,
            governanceLevel: selectedEntity.type === 'agent' 
              ? (selectedEntity.data as AgentConfiguration).governanceLevel 
              : 'team-optimized',
            includeObserver: true,
            includeScorecard: true
          }
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate deployment package');
      }

      const packageData = await response.json();
      
      const deploymentPackage: DeploymentPackage = {
        entityId: selectedEntity.data.id!,
        entityType: selectedEntity.type,
        entityName: selectedEntity.data.name,
        format: selectedDeployment.format,
        platform: selectedDeployment.platform,
        governanceLevel: selectedEntity.type === 'agent' 
          ? (selectedEntity.data as AgentConfiguration).governanceLevel 
          : 'team-optimized',
        packageUrl: packageData.downloadUrl,
        instructions: generateInstructions(selectedDeployment, selectedEntity),
        createdAt: new Date().toISOString(),
        size: packageData.size,
        downloadUrl: packageData.downloadUrl,
        packageId: packageData.packageId
      };
      
      setDeploymentPackage(deploymentPackage);
      
      console.log(`🚀 Deployment package generated: ${selectedEntity.type} "${selectedEntity.data.name}" as ${selectedDeployment.format}`);
      
    } catch (error) {
      console.error('Error generating deployment package:', error);
      setError(error instanceof Error ? error.message : 'Failed to generate deployment package');
    } finally {
      setIsGenerating(false);
    }
  };

  // Generate deployment instructions
  const generateInstructions = (deployment: DeploymentOption, entity: {type: 'agent' | 'team', data: AgentConfiguration | TeamSummary}): string[] => {
    const entityName = entity.data.name;
    const entityType = entity.type;

    switch (deployment.format) {
      case 'docker':
        return [
          '1. Extract the deployment package to your desired directory',
          '2. Ensure Docker is installed and running on your system',
          `3. Run: docker-compose up -d`,
          `4. Your governed ${entityType} "${entityName}" will be available at http://localhost:8080`,
          '5. Access the governance dashboard at http://localhost:8080/governance',
          '6. View the public scorecard at http://localhost:8080/scorecard'
        ];
      
      case 'lambda':
        return [
          '1. Extract the deployment package',
          '2. Install AWS CLI and configure your credentials',
          '3. Install AWS SAM CLI for deployment',
          '4. Run: sam deploy --guided',
          '5. Follow the prompts to configure your Lambda function',
          `6. Your governed agent "${entityName}" will be deployed to AWS Lambda`,
          '7. Test using the provided API Gateway endpoint'
        ];
      
      case 'api':
        return [
          '1. Extract the deployment package to your server',
          '2. Install Node.js (version 18 or higher)',
          '3. Run: npm install',
          '4. Configure environment variables in .env file',
          '5. Run: npm start',
          `6. Your governed ${entityType} API will be available at http://localhost:3000`,
          '7. Test the API using the provided endpoints documentation'
        ];
      
      case 'sdk':
        return [
          '1. Extract the SDK package',
          '2. Install in your project: npm install ./promethios-governance-sdk',
          '3. Import: const { GovernanceWrapper } = require("promethios-governance-sdk")',
          '4. Initialize with your agent configuration',
          '5. Wrap your agent calls with governance enforcement',
          '6. See integration-examples/ for detailed usage patterns'
        ];
      
      case 'orchestrator':
        return [
          '1. Extract the team orchestrator package',
          '2. Configure team members in team-config.json',
          '3. Ensure Docker is installed and running',
          '4. Run: docker-compose up -d',
          `5. Team "${entityName}" orchestrator will be available at http://localhost:8080`,
          '6. Access team dashboard at http://localhost:8080/team',
          '7. Monitor team workflows at http://localhost:8080/workflows'
        ];
      
      case 'microservices':
        return [
          '1. Extract the microservices package',
          '2. Ensure Kubernetes cluster is available',
          '3. Deploy using: kubectl apply -f kubernetes-manifests/',
          '4. Or use Helm: helm install team-deployment ./helm-charts/',
          `5. Team "${entityName}" services will be distributed across the cluster`,
          '6. Access the gateway service for team coordination',
          '7. Monitor using provided Grafana dashboards'
        ];
      
      default:
        return ['Instructions will be provided after package generation.'];
    }
  };

  // Get available deployment options for selected entity
  const getAvailableDeployments = () => {
    if (!selectedEntity) return [];
    return deploymentOptions.filter(option => 
      option.supportedTypes.includes(selectedEntity.type)
    );
  };

  const getComplexityColor = (complexity: string) => {
    switch (complexity) {
      case 'beginner': return 'text-green-600 bg-green-100';
      case 'intermediate': return 'text-yellow-600 bg-yellow-100';
      case 'advanced': return 'text-orange-600 bg-orange-100';
      case 'expert': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading deployment options...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <h1 className="text-3xl font-bold text-gray-900">Deploy Governed Agents & Teams</h1>
            <p className="mt-2 text-gray-600">
              Export your governed agents and teams for production deployment with embedded constitutional framework
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Step 1: Select Entity to Deploy */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Step 1: Select Entity to Deploy</h2>
            <p className="text-gray-600 mt-1">Choose an agent or team to deploy with governance</p>
          </div>

          {/* Tab Navigation */}
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex px-6">
              <button
                onClick={() => setActiveTab('agents')}
                className={`py-2 px-1 border-b-2 font-medium text-sm mr-8 ${
                  activeTab === 'agents'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Individual Agents ({agents.length})
              </button>
              <button
                onClick={() => setActiveTab('teams')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'teams'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Agent Teams ({teams.length})
              </button>
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'agents' && (
              <div>
                {agents.length === 0 ? (
                  <div className="text-center py-8">
                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No agents ready for deployment</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Create and configure agents first before deploying them.
                    </p>
                    <div className="mt-6">
                      <button
                        onClick={() => window.location.href = '/ui/agents'}
                        className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                      >
                        Go to Agent Management
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {agents.map((agent) => (
                      <div
                        key={agent.id}
                        onClick={() => setSelectedEntity({ type: 'agent', data: agent })}
                        className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                          selectedEntity?.type === 'agent' && selectedEntity.data.id === agent.id
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-medium text-gray-900">{agent.name}</h3>
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            agent.trustScore && agent.trustScore >= 90 ? 'bg-green-100 text-green-800' :
                            agent.trustScore && agent.trustScore >= 75 ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            Trust: {agent.trustScore || 0}%
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{agent.description}</p>
                        <div className="text-xs text-gray-500">
                          <span className="capitalize">{agent.governanceLevel}</span> governance • {agent.agentType.toUpperCase()}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'teams' && (
              <div>
                {teams.length === 0 ? (
                  <div className="text-center py-8">
                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No teams ready for deployment</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Create multi-agent teams first before deploying them.
                    </p>
                    <div className="mt-6">
                      <button
                        onClick={() => window.location.href = '/ui/governance?tab=teams'}
                        className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
                      >
                        Go to Team Management
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {teams.map((team) => (
                      <div
                        key={team.id}
                        onClick={() => setSelectedEntity({ type: 'team', data: team })}
                        className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                          selectedEntity?.type === 'team' && selectedEntity.data.id === team.id
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-medium text-gray-900">{team.name}</h3>
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            team.averageTrustScore >= 90 ? 'bg-green-100 text-green-800' :
                            team.averageTrustScore >= 75 ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            Avg Trust: {team.averageTrustScore}%
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{team.description}</p>
                        <div className="text-xs text-gray-500">
                          <span className="capitalize">{team.teamType}</span> team • {team.memberCount} members
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Step 2: Choose Deployment Format */}
        {selectedEntity && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-8">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Step 2: Choose Deployment Format</h2>
              <p className="text-gray-600 mt-1">
                Select how you want to deploy "{selectedEntity.data.name}" ({selectedEntity.type})
              </p>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {getAvailableDeployments().map((option) => (
                  <div
                    key={option.id}
                    onClick={() => setSelectedDeployment(option)}
                    className={`p-6 border rounded-lg cursor-pointer transition-colors ${
                      selectedDeployment?.id === option.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center mb-4">
                      <div className="text-blue-600 mr-3">{option.icon}</div>
                      <div>
                        <h3 className="font-medium text-gray-900">{option.name}</h3>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getComplexityColor(option.complexity)}`}>
                          {option.complexity}
                        </span>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">{option.description}</p>
                    <div className="text-xs text-gray-500 space-y-1">
                      <div>Size: {option.estimatedSize}</div>
                      <div>Time: {option.deploymentTime}</div>
                      {option.platform && <div>Platform: {option.platform.toUpperCase()}</div>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Generate Package */}
        {selectedEntity && selectedDeployment && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-8">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Step 3: Generate Deployment Package</h2>
              <p className="text-gray-600 mt-1">
                Create a production-ready package with embedded governance
              </p>
            </div>
            <div className="p-6">
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <h3 className="font-medium text-gray-900 mb-2">Package Configuration</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Entity:</span>
                    <span className="ml-2 font-medium">{selectedEntity.data.name} ({selectedEntity.type})</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Format:</span>
                    <span className="ml-2 font-medium">{selectedDeployment.name}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Governance:</span>
                    <span className="ml-2 font-medium">
                      {selectedEntity.type === 'agent' 
                        ? (selectedEntity.data as AgentConfiguration).governanceLevel 
                        : 'Team-Optimized'}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">Observer:</span>
                    <span className="ml-2 font-medium text-green-600">Included</span>
                  </div>
                </div>
              </div>

              <button
                onClick={generateDeploymentPackage}
                disabled={isGenerating}
                className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
                  isGenerating
                    ? 'bg-gray-400 text-white cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                {isGenerating ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Generating Package...
                  </div>
                ) : (
                  'Generate Deployment Package'
                )}
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Download & Deploy */}
        {deploymentPackage && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Step 4: Download & Deploy</h2>
              <p className="text-gray-600 mt-1">Your deployment package is ready!</p>
            </div>
            <div className="p-6">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-green-800">Package Generated Successfully</h3>
                    <div className="mt-2 text-sm text-green-700">
                      <p>
                        Your {deploymentPackage.entityType} "{deploymentPackage.entityName}" has been packaged as {deploymentPackage.format}
                        {deploymentPackage.size && ` (${deploymentPackage.size})`}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex space-x-4 mb-6">
                <button
                  onClick={() => window.open(deploymentPackage.downloadUrl, '_blank')}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg font-medium transition-colors"
                >
                  📦 Download Package
                </button>
                <button
                  onClick={() => {
                    const instructions = deploymentPackage.instructions.join('\n');
                    navigator.clipboard.writeText(instructions);
                  }}
                  className="bg-gray-600 hover:bg-gray-700 text-white py-3 px-4 rounded-lg font-medium transition-colors"
                >
                  📋 Copy Instructions
                </button>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-3">Deployment Instructions</h3>
                <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700">
                  {deploymentPackage.instructions.map((instruction, index) => (
                    <li key={index}>{instruction}</li>
                  ))}
                </ol>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DeployPage;

