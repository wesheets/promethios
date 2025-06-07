/**
 * Simplified ProfileSelector component for testing
 * 
 * A simplified version of the ProfileSelector component that focuses on core functionality
 * and makes testing easier by reducing dependencies and complexity.
 * 
 * Contract Version: v2025.05.18
 * Phase ID: 12.20
 */
import React from 'react';
import { GovernanceDomain } from '../governance/types';

interface SimplifiedProfileProps {
  domain: GovernanceDomain;
  displayName: string;
  isActive?: boolean;
  onSelect?: (domain: GovernanceDomain) => void;
}

// A simplified profile item component
const ProfileItem: React.FC<SimplifiedProfileProps> = ({ 
  domain, 
  displayName, 
  isActive = false, 
  onSelect 
}) => {
  return (
    <button
      className={`profile-option ${isActive ? 'active' : ''}`}
      onClick={() => onSelect && onSelect(domain)}
      data-testid={`profile-option-${domain}`}
    >
      {displayName}
    </button>
  );
};

interface TestProfileSelectorProps {
  profiles: Array<{
    domain: GovernanceDomain;
    displayName: string;
  }>;
  currentDomain?: GovernanceDomain | null;
  onSelect?: (domain: GovernanceDomain) => void;
  showVersions?: boolean;
  className?: string;
  'data-testid'?: string;
}

/**
 * Simplified ProfileSelector for testing
 * This component doesn't use hooks or context, making it easier to test
 */
export const TestProfileSelector: React.FC<TestProfileSelectorProps> = ({
  profiles,
  currentDomain = null,
  onSelect = () => {},
  showVersions = true,
  className = '',
  'data-testid': dataTestId = 'profile-selector',
}) => {
  // Create a unique ID for the version label
  const versionLabelId = "version-selector-label";
  
  return (
    <div className={`profile-selector ${className}`} data-testid={dataTestId}>
      <div className="profile-options" data-testid={`${dataTestId}-options`}>
        {profiles.map(profile => (
          <ProfileItem
            key={profile.domain}
            domain={profile.domain}
            displayName={profile.displayName}
            isActive={currentDomain === profile.domain}
            onSelect={onSelect}
          />
        ))}
      </div>
      
      {showVersions && currentDomain && (
        <div className="version-selector" data-testid={`${dataTestId}-version`}>
          <label id={versionLabelId} htmlFor="version-select">Version</label>
          <div 
            className="version-display" 
            aria-labelledby={versionLabelId}
            role="combobox"
            id="version-select"
          >
            Version: 2.0
          </div>
        </div>
      )}
    </div>
  );
};
