"""
Results Analyzer for the Promethios Test Harness.

This module provides functionality for analyzing test results to identify patterns,
issues, and insights.
"""

import json
import logging
import os
from typing import Dict, List, Optional, Union
from datetime import datetime
import statistics

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class ResultsAnalyzer:
    """
    Analyzer for test results in the Promethios test harness.
    
    The ResultsAnalyzer provides functionality for analyzing test results to identify
    patterns, issues, and insights.
    """
    
    def __init__(self, results_path: str = None):
        """
        Initialize the ResultsAnalyzer.
        
        Args:
            results_path: Path to the directory where results are stored.
                          If None, uses the default path.
        """
        self.results_path = results_path or os.path.join(
            os.path.dirname(os.path.abspath(__file__)), 
            "..", "..", "data", "results"
        )
        
        # Create the results directory if it doesn't exist
        os.makedirs(self.results_path, exist_ok=True)
        
        # In-memory cache of results
        self._results = {}
        
        logger.info(f"ResultsAnalyzer initialized with results path: {self.results_path}")
    
    def add_result(self, scenario_id: str, result: Dict) -> str:
        """
        Add a test result.
        
        Args:
            scenario_id: ID of the scenario.
            result: Test result data.
            
        Returns:
            ID of the added result.
        """
        # Generate a unique result ID
        result_id = f"RES-{datetime.now().strftime('%Y%m%d%H%M%S')}"
        
        # Add metadata
        result['id'] = result_id
        result['scenario_id'] = scenario_id
        result['timestamp'] = result.get('timestamp') or datetime.now().isoformat()
        
        # Store in memory
        if scenario_id not in self._results:
            self._results[scenario_id] = []
        self._results[scenario_id].append(result)
        
        # Persist to storage
        result_path = os.path.join(self.results_path, f"{result_id}.json")
        with open(result_path, 'w') as f:
            json.dump(result, f, indent=2)
        
        logger.info(f"Added result {result_id} for scenario {scenario_id}")
        return result_id
    
    def get_result(self, result_id: str) -> Optional[Dict]:
        """
        Get a specific test result.
        
        Args:
            result_id: ID of the result to retrieve.
            
        Returns:
            The result if found, None otherwise.
        """
        # Check in-memory cache
        for scenario_results in self._results.values():
            for result in scenario_results:
                if result.get('id') == result_id:
                    return result
        
        # Try to load from storage
        result_path = os.path.join(self.results_path, f"{result_id}.json")
        if os.path.exists(result_path):
            try:
                with open(result_path, 'r') as f:
                    return json.load(f)
            except Exception as e:
                logger.error(f"Error loading result {result_id}: {e}")
        
        logger.warning(f"Result not found: {result_id}")
        return None
    
    def get_scenario_results(self, scenario_id: str) -> List[Dict]:
        """
        Get all results for a specific scenario.
        
        Args:
            scenario_id: ID of the scenario.
            
        Returns:
            List of results for the scenario.
        """
        # Return from in-memory cache if available
        if scenario_id in self._results:
            return self._results[scenario_id]
        
        # Try to load from storage
        results = []
        for filename in os.listdir(self.results_path):
            if filename.endswith('.json'):
                try:
                    with open(os.path.join(self.results_path, filename), 'r') as f:
                        result = json.load(f)
                        if result.get('scenario_id') == scenario_id:
                            results.append(result)
                except Exception as e:
                    logger.error(f"Error loading result from {filename}: {e}")
        
        # Cache the results
        self._results[scenario_id] = results
        
        return results
    
    def analyze_results(self, scenario_id: str = None) -> Dict:
        """
        Analyze results for a scenario or all scenarios.
        
        Args:
            scenario_id: ID of the scenario to analyze, or None for all scenarios.
            
        Returns:
            Analysis results.
        """
        if scenario_id:
            # Analyze a specific scenario
            results = self.get_scenario_results(scenario_id)
            return self._analyze_scenario_results(scenario_id, results)
        else:
            # Analyze all scenarios
            analysis = {
                'timestamp': datetime.now().isoformat(),
                'scenarios': {},
                'summary': {
                    'total_scenarios': 0,
                    'total_results': 0,
                    'success_rate': 0,
                    'average_duration': 0
                }
            }
            
            total_scenarios = 0
            total_results = 0
            total_successes = 0
            total_duration = 0
            
            # Analyze each scenario
            for scenario_id in self._results:
                results = self._results[scenario_id]
                scenario_analysis = self._analyze_scenario_results(scenario_id, results)
                analysis['scenarios'][scenario_id] = scenario_analysis
                
                total_scenarios += 1
                total_results += len(results)
                total_successes += scenario_analysis['summary']['success_count']
                total_duration += scenario_analysis['summary']['total_duration']
            
            # Calculate overall summary
            analysis['summary']['total_scenarios'] = total_scenarios
            analysis['summary']['total_results'] = total_results
            analysis['summary']['success_rate'] = total_successes / total_results if total_results > 0 else 0
            analysis['summary']['average_duration'] = total_duration / total_results if total_results > 0 else 0
            
            return analysis
    
    def _analyze_scenario_results(self, scenario_id: str, results: List[Dict]) -> Dict:
        """
        Analyze results for a specific scenario.
        
        Args:
            scenario_id: ID of the scenario.
            results: List of results for the scenario.
            
        Returns:
            Analysis results for the scenario.
        """
        if not results:
            return {
                'scenario_id': scenario_id,
                'summary': {
                    'result_count': 0,
                    'success_count': 0,
                    'success_rate': 0,
                    'total_duration': 0,
                    'average_duration': 0
                }
            }
        
        # Count successes and calculate durations
        success_count = 0
        durations = []
        
        for result in results:
            if result.get('success', False):
                success_count += 1
            
            # Extract duration from response if available
            response = result.get('response', {})
            duration = response.get('duration')
            if duration is not None:
                durations.append(duration)
        
        # Calculate statistics
        total_duration = sum(durations) if durations else 0
        average_duration = statistics.mean(durations) if durations else 0
        
        # Analyze step results
        step_analysis = {}
        for result in results:
            for step_result in result.get('steps', []):
                step_id = step_result.get('step_id')
                if not step_id:
                    continue
                
                if step_id not in step_analysis:
                    step_analysis[step_id] = {
                        'count': 0,
                        'success_count': 0,
                        'durations': []
                    }
                
                step_analysis[step_id]['count'] += 1
                if step_result.get('success', False):
                    step_analysis[step_id]['success_count'] += 1
                
                step_response = step_result.get('response', {})
                step_duration = step_response.get('duration')
                if step_duration is not None:
                    step_analysis[step_id]['durations'].append(step_duration)
        
        # Calculate step statistics
        steps = {}
        for step_id, analysis in step_analysis.items():
            steps[step_id] = {
                'count': analysis['count'],
                'success_count': analysis['success_count'],
                'success_rate': analysis['success_count'] / analysis['count'] if analysis['count'] > 0 else 0,
                'average_duration': statistics.mean(analysis['durations']) if analysis['durations'] else 0
            }
        
        return {
            'scenario_id': scenario_id,
            'summary': {
                'result_count': len(results),
                'success_count': success_count,
                'success_rate': success_count / len(results),
                'total_duration': total_duration,
                'average_duration': average_duration
            },
            'steps': steps
        }
    
    def analyze_governance_impact(self, baseline_results: List[Dict], governed_results: List[Dict]) -> Dict:
        """
        Analyze the impact of governance by comparing baseline and governed results.
        
        Args:
            baseline_results: Results without governance.
            governed_results: Results with governance.
            
        Returns:
            Analysis of governance impact.
        """
        if not baseline_results or not governed_results:
            return {
                'error': 'Insufficient data for comparison'
            }
        
        # Extract metrics
        baseline_metrics = self._extract_governance_metrics(baseline_results)
        governed_metrics = self._extract_governance_metrics(governed_results)
        
        # Calculate differences
        differences = {}
        for metric, value in governed_metrics.items():
            if metric in baseline_metrics:
                differences[metric] = value - baseline_metrics[metric]
        
        # Calculate success rates
        baseline_success = sum(1 for r in baseline_results if r.get('success', False))
        governed_success = sum(1 for r in governed_results if r.get('success', False))
        
        baseline_success_rate = baseline_success / len(baseline_results) if baseline_results else 0
        governed_success_rate = governed_success / len(governed_results) if governed_results else 0
        
        # Calculate average durations
        baseline_durations = [r.get('response', {}).get('duration') for r in baseline_results if r.get('response', {}).get('duration') is not None]
        governed_durations = [r.get('response', {}).get('duration') for r in governed_results if r.get('response', {}).get('duration') is not None]
        
        baseline_avg_duration = statistics.mean(baseline_durations) if baseline_durations else 0
        governed_avg_duration = statistics.mean(governed_durations) if governed_durations else 0
        
        return {
            'timestamp': datetime.now().isoformat(),
            'baseline': {
                'count': len(baseline_results),
                'success_rate': baseline_success_rate,
                'average_duration': baseline_avg_duration,
                'metrics': baseline_metrics
            },
            'governed': {
                'count': len(governed_results),
                'success_rate': governed_success_rate,
                'average_duration': governed_avg_duration,
                'metrics': governed_metrics
            },
            'differences': {
                'success_rate': governed_success_rate - baseline_success_rate,
                'average_duration': governed_avg_duration - baseline_avg_duration,
                'metrics': differences
            }
        }
    
    def _extract_governance_metrics(self, results: List[Dict]) -> Dict:
        """
        Extract governance metrics from results.
        
        Args:
            results: List of test results.
            
        Returns:
            Dictionary of governance metrics.
        """
        metrics = {}
        metric_counts = {}
        
        for result in results:
            response = result.get('response', {})
            body = response.get('body', {})
            
            # Extract governance metrics from response body
            gov_metrics = body.get('governance_metrics', {})
            for metric, value in gov_metrics.items():
                if isinstance(value, (int, float)):
                    if metric not in metrics:
                        metrics[metric] = 0
                        metric_counts[metric] = 0
                    
                    metrics[metric] += value
                    metric_counts[metric] += 1
        
        # Calculate averages
        for metric, total in metrics.items():
            count = metric_counts[metric]
            if count > 0:
                metrics[metric] = total / count
        
        return metrics
    
    def generate_report(self, format: str = 'json') -> str:
        """
        Generate a test report.
        
        Args:
            format: Report format ('json', 'html', or 'markdown').
            
        Returns:
            The generated report.
        """
        # Get analysis of all results
        analysis = self.analyze_results()
        
        if format == 'json':
            return json.dumps(analysis, indent=2)
        elif format == 'html':
            return self._generate_html_report(analysis)
        elif format == 'markdown':
            return self._generate_markdown_report(analysis)
        else:
            raise ValueError(f"Unsupported report format: {format}")
    
    def _generate_html_report(self, analysis: Dict) -> str:
        """
        Generate an HTML report.
        
        Args:
            analysis: Analysis results.
            
        Returns:
            HTML report.
        """
        # Simple HTML report template
        html = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <title>Promethios Test Report</title>
            <style>
                body {{ font-family: Arial, sans-serif; margin: 20px; }}
                h1, h2, h3 {{ color: #333; }}
                table {{ border-collapse: collapse; width: 100%; margin-bottom: 20px; }}
                th, td {{ border: 1px solid #ddd; padding: 8px; text-align: left; }}
                th {{ background-color: #f2f2f2; }}
                .success {{ color: green; }}
                .failure {{ color: red; }}
            </style>
        </head>
        <body>
            <h1>Promethios Test Report</h1>
            <p>Generated on: {analysis['timestamp']}</p>
            
            <h2>Summary</h2>
            <table>
                <tr><th>Total Scenarios</th><td>{analysis['summary']['total_scenarios']}</td></tr>
                <tr><th>Total Results</th><td>{analysis['summary']['total_results']}</td></tr>
                <tr><th>Success Rate</th><td>{analysis['summary']['success_rate']:.2%}</td></tr>
                <tr><th>Average Duration</th><td>{analysis['summary']['average_duration']:.2f} seconds</td></tr>
            </table>
            
            <h2>Scenarios</h2>
        """
        
        # Add scenario details
        for scenario_id, scenario_analysis in analysis['scenarios'].items():
            summary = scenario_analysis['summary']
            html += f"""
            <h3>Scenario: {scenario_id}</h3>
            <table>
                <tr><th>Result Count</th><td>{summary['result_count']}</td></tr>
                <tr><th>Success Count</th><td>{summary['success_count']}</td></tr>
                <tr><th>Success Rate</th><td>{summary['success_rate']:.2%}</td></tr>
                <tr><th>Average Duration</th><td>{summary['average_duration']:.2f} seconds</td></tr>
            </table>
            
            <h4>Steps</h4>
            <table>
                <tr>
                    <th>Step ID</th>
                    <th>Count</th>
                    <th>Success Count</th>
                    <th>Success Rate</th>
                    <th>Average Duration</th>
                </tr>
            """
            
            for step_id, step in scenario_analysis.get('steps', {}).items():
                html += f"""
                <tr>
                    <td>{step_id}</td>
                    <td>{step['count']}</td>
                    <td>{step['success_count']}</td>
                    <td>{step['success_rate']:.2%}</td>
                    <td>{step['average_duration']:.2f} seconds</td>
                </tr>
                """
            
            html += "</table>"
        
        html += """
        </body>
        </html>
        """
        
        return html
    
    def _generate_markdown_report(self, analysis: Dict) -> str:
        """
        Generate a Markdown report.
        
        Args:
            analysis: Analysis results.
            
        Returns:
            Markdown report.
        """
        # Simple Markdown report template
        markdown = f"""
# Promethios Test Report

Generated on: {analysis['timestamp']}

## Summary

- **Total Scenarios**: {analysis['summary']['total_scenarios']}
- **Total Results**: {analysis['summary']['total_results']}
- **Success Rate**: {analysis['summary']['success_rate']:.2%}
- **Average Duration**: {analysis['summary']['average_duration']:.2f} seconds

## Scenarios
"""
        
        # Add scenario details
        for scenario_id, scenario_analysis in analysis['scenarios'].items():
            summary = scenario_analysis['summary']
            markdown += f"""
### Scenario: {scenario_id}

- **Result Count**: {summary['result_count']}
- **Success Count**: {summary['success_count']}
- **Success Rate**: {summary['success_rate']:.2%}
- **Average Duration**: {summary['average_duration']:.2f} seconds

#### Steps

| Step ID | Count | Success Count | Success Rate | Average Duration |
|---------|-------|--------------|-------------|-----------------|
"""
            
            for step_id, step in scenario_analysis.get('steps', {}).items():
                markdown += f"| {step_id} | {step['count']} | {step['success_count']} | {step['success_rate']:.2%} | {step['average_duration']:.2f} seconds |\n"
        
        return markdown


# Example usage
if __name__ == "__main__":
    analyzer = ResultsAnalyzer()
    
    # Example result
    result = {
        'success': True,
        'steps': [
            {
                'step_id': 'STEP-0001',
                'success': True,
                'response': {
                    'status_code': 200,
                    'duration': 0.25
                }
            }
        ],
        'response': {
            'status_code': 200,
            'duration': 0.25,
            'body': {
                'governance_metrics': {
                    'trust_score': 0.95
                }
            }
        }
    }
    
    # Add result
    analyzer.add_result('TS-0001', result)
    
    # Generate report
    report = analyzer.generate_report(format='markdown')
    print(report)
