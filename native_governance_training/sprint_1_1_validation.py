#!/usr/bin/env python3
"""
Sprint 1.1 Validation Script

This script validates that Sprint 1.1 (GovernanceComponentFactory with full integration)
is complete and all governance components are properly wired together.

Sprint 1.1 Success Criteria:
1. All governance components are real (not None)
2. Components can communicate with each other
3. Real metrics are generated (no fake metrics)
4. Inference wrapper uses real components
5. Test infrastructure validates system integrity

Codex Contract: v2025.05.21
Phase ID: 6.3
"""

import asyncio
import logging
import json
import sys
import os
from datetime import datetime
from typing import Dict, Any, List
from pathlib import Path

# Import test infrastructure
from test_governance_wiring import GovernanceWiringTestSuite, quick_wiring_check

# Import governance components for validation
from governance_component_factory import GovernanceComponentFactory
from governance_monitor import get_governance_monitor
from promethios_governance_inference_wrapper import PrometheosGovernanceMonitor

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class Sprint11Validator:
    """
    Validates Sprint 1.1 completion and readiness for Sprint 1.2.
    
    This class performs comprehensive validation to ensure that:
    - All governance components are properly wired
    - Real metrics are being generated
    - System integration is working correctly
    - No fake metrics or None components remain
    
    Codex Contract: v2025.05.21
    Phase ID: 6.3
    """
    
    def __init__(self):
        self.validation_results = {}
        self.start_time = None
        self.end_time = None
        
    async def run_sprint_11_validation(self) -> Dict[str, Any]:
        """
        Run complete Sprint 1.1 validation.
        
        Returns:
            Comprehensive validation results
        """
        self.start_time = datetime.now()
        logger.info("🚀 Starting Sprint 1.1 Validation...")
        
        try:
            # Validation categories
            validation_categories = [
                ("quick_wiring_check", self._validate_quick_wiring),
                ("component_factory", self._validate_component_factory),
                ("governance_monitor", self._validate_governance_monitor),
                ("inference_wrapper", self._validate_inference_wrapper),
                ("real_metrics_generation", self._validate_real_metrics),
                ("component_communication", self._validate_component_communication),
                ("backwards_compatibility", self._validate_backwards_compatibility),
                ("comprehensive_testing", self._validate_comprehensive_testing)
            ]
            
            for category_name, validation_method in validation_categories:
                logger.info(f"🔍 Validating {category_name}...")
                
                try:
                    category_result = await validation_method()
                    self.validation_results[category_name] = {
                        'status': 'passed' if category_result.get('success', False) else 'failed',
                        'result': category_result,
                        'timestamp': datetime.now().isoformat()
                    }
                    
                    status = "✅ PASSED" if category_result.get('success', False) else "❌ FAILED"
                    logger.info(f"{status}: {category_name}")
                    
                except Exception as e:
                    self.validation_results[category_name] = {
                        'status': 'error',
                        'error': str(e),
                        'timestamp': datetime.now().isoformat()
                    }
                    logger.error(f"❌ ERROR in {category_name}: {e}")
            
            # Generate final validation report
            final_report = self._generate_final_validation_report()
            
            self.end_time = datetime.now()
            
            # Log final status
            overall_status = final_report['sprint_11_status']['overall_status']
            if overall_status == 'complete':
                logger.info("🎉 Sprint 1.1 VALIDATION PASSED - Ready for Sprint 1.2!")
            elif overall_status == 'mostly_complete':
                logger.warning("⚠️ Sprint 1.1 MOSTLY COMPLETE - Minor issues to address")
            else:
                logger.error("❌ Sprint 1.1 VALIDATION FAILED - Major issues need resolution")
            
            return final_report
            
        except Exception as e:
            logger.error(f"Sprint 1.1 validation failed: {e}")
            raise
    
    async def _validate_quick_wiring(self) -> Dict[str, Any]:
        """Validate basic wiring status."""
        try:
            quick_result = await quick_wiring_check()
            
            success = (
                quick_result.get('wiring_status') == 'working' and
                quick_result.get('none_components', 0) == 0
            )
            
            return {
                'success': success,
                'wiring_status': quick_result.get('wiring_status'),
                'total_components': quick_result.get('total_components', 0),
                'real_components': quick_result.get('real_components', 0),
                'none_components': quick_result.get('none_components', 0),
                'none_component_list': quick_result.get('none_component_list', []),
                'details': quick_result
            }\n            \n        except Exception as e:\n            return {\n                'success': False,\n                'error': str(e)\n            }\n    \n    async def _validate_component_factory(self) -> Dict[str, Any]:\n        \"\"\"Validate GovernanceComponentFactory functionality.\"\"\"\n        try:\n            # Test component factory initialization\n            factory = GovernanceComponentFactory()\n            await factory.initialize()\n            \n            # Test component creation\n            components = await factory.create_all_components()\n            \n            # Validate components are real\n            real_components = [name for name, comp in components.items() if comp is not None]\n            none_components = [name for name, comp in components.items() if comp is None]\n            \n            success = len(none_components) == 0 and len(real_components) > 0\n            \n            return {\n                'success': success,\n                'factory_initialized': True,\n                'total_components': len(components),\n                'real_components': len(real_components),\n                'none_components': len(none_components),\n                'real_component_list': real_components,\n                'none_component_list': none_components,\n                'component_types': {name: type(comp).__name__ for name, comp in components.items() if comp is not None}\n            }\n            \n        except Exception as e:\n            return {\n                'success': False,\n                'error': str(e)\n            }\n    \n    async def _validate_governance_monitor(self) -> Dict[str, Any]:\n        \"\"\"Validate GovernanceMonitor functionality.\"\"\"\n        try:\n            # Get governance monitor\n            monitor = await get_governance_monitor()\n            \n            # Test system status\n            system_status = await monitor.get_system_status()\n            \n            # Test component retrieval\n            all_components = await monitor.get_all_real_components()\n            \n            # Validate components\n            real_components = [name for name, comp in all_components.items() if comp is not None]\n            none_components = [name for name, comp in all_components.items() if comp is None]\n            \n            success = (\n                system_status.get('status') == 'healthy' and\n                len(none_components) == 0 and\n                len(real_components) > 0\n            )\n            \n            return {\n                'success': success,\n                'system_status': system_status,\n                'total_components': len(all_components),\n                'real_components': len(real_components),\n                'none_components': len(none_components),\n                'real_component_list': real_components,\n                'none_component_list': none_components\n            }\n            \n        except Exception as e:\n            return {\n                'success': False,\n                'error': str(e)\n            }\n    \n    async def _validate_inference_wrapper(self) -> Dict[str, Any]:\n        \"\"\"Validate PrometheosGovernanceMonitor (inference wrapper) functionality.\"\"\"\n        try:\n            # Initialize inference wrapper\n            config = {'test': True}\n            wrapper = PrometheosGovernanceMonitor(config)\n            \n            # Initialize real components\n            await wrapper.initialize_real_components()\n            \n            # Verify components are real\n            component_verification = await wrapper._verify_real_components()\n            \n            # Test metrics fetching\n            test_session_id = \"test_session_123\"\n            metrics = await wrapper.get_current_metrics(test_session_id)\n            \n            # Validate metrics are real (not fallback)\n            real_metrics = metrics.get('real_metrics', False)\n            component_status = metrics.get('component_status', 'unknown')\n            \n            success = (\n                wrapper._real_components_injected and\n                component_verification.get('all_real', False) and\n                metrics is not None\n            )\n            \n            return {\n                'success': success,\n                'components_injected': wrapper._real_components_injected,\n                'all_components_real': component_verification.get('all_real', False),\n                'component_verification': component_verification,\n                'metrics_fetched': metrics is not None,\n                'real_metrics': real_metrics,\n                'component_status': component_status,\n                'sample_metrics': metrics\n            }\n            \n        except Exception as e:\n            return {\n                'success': False,\n                'error': str(e)\n            }\n    \n    async def _validate_real_metrics(self) -> Dict[str, Any]:\n        \"\"\"Validate that real metrics are being generated (no fake metrics).\"\"\"\n        try:\n            # Run comprehensive test suite focusing on real vs fake metrics\n            test_suite = GovernanceWiringTestSuite()\n            \n            # Run only the real vs fake metrics test\n            await test_suite._setup_test_environment()\n            \n            try:\n                real_metrics_results = await test_suite._test_real_vs_fake_metrics()\n                \n                # Analyze results\n                fake_metrics_detected = real_metrics_results.get('fake_metrics_detected', [])\n                real_metrics_confirmed = real_metrics_results.get('real_metrics_confirmed', [])\n                metrics_quality_score = real_metrics_results.get('metrics_quality_score', 0.0)\n                \n                success = (\n                    len(fake_metrics_detected) == 0 and\n                    len(real_metrics_confirmed) > 0 and\n                    metrics_quality_score >= 0.8\n                )\n                \n                return {\n                    'success': success,\n                    'fake_metrics_detected': fake_metrics_detected,\n                    'real_metrics_confirmed': real_metrics_confirmed,\n                    'metrics_quality_score': metrics_quality_score,\n                    'detailed_results': real_metrics_results\n                }\n                \n            finally:\n                await test_suite._cleanup_test_environment()\n            \n        except Exception as e:\n            return {\n                'success': False,\n                'error': str(e)\n            }\n    \n    async def _validate_component_communication(self) -> Dict[str, Any]:\n        \"\"\"Validate that components can communicate with each other.\"\"\"\n        try:\n            # Run integration verification test\n            test_suite = GovernanceWiringTestSuite()\n            \n            await test_suite._setup_test_environment()\n            \n            try:\n                integration_results = await test_suite._test_integration_verification()\n                \n                # Analyze results\n                successful_integrations = integration_results.get('successful_integrations', 0)\n                failed_integrations = integration_results.get('failed_integrations', 0)\n                integration_success_rate = integration_results.get('integration_success_rate', 0.0)\n                \n                success = (\n                    integration_success_rate >= 0.8 and\n                    successful_integrations > 0\n                )\n                \n                return {\n                    'success': success,\n                    'successful_integrations': successful_integrations,\n                    'failed_integrations': failed_integrations,\n                    'integration_success_rate': integration_success_rate,\n                    'detailed_results': integration_results\n                }\n                \n            finally:\n                await test_suite._cleanup_test_environment()\n            \n        except Exception as e:\n            return {\n                'success': False,\n                'error': str(e)\n            }\n    \n    async def _validate_backwards_compatibility(self) -> Dict[str, Any]:\n        \"\"\"Validate backwards compatibility with existing code.\"\"\"\n        try:\n            # Run backwards compatibility test\n            test_suite = GovernanceWiringTestSuite()\n            \n            await test_suite._setup_test_environment()\n            \n            try:\n                compatibility_results = await test_suite._test_backwards_compatibility()\n                \n                backwards_compatible = compatibility_results.get('backwards_compatible', False)\n                \n                return {\n                    'success': backwards_compatible,\n                    'backwards_compatible': backwards_compatible,\n                    'detailed_results': compatibility_results\n                }\n                \n            finally:\n                await test_suite._cleanup_test_environment()\n            \n        except Exception as e:\n            return {\n                'success': False,\n                'error': str(e)\n            }\n    \n    async def _validate_comprehensive_testing(self) -> Dict[str, Any]:\n        \"\"\"Validate that comprehensive testing infrastructure works.\"\"\"\n        try:\n            # Run a subset of comprehensive tests\n            test_suite = GovernanceWiringTestSuite()\n            \n            # Run performance and reliability tests\n            await test_suite._setup_test_environment()\n            \n            try:\n                performance_results = await test_suite._test_performance_reliability()\n                \n                performance_acceptable = performance_results.get('performance_acceptable', False)\n                reliability_acceptable = performance_results.get('reliability_acceptable', False)\n                \n                success = performance_acceptable and reliability_acceptable\n                \n                return {\n                    'success': success,\n                    'performance_acceptable': performance_acceptable,\n                    'reliability_acceptable': reliability_acceptable,\n                    'detailed_results': performance_results\n                }\n                \n            finally:\n                await test_suite._cleanup_test_environment()\n            \n        except Exception as e:\n            return {\n                'success': False,\n                'error': str(e)\n            }\n    \n    def _generate_final_validation_report(self) -> Dict[str, Any]:\n        \"\"\"Generate final Sprint 1.1 validation report.\"\"\"\n        # Calculate success metrics\n        total_validations = len(self.validation_results)\n        passed_validations = sum(1 for result in self.validation_results.values() if result.get('status') == 'passed')\n        failed_validations = sum(1 for result in self.validation_results.values() if result.get('status') == 'failed')\n        error_validations = sum(1 for result in self.validation_results.values() if result.get('status') == 'error')\n        \n        success_rate = passed_validations / total_validations if total_validations > 0 else 0\n        \n        # Determine overall status\n        if success_rate >= 0.9:\n            overall_status = 'complete'\n            status_message = 'Sprint 1.1 is complete and ready for Sprint 1.2'\n        elif success_rate >= 0.7:\n            overall_status = 'mostly_complete'\n            status_message = 'Sprint 1.1 is mostly complete with minor issues'\n        elif success_rate >= 0.5:\n            overall_status = 'partially_complete'\n            status_message = 'Sprint 1.1 has significant issues that need resolution'\n        else:\n            overall_status = 'incomplete'\n            status_message = 'Sprint 1.1 is not complete and requires major work'\n        \n        # Generate recommendations\n        recommendations = []\n        critical_issues = []\n        \n        for category, result in self.validation_results.items():\n            if result.get('status') in ['failed', 'error']:\n                if category in ['quick_wiring_check', 'component_factory', 'governance_monitor']:\n                    critical_issues.append(f\"CRITICAL: {category} validation failed\")\n                else:\n                    recommendations.append(f\"Fix issues in {category}\")\n        \n        # Sprint 1.1 specific checks\n        sprint_11_criteria = {\n            'all_components_real': False,\n            'real_metrics_generated': False,\n            'component_communication': False,\n            'inference_wrapper_updated': False,\n            'backwards_compatible': False\n        }\n        \n        # Check specific criteria\n        if 'quick_wiring_check' in self.validation_results:\n            quick_result = self.validation_results['quick_wiring_check'].get('result', {})\n            sprint_11_criteria['all_components_real'] = quick_result.get('none_components', 1) == 0\n        \n        if 'real_metrics_generation' in self.validation_results:\n            metrics_result = self.validation_results['real_metrics_generation'].get('result', {})\n            sprint_11_criteria['real_metrics_generated'] = len(metrics_result.get('fake_metrics_detected', [])) == 0\n        \n        if 'component_communication' in self.validation_results:\n            comm_result = self.validation_results['component_communication'].get('result', {})\n            sprint_11_criteria['component_communication'] = comm_result.get('integration_success_rate', 0) >= 0.8\n        \n        if 'inference_wrapper' in self.validation_results:\n            wrapper_result = self.validation_results['inference_wrapper'].get('result', {})\n            sprint_11_criteria['inference_wrapper_updated'] = wrapper_result.get('components_injected', False)\n        \n        if 'backwards_compatibility' in self.validation_results:\n            compat_result = self.validation_results['backwards_compatibility'].get('result', {})\n            sprint_11_criteria['backwards_compatible'] = compat_result.get('backwards_compatible', False)\n        \n        # Next steps based on status\n        if overall_status == 'complete':\n            next_steps = [\n                \"✅ Sprint 1.1 is complete!\",\n                \"🚀 Ready to begin Sprint 1.2: Real Metrics Integration\",\n                \"📋 Focus on replacing remaining fake metrics with real calculations\",\n                \"🔧 Implement enhanced governance features\"\n            ]\n        elif overall_status == 'mostly_complete':\n            next_steps = [\n                \"⚠️ Address minor issues before Sprint 1.2\",\n                \"🔧 Fix failing validation categories\",\n                \"✅ Validate fixes with test suite\",\n                \"🚀 Proceed to Sprint 1.2 after fixes\"\n            ]\n        else:\n            next_steps = [\n                \"❌ Complete Sprint 1.1 before proceeding\",\n                \"🔧 Address critical issues: \" + \", \".join(critical_issues[:3]),\n                \"📋 Focus on component wiring and real metrics\",\n                \"🧪 Run validation again after fixes\"\n            ]\n        \n        return {\n            'sprint_11_status': {\n                'overall_status': overall_status,\n                'status_message': status_message,\n                'success_rate': success_rate,\n                'total_validations': total_validations,\n                'passed_validations': passed_validations,\n                'failed_validations': failed_validations,\n                'error_validations': error_validations\n            },\n            'sprint_11_criteria': sprint_11_criteria,\n            'validation_results': self.validation_results,\n            'critical_issues': critical_issues,\n            'recommendations': recommendations,\n            'next_steps': next_steps,\n            'validation_summary': {\n                'start_time': self.start_time.isoformat() if self.start_time else None,\n                'end_time': self.end_time.isoformat() if self.end_time else None,\n                'duration_seconds': (self.end_time - self.start_time).total_seconds() if self.start_time and self.end_time else None\n            }\n        }\n\n# Convenience functions\nasync def validate_sprint_11() -> Dict[str, Any]:\n    \"\"\"Run Sprint 1.1 validation.\"\"\"\n    validator = Sprint11Validator()\n    return await validator.run_sprint_11_validation()\n\nasync def quick_sprint_11_check() -> Dict[str, Any]:\n    \"\"\"Quick check of Sprint 1.1 status.\"\"\"\n    try:\n        # Quick wiring check\n        wiring_result = await quick_wiring_check()\n        \n        # Basic component factory test\n        try:\n            factory = GovernanceComponentFactory()\n            await factory.initialize()\n            components = await factory.create_all_components()\n            \n            none_components = [name for name, comp in components.items() if comp is None]\n            real_components = [name for name, comp in components.items() if comp is not None]\n            \n            factory_status = 'working' if len(none_components) == 0 else 'broken'\n            \n        except Exception as e:\n            factory_status = 'error'\n            none_components = ['unknown']\n            real_components = []\n        \n        # Overall status\n        if (wiring_result.get('wiring_status') == 'working' and \n            factory_status == 'working' and \n            len(none_components) == 0):\n            overall_status = 'ready_for_sprint_12'\n        elif wiring_result.get('wiring_status') == 'working':\n            overall_status = 'mostly_ready'\n        else:\n            overall_status = 'not_ready'\n        \n        return {\n            'sprint_11_status': overall_status,\n            'wiring_check': wiring_result,\n            'factory_status': factory_status,\n            'none_components': none_components,\n            'real_components': real_components,\n            'timestamp': datetime.now().isoformat()\n        }\n        \n    except Exception as e:\n        return {\n            'sprint_11_status': 'error',\n            'error': str(e),\n            'timestamp': datetime.now().isoformat()\n        }\n\nif __name__ == \"__main__\":\n    async def main():\n        print(\"🚀 Sprint 1.1 Validation Starting...\")\n        \n        # Quick check first\n        print(\"\\n🔍 Quick Sprint 1.1 Check:\")\n        quick_result = await quick_sprint_11_check()\n        print(json.dumps(quick_result, indent=2))\n        \n        # Full validation if quick check passes\n        if quick_result.get('sprint_11_status') in ['ready_for_sprint_12', 'mostly_ready']:\n            print(\"\\n🧪 Running Full Sprint 1.1 Validation...\")\n            full_result = await validate_sprint_11()\n            \n            print(\"\\n📊 Sprint 1.1 Validation Results:\")\n            print(json.dumps(full_result['sprint_11_status'], indent=2))\n            \n            print(\"\\n📋 Next Steps:\")\n            for step in full_result['next_steps']:\n                print(f\"  {step}\")\n            \n            # Save full results\n            with open('sprint_11_validation_results.json', 'w') as f:\n                json.dump(full_result, f, indent=2)\n            \n            print(\"\\n💾 Full results saved to sprint_11_validation_results.json\")\n            \n        else:\n            print(\"\\n❌ Quick check failed - skipping full validation\")\n            print(\"🔧 Fix basic wiring issues before running full validation\")\n    \n    asyncio.run(main())"

