import React from 'react';
import AgentWizardPage from '../../../ui/pages/AgentWizardPage';

/**
 * AgentWizardProxy Component
 * 
 * This proxy component serves as a bridge to the AgentWizardPage component in the /ui/ directory.
 * It provides the agent wrapping wizard functionality after onboarding.
 */
const AgentWizardProxy: React.FC = () => {
  return <AgentWizardPage />;
};

export default AgentWizardProxy;
