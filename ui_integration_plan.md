# Promethios UI Integration Plan

## Overview

This document outlines the detailed plan for integrating the VigilObserver and Veritas components with the Promethios admin dashboard. The integration will be implemented incrementally, with testing and validation at each step to ensure stability and functionality.

## Integration Components

### Core Components
1. **VigilObserver** - Monitors trust decay and constitutional rule compliance
2. **Veritas Service** - Handles verification data and metrics
3. **Admin Dashboard** - Main UI for administration and monitoring

### Supporting Components
1. **ExtensionRegistry** - Manages extension points and implementations
2. **AdminDashboardContext** - Provides state and functionality for the admin dashboard
3. **AdminHeaderLink** - Renders the admin dashboard link in the main application header
4. **AnalyticsDashboard** - Displays analytics data and visualizations

## Integration Architecture

```
┌─────────────────────┐     ┌─────────────────────┐
│                     │     │                     │
│   VigilObserver     │     │   Veritas Service   │
│                     │     │                     │
└─────────┬───────────┘     └─────────┬───────────┘
          │                           │
          │                           │
┌─────────▼───────────────────────────▼───────────┐
│                                                 │
│              Extension Registry                 │
│                                                 │
└─────────────────────────┬─────────────────────┬─┘
                          │                     │
                          │                     │
┌─────────────────────────▼─┐   ┌───────────────▼─────────────┐
│                           │   │                             │
│  Admin Dashboard Context  │   │    Analytics Dashboard      │
│                           │   │                             │
└───────────┬───────────────┘   └─────────────────────────────┘
            │                                 ▲
            │                                 │
┌───────────▼───────────────┐   ┌─────────────┴─────────────┐
│                           │   │                           │
│  Admin Dashboard Layout   ├───►    Admin Header Link      │
│                           │   │                           │
└───────────────────────────┘   └───────────────────────────┘
```

## Incremental Integration Steps

### Phase 1: Extension Registry Integration

1. **Register VigilObserver with ExtensionRegistry**
   - Create extension point for VigilObserver
   - Register VigilObserver implementation
   - Set up data access methods

2. **Connect Veritas Service with ExtensionRegistry**
   - Ensure Veritas extension points are properly registered
   - Create connection points between VigilObserver and Veritas

### Phase 2: Admin Header Link Integration

1. **Add Governance Section to Admin Header**
   - Update AdminHeaderLink component to include governance section
   - Add navigation to governance dashboard

2. **Create Governance Dashboard Link**
   - Add link to AdminDashboardLayout navigation
   - Set up routing for governance dashboard

### Phase 3: Dashboard Context Integration

1. **Extend AdminDashboardContext**
   - Add governance state to context
   - Create methods for accessing VigilObserver and Veritas data

2. **Implement Data Loading**
   - Add data loading functions for governance metrics
   - Set up state management for governance data

### Phase 4: Analytics Dashboard Integration

1. **Create Governance Metrics Section**
   - Add governance metrics cards to AnalyticsDashboard
   - Implement data visualization for compliance metrics

2. **Implement Violations Table**
   - Create table component for displaying violations
   - Add filtering and sorting capabilities

3. **Add Compliance Status Visualization**
   - Create compliance status visualization component
   - Implement real-time updates for compliance status

### Phase 5: Veritas Integration

1. **Create Veritas Dashboard Section**
   - Implement verification metrics display
   - Add verification history table

2. **Add Verification Comparison Tool**
   - Create UI for comparing governed vs. ungoverned text
   - Implement visualization for verification differences

3. **Implement Emotional Analysis Display**
   - Add emotional tone analysis visualization
   - Create trust signals display component

## Detailed Implementation Plan

### 1. Extension Registry Integration

#### 1.1 Register VigilObserver with ExtensionRegistry

```typescript
// src/core/extensions/vigilObserverExtension.ts

import { ExtensionRegistry } from './ExtensionRegistry';
import { VigilObserver } from '../observers/vigil';

export interface VigilObserverExtensionPoint {
  getObservations: (options: any) => Promise<any[]>;
  getMetrics: (category?: string) => any;
  getViolations: (ruleId?: string, severity?: string) => any[];
  getEnforcements: (action?: string, ruleId?: string) => any[];
  analyzeComplianceStatus: (options?: any) => any;
}

export const registerVigilObserverExtension = () => {
  const extensionRegistry = ExtensionRegistry.getInstance();
  
  // Register extension point
  const vigilObserverExtensionPoint = extensionRegistry.registerExtensionPoint<VigilObserverExtensionPoint>(
    'vigilObserver',
    '1.0.0'
  );
  
  // Create implementation
  const vigilObserverImplementation: VigilObserverExtensionPoint = {
    getObservations: async (options) => {
      const vigilObserver = new VigilObserver();
      // Implementation details
      return [];
    },
    getMetrics: (category) => {
      const vigilObserver = new VigilObserver();
      return vigilObserver.getMetrics(category);
    },
    getViolations: (ruleId, severity) => {
      const vigilObserver = new VigilObserver();
      return vigilObserver.getViolations(ruleId, severity);
    },
    getEnforcements: (action, ruleId) => {
      const vigilObserver = new VigilObserver();
      return vigilObserver.getEnforcements(action, ruleId);
    },
    analyzeComplianceStatus: (options) => {
      const vigilObserver = new VigilObserver();
      return vigilObserver.analyzeComplianceStatus(options);
    }
  };
  
  // Register implementation
  vigilObserverExtensionPoint.register(
    vigilObserverImplementation,
    'default',
    {
      name: 'Default VigilObserver Implementation',
      version: '1.0.0',
      description: 'Default implementation of VigilObserver extension point'
    }
  );
  
  // Set as default implementation
  vigilObserverExtensionPoint.setDefaultImplementation('default');
};
```

#### 1.2 Connect Veritas Service with ExtensionRegistry

```typescript
// src/core/extensions/veritasExtension.ts

import { ExtensionRegistry } from './ExtensionRegistry';
import VeritasService from '../veritas/VeritasService';

export const connectVeritasWithVigilObserver = () => {
  const extensionRegistry = ExtensionRegistry.getInstance();
  
  // Get VigilObserver extension point
  const vigilObserverExtensionPoint = extensionRegistry.getExtensionPoint('vigilObserver');
  
  // Get Veritas extension point
  const veritasExtensionPoint = extensionRegistry.getExtensionPoint('verification');
  
  if (vigilObserverExtensionPoint && veritasExtensionPoint) {
    // Create connection between VigilObserver and Veritas
    // Implementation details
  }
};
```

### 2. Admin Header Link Integration

#### 2.1 Update AdminHeaderLink Component

```typescript
// src/admin/AdminHeaderLink.tsx

// Add governance section to AdminHeaderLink
const AdminHeaderLink: React.FC = () => {
  // Existing code...
  
  return (
    <>
      <Link 
        to="/admin/dashboard" 
        className="flex items-center px-3 py-2 text-sm font-medium text-blue-300 hover:text-blue-100 hover:bg-blue-800 rounded-md transition-colors duration-150"
        aria-label="Admin Dashboard"
      >
        <AdminIcon />
        <span className="ml-2">Admin</span>
      </Link>
      
      {/* Add Governance Link */}
      <Link 
        to="/admin/governance" 
        className="flex items-center px-3 py-2 text-sm font-medium text-green-300 hover:text-green-100 hover:bg-green-800 rounded-md transition-colors duration-150"
        aria-label="Governance Dashboard"
      >
        <GovernanceIcon />
        <span className="ml-2">Governance</span>
      </Link>
    </>
  );
};
```

#### 2.2 Update AdminDashboardLayout Navigation

```typescript
// src/admin/AdminDashboardLayout.tsx

// Add governance section to navigation
const navItems: NavItem[] = [
  // Existing items...
  { 
    id: 'governance', 
    name: 'Governance', 
    icon: ShieldCheckIcon, 
    path: '/admin/dashboard/governance' 
  },
  // Other items...
];
```

### 3. Dashboard Context Integration

#### 3.1 Extend AdminDashboardContext

```typescript
// src/admin/AdminDashboardContext.tsx

// Add governance state to context
interface AdminDashboardContextType {
  // Existing properties...
  
  // Governance
  governanceMetrics: any;
  complianceStatus: any;
  violations: any[];
  enforcements: any[];
  loadGovernanceData: () => Promise<void>;
}

// Update provider component
export const AdminDashboardProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Existing state...
  
  // Governance state
  const [governanceMetrics, setGovernanceMetrics] = useState<any>(null);
  const [complianceStatus, setComplianceStatus] = useState<any>(null);
  const [violations, setViolations] = useState<any[]>([]);
  const [enforcements, setEnforcements] = useState<any[]>([]);
  
  // Load governance data
  const loadGovernanceData = async () => {
    setIsLoading(true);
    
    try {
      const extensionRegistry = ExtensionRegistry.getInstance();
      const vigilObserverExtensionPoint = extensionRegistry.getExtensionPoint('vigilObserver');
      
      if (vigilObserverExtensionPoint && vigilObserverExtensionPoint.getImplementation()) {
        const implementation = vigilObserverExtensionPoint.getImplementation();
        
        // Load metrics
        const metrics = implementation.getMetrics();
        setGovernanceMetrics(metrics);
        
        // Load compliance status
        const status = implementation.analyzeComplianceStatus();
        setComplianceStatus(status);
        
        // Load violations
        const violationData = implementation.getViolations();
        setViolations(violationData);
        
        // Load enforcements
        const enforcementData = implementation.getEnforcements();
        setEnforcements(enforcementData);
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load governance data'));
    } finally {
      setIsLoading(false);
    }
  };
  
  // Effect for loading governance data
  useEffect(() => {
    if (currentUser && isAdmin) {
      loadGovernanceData();
    }
  }, [currentUser, isAdmin]);
  
  // Context value
  const contextValue: AdminDashboardContextType = {
    // Existing properties...
    
    // Governance
    governanceMetrics,
    complianceStatus,
    violations,
    enforcements,
    loadGovernanceData
  };
  
  return (
    <AdminDashboardContext.Provider value={contextValue}>
      {children}
    </AdminDashboardContext.Provider>
  );
};
```

### 4. Analytics Dashboard Integration

#### 4.1 Create GovernanceDashboard Component

```typescript
// src/admin/GovernanceDashboard.tsx

import React from 'react';
import { useAdminDashboard } from './AdminDashboardContext';

// Governance metrics card
const GovernanceMetricCard: React.FC<{
  title: string;
  value: string | number;
  subtitle?: string;
  color?: 'blue' | 'green' | 'red' | 'yellow';
}> = ({ title, value, subtitle, color = 'blue' }) => {
  // Implementation details...
};

// Violations table
const ViolationsTable: React.FC<{ violations: any[] }> = ({ violations }) => {
  // Implementation details...
};

// Compliance status visualization
const ComplianceStatusVisualization: React.FC<{ status: any }> = ({ status }) => {
  // Implementation details...
};

// Governance dashboard component
const GovernanceDashboard: React.FC = () => {
  const { 
    governanceMetrics, 
    complianceStatus, 
    violations, 
    enforcements,
    isLoading,
    error
  } = useAdminDashboard();
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="bg-red-900 text-white p-4 rounded-lg">
        <h2 className="text-xl font-bold mb-2">Error</h2>
        <p>{error.message}</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">Governance Dashboard</h1>
      
      {/* Metrics Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <GovernanceMetricCard 
          title="Compliance Score" 
          value={complianceStatus?.complianceScore || 0}
          subtitle="Overall system compliance"
          color="blue"
        />
        <GovernanceMetricCard 
          title="Violations" 
          value={violations?.length || 0}
          subtitle="Total governance violations"
          color="red"
        />
        <GovernanceMetricCard 
          title="Enforcements" 
          value={enforcements?.length || 0}
          subtitle="Total enforcement actions"
          color="yellow"
        />
        <GovernanceMetricCard 
          title="Rules" 
          value={governanceMetrics?.rules?.total || 0}
          subtitle="Active governance rules"
          color="green"
        />
      </div>
      
      {/* Compliance Status Visualization */}
      <ComplianceStatusVisualization status={complianceStatus} />
      
      {/* Violations Table */}
      <ViolationsTable violations={violations || []} />
    </div>
  );
};

export default GovernanceDashboard;
```

### 5. Veritas Integration

#### 5.1 Create VeritasDashboard Component

```typescript
// src/admin/VeritasDashboard.tsx

import React, { useState, useEffect } from 'react';
import { useAdminDashboard } from './AdminDashboardContext';
import VeritasService from '../core/veritas/VeritasService';

// Verification metrics card
const VerificationMetricCard: React.FC<{
  title: string;
  value: string | number;
  subtitle?: string;
  color?: 'blue' | 'green' | 'red' | 'purple';
}> = ({ title, value, subtitle, color = 'blue' }) => {
  // Implementation details...
};

// Verification history table
const VerificationHistoryTable: React.FC<{ observations: any[] }> = ({ observations }) => {
  // Implementation details...
};

// Verification comparison tool
const VerificationComparisonTool: React.FC = () => {
  // Implementation details...
};

// Emotional analysis display
const EmotionalAnalysisDisplay: React.FC<{ data: any }> = ({ data }) => {
  // Implementation details...
};

// Veritas dashboard component
const VeritasDashboard: React.FC = () => {
  const { currentUser, isAdmin } = useAdminDashboard();
  const [veritasMetrics, setVeritasMetrics] = useState<any>(null);
  const [observations, setObservations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  
  // Load Veritas data
  useEffect(() => {
    const loadVeritasData = async () => {
      setIsLoading(true);
      
      try {
        // Get metrics
        const metrics = await VeritasService.getVeritasMetrics();
        setVeritasMetrics(metrics);
        
        // Get observations
        const observationData = await VeritasService.getVeritasObservations();
        setObservations(observationData);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to load Veritas data'));
      } finally {
        setIsLoading(false);
      }
    };
    
    if (currentUser && isAdmin) {
      loadVeritasData();
    }
  }, [currentUser, isAdmin]);
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="bg-red-900 text-white p-4 rounded-lg">
        <h2 className="text-xl font-bold mb-2">Error</h2>
        <p>{error.message}</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">Veritas Dashboard</h1>
      
      {/* Metrics Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <VerificationMetricCard 
          title="Accuracy Score" 
          value={veritasMetrics?.averageAccuracy || 0}
          subtitle="Average verification accuracy"
          color="blue"
        />
        <VerificationMetricCard 
          title="Emotional Score" 
          value={veritasMetrics?.averageEmotionalScore || 0}
          subtitle="Average emotional awareness"
          color="purple"
        />
        <VerificationMetricCard 
          title="Trust Score" 
          value={veritasMetrics?.averageTrustScore || 0}
          subtitle="Average trust signals"
          color="green"
        />
        <VerificationMetricCard 
          title="Empathy Score" 
          value={veritasMetrics?.averageEmpathyScore || 0}
          subtitle="Average empathy rating"
          color="red"
        />
      </div>
      
      {/* Verification Comparison Tool */}
      <VerificationComparisonTool />
      
      {/* Emotional Analysis Display */}
      <EmotionalAnalysisDisplay data={veritasMetrics?.emotionalBreakdown || {}} />
      
      {/* Verification History Table */}
      <VerificationHistoryTable observations={observations || []} />
    </div>
  );
};

export default VeritasDashboard;
```

## Testing and Validation

### Unit Tests

1. **Extension Registry Integration Tests**
   - Test VigilObserver extension point registration
   - Test Veritas extension point registration
   - Test connection between VigilObserver and Veritas

2. **Component Tests**
   - Test AdminHeaderLink with governance section
   - Test AdminDashboardContext with governance data
   - Test GovernanceDashboard component
   - Test VeritasDashboard component

### Integration Tests

1. **Data Flow Tests**
   - Test data flow from VigilObserver to AdminDashboardContext
   - Test data flow from Veritas to AdminDashboardContext
   - Test data visualization with real data

2. **UI Flow Tests**
   - Test navigation to governance dashboard
   - Test navigation to Veritas dashboard
   - Test user interactions with governance components

### Visual Validation

1. **Design Consistency**
   - Ensure consistent styling with existing UI
   - Validate color scheme and typography
   - Check responsive behavior on different screen sizes

2. **Accessibility Validation**
   - Test keyboard navigation
   - Validate color contrast
   - Ensure screen reader compatibility

## Implementation Timeline

### Week 1: Extension Registry Integration
- Day 1-2: Register VigilObserver with ExtensionRegistry
- Day 3-4: Connect Veritas Service with ExtensionRegistry
- Day 5: Testing and validation

### Week 2: Admin Header and Context Integration
- Day 1-2: Update AdminHeaderLink and AdminDashboardLayout
- Day 3-4: Extend AdminDashboardContext
- Day 5: Testing and validation

### Week 3: Dashboard Component Integration
- Day 1-2: Create GovernanceDashboard component
- Day 3-4: Create VeritasDashboard component
- Day 5: Testing and validation

### Week 4: Final Integration and Testing
- Day 1-2: Connect all components
- Day 3-4: End-to-end testing
- Day 5: Final validation and documentation

## Conclusion

This integration plan provides a detailed roadmap for connecting the VigilObserver and Veritas components with the Promethios admin dashboard. By following this incremental approach, we can ensure a stable and functional integration while maintaining the existing UI's design consistency and user experience.

The plan addresses all key aspects of the integration:
- Extension registry integration for component communication
- UI component updates for navigation and display
- Data flow between backend services and frontend components
- Testing and validation at each step

Upon completion, the integrated system will provide comprehensive governance monitoring and verification capabilities through a unified admin dashboard interface.
