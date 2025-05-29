/**
 * AtlasChatDocs.md
 * 
 * Documentation for the ATLAS Chat functionality
 */

# ATLAS Chat Documentation

## Overview

ATLAS Chat provides a conversational interface for the ATLAS Companion Agent, allowing users to interact with Promethios governance in a natural, dialogue-based manner. The chat functionality operates in two distinct modes:

1. **Public Mode**: Designed for the landing page, explaining Promethios governance to visitors
2. **Session Mode**: For logged-in users, providing agent-specific governance insights tied to active sessions

## Components

### Core Components

- **AtlasChat**: Base chat interface component with messaging capabilities
- **AtlasChatPublic**: Public-facing chat for landing page visitors
- **AtlasChatSession**: Session-based chat for logged-in users
- **AtlasChatProvider**: Context provider for managing chat state and mode switching
- **AtlasChatService**: Service for processing messages and managing conversation history

### Testing Components

- **AtlasChatDemo**: Interactive demo for testing both chat modes
- **AtlasChatTest**: Automated test suite for validating chat functionality

## Features

### Public Mode Features

- Explains Promethios governance concepts to visitors
- Provides analogies and examples to illustrate governance principles
- Answers questions about constitutional AI, PRISM, VIGIL, and other core modules
- Maintains appropriate knowledge boundaries to protect IP
- Offers real-world scenarios demonstrating governance value

### Session Mode Features

- Provides agent-specific governance insights
- Displays real-time metrics and trust scores
- Monitors for constitutional violations
- Explains governance in the context of the current agent session
- Adapts explanations based on agent type (assistant, researcher, creative)

## Integration

### Landing Page Integration

```tsx
import { AtlasChatPublic } from '../components/atlas/chat';

const LandingPage = () => {
  return (
    <div className="landing-page">
      {/* Landing page content */}
      
      {/* ATLAS Chat in public mode */}
      <AtlasChatPublic 
        position="bottom-right"
        theme="dark"
        initialOpen={false}
      />
    </div>
  );
};
```

### Agent Session Integration

```tsx
import { AtlasChatSession } from '../components/atlas/chat';

const AgentPage = ({ agentId, sessionId, agentType }) => {
  return (
    <div className="agent-page">
      {/* Agent interface content */}
      
      {/* ATLAS Chat in session mode */}
      <AtlasChatSession
        agentId={agentId}
        sessionId={sessionId}
        agentType={agentType}
        position="bottom-right"
        theme="dark"
        initialOpen={false}
        username={currentUser.name}
      />
    </div>
  );
};
```

### Application-Wide Integration

```tsx
import { AtlasChatProvider } from '../components/atlas/chat';

const App = () => {
  // Determine if user is logged in
  const isLoggedIn = useAuth().isLoggedIn;
  const currentUser = useAuth().user;
  
  // Get current agent session if available
  const { agentId, sessionId, agentType } = useAgentSession();
  
  return (
    <AtlasChatProvider
      isLoggedIn={isLoggedIn}
      username={currentUser?.name}
      initialAgentId={agentId}
      initialSessionId={sessionId}
      initialAgentType={agentType}
      position="bottom-right"
      theme="dark"
    >
      {/* Application routes */}
    </AtlasChatProvider>
  );
};
```

## Customization

### Theme Options

- `light`: Light theme with white background and dark text
- `dark`: Dark theme with navy background and light text

### Position Options

- `bottom-right`: Bottom right corner of the viewport (default)
- `bottom-left`: Bottom left corner of the viewport
- `top-right`: Top right corner of the viewport
- `top-left`: Top left corner of the viewport

## Testing

To test the ATLAS Chat functionality:

1. Use the `AtlasChatDemo` component to interactively test both modes
2. Run the automated tests with the `AtlasChatTest` component
3. Verify that responses include appropriate analogies and examples
4. Check that governance explanations are clear and conversational
5. Ensure session-based metrics are displayed correctly

## Best Practices

- Use public mode on landing pages and marketing materials
- Use session mode within the application after user login
- Ensure agent and session IDs are correctly passed to session mode
- Provide the appropriate agent type to customize governance explanations
- Use the context provider for application-wide chat management
