"""
Policy Intelligence Module
Advanced ML/AI capabilities for policy optimization, analytics, and prediction
Integrates with Promethios PolicyManagementModule for real data analysis
"""

import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor, GradientBoostingClassifier
from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score
import joblib
import json
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Any, Tuple, Optional
import re
from collections import Counter, defaultdict

# Import Promethios models
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(__file__))))
from src.models.agent_data import AgentMetrics, AgentViolation, AgentLog

class PolicyIntelligenceEngine:
    """
    Advanced ML engine for policy intelligence and optimization
    """
    
    def __init__(self):
        self.models = {}
        self.scalers = {}
        self.encoders = {}
        self.feature_importance = {}
        self.training_data = {}
        self.model_performance = {}
        
        # Initialize models
        self._initialize_models()
        
        # Load or train models
        self._load_or_train_models()
    
    def _initialize_models(self):
        """Initialize ML models for different tasks"""
        
        # Policy effectiveness predictor
        self.models['effectiveness'] = RandomForestRegressor(
            n_estimators=200,
            max_depth=10,
            min_samples_split=5,
            min_samples_leaf=2,
            random_state=42
        )
        
        # Policy conflict detector
        self.models['conflict_detector'] = GradientBoostingClassifier(
            n_estimators=100,
            learning_rate=0.1,
            max_depth=6,
            random_state=42
        )
        
        # Policy optimization recommender
        self.models['optimization'] = RandomForestClassifier(
            n_estimators=150,
            max_depth=8,
            min_samples_split=3,
            random_state=42
        )
        
        # Policy clustering for similarity analysis
        self.models['clustering'] = KMeans(
            n_clusters=5,
            random_state=42,
            n_init=10
        )
        
        # Violation prediction model
        self.models['violation_predictor'] = GradientBoostingClassifier(
            n_estimators=100,
            learning_rate=0.1,
            max_depth=5,
            random_state=42
        )
        
        # Initialize scalers and encoders
        self.scalers['policy_features'] = StandardScaler()
        self.scalers['performance_features'] = StandardScaler()
        self.encoders['category'] = LabelEncoder()
        self.encoders['action'] = LabelEncoder()
        
        logging.info("Policy Intelligence models initialized")
    
    def _load_or_train_models(self):
        """Load existing models or train new ones"""
        try:
            # Try to load existing models
            model_path = '/home/ubuntu/promethios/data/ml_models'
            os.makedirs(model_path, exist_ok=True)
            
            for model_name in self.models.keys():
                model_file = os.path.join(model_path, f'{model_name}_model.joblib')
                if os.path.exists(model_file):
                    self.models[model_name] = joblib.load(model_file)
                    logging.info(f"Loaded existing {model_name} model")
                else:
                    logging.info(f"No existing {model_name} model found, will train on first use")
            
            # Load scalers and encoders
            for scaler_name in self.scalers.keys():
                scaler_file = os.path.join(model_path, f'{scaler_name}_scaler.joblib')
                if os.path.exists(scaler_file):
                    self.scalers[scaler_name] = joblib.load(scaler_file)
            
            for encoder_name in self.encoders.keys():
                encoder_file = os.path.join(model_path, f'{encoder_name}_encoder.joblib')
                if os.path.exists(encoder_file):
                    self.encoders[encoder_name] = joblib.load(encoder_file)
                    
        except Exception as e:
            logging.error(f"Error loading models: {e}")
    
    def extract_policy_features(self, policy: Dict[str, Any]) -> np.ndarray:
        """Extract comprehensive features from a policy for ML analysis"""
        features = []
        
        # Basic policy features
        features.append(len(policy.get('rules', [])))  # Number of rules
        features.append(len(policy.get('name', '')))   # Name length
        features.append(len(policy.get('description', '')))  # Description length
        
        # Category encoding (if encoder is fitted)
        category = policy.get('category', 'SECURITY')
        try:
            if hasattr(self.encoders['category'], 'classes_'):
                if category in self.encoders['category'].classes_:
                    features.append(self.encoders['category'].transform([category])[0])
                else:
                    features.append(0)  # Unknown category
            else:
                # Map categories to numbers for initial training
                category_map = {'SECURITY': 0, 'COMPLIANCE': 1, 'OPERATIONAL': 2, 'ETHICAL': 3, 'LEGAL': 4}
                features.append(category_map.get(category, 0))
        except:
            features.append(0)
        
        # Rule complexity analysis
        rules = policy.get('rules', [])
        if rules:
            # Average condition complexity (character count)
            avg_condition_length = np.mean([len(rule.get('condition', '')) for rule in rules])
            features.append(avg_condition_length)
            
            # Action distribution
            actions = [rule.get('action', 'allow') for rule in rules]
            action_counts = Counter(actions)
            features.extend([
                action_counts.get('allow', 0),
                action_counts.get('deny', 0),
                action_counts.get('log', 0),
                action_counts.get('alert', 0),
                action_counts.get('escalate', 0)
            ])
            
            # Priority analysis
            priorities = [rule.get('priority', 1) for rule in rules if rule.get('priority')]
            if priorities:
                features.extend([
                    np.mean(priorities),
                    np.std(priorities),
                    max(priorities) - min(priorities)  # Priority range
                ])
            else:
                features.extend([1, 0, 0])
            
            # Condition complexity analysis
            condition_complexities = []
            for rule in rules:
                condition = rule.get('condition', '')
                complexity = self._calculate_condition_complexity(condition)
                condition_complexities.append(complexity)
            
            if condition_complexities:
                features.extend([
                    np.mean(condition_complexities),
                    np.max(condition_complexities),
                    np.std(condition_complexities)
                ])
            else:
                features.extend([0, 0, 0])
        else:
            # No rules - add zeros
            features.extend([0] * 13)  # 13 rule-related features
        
        # Metadata features
        metadata = policy.get('metadata', {})
        tags = metadata.get('tags', [])
        features.append(len(tags))  # Number of tags
        
        compliance_mappings = metadata.get('compliance_mappings', {})
        features.append(len(compliance_mappings))  # Number of compliance standards
        
        # Version analysis
        version = policy.get('version', '1.0.0')
        version_parts = version.split('.')
        if len(version_parts) >= 2:
            features.extend([int(version_parts[0]), int(version_parts[1])])
        else:
            features.extend([1, 0])
        
        # Status encoding
        status = policy.get('status', 'draft')
        status_map = {'draft': 0, 'active': 1, 'deprecated': 2, 'archived': 3}
        features.append(status_map.get(status, 0))
        
        # Ensure consistent feature count (pad or truncate to 25 features)
        while len(features) < 25:
            features.append(0)
        
        return np.array(features[:25])
    
    def _calculate_condition_complexity(self, condition: str) -> float:
        """Calculate complexity score for a rule condition"""
        if not condition:
            return 0
        
        complexity = 0
        
        # Logical operators
        complexity += condition.count('&&') * 2
        complexity += condition.count('||') * 2
        complexity += condition.count('!') * 1
        
        # Comparison operators
        complexity += condition.count('==') * 1
        complexity += condition.count('!=') * 1
        complexity += condition.count('>=') * 1
        complexity += condition.count('<=') * 1
        complexity += condition.count('>') * 1
        complexity += condition.count('<') * 1
        
        # Regular expressions
        complexity += condition.count('regex') * 3
        complexity += condition.count('match') * 2
        
        # Function calls
        complexity += len(re.findall(r'\w+\(', condition)) * 2
        
        # Nested parentheses
        max_nesting = 0
        current_nesting = 0
        for char in condition:
            if char == '(':
                current_nesting += 1
                max_nesting = max(max_nesting, current_nesting)
            elif char == ')':
                current_nesting -= 1
        complexity += max_nesting * 1.5
        
        return complexity
    
    def get_policy_performance_data(self, policy_id: str, days: int = 30) -> Dict[str, Any]:
        """Get comprehensive performance data for a policy"""
        try:
            end_date = datetime.utcnow()
            start_date = end_date - timedelta(days=days)
            
            # Get agent metrics
            metrics = AgentMetrics.query.filter(
                AgentMetrics.timestamp >= start_date,
                AgentMetrics.timestamp <= end_date
            ).all()
            
            # Get violations
            violations = AgentViolation.query.filter(
                AgentViolation.timestamp >= start_date,
                AgentViolation.timestamp <= end_date
            ).all()
            
            # Get logs
            logs = AgentLog.query.filter(
                AgentLog.timestamp >= start_date,
                AgentLog.timestamp <= end_date
            ).all()
            
            # Calculate performance metrics
            total_evaluations = len(metrics)
            violation_count = len(violations)
            compliance_rate = (total_evaluations - violation_count) / max(total_evaluations, 1)
            
            # Trust score analysis
            trust_scores = [m.trust_score for m in metrics if m.trust_score is not None]
            avg_trust_score = np.mean(trust_scores) if trust_scores else 0
            trust_score_std = np.std(trust_scores) if trust_scores else 0
            
            # Performance trends
            daily_metrics = self._calculate_daily_trends(metrics, violations, start_date, end_date)
            
            # Violation analysis
            violation_types = Counter([v.violation_type for v in violations])
            violation_severities = Counter([v.severity for v in violations])
            
            # Response time analysis
            response_times = [m.response_time for m in metrics if m.response_time is not None]
            avg_response_time = np.mean(response_times) if response_times else 0
            
            # Effectiveness calculation
            effectiveness_score = self._calculate_effectiveness_score(
                compliance_rate, avg_trust_score, avg_response_time, violation_count
            )
            
            return {
                'total_evaluations': total_evaluations,
                'violation_count': violation_count,
                'compliance_rate': compliance_rate,
                'effectiveness_score': effectiveness_score,
                'avg_trust_score': avg_trust_score,
                'trust_score_std': trust_score_std,
                'avg_response_time': avg_response_time,
                'daily_trends': daily_metrics,
                'violation_types': dict(violation_types),
                'violation_severities': dict(violation_severities),
                'performance_grade': self._calculate_performance_grade(effectiveness_score)
            }
            
        except Exception as e:
            logging.error(f"Error getting policy performance data: {e}")
            return self._get_default_performance_data()
    
    def _calculate_daily_trends(self, metrics: List, violations: List, start_date: datetime, end_date: datetime) -> List[Dict]:
        """Calculate daily performance trends"""
        trends = []
        current_date = start_date
        
        while current_date <= end_date:
            day_start = current_date.replace(hour=0, minute=0, second=0, microsecond=0)
            day_end = day_start + timedelta(days=1)
            
            day_metrics = [m for m in metrics if day_start <= m.timestamp < day_end]
            day_violations = [v for v in violations if day_start <= v.timestamp < day_end]
            
            total_evals = len(day_metrics)
            violation_count = len(day_violations)
            compliance_rate = (total_evals - violation_count) / max(total_evals, 1) if total_evals > 0 else 1.0
            
            avg_trust = np.mean([m.trust_score for m in day_metrics if m.trust_score]) if day_metrics else 0
            avg_response_time = np.mean([m.response_time for m in day_metrics if m.response_time]) if day_metrics else 0
            
            trends.append({
                'date': current_date.isoformat(),
                'total_evaluations': total_evals,
                'violation_count': violation_count,
                'compliance_rate': compliance_rate,
                'avg_trust_score': avg_trust,
                'avg_response_time': avg_response_time
            })
            
            current_date += timedelta(days=1)
        
        return trends
    
    def _calculate_effectiveness_score(self, compliance_rate: float, avg_trust_score: float, 
                                     avg_response_time: float, violation_count: int) -> float:
        """Calculate comprehensive effectiveness score"""
        # Normalize trust score (0-100 to 0-1)
        normalized_trust = avg_trust_score / 100 if avg_trust_score > 0 else 0
        
        # Normalize response time (lower is better, cap at 5 seconds)
        normalized_response_time = max(0, 1 - (avg_response_time / 5000)) if avg_response_time > 0 else 1
        
        # Violation penalty (exponential decay)
        violation_penalty = np.exp(-violation_count / 10)
        
        # Weighted effectiveness score
        effectiveness = (
            compliance_rate * 0.4 +           # 40% compliance
            normalized_trust * 0.3 +          # 30% trust
            normalized_response_time * 0.2 +  # 20% performance
            violation_penalty * 0.1           # 10% violation penalty
        )
        
        return min(1.0, max(0.0, effectiveness))
    
    def _calculate_performance_grade(self, effectiveness_score: float) -> str:
        """Calculate letter grade for policy performance"""
        if effectiveness_score >= 0.9:
            return 'A+'
        elif effectiveness_score >= 0.85:
            return 'A'
        elif effectiveness_score >= 0.8:
            return 'A-'
        elif effectiveness_score >= 0.75:
            return 'B+'
        elif effectiveness_score >= 0.7:
            return 'B'
        elif effectiveness_score >= 0.65:
            return 'B-'
        elif effectiveness_score >= 0.6:
            return 'C+'
        elif effectiveness_score >= 0.55:
            return 'C'
        elif effectiveness_score >= 0.5:
            return 'C-'
        else:
            return 'F'
    
    def _get_default_performance_data(self) -> Dict[str, Any]:
        """Return default performance data when real data is unavailable"""
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
            'performance_grade': 'C'
        }
    
    def predict_policy_effectiveness(self, policy: Dict[str, Any]) -> Dict[str, Any]:
        """Predict effectiveness of a policy using ML"""
        try:
            features = self.extract_policy_features(policy)
            
            # Ensure model is trained
            if not hasattr(self.models['effectiveness'], 'feature_importances_'):
                self._train_effectiveness_model()
            
            # Make prediction
            effectiveness_pred = self.models['effectiveness'].predict(features.reshape(1, -1))[0]
            effectiveness_pred = max(0.0, min(1.0, effectiveness_pred))  # Clamp to [0, 1]
            
            # Get feature importance for explanation
            feature_names = self._get_feature_names()
            importance_scores = self.models['effectiveness'].feature_importances_
            
            # Top contributing factors
            feature_importance = list(zip(feature_names, importance_scores, features))
            feature_importance.sort(key=lambda x: abs(x[1]), reverse=True)
            top_factors = feature_importance[:5]
            
            # Confidence estimation based on model performance
            confidence = self.model_performance.get('effectiveness', {}).get('accuracy', 0.7)
            
            return {
                'predicted_effectiveness': effectiveness_pred,
                'confidence': confidence,
                'performance_grade': self._calculate_performance_grade(effectiveness_pred),
                'top_contributing_factors': [
                    {
                        'factor': factor[0],
                        'importance': factor[1],
                        'value': factor[2]
                    } for factor in top_factors
                ],
                'recommendations': self._generate_effectiveness_recommendations(policy, effectiveness_pred)
            }
            
        except Exception as e:
            logging.error(f"Error predicting policy effectiveness: {e}")
            return {
                'predicted_effectiveness': 0.5,
                'confidence': 0.5,
                'performance_grade': 'C',
                'top_contributing_factors': [],
                'recommendations': ['Unable to generate predictions - insufficient training data']
            }
    
    def detect_policy_conflicts(self, policies: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Detect conflicts between policies using ML and rule-based analysis"""
        conflicts = []
        
        try:
            # Rule-based conflict detection
            for i, policy1 in enumerate(policies):
                for j, policy2 in enumerate(policies[i+1:], i+1):
                    rule_conflicts = self._detect_rule_conflicts(policy1, policy2)
                    conflicts.extend(rule_conflicts)
            
            # ML-based conflict detection (if model is trained)
            if hasattr(self.models['conflict_detector'], 'classes_'):
                ml_conflicts = self._detect_ml_conflicts(policies)
                conflicts.extend(ml_conflicts)
            
            # Remove duplicates and rank by severity
            unique_conflicts = self._deduplicate_conflicts(conflicts)
            ranked_conflicts = sorted(unique_conflicts, key=lambda x: self._get_conflict_severity_score(x), reverse=True)
            
            return ranked_conflicts
            
        except Exception as e:
            logging.error(f"Error detecting policy conflicts: {e}")
            return []
    
    def _detect_rule_conflicts(self, policy1: Dict, policy2: Dict) -> List[Dict]:
        """Detect conflicts between rules in two policies"""
        conflicts = []
        
        rules1 = policy1.get('rules', [])
        rules2 = policy2.get('rules', [])
        
        for rule1 in rules1:
            for rule2 in rules2:
                conflict = self._analyze_rule_pair(rule1, rule2, policy1, policy2)
                if conflict:
                    conflicts.append(conflict)
        
        return conflicts
    
    def _analyze_rule_pair(self, rule1: Dict, rule2: Dict, policy1: Dict, policy2: Dict) -> Optional[Dict]:
        """Analyze a pair of rules for conflicts"""
        condition1 = rule1.get('condition', '').lower()
        condition2 = rule2.get('condition', '').lower()
        action1 = rule1.get('action', '')
        action2 = rule2.get('action', '')
        
        # Check for contradictory actions with similar conditions
        if self._conditions_overlap(condition1, condition2):
            if self._actions_conflict(action1, action2):
                return {
                    'type': 'contradiction',
                    'severity': 'high',
                    'policy1_id': policy1.get('policy_id', 'unknown'),
                    'policy2_id': policy2.get('policy_id', 'unknown'),
                    'rule1_id': rule1.get('rule_id', 'unknown'),
                    'rule2_id': rule2.get('rule_id', 'unknown'),
                    'description': f"Conflicting actions '{action1}' vs '{action2}' for similar conditions",
                    'resolution_suggestion': 'Review rule conditions and actions to ensure consistency'
                }
        
        # Check for redundancy
        if condition1 == condition2 and action1 == action2:
            return {
                'type': 'redundancy',
                'severity': 'medium',
                'policy1_id': policy1.get('policy_id', 'unknown'),
                'policy2_id': policy2.get('policy_id', 'unknown'),
                'rule1_id': rule1.get('rule_id', 'unknown'),
                'rule2_id': rule2.get('rule_id', 'unknown'),
                'description': 'Identical rules found in different policies',
                'resolution_suggestion': 'Consider consolidating duplicate rules'
            }
        
        return None
    
    def _conditions_overlap(self, condition1: str, condition2: str) -> bool:
        """Check if two conditions have significant overlap"""
        if not condition1 or not condition2:
            return False
        
        # Simple keyword overlap analysis
        words1 = set(re.findall(r'\w+', condition1))
        words2 = set(re.findall(r'\w+', condition2))
        
        if not words1 or not words2:
            return False
        
        overlap = len(words1.intersection(words2))
        total_unique = len(words1.union(words2))
        
        # Consider overlap if more than 50% of words are shared
        return overlap / total_unique > 0.5
    
    def _actions_conflict(self, action1: str, action2: str) -> bool:
        """Check if two actions are conflicting"""
        conflicting_pairs = [
            ('allow', 'deny'),
            ('allow', 'block'),
            ('permit', 'deny'),
            ('permit', 'block'),
            ('approve', 'reject')
        ]
        
        action1_lower = action1.lower()
        action2_lower = action2.lower()
        
        for pair in conflicting_pairs:
            if (action1_lower == pair[0] and action2_lower == pair[1]) or \
               (action1_lower == pair[1] and action2_lower == pair[0]):
                return True
        
        return False
    
    def _get_feature_names(self) -> List[str]:
        """Get feature names for interpretability"""
        return [
            'num_rules', 'name_length', 'description_length', 'category',
            'avg_condition_length', 'allow_actions', 'deny_actions', 'log_actions',
            'alert_actions', 'escalate_actions', 'avg_priority', 'priority_std',
            'priority_range', 'avg_condition_complexity', 'max_condition_complexity',
            'condition_complexity_std', 'num_tags', 'num_compliance_standards',
            'major_version', 'minor_version', 'status'
        ]
    
    def optimize_policy(self, policy: Dict[str, Any], optimization_goals: List[str] = None) -> Dict[str, Any]:
        """Generate optimization recommendations for a policy"""
        try:
            if optimization_goals is None:
                optimization_goals = ['effectiveness', 'performance', 'compliance']
            
            # Get current performance
            current_performance = self.get_policy_performance_data(policy.get('policy_id', ''))
            
            # Generate recommendations based on goals
            recommendations = []
            
            if 'effectiveness' in optimization_goals:
                effectiveness_recs = self._generate_effectiveness_optimizations(policy, current_performance)
                recommendations.extend(effectiveness_recs)
            
            if 'performance' in optimization_goals:
                performance_recs = self._generate_performance_optimizations(policy, current_performance)
                recommendations.extend(performance_recs)
            
            if 'compliance' in optimization_goals:
                compliance_recs = self._generate_compliance_optimizations(policy, current_performance)
                recommendations.extend(compliance_recs)
            
            # Rank recommendations by impact
            ranked_recommendations = sorted(recommendations, key=lambda x: x.get('impact_score', 0), reverse=True)
            
            # Predict improvement
            predicted_improvement = self._predict_optimization_improvement(policy, ranked_recommendations)
            
            return {
                'recommendations': ranked_recommendations[:10],  # Top 10 recommendations
                'predicted_improvement': predicted_improvement,
                'optimization_goals': optimization_goals,
                'current_performance': current_performance,
                'risk_assessment': self._assess_optimization_risk(ranked_recommendations)
            }
            
        except Exception as e:
            logging.error(f"Error optimizing policy: {e}")
            return {
                'recommendations': [],
                'predicted_improvement': 0.0,
                'optimization_goals': optimization_goals or [],
                'current_performance': self._get_default_performance_data(),
                'risk_assessment': 'unknown'
            }
    
    def _generate_effectiveness_optimizations(self, policy: Dict, performance: Dict) -> List[Dict]:
        """Generate effectiveness optimization recommendations"""
        recommendations = []
        
        effectiveness = performance.get('effectiveness_score', 0.5)
        compliance_rate = performance.get('compliance_rate', 1.0)
        violation_count = performance.get('violation_count', 0)
        
        # Low effectiveness recommendations
        if effectiveness < 0.7:
            recommendations.append({
                'type': 'rule_modification',
                'description': 'Consider tightening rule conditions to improve policy effectiveness',
                'impact_score': 0.8,
                'confidence': 0.7,
                'implementation_effort': 'medium',
                'details': 'Current effectiveness is below optimal threshold'
            })
        
        # High violation count
        if violation_count > 10:
            recommendations.append({
                'type': 'rule_addition',
                'description': 'Add preventive rules to reduce violation frequency',
                'impact_score': 0.9,
                'confidence': 0.8,
                'implementation_effort': 'high',
                'details': f'Current violation count: {violation_count}'
            })
        
        # Low compliance rate
        if compliance_rate < 0.8:
            recommendations.append({
                'type': 'priority_adjustment',
                'description': 'Adjust rule priorities to improve compliance enforcement',
                'impact_score': 0.6,
                'confidence': 0.6,
                'implementation_effort': 'low',
                'details': f'Current compliance rate: {compliance_rate:.1%}'
            })
        
        return recommendations
    
    def _generate_performance_optimizations(self, policy: Dict, performance: Dict) -> List[Dict]:
        """Generate performance optimization recommendations"""
        recommendations = []
        
        avg_response_time = performance.get('avg_response_time', 0)
        num_rules = len(policy.get('rules', []))
        
        # High response time
        if avg_response_time > 1000:  # > 1 second
            recommendations.append({
                'type': 'rule_optimization',
                'description': 'Optimize rule conditions to reduce evaluation time',
                'impact_score': 0.7,
                'confidence': 0.8,
                'implementation_effort': 'medium',
                'details': f'Current avg response time: {avg_response_time:.0f}ms'
            })
        
        # Too many rules
        if num_rules > 20:
            recommendations.append({
                'type': 'rule_consolidation',
                'description': 'Consolidate similar rules to improve performance',
                'impact_score': 0.6,
                'confidence': 0.7,
                'implementation_effort': 'high',
                'details': f'Current rule count: {num_rules}'
            })
        
        return recommendations
    
    def _generate_compliance_optimizations(self, policy: Dict, performance: Dict) -> List[Dict]:
        """Generate compliance optimization recommendations"""
        recommendations = []
        
        compliance_mappings = policy.get('metadata', {}).get('compliance_mappings', {})
        
        # Missing compliance mappings
        if not compliance_mappings:
            recommendations.append({
                'type': 'compliance_mapping',
                'description': 'Add compliance standard mappings to improve auditability',
                'impact_score': 0.5,
                'confidence': 0.9,
                'implementation_effort': 'low',
                'details': 'No compliance standards currently mapped'
            })
        
        # Incomplete documentation
        if not policy.get('description') or len(policy.get('description', '')) < 50:
            recommendations.append({
                'type': 'documentation',
                'description': 'Improve policy documentation for compliance requirements',
                'impact_score': 0.4,
                'confidence': 0.8,
                'implementation_effort': 'low',
                'details': 'Policy description is missing or insufficient'
            })
        
        return recommendations
    
    def _predict_optimization_improvement(self, policy: Dict, recommendations: List[Dict]) -> float:
        """Predict improvement from implementing recommendations"""
        if not recommendations:
            return 0.0
        
        # Simple heuristic based on recommendation impact scores
        total_impact = sum(rec.get('impact_score', 0) for rec in recommendations)
        avg_confidence = np.mean([rec.get('confidence', 0.5) for rec in recommendations])
        
        # Diminishing returns for multiple recommendations
        improvement = total_impact * avg_confidence * 0.1  # Scale down
        improvement = min(0.3, improvement)  # Cap at 30% improvement
        
        return improvement
    
    def _assess_optimization_risk(self, recommendations: List[Dict]) -> str:
        """Assess risk level of implementing optimization recommendations"""
        if not recommendations:
            return 'low'
        
        high_effort_count = sum(1 for rec in recommendations if rec.get('implementation_effort') == 'high')
        total_count = len(recommendations)
        
        if high_effort_count / total_count > 0.5:
            return 'high'
        elif high_effort_count > 0:
            return 'medium'
        else:
            return 'low'
    
    def _train_effectiveness_model(self):
        """Train the effectiveness prediction model with available data"""
        try:
            # This would be implemented with real training data
            # For now, create synthetic training data for demonstration
            logging.info("Training effectiveness model with synthetic data")
            
            # Generate synthetic training data
            X_train, y_train = self._generate_synthetic_training_data(1000)
            
            # Train the model
            self.models['effectiveness'].fit(X_train, y_train)
            
            # Evaluate model performance
            X_test, y_test = self._generate_synthetic_training_data(200)
            y_pred = self.models['effectiveness'].predict(X_test)
            
            # Calculate performance metrics
            mse = np.mean((y_test - y_pred) ** 2)
            r2 = self.models['effectiveness'].score(X_test, y_test)
            
            self.model_performance['effectiveness'] = {
                'mse': mse,
                'r2_score': r2,
                'accuracy': max(0.5, r2)  # Use R² as proxy for accuracy
            }
            
            # Save the trained model
            model_path = '/home/ubuntu/promethios/data/ml_models'
            os.makedirs(model_path, exist_ok=True)
            joblib.dump(self.models['effectiveness'], os.path.join(model_path, 'effectiveness_model.joblib'))
            
            logging.info(f"Effectiveness model trained successfully. R² score: {r2:.3f}")
            
        except Exception as e:
            logging.error(f"Error training effectiveness model: {e}")
    
    def _generate_synthetic_training_data(self, n_samples: int) -> Tuple[np.ndarray, np.ndarray]:
        """Generate synthetic training data for model training"""
        np.random.seed(42)
        
        # Generate random policy features
        X = np.random.rand(n_samples, 25)
        
        # Generate synthetic effectiveness scores based on features
        y = np.zeros(n_samples)
        
        for i in range(n_samples):
            # Simple heuristic for effectiveness based on features
            num_rules = X[i, 0] * 50  # Scale to realistic range
            complexity = X[i, 13]  # Condition complexity
            compliance_features = X[i, 16:18].sum()  # Compliance-related features
            
            # Calculate synthetic effectiveness
            effectiveness = 0.5  # Base effectiveness
            effectiveness += min(0.3, num_rules / 100)  # More rules can help (up to a point)
            effectiveness -= min(0.2, complexity / 10)  # High complexity reduces effectiveness
            effectiveness += min(0.2, compliance_features / 5)  # Compliance features help
            effectiveness += np.random.normal(0, 0.1)  # Add noise
            
            y[i] = max(0.0, min(1.0, effectiveness))  # Clamp to [0, 1]
        
        return X, y

# Global instance
policy_intelligence = PolicyIntelligenceEngine()

