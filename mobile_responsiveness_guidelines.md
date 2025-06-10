# Mobile Responsiveness Guidelines for Promethios UI

## 1. Overview

This document outlines the mobile responsiveness guidelines for all UI components in the Promethios platform. These guidelines ensure that the platform provides an optimal user experience across a wide range of devices, from desktop computers to smartphones and tablets.

## 2. Core Principles

### 2.1 Responsive Design Approach

Promethios follows a mobile-first responsive design approach, where we:

1. **Design for mobile first**: Start with the mobile layout and progressively enhance for larger screens
2. **Use fluid layouts**: Employ percentage-based widths and flexible grids
3. **Implement responsive breakpoints**: Adapt layouts at specific screen width thresholds
4. **Ensure touch-friendly interfaces**: Design for touch interactions on mobile devices
5. **Optimize performance**: Ensure fast loading and smooth interactions on mobile networks

### 2.2 Breakpoints

The following standard breakpoints will be used throughout the Promethios UI:

```css
/* Extra small devices (phones, less than 576px) */
/* No media query since this is the default */

/* Small devices (landscape phones, 576px and up) */
@media (min-width: 576px) { ... }

/* Medium devices (tablets, 768px and up) */
@media (min-width: 768px) { ... }

/* Large devices (desktops, 992px and up) */
@media (min-width: 992px) { ... }

/* Extra large devices (large desktops, 1200px and up) */
@media (min-width: 1200px) { ... }
```

### 2.3 Layout Patterns

The following layout patterns should be used consistently across the platform:

1. **Single column layout** for mobile devices (< 576px)
2. **Two column layout** for tablets (768px - 991px)
3. **Multi-column layout** for desktops (≥ 992px)

## 3. Component-Specific Guidelines

### 3.1 Chat Interface

The chat interface should adapt to different screen sizes as follows:

#### Mobile (< 576px)
- Full-width chat area with no border
- Chat input fixed at bottom of screen
- Right sidebar (metrics) hidden by default, accessible via a toggle button
- Document upload and link input accessible via expandable menu in chat input
- Simplified agent selection UI for multi-agent mode

#### Tablet (576px - 991px)
- Full-width chat area with no border
- Chat input fixed at bottom of screen
- Right sidebar (metrics) collapsible, taking 30% of screen width when expanded
- Document upload and link input accessible via buttons in chat input
- Compact agent selection UI for multi-agent mode

#### Desktop (≥ 992px)
- Full-width chat area with no border
- Chat input fixed at bottom of screen
- Right sidebar (metrics) always visible, taking 25-30% of screen width
- Document upload and link input accessible via buttons in chat input
- Full agent selection UI for multi-agent mode

```typescript
// Example responsive styles for chat container
const chatContainerStyles = css`
  display: flex;
  flex-direction: column;
  height: 100vh;
  width: 100%;
  
  @media (min-width: 992px) {
    flex-direction: row;
  }
`;

const chatMainStyles = css`
  flex: 1;
  display: flex;
  flex-direction: column;
  
  @media (min-width: 992px) {
    flex: 3;
  }
`;

const chatSidebarStyles = css`
  display: none;
  
  @media (min-width: 576px) {
    display: block;
    flex: 1;
    max-width: 30%;
    border-left: 1px solid #e0e0e0;
    padding: 20px;
    overflow-y: auto;
  }
  
  @media (min-width: 992px) {
    flex: 1;
    max-width: 25%;
  }
`;
```

### 3.2 Notification Center

The notification center should adapt to different screen sizes as follows:

#### Mobile (< 576px)
- Notification center toggle fixed at top-right corner
- Notification dropdown takes full screen width when opened
- Simplified notification items with reduced padding
- Toast notifications positioned at top center, taking full width

#### Tablet (576px - 991px)
- Notification center toggle fixed at top-right corner
- Notification dropdown takes 80% of screen width when opened
- Standard notification items
- Toast notifications positioned at top right, taking 50% width

#### Desktop (≥ 992px)
- Notification center toggle fixed at top-right corner
- Notification dropdown takes 400px width when opened
- Standard notification items with full details
- Toast notifications positioned at top right, taking 350px width

```typescript
// Example responsive styles for notification center
const notificationCenterStyles = css`
  position: fixed;
  top: 10px;
  right: 10px;
  z-index: 1000;
`;

const notificationDropdownStyles = css`
  position: absolute;
  top: 40px;
  right: 0;
  background-color: white;
  border-radius: 4px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  width: 100vw;
  max-height: 80vh;
  overflow-y: auto;
  
  @media (min-width: 576px) {
    width: 80%;
    right: 0;
  }
  
  @media (min-width: 992px) {
    width: 400px;
  }
`;

const toastContainerStyles = css`
  position: fixed;
  top: 10px;
  left: 0;
  right: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  z-index: 1000;
  
  @media (min-width: 576px) {
    align-items: flex-end;
    right: 10px;
    left: auto;
  }
`;

const toastStyles = css`
  width: 100%;
  max-width: 100vw;
  margin-bottom: 10px;
  
  @media (min-width: 576px) {
    width: 50%;
  }
  
  @media (min-width: 992px) {
    width: 350px;
  }
`;
```

### 3.3 User Preferences Dashboard

The user preferences dashboard should adapt to different screen sizes as follows:

#### Mobile (< 576px)
- Single column layout for all preference categories
- Full-width preference controls
- Accordion-style category sections to save vertical space

#### Tablet (576px - 991px)
- Single column layout with wider controls
- Tabs for switching between preference categories

#### Desktop (≥ 992px)
- Two-column layout with categories on the left and preferences on the right
- All categories visible at once

```typescript
// Example responsive styles for preferences dashboard
const preferencesDashboardStyles = css`
  padding: 20px;
  
  @media (min-width: 992px) {
    display: grid;
    grid-template-columns: 250px 1fr;
    gap: 20px;
  }
`;

const preferenceCategoriesStyles = css`
  margin-bottom: 20px;
  
  @media (min-width: 992px) {
    margin-bottom: 0;
    border-right: 1px solid #e0e0e0;
    padding-right: 20px;
  }
`;

const preferenceControlsStyles = css`
  display: flex;
  flex-direction: column;
  
  @media (min-width: 576px) {
    gap: 15px;
  }
`;
```

### 3.4 Governance Dashboard

The governance dashboard should adapt to different screen sizes as follows:

#### Mobile (< 576px)
- Single column layout for all metrics and visualizations
- Simplified charts with reduced detail
- Vertical stacking of all elements
- Pagination for multiple metrics instead of showing all at once

#### Tablet (576px - 991px)
- Two column layout for metrics and visualizations
- Standard charts with moderate detail
- Grid layout for dashboard widgets

#### Desktop (≥ 992px)
- Multi-column layout with flexible grid
- Full-detail charts and visualizations
- Customizable dashboard layout

```typescript
// Example responsive styles for governance dashboard
const governanceDashboardStyles = css`
  padding: 20px;
`;

const dashboardGridStyles = css`
  display: grid;
  grid-template-columns: 1fr;
  gap: 20px;
  
  @media (min-width: 576px) {
    grid-template-columns: repeat(2, 1fr);
  }
  
  @media (min-width: 992px) {
    grid-template-columns: repeat(3, 1fr);
  }
  
  @media (min-width: 1200px) {
    grid-template-columns: repeat(4, 1fr);
  }
`;

const metricCardStyles = css`
  padding: 15px;
  border-radius: 4px;
  background-color: white;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  
  @media (min-width: 576px) {
    padding: 20px;
  }
`;
```

### 3.5 Agent Scorecard

The agent scorecard should adapt to different screen sizes as follows:

#### Mobile (< 576px)
- Single column layout for all metrics
- Simplified visualizations
- Collapsible sections for different metric categories

#### Tablet (576px - 991px)
- Two column layout for metrics
- Standard visualizations
- Tabs for different metric categories

#### Desktop (≥ 992px)
- Multi-column layout with flexible grid
- Full-detail visualizations
- All metric categories visible at once

```typescript
// Example responsive styles for agent scorecard
const agentScorecardStyles = css`
  padding: 20px;
`;

const scorecardHeaderStyles = css`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  margin-bottom: 20px;
  
  @media (min-width: 768px) {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
  }
`;

const metricsGridStyles = css`
  display: grid;
  grid-template-columns: 1fr;
  gap: 15px;
  
  @media (min-width: 576px) {
    grid-template-columns: repeat(2, 1fr);
    gap: 20px;
  }
  
  @media (min-width: 992px) {
    grid-template-columns: repeat(3, 1fr);
  }
`;
```

### 3.6 Observer Agent UI

The observer agent UI should adapt to different screen sizes as follows:

#### Mobile (< 576px)
- Hovering chat bubble positioned at bottom right
- When expanded, takes up 90% of screen width and height
- Simplified suggestion display
- Easy dismiss/minimize gesture

#### Tablet (576px - 991px)
- Hovering chat bubble positioned at bottom right
- When expanded, takes up 60% of screen width and 70% of height
- Standard suggestion display

#### Desktop (≥ 992px)
- Hovering chat bubble positioned at bottom right
- When expanded, takes up 400px width and 500px height
- Full suggestion display with detailed information

```typescript
// Example responsive styles for observer agent UI
const observerBubbleStyles = css`
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 1000;
  border-radius: 50%;
  width: 50px;
  height: 50px;
  background-color: #0066cc;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
`;

const observerExpandedStyles = css`
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 1000;
  border-radius: 8px;
  background-color: white;
  box-shadow: 0 2px 15px rgba(0, 0, 0, 0.2);
  width: 90%;
  height: 70vh;
  
  @media (min-width: 576px) {
    width: 60%;
    height: 70vh;
  }
  
  @media (min-width: 992px) {
    width: 400px;
    height: 500px;
  }
`;
```

### 3.7 Benchmark Dashboard

The benchmark dashboard should adapt to different screen sizes as follows:

#### Mobile (< 576px)
- Single column layout for all sections
- Simplified test configuration UI
- Vertical stacking of results and visualizations
- Pagination for detailed results

#### Tablet (576px - 991px)
- Two column layout for configuration and results
- Standard test configuration UI
- Tabs for different result sections

#### Desktop (≥ 992px)
- Multi-column layout with flexible grid
- Full test configuration UI
- All result sections visible at once

```typescript
// Example responsive styles for benchmark dashboard
const benchmarkDashboardStyles = css`
  padding: 20px;
`;

const benchmarkLayoutStyles = css`
  display: flex;
  flex-direction: column;
  gap: 20px;
  
  @media (min-width: 992px) {
    flex-direction: row;
  }
`;

const configSectionStyles = css`
  width: 100%;
  
  @media (min-width: 992px) {
    width: 30%;
    min-width: 300px;
  }
`;

const resultsSectionStyles = css`
  width: 100%;
  
  @media (min-width: 992px) {
    width: 70%;
  }
`;
```

## 4. Implementation Guidelines

### 4.1 CSS Approach

Promethios will use a combination of:

1. **CSS-in-JS** for component-specific styles (using styled-components or emotion)
2. **CSS Variables** for theming and global design tokens
3. **CSS Grid and Flexbox** for responsive layouts
4. **Media queries** for breakpoint-specific adjustments

### 4.2 Responsive Images

All images should be responsive using the following techniques:

1. Use the `srcset` attribute for providing multiple image resolutions
2. Use the `sizes` attribute to specify image sizes at different breakpoints
3. Use CSS `object-fit` property to control how images resize
4. Consider lazy loading for images below the fold

```html
<img 
  src="image-default.jpg" 
  srcset="image-small.jpg 576w, image-medium.jpg 768w, image-large.jpg 1200w" 
  sizes="(max-width: 576px) 100vw, (max-width: 992px) 50vw, 33vw" 
  alt="Description" 
  loading="lazy"
/>
```

### 4.3 Touch Targets

Ensure all interactive elements are touch-friendly:

1. Minimum touch target size of 44x44 pixels
2. Adequate spacing between touch targets (at least 8px)
3. Clear visual feedback for touch interactions
4. Consider implementing touch-specific interactions (swipe, pinch, etc.) where appropriate

### 4.4 Performance Considerations

Mobile responsiveness includes performance optimization:

1. Minimize JavaScript bundle size with code splitting
2. Optimize images and use appropriate formats (WebP where supported)
3. Implement lazy loading for off-screen content
4. Reduce unnecessary animations on mobile devices
5. Test on low-end devices and throttled network connections

## 5. Testing Methodology

### 5.1 Device Testing

Test the UI on the following devices and browsers:

1. **Mobile phones**: iPhone (Safari), Android phones (Chrome)
2. **Tablets**: iPad (Safari), Android tablets (Chrome)
3. **Desktops**: Windows (Chrome, Edge, Firefox), Mac (Safari, Chrome)

### 5.2 Testing Tools

Use the following tools for responsive testing:

1. **Browser DevTools**: Chrome/Firefox responsive design mode
2. **BrowserStack**: For testing on real devices
3. **Lighthouse**: For performance and accessibility testing
4. **Cypress**: For automated responsive testing

### 5.3 Testing Checklist

For each UI component, verify:

1. Layout adapts appropriately at all breakpoints
2. Touch targets are adequately sized on mobile
3. All functionality is accessible on all devices
4. Performance is acceptable on mobile devices
5. Text is readable without zooming
6. No horizontal scrolling occurs at any width

## 6. Component Review and Updates

### 6.1 Chat Interface

The chat interface has been designed with mobile responsiveness in mind, featuring:
- Full-width layout with no border
- Bottom-positioned input box
- Collapsible right sidebar for metrics
- Touch-friendly controls

Updates needed:
- Ensure document upload UI is touch-friendly on mobile
- Optimize multi-agent selection for small screens
- Test performance with large chat histories on mobile

### 6.2 Notification System

The notification system has been designed with mobile responsiveness, featuring:
- Appropriately sized toast notifications
- Full-width notification center on mobile
- Touch-friendly notification actions

Updates needed:
- Ensure notification badges are visible on mobile
- Test notification stacking on small screens
- Optimize notification content for mobile viewing

### 6.3 User Preferences

The user preferences UI needs updates for mobile:
- Implement accordion-style categories for mobile
- Ensure all form controls are touch-friendly
- Optimize layout for small screens

### 6.4 Governance Dashboard

The governance dashboard needs significant mobile optimization:
- Implement single-column layout for mobile
- Optimize visualizations for small screens
- Consider simplified data views for mobile

### 6.5 Observer Agent

The observer agent UI has been designed with mobile in mind:
- Compact bubble when collapsed
- Appropriate expansion size based on screen
- Touch-friendly suggestion selection

Updates needed:
- Test bubble positioning on various mobile devices
- Ensure it doesn't interfere with other UI elements on small screens

### 6.6 Benchmark Dashboard

The benchmark dashboard needs mobile optimization:
- Simplify test configuration UI for mobile
- Optimize result visualizations for small screens
- Implement pagination for detailed results on mobile

## 7. Implementation Plan

### 7.1 Phase 1: Framework and Guidelines
1. Establish responsive CSS framework and variables
2. Document breakpoints and responsive patterns
3. Create reusable responsive components (grids, cards, etc.)

### 7.2 Phase 2: Core UI Components
1. Update chat interface for mobile responsiveness
2. Update notification system for mobile responsiveness
3. Update user preferences UI for mobile responsiveness

### 7.3 Phase 3: Dashboard and Visualization Components
1. Update governance dashboard for mobile responsiveness
2. Update agent scorecard for mobile responsiveness
3. Update benchmark dashboard for mobile responsiveness

### 7.4 Phase 4: Testing and Refinement
1. Test all components on various devices and browsers
2. Gather feedback and make refinements
3. Document any device-specific considerations

## 8. Next Steps

1. Audit existing UI components for mobile responsiveness
2. Implement responsive CSS framework and variables
3. Begin updates to core UI components
4. Test on various devices and make refinements
