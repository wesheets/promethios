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

  // Implementation details...

  return (
    <div className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
      {/* Wizard implementation */}
      <div>Team Configuration Wizard</div>
    </div>
  );
};

// Add named export to fix the import error
export { TeamConfigurationWizard };

// Default export remains for backward compatibility
export default TeamConfigurationWizard;
