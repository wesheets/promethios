import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

interface HeaderNavigationProps {
  isLoggedIn: boolean;
  userName?: string;
  userRole?: string;
  unreadNotifications?: number;
}

const HeaderNavigation: React.FC<HeaderNavigationProps> = ({
  isLoggedIn = true,
  userName = 'User',
  userRole = 'Admin',
  unreadNotifications = 0
}) => {
  const navigate = useNavigate();
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  
  // Dashboard URL based on login status
  const dashboardUrl = isLoggedIn ? '/admin/dashboard' : '/';
  
  // Toggle search expansion (for mobile)
  const toggleSearch = () => {
    setIsSearchExpanded(!isSearchExpanded);
  };
  
  // Toggle profile menu
  const toggleProfileMenu = () => {
    setIsProfileMenuOpen(!isProfileMenuOpen);
  };
  
  // Handle search submission
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Implement search functionality
    console.log('Search submitted');
  };
  
  // Styles
  const headerStyles = {
    header: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 20px',
      height: '60px',
      backgroundColor: '#1e293b',
      color: '#e2e8f0',
      width: '100%',
      position: 'fixed' as 'fixed',
      top: 0,
      left: 0,
      zIndex: 1000,
      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
    },
    headerLeft: {
      display: 'flex',
      alignItems: 'center'
    },
    headerCenter: {
      flex: 1,
      display: 'flex',
      justifyContent: 'center',
      maxWidth: '600px'
    },
    headerRight: {
      display: 'flex',
      alignItems: 'center'
    },
    logo: {
      fontWeight: 'bold' as 'bold',
      fontSize: '1.5rem',
      marginRight: '20px',
      color: '#e2e8f0',
      textDecoration: 'none'
    },
    searchForm: {
      display: 'flex',
      width: '100%'
    },
    searchInput: {
      flex: 1,
      padding: '8px 12px',
      border: 'none',
      borderRadius: '4px 0 0 4px',
      backgroundColor: '#2d3748',
      color: '#e2e8f0',
      outline: 'none'
    },
    searchButton: {
      padding: '8px 12px',
      border: 'none',
      borderRadius: '0 4px 4px 0',
      backgroundColor: '#4a5568',
      color: '#e2e8f0',
      cursor: 'pointer'
    },
    iconButton: {
      background: 'none',
      border: 'none',
      color: '#a0aec0',
      fontSize: '1.2rem',
      cursor: 'pointer',
      padding: '8px',
      marginLeft: '10px',
      position: 'relative' as 'relative'
    },
    notificationBadge: {
      position: 'absolute' as 'absolute',
      top: '0',
      right: '0',
      backgroundColor: '#e53e3e',
      color: 'white',
      borderRadius: '50%',
      width: '18px',
      height: '18px',
      fontSize: '0.7rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    },
    profileButton: {
      display: 'flex',
      alignItems: 'center',
      background: 'none',
      border: 'none',
      color: '#e2e8f0',
      cursor: 'pointer',
      padding: '8px',
      marginLeft: '15px'
    },
    profileAvatar: {
      width: '32px',
      height: '32px',
      borderRadius: '50%',
      backgroundColor: '#4a5568',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: '8px',
      fontSize: '1rem'
    },
    profileMenu: {
      position: 'absolute' as 'absolute',
      top: '60px',
      right: '20px',
      backgroundColor: '#2d3748',
      borderRadius: '4px',
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
      width: '200px',
      zIndex: 1001
    },
    profileMenuItem: {
      padding: '12px 16px',
      color: '#e2e8f0',
      textDecoration: 'none',
      display: 'block',
      borderBottom: '1px solid #4a5568',
      cursor: 'pointer'
    },
    breadcrumbs: {
      display: 'flex',
      alignItems: 'center',
      marginLeft: '20px',
      color: '#a0aec0',
      fontSize: '0.9rem'
    },
    breadcrumbItem: {
      color: '#a0aec0',
      textDecoration: 'none'
    },
    breadcrumbSeparator: {
      margin: '0 8px'
    }
  };
  
  return (
    <header style={headerStyles.header}>
      <div style={headerStyles.headerLeft}>
        {/* Logo placeholder that redirects to dashboard when logged in */}
        <Link to={dashboardUrl} style={headerStyles.logo}>
          Promethios
        </Link>
        
        {/* Breadcrumbs - only show when logged in */}
        {isLoggedIn && (
          <div style={headerStyles.breadcrumbs}>
            <Link to="/admin/dashboard" style={headerStyles.breadcrumbItem}>Dashboard</Link>
            <span style={headerStyles.breadcrumbSeparator}>/</span>
            <span>Current Page</span>
          </div>
        )}
      </div>
      
      <div style={headerStyles.headerCenter}>
        {/* Global search - only show when logged in */}
        {isLoggedIn && (
          <form style={headerStyles.searchForm} onSubmit={handleSearchSubmit}>
            <input
              type="text"
              placeholder="Search..."
              style={headerStyles.searchInput}
            />
            <button type="submit" style={headerStyles.searchButton}>
              🔍
            </button>
          </form>
        )}
      </div>
      
      <div style={headerStyles.headerRight}>
        {/* Only show these elements when logged in */}
        {isLoggedIn && (
          <>
            {/* Notification icon */}
            <button style={headerStyles.iconButton}>
              🔔
              {unreadNotifications > 0 && (
                <span style={headerStyles.notificationBadge}>
                  {unreadNotifications}
                </span>
              )}
            </button>
            
            {/* Help icon */}
            <button style={headerStyles.iconButton}>
              ?
            </button>
            
            {/* User profile */}
            <div style={{ position: 'relative' }}>
              <button style={headerStyles.profileButton} onClick={toggleProfileMenu}>
                <div style={headerStyles.profileAvatar}>
                  {userName.charAt(0)}
                </div>
                <span>{userName}</span>
              </button>
              
              {/* Profile dropdown menu */}
              {isProfileMenuOpen && (
                <div style={headerStyles.profileMenu}>
                  <div style={{ padding: '12px 16px', borderBottom: '1px solid #4a5568' }}>
                    <div>{userName}</div>
                    <div style={{ fontSize: '0.8rem', color: '#a0aec0' }}>{userRole}</div>
                  </div>
                  <Link to="/settings/profile" style={headerStyles.profileMenuItem}>Profile</Link>
                  <Link to="/settings/preferences" style={headerStyles.profileMenuItem}>Preferences</Link>
                  <div 
                    style={headerStyles.profileMenuItem} 
                    onClick={() => {
                      // Handle logout
                      console.log('Logging out');
                      navigate('/');
                    }}
                  >
                    Logout
                  </div>
                </div>
              )}
            </div>
          </>
        )}
        
        {/* Show login/signup when not logged in */}
        {!isLoggedIn && (
          <>
            <Link to="/login" style={{ ...headerStyles.profileMenuItem, border: 'none' }}>
              Login
            </Link>
            <Link to="/signup" style={{ ...headerStyles.profileMenuItem, border: 'none', backgroundColor: '#4299e1' }}>
              Sign Up
            </Link>
          </>
        )}
      </div>
    </header>
  );
};

export default HeaderNavigation;
