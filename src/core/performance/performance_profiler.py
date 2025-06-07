"""
Performance profiling and optimization framework for Promethios.

This module provides tools for measuring, analyzing, and optimizing system performance
to ensure security enhancements don't introduce bottlenecks or degrade responsiveness.
"""

import time
import cProfile
import pstats
import io
import os
import json
import logging
import threading
import functools
from typing import Dict, List, Optional, Union, Any, Callable
from datetime import datetime, timedelta
from enum import Enum
from collections import defaultdict

# Configure logging
logger = logging.getLogger(__name__)

class PerformanceMetricType(Enum):
    """Enumeration of performance metric types."""
    EXECUTION_TIME = "execution_time"
    MEMORY_USAGE = "memory_usage"
    CPU_USAGE = "cpu_usage"
    THROUGHPUT = "throughput"
    LATENCY = "latency"
    ERROR_RATE = "error_rate"
    RESOURCE_UTILIZATION = "resource_utilization"

class PerformanceLevel(Enum):
    """Enumeration of performance levels."""
    EXCELLENT = "excellent"
    GOOD = "good"
    ACCEPTABLE = "acceptable"
    POOR = "poor"
    CRITICAL = "critical"

class PerformanceMetric:
    """Performance metric with metadata."""
    
    def __init__(self, 
                name: str,
                type: PerformanceMetricType,
                value: float,
                unit: str,
                timestamp: datetime,
                context: Optional[Dict[str, Any]] = None):
        """
        Initialize a performance metric.
        
        Args:
            name: Metric name
            type: Metric type
            value: Metric value
            unit: Metric unit
            timestamp: Measurement timestamp
            context: Additional context information
        """
        self.name = name
        self.type = type
        self.value = value
        self.unit = unit
        self.timestamp = timestamp
        self.context = context or {}
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert metric to dictionary for serialization."""
        return {
            "name": self.name,
            "type": self.type.value,
            "value": self.value,
            "unit": self.unit,
            "timestamp": self.timestamp.isoformat(),
            "context": self.context
        }
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'PerformanceMetric':
        """Create metric from dictionary."""
        return cls(
            name=data["name"],
            type=PerformanceMetricType(data["type"]),
            value=data["value"],
            unit=data["unit"],
            timestamp=datetime.fromisoformat(data["timestamp"]),
            context=data.get("context", {})
        )

class PerformanceThreshold:
    """Threshold for performance metrics."""
    
    def __init__(self, 
                metric_name: str,
                warning_threshold: float,
                critical_threshold: float,
                comparison: str = "greater"):
        """
        Initialize a performance threshold.
        
        Args:
            metric_name: Name of the metric
            warning_threshold: Threshold for warning level
            critical_threshold: Threshold for critical level
            comparison: Comparison type ("greater" or "less")
        """
        self.metric_name = metric_name
        self.warning_threshold = warning_threshold
        self.critical_threshold = critical_threshold
        self.comparison = comparison
    
    def evaluate(self, metric: PerformanceMetric) -> Optional[PerformanceLevel]:
        """
        Evaluate a metric against this threshold.
        
        Args:
            metric: Metric to evaluate
            
        Returns:
            Performance level if threshold is exceeded, None otherwise
        """
        if metric.name != self.metric_name:
            return None
        
        value = metric.value
        
        if self.comparison == "greater":
            if value >= self.critical_threshold:
                return PerformanceLevel.CRITICAL
            elif value >= self.warning_threshold:
                return PerformanceLevel.POOR
        elif self.comparison == "less":
            if value <= self.critical_threshold:
                return PerformanceLevel.CRITICAL
            elif value <= self.warning_threshold:
                return PerformanceLevel.POOR
        
        return None

class PerformanceProfiler:
    """
    Performance profiling and monitoring system.
    
    This class provides tools for measuring and analyzing system performance,
    with support for thresholds, alerts, and optimization recommendations.
    """
    
    def __init__(self, 
                storage_path: Optional[str] = None,
                alert_threshold: PerformanceLevel = PerformanceLevel.POOR):
        """
        Initialize the performance profiler.
        
        Args:
            storage_path: Path to persistent storage (optional)
            alert_threshold: Threshold for generating alerts
        """
        self.metrics: Dict[str, List[PerformanceMetric]] = defaultdict(list)
        self.thresholds: Dict[str, PerformanceThreshold] = {}
        self.storage_path = storage_path
        self.alert_threshold = alert_threshold
        self.lock = threading.RLock()
        
        # Load metrics from storage if available
        if storage_path:
            self._load_metrics()
    
    def add_metric(self, metric: PerformanceMetric) -> Optional[PerformanceLevel]:
        """
        Add a performance metric.
        
        Args:
            metric: Performance metric
            
        Returns:
            Performance level if a threshold is exceeded, None otherwise
        """
        with self.lock:
            # Add metric to storage
            self.metrics[metric.name].append(metric)
            
            # Trim metrics if needed
            max_metrics = 1000  # Keep at most 1000 metrics per name
            if len(self.metrics[metric.name]) > max_metrics:
                self.metrics[metric.name] = self.metrics[metric.name][-max_metrics:]
            
            # Save to storage if available
            if self.storage_path:
                self._save_metrics()
            
            # Check thresholds
            threshold = self.thresholds.get(metric.name)
            if threshold:
                level = threshold.evaluate(metric)
                if level and level.value in [PerformanceLevel.POOR.value, PerformanceLevel.CRITICAL.value]:
                    if level.value >= self.alert_threshold.value:
                        logger.warning(
                            f"Performance threshold exceeded: {metric.name} = {metric.value} {metric.unit} ({level.value})"
                        )
                    return level
            
            return None
    
    def add_threshold(self, threshold: PerformanceThreshold):
        """
        Add a performance threshold.
        
        Args:
            threshold: Performance threshold
        """
        with self.lock:
            self.thresholds[threshold.metric_name] = threshold
    
    def get_metrics(self, 
                   name: Optional[str] = None, 
                   type: Optional[PerformanceMetricType] = None,
                   start_time: Optional[datetime] = None,
                   end_time: Optional[datetime] = None) -> List[PerformanceMetric]:
        """
        Get performance metrics.
        
        Args:
            name: Filter by metric name
            type: Filter by metric type
            start_time: Filter by start time
            end_time: Filter by end time
            
        Returns:
            List of matching metrics
        """
        with self.lock:
            result = []
            
            # Get metrics by name or all metrics
            if name:
                metrics = self.metrics.get(name, [])
            else:
                metrics = [m for sublist in self.metrics.values() for m in sublist]
            
            # Apply filters
            for metric in metrics:
                if type and metric.type != type:
                    continue
                
                if start_time and metric.timestamp < start_time:
                    continue
                
                if end_time and metric.timestamp > end_time:
                    continue
                
                result.append(metric)
            
            return result
    
    def get_statistics(self, 
                      name: str, 
                      start_time: Optional[datetime] = None,
                      end_time: Optional[datetime] = None) -> Dict[str, Any]:
        """
        Get statistics for a metric.
        
        Args:
            name: Metric name
            start_time: Filter by start time
            end_time: Filter by end time
            
        Returns:
            Dictionary with statistics
        """
        metrics = self.get_metrics(name, start_time=start_time, end_time=end_time)
        if not metrics:
            return {}
        
        values = [m.value for m in metrics]
        return {
            "count": len(values),
            "min": min(values),
            "max": max(values),
            "avg": sum(values) / len(values),
            "p50": sorted(values)[len(values) // 2],
            "p90": sorted(values)[int(len(values) * 0.9)],
            "p95": sorted(values)[int(len(values) * 0.95)],
            "p99": sorted(values)[int(len(values) * 0.99)],
            "unit": metrics[0].unit
        }
    
    def _save_metrics(self):
        """Save metrics to persistent storage."""
        if not self.storage_path:
            return
        
        # Create directory if needed
        os.makedirs(os.path.dirname(self.storage_path), exist_ok=True)
        
        # Serialize metrics
        data = {}
        for name, metrics in self.metrics.items():
            data[name] = [m.to_dict() for m in metrics]
        
        # Write to file
        with open(self.storage_path, 'w') as f:
            json.dump(data, f)
    
    def _load_metrics(self):
        """Load metrics from persistent storage."""
        if not self.storage_path or not os.path.exists(self.storage_path):
            return
        
        try:
            with open(self.storage_path, 'r') as f:
                data = json.load(f)
            
            # Load metrics
            for name, metrics_data in data.items():
                self.metrics[name] = [PerformanceMetric.from_dict(m) for m in metrics_data]
        except Exception as e:
            logger.error(f"Failed to load metrics: {e}")

def measure_execution_time(func=None, *, name=None):
    """
    Decorator for measuring function execution time.
    
    Args:
        func: Function to decorate
        name: Custom metric name
        
    Returns:
        Decorated function
    """
    def decorator(func):
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            start_time = time.time()
            result = func(*args, **kwargs)
            end_time = time.time()
            
            execution_time = end_time - start_time
            metric_name = name or f"{func.__module__}.{func.__name__}"
            
            # Create metric
            metric = PerformanceMetric(
                name=metric_name,
                type=PerformanceMetricType.EXECUTION_TIME,
                value=execution_time,
                unit="seconds",
                timestamp=datetime.utcnow(),
                context={
                    "function": func.__name__,
                    "module": func.__module__
                }
            )
            
            # Add metric to profiler
            global_profiler.add_metric(metric)
            
            return result
        return wrapper
    
    if func is None:
        return decorator
    return decorator(func)

def profile_function(func=None, *, name=None, top_n=10):
    """
    Decorator for profiling function execution.
    
    Args:
        func: Function to decorate
        name: Custom profile name
        top_n: Number of top functions to include in profile
        
    Returns:
        Decorated function
    """
    def decorator(func):
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            profile_name = name or f"{func.__module__}.{func.__name__}"
            
            # Create profiler
            pr = cProfile.Profile()
            pr.enable()
            
            # Call function
            result = func(*args, **kwargs)
            
            # Disable profiler
            pr.disable()
            
            # Get stats
            s = io.StringIO()
            ps = pstats.Stats(pr, stream=s).sort_stats('cumulative')
            ps.print_stats(top_n)
            
            # Log profile
            logger.info(f"Profile for {profile_name}:\n{s.getvalue()}")
            
            return result
        return wrapper
    
    if func is None:
        return decorator
    return decorator(func)

class PerformanceOptimizer:
    """
    Performance optimization system.
    
    This class provides tools for analyzing performance data and
    generating optimization recommendations.
    """
    
    def __init__(self, profiler: PerformanceProfiler):
        """
        Initialize the performance optimizer.
        
        Args:
            profiler: Performance profiler
        """
        self.profiler = profiler
    
    def analyze_hotspots(self, 
                        start_time: Optional[datetime] = None,
                        end_time: Optional[datetime] = None,
                        threshold: float = 0.1) -> List[Dict[str, Any]]:
        """
        Analyze performance hotspots.
        
        Args:
            start_time: Filter by start time
            end_time: Filter by end time
            threshold: Threshold for hotspot detection (seconds)
            
        Returns:
            List of hotspots
        """
        # Get execution time metrics
        metrics = self.profiler.get_metrics(
            type=PerformanceMetricType.EXECUTION_TIME,
            start_time=start_time,
            end_time=end_time
        )
        
        # Group by name
        grouped = defaultdict(list)
        for metric in metrics:
            grouped[metric.name].append(metric)
        
        # Calculate statistics
        hotspots = []
        for name, metrics in grouped.items():
            values = [m.value for m in metrics]
            avg = sum(values) / len(values)
            
            if avg >= threshold:
                hotspots.append({
                    "name": name,
                    "avg_time": avg,
                    "max_time": max(values),
                    "call_count": len(values),
                    "total_time": sum(values)
                })
        
        # Sort by total time
        hotspots.sort(key=lambda x: x["total_time"], reverse=True)
        
        return hotspots
    
    def generate_recommendations(self) -> List[Dict[str, Any]]:
        """
        Generate optimization recommendations.
        
        Returns:
            List of recommendations
        """
        recommendations = []
        
        # Analyze recent hotspots
        start_time = datetime.utcnow() - timedelta(hours=24)
        hotspots = self.analyze_hotspots(start_time=start_time)
        
        # Generate recommendations for hotspots
        for hotspot in hotspots[:5]:  # Top 5 hotspots
            name = hotspot["name"]
            avg_time = hotspot["avg_time"]
            
            if avg_time >= 1.0:
                # Significant hotspot
                recommendations.append({
                    "priority": "high",
                    "component": name,
                    "issue": f"High execution time: {avg_time:.2f} seconds",
                    "recommendation": "Consider caching results or optimizing algorithm"
                })
            elif avg_time >= 0.1:
                # Moderate hotspot
                recommendations.append({
                    "priority": "medium",
                    "component": name,
                    "issue": f"Moderate execution time: {avg_time:.2f} seconds",
                    "recommendation": "Review implementation for optimization opportunities"
                })
        
        return recommendations

# Create global instances
global_profiler = PerformanceProfiler(storage_path="/var/lib/promethios/performance.json")
global_optimizer = PerformanceOptimizer(global_profiler)

def initialize():
    """Initialize the performance profiling framework."""
    # Add default thresholds
    global_profiler.add_threshold(
        PerformanceThreshold(
            metric_name="api.request.time",
            warning_threshold=0.5,  # 500ms
            critical_threshold=2.0,  # 2s
            comparison="greater"
        )
    )
    
    global_profiler.add_threshold(
        PerformanceThreshold(
            metric_name="crypto.encryption.time",
            warning_threshold=0.1,  # 100ms
            critical_threshold=0.5,  # 500ms
            comparison="greater"
        )
    )
    
    global_profiler.add_threshold(
        PerformanceThreshold(
            metric_name="extension.load.time",
            warning_threshold=1.0,  # 1s
            critical_threshold=5.0,  # 5s
            comparison="greater"
        )
    )
    
    logger.info("Performance profiling framework initialized")
