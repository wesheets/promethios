"""
Integration tests for Cross-System Governance Interoperability.

This module provides tests to validate the integration of all interoperability components,
ensuring they work together correctly to provide cross-system governance interoperability.
"""

import unittest
import json
import os
import tempfile
import time
from typing import Dict, List, Any
from unittest.mock import patch, MagicMock

from src.core.interop.interoperability_manager import InteroperabilityManager
from src.core.interop.connectors.promethios_native_connector import PromethiosNativeConnector
from src.core.interop.connectors.governance_exchange_connector import GovernanceExchangeConnector
from src.core.interop.connectors.open_governance_connector import OpenGovernanceConnector
from src.core.interop.connectors.enterprise_governance_connector import EnterpriseGovernanceConnector

class TestCrossSystemGovernanceInteroperability(unittest.TestCase):
    """Integration tests for Cross-System Governance Interoperability."""
    
    def setUp(self):
        """Set up test environment."""
        # Create a temporary directory for test files
        self.test_dir = tempfile.mkdtemp()
        
        # Create subdirectories
        self.transaction_log_directory = os.path.join(self.test_dir, 'logs')
        self.system_registry_directory = os.path.join(self.test_dir, 'registry')
        
        os.makedirs(self.transaction_log_directory, exist_ok=True)
        os.makedirs(self.system_registry_directory, exist_ok=True)
        
        # Create a temporary config file
        self.config_file = os.path.join(self.test_dir, 'interop_config.json')
        config = {
            'supported_protocols': [
                'promethios-native',
                'governance-exchange-protocol',
                'open-governance-protocol',
                'enterprise-governance-bridge'
            ],
            'trust_threshold': 0.7,
            'max_transaction_timeout': 300,
            'transaction_log_directory': self.transaction_log_directory,
            'system_registry_path': os.path.join(self.system_registry_directory, 'systems.json'),
            'min_promethios_version': '1.0.0',
            'min_protocol_version': '1.0',
            'max_attestation_age': 3600,
            'system_id': 'test_promethios',
            'enterprise_auth_token': 'test_auth_token'
        }
        
        with open(self.config_file, 'w') as f:
            json.dump(config, f)
        
        # Initialize interoperability manager
        self.interop_manager = InteroperabilityManager(self.config_file)
    
    def tearDown(self):
        """Clean up after tests."""
        # Remove test directory and all contents
        for root, dirs, files in os.walk(self.test_dir, topdown=False):
            for name in files:
                os.remove(os.path.join(root, name))
            for name in dirs:
                os.rmdir(os.path.join(root, name))
        os.rmdir(self.test_dir)
    
    def test_interoperability_manager_initialization(self):
        """Test interoperability manager initialization."""
        # Check that interoperability manager was initialized
        self.assertIsNotNone(self.interop_manager)
        
        # Check that connector registry was initialized
        self.assertIsNotNone(self.interop_manager.connector_registry)
        
        # Check that protocol registry was initialized
        self.assertIsNotNone(self.interop_manager.protocol_registry)
        
        # Check that system registry was initialized
        self.assertIsNotNone(self.interop_manager.system_registry)
        
        # Check that transaction history was initialized
        self.assertIsNotNone(self.interop_manager.transaction_history)
        
        # Check that active transactions was initialized
        self.assertIsNotNone(self.interop_manager.active_transactions)
    
    def test_system_registration_and_retrieval(self):
        """Test system registration and retrieval."""
        # Register a new system
        system_data = {
            'name': 'Test System',
            'protocol': 'promethios-native',
            'endpoint': 'https://test-system.example.com',
            'public_key': 'test_public_key'
        }
        
        system_id = self.interop_manager.register_external_system(system_data)
        self.assertNotEqual(system_id, "")
        
        # Get the system
        system_data = self.interop_manager.get_external_system(system_id)
        self.assertIsNotNone(system_data)
        self.assertEqual(system_data['id'], system_id)
        
        # List systems
        systems = self.interop_manager.list_external_systems()
        self.assertEqual(len(systems), 1)
        
        # Update system status
        result = self.interop_manager.update_system_status(system_id, 'verified')
        self.assertTrue(result)
        
        # Get the system again
        system_data = self.interop_manager.get_external_system(system_id)
        self.assertEqual(system_data['status'], 'verified')
        
        # Update system trust score
        result = self.interop_manager.update_system_trust_score(system_id, 0.8)
        self.assertTrue(result)
        
        # Get the system again
        system_data = self.interop_manager.get_external_system(system_id)
        self.assertEqual(system_data['trust_score'], 0.8)
    
    def test_promethios_native_protocol(self):
        """Test Promethios Native Protocol."""
        # Register a new system
        system_data = {
            'name': 'Promethios Native System',
            'protocol': 'promethios-native',
            'endpoint': 'https://promethios-native.example.com',
            'public_key': 'test_public_key'
        }
        
        system_id = self.interop_manager.register_external_system(system_data)
        
        # Verify system
        with patch.object(PromethiosNativeConnector, '_send_request') as mock_send_request:
            mock_send_request.return_value = {
                'success': True,
                'signature': 'simulated_signature',
                'data': {
                    'challenge': 'test_challenge',
                    'version': '1.0.0',
                    'capabilities': [
                        'governance_query',
                        'governance_attestation',
                        'governance_verification',
                        'governance_expansion',
                        'governance_delegation'
                    ]
                }
            }
            
            result = self.interop_manager.verify_external_system(system_id)
            self.assertTrue(result['success'])
        
        # Query governance state
        with patch.object(PromethiosNativeConnector, '_send_request') as mock_send_request:
            mock_send_request.return_value = {
                'success': True,
                'signature': 'simulated_signature',
                'data': {
                    'result': {
                        'governance_state': {
                            'policies': ['policy1', 'policy2'],
                            'attestations': ['attestation1', 'attestation2'],
                            'expansions': ['expansion1', 'expansion2'],
                            'delegations': ['delegation1', 'delegation2']
                        }
                    }
                }
            }
            
            result = self.interop_manager.query_governance_state(system_id, {})
            self.assertTrue(result['success'])
            self.assertIn('result', result)
        
        # Request governance attestation
        with patch.object(PromethiosNativeConnector, '_send_request') as mock_send_request:
            mock_send_request.return_value = {
                'success': True,
                'signature': 'simulated_signature',
                'data': {
                    'attestation': {
                        'id': 'test_attestation_id',
                        'type': 'governance',
                        'content': 'attestation_content',
                        'timestamp': time.time()
                    },
                    'attestation_signature': 'simulated_attestation_signature'
                }
            }
            
            result = self.interop_manager.request_governance_attestation(system_id, {})
            self.assertTrue(result['success'])
            self.assertIn('attestation', result)
            self.assertIn('signature', result)
        
        # Verify governance attestation
        with patch.object(PromethiosNativeConnector, '_verify_signature') as mock_verify_signature:
            mock_verify_signature.return_value = True
            
            attestation_data = {
                'system_id': system_id,
                'attestation': {
                    'id': 'test_attestation_id',
                    'type': 'governance',
                    'content': 'attestation_content',
                    'timestamp': time.time()
                },
                'signature': 'simulated_attestation_signature'
            }
            
            result = self.interop_manager.verify_governance_attestation(attestation_data)
            self.assertTrue(result['success'])
    
    def test_governance_exchange_protocol(self):
        """Test Governance Exchange Protocol."""
        # Register a new system
        system_data = {
            'name': 'Governance Exchange System',
            'protocol': 'governance-exchange-protocol',
            'endpoint': 'https://governance-exchange.example.com',
            'public_key': 'test_public_key'
        }
        
        system_id = self.interop_manager.register_external_system(system_data)
        
        # Verify system
        with patch.object(GovernanceExchangeConnector, '_send_request') as mock_send_request:
            mock_send_request.return_value = {
                'success': True,
                'signature': 'simulated_signature',
                'data': {
                    'nonce': 'test_nonce',
                    'protocol_version': '1.0',
                    'system_version': '2.1.0',
                    'system_id': 'external_system',
                    'operations': [
                        'governance_query',
                        'governance_attestation',
                        'governance_verification'
                    ]
                }
            }
            
            result = self.interop_manager.verify_external_system(system_id)
            self.assertTrue(result['success'])
        
        # Update system status to verified
        self.interop_manager.update_system_status(system_id, 'verified')
        
        # Update system trust score
        self.interop_manager.update_system_trust_score(system_id, 0.8)
        
        # Query governance state
        with patch.object(GovernanceExchangeConnector, '_send_request') as mock_send_request:
            mock_send_request.return_value = {
                'success': True,
                'signature': 'simulated_signature',
                'data': {
                    'request_id': 'test_request_id',
                    'result': {
                        'governance_state': {
                            'policies': [
                                {
                                    'id': 'policy1',
                                    'name': 'Data Access Policy',
                                    'version': '1.0',
                                    'status': 'active'
                                },
                                {
                                    'id': 'policy2',
                                    'name': 'Authentication Policy',
                                    'version': '1.1',
                                    'status': 'active'
                                }
                            ],
                            'attestations': [
                                {
                                    'id': 'attestation1',
                                    'type': 'policy_compliance',
                                    'policy_id': 'policy1',
                                    'timestamp': time.time() - 3600
                                },
                                {
                                    'id': 'attestation2',
                                    'type': 'policy_compliance',
                                    'policy_id': 'policy2',
                                    'timestamp': time.time() - 1800
                                }
                            ]
                        }
                    }
                }
            }
            
            result = self.interop_manager.query_governance_state(system_id, {})
            self.assertTrue(result['success'])
            self.assertIn('result', result)
        
        # Request governance attestation
        with patch.object(GovernanceExchangeConnector, '_send_request') as mock_send_request:
            mock_send_request.return_value = {
                'success': True,
                'signature': 'simulated_signature',
                'data': {
                    'request_id': 'test_request_id',
                    'attestation': {
                        'id': 'test_attestation_id',
                        'type': 'governance_state',
                        'content': {
                            'governance_state': {
                                'policies': [
                                    {
                                        'id': 'policy1',
                                        'name': 'Data Access Policy',
                                        'version': '1.0',
                                        'status': 'active'
                                    },
                                    {
                                        'id': 'policy2',
                                        'name': 'Authentication Policy',
                                        'version': '1.1',
                                        'status': 'active'
                                    }
                                ]
                            }
                        },
                        'timestamp': time.time(),
                        'issuer': 'external_system'
                    },
                    'attestation_signature': 'simulated_attestation_signature'
                }
            }
            
            result = self.interop_manager.request_governance_attestation(system_id, {})
            self.assertTrue(result['success'])
            self.assertIn('attestation', result)
            self.assertIn('signature', result)
    
    def test_open_governance_protocol(self):
        """Test Open Governance Protocol."""
        # Register a new system
        system_data = {
            'name': 'Open Governance System',
            'protocol': 'open-governance-protocol',
            'endpoint': 'https://open-governance.example.com',
            'public_key': 'test_public_key'
        }
        
        system_id = self.interop_manager.register_external_system(system_data)
        
        # Verify system
        with patch.object(OpenGovernanceConnector, '_send_request') as mock_send_request:
            mock_send_request.return_value = {
                'success': True,
                'signature': 'simulated_signature',
                'data': {
                    'token': 'test_token',
                    'protocol_version': '1.0',
                    'system_version': '3.0.1',
                    'system_id': 'open_governance_system',
                    'features': [
                        'governance_query',
                        'governance_attestation'
                    ]
                }
            }
            
            result = self.interop_manager.verify_external_system(system_id)
            self.assertTrue(result['success'])
        
        # Update system status to verified
        self.interop_manager.update_system_status(system_id, 'verified')
        
        # Update system trust score
        self.interop_manager.update_system_trust_score(system_id, 0.8)
        
        # Query governance state
        with patch.object(OpenGovernanceConnector, '_send_request') as mock_send_request:
            mock_send_request.return_value = {
                'success': True,
                'signature': 'simulated_signature',
                'data': {
                    'request_id': 'test_request_id',
                    'result': {
                        'governance_state': {
                            'policies': [
                                {
                                    'id': 'policy1',
                                    'name': 'Open Data Policy',
                                    'version': '1.0',
                                    'status': 'active'
                                },
                                {
                                    'id': 'policy2',
                                    'name': 'Open Access Policy',
                                    'version': '1.2',
                                    'status': 'active'
                                }
                            ],
                            'attestations': [
                                {
                                    'id': 'attestation1',
                                    'type': 'policy_compliance',
                                    'policy_id': 'policy1',
                                    'timestamp': time.time() - 3600
                                },
                                {
                                    'id': 'attestation2',
                                    'type': 'policy_compliance',
                                    'policy_id': 'policy2',
                                    'timestamp': time.time() - 1800
                                }
                            ]
                        }
                    }
                }
            }
            
            result = self.interop_manager.query_governance_state(system_id, {})
            self.assertTrue(result['success'])
            self.assertIn('result', result)
        
        # Request governance attestation
        with patch.object(OpenGovernanceConnector, '_send_request') as mock_send_request:
            mock_send_request.return_value = {
                'success': True,
                'signature': 'simulated_signature',
                'data': {
                    'request_id': 'test_request_id',
                    'attestation': {
                        'id': 'test_attestation_id',
                        'type': 'governance_state',
                        'content': {
                            'governance_state': {
                                'policies': [
                                    {
                                        'id': 'policy1',
                                        'name': 'Open Data Policy',
                                        'version': '1.0',
                                        'status': 'active'
                                    },
                                    {
                                        'id': 'policy2',
                                        'name': 'Open Access Policy',
                                        'version': '1.2',
                                        'status': 'active'
                                    }
                                ]
                            }
                        },
                        'timestamp': time.time(),
                        'issuer': 'open_governance_system'
                    },
                    'attestation_signature': 'simulated_attestation_signature'
                }
            }
            
            result = self.interop_manager.request_governance_attestation(system_id, {})
            self.assertTrue(result['success'])
            self.assertIn('attestation', result)
            self.assertIn('signature', result)
    
    def test_enterprise_governance_bridge(self):
        """Test Enterprise Governance Bridge Protocol."""
        # Register a new system
        system_data = {
            'name': 'Enterprise Governance System',
            'protocol': 'enterprise-governance-bridge',
            'endpoint': 'https://enterprise-governance.example.com',
            'public_key': 'test_public_key'
        }
        
        system_id = self.interop_manager.register_external_system(system_data)
        
        # Verify system
        with patch.object(EnterpriseGovernanceConnector, '_send_request') as mock_send_request:
            mock_send_request.return_value = {
                'success': True,
                'signature': 'simulated_signature',
                'data': {
                    'challenge': 'test_challenge',
                    'protocol_version': '1.0',
                    'system_version': '4.2.1',
                    'system_id': 'enterprise_governance_system',
                    'capabilities': [
                        'governance_query',
                        'governance_attestation',
                        'governance_verification',
                        'governance_delegation'
                    ],
                    'compliance_frameworks': [
                        'SOC2',
                        'ISO27001',
                        'GDPR',
                        'HIPAA'
                    ]
                }
            }
            
            result = self.interop_manager.verify_external_system(system_id)
            self.assertTrue(result['success'])
        
        # Update system status to verified
        self.interop_manager.update_system_status(system_id, 'verified')
        
        # Update system trust score
        self.interop_manager.update_system_trust_score(system_id, 0.8)
        
        # Query governance state
        with patch.object(EnterpriseGovernanceConnector, '_send_request') as mock_send_request:
            mock_send_request.return_value = {
                'success': True,
                'signature': 'simulated_signature',
                'data': {
                    'request_id': 'test_request_id',
                    'result': {
                        'governance_state': {
                            'policies': [
                                {
                                    'id': 'policy1',
                                    'name': 'Enterprise Data Protection Policy',
                                    'version': '2.0',
                                    'status': 'active',
                                    'compliance_frameworks': ['SOC2', 'ISO27001', 'GDPR']
                                },
                                {
                                    'id': 'policy2',
                                    'name': 'Enterprise Access Control Policy',
                                    'version': '1.5',
                                    'status': 'active',
                                    'compliance_frameworks': ['SOC2', 'ISO27001']
                                }
                            ],
                            'attestations': [
                                {
                                    'id': 'attestation1',
                                    'type': 'policy_compliance',
                                    'policy_id': 'policy1',
                                    'timestamp': time.time() - 3600,
                                    'compliance_frameworks': ['SOC2', 'ISO27001', 'GDPR']
                                },
                                {
                                    'id': 'attestation2',
                                    'type': 'policy_compliance',
                                    'policy_id': 'policy2',
                                    'timestamp': time.time() - 1800,
                                    'compliance_frameworks': ['SOC2', 'ISO27001']
                                }
                            ]
                        }
                    }
                }
            }
            
            result = self.interop_manager.query_governance_state(system_id, {})
            self.assertTrue(result['success'])
            self.assertIn('result', result)
        
        # Request governance attestation
        with patch.object(EnterpriseGovernanceConnector, '_send_request') as mock_send_request:
            mock_send_request.return_value = {
                'success': True,
                'signature': 'simulated_signature',
                'data': {
                    'request_id': 'test_request_id',
                    'attestation': {
                        'id': 'test_attestation_id',
                        'type': 'governance_state',
                        'content': {
                            'governance_state': {
                                'policies': [
                                    {
                                        'id': 'policy1',
                                        'name': 'Enterprise Data Protection Policy',
                                        'version': '2.0',
                                        'status': 'active'
                                    },
                                    {
                                        'id': 'policy2',
                                        'name': 'Enterprise Access Control Policy',
                                        'version': '1.5',
                                        'status': 'active'
                                    }
                                ]
                            }
                        },
                        'timestamp': time.time(),
                        'issuer': 'enterprise_governance_system',
                        'compliance_framework': 'SOC2'
                    },
                    'attestation_signature': 'simulated_attestation_signature',
                    'compliance_metadata': {
                        'framework': 'SOC2',
                        'controls': ['CC1.1', 'CC1.2', 'CC5.1', 'CC5.2'],
                        'audit_date': time.time() - 86400 * 30,
                        'next_audit_date': time.time() + 86400 * 335
                    }
                }
            }
            
            result = self.interop_manager.request_governance_attestation(system_id, {})
            self.assertTrue(result['success'])
            self.assertIn('attestation', result)
            self.assertIn('signature', result)
        
        # Delegate governance authority
        with patch.object(EnterpriseGovernanceConnector, '_send_request') as mock_send_request:
            mock_send_request.return_value = {
                'success': True,
                'signature': 'simulated_signature',
                'data': {
                    'request_id': 'test_request_id',
                    'delegation_id': 'test_delegation_id',
                    'status': 'accepted',
                    'compliance_metadata': {
                        'framework': 'SOC2',
                        'controls': ['CC1.3', 'CC2.1', 'CC2.2'],
                        'delegation_scope': 'limited',
                        'delegation_expiry': time.time() + 86400 * 90
                    }
                }
            }
            
            result = self.interop_manager.delegate_governance_authority(system_id, {})
            self.assertTrue(result['success'])
            self.assertIn('delegation_id', result)
            self.assertIn('status', result)
    
    def test_transaction_management(self):
        """Test transaction management."""
        # Register a new system
        system_data = {
            'name': 'Transaction Test System',
            'protocol': 'promethios-native',
            'endpoint': 'https://transaction-test.example.com',
            'public_key': 'test_public_key'
        }
        
        system_id = self.interop_manager.register_external_system(system_data)
        
        # Update system status to verified
        self.interop_manager.update_system_status(system_id, 'verified')
        
        # Update system trust score
        self.interop_manager.update_system_trust_score(system_id, 0.8)
        
        # Query governance state to create a transaction
        with patch.object(PromethiosNativeConnector, '_send_request') as mock_send_request:
            mock_send_request.return_value = {
                'success': True,
                'signature': 'simulated_signature',
                'data': {
                    'result': {
                        'governance_state': {
                            'policies': ['policy1', 'policy2'],
                            'attestations': ['attestation1', 'attestation2']
                        }
                    }
                }
            }
            
            self.interop_manager.query_governance_state(system_id, {})
        
        # Get transaction history
        history = self.interop_manager.get_transaction_history()
        self.assertEqual(len(history), 1)
        
        # Get transaction history for a specific system
        history = self.interop_manager.get_transaction_history(system_id)
        self.assertEqual(len(history), 1)
        
        # Get transaction history for a specific type
        history = self.interop_manager.get_transaction_history(transaction_type='query')
        self.assertEqual(len(history), 1)
        
        # Generate transaction report
        report_file = os.path.join(self.test_dir, 'transaction_report.json')
        result = self.interop_manager.generate_transaction_report(report_file)
        self.assertTrue(result)
        self.assertTrue(os.path.exists(report_file))
    
    def test_error_handling(self):
        """Test error handling."""
        # Register a new system
        system_data = {
            'name': 'Error Test System',
            'protocol': 'promethios-native',
            'endpoint': 'https://error-test.example.com',
            'public_key': 'test_public_key'
        }
        
        system_id = self.interop_manager.register_external_system(system_data)
        
        # Update system status to verified
        self.interop_manager.update_system_status(system_id, 'verified')
        
        # Update system trust score
        self.interop_manager.update_system_trust_score(system_id, 0.8)
        
        # Test error in query governance state
        with patch.object(PromethiosNativeConnector, '_send_request') as mock_send_request:
            mock_send_request.return_value = {
                'success': False,
                'error': 'Test error'
            }
            
            result = self.interop_manager.query_governance_state(system_id, {})
            self.assertFalse(result['success'])
            self.assertEqual(result['error'], 'Test error')
        
        # Test exception in query governance state
        with patch.object(PromethiosNativeConnector, '_send_request') as mock_send_request:
            mock_send_request.side_effect = Exception('Test exception')
            
            result = self.interop_manager.query_governance_state(system_id, {})
            self.assertFalse(result['success'])
            self.assertEqual(result['error'], 'Test exception')
        
        # Get transaction history
        history = self.interop_manager.get_transaction_history(system_id)
        self.assertEqual(len(history), 2)
        
        # Check that all transactions have failed status
        for transaction_id, transaction_data in history.items():
            self.assertEqual(transaction_data['status'], 'failed')

if __name__ == '__main__':
    unittest.main()
