/**
 * CompatibilityManager.ts
 * 
 * Provides polyfills and compatibility features for ATLAS and Trust Shield
 * Ensures functionality across different browsers and environments
 */

export class CompatibilityManager {
  private static instance: CompatibilityManager;
  private features: Map<string, boolean> = new Map();
  
  /**
   * Get singleton instance
   */
  public static getInstance(): CompatibilityManager {
    if (!CompatibilityManager.instance) {
      CompatibilityManager.instance = new CompatibilityManager();
    }
    return CompatibilityManager.instance;
  }
  
  /**
   * Private constructor (use getInstance)
   */
  private constructor() {
    this.detectFeatures();
  }
  
  /**
   * Detect available browser features
   */
  private detectFeatures(): void {
    // Check for Shadow DOM support
    this.features.set('shadowDOM', !!HTMLElement.prototype.attachShadow);
    
    // Check for Custom Elements support
    this.features.set('customElements', !!window.customElements);
    
    // Check for ES6 features
    this.features.set('es6', this.checkES6Support());
    
    // Check for CSS Variables support
    this.features.set('cssVariables', this.checkCSSVariablesSupport());
    
    // Check for Intersection Observer support
    this.features.set('intersectionObserver', 'IntersectionObserver' in window);
    
    // Check for localStorage support
    this.features.set('localStorage', this.checkLocalStorageSupport());
    
    // Check for postMessage support
    this.features.set('postMessage', !!window.postMessage);
  }
  
  /**
   * Check for ES6 support
   */
  private checkES6Support(): boolean {
    try {
      // Test arrow functions
      eval('() => {}');
      
      // Test template literals
      eval('`test`');
      
      // Test destructuring
      eval('const { a } = { a: 1 }');
      
      return true;
    } catch (e) {
      return false;
    }
  }
  
  /**
   * Check for CSS Variables support
   */
  private checkCSSVariablesSupport(): boolean {
    try {
      const style = document.createElement('style');
      style.innerHTML = ':root { --test: 0; }';
      document.head.appendChild(style);
      
      const div = document.createElement('div');
      div.style.setProperty('--test', '1');
      document.body.appendChild(div);
      
      const support = !!getComputedStyle(div).getPropertyValue('--test');
      
      document.head.removeChild(style);
      document.body.removeChild(div);
      
      return support;
    } catch (e) {
      return false;
    }
  }
  
  /**
   * Check for localStorage support
   */
  private checkLocalStorageSupport(): boolean {
    try {
      localStorage.setItem('test', 'test');
      localStorage.removeItem('test');
      return true;
    } catch (e) {
      return false;
    }
  }
  
  /**
   * Check if a feature is supported
   */
  public isSupported(feature: string): boolean {
    return !!this.features.get(feature);
  }
  
  /**
   * Get all feature support status
   */
  public getSupportStatus(): Record<string, boolean> {
    const status: Record<string, boolean> = {};
    this.features.forEach((supported, feature) => {
      status[feature] = supported;
    });
    return status;
  }
  
  /**
   * Apply polyfills for missing features
   */
  public applyPolyfills(): void {
    // Shadow DOM polyfill
    if (!this.isSupported('shadowDOM')) {
      this.applyShadowDOMPolyfill();
    }
    
    // Custom Elements polyfill
    if (!this.isSupported('customElements')) {
      this.applyCustomElementsPolyfill();
    }
    
    // Intersection Observer polyfill
    if (!this.isSupported('intersectionObserver')) {
      this.applyIntersectionObserverPolyfill();
    }
    
    // localStorage polyfill
    if (!this.isSupported('localStorage')) {
      this.applyLocalStoragePolyfill();
    }
  }
  
  /**
   * Apply Shadow DOM polyfill
   */
  private applyShadowDOMPolyfill(): void {
    // In a real implementation, we would load a proper polyfill
    // For now, we'll create a simple fallback
    if (!HTMLElement.prototype.attachShadow) {
      HTMLElement.prototype.attachShadow = function() {
        const shadowRoot = document.createElement('div');
        shadowRoot.className = 'atlas-shadow-root';
        this.appendChild(shadowRoot);
        
        // Add basic shadow root API
        shadowRoot.host = this;
        
        return shadowRoot;
      } as any;
    }
  }
  
  /**
   * Apply Custom Elements polyfill
   */
  private applyCustomElementsPolyfill(): void {
    // In a real implementation, we would load a proper polyfill
    // For now, we'll create a simple fallback
    if (!window.customElements) {
      (window as any).customElements = {
        define: function(name: string, constructor: any) {
          // Create a simple registry
          if (!(window as any)._customElementsRegistry) {
            (window as any)._customElementsRegistry = {};
          }
          
          (window as any)._customElementsRegistry[name] = constructor;
          
          // Create elements for existing tags
          const elements = document.getElementsByTagName(name);
          for (let i = 0; i < elements.length; i++) {
            const element = elements[i];
            Object.setPrototypeOf(element, constructor.prototype);
            if (element.connectedCallback) {
              element.connectedCallback();
            }
          }
        }
      };
    }
  }
  
  /**
   * Apply Intersection Observer polyfill
   */
  private applyIntersectionObserverPolyfill(): void {
    // In a real implementation, we would load a proper polyfill
    // For now, we'll create a simple fallback
    if (!window.IntersectionObserver) {
      (window as any).IntersectionObserver = class {
        private callback: Function;
        private elements: Element[] = [];
        private interval: number | null = null;
        
        constructor(callback: Function) {
          this.callback = callback;
        }
        
        observe(element: Element): void {
          this.elements.push(element);
          
          if (!this.interval) {
            this.interval = window.setInterval(() => {
              this.checkVisibility();
            }, 300);
          }
        }
        
        unobserve(element: Element): void {
          this.elements = this.elements.filter(el => el !== element);
          
          if (this.elements.length === 0 && this.interval) {
            clearInterval(this.interval);
            this.interval = null;
          }
        }
        
        disconnect(): void {
          this.elements = [];
          
          if (this.interval) {
            clearInterval(this.interval);
            this.interval = null;
          }
        }
        
        private checkVisibility(): void {
          const entries = this.elements.map(element => {
            const rect = element.getBoundingClientRect();
            const isIntersecting = rect.top < window.innerHeight && rect.bottom > 0;
            
            return {
              target: element,
              isIntersecting,
              intersectionRatio: isIntersecting ? 1 : 0,
              boundingClientRect: rect,
              intersectionRect: isIntersecting ? rect : null,
              rootBounds: {
                top: 0,
                left: 0,
                right: window.innerWidth,
                bottom: window.innerHeight,
                width: window.innerWidth,
                height: window.innerHeight
              }
            };
          });
          
          if (entries.length > 0) {
            this.callback(entries, this);
          }
        }
      };
    }
  }
  
  /**
   * Apply localStorage polyfill
   */
  private applyLocalStoragePolyfill(): void {
    // In a real implementation, we would load a proper polyfill
    // For now, we'll create a simple fallback
    if (!window.localStorage) {
      const storage: Record<string, string> = {};
      
      (window as any).localStorage = {
        getItem: (key: string): string | null => {
          return key in storage ? storage[key] : null;
        },
        setItem: (key: string, value: string): void => {
          storage[key] = String(value);
        },
        removeItem: (key: string): void => {
          delete storage[key];
        },
        clear: (): void => {
          Object.keys(storage).forEach(key => {
            delete storage[key];
          });
        },
        key: (index: number): string | null => {
          const keys = Object.keys(storage);
          return index >= 0 && index < keys.length ? keys[index] : null;
        },
        length: 0
      };
      
      // Update length getter
      Object.defineProperty((window as any).localStorage, 'length', {
        get: () => Object.keys(storage).length
      });
    }
  }
  
  /**
   * Get recommended rendering strategy based on browser support
   */
  public getRecommendedStrategy(): 'shadow' | 'iframe' | 'direct' {
    if (this.isSupported('shadowDOM') && this.isSupported('customElements')) {
      return 'shadow'; // Use Shadow DOM (preferred)
    } else if (this.isSupported('postMessage')) {
      return 'iframe'; // Use iframe isolation
    } else {
      return 'direct'; // Direct DOM manipulation (fallback)
    }
  }
}

export default CompatibilityManager;
