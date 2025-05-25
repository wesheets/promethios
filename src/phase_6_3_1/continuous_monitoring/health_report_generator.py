"""
Health Report Generator for Continuous Risk Monitoring.

This module implements the health report generation functionality for the Continuous Risk Monitoring
framework, providing comprehensive reporting on system health and performance trends.
"""

import logging
import time
import json
import os
from typing import Dict, List, Any, Optional, Set, Tuple
from datetime import datetime, timedelta
from enum import Enum

from health_check_system import HealthCheckSystem, HealthCheckStatus, HealthCheckCategory


class ReportFormat(Enum):
    """Format options for health reports."""
    JSON = "json"
    MARKDOWN = "markdown"
    HTML = "html"
    TEXT = "text"


class ReportPeriod(Enum):
    """Time periods for health reports."""
    DAILY = "daily"
    WEEKLY = "weekly"
    MONTHLY = "monthly"
    QUARTERLY = "quarterly"


class HealthReportGenerator:
    """
    Generator for comprehensive health reports.
    
    This class provides functionality to generate detailed health reports
    based on health check results from the HealthCheckSystem.
    """
    
    def __init__(self, health_check_system: HealthCheckSystem):
        """
        Initialize the health report generator.
        
        Args:
            health_check_system: Health check system to generate reports for
        """
        self.health_check_system = health_check_system
        self.logger = logging.getLogger("HealthReportGenerator")
        self.logger.info("Initialized health report generator")
    
    def generate_report(self, 
                        report_period: ReportPeriod, 
                        format: ReportFormat = ReportFormat.MARKDOWN,
                        include_details: bool = True) -> str:
        """
        Generate a health report for the specified period.
        
        Args:
            report_period: Time period for the report
            format: Format of the report
            include_details: Whether to include detailed check results
            
        Returns:
            Generated report as a string
        """
        self.logger.info(f"Generating {report_period.value} health report in {format.value} format")
        
        # Get system health summary
        summary = self.health_check_system.get_system_health_summary()
        
        # Generate report based on format
        if format == ReportFormat.JSON:
            return self._generate_json_report(summary, report_period, include_details)
        elif format == ReportFormat.MARKDOWN:
            return self._generate_markdown_report(summary, report_period, include_details)
        elif format == ReportFormat.HTML:
            return self._generate_html_report(summary, report_period, include_details)
        elif format == ReportFormat.TEXT:
            return self._generate_text_report(summary, report_period, include_details)
        else:
            raise ValueError(f"Unsupported report format: {format}")
    
    def save_report(self, 
                    filename: str, 
                    report_period: ReportPeriod, 
                    format: ReportFormat = ReportFormat.MARKDOWN,
                    include_details: bool = True) -> None:
        """
        Generate a health report and save it to a file.
        
        Args:
            filename: Path to save the report to
            report_period: Time period for the report
            format: Format of the report
            include_details: Whether to include detailed check results
        """
        self.logger.info(f"Saving {report_period.value} health report to {filename}")
        
        # Generate report
        report = self.generate_report(report_period, format, include_details)
        
        # Save to file
        with open(filename, 'w') as f:
            f.write(report)
    
    def _generate_json_report(self, 
                             summary: Dict[str, Any], 
                             report_period: ReportPeriod,
                             include_details: bool) -> str:
        """
        Generate a JSON format health report.
        
        Args:
            summary: System health summary
            report_period: Time period for the report
            include_details: Whether to include detailed check results
            
        Returns:
            JSON report as a string
        """
        # Create report data structure
        report_data = {
            "report_type": f"{report_period.value}_health_report",
            "generated_at": datetime.fromtimestamp(summary["timestamp"]).isoformat(),
            "report_period": report_period.value,
            "overall_status": summary["overall_status"],
            "summary": {
                "total_checks": summary["total_checks"],
                "checks_with_results": summary["checks_with_results"],
                "status_counts": summary["status_counts"]
            },
            "categories": {}
        }
        
        # Add category summaries
        for category, category_summary in summary["category_summaries"].items():
            report_data["categories"][category] = {
                "status": category_summary["status"],
                "total_checks": category_summary["total_checks"],
                "checks_with_results": category_summary["checks_with_results"],
                "status_counts": category_summary["status_counts"]
            }
        
        # Add detailed check results if requested
        if include_details:
            report_data["check_details"] = {}
            
            for check_id, health_check in self.health_check_system.health_checks.items():
                latest_result = self.health_check_system.get_latest_result(check_id)
                
                if latest_result:
                    report_data["check_details"][check_id] = {
                        "description": health_check.description,
                        "category": latest_result.category.value,
                        "status": latest_result.status.value,
                        "timestamp": latest_result.timestamp,
                        "details": latest_result.details,
                        "metrics": latest_result.metrics
                    }
        
        # Convert to JSON string
        return json.dumps(report_data, indent=2)
    
    def _generate_markdown_report(self, 
                                 summary: Dict[str, Any], 
                                 report_period: ReportPeriod,
                                 include_details: bool) -> str:
        """
        Generate a Markdown format health report.
        
        Args:
            summary: System health summary
            report_period: Time period for the report
            include_details: Whether to include detailed check results
            
        Returns:
            Markdown report as a string
        """
        # Create report header
        report_date = datetime.fromtimestamp(summary["timestamp"]).strftime("%Y-%m-%d %H:%M:%S")
        
        lines = [
            f"# {report_period.value.capitalize()} Health Report",
            f"Generated: {report_date}",
            "",
            f"## Overall Status: {summary['overall_status'].upper()}",
            "",
            "## Summary",
            f"- Total Checks: {summary['total_checks']}",
            f"- Checks With Results: {summary['checks_with_results']}",
            f"- Passed: {summary['status_counts'].get(HealthCheckStatus.PASSED.value, 0)}",
            f"- Warning: {summary['status_counts'].get(HealthCheckStatus.WARNING.value, 0)}",
            f"- Failed: {summary['status_counts'].get(HealthCheckStatus.FAILED.value, 0)}",
            f"- Error: {summary['status_counts'].get(HealthCheckStatus.ERROR.value, 0)}",
            "",
            "## Category Summaries"
        ]
        
        # Add category summaries
        for category, category_summary in summary["category_summaries"].items():
            if category_summary["total_checks"] > 0:
                lines.extend([
                    f"### {category.capitalize()}",
                    f"- Status: {category_summary['status'].upper()}",
                    f"- Total Checks: {category_summary['total_checks']}",
                    f"- Checks With Results: {category_summary['checks_with_results']}",
                    f"- Passed: {category_summary['status_counts'].get(HealthCheckStatus.PASSED.value, 0)}",
                    f"- Warning: {category_summary['status_counts'].get(HealthCheckStatus.WARNING.value, 0)}",
                    f"- Failed: {category_summary['status_counts'].get(HealthCheckStatus.FAILED.value, 0)}",
                    f"- Error: {category_summary['status_counts'].get(HealthCheckStatus.ERROR.value, 0)}",
                    ""
                ])
        
        # Add detailed check results if requested
        if include_details:
            lines.append("## Check Details")
            lines.append("")
            
            # Group checks by category
            checks_by_category = {}
            for check_id, health_check in self.health_check_system.health_checks.items():
                latest_result = self.health_check_system.get_latest_result(check_id)
                
                if latest_result:
                    category = latest_result.category.value
                    if category not in checks_by_category:
                        checks_by_category[category] = []
                    
                    checks_by_category[category].append((check_id, health_check, latest_result))
            
            # Add details for each category
            for category in sorted(checks_by_category.keys()):
                lines.append(f"### {category.capitalize()}")
                lines.append("")
                
                for check_id, health_check, latest_result in checks_by_category[category]:
                    result_date = datetime.fromtimestamp(latest_result.timestamp).strftime("%Y-%m-%d %H:%M:%S")
                    
                    lines.extend([
                        f"#### {check_id}",
                        f"- Description: {health_check.description}",
                        f"- Status: {latest_result.status.value.upper()}",
                        f"- Last Checked: {result_date}",
                        ""
                    ])
                    
                    # Add metrics if available
                    if latest_result.metrics:
                        lines.append("##### Metrics")
                        for metric, value in latest_result.metrics.items():
                            lines.append(f"- {metric}: {value:.4f}")
                        lines.append("")
                    
                    # Add details if available and not too verbose
                    if latest_result.details and len(str(latest_result.details)) < 1000:
                        lines.append("##### Details")
                        for key, value in latest_result.details.items():
                            if isinstance(value, dict) and len(str(value)) < 500:
                                lines.append(f"- {key}:")
                                for subkey, subvalue in value.items():
                                    lines.append(f"  - {subkey}: {subvalue}")
                            else:
                                lines.append(f"- {key}: {value}")
                        lines.append("")
        
        # Add recommendations section
        lines.extend([
            "## Recommendations",
            ""
        ])
        
        # Add recommendations based on failed and warning checks
        recommendations = self._generate_recommendations(summary)
        if recommendations:
            for recommendation in recommendations:
                lines.append(f"- {recommendation}")
        else:
            lines.append("- No recommendations at this time.")
        
        return "\n".join(lines)
    
    def _generate_html_report(self, 
                             summary: Dict[str, Any], 
                             report_period: ReportPeriod,
                             include_details: bool) -> str:
        """
        Generate an HTML format health report.
        
        Args:
            summary: System health summary
            report_period: Time period for the report
            include_details: Whether to include detailed check results
            
        Returns:
            HTML report as a string
        """
        # Create report header
        report_date = datetime.fromtimestamp(summary["timestamp"]).strftime("%Y-%m-%d %H:%M:%S")
        
        # Start HTML document
        html = [
            "<!DOCTYPE html>",
            "<html>",
            "<head>",
            f"<title>{report_period.value.capitalize()} Health Report</title>",
            "<style>",
            "body { font-family: Arial, sans-serif; margin: 20px; }",
            "h1 { color: #333366; }",
            "h2 { color: #333366; margin-top: 20px; }",
            "h3 { color: #333366; margin-top: 15px; }",
            "h4 { color: #333366; margin-top: 10px; }",
            "table { border-collapse: collapse; width: 100%; margin-bottom: 20px; }",
            "th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }",
            "th { background-color: #f2f2f2; }",
            "tr:nth-child(even) { background-color: #f9f9f9; }",
            ".passed { color: green; }",
            ".warning { color: orange; }",
            ".failed { color: red; }",
            ".error { color: darkred; }",
            ".skipped { color: gray; }",
            ".summary-box { border: 1px solid #ddd; padding: 10px; margin-bottom: 20px; }",
            ".status-indicator { display: inline-block; width: 12px; height: 12px; border-radius: 50%; margin-right: 5px; }",
            ".status-passed { background-color: green; }",
            ".status-warning { background-color: orange; }",
            ".status-failed { background-color: red; }",
            ".status-error { background-color: darkred; }",
            ".status-skipped { background-color: gray; }",
            "</style>",
            "</head>",
            "<body>",
            f"<h1>{report_period.value.capitalize()} Health Report</h1>",
            f"<p>Generated: {report_date}</p>",
            "",
            "<div class='summary-box'>",
            f"<h2>Overall Status: <span class='{summary['overall_status']}'>{summary['overall_status'].upper()}</span></h2>",
            "<table>",
            "<tr><th>Metric</th><th>Value</th></tr>",
            f"<tr><td>Total Checks</td><td>{summary['total_checks']}</td></tr>",
            f"<tr><td>Checks With Results</td><td>{summary['checks_with_results']}</td></tr>",
            f"<tr><td>Passed</td><td>{summary['status_counts'].get(HealthCheckStatus.PASSED.value, 0)}</td></tr>",
            f"<tr><td>Warning</td><td>{summary['status_counts'].get(HealthCheckStatus.WARNING.value, 0)}</td></tr>",
            f"<tr><td>Failed</td><td>{summary['status_counts'].get(HealthCheckStatus.FAILED.value, 0)}</td></tr>",
            f"<tr><td>Error</td><td>{summary['status_counts'].get(HealthCheckStatus.ERROR.value, 0)}</td></tr>",
            "</table>",
            "</div>",
            "",
            "<h2>Category Summaries</h2>"
        ]
        
        # Add category summaries
        for category, category_summary in summary["category_summaries"].items():
            if category_summary["total_checks"] > 0:
                status_class = category_summary["status"]
                html.extend([
                    "<div class='summary-box'>",
                    f"<h3>{category.capitalize()}</h3>",
                    f"<p>Status: <span class='{status_class}'>{category_summary['status'].upper()}</span></p>",
                    "<table>",
                    "<tr><th>Metric</th><th>Value</th></tr>",
                    f"<tr><td>Total Checks</td><td>{category_summary['total_checks']}</td></tr>",
                    f"<tr><td>Checks With Results</td><td>{category_summary['checks_with_results']}</td></tr>",
                    f"<tr><td>Passed</td><td>{category_summary['status_counts'].get(HealthCheckStatus.PASSED.value, 0)}</td></tr>",
                    f"<tr><td>Warning</td><td>{category_summary['status_counts'].get(HealthCheckStatus.WARNING.value, 0)}</td></tr>",
                    f"<tr><td>Failed</td><td>{category_summary['status_counts'].get(HealthCheckStatus.FAILED.value, 0)}</td></tr>",
                    f"<tr><td>Error</td><td>{category_summary['status_counts'].get(HealthCheckStatus.ERROR.value, 0)}</td></tr>",
                    "</table>",
                    "</div>"
                ])
        
        # Add detailed check results if requested
        if include_details:
            html.append("<h2>Check Details</h2>")
            
            # Group checks by category
            checks_by_category = {}
            for check_id, health_check in self.health_check_system.health_checks.items():
                latest_result = self.health_check_system.get_latest_result(check_id)
                
                if latest_result:
                    category = latest_result.category.value
                    if category not in checks_by_category:
                        checks_by_category[category] = []
                    
                    checks_by_category[category].append((check_id, health_check, latest_result))
            
            # Add details for each category
            for category in sorted(checks_by_category.keys()):
                html.append(f"<h3>{category.capitalize()}</h3>")
                
                for check_id, health_check, latest_result in checks_by_category[category]:
                    result_date = datetime.fromtimestamp(latest_result.timestamp).strftime("%Y-%m-%d %H:%M:%S")
                    status_class = latest_result.status.value
                    
                    html.extend([
                        "<div class='summary-box'>",
                        f"<h4><span class='status-indicator status-{status_class}'></span> {check_id}</h4>",
                        "<table>",
                        "<tr><th>Property</th><th>Value</th></tr>",
                        f"<tr><td>Description</td><td>{health_check.description}</td></tr>",
                        f"<tr><td>Status</td><td><span class='{status_class}'>{latest_result.status.value.upper()}</span></td></tr>",
                        f"<tr><td>Last Checked</td><td>{result_date}</td></tr>",
                        "</table>"
                    ])
                    
                    # Add metrics if available
                    if latest_result.metrics:
                        html.extend([
                            "<h5>Metrics</h5>",
                            "<table>",
                            "<tr><th>Metric</th><th>Value</th></tr>"
                        ])
                        
                        for metric, value in latest_result.metrics.items():
                            html.append(f"<tr><td>{metric}</td><td>{value:.4f}</td></tr>")
                        
                        html.append("</table>")
                    
                    # Add details if available and not too verbose
                    if latest_result.details and len(str(latest_result.details)) < 1000:
                        html.extend([
                            "<h5>Details</h5>",
                            "<table>",
                            "<tr><th>Property</th><th>Value</th></tr>"
                        ])
                        
                        for key, value in latest_result.details.items():
                            if isinstance(value, dict) and len(str(value)) < 500:
                                html.append(f"<tr><td>{key}</td><td><pre>{json.dumps(value, indent=2)}</pre></td></tr>")
                            else:
                                html.append(f"<tr><td>{key}</td><td>{value}</td></tr>")
                        
                        html.append("</table>")
                    
                    html.append("</div>")
        
        # Add recommendations section
        html.append("<h2>Recommendations</h2>")
        html.append("<ul>")
        
        # Add recommendations based on failed and warning checks
        recommendations = self._generate_recommendations(summary)
        if recommendations:
            for recommendation in recommendations:
                html.append(f"<li>{recommendation}</li>")
        else:
            html.append("<li>No recommendations at this time.</li>")
        
        html.append("</ul>")
        
        # End HTML document
        html.extend([
            "</body>",
            "</html>"
        ])
        
        return "\n".join(html)
    
    def _generate_text_report(self, 
                             summary: Dict[str, Any], 
                             report_period: ReportPeriod,
                             include_details: bool) -> str:
        """
        Generate a plain text format health report.
        
        Args:
            summary: System health summary
            report_period: Time period for the report
            include_details: Whether to include detailed check results
            
        Returns:
            Text report as a string
        """
        # Create report header
        report_date = datetime.fromtimestamp(summary["timestamp"]).strftime("%Y-%m-%d %H:%M:%S")
        
        lines = [
            f"{report_period.value.upper()} HEALTH REPORT",
            f"Generated: {report_date}",
            "",
            f"OVERALL STATUS: {summary['overall_status'].upper()}",
            "",
            "SUMMARY",
            f"Total Checks: {summary['total_checks']}",
            f"Checks With Results: {summary['checks_with_results']}",
            f"Passed: {summary['status_counts'].get(HealthCheckStatus.PASSED.value, 0)}",
            f"Warning: {summary['status_counts'].get(HealthCheckStatus.WARNING.value, 0)}",
            f"Failed: {summary['status_counts'].get(HealthCheckStatus.FAILED.value, 0)}",
            f"Error: {summary['status_counts'].get(HealthCheckStatus.ERROR.value, 0)}",
            "",
            "CATEGORY SUMMARIES"
        ]
        
        # Add category summaries
        for category, category_summary in summary["category_summaries"].items():
            if category_summary["total_checks"] > 0:
                lines.extend([
                    f"{category.upper()}",
                    f"Status: {category_summary['status'].upper()}",
                    f"Total Checks: {category_summary['total_checks']}",
                    f"Checks With Results: {category_summary['checks_with_results']}",
                    f"Passed: {category_summary['status_counts'].get(HealthCheckStatus.PASSED.value, 0)}",
                    f"Warning: {category_summary['status_counts'].get(HealthCheckStatus.WARNING.value, 0)}",
                    f"Failed: {category_summary['status_counts'].get(HealthCheckStatus.FAILED.value, 0)}",
                    f"Error: {category_summary['status_counts'].get(HealthCheckStatus.ERROR.value, 0)}",
                    ""
                ])
        
        # Add detailed check results if requested
        if include_details:
            lines.append("CHECK DETAILS")
            lines.append("")
            
            # Group checks by category
            checks_by_category = {}
            for check_id, health_check in self.health_check_system.health_checks.items():
                latest_result = self.health_check_system.get_latest_result(check_id)
                
                if latest_result:
                    category = latest_result.category.value
                    if category not in checks_by_category:
                        checks_by_category[category] = []
                    
                    checks_by_category[category].append((check_id, health_check, latest_result))
            
            # Add details for each category
            for category in sorted(checks_by_category.keys()):
                lines.append(f"{category.upper()}")
                lines.append("=" * len(category))
                lines.append("")
                
                for check_id, health_check, latest_result in checks_by_category[category]:
                    result_date = datetime.fromtimestamp(latest_result.timestamp).strftime("%Y-%m-%d %H:%M:%S")
                    
                    lines.extend([
                        f"{check_id}",
                        f"Description: {health_check.description}",
                        f"Status: {latest_result.status.value.upper()}",
                        f"Last Checked: {result_date}",
                        ""
                    ])
                    
                    # Add metrics if available
                    if latest_result.metrics:
                        lines.append("Metrics:")
                        for metric, value in latest_result.metrics.items():
                            lines.append(f"- {metric}: {value:.4f}")
                        lines.append("")
                    
                    # Add details if available and not too verbose
                    if latest_result.details and len(str(latest_result.details)) < 1000:
                        lines.append("Details:")
                        for key, value in latest_result.details.items():
                            if isinstance(value, dict) and len(str(value)) < 500:
                                lines.append(f"- {key}:")
                                for subkey, subvalue in value.items():
                                    lines.append(f"  - {subkey}: {subvalue}")
                            else:
                                lines.append(f"- {key}: {value}")
                        lines.append("")
        
        # Add recommendations section
        lines.extend([
            "RECOMMENDATIONS",
            ""
        ])
        
        # Add recommendations based on failed and warning checks
        recommendations = self._generate_recommendations(summary)
        if recommendations:
            for recommendation in recommendations:
                lines.append(f"- {recommendation}")
        else:
            lines.append("- No recommendations at this time.")
        
        return "\n".join(lines)
    
    def _generate_recommendations(self, summary: Dict[str, Any]) -> List[str]:
        """
        Generate recommendations based on health check results.
        
        Args:
            summary: System health summary
            
        Returns:
            List of recommendation strings
        """
        recommendations = []
        
        # Check for failed checks
        if summary["status_counts"].get(HealthCheckStatus.FAILED.value, 0) > 0:
            recommendations.append("Address all failed health checks as a priority.")
        
        # Check for warning checks
        if summary["status_counts"].get(HealthCheckStatus.WARNING.value, 0) > 0:
            recommendations.append("Review and address warning health checks to prevent potential issues.")
        
        # Check for error checks
        if summary["status_counts"].get(HealthCheckStatus.ERROR.value, 0) > 0:
            recommendations.append("Investigate and fix health checks that encountered errors during execution.")
        
        # Add category-specific recommendations
        for category, category_summary in summary["category_summaries"].items():
            if category_summary["status"] == HealthCheckStatus.FAILED.value:
                if category == HealthCheckCategory.CONSTITUTIONAL.value:
                    recommendations.append("Review constitutional compliance issues to ensure alignment with Codex principles.")
                elif category == HealthCheckCategory.SYSTEM_INTEGRITY.value:
                    recommendations.append("Address system integrity issues to prevent potential system failures.")
                elif category == HealthCheckCategory.PERFORMANCE.value:
                    recommendations.append("Investigate performance degradation issues to maintain optimal system operation.")
                elif category == HealthCheckCategory.SECURITY.value:
                    recommendations.append("Resolve security vulnerabilities to protect system integrity.")
                elif category == HealthCheckCategory.GOVERNANCE.value:
                    recommendations.append("Address governance issues to ensure proper system governance.")
        
        return recommendations
