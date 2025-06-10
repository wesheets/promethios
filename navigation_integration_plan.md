# Navigation Integration Plan for Promethios UI

## 1. Overview

This document outlines the plan for ensuring all Promethios UI modules are properly integrated with the existing left navigation bar and introduces a new header navigation bar for logged-in users. The goal is to provide a consistent, intuitive navigation experience across the entire platform while maintaining the full-width layout design.

## 2. Current Navigation Structure

### 2.1 Left Navigation Bar

The existing left navigation bar serves as the primary navigation element in Promethios. It is collapsible to maximize content space in the full-width layout.

Current structure (based on existing implementation):

```
- Dashboard
- Governance
  - Overview
  - Policies
  - Violations
  - Reports
- Trust Metrics
  - Overview
  - Boundaries
  - Attestations
- Agents
  - Registry
  - Scorecard
  - Benchmarks
- Settings
  - User Profile
  - Preferences
  - Organization
```

### 2.2 Navigation State Management

The current navigation state is managed through:
- URL-based routing (React Router)
- Active state tracking for highlighting the current section
- Collapsible state management for expandable sections
- Persistence of navigation state (expanded/collapsed) in user preferences

## 3. Integration Requirements for New Modules

### 3.1 Module to Navigation Mapping

| Module | Navigation Location | Route |
|--------|---------------------|-------|
| Emotional Veritas 2.0 | Governance > Emotional Veritas | `/governance/emotional-veritas` |
| Observer Agent | Standalone floating UI (no nav entry) | N/A (accessible via chat bubble) |
| Multi-Agent Chat | Agents > Chat | `/agents/chat` |
| Agent Scorecard | Agents > Scorecard | `/agents/scorecard` |
| Governance Identity | Agents > Identity | `/agents/identity` |
| CMU Benchmark | Agents > Benchmarks | `/agents/benchmarks` |
| Unified Notification | Standalone UI (no nav entry) | N/A (accessible via icon in header) |
| User Preferences | Settings > Preferences | `/settings/preferences` |
| Integration Hub | Settings > Integrations | `/settings/integrations` |
| Guided Tours | Help > Tours | `/help/tours` |
| Export/Import | Settings > Data Management | `/settings/data-management` |

### 3.2 Integration Points

For each module, the following integration points with the navigation system must be implemented:

1. **Route Registration**: Register the module's routes with the application router
2. **Navigation Item Registration**: Add navigation items to the left nav bar
3. **Active State Handling**: Ensure proper highlighting of navigation items based on current route
4. **Permission-Based Visibility**: Show/hide navigation items based on user permissions
5. **State Persistence**: Maintain navigation state across page refreshes

```typescript
// Example of registering a module with the navigation system
function registerModuleNavigation(module: UIModule) {
  // Register routes
  RouterRegistry.registerRoutes(module.routes);
  
  // Register navigation items
  NavigationRegistry.registerItems(module.navigationItems);
  
  // Register permission requirements
  PermissionRegistry.registerRequirements(module.permissionRequirements);
}

// Example navigation item definition
const emotionalVeritasNavItem = {
  id: 'emotional-veritas',
  label: 'Emotional Veritas',
  icon: 'heart-pulse',
  parentId: 'governance',
  route: '/governance/emotional-veritas',
  order: 4, // Position within parent
  permissionRequired: 'governance.emotional-veritas.view'
};
```

## 4. Header Navigation Bar Design

### 4.1 Purpose and Goals

The header navigation bar will provide:
- User account information and quick actions
- Global search functionality
- Notification center access
- Quick access to frequently used tools
- Context awareness (showing relevant information for current section)

### 4.2 Design Specifications

- **Position**: Fixed at the top of the screen, spanning full width
- **Height**: 60px (desktop), 50px (mobile)
- **Layout**: Responsive, adapting to different screen sizes
- **Color Scheme**: Consistent with overall UI theme
- **Z-index**: Higher than content, lower than modals

### 4.3 Components

1. **Left Section**:
   - Toggle button for left navigation bar (on smaller screens)
   - Breadcrumbs showing current location

2. **Center Section**:
   - Global search bar

3. **Right Section**:
   - Notification icon with badge
   - Help/support icon
   - User profile menu
   - Additional action buttons (context-dependent)

```typescript
// Example header navigation bar component
function HeaderNavigationBar() {
  const { currentUser } = useAuth();
  const { currentRoute } = useRouter();
  const { unreadNotifications } = useNotifications();
  const { toggleLeftNav, isLeftNavCollapsed } = useNavigation();
  
  return (
    <header className="header-nav">
      <div className="header-left">
        <button 
          className="toggle-left-nav" 
          onClick={toggleLeftNav}
          aria-label={isLeftNavCollapsed ? "Expand navigation" : "Collapse navigation"}
          aria-expanded={!isLeftNavCollapsed}
        >
          <Icon name={isLeftNavCollapsed ? "menu" : "menu-fold"} />
        </button>
        <Breadcrumbs route={currentRoute} />
      </div>
      
      <div className="header-center">
        <GlobalSearch />
      </div>
      
      <div className="header-right">
        <NotificationIcon count={unreadNotifications} />
        <HelpIcon />
        <UserProfileMenu user={currentUser} />
      </div>
    </header>
  );
}
```

### 4.4 Responsive Behavior

- **Desktop**: Full header with all components visible
- **Tablet**: Compact search, condensed user menu
- **Mobile**: Minimal header with essential elements only, collapsible search

```css
/* Example responsive styles for header nav */
.header-nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 60px;
  padding: 0 20px;
  width: 100%;
  
  @media (max-width: 768px) {
    height: 50px;
    padding: 0 10px;
  }
}

.header-center {
  flex: 1;
  max-width: 600px;
  
  @media (max-width: 768px) {
    position: absolute;
    top: 50px;
    left: 0;
    width: 100%;
    max-width: none;
    display: none;
    
    &.expanded {
      display: block;
    }
  }
}
```

### 4.5 Accessibility Considerations

- Keyboard navigation support
- ARIA attributes for screen readers
- Sufficient color contrast
- Focus management
- Skip links for bypassing header

## 5. Full-Width Layout Integration

### 5.1 Layout Structure

The full-width layout consists of:
1. **Header Navigation Bar** (fixed at top)
2. **Left Navigation Bar** (collapsible)
3. **Main Content Area** (expanding to fill available space)

```html
<div class="app-container">
  <header class="header-nav"><!-- Header Navigation --></header>
  <div class="main-container">
    <nav class="left-nav" aria-expanded="true"><!-- Left Navigation --></nav>
    <main class="content-area"><!-- Main Content --></main>
  </div>
</div>
```

### 5.2 Layout Management

- Left navigation can be collapsed/expanded to maximize content space
- Content area adapts to fill available width
- Responsive breakpoints adjust layout for different screen sizes
- Navigation state (collapsed/expanded) is persisted in user preferences

```css
/* Example layout styles */
.app-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  width: 100%;
}

.main-container {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.left-nav {
  width: 250px;
  transition: width 0.3s ease;
  
  &.collapsed {
    width: 60px;
  }
  
  @media (max-width: 768px) {
    position: fixed;
    left: 0;
    top: 50px;
    bottom: 0;
    z-index: 100;
    transform: translateX(-100%);
    
    &.expanded {
      transform: translateX(0);
    }
  }
}

.content-area {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
}
```

## 6. Module-Specific Integration

### 6.1 Chat Interface

- **Left Nav Integration**: Entry under "Agents > Chat"
- **Header Nav Integration**: Quick access button in header right section
- **Full-Width Considerations**: 
  - Chat interface expands to fill available space
  - Right sidebar (metrics) is collapsible to maximize chat area

### 6.2 Governance Dashboard

- **Left Nav Integration**: Main entry under "Governance > Overview"
- **Header Nav Integration**: Governance status indicator in header
- **Full-Width Considerations**:
  - Dashboard uses responsive grid layout to fill available space
  - Widgets adjust size based on available width

### 6.3 Emotional Veritas 2.0

- **Left Nav Integration**: Entry under "Governance > Emotional Veritas"
- **Header Nav Integration**: None (accessed via left nav only)
- **Full-Width Considerations**:
  - Visualization components scale to utilize available space
  - Metric cards use responsive grid layout

### 6.4 Observer Agent

- **Left Nav Integration**: None (floating UI)
- **Header Nav Integration**: Toggle button in header right section
- **Full-Width Considerations**:
  - Hover bubble positioned to avoid interference with content
  - Expanded view adapts size based on screen dimensions

### 6.5 Integration Hub

- **Left Nav Integration**: Entry under "Settings > Integrations"
- **Header Nav Integration**: Integration status indicator in header (optional)
- **Full-Width Considerations**:
  - Configuration forms and dashboards utilize available space
  - Card-based layout for integration instances

## 7. Navigation State Management

### 7.1 Centralized State

A centralized navigation state manager will handle:
- Current route tracking
- Active navigation item highlighting
- Left navigation expanded/collapsed state
- Mobile navigation visibility
- User navigation preferences

```typescript
// Example navigation state manager
class NavigationStateManager {
  private currentRoute: string;
  private activeItems: string[] = [];
  private isLeftNavExpanded: boolean = true;
  private isMobileNavVisible: boolean = false;
  
  constructor() {
    // Initialize from user preferences
    this.loadUserPreferences();
    
    // Listen for route changes
    RouterService.onRouteChange(this.handleRouteChange);
  }
  
  private handleRouteChange = (route: string) => {
    this.currentRoute = route;
    this.activeItems = this.calculateActiveItems(route);
    this.notifyListeners();
  };
  
  private calculateActiveItems(route: string): string[] {
    // Logic to determine which nav items should be active based on route
    const items: string[] = [];
    const routeParts = route.split('/').filter(Boolean);
    
    // Add each level of the route hierarchy
    let currentPath = '';
    for (const part of routeParts) {
      currentPath += `/${part}`;
      const item = NavigationRegistry.getItemByRoute(currentPath);
      if (item) {
        items.push(item.id);
      }
    }
    
    return items;
  }
  
  toggleLeftNav = () => {
    this.isLeftNavExpanded = !this.isLeftNavExpanded;
    this.saveUserPreferences();
    this.notifyListeners();
  };
  
  // Additional methods for state management
}
```

### 7.2 Integration with User Preferences

Navigation preferences will be stored in the user preferences system:

```typescript
// Example user preferences for navigation
interface NavigationPreferences {
  leftNavExpanded: boolean;
  favoriteRoutes: string[];
  recentRoutes: string[];
  customOrder?: Record<string, number>;
}

// Saving navigation preferences
async function saveNavigationPreferences(preferences: NavigationPreferences) {
  await UserPreferenceService.setPreference('navigation', preferences);
}

// Loading navigation preferences
async function loadNavigationPreferences(): Promise<NavigationPreferences> {
  return await UserPreferenceService.getPreference('navigation', {
    leftNavExpanded: true,
    favoriteRoutes: [],
    recentRoutes: []
  });
}
```

## 8. Implementation Plan

### 8.1 Phase 1: Navigation Structure Review
1. Audit all existing and planned modules
2. Confirm navigation hierarchy and routes
3. Identify permission requirements for navigation items

### 8.2 Phase 2: Header Navigation Implementation
1. Design and implement header navigation bar component
2. Integrate with authentication system for user profile
3. Implement notification indicator
4. Add global search functionality

### 8.3 Phase 3: Left Navigation Integration
1. Review existing left navigation implementation
2. Update to support new modules
3. Implement permission-based visibility
4. Ensure proper active state handling

### 8.4 Phase 4: Full-Width Layout Refinement
1. Review and update layout CSS
2. Ensure proper responsiveness across all screen sizes
3. Implement navigation state persistence
4. Test collapsible behavior

### 8.5 Phase 5: Module-Specific Integration
1. Update each module to register with navigation system
2. Test navigation flows between modules
3. Verify permission-based access control
4. Ensure consistent styling and behavior

## 9. Testing Plan

1. **Functional Testing**:
   - Verify all navigation links lead to correct routes
   - Test collapsible behavior of left navigation
   - Validate header navigation components
   - Check permission-based visibility

2. **Responsive Testing**:
   - Test on various screen sizes (desktop, tablet, mobile)
   - Verify layout adjustments at breakpoints
   - Test touch interactions on mobile devices

3. **Accessibility Testing**:
   - Verify keyboard navigation
   - Test screen reader compatibility
   - Check focus management
   - Validate ARIA attributes

4. **Performance Testing**:
   - Measure navigation rendering performance
   - Test smooth transitions and animations
   - Verify minimal layout shifts

## 10. Next Steps

1. Begin implementation of header navigation bar
2. Update navigation registry to include all new modules
3. Implement navigation state management
4. Test integration with existing left navigation bar
