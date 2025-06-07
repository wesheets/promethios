import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useLocalStorage } from '../../hooks/useLocalStorage';

// Types
export interface NavItem {
  id: string;
  icon: React.ReactNode;
  label: string;
  path: string;
  active?: boolean;
  disabled?: boolean;
}

export interface CollapsibleNavigationProps {
  items: NavItem[];
  logo: React.ReactNode;
  logoText: string;
  onNavItemClick?: (item: NavItem) => void;
  className?: string;
}

// Styled Components
const NavContainer = styled.nav<{ expanded: boolean }>`
  background-color: #0D1117;
  height: 100vh;
  width: ${props => props.expanded ? '260px' : '60px'};
  transition: width 250ms ease;
  border-right: 1px solid #2A3343;
  overflow: hidden;
  position: relative;
  z-index: 10;
  display: flex;
  flex-direction: column;
`;

const NavToggle = styled.button`
  position: absolute;
  top: 10px;
  right: 10px;
  background: transparent;
  border: none;
  color: #B0B8C4;
  cursor: pointer;
  font-size: 20px;
  z-index: 2;
  
  &:focus {
    outline: 2px solid #2BFFC6;
    outline-offset: 2px;
  }
  
  &:hover {
    color: #FFFFFF;
  }
`;

const LogoContainer = styled.div`
  display: flex;
  align-items: center;
  padding: 20px 0;
  color: #2BFFC6;
  font-size: 24px;
  font-weight: bold;
  overflow: hidden;
  white-space: nowrap;
`;

const LogoIcon = styled.div`
  min-width: 60px;
  display: flex;
  justify-content: center;
`;

const LogoText = styled.div<{ expanded: boolean }>`
  opacity: ${props => props.expanded ? 1 : 0};
  transition: opacity 250ms ease;
  margin-left: 10px;
`;

const NavItemsContainer = styled.ul`
  list-style: none;
  padding: 0;
  margin: 20px 0 0 0;
  flex: 1;
  overflow-y: auto;
`;

const NavItemElement = styled.li<{ active?: boolean; expanded: boolean; disabled?: boolean }>`
  position: relative;
  display: flex;
  align-items: center;
  height: 48px;
  margin-bottom: 16px;
  cursor: ${props => props.disabled ? 'not-allowed' : 'pointer'};
  transition: background-color 0.2s;
  opacity: ${props => props.disabled ? 0.5 : 1};
  
  &:hover {
    background-color: ${props => props.disabled ? 'transparent' : '#2A3343'};
  }
  
  ${props => props.active && `
    background-color: rgba(43, 255, 198, 0.1);
    
    &::before {
      content: '';
      position: absolute;
      left: 0;
      top: 0;
      width: 4px;
      height: 100%;
      background-color: #2BFFC6;
    }
  `}
`;

const NavIcon = styled.div<{ expanded: boolean }>`
  min-width: 60px;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: ${props => props.expanded ? '20px' : '24px'};
`;

const NavText = styled.div<{ expanded: boolean }>`
  opacity: ${props => props.expanded ? 1 : 0};
  transition: opacity 250ms ease;
  white-space: nowrap;
`;

const Tooltip = styled.div<{ expanded: boolean }>`
  position: absolute;
  left: 65px;
  background-color: #1A2233;
  color: #FFFFFF;
  padding: 8px 12px;
  border-radius: 4px;
  font-size: 14px;
  white-space: nowrap;
  pointer-events: none;
  opacity: 0;
  transition: opacity 0.2s;
  z-index: 100;
  
  &::before {
    content: '';
    position: absolute;
    top: 50%;
    left: -5px;
    transform: translateY(-50%);
    border-width: 5px 5px 5px 0;
    border-style: solid;
    border-color: transparent #1A2233 transparent transparent;
  }
  
  ${NavItemElement}:hover & {
    opacity: ${props => props.expanded ? 0 : 1};
  }
`;

/**
 * CollapsibleNavigation Component
 * 
 * A collapsible navigation bar that can be expanded or collapsed.
 * Provides tooltips in collapsed state and persists state between sessions.
 * 
 * @param {CollapsibleNavigationProps} props - Component props
 * @returns {JSX.Element} - Rendered component
 */
export const CollapsibleNavigation: React.FC<CollapsibleNavigationProps> = ({
  items,
  logo,
  logoText,
  onNavItemClick,
  className
}) => {
  const [expanded, setExpanded] = useLocalStorage('navExpanded', false);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  // Toggle navigation expanded state
  const toggleNav = () => {
    setExpanded(!expanded);
  };

  // Handle navigation item click
  const handleItemClick = (item: NavItem) => {
    if (item.disabled) return;
    if (onNavItemClick) onNavItemClick(item);
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent, item: NavItem) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleItemClick(item);
    }
  };

  // Add keyboard shortcut for toggling navigation
  useEffect(() => {
    const handleKeyboardShortcut = (e: KeyboardEvent) => {
      if (e.altKey && e.key === 'b') {
        toggleNav();
      }
    };

    window.addEventListener('keydown', handleKeyboardShortcut);
    return () => {
      window.removeEventListener('keydown', handleKeyboardShortcut);
    };
  }, [expanded]);

  return (
    <NavContainer expanded={expanded} className={className} data-testid="collapsible-navigation">
      <NavToggle 
        onClick={toggleNav} 
        aria-label={expanded ? "Collapse navigation" : "Expand navigation"}
        data-testid="nav-toggle"
      >
        {expanded ? '◀' : '≡'}
      </NavToggle>
      
      <LogoContainer>
        <LogoIcon>{logo}</LogoIcon>
        <LogoText expanded={expanded}>{logoText}</LogoText>
      </LogoContainer>
      
      <NavItemsContainer>
        {items.map((item) => (
          <NavItemElement
            key={item.id}
            active={item.active}
            expanded={expanded}
            disabled={item.disabled}
            onClick={() => handleItemClick(item)}
            onKeyDown={(e) => handleKeyDown(e, item)}
            onMouseEnter={() => setHoveredItem(item.id)}
            onMouseLeave={() => setHoveredItem(null)}
            tabIndex={item.disabled ? -1 : 0}
            role="button"
            aria-disabled={item.disabled}
            aria-label={item.label}
            data-testid={`nav-item-${item.id}`}
          >
            <NavIcon expanded={expanded}>{item.icon}</NavIcon>
            <NavText expanded={expanded}>{item.label}</NavText>
            {hoveredItem === item.id && (
              <Tooltip expanded={expanded} role="tooltip">
                {item.label}
              </Tooltip>
            )}
          </NavItemElement>
        ))}
      </NavItemsContainer>
    </NavContainer>
  );
};

export default CollapsibleNavigation;
