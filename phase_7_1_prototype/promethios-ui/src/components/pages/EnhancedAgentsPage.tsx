import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { AgentFirebaseService, AgentConfiguration } from '../../firebase/agentService';
import SimpleAgentService, { SimpleAgentConfig, TeamSummary } from '../../services/simpleAgentService';
import { TeamConfigurationWizard } from '../teams/TeamConfigurationWizard';
import { TeamManagementInterface } from '../teams/TeamManagementInterface';

/**
 * Enhanced Agents Page Component
 * 
 * This component provides a comprehensive interface for managing both individual agents
 * and multi-agent teams. It maintains backward compatibility with the existing agent
 * wizard while adding team management capabilities.
 * 
 * Features:
 * - Individual agent management (existing functionality)
 * - Multi-agent team creation and management (new)
 * - Seamless integration between individual and team workflows
 * - Real-time metrics and performance tracking
 */
const EnhancedAgentsPage: React.FC = () => {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState<'agents' | 'teams'>('agents');
  const [agents, setAgents] = useState<SimpleAgentConfig[]>([]);
  const [teams, setTeams] = useState<TeamSummary[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);
  const [showTeamWizard, setShowTeamWizard] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load agents and teams on component mount
  useEffect(() => {
    loadData();
  }, [currentUser]);

  const loadData = async () => {
    if (!currentUser) return;

    setIsLoading(true);
    setError(null);

    try {
      // Load individual agents
      const userAgents = await SimpleAgentService.getUserAgents(currentUser.uid);
      setAgents(userAgents);

      // Load teams
      const userTeams = await SimpleAgentService.getUserTeams(currentUser.uid);
      setTeams(userTeams);

    } catch (error) {
      console.error('Error loading data:', error);
      setError('Failed to load agents and teams');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateTeam = async (teamData: any) => {
    try {
      const result = await SimpleAgentService.createTeam(teamData);
      
      if (result.success) {
        setShowTeamWizard(false);
        await loadData(); // Refresh data
        
        // Switch to teams tab and select the new team
        setActiveTab('teams');
        if (result.teamId) {
          setSelectedTeam(result.teamId);
        }
      } else {
        setError(result.error || 'Failed to create team');
      }
    } catch (error) {
      console.error('Error creating team:', error);
      setError('Failed to create team');
    }
  };

  const handleTeamSelect = (teamId: string) => {
    setSelectedTeam(teamId);
  };

  const handleBackToTeamList = () => {
    setSelectedTeam(null);
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Authentication Required</h2>
          <p className="text-gray-600">Please sign in to manage your agents and teams.</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading agents and teams...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Agent Management</h1>
              <p className="mt-2 text-gray-600">
                Manage your individual agents and multi-agent teams
              </p>
            </div>
            
            {/* Action Buttons */}
            <div className="flex space-x-3">
              {activeTab === 'agents' && (
                <button
                  onClick={() => window.location.href = '/agent-wizard'}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Add New Agent
                </button>
              )}
              
              {activeTab === 'teams' && (
                <button
                  onClick={() => setShowTeamWizard(true)}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                >
                  Create Team
                </button>
              )}
            </div>
          </div>
          
          {/* Tab Navigation */}
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('agents')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
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
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-800">{error}</p>
              </div>
              <div className="ml-auto pl-3">
                <button
                  onClick={() => setError(null)}
                  className="text-red-400 hover:text-red-600"
                >
                  <span className="sr-only">Dismiss</span>
                  <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'agents' && (
          <div>
            {/* Individual Agents Tab */}
            {agents.length === 0 ? (
              <div className="text-center py-12">
                <div className="mx-auto h-12 w-12 text-gray-400">
                  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No agents yet</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Get started by adding your first agent with governance.
                </p>
                <div className="mt-6">
                  <button
                    onClick={() => window.location.href = '/agent-wizard'}
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                  >
                    Add Your First Agent
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {agents.map((agent) => (
                  <div key={agent.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-medium text-gray-900">{agent.name}</h3>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        agent.status === 'active' 
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {agent.status}
                      </span>
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-4">{agent.description}</p>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Type:</span>
                        <span className="font-medium">{agent.agentType.toUpperCase()}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Governance:</span>
                        <span className="font-medium capitalize">{agent.governanceLevel}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Trust Score:</span>
                        <span className={`font-medium ${
                          agent.trustScore >= 90 ? 'text-green-600' :
                          agent.trustScore >= 75 ? 'text-yellow-600' : 'text-red-600'
                        }`}>
                          {agent.trustScore}%
                        </span>
                      </div>
                      {agent.lastActivity && (
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">Last Active:</span>
                          <span className="text-gray-700">
                            {new Date(agent.lastActivity).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                    </div>
                    
                    <div className="mt-4 flex space-x-2">
                      <button className="flex-1 bg-blue-50 text-blue-700 px-3 py-2 rounded text-sm font-medium hover:bg-blue-100">
                        Configure
                      </button>
                      <button className="flex-1 bg-gray-50 text-gray-700 px-3 py-2 rounded text-sm font-medium hover:bg-gray-100">
                        Test
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'teams' && (
          <div>
            {/* Teams Tab */}
            {selectedTeam ? (
              <TeamManagementInterface
                teamId={selectedTeam}
                availableAgents={agents}
                onBack={handleBackToTeamList}
              />
            ) : (
              <div>
                {teams.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="mx-auto h-12 w-12 text-gray-400">
                      <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </div>
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No teams yet</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Create your first multi-agent team to enable collaborative workflows.
                    </p>
                    <div className="mt-6">
                      <button
                        onClick={() => setShowTeamWizard(true)}
                        className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
                      >
                        Create Your First Team
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {teams.map((team) => (
                      <div 
                        key={team.id} 
                        className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 cursor-pointer hover:shadow-md transition-shadow"
                        onClick={() => handleTeamSelect(team.id)}
                      >
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-lg font-medium text-gray-900">{team.name}</h3>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            team.status === 'active' 
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {team.status}
                          </span>
                        </div>
                        
                        <p className="text-sm text-gray-600 mb-4">{team.description}</p>
                        
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-500">Type:</span>
                            <span className="font-medium capitalize">{team.teamType}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-500">Members:</span>
                            <span className="font-medium">{team.memberCount}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-500">Avg Trust:</span>
                            <span className={`font-medium ${
                              team.averageTrustScore >= 90 ? 'text-green-600' :
                              team.averageTrustScore >= 75 ? 'text-yellow-600' : 'text-red-600'
                            }`}>
                              {team.averageTrustScore}%
                            </span>
                          </div>
                        </div>
                        
                        <div className="mt-4">
                          <button className="w-full bg-blue-50 text-blue-700 px-3 py-2 rounded text-sm font-medium hover:bg-blue-100">
                            Manage Team
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Team Creation Wizard Modal */}
      {showTeamWizard && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
            <TeamConfigurationWizard
              availableAgents={agents}
              onTeamCreated={handleCreateTeam}
              onCancel={() => setShowTeamWizard(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default EnhancedAgentsPage;

