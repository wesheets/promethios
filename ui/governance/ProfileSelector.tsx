/**
 * Governance Profile Selector Component
 * 
 * This component allows users to select and configure domain-specific
 * governance profiles.
 */

import React, { useState } from 'react';
import { GovernanceDomain } from './types';
import { useGovernanceProfile } from './context';

interface ProfileSelectorProps {
  showVersionSelector?: boolean;
}

/**
 * Component for selecting governance profiles by domain
 */
export const ProfileSelector: React.FC<ProfileSelectorProps> = ({ 
  showVersionSelector = true 
}) => {
  const { 
    currentProfile, 
    availableProfiles, 
    selectProfile, 
    currentDomain 
  } = useGovernanceProfile();
  
  const [selectedVersion, setSelectedVersion] = useState<string>(
    currentProfile?.version || 'latest'
  );

  // Get unique domains from available profiles, ensuring availableProfiles is defined
  const domains = availableProfiles 
    ? [...new Set(availableProfiles.map(profile => profile.domain))]
    : [];
  
  // Get versions available for the current domain
  const versionsForDomain = (currentDomain && availableProfiles)
    ? availableProfiles
        .filter(profile => profile.domain === currentDomain)
        .map(profile => profile.version)
    : [];

  const handleDomainChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const domain = event.target.value as GovernanceDomain;
    
    // Find default version for this domain
    const defaultProfile = availableProfiles.find(
      profile => profile.domain === domain && profile.isDefault
    );
    
    if (defaultProfile) {
      setSelectedVersion(defaultProfile.version);
      selectProfile(domain, defaultProfile.version);
    } else {
      selectProfile(domain);
    }
  };

  const handleVersionChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const version = event.target.value;
    setSelectedVersion(version);
    
    if (currentDomain) {
      selectProfile(currentDomain, version);
    }
  };

  return (
    <div className="governance-profile-selector">
      <div className="selector-group">
        <label htmlFor="domain-select">Governance Domain:</label>
        <select
          id="domain-select"
          value={currentDomain || ''}
          onChange={handleDomainChange}
        >
          {domains.map(domain => (
            <option key={domain} value={domain}>
              {domain.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </option>
          ))}
        </select>
      </div>

      {showVersionSelector && versionsForDomain.length > 1 && (
        <div className="selector-group">
          <label htmlFor="version-select">Profile Version:</label>
          <select
            id="version-select"
            value={selectedVersion}
            onChange={handleVersionChange}
          >
            {versionsForDomain.map(version => (
              <option key={version} value={version}>
                {version}
              </option>
            ))}
          </select>
        </div>
      )}

      {currentProfile && (
        <div className="profile-info" data-testid="profile-info">
          <h3>{currentProfile.displayName}</h3>
          <p>{currentProfile.description}</p>
        </div>
      )}
    </div>
  );
};
