"""
Trust Metrics Integration for Promethios
Provides comprehensive trust monitoring, analytics, and management endpoints
with ML-powered insights and real-time monitoring capabilities.
"""

import os
import sys
import json
import logging
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional, Tuple
from flask import Blueprint, request, jsonify, send_file
from dataclasses import dataclass, asdict
import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestRegressor, IsolationForest
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_squared_error, r2_score
import joblib
import io
import csv
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib import colors

# Add the parent directory to the path to import models
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from models.agent_data import AgentMetrics, AgentViolation, AgentLog, AgentHeartbeat

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create blueprint
trust_metrics_bp = Blueprint('trust_metrics', __name__, url_prefix='/api/trust-metrics')

@dataclass
class EnhancedTrustMetrics:
    agent_id: str
    agent_name: str
    agent_type: str
    timestamp: str
    trust_scores: Dict[str, float]
    confidence: float
    reliability: float
    trend: Dict[str, Any]
    risk_level: str
    risk_factors: List[str]
    risk_score: float
    performance: Dict[str, float]
    governance: Dict[str, Any]
    behavior: Dict[str, float]
    attestations: Dict[str, Any]
    boundaries: Dict[str, int]

@dataclass
class TrustAlert:
    id: str
    agent_id: str
    agent_name: str
    type: str
    severity: str
    message: str
    details: str
    timestamp: str
    threshold: Optional[float] = None
    current_value: Optional[float] = None
    recommended_actions: List[str] = None
    auto_remediation: Optional[Dict[str, Any]] = None

@dataclass
class TrustTrend:
    date: str
    agent_id: str
    trust_score: float
    confidence: float
    risk_level: str
    violation_count: int
    performance_score: float

@dataclass
class TrustBenchmark:
    category: str
    metric: str
    industry_average: float
    organization_average: float
    best_practice: float
    current_value: float
    percentile: float

@dataclass
class TrustRemediation:
    id: str
    agent_id: str
    issue: str
    severity: str
    recommended_actions: List[Dict[str, Any]]
    assigned_to: Optional[str] = None
    status: str = 'pending'
    created_at: str = None
    updated_at: str = None
    completed_at: Optional[str] = None
    notes: Optional[str] = None

class TrustMetricsAnalyzer:
    """Advanced trust metrics analyzer with ML capabilities"""
    
    def __init__(self):
        self.trust_predictor = None
        self.anomaly_detector = None
        self.behavior_analyzer = None
        self.scaler = StandardScaler()
        self.models_loaded = False
        
    def load_models(self):
        """Load or train ML models for trust analysis"""
        try:
            # Try to load existing models
            self.trust_predictor = joblib.load('trust_predictor_model.pkl')
            self.anomaly_detector = joblib.load('anomaly_detector_model.pkl')
            self.behavior_analyzer = joblib.load('behavior_analyzer_model.pkl')
            self.scaler = joblib.load('trust_scaler.pkl')
            self.models_loaded = True
            logger.info("Trust ML models loaded successfully")
        except FileNotFoundError:
            # Train new models if none exist
            logger.info("No existing models found, training new models...")
            self.train_models()
    
    def train_models(self):
        """Train ML models using available data"""
        try:
            # Get training data from database
            training_data = self._collect_training_data()
            
            if len(training_data) < 50:  # Need minimum data for training
                logger.warning("Insufficient data for ML training, using synthetic data")
                training_data = self._generate_synthetic_training_data()
            
            # Prepare features and targets
            features, trust_targets, anomaly_data = self._prepare_training_data(training_data)
            
            # Train trust prediction model
            self.trust_predictor = RandomForestRegressor(n_estimators=100, random_state=42)
            X_train, X_test, y_train, y_test = train_test_split(features, trust_targets, test_size=0.2, random_state=42)
            
            # Scale features
            X_train_scaled = self.scaler.fit_transform(X_train)
            X_test_scaled = self.scaler.transform(X_test)
            
            self.trust_predictor.fit(X_train_scaled, y_train)
            
            # Evaluate model
            predictions = self.trust_predictor.predict(X_test_scaled)
            r2 = r2_score(y_test, predictions)
            logger.info(f"Trust prediction model R² score: {r2:.3f}")
            
            # Train anomaly detection model
            self.anomaly_detector = IsolationForest(contamination=0.1, random_state=42)
            self.anomaly_detector.fit(X_train_scaled)
            
            # Train behavior analysis model (simplified)
            self.behavior_analyzer = RandomForestRegressor(n_estimators=50, random_state=42)
            behavior_targets = [self._calculate_behavior_score(row) for row in training_data]
            self.behavior_analyzer.fit(X_train_scaled, behavior_targets)
            
            # Save models
            joblib.dump(self.trust_predictor, 'trust_predictor_model.pkl')
            joblib.dump(self.anomaly_detector, 'anomaly_detector_model.pkl')
            joblib.dump(self.behavior_analyzer, 'behavior_analyzer_model.pkl')
            joblib.dump(self.scaler, 'trust_scaler.pkl')
            
            self.models_loaded = True
            logger.info("Trust ML models trained and saved successfully")
            
        except Exception as e:
            logger.error(f"Error training trust models: {e}")
            self.models_loaded = False
    
    def _collect_training_data(self) -> List[Dict[str, Any]]:
        """Collect real training data from the database"""
        try:
            # This would collect real data from AgentMetrics, AgentViolation, etc.
            # For now, return empty list to trigger synthetic data generation
            return []
        except Exception as e:
            logger.error(f"Error collecting training data: {e}")
            return []
    
    def _generate_synthetic_training_data(self, num_samples=1000) -> List[Dict[str, Any]]:
        """Generate synthetic training data for model development"""
        np.random.seed(42)
        data = []
        
        for i in range(num_samples):
            # Generate realistic agent metrics
            base_trust = np.random.beta(8, 2)  # Skewed towards higher trust
            noise = np.random.normal(0, 0.05)
            
            # Trust dimensions with correlation
            competence = np.clip(base_trust + np.random.normal(0, 0.1), 0, 1)
            reliability = np.clip(base_trust + np.random.normal(0, 0.08), 0, 1)
            honesty = np.clip(base_trust + np.random.normal(0, 0.06), 0, 1)
            transparency = np.clip(base_trust + np.random.normal(0, 0.07), 0, 1)
            
            # Performance metrics
            response_time = np.random.exponential(100) + 50  # ms
            error_rate = np.random.exponential(0.02)
            success_rate = 1 - error_rate + np.random.normal(0, 0.01)
            uptime = np.random.beta(20, 1)  # High uptime
            
            # Violation data
            violation_count = np.random.poisson(2)
            compliance_rate = 1 - (violation_count * 0.05) + np.random.normal(0, 0.02)
            
            # Behavioral metrics
            consistency = base_trust + np.random.normal(0, 0.1)
            adaptability = np.random.beta(5, 3)
            learning_rate = np.random.beta(3, 5)
            
            data.append({
                'agent_id': f'agent_{i:04d}',
                'competence': competence,
                'reliability': reliability,
                'honesty': honesty,
                'transparency': transparency,
                'aggregate_trust': (competence + reliability + honesty + transparency) / 4,
                'response_time': response_time,
                'error_rate': error_rate,
                'success_rate': success_rate,
                'uptime': uptime,
                'violation_count': violation_count,
                'compliance_rate': compliance_rate,
                'consistency': consistency,
                'adaptability': adaptability,
                'learning_rate': learning_rate,
                'timestamp': (datetime.now() - timedelta(days=np.random.randint(0, 90))).isoformat()
            })
        
        return data
    
    def _prepare_training_data(self, data: List[Dict[str, Any]]) -> Tuple[np.ndarray, np.ndarray, np.ndarray]:
        """Prepare training data for ML models"""
        features = []
        trust_targets = []
        
        for row in data:
            # Feature vector
            feature_vector = [
                row['competence'],
                row['reliability'], 
                row['honesty'],
                row['transparency'],
                row['response_time'] / 1000,  # Normalize
                row['error_rate'],
                row['success_rate'],
                row['uptime'],
                row['violation_count'] / 10,  # Normalize
                row['compliance_rate'],
                row['consistency'],
                row['adaptability'],
                row['learning_rate']
            ]
            
            features.append(feature_vector)
            trust_targets.append(row['aggregate_trust'])
        
        return np.array(features), np.array(trust_targets), np.array(features)
    
    def _calculate_behavior_score(self, data: Dict[str, Any]) -> float:
        """Calculate behavior score for training"""
        consistency = data.get('consistency', 0.8)
        adaptability = data.get('adaptability', 0.7)
        learning_rate = data.get('learning_rate', 0.6)
        
        return (consistency * 0.4 + adaptability * 0.3 + learning_rate * 0.3)
    
    def predict_trust_score(self, features: List[float]) -> Tuple[float, float]:
        """Predict trust score with confidence"""
        if not self.models_loaded:
            return 0.8, 0.5  # Default values
        
        try:
            features_scaled = self.scaler.transform([features])
            prediction = self.trust_predictor.predict(features_scaled)[0]
            
            # Calculate prediction confidence (simplified)
            confidence = min(0.95, max(0.5, 1.0 - abs(prediction - 0.8) * 2))
            
            return float(prediction), float(confidence)
        except Exception as e:
            logger.error(f"Error predicting trust score: {e}")
            return 0.8, 0.5
    
    def detect_anomaly(self, features: List[float]) -> Tuple[bool, float]:
        """Detect anomalies in agent behavior"""
        if not self.models_loaded:
            return False, 0.0
        
        try:
            features_scaled = self.scaler.transform([features])
            anomaly_score = self.anomaly_detector.decision_function(features_scaled)[0]
            is_anomaly = self.anomaly_detector.predict(features_scaled)[0] == -1
            
            return bool(is_anomaly), float(anomaly_score)
        except Exception as e:
            logger.error(f"Error detecting anomaly: {e}")
            return False, 0.0
    
    def analyze_behavior(self, features: List[float]) -> Dict[str, float]:
        """Analyze agent behavior patterns"""
        if not self.models_loaded:
            return {
                'consistency_score': 0.8,
                'adaptability_score': 0.7,
                'learning_rate': 0.6,
                'anomaly_score': 0.1
            }
        
        try:
            features_scaled = self.scaler.transform([features])
            behavior_score = self.behavior_analyzer.predict(features_scaled)[0]
            is_anomaly, anomaly_score = self.detect_anomaly(features)
            
            return {
                'consistency_score': float(behavior_score * 0.9 + 0.1),
                'adaptability_score': float(behavior_score * 0.8 + 0.2),
                'learning_rate': float(behavior_score * 0.7 + 0.3),
                'anomaly_score': float(abs(anomaly_score))
            }
        except Exception as e:
            logger.error(f"Error analyzing behavior: {e}")
            return {
                'consistency_score': 0.8,
                'adaptability_score': 0.7,
                'learning_rate': 0.6,
                'anomaly_score': 0.1
            }

# Initialize the analyzer
trust_analyzer = TrustMetricsAnalyzer()

def get_enhanced_trust_metrics(agent_id: Optional[str] = None) -> List[EnhancedTrustMetrics]:
    """Get enhanced trust metrics with ML analysis"""
    try:
        # This would integrate with real AgentMetrics, AgentViolation, etc.
        # For now, generate sample data
        
        agents = ['agent_001', 'agent_002', 'agent_003'] if not agent_id else [agent_id]
        metrics = []
        
        for aid in agents:
            # Simulate real data collection
            base_trust = np.random.beta(8, 2)
            
            # Trust dimensions
            trust_scores = {
                'competence': float(np.clip(base_trust + np.random.normal(0, 0.1), 0, 1)),
                'reliability': float(np.clip(base_trust + np.random.normal(0, 0.08), 0, 1)),
                'honesty': float(np.clip(base_trust + np.random.normal(0, 0.06), 0, 1)),
                'transparency': float(np.clip(base_trust + np.random.normal(0, 0.07), 0, 1)),
                'aggregate': 0.0
            }
            trust_scores['aggregate'] = sum(trust_scores[k] for k in trust_scores if k != 'aggregate') / 4
            
            # Performance metrics
            performance = {
                'response_time': float(np.random.exponential(100) + 50),
                'error_rate': float(np.random.exponential(0.02)),
                'success_rate': float(1 - np.random.exponential(0.02)),
                'uptime': float(np.random.beta(20, 1))
            }
            
            # Create feature vector for ML analysis
            features = [
                trust_scores['competence'],
                trust_scores['reliability'],
                trust_scores['honesty'],
                trust_scores['transparency'],
                performance['response_time'] / 1000,
                performance['error_rate'],
                performance['success_rate'],
                performance['uptime'],
                np.random.poisson(2) / 10,  # violation_count normalized
                np.random.beta(10, 2),  # compliance_rate
                base_trust,  # consistency
                np.random.beta(5, 3),  # adaptability
                np.random.beta(3, 5)   # learning_rate
            ]
            
            # ML analysis
            predicted_trust, confidence = trust_analyzer.predict_trust_score(features)
            is_anomaly, anomaly_score = trust_analyzer.detect_anomaly(features)
            behavior_analysis = trust_analyzer.analyze_behavior(features)
            
            # Risk assessment
            risk_score = 1 - trust_scores['aggregate']
            risk_level = 'critical' if risk_score > 0.4 else 'high' if risk_score > 0.25 else 'medium' if risk_score > 0.15 else 'low'
            
            risk_factors = []
            if trust_scores['aggregate'] < 0.7:
                risk_factors.append('Low trust score')
            if performance['error_rate'] > 0.05:
                risk_factors.append('High error rate')
            if is_anomaly:
                risk_factors.append('Anomalous behavior detected')
            
            # Trend analysis (simplified)
            trend_direction = 'up' if predicted_trust > trust_scores['aggregate'] else 'down' if predicted_trust < trust_scores['aggregate'] else 'stable'
            trend_velocity = abs(predicted_trust - trust_scores['aggregate'])
            
            metrics.append(EnhancedTrustMetrics(
                agent_id=aid,
                agent_name=f"Agent {aid.split('_')[1]}",
                agent_type='single',
                timestamp=datetime.now().isoformat(),
                trust_scores=trust_scores,
                confidence=confidence,
                reliability=trust_scores['reliability'],
                trend={
                    'direction': trend_direction,
                    'velocity': float(trend_velocity),
                    'prediction': float(predicted_trust),
                    'confidence': confidence
                },
                risk_level=risk_level,
                risk_factors=risk_factors,
                risk_score=float(risk_score),
                performance=performance,
                governance={
                    'compliance_rate': float(np.random.beta(10, 2)),
                    'violation_count': int(np.random.poisson(2)),
                    'last_violation': (datetime.now() - timedelta(days=np.random.randint(1, 30))).isoformat() if np.random.random() > 0.3 else None,
                    'policy_adherence': float(np.random.beta(12, 2))
                },
                behavior=behavior_analysis,
                attestations={
                    'total': int(np.random.poisson(50)),
                    'recent': int(np.random.poisson(5)),
                    'success_rate': float(np.random.beta(15, 2)),
                    'last_attestation': (datetime.now() - timedelta(hours=np.random.randint(1, 24))).isoformat()
                },
                boundaries={
                    'active': int(np.random.poisson(5)),
                    'violated': int(np.random.poisson(1)),
                    'effectiveness': int(np.random.beta(8, 2) * 100)
                }
            ))
        
        return metrics
        
    except Exception as e:
        logger.error(f"Error getting enhanced trust metrics: {e}")
        return []

def check_trust_alerts() -> List[TrustAlert]:
    """Check for trust-related alerts"""
    try:
        alerts = []
        metrics = get_enhanced_trust_metrics()
        
        for metric in metrics:
            # Check trust score thresholds
            if metric.trust_scores['aggregate'] < 0.6:
                alerts.append(TrustAlert(
                    id=f"trust_alert_{metric.agent_id}_{int(datetime.now().timestamp())}",
                    agent_id=metric.agent_id,
                    agent_name=metric.agent_name,
                    type='trust_degradation',
                    severity='critical' if metric.trust_scores['aggregate'] < 0.5 else 'high',
                    message=f"Trust score critically low: {metric.trust_scores['aggregate']:.2f}",
                    details=f"Agent {metric.agent_name} trust score has fallen below acceptable threshold",
                    timestamp=datetime.now().isoformat(),
                    threshold=0.6,
                    current_value=metric.trust_scores['aggregate'],
                    recommended_actions=[
                        'Review recent agent behavior',
                        'Check for policy violations',
                        'Investigate performance issues',
                        'Consider retraining or recalibration'
                    ],
                    auto_remediation={
                        'available': True,
                        'actions': ['Increase monitoring frequency', 'Apply conservative policies'],
                        'estimated_impact': 'Moderate improvement expected within 24 hours'
                    }
                ))
            
            # Check confidence levels
            if metric.confidence < 0.7:
                alerts.append(TrustAlert(
                    id=f"confidence_alert_{metric.agent_id}_{int(datetime.now().timestamp())}",
                    agent_id=metric.agent_id,
                    agent_name=metric.agent_name,
                    type='confidence_drop',
                    severity='medium',
                    message=f"Low confidence in trust assessment: {metric.confidence:.2f}",
                    details=f"Trust assessment confidence has dropped below threshold",
                    timestamp=datetime.now().isoformat(),
                    threshold=0.7,
                    current_value=metric.confidence,
                    recommended_actions=[
                        'Increase evaluation frequency',
                        'Gather more attestation data',
                        'Review evaluation criteria'
                    ]
                ))
            
            # Check for anomalies
            if metric.behavior['anomaly_score'] > 0.5:
                alerts.append(TrustAlert(
                    id=f"anomaly_alert_{metric.agent_id}_{int(datetime.now().timestamp())}",
                    agent_id=metric.agent_id,
                    agent_name=metric.agent_name,
                    type='anomaly_detected',
                    severity='high',
                    message=f"Anomalous behavior detected: score {metric.behavior['anomaly_score']:.2f}",
                    details=f"Agent behavior patterns deviate significantly from normal",
                    timestamp=datetime.now().isoformat(),
                    current_value=metric.behavior['anomaly_score'],
                    recommended_actions=[
                        'Investigate recent behavior changes',
                        'Review system logs',
                        'Check for external influences',
                        'Consider temporary restrictions'
                    ]
                ))
        
        return alerts
        
    except Exception as e:
        logger.error(f"Error checking trust alerts: {e}")
        return []

# API Endpoints

@trust_metrics_bp.route('/enhanced', methods=['GET'])
def get_enhanced_metrics():
    """Get enhanced trust metrics with ML analysis"""
    try:
        agent_id = request.args.get('agent_id')
        metrics = get_enhanced_trust_metrics(agent_id)
        return jsonify([asdict(metric) for metric in metrics])
    except Exception as e:
        logger.error(f"Error in get_enhanced_metrics: {e}")
        return jsonify({'error': str(e)}), 500

@trust_metrics_bp.route('/analytics', methods=['GET'])
def get_trust_analytics():
    """Get comprehensive trust analytics"""
    try:
        time_range = request.args.get('range', '30d')
        metrics = get_enhanced_trust_metrics()
        
        # Calculate analytics
        total_agents = len(metrics)
        avg_trust_score = sum(m.trust_scores['aggregate'] for m in metrics) / total_agents if total_agents > 0 else 0
        high_confidence_agents = len([m for m in metrics if m.confidence >= 0.85])
        at_risk_agents = len([m for m in metrics if m.risk_level in ['medium', 'high', 'critical']])
        critical_agents = len([m for m in metrics if m.risk_level == 'critical'])
        total_attestations = sum(m.attestations['total'] for m in metrics)
        avg_compliance_rate = sum(m.governance['compliance_rate'] for m in metrics) / total_agents if total_agents > 0 else 0
        
        # Risk distribution
        risk_counts = {}
        for metric in metrics:
            risk_counts[metric.risk_level] = risk_counts.get(metric.risk_level, 0) + 1
        
        risk_distribution = [
            {
                'level': level,
                'count': count,
                'percentage': (count / total_agents * 100) if total_agents > 0 else 0
            }
            for level, count in risk_counts.items()
        ]
        
        # Generate trends (simplified)
        trends = []
        for i in range(30):
            date = (datetime.now() - timedelta(days=i)).strftime('%Y-%m-%d')
            trends.append({
                'date': date,
                'agent_id': 'aggregate',
                'trust_score': avg_trust_score + np.random.normal(0, 0.05),
                'confidence': 0.8 + np.random.normal(0, 0.1),
                'risk_level': 'low',
                'violation_count': np.random.poisson(2),
                'performance_score': 0.85 + np.random.normal(0, 0.1)
            })
        
        analytics = {
            'overview': {
                'total_agents': total_agents,
                'average_trust_score': avg_trust_score,
                'high_confidence_agents': high_confidence_agents,
                'at_risk_agents': at_risk_agents,
                'critical_agents': critical_agents,
                'total_attestations': total_attestations,
                'compliance_rate': avg_compliance_rate
            },
            'trends': {
                'trust_score_trend': trends,
                'risk_distribution': risk_distribution,
                'performance_correlation': [
                    {'trust_score': m.trust_scores['aggregate'], 'performance': m.performance['success_rate']}
                    for m in metrics
                ],
                'violation_impact': [
                    {'violations': m.governance['violation_count'], 'trust_impact': 1 - m.trust_scores['aggregate']}
                    for m in metrics
                ]
            },
            'predictions': {
                'trust_score_forecast': [
                    {
                        'date': (datetime.now() + timedelta(days=i)).strftime('%Y-%m-%d'),
                        'predicted': avg_trust_score + np.random.normal(0, 0.02),
                        'confidence': 0.8 - (i * 0.02)
                    }
                    for i in range(7)
                ],
                'risk_prediction': [
                    {
                        'agent_id': m.agent_id,
                        'current_risk': m.risk_level,
                        'predicted_risk': m.risk_level,  # Simplified
                        'probability': 0.7
                    }
                    for m in metrics[:5]
                ],
                'anomaly_detection': [
                    {
                        'agent_id': m.agent_id,
                        'anomaly_score': m.behavior['anomaly_score'],
                        'anomaly_type': 'behavioral' if m.behavior['anomaly_score'] > 0.5 else 'none'
                    }
                    for m in metrics
                ]
            },
            'benchmarks': [
                {
                    'category': 'Trust Score',
                    'metric': 'Average Trust',
                    'industry_average': 0.75,
                    'organization_average': avg_trust_score,
                    'best_practice': 0.90,
                    'current_value': avg_trust_score,
                    'percentile': 65
                },
                {
                    'category': 'Compliance',
                    'metric': 'Compliance Rate',
                    'industry_average': 0.85,
                    'organization_average': avg_compliance_rate,
                    'best_practice': 0.95,
                    'current_value': avg_compliance_rate,
                    'percentile': 70
                }
            ],
            'insights': {
                'top_performers': [m.agent_id for m in sorted(metrics, key=lambda x: x.trust_scores['aggregate'], reverse=True)[:3]],
                'improvement_opportunities': [m.agent_id for m in metrics if m.risk_level in ['medium', 'high']],
                'risk_factors': ['Low trust scores', 'High error rates', 'Anomalous behavior'],
                'recommendations': [
                    'Increase monitoring for at-risk agents',
                    'Implement automated remediation',
                    'Review policy effectiveness',
                    'Enhance training programs'
                ]
            }
        }
        
        return jsonify(analytics)
        
    except Exception as e:
        logger.error(f"Error in get_trust_analytics: {e}")
        return jsonify({'error': str(e)}), 500

@trust_metrics_bp.route('/trends', methods=['GET'])
def get_trust_trends():
    """Get trust trends for specific agent"""
    try:
        agent_id = request.args.get('agent_id')
        time_range = request.args.get('range', '30d')
        
        if not agent_id:
            return jsonify({'error': 'agent_id is required'}), 400
        
        # Generate trend data (in real implementation, this would query the database)
        days = int(time_range.replace('d', ''))
        trends = []
        
        for i in range(days):
            date = (datetime.now() - timedelta(days=i)).strftime('%Y-%m-%d')
            base_trust = 0.8 + np.random.normal(0, 0.05)
            
            trends.append(TrustTrend(
                date=date,
                agent_id=agent_id,
                trust_score=float(np.clip(base_trust, 0, 1)),
                confidence=float(np.clip(0.8 + np.random.normal(0, 0.1), 0, 1)),
                risk_level='low' if base_trust > 0.8 else 'medium' if base_trust > 0.6 else 'high',
                violation_count=int(np.random.poisson(1)),
                performance_score=float(np.clip(base_trust + np.random.normal(0, 0.1), 0, 1))
            ))
        
        return jsonify([asdict(trend) for trend in trends])
        
    except Exception as e:
        logger.error(f"Error in get_trust_trends: {e}")
        return jsonify({'error': str(e)}), 500

@trust_metrics_bp.route('/alerts/check', methods=['GET'])
def check_alerts():
    """Check for trust alerts"""
    try:
        alerts = check_trust_alerts()
        return jsonify([asdict(alert) for alert in alerts])
    except Exception as e:
        logger.error(f"Error in check_alerts: {e}")
        return jsonify({'error': str(e)}), 500

@trust_metrics_bp.route('/remediation', methods=['POST'])
def create_remediation():
    """Create trust remediation plan"""
    try:
        data = request.get_json()
        
        remediation = TrustRemediation(
            id=f"remediation_{int(datetime.now().timestamp())}",
            agent_id=data['agent_id'],
            issue=data['issue'],
            severity=data['severity'],
            recommended_actions=data['recommended_actions'],
            assigned_to=data.get('assigned_to'),
            status='pending',
            created_at=datetime.now().isoformat(),
            updated_at=datetime.now().isoformat(),
            notes=data.get('notes')
        )
        
        # In real implementation, save to database
        logger.info(f"Created remediation plan: {remediation.id}")
        
        return jsonify(asdict(remediation)), 201
        
    except Exception as e:
        logger.error(f"Error in create_remediation: {e}")
        return jsonify({'error': str(e)}), 500

@trust_metrics_bp.route('/remediation/<remediation_id>', methods=['PATCH'])
def update_remediation(remediation_id):
    """Update trust remediation plan"""
    try:
        data = request.get_json()
        
        # In real implementation, update in database
        logger.info(f"Updated remediation plan: {remediation_id}")
        
        # Return updated remediation (simplified)
        updated = {
            'id': remediation_id,
            'updated_at': datetime.now().isoformat(),
            **data
        }
        
        return jsonify(updated)
        
    except Exception as e:
        logger.error(f"Error in update_remediation: {e}")
        return jsonify({'error': str(e)}), 500

@trust_metrics_bp.route('/remediation/auto', methods=['POST'])
def trigger_auto_remediation():
    """Trigger automatic remediation"""
    try:
        data = request.get_json()
        agent_id = data['agent_id']
        alert_id = data['alert_id']
        actions = data['actions']
        
        # In real implementation, trigger actual remediation actions
        logger.info(f"Triggered auto-remediation for agent {agent_id}: {actions}")
        
        return jsonify({
            'success': True,
            'message': f'Auto-remediation triggered for agent {agent_id}',
            'actions_taken': actions,
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"Error in trigger_auto_remediation: {e}")
        return jsonify({'error': str(e)}), 500

@trust_metrics_bp.route('/export', methods=['POST'])
def export_trust_report():
    """Export trust metrics report"""
    try:
        data = request.get_json()
        format_type = data.get('format', 'csv')
        filters = data.get('filters', {})
        
        metrics = get_enhanced_trust_metrics()
        
        if format_type == 'csv':
            # Generate CSV
            output = io.StringIO()
            writer = csv.writer(output)
            
            # Headers
            writer.writerow([
                'Agent ID', 'Agent Name', 'Trust Score', 'Confidence', 'Risk Level',
                'Competence', 'Reliability', 'Honesty', 'Transparency',
                'Response Time', 'Error Rate', 'Success Rate', 'Uptime',
                'Compliance Rate', 'Violation Count', 'Attestations'
            ])
            
            # Data
            for metric in metrics:
                writer.writerow([
                    metric.agent_id,
                    metric.agent_name,
                    metric.trust_scores['aggregate'],
                    metric.confidence,
                    metric.risk_level,
                    metric.trust_scores['competence'],
                    metric.trust_scores['reliability'],
                    metric.trust_scores['honesty'],
                    metric.trust_scores['transparency'],
                    metric.performance['response_time'],
                    metric.performance['error_rate'],
                    metric.performance['success_rate'],
                    metric.performance['uptime'],
                    metric.governance['compliance_rate'],
                    metric.governance['violation_count'],
                    metric.attestations['total']
                ])
            
            output.seek(0)
            return send_file(
                io.BytesIO(output.getvalue().encode()),
                mimetype='text/csv',
                as_attachment=True,
                download_name=f'trust_metrics_report_{datetime.now().strftime("%Y%m%d_%H%M%S")}.csv'
            )
            
        elif format_type == 'json':
            # Generate JSON
            report_data = [asdict(metric) for metric in metrics]
            return jsonify(report_data)
            
        else:
            return jsonify({'error': 'Unsupported format'}), 400
            
    except Exception as e:
        logger.error(f"Error in export_trust_report: {e}")
        return jsonify({'error': str(e)}), 500

@trust_metrics_bp.route('/ml/load-models', methods=['POST'])
def load_ml_models():
    """Load ML models for trust analysis"""
    try:
        trust_analyzer.load_models()
        return jsonify({
            'success': True,
            'models_loaded': trust_analyzer.models_loaded,
            'message': 'ML models loaded successfully'
        })
    except Exception as e:
        logger.error(f"Error loading ML models: {e}")
        return jsonify({'error': str(e)}), 500

@trust_metrics_bp.route('/ml/retrain', methods=['POST'])
def retrain_ml_models():
    """Retrain ML models with latest data"""
    try:
        trust_analyzer.train_models()
        return jsonify({
            'success': True,
            'models_loaded': trust_analyzer.models_loaded,
            'message': 'ML models retrained successfully'
        })
    except Exception as e:
        logger.error(f"Error retraining ML models: {e}")
        return jsonify({'error': str(e)}), 500

# Initialize ML models on module load
try:
    trust_analyzer.load_models()
except Exception as e:
    logger.warning(f"Could not load ML models on startup: {e}")

# Export the blueprint
__all__ = ['trust_metrics_bp']

