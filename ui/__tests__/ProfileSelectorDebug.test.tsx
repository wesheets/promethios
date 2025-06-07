/**
 * ProfileSelector component tests with debug utilities
 * 
 * Tests for the ProfileSelector component with enhanced debugging.
 * 
 * Contract Version: v2025.05.18
 * Phase ID: 12.20
 */
import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ProfileSelector } from '../governance/ProfileSelector';
import { GovernanceDomain } from '../governance/types';
import { renderWithDebugContext, ProfileDebugDisplay } from '../test-utils/debug-utils';
import { DEFAULT_MOCK_PROFILES } from '../test-utils/governance-testing';

describe('ProfileSelector Component Debug', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Clear console before each test for cleaner logs
    console.clear();
  });

  test('debug profile data structure and rendering', async () => {
    // Render with debug context and debug display component
    renderWithDebugContext(
      <>
        <ProfileDebugDisplay />
        <ProfileSelector />
      </>,
      {
        mockProfiles: DEFAULT_MOCK_PROFILES,
        mockDelay: 10
      }
    );
    
    // Wait for debug info to be displayed
    await waitFor(() => {
      expect(screen.getByTestId('profile-debug')).toBeInTheDocument();
    }, { timeout: 10000 });
    
    // Log what's actually rendered
    console.log('Rendered DOM:', screen.getByTestId('profile-debug').innerHTML);
    
    // Check what profiles are available in the context
    const profilesInfo = screen.getByText(/Profiles Count:/);
    console.log('Profiles info:', profilesInfo.textContent);
    
    // Check what's rendered in the ProfileSelector
    const profileSelector = screen.getByTestId('profile-selector');
    console.log('ProfileSelector content:', profileSelector.innerHTML);
  }, 30000); // Long timeout for debugging
});
