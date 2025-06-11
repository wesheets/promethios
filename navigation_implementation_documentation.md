# Navigation Implementation Documentation

## Overview
This document provides comprehensive documentation for the new navigation system implemented in the Promethios UI. The navigation system consists of two main components:

1. **HeaderNavigation** - A fixed top navigation bar with user profile, notifications, and global search
2. **CollapsibleNavigation** - A collapsible left sidebar with all main navigation items

## Component Structure

### HeaderNavigation
Located at: `/src/components/HeaderNavigation.tsx`

The HeaderNavigation component provides:
- Logo that redirects to dashboard when logged in
- Global search functionality
- Notification system with badge counter
- User profile dropdown with quick actions
- Responsive design for all screen sizes

### CollapsibleNavigation
Located at: `/src/components/CollapsibleNavigation.tsx`

The CollapsibleNavigation component provides:
- Collapsible/expandable sidebar with toggle button
- Persistent state (saved to localStorage)
- Hierarchical navigation structure with expandable sections
- Permission-based visibility for admin-only sections
- Active route highlighting
- Tooltips for collapsed navigation items

## Navigation Structure

The navigation system includes the following sections:

1. **Dashboard** - Main dashboard link

2. **Agents** section with:
   - Agent Wrapping
   - Chat
   - Deploy
   - Registry
   - Scorecard
   - Identity
   - Benchmarks

3. **Governance** section with:
   - Overview
   - Policies
   - Violations
   - Reports
   - Emotional Veritas

4. **Trust Metrics** section with:
   - Overview
   - Boundaries
   - Attestations

5. **Settings** section with:
   - User Profile
   - Preferences
   - Organization
   - Integrations
   - Data Management

6. **Help** section with:
   - Guided Tours
   - Documentation
   - Support

7. **Admin Dashboard** (only visible to admin users)

## Page Structure

The application includes the following main pages:

1. **Dashboard** (`/src/pages/Dashboard.tsx`)
   - Main landing page with governance metrics and quick actions

2. **AgentsPage** (`/src/pages/AgentsPage.tsx`)
   - Agent management interface with tabs for different agent-related functions

3. **GovernancePage** (`/src/pages/GovernancePage.tsx`)
   - Governance management interface with tabs for different governance functions

4. **TrustMetricsPage** (`/src/pages/TrustMetricsPage.tsx`)
   - Trust metrics interface with tabs for different trust-related functions

5. **SettingsPage** (`/src/pages/SettingsPage.tsx`)
   - Settings interface with tabs for different configuration options

6. **HelpPage** (`/src/pages/HelpPage.tsx`)
   - Help and support interface with guided tours, documentation, and support

## Integration

The navigation components are integrated in the main App layout (`/src/App.tsx`):

```tsx
<Box sx={{ display: 'flex' }}>
  <CssBaseline />
  
  {/* Header Navigation Bar */}
  <HeaderNavigation 
    isLoggedIn={isLoggedIn}
    userName={userName}
    userRole={userRole}
    unreadNotifications={unreadNotifications}
  />
  
  {/* Collapsible Left Navigation */}
  <CollapsibleNavigation 
    userPermissions={userPermissions}
    isAdmin={isAdmin}
  />
  
  {/* Main content area */}
  <Box
    component="main"
    sx={{
      flexGrow: 1,
      mt: '64px', // Header height
      ml: contentMarginLeft,
      transition: theme => theme.transitions.create('margin', {
        easing: theme.transitions.easing.sharp,
        duration: theme.transitions.duration.enteringScreen,
      }),
      p: 3,
    }}
  >
    {/* Routes */}
  </Box>
</Box>
```

## Routing

The application uses React Router for navigation. The main routes are defined in `App.tsx`:

```tsx
<Routes>
  {/* Main routes */}
  <Route path="/" element={<Navigate to="/dashboard" replace />} />
  <Route path="/dashboard" element={<Dashboard />} />
  <Route path="/agents/*" element={<AgentsPage />} />
  <Route path="/governance/*" element={<GovernancePage />} />
  <Route path="/trust-metrics/*" element={<TrustMetricsPage />} />
  <Route path="/settings/*" element={<SettingsPage />} />
  <Route path="/help/*" element={<HelpPage />} />
  
  {/* Admin Dashboard Routes */}
  <Route path="/admin/dashboard/*" element={<AdminDashboardLayout />} />
  
  {/* Fallback route */}
  <Route path="*" element={<Navigate to="/dashboard" replace />} />
</Routes>
```

Each main section has its own nested routes for sub-pages.

## Permissions and Access Control

The navigation system includes permission-based visibility:

- Regular navigation items are visible to all authenticated users
- Admin-only items (like Admin Dashboard) are only visible to users with admin privileges
- The `userPermissions` and `isAdmin` props control visibility

## Styling and Theming

The navigation components use Material UI's styling system:

- Styled components for consistent theming
- Responsive design for all screen sizes
- Dark theme by default with support for theme customization
- Proper spacing and layout for optimal user experience

## Future Enhancements

Potential future enhancements for the navigation system:

1. Dynamic breadcrumbs based on current route
2. More granular permission controls
3. Customizable navigation items based on user preferences
4. Enhanced mobile responsiveness
5. Additional accessibility features

## Validation

The navigation system has been validated for:

- Proper route switching
- Correct active state highlighting
- Collapsible functionality
- Permission-based visibility
- Integration with the main application layout
