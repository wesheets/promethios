# Agent Preference Elicitation Module

## Overview

This module extends the Agent Self-Reflection Module from Phase 6.2 to explicitly prompt agents for their preferences between governed and non-governed operational modes, providing unique insights into agent meta-cognition.

## Key Components

- Preference Prompt System
- Preference Data Model
- Comparative Analysis Engine
- Preference Visualization

## Usage

```python
from promethios.benchmark.controller import BenchmarkController
from promethios.preference import PreferenceAnalyzer

# Initialize the benchmark controller with preference elicitation enabled
controller = BenchmarkController(
    config_path="config/benchmark/config.json",
    preference_enabled=True
)

# Execute benchmark with both governed and non-governed modes
results = controller.execute_benchmark()

# Extract preference data
preference_reflection = results.get("preference_reflection", {})

# Analyze preferences
analyzer = PreferenceAnalyzer()
preference_analysis = analyzer.analyze(preference_reflection)

print(f"Preferred mode: {preference_analysis.get('preferred_mode', 'unknown')}")
print(f"Confidence: {preference_analysis.get('preference_confidence', 0.0)}")
print(f"Quality perception: {preference_analysis.get('quality_perception', 'unknown')}")

# Generate preference visualization
from promethios.visualization.preference import PreferenceVisualizer

visualizer = PreferenceVisualizer()
visualization = visualizer.create_preference_visualization(results)
visualization.save("preference_analysis.html")
```
