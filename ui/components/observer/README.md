# Observer Agent Extension Module

## Overview

The Observer Agent extension module provides a contextual assistant that offers guidance and responds to UI state changes in the Promethios platform. It features expertise levels, memory persistence, and minimization capabilities.

## Features

- Contextual responses to UI state changes (navigation collapse/expand, agent wrapping, errors)
- Three expertise levels (novice, intermediate, expert) with appropriate messaging
- Memory system for tracking user actions and preferences
- Minimizable interface with smooth animations
- Manual invocation per screen (not globally attached)
- Notification system for other components to trigger Observer responses

## Installation

The module is designed as a plugin-style extension that integrates with the existing Promethios UI without modifying the kernel.

## Usage

```tsx
import { ObserverAgent, notifyObserver } from '../components/observer/ObserverAgent';

// Use in your component (manually invoked per screen)
const GovernancePage = () => {
  return (
    <div className="governance-page">
      <h1>Governance Explorer</h1>
      {/* Page content */}
      
      {/* Observer agent - manually invoked */}
      <ObserverAgent 
        expertiseLevel="novice"
        initialMessage="Welcome to the Governance Explorer. Here you can visualize and configure your governance components."
      />
    </div>
  );
};

// Notify the Observer from other components
const AgentWrapButton = () => {
  const handleClick = () => {
    // Trigger business logic
    startAgentWrapping();
    
    // Notify Observer
    notifyObserver('agent-wrap');
  };
  
  return (
    <button onClick={handleClick}>
      Wrap Agent
    </button>
  );
};
```

## Integration with Navigation

The Observer Agent responds to navigation state changes:

```tsx
import { CollapsibleNavigation } from '../components/navigation/CollapsibleNavigation';
import { ObserverAgent } from '../components/observer/ObserverAgent';

const MainLayout = ({ children }) => {
  const [navExpanded, setNavExpanded] = useLocalStorage('navExpanded', false);
  
  const handleNavToggle = () => {
    const newState = !navExpanded;
    setNavExpanded(newState);
    
    // Dispatch event for Observer to respond to
    window.dispatchEvent(new CustomEvent('navStateChange', {
      detail: { expanded: newState }
    }));
  };
  
  return (
    <div className="app-container">
      <CollapsibleNavigation
        items={navItems}
        logo={<Logo />}
        logoText="Promethios"
        onNavItemClick={handleNavItemClick}
        onToggle={handleNavToggle}
      />
      <main className="main-content">
        {children}
      </main>
      
      {/* Observer is manually invoked in governance-relevant screens only */}
      {isGovernanceRelevantScreen() && (
        <ObserverAgent />
      )}
    </div>
  );
};
```

## When to Use Observer

The Observer Agent should only be manually invoked in screens where governance is relevant:

- Agent Wrapping Wizard
- Multi-Agent Configuration
- Governance Explorer
- Trust Metrics Dashboard
- Settings pages related to governance

Do NOT include the Observer in:

- Login/Authentication screens
- User profile pages
- Non-governance related dashboards
- Documentation pages (unless specifically about governance)

## Props

| Prop | Type | Description |
|------|------|-------------|
| `expertiseLevel` | `'novice' \| 'intermediate' \| 'expert'` | Level of detail in Observer messages |
| `initialMessage` | `string` | Default message to display |
| `onMessageClick` | `(message: ObserverMessage) => void` | Callback when message is clicked |
| `className` | `string` | Optional CSS class name for styling |

## Message Types

The Observer responds to different types of events with contextually appropriate messages:

- `nav-collapse`: When navigation is collapsed
- `nav-expand`: When navigation is expanded
- `agent-wrap`: When agent wrapping process begins
- `error`: When an error occurs
- `info`: General information messages
- `default`: Default state messages

## Accessibility

The ObserverAgent component is built with accessibility in mind:

- Keyboard navigation support
- ARIA attributes for screen readers
- Focus management
- Proper contrast ratios

## Browser Support

- Chrome (latest 2 versions)
- Firefox (latest 2 versions)
- Safari (latest 2 versions)
- Edge (latest 2 versions)

## Performance Considerations

- Minimized by default on mobile devices
- Efficient state management with useLocalStorage hook
- Timeout-based message resets to avoid unnecessary renders

## Testing

The component includes comprehensive test coverage:

- Unit tests for the component and its hooks
- Accessibility testing
- Integration tests with the main UI
- Browser compatibility testing

Run tests with:

```bash
npm test -- --testPathPattern=components/observer
```

## Known Issues and Limitations

- Memory items are limited to the most recent 3 items
- Very long messages may be truncated
- Custom styling may require additional CSS overrides

## Integration Verification

Before using this component in production, verify:

1. The Observer is manually invoked on each screen, not globally attached
2. Observer only appears in governance-relevant screens
3. Messages adapt correctly based on expertise level
4. Memory items persist between sessions
5. The component responds appropriately to navigation state changes
6. No conflicts with existing styles or behaviors
7. Proper responsive behavior on all supported devices

## Backward Compatibility

This extension module maintains backward compatibility with the existing UI by:

1. Following the established component patterns
2. Using the same styling variables and themes
3. Not modifying any kernel code
4. Being manually invoked rather than globally attached
5. Maintaining a consistent visual language with the rest of the UI

## Dependencies

- React 17+
- styled-components 5+
- TypeScript 4.5+
