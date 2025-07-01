"""
Advanced Policy Enhancement API Routes
Provides NLP policy creation, ML optimization, simulation, and analytics
"""

from flask import Blueprint, request, jsonify
from datetime import datetime, timedelta
import json
import re
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.cluster import KMeans
from sklearn.metrics.pairwise import cosine_similarity
import openai
import os
from src.models.agent_data import db, AgentMetrics, AgentViolation, AgentLog, AgentHeartbeat
from functools import wraps

policy_enhancement_bp = Blueprint('policy_enhancement', __name__)

# API Key validation decorator (reuse from agent_metrics)
def require_api_key(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        api_key = request.headers.get('X-API-Key')
        if not api_key:
            return jsonify({'error': 'API key required'}), 401
        
        if not api_key.startswith('promethios_'):
            return jsonify({'error': 'Invalid API key'}), 401
        
        return f(*args, **kwargs)
    return decorated_function

class PolicyOptimizationEngine:
    """
    ML-powered policy optimization using real violation and compliance data
    """
    
    def __init__(self):
        self.violation_patterns = None
        self.compliance_trends = None
        self.effectiveness_model = None
    
    def analyze_violation_patterns(self, user_id=None):
        """Analyze violation patterns from real data"""
        try:
            # Get violation data from database
            query = AgentViolation.query
            if user_id:
                query = query.filter_by(user_id=user_id)
            
            violations = query.all()
            
            if not violations:
                return {
                    'patterns': [],
                    'recommendations': ['No violation data available for analysis'],
                    'risk_factors': []
                }
            
            # Extract violation features
            violation_data = []
            for v in violations:
                violation_data.append({
                    'type': v.violation_type,
                    'severity': v.severity,
                    'policy_id': v.policy_id or 'unknown',
                    'description': v.description,
                    'timestamp': v.timestamp,
                    'context': json.loads(v.context) if v.context else {}
                })
            
            # Analyze patterns
            patterns = self._identify_violation_patterns(violation_data)
            recommendations = self._generate_optimization_recommendations(patterns, violation_data)
            risk_factors = self._identify_risk_factors(violation_data)
            
            return {
                'patterns': patterns,
                'recommendations': recommendations,
                'risk_factors': risk_factors,
                'total_violations': len(violations),
                'analysis_date': datetime.utcnow().isoformat()
            }
            
        except Exception as e:
            print(f"Error analyzing violation patterns: {e}")
            return {
                'patterns': [],
                'recommendations': [f'Analysis error: {str(e)}'],
                'risk_factors': []
            }
    
    def _identify_violation_patterns(self, violation_data):
        """Identify patterns in violation data using ML clustering"""
        if len(violation_data) < 3:
            return []
        
        try:
            # Create feature vectors from violation descriptions
            descriptions = [v['description'] for v in violation_data]
            vectorizer = TfidfVectorizer(max_features=100, stop_words='english')
            features = vectorizer.fit_transform(descriptions)
            
            # Cluster violations to find patterns
            n_clusters = min(5, len(violation_data) // 2)
            if n_clusters < 2:
                return []
            
            kmeans = KMeans(n_clusters=n_clusters, random_state=42)
            clusters = kmeans.fit_predict(features)
            
            # Analyze clusters to identify patterns
            patterns = []
            for i in range(n_clusters):
                cluster_violations = [v for j, v in enumerate(violation_data) if clusters[j] == i]
                if len(cluster_violations) >= 2:
                    pattern = self._analyze_cluster_pattern(cluster_violations)
                    if pattern:
                        patterns.append(pattern)
            
            return patterns
            
        except Exception as e:
            print(f"Error in pattern identification: {e}")
            return []
    
    def _analyze_cluster_pattern(self, cluster_violations):
        """Analyze a cluster of violations to identify the pattern"""
        if not cluster_violations:
            return None
        
        # Count violation types and severities
        types = {}
        severities = {}
        policies = {}
        
        for v in cluster_violations:
            types[v['type']] = types.get(v['type'], 0) + 1
            severities[v['severity']] = severities.get(v['severity'], 0) + 1
            if v['policy_id'] != 'unknown':
                policies[v['policy_id']] = policies.get(v['policy_id'], 0) + 1
        
        # Find dominant characteristics
        dominant_type = max(types.items(), key=lambda x: x[1])[0] if types else 'unknown'
        dominant_severity = max(severities.items(), key=lambda x: x[1])[0] if severities else 'unknown'
        
        return {
            'pattern_id': f"pattern_{dominant_type}_{len(cluster_violations)}",
            'violation_count': len(cluster_violations),
            'dominant_type': dominant_type,
            'dominant_severity': dominant_severity,
            'affected_policies': list(policies.keys()),
            'frequency': len(cluster_violations),
            'description': f"Recurring {dominant_type} violations with {dominant_severity} severity"
        }
    
    def _generate_optimization_recommendations(self, patterns, violation_data):
        """Generate policy optimization recommendations based on patterns"""
        recommendations = []
        
        # Analyze overall violation trends
        if not violation_data:
            return ['No violation data available for recommendations']
        
        # Severity-based recommendations
        severity_counts = {}
        for v in violation_data:
            severity_counts[v['severity']] = severity_counts.get(v['severity'], 0) + 1
        
        total_violations = len(violation_data)
        critical_ratio = severity_counts.get('critical', 0) / total_violations
        high_ratio = severity_counts.get('high', 0) / total_violations
        
        if critical_ratio > 0.1:
            recommendations.append({
                'type': 'severity_optimization',
                'priority': 'high',
                'title': 'Reduce Critical Violations',
                'description': f'{critical_ratio:.1%} of violations are critical. Consider stricter preventive policies.',
                'suggested_action': 'Implement proactive monitoring rules with lower thresholds',
                'impact_score': 0.9
            })
        
        if high_ratio > 0.2:
            recommendations.append({
                'type': 'severity_optimization',
                'priority': 'medium',
                'title': 'Address High-Severity Patterns',
                'description': f'{high_ratio:.1%} of violations are high severity. Review policy enforcement.',
                'suggested_action': 'Strengthen policy rules and add early warning systems',
                'impact_score': 0.7
            })
        
        # Pattern-based recommendations
        for pattern in patterns:
            if pattern['frequency'] >= 3:
                recommendations.append({
                    'type': 'pattern_optimization',
                    'priority': 'medium',
                    'title': f'Address {pattern["dominant_type"]} Pattern',
                    'description': f'Detected {pattern["frequency"]} similar {pattern["dominant_type"]} violations',
                    'suggested_action': f'Create specific policy rule to prevent {pattern["dominant_type"]} violations',
                    'impact_score': min(0.8, pattern['frequency'] / total_violations)
                })
        
        # Time-based recommendations
        recent_violations = [v for v in violation_data 
                           if (datetime.utcnow() - v['timestamp']).days <= 7]
        if len(recent_violations) > len(violation_data) * 0.3:
            recommendations.append({
                'type': 'temporal_optimization',
                'priority': 'high',
                'title': 'Recent Violation Spike',
                'description': f'{len(recent_violations)} violations in the past week',
                'suggested_action': 'Review recent policy changes and agent deployments',
                'impact_score': 0.8
            })
        
        return recommendations
    
    def _identify_risk_factors(self, violation_data):
        """Identify risk factors from violation data"""
        risk_factors = []
        
        if not violation_data:
            return risk_factors
        
        # Agent-based risk factors
        agent_violations = {}
        for v in violation_data:
            agent_id = v.get('agent_id', 'unknown')
            agent_violations[agent_id] = agent_violations.get(agent_id, 0) + 1
        
        # Identify high-risk agents
        total_violations = len(violation_data)
        for agent_id, count in agent_violations.items():
            if count > total_violations * 0.2:  # Agent responsible for >20% of violations
                risk_factors.append({
                    'type': 'agent_risk',
                    'factor': f'Agent {agent_id}',
                    'description': f'Responsible for {count} violations ({count/total_violations:.1%})',
                    'risk_level': 'high' if count > total_violations * 0.3 else 'medium'
                })
        
        # Policy-based risk factors
        policy_violations = {}
        for v in violation_data:
            policy_id = v.get('policy_id', 'unknown')
            if policy_id != 'unknown':
                policy_violations[policy_id] = policy_violations.get(policy_id, 0) + 1
        
        for policy_id, count in policy_violations.items():
            if count > total_violations * 0.15:  # Policy involved in >15% of violations
                risk_factors.append({
                    'type': 'policy_risk',
                    'factor': f'Policy {policy_id}',
                    'description': f'Involved in {count} violations ({count/total_violations:.1%})',
                    'risk_level': 'high' if count > total_violations * 0.25 else 'medium'
                })
        
        return risk_factors

class NaturalLanguagePolicyProcessor:
    """
    Natural language processing for policy creation using real NLP
    """
    
    def __init__(self):
        # Initialize OpenAI if API key is available
        self.openai_available = bool(os.getenv('OPENAI_API_KEY'))
        if self.openai_available:
            openai.api_key = os.getenv('OPENAI_API_KEY')
    
    def process_natural_language_policy(self, description, context=None):
        """Convert natural language description to policy rules"""
        try:
            if self.openai_available:
                return self._process_with_openai(description, context)
            else:
                return self._process_with_rule_patterns(description, context)
        except Exception as e:
            print(f"Error processing natural language policy: {e}")
            return {
                'success': False,
                'error': str(e),
                'suggested_rules': []
            }
    
    def _process_with_openai(self, description, context):
        """Use OpenAI API for natural language processing"""
        try:
            prompt = self._build_policy_prompt(description, context)
            
            response = openai.ChatCompletion.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": "You are a policy expert that converts natural language descriptions into structured policy rules."},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=1000,
                temperature=0.3
            )
            
            result = response.choices[0].message.content
            return self._parse_openai_response(result)
            
        except Exception as e:
            print(f"OpenAI processing error: {e}")
            return self._process_with_rule_patterns(description, context)
    
    def _process_with_rule_patterns(self, description, context):
        """Process using pattern matching and rule templates"""
        rules = []
        description_lower = description.lower()
        
        # Trust score patterns
        trust_patterns = [
            (r'trust.*score.*below.*(\d+)', 'trust_threshold', 'deny'),
            (r'trust.*(\d+).*percent', 'trust_threshold', 'warn'),
            (r'minimum.*trust.*(\d+)', 'trust_threshold', 'deny'),
            (r'require.*trust.*(\d+)', 'trust_threshold', 'deny')
        ]
        
        for pattern, rule_type, action in trust_patterns:
            match = re.search(pattern, description_lower)
            if match:
                threshold = int(match.group(1))
                rules.append({
                    'name': f'Trust Score Requirement',
                    'type': rule_type,
                    'condition': f'trust_score < {threshold}',
                    'action': action,
                    'parameters': {'threshold': threshold},
                    'confidence': 0.8
                })
        
        # Content filtering patterns
        content_patterns = [
            (r'block.*pii|prevent.*personal.*information', 'content_filter', 'deny'),
            (r'filter.*profanity|block.*inappropriate', 'content_filter', 'deny'),
            (r'no.*financial.*advice', 'content_filter', 'warn'),
            (r'medical.*disclaimer', 'content_filter', 'warn')
        ]
        
        for pattern, rule_type, action in content_patterns:
            if re.search(pattern, description_lower):
                rules.append({
                    'name': f'Content Filter Rule',
                    'type': rule_type,
                    'condition': 'content_contains_restricted_terms',
                    'action': action,
                    'parameters': {'filter_type': 'content_safety'},
                    'confidence': 0.7
                })
        
        # Rate limiting patterns
        rate_patterns = [
            (r'limit.*(\d+).*requests.*per.*minute', 'rate_limit', 'throttle'),
            (r'maximum.*(\d+).*calls.*per.*hour', 'rate_limit', 'throttle'),
            (r'throttle.*(\d+).*per.*second', 'rate_limit', 'throttle')
        ]
        
        for pattern, rule_type, action in rate_patterns:
            match = re.search(pattern, description_lower)
            if match:
                limit = int(match.group(1))
                rules.append({
                    'name': f'Rate Limiting Rule',
                    'type': rule_type,
                    'condition': f'request_rate > {limit}',
                    'action': action,
                    'parameters': {'limit': limit, 'window': 'minute'},
                    'confidence': 0.9
                })
        
        # Data retention patterns
        retention_patterns = [
            (r'delete.*data.*after.*(\d+).*days', 'data_retention', 'log'),
            (r'retain.*logs.*(\d+).*hours', 'data_retention', 'log'),
            (r'purge.*after.*(\d+).*weeks', 'data_retention', 'log')
        ]
        
        for pattern, rule_type, action in retention_patterns:
            match = re.search(pattern, description_lower)
            if match:
                period = int(match.group(1))
                rules.append({
                    'name': f'Data Retention Rule',
                    'type': rule_type,
                    'condition': f'data_age > {period}',
                    'action': action,
                    'parameters': {'retention_period': period},
                    'confidence': 0.8
                })
        
        return {
            'success': True,
            'suggested_rules': rules,
            'processing_method': 'pattern_matching',
            'confidence_score': sum(r.get('confidence', 0.5) for r in rules) / len(rules) if rules else 0.0
        }
    
    def _build_policy_prompt(self, description, context):
        """Build prompt for OpenAI API"""
        prompt = f"""
Convert this natural language policy description into structured policy rules:

Description: {description}

Context: {context or 'General policy creation'}

Please provide a JSON response with the following structure:
{{
    "suggested_rules": [
        {{
            "name": "Rule Name",
            "type": "trust_threshold|content_filter|rate_limit|data_retention|audit_requirement",
            "condition": "condition expression",
            "action": "allow|deny|warn|escalate|log|throttle",
            "parameters": {{}},
            "confidence": 0.0-1.0
        }}
    ],
    "policy_category": "financial|healthcare|legal|general|security|compliance",
    "compliance_level": "lenient|standard|strict|enterprise"
}}

Focus on creating practical, enforceable rules that match the intent of the description.
"""
        return prompt
    
    def _parse_openai_response(self, response):
        """Parse OpenAI response into structured format"""
        try:
            # Try to extract JSON from the response
            json_start = response.find('{')
            json_end = response.rfind('}') + 1
            
            if json_start >= 0 and json_end > json_start:
                json_str = response[json_start:json_end]
                parsed = json.loads(json_str)
                
                return {
                    'success': True,
                    'suggested_rules': parsed.get('suggested_rules', []),
                    'policy_category': parsed.get('policy_category', 'general'),
                    'compliance_level': parsed.get('compliance_level', 'standard'),
                    'processing_method': 'openai_gpt',
                    'confidence_score': 0.9
                }
            else:
                # Fallback to pattern matching if JSON parsing fails
                return self._process_with_rule_patterns(response, None)
                
        except json.JSONDecodeError:
            # Fallback to pattern matching
            return self._process_with_rule_patterns(response, None)

class PolicySimulationEngine:
    """
    Policy simulation using real agent data and logs
    """
    
    def simulate_policy_impact(self, policy_rules, agent_id=None, time_range_days=30):
        """Simulate policy impact using real historical data"""
        try:
            # Get historical agent logs and metrics
            end_date = datetime.utcnow()
            start_date = end_date - timedelta(days=time_range_days)
            
            # Get agent logs for simulation
            logs_query = AgentLog.query.filter(
                AgentLog.timestamp >= start_date,
                AgentLog.timestamp <= end_date
            )
            if agent_id:
                logs_query = logs_query.filter_by(agent_id=agent_id)
            
            logs = logs_query.all()
            
            # Get agent metrics for baseline
            metrics_query = AgentMetrics.query.filter(
                AgentMetrics.timestamp >= start_date,
                AgentMetrics.timestamp <= end_date
            )
            if agent_id:
                metrics_query = metrics_query.filter_by(agent_id=agent_id)
            
            metrics = metrics_query.all()
            
            if not logs and not metrics:
                return {
                    'success': False,
                    'error': 'No historical data available for simulation',
                    'simulation_results': {}
                }
            
            # Run simulation
            simulation_results = self._run_policy_simulation(policy_rules, logs, metrics)
            
            return {
                'success': True,
                'simulation_results': simulation_results,
                'data_points_analyzed': len(logs) + len(metrics),
                'time_range': {
                    'start': start_date.isoformat(),
                    'end': end_date.isoformat(),
                    'days': time_range_days
                }
            }
            
        except Exception as e:
            print(f"Error in policy simulation: {e}")
            return {
                'success': False,
                'error': str(e),
                'simulation_results': {}
            }
    
    def _run_policy_simulation(self, policy_rules, logs, metrics):
        """Run the actual policy simulation"""
        results = {
            'total_events': len(logs),
            'policy_triggers': 0,
            'would_be_violations': 0,
            'prevented_violations': 0,
            'performance_impact': {},
            'rule_effectiveness': {},
            'recommendations': []
        }
        
        # Simulate each rule against historical data
        for rule in policy_rules:
            rule_results = self._simulate_rule(rule, logs, metrics)
            results['rule_effectiveness'][rule.get('name', 'unnamed_rule')] = rule_results
            results['policy_triggers'] += rule_results.get('triggers', 0)
        
        # Calculate overall impact
        results['trigger_rate'] = results['policy_triggers'] / max(len(logs), 1)
        results['effectiveness_score'] = self._calculate_effectiveness_score(results)
        
        # Generate recommendations
        results['recommendations'] = self._generate_simulation_recommendations(results, policy_rules)
        
        return results
    
    def _simulate_rule(self, rule, logs, metrics):
        """Simulate a single rule against historical data"""
        rule_type = rule.get('type', 'unknown')
        condition = rule.get('condition', '')
        parameters = rule.get('parameters', {})
        
        triggers = 0
        false_positives = 0
        
        # Simulate based on rule type
        if rule_type == 'trust_threshold':
            threshold = parameters.get('threshold', 50)
            for metric in metrics:
                if metric.trust_score < threshold:
                    triggers += 1
        
        elif rule_type == 'rate_limit':
            limit = parameters.get('limit', 100)
            window = parameters.get('window', 'minute')
            # Group logs by time window and count
            time_groups = {}
            for log in logs:
                time_key = log.timestamp.replace(second=0, microsecond=0)
                if window == 'hour':
                    time_key = time_key.replace(minute=0)
                time_groups[time_key] = time_groups.get(time_key, 0) + 1
            
            for count in time_groups.values():
                if count > limit:
                    triggers += 1
        
        elif rule_type == 'content_filter':
            # Simulate content filtering on log messages
            for log in logs:
                if self._would_trigger_content_filter(log.message, parameters):
                    triggers += 1
        
        return {
            'triggers': triggers,
            'false_positives': false_positives,
            'effectiveness': max(0, (triggers - false_positives) / max(triggers, 1))
        }
    
    def _would_trigger_content_filter(self, message, parameters):
        """Simulate content filter trigger"""
        filter_type = parameters.get('filter_type', 'content_safety')
        
        if filter_type == 'content_safety':
            # Simple keyword-based simulation
            restricted_terms = ['password', 'ssn', 'credit card', 'personal information']
            return any(term in message.lower() for term in restricted_terms)
        
        return False
    
    def _calculate_effectiveness_score(self, results):
        """Calculate overall policy effectiveness score"""
        if results['total_events'] == 0:
            return 0.0
        
        # Balance between catching violations and not being too restrictive
        trigger_rate = results['trigger_rate']
        
        # Optimal trigger rate is around 5-15% (catches issues without being too restrictive)
        if 0.05 <= trigger_rate <= 0.15:
            return 0.9
        elif 0.02 <= trigger_rate <= 0.25:
            return 0.7
        elif trigger_rate < 0.02:
            return 0.4  # Too lenient
        else:
            return 0.3  # Too restrictive
    
    def _generate_simulation_recommendations(self, results, policy_rules):
        """Generate recommendations based on simulation results"""
        recommendations = []
        
        trigger_rate = results.get('trigger_rate', 0)
        
        if trigger_rate > 0.3:
            recommendations.append({
                'type': 'adjustment',
                'priority': 'high',
                'message': 'Policy may be too restrictive - consider relaxing thresholds',
                'suggested_action': 'Increase thresholds by 10-20%'
            })
        elif trigger_rate < 0.02:
            recommendations.append({
                'type': 'adjustment',
                'priority': 'medium',
                'message': 'Policy may be too lenient - consider stricter enforcement',
                'suggested_action': 'Decrease thresholds by 10-15%'
            })
        
        # Rule-specific recommendations
        for rule_name, rule_results in results.get('rule_effectiveness', {}).items():
            effectiveness = rule_results.get('effectiveness', 0)
            if effectiveness < 0.3:
                recommendations.append({
                    'type': 'rule_optimization',
                    'priority': 'medium',
                    'message': f'Rule "{rule_name}" has low effectiveness',
                    'suggested_action': 'Review rule parameters and conditions'
                })
        
        return recommendations

# Initialize engines
optimization_engine = PolicyOptimizationEngine()
nlp_processor = NaturalLanguagePolicyProcessor()
simulation_engine = PolicySimulationEngine()

@policy_enhancement_bp.route('/analyze-violations', methods=['POST'])
@require_api_key
def analyze_violations():
    """Analyze violation patterns and generate optimization recommendations"""
    try:
        data = request.get_json() or {}
        user_id = data.get('user_id')
        
        analysis = optimization_engine.analyze_violation_patterns(user_id)
        
        return jsonify({
            'success': True,
            'analysis': analysis
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@policy_enhancement_bp.route('/create-from-language', methods=['POST'])
@require_api_key
def create_policy_from_natural_language():
    """Create policy rules from natural language description"""
    try:
        data = request.get_json()
        if not data or 'description' not in data:
            return jsonify({'error': 'Description is required'}), 400
        
        description = data['description']
        context = data.get('context')
        
        result = nlp_processor.process_natural_language_policy(description, context)
        
        return jsonify(result)
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@policy_enhancement_bp.route('/simulate-policy', methods=['POST'])
@require_api_key
def simulate_policy():
    """Simulate policy impact using historical data"""
    try:
        data = request.get_json()
        if not data or 'policy_rules' not in data:
            return jsonify({'error': 'Policy rules are required'}), 400
        
        policy_rules = data['policy_rules']
        agent_id = data.get('agent_id')
        time_range_days = data.get('time_range_days', 30)
        
        result = simulation_engine.simulate_policy_impact(
            policy_rules, agent_id, time_range_days
        )
        
        return jsonify(result)
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@policy_enhancement_bp.route('/optimize-policy', methods=['POST'])
@require_api_key
def optimize_policy():
    """Get optimization recommendations for existing policy"""
    try:
        data = request.get_json()
        if not data or 'policy_id' not in data:
            return jsonify({'error': 'Policy ID is required'}), 400
        
        policy_id = data['policy_id']
        user_id = data.get('user_id')
        
        # Get violations related to this policy
        violations_query = AgentViolation.query.filter_by(policy_id=policy_id)
        if user_id:
            violations_query = violations_query.filter_by(user_id=user_id)
        
        violations = violations_query.all()
        
        # Analyze policy-specific patterns
        violation_data = []
        for v in violations:
            violation_data.append({
                'type': v.violation_type,
                'severity': v.severity,
                'policy_id': v.policy_id,
                'description': v.description,
                'timestamp': v.timestamp,
                'context': json.loads(v.context) if v.context else {}
            })
        
        recommendations = optimization_engine._generate_optimization_recommendations([], violation_data)
        
        return jsonify({
            'success': True,
            'policy_id': policy_id,
            'recommendations': recommendations,
            'violation_count': len(violations),
            'analysis_date': datetime.utcnow().isoformat()
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@policy_enhancement_bp.route('/validate-rule', methods=['POST'])
@require_api_key
def validate_policy_rule():
    """Validate a policy rule against historical data"""
    try:
        data = request.get_json()
        if not data or 'rule' not in data:
            return jsonify({'error': 'Rule is required'}), 400
        
        rule = data['rule']
        agent_id = data.get('agent_id')
        
        # Get recent data for validation
        end_date = datetime.utcnow()
        start_date = end_date - timedelta(days=7)  # Last week
        
        logs_query = AgentLog.query.filter(
            AgentLog.timestamp >= start_date,
            AgentLog.timestamp <= end_date
        )
        metrics_query = AgentMetrics.query.filter(
            AgentMetrics.timestamp >= start_date,
            AgentMetrics.timestamp <= end_date
        )
        
        if agent_id:
            logs_query = logs_query.filter_by(agent_id=agent_id)
            metrics_query = metrics_query.filter_by(agent_id=agent_id)
        
        logs = logs_query.all()
        metrics = metrics_query.all()
        
        # Validate rule
        validation_result = simulation_engine._simulate_rule(rule, logs, metrics)
        
        return jsonify({
            'success': True,
            'validation_result': validation_result,
            'data_points': len(logs) + len(metrics),
            'time_range': '7 days'
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

