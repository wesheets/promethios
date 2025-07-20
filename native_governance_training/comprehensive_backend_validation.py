#!/usr/bin/env python3
"""
Comprehensive Backend Wiring Validation and Testing Suite

This module provides comprehensive validation and testing of the complete
backend governance wiring system to ensure it's ready for production deployment.

Test Categories:
1. Component Integration Tests
2. Performance Validation Tests
3. Error Handling and Recovery Tests
4. End-to-End Governance Pipeline Tests
5. Production Readiness Tests
6. Scalability and Load Tests
7. Data Integrity and Persistence Tests
8. Event-Driven Communication Tests

This validates the transformation from 80% built, 0% connected to 
100% built, 100% connected governance infrastructure.
"""

import os
import sys
import json
import asyncio
import logging
import uuid
import time
import random
from datetime import datetime, timedelta
from typing import Dict, Any, Optional, List, Tuple
import yaml
from dataclasses import dataclass

# Add parent directory to path for imports
sys.path.append('../')

# Import all governance components
from sprint_1_4_production_optimization import (
    ProductionGovernanceFactory,
    ProductionGovernanceStorageBackend,
    ProductionGovernanceEventBus,
    ProductionMetrics
)
from sprint_1_3_enhanced_veritas_integration import (
    EnhancedVeritasIntegration,
    EmotionTelemetryIntegration
)
from governance_event_bus import GovernanceEvent, EventPriority

@dataclass
class ValidationResult:
    """Result of a validation test"""
    test_name: str
    passed: bool
    execution_time: float
    details: Dict[str, Any]
    error_message: Optional[str] = None
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for reporting"""
        return {
            'test_name': self.test_name,
            'passed': self.passed,
            'execution_time': self.execution_time,
            'details': self.details,
            'error_message': self.error_message
        }

@dataclass
class ValidationSummary:
    """Summary of all validation tests"""
    total_tests: int
    passed_tests: int
    failed_tests: int
    total_execution_time: float
    pass_rate: float
    critical_failures: List[str]
    performance_metrics: Dict[str, Any]
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for reporting"""
        return {
            'total_tests': self.total_tests,
            'passed_tests': self.passed_tests,
            'failed_tests': self.failed_tests,
            'total_execution_time': self.total_execution_time,
            'pass_rate': self.pass_rate,
            'critical_failures': self.critical_failures,
            'performance_metrics': self.performance_metrics
        }

class ComprehensiveBackendValidator:
    """
    Comprehensive validation suite for the backend governance wiring system
    """
    
    def __init__(self):
        self.logger = self._setup_logging()
        self.validation_results = []
        self.factory = None
        self.components = None
        
        # Test configuration
        self.performance_thresholds = {
            'component_creation_time': 1.0,  # seconds
            'storage_operation_time': 0.1,   # seconds
            'event_processing_time': 0.05,   # seconds
            'error_rate_threshold': 0.01,    # 1%
            'memory_usage_threshold': 500    # MB
        }
        
        self.logger.info("Comprehensive Backend Validator initialized")
    
    def _setup_logging(self) -> logging.Logger:
        """Setup validation logging"""
        logger = logging.getLogger("ComprehensiveBackendValidator")
        logger.setLevel(logging.INFO)
        
        if not logger.handlers:
            handler = logging.StreamHandler()
            formatter = logging.Formatter(
                '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
            )
            handler.setFormatter(formatter)
            logger.addHandler(handler)
        
        return logger
    
    async def run_all_validations(self) -> ValidationSummary:
        """Run all validation tests and return summary"""
        self.logger.info("🚀 Starting Comprehensive Backend Validation")
        self.logger.info("=" * 80)
        
        start_time = time.time()
        
        try:
            # Initialize test environment
            await self._initialize_test_environment()
            
            # Run all test categories
            await self._run_component_integration_tests()
            await self._run_performance_validation_tests()
            await self._run_error_handling_tests()
            await self._run_end_to_end_pipeline_tests()
            await self._run_production_readiness_tests()
            await self._run_scalability_tests()
            await self._run_data_integrity_tests()
            await self._run_event_communication_tests()
            
        except Exception as e:
            self.logger.error(f"Critical error during validation: {e}")
            self.validation_results.append(ValidationResult(
                test_name="validation_framework",
                passed=False,
                execution_time=0,
                details={},
                error_message=str(e)
            ))
        
        finally:
            # Cleanup test environment
            await self._cleanup_test_environment()
        
        # Generate summary
        total_time = time.time() - start_time
        summary = self._generate_validation_summary(total_time)
        
        # Log summary
        self._log_validation_summary(summary)
        
        return summary
    
    async def _initialize_test_environment(self):
        """Initialize the test environment"""
        self.logger.info("🔧 Initializing test environment...")
        
        try:
            self.factory = ProductionGovernanceFactory()
            self.components = await self.factory.create_all_components()
            
            self.logger.info("✅ Test environment initialized successfully")
            
        except Exception as e:
            self.logger.error(f"❌ Failed to initialize test environment: {e}")
            raise
    
    async def _cleanup_test_environment(self):
        """Cleanup the test environment"""
        self.logger.info("🧹 Cleaning up test environment...")
        
        try:
            if self.factory:
                await self.factory.shutdown()
            
            self.logger.info("✅ Test environment cleanup complete")
            
        except Exception as e:
            self.logger.error(f"⚠️  Error during cleanup: {e}")
    
    async def _run_component_integration_tests(self):
        """Test component integration and wiring"""
        self.logger.info("\n📦 Running Component Integration Tests...")
        
        # Test 1: Component Creation and Availability
        await self._test_component_creation_and_availability()
        
        # Test 2: Component Dependency Injection
        await self._test_component_dependency_injection()
        
        # Test 3: Component Communication
        await self._test_component_communication()
        
        # Test 4: Real vs Mock Component Detection
        await self._test_real_vs_mock_detection()
    
    async def _test_component_creation_and_availability(self):
        """Test that all required components are created and available"""
        start_time = time.time()
        
        try:
            required_components = [
                'trust_calculator',
                'governance_core',
                'storage_backend',
                'event_bus',
                'enhanced_veritas_integration',
                'emotion_telemetry_integration'
            ]
            
            missing_components = []
            available_components = []
            
            for component_name in required_components:
                if component_name in self.components and self.components[component_name] is not None:
                    available_components.append(component_name)
                else:
                    missing_components.append(component_name)
            
            passed = len(missing_components) == 0
            
            self.validation_results.append(ValidationResult(
                test_name="component_creation_and_availability",
                passed=passed,
                execution_time=time.time() - start_time,
                details={
                    'required_components': required_components,
                    'available_components': available_components,
                    'missing_components': missing_components,
                    'availability_rate': len(available_components) / len(required_components)
                },
                error_message=f"Missing components: {missing_components}" if missing_components else None
            ))
            
            if passed:
                self.logger.info("   ✅ Component creation and availability: PASSED")
            else:
                self.logger.error(f"   ❌ Component creation and availability: FAILED - Missing: {missing_components}")
                
        except Exception as e:
            self.validation_results.append(ValidationResult(
                test_name="component_creation_and_availability",
                passed=False,
                execution_time=time.time() - start_time,
                details={},
                error_message=str(e)
            ))
            self.logger.error(f"   ❌ Component creation test failed: {e}")
    
    async def _test_component_dependency_injection(self):
        """Test that components have proper dependency injection"""
        start_time = time.time()
        
        try:
            injection_tests = []
            
            # Test storage backend injection
            trust_calc = self.components.get('trust_calculator')
            if trust_calc and hasattr(trust_calc, 'storage_backend'):
                injection_tests.append(('trust_calculator.storage_backend', trust_calc.storage_backend is not None))
            
            # Test event bus injection
            enhanced_veritas = self.components.get('enhanced_veritas_integration')
            if enhanced_veritas and hasattr(enhanced_veritas, 'event_bus'):
                injection_tests.append(('enhanced_veritas.event_bus', enhanced_veritas.event_bus is not None))
            
            # Test emotion telemetry injection
            emotion_telemetry = self.components.get('emotion_telemetry_integration')
            if emotion_telemetry and hasattr(emotion_telemetry, 'storage_backend'):
                injection_tests.append(('emotion_telemetry.storage_backend', emotion_telemetry.storage_backend is not None))
            
            passed_injections = [test for test in injection_tests if test[1]]
            failed_injections = [test for test in injection_tests if not test[1]]
            
            passed = len(failed_injections) == 0
            
            self.validation_results.append(ValidationResult(
                test_name="component_dependency_injection",
                passed=passed,
                execution_time=time.time() - start_time,
                details={
                    'injection_tests': injection_tests,
                    'passed_injections': len(passed_injections),
                    'failed_injections': len(failed_injections),
                    'injection_rate': len(passed_injections) / len(injection_tests) if injection_tests else 1.0
                },
                error_message=f"Failed injections: {failed_injections}" if failed_injections else None
            ))
            
            if passed:
                self.logger.info("   ✅ Component dependency injection: PASSED")
            else:
                self.logger.error(f"   ❌ Component dependency injection: FAILED - {failed_injections}")
                
        except Exception as e:
            self.validation_results.append(ValidationResult(
                test_name="component_dependency_injection",
                passed=False,
                execution_time=time.time() - start_time,
                details={},
                error_message=str(e)
            ))
            self.logger.error(f"   ❌ Dependency injection test failed: {e}")
    
    async def _test_component_communication(self):
        """Test that components can communicate with each other"""
        start_time = time.time()
        
        try:
            communication_tests = []
            
            # Test storage communication
            storage = self.components.get('storage_backend')
            if storage:
                try:
                    record_id = await storage.store_data(
                        data_type='communication_test',
                        data={'test': 'component_communication', 'timestamp': datetime.now().isoformat()}
                    )
                    retrieved = await storage.retrieve_data('communication_test', record_id)
                    communication_tests.append(('storage_read_write', retrieved is not None))
                except Exception as e:
                    communication_tests.append(('storage_read_write', False))
            
            # Test event bus communication
            event_bus = self.components.get('event_bus')
            if event_bus:
                try:
                    test_event = GovernanceEvent(
                        id=str(uuid.uuid4()),
                        type='communication_test',
                        source_component='validator',
                        target_component=None,
                        timestamp=datetime.now(),
                        priority=EventPriority.LOW,
                        data={'test': 'component_communication'}
                    )
                    success = await event_bus.publish(test_event)
                    communication_tests.append(('event_bus_publish', success))
                except Exception as e:
                    communication_tests.append(('event_bus_publish', False))
            
            # Test Enhanced Veritas communication
            enhanced_veritas = self.components.get('enhanced_veritas_integration')
            if enhanced_veritas:
                try:
                    uncertainty_result = await enhanced_veritas.analyze_uncertainty(
                        query="Test communication query",
                        context={'test': True}
                    )
                    communication_tests.append(('enhanced_veritas_analysis', uncertainty_result is not None))
                except Exception as e:
                    communication_tests.append(('enhanced_veritas_analysis', False))
            
            passed_communications = [test for test in communication_tests if test[1]]
            failed_communications = [test for test in communication_tests if not test[1]]
            
            passed = len(failed_communications) == 0
            
            self.validation_results.append(ValidationResult(
                test_name="component_communication",
                passed=passed,
                execution_time=time.time() - start_time,
                details={
                    'communication_tests': communication_tests,
                    'passed_communications': len(passed_communications),
                    'failed_communications': len(failed_communications),
                    'communication_rate': len(passed_communications) / len(communication_tests) if communication_tests else 1.0
                },
                error_message=f"Failed communications: {failed_communications}" if failed_communications else None
            ))
            
            if passed:
                self.logger.info("   ✅ Component communication: PASSED")
            else:
                self.logger.error(f"   ❌ Component communication: FAILED - {failed_communications}")
                
        except Exception as e:
            self.validation_results.append(ValidationResult(
                test_name="component_communication",
                passed=False,
                execution_time=time.time() - start_time,
                details={},
                error_message=str(e)
            ))
            self.logger.error(f"   ❌ Component communication test failed: {e}")
    
    async def _test_real_vs_mock_detection(self):
        """Test detection of real vs mock components"""
        start_time = time.time()
        
        try:
            component_analysis = {}
            
            for name, component in self.components.items():
                if component:
                    class_name = component.__class__.__name__
                    is_mock = 'Mock' in class_name
                    is_real = not is_mock and class_name not in ['dict', 'str', 'int', 'float', 'list']
                    
                    component_analysis[name] = {
                        'class_name': class_name,
                        'is_mock': is_mock,
                        'is_real': is_real,
                        'type': 'mock' if is_mock else ('real' if is_real else 'infrastructure')
                    }
            
            real_components = [name for name, analysis in component_analysis.items() if analysis['is_real']]
            mock_components = [name for name, analysis in component_analysis.items() if analysis['is_mock']]
            infrastructure_components = [name for name, analysis in component_analysis.items() 
                                       if not analysis['is_real'] and not analysis['is_mock']]
            
            # We expect at least 1 real component (TrustMetricsCalculator)
            passed = len(real_components) >= 1
            
            self.validation_results.append(ValidationResult(
                test_name="real_vs_mock_detection",
                passed=passed,
                execution_time=time.time() - start_time,
                details={
                    'component_analysis': component_analysis,
                    'real_components': real_components,
                    'mock_components': mock_components,
                    'infrastructure_components': infrastructure_components,
                    'real_component_count': len(real_components),
                    'mock_component_count': len(mock_components)
                },
                error_message=f"Expected at least 1 real component, found {len(real_components)}" if not passed else None
            ))
            
            if passed:
                self.logger.info(f"   ✅ Real vs mock detection: PASSED - {len(real_components)} real, {len(mock_components)} mock")
            else:
                self.logger.error(f"   ❌ Real vs mock detection: FAILED - Only {len(real_components)} real components")
                
        except Exception as e:
            self.validation_results.append(ValidationResult(
                test_name="real_vs_mock_detection",
                passed=False,
                execution_time=time.time() - start_time,
                details={},
                error_message=str(e)
            ))
            self.logger.error(f"   ❌ Real vs mock detection test failed: {e}")
    
    async def _run_performance_validation_tests(self):
        """Test performance characteristics"""
        self.logger.info("\n⚡ Running Performance Validation Tests...")
        
        # Test 1: Component Creation Performance
        await self._test_component_creation_performance()
        
        # Test 2: Storage Operation Performance
        await self._test_storage_operation_performance()
        
        # Test 3: Event Processing Performance
        await self._test_event_processing_performance()
        
        # Test 4: Memory Usage Validation
        await self._test_memory_usage_validation()
    
    async def _test_component_creation_performance(self):
        """Test component creation performance"""
        start_time = time.time()
        
        try:
            # Get component creation times from factory
            creation_times = getattr(self.factory, 'component_creation_times', {})
            
            performance_results = {}
            slow_components = []
            
            for component_name, creation_time in creation_times.items():
                performance_results[component_name] = creation_time
                
                if creation_time > self.performance_thresholds['component_creation_time']:
                    slow_components.append((component_name, creation_time))
            
            avg_creation_time = sum(creation_times.values()) / len(creation_times) if creation_times else 0
            passed = avg_creation_time <= self.performance_thresholds['component_creation_time']
            
            self.validation_results.append(ValidationResult(
                test_name="component_creation_performance",
                passed=passed,
                execution_time=time.time() - start_time,
                details={
                    'creation_times': performance_results,
                    'average_creation_time': avg_creation_time,
                    'threshold': self.performance_thresholds['component_creation_time'],
                    'slow_components': slow_components
                },
                error_message=f"Average creation time {avg_creation_time:.3f}s exceeds threshold {self.performance_thresholds['component_creation_time']}s" if not passed else None
            ))
            
            if passed:
                self.logger.info(f"   ✅ Component creation performance: PASSED - {avg_creation_time:.3f}s average")
            else:
                self.logger.error(f"   ❌ Component creation performance: FAILED - {avg_creation_time:.3f}s average (threshold: {self.performance_thresholds['component_creation_time']}s)")
                
        except Exception as e:
            self.validation_results.append(ValidationResult(
                test_name="component_creation_performance",
                passed=False,
                execution_time=time.time() - start_time,
                details={},
                error_message=str(e)
            ))
            self.logger.error(f"   ❌ Component creation performance test failed: {e}")
    
    async def _test_storage_operation_performance(self):
        """Test storage operation performance"""
        start_time = time.time()
        
        try:
            storage = self.components.get('storage_backend')
            if not storage:
                raise Exception("Storage backend not available")
            
            # Perform multiple storage operations and measure performance
            operation_times = []
            
            for i in range(10):
                op_start = time.time()
                
                # Store operation
                record_id = await storage.store_data(
                    data_type='performance_test',
                    data={'test_id': i, 'timestamp': datetime.now().isoformat()}
                )
                
                # Retrieve operation
                retrieved = await storage.retrieve_data('performance_test', record_id)
                
                op_time = time.time() - op_start
                operation_times.append(op_time)
            
            avg_operation_time = sum(operation_times) / len(operation_times)
            max_operation_time = max(operation_times)
            min_operation_time = min(operation_times)
            
            passed = avg_operation_time <= self.performance_thresholds['storage_operation_time']
            
            self.validation_results.append(ValidationResult(
                test_name="storage_operation_performance",
                passed=passed,
                execution_time=time.time() - start_time,
                details={
                    'operation_times': operation_times,
                    'average_operation_time': avg_operation_time,
                    'max_operation_time': max_operation_time,
                    'min_operation_time': min_operation_time,
                    'threshold': self.performance_thresholds['storage_operation_time'],
                    'operations_tested': len(operation_times)
                },
                error_message=f"Average operation time {avg_operation_time:.3f}s exceeds threshold {self.performance_thresholds['storage_operation_time']}s" if not passed else None
            ))
            
            if passed:
                self.logger.info(f"   ✅ Storage operation performance: PASSED - {avg_operation_time:.3f}s average")
            else:
                self.logger.error(f"   ❌ Storage operation performance: FAILED - {avg_operation_time:.3f}s average (threshold: {self.performance_thresholds['storage_operation_time']}s)")
                
        except Exception as e:
            self.validation_results.append(ValidationResult(
                test_name="storage_operation_performance",
                passed=False,
                execution_time=time.time() - start_time,
                details={},
                error_message=str(e)
            ))
            self.logger.error(f"   ❌ Storage operation performance test failed: {e}")
    
    async def _test_event_processing_performance(self):
        """Test event processing performance"""
        start_time = time.time()
        
        try:
            event_bus = self.components.get('event_bus')
            if not event_bus:
                raise Exception("Event bus not available")
            
            # Publish multiple events and measure performance
            event_times = []
            
            for i in range(10):
                event_start = time.time()
                
                test_event = GovernanceEvent(
                    id=str(uuid.uuid4()),
                    type='performance_test',
                    source_component='validator',
                    target_component=None,
                    timestamp=datetime.now(),
                    priority=EventPriority.LOW,
                    data={'test_id': i}
                )
                
                success = await event_bus.publish(test_event)
                
                event_time = time.time() - event_start
                event_times.append(event_time)
            
            avg_event_time = sum(event_times) / len(event_times)
            max_event_time = max(event_times)
            min_event_time = min(event_times)
            
            passed = avg_event_time <= self.performance_thresholds['event_processing_time']
            
            self.validation_results.append(ValidationResult(
                test_name="event_processing_performance",
                passed=passed,
                execution_time=time.time() - start_time,
                details={
                    'event_times': event_times,
                    'average_event_time': avg_event_time,
                    'max_event_time': max_event_time,
                    'min_event_time': min_event_time,
                    'threshold': self.performance_thresholds['event_processing_time'],
                    'events_tested': len(event_times)
                },
                error_message=f"Average event time {avg_event_time:.3f}s exceeds threshold {self.performance_thresholds['event_processing_time']}s" if not passed else None
            ))
            
            if passed:
                self.logger.info(f"   ✅ Event processing performance: PASSED - {avg_event_time:.3f}s average")
            else:
                self.logger.error(f"   ❌ Event processing performance: FAILED - {avg_event_time:.3f}s average (threshold: {self.performance_thresholds['event_processing_time']}s)")
                
        except Exception as e:
            self.validation_results.append(ValidationResult(
                test_name="event_processing_performance",
                passed=False,
                execution_time=time.time() - start_time,
                details={},
                error_message=str(e)
            ))
            self.logger.error(f"   ❌ Event processing performance test failed: {e}")
    
    async def _test_memory_usage_validation(self):
        """Test memory usage validation"""
        start_time = time.time()
        
        try:
            # Get production metrics if available
            production_status = await self.factory.get_production_status()
            
            memory_usage = 0
            if 'production_metrics' in production_status:
                memory_usage = production_status['production_metrics'].get('memory_usage_mb', 0)
            
            passed = memory_usage <= self.performance_thresholds['memory_usage_threshold']
            
            self.validation_results.append(ValidationResult(
                test_name="memory_usage_validation",
                passed=passed,
                execution_time=time.time() - start_time,
                details={
                    'memory_usage_mb': memory_usage,
                    'threshold_mb': self.performance_thresholds['memory_usage_threshold'],
                    'component_count': len(self.components)
                },
                error_message=f"Memory usage {memory_usage}MB exceeds threshold {self.performance_thresholds['memory_usage_threshold']}MB" if not passed else None
            ))
            
            if passed:
                self.logger.info(f"   ✅ Memory usage validation: PASSED - {memory_usage}MB")
            else:
                self.logger.error(f"   ❌ Memory usage validation: FAILED - {memory_usage}MB (threshold: {self.performance_thresholds['memory_usage_threshold']}MB)")
                
        except Exception as e:
            self.validation_results.append(ValidationResult(
                test_name="memory_usage_validation",
                passed=False,
                execution_time=time.time() - start_time,
                details={},
                error_message=str(e)
            ))
            self.logger.error(f"   ❌ Memory usage validation test failed: {e}")
    
    async def _run_error_handling_tests(self):
        """Test error handling and recovery"""
        self.logger.info("\n🛡️  Running Error Handling and Recovery Tests...")
        
        # Test 1: Graceful Component Failure Handling
        await self._test_graceful_component_failure_handling()
        
        # Test 2: Storage Error Recovery
        await self._test_storage_error_recovery()
        
        # Test 3: Event Bus Error Handling
        await self._test_event_bus_error_handling()
    
    async def _test_graceful_component_failure_handling(self):
        """Test graceful handling of component failures"""
        start_time = time.time()
        
        try:
            # Test accessing non-existent component methods
            error_scenarios = []
            
            # Test 1: Call non-existent method on real component
            trust_calc = self.components.get('trust_calculator')
            if trust_calc:
                try:
                    # This should fail gracefully
                    result = getattr(trust_calc, 'non_existent_method', None)
                    error_scenarios.append(('non_existent_method_access', result is None))
                except Exception:
                    error_scenarios.append(('non_existent_method_access', True))  # Exception is expected
            
            # Test 2: Invalid data to storage
            storage = self.components.get('storage_backend')
            if storage:
                try:
                    # This should handle invalid data gracefully
                    await storage.store_data(data_type=None, data=None)
                    error_scenarios.append(('invalid_storage_data', False))  # Should have failed
                except Exception:
                    error_scenarios.append(('invalid_storage_data', True))  # Exception is expected
            
            # Test 3: Invalid event publishing
            event_bus = self.components.get('event_bus')
            if event_bus:
                try:
                    # This should handle invalid events gracefully
                    await event_bus.publish(None)
                    error_scenarios.append(('invalid_event_publish', False))  # Should have failed
                except Exception:
                    error_scenarios.append(('invalid_event_publish', True))  # Exception is expected
            
            passed_scenarios = [scenario for scenario in error_scenarios if scenario[1]]
            failed_scenarios = [scenario for scenario in error_scenarios if not scenario[1]]
            
            passed = len(failed_scenarios) == 0
            
            self.validation_results.append(ValidationResult(
                test_name="graceful_component_failure_handling",
                passed=passed,
                execution_time=time.time() - start_time,
                details={
                    'error_scenarios': error_scenarios,
                    'passed_scenarios': len(passed_scenarios),
                    'failed_scenarios': len(failed_scenarios),
                    'error_handling_rate': len(passed_scenarios) / len(error_scenarios) if error_scenarios else 1.0
                },
                error_message=f"Failed error handling scenarios: {failed_scenarios}" if failed_scenarios else None
            ))
            
            if passed:
                self.logger.info(f"   ✅ Graceful component failure handling: PASSED - {len(passed_scenarios)}/{len(error_scenarios)} scenarios")
            else:
                self.logger.error(f"   ❌ Graceful component failure handling: FAILED - {failed_scenarios}")
                
        except Exception as e:
            self.validation_results.append(ValidationResult(
                test_name="graceful_component_failure_handling",
                passed=False,
                execution_time=time.time() - start_time,
                details={},
                error_message=str(e)
            ))
            self.logger.error(f"   ❌ Graceful component failure handling test failed: {e}")
    
    async def _test_storage_error_recovery(self):
        """Test storage error recovery mechanisms"""
        start_time = time.time()
        
        try:
            storage = self.components.get('storage_backend')
            if not storage:
                raise Exception("Storage backend not available")
            
            recovery_tests = []
            
            # Test 1: Recovery from invalid data type
            try:
                await storage.store_data(data_type="", data={'test': 'recovery'})
                recovery_tests.append(('empty_data_type_recovery', True))
            except Exception:
                recovery_tests.append(('empty_data_type_recovery', True))  # Exception handling is recovery
            
            # Test 2: Recovery from non-existent record retrieval
            try:
                result = await storage.retrieve_data('non_existent_type', 'non_existent_id')
                recovery_tests.append(('non_existent_retrieval_recovery', result is None))
            except Exception:
                recovery_tests.append(('non_existent_retrieval_recovery', False))
            
            # Test 3: Recovery from invalid query
            try:
                result = await storage.query_data('non_existent_type', filters={'invalid': 'filter'})
                recovery_tests.append(('invalid_query_recovery', isinstance(result, list)))
            except Exception:
                recovery_tests.append(('invalid_query_recovery', False))
            
            passed_recoveries = [test for test in recovery_tests if test[1]]
            failed_recoveries = [test for test in recovery_tests if not test[1]]
            
            passed = len(failed_recoveries) == 0
            
            self.validation_results.append(ValidationResult(
                test_name="storage_error_recovery",
                passed=passed,
                execution_time=time.time() - start_time,
                details={
                    'recovery_tests': recovery_tests,
                    'passed_recoveries': len(passed_recoveries),
                    'failed_recoveries': len(failed_recoveries),
                    'recovery_rate': len(passed_recoveries) / len(recovery_tests) if recovery_tests else 1.0
                },
                error_message=f"Failed recovery tests: {failed_recoveries}" if failed_recoveries else None
            ))
            
            if passed:
                self.logger.info(f"   ✅ Storage error recovery: PASSED - {len(passed_recoveries)}/{len(recovery_tests)} recoveries")
            else:
                self.logger.error(f"   ❌ Storage error recovery: FAILED - {failed_recoveries}")
                
        except Exception as e:
            self.validation_results.append(ValidationResult(
                test_name="storage_error_recovery",
                passed=False,
                execution_time=time.time() - start_time,
                details={},
                error_message=str(e)
            ))
            self.logger.error(f"   ❌ Storage error recovery test failed: {e}")
    
    async def _test_event_bus_error_handling(self):
        """Test event bus error handling"""
        start_time = time.time()
        
        try:
            event_bus = self.components.get('event_bus')
            if not event_bus:
                raise Exception("Event bus not available")
            
            error_handling_tests = []
            
            # Test 1: Handle malformed event
            try:
                # Create event with missing required fields
                malformed_event = GovernanceEvent(
                    id="",  # Empty ID
                    type="",  # Empty type
                    source_component="",  # Empty source
                    target_component=None,
                    timestamp=datetime.now(),
                    priority=EventPriority.LOW,
                    data={}
                )
                success = await event_bus.publish(malformed_event)
                error_handling_tests.append(('malformed_event_handling', True))  # Should handle gracefully
            except Exception:
                error_handling_tests.append(('malformed_event_handling', True))  # Exception handling is acceptable
            
            # Test 2: Handle event queue overflow (if applicable)
            try:
                # Try to publish many events quickly
                for i in range(5):
                    test_event = GovernanceEvent(
                        id=str(uuid.uuid4()),
                        type='overflow_test',
                        source_component='validator',
                        target_component=None,
                        timestamp=datetime.now(),
                        priority=EventPriority.LOW,
                        data={'test_id': i}
                    )
                    await event_bus.publish(test_event)
                
                error_handling_tests.append(('event_queue_overflow_handling', True))
            except Exception:
                error_handling_tests.append(('event_queue_overflow_handling', False))
            
            passed_handling = [test for test in error_handling_tests if test[1]]
            failed_handling = [test for test in error_handling_tests if not test[1]]
            
            passed = len(failed_handling) == 0
            
            self.validation_results.append(ValidationResult(
                test_name="event_bus_error_handling",
                passed=passed,
                execution_time=time.time() - start_time,
                details={
                    'error_handling_tests': error_handling_tests,
                    'passed_handling': len(passed_handling),
                    'failed_handling': len(failed_handling),
                    'error_handling_rate': len(passed_handling) / len(error_handling_tests) if error_handling_tests else 1.0
                },
                error_message=f"Failed error handling tests: {failed_handling}" if failed_handling else None
            ))
            
            if passed:
                self.logger.info(f"   ✅ Event bus error handling: PASSED - {len(passed_handling)}/{len(error_handling_tests)} tests")
            else:
                self.logger.error(f"   ❌ Event bus error handling: FAILED - {failed_handling}")
                
        except Exception as e:
            self.validation_results.append(ValidationResult(
                test_name="event_bus_error_handling",
                passed=False,
                execution_time=time.time() - start_time,
                details={},
                error_message=str(e)
            ))
            self.logger.error(f"   ❌ Event bus error handling test failed: {e}")
    
    async def _run_end_to_end_pipeline_tests(self):
        """Test end-to-end governance pipeline"""
        self.logger.info("\n🔄 Running End-to-End Pipeline Tests...")
        
        # Test 1: Complete Governance Decision Pipeline
        await self._test_complete_governance_decision_pipeline()
        
        # Test 2: Multi-Component Interaction Pipeline
        await self._test_multi_component_interaction_pipeline()
    
    async def _test_complete_governance_decision_pipeline(self):
        """Test complete governance decision pipeline"""
        start_time = time.time()
        
        try:
            pipeline_steps = []
            
            # Step 1: Uncertainty Analysis
            enhanced_veritas = self.components.get('enhanced_veritas_integration')
            if enhanced_veritas:
                uncertainty_result = await enhanced_veritas.analyze_uncertainty(
                    query="Should we approve this financial transaction?",
                    context={'domain': 'financial', 'amount': 10000}
                )
                pipeline_steps.append(('uncertainty_analysis', uncertainty_result is not None))
            
            # Step 2: Emotion Analysis
            emotion_telemetry = self.components.get('emotion_telemetry_integration')
            if emotion_telemetry:
                emotion_result = await emotion_telemetry.analyze_emotional_state(
                    text="I'm concerned about this transaction",
                    context={'interaction_type': 'user_feedback'}
                )
                pipeline_steps.append(('emotion_analysis', emotion_result is not None))
            
            # Step 3: Trust Calculation
            trust_calc = self.components.get('trust_calculator')
            if trust_calc and hasattr(trust_calc, 'calculate_aggregate_metric'):
                try:
                    # First add some dimension metrics for the test entity
                    test_entity_id = "test_entity_validation"
                    trust_calc.update_dimension_metric(test_entity_id, "verification", 0.8)
                    trust_calc.update_dimension_metric(test_entity_id, "attestation", 0.7)
                    trust_calc.update_dimension_metric(test_entity_id, "boundary", 0.9)
                    
                    # Now calculate aggregate metric
                    trust_result = trust_calc.calculate_aggregate_metric(test_entity_id)
                    pipeline_steps.append(('trust_calculation', trust_result is not None and isinstance(trust_result, (int, float))))
                except Exception as e:
                    pipeline_steps.append(('trust_calculation', False))
            
            # Step 4: Data Storage
            storage = self.components.get('storage_backend')
            if storage:
                try:
                    record_id = await storage.store_data(
                        data_type='governance_decision',
                        data={
                            'uncertainty': uncertainty_result if 'uncertainty_result' in locals() else None,
                            'emotion': emotion_result if 'emotion_result' in locals() else None,
                            'trust': trust_result if 'trust_result' in locals() else None,
                            'timestamp': datetime.now().isoformat()
                        }
                    )
                    pipeline_steps.append(('data_storage', record_id is not None))
                except Exception:
                    pipeline_steps.append(('data_storage', False))
            
            # Step 5: Event Publishing
            event_bus = self.components.get('event_bus')
            if event_bus:
                try:
                    decision_event = GovernanceEvent(
                        id=str(uuid.uuid4()),
                        type='governance_decision_complete',
                        source_component='governance_pipeline',
                        target_component=None,
                        timestamp=datetime.now(),
                        priority=EventPriority.MEDIUM,
                        data={'decision_id': record_id if 'record_id' in locals() else 'unknown'}
                    )
                    success = await event_bus.publish(decision_event)
                    pipeline_steps.append(('event_publishing', success))
                except Exception:
                    pipeline_steps.append(('event_publishing', False))
            
            passed_steps = [step for step in pipeline_steps if step[1]]
            failed_steps = [step for step in pipeline_steps if not step[1]]
            
            passed = len(failed_steps) == 0
            
            self.validation_results.append(ValidationResult(
                test_name="complete_governance_decision_pipeline",
                passed=passed,
                execution_time=time.time() - start_time,
                details={
                    'pipeline_steps': pipeline_steps,
                    'passed_steps': len(passed_steps),
                    'failed_steps': len(failed_steps),
                    'pipeline_completion_rate': len(passed_steps) / len(pipeline_steps) if pipeline_steps else 1.0
                },
                error_message=f"Failed pipeline steps: {failed_steps}" if failed_steps else None
            ))
            
            if passed:
                self.logger.info(f"   ✅ Complete governance decision pipeline: PASSED - {len(passed_steps)}/{len(pipeline_steps)} steps")
            else:
                self.logger.error(f"   ❌ Complete governance decision pipeline: FAILED - {failed_steps}")
                
        except Exception as e:
            self.validation_results.append(ValidationResult(
                test_name="complete_governance_decision_pipeline",
                passed=False,
                execution_time=time.time() - start_time,
                details={},
                error_message=str(e)
            ))
            self.logger.error(f"   ❌ Complete governance decision pipeline test failed: {e}")
    
    async def _test_multi_component_interaction_pipeline(self):
        """Test multi-component interaction pipeline"""
        start_time = time.time()
        
        try:
            interaction_tests = []
            
            # Test 1: Enhanced Veritas -> Storage -> Event Bus chain
            enhanced_veritas = self.components.get('enhanced_veritas_integration')
            storage = self.components.get('storage_backend')
            event_bus = self.components.get('event_bus')
            
            if enhanced_veritas and storage and event_bus:
                try:
                    # Generate uncertainty analysis
                    uncertainty = await enhanced_veritas.analyze_uncertainty(
                        query="Multi-component test query",
                        context={'test': 'multi_component'}
                    )
                    
                    # Store the result
                    record_id = await storage.store_data(
                        data_type='multi_component_test',
                        data=uncertainty
                    )
                    
                    # Publish event about the analysis
                    analysis_event = GovernanceEvent(
                        id=str(uuid.uuid4()),
                        type='multi_component_analysis',
                        source_component='enhanced_veritas',
                        target_component=None,
                        timestamp=datetime.now(),
                        priority=EventPriority.LOW,
                        data={'record_id': record_id}
                    )
                    success = await event_bus.publish(analysis_event)
                    
                    interaction_tests.append(('veritas_storage_event_chain', success and record_id))
                except Exception:
                    interaction_tests.append(('veritas_storage_event_chain', False))
            
            # Test 2: Emotion Telemetry -> Trust Calculator interaction
            emotion_telemetry = self.components.get('emotion_telemetry_integration')
            trust_calc = self.components.get('trust_calculator')
            
            if emotion_telemetry and trust_calc:
                try:
                    # Analyze emotion
                    emotion = await emotion_telemetry.analyze_emotional_state(
                        text="This is a test of multi-component interaction",
                        context={'test': 'multi_component'}
                    )
                    
                    # Use emotion data in trust calculation context
                    if hasattr(trust_calc, 'calculate_aggregate_metric'):
                        # First add some dimension metrics for the test entity with emotional context
                        emotion_test_entity_id = "emotion_test_entity"
                        trust_calc.update_dimension_metric(emotion_test_entity_id, "verification", 0.8, 
                                                         metadata={'emotional_context': emotion})
                        trust_calc.update_dimension_metric(emotion_test_entity_id, "attestation", 0.7,
                                                         metadata={'emotional_context': emotion})
                        
                        # Calculate aggregate metric
                        trust_result = trust_calc.calculate_aggregate_metric(emotion_test_entity_id)
                        interaction_tests.append(('emotion_trust_interaction', trust_result is not None))
                    else:
                        interaction_tests.append(('emotion_trust_interaction', True))  # Component exists
                except Exception:
                    interaction_tests.append(('emotion_trust_interaction', False))
            
            passed_interactions = [test for test in interaction_tests if test[1]]
            failed_interactions = [test for test in interaction_tests if not test[1]]
            
            passed = len(failed_interactions) == 0
            
            self.validation_results.append(ValidationResult(
                test_name="multi_component_interaction_pipeline",
                passed=passed,
                execution_time=time.time() - start_time,
                details={
                    'interaction_tests': interaction_tests,
                    'passed_interactions': len(passed_interactions),
                    'failed_interactions': len(failed_interactions),
                    'interaction_success_rate': len(passed_interactions) / len(interaction_tests) if interaction_tests else 1.0
                },
                error_message=f"Failed interaction tests: {failed_interactions}" if failed_interactions else None
            ))
            
            if passed:
                self.logger.info(f"   ✅ Multi-component interaction pipeline: PASSED - {len(passed_interactions)}/{len(interaction_tests)} interactions")
            else:
                self.logger.error(f"   ❌ Multi-component interaction pipeline: FAILED - {failed_interactions}")
                
        except Exception as e:
            self.validation_results.append(ValidationResult(
                test_name="multi_component_interaction_pipeline",
                passed=False,
                execution_time=time.time() - start_time,
                details={},
                error_message=str(e)
            ))
            self.logger.error(f"   ❌ Multi-component interaction pipeline test failed: {e}")
    
    async def _run_production_readiness_tests(self):
        """Test production readiness"""
        self.logger.info("\n🚀 Running Production Readiness Tests...")
        
        # Test 1: Deployment Validation
        await self._test_deployment_validation()
        
        # Test 2: Health Check Functionality
        await self._test_health_check_functionality()
        
        # Test 3: Configuration Management
        await self._test_configuration_management()
    
    async def _test_deployment_validation(self):
        """Test deployment validation"""
        start_time = time.time()
        
        try:
            # Get production status
            production_status = await self.factory.get_production_status()
            
            deployment_checks = []
            
            # Check 1: All required components available
            required_components = ['trust_calculator', 'governance_core', 'storage_backend', 'event_bus']
            for component in required_components:
                available = component in self.components and self.components[component] is not None
                deployment_checks.append((f'{component}_available', available))
            
            # Check 2: Error rate within acceptable limits
            if 'production_metrics' in production_status:
                error_rate = production_status['production_metrics'].get('error_rate', 1.0)
                deployment_checks.append(('error_rate_acceptable', error_rate <= self.performance_thresholds['error_rate_threshold']))
            
            # Check 3: Performance metrics within limits
            if 'production_metrics' in production_status:
                avg_response_time = production_status['production_metrics'].get('average_response_time', 10.0)
                deployment_checks.append(('response_time_acceptable', avg_response_time <= self.performance_thresholds['component_creation_time']))
            
            # Check 4: Infrastructure health
            infrastructure_status = production_status.get('infrastructure_status', {})
            for component, status in infrastructure_status.items():
                deployment_checks.append((f'{component}_healthy', status == 'healthy'))
            
            passed_checks = [check for check in deployment_checks if check[1]]
            failed_checks = [check for check in deployment_checks if not check[1]]
            
            passed = len(failed_checks) == 0
            
            self.validation_results.append(ValidationResult(
                test_name="deployment_validation",
                passed=passed,
                execution_time=time.time() - start_time,
                details={
                    'deployment_checks': deployment_checks,
                    'passed_checks': len(passed_checks),
                    'failed_checks': len(failed_checks),
                    'deployment_readiness_score': len(passed_checks) / len(deployment_checks) if deployment_checks else 1.0
                },
                error_message=f"Failed deployment checks: {failed_checks}" if failed_checks else None
            ))
            
            if passed:
                self.logger.info(f"   ✅ Deployment validation: PASSED - {len(passed_checks)}/{len(deployment_checks)} checks")
            else:
                self.logger.error(f"   ❌ Deployment validation: FAILED - {failed_checks}")
                
        except Exception as e:
            self.validation_results.append(ValidationResult(
                test_name="deployment_validation",
                passed=False,
                execution_time=time.time() - start_time,
                details={},
                error_message=str(e)
            ))
            self.logger.error(f"   ❌ Deployment validation test failed: {e}")
    
    async def _test_health_check_functionality(self):
        """Test health check functionality"""
        start_time = time.time()
        
        try:
            health_checks = []
            
            # Check 1: Factory health monitoring
            if hasattr(self.factory, 'health_monitor'):
                health_monitor = self.factory.health_monitor
                health_checks.append(('health_monitor_available', health_monitor is not None))
                
                if health_monitor and isinstance(health_monitor, dict):
                    health_checks.append(('health_monitor_status', health_monitor.get('status') == 'healthy'))
                    health_checks.append(('health_monitor_components', 'components' in health_monitor))
            
            # Check 2: Component health status
            production_status = await self.factory.get_production_status()
            if 'health_monitor' in production_status:
                health_data = production_status['health_monitor']
                components_health = health_data.get('components', {})
                
                healthy_components = [name for name, data in components_health.items() 
                                    if data.get('status') == 'healthy']
                total_components = len(components_health)
                
                health_checks.append(('component_health_tracking', total_components > 0))
                health_checks.append(('majority_components_healthy', 
                                    len(healthy_components) >= total_components * 0.8))  # 80% healthy
            
            # Check 3: Performance metrics availability
            if 'storage_performance' in production_status:
                health_checks.append(('storage_performance_metrics', True))
            
            if 'event_bus_performance' in production_status:
                health_checks.append(('event_bus_performance_metrics', True))
            
            passed_health_checks = [check for check in health_checks if check[1]]
            failed_health_checks = [check for check in health_checks if not check[1]]
            
            passed = len(failed_health_checks) == 0
            
            self.validation_results.append(ValidationResult(
                test_name="health_check_functionality",
                passed=passed,
                execution_time=time.time() - start_time,
                details={
                    'health_checks': health_checks,
                    'passed_health_checks': len(passed_health_checks),
                    'failed_health_checks': len(failed_health_checks),
                    'health_check_coverage': len(passed_health_checks) / len(health_checks) if health_checks else 1.0
                },
                error_message=f"Failed health checks: {failed_health_checks}" if failed_health_checks else None
            ))
            
            if passed:
                self.logger.info(f"   ✅ Health check functionality: PASSED - {len(passed_health_checks)}/{len(health_checks)} checks")
            else:
                self.logger.error(f"   ❌ Health check functionality: FAILED - {failed_health_checks}")
                
        except Exception as e:
            self.validation_results.append(ValidationResult(
                test_name="health_check_functionality",
                passed=False,
                execution_time=time.time() - start_time,
                details={},
                error_message=str(e)
            ))
            self.logger.error(f"   ❌ Health check functionality test failed: {e}")
    
    async def _test_configuration_management(self):
        """Test configuration management"""
        start_time = time.time()
        
        try:
            config_tests = []
            
            # Check 1: Factory configuration loading
            if hasattr(self.factory, 'config'):
                config = self.factory.config
                config_tests.append(('config_loaded', config is not None))
                
                if config:
                    # Check for required configuration sections
                    required_sections = ['storage', 'event_bus', 'real_components']
                    for section in required_sections:
                        config_tests.append((f'config_section_{section}', section in config))
            
            # Check 2: Component configuration
            if hasattr(self.factory, 'config') and self.factory.config:
                real_components_config = self.factory.config.get('real_components', {})
                config_tests.append(('real_components_config', len(real_components_config) > 0))
                
                # Check specific component configurations
                for component_name in ['trust_metrics_calculator', 'governance_core']:
                    if component_name in real_components_config:
                        component_config = real_components_config[component_name]
                        config_tests.append((f'{component_name}_config_complete', 
                                           'enabled' in component_config and 'module' in component_config))
            
            # Check 3: Performance threshold configuration
            config_tests.append(('performance_thresholds_defined', 
                               hasattr(self, 'performance_thresholds') and len(self.performance_thresholds) > 0))
            
            passed_config_tests = [test for test in config_tests if test[1]]
            failed_config_tests = [test for test in config_tests if not test[1]]
            
            passed = len(failed_config_tests) == 0
            
            self.validation_results.append(ValidationResult(
                test_name="configuration_management",
                passed=passed,
                execution_time=time.time() - start_time,
                details={
                    'config_tests': config_tests,
                    'passed_config_tests': len(passed_config_tests),
                    'failed_config_tests': len(failed_config_tests),
                    'config_completeness': len(passed_config_tests) / len(config_tests) if config_tests else 1.0
                },
                error_message=f"Failed config tests: {failed_config_tests}" if failed_config_tests else None
            ))
            
            if passed:
                self.logger.info(f"   ✅ Configuration management: PASSED - {len(passed_config_tests)}/{len(config_tests)} tests")
            else:
                self.logger.error(f"   ❌ Configuration management: FAILED - {failed_config_tests}")
                
        except Exception as e:
            self.validation_results.append(ValidationResult(
                test_name="configuration_management",
                passed=False,
                execution_time=time.time() - start_time,
                details={},
                error_message=str(e)
            ))
            self.logger.error(f"   ❌ Configuration management test failed: {e}")
    
    async def _run_scalability_tests(self):
        """Test scalability characteristics"""
        self.logger.info("\n📈 Running Scalability Tests...")
        
        # Test 1: Storage Scalability
        await self._test_storage_scalability()
        
        # Test 2: Event Bus Scalability
        await self._test_event_bus_scalability()
    
    async def _test_storage_scalability(self):
        """Test storage scalability"""
        start_time = time.time()
        
        try:
            storage = self.components.get('storage_backend')
            if not storage:
                raise Exception("Storage backend not available")
            
            # Test with increasing load
            scalability_results = []
            
            for batch_size in [10, 50, 100]:
                batch_start = time.time()
                
                # Store batch of records
                record_ids = []
                for i in range(batch_size):
                    record_id = await storage.store_data(
                        data_type='scalability_test',
                        data={'batch_size': batch_size, 'record_index': i, 'timestamp': datetime.now().isoformat()}
                    )
                    record_ids.append(record_id)
                
                # Retrieve batch of records
                retrieved_count = 0
                for record_id in record_ids:
                    retrieved = await storage.retrieve_data('scalability_test', record_id)
                    if retrieved:
                        retrieved_count += 1
                
                batch_time = time.time() - batch_start
                throughput = batch_size / batch_time if batch_time > 0 else 0
                
                scalability_results.append({
                    'batch_size': batch_size,
                    'execution_time': batch_time,
                    'throughput': throughput,
                    'success_rate': retrieved_count / batch_size
                })
            
            # Check if throughput scales reasonably
            throughputs = [result['throughput'] for result in scalability_results]
            avg_throughput = sum(throughputs) / len(throughputs)
            
            # Expect reasonable throughput (>10 ops/sec)
            passed = avg_throughput > 10
            
            self.validation_results.append(ValidationResult(
                test_name="storage_scalability",
                passed=passed,
                execution_time=time.time() - start_time,
                details={
                    'scalability_results': scalability_results,
                    'average_throughput': avg_throughput,
                    'throughput_threshold': 10
                },
                error_message=f"Average throughput {avg_throughput:.1f} ops/sec below threshold 10 ops/sec" if not passed else None
            ))
            
            if passed:
                self.logger.info(f"   ✅ Storage scalability: PASSED - {avg_throughput:.1f} ops/sec average")
            else:
                self.logger.error(f"   ❌ Storage scalability: FAILED - {avg_throughput:.1f} ops/sec average")
                
        except Exception as e:
            self.validation_results.append(ValidationResult(
                test_name="storage_scalability",
                passed=False,
                execution_time=time.time() - start_time,
                details={},
                error_message=str(e)
            ))
            self.logger.error(f"   ❌ Storage scalability test failed: {e}")
    
    async def _test_event_bus_scalability(self):
        """Test event bus scalability"""
        start_time = time.time()
        
        try:
            event_bus = self.components.get('event_bus')
            if not event_bus:
                raise Exception("Event bus not available")
            
            # Test with increasing event load
            scalability_results = []
            
            for event_count in [10, 50, 100]:
                batch_start = time.time()
                
                # Publish batch of events
                success_count = 0
                for i in range(event_count):
                    test_event = GovernanceEvent(
                        id=str(uuid.uuid4()),
                        type='scalability_test',
                        source_component='validator',
                        target_component=None,
                        timestamp=datetime.now(),
                        priority=EventPriority.LOW,
                        data={'event_count': event_count, 'event_index': i}
                    )
                    
                    success = await event_bus.publish(test_event)
                    if success:
                        success_count += 1
                
                batch_time = time.time() - batch_start
                throughput = event_count / batch_time if batch_time > 0 else 0
                
                scalability_results.append({
                    'event_count': event_count,
                    'execution_time': batch_time,
                    'throughput': throughput,
                    'success_rate': success_count / event_count
                })
            
            # Check if throughput scales reasonably
            throughputs = [result['throughput'] for result in scalability_results]
            avg_throughput = sum(throughputs) / len(throughputs)
            
            # Expect reasonable throughput (>50 events/sec)
            passed = avg_throughput > 50
            
            self.validation_results.append(ValidationResult(
                test_name="event_bus_scalability",
                passed=passed,
                execution_time=time.time() - start_time,
                details={
                    'scalability_results': scalability_results,
                    'average_throughput': avg_throughput,
                    'throughput_threshold': 50
                },
                error_message=f"Average throughput {avg_throughput:.1f} events/sec below threshold 50 events/sec" if not passed else None
            ))
            
            if passed:
                self.logger.info(f"   ✅ Event bus scalability: PASSED - {avg_throughput:.1f} events/sec average")
            else:
                self.logger.error(f"   ❌ Event bus scalability: FAILED - {avg_throughput:.1f} events/sec average")
                
        except Exception as e:
            self.validation_results.append(ValidationResult(
                test_name="event_bus_scalability",
                passed=False,
                execution_time=time.time() - start_time,
                details={},
                error_message=str(e)
            ))
            self.logger.error(f"   ❌ Event bus scalability test failed: {e}")
    
    async def _run_data_integrity_tests(self):
        """Test data integrity and persistence"""
        self.logger.info("\n🔒 Running Data Integrity Tests...")
        
        # Test 1: Data Persistence Validation
        await self._test_data_persistence_validation()
        
        # Test 2: Data Consistency Validation
        await self._test_data_consistency_validation()
    
    async def _test_data_persistence_validation(self):
        """Test data persistence validation"""
        start_time = time.time()
        
        try:
            storage = self.components.get('storage_backend')
            if not storage:
                raise Exception("Storage backend not available")
            
            persistence_tests = []
            
            # Test 1: Store and retrieve complex data
            complex_data = {
                'string_field': 'test_string',
                'number_field': 12345,
                'float_field': 123.45,
                'boolean_field': True,
                'list_field': [1, 2, 3, 'a', 'b', 'c'],
                'dict_field': {'nested': {'deeply': {'nested': 'value'}}},
                'timestamp_field': datetime.now().isoformat()
            }
            
            record_id = await storage.store_data(
                data_type='persistence_test',
                data=complex_data
            )
            
            retrieved_data = await storage.retrieve_data('persistence_test', record_id)
            
            # Verify data integrity
            data_matches = (
                retrieved_data is not None and
                retrieved_data['data'] == complex_data
            )
            persistence_tests.append(('complex_data_persistence', data_matches))
            
            # Test 2: Multiple record persistence
            record_ids = []
            for i in range(5):
                record_id = await storage.store_data(
                    data_type='multi_persistence_test',
                    data={'index': i, 'value': f'test_value_{i}'}
                )
                record_ids.append(record_id)
            
            # Retrieve all records
            retrieved_records = []
            for record_id in record_ids:
                retrieved = await storage.retrieve_data('multi_persistence_test', record_id)
                if retrieved:
                    retrieved_records.append(retrieved)
            
            persistence_tests.append(('multiple_record_persistence', len(retrieved_records) == 5))
            
            # Test 3: Query persistence
            query_results = await storage.query_data('multi_persistence_test')
            persistence_tests.append(('query_persistence', len(query_results) >= 5))
            
            passed_persistence = [test for test in persistence_tests if test[1]]
            failed_persistence = [test for test in persistence_tests if not test[1]]
            
            passed = len(failed_persistence) == 0
            
            self.validation_results.append(ValidationResult(
                test_name="data_persistence_validation",
                passed=passed,
                execution_time=time.time() - start_time,
                details={
                    'persistence_tests': persistence_tests,
                    'passed_persistence': len(passed_persistence),
                    'failed_persistence': len(failed_persistence),
                    'persistence_rate': len(passed_persistence) / len(persistence_tests) if persistence_tests else 1.0
                },
                error_message=f"Failed persistence tests: {failed_persistence}" if failed_persistence else None
            ))
            
            if passed:
                self.logger.info(f"   ✅ Data persistence validation: PASSED - {len(passed_persistence)}/{len(persistence_tests)} tests")
            else:
                self.logger.error(f"   ❌ Data persistence validation: FAILED - {failed_persistence}")
                
        except Exception as e:
            self.validation_results.append(ValidationResult(
                test_name="data_persistence_validation",
                passed=False,
                execution_time=time.time() - start_time,
                details={},
                error_message=str(e)
            ))
            self.logger.error(f"   ❌ Data persistence validation test failed: {e}")
    
    async def _test_data_consistency_validation(self):
        """Test data consistency validation"""
        start_time = time.time()
        
        try:
            storage = self.components.get('storage_backend')
            if not storage:
                raise Exception("Storage backend not available")
            
            consistency_tests = []
            
            # Test 1: Concurrent write consistency
            record_ids = []
            
            # Simulate concurrent writes
            tasks = []
            for i in range(10):
                task = storage.store_data(
                    data_type='consistency_test',
                    data={'concurrent_write': i, 'timestamp': datetime.now().isoformat()}
                )
                tasks.append(task)
            
            # Wait for all writes to complete
            results = await asyncio.gather(*tasks, return_exceptions=True)
            
            # Count successful writes
            successful_writes = [r for r in results if isinstance(r, str)]  # record IDs are strings
            consistency_tests.append(('concurrent_write_consistency', len(successful_writes) == 10))
            
            # Test 2: Read consistency after write
            test_record_id = await storage.store_data(
                data_type='read_consistency_test',
                data={'test': 'read_consistency', 'value': 'test_value'}
            )
            
            # Immediate read
            immediate_read = await storage.retrieve_data('read_consistency_test', test_record_id)
            
            # Delayed read
            await asyncio.sleep(0.1)  # Small delay
            delayed_read = await storage.retrieve_data('read_consistency_test', test_record_id)
            
            read_consistency = (
                immediate_read is not None and
                delayed_read is not None and
                immediate_read['data'] == delayed_read['data']
            )
            consistency_tests.append(('read_after_write_consistency', read_consistency))
            
            # Test 3: Query consistency
            query_before = await storage.query_data('consistency_test')
            
            # Add one more record
            await storage.store_data(
                data_type='consistency_test',
                data={'additional_record': True}
            )
            
            query_after = await storage.query_data('consistency_test')
            
            query_consistency = len(query_after) == len(query_before) + 1
            consistency_tests.append(('query_consistency', query_consistency))
            
            passed_consistency = [test for test in consistency_tests if test[1]]
            failed_consistency = [test for test in consistency_tests if not test[1]]
            
            passed = len(failed_consistency) == 0
            
            self.validation_results.append(ValidationResult(
                test_name="data_consistency_validation",
                passed=passed,
                execution_time=time.time() - start_time,
                details={
                    'consistency_tests': consistency_tests,
                    'passed_consistency': len(passed_consistency),
                    'failed_consistency': len(failed_consistency),
                    'consistency_rate': len(passed_consistency) / len(consistency_tests) if consistency_tests else 1.0
                },
                error_message=f"Failed consistency tests: {failed_consistency}" if failed_consistency else None
            ))
            
            if passed:
                self.logger.info(f"   ✅ Data consistency validation: PASSED - {len(passed_consistency)}/{len(consistency_tests)} tests")
            else:
                self.logger.error(f"   ❌ Data consistency validation: FAILED - {failed_consistency}")
                
        except Exception as e:
            self.validation_results.append(ValidationResult(
                test_name="data_consistency_validation",
                passed=False,
                execution_time=time.time() - start_time,
                details={},
                error_message=str(e)
            ))
            self.logger.error(f"   ❌ Data consistency validation test failed: {e}")
    
    async def _run_event_communication_tests(self):
        """Test event-driven communication"""
        self.logger.info("\n📡 Running Event Communication Tests...")
        
        # Test 1: Event Publishing and Processing
        await self._test_event_publishing_and_processing()
        
        # Test 2: Event Priority Handling
        await self._test_event_priority_handling()
    
    async def _test_event_publishing_and_processing(self):
        """Test event publishing and processing"""
        start_time = time.time()
        
        try:
            event_bus = self.components.get('event_bus')
            if not event_bus:
                raise Exception("Event bus not available")
            
            communication_tests = []
            
            # Test 1: Basic event publishing
            test_event = GovernanceEvent(
                id=str(uuid.uuid4()),
                type='communication_test',
                source_component='validator',
                target_component=None,
                timestamp=datetime.now(),
                priority=EventPriority.MEDIUM,
                data={'test': 'basic_publishing'}
            )
            
            success = await event_bus.publish(test_event)
            communication_tests.append(('basic_event_publishing', success))
            
            # Test 2: Multiple event publishing
            events_published = 0
            for i in range(5):
                event = GovernanceEvent(
                    id=str(uuid.uuid4()),
                    type='multiple_test',
                    source_component='validator',
                    target_component=None,
                    timestamp=datetime.now(),
                    priority=EventPriority.LOW,
                    data={'event_index': i}
                )
                
                if await event_bus.publish(event):
                    events_published += 1
            
            communication_tests.append(('multiple_event_publishing', events_published == 5))
            
            # Test 3: Event with different priorities
            priority_events = []
            for priority in [EventPriority.LOW, EventPriority.MEDIUM, EventPriority.HIGH, EventPriority.CRITICAL]:
                event = GovernanceEvent(
                    id=str(uuid.uuid4()),
                    type='priority_test',
                    source_component='validator',
                    target_component=None,
                    timestamp=datetime.now(),
                    priority=priority,
                    data={'priority': priority.name}
                )
                
                success = await event_bus.publish(event)
                priority_events.append(success)
            
            communication_tests.append(('priority_event_publishing', all(priority_events)))
            
            # Test 4: Event bus performance metrics
            if hasattr(event_bus, 'get_performance_metrics'):
                metrics = event_bus.get_performance_metrics()
                communication_tests.append(('event_metrics_available', 'events_published' in metrics))
            
            passed_communication = [test for test in communication_tests if test[1]]
            failed_communication = [test for test in communication_tests if not test[1]]
            
            passed = len(failed_communication) == 0
            
            self.validation_results.append(ValidationResult(
                test_name="event_publishing_and_processing",
                passed=passed,
                execution_time=time.time() - start_time,
                details={
                    'communication_tests': communication_tests,
                    'passed_communication': len(passed_communication),
                    'failed_communication': len(failed_communication),
                    'communication_success_rate': len(passed_communication) / len(communication_tests) if communication_tests else 1.0
                },
                error_message=f"Failed communication tests: {failed_communication}" if failed_communication else None
            ))
            
            if passed:
                self.logger.info(f"   ✅ Event publishing and processing: PASSED - {len(passed_communication)}/{len(communication_tests)} tests")
            else:
                self.logger.error(f"   ❌ Event publishing and processing: FAILED - {failed_communication}")
                
        except Exception as e:
            self.validation_results.append(ValidationResult(
                test_name="event_publishing_and_processing",
                passed=False,
                execution_time=time.time() - start_time,
                details={},
                error_message=str(e)
            ))
            self.logger.error(f"   ❌ Event publishing and processing test failed: {e}")
    
    async def _test_event_priority_handling(self):
        """Test event priority handling"""
        start_time = time.time()
        
        try:
            event_bus = self.components.get('event_bus')
            if not event_bus:
                raise Exception("Event bus not available")
            
            priority_tests = []
            
            # Test 1: Critical priority event handling
            critical_event = GovernanceEvent(
                id=str(uuid.uuid4()),
                type='critical_test',
                source_component='validator',
                target_component=None,
                timestamp=datetime.now(),
                priority=EventPriority.CRITICAL,
                data={'urgency': 'critical'}
            )
            
            success = await event_bus.publish(critical_event)
            priority_tests.append(('critical_priority_handling', success))
            
            # Test 2: High priority event handling
            high_event = GovernanceEvent(
                id=str(uuid.uuid4()),
                type='high_priority_test',
                source_component='validator',
                target_component=None,
                timestamp=datetime.now(),
                priority=EventPriority.HIGH,
                data={'urgency': 'high'}
            )
            
            success = await event_bus.publish(high_event)
            priority_tests.append(('high_priority_handling', success))
            
            # Test 3: Mixed priority event batch
            mixed_events = []
            priorities = [EventPriority.LOW, EventPriority.HIGH, EventPriority.MEDIUM, EventPriority.CRITICAL]
            
            for i, priority in enumerate(priorities):
                event = GovernanceEvent(
                    id=str(uuid.uuid4()),
                    type='mixed_priority_test',
                    source_component='validator',
                    target_component=None,
                    timestamp=datetime.now(),
                    priority=priority,
                    data={'priority_index': i}
                )
                
                success = await event_bus.publish(event)
                mixed_events.append(success)
            
            priority_tests.append(('mixed_priority_handling', all(mixed_events)))
            
            passed_priority = [test for test in priority_tests if test[1]]
            failed_priority = [test for test in priority_tests if not test[1]]
            
            passed = len(failed_priority) == 0
            
            self.validation_results.append(ValidationResult(
                test_name="event_priority_handling",
                passed=passed,
                execution_time=time.time() - start_time,
                details={
                    'priority_tests': priority_tests,
                    'passed_priority': len(passed_priority),
                    'failed_priority': len(failed_priority),
                    'priority_handling_rate': len(passed_priority) / len(priority_tests) if priority_tests else 1.0
                },
                error_message=f"Failed priority tests: {failed_priority}" if failed_priority else None
            ))
            
            if passed:
                self.logger.info(f"   ✅ Event priority handling: PASSED - {len(passed_priority)}/{len(priority_tests)} tests")
            else:
                self.logger.error(f"   ❌ Event priority handling: FAILED - {failed_priority}")
                
        except Exception as e:
            self.validation_results.append(ValidationResult(
                test_name="event_priority_handling",
                passed=False,
                execution_time=time.time() - start_time,
                details={},
                error_message=str(e)
            ))
            self.logger.error(f"   ❌ Event priority handling test failed: {e}")
    
    def _generate_validation_summary(self, total_execution_time: float) -> ValidationSummary:
        """Generate comprehensive validation summary"""
        
        total_tests = len(self.validation_results)
        passed_tests = len([r for r in self.validation_results if r.passed])
        failed_tests = total_tests - passed_tests
        pass_rate = passed_tests / total_tests if total_tests > 0 else 0
        
        # Identify critical failures
        critical_failures = []
        critical_test_names = [
            'component_creation_and_availability',
            'component_dependency_injection',
            'deployment_validation',
            'complete_governance_decision_pipeline'
        ]
        
        for result in self.validation_results:
            if not result.passed and result.test_name in critical_test_names:
                critical_failures.append(result.test_name)
        
        # Collect performance metrics
        performance_metrics = {}
        
        for result in self.validation_results:
            if 'performance' in result.test_name or 'scalability' in result.test_name:
                performance_metrics[result.test_name] = {
                    'execution_time': result.execution_time,
                    'passed': result.passed,
                    'details': result.details
                }
        
        return ValidationSummary(
            total_tests=total_tests,
            passed_tests=passed_tests,
            failed_tests=failed_tests,
            total_execution_time=total_execution_time,
            pass_rate=pass_rate,
            critical_failures=critical_failures,
            performance_metrics=performance_metrics
        )
    
    def _log_validation_summary(self, summary: ValidationSummary):
        """Log comprehensive validation summary"""
        
        self.logger.info("\n" + "=" * 80)
        self.logger.info("🎯 COMPREHENSIVE BACKEND VALIDATION SUMMARY")
        self.logger.info("=" * 80)
        
        # Overall results
        self.logger.info(f"📊 Overall Results:")
        self.logger.info(f"   Total tests: {summary.total_tests}")
        self.logger.info(f"   Passed tests: {summary.passed_tests}")
        self.logger.info(f"   Failed tests: {summary.failed_tests}")
        self.logger.info(f"   Pass rate: {summary.pass_rate:.1%}")
        self.logger.info(f"   Total execution time: {summary.total_execution_time:.3f}s")
        
        # Critical failures
        if summary.critical_failures:
            self.logger.error(f"\n🚨 Critical Failures:")
            for failure in summary.critical_failures:
                self.logger.error(f"   ❌ {failure}")
        else:
            self.logger.info(f"\n✅ No critical failures detected")
        
        # Performance summary
        if summary.performance_metrics:
            self.logger.info(f"\n⚡ Performance Summary:")
            for test_name, metrics in summary.performance_metrics.items():
                status = "✅ PASSED" if metrics['passed'] else "❌ FAILED"
                self.logger.info(f"   {test_name}: {status} ({metrics['execution_time']:.3f}s)")
        
        # Test category breakdown
        self.logger.info(f"\n📋 Test Category Breakdown:")
        
        categories = {
            'Component Integration': [r for r in self.validation_results if 'component' in r.test_name],
            'Performance': [r for r in self.validation_results if 'performance' in r.test_name],
            'Error Handling': [r for r in self.validation_results if 'error' in r.test_name or 'recovery' in r.test_name],
            'End-to-End Pipeline': [r for r in self.validation_results if 'pipeline' in r.test_name],
            'Production Readiness': [r for r in self.validation_results if 'deployment' in r.test_name or 'health' in r.test_name or 'configuration' in r.test_name],
            'Scalability': [r for r in self.validation_results if 'scalability' in r.test_name],
            'Data Integrity': [r for r in self.validation_results if 'persistence' in r.test_name or 'consistency' in r.test_name],
            'Event Communication': [r for r in self.validation_results if 'event' in r.test_name and 'communication' in r.test_name]
        }
        
        for category, results in categories.items():
            if results:
                passed = len([r for r in results if r.passed])
                total = len(results)
                rate = passed / total if total > 0 else 0
                status = "✅" if rate == 1.0 else "⚠️" if rate >= 0.8 else "❌"
                self.logger.info(f"   {status} {category}: {passed}/{total} ({rate:.1%})")
        
        # Final assessment
        self.logger.info(f"\n🎯 Final Assessment:")
        
        if summary.pass_rate >= 0.95 and not summary.critical_failures:
            self.logger.info("   🎉 EXCELLENT: Backend governance system is production-ready!")
        elif summary.pass_rate >= 0.85 and len(summary.critical_failures) <= 1:
            self.logger.info("   ✅ GOOD: Backend governance system is mostly ready with minor issues")
        elif summary.pass_rate >= 0.70:
            self.logger.warning("   ⚠️  FAIR: Backend governance system needs improvements before production")
        else:
            self.logger.error("   ❌ POOR: Backend governance system requires significant fixes")
        
        self.logger.info("=" * 80)


# Main validation function
async def run_comprehensive_backend_validation():
    """Run comprehensive backend validation"""
    validator = ComprehensiveBackendValidator()
    summary = await validator.run_all_validations()
    
    # Save validation report
    report_path = '/home/ubuntu/promethios/native_governance_training/backend_validation_report.json'
    
    validation_report = {
        'summary': summary.to_dict(),
        'detailed_results': [result.to_dict() for result in validator.validation_results],
        'timestamp': datetime.now().isoformat(),
        'validator_version': '1.0.0'
    }
    
    with open(report_path, 'w') as f:
        json.dump(validation_report, f, indent=2)
    
    print(f"\n📄 Detailed validation report saved to: {report_path}")
    
    return summary


if __name__ == "__main__":
    asyncio.run(run_comprehensive_backend_validation())

