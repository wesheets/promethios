"""
Promethios Policy Integration Routes
Enhanced with ML-powered analytics, optimization, and real data integration
"""

import os
import sys
import json
import uuid
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional
from collections import defaultdict, Counter

from flask import Blueprint, request, jsonify
import numpy as np

# Add the parent directory to the path to import Promethios modules
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..', '..', '..', 'phase_6_3_new', 'src'))

try:
    from core.governance.policy_management_module import PolicyManagementModule
except ImportError as e:
    logging.error(f"Failed to import PolicyManagementModule: {e}")
    PolicyManagementModule = None

# Import agent data models
from src.models.agent_data import AgentMetrics, AgentViolation, AgentLog, AgentHeartbeat

# Import the new ML intelligence engine
from src.ml.policy_intelligence import policy_intelligence

# Try to import OpenAI for NL generation
try:
    import openai
    openai.api_key = os.getenv('OPENAI_API_KEY')
except ImportError:
    openai = None
    logging.warning("OpenAI not available for natural language policy generation")

# Create blueprint
promethios_policy_bp = Blueprint('promethios_policy', __name__)

class PrometheiosPolicyIntegration:
    """
    Enhanced integration with Promethios PolicyManagementModule
    Provides ML-powered analytics, optimization, and real data integration
    """
    
    def __init__(self):
        self.policy_manager = None
        self.ml_models = {}
        self.initialize_policy_manager()
        self.initialize_ml_models()
    
    def initialize_policy_manager(self):
        """Initialize the existing PolicyManagementModule"""
        try:
            if PolicyManagementModule is None:
                logging.error("PolicyManagementModule not available")
                return
            
            # Mock configuration for PolicyManagementModule
            config = {
                'storage_dir': '/home/ubuntu/promethios/data/policy_management',
                'schema_path': '/home/ubuntu/promethios/docs/schemas/policy.schema.json'
            }
            
            # Mock dependencies (in real implementation, these would be properly injected)
            class MockCodexLock:
                def verify_tether(self, contract_id, version):
                    return True
            
            class MockDecisionFramework:
                pass
            
            class MockAttestationService:
                pass
            
            class MockTrustMetricsCalculator:
                pass
            
            class MockRequirementValidation:
                pass
            
            self.policy_manager = PolicyManagementModule(
                config=config,
                codex_lock=MockCodexLock(),
                decision_framework=MockDecisionFramework(),
                attestation_service=MockAttestationService(),
                trust_metrics_calculator=MockTrustMetricsCalculator(),
                requirement_validation=MockRequirementValidation()
            )
            logging.info("PolicyManagementModule initialized successfully")
        except Exception as e:
            logging.error(f"Failed to initialize PolicyManagementModule: {e}")
            self.policy_manager = None
    
    def initialize_ml_models(self):
        """Initialize ML models for policy optimization"""
        # Use the global policy intelligence engine
        self.policy_intelligence = policy_intelligence
        logging.info("Policy Intelligence Engine initialized")
    
    def get_enhanced_policy_analytics(self, policy_id: str) -> Dict[str, Any]:
        """Get enhanced analytics using ML intelligence engine"""
        try:
            # Get policy data
            if not self.policy_manager:
                return self._get_default_analytics()
            
            policy = self.policy_manager.get_policy(policy_id)
            if not policy:
                return self._get_default_analytics()
            
            # Use ML intelligence engine for comprehensive analytics
            performance_data = self.policy_intelligence.get_policy_performance_data(policy_id)
            effectiveness_prediction = self.policy_intelligence.predict_policy_effectiveness(policy)
            
            # Combine real data with ML predictions
            analytics = {
                **performance_data,
                'ml_predictions': effectiveness_prediction,
                'policy_features': self.policy_intelligence.extract_policy_features(policy).tolist(),
                'last_updated': datetime.utcnow().isoformat()
            }
            
            return analytics
            
        except Exception as e:
            logging.error(f"Error getting enhanced policy analytics: {e}")
            return self._get_default_analytics()
    
    def get_policy_optimization_recommendations(self, policy_id: str, goals: List[str] = None) -> Dict[str, Any]:
        """Get ML-powered optimization recommendations"""
        try:
            if not self.policy_manager:
                return {'recommendations': [], 'predicted_improvement': 0.0}
            
            policy = self.policy_manager.get_policy(policy_id)
            if not policy:
                return {'recommendations': [], 'predicted_improvement': 0.0}
            
            # Use ML intelligence engine for optimization
            optimization_result = self.policy_intelligence.optimize_policy(policy, goals)
            
            return optimization_result
            
        except Exception as e:
            logging.error(f"Error getting optimization recommendations: {e}")
            return {'recommendations': [], 'predicted_improvement': 0.0}
    
    def detect_advanced_policy_conflicts(self, policies: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Detect conflicts using advanced ML analysis"""
        try:
            # Use ML intelligence engine for conflict detection
            conflicts = self.policy_intelligence.detect_policy_conflicts(policies)
            return conflicts
            
        except Exception as e:
            logging.error(f"Error detecting policy conflicts: {e}")
            return []
    
    def _get_default_analytics(self) -> Dict[str, Any]:
        """Return default analytics when real data is unavailable"""
        return {
            'total_evaluations': 0,
            'violation_count': 0,
            'compliance_rate': 1.0,
            'effectiveness_score': 0.5,
            'avg_trust_score': 75.0,
            'trust_score_std': 0.0,
            'avg_response_time': 100.0,
            'daily_trends': [],
            'violation_types': {},
            'violation_severities': {},
            'performance_grade': 'C',
            'ml_predictions': {
                'predicted_effectiveness': 0.5,
                'confidence': 0.5,
                'performance_grade': 'C',
                'top_contributing_factors': [],
                'recommendations': []
            }
        }

# Initialize the integration
policy_integration = PrometheiosPolicyIntegration()

@promethios_policy_bp.route('/policies', methods=['GET'])
def list_policies():
    """List policies using existing PolicyManagementModule"""
    try:
        if not policy_integration.policy_manager:
            return jsonify({'error': 'PolicyManagementModule not available'}), 500
        
        # Get filters from query parameters
        status = request.args.get('status')
        policy_type = request.args.get('policy_type')
        category = request.args.get('category')
        tags = request.args.getlist('tags')
        
        # Get policies from PolicyManagementModule
        policies = list(policy_integration.policy_manager.policies.values())
        
        # Apply filters
        if status:
            policies = [p for p in policies if p.get('status', '').upper() == status.upper()]
        if policy_type:
            policies = [p for p in policies if p.get('policy_type', '').upper() == policy_type.upper()]
        if category:
            policies = [p for p in policies if p.get('category', '').lower() == category.lower()]
        if tags:
            policies = [p for p in policies if any(tag in p.get('metadata', {}).get('tags', []) for tag in tags)]
        
        return jsonify(policies)
    except Exception as e:
        logging.error(f"Error listing policies: {e}")
        return jsonify({'error': str(e)}), 500

@promethios_policy_bp.route('/policies', methods=['POST'])
def create_policy():
    """Create a new policy using existing PolicyManagementModule"""
    try:
        if not policy_integration.policy_manager:
            return jsonify({'error': 'PolicyManagementModule not available'}), 500
        
        policy_data = request.get_json()
        
        # Validate required fields
        required_fields = ['name', 'policy_type', 'rules']
        for field in required_fields:
            if field not in policy_data:
                return jsonify({'error': f'Missing required field: {field}'}), 400
        
        # Generate policy ID if not provided
        if 'policy_id' not in policy_data:
            policy_data['policy_id'] = f"pol-{uuid.uuid4().hex[:8]}"
        
        # Set default values
        policy_data.setdefault('version', '1.0.0')
        policy_data.setdefault('status', 'draft')
        policy_data.setdefault('created_at', datetime.utcnow().isoformat())
        policy_data.setdefault('updated_at', datetime.utcnow().isoformat())
        policy_data.setdefault('created_by', 'api_user')
        
        # Create policy using PolicyManagementModule
        policy_id = policy_integration.policy_manager.create_policy(
            name=policy_data['name'],
            policy_type=policy_data['policy_type'],
            rules=policy_data['rules'],
            metadata=policy_data.get('metadata', {}),
            description=policy_data.get('description', ''),
            enforcement_level=policy_data.get('enforcement_level', 'MODERATE')
        )
        
        # Get the created policy
        created_policy = policy_integration.policy_manager.get_policy(policy_id)
        
        return jsonify(created_policy), 201
    except Exception as e:
        logging.error(f"Error creating policy: {e}")
        return jsonify({'error': str(e)}), 500

@promethios_policy_bp.route('/policies/<policy_id>', methods=['GET'])
def get_policy(policy_id):
    """Get a specific policy"""
    try:
        if not policy_integration.policy_manager:
            return jsonify({'error': 'PolicyManagementModule not available'}), 500
        
        policy = policy_integration.policy_manager.get_policy(policy_id)
        if not policy:
            return jsonify({'error': 'Policy not found'}), 404
        
        return jsonify(policy)
    except Exception as e:
        logging.error(f"Error getting policy: {e}")
        return jsonify({'error': str(e)}), 500

@promethios_policy_bp.route('/policies/<policy_id>', methods=['PUT'])
def update_policy(policy_id):
    """Update a policy"""
    try:
        if not policy_integration.policy_manager:
            return jsonify({'error': 'PolicyManagementModule not available'}), 500
        
        updates = request.get_json()
        updates['updated_at'] = datetime.utcnow().isoformat()
        
        # Update policy using PolicyManagementModule
        success = policy_integration.policy_manager.update_policy(policy_id, updates)
        if not success:
            return jsonify({'error': 'Failed to update policy'}), 500
        
        # Get updated policy
        updated_policy = policy_integration.policy_manager.get_policy(policy_id)
        return jsonify(updated_policy)
    except Exception as e:
        logging.error(f"Error updating policy: {e}")
        return jsonify({'error': str(e)}), 500

@promethios_policy_bp.route('/policies/<policy_id>', methods=['DELETE'])
def delete_policy(policy_id):
    """Delete a policy"""
    try:
        if not policy_integration.policy_manager:
            return jsonify({'error': 'PolicyManagementModule not available'}), 500
        
        success = policy_integration.policy_manager.delete_policy(policy_id)
        if not success:
            return jsonify({'error': 'Failed to delete policy'}), 500
        
        return jsonify({'message': 'Policy deleted successfully'})
    except Exception as e:
        logging.error(f"Error deleting policy: {e}")
        return jsonify({'error': str(e)}), 500

@promethios_policy_bp.route('/policies/<policy_id>/analytics', methods=['GET'])
def get_policy_analytics(policy_id):
    """Get enhanced analytics data for a specific policy using ML intelligence"""
    try:
        if not policy_integration.policy_manager:
            return jsonify({'error': 'PolicyManagementModule not available'}), 500
        
        # Get the policy to ensure it exists
        policy = policy_integration.policy_manager.get_policy(policy_id)
        if not policy:
            return jsonify({'error': 'Policy not found'}), 404
        
        # Get enhanced analytics using ML intelligence engine
        analytics = policy_integration.get_enhanced_policy_analytics(policy_id)
        
        return jsonify(analytics)
    except Exception as e:
        logging.error(f"Error getting policy analytics: {e}")
        return jsonify({'error': str(e)}), 500

@promethios_policy_bp.route('/policies/<policy_id>/optimize', methods=['POST'])
def optimize_policy(policy_id):
    """Get ML-powered optimization recommendations for a policy"""
    try:
        if not policy_integration.policy_manager:
            return jsonify({'error': 'PolicyManagementModule not available'}), 500
        
        options = request.get_json() or {}
        optimization_goals = options.get('optimization_goals', ['effectiveness', 'performance'])
        
        # Get the current policy
        current_policy = policy_integration.policy_manager.get_policy(policy_id)
        if not current_policy:
            return jsonify({'error': 'Policy not found'}), 404
        
        # Get ML-powered optimization recommendations
        optimization_result = policy_integration.get_policy_optimization_recommendations(policy_id, optimization_goals)
        
        return jsonify(optimization_result)
    except Exception as e:
        logging.error(f"Error optimizing policy: {e}")
        return jsonify({'error': str(e)}), 500

@promethios_policy_bp.route('/policies/<policy_id>/conflicts', methods=['GET'])
def detect_policy_conflicts(policy_id):
    """Detect conflicts in policy rules using advanced ML analysis"""
    try:
        if not policy_integration.policy_manager:
            return jsonify({'error': 'PolicyManagementModule not available'}), 500
        
        policy = policy_integration.policy_manager.get_policy(policy_id)
        if not policy:
            return jsonify({'error': 'Policy not found'}), 404
        
        # Get all policies for conflict analysis
        all_policies = list(policy_integration.policy_manager.policies.values())
        
        # Use advanced ML-powered conflict detection
        conflicts = policy_integration.detect_advanced_policy_conflicts(all_policies)
        
        # Filter conflicts related to the specific policy
        policy_conflicts = [
            conflict for conflict in conflicts
            if conflict.get('policy1_id') == policy_id or conflict.get('policy2_id') == policy_id
        ]
        
        return jsonify(policy_conflicts)
    except Exception as e:
        logging.error(f"Error detecting policy conflicts: {e}")
        return jsonify({'error': str(e)}), 500

# Add all the remaining endpoints from the original implementation
@promethios_policy_bp.route('/policies/test', methods=['POST'])
def test_policy():
    """Test a policy against sample scenarios"""
    try:
        request_data = request.get_json()
        policy = request_data.get('policy')
        test_scenarios = request_data.get('test_scenarios', [])
        
        if not policy or not test_scenarios:
            return jsonify({'error': 'Policy and test scenarios are required'}), 400
        
        results = []
        passed_count = 0
        
        for scenario in test_scenarios:
            input_text = scenario.get('input', '')
            expected_action = scenario.get('expected_action', '')
            
            # Simple rule evaluation logic
            actual_action = 'allow'  # Default action
            triggered_rules = []
            
            for rule in policy.get('rules', []):
                condition = rule.get('condition', '')
                action = rule.get('action', 'allow')
                
                # Simple condition evaluation
                if evaluate_simple_condition(condition, input_text):
                    actual_action = action
                    triggered_rules.append(rule.get('rule_id', 'unknown'))
                    break  # First matching rule wins
            
            passed = actual_action == expected_action
            if passed:
                passed_count += 1
            
            results.append({
                'scenario': input_text,
                'expected': expected_action,
                'actual': actual_action,
                'passed': passed,
                'triggered_rules': triggered_rules,
                'explanation': f"Rule evaluation resulted in action: {actual_action}"
            })
        
        return jsonify({
            'results': results,
            'overall_passed': passed_count == len(test_scenarios),
            'passed_count': passed_count,
            'total_count': len(test_scenarios),
            'success_rate': passed_count / len(test_scenarios) if test_scenarios else 0
        })
    except Exception as e:
        logging.error(f"Error testing policy: {e}")
        return jsonify({'error': str(e)}), 500

def evaluate_simple_condition(condition: str, input_text: str) -> bool:
    """Simple condition evaluation for testing"""
    try:
        condition_lower = condition.lower()
        input_lower = input_text.lower()
        
        if 'contains_pii' in condition_lower:
            pii_patterns = ['ssn', 'social security', 'credit card']
            return any(pattern in input_lower for pattern in pii_patterns)
        
        if 'trust_score' in condition_lower:
            import re
            match = re.search(r'trust_score\s*[<>]=?\s*(\d+)', condition_lower)
            if match:
                threshold = int(match.group(1))
                simulated_trust_score = len(input_text) % 100
                if '<' in condition_lower:
                    return simulated_trust_score < threshold
                elif '>' in condition_lower:
                    return simulated_trust_score > threshold
        
        if 'contains_malicious' in condition_lower:
            malicious_keywords = ['hack', 'attack', 'malware', 'virus']
            return any(keyword in input_lower for keyword in malicious_keywords)
        
        return 'true' in condition_lower
    except:
        return False

# Add remaining endpoints for completeness
@promethios_policy_bp.route('/templates', methods=['GET'])
def get_policy_templates():
    """Get available policy templates"""
    try:
        category = request.args.get('category')
        
        templates = [
            {
                'template_id': 'hipaa-compliance',
                'name': 'HIPAA Compliance Template',
                'description': 'Comprehensive HIPAA compliance policy for healthcare data',
                'category': 'COMPLIANCE',
                'compliance_standards': ['HIPAA', 'HITECH'],
                'template_policy': {
                    'name': 'HIPAA Compliance Policy',
                    'category': 'COMPLIANCE',
                    'description': 'Ensures HIPAA compliance for healthcare data processing',
                    'rules': [
                        {
                            'rule_id': 'hipaa-pii-protection',
                            'name': 'PHI Protection',
                            'condition': 'contains_phi == true',
                            'action': 'encrypt',
                            'description': 'Encrypt protected health information'
                        }
                    ]
                },
                'usage_count': 1247,
                'rating': 4.8
            },
            {
                'template_id': 'basic-security',
                'name': 'Basic Security Policy',
                'description': 'Essential security controls for AI systems',
                'category': 'SECURITY',
                'compliance_standards': [],
                'template_policy': {
                    'name': 'Basic Security Policy',
                    'category': 'SECURITY',
                    'description': 'Basic security controls for AI agent protection',
                    'rules': [
                        {
                            'rule_id': 'trust-threshold',
                            'name': 'Trust Score Threshold',
                            'condition': 'trust_score < 70',
                            'action': 'deny',
                            'description': 'Block responses with low trust scores'
                        }
                    ]
                },
                'usage_count': 2341,
                'rating': 4.4
            }
        ]
        
        if category:
            templates = [t for t in templates if t['category'] == category.upper()]
        
        return jsonify(templates)
    except Exception as e:
        logging.error(f"Error getting policy templates: {e}")
        return jsonify({'error': str(e)}), 500

@promethios_policy_bp.route('/policies/validate', methods=['POST'])
def validate_policy():
    """Validate a policy structure and rules"""
    try:
        request_data = request.get_json()
        policy = request_data.get('policy')
        
        if not policy:
            return jsonify({'error': 'Policy is required'}), 400
        
        errors = []
        suggestions = []
        
        # Validate required fields
        required_fields = ['name', 'rules']
        for field in required_fields:
            if not policy.get(field):
                errors.append({
                    'field': field,
                    'message': f'{field} is required',
                    'severity': 'error'
                })
        
        # Validate rules
        rules = policy.get('rules', [])
        if not rules:
            errors.append({
                'field': 'rules',
                'message': 'At least one rule is required',
                'severity': 'error'
            })
        
        for i, rule in enumerate(rules):
            rule_prefix = f'rules[{i}]'
            
            if not rule.get('condition'):
                errors.append({
                    'field': f'{rule_prefix}.condition',
                    'message': 'Rule condition is required',
                    'severity': 'error'
                })
            
            if not rule.get('action'):
                errors.append({
                    'field': f'{rule_prefix}.action',
                    'message': 'Rule action is required',
                    'severity': 'error'
                })
            
            valid_actions = ['allow', 'deny', 'log', 'alert', 'escalate']
            if rule.get('action') not in valid_actions:
                errors.append({
                    'field': f'{rule_prefix}.action',
                    'message': f'Invalid action. Must be one of: {", ".join(valid_actions)}',
                    'severity': 'error'
                })
        
        return jsonify({
            'valid': len(errors) == 0,
            'errors': errors,
            'suggestions': suggestions,
            'summary': {
                'total_rules': len(rules),
                'error_count': len(errors),
                'suggestion_count': len(suggestions)
            }
        })
    except Exception as e:
        logging.error(f"Error validating policy: {e}")
        return jsonify({'error': str(e)}), 500

@promethios_policy_bp.route('/policies/search', methods=['GET'])
def search_policies():
    """Search policies with advanced filtering"""
    try:
        if not policy_integration.policy_manager:
            return jsonify({'error': 'PolicyManagementModule not available'}), 500
        
        query = request.args.get('q', '')
        categories = request.args.getlist('categories')
        
        # Get all policies
        all_policies = list(policy_integration.policy_manager.policies.values())
        
        # Filter policies
        filtered_policies = []
        
        for policy in all_policies:
            relevance_score = 0.0
            highlighted_fields = []
            
            # Text search
            if query:
                name = policy.get('name', '').lower()
                description = policy.get('description', '').lower()
                query_lower = query.lower()
                
                if query_lower in name:
                    relevance_score += 1.0
                    highlighted_fields.append('name')
                
                if query_lower in description:
                    relevance_score += 0.5
                    highlighted_fields.append('description')
            else:
                relevance_score = 1.0
            
            # Category filter
            if categories and policy.get('category') not in categories:
                continue
            
            if relevance_score > 0:
                result = policy.copy()
                result['relevance_score'] = relevance_score
                result['highlighted_fields'] = highlighted_fields
                filtered_policies.append(result)
        
        # Sort by relevance
        filtered_policies.sort(key=lambda p: p['relevance_score'], reverse=True)
        
        return jsonify(filtered_policies)
    except Exception as e:
        logging.error(f"Error searching policies: {e}")
        return jsonify({'error': str(e)}), 500

# Register the blueprint with the main app
def register_promethios_policy_routes(app):
    """Register the Promethios policy routes with the Flask app"""
    app.register_blueprint(promethios_policy_bp, url_prefix='/api/promethios-policy')
    logging.info("Promethios policy integration routes registered")



# Import ML training system
from src.ml.model_training import ml_trainer

@promethios_policy_bp.route('/ml/train', methods=['POST'])
def train_ml_models():
    """Train ML models with real data from Promethios system"""
    try:
        request_data = request.get_json() or {}
        days_back = request_data.get('days_back', 90)
        force_retrain = request_data.get('force_retrain', False)
        
        # Check if models are already trained and not forcing retrain
        if not force_retrain and policy_intelligence.models:
            return jsonify({
                'message': 'Models already trained. Use force_retrain=true to retrain.',
                'existing_models': list(policy_intelligence.models.keys()),
                'model_performance': policy_intelligence.model_performance
            })
        
        # Start training
        training_results = ml_trainer.train_all_models(days_back)
        
        if 'error' in training_results:
            return jsonify({'error': training_results['error']}), 500
        
        return jsonify({
            'message': 'ML models trained successfully',
            'training_results': training_results,
            'models_trained': list(training_results.get('models', {}).keys())
        })
    except Exception as e:
        logging.error(f"Error training ML models: {e}")
        return jsonify({'error': str(e)}), 500

@promethios_policy_bp.route('/ml/validate', methods=['POST'])
def validate_ml_models():
    """Validate trained ML models"""
    try:
        if not policy_intelligence.models:
            return jsonify({'error': 'No models available for validation. Train models first.'}), 400
        
        validation_results = ml_trainer.validate_models()
        
        if 'error' in validation_results:
            return jsonify({'error': validation_results['error']}), 500
        
        return jsonify({
            'message': 'Model validation completed',
            'validation_results': validation_results,
            'models_validated': list(validation_results.keys())
        })
    except Exception as e:
        logging.error(f"Error validating ML models: {e}")
        return jsonify({'error': str(e)}), 500

@promethios_policy_bp.route('/ml/status', methods=['GET'])
def get_ml_status():
    """Get status of ML models and training system"""
    try:
        status = {
            'models_available': list(policy_intelligence.models.keys()),
            'model_performance': policy_intelligence.model_performance,
            'feature_importance': policy_intelligence.feature_importance,
            'last_training': None,
            'system_status': 'operational'
        }
        
        # Check for latest training results
        try:
            results_files = [f for f in os.listdir(ml_trainer.results_dir) if f.startswith('training_results_')]
            if results_files:
                latest_file = max(results_files)
                status['last_training'] = latest_file.replace('training_results_', '').replace('.json', '')
        except:
            pass
        
        return jsonify(status)
    except Exception as e:
        logging.error(f"Error getting ML status: {e}")
        return jsonify({'error': str(e)}), 500

@promethios_policy_bp.route('/ml/feature-importance', methods=['GET'])
def get_feature_importance():
    """Get feature importance for trained models"""
    try:
        model_type = request.args.get('model_type', 'effectiveness')
        
        if model_type not in policy_intelligence.feature_importance:
            return jsonify({'error': f'No feature importance data for model: {model_type}'}), 404
        
        importance_data = policy_intelligence.feature_importance[model_type]
        
        # Sort by importance
        sorted_features = sorted(importance_data.items(), key=lambda x: x[1], reverse=True)
        
        return jsonify({
            'model_type': model_type,
            'feature_importance': dict(sorted_features),
            'top_features': sorted_features[:10],
            'total_features': len(sorted_features)
        })
    except Exception as e:
        logging.error(f"Error getting feature importance: {e}")
        return jsonify({'error': str(e)}), 500

@promethios_policy_bp.route('/ml/predict-effectiveness', methods=['POST'])
def predict_policy_effectiveness():
    """Predict effectiveness for a given policy using trained ML model"""
    try:
        request_data = request.get_json()
        policy = request_data.get('policy')
        
        if not policy:
            return jsonify({'error': 'Policy is required'}), 400
        
        if 'effectiveness' not in policy_intelligence.models:
            return jsonify({'error': 'Effectiveness model not trained. Train models first.'}), 400
        
        # Use policy intelligence engine for prediction
        prediction_result = policy_intelligence.predict_policy_effectiveness(policy)
        
        return jsonify({
            'policy_id': policy.get('policy_id', 'unknown'),
            'prediction': prediction_result,
            'model_used': 'effectiveness',
            'prediction_timestamp': datetime.utcnow().isoformat()
        })
    except Exception as e:
        logging.error(f"Error predicting policy effectiveness: {e}")
        return jsonify({'error': str(e)}), 500

@promethios_policy_bp.route('/ml/detect-conflicts', methods=['POST'])
def detect_ml_conflicts():
    """Detect conflicts using trained ML model"""
    try:
        request_data = request.get_json()
        policies = request_data.get('policies', [])
        
        if len(policies) < 2:
            return jsonify({'error': 'At least 2 policies are required for conflict detection'}), 400
        
        if 'conflict_detector' not in policy_intelligence.models:
            return jsonify({'error': 'Conflict detection model not trained. Train models first.'}), 400
        
        # Use policy intelligence engine for conflict detection
        conflicts = policy_intelligence.detect_policy_conflicts(policies)
        
        return jsonify({
            'conflicts_detected': len(conflicts),
            'conflicts': conflicts,
            'policies_analyzed': len(policies),
            'model_used': 'conflict_detector',
            'analysis_timestamp': datetime.utcnow().isoformat()
        })
    except Exception as e:
        logging.error(f"Error detecting ML conflicts: {e}")
        return jsonify({'error': str(e)}), 500

@promethios_policy_bp.route('/analytics/dashboard', methods=['GET'])
def get_analytics_dashboard():
    """Get comprehensive analytics dashboard data"""
    try:
        if not policy_integration.policy_manager:
            return jsonify({'error': 'PolicyManagementModule not available'}), 500
        
        # Get all policies
        policies = list(policy_integration.policy_manager.policies.values())
        
        # Calculate overall statistics
        total_policies = len(policies)
        active_policies = len([p for p in policies if p.get('status') == 'active'])
        
        # Policy type distribution
        policy_types = {}
        for policy in policies:
            policy_type = policy.get('policy_type', 'UNKNOWN')
            policy_types[policy_type] = policy_types.get(policy_type, 0) + 1
        
        # Category distribution
        categories = {}
        for policy in policies:
            category = policy.get('category', 'UNKNOWN')
            categories[category] = categories.get(category, 0) + 1
        
        # Get recent metrics for overall health
        try:
            recent_metrics = AgentMetrics.query.filter(
                AgentMetrics.timestamp >= datetime.utcnow() - timedelta(days=7)
            ).all()
            
            recent_violations = AgentViolation.query.filter(
                AgentViolation.timestamp >= datetime.utcnow() - timedelta(days=7)
            ).all()
            
            overall_compliance_rate = 1.0
            avg_trust_score = 75.0
            
            if recent_metrics:
                total_evaluations = len(recent_metrics)
                violation_count = len(recent_violations)
                overall_compliance_rate = max(0, (total_evaluations - violation_count) / total_evaluations)
                avg_trust_score = np.mean([m.trust_score for m in recent_metrics if m.trust_score])
        except:
            overall_compliance_rate = 1.0
            avg_trust_score = 75.0
        
        # ML model status
        ml_status = {
            'models_available': len(policy_intelligence.models),
            'models_trained': list(policy_intelligence.models.keys()),
            'last_training': 'Unknown'
        }
        
        dashboard_data = {
            'overview': {
                'total_policies': total_policies,
                'active_policies': active_policies,
                'overall_compliance_rate': overall_compliance_rate,
                'avg_trust_score': avg_trust_score,
                'system_health': 'Good' if overall_compliance_rate > 0.8 else 'Needs Attention'
            },
            'distributions': {
                'policy_types': policy_types,
                'categories': categories
            },
            'ml_status': ml_status,
            'recent_activity': {
                'metrics_count': len(recent_metrics) if 'recent_metrics' in locals() else 0,
                'violations_count': len(recent_violations) if 'recent_violations' in locals() else 0
            },
            'generated_at': datetime.utcnow().isoformat()
        }
        
        return jsonify(dashboard_data)
    except Exception as e:
        logging.error(f"Error getting analytics dashboard: {e}")
        return jsonify({'error': str(e)}), 500

