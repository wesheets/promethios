# User Preference Management Module Design

## 1. Overview

This document outlines the design for the User Preference Management module in the Promethios platform. This module provides granular, role-based, and context-aware customization options for users, covering settings for notifications, chat modes, UI layouts, and other user-specific configurations. It will be tightly integrated with Firebase for authentication, data persistence, and real-time updates.

## 2. Core Components

### 2.1 UserPreferenceService

The central service for managing user preferences:

```typescript
class UserPreferenceService {
  private firebaseApp: firebase.app.App;
  private firestore: firebase.firestore.Firestore;
  private auth: firebase.auth.Auth;
  private currentUser: firebase.User | null = null;
  private preferenceListeners: Map<string, () => void> = new Map(); // For real-time updates

  // Initialize the service with Firebase app instance
  async initialize(firebaseApp: firebase.app.App): Promise<boolean> {
    this.firebaseApp = firebaseApp;
    this.firestore = firebaseApp.firestore();
    this.auth = firebaseApp.auth();

    // Listen to auth state changes to update currentUser
    this.auth.onAuthStateChanged(user => {
      this.currentUser = user;
      // Re-fetch preferences or notify listeners if user changes
      this.preferenceListeners.forEach(unsubscribe => unsubscribe()); // Unsubscribe old listeners
      this.preferenceListeners.clear();
      if (user) {
        // Potentially re-register listeners for the new user
      }
    });
    this.currentUser = this.auth.currentUser;
    return true;
  }

  // Get a specific preference value for the current user
  async getPreference<T>(key: string, defaultValue?: T): Promise<T | undefined> {
    if (!this.currentUser) return defaultValue;
    try {
      const docRef = this.firestore.collection("userPreferences").doc(this.currentUser.uid);
      const doc = await docRef.get();
      if (doc.exists) {
        const preferences = doc.data() as Record<string, any>;
        return preferences[key] !== undefined ? (preferences[key] as T) : defaultValue;
      }
      return defaultValue;
    } catch (error) {
      console.error("Error getting preference:", key, error);
      return defaultValue;
    }
  }

  // Set a specific preference value for the current user
  async setPreference<T>(key: string, value: T): Promise<boolean> {
    if (!this.currentUser) return false;
    try {
      const docRef = this.firestore.collection("userPreferences").doc(this.currentUser.uid);
      await docRef.set({ [key]: value }, { merge: true });
      return true;
    } catch (error) {
      console.error("Error setting preference:", key, value, error);
      return false;
    }
  }

  // Get all preferences for the current user
  async getAllPreferences(): Promise<Record<string, any> | null> {
    if (!this.currentUser) return null;
    try {
      const docRef = this.firestore.collection("userPreferences").doc(this.currentUser.uid);
      const doc = await docRef.get();
      return doc.exists ? doc.data() : null;
    } catch (error) {
      console.error("Error getting all preferences:", error);
      return null;
    }
  }

  // Set multiple preferences for the current user
  async setAllPreferences(preferences: Record<string, any>): Promise<boolean> {
    if (!this.currentUser) return false;
    try {
      const docRef = this.firestore.collection("userPreferences").doc(this.currentUser.uid);
      await docRef.set(preferences, { merge: true });
      return true;
    } catch (error) {
      console.error("Error setting all preferences:", error);
      return false;
    }
  }

  // Watch for changes to a specific preference (real-time)
  watchPreference<T>(key: string, callback: (value: T | undefined) => void): () => void {
    if (!this.currentUser) {
      // Call with undefined or default if no user
      callback(undefined);
      return () => {}; // No-op unsubscribe
    }
    const docRef = this.firestore.collection("userPreferences").doc(this.currentUser.uid);
    const unsubscribe = docRef.onSnapshot(
      (doc) => {
        const preferences = doc.data() as Record<string, any> | undefined;
        callback(preferences?.[key] as T | undefined);
      },
      (error) => {
        console.error("Error watching preference:", key, error);
        callback(undefined); // Notify callback of error/undefined state
      }
    );
    const listenerId = `pref_${key}_${Date.now()}`;
    this.preferenceListeners.set(listenerId, unsubscribe);
    return () => {
      unsubscribe();
      this.preferenceListeners.delete(listenerId);
    };
  }

  // Watch for changes to all preferences (real-time)
  watchAllPreferences(callback: (preferences: Record<string, any> | null) => void): () => void {
    if (!this.currentUser) {
      callback(null);
      return () => {};
    }
    const docRef = this.firestore.collection("userPreferences").doc(this.currentUser.uid);
    const unsubscribe = docRef.onSnapshot(
      (doc) => {
        callback(doc.exists ? doc.data() : null);
      },
      (error) => {
        console.error("Error watching all preferences:", error);
        callback(null);
      }
    );
    const listenerId = `all_prefs_${Date.now()}`;
    this.preferenceListeners.set(listenerId, unsubscribe);
    return () => {
      unsubscribe();
      this.preferenceListeners.delete(listenerId);
    };
  }

  // Get role-based default preferences (can be stored in a separate Firestore collection or config)
  async getRoleDefaultPreferences(role: string): Promise<Record<string, any> | null> {
    try {
      const docRef = this.firestore.collection("roleDefaultPreferences").doc(role);
      const doc = await docRef.get();
      return doc.exists ? doc.data() : null;
    } catch (error) {
      console.error("Error getting role default preferences for role:", role, error);
      return null;
    }
  }
}

// Example Preference Structure (stored in Firestore `userPreferences/{userId}`)
interface UserPreferencesDocument {
  // Notification Preferences
  notifications?: {
    enableToasts?: boolean;
    enableSounds?: boolean;
    toastPosition?: string; // e.g., 'top-right'
    toastDuration?: number; // ms
    // Filter which notification types are active for this user
    typeFilters?: {
      [key in NotificationType]?: boolean;
    };
    // Filter which notification priorities are active
    priorityFilters?: {
      [key in NotificationPriority]?: boolean;
    };
  };
  // Chat Preferences
  chat?: {
    defaultMode?: ChatMode; // 'governance', 'standard', 'multi-agent'
    preserveContextOnModeSwitch?: boolean;
    fontSize?: string; // e.g., 'small', 'medium', 'large'
    theme?: string; // e.g., 'light', 'dark'
  };
  // UI Layout Preferences
  uiLayout?: {
    sidebarState?: string; // 'expanded', 'collapsed'
    dashboardWidgets?: string[]; // Array of widget IDs and their order
    density?: string; // 'compact', 'comfortable'
  };
  // Accessibility Preferences
  accessibility?: {
    highContrastMode?: boolean;
    reduceMotion?: boolean;
    fontSizeMultiplier?: number; // e.g., 1.2 for 20% larger
  };
  // Feature-specific preferences
  featureToggles?: {
    [featureKey: string]: boolean; // User-level overrides for feature toggles
  };
  // Other module-specific preferences can be added here
  // e.g., observerAgent.showHoverBubble = false
  [moduleKey: string]: Record<string, any>;
}
```

### 2.2 PreferenceRegistry

Manages the definition and schema of available preferences, allowing modules to register their preferences.

```typescript
interface PreferenceDefinition {
  key: string; // e.g., "notifications.enableToasts"
  label: string; // Human-readable label for UI, e.g., "Enable Toast Notifications"
  description?: string;
  type: "boolean" | "string" | "number" | "enum" | "object";
  defaultValue: any;
  options?: string[]; // For 'enum' type
  category: string; // e.g., "Notifications", "Chat", "UI Layout"
  module: string; // Module that owns this preference, e.g., "NotificationSystem"
  rolesAllowed?: string[]; // Roles that can see/modify this preference
  isContextAware?: boolean; // If true, its value might depend on context (e.g., current agent)
}

class PreferenceRegistry {
  private definitions: Map<string, PreferenceDefinition> = new Map();

  registerPreference(definition: PreferenceDefinition): boolean {
    if (this.definitions.has(definition.key)) {
      console.warn(`Preference with key ${definition.key} already registered.`);
      return false;
    }
    this.definitions.set(definition.key, definition);
    return true;
  }

  getPreferenceDefinition(key: string): PreferenceDefinition | undefined {
    return this.definitions.get(key);
  }

  getAllDefinitions(): PreferenceDefinition[] {
    return Array.from(this.definitions.values());
  }

  getDefinitionsByCategory(category: string): PreferenceDefinition[] {
    return Array.from(this.definitions.values()).filter(def => def.category === category);
  }

  getDefinitionsByModule(module: string): PreferenceDefinition[] {
    return Array.from(this.definitions.values()).filter(def => def.module === module);
  }
}
```

## 3. UI Components

### 3.1 UserPreferencesDashboard

A central UI for users to manage their preferences.
- Route: `/settings/preferences` or `/profile/preferences`
- Organized by categories (Notifications, Chat, UI Layout, Accessibility, etc.).
- Dynamically renders controls based on `PreferenceDefinition`s from `PreferenceRegistry`.
- Shows only preferences relevant to the user's role.
- Saves changes using `UserPreferenceService`.

```typescript
interface UserPreferencesDashboardProps {
  // Firebase app instance for UserPreferenceService initialization
  firebaseApp: firebase.app.App;
}

class UserPreferencesDashboard extends React.Component<UserPreferencesDashboardProps, UserPreferencesDashboardState> {
  private preferenceService: UserPreferenceService;
  private preferenceRegistry: PreferenceRegistry; // Assume this is globally available or passed as prop

  constructor(props: UserPreferencesDashboardProps) {
    super(props);
    this.preferenceService = new UserPreferenceService();
    this.preferenceRegistry = new PreferenceRegistry(); // Or get instance
    this.state = {
      preferences: {},
      definitions: [],
      loading: true,
      error: null,
      saving: false,
      currentUserRole: null, // To be fetched based on Firebase Auth
    };
  }

  async componentDidMount() {
    await this.preferenceService.initialize(this.props.firebaseApp);
    // Fetch current user role from Firebase Auth custom claims or another source
    // const userRole = await getCurrentUserRole(this.props.firebaseApp.auth());
    // this.setState({ currentUserRole: userRole });

    const definitions = this.preferenceRegistry.getAllDefinitions();
    // Filter definitions based on currentUserRole if rolesAllowed is set
    const relevantDefinitions = definitions.filter(def => 
      !def.rolesAllowed || def.rolesAllowed.includes(this.state.currentUserRole || 
      // Fallback if role not found, show all or hide restricted?
      "") 
    );
    this.setState({ definitions: relevantDefinitions });

    this.loadPreferences();
  }

  loadPreferences = async () => {
    this.setState({ loading: true });
    const prefs = await this.preferenceService.getAllPreferences();
    this.setState({ preferences: prefs || {}, loading: false });
  };

  handlePreferenceChange = (key: string, value: any) => {
    this.setState(prevState => ({
      preferences: {
        ...prevState.preferences,
        [key]: value,
      },
    }));
  };

  handleSavePreferences = async () => {
    this.setState({ saving: true, error: null });
    const success = await this.preferenceService.setAllPreferences(this.state.preferences);
    if (success) {
      // Show success message
    } else {
      this.setState({ error: "Failed to save preferences." });
    }
    this.setState({ saving: false });
  };

  renderPreferenceControl(definition: PreferenceDefinition) {
    const value = this.state.preferences[definition.key] !== undefined 
                  ? this.state.preferences[definition.key] 
                  : definition.defaultValue;
    // Render appropriate input based on definition.type (boolean -> checkbox/toggle, enum -> select, etc.)
    // Example for boolean:
    if (definition.type === "boolean") {
      return (
        <label key={definition.key}>
          {definition.label}
          <input 
            type="checkbox" 
            checked={!!value} 
            onChange={e => this.handlePreferenceChange(definition.key, e.target.checked)} 
          />
          {definition.description && <small>{definition.description}</small>}
        </label>
      );
    }
    // Add cases for other types: string, number, enum (select dropdown)
    return <div key={definition.key}>Unsupported preference type: {definition.type} for {definition.key}</div>;
  }

  render() {
    const { definitions, loading, error, saving } = this.state;
    if (loading) return <div>Loading preferences...</div>;
    if (error) return <div style={{color: "red"}}>{error}</div>;

    const categories = [...new Set(definitions.map(def => def.category))];

    return (
      <div className="user-preferences-dashboard">
        <h1>User Preferences</h1>
        {categories.map(category => (
          <section key={category}>
            <h2>{category}</h2>
            {definitions.filter(def => def.category === category).map(def => this.renderPreferenceControl(def))}
          </section>
        ))}
        <button onClick={this.handleSavePreferences} disabled={saving}>
          {saving ? "Saving..." : "Save Preferences"}
        </button>
      </div>
    );
  }
}
```

## 4. Firebase Integration

### 4.1 Authentication
- `firebase.auth()` will be used to identify the current user.
- User preferences will be stored per user ID (`uid`).
- User roles (from custom claims or a separate roles collection) will be used to filter available preferences and apply role-based defaults.

### 4.2 Firestore for Data Persistence
- A `userPreferences` collection will store documents where each document ID is a `userId`.
  - Example path: `userPreferences/{userId}`
  - Each document contains key-value pairs of preferences.
- A `roleDefaultPreferences` collection can store default settings for different user roles.
  - Example path: `roleDefaultPreferences/{roleName}`

### 4.3 Firestore Security Rules
- Users can only read and write their own preferences document.
  ```firestore.rules
  match /userPreferences/{userId} {
    allow read, write: if request.auth != null && request.auth.uid == userId;
  }
  match /roleDefaultPreferences/{roleName} {
    allow read: if request.auth != null; // Or more specific role-based read access
  }
  ```

### 4.4 Real-time Updates
- `onSnapshot` listeners will be used by `UserPreferenceService` to provide real-time updates to subscribed components or services when preferences change in Firestore.
- This ensures that if a user changes a preference on one device/tab, it reflects immediately on others.

## 5. Extension Points

```typescript
// Register a preference definition
ExtensionRegistry.registerExtensionPoint("preferences:definition", {
  register: (definition: PreferenceDefinition) => PreferenceRegistry.registerPreference(definition),
});

// Allow modules to get/set preferences programmatically
ExtensionRegistry.registerExtensionPoint("preferences:serviceApi", {
  get: <T>(key: string, defaultValue?: T) => UserPreferenceService.getPreference<T>(key, defaultValue),
  set: <T>(key: string, value: T) => UserPreferenceService.setPreference<T>(key, value),
  watch: <T>(key: string, callback: (value: T | undefined) => void) => UserPreferenceService.watchPreference<T>(key, callback),
});
```

## 6. Integration with Other Systems

- **Notification System**: Users can customize which notifications they receive, their delivery method (toast, center), and sounds via preferences.
- **Chat System**: Preferences for default chat mode, UI theme, font size.
- **UI Layout**: Preferences for sidebar state, dashboard widget configuration, UI density.
- **Feature Toggles**: User-level overrides for feature toggles can be managed as preferences.
- **Accessibility Module**: Preferences for high contrast, reduce motion, font size multipliers.

## 7. State Management

- The `UserPreferenceService` will be the source of truth for preferences, fetching from and saving to Firebase.
- UI components will subscribe to preference changes via `watchPreference` or `watchAllPreferences` to update reactively.
- Global state management (e.g., Redux, Zustand) can hold a copy of current preferences for easy access by various components, synced by the `UserPreferenceService`.

## 8. Accessibility and Mobile Responsiveness

- The `UserPreferencesDashboard` UI will be fully accessible (keyboard navigation, ARIA attributes, screen reader compatibility).
- The dashboard will be responsive, adapting to different screen sizes for easy preference management on mobile devices.

## 9. Implementation Plan

### 9.1 Phase 1: Core Service & Firebase Integration
1. Implement `UserPreferenceService` with Firebase Auth and Firestore integration (get, set, watch methods).
2. Define Firestore security rules for `userPreferences` and `roleDefaultPreferences`.
3. Implement `PreferenceRegistry` for defining preference schemas.

### 9.2 Phase 2: Basic Preferences UI
1. Implement `UserPreferencesDashboard` UI with basic rendering for boolean and string preferences.
2. Allow users to view and save their preferences.
3. Integrate with Firebase for loading/saving.

### 9.3 Phase 3: Role-Based & Context-Aware Preferences
1. Implement logic for fetching and applying role-based default preferences.
2. Enhance `UserPreferencesDashboard` to filter preferences based on user role.
3. Design mechanism for context-aware preferences (if needed, this might be complex and deferred).

### 9.4 Phase 4: Integration with Key Modules
1. Integrate notification preferences with the `NotificationSystem`.
2. Integrate chat preferences with the `ChatSystem`.
3. Integrate UI layout preferences.

### 9.5 Phase 5: Advanced UI & Extensibility
1. Implement UI controls for all preference types (enum, number, object).
2. Implement extension points for modules to register their preferences.
3. Refine accessibility and mobile responsiveness of the dashboard.

### 9.6 Phase 6: Testing and Documentation
1. Write unit and integration tests for services and UI components.
2. Test real-time updates and cross-device syncing.
3. Document the preference system, available preferences, and extension points.

## 10. Review of Previous Designs for Firebase Integration

- **Notification System**: Firebase Cloud Messaging (FCM) can be used for push notifications. User-specific notification preferences (which ones to receive via push) will be stored via `UserPreferenceService`.
- **Chat System**: Chat history and user-specific chat settings (theme, etc.) can be stored in Firestore. Real-time features of chat (new messages) can leverage Firestore real-time listeners or Firebase Realtime Database.
- **Extension System**: Configuration for enabled/disabled extensions at a user or organizational level could be stored in Firestore.
- **Agent Scorecard & Identity**: Agent configurations, attestations, and scorecard templates/results could be stored in Firestore, with appropriate security rules.
- **Onboarding Flow**: User progress through onboarding can be tracked in their `userPreferences` document or a separate Firestore collection.

This review will be conducted in parallel with the development of the User Preference Management module to ensure a cohesive Firebase strategy across the platform.

## 11. Next Steps

1. Set up Firebase project and configure Firestore and Authentication.
2. Begin implementation of `UserPreferenceService` and `PreferenceRegistry`.
3. Start developing the `UserPreferencesDashboard` UI.
4. Define initial set of preferences for notifications and chat.

