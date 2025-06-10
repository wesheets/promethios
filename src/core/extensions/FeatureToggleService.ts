/**
 * FeatureToggleService.ts
 * 
 * A service for managing feature toggles in the Promethios UI.
 * This system allows for gradual rollout of features and A/B testing.
 */

import { FirebaseApp } from 'firebase/app';
import { 
  Firestore, 
  getFirestore, 
  doc, 
  getDoc, 
  setDoc, 
  onSnapshot,
  DocumentSnapshot 
} from 'firebase/firestore';

export interface FeatureToggle {
  id: string;
  enabled: boolean;
  description?: string;
  group?: string;
  userOverrides?: Record<string, boolean>;
  rolloutPercentage?: number;
  expiresAt?: string;
}

export interface FeatureToggleOptions {
  persistToLocalStorage?: boolean;
  syncWithFirestore?: boolean;
  localStorageKey?: string;
  firestoreCollection?: string;
  firestoreDocument?: string;
}

/**
 * Service for managing feature toggles throughout the application.
 * Supports local storage persistence and Firestore synchronization.
 */
export class FeatureToggleService {
  private static instance: FeatureToggleService;
  private toggles: Record<string, FeatureToggle> = {};
  private listeners: Record<string, Set<(enabled: boolean) => void>> = {};
  private firestore: Firestore | null = null;
  private unsubscribeFirestore: (() => void) | null = null;
  private options: FeatureToggleOptions;
  private userId: string | null = null;

  private constructor(options: FeatureToggleOptions = {}) {
    this.options = {
      persistToLocalStorage: true,
      syncWithFirestore: false,
      localStorageKey: 'promethios_feature_toggles',
      firestoreCollection: 'config',
      firestoreDocument: 'featureToggles',
      ...options
    };

    this.loadFromLocalStorage();
  }

  /**
   * Get the singleton instance of the FeatureToggleService
   */
  public static getInstance(options?: FeatureToggleOptions): FeatureToggleService {
    if (!FeatureToggleService.instance) {
      FeatureToggleService.instance = new FeatureToggleService(options);
    } else if (options) {
      FeatureToggleService.instance.updateOptions(options);
    }
    return FeatureToggleService.instance;
  }

  /**
   * Update service options
   * @param options New options to apply
   */
  public updateOptions(options: Partial<FeatureToggleOptions>): void {
    this.options = {
      ...this.options,
      ...options
    };
  }

  /**
   * Initialize Firebase integration
   * @param app Firebase app instance
   * @param userId Current user ID for user-specific toggles
   */
  public initializeFirebase(app: FirebaseApp, userId?: string): void {
    if (this.firestore) {
      this.unsubscribeFromFirestore();
    }

    this.firestore = getFirestore(app);
    this.userId = userId || null;

    if (this.options.syncWithFirestore) {
      this.subscribeToFirestore();
    }
  }

  /**
   * Set the current user ID for user-specific toggles
   * @param userId User ID
   */
  public setUserId(userId: string | null): void {
    this.userId = userId;
    
    // Re-evaluate all toggles with the new user ID
    Object.keys(this.toggles).forEach(id => {
      const previousState = this.isEnabled(id);
      const newState = this.evaluateToggleState(this.toggles[id]);
      
      if (previousState !== newState) {
        this.notifyListeners(id, newState);
      }
    });
  }

  /**
   * Register a new feature toggle
   * @param toggle Feature toggle definition
   * @returns True if registration was successful
   */
  public registerToggle(toggle: FeatureToggle): boolean {
    if (this.toggles[toggle.id]) {
      console.warn(`Feature toggle ${toggle.id} already registered. Updating.`);
    }

    this.toggles[toggle.id] = toggle;
    this.persist();
    
    // Notify listeners of the current state
    this.notifyListeners(toggle.id, this.evaluateToggleState(toggle));
    
    console.log(`Registered feature toggle ${toggle.id}`);
    return true;
  }

  /**
   * Register multiple feature toggles
   * @param toggles Array of feature toggle definitions
   * @returns Number of successfully registered toggles
   */
  public registerToggles(toggles: FeatureToggle[]): number {
    let successCount = 0;
    
    toggles.forEach(toggle => {
      if (this.registerToggle(toggle)) {
        successCount++;
      }
    });
    
    return successCount;
  }

  /**
   * Unregister a feature toggle
   * @param toggleId ID of the toggle to unregister
   * @returns True if unregistration was successful
   */
  public unregisterToggle(toggleId: string): boolean {
    if (!this.toggles[toggleId]) {
      console.warn(`Feature toggle ${toggleId} not found. Cannot unregister.`);
      return false;
    }

    delete this.toggles[toggleId];
    this.persist();
    
    // Notify listeners that the toggle is gone (default to disabled)
    this.notifyListeners(toggleId, false);
    
    console.log(`Unregistered feature toggle ${toggleId}`);
    return true;
  }

  /**
   * Check if a feature toggle is enabled
   * @param toggleId ID of the toggle to check
   * @returns True if the toggle is enabled, false otherwise
   */
  public isEnabled(toggleId: string): boolean {
    const toggle = this.toggles[toggleId];
    if (!toggle) {
      console.warn(`Feature toggle ${toggleId} not found. Defaulting to disabled.`);
      return false;
    }

    return this.evaluateToggleState(toggle);
  }

  /**
   * Enable a feature toggle
   * @param toggleId ID of the toggle to enable
   * @param userSpecific Whether this is a user-specific override
   * @returns True if the operation was successful
   */
  public enable(toggleId: string, userSpecific: boolean = false): boolean {
    const toggle = this.toggles[toggleId];
    if (!toggle) {
      console.warn(`Feature toggle ${toggleId} not found. Cannot enable.`);
      return false;
    }

    if (userSpecific && this.userId) {
      if (!toggle.userOverrides) {
        toggle.userOverrides = {};
      }
      toggle.userOverrides[this.userId] = true;
    } else {
      toggle.enabled = true;
    }

    this.persist();
    this.notifyListeners(toggleId, true);
    
    console.log(`Enabled feature toggle ${toggleId}${userSpecific ? ' for user ' + this.userId : ''}`);
    return true;
  }

  /**
   * Disable a feature toggle
   * @param toggleId ID of the toggle to disable
   * @param userSpecific Whether this is a user-specific override
   * @returns True if the operation was successful
   */
  public disable(toggleId: string, userSpecific: boolean = false): boolean {
    const toggle = this.toggles[toggleId];
    if (!toggle) {
      console.warn(`Feature toggle ${toggleId} not found. Cannot disable.`);
      return false;
    }

    if (userSpecific && this.userId) {
      if (!toggle.userOverrides) {
        toggle.userOverrides = {};
      }
      toggle.userOverrides[this.userId] = false;
    } else {
      toggle.enabled = false;
    }

    this.persist();
    this.notifyListeners(toggleId, false);
    
    console.log(`Disabled feature toggle ${toggleId}${userSpecific ? ' for user ' + this.userId : ''}`);
    return true;
  }

  /**
   * Reset a user-specific override
   * @param toggleId ID of the toggle
   * @returns True if the operation was successful
   */
  public resetUserOverride(toggleId: string): boolean {
    const toggle = this.toggles[toggleId];
    if (!toggle || !this.userId || !toggle.userOverrides) {
      return false;
    }

    const hadOverride = toggle.userOverrides[this.userId] !== undefined;
    delete toggle.userOverrides[this.userId];
    
    if (hadOverride) {
      this.persist();
      const newState = this.evaluateToggleState(toggle);
      this.notifyListeners(toggleId, newState);
      
      console.log(`Reset user override for feature toggle ${toggleId}`);
    }
    
    return hadOverride;
  }

  /**
   * Get a feature toggle by ID
   * @param toggleId ID of the toggle to retrieve
   * @returns The requested toggle or undefined if not found
   */
  public getToggle(toggleId: string): FeatureToggle | undefined {
    return this.toggles[toggleId];
  }

  /**
   * Get all registered feature toggles
   * @returns Record of all registered toggles
   */
  public getAllToggles(): Record<string, FeatureToggle> {
    return { ...this.toggles };
  }

  /**
   * Get the state of all feature toggles
   * @returns Record mapping toggle IDs to their enabled state
   */
  public getFeatureState(): Record<string, boolean> {
    const state: Record<string, boolean> = {};
    
    Object.keys(this.toggles).forEach(id => {
      state[id] = this.isEnabled(id);
    });
    
    return state;
  }

  /**
   * Subscribe to changes in a feature toggle's state
   * @param toggleId ID of the toggle to subscribe to
   * @param listener Callback function to be called when the toggle's state changes
   * @returns Unsubscribe function
   */
  public subscribe(toggleId: string, listener: (enabled: boolean) => void): () => void {
    if (!this.listeners[toggleId]) {
      this.listeners[toggleId] = new Set();
    }
    
    this.listeners[toggleId].add(listener);
    
    // Immediately notify with current state
    const toggle = this.toggles[toggleId];
    if (toggle) {
      listener(this.evaluateToggleState(toggle));
    } else {
      listener(false);
    }
    
    return () => {
      if (this.listeners[toggleId]) {
        this.listeners[toggleId].delete(listener);
        if (this.listeners[toggleId].size === 0) {
          delete this.listeners[toggleId];
        }
      }
    };
  }

  /**
   * Evaluate the actual state of a toggle based on all factors
   * @param toggle Feature toggle to evaluate
   * @returns The effective enabled state
   */
  private evaluateToggleState(toggle: FeatureToggle): boolean {
    // Check if expired
    if (toggle.expiresAt) {
      const expiryDate = new Date(toggle.expiresAt);
      if (expiryDate < new Date()) {
        return false;
      }
    }
    
    // Check user-specific override
    if (this.userId && toggle.userOverrides && toggle.userOverrides[this.userId] !== undefined) {
      return toggle.userOverrides[this.userId];
    }
    
    // Check rollout percentage
    if (toggle.rolloutPercentage !== undefined && this.userId) {
      // Use a deterministic hash of the user ID to determine if they're in the rollout
      const hash = this.hashString(this.userId + toggle.id);
      const normalizedHash = (hash % 100 + 100) % 100; // Ensure positive 0-99 range
      
      if (normalizedHash >= toggle.rolloutPercentage) {
        return false;
      }
    }
    
    // Default to the toggle's enabled state
    return toggle.enabled;
  }

  /**
   * Simple string hashing function for rollout percentage calculation
   * @param str String to hash
   * @returns Hash value
   */
  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return hash;
  }

  /**
   * Notify all listeners of a toggle's state change
   * @param toggleId ID of the toggle
   * @param enabled New state
   */
  private notifyListeners(toggleId: string, enabled: boolean): void {
    if (this.listeners[toggleId]) {
      this.listeners[toggleId].forEach(listener => {
        try {
          listener(enabled);
        } catch (error) {
          console.error(`Error in feature toggle listener for ${toggleId}:`, error);
        }
      });
    }
  }

  /**
   * Persist the current state of all toggles
   */
  private persist(): void {
    if (this.options.persistToLocalStorage) {
      this.saveToLocalStorage();
    }
    
    if (this.options.syncWithFirestore && this.firestore) {
      this.saveToFirestore();
    }
  }

  /**
   * Save the current state to local storage
   */
  private saveToLocalStorage(): void {
    try {
      localStorage.setItem(
        this.options.localStorageKey!,
        JSON.stringify(this.toggles)
      );
    } catch (error) {
      console.error('Failed to save feature toggles to local storage:', error);
    }
  }

  /**
   * Load the state from local storage
   */
  private loadFromLocalStorage(): void {
    try {
      const stored = localStorage.getItem(this.options.localStorageKey!);
      if (stored) {
        const parsed = JSON.parse(stored);
        this.toggles = parsed;
      }
    } catch (error) {
      console.error('Failed to load feature toggles from local storage:', error);
    }
  }

  /**
   * Save the current state to Firestore
   */
  private async saveToFirestore(): Promise<void> {
    if (!this.firestore) return;
    
    try {
      const docRef = doc(
        this.firestore,
        this.options.firestoreCollection!,
        this.options.firestoreDocument!
      );
      
      await setDoc(docRef, this.toggles);
    } catch (error) {
      console.error('Failed to save feature toggles to Firestore:', error);
    }
  }

  /**
   * Subscribe to changes in Firestore
   */
  private subscribeToFirestore(): void {
    if (!this.firestore) return;
    
    try {
      const docRef = doc(
        this.firestore,
        this.options.firestoreCollection!,
        this.options.firestoreDocument!
      );
      
      this.unsubscribeFirestore = onSnapshot(docRef, (snapshot: DocumentSnapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data() as Record<string, FeatureToggle>;
          
          // Track which toggles changed state
          const changedToggles: Record<string, boolean> = {};
          
          // Update toggles from Firestore
          Object.keys(data).forEach(id => {
            const oldState = this.toggles[id] ? this.evaluateToggleState(this.toggles[id]) : false;
            this.toggles[id] = data[id];
            const newState = this.evaluateToggleState(data[id]);
            
            if (oldState !== newState) {
              changedToggles[id] = newState;
            }
          });
          
          // Notify listeners of state changes
          Object.entries(changedToggles).forEach(([id, enabled]) => {
            this.notifyListeners(id, enabled);
          });
          
          // Save to local storage if enabled
          if (this.options.persistToLocalStorage) {
            this.saveToLocalStorage();
          }
        }
      });
    } catch (error) {
      console.error('Failed to subscribe to feature toggles in Firestore:', error);
    }
  }

  /**
   * Unsubscribe from Firestore changes
   */
  private unsubscribeFromFirestore(): void {
    if (this.unsubscribeFirestore) {
      this.unsubscribeFirestore();
      this.unsubscribeFirestore = null;
    }
  }

  /**
   * Reset the service (primarily for testing purposes)
   */
  public reset(): void {
    this.toggles = {};
    this.listeners = {};
    this.unsubscribeFromFirestore();
    
    if (this.options.persistToLocalStorage) {
      try {
        localStorage.removeItem(this.options.localStorageKey!);
      } catch (error) {
        console.error('Failed to remove feature toggles from local storage:', error);
      }
    }
  }
}

export default FeatureToggleService;
