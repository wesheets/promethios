#!/usr/bin/env python3
"""
Run Tests Script for Phase 6.3 Implementation

This script runs all unit, integration, and end-to-end tests for the Phase 6.3 implementation.
It generates a test report with results and coverage information.
"""

import os
import sys
import unittest
import json
import datetime
import argparse
from unittest import TestLoader, TextTestRunner, TestSuite
import coverage

# Configure paths
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
SRC_DIR = os.path.join(BASE_DIR, 'src')
TESTS_DIR = os.path.join(BASE_DIR, 'tests')
UNIT_TESTS_DIR = os.path.join(TESTS_DIR, 'unit')
INTEGRATION_TESTS_DIR = os.path.join(TESTS_DIR, 'integration')
REPORTS_DIR = os.path.join(BASE_DIR, 'test_reports')

# Ensure the reports directory exists
os.makedirs(REPORTS_DIR, exist_ok=True)


def discover_tests(test_dir):
    """Discover all tests in the specified directory."""
    loader = TestLoader()
    return loader.discover(test_dir)


def run_tests(test_suite, test_type):
    """Run the test suite and return the results."""
    print(f"\n{'=' * 80}")
    print(f"Running {test_type} tests...")
    print(f"{'=' * 80}")
    
    result = TextTestRunner(verbosity=2).run(test_suite)
    
    return {
        'test_type': test_type,
        'total': result.testsRun,
        'failures': len(result.failures),
        'errors': len(result.errors),
        'skipped': len(result.skipped),
        'success': result.wasSuccessful()
    }


def run_with_coverage(test_suite, source_dirs):
    """Run tests with coverage analysis."""
    cov = coverage.Coverage(source=source_dirs)
    cov.start()
    
    result = TextTestRunner(verbosity=2).run(test_suite)
    
    cov.stop()
    cov.save()
    
    # Generate coverage report
    cov_report = {
        'total_statements': cov.get_total_statements(),
        'total_covered': cov.get_total_covered(),
        'coverage_percentage': round(cov.get_total_covered() / cov.get_total_statements() * 100, 2) if cov.get_total_statements() > 0 else 0
    }
    
    # Generate HTML report
    html_report_dir = os.path.join(REPORTS_DIR, 'coverage_html')
    os.makedirs(html_report_dir, exist_ok=True)
    cov.html_report(directory=html_report_dir)
    
    return result, cov_report


def generate_report(unit_results, integration_results, end_to_end_results, coverage_report):
    """Generate a comprehensive test report."""
    timestamp = datetime.datetime.now().strftime('%Y%m%d_%H%M%S')
    report = {
        'timestamp': datetime.datetime.now().isoformat(),
        'unit_tests': unit_results,
        'integration_tests': integration_results,
        'end_to_end_tests': end_to_end_results,
        'coverage': coverage_report,
        'overall_success': all([
            unit_results['success'],
            integration_results['success'],
            end_to_end_results['success']
        ])
    }
    
    # Save the report as JSON
    report_path = os.path.join(REPORTS_DIR, f'test_report_{timestamp}.json')
    with open(report_path, 'w') as f:
        json.dump(report, f, indent=2)
    
    print(f"\n{'=' * 80}")
    print(f"Test Report Summary")
    print(f"{'=' * 80}")
    print(f"Unit Tests: {unit_results['total']} tests, {unit_results['failures']} failures, {unit_results['errors']} errors")
    print(f"Integration Tests: {integration_results['total']} tests, {integration_results['failures']} failures, {integration_results['errors']} errors")
    print(f"End-to-End Tests: {end_to_end_results['total']} tests, {end_to_end_results['failures']} failures, {end_to_end_results['errors']} errors")
    print(f"Coverage: {coverage_report['coverage_percentage']}% ({coverage_report['total_covered']}/{coverage_report['total_statements']} statements)")
    print(f"Overall Success: {report['overall_success']}")
    print(f"Report saved to: {report_path}")
    print(f"HTML coverage report: {os.path.join(REPORTS_DIR, 'coverage_html', 'index.html')}")
    
    return report


def main():
    """Main function to run all tests."""
    parser = argparse.ArgumentParser(description='Run tests for Phase 6.3 Implementation')
    parser.add_argument('--unit-only', action='store_true', help='Run only unit tests')
    parser.add_argument('--integration-only', action='store_true', help='Run only integration tests')
    parser.add_argument('--e2e-only', action='store_true', help='Run only end-to-end tests')
    parser.add_argument('--no-coverage', action='store_true', help='Disable coverage analysis')
    args = parser.parse_args()
    
    # Add src directory to Python path
    sys.path.insert(0, BASE_DIR)
    
    # Discover tests
    unit_tests = discover_tests(UNIT_TESTS_DIR)
    integration_tests = discover_tests(INTEGRATION_TESTS_DIR)
    
    # Create a test suite for end-to-end tests
    end_to_end_tests = discover_tests(INTEGRATION_TESTS_DIR)
    
    # Filter the test suite based on command line arguments
    if args.unit_only:
        test_suite = unit_tests
    elif args.integration_only:
        test_suite = integration_tests
    elif args.e2e_only:
        test_suite = end_to_end_tests
    else:
        # Run all tests
        test_suite = TestSuite([unit_tests, integration_tests, end_to_end_tests])
    
    # Run tests with or without coverage
    if args.no_coverage:
        # Run tests without coverage
        unit_results = run_tests(unit_tests, 'Unit')
        integration_results = run_tests(integration_tests, 'Integration')
        end_to_end_results = run_tests(end_to_end_tests, 'End-to-End')
        
        coverage_report = {
            'total_statements': 0,
            'total_covered': 0,
            'coverage_percentage': 0
        }
    else:
        # Run tests with coverage
        source_dirs = [SRC_DIR]
        result, coverage_report = run_with_coverage(test_suite, source_dirs)
        
        # If running all tests, we need to separate the results
        if not (args.unit_only or args.integration_only or args.e2e_only):
            unit_results = {
                'test_type': 'Unit',
                'total': sum(1 for test in unit_tests),
                'failures': len([f for f in result.failures if 'unit' in str(f[0])]),
                'errors': len([e for e in result.errors if 'unit' in str(e[0])]),
                'skipped': len([s for s in result.skipped if 'unit' in str(s[0])]),
                'success': len([f for f in result.failures if 'unit' in str(f[0])]) == 0 and len([e for e in result.errors if 'unit' in str(e[0])]) == 0
            }
            
            integration_results = {
                'test_type': 'Integration',
                'total': sum(1 for test in integration_tests),
                'failures': len([f for f in result.failures if 'integration' in str(f[0])]),
                'errors': len([e for e in result.errors if 'integration' in str(e[0])]),
                'skipped': len([s for s in result.skipped if 'integration' in str(s[0])]),
                'success': len([f for f in result.failures if 'integration' in str(f[0])]) == 0 and len([e for e in result.errors if 'integration' in str(e[0])]) == 0
            }
            
            end_to_end_results = {
                'test_type': 'End-to-End',
                'total': sum(1 for test in end_to_end_tests),
                'failures': len([f for f in result.failures if 'end_to_end' in str(f[0])]),
                'errors': len([e for e in result.errors if 'end_to_end' in str(e[0])]),
                'skipped': len([s for s in result.skipped if 'end_to_end' in str(s[0])]),
                'success': len([f for f in result.failures if 'end_to_end' in str(f[0])]) == 0 and len([e for e in result.errors if 'end_to_end' in str(e[0])]) == 0
            }
        else:
            # If running only one type of test, use the result directly
            test_type = 'Unit' if args.unit_only else ('Integration' if args.integration_only else 'End-to-End')
            test_results = {
                'test_type': test_type,
                'total': result.testsRun,
                'failures': len(result.failures),
                'errors': len(result.errors),
                'skipped': len(result.skipped),
                'success': result.wasSuccessful()
            }
            
            if args.unit_only:
                unit_results = test_results
                integration_results = {'test_type': 'Integration', 'total': 0, 'failures': 0, 'errors': 0, 'skipped': 0, 'success': True}
                end_to_end_results = {'test_type': 'End-to-End', 'total': 0, 'failures': 0, 'errors': 0, 'skipped': 0, 'success': True}
            elif args.integration_only:
                unit_results = {'test_type': 'Unit', 'total': 0, 'failures': 0, 'errors': 0, 'skipped': 0, 'success': True}
                integration_results = test_results
                end_to_end_results = {'test_type': 'End-to-End', 'total': 0, 'failures': 0, 'errors': 0, 'skipped': 0, 'success': True}
            else:  # e2e_only
                unit_results = {'test_type': 'Unit', 'total': 0, 'failures': 0, 'errors': 0, 'skipped': 0, 'success': True}
                integration_results = {'test_type': 'Integration', 'total': 0, 'failures': 0, 'errors': 0, 'skipped': 0, 'success': True}
                end_to_end_results = test_results
    
    # Generate and return the report
    return generate_report(unit_results, integration_results, end_to_end_results, coverage_report)


if __name__ == '__main__':
    main()
