# Observer Agent Presence Guidelines

## Overview

This document defines the guidelines for when and where the Observer Agent should appear in the Promethios UI. The Observer is a governance conscience that maintains a consistent presence whenever agents are acting, thinking, or being aligned - not just a tooltip that appears sporadically.

## Observer Presence Rules

### Observer SHOULD appear on:

1. **Agent Wrapping Workflows**
   - All steps of the agent wrapping wizard
   - Agent configuration screens
   - Agent testing interfaces

2. **Multi-Agent Coordination**
   - Relationship configuration screens
   - Multi-agent testing environments
   - Governance hierarchy visualization

3. **Dashboards with Trust Metrics**
   - Any dashboard showing trust scores
   - Compliance metrics displays
   - Governance performance indicators
   - Agent behavior analytics

4. **Educational Content**
   - All tutorials related to governance
   - Onboarding flows for new users
   - Help documentation for governance features
   - Interactive learning modules

5. **Governance Explorer**
   - All views and sub-sections
   - Visualization tools
   - Configuration interfaces

6. **Testing Environments**
   - Agent sandboxes
   - Playgrounds
   - Simulation environments
   - Any screen where agent behavior is visible

### Observer should NOT appear on:

1. **Utility Screens**
   - User profile management
   - Account settings
   - Billing and subscription pages
   - Theme and appearance settings
   - Notification preferences

2. **System Administration**
   - API key management
   - System logs without UI context
   - Pure configuration screens
   - Backend service management

3. **Non-Governance Content**
   - Marketing pages
   - Documentation unrelated to governance
   - User management (unless related to governance roles)

## Implementation Details

The Observer's presence is controlled by the `shouldShowObserver()` function in the `MainLayout` component. This function:

1. Maintains explicit lists of paths where Observer should and should not appear
2. Checks the current path against these lists
3. Respects the `showObserver` prop for manual overrides
4. Ensures Observer appears consistently across related screens

## Emotional UX Considerations

The Observer's presence should:

1. Feel like a consistent companion in trust-anchored contexts
2. Maintain continuity as users move between related governance screens
3. Not intrude on purely utilitarian tasks
4. Reappear when users return to trust-related contexts
5. Provide contextually relevant guidance based on the current screen

## Testing Requirements

When implementing or modifying Observer presence:

1. Verify Observer appears on all required screens
2. Verify Observer does not appear on excluded screens
3. Test transitions between screens to ensure proper appearance/disappearance
4. Validate that Observer provides contextually appropriate messages

## Extending These Guidelines

When adding new screens or features:

1. Determine if the screen involves cognitive interpretation, trust reflection, or role-based behavior
2. If yes, ensure Observer is present with appropriate contextual awareness
3. If no, ensure Observer is not present
4. Update the path lists in `shouldShowObserver()` accordingly
5. Document the decision in the feature documentation
