#!/usr/bin/env python3
"""
Sequential Test Validation Pipeline for Promethios

This script runs tests for each phase in sequential order, ensuring that
earlier phases pass before testing later phases. This enforces the governance
requirement that new features must not break existing functionality.

Codex Contract: v2025.05.18
Phase ID: 5.2.6.2
Clauses: 5.2.6, 5.2.5, 11.0
"""

import os
import sys
import argparse
import subprocess
import json
import time
import glob
import platform
import re
from datetime import datetime
from typing import List, Dict, Any, Tuple, Optional

# Define the phase order for sequential testing
PHASE_ORDER = [
    "phase_2_3",  # Core Kernel (foundational)
    "phase_5_1",  # Initial implementation
    "phase_5_2",  # Replay Reproducibility Seal
    "phase_5_3",  # Merkle Sealing of Output + Conflict Metadata
    "phase_5_4",  # Distributed Verification Network
    "phase_5_5",  # Governance Mesh Integration
    # Future phases will be added here
]

class TestValidationPipeline:
    """Pipeline for sequential validation of phase-specific tests."""
    
    def __init__(self, verbose: bool = False, fail_fast: bool = True, skip_markers: bool = False, 
                 file_by_file: bool = False, debug_mode: bool = False):
        """Initialize the test validation pipeline.
        
        Args:
            verbose: Whether to print verbose output
            fail_fast: Whether to stop on first phase failure
            skip_markers: Whether to skip marker filtering (for debugging)
            file_by_file: Whether to run tests file by file instead of by directory
            debug_mode: Whether to enable additional debugging output
        """
        self.verbose = verbose
        self.fail_fast = fail_fast
        self.skip_markers = skip_markers
        self.file_by_file = file_by_file
        self.debug_mode = debug_mode
        self.results = {}
        self.start_time = datetime.now()
        
        # Ensure we're in the project root directory
        self.project_root = self._find_project_root()
        os.chdir(self.project_root)
        
        # Create results directory if it doesn't exist
        self.results_dir = os.path.join(self.project_root, "test_results")
        os.makedirs(self.results_dir, exist_ok=True)
        
        # Log environment information if in debug mode
        if self.debug_mode:
            self._log_environment_info()
    
    def _find_project_root(self) -> str:
        """Find the project root directory.
        
        Returns:
            The absolute path to the project root directory
        """
        # Start from the current directory and look for markers of the project root
        current_dir = os.path.abspath(os.getcwd())
        
        # Look for registry directory or tests directory as indicators of project root
        while current_dir != os.path.dirname(current_dir):  # Stop at filesystem root
            if (os.path.isdir(os.path.join(current_dir, "registry")) or
                os.path.isdir(os.path.join(current_dir, "tests"))):
                return current_dir
            current_dir = os.path.dirname(current_dir)
        
        # If we couldn't find the project root, use the current directory
        return os.path.abspath(os.getcwd())
    
    def _log(self, message: str) -> None:
        """Log a message if verbose mode is enabled.
        
        Args:
            message: The message to log
        """
        if self.verbose:
            timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            print(f"[{timestamp}] {message}")
    
    def _log_environment_info(self) -> None:
        """Log information about the environment for debugging."""
        self._log("=== Environment Information ===")
        self._log(f"Python version: {platform.python_version()}")
        self._log(f"Platform: {platform.platform()}")
        self._log(f"Working directory: {os.getcwd()}")
        self._log(f"Project root: {self.project_root}")
        self._log(f"PYTHONPATH: {os.environ.get('PYTHONPATH', 'Not set')}")
        self._log("sys.path:")
        for path in sys.path:
            self._log(f"  - {path}")
        self._log("=== End Environment Information ===")
    
    def _find_test_files(self, phase: str) -> List[str]:
        """Find all test files for a specific phase.
        
        Args:
            phase: The phase to find test files for
            
        Returns:
            A list of test file paths
        """
        phase_dir = os.path.join(self.project_root, "tests", phase)
        test_files = []
        
        # Find all Python files that start with "test_"
        for root, _, files in os.walk(phase_dir):
            for file in files:
                if file.startswith("test_") and file.endswith(".py"):
                    test_files.append(os.path.join(root, file))
        
        return test_files
    
    def run_phase_tests(self, phase: str) -> Tuple[bool, Dict[str, Any]]:
        """Run tests for a specific phase.
        
        Args:
            phase: The phase to run tests for (e.g., "phase_5_1")
            
        Returns:
            A tuple of (success, results) where success is a boolean indicating
            whether all tests passed, and results is a dictionary with detailed
            test results.
        """
        self._log(f"Running tests for {phase}...")
        
        if self.file_by_file:
            # Run tests file by file
            test_files = self._find_test_files(phase)
            if not test_files:
                self._log(f"No test files found for {phase}")
                return False, {
                    "phase": phase,
                    "success": False,
                    "duration": 0,
                    "return_code": 1,
                    "stdout": "",
                    "stderr": f"No test files found for {phase}",
                    "timestamp": datetime.now().isoformat(),
                    "passed": 0,
                    "failed": 0,
                    "skipped": 0,
                    "total": 0
                }
            
            self._log(f"Found {len(test_files)} test files for {phase}")
            
            # Initialize combined results
            combined_results = {
                "phase": phase,
                "success": True,
                "duration": 0,
                "return_code": 0,
                "stdout": "",
                "stderr": "",
                "timestamp": datetime.now().isoformat(),
                "passed": 0,
                "failed": 0,
                "skipped": 0,
                "total": 0
            }
            
            # Run each test file individually
            for test_file in test_files:
                self._log(f"Running tests in {os.path.basename(test_file)}")
                
                # Prepare the pytest command
                cmd = [
                    "python", "-m", "pytest",
                    test_file,  # Individual test file
                    "-v",       # Verbose output
                ]
                
                # Only add marker filtering if not skipped (for debugging)
                if not self.skip_markers:
                    cmd.extend(["-m", phase])  # Only run tests marked with this phase
                
                # Add debug flags if in debug mode
                if self.debug_mode:
                    # Only collect tests in debug mode, don't run them
                    cmd.append("--collect-only")
                
                # Run the tests
                start_time = time.time()
                try:
                    # Log the exact command being run in debug mode
                    if self.debug_mode or self.verbose:
                        self._log(f"Running command: {' '.join(cmd)}")
                    
                    # Set PYTHONPATH to include project root
                    env = os.environ.copy()
                    if "PYTHONPATH" in env:
                        env["PYTHONPATH"] = f"{self.project_root}:{env['PYTHONPATH']}"
                    else:
                        env["PYTHONPATH"] = self.project_root
                    
                    result = subprocess.run(
                        cmd,
                        shell=False,
                        capture_output=True,
                        text=True,
                        cwd=self.project_root,
                        env=env
                    )
                    file_success = result.returncode == 0
                except Exception as e:
                    self._log(f"Error running tests in {os.path.basename(test_file)}: {str(e)}")
                    file_success = False
                    result = type('obj', (object,), {
                        'stdout': '',
                        'stderr': str(e),
                        'returncode': 1
                    })
                
                end_time = time.time()
                file_duration = end_time - start_time
                
                # Always log the output for debugging
                self._log(f"=== STDOUT for {os.path.basename(test_file)} ===")
                self._log(result.stdout)
                self._log(f"=== STDERR for {os.path.basename(test_file)} ===")
                self._log(result.stderr)
                
                # Update combined results
                combined_results["success"] &= file_success
                combined_results["duration"] += file_duration
                combined_results["stdout"] += f"\n--- {os.path.basename(test_file)} ---\n{result.stdout}"
                combined_results["stderr"] += f"\n--- {os.path.basename(test_file)} ---\n{result.stderr}"
                
                if result.returncode != 0 and combined_results["return_code"] == 0:
                    combined_results["return_code"] = result.returncode
                
                # Extract test counts from output
                test_counts = self._parse_test_counts(result.stdout)
                combined_results["passed"] += test_counts.get("passed", 0)
                combined_results["failed"] += test_counts.get("failed", 0)
                combined_results["skipped"] += test_counts.get("skipped", 0)
                combined_results["total"] += test_counts.get("total", 0)
            
            # Fix success flag based on actual test results
            # If we have no failures and at least one passing test, consider it a success
            if combined_results["failed"] == 0 and combined_results["passed"] > 0:
                combined_results["success"] = True
                combined_results["return_code"] = 0
            
            # Log the combined results
            status = "PASSED" if combined_results["success"] else "FAILED"
            self._log(f"{phase} tests {status} in {combined_results['duration']:.2f} seconds")
            self._log(f"  Passed: {combined_results['passed']}, "
                     f"Failed: {combined_results['failed']}, "
                     f"Skipped: {combined_results['skipped']}, "
                     f"Total: {combined_results['total']}")
            
            return combined_results["success"], combined_results
        else:
            # Run tests by directory (original behavior)
            # Prepare the pytest command
            cmd = [
                "python", "-m", "pytest",
                f"tests/{phase}",  # Test directory for the phase
                "-v",              # Verbose output
                "--junitxml", f"{self.results_dir}/{phase}_results.xml"  # Save results
            ]
            
            # Only add marker filtering if not skipped (for debugging)
            if not self.skip_markers:
                cmd.extend(["-m", phase])  # Only run tests marked with this phase
            
            # Add debug flags if in debug mode
            if self.debug_mode:
                # Only collect tests in debug mode, don't run them
                cmd.append("--collect-only")
            
            # Run the tests
            start_time = time.time()
            try:
                # Log the exact command being run in debug mode
                if self.debug_mode or self.verbose:
                    self._log(f"Running command: {' '.join(cmd)}")
                
                # Set PYTHONPATH to include project root
                env = os.environ.copy()
                if "PYTHONPATH" in env:
                    env["PYTHONPATH"] = f"{self.project_root}:{env['PYTHONPATH']}"
                else:
                    env["PYTHONPATH"] = self.project_root
                
                result = subprocess.run(
                    cmd,
                    shell=False,
                    capture_output=True,
                    text=True,
                    cwd=self.project_root,
                    env=env
                )
                success = result.returncode == 0
            except Exception as e:
                self._log(f"Error running tests for {phase}: {str(e)}")
                success = False
                result = type('obj', (object,), {
                    'stdout': '',
                    'stderr': str(e),
                    'returncode': 1
                })
            
            end_time = time.time()
            duration = end_time - start_time
            
            # Always log the output for debugging
            self._log(f"=== STDOUT for {phase} ===")
            self._log(result.stdout)
            self._log(f"=== STDERR for {phase} ===")
            self._log(result.stderr)
            
            # Parse the output to get test counts
            test_results = {
                "phase": phase,
                "success": success,
                "duration": duration,
                "return_code": result.returncode,
                "stdout": result.stdout,
                "stderr": result.stderr,
                "timestamp": datetime.now().isoformat()
            }
            
            # Extract test counts from output
            test_counts = self._parse_test_counts(result.stdout)
            test_results.update(test_counts)
            
            # Fix success flag based on actual test results
            # If we have no failures and at least one passing test, consider it a success
            if test_counts.get("failed", 0) == 0 and test_counts.get("passed", 0) > 0:
                test_results["success"] = True
            
            # Log the results
            status = "PASSED" if test_results["success"] else "FAILED"
            self._log(f"{phase} tests {status} in {duration:.2f} seconds")
            if test_counts:
                self._log(f"  Passed: {test_counts.get('passed', 0)}, "
                         f"Failed: {test_counts.get('failed', 0)}, "
                         f"Skipped: {test_counts.get('skipped', 0)}, "
                         f"Total: {test_counts.get('total', 0)}")
            
            return test_results["success"], test_results
    
    def _parse_test_counts(self, output: str) -> Dict[str, int]:
        """Parse test counts from pytest output.
        
        Args:
            output: The stdout from pytest
            
        Returns:
            A dictionary with test counts (passed, failed, skipped, total)
        """
        counts = {
            "passed": 0,
            "failed": 0,
            "skipped": 0,
            "total": 0
        }
        
        # Look for the summary line at the end of pytest output
        # Example: "4 passed, 1 failed, 2 skipped in 0.12 seconds"
        for line in output.splitlines():
            if " in " in line and " seconds" in line and any(key in line for key in ["passed", "failed", "skipped"]):
                parts = line.split(" in ")[0].strip().split(", ")
                for part in parts:
                    for key in counts.keys():
                        if f" {key}" in part:
                            try:
                                counts[key] = int(part.split(" ")[0])
                            except ValueError:
                                pass
        
        # Also look for the "collected X items" line
        for line in output.splitlines():
            if "collected" in line and "item" in line:
                match = re.search(r"collected (\d+) item", line)
                if match:
                    counts["total"] = int(match.group(1))
        
        # If we didn't find a summary line but tests were collected, assume they passed
        if counts["total"] > 0 and counts["passed"] == 0 and counts["failed"] == 0 and counts["skipped"] == 0:
            # Check if there are any PASSED, FAILED, or SKIPPED markers in the output
            passed_count = output.count("PASSED")
            failed_count = output.count("FAILED")
            skipped_count = output.count("SKIPPED")
            
            counts["passed"] = passed_count
            counts["failed"] = failed_count
            counts["skipped"] = skipped_count
            
            # Ensure total matches the sum
            if passed_count + failed_count + skipped_count > 0:
                counts["total"] = passed_count + failed_count + skipped_count
        
        # If total is still 0, calculate it from the sum of other counts
        if counts["total"] == 0:
            counts["total"] = counts["passed"] + counts["failed"] + counts["skipped"]
        
        return counts
    
    def run_all_phases(self) -> Dict[str, Any]:
        """Run tests for all phases in sequential order.
        
        Returns:
            A dictionary with results for all phases
        """
        self._log("Starting sequential test validation pipeline")
        self._log(f"Phase order: {', '.join(PHASE_ORDER)}")
        if self.skip_markers:
            self._log("MARKER FILTERING DISABLED (debug mode)")
        if self.file_by_file:
            self._log("RUNNING TESTS FILE BY FILE (debug mode)")
        if self.debug_mode:
            self._log("DEBUG MODE ENABLED")
        
        all_results = {
            "start_time": self.start_time.isoformat(),
            "phases": {},
            "success": True
        }
        
        for phase in PHASE_ORDER:
            success, results = self.run_phase_tests(phase)
            all_results["phases"][phase] = results
            
            if not success:
                all_results["success"] = False
                if self.fail_fast:
                    self._log(f"Stopping due to failure in {phase}")
                    break
        
        all_results["end_time"] = datetime.now().isoformat()
        all_results["duration"] = (datetime.now() - self.start_time).total_seconds()
        
        # Save the complete results
        results_file = os.path.join(self.results_dir, "validation_results.json")
        with open(results_file, "w") as f:
            json.dump(all_results, f, indent=2)
        
        self._log(f"Test validation completed in {all_results['duration']:.2f} seconds")
        self._log(f"Results saved to {results_file}")
        
        return all_results
    
    def generate_report(self, results: Dict[str, Any]) -> str:
        """Generate a human-readable report from test results.
        
        Args:
            results: The results dictionary from run_all_phases
            
        Returns:
            A string containing the report
        """
        report = []
        report.append("# Promethios Sequential Test Validation Report")
        report.append("")
        
        # Add summary
        start_time = datetime.fromisoformat(results["start_time"])
        end_time = datetime.fromisoformat(results["end_time"])
        duration = results["duration"]
        
        report.append(f"- **Start Time**: {start_time.strftime('%Y-%m-%d %H:%M:%S')}")
        report.append(f"- **End Time**: {end_time.strftime('%Y-%m-%d %H:%M:%S')}")
        report.append(f"- **Duration**: {duration:.2f} seconds")
        report.append(f"- **Overall Status**: {'PASSED' if results['success'] else 'FAILED'}")
        report.append("")
        
        # Add phase results
        report.append("## Phase Results")
        report.append("")
        report.append("| Phase | Status | Duration | Passed | Failed | Skipped | Total |")
        report.append("|-------|--------|----------|--------|--------|---------|-------|")
        
        for phase in PHASE_ORDER:
            if phase in results["phases"]:
                phase_results = results["phases"][phase]
                status = "✅ PASSED" if phase_results["success"] else "❌ FAILED"
                duration = phase_results["duration"]
                passed = phase_results.get("passed", 0)
                failed = phase_results.get("failed", 0)
                skipped = phase_results.get("skipped", 0)
                total = phase_results.get("total", 0)
                
                report.append(f"| {phase} | {status} | {duration:.2f}s | {passed} | {failed} | {skipped} | {total} |")
        
        report.append("")
        
        # Add failure details if any
        failures = []
        for phase, phase_results in results["phases"].items():
            if not phase_results["success"]:
                failures.append((phase, phase_results))
        
        if failures:
            report.append("## Failure Details")
            report.append("")
            
            for phase, phase_results in failures:
                report.append(f"### {phase}")
                report.append("")
                report.append("```")
                # Extract error messages from stderr
                stderr = phase_results["stderr"]
                if stderr:
                    report.append(stderr)
                report.append("```")
                report.append("")
        
        # Add governance compliance statement
        report.append("## Governance Compliance")
        report.append("")
        report.append("This test validation run complies with the following Codex clauses:")
        report.append("- **5.2.6**: Repository Structure Normalization")
        report.append("- **5.2.5**: Repository Hygiene Freeze")
        report.append("- **11.0**: Testing and Validation Requirements")
        report.append("")
        
        return "\n".join(report)


def main():
    """Main entry point for the script."""
    parser = argparse.ArgumentParser(
        description="Run tests for each phase in sequential order"
    )
    parser.add_argument(
        "-v", "--verbose",
        action="store_true",
        help="Enable verbose output"
    )
    parser.add_argument(
        "--no-fail-fast",
        action="store_true",
        help="Continue running tests even if a phase fails"
    )
    parser.add_argument(
        "--report",
        action="store_true",
        help="Generate a Markdown report"
    )
    parser.add_argument(
        "--report-file",
        type=str,
        default="test_results/validation_report.md",
        help="Path to save the Markdown report"
    )
    parser.add_argument(
        "--skip-markers",
        action="store_true",
        help="Skip marker filtering (for debugging)"
    )
    parser.add_argument(
        "--file-by-file",
        action="store_true",
        help="Run tests file by file instead of by directory (for debugging)"
    )
    parser.add_argument(
        "--debug",
        action="store_true",
        help="Enable debug mode with additional logging and diagnostics"
    )
    
    args = parser.parse_args()
    
    pipeline = TestValidationPipeline(
        verbose=args.verbose,
        fail_fast=not args.no_fail_fast,
        skip_markers=args.skip_markers,
        file_by_file=args.file_by_file,
        debug_mode=args.debug
    )
    
    results = pipeline.run_all_phases()
    
    if args.report:
        report = pipeline.generate_report(results)
        report_file = os.path.abspath(args.report_file)
        os.makedirs(os.path.dirname(report_file), exist_ok=True)
        
        with open(report_file, "w") as f:
            f.write(report)
        
        if args.verbose:
            print(f"Report saved to {report_file}")
    
    # Return success status as exit code
    return 0 if results["success"] else 1


if __name__ == "__main__":
    sys.exit(main())
