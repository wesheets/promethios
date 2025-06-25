"""
System Testing & Validation Suite

Comprehensive testing and validation service for multi-agent systems.
Provides functional testing, performance validation, compliance verification,
integration testing, and deployment readiness assessment.
"""

from typing import Dict, List, Any, Optional, Tuple, Union
from pydantic import BaseModel, Field, validator
from datetime import datetime, timedelta
from enum import Enum
import asyncio
import json
import time
import uuid
from collections import defaultdict

class TestType(str, Enum):
    FUNCTIONAL = "functional"
    PERFORMANCE = "performance"
    INTEGRATION = "integration"
    COMPLIANCE = "compliance"
    SECURITY = "security"
    LOAD = "load"
    STRESS = "stress"
    REGRESSION = "regression"
    END_TO_END = "end_to_end"

class TestStatus(str, Enum):
    PENDING = "pending"
    RUNNING = "running"
    PASSED = "passed"
    FAILED = "failed"
    SKIPPED = "skipped"
    ERROR = "error"

class TestSeverity(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"

class ValidationCriteria(str, Enum):
    RESPONSE_TIME = "response_time"
    ACCURACY = "accuracy"
    THROUGHPUT = "throughput"
    ERROR_RATE = "error_rate"
    COMPLIANCE_SCORE = "compliance_score"
    TRUST_SCORE = "trust_score"
    RESOURCE_USAGE = "resource_usage"
    AVAILABILITY = "availability"

class TestCase(BaseModel):
    test_id: str = Field(..., description="Unique test identifier")
    name: str = Field(..., description="Human-readable test name")
    description: str = Field(..., description="Test description and purpose")
    test_type: TestType = Field(..., description="Type of test")
    severity: TestSeverity = Field(TestSeverity.MEDIUM, description="Test failure severity")
    target_agents: List[str] = Field(default_factory=list, description="Agents to test")
    test_data: Dict[str, Any] = Field(default_factory=dict, description="Test input data")
    expected_results: Dict[str, Any] = Field(default_factory=dict, description="Expected outcomes")
    validation_criteria: List[ValidationCriteria] = Field(default_factory=list, description="Success criteria")
    timeout_seconds: int = Field(300, description="Test timeout in seconds")
    retry_count: int = Field(0, description="Number of retries on failure")
    prerequisites: List[str] = Field(default_factory=list, description="Required test dependencies")
    tags: List[str] = Field(default_factory=list, description="Test categorization tags")

class TestResult(BaseModel):
    test_id: str
    execution_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    status: TestStatus
    start_time: datetime = Field(default_factory=datetime.utcnow)
    end_time: Optional[datetime] = None
    duration_seconds: Optional[float] = None
    actual_results: Dict[str, Any] = Field(default_factory=dict)
    metrics: Dict[str, float] = Field(default_factory=dict)
    error_message: Optional[str] = None
    logs: List[str] = Field(default_factory=list)
    artifacts: List[str] = Field(default_factory=list)
    passed_criteria: List[ValidationCriteria] = Field(default_factory=list)
    failed_criteria: List[ValidationCriteria] = Field(default_factory=list)

class TestSuite(BaseModel):
    suite_id: str = Field(..., description="Test suite identifier")
    name: str = Field(..., description="Test suite name")
    description: str = Field(..., description="Test suite description")
    context_id: str = Field(..., description="Multi-agent context to test")
    test_cases: List[TestCase] = Field(default_factory=list)
    parallel_execution: bool = Field(False, description="Run tests in parallel")
    stop_on_failure: bool = Field(False, description="Stop suite on first failure")
    setup_scripts: List[str] = Field(default_factory=list, description="Pre-test setup")
    teardown_scripts: List[str] = Field(default_factory=list, description="Post-test cleanup")

class TestExecution(BaseModel):
    execution_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    suite_id: str
    context_id: str
    status: TestStatus = Field(TestStatus.PENDING)
    start_time: datetime = Field(default_factory=datetime.utcnow)
    end_time: Optional[datetime] = None
    total_tests: int = Field(0)
    passed_tests: int = Field(0)
    failed_tests: int = Field(0)
    skipped_tests: int = Field(0)
    error_tests: int = Field(0)
    test_results: List[TestResult] = Field(default_factory=list)
    overall_score: float = Field(0.0, description="Overall test score (0-100)")
    deployment_ready: bool = Field(False, description="System ready for deployment")
    recommendations: List[str] = Field(default_factory=list)

class PerformanceBenchmark(BaseModel):
    metric_name: str
    target_value: float
    actual_value: float
    unit: str
    passed: bool
    threshold_type: str  # "max", "min", "exact"

class SystemValidationReport(BaseModel):
    context_id: str
    validation_timestamp: datetime = Field(default_factory=datetime.utcnow)
    overall_health_score: float = Field(0.0, description="Overall system health (0-100)")
    functional_score: float = Field(0.0)
    performance_score: float = Field(0.0)
    compliance_score: float = Field(0.0)
    security_score: float = Field(0.0)
    integration_score: float = Field(0.0)
    deployment_readiness: str = Field("not_ready", description="ready, conditional, not_ready")
    critical_issues: List[str] = Field(default_factory=list)
    recommendations: List[str] = Field(default_factory=list)
    performance_benchmarks: List[PerformanceBenchmark] = Field(default_factory=list)
    test_coverage: Dict[str, float] = Field(default_factory=dict)

class SystemTestingService:
    """Service for comprehensive testing and validation of multi-agent systems."""
    
    def __init__(self):
        self.test_suites: Dict[str, TestSuite] = {}
        self.test_executions: Dict[str, TestExecution] = {}
        self.default_test_cases = self._initialize_default_test_cases()
        
    def _initialize_default_test_cases(self) -> List[TestCase]:
        """Initialize default test cases for multi-agent systems."""
        
        return [
            # Functional Tests
            TestCase(
                test_id="func_agent_communication",
                name="Agent Communication Test",
                description="Verify agents can communicate with each other",
                test_type=TestType.FUNCTIONAL,
                severity=TestSeverity.CRITICAL,
                validation_criteria=[ValidationCriteria.RESPONSE_TIME, ValidationCriteria.ACCURACY],
                timeout_seconds=60,
                tags=["communication", "basic"]
            ),
            TestCase(
                test_id="func_task_delegation",
                name="Task Delegation Test",
                description="Verify agents can delegate tasks correctly",
                test_type=TestType.FUNCTIONAL,
                severity=TestSeverity.HIGH,
                validation_criteria=[ValidationCriteria.ACCURACY, ValidationCriteria.RESPONSE_TIME],
                timeout_seconds=120,
                tags=["delegation", "workflow"]
            ),
            TestCase(
                test_id="func_result_aggregation",
                name="Result Aggregation Test",
                description="Verify system can aggregate results from multiple agents",
                test_type=TestType.FUNCTIONAL,
                severity=TestSeverity.HIGH,
                validation_criteria=[ValidationCriteria.ACCURACY, ValidationCriteria.THROUGHPUT],
                timeout_seconds=180,
                tags=["aggregation", "results"]
            ),
            TestCase(
                test_id="func_error_handling",
                name="Error Handling Test",
                description="Verify system handles agent failures gracefully",
                test_type=TestType.FUNCTIONAL,
                severity=TestSeverity.CRITICAL,
                validation_criteria=[ValidationCriteria.ERROR_RATE, ValidationCriteria.AVAILABILITY],
                timeout_seconds=300,
                tags=["error_handling", "resilience"]
            ),
            
            # Performance Tests
            TestCase(
                test_id="perf_response_time",
                name="Response Time Test",
                description="Measure system response times under normal load",
                test_type=TestType.PERFORMANCE,
                severity=TestSeverity.MEDIUM,
                validation_criteria=[ValidationCriteria.RESPONSE_TIME, ValidationCriteria.THROUGHPUT],
                timeout_seconds=600,
                tags=["performance", "latency"]
            ),
            TestCase(
                test_id="perf_throughput",
                name="Throughput Test",
                description="Measure system throughput capacity",
                test_type=TestType.PERFORMANCE,
                severity=TestSeverity.MEDIUM,
                validation_criteria=[ValidationCriteria.THROUGHPUT, ValidationCriteria.RESOURCE_USAGE],
                timeout_seconds=900,
                tags=["performance", "throughput"]
            ),
            TestCase(
                test_id="perf_concurrent_agents",
                name="Concurrent Agent Test",
                description="Test system with multiple agents running simultaneously",
                test_type=TestType.PERFORMANCE,
                severity=TestSeverity.HIGH,
                validation_criteria=[ValidationCriteria.RESPONSE_TIME, ValidationCriteria.RESOURCE_USAGE],
                timeout_seconds=1200,
                tags=["performance", "concurrency"]
            ),
            
            # Load Tests
            TestCase(
                test_id="load_stress_test",
                name="System Stress Test",
                description="Test system under high load conditions",
                test_type=TestType.STRESS,
                severity=TestSeverity.MEDIUM,
                validation_criteria=[ValidationCriteria.AVAILABILITY, ValidationCriteria.ERROR_RATE],
                timeout_seconds=1800,
                tags=["load", "stress"]
            ),
            TestCase(
                test_id="load_burst_capacity",
                name="Burst Capacity Test",
                description="Test system's ability to handle traffic bursts",
                test_type=TestType.LOAD,
                severity=TestSeverity.MEDIUM,
                validation_criteria=[ValidationCriteria.RESPONSE_TIME, ValidationCriteria.ERROR_RATE],
                timeout_seconds=600,
                tags=["load", "burst"]
            ),
            
            # Integration Tests
            TestCase(
                test_id="int_end_to_end",
                name="End-to-End Workflow Test",
                description="Test complete workflow from input to output",
                test_type=TestType.END_TO_END,
                severity=TestSeverity.CRITICAL,
                validation_criteria=[ValidationCriteria.ACCURACY, ValidationCriteria.RESPONSE_TIME],
                timeout_seconds=1800,
                tags=["integration", "workflow"]
            ),
            TestCase(
                test_id="int_external_services",
                name="External Service Integration Test",
                description="Test integration with external services and APIs",
                test_type=TestType.INTEGRATION,
                severity=TestSeverity.HIGH,
                validation_criteria=[ValidationCriteria.AVAILABILITY, ValidationCriteria.ERROR_RATE],
                timeout_seconds=300,
                tags=["integration", "external"]
            ),
            
            # Compliance Tests
            TestCase(
                test_id="comp_data_privacy",
                name="Data Privacy Compliance Test",
                description="Verify data privacy and protection compliance",
                test_type=TestType.COMPLIANCE,
                severity=TestSeverity.CRITICAL,
                validation_criteria=[ValidationCriteria.COMPLIANCE_SCORE],
                timeout_seconds=600,
                tags=["compliance", "privacy"]
            ),
            TestCase(
                test_id="comp_audit_logging",
                name="Audit Logging Test",
                description="Verify all actions are properly logged for audit",
                test_type=TestType.COMPLIANCE,
                severity=TestSeverity.HIGH,
                validation_criteria=[ValidationCriteria.COMPLIANCE_SCORE],
                timeout_seconds=300,
                tags=["compliance", "audit"]
            ),
            
            # Security Tests
            TestCase(
                test_id="sec_authentication",
                name="Authentication Test",
                description="Verify agent authentication mechanisms",
                test_type=TestType.SECURITY,
                severity=TestSeverity.CRITICAL,
                validation_criteria=[ValidationCriteria.TRUST_SCORE],
                timeout_seconds=180,
                tags=["security", "auth"]
            ),
            TestCase(
                test_id="sec_data_encryption",
                name="Data Encryption Test",
                description="Verify data is encrypted in transit and at rest",
                test_type=TestType.SECURITY,
                severity=TestSeverity.CRITICAL,
                validation_criteria=[ValidationCriteria.COMPLIANCE_SCORE],
                timeout_seconds=300,
                tags=["security", "encryption"]
            ),
            
            # Regression Tests
            TestCase(
                test_id="reg_previous_functionality",
                name="Regression Test",
                description="Verify previous functionality still works after changes",
                test_type=TestType.REGRESSION,
                severity=TestSeverity.HIGH,
                validation_criteria=[ValidationCriteria.ACCURACY, ValidationCriteria.RESPONSE_TIME],
                timeout_seconds=900,
                tags=["regression", "stability"]
            )
        ]
    
    async def create_test_suite(self, suite: TestSuite) -> Dict[str, Any]:
        """Create a new test suite for a multi-agent context."""
        
        # Add default test cases if none provided
        if not suite.test_cases:
            suite.test_cases = self.default_test_cases.copy()
        
        # Validate test suite
        validation_issues = await self._validate_test_suite(suite)
        
        # Store test suite
        self.test_suites[suite.suite_id] = suite
        
        return {
            "success": True,
            "suite_id": suite.suite_id,
            "total_test_cases": len(suite.test_cases),
            "validation_issues": validation_issues,
            "estimated_duration_minutes": self._estimate_suite_duration(suite)
        }
    
    async def execute_test_suite(self, suite_id: str) -> TestExecution:
        """Execute a test suite and return results."""
        
        if suite_id not in self.test_suites:
            raise ValueError(f"Test suite {suite_id} not found")
        
        suite = self.test_suites[suite_id]
        execution = TestExecution(
            suite_id=suite_id,
            context_id=suite.context_id,
            total_tests=len(suite.test_cases),
            status=TestStatus.RUNNING
        )
        
        self.test_executions[execution.execution_id] = execution
        
        try:
            # Run setup scripts
            await self._run_setup_scripts(suite.setup_scripts)
            
            # Execute test cases
            if suite.parallel_execution:
                await self._execute_tests_parallel(suite, execution)
            else:
                await self._execute_tests_sequential(suite, execution)
            
            # Run teardown scripts
            await self._run_teardown_scripts(suite.teardown_scripts)
            
            # Calculate final results
            execution.end_time = datetime.utcnow()
            execution.overall_score = self._calculate_overall_score(execution)
            execution.deployment_ready = self._assess_deployment_readiness(execution)
            execution.recommendations = self._generate_recommendations(execution)
            execution.status = TestStatus.PASSED if execution.deployment_ready else TestStatus.FAILED
            
        except Exception as e:
            execution.status = TestStatus.ERROR
            execution.end_time = datetime.utcnow()
            execution.recommendations.append(f"Test execution failed: {str(e)}")
        
        return execution
    
    async def _execute_tests_sequential(self, suite: TestSuite, execution: TestExecution):
        """Execute test cases sequentially."""
        
        for test_case in suite.test_cases:
            # Check prerequisites
            if not await self._check_prerequisites(test_case, execution):
                result = TestResult(
                    test_id=test_case.test_id,
                    status=TestStatus.SKIPPED,
                    error_message="Prerequisites not met"
                )
                execution.test_results.append(result)
                execution.skipped_tests += 1
                continue
            
            # Execute test
            result = await self._execute_single_test(test_case, suite.context_id)
            execution.test_results.append(result)
            
            # Update counters
            if result.status == TestStatus.PASSED:
                execution.passed_tests += 1
            elif result.status == TestStatus.FAILED:
                execution.failed_tests += 1
                if suite.stop_on_failure:
                    break
            elif result.status == TestStatus.ERROR:
                execution.error_tests += 1
                if suite.stop_on_failure:
                    break
            else:
                execution.skipped_tests += 1
    
    async def _execute_tests_parallel(self, suite: TestSuite, execution: TestExecution):
        """Execute test cases in parallel."""
        
        # Group tests by dependencies
        independent_tests = [tc for tc in suite.test_cases if not tc.prerequisites]
        dependent_tests = [tc for tc in suite.test_cases if tc.prerequisites]
        
        # Execute independent tests in parallel
        if independent_tests:
            tasks = [
                self._execute_single_test(test_case, suite.context_id)
                for test_case in independent_tests
            ]
            results = await asyncio.gather(*tasks, return_exceptions=True)
            
            for result in results:
                if isinstance(result, Exception):
                    error_result = TestResult(
                        test_id="unknown",
                        status=TestStatus.ERROR,
                        error_message=str(result)
                    )
                    execution.test_results.append(error_result)
                    execution.error_tests += 1
                else:
                    execution.test_results.append(result)
                    if result.status == TestStatus.PASSED:
                        execution.passed_tests += 1
                    elif result.status == TestStatus.FAILED:
                        execution.failed_tests += 1
                    else:
                        execution.error_tests += 1
        
        # Execute dependent tests sequentially (simplified)
        for test_case in dependent_tests:
            if await self._check_prerequisites(test_case, execution):
                result = await self._execute_single_test(test_case, suite.context_id)
                execution.test_results.append(result)
                
                if result.status == TestStatus.PASSED:
                    execution.passed_tests += 1
                elif result.status == TestStatus.FAILED:
                    execution.failed_tests += 1
                else:
                    execution.error_tests += 1
    
    async def _execute_single_test(self, test_case: TestCase, context_id: str) -> TestResult:
        """Execute a single test case."""
        
        result = TestResult(
            test_id=test_case.test_id,
            status=TestStatus.RUNNING,
            start_time=datetime.utcnow()
        )
        
        try:
            # Simulate test execution based on test type
            if test_case.test_type == TestType.FUNCTIONAL:
                await self._execute_functional_test(test_case, context_id, result)
            elif test_case.test_type == TestType.PERFORMANCE:
                await self._execute_performance_test(test_case, context_id, result)
            elif test_case.test_type == TestType.INTEGRATION:
                await self._execute_integration_test(test_case, context_id, result)
            elif test_case.test_type == TestType.COMPLIANCE:
                await self._execute_compliance_test(test_case, context_id, result)
            elif test_case.test_type == TestType.SECURITY:
                await self._execute_security_test(test_case, context_id, result)
            elif test_case.test_type in [TestType.LOAD, TestType.STRESS]:
                await self._execute_load_test(test_case, context_id, result)
            else:
                await self._execute_generic_test(test_case, context_id, result)
            
            # Validate results against criteria
            await self._validate_test_results(test_case, result)
            
            result.end_time = datetime.utcnow()
            result.duration_seconds = (result.end_time - result.start_time).total_seconds()
            
        except asyncio.TimeoutError:
            result.status = TestStatus.FAILED
            result.error_message = f"Test timed out after {test_case.timeout_seconds} seconds"
            result.end_time = datetime.utcnow()
        except Exception as e:
            result.status = TestStatus.ERROR
            result.error_message = str(e)
            result.end_time = datetime.utcnow()
        
        return result
    
    async def _execute_functional_test(self, test_case: TestCase, context_id: str, result: TestResult):
        """Execute functional test case."""
        
        # Simulate functional testing
        await asyncio.sleep(2)  # Simulate test execution time
        
        # Mock test results based on test ID
        if "communication" in test_case.test_id:
            result.actual_results = {
                "messages_sent": 10,
                "messages_received": 10,
                "success_rate": 100.0,
                "average_latency_ms": 45.2
            }
            result.metrics = {
                "response_time": 45.2,
                "accuracy": 100.0
            }
        elif "delegation" in test_case.test_id:
            result.actual_results = {
                "tasks_delegated": 5,
                "tasks_completed": 5,
                "delegation_success_rate": 100.0,
                "average_completion_time_ms": 1250.0
            }
            result.metrics = {
                "response_time": 1250.0,
                "accuracy": 100.0
            }
        elif "aggregation" in test_case.test_id:
            result.actual_results = {
                "results_aggregated": 8,
                "aggregation_accuracy": 98.5,
                "processing_time_ms": 320.0
            }
            result.metrics = {
                "accuracy": 98.5,
                "throughput": 25.0  # results per second
            }
        elif "error_handling" in test_case.test_id:
            result.actual_results = {
                "errors_injected": 3,
                "errors_handled": 3,
                "system_availability": 99.8,
                "recovery_time_ms": 150.0
            }
            result.metrics = {
                "error_rate": 0.2,
                "availability": 99.8
            }
        
        result.status = TestStatus.PASSED
    
    async def _execute_performance_test(self, test_case: TestCase, context_id: str, result: TestResult):
        """Execute performance test case."""
        
        # Simulate performance testing
        await asyncio.sleep(5)  # Simulate longer test execution
        
        if "response_time" in test_case.test_id:
            result.actual_results = {
                "average_response_time_ms": 125.5,
                "p95_response_time_ms": 180.2,
                "p99_response_time_ms": 245.8,
                "requests_per_second": 85.3
            }
            result.metrics = {
                "response_time": 125.5,
                "throughput": 85.3
            }
        elif "throughput" in test_case.test_id:
            result.actual_results = {
                "max_throughput_rps": 150.0,
                "sustained_throughput_rps": 120.0,
                "cpu_usage_percent": 65.2,
                "memory_usage_mb": 512.8
            }
            result.metrics = {
                "throughput": 120.0,
                "resource_usage": 65.2
            }
        elif "concurrent" in test_case.test_id:
            result.actual_results = {
                "concurrent_agents": 10,
                "total_requests": 1000,
                "average_response_time_ms": 185.3,
                "cpu_usage_percent": 78.5
            }
            result.metrics = {
                "response_time": 185.3,
                "resource_usage": 78.5
            }
        
        result.status = TestStatus.PASSED
    
    async def _execute_integration_test(self, test_case: TestCase, context_id: str, result: TestResult):
        """Execute integration test case."""
        
        await asyncio.sleep(3)
        
        if "end_to_end" in test_case.test_id:
            result.actual_results = {
                "workflow_steps_completed": 8,
                "total_workflow_steps": 8,
                "end_to_end_success_rate": 100.0,
                "total_execution_time_ms": 2450.0
            }
            result.metrics = {
                "accuracy": 100.0,
                "response_time": 2450.0
            }
        elif "external" in test_case.test_id:
            result.actual_results = {
                "external_api_calls": 5,
                "successful_calls": 5,
                "api_availability": 100.0,
                "average_api_response_ms": 95.2
            }
            result.metrics = {
                "availability": 100.0,
                "error_rate": 0.0
            }
        
        result.status = TestStatus.PASSED
    
    async def _execute_compliance_test(self, test_case: TestCase, context_id: str, result: TestResult):
        """Execute compliance test case."""
        
        await asyncio.sleep(4)
        
        if "privacy" in test_case.test_id:
            result.actual_results = {
                "data_privacy_checks": 12,
                "privacy_violations": 0,
                "compliance_score": 95.5,
                "data_minimization_score": 98.0
            }
            result.metrics = {
                "compliance_score": 95.5
            }
        elif "audit" in test_case.test_id:
            result.actual_results = {
                "audit_events_logged": 25,
                "required_audit_events": 25,
                "audit_completeness": 100.0,
                "log_integrity_score": 99.8
            }
            result.metrics = {
                "compliance_score": 99.8
            }
        
        result.status = TestStatus.PASSED
    
    async def _execute_security_test(self, test_case: TestCase, context_id: str, result: TestResult):
        """Execute security test case."""
        
        await asyncio.sleep(3)
        
        if "authentication" in test_case.test_id:
            result.actual_results = {
                "auth_attempts": 10,
                "successful_auths": 10,
                "failed_auths": 0,
                "auth_success_rate": 100.0,
                "average_auth_time_ms": 85.3
            }
            result.metrics = {
                "trust_score": 95.0
            }
        elif "encryption" in test_case.test_id:
            result.actual_results = {
                "data_encrypted_in_transit": True,
                "data_encrypted_at_rest": True,
                "encryption_strength": "AES-256",
                "encryption_compliance_score": 98.5
            }
            result.metrics = {
                "compliance_score": 98.5
            }
        
        result.status = TestStatus.PASSED
    
    async def _execute_load_test(self, test_case: TestCase, context_id: str, result: TestResult):
        """Execute load/stress test case."""
        
        await asyncio.sleep(8)  # Longer execution for load tests
        
        if "stress" in test_case.test_id:
            result.actual_results = {
                "peak_load_rps": 200.0,
                "system_availability_under_load": 98.5,
                "error_rate_under_load": 1.5,
                "recovery_time_after_load_ms": 2500.0
            }
            result.metrics = {
                "availability": 98.5,
                "error_rate": 1.5
            }
        elif "burst" in test_case.test_id:
            result.actual_results = {
                "burst_capacity_rps": 300.0,
                "burst_duration_seconds": 30.0,
                "response_time_during_burst_ms": 250.0,
                "error_rate_during_burst": 0.8
            }
            result.metrics = {
                "response_time": 250.0,
                "error_rate": 0.8
            }
        
        result.status = TestStatus.PASSED
    
    async def _execute_generic_test(self, test_case: TestCase, context_id: str, result: TestResult):
        """Execute generic test case."""
        
        await asyncio.sleep(2)
        
        result.actual_results = {
            "test_executed": True,
            "basic_functionality": "working",
            "test_score": 85.0
        }
        result.metrics = {
            "accuracy": 85.0
        }
        result.status = TestStatus.PASSED
    
    async def _validate_test_results(self, test_case: TestCase, result: TestResult):
        """Validate test results against criteria."""
        
        # Define validation thresholds
        thresholds = {
            ValidationCriteria.RESPONSE_TIME: 1000.0,  # ms
            ValidationCriteria.ACCURACY: 90.0,  # percentage
            ValidationCriteria.THROUGHPUT: 50.0,  # requests per second
            ValidationCriteria.ERROR_RATE: 5.0,  # percentage
            ValidationCriteria.COMPLIANCE_SCORE: 85.0,  # percentage
            ValidationCriteria.TRUST_SCORE: 80.0,  # percentage
            ValidationCriteria.RESOURCE_USAGE: 80.0,  # percentage
            ValidationCriteria.AVAILABILITY: 95.0  # percentage
        }
        
        for criteria in test_case.validation_criteria:
            if criteria in result.metrics:
                actual_value = result.metrics[criteria]
                threshold = thresholds.get(criteria, 0.0)
                
                # Check if criteria passed
                if criteria in [ValidationCriteria.RESPONSE_TIME, ValidationCriteria.ERROR_RATE, ValidationCriteria.RESOURCE_USAGE]:
                    # Lower is better
                    passed = actual_value <= threshold
                else:
                    # Higher is better
                    passed = actual_value >= threshold
                
                if passed:
                    result.passed_criteria.append(criteria)
                else:
                    result.failed_criteria.append(criteria)
        
        # Determine overall test status
        if result.failed_criteria:
            if test_case.severity in [TestSeverity.CRITICAL, TestSeverity.HIGH]:
                result.status = TestStatus.FAILED
            else:
                result.status = TestStatus.PASSED  # Pass with warnings for low/medium severity
        else:
            result.status = TestStatus.PASSED
    
    async def _validate_test_suite(self, suite: TestSuite) -> List[str]:
        """Validate test suite configuration."""
        
        issues = []
        
        if not suite.test_cases:
            issues.append("Test suite has no test cases")
        
        # Check for duplicate test IDs
        test_ids = [tc.test_id for tc in suite.test_cases]
        if len(test_ids) != len(set(test_ids)):
            issues.append("Duplicate test IDs found in test suite")
        
        # Check prerequisites
        for test_case in suite.test_cases:
            for prereq in test_case.prerequisites:
                if prereq not in test_ids:
                    issues.append(f"Test {test_case.test_id} has invalid prerequisite: {prereq}")
        
        return issues
    
    async def _check_prerequisites(self, test_case: TestCase, execution: TestExecution) -> bool:
        """Check if test prerequisites are met."""
        
        if not test_case.prerequisites:
            return True
        
        for prereq in test_case.prerequisites:
            prereq_result = next(
                (r for r in execution.test_results if r.test_id == prereq),
                None
            )
            if not prereq_result or prereq_result.status != TestStatus.PASSED:
                return False
        
        return True
    
    async def _run_setup_scripts(self, scripts: List[str]):
        """Run setup scripts before test execution."""
        for script in scripts:
            # Mock script execution
            await asyncio.sleep(0.1)
    
    async def _run_teardown_scripts(self, scripts: List[str]):
        """Run teardown scripts after test execution."""
        for script in scripts:
            # Mock script execution
            await asyncio.sleep(0.1)
    
    def _estimate_suite_duration(self, suite: TestSuite) -> int:
        """Estimate test suite execution duration in minutes."""
        
        total_seconds = sum(tc.timeout_seconds for tc in suite.test_cases)
        
        if suite.parallel_execution:
            # Assume 70% efficiency for parallel execution
            total_seconds = total_seconds * 0.3
        
        return max(1, int(total_seconds / 60))
    
    def _calculate_overall_score(self, execution: TestExecution) -> float:
        """Calculate overall test score."""
        
        if execution.total_tests == 0:
            return 0.0
        
        # Weight different test types
        type_weights = {
            TestType.FUNCTIONAL: 0.3,
            TestType.PERFORMANCE: 0.2,
            TestType.INTEGRATION: 0.2,
            TestType.COMPLIANCE: 0.15,
            TestType.SECURITY: 0.15
        }
        
        weighted_score = 0.0
        total_weight = 0.0
        
        # Group results by test type
        type_scores = defaultdict(list)
        for result in execution.test_results:
            # Find test case to get type
            test_case = next(
                (tc for tc in self.test_suites[execution.suite_id].test_cases if tc.test_id == result.test_id),
                None
            )
            if test_case:
                score = 100.0 if result.status == TestStatus.PASSED else 0.0
                type_scores[test_case.test_type].append(score)
        
        # Calculate weighted average
        for test_type, scores in type_scores.items():
            if scores:
                avg_score = sum(scores) / len(scores)
                weight = type_weights.get(test_type, 0.1)
                weighted_score += avg_score * weight
                total_weight += weight
        
        if total_weight > 0:
            return weighted_score / total_weight
        else:
            return (execution.passed_tests / execution.total_tests) * 100.0
    
    def _assess_deployment_readiness(self, execution: TestExecution) -> bool:
        """Assess if system is ready for deployment."""
        
        # Check critical test failures
        critical_failures = 0
        for result in execution.test_results:
            test_case = next(
                (tc for tc in self.test_suites[execution.suite_id].test_cases if tc.test_id == result.test_id),
                None
            )
            if test_case and test_case.severity == TestSeverity.CRITICAL and result.status == TestStatus.FAILED:
                critical_failures += 1
        
        # Deployment criteria
        min_overall_score = 80.0
        max_critical_failures = 0
        min_pass_rate = 0.85
        
        pass_rate = execution.passed_tests / execution.total_tests if execution.total_tests > 0 else 0.0
        
        return (
            execution.overall_score >= min_overall_score and
            critical_failures <= max_critical_failures and
            pass_rate >= min_pass_rate
        )
    
    def _generate_recommendations(self, execution: TestExecution) -> List[str]:
        """Generate recommendations based on test results."""
        
        recommendations = []
        
        if execution.failed_tests > 0:
            recommendations.append(f"Address {execution.failed_tests} failed test(s) before deployment")
        
        if execution.overall_score < 80.0:
            recommendations.append("Improve system performance to achieve minimum 80% test score")
        
        if execution.error_tests > 0:
            recommendations.append(f"Investigate {execution.error_tests} test error(s)")
        
        # Check specific test types
        performance_failures = 0
        security_failures = 0
        compliance_failures = 0
        
        for result in execution.test_results:
            if result.status == TestStatus.FAILED:
                test_case = next(
                    (tc for tc in self.test_suites[execution.suite_id].test_cases if tc.test_id == result.test_id),
                    None
                )
                if test_case:
                    if test_case.test_type == TestType.PERFORMANCE:
                        performance_failures += 1
                    elif test_case.test_type == TestType.SECURITY:
                        security_failures += 1
                    elif test_case.test_type == TestType.COMPLIANCE:
                        compliance_failures += 1
        
        if performance_failures > 0:
            recommendations.append("Optimize system performance to meet response time and throughput requirements")
        
        if security_failures > 0:
            recommendations.append("Address security vulnerabilities before deployment")
        
        if compliance_failures > 0:
            recommendations.append("Ensure all compliance requirements are met")
        
        if not recommendations:
            recommendations.append("System passed all tests and is ready for deployment")
        
        return recommendations
    
    async def generate_validation_report(self, context_id: str) -> SystemValidationReport:
        """Generate comprehensive validation report for a context."""
        
        # Find latest test execution for context
        latest_execution = None
        for execution in self.test_executions.values():
            if execution.context_id == context_id:
                if not latest_execution or execution.start_time > latest_execution.start_time:
                    latest_execution = execution
        
        if not latest_execution:
            # Create default report if no tests run
            return SystemValidationReport(
                context_id=context_id,
                overall_health_score=0.0,
                deployment_readiness="not_ready",
                critical_issues=["No tests have been executed for this system"],
                recommendations=["Run comprehensive test suite before deployment"]
            )
        
        # Calculate category scores
        category_scores = self._calculate_category_scores(latest_execution)
        
        # Generate performance benchmarks
        benchmarks = self._generate_performance_benchmarks(latest_execution)
        
        # Calculate test coverage
        coverage = self._calculate_test_coverage(latest_execution)
        
        # Determine deployment readiness
        if latest_execution.deployment_ready:
            readiness = "ready"
        elif latest_execution.overall_score >= 70.0:
            readiness = "conditional"
        else:
            readiness = "not_ready"
        
        # Identify critical issues
        critical_issues = []
        for result in latest_execution.test_results:
            if result.status == TestStatus.FAILED:
                test_case = next(
                    (tc for tc in self.test_suites[latest_execution.suite_id].test_cases if tc.test_id == result.test_id),
                    None
                )
                if test_case and test_case.severity == TestSeverity.CRITICAL:
                    critical_issues.append(f"Critical test failed: {test_case.name}")
        
        return SystemValidationReport(
            context_id=context_id,
            overall_health_score=latest_execution.overall_score,
            functional_score=category_scores.get("functional", 0.0),
            performance_score=category_scores.get("performance", 0.0),
            compliance_score=category_scores.get("compliance", 0.0),
            security_score=category_scores.get("security", 0.0),
            integration_score=category_scores.get("integration", 0.0),
            deployment_readiness=readiness,
            critical_issues=critical_issues,
            recommendations=latest_execution.recommendations,
            performance_benchmarks=benchmarks,
            test_coverage=coverage
        )
    
    def _calculate_category_scores(self, execution: TestExecution) -> Dict[str, float]:
        """Calculate scores by test category."""
        
        category_results = defaultdict(list)
        
        for result in execution.test_results:
            test_case = next(
                (tc for tc in self.test_suites[execution.suite_id].test_cases if tc.test_id == result.test_id),
                None
            )
            if test_case:
                score = 100.0 if result.status == TestStatus.PASSED else 0.0
                category_results[test_case.test_type.value].append(score)
        
        category_scores = {}
        for category, scores in category_results.items():
            category_scores[category] = sum(scores) / len(scores) if scores else 0.0
        
        return category_scores
    
    def _generate_performance_benchmarks(self, execution: TestExecution) -> List[PerformanceBenchmark]:
        """Generate performance benchmarks from test results."""
        
        benchmarks = []
        
        for result in execution.test_results:
            if "response_time" in result.metrics:
                benchmarks.append(PerformanceBenchmark(
                    metric_name="Response Time",
                    target_value=1000.0,
                    actual_value=result.metrics["response_time"],
                    unit="ms",
                    passed=result.metrics["response_time"] <= 1000.0,
                    threshold_type="max"
                ))
            
            if "throughput" in result.metrics:
                benchmarks.append(PerformanceBenchmark(
                    metric_name="Throughput",
                    target_value=50.0,
                    actual_value=result.metrics["throughput"],
                    unit="rps",
                    passed=result.metrics["throughput"] >= 50.0,
                    threshold_type="min"
                ))
            
            if "availability" in result.metrics:
                benchmarks.append(PerformanceBenchmark(
                    metric_name="Availability",
                    target_value=95.0,
                    actual_value=result.metrics["availability"],
                    unit="%",
                    passed=result.metrics["availability"] >= 95.0,
                    threshold_type="min"
                ))
        
        return benchmarks
    
    def _calculate_test_coverage(self, execution: TestExecution) -> Dict[str, float]:
        """Calculate test coverage by category."""
        
        total_tests = defaultdict(int)
        executed_tests = defaultdict(int)
        
        # Count total available tests by type
        for test_case in self.default_test_cases:
            total_tests[test_case.test_type.value] += 1
        
        # Count executed tests by type
        for result in execution.test_results:
            test_case = next(
                (tc for tc in self.test_suites[execution.suite_id].test_cases if tc.test_id == result.test_id),
                None
            )
            if test_case:
                executed_tests[test_case.test_type.value] += 1
        
        coverage = {}
        for test_type, total in total_tests.items():
            executed = executed_tests.get(test_type, 0)
            coverage[test_type] = (executed / total * 100.0) if total > 0 else 0.0
        
        return coverage
    
    async def get_dashboard_data(self, context_id: Optional[str] = None) -> Dict[str, Any]:
        """Get testing and validation data for the governance dashboard."""
        
        # Filter executions by context if specified
        executions = list(self.test_executions.values())
        if context_id:
            executions = [e for e in executions if e.context_id == context_id]
        
        # Get recent executions (last 24 hours)
        recent_executions = [
            e for e in executions
            if (datetime.utcnow() - e.start_time).total_seconds() < 86400
        ]
        
        # Calculate summary statistics
        total_executions = len(recent_executions)
        passed_executions = len([e for e in recent_executions if e.deployment_ready])
        
        # Get latest execution for each context
        latest_by_context = {}
        for execution in executions:
            if execution.context_id not in latest_by_context or execution.start_time > latest_by_context[execution.context_id].start_time:
                latest_by_context[execution.context_id] = execution
        
        # Calculate average scores
        avg_scores = {}
        if recent_executions:
            avg_scores = {
                "overall": sum(e.overall_score for e in recent_executions) / len(recent_executions),
                "functional": 0.0,  # Would calculate from category scores
                "performance": 0.0,
                "compliance": 0.0,
                "security": 0.0
            }
        
        return {
            "overview": {
                "total_test_executions_24h": total_executions,
                "passed_executions": passed_executions,
                "success_rate": (passed_executions / total_executions * 100) if total_executions > 0 else 0,
                "average_test_score": avg_scores.get("overall", 0.0),
                "systems_ready_for_deployment": len([e for e in latest_by_context.values() if e.deployment_ready]),
                "total_test_suites": len(self.test_suites)
            },
            "recent_executions": [
                {
                    "execution_id": e.execution_id,
                    "context_id": e.context_id,
                    "status": e.status.value,
                    "overall_score": e.overall_score,
                    "deployment_ready": e.deployment_ready,
                    "start_time": e.start_time.isoformat(),
                    "duration_minutes": ((e.end_time or datetime.utcnow()) - e.start_time).total_seconds() / 60
                }
                for e in recent_executions[-20:]  # Last 20 executions
            ],
            "test_suites": {
                suite_id: {
                    "name": suite.name,
                    "context_id": suite.context_id,
                    "total_tests": len(suite.test_cases),
                    "estimated_duration_minutes": self._estimate_suite_duration(suite)
                }
                for suite_id, suite in self.test_suites.items()
            },
            "performance_trends": {
                "test_scores": [e.overall_score for e in recent_executions[-10:]],
                "execution_times": [
                    ((e.end_time or datetime.utcnow()) - e.start_time).total_seconds() / 60
                    for e in recent_executions[-10:]
                ]
            }
        }

# Global service instance
system_testing_service = SystemTestingService()

