/**
 * Simplified ProfileSelector test with direct props
 * 
 * Tests for the simplified ProfileSelector component that doesn't rely on context.
 * 
 * Contract Version: v2025.05.18
 * Phase ID: 12.20
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { TestProfileSelector } from '../test-utils/TestProfileSelector';
import { GovernanceDomain } from '../governance/types';

describe('TestProfileSelector Component', () => {
  // Sample profile data that correctly aligns domain values
  const sampleProfiles = [
    {
      domain: GovernanceDomain.SOFTWARE_ENGINEERING,
      displayName: 'Software Engineering'
    },
    {
      domain: GovernanceDomain.PRODUCT_MANAGEMENT,
      displayName: 'Product Management'
    }
  ];

  test('renders profile options correctly', () => {
    render(
      <TestProfileSelector 
        profiles={sampleProfiles}
      />
    );
    
    // Check that all profiles are rendered
    expect(screen.getByText('Software Engineering')).toBeInTheDocument();
    expect(screen.getByText('Product Management')).toBeInTheDocument();
  });

  test('shows selected profile as active', () => {
    render(
      <TestProfileSelector 
        profiles={sampleProfiles}
        currentDomain={GovernanceDomain.SOFTWARE_ENGINEERING}
      />
    );
    
    // Check that Software Engineering is marked as active
    const softwareEngOption = screen.getByText('Software Engineering').closest('button');
    expect(softwareEngOption).toHaveClass('active');
    
    // Check that Product Management is not marked as active
    const productMgmtOption = screen.getByText('Product Management').closest('button');
    expect(productMgmtOption).not.toHaveClass('active');
  });

  test('calls onSelect when profile is clicked', () => {
    const handleSelect = jest.fn();
    
    render(
      <TestProfileSelector 
        profiles={sampleProfiles}
        onSelect={handleSelect}
      />
    );
    
    // Click on a profile
    fireEvent.click(screen.getByText('Software Engineering'));
    
    // Check that onSelect was called with the correct domain
    expect(handleSelect).toHaveBeenCalledWith(GovernanceDomain.SOFTWARE_ENGINEERING);
  });

  test('shows version selector when showVersions is true', () => {
    render(
      <TestProfileSelector 
        profiles={sampleProfiles}
        currentDomain={GovernanceDomain.SOFTWARE_ENGINEERING}
        showVersions={true}
      />
    );
    
    // Check that version selector is rendered
    expect(screen.getByLabelText('Version')).toBeInTheDocument();
    expect(screen.getByText('Version: 2.0')).toBeInTheDocument();
  });

  test('hides version selector when showVersions is false', () => {
    render(
      <TestProfileSelector 
        profiles={sampleProfiles}
        currentDomain={GovernanceDomain.SOFTWARE_ENGINEERING}
        showVersions={false}
      />
    );
    
    // Check that version selector is not rendered
    expect(screen.queryByLabelText('Version')).not.toBeInTheDocument();
    expect(screen.queryByText('Version: 2.0')).not.toBeInTheDocument();
  });
});
