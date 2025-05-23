"""
Integration tests for the Formal Verification Framework.

This module provides tests to validate the integration of all verification components,
ensuring they work together correctly to provide formal verification capabilities.
"""

import unittest
import json
import os
import tempfile
import time
from typing import Dict, List, Any

from src.core.verification.verification_manager import VerificationManager
from src.core.verification.consensus_verifier import ConsensusVerifier
from src.core.verification.trust_verifier import TrustVerifier
from src.core.verification.governance_verifier import GovernanceVerifier
from src.core.verification.crypto_verifier import CryptoVerifier
from src.core.verification.system_verifier import SystemVerifier

class TestFormalVerificationIntegration(unittest.TestCase):
    """Integration tests for the Formal Verification Framework."""
    
    def setUp(self):
        """Set up test environment."""
        # Create a temporary directory for test files
        self.test_dir = tempfile.mkdtemp()
        
        # Create subdirectories
        self.verification_log_directory = os.path.join(self.test_dir, 'logs')
        self.verification_result_directory = os.path.join(self.test_dir, 'results')
        
        os.makedirs(self.verification_log_directory, exist_ok=True)
        os.makedirs(self.verification_result_directory, exist_ok=True)
        
        # Create a temporary config file
        self.config_file = os.path.join(self.test_dir, 'verification_config.json')
        config = {
            'verification_domains': ['consensus', 'trust', 'governance', 'crypto', 'system'],
            'verification_timeout': 300,
            'max_verification_retries': 3,
            'verification_log_directory': self.verification_log_directory,
            'verification_result_directory': self.verification_result_directory
        }
        
        with open(self.config_file, 'w') as f:
            json.dump(config, f)
        
        # Initialize verification manager
        self.verification_manager = VerificationManager(self.config_file)
    
    def tearDown(self):
        """Clean up after tests."""
        # Remove test directory and all contents
        for root, dirs, files in os.walk(self.test_dir, topdown=False):
            for name in files:
                os.remove(os.path.join(root, name))
            for name in dirs:
                os.rmdir(os.path.join(root, name))
        os.rmdir(self.test_dir)
    
    def test_verification_manager_initialization(self):
        """Test verification manager initialization."""
        # Check that verification manager was initialized
        self.assertIsNotNone(self.verification_manager)
        
        # Check that verifier registry was initialized
        self.assertIsNotNone(self.verification_manager.verifier_registry)
        
        # Check that property registry was initialized
        self.assertIsNotNone(self.verification_manager.property_registry)
        
        # Check that verification history was initialized
        self.assertIsNotNone(self.verification_manager.verification_history)
        
        # Check that active verifications was initialized
        self.assertIsNotNone(self.verification_manager.active_verifications)
    
    def test_property_registration_and_retrieval(self):
        """Test property registration and retrieval."""
        # Register a new property
        property_data = {
            'id': 'test_property',
            'name': 'Test Property',
            'description': 'A test property',
            'domain': 'consensus',
            'status': 'active'
        }
        
        result = self.verification_manager.register_property(property_data)
        self.assertTrue(result)
        
        # Get the property
        property_data = self.verification_manager.get_property('test_property')
        self.assertIsNotNone(property_data)
        self.assertEqual(property_data['id'], 'test_property')
        
        # List properties
        properties = self.verification_manager.list_properties('consensus')
        self.assertGreaterEqual(len(properties), 1)
        
        # Update property status
        result = self.verification_manager.update_property_status('test_property', 'inactive')
        self.assertTrue(result)
        
        # Get the property again
        property_data = self.verification_manager.get_property('test_property')
        self.assertEqual(property_data['status'], 'inactive')
    
    def test_consensus_verification(self):
        """Test consensus verification."""
        # Create test context
        context = {
            'consensus_params': {
                'quorum_size': 7,
                'node_count': 10,
                'validation_rules': ['rule1', 'rule2'],
                'crypto_verification': True,
                'timeout': 30,
                'leader_election': True,
                'fault_tolerance': 3,
                'byzantine_detection': True
            }
        }
        
        # Verify consensus safety property
        result = self.verification_manager.verify_property('consensus_safety', context)
        self.assertTrue(result['success'])
        
        # Verify consensus liveness property
        result = self.verification_manager.verify_property('consensus_liveness', context)
        self.assertTrue(result['success'])
        
        # Verify byzantine fault tolerance property
        result = self.verification_manager.verify_property('byzantine_fault_tolerance', context)
        self.assertTrue(result['success'])
    
    def test_trust_verification(self):
        """Test trust verification."""
        # Create test context
        context = {
            'trust_params': {
                'boundaries': ['boundary1', 'boundary2'],
                'enforcement_mechanisms': ['mechanism1', 'mechanism2'],
                'isolation_level': 3,
                'calculation_methods': ['method1', 'method2'],
                'aggregation_methods': ['method1', 'method2'],
                'application_rules': ['rule1', 'rule2'],
                'decay_function': 'exponential',
                'decay_triggers': ['trigger1', 'trigger2'],
                'min_trust': 0,
                'max_trust': 100
            }
        }
        
        # Verify trust boundary integrity property
        result = self.verification_manager.verify_property('trust_boundary_integrity', context)
        self.assertTrue(result['success'])
        
        # Verify trust metric consistency property
        result = self.verification_manager.verify_property('trust_metric_consistency', context)
        self.assertTrue(result['success'])
        
        # Verify trust decay correctness property
        result = self.verification_manager.verify_property('trust_decay_correctness', context)
        self.assertTrue(result['success'])
    
    def test_governance_verification(self):
        """Test governance verification."""
        # Create test context
        context = {
            'governance_params': {
                'policies': ['policy1', 'policy2'],
                'application_rules': ['rule1', 'rule2'],
                'conflict_resolution_rules': ['rule1', 'rule2'],
                'expansion_validation_rules': ['rule1', 'rule2'],
                'expansion_authorization_rules': ['rule1', 'rule2'],
                'expansion_rollback_mechanisms': ['mechanism1', 'mechanism2'],
                'attestation_signature_verification': True,
                'attestation_freshness_verification': True,
                'attestation_chain_verification': True
            }
        }
        
        # Verify governance policy consistency property
        result = self.verification_manager.verify_property('governance_policy_consistency', context)
        self.assertTrue(result['success'])
        
        # Verify governance expansion safety property
        result = self.verification_manager.verify_property('governance_expansion_safety', context)
        self.assertTrue(result['success'])
        
        # Verify governance attestation validity property
        result = self.verification_manager.verify_property('governance_attestation_validity', context)
        self.assertTrue(result['success'])
    
    def test_crypto_verification(self):
        """Test crypto verification."""
        # Create test context
        context = {
            'crypto_params': {
                'implementation_verification': True,
                'min_strength': {
                    'hash': 256,
                    'symmetric': 256,
                    'asymmetric': 2048,
                    'signature': 256
                },
                'compliance_requirements': ['requirement1', 'requirement2'],
                'key_generation_requirements': {
                    'entropy_source': 'hardware'
                },
                'key_storage_requirements': {
                    'encryption_required': True
                },
                'key_rotation_requirements': {
                    'max_key_age': {
                        'symmetric': 90,
                        'asymmetric': 365
                    }
                },
                'protocol_design_requirements': {
                    'formal_verification_required': True
                },
                'protocol_implementation_requirements': {
                    'testing_required': True
                },
                'protocol_composition_requirements': {
                    'composition_analysis_required': True
                }
            }
        }
        
        # Verify crypto algorithm correctness property
        result = self.verification_manager.verify_property('crypto_algorithm_correctness', context)
        self.assertTrue(result['success'])
        
        # Verify crypto key management security property
        result = self.verification_manager.verify_property('crypto_key_management_security', context)
        self.assertTrue(result['success'])
        
        # Verify crypto protocol security property
        result = self.verification_manager.verify_property('crypto_protocol_security', context)
        self.assertTrue(result['success'])
    
    def test_system_verification(self):
        """Test system verification."""
        # Create test context
        context = {
            'system_params': {
                'memory_limits': {'max': 1024},
                'memory_monitoring': True,
                'cpu_limits': {'max': 80},
                'cpu_monitoring': True,
                'storage_limits': {'max': 10240},
                'storage_monitoring': True,
                'error_detection_mechanisms': ['mechanism1', 'mechanism2'],
                'error_recovery_mechanisms': ['mechanism1', 'mechanism2'],
                'error_reporting_mechanisms': ['mechanism1', 'mechanism2'],
                'race_condition_prevention_mechanisms': ['mechanism1', 'mechanism2'],
                'deadlock_prevention_mechanisms': ['mechanism1', 'mechanism2'],
                'livelock_prevention_mechanisms': ['mechanism1', 'mechanism2']
            }
        }
        
        # Verify system resource bounds property
        result = self.verification_manager.verify_property('system_resource_bounds', context)
        self.assertTrue(result['success'])
        
        # Verify system error handling property
        result = self.verification_manager.verify_property('system_error_handling', context)
        self.assertTrue(result['success'])
        
        # Verify system concurrency safety property
        result = self.verification_manager.verify_property('system_concurrency_safety', context)
        self.assertTrue(result['success'])
    
    def test_domain_verification(self):
        """Test domain verification."""
        # Create test context
        context = {
            'consensus_params': {
                'quorum_size': 7,
                'node_count': 10,
                'validation_rules': ['rule1', 'rule2'],
                'crypto_verification': True,
                'timeout': 30,
                'leader_election': True,
                'fault_tolerance': 3,
                'byzantine_detection': True
            }
        }
        
        # Verify consensus domain
        result = self.verification_manager.verify_domain('consensus', context)
        self.assertTrue(result['success'])
    
    def test_all_verification(self):
        """Test verification of all domains."""
        # Create test context
        context = {
            'consensus_params': {
                'quorum_size': 7,
                'node_count': 10,
                'validation_rules': ['rule1', 'rule2'],
                'crypto_verification': True,
                'timeout': 30,
                'leader_election': True,
                'fault_tolerance': 3,
                'byzantine_detection': True
            },
            'trust_params': {
                'boundaries': ['boundary1', 'boundary2'],
                'enforcement_mechanisms': ['mechanism1', 'mechanism2'],
                'isolation_level': 3,
                'calculation_methods': ['method1', 'method2'],
                'aggregation_methods': ['method1', 'method2'],
                'application_rules': ['rule1', 'rule2'],
                'decay_function': 'exponential',
                'decay_triggers': ['trigger1', 'trigger2'],
                'min_trust': 0,
                'max_trust': 100
            },
            'governance_params': {
                'policies': ['policy1', 'policy2'],
                'application_rules': ['rule1', 'rule2'],
                'conflict_resolution_rules': ['rule1', 'rule2'],
                'expansion_validation_rules': ['rule1', 'rule2'],
                'expansion_authorization_rules': ['rule1', 'rule2'],
                'expansion_rollback_mechanisms': ['mechanism1', 'mechanism2'],
                'attestation_signature_verification': True,
                'attestation_freshness_verification': True,
                'attestation_chain_verification': True
            },
            'crypto_params': {
                'implementation_verification': True,
                'min_strength': {
                    'hash': 256,
                    'symmetric': 256,
                    'asymmetric': 2048,
                    'signature': 256
                },
                'compliance_requirements': ['requirement1', 'requirement2'],
                'key_generation_requirements': {
                    'entropy_source': 'hardware'
                },
                'key_storage_requirements': {
                    'encryption_required': True
                },
                'key_rotation_requirements': {
                    'max_key_age': {
                        'symmetric': 90,
                        'asymmetric': 365
                    }
                },
                'protocol_design_requirements': {
                    'formal_verification_required': True
                },
                'protocol_implementation_requirements': {
                    'testing_required': True
                },
                'protocol_composition_requirements': {
                    'composition_analysis_required': True
                }
            },
            'system_params': {
                'memory_limits': {'max': 1024},
                'memory_monitoring': True,
                'cpu_limits': {'max': 80},
                'cpu_monitoring': True,
                'storage_limits': {'max': 10240},
                'storage_monitoring': True,
                'error_detection_mechanisms': ['mechanism1', 'mechanism2'],
                'error_recovery_mechanisms': ['mechanism1', 'mechanism2'],
                'error_reporting_mechanisms': ['mechanism1', 'mechanism2'],
                'race_condition_prevention_mechanisms': ['mechanism1', 'mechanism2'],
                'deadlock_prevention_mechanisms': ['mechanism1', 'mechanism2'],
                'livelock_prevention_mechanisms': ['mechanism1', 'mechanism2']
            }
        }
        
        # Verify all domains
        result = self.verification_manager.verify_all(context)
        self.assertTrue(result['success'])
    
    def test_verification_history(self):
        """Test verification history."""
        # Create test context
        context = {
            'consensus_params': {
                'quorum_size': 7,
                'node_count': 10,
                'validation_rules': ['rule1', 'rule2'],
                'crypto_verification': True,
                'timeout': 30,
                'leader_election': True,
                'fault_tolerance': 3,
                'byzantine_detection': True
            }
        }
        
        # Verify a property
        self.verification_manager.verify_property('consensus_safety', context)
        
        # Get verification history
        history = self.verification_manager.get_verification_history()
        self.assertGreaterEqual(len(history), 1)
        
        # Get verification history for a specific property
        history = self.verification_manager.get_verification_history('consensus_safety')
        self.assertGreaterEqual(len(history), 1)
        
        # Get verification history for a specific domain
        history = self.verification_manager.get_verification_history(domain='consensus')
        self.assertGreaterEqual(len(history), 1)
    
    def test_verification_report(self):
        """Test verification report generation."""
        # Create test context
        context = {
            'consensus_params': {
                'quorum_size': 7,
                'node_count': 10,
                'validation_rules': ['rule1', 'rule2'],
                'crypto_verification': True,
                'timeout': 30,
                'leader_election': True,
                'fault_tolerance': 3,
                'byzantine_detection': True
            }
        }
        
        # Verify a property
        self.verification_manager.verify_property('consensus_safety', context)
        
        # Generate verification report
        report_file = os.path.join(self.test_dir, 'verification_report.json')
        result = self.verification_manager.generate_verification_report(report_file)
        self.assertTrue(result)
        self.assertTrue(os.path.exists(report_file))
        
        # Generate verification report for a specific property
        report_file = os.path.join(self.test_dir, 'property_report.json')
        result = self.verification_manager.generate_verification_report(report_file, 'consensus_safety')
        self.assertTrue(result)
        self.assertTrue(os.path.exists(report_file))
        
        # Generate verification report for a specific domain
        report_file = os.path.join(self.test_dir, 'domain_report.json')
        result = self.verification_manager.generate_verification_report(report_file, domain='consensus')
        self.assertTrue(result)
        self.assertTrue(os.path.exists(report_file))

if __name__ == '__main__':
    unittest.main()
