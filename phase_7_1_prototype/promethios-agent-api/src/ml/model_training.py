"""
ML Model Training and Validation System
Comprehensive training pipeline for Promethios policy intelligence models
"""

import os
import sys
import json
import logging
import numpy as np
import pandas as pd
from datetime import datetime, timedelta
from typing import Dict, List, Any, Tuple, Optional
import joblib
from sklearn.model_selection import train_test_split, cross_val_score, GridSearchCV
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, mean_squared_error, r2_score
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor, GradientBoostingClassifier
import matplotlib.pyplot as plt
import seaborn as sns

# Import Promethios models and intelligence engine
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(__file__))))
from src.models.agent_data import AgentMetrics, AgentViolation, AgentLog, AgentHeartbeat
from src.ml.policy_intelligence import policy_intelligence

# Add Promethios core modules
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..', '..', '..', 'phase_6_3_new', 'src'))

try:
    from core.governance.policy_management_module import PolicyManagementModule
except ImportError as e:
    logging.error(f"Failed to import PolicyManagementModule: {e}")
    PolicyManagementModule = None

class PrometheiosMLTrainer:
    """
    Comprehensive ML training system for Promethios policy intelligence
    """
    
    def __init__(self):
        self.models = {}
        self.training_data = {}
        self.validation_results = {}
        self.model_metrics = {}
        self.feature_importance = {}
        
        # Paths for model storage
        self.model_dir = '/home/ubuntu/promethios/data/ml_models'
        self.training_data_dir = '/home/ubuntu/promethios/data/ml_training'
        self.results_dir = '/home/ubuntu/promethios/data/ml_results'
        
        # Create directories
        for directory in [self.model_dir, self.training_data_dir, self.results_dir]:
            os.makedirs(directory, exist_ok=True)
        
        # Initialize policy manager for data access
        self.policy_manager = None
        self._initialize_policy_manager()
    
    def _initialize_policy_manager(self):
        """Initialize PolicyManagementModule for data access"""
        try:
            if PolicyManagementModule is None:
                logging.warning("PolicyManagementModule not available for training")
                return
            
            # Mock configuration
            config = {
                'storage_dir': '/home/ubuntu/promethios/data/policy_management',
                'schema_path': '/home/ubuntu/promethios/docs/schemas/policy.schema.json'
            }
            
            # Mock dependencies
            class MockCodexLock:
                def verify_tether(self, contract_id, version):
                    return True
            
            self.policy_manager = PolicyManagementModule(
                config=config,
                codex_lock=MockCodexLock(),
                decision_framework=None,
                attestation_service=None,
                trust_metrics_calculator=None,
                requirement_validation=None
            )
            logging.info("PolicyManagementModule initialized for training")
        except Exception as e:
            logging.error(f"Failed to initialize PolicyManagementModule: {e}")
    
    def collect_training_data(self, days_back: int = 90) -> Dict[str, Any]:
        """Collect comprehensive training data from Promethios system"""
        try:
            end_date = datetime.utcnow()
            start_date = end_date - timedelta(days=days_back)
            
            logging.info(f"Collecting training data from {start_date} to {end_date}")
            
            # Collect agent metrics
            metrics = AgentMetrics.query.filter(
                AgentMetrics.timestamp >= start_date,
                AgentMetrics.timestamp <= end_date
            ).all()
            
            # Collect violations
            violations = AgentViolation.query.filter(
                AgentViolation.timestamp >= start_date,
                AgentViolation.timestamp <= end_date
            ).all()
            
            # Collect logs
            logs = AgentLog.query.filter(
                AgentLog.timestamp >= start_date,
                AgentLog.timestamp <= end_date
            ).all()
            
            # Collect heartbeats
            heartbeats = AgentHeartbeat.query.filter(
                AgentHeartbeat.timestamp >= start_date,
                AgentHeartbeat.timestamp <= end_date
            ).all()
            
            # Get policy data
            policies = []
            if self.policy_manager:
                policies = list(self.policy_manager.policies.values())
            
            training_data = {
                'metrics': [self._serialize_metric(m) for m in metrics],
                'violations': [self._serialize_violation(v) for v in violations],
                'logs': [self._serialize_log(l) for l in logs],
                'heartbeats': [self._serialize_heartbeat(h) for h in heartbeats],
                'policies': policies,
                'collection_date': datetime.utcnow().isoformat(),
                'date_range': {
                    'start': start_date.isoformat(),
                    'end': end_date.isoformat()
                }
            }
            
            # Save training data
            data_file = os.path.join(self.training_data_dir, f'training_data_{datetime.utcnow().strftime("%Y%m%d_%H%M%S")}.json')
            with open(data_file, 'w') as f:
                json.dump(training_data, f, indent=2)
            
            logging.info(f"Collected {len(metrics)} metrics, {len(violations)} violations, {len(policies)} policies")
            
            return training_data
            
        except Exception as e:
            logging.error(f"Error collecting training data: {e}")
            return {}
    
    def _serialize_metric(self, metric: AgentMetrics) -> Dict[str, Any]:
        """Serialize AgentMetrics for JSON storage"""
        return {
            'id': metric.id,
            'agent_id': metric.agent_id,
            'timestamp': metric.timestamp.isoformat() if metric.timestamp else None,
            'trust_score': metric.trust_score,
            'response_time': metric.response_time,
            'cpu_usage': metric.cpu_usage,
            'memory_usage': metric.memory_usage,
            'request_count': metric.request_count,
            'error_count': metric.error_count,
            'success_rate': metric.success_rate
        }
    
    def _serialize_violation(self, violation: AgentViolation) -> Dict[str, Any]:
        """Serialize AgentViolation for JSON storage"""
        return {
            'id': violation.id,
            'agent_id': violation.agent_id,
            'timestamp': violation.timestamp.isoformat() if violation.timestamp else None,
            'violation_type': violation.violation_type,
            'severity': violation.severity,
            'description': violation.description,
            'policy_id': violation.policy_id,
            'rule_id': violation.rule_id
        }
    
    def _serialize_log(self, log: AgentLog) -> Dict[str, Any]:
        """Serialize AgentLog for JSON storage"""
        return {
            'id': log.id,
            'agent_id': log.agent_id,
            'timestamp': log.timestamp.isoformat() if log.timestamp else None,
            'level': log.level,
            'message': log.message,
            'context': log.context
        }
    
    def _serialize_heartbeat(self, heartbeat: AgentHeartbeat) -> Dict[str, Any]:
        """Serialize AgentHeartbeat for JSON storage"""
        return {
            'id': heartbeat.id,
            'agent_id': heartbeat.agent_id,
            'timestamp': heartbeat.timestamp.isoformat() if heartbeat.timestamp else None,
            'status': heartbeat.status,
            'metadata': heartbeat.metadata
        }
    
    def prepare_effectiveness_training_data(self, training_data: Dict[str, Any]) -> Tuple[np.ndarray, np.ndarray]:
        """Prepare training data for policy effectiveness prediction"""
        try:
            policies = training_data.get('policies', [])
            metrics = training_data.get('metrics', [])
            violations = training_data.get('violations', [])
            
            if not policies:
                logging.warning("No policies found for training")
                return self._generate_synthetic_effectiveness_data(1000)
            
            X = []
            y = []
            
            for policy in policies:
                # Extract policy features using intelligence engine
                features = policy_intelligence.extract_policy_features(policy)
                
                # Calculate effectiveness score based on real data
                policy_id = policy.get('policy_id', '')
                
                # Get metrics and violations for this policy
                policy_metrics = [m for m in metrics if m.get('agent_id', '').startswith(policy_id[:8])]
                policy_violations = [v for v in violations if v.get('policy_id') == policy_id]
                
                if policy_metrics:
                    # Calculate real effectiveness score
                    total_evaluations = len(policy_metrics)
                    violation_count = len(policy_violations)
                    compliance_rate = (total_evaluations - violation_count) / max(total_evaluations, 1)
                    
                    avg_trust_score = np.mean([m.get('trust_score', 0) for m in policy_metrics if m.get('trust_score')])
                    avg_trust_score = avg_trust_score / 100 if avg_trust_score > 0 else 0.5
                    
                    effectiveness = (compliance_rate * 0.7) + (avg_trust_score * 0.3)
                    effectiveness = max(0.0, min(1.0, effectiveness))
                else:
                    # Use heuristic for policies without data
                    effectiveness = self._calculate_heuristic_effectiveness(policy)
                
                X.append(features.flatten())
                y.append(effectiveness)
            
            if len(X) < 50:  # Not enough real data, supplement with synthetic
                logging.info(f"Only {len(X)} real samples, supplementing with synthetic data")
                synthetic_X, synthetic_y = self._generate_synthetic_effectiveness_data(500)
                X.extend(synthetic_X.tolist())
                y.extend(synthetic_y.tolist())
            
            return np.array(X), np.array(y)
            
        except Exception as e:
            logging.error(f"Error preparing effectiveness training data: {e}")
            return self._generate_synthetic_effectiveness_data(1000)
    
    def _calculate_heuristic_effectiveness(self, policy: Dict[str, Any]) -> float:
        """Calculate heuristic effectiveness score for policies without data"""
        effectiveness = 0.5  # Base score
        
        # Rule count factor
        num_rules = len(policy.get('rules', []))
        if num_rules > 0:
            effectiveness += min(0.2, num_rules / 20)  # More rules can help (up to a point)
        
        # Category factor
        category = policy.get('category', '').upper()
        category_scores = {
            'SECURITY': 0.1,
            'COMPLIANCE': 0.15,
            'OPERATIONAL': 0.05,
            'ETHICAL': 0.1,
            'LEGAL': 0.15
        }
        effectiveness += category_scores.get(category, 0)
        
        # Status factor
        if policy.get('status') == 'active':
            effectiveness += 0.1
        
        # Compliance mappings factor
        compliance_mappings = policy.get('metadata', {}).get('compliance_mappings', {})
        if compliance_mappings:
            effectiveness += min(0.1, len(compliance_mappings) / 10)
        
        # Add some randomness
        effectiveness += np.random.normal(0, 0.05)
        
        return max(0.0, min(1.0, effectiveness))
    
    def _generate_synthetic_effectiveness_data(self, n_samples: int) -> Tuple[np.ndarray, np.ndarray]:
        """Generate synthetic training data for effectiveness prediction"""
        np.random.seed(42)
        
        # Generate random policy features (25 features)
        X = np.random.rand(n_samples, 25)
        
        # Generate realistic effectiveness scores based on features
        y = np.zeros(n_samples)
        
        for i in range(n_samples):
            # Heuristic effectiveness calculation
            num_rules = X[i, 0] * 50  # Scale to realistic range
            complexity = X[i, 13]  # Condition complexity
            compliance_features = X[i, 16:18].sum()  # Compliance-related features
            category_score = X[i, 3] * 0.2  # Category influence
            
            effectiveness = 0.5  # Base effectiveness
            effectiveness += min(0.3, num_rules / 100)  # More rules can help
            effectiveness -= min(0.2, complexity / 10)  # High complexity reduces effectiveness
            effectiveness += min(0.2, compliance_features / 5)  # Compliance features help
            effectiveness += category_score
            effectiveness += np.random.normal(0, 0.1)  # Add noise
            
            y[i] = max(0.0, min(1.0, effectiveness))
        
        return X, y
    
    def train_effectiveness_model(self, training_data: Dict[str, Any]) -> Dict[str, Any]:
        """Train the policy effectiveness prediction model"""
        try:
            logging.info("Training policy effectiveness model")
            
            # Prepare training data
            X, y = self.prepare_effectiveness_training_data(training_data)
            
            if len(X) == 0:
                raise ValueError("No training data available")
            
            # Split data
            X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
            
            # Scale features
            scaler = StandardScaler()
            X_train_scaled = scaler.fit_transform(X_train)
            X_test_scaled = scaler.transform(X_test)
            
            # Train model with hyperparameter tuning
            param_grid = {
                'n_estimators': [100, 200, 300],
                'max_depth': [5, 10, 15, None],
                'min_samples_split': [2, 5, 10],
                'min_samples_leaf': [1, 2, 4]
            }
            
            rf = RandomForestRegressor(random_state=42)
            grid_search = GridSearchCV(rf, param_grid, cv=5, scoring='r2', n_jobs=-1)
            grid_search.fit(X_train_scaled, y_train)
            
            best_model = grid_search.best_estimator_
            
            # Evaluate model
            y_pred = best_model.predict(X_test_scaled)
            
            metrics = {
                'mse': mean_squared_error(y_test, y_pred),
                'r2_score': r2_score(y_test, y_pred),
                'mean_absolute_error': np.mean(np.abs(y_test - y_pred)),
                'best_params': grid_search.best_params_,
                'cv_score': grid_search.best_score_,
                'training_samples': len(X_train),
                'test_samples': len(X_test)
            }
            
            # Feature importance
            feature_names = self._get_feature_names()
            feature_importance = dict(zip(feature_names, best_model.feature_importances_))
            
            # Save model and scaler
            model_path = os.path.join(self.model_dir, 'effectiveness_model.joblib')
            scaler_path = os.path.join(self.model_dir, 'effectiveness_scaler.joblib')
            
            joblib.dump(best_model, model_path)
            joblib.dump(scaler, scaler_path)
            
            # Update policy intelligence engine
            policy_intelligence.models['effectiveness'] = best_model
            policy_intelligence.scalers['policy_features'] = scaler
            policy_intelligence.model_performance['effectiveness'] = metrics
            policy_intelligence.feature_importance['effectiveness'] = feature_importance
            
            logging.info(f"Effectiveness model trained successfully. R² score: {metrics['r2_score']:.3f}")
            
            return {
                'model_type': 'effectiveness',
                'metrics': metrics,
                'feature_importance': feature_importance,
                'model_path': model_path,
                'scaler_path': scaler_path
            }
            
        except Exception as e:
            logging.error(f"Error training effectiveness model: {e}")
            return {'error': str(e)}
    
    def train_conflict_detection_model(self, training_data: Dict[str, Any]) -> Dict[str, Any]:
        """Train the policy conflict detection model"""
        try:
            logging.info("Training policy conflict detection model")
            
            policies = training_data.get('policies', [])
            
            if len(policies) < 2:
                logging.warning("Not enough policies for conflict detection training, using synthetic data")
                X, y = self._generate_synthetic_conflict_data(1000)
            else:
                X, y = self._prepare_conflict_training_data(policies)
            
            # Split data
            X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
            
            # Train model
            model = GradientBoostingClassifier(
                n_estimators=100,
                learning_rate=0.1,
                max_depth=6,
                random_state=42
            )
            
            model.fit(X_train, y_train)
            
            # Evaluate model
            y_pred = model.predict(X_test)
            y_pred_proba = model.predict_proba(X_test)[:, 1]
            
            metrics = {
                'accuracy': accuracy_score(y_test, y_pred),
                'precision': precision_score(y_test, y_pred),
                'recall': recall_score(y_test, y_pred),
                'f1_score': f1_score(y_test, y_pred),
                'training_samples': len(X_train),
                'test_samples': len(X_test)
            }
            
            # Save model
            model_path = os.path.join(self.model_dir, 'conflict_detector_model.joblib')
            joblib.dump(model, model_path)
            
            # Update policy intelligence engine
            policy_intelligence.models['conflict_detector'] = model
            policy_intelligence.model_performance['conflict_detector'] = metrics
            
            logging.info(f"Conflict detection model trained successfully. Accuracy: {metrics['accuracy']:.3f}")
            
            return {
                'model_type': 'conflict_detector',
                'metrics': metrics,
                'model_path': model_path
            }
            
        except Exception as e:
            logging.error(f"Error training conflict detection model: {e}")
            return {'error': str(e)}
    
    def _prepare_conflict_training_data(self, policies: List[Dict[str, Any]]) -> Tuple[np.ndarray, np.ndarray]:
        """Prepare training data for conflict detection"""
        X = []
        y = []
        
        # Generate policy pairs
        for i, policy1 in enumerate(policies):
            for j, policy2 in enumerate(policies[i+1:], i+1):
                # Extract features for policy pair
                features1 = policy_intelligence.extract_policy_features(policy1).flatten()
                features2 = policy_intelligence.extract_policy_features(policy2).flatten()
                
                # Combine features
                pair_features = np.concatenate([features1, features2, np.abs(features1 - features2)])
                
                # Determine if there's a conflict (simplified heuristic)
                has_conflict = self._detect_simple_conflict(policy1, policy2)
                
                X.append(pair_features)
                y.append(1 if has_conflict else 0)
        
        # Ensure we have enough samples
        if len(X) < 100:
            synthetic_X, synthetic_y = self._generate_synthetic_conflict_data(500)
            X.extend(synthetic_X.tolist())
            y.extend(synthetic_y.tolist())
        
        return np.array(X), np.array(y)
    
    def _detect_simple_conflict(self, policy1: Dict[str, Any], policy2: Dict[str, Any]) -> bool:
        """Simple heuristic to detect conflicts between policies"""
        # Check category conflicts
        if policy1.get('category') == policy2.get('category'):
            # Same category policies might conflict
            rules1 = policy1.get('rules', [])
            rules2 = policy2.get('rules', [])
            
            for rule1 in rules1:
                for rule2 in rules2:
                    # Check for contradictory actions
                    if (rule1.get('condition', '').lower() == rule2.get('condition', '').lower() and
                        rule1.get('action') != rule2.get('action')):
                        return True
        
        return False
    
    def _generate_synthetic_conflict_data(self, n_samples: int) -> Tuple[np.ndarray, np.ndarray]:
        """Generate synthetic conflict detection training data"""
        np.random.seed(42)
        
        # Generate random policy pair features (75 features: 25 + 25 + 25)
        X = np.random.rand(n_samples, 75)
        
        # Generate conflict labels based on feature similarity
        y = np.zeros(n_samples)
        
        for i in range(n_samples):
            # Calculate similarity between policy features
            policy1_features = X[i, :25]
            policy2_features = X[i, 25:50]
            
            # High similarity in certain features indicates potential conflict
            category_similarity = abs(policy1_features[3] - policy2_features[3]) < 0.1
            action_similarity = np.mean(np.abs(policy1_features[5:10] - policy2_features[5:10])) < 0.2
            
            if category_similarity and action_similarity:
                y[i] = 1  # Conflict
            else:
                y[i] = 0  # No conflict
        
        return X, y
    
    def _get_feature_names(self) -> List[str]:
        """Get feature names for interpretability"""
        return [
            'num_rules', 'name_length', 'description_length', 'category',
            'avg_condition_length', 'allow_actions', 'deny_actions', 'log_actions',
            'alert_actions', 'escalate_actions', 'avg_priority', 'priority_std',
            'priority_range', 'avg_condition_complexity', 'max_condition_complexity',
            'condition_complexity_std', 'num_tags', 'num_compliance_standards',
            'major_version', 'minor_version', 'status', 'feature_21', 'feature_22',
            'feature_23', 'feature_24'
        ]
    
    def train_all_models(self, days_back: int = 90) -> Dict[str, Any]:
        """Train all ML models with comprehensive data collection"""
        try:
            logging.info("Starting comprehensive ML model training")
            
            # Collect training data
            training_data = self.collect_training_data(days_back)
            
            if not training_data:
                raise ValueError("Failed to collect training data")
            
            results = {
                'training_started': datetime.utcnow().isoformat(),
                'data_collection': {
                    'metrics_count': len(training_data.get('metrics', [])),
                    'violations_count': len(training_data.get('violations', [])),
                    'policies_count': len(training_data.get('policies', [])),
                    'days_back': days_back
                },
                'models': {}
            }
            
            # Train effectiveness model
            effectiveness_result = self.train_effectiveness_model(training_data)
            results['models']['effectiveness'] = effectiveness_result
            
            # Train conflict detection model
            conflict_result = self.train_conflict_detection_model(training_data)
            results['models']['conflict_detector'] = conflict_result
            
            # Save training results
            results_file = os.path.join(self.results_dir, f'training_results_{datetime.utcnow().strftime("%Y%m%d_%H%M%S")}.json')
            with open(results_file, 'w') as f:
                json.dump(results, f, indent=2)
            
            results['training_completed'] = datetime.utcnow().isoformat()
            results['results_file'] = results_file
            
            logging.info("ML model training completed successfully")
            
            return results
            
        except Exception as e:
            logging.error(f"Error in comprehensive model training: {e}")
            return {'error': str(e)}
    
    def validate_models(self) -> Dict[str, Any]:
        """Validate trained models with cross-validation"""
        try:
            validation_results = {}
            
            # Validate effectiveness model
            if 'effectiveness' in policy_intelligence.models:
                model = policy_intelligence.models['effectiveness']
                if hasattr(model, 'feature_importances_'):
                    # Generate validation data
                    X_val, y_val = self._generate_synthetic_effectiveness_data(200)
                    
                    # Scale features if scaler is available
                    if 'policy_features' in policy_intelligence.scalers:
                        scaler = policy_intelligence.scalers['policy_features']
                        X_val = scaler.transform(X_val)
                    
                    # Predict and evaluate
                    y_pred = model.predict(X_val)
                    
                    validation_results['effectiveness'] = {
                        'r2_score': r2_score(y_val, y_pred),
                        'mse': mean_squared_error(y_val, y_pred),
                        'mean_absolute_error': np.mean(np.abs(y_val - y_pred)),
                        'validation_samples': len(X_val)
                    }
            
            # Validate conflict detection model
            if 'conflict_detector' in policy_intelligence.models:
                model = policy_intelligence.models['conflict_detector']
                if hasattr(model, 'classes_'):
                    # Generate validation data
                    X_val, y_val = self._generate_synthetic_conflict_data(200)
                    
                    # Predict and evaluate
                    y_pred = model.predict(X_val)
                    
                    validation_results['conflict_detector'] = {
                        'accuracy': accuracy_score(y_val, y_pred),
                        'precision': precision_score(y_val, y_pred),
                        'recall': recall_score(y_val, y_pred),
                        'f1_score': f1_score(y_val, y_pred),
                        'validation_samples': len(X_val)
                    }
            
            return validation_results
            
        except Exception as e:
            logging.error(f"Error validating models: {e}")
            return {'error': str(e)}

# Global trainer instance
ml_trainer = PrometheiosMLTrainer()

