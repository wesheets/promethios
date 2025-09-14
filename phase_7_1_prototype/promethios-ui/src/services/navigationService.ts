/**
 * Navigation Service
 * Provides navigation utilities for the TopRightUtilityBar
 */

export class NavigationService {
  private static navigate: ((path: string) => void) | null = null;

  static setNavigate(navigateFunction: (path: string) => void) {
    this.navigate = navigateFunction;
  }

  static navigateToProfile() {
    if (this.navigate) {
      this.navigate('/profile');
    } else {
      // Fallback to window.location if navigate is not available
      window.location.href = '/profile';
    }
  }

  static navigateToPreferences() {
    if (this.navigate) {
      this.navigate('/preferences');
    } else {
      window.location.href = '/preferences';
    }
  }

  static navigateToOrganization() {
    if (this.navigate) {
      this.navigate('/organization');
    } else {
      window.location.href = '/organization';
    }
  }

  static navigateToIntegrations() {
    if (this.navigate) {
      this.navigate('/integrations');
    } else {
      window.location.href = '/integrations';
    }
  }

  static navigateToDataManagement() {
    if (this.navigate) {
      this.navigate('/data-management');
    } else {
      window.location.href = '/data-management';
    }
  }

  static navigateToApiKeys() {
    if (this.navigate) {
      this.navigate('/api-keys');
    } else {
      window.location.href = '/api-keys';
    }
  }

  static navigateToDocumentation() {
    if (this.navigate) {
      this.navigate('/documentation');
    } else {
      window.location.href = '/documentation';
    }
  }

  static navigateToGuidedTours() {
    if (this.navigate) {
      this.navigate('/guided-tours');
    } else {
      window.location.href = '/guided-tours';
    }
  }

  static navigateToSupport() {
    if (this.navigate) {
      this.navigate('/support');
    } else {
      window.location.href = '/support';
    }
  }

  static logout() {
    // Clear any stored authentication data
    localStorage.removeItem('authToken');
    sessionStorage.clear();
    
    // Navigate to login or home page
    if (this.navigate) {
      this.navigate('/');
    } else {
      window.location.href = '/';
    }
  }
}

export default NavigationService;

