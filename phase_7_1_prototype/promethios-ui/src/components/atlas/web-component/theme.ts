/**
 * theme.ts
 * 
 * Theme utilities for the ATLAS plugin
 */

export interface AtlasTheme {
  '--atlas-primary-color': string;
  '--atlas-secondary-color': string;
  '--atlas-background-color': string;
  '--atlas-text-color': string;
  '--atlas-border-color': string;
  '--atlas-trust-high': string;
  '--atlas-trust-medium': string;
  '--atlas-trust-low': string;
}

/**
 * Create theme object based on theme name
 */
export const createAtlasTheme = (themeName: string): AtlasTheme => {
  switch (themeName) {
    case 'dark':
      return {
        '--atlas-primary-color': '#3a86ff',
        '--atlas-secondary-color': '#8338ec',
        '--atlas-background-color': '#1f2937',
        '--atlas-text-color': '#f9fafb',
        '--atlas-border-color': '#374151',
        '--atlas-trust-high': '#34d399',
        '--atlas-trust-medium': '#fbbf24',
        '--atlas-trust-low': '#f87171'
      };
    case 'light':
    default:
      return {
        '--atlas-primary-color': '#3a86ff',
        '--atlas-secondary-color': '#8338ec',
        '--atlas-background-color': '#ffffff',
        '--atlas-text-color': '#333333',
        '--atlas-border-color': '#e5e7eb',
        '--atlas-trust-high': '#10b981',
        '--atlas-trust-medium': '#f59e0b',
        '--atlas-trust-low': '#ef4444'
      };
  }
};

export default createAtlasTheme;
