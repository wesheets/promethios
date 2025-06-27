# Agent Wrapping Workflow Analysis

## Current State Analysis

### 1. MultiAgentWrapper Component (`ui/multi-agent-wrapper/MultiAgentWrapper.tsx`)

**Purpose**: This appears to be the main multi-agent system creation component

**Key Features Found**:
- Stepper workflow with steps: ['Basic Info', 'Agent Selection', 'Flow Configuration', 'Governance Rules', 'Review & Create']
- Uses AgentContext for wrapped agents state
- Has demo team templates functionality
- API_BASE_URL configured to: 'https://promethios-phase-7-1-api.onrender.com'

**State Management**:
```typescript
const [activeTeams, setActiveTeams] = useState<MultiAgentTeam[]>([]);
const [activeStep, setActiveStep] = useState(0);
const [newTeam, setNewTeam] = useState({
  name: '',
  description: '',
  workflow: 'pipeline',
  governance_enabled: true,
  selected_agents: []
});
```

**Backend Integration Points**:
- Uses API_BASE_URL for backend calls
- Should connect to `/api/multi_agent_system/*` endpoints
- Needs to call agent registration and team creation APIs

### 2. AgentWrapper Component (`ui/agent-wrapper/AgentWrapper.tsx`)

**Purpose**: Individual agent wrapping functionality

**Need to analyze**: How this connects to backend agent registration

### 3. AgentContext (`ui/context/AgentContext.tsx`)

**Purpose**: State management for wrapped agents

**Key Features**:
- Manages wrappedAgents array
- Stores in localStorage
- Provides addWrappedAgent, removeWrappedAgent, updateWrappedAgent functions

### 4. Backend API Endpoints Available

**Agent Management** (`src/api/agents/routes.py`):
- POST `/api/agents/register` - Register new agent
- GET `/api/agents/{agent_id}/profile` - Get agent profile
- GET `/api/agents/{agent_id}/scorecard` - Get agent scorecard

**Multi-Agent System** (`src/api/multi_agent_system/routes.py`):
- POST `/context` - Create multi-agent context
- POST `/message` - Send agent messages
- Various collaboration and flow services

**Multi-Agent Coordination** (`src/api/multi_agent/routes.py`):
- POST `/multi_agent/context` - Create coordination context
- POST `/multi_agent/message` - Agent messaging

## Workflow Analysis Needed

### Step 1: Individual Agent Wrapping
- **Component**: AgentWrapper
- **Backend**: `/api/agents/register`
- **Flow**: User configures agent → Register with governance → Store in AgentContext

### Step 2: Multi-Agent Dashboard
- **Component**: Need to identify (might be MultiAgentWrapper dashboard view)
- **Backend**: Get existing multi-agent systems
- **Flow**: Show created systems, metrics, "Create Multi-Agent System" button

### Step 3: Agent Selection (My Agents)
- **Component**: Need to identify
- **Backend**: Get user's wrapped agents
- **Flow**: Show available agents → Select multiple → Start multi-agent creation

### Step 4: Multi-Agent Creation Stepper
- **Component**: MultiAgentWrapper stepper
- **Backend**: `/api/multi_agent_system/context`
- **Flow**: Basic Info → Agent Selection → Flow Config → Governance → Review → Create

## Missing Connections Identified

1. **Routing**: Components not properly routed to URLs shown in screenshots
2. **API Integration**: Frontend components may not be calling correct backend endpoints
3. **State Flow**: Need to verify data flows between components and backend
4. **Navigation**: Missing proper navigation between workflow steps

## Next Steps for Analysis

1. Examine AgentWrapper component in detail
2. Find the My Agents/agent selection component
3. Identify the multi-agent dashboard component
4. Map exact API calls needed for each step
5. Verify routing configuration matches expected URLs



## AgentWrapper Component Analysis

**Location**: `ui/agent-wrapper/AgentWrapper.tsx`

**Purpose**: Individual agent wrapping functionality

**Key Features**:
- Demo agents available for wrapping
- Uses AgentContext for state management
- API_BASE_URL: 'https://promethios-phase-7-1-api.onrender.com'
- Handles wrapping of individual agents with governance

**Demo Agents Available**:
- Helpful Assistant (OpenAI GPT-3.5)
- Code Specialist (OpenAI GPT-4) 
- Business Analyst (Anthropic Claude-3)
- Creative Writer

**Backend Integration**:
- Should call `/api/agents/register` endpoint
- Stores wrapped agents in AgentContext
- Persists to localStorage

## Missing Components Identified

**Issue**: The dashboard metrics shown in screenshots ("Total Systems: 0", "Active Systems: 0", "Governance Issues: 0") are not found in any existing components.

**Possible Solutions**:
1. These metrics need to be added to an existing component
2. There's a missing dashboard component that needs to be created
3. The MultiAgentWrapper component needs to be modified to show these metrics

## Component Mapping to Screenshots

**Screenshot 1 - Multi-Agent Wrapping Dashboard**:
- URL: `/ui/agents/multi-wrapping`
- Expected Component: MultiAgentWrapper (but needs dashboard view)
- Missing: Dashboard metrics, system listing

**Screenshot 2 - My Agents Page**:
- URL: `/ui/agents/profiles` 
- Expected Component: Unknown - not found yet
- Missing: Agent listing with selection capability

## Backend API Mapping

**Individual Agent Wrapping**:
- Frontend: AgentWrapper component
- Backend: POST `/api/agents/register`
- Data Flow: Agent config → Register → Store in AgentContext

**Multi-Agent System Creation**:
- Frontend: MultiAgentWrapper stepper
- Backend: POST `/api/multi_agent_system/context`
- Data Flow: Selected agents → System config → Create context

**Agent Listing/Selection**:
- Frontend: Missing component
- Backend: GET `/api/agents/` (may need to be implemented)
- Data Flow: Fetch user's agents → Display for selection

