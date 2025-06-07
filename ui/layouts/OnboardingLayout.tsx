import React from 'react';
import styled from 'styled-components';
import { Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Styled Components
const OnboardingLayoutContainer = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background-color: #0D1117;
  color: #FFFFFF;
`;

const OnboardingHeader = styled.header`
  padding: 16px 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #2A3343;
`;

const Logo = styled.div`
  font-size: 24px;
  font-weight: bold;
  color: #2BFFC6;
`;

const UserInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const UserAvatar = styled.div`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background-color: #2A3343;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
`;

const UserName = styled.div`
  font-size: 14px;
  color: #B0B8C4;
`;

const OnboardingContent = styled.main`
  flex: 1;
  padding: 24px;
`;

/**
 * OnboardingLayout Component
 * 
 * Layout component for the onboarding flow.
 * Provides consistent header and structure for all onboarding pages.
 * 
 * @returns {JSX.Element} - Rendered component
 */
const OnboardingLayout: React.FC = () => {
  const { user } = useAuth();
  
  // Get user initials for avatar
  const getUserInitials = () => {
    if (!user || !user.displayName) return '?';
    
    const names = user.displayName.split(' ');
    if (names.length === 1) return names[0].charAt(0).toUpperCase();
    return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase();
  };

  return (
    <OnboardingLayoutContainer data-testid="onboarding-layout">
      <OnboardingHeader>
        <Logo>Promethios</Logo>
        <UserInfo>
          <UserAvatar>{getUserInitials()}</UserAvatar>
          <UserName>{user?.displayName || 'User'}</UserName>
        </UserInfo>
      </OnboardingHeader>
      
      <OnboardingContent>
        <Outlet />
      </OnboardingContent>
    </OnboardingLayoutContainer>
  );
};

export default OnboardingLayout;
