#!/usr/bin/env python3
"""
Comprehensive Test Runner for Promethios AI Agent Operating System.

This script runs all tests for the 8 registries and integration modules:
1. Agent Registry Tests
2. Tool Registry Tests  
3. Model Registry Tests
4. Workflow Registry Tests
5. Capability Registry Tests
6. Persona Registry Tests
7. Service Registry Tests
8. Template Registry Tests
9. Registry Integration Tests
10. LLM Integration Tests

Provides detailed reporting and validation of the complete system.
"""

import os
import sys
import subprocess
import json
import time
from datetime import datetime
from typing import Dict, List, Any, Optional
import argparse

# Add the project root to Python path
project_root = "/home/ubuntu/promethios"
sys.path.insert(0, project_root)

class TestResult:
    """Test result container."""
    
    def __init__(self, name: str, passed: int = 0, failed: int = 0, skipped: int = 0, 
                 duration: float = 0.0, error: Optional[str] = None):
        self.name = name
        self.passed = passed
        self.failed = failed
        self.skipped = skipped
        self.duration = duration
        self.error = error
        self.success = failed == 0 and error is None
    
    def total_tests(self) -> int:
        return self.passed + self.failed + self.skipped
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "name": self.name,
            "passed": self.passed,
            "failed": self.failed,
            "skipped": self.skipped,
            "total": self.total_tests(),
            "duration": self.duration,
            "success": self.success,
            "error": self.error
        }

class RegistryTestRunner:
    """Comprehensive test runner for all registries."""
    
    def __init__(self, verbose: bool = False, fast_mode: bool = False):
        self.verbose = verbose
        self.fast_mode = fast_mode
        self.results = []
        self.start_time = None
        self.end_time = None
        
        # Test configurations
        self.test_modules = [
            {
                "name": "Agent Registry",
                "path": "tests/modules/agent_registry/test_agent_registry.py",
                "critical": True
            },
            {
                "name": "Tool Registry", 
                "path": "tests/modules/tool_registry/test_tool_registry.py",
                "critical": True
            },
            {
                "name": "Model Registry",
                "path": "tests/modules/model_registry/test_model_registry.py", 
                "critical": True
            },
            {
                "name": "Workflow Registry",
                "path": "tests/modules/workflow_registry/test_workflow_registry.py",
                "critical": False
            },
            {
                "name": "Capability Registry",
                "path": "tests/modules/capability_registry/test_capability_registry.py",
                "critical": False
            },
            {
                "name": "Persona Registry",
                "path": "tests/modules/persona_registry/test_persona_registry.py",
                "critical": False
            },
            {
                "name": "Service Registry",
                "path": "tests/modules/service_registry/test_service_registry.py",
                "critical": False
            },
            {
                "name": "Template Registry",
                "path": "tests/modules/template_registry/test_template_registry.py",
                "critical": False
            },
            {
                "name": "Registry Integration",
                "path": "tests/integration/test_registry_integration.py",
                "critical": True
            },
            {
                "name": "LLM Integration",
                "path": "tests/extensions/llm/test_governance_native_llm.py",
                "critical": True
            }
        ]
    
    def setup_test_environment(self):
        """Setup the test environment."""
        print("🔧 Setting up test environment...")
        
        # Create necessary directories
        test_dirs = [
            "tests/modules/agent_registry",
            "tests/modules/tool_registry", 
            "tests/modules/model_registry",
            "tests/modules/workflow_registry",
            "tests/modules/capability_registry",
            "tests/modules/persona_registry",
            "tests/modules/service_registry",
            "tests/modules/template_registry",
            "tests/integration",
            "tests/extensions/llm",
            "data/registries",
            "logs"
        ]
        
        for test_dir in test_dirs:
            full_path = os.path.join(project_root, test_dir)
            os.makedirs(full_path, exist_ok=True)
        
        # Create __init__.py files for test modules
        init_files = [
            "tests/__init__.py",
            "tests/modules/__init__.py",
            "tests/modules/agent_registry/__init__.py",
            "tests/modules/tool_registry/__init__.py",
            "tests/modules/model_registry/__init__.py",
            "tests/modules/workflow_registry/__init__.py",
            "tests/modules/capability_registry/__init__.py",
            "tests/modules/persona_registry/__init__.py",
            "tests/modules/service_registry/__init__.py",
            "tests/modules/template_registry/__init__.py",
            "tests/integration/__init__.py",
            "tests/extensions/__init__.py",
            "tests/extensions/llm/__init__.py"
        ]
        
        for init_file in init_files:
            full_path = os.path.join(project_root, init_file)
            if not os.path.exists(full_path):
                with open(full_path, 'w') as f:
                    f.write('"""Test module."""\n')
        
        print("✅ Test environment setup complete")
    
    def install_dependencies(self):
        """Install required test dependencies."""
        print("📦 Installing test dependencies...")
        
        dependencies = [
            "pytest>=7.0.0",
            "pytest-cov>=4.0.0", 
            "pytest-xdist>=3.0.0",
            "pytest-mock>=3.10.0"
        ]
        
        for dep in dependencies:
            try:
                result = subprocess.run([
                    sys.executable, "-m", "pip", "install", dep
                ], capture_output=True, text=True, cwd=project_root)
                
                if result.returncode != 0:
                    print(f"⚠️  Warning: Failed to install {dep}")
                    if self.verbose:
                        print(f"Error: {result.stderr}")
                else:
                    print(f"✅ Installed {dep}")
                    
            except Exception as e:
                print(f"⚠️  Warning: Exception installing {dep}: {str(e)}")
        
        print("✅ Dependencies installation complete")
    
    def run_single_test(self, test_module: Dict[str, Any]) -> TestResult:
        """Run a single test module.
        
        Args:
            test_module: Test module configuration.
            
        Returns:
            TestResult with test execution results.
        """
        name = test_module["name"]
        path = test_module["path"]
        full_path = os.path.join(project_root, path)
        
        print(f"\n🧪 Running {name} tests...")
        
        if not os.path.exists(full_path):
            print(f"⚠️  Test file not found: {path}")
            return TestResult(name, error=f"Test file not found: {path}")
        
        start_time = time.time()
        
        try:
            # Build pytest command
            cmd = [sys.executable, "-m", "pytest", full_path, "-v"]
            
            if self.fast_mode:
                cmd.extend(["-x"])  # Stop on first failure
            
            if not self.verbose:
                cmd.extend(["-q"])  # Quiet mode
            
            # Add coverage if not in fast mode
            if not self.fast_mode:
                cmd.extend(["--cov", "--cov-report=term-missing"])
            
            # Run the test
            result = subprocess.run(cmd, capture_output=True, text=True, cwd=project_root)
            
            duration = time.time() - start_time
            
            # Parse pytest output
            output_lines = result.stdout.split('\n')
            passed = 0
            failed = 0
            skipped = 0
            
            for line in output_lines:
                if "passed" in line and "failed" in line:
                    # Parse line like "5 passed, 2 failed, 1 skipped"
                    parts = line.split()
                    for i, part in enumerate(parts):
                        if part == "passed" and i > 0:
                            passed = int(parts[i-1])
                        elif part == "failed" and i > 0:
                            failed = int(parts[i-1])
                        elif part == "skipped" and i > 0:
                            skipped = int(parts[i-1])
                elif "passed" in line and "failed" not in line:
                    # Parse line like "5 passed"
                    parts = line.split()
                    for i, part in enumerate(parts):
                        if part == "passed" and i > 0:
                            passed = int(parts[i-1])
            
            # If no tests were parsed, try alternative parsing
            if passed == 0 and failed == 0 and skipped == 0:
                if "PASSED" in result.stdout:
                    passed = result.stdout.count("PASSED")
                if "FAILED" in result.stdout:
                    failed = result.stdout.count("FAILED")
                if "SKIPPED" in result.stdout:
                    skipped = result.stdout.count("SKIPPED")
            
            error = None
            if result.returncode != 0 and failed == 0:
                error = result.stderr or "Test execution failed"
            
            test_result = TestResult(name, passed, failed, skipped, duration, error)
            
            if test_result.success:
                print(f"✅ {name}: {passed} passed, {duration:.2f}s")
            else:
                print(f"❌ {name}: {passed} passed, {failed} failed, {duration:.2f}s")
                if error and self.verbose:
                    print(f"   Error: {error}")
            
            return test_result
            
        except Exception as e:
            duration = time.time() - start_time
            error_msg = f"Exception running tests: {str(e)}"
            print(f"💥 {name}: {error_msg}")
            return TestResult(name, error=error_msg, duration=duration)
    
    def run_all_tests(self) -> List[TestResult]:
        """Run all test modules.
        
        Returns:
            List of TestResult objects.
        """
        print("🚀 Starting comprehensive test execution...")
        print(f"📊 Running {len(self.test_modules)} test modules")
        print(f"⚡ Fast mode: {'enabled' if self.fast_mode else 'disabled'}")
        print(f"🔍 Verbose mode: {'enabled' if self.verbose else 'disabled'}")
        
        self.start_time = time.time()
        results = []
        
        for test_module in self.test_modules:
            result = self.run_single_test(test_module)
            results.append(result)
            
            # Stop on critical test failure in fast mode
            if self.fast_mode and not result.success and test_module.get("critical", False):
                print(f"\n💥 Critical test failure in {result.name}, stopping execution")
                break
        
        self.end_time = time.time()
        self.results = results
        
        return results
    
    def generate_report(self) -> Dict[str, Any]:
        """Generate comprehensive test report.
        
        Returns:
            Dictionary containing test report.
        """
        if not self.results:
            return {"error": "No test results available"}
        
        total_duration = self.end_time - self.start_time if self.start_time and self.end_time else 0
        
        # Calculate totals
        total_passed = sum(r.passed for r in self.results)
        total_failed = sum(r.failed for r in self.results)
        total_skipped = sum(r.skipped for r in self.results)
        total_tests = total_passed + total_failed + total_skipped
        
        successful_modules = sum(1 for r in self.results if r.success)
        failed_modules = len(self.results) - successful_modules
        
        # Calculate success rate
        success_rate = (total_passed / total_tests * 100) if total_tests > 0 else 0
        module_success_rate = (successful_modules / len(self.results) * 100) if self.results else 0
        
        report = {
            "timestamp": datetime.utcnow().isoformat(),
            "execution_time": total_duration,
            "summary": {
                "total_modules": len(self.results),
                "successful_modules": successful_modules,
                "failed_modules": failed_modules,
                "module_success_rate": module_success_rate,
                "total_tests": total_tests,
                "passed_tests": total_passed,
                "failed_tests": total_failed,
                "skipped_tests": total_skipped,
                "test_success_rate": success_rate
            },
            "modules": [r.to_dict() for r in self.results],
            "critical_failures": [
                r.to_dict() for r in self.results 
                if not r.success and any(
                    m["name"] == r.name and m.get("critical", False) 
                    for m in self.test_modules
                )
            ],
            "performance_metrics": {
                "fastest_module": min(self.results, key=lambda r: r.duration).name if self.results else None,
                "slowest_module": max(self.results, key=lambda r: r.duration).name if self.results else None,
                "average_module_time": sum(r.duration for r in self.results) / len(self.results) if self.results else 0
            }
        }
        
        return report
    
    def print_summary(self):
        """Print test execution summary."""
        if not self.results:
            print("❌ No test results to summarize")
            return
        
        report = self.generate_report()
        summary = report["summary"]
        
        print("\n" + "="*80)
        print("🎯 TEST EXECUTION SUMMARY")
        print("="*80)
        
        print(f"⏱️  Total execution time: {report['execution_time']:.2f} seconds")
        print(f"📊 Modules: {summary['successful_modules']}/{summary['total_modules']} successful ({summary['module_success_rate']:.1f}%)")
        print(f"🧪 Tests: {summary['passed_tests']}/{summary['total_tests']} passed ({summary['test_success_rate']:.1f}%)")
        
        if summary['failed_tests'] > 0:
            print(f"❌ Failed tests: {summary['failed_tests']}")
        
        if summary['skipped_tests'] > 0:
            print(f"⏭️  Skipped tests: {summary['skipped_tests']}")
        
        # Print module results
        print("\n📋 MODULE RESULTS:")
        for result in self.results:
            status = "✅" if result.success else "❌"
            print(f"  {status} {result.name}: {result.passed}P/{result.failed}F/{result.skipped}S ({result.duration:.2f}s)")
            if not result.success and result.error:
                print(f"     Error: {result.error}")
        
        # Print critical failures
        critical_failures = report["critical_failures"]
        if critical_failures:
            print("\n🚨 CRITICAL FAILURES:")
            for failure in critical_failures:
                print(f"  ❌ {failure['name']}: {failure['error'] or 'Test failures detected'}")
        
        # Overall status
        print("\n" + "="*80)
        if summary['failed_modules'] == 0:
            print("🎉 ALL TESTS PASSED! AI Agent Operating System is ready for deployment.")
        elif len(critical_failures) == 0:
            print("⚠️  Some non-critical tests failed. System is functional but needs attention.")
        else:
            print("💥 CRITICAL FAILURES DETECTED! System requires fixes before deployment.")
        print("="*80)
    
    def save_report(self, filename: str = None):
        """Save test report to file.
        
        Args:
            filename: Optional filename for the report.
        """
        if not filename:
            timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
            filename = f"test_report_{timestamp}.json"
        
        report_path = os.path.join(project_root, "logs", filename)
        
        try:
            report = self.generate_report()
            with open(report_path, 'w') as f:
                json.dump(report, f, indent=2)
            
            print(f"📄 Test report saved to: {report_path}")
            
        except Exception as e:
            print(f"⚠️  Failed to save report: {str(e)}")

def main():
    """Main test runner function."""
    parser = argparse.ArgumentParser(description="Promethios Registry Test Runner")
    parser.add_argument("-v", "--verbose", action="store_true", help="Enable verbose output")
    parser.add_argument("-f", "--fast", action="store_true", help="Enable fast mode (stop on first failure)")
    parser.add_argument("--no-setup", action="store_true", help="Skip environment setup")
    parser.add_argument("--no-deps", action="store_true", help="Skip dependency installation")
    parser.add_argument("--report", type=str, help="Save report to specific filename")
    
    args = parser.parse_args()
    
    # Create test runner
    runner = RegistryTestRunner(verbose=args.verbose, fast_mode=args.fast)
    
    try:
        # Setup environment
        if not args.no_setup:
            runner.setup_test_environment()
        
        # Install dependencies
        if not args.no_deps:
            runner.install_dependencies()
        
        # Run tests
        results = runner.run_all_tests()
        
        # Print summary
        runner.print_summary()
        
        # Save report
        runner.save_report(args.report)
        
        # Exit with appropriate code
        failed_modules = sum(1 for r in results if not r.success)
        critical_failures = sum(1 for r in results if not r.success and any(
            m["name"] == r.name and m.get("critical", False) 
            for m in runner.test_modules
        ))
        
        if critical_failures > 0:
            sys.exit(2)  # Critical failure
        elif failed_modules > 0:
            sys.exit(1)  # Non-critical failures
        else:
            sys.exit(0)  # Success
            
    except KeyboardInterrupt:
        print("\n⏹️  Test execution interrupted by user")
        sys.exit(130)
    except Exception as e:
        print(f"\n💥 Test runner error: {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    main()

