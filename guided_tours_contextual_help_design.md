# Guided Tours and Contextual Help System Design

## 1. Overview

This document outlines the design for the Guided Tours and Contextual Help system in the Promethios platform. This system will provide interactive guidance to users, helping them understand complex governance concepts, learn new features, and navigate the platform efficiently. The design ensures integration with both the left navigation and header navigation bars, while maintaining accessibility and mobile responsiveness.

## 2. Core Objectives

- **User Onboarding**: Guide new users through initial platform setup and core features
- **Feature Discovery**: Help users discover and understand advanced features
- **Contextual Assistance**: Provide relevant help based on the user's current context
- **Governance Education**: Explain complex AI governance concepts in an interactive way
- **Self-Service Learning**: Enable users to explore features at their own pace

## 3. Architecture

### 3.1 Core Components

1. **TourService**: The main service responsible for managing tour definitions, progress tracking, and playback.
2. **TourRegistry**: Manages available tours and their metadata.
3. **ContextualHelpService**: Provides context-aware help content based on user location and actions.
4. **HelpContentRegistry**: Manages help content for different parts of the application.

```typescript
// Core service interfaces

interface TourService {
  initialize(): Promise<void>;
  startTour(tourId: string): Promise<boolean>;
  pauseTour(): Promise<void>;
  resumeTour(): Promise<boolean>;
  endTour(): Promise<void>;
  getCurrentTour(): Tour | null;
  getCurrentStep(): TourStep | null;
  goToNextStep(): Promise<boolean>;
  goToPreviousStep(): Promise<boolean>;
  goToStep(stepIndex: number): Promise<boolean>;
  getTourProgress(tourId: string): Promise<TourProgress>;
  getAllTourProgress(): Promise<Record<string, TourProgress>>;
}

interface Tour {
  id: string;
  title: string;
  description: string;
  category: TourCategory;
  steps: TourStep[];
  requiredRoles?: string[];
  requiredFeatures?: string[];
  estimatedDuration: number; // in minutes
  version: string;
}

interface TourStep {
  id: string;
  title: string;
  content: string;
  target: string; // CSS selector or element ID
  position: 'top' | 'right' | 'bottom' | 'left' | 'center';
  spotlightRadius?: number;
  spotlightPadding?: number;
  disableOverlayClose?: boolean;
  disableOverlayMove?: boolean;
  highlightTarget?: boolean;
  requiredAction?: TourAction;
  beforeShowCallback?: () => Promise<void>;
  afterShowCallback?: () => Promise<void>;
}

interface TourAction {
  type: 'click' | 'input' | 'navigation' | 'custom';
  target?: string;
  value?: string;
  customValidator?: () => Promise<boolean>;
}

interface TourProgress {
  tourId: string;
  completed: boolean;
  lastStepIndex: number;
  completedAt?: Date;
  startedAt: Date;
}

interface ContextualHelpService {
  initialize(): Promise<void>;
  getHelpForContext(context: HelpContext): Promise<HelpContent[]>;
  getHelpForElement(elementId: string): Promise<HelpContent | null>;
  getHelpForRoute(route: string): Promise<HelpContent[]>;
  searchHelp(query: string): Promise<HelpContent[]>;
}

interface HelpContext {
  route: string;
  section?: string;
  elementId?: string;
  userRole?: string;
  userAction?: string;
}

interface HelpContent {
  id: string;
  title: string;
  content: string;
  contentType: 'text' | 'html' | 'markdown' | 'video' | 'image';
  tags: string[];
  relatedContent?: string[];
  lastUpdated: Date;
}
```

### 3.2 Data Flow

- **Tour Playback**: TourService -> UI Components -> User Interaction -> TourService
- **Contextual Help**: User Action -> ContextualHelpService -> HelpContentRegistry -> UI Components

## 4. UI Components

### 4.1 Tour Guide Component

The main component for displaying guided tours:

```typescript
interface TourGuideProps {
  onClose?: () => void;
  onComplete?: () => void;
  autoStart?: boolean;
  tourId?: string;
}

class TourGuide extends React.Component<TourGuideProps, TourGuideState> {
  private tourService: TourService;
  
  constructor(props: TourGuideProps) {
    super(props);
    this.tourService = new TourService();
    this.state = {
      currentTour: null,
      currentStep: null,
      isPlaying: false,
      loading: true,
      error: null
    };
  }
  
  async componentDidMount() {
    await this.tourService.initialize();
    
    if (this.props.tourId && this.props.autoStart) {
      this.startTour(this.props.tourId);
    }
    
    this.setState({ loading: false });
  }
  
  startTour = async (tourId: string) => {
    try {
      const success = await this.tourService.startTour(tourId);
      if (success) {
        this.setState({
          currentTour: this.tourService.getCurrentTour(),
          currentStep: this.tourService.getCurrentStep(),
          isPlaying: true
        });
      }
    } catch (error) {
      this.setState({ error: error.message });
    }
  };
  
  handleNext = async () => {
    const success = await this.tourService.goToNextStep();
    if (success) {
      this.setState({
        currentStep: this.tourService.getCurrentStep()
      });
    } else {
      // Tour completed
      this.handleComplete();
    }
  };
  
  handlePrevious = async () => {
    const success = await this.tourService.goToPreviousStep();
    if (success) {
      this.setState({
        currentStep: this.tourService.getCurrentStep()
      });
    }
  };
  
  handleClose = () => {
    this.tourService.pauseTour();
    this.setState({ isPlaying: false });
    if (this.props.onClose) {
      this.props.onClose();
    }
  };
  
  handleComplete = () => {
    this.tourService.endTour();
    this.setState({
      isPlaying: false,
      currentTour: null,
      currentStep: null
    });
    if (this.props.onComplete) {
      this.props.onComplete();
    }
  };
  
  render() {
    const { currentTour, currentStep, isPlaying, loading, error } = this.state;
    
    if (loading) {
      return <div className="tour-guide-loading">Loading tour...</div>;
    }
    
    if (error) {
      return <div className="tour-guide-error">Error: {error}</div>;
    }
    
    if (!isPlaying || !currentTour || !currentStep) {
      return null;
    }
    
    return (
      <div className="tour-guide">
        <div className="tour-overlay" onClick={currentStep.disableOverlayClose ? undefined : this.handleClose}></div>
        
        {currentStep.highlightTarget && (
          <div className="tour-spotlight" style={this.calculateSpotlightStyle()}></div>
        )}
        
        <div className="tour-tooltip" style={this.calculateTooltipPosition()}>
          <div className="tour-header">
            <div className="tour-progress">
              Step {currentTour.steps.indexOf(currentStep) + 1} of {currentTour.steps.length}
            </div>
            <button className="tour-close" onClick={this.handleClose}>×</button>
          </div>
          
          <div className="tour-content">
            <h3>{currentStep.title}</h3>
            <div dangerouslySetInnerHTML={{ __html: currentStep.content }}></div>
          </div>
          
          <div className="tour-footer">
            <button 
              className="tour-previous" 
              onClick={this.handlePrevious}
              disabled={currentTour.steps.indexOf(currentStep) === 0}
            >
              Previous
            </button>
            <button className="tour-next" onClick={this.handleNext}>
              {currentTour.steps.indexOf(currentStep) === currentTour.steps.length - 1 ? 'Finish' : 'Next'}
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  private calculateSpotlightStyle() {
    // Calculate position and size of spotlight based on target element
    // Implementation details omitted for brevity
    return {};
  }
  
  private calculateTooltipPosition() {
    // Calculate position of tooltip based on target element and position preference
    // Implementation details omitted for brevity
    return {};
  }
}
```

### 4.2 Help Panel Component

A component for displaying contextual help:

```typescript
interface HelpPanelProps {
  context?: HelpContext;
  onClose?: () => void;
  initialQuery?: string;
}

class HelpPanel extends React.Component<HelpPanelProps, HelpPanelState> {
  private helpService: ContextualHelpService;
  
  constructor(props: HelpPanelProps) {
    super(props);
    this.helpService = new ContextualHelpService();
    this.state = {
      helpContent: [],
      searchQuery: props.initialQuery || '',
      loading: true,
      error: null
    };
  }
  
  async componentDidMount() {
    await this.helpService.initialize();
    this.loadHelpContent();
  }
  
  async componentDidUpdate(prevProps: HelpPanelProps) {
    if (JSON.stringify(prevProps.context) !== JSON.stringify(this.props.context)) {
      this.loadHelpContent();
    }
  }
  
  loadHelpContent = async () => {
    this.setState({ loading: true });
    
    try {
      let content: HelpContent[] = [];
      
      if (this.state.searchQuery) {
        content = await this.helpService.searchHelp(this.state.searchQuery);
      } else if (this.props.context) {
        content = await this.helpService.getHelpForContext(this.props.context);
      }
      
      this.setState({
        helpContent: content,
        loading: false
      });
    } catch (error) {
      this.setState({
        error: error.message,
        loading: false
      });
    }
  };
  
  handleSearch = async (query: string) => {
    this.setState({ searchQuery: query });
    
    if (query) {
      this.setState({ loading: true });
      try {
        const content = await this.helpService.searchHelp(query);
        this.setState({
          helpContent: content,
          loading: false
        });
      } catch (error) {
        this.setState({
          error: error.message,
          loading: false
        });
      }
    } else {
      this.loadHelpContent();
    }
  };
  
  render() {
    const { helpContent, searchQuery, loading, error } = this.state;
    
    return (
      <div className="help-panel">
        <div className="help-header">
          <h2>Help & Resources</h2>
          <button className="help-close" onClick={this.props.onClose}>×</button>
        </div>
        
        <div className="help-search">
          <input 
            type="text" 
            placeholder="Search for help..." 
            value={searchQuery}
            onChange={e => this.handleSearch(e.target.value)}
          />
        </div>
        
        <div className="help-content">
          {loading ? (
            <div className="help-loading">Loading help content...</div>
          ) : error ? (
            <div className="help-error">Error: {error}</div>
          ) : helpContent.length === 0 ? (
            <div className="help-empty">No help content found.</div>
          ) : (
            helpContent.map(item => (
              <div key={item.id} className="help-item">
                <h3>{item.title}</h3>
                {item.contentType === 'markdown' ? (
                  <MarkdownRenderer content={item.content} />
                ) : item.contentType === 'html' ? (
                  <div dangerouslySetInnerHTML={{ __html: item.content }}></div>
                ) : item.contentType === 'video' ? (
                  <VideoPlayer src={item.content} />
                ) : item.contentType === 'image' ? (
                  <img src={item.content} alt={item.title} />
                ) : (
                  <p>{item.content}</p>
                )}
                {item.relatedContent && item.relatedContent.length > 0 && (
                  <div className="help-related">
                    <h4>Related Topics</h4>
                    <ul>
                      {item.relatedContent.map(relatedId => (
                        <li key={relatedId}>
                          <a href="#" onClick={() => this.loadRelatedContent(relatedId)}>
                            {this.getRelatedContentTitle(relatedId)}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    );
  }
  
  private loadRelatedContent(contentId: string) {
    // Implementation details omitted for brevity
  }
  
  private getRelatedContentTitle(contentId: string): string {
    // Implementation details omitted for brevity
    return "Related content";
  }
}
```

### 4.3 Help Button Component

A component for accessing contextual help from anywhere in the application:

```typescript
interface HelpButtonProps {
  context?: HelpContext;
  placement?: 'header' | 'inline' | 'floating';
}

class HelpButton extends React.Component<HelpButtonProps, HelpButtonState> {
  constructor(props: HelpButtonProps) {
    super(props);
    this.state = {
      isHelpOpen: false
    };
  }
  
  toggleHelp = () => {
    this.setState(prevState => ({
      isHelpOpen: !prevState.isHelpOpen
    }));
  };
  
  render() {
    const { placement = 'inline', context } = this.props;
    const { isHelpOpen } = this.state;
    
    return (
      <>
        <button 
          className={`help-button help-button-${placement}`}
          onClick={this.toggleHelp}
          aria-label="Get help"
          aria-expanded={isHelpOpen}
        >
          <span className="help-icon">?</span>
          {placement !== 'floating' && <span className="help-text">Help</span>}
        </button>
        
        {isHelpOpen && (
          <HelpPanel 
            context={context} 
            onClose={this.toggleHelp} 
          />
        )}
      </>
    );
  }
}
```

### 4.4 Tour Launcher Component

A component for launching guided tours:

```typescript
interface TourLauncherProps {
  tours?: Tour[];
  placement?: 'header' | 'sidebar' | 'inline' | 'floating';
}

class TourLauncher extends React.Component<TourLauncherProps, TourLauncherState> {
  private tourService: TourService;
  
  constructor(props: TourLauncherProps) {
    super(props);
    this.tourService = new TourService();
    this.state = {
      availableTours: props.tours || [],
      isMenuOpen: false,
      activeTourId: null,
      loading: !props.tours,
      error: null
    };
  }
  
  async componentDidMount() {
    if (!this.props.tours) {
      await this.loadAvailableTours();
    }
  }
  
  loadAvailableTours = async () => {
    try {
      await this.tourService.initialize();
      const tourRegistry = TourRegistry.getInstance();
      const availableTours = tourRegistry.getAvailableTours();
      
      this.setState({
        availableTours,
        loading: false
      });
    } catch (error) {
      this.setState({
        error: error.message,
        loading: false
      });
    }
  };
  
  toggleMenu = () => {
    this.setState(prevState => ({
      isMenuOpen: !prevState.isMenuOpen
    }));
  };
  
  startTour = (tourId: string) => {
    this.setState({
      activeTourId: tourId,
      isMenuOpen: false
    });
  };
  
  handleTourClose = () => {
    this.setState({ activeTourId: null });
  };
  
  handleTourComplete = () => {
    this.setState({ activeTourId: null });
  };
  
  render() {
    const { placement = 'inline' } = this.props;
    const { availableTours, isMenuOpen, activeTourId, loading, error } = this.state;
    
    if (loading) {
      return <div className="tour-launcher-loading">Loading tours...</div>;
    }
    
    if (error) {
      return <div className="tour-launcher-error">Error: {error}</div>;
    }
    
    return (
      <>
        <div className={`tour-launcher tour-launcher-${placement}`}>
          <button 
            className="tour-launcher-button"
            onClick={this.toggleMenu}
            aria-label="Guided tours"
            aria-expanded={isMenuOpen}
          >
            <span className="tour-icon">🔍</span>
            {placement !== 'floating' && <span className="tour-text">Tours</span>}
          </button>
          
          {isMenuOpen && (
            <div className="tour-menu">
              <h3>Available Tours</h3>
              {availableTours.length === 0 ? (
                <div className="tour-empty">No tours available.</div>
              ) : (
                <ul className="tour-list">
                  {availableTours.map(tour => (
                    <li key={tour.id} className="tour-item">
                      <button onClick={() => this.startTour(tour.id)}>
                        <span className="tour-item-title">{tour.title}</span>
                        <span className="tour-item-duration">{tour.estimatedDuration} min</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
        
        {activeTourId && (
          <TourGuide 
            tourId={activeTourId} 
            autoStart={true}
            onClose={this.handleTourClose}
            onComplete={this.handleTourComplete}
          />
        )}
      </>
    );
  }
}
```

## 5. Tour and Help Content Management

### 5.1 Tour Definition Format

Tours are defined using a structured format:

```typescript
// Example tour definition
const governanceOverviewTour: Tour = {
  id: 'governance-overview',
  title: 'Governance Dashboard Overview',
  description: 'Learn about the key features of the Governance Dashboard',
  category: 'governance',
  steps: [
    {
      id: 'intro',
      title: 'Welcome to the Governance Dashboard',
      content: 'This tour will guide you through the key features of the Governance Dashboard.',
      target: '#governance-dashboard',
      position: 'center',
      highlightTarget: true
    },
    {
      id: 'metrics-overview',
      title: 'Governance Metrics',
      content: 'These metrics provide an overview of your governance status.',
      target: '.governance-metrics',
      position: 'bottom',
      highlightTarget: true
    },
    {
      id: 'violations-panel',
      title: 'Violations Panel',
      content: 'This panel shows recent governance violations that need attention.',
      target: '.violations-panel',
      position: 'right',
      highlightTarget: true
    },
    {
      id: 'policy-management',
      title: 'Policy Management',
      content: 'Click here to manage your governance policies.',
      target: '.policy-button',
      position: 'bottom',
      highlightTarget: true,
      requiredAction: {
        type: 'click',
        target: '.policy-button'
      }
    },
    {
      id: 'conclusion',
      title: 'Tour Complete',
      content: 'You\'ve completed the Governance Dashboard tour. Explore the dashboard to learn more.',
      target: '#governance-dashboard',
      position: 'center'
    }
  ],
  requiredRoles: ['admin', 'governance_manager'],
  estimatedDuration: 3,
  version: '1.0'
};
```

### 5.2 Help Content Format

Help content is defined using a structured format:

```typescript
// Example help content
const governanceDashboardHelp: HelpContent = {
  id: 'governance-dashboard',
  title: 'Governance Dashboard',
  content: `
# Governance Dashboard

The Governance Dashboard provides a comprehensive view of your AI governance status.

## Key Features

- **Metrics Overview**: High-level governance metrics
- **Violations Panel**: Recent governance violations
- **Policy Management**: Create and manage governance policies
- **Compliance Reports**: Generate compliance reports

## Getting Started

1. Review your governance metrics
2. Address any violations
3. Update policies as needed
4. Generate compliance reports regularly
  `,
  contentType: 'markdown',
  tags: ['governance', 'dashboard', 'metrics', 'violations', 'policies'],
  relatedContent: ['governance-policies', 'compliance-reports', 'trust-metrics'],
  lastUpdated: new Date('2025-05-15')
};
```

## 6. Navigation Integration

### 6.1 Left Navigation Integration

- **Help & Tours Section**: A dedicated section in the left navigation for accessing help resources and guided tours.
- **Context-Aware Help**: Help button appears in relevant sections of the left navigation.

```typescript
// Example left navigation integration
const leftNavItems = [
  // ... other navigation items
  {
    id: 'help',
    label: 'Help & Resources',
    icon: 'question-circle',
    children: [
      {
        id: 'guided-tours',
        label: 'Guided Tours',
        route: '/help/tours',
        icon: 'map-signs'
      },
      {
        id: 'help-center',
        label: 'Help Center',
        route: '/help/center',
        icon: 'book'
      },
      {
        id: 'documentation',
        label: 'Documentation',
        route: '/help/docs',
        icon: 'file-alt'
      }
    ]
  }
];
```

### 6.2 Header Navigation Integration

- **Help Button**: A help button in the header navigation for quick access to contextual help.
- **Tour Button**: A tour button in the header navigation for launching guided tours.

```typescript
// Example header navigation integration
function HeaderNavigation() {
  const { currentRoute } = useRouter();
  const helpContext = useHelpContext(); // Custom hook to get current context
  
  return (
    <header className="header-nav">
      {/* ... other header elements */}
      
      <div className="header-right">
        {/* ... other right-aligned elements */}
        
        <HelpButton 
          placement="header" 
          context={helpContext} 
        />
        
        <TourLauncher 
          placement="header" 
        />
      </div>
    </header>
  );
}
```

## 7. Firebase Integration

### 7.1 Tour Progress Tracking

Tour progress is stored in Firebase to persist across sessions:

```typescript
// Firebase integration for tour progress
class FirebaseTourProgressManager {
  private firestore: firebase.firestore.Firestore;
  private auth: firebase.auth.Auth;
  private currentUser: firebase.User | null = null;
  
  constructor(firebaseApp: firebase.app.App) {
    this.firestore = firebaseApp.firestore();
    this.auth = firebaseApp.auth();
    this.auth.onAuthStateChanged(user => {
      this.currentUser = user;
    });
  }
  
  async saveTourProgress(progress: TourProgress): Promise<boolean> {
    if (!this.currentUser) return false;
    
    try {
      await this.firestore
        .collection('userTourProgress')
        .doc(this.currentUser.uid)
        .collection('tours')
        .doc(progress.tourId)
        .set({
          completed: progress.completed,
          lastStepIndex: progress.lastStepIndex,
          completedAt: progress.completedAt ? firebase.firestore.Timestamp.fromDate(progress.completedAt) : null,
          startedAt: firebase.firestore.Timestamp.fromDate(progress.startedAt),
          updatedAt: firebase.firestore.Timestamp.now()
        });
      
      return true;
    } catch (error) {
      console.error('Error saving tour progress:', error);
      return false;
    }
  }
  
  async getTourProgress(tourId: string): Promise<TourProgress | null> {
    if (!this.currentUser) return null;
    
    try {
      const doc = await this.firestore
        .collection('userTourProgress')
        .doc(this.currentUser.uid)
        .collection('tours')
        .doc(tourId)
        .get();
      
      if (!doc.exists) return null;
      
      const data = doc.data();
      return {
        tourId,
        completed: data.completed,
        lastStepIndex: data.lastStepIndex,
        completedAt: data.completedAt ? data.completedAt.toDate() : undefined,
        startedAt: data.startedAt.toDate()
      };
    } catch (error) {
      console.error('Error getting tour progress:', error);
      return null;
    }
  }
  
  async getAllTourProgress(): Promise<Record<string, TourProgress>> {
    if (!this.currentUser) return {};
    
    try {
      const snapshot = await this.firestore
        .collection('userTourProgress')
        .doc(this.currentUser.uid)
        .collection('tours')
        .get();
      
      const progress: Record<string, TourProgress> = {};
      
      snapshot.forEach(doc => {
        const data = doc.data();
        progress[doc.id] = {
          tourId: doc.id,
          completed: data.completed,
          lastStepIndex: data.lastStepIndex,
          completedAt: data.completedAt ? data.completedAt.toDate() : undefined,
          startedAt: data.startedAt.toDate()
        };
      });
      
      return progress;
    } catch (error) {
      console.error('Error getting all tour progress:', error);
      return {};
    }
  }
}
```

### 7.2 Help Content Storage

Help content can be stored in Firebase for easy updates:

```typescript
// Firebase integration for help content
class FirebaseHelpContentProvider {
  private firestore: firebase.firestore.Firestore;
  
  constructor(firebaseApp: firebase.app.App) {
    this.firestore = firebaseApp.firestore();
  }
  
  async getHelpContent(contentId: string): Promise<HelpContent | null> {
    try {
      const doc = await this.firestore
        .collection('helpContent')
        .doc(contentId)
        .get();
      
      if (!doc.exists) return null;
      
      const data = doc.data();
      return {
        id: doc.id,
        title: data.title,
        content: data.content,
        contentType: data.contentType,
        tags: data.tags,
        relatedContent: data.relatedContent,
        lastUpdated: data.lastUpdated.toDate()
      };
    } catch (error) {
      console.error('Error getting help content:', error);
      return null;
    }
  }
  
  async searchHelpContent(query: string): Promise<HelpContent[]> {
    try {
      // Note: For production, consider using a dedicated search service like Algolia
      const snapshot = await this.firestore
        .collection('helpContent')
        .where('tags', 'array-contains-any', query.toLowerCase().split(' '))
        .get();
      
      const results: HelpContent[] = [];
      
      snapshot.forEach(doc => {
        const data = doc.data();
        results.push({
          id: doc.id,
          title: data.title,
          content: data.content,
          contentType: data.contentType,
          tags: data.tags,
          relatedContent: data.relatedContent,
          lastUpdated: data.lastUpdated.toDate()
        });
      });
      
      return results;
    } catch (error) {
      console.error('Error searching help content:', error);
      return [];
    }
  }
}
```

## 8. Mobile Responsiveness

### 8.1 Tour Guide Responsiveness

The Tour Guide component adapts to different screen sizes:

- **Mobile**: Full-screen overlay with simplified controls
- **Tablet**: Positioned tooltip with appropriate sizing
- **Desktop**: Standard tooltip with full content

```css
/* Example responsive styles for tour guide */
.tour-guide {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1000;
}

.tour-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
}

.tour-tooltip {
  position: absolute;
  background-color: white;
  border-radius: 4px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
  padding: 20px;
  max-width: 400px;
  
  @media (max-width: 768px) {
    max-width: 90%;
    width: 90%;
    left: 5% !important;
    right: 5% !important;
  }
  
  @media (max-width: 480px) {
    max-width: 100%;
    width: 100%;
    left: 0 !important;
    right: 0 !important;
    bottom: 0 !important;
    border-radius: 4px 4px 0 0;
  }
}
```

### 8.2 Help Panel Responsiveness

The Help Panel component adapts to different screen sizes:

- **Mobile**: Full-screen panel with simplified layout
- **Tablet**: Slide-in panel with scrollable content
- **Desktop**: Standard panel with full content

```css
/* Example responsive styles for help panel */
.help-panel {
  position: fixed;
  background-color: white;
  box-shadow: -2px 0 10px rgba(0, 0, 0, 0.1);
  z-index: 900;
  
  @media (min-width: 992px) {
    top: 60px;
    right: 0;
    bottom: 0;
    width: 400px;
  }
  
  @media (min-width: 768px) and (max-width: 991px) {
    top: 50px;
    right: 0;
    bottom: 0;
    width: 350px;
  }
  
  @media (max-width: 767px) {
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;
    width: 100%;
  }
}
```

## 9. Accessibility

### 9.1 Keyboard Navigation

All tour and help components support keyboard navigation:

- **Tab**: Navigate between interactive elements
- **Enter/Space**: Activate buttons
- **Escape**: Close tour or help panel
- **Arrow Keys**: Navigate between tour steps

### 9.2 Screen Reader Support

All components include proper ARIA attributes:

- **aria-label**: Descriptive labels for buttons and controls
- **aria-live**: Announcements for tour steps and help content
- **aria-expanded**: State of expandable elements
- **aria-hidden**: Hide decorative elements from screen readers

### 9.3 Focus Management

Focus is properly managed during tour playback:

- Focus is trapped within the tour tooltip when active
- Focus returns to the triggering element when tour ends
- Focus is properly managed when navigating between steps

## 10. Extension Points

```typescript
// Register a custom tour
ExtensionRegistry.registerExtensionPoint("tours:tour", {
  register: (tour: Tour) => TourRegistry.registerTour(tour),
});

// Register help content
ExtensionRegistry.registerExtensionPoint("help:content", {
  register: (content: HelpContent) => HelpContentRegistry.registerContent(content),
});

// Register a custom tour step renderer
ExtensionRegistry.registerExtensionPoint("tours:stepRenderer", {
  register: (renderer: TourStepRenderer) => TourStepRendererRegistry.registerRenderer(renderer),
});
```

## 11. Implementation Plan

### 11.1 Phase 1: Core Infrastructure
1. Implement `TourService` and `TourRegistry`
2. Implement `ContextualHelpService` and `HelpContentRegistry`
3. Set up Firebase integration for tour progress and help content
4. Implement basic UI components (TourGuide, HelpPanel)

### 11.2 Phase 2: Navigation Integration
1. Integrate with left navigation bar
2. Integrate with header navigation bar
3. Implement context-aware help button
4. Implement tour launcher

### 11.3 Phase 3: Content Creation
1. Create guided tours for key features
2. Create help content for different sections
3. Implement search functionality for help content
4. Create role-based tour recommendations

### 11.4 Phase 4: Refinement and Testing
1. Ensure mobile responsiveness
2. Implement accessibility features
3. Test with different user roles
4. Gather feedback and refine

## 12. Next Steps

1. Begin implementation of `TourService` and `TourRegistry`
2. Create initial tour definitions for key features
3. Implement the TourGuide component
4. Integrate with the navigation system
