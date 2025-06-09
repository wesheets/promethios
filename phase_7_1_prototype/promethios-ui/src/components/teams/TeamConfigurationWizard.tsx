import React, { useState, useEffect } from 'react';
import { AgentTeam, AgentRole, TEAM_TEMPLATES, TeamMetricsCalculator } from '../../types/teamTypes';
import { AgentConfiguration } from '../../firebase/agentService';

interface TeamConfigurationWizardProps {
  availableAgents: AgentConfiguration[];
  onTeamCreated: (team: AgentTeam) => void;
  onCancel: () => void;
}

/**
 * Team Configuration Wizard Component
 * 
 * Multi-step wizard for creating and configuring agent teams:
 * 1. Team Type Selection
 * 2. Basic Team Information
 * 3. Role Configuration
 * 4. Agent Assignment
 * 5. Governance Settings
 * 6. Review and Create
 */
const TeamConfigurationWizard: React.FC<TeamConfigurationWizardProps> = ({
  availableAgents,
  onTeamCreated,
  onCancel
}) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [teamData, setTeamData] = useState<Partial<AgentTeam>>({
    name: '',
    description: '',
    teamType: 'collaborative',
    maxMembers: 5,
    members: [],
    roles: [],
    workflows: [],
    governancePolicy: {
      inheritFromMembers: true,
      requireConsensus: true,
      escalationRules: {
        trustThreshold: 75,
        violationLimit: 3,
        timeoutMinutes: 30
      }
    }
  });

  const steps = [
    { id: 1, title: 'Team Type', description: 'Choose your team structure' },
    { id: 2, title: 'Basic Info', description: 'Name and describe your team' },
    { id: 3, title: 'Roles', description: 'Define team roles and permissions' },
    { id: 4, title: 'Members', description: 'Assign agents to roles' },
    { id: 5, title: 'Governance', description: 'Configure team governance' },
    { id: 6, title: 'Review', description: 'Review and create team' }
  ];

  // Handle team type selection
  const handleTeamTypeSelect = (teamType: keyof typeof TEAM_TEMPLATES) => {
    const template = TEAM_TEMPLATES[teamType];
    setTeamData(prev => ({
      ...prev,
      teamType,
      roles: template.defaultRoles.map((role, index) => ({
        id: `role-${index}`,
        ...role
      })),
      governancePolicy: template.governancePolicy
    }));
  };

  // Handle role modification
  const handleRoleUpdate = (roleId: string, updates: Partial<AgentRole>) => {
    setTeamData(prev => ({
      ...prev,
      roles: prev.roles?.map(role => 
        role.id === roleId ? { ...role, ...updates } : role
      ) || []
    }));
  };

  // Handle agent assignment
  const handleAgentAssignment = (agentId: string, roleId: string) => {
    setTeamData(prev => ({
      ...prev,
      members: [
        ...(prev.members?.filter(m => m.agentId !== agentId) || []),
        {
          agentId,
          roleId,
          joinedAt: new Date().toISOString(),
          status: 'active' as const,
          performanceMetrics: {
            averageTrustScore: 0,
            totalInteractions: 0,
            violationCount: 0,
            lastActivity: new Date().toISOString()
          }
        }
      ]
    }));
  };

  // Create team
  const handleCreateTeam = () => {
    const newTeam: AgentTeam = {
      id: `team-${Date.now()}`,
      ownerId: 'current-user', // TODO: Get from auth context
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: 'active',
      workflows: [],
      metrics: {
        averageTeamTrustScore: TeamMetricsCalculator.calculateTeamTrustScore(teamData.members || []),
        totalTeamInteractions: 0,
        teamViolationRate: 0,
        collaborationEfficiency: 0,
        governanceCompliance: 100
      },
      ...teamData as AgentTeam
    };

    onTeamCreated(newTeam);
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Choose Your Team Structure</h3>
              <p className="text-gray-600 mb-6">
                Select the team structure that best fits your workflow and governance needs.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {Object.entries(TEAM_TEMPLATES).map(([key, template]) => (
                <div
                  key={key}
                  onClick={() => handleTeamTypeSelect(key as keyof typeof TEAM_TEMPLATES)}
                  className={`p-6 border-2 rounded-lg cursor-pointer transition-all ${
                    teamData.teamType === key
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <h4 className="font-semibold text-gray-900 mb-2">{template.name}</h4>
                  <p className="text-sm text-gray-600 mb-4">{template.description}</p>
                  
                  <div className="space-y-2">
                    <div className="text-xs text-gray-500">Default Roles:</div>
                    {template.defaultRoles.map((role, index) => (
                      <div key={index} className="text-xs bg-gray-100 px-2 py-1 rounded">
                        {role.name}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Team Information</h3>
              <p className="text-gray-600 mb-6">
                Provide basic information about your team.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Team Name *
                </label>
                <input
                  type="text"
                  value={teamData.name || ''}
                  onChange={(e) => setTeamData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter team name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={teamData.description || ''}
                  onChange={(e) => setTeamData(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Describe the team's purpose and goals"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Maximum Members
                </label>
                <select
                  value={teamData.maxMembers || 5}
                  onChange={(e) => setTeamData(prev => ({ ...prev, maxMembers: parseInt(e.target.value) }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {[3, 5, 10, 15, 20].map(num => (
                    <option key={num} value={num}>{num} members</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Configure Team Roles</h3>
              <p className="text-gray-600 mb-6">
                Customize roles and permissions for your team members.
              </p>
            </div>

            <div className="space-y-4">
              {teamData.roles?.map((role, index) => (
                <div key={role.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <input
                      type="text"
                      value={role.name}
                      onChange={(e) => handleRoleUpdate(role.id, { name: e.target.value })}
                      className="text-lg font-semibold bg-transparent border-none focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-2"
                    />
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-500">Trust Req:</span>
                      <input
                        type="number"
                        value={role.trustRequirement}
                        onChange={(e) => handleRoleUpdate(role.id, { trustRequirement: parseInt(e.target.value) })}
                        className="w-16 px-2 py-1 text-sm border border-gray-300 rounded"
                        min="0"
                        max="100"
                      />
                      <span className="text-sm text-gray-500">%</span>
                    </div>
                  </div>

                  <textarea
                    value={role.description}
                    onChange={(e) => handleRoleUpdate(role.id, { description: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
                    rows={2}
                    placeholder="Role description"
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Governance Level</label>
                      <select
                        value={role.governanceLevel}
                        onChange={(e) => handleRoleUpdate(role.id, { governanceLevel: e.target.value as any })}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="basic">Basic</option>
                        <option value="standard">Standard</option>
                        <option value="strict">Strict</option>
                        <option value="maximum">Maximum</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Permissions</label>
                      <div className="space-y-1">
                        {Object.entries(role.permissions).map(([key, value]) => (
                          <label key={key} className="flex items-center text-sm">
                            <input
                              type="checkbox"
                              checked={value}
                              onChange={(e) => handleRoleUpdate(role.id, {
                                permissions: { ...role.permissions, [key]: e.target.checked }
                              })}
                              className="mr-2"
                            />
                            {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              <button
                onClick={() => {
                  const newRole: AgentRole = {
                    id: `role-${Date.now()}`,
                    name: 'New Role',
                    description: '',
                    capabilities: [],
                    permissions: {
                      canInitiateWorkflow: false,
                      canModifyGovernance: false,
                      canAccessSensitiveData: false,
                      canOverrideDecisions: false
                    },
                    governanceLevel: 'standard',
                    trustRequirement: 75
                  };
                  setTeamData(prev => ({
                    ...prev,
                    roles: [...(prev.roles || []), newRole]
                  }));
                }}
                className="w-full py-2 px-4 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-gray-400 hover:text-gray-700 transition-colors"
              >
                + Add New Role
              </button>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Assign Agents to Roles</h3>
              <p className="text-gray-600 mb-6">
                Select which agents will fill each role in your team.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Available Agents */}
              <div>
                <h4 className="font-medium text-gray-900 mb-4">Available Agents</h4>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {availableAgents.map(agent => {
                    const isAssigned = teamData.members?.some(m => m.agentId === agent.id);
                    return (
                      <div
                        key={agent.id}
                        className={`p-3 border rounded-lg ${
                          isAssigned ? 'bg-gray-50 border-gray-200' : 'bg-white border-gray-300 hover:border-blue-300'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium text-gray-900">{agent.name}</div>
                            <div className="text-sm text-gray-500">{agent.agentType}</div>
                            <div className="text-xs text-gray-400">Trust: {agent.trustScore || 0}%</div>
                          </div>
                          {!isAssigned && (
                            <select
                              onChange={(e) => {
                                if (e.target.value) {
                                  handleAgentAssignment(agent.id!, e.target.value);
                                }
                              }}
                              className="px-2 py-1 text-sm border border-gray-300 rounded"
                              defaultValue=""
                            >
                              <option value="">Assign Role</option>
                              {teamData.roles?.map(role => (
                                <option key={role.id} value={role.id}>{role.name}</option>
                              ))}
                            </select>
                          )}
                          {isAssigned && (
                            <span className="text-sm text-green-600 font-medium">Assigned</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Team Assignments */}
              <div>
                <h4 className="font-medium text-gray-900 mb-4">Team Assignments</h4>
                <div className="space-y-4">
                  {teamData.roles?.map(role => {
                    const assignedMembers = teamData.members?.filter(m => m.roleId === role.id) || [];
                    return (
                      <div key={role.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="font-medium text-gray-900 mb-2">{role.name}</div>
                        <div className="text-sm text-gray-600 mb-3">{role.description}</div>
                        
                        {assignedMembers.length === 0 ? (
                          <div className="text-sm text-gray-400 italic">No agents assigned</div>
                        ) : (
                          <div className="space-y-2">
                            {assignedMembers.map(member => {
                              const agent = availableAgents.find(a => a.id === member.agentId);
                              return (
                                <div key={member.agentId} className="flex items-center justify-between bg-blue-50 px-3 py-2 rounded">
                                  <span className="text-sm font-medium">{agent?.name}</span>
                                  <button
                                    onClick={() => {
                                      setTeamData(prev => ({
                                        ...prev,
                                        members: prev.members?.filter(m => m.agentId !== member.agentId) || []
                                      }));
                                    }}
                                    className="text-red-600 hover:text-red-700 text-sm"
                                  >
                                    Remove
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Governance Configuration</h3>
              <p className="text-gray-600 mb-6">
                Configure how governance will be applied across your team.
              </p>
            </div>

            <div className="space-y-6">
              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-4">Governance Policy</h4>
                
                <div className="space-y-4">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={teamData.governancePolicy?.inheritFromMembers || false}
                      onChange={(e) => setTeamData(prev => ({
                        ...prev,
                        governancePolicy: {
                          ...prev.governancePolicy!,
                          inheritFromMembers: e.target.checked
                        }
                      }))}
                      className="mr-3"
                    />
                    <span className="text-sm">Inherit governance settings from individual agents</span>
                  </label>

                  {!teamData.governancePolicy?.inheritFromMembers && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Override Governance Level
                      </label>
                      <select
                        value={teamData.governancePolicy?.overrideLevel || 'standard'}
                        onChange={(e) => setTeamData(prev => ({
                          ...prev,
                          governancePolicy: {
                            ...prev.governancePolicy!,
                            overrideLevel: e.target.value as any
                          }
                        }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="basic">Basic</option>
                        <option value="standard">Standard</option>
                        <option value="strict">Strict</option>
                        <option value="maximum">Maximum</option>
                      </select>
                    </div>
                  )}

                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={teamData.governancePolicy?.requireConsensus || false}
                      onChange={(e) => setTeamData(prev => ({
                        ...prev,
                        governancePolicy: {
                          ...prev.governancePolicy!,
                          requireConsensus: e.target.checked
                        }
                      }))}
                      className="mr-3"
                    />
                    <span className="text-sm">Require consensus for team decisions</span>
                  </label>
                </div>
              </div>

              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-4">Escalation Rules</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Trust Threshold
                    </label>
                    <div className="flex items-center">
                      <input
                        type="number"
                        value={teamData.governancePolicy?.escalationRules.trustThreshold || 75}
                        onChange={(e) => setTeamData(prev => ({
                          ...prev,
                          governancePolicy: {
                            ...prev.governancePolicy!,
                            escalationRules: {
                              ...prev.governancePolicy!.escalationRules,
                              trustThreshold: parseInt(e.target.value)
                            }
                          }
                        }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        min="0"
                        max="100"
                      />
                      <span className="ml-2 text-sm text-gray-500">%</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Violation Limit
                    </label>
                    <input
                      type="number"
                      value={teamData.governancePolicy?.escalationRules.violationLimit || 3}
                      onChange={(e) => setTeamData(prev => ({
                        ...prev,
                        governancePolicy: {
                          ...prev.governancePolicy!,
                          escalationRules: {
                            ...prev.governancePolicy!.escalationRules,
                            violationLimit: parseInt(e.target.value)
                          }
                        }
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      min="1"
                      max="10"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Timeout (minutes)
                    </label>
                    <input
                      type="number"
                      value={teamData.governancePolicy?.escalationRules.timeoutMinutes || 30}
                      onChange={(e) => setTeamData(prev => ({
                        ...prev,
                        governancePolicy: {
                          ...prev.governancePolicy!,
                          escalationRules: {
                            ...prev.governancePolicy!.escalationRules,
                            timeoutMinutes: parseInt(e.target.value)
                          }
                        }
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      min="5"
                      max="120"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 6:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Review Team Configuration</h3>
              <p className="text-gray-600 mb-6">
                Review your team configuration before creating the team.
              </p>
            </div>

            <div className="space-y-6">
              {/* Team Summary */}
              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-3">Team Summary</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Name:</span>
                    <span className="ml-2 font-medium">{teamData.name}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Type:</span>
                    <span className="ml-2 font-medium capitalize">{teamData.teamType}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Max Members:</span>
                    <span className="ml-2 font-medium">{teamData.maxMembers}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Current Members:</span>
                    <span className="ml-2 font-medium">{teamData.members?.length || 0}</span>
                  </div>
                </div>
                {teamData.description && (
                  <div className="mt-3">
                    <span className="text-gray-600">Description:</span>
                    <p className="mt-1 text-sm">{teamData.description}</p>
                  </div>
                )}
              </div>

              {/* Roles Summary */}
              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-3">Roles ({teamData.roles?.length || 0})</h4>
                <div className="space-y-2">
                  {teamData.roles?.map(role => {
                    const assignedCount = teamData.members?.filter(m => m.roleId === role.id).length || 0;
                    return (
                      <div key={role.id} className="flex items-center justify-between text-sm">
                        <span className="font-medium">{role.name}</span>
                        <span className="text-gray-600">{assignedCount} assigned</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Governance Summary */}
              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-3">Governance Configuration</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Inherit from members:</span>
                    <span className="font-medium">
                      {teamData.governancePolicy?.inheritFromMembers ? 'Yes' : 'No'}
                    </span>
                  </div>
                  {!teamData.governancePolicy?.inheritFromMembers && (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Override level:</span>
                      <span className="font-medium capitalize">
                        {teamData.governancePolicy?.overrideLevel}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Require consensus:</span>
                    <span className="font-medium">
                      {teamData.governancePolicy?.requireConsensus ? 'Yes' : 'No'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return teamData.teamType;
      case 2:
        return teamData.name && teamData.name.trim().length > 0;
      case 3:
        return teamData.roles && teamData.roles.length > 0;
      case 4:
        return teamData.members && teamData.members.length > 0;
      case 5:
        return true;
      case 6:
        return true;
      default:
        return false;
    }
  };

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-gray-900">Create Agent Team</h2>
        <p className="text-sm text-gray-600 mt-1">
          Configure a new team of agents with governance and workflow management
        </p>
      </div>

      {/* Progress Steps */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
                currentStep >= step.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-600'
              }`}>
                {step.id}
              </div>
              <div className="ml-3">
                <div className={`text-sm font-medium ${
                  currentStep >= step.id ? 'text-blue-600' : 'text-gray-600'
                }`}>
                  {step.title}
                </div>
                <div className="text-xs text-gray-500">{step.description}</div>
              </div>
              {index < steps.length - 1 && (
                <div className={`mx-4 h-px w-12 ${
                  currentStep > step.id ? 'bg-blue-600' : 'bg-gray-200'
                }`} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Step Content */}
      <div className="px-6 py-6 min-h-[500px]">
        {renderStepContent()}
      </div>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
        <button
          onClick={currentStep === 1 ? onCancel : () => setCurrentStep(currentStep - 1)}
          className="px-4 py-2 text-gray-600 hover:text-gray-700 transition-colors"
        >
          {currentStep === 1 ? 'Cancel' : 'Back'}
        </button>

        <div className="flex items-center space-x-3">
          {currentStep < 6 ? (
            <button
              onClick={() => setCurrentStep(currentStep + 1)}
              disabled={!canProceed()}
              className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                canProceed()
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              Next
            </button>
          ) : (
            <button
              onClick={handleCreateTeam}
              disabled={!canProceed()}
              className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                canProceed()
                  ? 'bg-green-600 text-white hover:bg-green-700'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              Create Team
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default TeamConfigurationWizard;

