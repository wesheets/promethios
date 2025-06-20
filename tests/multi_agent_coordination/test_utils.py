"""
Test Configuration and Utilities for Multi-Agent Coordination Tests.

This module provides configuration and utility functions for testing
the multi-agent coordination system.
"""

import os
import json
import tempfile
import subprocess
from typing import Dict, Any, Optional
from unittest.mock import MagicMock

class TestConfig:
    """Configuration for multi-agent coordination tests."""
    
    # Test data paths
    TEST_DATA_DIR = os.path.join(os.path.dirname(__file__), 'test_data')
    
    # API endpoints
    BASE_URL = "http://localhost:8001"
    MULTI_AGENT_PREFIX = "/api/multi_agent/multi_agent"
    
    # Test timeouts
    API_TIMEOUT = 30
    NODE_TIMEOUT = 10
    
    # Test agent configurations
    TEST_AGENTS = {
        "creative_agent": {
            "id": "creative_agent",
            "name": "Creative Agent",
            "type": "creative",
            "capabilities": ["content_creation", "brainstorming", "design"],
            "trust_threshold": 0.7
        },
        "factual_agent": {
            "id": "factual_agent", 
            "name": "Factual Agent",
            "type": "research",
            "capabilities": ["fact_checking", "research", "analysis"],
            "trust_threshold": 0.8
        },
        "governance_agent": {
            "id": "governance_agent",
            "name": "Governance Agent", 
            "type": "governance",
            "capabilities": ["policy_enforcement", "compliance_checking", "audit"],
            "trust_threshold": 0.9
        }
    }
    
    # Test collaboration models
    COLLABORATION_MODELS = [
        "shared_context",
        "sequential_handoffs", 
        "parallel_processing",
        "hierarchical_coordination",
        "consensus_decision"
    ]
    
    # Test governance policies
    TEST_POLICIES = {
        "basic": {
            "trustThreshold": 0.7,
            "requireConsensus": False,
            "governanceEnabled": True,
            "auditLevel": "standard",
            "policyEnforcement": "standard"
        },
        "strict": {
            "trustThreshold": 0.9,
            "requireConsensus": True,
            "governanceEnabled": True,
            "auditLevel": "high",
            "policyEnforcement": "strict"
        },
        "lenient": {
            "trustThreshold": 0.5,
            "requireConsensus": False,
            "governanceEnabled": False,
            "auditLevel": "low",
            "policyEnforcement": "lenient"
        }
    }


class MockServices:
    """Mock services for testing without external dependencies."""
    
    @staticmethod
    def create_mock_schema_registry():
        """Create a mock schema validation registry."""
        mock_registry = MagicMock()
        mock_registry.validate_request.return_value = True
        mock_registry.validate_response.return_value = True
        mock_registry.get_schema.return_value = {"type": "object"}
        return mock_registry
    
    @staticmethod
    def create_mock_coordination():
        """Create a mock multi-agent coordination instance."""
        mock_coordination = MagicMock()
        
        # Mock context creation
        mock_coordination.createCoordinationContext.return_value = {
            "id": "mock-context-123",
            "name": "Mock Context",
            "agentIds": ["agent1", "agent2"],
            "collaborationModel": "shared_context",
            "status": "active",
            "created": "2025-06-20T12:00:00Z"
        }
        
        # Mock message sending
        mock_coordination.sendMessage.return_value = {
            "messageId": "mock-msg-123",
            "deliveryResults": [
                {"recipientId": "agent1", "delivered": True, "timestamp": "2025-06-20T12:01:00Z"},
                {"recipientId": "agent2", "delivered": True, "timestamp": "2025-06-20T12:01:00Z"}
            ],
            "timestamp": "2025-06-20T12:01:00Z"
        }
        
        # Mock conversation history
        mock_coordination.getConversationHistory.return_value = {
            "contextId": "mock-context-123",
            "messages": [
                {
                    "id": "msg-1",
                    "fromAgentId": "user",
                    "content": "Test message",
                    "timestamp": "2025-06-20T12:00:00Z",
                    "governanceData": {"trustScore": 0.85, "compliant": True}
                }
            ],
            "totalMessages": 1,
            "filteredCount": 1,
            "collaborationModel": "shared_context"
        }
        
        # Mock metrics
        mock_coordination.getCollaborationMetrics.return_value = {
            "contextId": "mock-context-123",
            "collaborationEffectiveness": 0.85,
            "averageResponseTime": 1500,
            "taskCompletionRate": 0.92,
            "agentPerformance": [
                {"agentId": "agent1", "score": 0.88, "tasksCompleted": 5},
                {"agentId": "agent2", "score": 0.82, "tasksCompleted": 4}
            ]
        }
        
        # Mock governance metrics
        mock_coordination.getGovernanceMetrics.return_value = {
            "contextId": "mock-context-123",
            "averageTrustScore": 0.85,
            "complianceRate": 0.95,
            "policyViolations": 1,
            "auditLog": [
                {
                    "timestamp": "2025-06-20T12:00:00Z",
                    "event": "context_created",
                    "details": {"contextId": "mock-context-123"}
                }
            ]
        }
        
        # Mock agent status
        mock_coordination.getAgentStatus.return_value = {
            "contextId": "mock-context-123",
            "agents": [
                {
                    "agentId": "agent1",
                    "status": "active",
                    "currentTask": "Processing user request",
                    "trustScore": 0.88,
                    "lastActivity": "2025-06-20T12:01:00Z"
                },
                {
                    "agentId": "agent2", 
                    "status": "idle",
                    "currentTask": null,
                    "trustScore": 0.82,
                    "lastActivity": "2025-06-20T11:58:00Z"
                }
            ]
        }
        
        return mock_coordination


class TestUtilities:
    """Utility functions for testing."""
    
    @staticmethod
    def create_temp_file(content: str, suffix: str = '.json') -> str:
        """Create a temporary file with the given content."""
        with tempfile.NamedTemporaryFile(mode='w', suffix=suffix, delete=False) as f:
            f.write(content)
            return f.name
    
    @staticmethod
    def create_test_context_data(
        name: str = "Test Context",
        agent_ids: list = None,
        collaboration_model: str = "shared_context",
        policies: Dict[str, Any] = None
    ) -> Dict[str, Any]:
        """Create test context data."""
        if agent_ids is None:
            agent_ids = ["creative_agent", "factual_agent"]
        
        if policies is None:
            policies = TestConfig.TEST_POLICIES["basic"]
        
        return {
            "name": name,
            "agent_ids": agent_ids,
            "collaboration_model": collaboration_model,
            "policies": policies,
            "governance_enabled": policies.get("governanceEnabled", True),
            "metadata": {
                "test": True,
                "created_by": "test_suite"
            }
        }
    
    @staticmethod
    def create_test_message_data(
        context_id: str,
        from_agent_id: str = "user",
        to_agent_ids: list = None,
        content: str = "Test message",
        message_type: str = "user_message"
    ) -> Dict[str, Any]:
        """Create test message data."""
        if to_agent_ids is None:
            to_agent_ids = ["creative_agent", "factual_agent"]
        
        return {
            "context_id": context_id,
            "from_agent_id": from_agent_id,
            "to_agent_ids": to_agent_ids,
            "message": {
                "type": message_type,
                "content": content,
                "governance_enabled": True
            },
            "require_response": True,
            "priority": "normal"
        }
    
    @staticmethod
    def is_node_available() -> bool:
        """Check if Node.js is available."""
        try:
            result = subprocess.run(['node', '--version'], capture_output=True, timeout=5)
            return result.returncode == 0
        except (subprocess.TimeoutExpired, FileNotFoundError):
            return False
    
    @staticmethod
    def is_server_running(url: str = TestConfig.BASE_URL) -> bool:
        """Check if the API server is running."""
        try:
            import requests
            response = requests.get(f"{url}/", timeout=5)
            return response.status_code == 200
        except:
            return False
    
    @staticmethod
    def wait_for_server(url: str = TestConfig.BASE_URL, timeout: int = 30) -> bool:
        """Wait for the API server to be available."""
        import time
        import requests
        
        start_time = time.time()
        while time.time() - start_time < timeout:
            try:
                response = requests.get(f"{url}/", timeout=2)
                if response.status_code == 200:
                    return True
            except:
                pass
            time.sleep(1)
        
        return False
    
    @staticmethod
    def cleanup_temp_files(*file_paths: str):
        """Clean up temporary files."""
        for file_path in file_paths:
            try:
                if os.path.exists(file_path):
                    os.unlink(file_path)
            except OSError:
                pass


class TestDataGenerator:
    """Generate test data for various scenarios."""
    
    @staticmethod
    def generate_conversation_history(
        context_id: str,
        num_messages: int = 5,
        agents: list = None
    ) -> Dict[str, Any]:
        """Generate mock conversation history."""
        if agents is None:
            agents = ["user", "creative_agent", "factual_agent"]
        
        messages = []
        for i in range(num_messages):
            agent = agents[i % len(agents)]
            messages.append({
                "id": f"msg-{i+1}",
                "from_agent_id": agent,
                "content": f"Test message {i+1} from {agent}",
                "timestamp": f"2025-06-20T12:{i:02d}:00Z",
                "governance_data": {
                    "trust_score": 0.8 + (i * 0.02),
                    "compliant": True,
                    "policy_violations": []
                }
            })
        
        return {
            "context_id": context_id,
            "messages": messages,
            "total_messages": num_messages,
            "filtered_count": num_messages,
            "collaboration_model": "shared_context"
        }
    
    @staticmethod
    def generate_collaboration_metrics(
        context_id: str,
        num_agents: int = 3
    ) -> Dict[str, Any]:
        """Generate mock collaboration metrics."""
        agent_performance = []
        for i in range(num_agents):
            agent_performance.append({
                "agent_id": f"agent_{i+1}",
                "score": 0.75 + (i * 0.05),
                "tasks_completed": 3 + i,
                "average_response_time": 1000 + (i * 200),
                "trust_score": 0.8 + (i * 0.03)
            })
        
        return {
            "context_id": context_id,
            "collaboration_effectiveness": 0.85,
            "average_response_time": 1200,
            "task_completion_rate": 0.92,
            "agent_performance": agent_performance,
            "governance_metrics": {
                "average_trust_score": 0.85,
                "compliance_rate": 0.95,
                "policy_violations": 1,
                "audit_events": 15
            }
        }


# Export all classes and functions
__all__ = [
    'TestConfig',
    'MockServices', 
    'TestUtilities',
    'TestDataGenerator'
]

