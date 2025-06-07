# Collapsible Navigation Extension Module

## Overview

The Collapsible Navigation extension module provides a responsive, accessible navigation component for the Promethios UI. It features a collapsible sidebar that can be toggled between expanded and collapsed states, with tooltips for navigation items when collapsed.

## Features

- Toggleable between expanded (260px) and collapsed (60px) states
- State persistence between sessions using localStorage
- Tooltips for navigation items in collapsed state
- Keyboard navigation and accessibility support
- Customizable navigation items with icons and labels
- Support for active and disabled states

## Installation

The module is designed as a plugin-style extension that integrates with the existing Promethios UI without modifying the kernel.

## Usage

```tsx
import { CollapsibleNavigation } from '../components/navigation/CollapsibleNavigation';

// Define navigation items
const navItems = [
  { 
    id: 'dashboard', 
    icon: <DashboardIcon />, 
    label: 'Dashboard', 
    path: '/dashboard', 
    active: true 
  },
  { 
    id: 'agents', 
    icon: <AgentsIcon />, 
    label: 'Agents', 
    path: '/agents' 
  },
  // Additional items...
];

// Use in your component
const MyComponent = () => {
  const handleNavItemClick = (item) => {
    // Handle navigation
    navigate(item.path);
  };

  return (
    <CollapsibleNavigation
      items={navItems}
      logo={<Logo />}
      logoText="Promethios"
      onNavItemClick={handleNavItemClick}
    />
  );
};
```

## Integration with Existing UI

To integrate the CollapsibleNavigation with the existing UI:

1. Import the component in your layout component
2. Replace the current navigation with CollapsibleNavigation
3. Ensure the main content area adjusts its width based on the navigation state

Example integration with the main layout:

```tsx
import { CollapsibleNavigation } from '../components/navigation/CollapsibleNavigation';
import { useLocalStorage } from '../hooks/useLocalStorage';

const MainLayout = ({ children }) => {
  const [navExpanded] = useLocalStorage('navExpanded', false);
  
  return (
    <div className="app-container">
      <CollapsibleNavigation
        items={navItems}
        logo={<Logo />}
        logoText="Promethios"
        onNavItemClick={handleNavItemClick}
      />
      <main 
        className="main-content"
        style={{ 
          marginLeft: navExpanded ? '260px' : '60px',
          width: `calc(100% - ${navExpanded ? '260px' : '60px'})`,
          transition: 'margin-left 250ms ease, width 250ms ease'
        }}
      >
        {children}
      </main>
    </div>
  );
};
```

## Integration with AgentWizard Component

The CollapsibleNavigation component is designed to work seamlessly with the existing AgentWizard component:

```tsx
import { CollapsibleNavigation } from '../components/navigation/CollapsibleNavigation';
import AgentWizard from '../dashboard/components/AgentWizard';
import { useLocalStorage } from '../hooks/useLocalStorage';

const AgentWizardPage = () => {
  const [navExpanded] = useLocalStorage('navExpanded', false);
  
  return (
    <div className="app-container">
      <CollapsibleNavigation
        items={navItems}
        logo={<Logo />}
        logoText="Promethios"
        onNavItemClick={handleNavItemClick}
      />
      <main 
        className="main-content"
        style={{ 
          marginLeft: navExpanded ? '260px' : '60px',
          width: `calc(100% - ${navExpanded ? '260px' : '60px'})`,
          transition: 'margin-left 250ms ease, width 250ms ease'
        }}
      >
        <AgentWizard />
      </main>
    </div>
  );
};
```

## Props

| Prop | Type | Description |
|------|------|-------------|
| `items` | `NavItem[]` | Array of navigation items to display |
| `logo` | `React.ReactNode` | Icon/logo to display in the navigation header |
| `logoText` | `string` | Text to display next to the logo (visible in expanded state) |
| `onNavItemClick` | `(item: NavItem) => void` | Callback function when a navigation item is clicked |
| `className` | `string` | Optional CSS class name for styling |

### NavItem Interface

```tsx
interface NavItem {
  id: string;        // Unique identifier
  icon: React.ReactNode; // Icon component
  label: string;     // Display text
  path: string;      // Navigation path
  active?: boolean;  // Whether item is active
  disabled?: boolean; // Whether item is disabled
}
```

## Accessibility

The CollapsibleNavigation component is built with accessibility in mind:

- Keyboard navigation support (Tab, Enter, Space)
- ARIA attributes for screen readers
- Keyboard shortcut (Alt+B) for toggling navigation
- Focus management
- Proper contrast ratios

## Browser Support

- Chrome (latest 2 versions)
- Firefox (latest 2 versions)
- Safari (latest 2 versions)
- Edge (latest 2 versions)

## Performance Considerations

- Smooth transitions using CSS transitions
- Minimal re-renders with React.memo for child components
- Efficient state management with useLocalStorage hook
- Optimized rendering for large navigation structures

## Testing

The component includes comprehensive test coverage:

- Unit tests for the component and its hooks
- Accessibility testing
- Integration tests with the main UI
- Browser compatibility testing

Run tests with:

```bash
npm test -- --testPathPattern=components/navigation
```

## Known Issues and Limitations

- The tooltip positioning may need adjustment in certain viewport sizes
- Very long navigation labels may be truncated in expanded state
- Custom styling may require additional CSS overrides

## Future Enhancements

- Support for nested navigation items
- Drag-and-drop reordering of navigation items
- Customizable transition speeds
- Theme support for different color schemes

## Integration Verification

Before using this component in production, verify:

1. The navigation correctly expands and collapses
2. State is properly persisted between page refreshes
3. Tooltips appear correctly in collapsed state
4. Keyboard navigation works as expected
5. The component integrates properly with the existing layout
6. No conflicts with existing styles or behaviors
7. Proper responsive behavior on all supported devices

## Backward Compatibility

This extension module maintains backward compatibility with the existing UI by:

1. Following the established component patterns
2. Using the same styling variables and themes
3. Not modifying any kernel code
4. Providing the same functionality as the original navigation
5. Supporting all existing navigation item structures

## Dependencies

- React 17+
- styled-components 5+
- TypeScript 4.5+
