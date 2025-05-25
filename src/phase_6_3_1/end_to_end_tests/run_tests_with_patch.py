"""
Modified test runner that applies the trust verification patch before running tests.

This ensures that all entities are evaluated solely based on their base_score
and the boundary's min_trust_score, without any special case handling.
"""

import os
import sys
import unittest
import logging
import importlib
import datetime
from pathlib import Path

# Add the parent directory to sys.path to allow importing modules
sys.path.insert(0, os.path.abspath('..'))

# Import the patch
from trust_verification_patch import patch_trust_verification_system

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

def generate_html_report(test_results, output_path):
    """Generate an HTML report from test results."""
    # Create reports directory if it doesn't exist
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    
    # Generate HTML content
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <title>End-to-End Test Report</title>
        <style>
            body {{ font-family: Arial, sans-serif; margin: 20px; }}
            h1 {{ color: #333; }}
            .summary {{ margin: 20px 0; padding: 10px; background-color: #f5f5f5; }}
            .test-case {{ margin: 10px 0; padding: 10px; border: 1px solid #ddd; }}
            .pass {{ background-color: #dff0d8; }}
            .fail {{ background-color: #f2dede; }}
            .skip {{ background-color: #fcf8e3; }}
            .details {{ margin-top: 10px; font-family: monospace; white-space: pre-wrap; }}
        </style>
    </head>
    <body>
        <h1>End-to-End Test Report</h1>
        <div class="summary">
            <h2>Summary</h2>
            <p>Generated: {datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')}</p>
            <p>Total Tests: {test_results['total']}</p>
            <p>Passed: {test_results['passed']}</p>
            <p>Failed: {test_results['failed']}</p>
            <p>Skipped: {test_results['skipped']}</p>
        </div>
        <h2>Test Results</h2>
    """
    
    # Add test case results
    for test_case in test_results['test_cases']:
        status_class = 'pass' if test_case['passed'] else 'skip' if test_case['skipped'] else 'fail'
        status_text = 'PASS' if test_case['passed'] else 'SKIP' if test_case['skipped'] else 'FAIL'
        
        html_content += f"""
        <div class="test-case {status_class}">
            <h3>{test_case['name']} - {status_text}</h3>
            <p>Duration: {test_case['duration']:.2f} seconds</p>
        """
        
        if test_case['details']:
            html_content += f"""
            <div class="details">
                <h4>Details:</h4>
                <pre>{test_case['details']}</pre>
            </div>
            """
        
        html_content += "</div>"
    
    # Close HTML
    html_content += """
    </body>
    </html>
    """
    
    # Write to file
    with open(output_path, 'w') as f:
        f.write(html_content)
    
    return output_path

def run_tests():
    """Run all test scenarios and generate a report."""
    # Apply the trust verification patch
    logger.info("Applying trust verification patch...")
    patch_success = patch_trust_verification_system()
    logger.info(f"Patch applied: {patch_success}")
    
    # Discover and load test modules
    test_dir = os.path.join(os.path.dirname(__file__), 'scenarios')
    test_modules = [f[:-3] for f in os.listdir(test_dir) if f.startswith('test_') and f.endswith('.py')]
    
    # Create test suite
    suite = unittest.TestSuite()
    
    # Add tests from each module
    for module_name in test_modules:
        try:
            module_path = f'scenarios.{module_name}'
            module = importlib.import_module(module_path)
            
            # Find all test classes in the module
            for name in dir(module):
                obj = getattr(module, name)
                if isinstance(obj, type) and issubclass(obj, unittest.TestCase) and obj != unittest.TestCase:
                    suite.addTest(unittest.defaultTestLoader.loadTestsFromTestCase(obj))
        except Exception as e:
            logger.error(f"Error loading module {module_name}: {e}")
    
    # Run the tests
    runner = unittest.TextTestRunner(verbosity=2)
    result = runner.run(suite)
    
    # Collect results
    test_results = {
        'total': result.testsRun,
        'passed': result.testsRun - len(result.failures) - len(result.errors) - len(result.skipped),
        'failed': len(result.failures) + len(result.errors),
        'skipped': len(result.skipped),
        'test_cases': []
    }
    
    # Process test case results
    for test_case, error in result.failures + result.errors:
        test_results['test_cases'].append({
            'name': str(test_case),
            'passed': False,
            'skipped': False,
            'duration': getattr(test_case, '_duration', 0.0),
            'details': error
        })
    
    for test_case in result.skipped:
        test_results['test_cases'].append({
            'name': str(test_case[0]),
            'passed': False,
            'skipped': True,
            'duration': getattr(test_case[0], '_duration', 0.0),
            'details': test_case[1]
        })
    
    # Generate report
    report_path = os.path.join(os.path.dirname(__file__), 'reports', 'end_to_end_test_report.html')
    generate_html_report(test_results, report_path)
    
    logger.info(f"Test execution completed. Success: {len(result.failures) + len(result.errors) == 0}")
    logger.info(f"Total: {result.testsRun}, Failures: {len(result.failures)}, Errors: {len(result.errors)}")
    logger.info(f"Report generated at: {report_path}")
    
    return len(result.failures) + len(result.errors) == 0

if __name__ == "__main__":
    run_tests()
