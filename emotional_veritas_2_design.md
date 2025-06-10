# Emotional Veritas 2.0 Dashboard and System Design

## 1. Overview

This document outlines the design for the Emotional Veritas 2.0 dashboard and system in the Promethios platform. Emotional Veritas 2.0 extends the original Veritas system by adding emotional impact analysis to AI governance decisions, providing a more holistic view of how governance policies affect stakeholders.

## 2. Core Components

### 2.1 EmotionalVeritasRegistry

The `EmotionalVeritasRegistry` manages emotional metrics and their lifecycle:

```typescript
class EmotionalVeritasRegistry {
  // Register an emotional metric
  registerMetric(metric: EmotionalMetric): boolean;
  
  // Deregister an emotional metric
  deregisterMetric(metricId: string): boolean;
  
  // Get a metric by ID
  getMetric(metricId: string): EmotionalMetric | null;
  
  // Get all registered metrics
  getAllMetrics(): EmotionalMetric[];
  
  // Get metrics by category
  getMetricsByCategory(category: string): EmotionalMetric[];
  
  // Get metrics by impact level
  getMetricsByImpactLevel(level: EmotionalImpactLevel): EmotionalMetric[];
}
```

### 2.2 EmotionalMetric Interface

The `EmotionalMetric` interface defines the contract for emotional metrics:

```typescript
interface EmotionalMetric {
  // Unique identifier for the metric
  id: string;
  
  // Display name for the metric
  name: string;
  
  // Description of the metric
  description: string;
  
  // Category of the metric
  category: string;
  
  // Impact level of the metric
  impactLevel: EmotionalImpactLevel;
  
  // Current value of the metric
  value: number;
  
  // Historical values of the metric
  history: EmotionalMetricDataPoint[];
  
  // Threshold values for the metric
  thresholds: {
    warning: number;
    critical: number;
  };
  
  // Visualization type for the metric
  visualizationType: 'gauge' | 'trend' | 'comparison' | 'radar';
  
  // Related metrics
  relatedMetrics: string[];
  
  // Compute the metric value
  compute: (context: EmotionalMetricContext) => Promise<number>;
}

type EmotionalImpactLevel = 'low' | 'medium' | 'high' | 'critical';

interface EmotionalMetricDataPoint {
  // Timestamp of the data point
  timestamp: number;
  
  // Value of the metric at the timestamp
  value: number;
  
  // Context of the data point
  context?: Record<string, any>;
}

interface EmotionalMetricContext {
  // Governance decision context
  decision?: {
    // Decision ID
    id: string;
    
    // Decision type
    type: string;
    
    // Decision outcome
    outcome: string;
    
    // Decision timestamp
    timestamp: number;
  };
  
  // User context
  user?: {
    // User ID
    id: string;
    
    // User role
    role: string;
  };
  
  // Agent context
  agent?: {
    // Agent ID
    id: string;
    
    // Agent type
    type: string;
  };
  
  // Custom context
  [key: string]: any;
}
```

### 2.3 EmotionalVeritasService

The `EmotionalVeritasService` provides the core functionality for the Emotional Veritas system:

```typescript
class EmotionalVeritasService {
  // Compute all metrics for a given context
  computeMetrics(context: EmotionalMetricContext): Promise<Record<string, number>>;
  
  // Compute a specific metric for a given context
  computeMetric(metricId: string, context: EmotionalMetricContext): Promise<number>;
  
  // Get the current state of all metrics
  getMetricsState(): Promise<Record<string, EmotionalMetric>>;
  
  // Get the current state of a specific metric
  getMetricState(metricId: string): Promise<EmotionalMetric>;
  
  // Get the history of a specific metric
  getMetricHistory(metricId: string, timeRange: TimeRange): Promise<EmotionalMetricDataPoint[]>;
  
  // Get metrics that exceed their thresholds
  getExceededMetrics(): Promise<EmotionalMetric[]>;
  
  // Register a listener for metric changes
  registerListener(listener: EmotionalMetricListener): string;
  
  // Deregister a listener
  deregisterListener(listenerId: string): boolean;
}

interface TimeRange {
  // Start timestamp
  start: number;
  
  // End timestamp
  end: number;
  
  // Resolution of the data points
  resolution?: 'minute' | 'hour' | 'day' | 'week' | 'month';
}

interface EmotionalMetricListener {
  // Callback for metric changes
  onMetricChange: (metric: EmotionalMetric) => void;
  
  // Callback for threshold exceeded
  onThresholdExceeded?: (metric: EmotionalMetric) => void;
  
  // Filter for metrics to listen to
  metricFilter?: string[];
}
```

## 3. Default Emotional Metrics

### 3.1 Trust Impact Metric

```typescript
const trustImpactMetric: EmotionalMetric = {
  id: 'trust-impact',
  name: 'Trust Impact',
  description: 'Measures the impact of governance decisions on user trust',
  category: 'trust',
  impactLevel: 'high',
  value: 0.75,
  history: [],
  thresholds: {
    warning: 0.5,
    critical: 0.3
  },
  visualizationType: 'gauge',
  relatedMetrics: ['transparency-score', 'consistency-score'],
  compute: async (context) => {
    // Implementation details
    return 0.75;
  }
};
```

### 3.2 Transparency Score Metric

```typescript
const transparencyScoreMetric: EmotionalMetric = {
  id: 'transparency-score',
  name: 'Transparency Score',
  description: 'Measures the transparency of governance decisions',
  category: 'transparency',
  impactLevel: 'medium',
  value: 0.82,
  history: [],
  thresholds: {
    warning: 0.6,
    critical: 0.4
  },
  visualizationType: 'trend',
  relatedMetrics: ['trust-impact', 'explanation-quality'],
  compute: async (context) => {
    // Implementation details
    return 0.82;
  }
};
```

### 3.3 User Satisfaction Metric

```typescript
const userSatisfactionMetric: EmotionalMetric = {
  id: 'user-satisfaction',
  name: 'User Satisfaction',
  description: 'Measures user satisfaction with governance decisions',
  category: 'satisfaction',
  impactLevel: 'high',
  value: 0.68,
  history: [],
  thresholds: {
    warning: 0.5,
    critical: 0.3
  },
  visualizationType: 'trend',
  relatedMetrics: ['trust-impact', 'usability-score'],
  compute: async (context) => {
    // Implementation details
    return 0.68;
  }
};
```

### 3.4 Emotional Resonance Metric

```typescript
const emotionalResonanceMetric: EmotionalMetric = {
  id: 'emotional-resonance',
  name: 'Emotional Resonance',
  description: 'Measures the emotional resonance of governance decisions',
  category: 'emotion',
  impactLevel: 'medium',
  value: 0.71,
  history: [],
  thresholds: {
    warning: 0.5,
    critical: 0.3
  },
  visualizationType: 'radar',
  relatedMetrics: ['user-satisfaction', 'trust-impact'],
  compute: async (context) => {
    // Implementation details
    return 0.71;
  }
};
```

### 3.5 Governance Alignment Metric

```typescript
const governanceAlignmentMetric: EmotionalMetric = {
  id: 'governance-alignment',
  name: 'Governance Alignment',
  description: 'Measures alignment between governance decisions and organizational values',
  category: 'alignment',
  impactLevel: 'high',
  value: 0.79,
  history: [],
  thresholds: {
    warning: 0.6,
    critical: 0.4
  },
  visualizationType: 'comparison',
  relatedMetrics: ['trust-impact', 'transparency-score'],
  compute: async (context) => {
    // Implementation details
    return 0.79;
  }
};
```

## 4. UI Components

### 4.1 EmotionalVeritasDashboard

The main dashboard component for Emotional Veritas:

```typescript
interface EmotionalVeritasDashboardProps {
  // Filter for metrics to display
  metricFilter?: string[];
  
  // Layout configuration
  layout?: 'grid' | 'list' | 'compact';
  
  // Whether to show metric details
  showDetails?: boolean;
  
  // Whether to show metric history
  showHistory?: boolean;
  
  // Time range for metric history
  timeRange?: TimeRange;
}

class EmotionalVeritasDashboard extends React.Component<EmotionalVeritasDashboardProps, EmotionalVeritasDashboardState> {
  componentDidMount() {
    // Register with extension system
    ExtensionRegistry.registerUIComponent({
      id: 'emotional-veritas-dashboard',
      component: this,
      extensionPoints: ['governance-view', 'veritas-dashboard']
    });
    
    // Initialize metrics
    this.initializeMetrics();
  }
  
  componentWillUnmount() {
    // Unregister from extension system
    ExtensionRegistry.unregisterUIComponent('emotional-veritas-dashboard');
    
    // Cleanup listeners
    if (this.state.listenerId) {
      EmotionalVeritasService.deregisterListener(this.state.listenerId);
    }
  }
  
  initializeMetrics = async () => {
    try {
      const metrics = await EmotionalVeritasService.getMetricsState();
      
      // Register listener for metric changes
      const listenerId = EmotionalVeritasService.registerListener({
        onMetricChange: this.handleMetricChange,
        onThresholdExceeded: this.handleThresholdExceeded,
        metricFilter: this.props.metricFilter
      });
      
      this.setState({
        metrics,
        loading: false,
        error: null,
        listenerId
      });
    } catch (error) {
      this.setState({
        loading: false,
        error: error.message
      });
    }
  };
  
  handleMetricChange = (metric: EmotionalMetric) => {
    this.setState(prevState => ({
      metrics: {
        ...prevState.metrics,
        [metric.id]: metric
      }
    }));
  };
  
  handleThresholdExceeded = (metric: EmotionalMetric) => {
    NotificationService.notify({
      type: 'warning',
      title: `${metric.name} Threshold Exceeded`,
      message: `The ${metric.name} metric has exceeded its ${metric.value < metric.thresholds.critical ? 'critical' : 'warning'} threshold.`,
      actions: [
        {
          label: 'View Details',
          action: () => {
            // Navigate to metric details
            RouteRegistry.navigate(`/dashboard/emotional/${metric.id}`);
          }
        }
      ]
    });
  };
  
  render() {
    const { layout = 'grid', showDetails = true, showHistory = true, timeRange } = this.props;
    const { metrics, loading, error } = this.state;
    
    if (loading) {
      return <LoadingIndicator />;
    }
    
    if (error) {
      return <ErrorDisplay message={error} onRetry={this.initializeMetrics} />;
    }
    
    return (
      <div className={`emotional-veritas-dashboard ${layout}`}>
        <div className="dashboard-header">
          <h1>Emotional Veritas Dashboard</h1>
          <div className="dashboard-controls">
            <select
              value={layout}
              onChange={e => this.setState({ layout: e.target.value as 'grid' | 'list' | 'compact' })}
            >
              <option value="grid">Grid</option>
              <option value="list">List</option>
              <option value="compact">Compact</option>
            </select>
            <label>
              <input
                type="checkbox"
                checked={showDetails}
                onChange={e => this.setState({ showDetails: e.target.checked })}
              />
              Show Details
            </label>
            <label>
              <input
                type="checkbox"
                checked={showHistory}
                onChange={e => this.setState({ showHistory: e.target.checked })}
              />
              Show History
            </label>
          </div>
        </div>
        
        <div className="metrics-container">
          {Object.values(metrics).map(metric => (
            <EmotionalMetricCard
              key={metric.id}
              metric={metric}
              showDetails={showDetails}
              showHistory={showHistory}
              timeRange={timeRange}
            />
          ))}
        </div>
      </div>
    );
  }
}
```

### 4.2 EmotionalMetricCard

A component to display an individual emotional metric:

```typescript
interface EmotionalMetricCardProps {
  // Metric to display
  metric: EmotionalMetric;
  
  // Whether to show metric details
  showDetails?: boolean;
  
  // Whether to show metric history
  showHistory?: boolean;
  
  // Time range for metric history
  timeRange?: TimeRange;
}

class EmotionalMetricCard extends React.Component<EmotionalMetricCardProps> {
  handleViewDetails = () => {
    // Navigate to metric details
    RouteRegistry.navigate(`/dashboard/emotional/${this.props.metric.id}`);
  };
  
  render() {
    const { metric, showDetails = true, showHistory = true, timeRange } = this.props;
    
    // Determine status based on thresholds
    const status =
      metric.value < metric.thresholds.critical
        ? 'critical'
        : metric.value < metric.thresholds.warning
        ? 'warning'
        : 'normal';
    
    return (
      <div className={`emotional-metric-card ${status}`}>
        <div className="metric-header">
          <h3>{metric.name}</h3>
          <div className={`impact-level ${metric.impactLevel}`}>
            {metric.impactLevel}
          </div>
        </div>
        
        <div className="metric-visualization">
          {metric.visualizationType === 'gauge' && (
            <EmotionalGaugeWidget
              value={metric.value}
              thresholds={metric.thresholds}
            />
          )}
          
          {metric.visualizationType === 'trend' && showHistory && (
            <EmotionalTrendWidget
              history={metric.history}
              timeRange={timeRange}
            />
          )}
          
          {metric.visualizationType === 'comparison' && (
            <EmotionalComparisonWidget
              value={metric.value}
              relatedMetrics={metric.relatedMetrics.map(id => metrics[id])}
            />
          )}
          
          {metric.visualizationType === 'radar' && (
            <EmotionalRadarWidget
              value={metric.value}
              relatedMetrics={metric.relatedMetrics.map(id => metrics[id])}
            />
          )}
        </div>
        
        {showDetails && (
          <div className="metric-details">
            <p>{metric.description}</p>
            <div className="metric-value">
              <span className="label">Value:</span>
              <span className="value">{(metric.value * 100).toFixed(1)}%</span>
            </div>
            <div className="metric-category">
              <span className="label">Category:</span>
              <span className="value">{metric.category}</span>
            </div>
          </div>
        )}
        
        <div className="metric-actions">
          <button onClick={this.handleViewDetails}>View Details</button>
        </div>
      </div>
    );
  }
}
```

### 4.3 EmotionalGaugeWidget

A component to display a gauge visualization for an emotional metric:

```typescript
interface EmotionalGaugeWidgetProps {
  // Value to display (0-1)
  value: number;
  
  // Thresholds for the gauge
  thresholds: {
    warning: number;
    critical: number;
  };
  
  // Size of the gauge
  size?: number;
  
  // Whether to show the value
  showValue?: boolean;
  
  // Whether to animate the gauge
  animate?: boolean;
}

class EmotionalGaugeWidget extends React.Component<EmotionalGaugeWidgetProps> {
  componentDidMount() {
    // Register with extension system
    ExtensionRegistry.registerUIComponent({
      id: `emotional-gauge-widget-${Math.random().toString(36).substr(2, 9)}`,
      component: this,
      extensionPoints: ['emotional-dashboard', 'metrics-panel']
    });
  }
  
  componentWillUnmount() {
    // Unregister from extension system
    ExtensionRegistry.unregisterUIComponent(`emotional-gauge-widget-${Math.random().toString(36).substr(2, 9)}`);
  }
  
  render() {
    const { value, thresholds, size = 200, showValue = true, animate = true } = this.props;
    
    // Calculate angle for gauge needle
    const angle = value * 180 - 90;
    
    // Determine color based on thresholds
    const color =
      value < thresholds.critical
        ? '#ff4d4d'
        : value < thresholds.warning
        ? '#ffcc00'
        : '#44cc44';
    
    return (
      <div
        className="emotional-gauge-widget"
        style={{ width: size, height: size / 2 + 30 }}
      >
        <svg width={size} height={size / 2 + 10}>
          {/* Gauge background */}
          <path
            d={`M ${size / 2}, ${size / 2} L ${size * 0.05}, ${size / 2} A ${size * 0.45}, ${size * 0.45} 0 0 1 ${size * 0.95}, ${size / 2} Z`}
            fill="#f0f0f0"
            stroke="#cccccc"
            strokeWidth="1"
          />
          
          {/* Critical zone */}
          <path
            d={`M ${size / 2}, ${size / 2} L ${size / 2 - Math.cos(Math.PI * thresholds.critical) * size * 0.45}, ${size / 2 - Math.sin(Math.PI * thresholds.critical) * size * 0.45} A ${size * 0.45}, ${size * 0.45} 0 0 0 ${size * 0.05}, ${size / 2} Z`}
            fill="#ffeeee"
            stroke="#ffcccc"
            strokeWidth="1"
          />
          
          {/* Warning zone */}
          <path
            d={`M ${size / 2}, ${size / 2} L ${size / 2 - Math.cos(Math.PI * thresholds.warning) * size * 0.45}, ${size / 2 - Math.sin(Math.PI * thresholds.warning) * size * 0.45} A ${size * 0.45}, ${size * 0.45} 0 0 0 ${size / 2 - Math.cos(Math.PI * thresholds.critical) * size * 0.45}, ${size / 2 - Math.sin(Math.PI * thresholds.critical) * size * 0.45} Z`}
            fill="#ffffee"
            stroke="#ffffcc"
            strokeWidth="1"
          />
          
          {/* Gauge needle */}
          <line
            x1={size / 2}
            y1={size / 2}
            x2={size / 2 - Math.cos(Math.PI * value) * size * 0.4}
            y2={size / 2 - Math.sin(Math.PI * value) * size * 0.4}
            stroke={color}
            strokeWidth="3"
            strokeLinecap="round"
            className={animate ? 'animate-needle' : ''}
          />
          
          {/* Gauge center */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={size * 0.05}
            fill={color}
            stroke="#cccccc"
            strokeWidth="1"
          />
          
          {/* Gauge ticks */}
          {Array.from({ length: 11 }).map((_, i) => {
            const tickValue = i / 10;
            const tickAngle = tickValue * Math.PI;
            const tickLength = i % 5 === 0 ? size * 0.1 : size * 0.05;
            
            return (
              <line
                key={i}
                x1={size / 2 - Math.cos(tickAngle) * size * 0.45}
                y1={size / 2 - Math.sin(tickAngle) * size * 0.45}
                x2={size / 2 - Math.cos(tickAngle) * (size * 0.45 - tickLength)}
                y2={size / 2 - Math.sin(tickAngle) * (size * 0.45 - tickLength)}
                stroke="#999999"
                strokeWidth="1"
              />
            );
          })}
        </svg>
        
        {showValue && (
          <div className="gauge-value" style={{ color }}>
            {(value * 100).toFixed(1)}%
          </div>
        )}
      </div>
    );
  }
}
```

### 4.4 EmotionalTrendWidget

A component to display a trend visualization for an emotional metric:

```typescript
interface EmotionalTrendWidgetProps {
  // History data points
  history: EmotionalMetricDataPoint[];
  
  // Time range for the trend
  timeRange?: TimeRange;
  
  // Size of the trend chart
  size?: { width: number; height: number };
  
  // Whether to show the value
  showValue?: boolean;
  
  // Whether to animate the trend
  animate?: boolean;
}

class EmotionalTrendWidget extends React.Component<EmotionalTrendWidgetProps> {
  componentDidMount() {
    // Register with extension system
    ExtensionRegistry.registerUIComponent({
      id: `emotional-trend-widget-${Math.random().toString(36).substr(2, 9)}`,
      component: this,
      extensionPoints: ['emotional-dashboard', 'trends-view']
    });
  }
  
  componentWillUnmount() {
    // Unregister from extension system
    ExtensionRegistry.unregisterUIComponent(`emotional-trend-widget-${Math.random().toString(36).substr(2, 9)}`);
  }
  
  render() {
    const { history, timeRange, size = { width: 300, height: 150 }, showValue = true, animate = true } = this.props;
    
    // Filter history based on time range
    const filteredHistory = timeRange
      ? history.filter(
          point => point.timestamp >= timeRange.start && point.timestamp <= timeRange.end
        )
      : history;
    
    // Sort history by timestamp
    const sortedHistory = [...filteredHistory].sort((a, b) => a.timestamp - b.timestamp);
    
    // Calculate min and max values
    const minValue = Math.min(0, ...sortedHistory.map(point => point.value));
    const maxValue = Math.max(1, ...sortedHistory.map(point => point.value));
    
    // Calculate current value (latest data point)
    const currentValue = sortedHistory.length > 0 ? sortedHistory[sortedHistory.length - 1].value : 0;
    
    // Calculate path for trend line
    const pathData = sortedHistory.length > 0
      ? sortedHistory.reduce((path, point, index) => {
          const x = (index / (sortedHistory.length - 1)) * size.width;
          const y = size.height - ((point.value - minValue) / (maxValue - minValue)) * size.height;
          
          return index === 0
            ? `M ${x},${y}`
            : `${path} L ${x},${y}`;
        }, '')
      : '';
    
    // Determine color based on current value trend
    const color =
      sortedHistory.length < 2
        ? '#44cc44'
        : sortedHistory[sortedHistory.length - 1].value < sortedHistory[sortedHistory.length - 2].value
        ? '#ff4d4d'
        : '#44cc44';
    
    return (
      <div
        className="emotional-trend-widget"
        style={{ width: size.width, height: size.height + 30 }}
      >
        <svg width={size.width} height={size.height}>
          {/* Trend background */}
          <rect
            x="0"
            y="0"
            width={size.width}
            height={size.height}
            fill="#f9f9f9"
            stroke="#eeeeee"
            strokeWidth="1"
          />
          
          {/* Horizontal grid lines */}
          {Array.from({ length: 5 }).map((_, i) => {
            const y = (i / 4) * size.height;
            
            return (
              <line
                key={i}
                x1="0"
                y1={y}
                x2={size.width}
                y2={y}
                stroke="#eeeeee"
                strokeWidth="1"
              />
            );
          })}
          
          {/* Trend line */}
          {sortedHistory.length > 1 && (
            <path
              d={pathData}
              fill="none"
              stroke={color}
              strokeWidth="2"
              className={animate ? 'animate-path' : ''}
            />
          )}
          
          {/* Data points */}
          {sortedHistory.map((point, index) => {
            const x = (index / (sortedHistory.length - 1)) * size.width;
            const y = size.height - ((point.value - minValue) / (maxValue - minValue)) * size.height;
            
            return (
              <circle
                key={index}
                cx={x}
                cy={y}
                r="3"
                fill={color}
                stroke="#ffffff"
                strokeWidth="1"
              />
            );
          })}
        </svg>
        
        {showValue && (
          <div className="trend-value" style={{ color }}>
            {(currentValue * 100).toFixed(1)}%
            {sortedHistory.length >= 2 && (
              <span className={sortedHistory[sortedHistory.length - 1].value >= sortedHistory[sortedHistory.length - 2].value ? 'trend-up' : 'trend-down'}>
                {sortedHistory[sortedHistory.length - 1].value >= sortedHistory[sortedHistory.length - 2].value ? '▲' : '▼'}
              </span>
            )}
          </div>
        )}
      </div>
    );
  }
}
```

### 4.5 EmotionalMetricDetail

A component to display detailed information about an emotional metric:

```typescript
interface EmotionalMetricDetailProps {
  // Metric ID
  metricId: string;
  
  // Time range for metric history
  timeRange?: TimeRange;
}

class EmotionalMetricDetail extends React.Component<EmotionalMetricDetailProps, EmotionalMetricDetailState> {
  componentDidMount() {
    // Register with extension system
    ExtensionRegistry.registerUIComponent({
      id: 'emotional-metric-detail',
      component: this,
      extensionPoints: ['veritas-dashboard']
    });
    
    // Initialize metric
    this.initializeMetric();
  }
  
  componentWillUnmount() {
    // Unregister from extension system
    ExtensionRegistry.unregisterUIComponent('emotional-metric-detail');
    
    // Cleanup listeners
    if (this.state.listenerId) {
      EmotionalVeritasService.deregisterListener(this.state.listenerId);
    }
  }
  
  componentDidUpdate(prevProps: EmotionalMetricDetailProps) {
    if (prevProps.metricId !== this.props.metricId) {
      this.initializeMetric();
    }
  }
  
  initializeMetric = async () => {
    const { metricId } = this.props;
    
    try {
      const metric = await EmotionalVeritasService.getMetricState(metricId);
      
      // Register listener for metric changes
      const listenerId = EmotionalVeritasService.registerListener({
        onMetricChange: this.handleMetricChange,
        metricFilter: [metricId]
      });
      
      this.setState({
        metric,
        loading: false,
        error: null,
        listenerId
      });
    } catch (error) {
      this.setState({
        loading: false,
        error: error.message
      });
    }
  };
  
  handleMetricChange = (metric: EmotionalMetric) => {
    this.setState({ metric });
  };
  
  render() {
    const { timeRange } = this.props;
    const { metric, loading, error } = this.state;
    
    if (loading) {
      return <LoadingIndicator />;
    }
    
    if (error) {
      return <ErrorDisplay message={error} onRetry={this.initializeMetric} />;
    }
    
    if (!metric) {
      return <ErrorDisplay message="Metric not found" />;
    }
    
    // Determine status based on thresholds
    const status =
      metric.value < metric.thresholds.critical
        ? 'critical'
        : metric.value < metric.thresholds.warning
        ? 'warning'
        : 'normal';
    
    return (
      <div className="emotional-metric-detail">
        <div className="metric-header">
          <h1>{metric.name}</h1>
          <div className={`impact-level ${metric.impactLevel}`}>
            {metric.impactLevel}
          </div>
        </div>
        
        <div className="metric-description">
          <p>{metric.description}</p>
        </div>
        
        <div className="metric-status">
          <div className={`status-indicator ${status}`}>
            {status === 'critical'
              ? 'Critical'
              : status === 'warning'
              ? 'Warning'
              : 'Normal'}
          </div>
          <div className="metric-value">
            <span className="label">Value:</span>
            <span className="value">{(metric.value * 100).toFixed(1)}%</span>
          </div>
        </div>
        
        <div className="metric-visualization">
          {metric.visualizationType === 'gauge' && (
            <EmotionalGaugeWidget
              value={metric.value}
              thresholds={metric.thresholds}
              size={400}
            />
          )}
          
          {metric.visualizationType === 'trend' && (
            <EmotionalTrendWidget
              history={metric.history}
              timeRange={timeRange}
              size={{ width: 800, height: 300 }}
            />
          )}
          
          {metric.visualizationType === 'comparison' && (
            <EmotionalComparisonWidget
              value={metric.value}
              relatedMetrics={metric.relatedMetrics.map(id => metrics[id])}
              size={{ width: 800, height: 400 }}
            />
          )}
          
          {metric.visualizationType === 'radar' && (
            <EmotionalRadarWidget
              value={metric.value}
              relatedMetrics={metric.relatedMetrics.map(id => metrics[id])}
              size={400}
            />
          )}
        </div>
        
        <div className="metric-details">
          <div className="detail-item">
            <span className="label">Category:</span>
            <span className="value">{metric.category}</span>
          </div>
          <div className="detail-item">
            <span className="label">Impact Level:</span>
            <span className="value">{metric.impactLevel}</span>
          </div>
          <div className="detail-item">
            <span className="label">Warning Threshold:</span>
            <span className="value">{(metric.thresholds.warning * 100).toFixed(1)}%</span>
          </div>
          <div className="detail-item">
            <span className="label">Critical Threshold:</span>
            <span className="value">{(metric.thresholds.critical * 100).toFixed(1)}%</span>
          </div>
        </div>
        
        <div className="related-metrics">
          <h2>Related Metrics</h2>
          <div className="related-metrics-list">
            {metric.relatedMetrics.map(relatedMetricId => {
              const relatedMetric = metrics[relatedMetricId];
              
              if (!relatedMetric) {
                return null;
              }
              
              return (
                <div
                  key={relatedMetricId}
                  className="related-metric-item"
                  onClick={() => {
                    // Navigate to related metric
                    RouteRegistry.navigate(`/dashboard/emotional/${relatedMetricId}`);
                  }}
                >
                  <div className="related-metric-name">{relatedMetric.name}</div>
                  <div className="related-metric-value">
                    {(relatedMetric.value * 100).toFixed(1)}%
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }
}
```

## 5. Extension Points

### 5.1 Emotional Veritas Extension Points

```typescript
// Register an emotional metric
ExtensionRegistry.registerExtensionPoint('emotionalVeritas:metric', {
  register: (metric: EmotionalMetric) => EmotionalVeritasRegistry.registerMetric(metric),
  deregister: (metricId: string) => EmotionalVeritasRegistry.deregisterMetric(metricId)
});

// Register an emotional metric listener
ExtensionRegistry.registerExtensionPoint('emotionalVeritas:listener', {
  register: (listener: EmotionalMetricListener) => EmotionalVeritasService.registerListener(listener),
  deregister: (listenerId: string) => EmotionalVeritasService.deregisterListener(listenerId)
});

// Register an emotional metric visualization
ExtensionRegistry.registerExtensionPoint('emotionalVeritas:visualization', {
  register: (visualization: EmotionalMetricVisualization) => EmotionalVisualizationRegistry.registerVisualization(visualization),
  deregister: (visualizationId: string) => EmotionalVisualizationRegistry.deregisterVisualization(visualizationId)
});
```

### 5.2 UI Extension Points

```typescript
// Register an emotional dashboard component
ExtensionRegistry.registerExtensionPoint('emotionalVeritas:dashboardComponent', {
  register: (component: EmotionalDashboardComponent) => EmotionalDashboardRegistry.registerComponent(component),
  deregister: (componentId: string) => EmotionalDashboardRegistry.deregisterComponent(componentId)
});

// Register an emotional metric card component
ExtensionRegistry.registerExtensionPoint('emotionalVeritas:metricCard', {
  register: (component: EmotionalMetricCardComponent) => EmotionalMetricCardRegistry.registerComponent(component),
  deregister: (componentId: string) => EmotionalMetricCardRegistry.deregisterComponent(componentId)
});
```

## 6. Integration with Extension System

### 6.1 Registration with ExtensionRegistry

```typescript
// Register emotional veritas extension
ExtensionRegistry.register({
  id: 'emotional-veritas-extension',
  name: 'Emotional Veritas Extension',
  description: 'Provides emotional impact analysis for governance decisions',
  version: '2.0.0',
  modules: ['emotional-veritas-module'],
  features: ['enableEmotionalVeritas'],
  initialize: () => EmotionalVeritasExtension.initialize(),
  cleanup: () => EmotionalVeritasExtension.cleanup()
});
```

### 6.2 Module Registration

```typescript
// Register emotional veritas module
ModuleRegistry.register({
  id: 'emotional-veritas-module',
  name: 'Emotional Veritas Module',
  description: 'Provides emotional veritas functionality',
  version: '2.0.0',
  dependencies: ['veritas-module', 'metrics-module'],
  initialize: () => EmotionalVeritasModule.initialize(),
  cleanup: () => EmotionalVeritasModule.cleanup()
});
```

### 6.3 Feature Toggle Integration

```typescript
// Register emotional veritas feature
FeatureToggleService.registerFeature({
  id: 'enableEmotionalVeritas',
  name: 'Enable Emotional Veritas',
  description: 'Enables emotional impact analysis for governance decisions',
  defaultEnabled: true,
  dependencies: ['enableVeritas'],
  contextRules: [
    {
      context: { userRole: 'guest' },
      enabled: false,
      priority: 90,
      description: 'Disabled for guest users'
    }
  ]
});

// Register emotional veritas dashboard feature
FeatureToggleService.registerFeature({
  id: 'enableEmotionalVeritasDashboard',
  name: 'Enable Emotional Veritas Dashboard',
  description: 'Enables the emotional veritas dashboard',
  defaultEnabled: true,
  dependencies: ['enableEmotionalVeritas'],
  contextRules: []
});
```

## 7. State Management

### 7.1 Emotional Veritas State

```typescript
interface EmotionalVeritasState {
  // Registered metrics
  metrics: {
    [metricId: string]: EmotionalMetric;
  };
  
  // Metric history
  metricHistory: {
    [metricId: string]: EmotionalMetricDataPoint[];
  };
  
  // Registered listeners
  listeners: {
    [listenerId: string]: EmotionalMetricListener;
  };
  
  // Visualization components
  visualizations: {
    [visualizationId: string]: EmotionalMetricVisualization;
  };
}
```

### 7.2 Integration with Veritas State

```typescript
interface VeritasState {
  // Veritas state properties
  // ...
  
  // Emotional veritas integration
  emotionalVeritas?: EmotionalVeritasState;
}
```

## 8. API Integration

### 8.1 Emotional Veritas API

```typescript
// Get all metrics
GET /api/emotional-veritas/metrics

// Get a specific metric
GET /api/emotional-veritas/metrics/:metricId

// Register a metric
POST /api/emotional-veritas/metrics
{
  "id": "trust-impact",
  "name": "Trust Impact",
  "description": "Measures the impact of governance decisions on user trust",
  "category": "trust",
  "impactLevel": "high",
  "thresholds": {
    "warning": 0.5,
    "critical": 0.3
  },
  "visualizationType": "gauge",
  "relatedMetrics": ["transparency-score", "consistency-score"]
}

// Update a metric
PUT /api/emotional-veritas/metrics/:metricId
{
  "name": "Updated Trust Impact",
  "description": "Updated description",
  "thresholds": {
    "warning": 0.6,
    "critical": 0.4
  }
}

// Delete a metric
DELETE /api/emotional-veritas/metrics/:metricId

// Get metric history
GET /api/emotional-veritas/metrics/:metricId/history
{
  "timeRange": {
    "start": 1623456789,
    "end": 1623556789,
    "resolution": "hour"
  }
}

// Compute metrics for a context
POST /api/emotional-veritas/compute
{
  "context": {
    "decision": {
      "id": "decision-123",
      "type": "governance",
      "outcome": "approved",
      "timestamp": 1623456789
    },
    "user": {
      "id": "user-123",
      "role": "developer"
    },
    "agent": {
      "id": "agent-123",
      "type": "assistant"
    }
  }
}
```

### 8.2 Dashboard API

```typescript
// Get dashboard configuration
GET /api/emotional-veritas/dashboard

// Update dashboard configuration
PUT /api/emotional-veritas/dashboard
{
  "layout": "grid",
  "showDetails": true,
  "showHistory": true,
  "timeRange": {
    "start": 1623456789,
    "end": 1623556789,
    "resolution": "hour"
  }
}

// Get dashboard metrics
GET /api/emotional-veritas/dashboard/metrics

// Add a metric to the dashboard
POST /api/emotional-veritas/dashboard/metrics
{
  "metricId": "trust-impact"
}

// Remove a metric from the dashboard
DELETE /api/emotional-veritas/dashboard/metrics/:metricId
```

## 9. Accessibility Considerations

### 9.1 Keyboard Navigation

The Emotional Veritas dashboard supports full keyboard navigation:

- Tab: Navigate between interactive elements
- Enter/Space: Activate buttons and controls
- Arrow keys: Navigate within components (e.g., metric cards)
- Escape: Close dialogs and popups

### 9.2 Screen Reader Support

All components include proper ARIA attributes:

- `aria-label`: Provides labels for controls
- `aria-describedby`: Links controls to descriptions
- `aria-live`: Announces dynamic content changes
- `role`: Defines the role of elements

### 9.3 Visual Accessibility

The Emotional Veritas dashboard includes visual accessibility features:

- High contrast mode support
- Scalable text and UI elements
- Color schemes that work for color-blind users
- Clear visual indicators for status and thresholds

## 10. Mobile Responsiveness

The Emotional Veritas dashboard is designed to be responsive across different screen sizes:

- Fluid layouts that adapt to screen width
- Touch-friendly controls with appropriate sizing
- Simplified layouts for small screens
- Orientation support (portrait and landscape)

## 11. Implementation Plan

### 11.1 Phase 1: Core Infrastructure

1. Implement `EmotionalVeritasRegistry`
2. Implement `EmotionalVeritasService`
3. Define default emotional metrics
4. Create state management for emotional veritas

### 11.2 Phase 2: UI Components

1. Implement `EmotionalVeritasDashboard`
2. Implement `EmotionalMetricCard`
3. Implement visualization components
4. Implement `EmotionalMetricDetail`

### 11.3 Phase 3: API Layer

1. Implement emotional veritas API endpoints
2. Implement dashboard API endpoints
3. Create API documentation
4. Implement API authentication and authorization

### 11.4 Phase 4: Integration

1. Integrate with ExtensionRegistry
2. Integrate with ModuleRegistry
3. Integrate with FeatureToggleService
4. Create integration tests

### 11.5 Phase 5: Testing and Documentation

1. Write unit tests for all components
2. Write integration tests for system interactions
3. Create comprehensive documentation
4. Develop example implementations

## 12. Next Steps

1. Implement `EmotionalVeritasRegistry` and `EmotionalVeritasService`
2. Define default emotional metrics
3. Create state management for emotional veritas
4. Begin UI component implementation
5. Develop API layer
