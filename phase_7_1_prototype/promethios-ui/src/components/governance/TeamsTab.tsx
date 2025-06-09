import React, { useState, useEffect } from 'react';
import { AgentConfiguration } from '../../firebase/agentService';
import SimpleAgentService, { TeamSummary } from '../../services/simpleAgentService';
import TeamManagementInterface from '../teams/TeamManagementInterface';
import TeamConfigurationWizard from '../teams/TeamConfigurationWizard';

interface TeamsTabProps {
  agents: AgentConfiguration[];
}

/**
 * Teams Tab Component for Governance Page
 * 
 * This component provides team management functionality within the governance context.
 * Features include:
 * - Team-level Observer integration
 * - Governance health monitoring
 * - Team scorecard export
 * - Activity feed integration
 */
const TeamsTab: React.FC<TeamsTabProps> = ({ agents }) => {
  const [teams, setTeams] = useState<TeamSummary[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);
  const [showTeamWizard, setShowTeamWizard] = useState(false);
  const [teamObserverInsights, setTeamObserverInsights] = useState<Record<string, any>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadTeams();
  }, []);

  const loadTeams = async () => {
    try {
      setIsLoading(true);
      const userTeams = await SimpleAgentService.getUserTeams('demo-user');
      setTeams(userTeams);
      
      // Load team-level Observer insights for each team
      for (const team of userTeams) {
        await loadTeamObserverInsights(team.id);
      }
    } catch (error) {
      console.error('Error loading teams:', error);
      setError('Failed to load teams');
    } finally {
      setIsLoading(false);
    }
  };

  const loadTeamObserverInsights = async (teamId: string) => {
    try {
      // Simulate team-level Observer insights
      const insights = {
        trustDelta: Math.floor(Math.random() * 20) - 10, // -10 to +10
        reflectionRate: Math.floor(Math.random() * 30) + 70, // 70-100%
        governanceIncidents: {
          flagged: Math.floor(Math.random() * 5),
          resolved: Math.floor(Math.random() * 3)
        },
        recentObservation: generateTeamObservation(teamId),
        healthSummary: generateHealthSummary()
      };
      
      setTeamObserverInsights(prev => ({
        ...prev,
        [teamId]: insights
      }));
    } catch (error) {
      console.error('Error loading team Observer insights:', error);
    }
  };

  const generateTeamObservation = (teamId: string) => {
    const observations = [
      "Trust dropped 8 points due to repeated Article 3.1 violations by QA agent.",
      "Team collaboration efficiency improved 15% after governance tuning.",
      "Research agent showing consistent high trust scores (95%+) over 48 hours.",
      "Content creator agent requires governance adjustment - 3 hallucination violations detected.",
      "Team consensus mechanism working well - 0 escalation events in 24 hours.",
      "Quality reviewer agent preventing 89% of potential violations through pre-review."
    ];
    return observations[Math.floor(Math.random() * observations.length)];
  };

  const generateHealthSummary = () => {
    return {
      overallHealth: Math.floor(Math.random() * 30) + 70, // 70-100%
      riskLevel: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)],
      recommendations: [
        "Consider increasing governance level for content creation role",
        "Team trust scores trending positive - maintain current settings",
        "QA agent may need additional constitutional guidance"
      ]
    };
  };

  const handleCreateTeam = async (teamData: any) => {
    try {
      const result = await SimpleAgentService.createTeam(teamData);
      
      if (result.success) {
        setShowTeamWizard(false);
        await loadTeams();
        
        // Log team creation in Observer
        console.log('🔍 Observer: New team created with governance identity assigned');
        
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

  const handleExportTeamScorecard = async (teamId: string) => {
    try {
      // Generate team scorecard for governance audits
      const team = teams.find(t => t.id === teamId);
      const insights = teamObserverInsights[teamId];
      
      if (!team || !insights) return;

      const scorecard = {
        teamName: team.name,
        generatedAt: new Date().toISOString(),
        governanceMetrics: {
          averageTrustScore: team.averageTrustScore,
          trustDelta24h: insights.trustDelta,
          reflectionRate: insights.reflectionRate,
          governanceIncidents: insights.governanceIncidents,
          healthScore: insights.healthSummary.overallHealth
        },
        observerInsights: {
          recentObservation: insights.recentObservation,
          riskLevel: insights.healthSummary.riskLevel,
          recommendations: insights.healthSummary.recommendations
        },
        auditTrail: {
          constitutionalFramework: "Promethios v2.0",
          governanceLevel: "Team-Optimized",
          complianceStandard: "Enterprise Grade"
        }
      };

      // Create downloadable JSON file
      const blob = new Blob([JSON.stringify(scorecard, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${team.name.replace(/\s+/g, '_')}_Governance_Scorecard_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      console.log('📊 Team scorecard exported for governance audit');
    } catch (error) {
      console.error('Error exporting team scorecard:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400"></div>
      </div>
    );
  }

  if (selectedTeam) {
    return (
      <div className="space-y-6">
        {/* Team Observer Header */}
        <div className="bg-gradient-to-r from-blue-900 to-purple-900 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-semibold text-white mb-2">Team-Level Observer</h3>
              <p className="text-blue-200">
                {teamObserverInsights[selectedTeam]?.recentObservation || 'Monitoring team governance...'}
              </p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => handleExportTeamScorecard(selectedTeam)}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                📊 Export Scorecard
              </button>
              <button
                onClick={() => setSelectedTeam(null)}
                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                ← Back to Teams
              </button>
            </div>
          </div>
        </div>

        {/* Governance Health Summary */}
        {teamObserverInsights[selectedTeam] && (
          <div className="bg-gray-800 rounded-lg p-6">
            <h4 className="text-lg font-semibold text-white mb-4">Governance Health Summary</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gray-700 rounded-lg p-4">
                <div className="text-sm text-gray-400">Trust Delta (24h)</div>
                <div className={`text-2xl font-bold ${
                  teamObserverInsights[selectedTeam].trustDelta >= 0 ? 'text-green-400' : 'text-red-400'
                }`}>
                  {teamObserverInsights[selectedTeam].trustDelta >= 0 ? '+' : ''}{teamObserverInsights[selectedTeam].trustDelta}
                </div>
              </div>
              <div className="bg-gray-700 rounded-lg p-4">
                <div className="text-sm text-gray-400">Reflection Rate</div>
                <div className="text-2xl font-bold text-blue-400">
                  {teamObserverInsights[selectedTeam].reflectionRate}%
                </div>
              </div>
              <div className="bg-gray-700 rounded-lg p-4">
                <div className="text-sm text-gray-400">Governance Incidents</div>
                <div className="text-2xl font-bold text-yellow-400">
                  {teamObserverInsights[selectedTeam].governanceIncidents.flagged} flagged, {teamObserverInsights[selectedTeam].governanceIncidents.resolved} resolved
                </div>
              </div>
            </div>
          </div>
        )}

        <TeamManagementInterface
          teamId={selectedTeam}
          availableAgents={agents}
          onBack={() => setSelectedTeam(null)}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white">Team Governance</h2>
          <p className="text-gray-400 mt-1">
            Manage multi-agent teams with governance oversight and Observer monitoring
          </p>
        </div>
        <button
          onClick={() => setShowTeamWizard(true)}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
        >
          + Create Team
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-900 border border-red-700 rounded-lg p-4">
          <p className="text-red-200">{error}</p>
        </div>
      )}

      {/* Teams Grid */}
      {teams.length === 0 ? (
        <div className="text-center py-12">
          <div className="mx-auto h-12 w-12 text-gray-400 mb-4">
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-white mb-2">No teams yet</h3>
          <p className="text-gray-400 mb-6">
            Create your first multi-agent team to enable collaborative governance workflows.
          </p>
          <button
            onClick={() => setShowTeamWizard(true)}
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg transition-colors"
          >
            Create Your First Team
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {teams.map((team) => {
            const insights = teamObserverInsights[team.id];
            return (
              <div 
                key={team.id} 
                className="bg-gray-800 rounded-lg p-6 cursor-pointer hover:bg-gray-750 transition-colors border border-gray-700"
                onClick={() => setSelectedTeam(team.id)}
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-white">{team.name}</h3>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    team.status === 'active' 
                      ? 'bg-green-900 text-green-200'
                      : 'bg-gray-700 text-gray-300'
                  }`}>
                    {team.status}
                  </span>
                </div>
                
                <p className="text-sm text-gray-400 mb-4">{team.description}</p>
                
                {/* Team Metrics */}
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Type:</span>
                    <span className="text-white capitalize">{team.teamType}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Members:</span>
                    <span className="text-white">{team.memberCount}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Avg Trust:</span>
                    <span className={`font-medium ${
                      team.averageTrustScore >= 90 ? 'text-green-400' :
                      team.averageTrustScore >= 75 ? 'text-yellow-400' : 'text-red-400'
                    }`}>
                      {team.averageTrustScore}%
                    </span>
                  </div>
                  
                  {/* Observer Insights Preview */}
                  {insights && (
                    <>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Trust Δ (24h):</span>
                        <span className={`font-medium ${
                          insights.trustDelta >= 0 ? 'text-green-400' : 'text-red-400'
                        }`}>
                          {insights.trustDelta >= 0 ? '+' : ''}{insights.trustDelta}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Health:</span>
                        <span className={`font-medium ${
                          insights.healthSummary.riskLevel === 'low' ? 'text-green-400' :
                          insights.healthSummary.riskLevel === 'medium' ? 'text-yellow-400' : 'text-red-400'
                        }`}>
                          {insights.healthSummary.overallHealth}%
                        </span>
                      </div>
                    </>
                  )}
                </div>
                
                {/* Observer Insight Preview */}
                {insights?.recentObservation && (
                  <div className="bg-blue-900 bg-opacity-50 rounded p-3 mb-4">
                    <div className="text-xs text-blue-300 mb-1">🔍 Observer</div>
                    <div className="text-sm text-blue-100 line-clamp-2">
                      {insights.recentObservation}
                    </div>
                  </div>
                )}
                
                <div className="flex space-x-2">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedTeam(team.id);
                    }}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded text-sm font-medium transition-colors"
                  >
                    Manage
                  </button>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleExportTeamScorecard(team.id);
                    }}
                    className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded text-sm font-medium transition-colors"
                  >
                    📊
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Team Creation Wizard Modal */}
      {showTeamWizard && (
        <div className="fixed inset-0 bg-black bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-gray-800">
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

export default TeamsTab;

