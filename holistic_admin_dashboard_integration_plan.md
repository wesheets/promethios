# Holistic Admin Dashboard Integration Plan

## 1. Overview

This document outlines the comprehensive integration plan for a holistic admin dashboard within the Promethios system. The dashboard will serve as a central hub for administrators, providing access to all system metrics, user account management, role-based access control (RBAC) configuration, and Emotional Veritas 2.0 settings. This plan emphasizes a scalable architecture, leveraging the existing extension system and Firebase for backend services.

## 2. Core Architectural Principles

- **Modularity**: Dashboard components will be modular and managed by the ExtensionRegistry and ModuleRegistry.
- **Scalability**: The architecture will support the addition of new metrics and administrative features over time.
- **Consistency**: A unified UI/UX will be maintained across all dashboard sections.
- **Security**: Robust access control will be enforced through Firebase authentication and RBAC.
- **Data Integrity**: Firebase will ensure data persistence and consistency for configurations and metrics.

## 3. Key Features and Modules

### 3.1 Main Dashboard View
- **Overview**: A summary page displaying key system health indicators, recent activity, and alerts.
- **Navigation**: A persistent sidebar or top navigation for accessing different dashboard modules.
- **Customization**: Ability for admins to customize their dashboard view (future enhancement).

### 3.2 Metrics Management Module
- **Emotional Veritas 2.0 Metrics**: Detailed visualization and configuration for emotional intelligence scores, sentiment analysis, and trust signals.
- **Trust Metrics**: Display and management of agent trust scores, factors influencing trust, and historical trends.
- **Compliance Metrics**: Monitoring of agent compliance with predefined rules and policies, violation logs, and compliance scores.
- **Performance Metrics**: Agent response times, processing load, and other operational metrics.
- **Custom Metrics**: Framework for adding new metric types and visualizations via extensions.

### 3.3 User Account Management Module
- **User List**: View and manage all system users.
- **User Creation/Deletion**: Admin ability to create and delete user accounts.
- **Role Assignment**: Assigning roles (e.g., admin, user, viewer) to users.
- **Password Resets**: Admin-initiated password resets (leveraging Firebase Auth).
- **Activity Logs**: Audit trail of user actions (future enhancement).

### 3.4 Role-Based Access Control (RBAC) Module
- **Role Definition**: Create and manage roles with specific permissions.
- **Permission Management**: Define granular permissions for accessing different system features and data.
- **Role-to-Permission Mapping**: Assign permissions to roles.

### 3.5 System Configuration Module
- **Emotional Veritas Settings**: Configure sensitivity thresholds, displayed metrics, and response templates.
- **Feature Toggles**: Manage system-wide feature toggles via the FeatureToggleService.
- **Notification Settings**: Configure system notification preferences.
- **Integration Hub Settings**: Manage connections to external systems.

## 4. Technical Implementation Details

### 4.1 Frontend (React & TypeScript)
- **Component Library**: Utilize existing UI components and patterns for consistency.
- **State Management**: Employ existing state management solutions (e.g., Context API, Zustand) for dashboard state.
- **Routing**: Integrate with the existing routing mechanism for dashboard pages.
- **Admin Header Link**: A dedicated link in the main application header, visible only to authenticated admin users, leading to `/admin/dashboard`.

### 4.2 Extension System Integration
- **DashboardModule Interface**: Define a standard interface for dashboard modules.
  ```typescript
  interface DashboardModule {
    id: string;
    name: string;
    icon?: string; // For navigation
    component: React.ComponentType;
    requiredPermissions?: string[]; // Permissions needed to access this module
    routePath: string;
  }
  ```
- **Registration**: Dashboard modules will register themselves with the ModuleRegistry.
- **Dynamic Loading**: The main dashboard component will dynamically load and render registered modules based on user permissions.

### 4.3 Firebase Integration

#### 4.3.1 Authentication & Authorization
- **Firebase Authentication**: Used for user sign-in and session management.
- **Custom Claims**: Firebase Custom Claims will be used to store user roles (e.g., `admin: true`). Frontend and backend (Firebase Rules) will use these claims to enforce access control.
- **Admin SDK**: A secure backend function (e.g., Firebase Cloud Function) will be used to set custom claims when an admin assigns a role.

#### 4.3.2 Firestore Database Structure
- **`/users/{userId}`**: Stores user-specific information (display name, email, etc., synced from Firebase Auth where possible).
- **`/roles/{roleId}`**: Defines roles and their associated permissions.
  ```json
  {
    "name": "Administrator",
    "permissions": ["manageUsers", "viewAllMetrics", "configureSystem"]
  }
  ```
- **`/userRoles/{userId}`**: Maps users to roles.
  ```json
  {
    "roles": ["adminRoleId1", "editorRoleId2"]
  }
  ```
- **`/dashboardConfig/{configId}`**: Stores dashboard-specific configurations (e.g., Emotional Veritas thresholds).
- **`/metrics/{metricType}/{timestamp}`**: Stores aggregated metrics data for dashboard visualization. (Consider time-series optimized structures or BigQuery for large volumes).
- **`/featureToggles/{toggleId}`**: Stores feature toggle states, managed by FeatureToggleService with Firebase persistence.

#### 4.3.3 Firebase Security Rules
- Firestore Security Rules will be meticulously crafted to:
  - Allow admins to read/write configuration and user management data.
  - Allow authenticated users to read their own data.
  - Restrict access to sensitive metrics based on roles.
  - Example (simplified):
    ```javascript
    match /users/{userId} {
      allow read: if request.auth.uid == userId || isAdmin();
      allow write: if isAdmin();
    }
    match /roles/{roleId} {
      allow read, write: if isAdmin();
    }
    function isAdmin() {
      return request.auth.token.admin == true;
    }
    ```

### 4.4 Navigation
- **Admin Header Link**: Implement a link in the main application header (e.g., `Header.tsx`).
  - Visibility will be controlled based on the user's `admin` custom claim from Firebase Auth.
  - The link will navigate to a base admin route (e.g., `/admin/dashboard`).
- **Dashboard Internal Navigation**: A sidebar or tabbed navigation within the admin dashboard to switch between modules (Metrics, User Management, RBAC, etc.).

## 5. Implementation Phases

### Phase 1: Foundation & User Management (Weeks 1-2)
1.  **Setup Firebase Project**: Configure Auth, Firestore.
2.  **Implement Admin Authentication Flow**: Login, custom claims for admin role.
3.  **Create Basic Dashboard Shell**: Main layout, admin header link, basic routing.
4.  **Implement User Account Management Module**: List users, assign admin role (initially via Firebase console or a simple UI).
5.  **Implement RBAC Module (Basic)**: Define core roles and permissions in Firestore.

### Phase 2: Emotional Veritas & Core Metrics Integration (Weeks 3-4)
1.  **Integrate Emotional Veritas 2.0 Metrics**: Display and configure Emotional Veritas data.
2.  **Integrate Core Promethios Metrics**: Trust, Compliance, Performance dashboards.
3.  **Develop Metrics Visualization Components**: Reusable charts and tables.
4.  **Refine RBAC**: Apply permissions to metric views.

### Phase 3: System Configuration & Feature Toggles (Week 5)
1.  **Implement System Configuration Module**: UI for Emotional Veritas settings.
2.  **Integrate FeatureToggleService**: UI for managing feature flags.
3.  **Firebase Security Rules Hardening**: Thorough review and testing of all rules.

### Phase 4: Testing, Documentation & Refinement (Week 6)
1.  **End-to-End Testing**: Test all dashboard functionalities and access controls.
2.  **Write Developer & Admin Documentation**.
3.  **UI/UX Polish and Refinements**.

## 6. Data Flow Example (Viewing Emotional Veritas Metrics)

1.  Admin user logs in (Firebase Auth).
2.  Admin custom claim is present in the ID token.
3.  Admin header link is visible; user clicks it, navigates to `/admin/dashboard/emotional-veritas`.
4.  Dashboard component checks user permissions (via custom claim or Firestore role lookup).
5.  Emotional Veritas metrics component fetches data from Firestore (`/metrics/emotionalVeritas/...` or `/dashboardConfig/emotionalVeritasSettings`).
6.  Firestore Security Rules validate that the admin role has permission to read this data.
7.  Data is displayed in the dashboard.

## 7. Future Considerations

- **Audit Logging**: Detailed logging of admin actions.
- **Dashboard Customization**: Allowing admins to personalize their dashboard layout.
- **Advanced Reporting**: Exporting metrics and configurations.
- **Real-time Alerts**: Notifications for critical system events or metric thresholds.

## 8. Conclusion

This holistic admin dashboard integration plan provides a robust and scalable foundation for managing the Promethios system. By leveraging the existing extension system and Firebase, we can create a powerful administrative interface that meets both current and future needs, including the full integration of Emotional Veritas 2.0 metrics and comprehensive user management capabilities.
