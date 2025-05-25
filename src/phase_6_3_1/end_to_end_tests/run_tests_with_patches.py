"""
Main test runner for end-to-end tests with patches applied

This script runs the end-to-end tests with the necessary patches applied
to fix integration issues between components.
"""

import os
import sys
import unittest
import logging
import json
import datetime
from pathlib import Path

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Add the current directory to the path so we can import our modules
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Apply patches before importing test modules
try:
    # Apply trust boundary patch
    import trust_boundary_patch
    logger.info("Applied trust boundary patch")
    
    # Apply inheritance loop patch
    import inheritance_loop_patch
    logger.info("Applied inheritance loop patch")
except Exception as e:
    logger.error(f"Error applying patches: {e}")

# Import test modules
from scenarios import test_scenario_1, test_scenario_2, test_scenario_3, test_scenario_4

def generate_html_report(results):
    """Generate HTML report from test results."""
    html = """
    <!DOCTYPE html>
    <html>
    <head>
        <title>End-to-End Test Report</title>
        <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            h1 { color: #333; }
            .summary { margin: 20px 0; padding: 10px; background-color: #f5f5f5; border-radius: 5px; }
            .test-case { margin: 10px 0; padding: 10px; border: 1px solid #ddd; border-radius: 5px; }
            .pass { background-color: #dff0d8; }
            .fail { background-color: #f2dede; }
            .skip { background-color: #fcf8e3; }
            .error { background-color: #f2dede; }
            .details { margin-top: 10px; font-family: monospace; white-space: pre-wrap; }
        </style>
    </head>
    <body>
        <h1>End-to-End Test Report</h1>
        <div class="summary">
            <h2>Summary</h2>
            <p>Total: {total}, Passed: {passed}, Failed: {failed}, Errors: {errors}, Skipped: {skipped}</p>
            <p>Generated: {timestamp}</p>
        </div>
        <h2>Test Results</h2>
        {test_results}
    </body>
    </html>
    """
    
    test_results_html = ""
    passed = 0
    failed = 0
    errors = 0
    skipped = 0
    
    for test_class, tests in results.items():
        for test_name, result in tests.items():
            status = result.get("status", "unknown")
            if status == "pass":
                passed += 1
                status_class = "pass"
            elif status == "fail":
                failed += 1
                status_class = "fail"
            elif status == "error":
                errors += 1
                status_class = "error"
            elif status == "skipped":
                skipped += 1
                status_class = "skip"
            else:
                status_class = ""
                
            details = result.get("details", {})
            details_str = json.dumps(details, indent=2) if details else "No details available"
            
            test_results_html += f"""
            <div class="test-case {status_class}">
                <h3>{test_class}.{test_name}</h3>
                <p>Status: {status}</p>
                <div class="details">{details_str}</div>
            </div>
            """
    
    total = passed + failed + errors + skipped
    timestamp = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    
    return html.format(
        total=total,
        passed=passed,
        failed=failed,
        errors=errors,
        skipped=skipped,
        timestamp=timestamp,
        test_results=test_results_html
    )

def run_tests():
    """Run all end-to-end tests and generate reports."""
    # Create test suite
    loader = unittest.TestLoader()
    suite = unittest.TestSuite()
    
    # Add test cases from each scenario
    suite.addTests(loader.loadTestsFromModule(test_scenario_1))
    suite.addTests(loader.loadTestsFromModule(test_scenario_2))
    suite.addTests(loader.loadTestsFromModule(test_scenario_3))
    suite.addTests(loader.loadTestsFromModule(test_scenario_4))
    
    # Run tests
    runner = unittest.TextTestRunner(verbosity=2)
    result = runner.run(suite)
    
    # Create reports directory if it doesn't exist
    reports_dir = Path("reports")
    reports_dir.mkdir(exist_ok=True)
    
    # Get detailed results from test fixtures
    from test_fixtures import TestFixtures
    detailed_results = TestFixtures.get_test_results()
    
    # Save detailed results to JSON
    with open(reports_dir / "detailed_results.json", "w") as f:
        json.dump(detailed_results, f, indent=2)
    
    # Generate HTML report
    html_report = generate_html_report(detailed_results)
    with open(reports_dir / "end_to_end_test_report.html", "w") as f:
        f.write(html_report)
    
    # Generate JSON report
    json_report = {
        "total": result.testsRun,
        "failures": len(result.failures),
        "errors": len(result.errors),
        "skipped": len(result.skipped),
        "success": result.wasSuccessful()
    }
    with open(reports_dir / "end_to_end_test_report.json", "w") as f:
        json.dump(json_report, f, indent=2)
    
    logger.info(f"Test execution completed. Success: {result.wasSuccessful()}")
    logger.info(f"Total: {result.testsRun}, Failures: {len(result.failures)}, Errors: {len(result.errors)}")
    logger.info(f"Report generated at: {reports_dir / 'end_to_end_test_report.html'}")
    
    return result.wasSuccessful()

if __name__ == "__main__":
    success = run_tests()
    sys.exit(0 if success else 1)
