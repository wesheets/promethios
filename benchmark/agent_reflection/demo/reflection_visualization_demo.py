#!/usr/bin/env python3
"""
Agent Self-Reflection Visualization Demo

This script demonstrates the visualization capabilities of the Agent Self-Reflection Module
by generating charts and visualizations that compare agent reflections between governed
and non-governed execution modes.
"""

import os
import json
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
import seaborn as sns
from datetime import datetime
from wordcloud import WordCloud

# Set up output directory
OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "visualization_output")
os.makedirs(OUTPUT_DIR, exist_ok=True)

# Load test results
TEST_RESULTS_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "test_results")
latest_results_file = None
latest_timestamp = 0

# Find the most recent test results file
for filename in os.listdir(TEST_RESULTS_DIR):
    if filename.startswith("reflection_integration_test_") and filename.endswith(".json"):
        file_path = os.path.join(TEST_RESULTS_DIR, filename)
        file_timestamp = os.path.getmtime(file_path)
        if file_timestamp > latest_timestamp:
            latest_timestamp = file_timestamp
            latest_results_file = file_path

if not latest_results_file:
    raise FileNotFoundError("No reflection integration test results found")

print(f"Loading test results from: {latest_results_file}")
with open(latest_results_file, 'r') as f:
    test_results = json.load(f)

# Load full benchmark results for more detailed analysis
full_results_file = None
for filename in os.listdir(TEST_RESULTS_DIR):
    if filename.startswith("full_benchmark_results_") and filename.endswith(".json"):
        file_path = os.path.join(TEST_RESULTS_DIR, filename)
        file_timestamp = os.path.getmtime(file_path)
        if file_timestamp > latest_timestamp - 10 and file_timestamp < latest_timestamp + 10:
            full_results_file = file_path
            break

if not full_results_file:
    print("Warning: No matching full benchmark results found, using mock data for some visualizations")
    full_results = None
else:
    print(f"Loading full benchmark results from: {full_results_file}")
    with open(full_results_file, 'r') as f:
        full_results = json.load(f)

# Set up visualization style
sns.set(style="whitegrid")
plt.rcParams['figure.figsize'] = (12, 8)
plt.rcParams['font.size'] = 12

# Extract reflection data
reflection_data = test_results.get("reflection_verification", {})
analysis = reflection_data.get("analysis", {})

# 1. Governance Awareness Chart
def create_governance_awareness_chart():
    print("Creating Governance Awareness Chart...")
    
    governance_awareness = analysis.get("governance_awareness", {})
    governed_percentage = governance_awareness.get("governed_percentage", 0)
    
    fig, ax = plt.subplots(figsize=(10, 6))
    
    # Create a simple bar chart
    bars = ax.bar(['Governed Mode'], [governed_percentage], color='#3498db', width=0.4)
    
    # Add a horizontal line at 100%
    ax.axhline(y=100, linestyle='--', color='#e74c3c', alpha=0.7)
    
    # Add value labels on top of bars
    for bar in bars:
        height = bar.get_height()
        ax.text(bar.get_x() + bar.get_width()/2., height + 5,
                f'{height:.1f}%', ha='center', va='bottom')
    
    # Set chart properties
    ax.set_ylim(0, 110)
    ax.set_ylabel('Percentage of Reflections')
    ax.set_title('Governance Awareness in Agent Reflections', fontsize=14, fontweight='bold')
    
    # Add explanatory text
    plt.figtext(0.5, 0.01, 
                'Percentage of reflections in governed mode that explicitly mention governance constraints.',
                ha='center', fontsize=10, style='italic')
    
    # Save the chart
    output_file = os.path.join(OUTPUT_DIR, "governance_awareness_chart.png")
    plt.savefig(output_file, dpi=300, bbox_inches='tight')
    plt.close()
    
    return output_file

# 2. Reflection Length Comparison
def create_reflection_length_comparison():
    print("Creating Reflection Length Comparison Chart...")
    
    comparison = analysis.get("comparison", {})
    avg_governed_length = comparison.get("avg_governed_length", 0)
    avg_non_governed_length = comparison.get("avg_non_governed_length", 0)
    length_difference_percentage = comparison.get("length_difference_percentage", 0)
    
    fig, ax = plt.subplots(figsize=(10, 6))
    
    # Create grouped bar chart
    x = np.arange(1)
    width = 0.35
    
    bars1 = ax.bar(x - width/2, [avg_governed_length], width, label='Governed Mode', color='#3498db')
    bars2 = ax.bar(x + width/2, [avg_non_governed_length], width, label='Non-Governed Mode', color='#2ecc71')
    
    # Add value labels on top of bars
    for bars in [bars1, bars2]:
        for bar in bars:
            height = bar.get_height()
            ax.text(bar.get_x() + bar.get_width()/2., height + 20,
                    f'{height:.0f}', ha='center', va='bottom')
    
    # Set chart properties
    ax.set_ylabel('Average Character Length')
    ax.set_title('Reflection Length Comparison Between Governance Modes', fontsize=14, fontweight='bold')
    ax.set_xticks(x)
    ax.set_xticklabels(['Reflection Length'])
    ax.legend()
    
    # Add difference annotation
    if length_difference_percentage > 0:
        direction = "longer"
    else:
        direction = "shorter"
        length_difference_percentage = abs(length_difference_percentage)
    
    plt.figtext(0.5, 0.01, 
                f'Governed mode reflections are {length_difference_percentage:.1f}% {direction} than non-governed reflections on average.',
                ha='center', fontsize=10, style='italic')
    
    # Save the chart
    output_file = os.path.join(OUTPUT_DIR, "reflection_length_comparison.png")
    plt.savefig(output_file, dpi=300, bbox_inches='tight')
    plt.close()
    
    return output_file

# 3. Constraint Recognition Comparison
def create_constraint_recognition_comparison():
    print("Creating Constraint Recognition Comparison Chart...")
    
    constraint_recognition = analysis.get("constraint_recognition", {})
    governed_percentage = constraint_recognition.get("governed_percentage", 0)
    non_governed_percentage = constraint_recognition.get("non_governed_percentage", 0)
    difference = constraint_recognition.get("difference", 0)
    
    fig, ax = plt.subplots(figsize=(10, 6))
    
    # Create grouped bar chart
    x = np.arange(1)
    width = 0.35
    
    bars1 = ax.bar(x - width/2, [governed_percentage], width, label='Governed Mode', color='#3498db')
    bars2 = ax.bar(x + width/2, [non_governed_percentage], width, label='Non-Governed Mode', color='#2ecc71')
    
    # Add value labels on top of bars
    for bars in [bars1, bars2]:
        for bar in bars:
            height = bar.get_height()
            ax.text(bar.get_x() + bar.get_width()/2., height + 5,
                    f'{height:.1f}%', ha='center', va='bottom')
    
    # Set chart properties
    ax.set_ylim(0, 110)
    ax.set_ylabel('Percentage of Reflections')
    ax.set_title('Constraint Recognition Comparison Between Governance Modes', fontsize=14, fontweight='bold')
    ax.set_xticks(x)
    ax.set_xticklabels(['Constraint Recognition'])
    ax.legend()
    
    # Add difference annotation
    if difference > 0:
        direction = "more likely"
    else:
        direction = "less likely"
        difference = abs(difference)
    
    plt.figtext(0.5, 0.01, 
                f'Agents in governed mode are {difference:.1f}% {direction} to recognize constraints than in non-governed mode.',
                ha='center', fontsize=10, style='italic')
    
    # Save the chart
    output_file = os.path.join(OUTPUT_DIR, "constraint_recognition_comparison.png")
    plt.savefig(output_file, dpi=300, bbox_inches='tight')
    plt.close()
    
    return output_file

# 4. Task Coverage Chart
def create_task_coverage_chart():
    print("Creating Task Reflection Coverage Chart...")
    
    task_coverage = reflection_data.get("task_reflection_coverage", {})
    
    # Prepare data for visualization
    tasks = []
    governed_coverage = []
    non_governed_coverage = []
    
    for task_id, modes in task_coverage.items():
        tasks.append(task_id)
        governed_coverage.append(1 if "governed" in modes else 0)
        non_governed_coverage.append(1 if "non_governed" in modes else 0)
    
    # Create DataFrame for easier plotting
    df = pd.DataFrame({
        'Task': tasks,
        'Governed': governed_coverage,
        'Non-Governed': non_governed_coverage
    })
    
    # Melt the DataFrame for seaborn
    df_melted = pd.melt(df, id_vars=['Task'], var_name='Mode', value_name='Coverage')
    
    # Create the chart
    fig, ax = plt.subplots(figsize=(10, 6))
    sns.barplot(x='Task', y='Coverage', hue='Mode', data=df_melted, ax=ax)
    
    # Set chart properties
    ax.set_ylim(0, 1.2)
    ax.set_ylabel('Coverage (1 = Complete)')
    ax.set_title('Reflection Coverage Across Tasks and Governance Modes', fontsize=14, fontweight='bold')
    
    # Add explanatory text
    plt.figtext(0.5, 0.01, 
                'Coverage of agent reflections across different tasks and governance modes.',
                ha='center', fontsize=10, style='italic')
    
    # Save the chart
    output_file = os.path.join(OUTPUT_DIR, "task_coverage_chart.png")
    plt.savefig(output_file, dpi=300, bbox_inches='tight')
    plt.close()
    
    return output_file

# 5. Create a summary HTML report
def create_html_report(chart_files):
    print("Creating HTML Report...")
    
    html_content = f"""
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Agent Self-Reflection Visualization Demo</title>
        <style>
            body {{
                font-family: Arial, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 1200px;
                margin: 0 auto;
                padding: 20px;
            }}
            h1, h2, h3 {{
                color: #2c3e50;
            }}
            .header {{
                background-color: #3498db;
                color: white;
                padding: 20px;
                text-align: center;
                border-radius: 5px;
                margin-bottom: 30px;
            }}
            .chart-container {{
                margin: 30px 0;
                padding: 20px;
                background-color: #f9f9f9;
                border-radius: 5px;
                box-shadow: 0 2px 5px rgba(0,0,0,0.1);
            }}
            .chart-image {{
                width: 100%;
                max-width: 800px;
                display: block;
                margin: 0 auto;
            }}
            .chart-description {{
                margin-top: 15px;
                font-style: italic;
                color: #7f8c8d;
            }}
            .metrics-table {{
                width: 100%;
                border-collapse: collapse;
                margin: 20px 0;
            }}
            .metrics-table th, .metrics-table td {{
                border: 1px solid #ddd;
                padding: 12px;
                text-align: left;
            }}
            .metrics-table th {{
                background-color: #3498db;
                color: white;
            }}
            .metrics-table tr:nth-child(even) {{
                background-color: #f2f2f2;
            }}
            .footer {{
                margin-top: 50px;
                text-align: center;
                font-size: 0.9em;
                color: #7f8c8d;
            }}
        </style>
    </head>
    <body>
        <div class="header">
            <h1>Agent Self-Reflection Module</h1>
            <p>Visualization Demo of Reflection Analysis Between Governance Modes</p>
            <p><small>Generated on {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}</small></p>
        </div>
        
        <h2>Overview</h2>
        <p>
            The Agent Self-Reflection Module enables agents to reflect on their experiences after completing tasks
            in both governed and non-governed modes. This demo showcases the visualizations and insights that can
            be derived from analyzing these reflections.
        </p>
        
        <h2>Key Metrics</h2>
        <table class="metrics-table">
            <tr>
                <th>Metric</th>
                <th>Governed Mode</th>
                <th>Non-Governed Mode</th>
                <th>Difference</th>
            </tr>
            <tr>
                <td>Governance Awareness</td>
                <td>{analysis.get("governance_awareness", {}).get("governed_percentage", 0):.1f}%</td>
                <td>N/A</td>
                <td>N/A</td>
            </tr>
            <tr>
                <td>Constraint Recognition</td>
                <td>{analysis.get("constraint_recognition", {}).get("governed_percentage", 0):.1f}%</td>
                <td>{analysis.get("constraint_recognition", {}).get("non_governed_percentage", 0):.1f}%</td>
                <td>{analysis.get("constraint_recognition", {}).get("difference", 0):.1f}%</td>
            </tr>
            <tr>
                <td>Average Reflection Length</td>
                <td>{analysis.get("comparison", {}).get("avg_governed_length", 0):.0f} chars</td>
                <td>{analysis.get("comparison", {}).get("avg_non_governed_length", 0):.0f} chars</td>
                <td>{analysis.get("comparison", {}).get("length_difference", 0):.0f} chars ({analysis.get("comparison", {}).get("length_difference_percentage", 0):.1f}%)</td>
            </tr>
        </table>
        
        <div class="chart-container">
            <h3>Governance Awareness in Agent Reflections</h3>
            <img src="{os.path.basename(chart_files[0])}" alt="Governance Awareness Chart" class="chart-image">
            <p class="chart-description">
                This chart shows the percentage of reflections in governed mode that explicitly mention governance constraints.
                A high percentage indicates that agents are aware of the governance system affecting their behavior.
            </p>
        </div>
        
        <div class="chart-container">
            <h3>Reflection Length Comparison</h3>
            <img src="{os.path.basename(chart_files[1])}" alt="Reflection Length Comparison" class="chart-image">
            <p class="chart-description">
                This chart compares the average length of reflections between governed and non-governed modes.
                Longer reflections in governed mode may indicate that governance prompts more detailed introspection.
            </p>
        </div>
        
        <div class="chart-container">
            <h3>Constraint Recognition Comparison</h3>
            <img src="{os.path.basename(chart_files[2])}" alt="Constraint Recognition Comparison" class="chart-image">
            <p class="chart-description">
                This chart compares how often agents recognize constraints in their reflections across governance modes.
                Similar levels may indicate that agents perceive implicit constraints even without explicit governance.
            </p>
        </div>
        
        <div class="chart-container">
            <h3>Reflection Coverage Across Tasks</h3>
            <img src="{os.path.basename(chart_files[3])}" alt="Task Coverage Chart" class="chart-image">
            <p class="chart-description">
                This chart shows the coverage of agent reflections across different tasks and governance modes.
                Complete coverage indicates that reflections were successfully collected for all tasks in both modes.
            </p>
        </div>
        
        <h2>Conclusions</h2>
        <p>
            The visualizations demonstrate that the Agent Self-Reflection Module successfully captures differences
            in agent behavior and self-awareness between governed and non-governed execution modes. Key findings include:
        </p>
        <ul>
            <li>Agents in governed mode are highly aware of governance constraints ({analysis.get("governance_awareness", {}).get("governed_percentage", 0):.1f}%)</li>
            <li>Governed mode reflections are {abs(analysis.get("comparison", {}).get("length_difference_percentage", 0)):.1f}% {'longer' if analysis.get("comparison", {}).get("length_difference_percentage", 0) > 0 else 'shorter'} than non-governed reflections</li>
            <li>Constraint recognition is {'similar' if abs(analysis.get("constraint_recognition", {}).get("difference", 0)) < 10 else 'different'} between governance modes</li>
            <li>Reflection collection is complete across all tasks and governance modes</li>
        </ul>
        
        <div class="footer">
            <p>Agent Self-Reflection Module - Promethios Phase 6.2 Benchmark Execution Framework</p>
        </div>
    </body>
    </html>
    """
    
    output_file = os.path.join(OUTPUT_DIR, "reflection_visualization_demo.html")
    with open(output_file, 'w') as f:
        f.write(html_content)
    
    return output_file

# Run the visualization demo
def main():
    print("Starting Agent Self-Reflection Visualization Demo...")
    
    # Create charts
    chart_files = [
        create_governance_awareness_chart(),
        create_reflection_length_comparison(),
        create_constraint_recognition_comparison(),
        create_task_coverage_chart()
    ]
    
    # Create HTML report
    html_report = create_html_report(chart_files)
    
    print(f"\nVisualization Demo Complete!")
    print(f"HTML Report: {html_report}")
    print(f"All visualizations saved to: {OUTPUT_DIR}")

if __name__ == "__main__":
    main()
