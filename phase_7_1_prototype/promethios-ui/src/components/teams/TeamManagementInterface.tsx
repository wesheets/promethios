import React, { useState, useEffect } from 'react';
import { AgentTeam, AgentTeamMember, TeamActivity, TeamMetricsCalculator } from '../../types/teamTypes';
import { AgentConfiguration } from '../../firebase/agentService';
import TeamConfigurationWizard from './TeamConfigurationWizard';

interface TeamManagementInterfaceProps {
  teams: AgentTeam[];
  availableAgents: AgentConfiguration[];
  onTeamUpdate: (team: AgentTeam) => void;
  onTeamDelete: (teamId: string) => void;
  onTeamCreate: (team: AgentTeam) => void;
}

/**
 * Team Management Interface Component
 * 
 * Comprehensive interface for managing agent teams:
 * - Team overview dashboard
 * - Team creation and editing
 * - Member management
 * - Performance analytics
 * - Activity monitoring
 */
const TeamManagementInterface: React.FC<TeamManagementInterfaceProps> = ({
  teams,
  availableAgents,
  onTeamUpdate,
  onTeamDelete,
  onTeamCreate
}) => {
  const [selectedTeam, setSelectedTeam] = useState<AgentTeam | null>(null);
  const [showCreateWizard, setShowCreateWizard] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'members' | 'analytics' | 'activity'>('overview');
  const [teamActivities, setTeamActivities] = useState<TeamActivity[]>([]);

  // Mock team activities for demonstration
  useEffect(() => {
    if (selectedTeam) {
      const mockActivities: TeamActivity[] = [
        {
          id: 'activity-1',
          teamId: selectedTeam.id,
          activityType: 'member_joined',
          actorId: 'agent-1',
          timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
          details: {
            description: 'Agent "Research Assistant" joined the team as Research Specialist'
          },
          severity: 'info'
        },
        {
          id: 'activity-2',
          teamId: selectedTeam.id,
          activityType: 'workflow_started',
          actorId: 'agent-2',
          targetId: 'workflow-1',
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
          details: {
            description: 'Content Creation workflow initiated by Content Creator'
          },
          severity: 'info'
        },
        {
          id: 'activity-3',
          teamId: selectedTeam.id,
          activityType: 'governance_violation',
          actorId: 'agent-3',
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
          details: {
            description: 'Minor governance violation detected: Unauthorized advice given',
            metadata: { violationType: 'unauthorized_advice', severity: 'low' }
          },
          severity: 'warning'
        }
      ];
      setTeamActivities(mockActivities);
    }
  }, [selectedTeam]);

  const renderTeamOverview = () => {
    if (!selectedTeam) return null;

    const activeMembers = selectedTeam.members.filter(m => m.status === 'active');
    const teamTrustScore = TeamMetricsCalculator.calculateTeamTrustScore(selectedTeam.members);
    const collaborationEfficiency = TeamMetricsCalculator.calculateCollaborationEfficiency(selectedTeam);
    const governanceCompliance = TeamMetricsCalculator.calculateGovernanceCompliance(selectedTeam);

    return (
      <div className="space-y-6">
        {/* Team Header */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{selectedTeam.name}</h2>
              <p className="text-gray-600 mt-1">{selectedTeam.description}</p>
              <div className="flex items-center space-x-4 mt-3">
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                  selectedTeam.status === 'active' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {selectedTeam.status}
                </span>
                <span className="text-sm text-gray-500">
                  Created {new Date(selectedTeam.createdAt).toLocaleDateString()}
                </span>
                <span className="text-sm text-gray-500 capitalize">
                  {selectedTeam.teamType} Team
                </span>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <button className="px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                Edit Team
              </button>
              <button className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors">
                Add Member
              </button>
            </div>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active Members</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {activeMembers.length}/{selectedTeam.maxMembers}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Team Trust Score</p>
                <p className={`text-2xl font-semibold ${
                  teamTrustScore >= 90 ? 'text-green-600' :
                  teamTrustScore >= 75 ? 'text-yellow-600' : 'text-red-600'
                }`}>
                  {teamTrustScore}%
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Collaboration</p>
                <p className="text-2xl font-semibold text-purple-600">{collaborationEfficiency}%</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Governance</p>
                <p className="text-2xl font-semibold text-indigo-600">{governanceCompliance}%</p>
              </div>
            </div>
          </div>
        </div>

        {/* Team Roles Overview */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Team Roles</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {selectedTeam.roles.map(role => {
              const assignedMembers = selectedTeam.members.filter(m => m.roleId === role.id);
              return (
                <div key={role.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-gray-900">{role.name}</h4>
                    <span className="text-sm text-gray-500">
                      {assignedMembers.length} assigned
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">{role.description}</p>
                  
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-500">Trust Requirement:</span>
                      <span className="font-medium">{role.trustRequirement}%</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-500">Governance Level:</span>
                      <span className="font-medium capitalize">{role.governanceLevel}</span>
                    </div>
                  </div>

                  {assignedMembers.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <div className="space-y-1">
                        {assignedMembers.slice(0, 2).map(member => {
                          const agent = availableAgents.find(a => a.id === member.agentId);
                          return (
                            <div key={member.agentId} className="text-xs text-gray-600">
                              {agent?.name || 'Unknown Agent'}
                            </div>
                          );
                        })}
                        {assignedMembers.length > 2 && (
                          <div className="text-xs text-gray-500">
                            +{assignedMembers.length - 2} more
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
          <div className="space-y-3">
            {teamActivities.slice(0, 5).map(activity => (
              <div key={activity.id} className="flex items-start space-x-3">
                <div className={`flex-shrink-0 w-2 h-2 rounded-full mt-2 ${
                  activity.severity === 'error' ? 'bg-red-400' :
                  activity.severity === 'warning' ? 'bg-yellow-400' : 'bg-blue-400'
                }`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900">{activity.details.description}</p>
                  <p className="text-xs text-gray-500">
                    {new Date(activity.timestamp).toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
          
          {teamActivities.length > 5 && (
            <button className="mt-4 text-sm text-blue-600 hover:text-blue-700">
              View all activity
            </button>
          )}
        </div>
      </div>
    );
  };

  const renderTeamMembers = () => {
    if (!selectedTeam) return null;

    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Team Members</h3>
            <button className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors">
              Invite Member
            </button>
          </div>

          <div className="space-y-4">
            {selectedTeam.members.map(member => {
              const agent = availableAgents.find(a => a.id === member.agentId);
              const role = selectedTeam.roles.find(r => r.id === member.roleId);
              
              return (
                <div key={member.agentId} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg flex items-center justify-center">
                        <span className="text-white font-semibold text-lg">
                          {agent?.name?.charAt(0) || 'A'}
                        </span>
                      </div>
                      
                      <div>
                        <h4 className="font-medium text-gray-900">{agent?.name || 'Unknown Agent'}</h4>
                        <p className="text-sm text-gray-600">{role?.name || 'No Role'}</p>
                        <div className="flex items-center space-x-4 mt-1">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            member.status === 'active' 
                              ? 'bg-green-100 text-green-800'
                              : member.status === 'inactive'
                              ? 'bg-gray-100 text-gray-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {member.status}
                          </span>
                          <span className="text-xs text-gray-500">
                            Joined {new Date(member.joinedAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-sm font-medium text-gray-900">
                        Trust Score: {member.performanceMetrics.averageTrustScore}%
                      </div>
                      <div className="text-xs text-gray-500">
                        {member.performanceMetrics.totalInteractions} interactions
                      </div>
                      <div className="text-xs text-gray-500">
                        {member.performanceMetrics.violationCount} violations
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="text-xs text-gray-500">
                        Last active: {new Date(member.performanceMetrics.lastActivity).toLocaleDateString()}
                      </div>
                      {member.specializations && member.specializations.length > 0 && (
                        <div className="flex items-center space-x-1">
                          {member.specializations.map(spec => (
                            <span key={spec} className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
                              {spec}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center space-x-2">
                      <button className="text-sm text-blue-600 hover:text-blue-700">
                        Edit Role
                      </button>
                      <button className="text-sm text-red-600 hover:text-red-700">
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {selectedTeam.members.length === 0 && (
            <div className="text-center py-12">
              <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No team members yet</h3>
              <p className="text-gray-600 mb-4">Start building your team by inviting agents to join.</p>
              <button className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors">
                Invite First Member
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderTeamAnalytics = () => {
    if (!selectedTeam) return null;

    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Team Analytics</h3>
          
          {/* Placeholder for analytics charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="border border-gray-200 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-4">Trust Score Trends</h4>
              <div className="h-48 bg-gray-50 rounded flex items-center justify-center">
                <span className="text-gray-500">Trust score chart placeholder</span>
              </div>
            </div>
            
            <div className="border border-gray-200 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-4">Collaboration Efficiency</h4>
              <div className="h-48 bg-gray-50 rounded flex items-center justify-center">
                <span className="text-gray-500">Efficiency chart placeholder</span>
              </div>
            </div>
            
            <div className="border border-gray-200 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-4">Violation Breakdown</h4>
              <div className="h-48 bg-gray-50 rounded flex items-center justify-center">
                <span className="text-gray-500">Violations chart placeholder</span>
              </div>
            </div>
            
            <div className="border border-gray-200 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-4">Workflow Performance</h4>
              <div className="h-48 bg-gray-50 rounded flex items-center justify-center">
                <span className="text-gray-500">Workflow chart placeholder</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderTeamActivity = () => {
    if (!selectedTeam) return null;

    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Team Activity Log</h3>
          
          <div className="space-y-4">
            {teamActivities.map(activity => (
              <div key={activity.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <div className={`flex-shrink-0 w-3 h-3 rounded-full mt-1 ${
                    activity.severity === 'error' ? 'bg-red-400' :
                    activity.severity === 'warning' ? 'bg-yellow-400' : 'bg-blue-400'
                  }`} />
                  
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-gray-900 capitalize">
                        {activity.activityType.replace('_', ' ')}
                      </h4>
                      <span className="text-sm text-gray-500">
                        {new Date(activity.timestamp).toLocaleString()}
                      </span>
                    </div>
                    
                    <p className="text-sm text-gray-600 mt-1">
                      {activity.details.description}
                    </p>
                    
                    {activity.details.metadata && (
                      <div className="mt-2 text-xs text-gray-500">
                        <pre className="bg-gray-50 p-2 rounded">
                          {JSON.stringify(activity.details.metadata, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  if (showCreateWizard) {
    return (
      <TeamConfigurationWizard
        availableAgents={availableAgents}
        onTeamCreated={(team) => {
          onTeamCreate(team);
          setShowCreateWizard(false);
          setSelectedTeam(team);
        }}
        onCancel={() => setShowCreateWizard(false)}
      />
    );
  }

  return (
    <div className="flex h-full">
      {/* Teams Sidebar */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Agent Teams</h2>
            <button
              onClick={() => setShowCreateWizard(true)}
              className="px-3 py-1 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
            >
              Create Team
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {teams.length === 0 ? (
            <div className="text-center py-12">
              <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <h3 className="text-sm font-medium text-gray-900 mb-2">No teams yet</h3>
              <p className="text-xs text-gray-600 mb-4">Create your first agent team to get started.</p>
              <button
                onClick={() => setShowCreateWizard(true)}
                className="px-3 py-1 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
              >
                Create Team
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {teams.map(team => (
                <div
                  key={team.id}
                  onClick={() => setSelectedTeam(team)}
                  className={`p-3 rounded-lg cursor-pointer transition-colors ${
                    selectedTeam?.id === team.id
                      ? 'bg-blue-50 border border-blue-200'
                      : 'hover:bg-gray-50 border border-transparent'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium text-gray-900">{team.name}</h3>
                    <span className={`w-2 h-2 rounded-full ${
                      team.status === 'active' ? 'bg-green-400' : 'bg-gray-400'
                    }`} />
                  </div>
                  <p className="text-sm text-gray-600 mt-1 line-clamp-2">{team.description}</p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-gray-500 capitalize">{team.teamType}</span>
                    <span className="text-xs text-gray-500">
                      {team.members.length}/{team.maxMembers} members
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {selectedTeam ? (
          <>
            {/* Tab Navigation */}
            <div className="bg-white border-b border-gray-200 px-6 py-4">
              <nav className="flex space-x-8">
                {[
                  { id: 'overview', label: 'Overview', icon: '📊' },
                  { id: 'members', label: 'Members', icon: '👥' },
                  { id: 'analytics', label: 'Analytics', icon: '📈' },
                  { id: 'activity', label: 'Activity', icon: '📋' }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <span>{tab.icon}</span>
                    <span>{tab.label}</span>
                  </button>
                ))}
              </nav>
            </div>

            {/* Tab Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {activeTab === 'overview' && renderTeamOverview()}
              {activeTab === 'members' && renderTeamMembers()}
              {activeTab === 'analytics' && renderTeamAnalytics()}
              {activeTab === 'activity' && renderTeamActivity()}
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Select a team</h3>
              <p className="text-gray-600">Choose a team from the sidebar to view details and manage members.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TeamManagementInterface;

