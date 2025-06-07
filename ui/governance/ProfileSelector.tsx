/**
 * Enhanced ProfileSelector component with search, filtering, accessibility, and responsive design
 * 
 * Allows users to select governance profiles with improved UX and features.
 * 
 * Contract Version: v2025.05.18
 * Phase ID: 12.20
 */
import React, { useState, useEffect, useRef } from 'react';
import { GovernanceDomain } from './types';
import { useGovernance } from './context';
import { useGovernanceProfile } from './hooks';
import { ErrorHandler, useErrorHandler } from '../components/error-handling';
import { LoadingSpinner } from '../components/loading-state';

interface ProfileSelectorProps {
  showVersions?: boolean;
  className?: string;
  'data-testid'?: string;
}

export const ProfileSelector: React.FC<ProfileSelectorProps> = ({
  showVersions = true,
  className = '',
  'data-testid': dataTestId = 'profile-selector',
}) => {
  const { currentProfile, availableProfiles, selectProfile, currentDomain } = useGovernanceProfile();
  const [isLoading, setIsLoading] = useState(false);
  const { error, handleError, resetError } = useErrorHandler();
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredProfiles, setFilteredProfiles] = useState(availableProfiles);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [recentlyUsed, setRecentlyUsed] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'all' | 'favorites' | 'recent'>('all');
  const [isCompact, setIsCompact] = useState(window.innerWidth < 768);
  const searchInputRef = useRef<HTMLInputElement>(null);
  
  // Create unique IDs for accessibility
  const searchLabelId = "profile-search-label";
  const versionLabelId = "version-selector-label";
  const viewModeLabelId = "view-mode-selector-label";
  
  // Handle window resize for responsive design
  useEffect(() => {
    const handleResize = () => {
      setIsCompact(window.innerWidth < 768);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  // Filter profiles based on search term and view mode
  useEffect(() => {
    let filtered = availableProfiles;
    
    // Apply search filter if search term exists
    if (searchTerm) {
      filtered = filtered.filter(profile => 
        profile.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        profile.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Apply view mode filter
    if (viewMode === 'favorites') {
      filtered = filtered.filter(profile => favorites.includes(profile.id));
    } else if (viewMode === 'recent') {
      filtered = filtered.filter(profile => recentlyUsed.includes(profile.id));
    }
    
    setFilteredProfiles(filtered);
  }, [searchTerm, availableProfiles, viewMode, favorites, recentlyUsed]);
  
  // Handle profile selection
  const handleProfileSelect = async (domain: GovernanceDomain) => {
    try {
      setIsLoading(true);
      resetError();
      selectProfile(domain);
      
      // Update recently used profiles
      setRecentlyUsed(prev => {
        const newRecent = prev.filter(id => id !== domain);
        return [domain, ...newRecent].slice(0, 5); // Keep only 5 most recent
      });
    } catch (err: any) {
      handleError(err);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Toggle favorite status
  const toggleFavorite = (domain: string) => {
    setFavorites(prev => {
      if (prev.includes(domain)) {
        return prev.filter(id => id !== domain);
      } else {
        return [...prev, domain];
      }
    });
  };
  
  // Focus search input when pressing / key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '/' && document.activeElement !== searchInputRef.current) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);
  
  if (error) {
    return (
      <div 
        className={`profile-selector error ${className}`} 
        data-testid={dataTestId}
        role="alert"
      >
        <div className="error-message">
          <h3>Error loading profiles</h3>
          <p>{error.toString()}</p>
        </div>
        <button 
          onClick={resetError}
          className="retry-button"
          aria-label="Retry loading profiles"
        >
          Retry
        </button>
      </div>
    );
  }
  
  if (isLoading) {
    return (
      <div 
        className={`profile-selector loading ${className}`} 
        data-testid={dataTestId}
        aria-busy="true"
        aria-live="polite"
      >
        <LoadingSpinner />
        <div className="loading-text">Loading profiles...</div>
      </div>
    );
  }
  
  return (
    <div 
      className={`profile-selector ${className} ${isCompact ? 'compact' : ''}`} 
      data-testid={dataTestId}
      role="region"
      aria-label="Governance Profile Selector"
    >
      <div className="profile-selector-header">
        <h2>Governance Profiles</h2>
        <div className="profile-selector-controls">
          <div className="search-container">
            <label id={searchLabelId} htmlFor="profile-search">Search profiles</label>
            <div className="search-input-wrapper">
              <input
                id="profile-search"
                ref={searchInputRef}
                type="text"
                placeholder="Search profiles... (Press / to focus)"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                aria-labelledby={searchLabelId}
                className="search-input"
              />
              {searchTerm && (
                <button 
                  className="clear-search" 
                  onClick={() => setSearchTerm('')}
                  aria-label="Clear search"
                >
                  ×
                </button>
              )}
            </div>
          </div>
          
          <div className="view-mode-selector">
            <label id={viewModeLabelId} htmlFor="view-mode-select">View</label>
            <select
              id="view-mode-select"
              value={viewMode}
              onChange={(e) => setViewMode(e.target.value as 'all' | 'favorites' | 'recent')}
              aria-labelledby={viewModeLabelId}
              className="view-mode-select"
            >
              <option value="all">All Profiles</option>
              <option value="favorites">Favorites</option>
              <option value="recent">Recently Used</option>
            </select>
          </div>
        </div>
      </div>
      
      <div 
        className="profile-options"
        role="listbox"
        aria-label="Available governance profiles"
      >
        {filteredProfiles.length > 0 ? (
          filteredProfiles.map(profile => {
            // Create unique ID for favorite button
            const favoriteButtonId = `favorite-button-${profile.id}`;
            const isFavorite = favorites.includes(profile.id);
            
            return (
              <div
                key={profile.id}
                className={`profile-option ${currentDomain === profile.id ? 'active' : ''}`}
                onClick={() => handleProfileSelect(profile.id as GovernanceDomain)}
                role="option"
                aria-selected={currentDomain === profile.id}
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleProfileSelect(profile.id as GovernanceDomain);
                  }
                }}
              >
                <div className="profile-option-content">
                  <div className="profile-name">{profile.name}</div>
                  {profile.description && (
                    <div className="profile-description">{profile.description}</div>
                  )}
                  {showVersions && (
                    <div className="profile-version">v{profile.version || '2.0'}</div>
                  )}
                  {/* Move favorite button outside of interactive element to fix nested interactive issue */}
                </div>
                <div className="favorite-button-container">
                  <button 
                    id={favoriteButtonId}
                    className={`favorite-button ${isFavorite ? 'favorited' : ''}`}
                    onClick={(e) => {
                      e.stopPropagation(); // Prevent triggering profile selection
                      toggleFavorite(profile.id);
                    }}
                    aria-label={isFavorite ? `Remove ${profile.name} from favorites` : `Add ${profile.name} to favorites`}
                    aria-pressed={isFavorite}
                  >
                    {isFavorite ? '★' : '☆'}
                  </button>
                </div>
              </div>
            );
          })
        ) : (
          <div className="no-results">
            <p>No profiles match your search criteria</p>
            {searchTerm && (
              <button 
                className="clear-filters-button"
                onClick={() => setSearchTerm('')}
              >
                Clear search
              </button>
            )}
            {viewMode !== 'all' && (
              <button 
                className="clear-filters-button"
                onClick={() => setViewMode('all')}
              >
                Show all profiles
              </button>
            )}
          </div>
        )}
      </div>
      
      {currentProfile && (
        <div className="selected-profile-details">
          <h3>Selected Profile</h3>
          <div className="profile-detail-item">
            <span className="detail-label">Name:</span>
            <span className="detail-value">{currentProfile.name}</span>
          </div>
          {currentProfile.description && (
            <div className="profile-detail-item">
              <span className="detail-label">Description:</span>
              <span className="detail-value">{currentProfile.description}</span>
            </div>
          )}
          {showVersions && (
            <div className="version-selector">
              <label id={versionLabelId} htmlFor="version-select">Version</label>
              <div 
                className="version-display" 
                aria-labelledby={versionLabelId}
                role="combobox"
                id="version-select"
              >
                Version: {currentProfile.version || '2.0'}
              </div>
            </div>
          )}
          
          <div className="profile-impact">
            <h4>Governance Impact</h4>
            <p>
              This profile determines how AI systems are governed and monitored.
              Strong governance settings help ensure responsible AI deployment.
            </p>
            <div className="impact-meter">
              <div className="impact-label">Protection Level</div>
              <div className="impact-bar-container">
                <div 
                  className="impact-bar" 
                  style={{width: `${currentProfile.trustMetrics?.minTrustThreshold ? currentProfile.trustMetrics.minTrustThreshold * 100 : 70}%`}}
                ></div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <div className="profile-selector-footer">
        <div className="keyboard-shortcuts">
          <span className="shortcut-item">
            <kbd>/</kbd> Search
          </span>
          <span className="shortcut-item">
            <kbd>↑</kbd><kbd>↓</kbd> Navigate
          </span>
          <span className="shortcut-item">
            <kbd>Enter</kbd> Select
          </span>
        </div>
      </div>
      
      <style jsx>{`
        .profile-selector {
          font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
          max-width: 1200px;
          margin: 0 auto;
          padding: 1.5rem;
          border-radius: 8px;
          background-color: #ffffff;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }
        
        .profile-selector-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px solid #e0e0e0;
          padding-bottom: 1rem;
        }
        
        .profile-selector-header h2 {
          margin: 0;
          color: #333;
          font-size: 1.5rem;
        }
        
        .profile-selector-controls {
          display: flex;
          gap: 1rem;
          align-items: center;
        }
        
        .search-container {
          position: relative;
        }
        
        .search-container label {
          position: absolute;
          width: 1px;
          height: 1px;
          padding: 0;
          margin: -1px;
          overflow: hidden;
          clip: rect(0, 0, 0, 0);
          white-space: nowrap;
          border-width: 0;
        }
        
        .search-input-wrapper {
          position: relative;
        }
        
        .search-input {
          padding: 0.5rem 2rem 0.5rem 0.75rem;
          border: 1px solid #e0e0e0;
          border-radius: 4px;
          font-size: 0.9rem;
          width: 200px;
          transition: all 0.2s ease;
        }
        
        .search-input:focus {
          outline: none;
          border-color: #3a86ff;
          box-shadow: 0 0 0 2px rgba(58, 134, 255, 0.2);
          width: 250px;
        }
        
        .clear-search {
          position: absolute;
          right: 0.5rem;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          font-size: 1.2rem;
          color: #666;
          cursor: pointer;
          padding: 0;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .view-mode-selector {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        
        .view-mode-selector label {
          font-size: 0.9rem;
          color: #666;
        }
        
        .view-mode-select {
          padding: 0.5rem;
          border: 1px solid #e0e0e0;
          border-radius: 4px;
          background-color: #fff;
          font-size: 0.9rem;
        }
        
        .profile-options {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 1rem;
          max-height: 400px;
          overflow-y: auto;
          padding: 0.5rem;
        }
        
        .profile-option {
          background-color: #f8f9fa;
          border: 1px solid #e0e0e0;
          border-radius: 6px;
          padding: 1rem;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
        }
        
        .profile-option:hover, .profile-option:focus {
          background-color: #f0f4ff;
          border-color: #3a86ff;
          transform: translateY(-2px);
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
        }
        
        .profile-option.active {
          background-color: #e6f0ff;
          border-color: #3a86ff;
          box-shadow: 0 0 0 2px rgba(58, 134, 255, 0.2);
        }
        
        .profile-option-content {
          flex: 1;
        }
        
        .profile-name {
          font-weight: 600;
          margin-bottom: 0.5rem;
          color: #333;
        }
        
        .profile-description {
          font-size: 0.9rem;
          color: #666;
          margin-bottom: 0.5rem;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        
        .profile-version {
          font-size: 0.8rem;
          color: #888;
          background-color: #f0f0f0;
          padding: 0.2rem 0.5rem;
          border-radius: 4px;
          display: inline-block;
        }
        
        .favorite-button-container {
          display: flex;
          align-items: center;
        }
        
        .favorite-button {
          background: none;
          border: none;
          font-size: 1.5rem;
          color: #ccc;
          cursor: pointer;
          padding: 0.25rem;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .favorite-button:hover {
          color: #ffbe0b;
          transform: scale(1.1);
        }
        
        .favorite-button.favorited {
          color: #ffbe0b;
        }
        
        .no-results {
          grid-column: 1 / -1;
          text-align: center;
          padding: 2rem;
          color: #666;
        }
        
        .clear-filters-button {
          background-color: #f0f0f0;
          border: none;
          padding: 0.5rem 1rem;
          border-radius: 4px;
          margin-top: 1rem;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .clear-filters-button:hover {
          background-color: #e0e0e0;
        }
        
        .selected-profile-details {
          background-color: #f8f9fa;
          border: 1px solid #e0e0e0;
          border-radius: 6px;
          padding: 1.5rem;
        }
        
        .selected-profile-details h3 {
          margin-top: 0;
          margin-bottom: 1rem;
          color: #333;
          border-bottom: 1px solid #e0e0e0;
          padding-bottom: 0.5rem;
        }
        
        .profile-detail-item {
          margin-bottom: 0.75rem;
        }
        
        .detail-label {
          font-weight: 600;
          color: #555;
          margin-right: 0.5rem;
        }
        
        .detail-value {
          color: #333;
        }
        
        .version-selector {
          margin-top: 1rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        
        .version-selector label {
          font-weight: 600;
          color: #555;
        }
        
        .version-display {
          background-color: #f0f0f0;
          padding: 0.5rem 1rem;
          border-radius: 4px;
          font-size: 0.9rem;
        }
        
        .profile-impact {
          margin-top: 1.5rem;
          padding-top: 1rem;
          border-top: 1px solid #e0e0e0;
        }
        
        .profile-impact h4 {
          margin-top: 0;
          color: #333;
        }
        
        .profile-impact p {
          color: #666;
          font-size: 0.9rem;
          margin-bottom: 1rem;
        }
        
        .impact-meter {
          margin-top: 1rem;
        }
        
        .impact-label {
          font-size: 0.9rem;
          color: #555;
          margin-bottom: 0.5rem;
        }
        
        .impact-bar-container {
          height: 8px;
          background-color: #e0e0e0;
          border-radius: 4px;
          overflow: hidden;
        }
        
        .impact-bar {
          height: 100%;
          background-color: #3a86ff;
          border-radius: 4px;
          transition: width 1s ease-out;
        }
        
        .profile-selector-footer {
          margin-top: 1rem;
          padding-top: 1rem;
          border-top: 1px solid #e0e0e0;
        }
        
        .keyboard-shortcuts {
          display: flex;
          gap: 1rem;
          justify-content: center;
          flex-wrap: wrap;
        }
        
        .shortcut-item {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.9rem;
          color: #666;
        }
        
        kbd {
          background-color: #f0f0f0;
          border: 1px solid #ccc;
          border-radius: 3px;
          box-shadow: 0 1px 1px rgba(0, 0, 0, 0.2);
          color: #333;
          display: inline-block;
          font-size: 0.85rem;
          font-family: monospace;
          line-height: 1;
          padding: 0.25rem 0.5rem;
        }
        
        /* Loading state */
        .loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 200px;
        }
        
        .loading-text {
          margin-top: 1rem;
          color: #666;
        }
        
        /* Error state */
        .error {
          padding: 2rem;
          text-align: center;
        }
        
        .error-message {
          color: #ef476f;
          margin-bottom: 1rem;
        }
        
        .retry-button {
          background-color: #3a86ff;
          color: white;
          border: none;
          padding: 0.75rem 1.5rem;
          border-radius: 4px;
          cursor: pointer;
          font-weight: 500;
          transition: background-color 0.2s ease;
        }
        
        .retry-button:hover {
          background-color: #2a75e8;
        }
        
        /* Responsive design */
        .compact .profile-selector-header {
          flex-direction: column;
          align-items: flex-start;
          gap: 1rem;
        }
        
        .compact .profile-selector-controls {
          width: 100%;
          flex-direction: column;
          align-items: flex-start;
        }
        
        .compact .search-container {
          width: 100%;
        }
        
        .compact .search-input {
          width: 100%;
        }
        
        .compact .view-mode-selector {
          width: 100%;
        }
        
        .compact .view-mode-select {
          width: 100%;
        }
        
        .compact .profile-options {
          grid-template-columns: 1fr;
        }
        
        @media (max-width: 768px) {
          .profile-selector {
            padding: 1rem;
          }
          
          .profile-selector-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 1rem;
          }
          
          .profile-selector-controls {
            width: 100%;
            flex-direction: column;
            align-items: flex-start;
            gap: 0.75rem;
          }
          
          .search-container {
            width: 100%;
          }
          
          .search-input {
            width: 100%;
          }
          
          .search-input:focus {
            width: 100%;
          }
          
          .view-mode-selector {
            width: 100%;
          }
          
          .view-mode-select {
            width: 100%;
          }
          
          .profile-options {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};
