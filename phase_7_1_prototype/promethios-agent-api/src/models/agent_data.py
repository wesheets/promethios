"""
Database models for agent data
Stores metrics, violations, logs, and heartbeats from deployed governance wrappers
"""

from src.models.user import db
from datetime import datetime

class AgentMetrics(db.Model):
    """
    Stores governance and performance metrics from deployed agents
    """
    __tablename__ = 'agent_metrics'
    __table_args__ = {'extend_existing': True}
    
    id = db.Column(db.Integer, primary_key=True)
    agent_id = db.Column(db.String(255), nullable=False, index=True)
    user_id = db.Column(db.String(255), nullable=False, index=True)
    deployment_id = db.Column(db.String(255), nullable=True, index=True)
    
    # Governance metrics (from wrapper)
    trust_score = db.Column(db.Float, default=0.0)
    compliance_rate = db.Column(db.Float, default=0.0)
    violation_count = db.Column(db.Integer, default=0)
    policy_violations = db.Column(db.Text)  # JSON string
    
    # Performance metrics (from agent + wrapper)
    response_time = db.Column(db.Float, default=0.0)
    throughput = db.Column(db.Float, default=0.0)
    error_rate = db.Column(db.Float, default=0.0)
    uptime = db.Column(db.Float, default=0.0)
    
    # System metrics (from wrapper monitoring)
    cpu_usage = db.Column(db.Float, default=0.0)
    memory_usage = db.Column(db.Float, default=0.0)
    disk_usage = db.Column(db.Float, default=0.0)
    network_io = db.Column(db.Float, default=0.0)
    
    # Business metrics (from agent + wrapper)
    request_count = db.Column(db.Integer, default=0)
    user_interactions = db.Column(db.Integer, default=0)
    success_rate = db.Column(db.Float, default=0.0)
    revenue = db.Column(db.Float, nullable=True)
    
    timestamp = db.Column(db.DateTime, default=datetime.utcnow, index=True)
    
    def to_dict(self):
        return {
            'id': self.id,
            'agent_id': self.agent_id,
            'user_id': self.user_id,
            'deployment_id': self.deployment_id,
            'governance_metrics': {
                'trust_score': self.trust_score,
                'compliance_rate': self.compliance_rate,
                'violation_count': self.violation_count,
                'policy_violations': self.policy_violations
            },
            'performance_metrics': {
                'response_time': self.response_time,
                'throughput': self.throughput,
                'error_rate': self.error_rate,
                'uptime': self.uptime
            },
            'system_metrics': {
                'cpu_usage': self.cpu_usage,
                'memory_usage': self.memory_usage,
                'disk_usage': self.disk_usage,
                'network_io': self.network_io
            },
            'business_metrics': {
                'request_count': self.request_count,
                'user_interactions': self.user_interactions,
                'success_rate': self.success_rate,
                'revenue': self.revenue
            },
            'timestamp': self.timestamp.isoformat()
        }

class AgentViolation(db.Model):
    """
    Stores policy violations detected by governance wrappers
    """
    __tablename__ = 'agent_violations'
    __table_args__ = {'extend_existing': True}
    
    id = db.Column(db.Integer, primary_key=True)
    agent_id = db.Column(db.String(255), nullable=False, index=True)
    user_id = db.Column(db.String(255), nullable=False, index=True)
    deployment_id = db.Column(db.String(255), nullable=True, index=True)
    
    violation_type = db.Column(db.String(100), nullable=False, index=True)
    severity = db.Column(db.String(20), nullable=False, index=True)  # low, medium, high, critical
    policy_id = db.Column(db.String(255), nullable=True)
    policy_name = db.Column(db.String(255), nullable=True)
    description = db.Column(db.Text, nullable=False)
    context = db.Column(db.Text)  # JSON string with violation context
    remediation_suggested = db.Column(db.Text, nullable=True)
    
    timestamp = db.Column(db.DateTime, default=datetime.utcnow, index=True)
    
    def to_dict(self):
        return {
            'id': self.id,
            'agent_id': self.agent_id,
            'user_id': self.user_id,
            'deployment_id': self.deployment_id,
            'violation_type': self.violation_type,
            'severity': self.severity,
            'policy_id': self.policy_id,
            'policy_name': self.policy_name,
            'description': self.description,
            'context': self.context,
            'remediation_suggested': self.remediation_suggested,
            'timestamp': self.timestamp.isoformat()
        }

class AgentLog(db.Model):
    """
    Stores logs from deployed governance wrappers
    """
    __tablename__ = 'agent_logs'
    __table_args__ = {'extend_existing': True}
    
    id = db.Column(db.Integer, primary_key=True)
    agent_id = db.Column(db.String(255), nullable=False, index=True)
    user_id = db.Column(db.String(255), nullable=False, index=True)
    deployment_id = db.Column(db.String(255), nullable=True, index=True)
    
    level = db.Column(db.String(20), nullable=False, index=True)  # debug, info, warn, error, critical
    category = db.Column(db.String(50), nullable=False, index=True)  # governance, performance, system, business
    source = db.Column(db.String(50), nullable=False, index=True)  # wrapper, agent, system
    message = db.Column(db.Text, nullable=False)
    log_metadata = db.Column(db.Text)  # JSON string with additional log data
    
    timestamp = db.Column(db.DateTime, default=datetime.utcnow, index=True)
    
    def to_dict(self):
        return {
            'id': self.id,
            'agent_id': self.agent_id,
            'user_id': self.user_id,
            'deployment_id': self.deployment_id,
            'level': self.level,
            'category': self.category,
            'source': self.source,
            'message': self.message,
            'metadata': self.log_metadata,
            'timestamp': self.timestamp.isoformat()
        }

class AgentHeartbeat(db.Model):
    """
    Stores heartbeat data from deployed governance wrappers
    """
    __tablename__ = 'agent_heartbeats'
    __table_args__ = {'extend_existing': True}
    
    id = db.Column(db.Integer, primary_key=True)
    agent_id = db.Column(db.String(255), nullable=False, index=True)
    user_id = db.Column(db.String(255), nullable=False, index=True)
    deployment_id = db.Column(db.String(255), nullable=True, index=True)
    
    status = db.Column(db.String(20), nullable=False, index=True)  # online, degraded, offline
    version = db.Column(db.String(50), nullable=True)
    environment = db.Column(db.String(50), nullable=True)  # production, staging, development
    system_info = db.Column(db.Text)  # JSON string with system information
    
    timestamp = db.Column(db.DateTime, default=datetime.utcnow, index=True)
    
    def to_dict(self):
        return {
            'id': self.id,
            'agent_id': self.agent_id,
            'user_id': self.user_id,
            'deployment_id': self.deployment_id,
            'status': self.status,
            'version': self.version,
            'environment': self.environment,
            'system_info': self.system_info,
            'timestamp': self.timestamp.isoformat()
        }

class APIKey(db.Model):
    """
    Stores API keys for deployed agents
    """
    __tablename__ = 'api_keys'
    __table_args__ = {'extend_existing': True}
    
    id = db.Column(db.Integer, primary_key=True)
    key_hash = db.Column(db.String(255), nullable=False, unique=True, index=True)
    user_id = db.Column(db.String(255), nullable=False, index=True)
    agent_id = db.Column(db.String(255), nullable=False, index=True)
    deployment_id = db.Column(db.String(255), nullable=False, index=True)
    
    name = db.Column(db.String(255), nullable=True)
    permissions = db.Column(db.Text)  # JSON string with permissions
    is_active = db.Column(db.Boolean, default=True, index=True)
    last_used = db.Column(db.DateTime, nullable=True)
    usage_count = db.Column(db.Integer, default=0)
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    expires_at = db.Column(db.DateTime, nullable=True)
    
    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'agent_id': self.agent_id,
            'deployment_id': self.deployment_id,
            'name': self.name,
            'permissions': self.permissions,
            'is_active': self.is_active,
            'last_used': self.last_used.isoformat() if self.last_used else None,
            'usage_count': self.usage_count,
            'created_at': self.created_at.isoformat(),
            'expires_at': self.expires_at.isoformat() if self.expires_at else None
        }

