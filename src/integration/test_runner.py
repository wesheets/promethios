"""
Integration test runner for TheAgentCompany integration testing

This module provides a runner for executing TheAgentCompany integration tests
and generating comprehensive reports on API validation and compliance.
"""

import os
import sys
import json
import logging
import argparse
from datetime import datetime
from pathlib import Path

# Add the src directory to the Python path
sys.path.append(str(Path(__file__).parent.parent.parent))

from src.integration.theagentcompany_integration import TheAgentCompanyIntegration, get_integration
from src.integration.benchmark_scenarios import create_benchmark_scenarios

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler('integration_test_runner.log')
    ]
)
logger = logging.getLogger(__name__)

def setup_benchmark_environment(api_base_url=None, api_key=None):
    """
    Set up the benchmark environment for integration testing.
    
    Args:
        api_base_url: Base URL for the Promethios API
        api_key: API key for authentication
        
    Returns:
        TheAgentCompanyIntegration instance
    """
    logger.info("Setting up benchmark environment")
    
    # Create data directory for benchmark scenarios
    data_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "data")
    scenarios_dir = os.path.join(data_dir, "benchmark_scenarios")
    reports_dir = os.path.join(data_dir, "benchmark_reports")
    
    os.makedirs(data_dir, exist_ok=True)
    os.makedirs(scenarios_dir, exist_ok=True)
    os.makedirs(reports_dir, exist_ok=True)
    
    # Create benchmark scenarios
    create_benchmark_scenarios(scenarios_dir)
    
    # Initialize integration
    integration = TheAgentCompanyIntegration(
        api_base_url=api_base_url,
        api_key=api_key,
        scenarios_directory=scenarios_dir
    )
    
    logger.info(f"Loaded {len(integration.scenarios)} benchmark scenarios")
    
    return integration, reports_dir

def run_all_scenarios(integration):
    """
    Run all benchmark scenarios.
    
    Args:
        integration: TheAgentCompanyIntegration instance
        
    Returns:
        Dictionary of run results by scenario ID
    """
    logger.info("Running all benchmark scenarios")
    
    results = {}
    
    for scenario_id, scenario in integration.scenarios.items():
        logger.info(f"Running scenario: {scenario_id} - {scenario.get('name', 'Unnamed')}")
        
        try:
            run_id = integration.run_scenario(scenario_id)
            
            if run_id:
                run_result = integration.get_run_result(run_id)
                results[scenario_id] = run_result
                
                # Log result
                status = run_result.get("status", "unknown")
                logger.info(f"Scenario {scenario_id} completed with status: {status}")
                
                if status == "failed":
                    errors = run_result.get("errors", [])
                    for error in errors:
                        logger.error(f"Error in scenario {scenario_id}: {error}")
            else:
                logger.error(f"Failed to run scenario {scenario_id}")
        except Exception as e:
            logger.error(f"Error running scenario {scenario_id}: {str(e)}")
    
    return results

def generate_comprehensive_report(integration, results, reports_dir):
    """
    Generate a comprehensive report of benchmark results.
    
    Args:
        integration: TheAgentCompanyIntegration instance
        results: Dictionary of run results by scenario ID
        reports_dir: Directory to save reports
        
    Returns:
        Path to the generated report file
    """
    logger.info("Generating comprehensive benchmark report")
    
    # Generate benchmark report
    report = integration.generate_benchmark_report()
    
    # Add detailed results
    report["detailed_results"] = results
    
    # Add timestamp
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    report_filename = f"benchmark_report_{timestamp}.json"
    report_path = os.path.join(reports_dir, report_filename)
    
    # Save report
    integration.save_benchmark_report(report, report_path)
    
    logger.info(f"Saved benchmark report to {report_path}")
    
    # Generate summary report
    summary_report = generate_summary_report(report)
    summary_filename = f"benchmark_summary_{timestamp}.json"
    summary_path = os.path.join(reports_dir, summary_filename)
    
    with open(summary_path, 'w') as f:
        json.dump(summary_report, f, indent=2)
    
    logger.info(f"Saved summary report to {summary_path}")
    
    return report_path, summary_path

def generate_summary_report(report):
    """
    Generate a summary report from the comprehensive benchmark report.
    
    Args:
        report: Comprehensive benchmark report
        
    Returns:
        Summary report as a dictionary
    """
    summary = {
        "generated_at": report["generated_at"],
        "overall_metrics": report["overall"],
        "scenario_summaries": {},
        "compliance_summary": {
            "standards": {
                "SOC2": {"score": 0, "controls_tested": 0},
                "GDPR": {"score": 0, "controls_tested": 0},
                "HIPAA": {"score": 0, "controls_tested": 0},
                "ISO27001": {"score": 0, "controls_tested": 0}
            },
            "overall_compliance_score": 0
        },
        "performance_summary": {
            "avg_response_time": 0,
            "max_response_time": 0,
            "performance_score": 0
        },
        "security_summary": {
            "authentication_tests": 0,
            "input_validation_tests": 0,
            "security_score": 0
        }
    }
    
    # Extract scenario summaries
    for scenario_id, scenario_data in report["scenarios"].items():
        summary["scenario_summaries"][scenario_id] = {
            "name": scenario_data["name"],
            "success_rate": scenario_data["success_rate"],
            "avg_duration": scenario_data["avg_duration"],
            "scores": scenario_data["scores"]
        }
    
    # Extract compliance data
    compliance_scores = []
    for scenario_id, run_data in report.get("detailed_results", {}).items():
        results = run_data.get("results", {})
        compliance_data = results.get("compliance", {})
        
        if "score" in compliance_data:
            compliance_scores.append(compliance_data["score"])
        
        # Extract standard-specific data
        for check_id, check_result in compliance_data.get("checks", {}).items():
            if "SOC2" in check_id:
                summary["compliance_summary"]["standards"]["SOC2"]["controls_tested"] += 1
                if check_result:
                    summary["compliance_summary"]["standards"]["SOC2"]["score"] += 1
            elif "GDPR" in check_id:
                summary["compliance_summary"]["standards"]["GDPR"]["controls_tested"] += 1
                if check_result:
                    summary["compliance_summary"]["standards"]["GDPR"]["score"] += 1
            elif "HIPAA" in check_id:
                summary["compliance_summary"]["standards"]["HIPAA"]["controls_tested"] += 1
                if check_result:
                    summary["compliance_summary"]["standards"]["HIPAA"]["score"] += 1
            elif "ISO" in check_id:
                summary["compliance_summary"]["standards"]["ISO27001"]["controls_tested"] += 1
                if check_result:
                    summary["compliance_summary"]["standards"]["ISO27001"]["score"] += 1
    
    # Calculate overall compliance score
    if compliance_scores:
        summary["compliance_summary"]["overall_compliance_score"] = sum(compliance_scores) / len(compliance_scores)
    
    # Calculate standard-specific scores
    for standard, data in summary["compliance_summary"]["standards"].items():
        if data["controls_tested"] > 0:
            data["score"] = data["score"] / data["controls_tested"]
    
    # Extract performance data
    response_times = []
    performance_scores = []
    
    for scenario_id, run_data in report.get("detailed_results", {}).items():
        results = run_data.get("results", {})
        performance_data = results.get("performance", {})
        
        if "score" in performance_data:
            performance_scores.append(performance_data["score"])
        
        if "avg_response_time" in performance_data:
            response_times.append(performance_data["avg_response_time"])
        
        if "max_response_time" in performance_data and (
            performance_data["max_response_time"] > summary["performance_summary"]["max_response_time"]
        ):
            summary["performance_summary"]["max_response_time"] = performance_data["max_response_time"]
    
    # Calculate overall performance metrics
    if response_times:
        summary["performance_summary"]["avg_response_time"] = sum(response_times) / len(response_times)
    
    if performance_scores:
        summary["performance_summary"]["performance_score"] = sum(performance_scores) / len(performance_scores)
    
    # Extract security data
    security_scores = []
    
    for scenario_id, run_data in report.get("detailed_results", {}).items():
        results = run_data.get("results", {})
        security_data = results.get("security", {})
        
        if "score" in security_data:
            security_scores.append(security_data["score"])
        
        # Count security tests
        for check_id, check_result in security_data.get("checks", {}).items():
            if "auth" in check_id.lower():
                summary["security_summary"]["authentication_tests"] += 1
            elif "input" in check_id.lower() or "validation" in check_id.lower():
                summary["security_summary"]["input_validation_tests"] += 1
    
    # Calculate overall security score
    if security_scores:
        summary["security_summary"]["security_score"] = sum(security_scores) / len(security_scores)
    
    return summary

def main():
    """Main function for running integration tests."""
    parser = argparse.ArgumentParser(description="Run TheAgentCompany integration tests")
    parser.add_argument("--api-url", help="Base URL for the Promethios API", default="http://localhost:8000")
    parser.add_argument("--api-key", help="API key for authentication")
    args = parser.parse_args()
    
    logger.info("Starting TheAgentCompany integration test runner")
    
    try:
        # Set up benchmark environment
        integration, reports_dir = setup_benchmark_environment(
            api_base_url=args.api_url,
            api_key=args.api_key
        )
        
        # Run all scenarios
        results = run_all_scenarios(integration)
        
        # Generate comprehensive report
        report_path, summary_path = generate_comprehensive_report(integration, results, reports_dir)
        
        logger.info("Integration testing completed successfully")
        logger.info(f"Full report: {report_path}")
        logger.info(f"Summary report: {summary_path}")
        
        return 0
    except Exception as e:
        logger.error(f"Error running integration tests: {str(e)}")
        return 1

if __name__ == "__main__":
    sys.exit(main())
