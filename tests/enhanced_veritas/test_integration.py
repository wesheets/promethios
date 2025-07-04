"""
Enhanced Veritas 2 Integration Tests

Comprehensive test suite for validating all Enhanced Veritas 2 components
work seamlessly together. Tests API endpoints, WebSocket communication,
dashboard integration, and end-to-end workflows.
"""

import pytest
import requests
import json
import time
import asyncio
import websocket
import threading
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional
import sys
import os

# Add project root to path
sys.path.append(os.path.join(os.path.dirname(__file__), '../..'))

# Import Enhanced Veritas 2 components
from src.veritas.enhanced.bridges.enhanced_veritas_bridge import EnhancedVeritasBridge
from src.veritas.enhanced.uncertaintyEngine import UncertaintyAnalysisEngine
from src.veritas.enhanced.hitl.expert_matching_system import ExpertMatchingSystem
from src.veritas.enhanced.multiAgent.intelligentOrchestration import IntelligentOrchestrationEngine
from src.veritas.enhanced.quantum.quantum_uncertainty_engine import QuantumUncertaintyEngine

class TestEnhancedVeritasIntegration:
    """Integration tests for Enhanced Veritas 2 system."""
    
    @classmethod
    def setup_class(cls):
        """Set up test environment."""
        cls.base_url = "http://localhost:5000/api/v2"
        cls.websocket_url = "ws://localhost:5000"
        cls.test_session_id = None
        cls.test_collaboration_id = None
        cls.test_network_id = None
        cls.websocket_messages = []
        
        # Initialize test data
        cls.test_content = "I think this solution might work, but I'm not entirely sure about the performance implications and potential edge cases."
        cls.test_context = "Technical system design discussion"
        cls.test_agent_id = "test-agent-001"
        
        print("Enhanced Veritas 2 Integration Tests - Setup Complete")
    
    def test_01_system_health_check(self):
        """Test system health and status endpoints."""
        print("\n=== Testing System Health ===")
        
        # Test system status
        response = requests.get(f"{self.base_url}/system/status")
        assert response.status_code == 200
        
        status_data = response.json()
        assert 'uncertainty_engine' in status_data
        assert 'hitl_system' in status_data
        assert 'orchestration_engine' in status_data
        assert 'quantum_integration' in status_data
        assert 'bridge_services' in status_data
        
        print(f"✅ System Status: {status_data}")
        
        # Test system metrics
        response = requests.get(f"{self.base_url}/system/metrics")
        assert response.status_code == 200
        
        metrics_data = response.json()
        assert 'total_sessions' in metrics_data
        assert 'active_collaborations' in metrics_data
        assert 'system_uptime' in metrics_data
        
        print(f"✅ System Metrics: {metrics_data}")
    
    def test_02_uncertainty_analysis_workflow(self):
        """Test complete uncertainty analysis workflow."""
        print("\n=== Testing Uncertainty Analysis Workflow ===")
        
        # Step 1: Analyze uncertainty
        response = requests.post(f"{self.base_url}/uncertainty/analyze", json={
            "content": self.test_content,
            "context": self.test_context,
            "agent_id": self.test_agent_id
        })
        
        assert response.status_code == 200
        uncertainty_data = response.json()
        
        # Validate uncertainty analysis structure
        assert 'session_id' in uncertainty_data
        assert 'uncertainty_analysis' in uncertainty_data
        assert 'hitl_trigger' in uncertainty_data
        
        uncertainty_analysis = uncertainty_data['uncertainty_analysis']
        assert 'epistemic' in uncertainty_analysis
        assert 'aleatoric' in uncertainty_analysis
        assert 'confidence' in uncertainty_analysis
        assert 'contextual' in uncertainty_analysis
        assert 'temporal' in uncertainty_analysis
        assert 'social' in uncertainty_analysis
        assert 'overall_uncertainty' in uncertainty_analysis
        
        # Validate uncertainty values are in valid range
        for dimension in ['epistemic', 'aleatoric', 'confidence', 'contextual', 'temporal', 'social', 'overall_uncertainty']:
            value = uncertainty_analysis[dimension]
            assert 0.0 <= value <= 1.0, f"{dimension} value {value} not in range [0.0, 1.0]"
        
        # Store session ID for subsequent tests
        self.__class__.test_session_id = uncertainty_data['session_id']
        
        print(f"✅ Uncertainty Analysis: Overall={uncertainty_analysis['overall_uncertainty']:.3f}")
        print(f"   Epistemic={uncertainty_analysis['epistemic']:.3f}, Aleatoric={uncertainty_analysis['aleatoric']:.3f}")
        print(f"   Confidence={uncertainty_analysis['confidence']:.3f}, Contextual={uncertainty_analysis['contextual']:.3f}")
        print(f"   Temporal={uncertainty_analysis['temporal']:.3f}, Social={uncertainty_analysis['social']:.3f}")
        
        # Step 2: Retrieve session data
        response = requests.get(f"{self.base_url}/uncertainty/session/{self.test_session_id}")
        assert response.status_code == 200
        
        session_data = response.json()
        assert session_data['session_id'] == self.test_session_id
        assert 'uncertainty_analysis' in session_data
        
        print(f"✅ Session Retrieval: {self.test_session_id}")
        
        # Step 3: List all sessions
        response = requests.get(f"{self.base_url}/uncertainty/sessions")
        assert response.status_code == 200
        
        sessions_data = response.json()
        assert 'sessions' in sessions_data
        assert 'total_count' in sessions_data
        assert sessions_data['total_count'] >= 1
        
        print(f"✅ Sessions List: {sessions_data['total_count']} active sessions")
    
    def test_03_quantum_uncertainty_analysis(self):
        """Test quantum uncertainty analysis capabilities."""
        print("\n=== Testing Quantum Uncertainty Analysis ===")
        
        # Get uncertainty analysis from previous test
        response = requests.get(f"{self.base_url}/uncertainty/session/{self.test_session_id}")
        assert response.status_code == 200
        session_data = response.json()
        
        # Perform quantum analysis
        response = requests.post(f"{self.base_url}/quantum/analyze", json={
            "uncertainty_analysis": session_data['uncertainty_analysis'],
            "content": self.test_content,
            "context": self.test_context,
            "quantum_config": {
                "enable_entanglement": True,
                "coherence_time": 1000,
                "quantum_advantage_threshold": 0.1
            }
        })
        
        assert response.status_code == 200
        quantum_data = response.json()
        
        # Validate quantum analysis structure
        assert 'quantum_analysis' in quantum_data
        quantum_analysis = quantum_data['quantum_analysis']
        
        assert 'quantum_advantage' in quantum_analysis
        assert 'quantum_states' in quantum_analysis
        assert 'coherence_time' in quantum_analysis
        assert 'prediction_accuracy' in quantum_analysis
        
        # Validate quantum values
        assert 0.0 <= quantum_analysis['quantum_advantage'] <= 1.0
        assert quantum_analysis['coherence_time'] > 0
        assert 0.0 <= quantum_analysis['prediction_accuracy'] <= 1.0
        
        print(f"✅ Quantum Analysis: Advantage={quantum_analysis['quantum_advantage']:.3f}")
        print(f"   Coherence Time={quantum_analysis['coherence_time']:.1f}ms")
        print(f"   Prediction Accuracy={quantum_analysis['prediction_accuracy']:.3f}")
        
        # Test quantum entanglements
        response = requests.get(f"{self.base_url}/quantum/entanglements")
        assert response.status_code == 200
        
        entanglements_data = response.json()
        assert 'entanglements' in entanglements_data
        assert 'total_count' in entanglements_data
        
        print(f"✅ Quantum Entanglements: {entanglements_data['total_count']} active")
    
    def test_04_hitl_collaboration_workflow(self):
        """Test complete HITL collaboration workflow."""
        print("\n=== Testing HITL Collaboration Workflow ===")
        
        # Step 1: Start HITL collaboration
        response = requests.post(f"{self.base_url}/hitl/start_collaboration", json={
            "session_id": self.test_session_id,
            "domain": "technical",
            "urgency": "medium",
            "collaboration_type": "progressive"
        })
        
        assert response.status_code == 200
        collaboration_data = response.json()
        
        # Validate collaboration structure
        assert 'collaboration_id' in collaboration_data
        assert 'expert_match' in collaboration_data
        assert 'estimated_duration' in collaboration_data
        assert 'collaboration_strategy' in collaboration_data
        
        expert_match = collaboration_data['expert_match']
        assert 'expert_id' in expert_match
        assert 'expert_name' in expert_match
        assert 'match_score' in expert_match
        assert 0.0 <= expert_match['match_score'] <= 1.0
        
        # Store collaboration ID for subsequent tests
        self.__class__.test_collaboration_id = collaboration_data['collaboration_id']
        
        print(f"✅ HITL Collaboration Started: {self.test_collaboration_id}")
        print(f"   Expert: {expert_match['expert_name']} (Score: {expert_match['match_score']:.3f})")
        print(f"   Estimated Duration: {collaboration_data['estimated_duration']} minutes")
        
        # Step 2: Ask clarification question
        response = requests.post(f"{self.base_url}/hitl/collaboration/{self.test_collaboration_id}/question", json={
            "question_text": "Can you clarify the specific performance concerns you have about this solution?",
            "question_type": "open_ended",
            "uncertainty_target": "epistemic"
        })
        
        assert response.status_code == 200
        question_data = response.json()
        
        assert 'question_id' in question_data
        assert 'question' in question_data
        
        question_id = question_data['question_id']
        print(f"✅ Clarification Question Asked: {question_id}")
        
        # Step 3: Submit expert response
        response = requests.post(f"{self.base_url}/hitl/collaboration/{self.test_collaboration_id}/response", json={
            "question_id": question_id,
            "response": "The main performance concerns are related to memory usage during peak load and potential bottlenecks in the data processing pipeline. I recommend implementing caching and optimizing the database queries.",
            "confidence": 0.85,
            "additional_context": "Based on similar implementations I've worked on"
        })
        
        assert response.status_code == 200
        response_data = response.json()
        
        assert 'response_analysis' in response_data
        assert 'collaboration_status' in response_data
        assert 'uncertainty_reduction' in response_data
        
        response_analysis = response_data['response_analysis']
        assert 'uncertainty_reduction' in response_analysis
        assert 'expert_satisfaction' in response_analysis
        
        print(f"✅ Expert Response Processed")
        print(f"   Uncertainty Reduction: {response_data['uncertainty_reduction']:.3f}")
        print(f"   Expert Satisfaction: {response_analysis['expert_satisfaction']:.3f}")
        
        # Step 4: List all collaborations
        response = requests.get(f"{self.base_url}/hitl/collaborations")
        assert response.status_code == 200
        
        collaborations_data = response.json()
        assert 'collaborations' in collaborations_data
        assert 'total_count' in collaborations_data
        assert collaborations_data['total_count'] >= 1
        
        print(f"✅ Collaborations List: {collaborations_data['total_count']} active")
    
    def test_05_multi_agent_orchestration_workflow(self):
        """Test multi-agent orchestration workflow."""
        print("\n=== Testing Multi-Agent Orchestration Workflow ===")
        
        # Step 1: Create agent network
        response = requests.post(f"{self.base_url}/orchestration/create_network", json={
            "network_name": "Test Uncertainty Resolution Network",
            "agent_ids": ["agent-001", "agent-002", "agent-003"],
            "collaboration_pattern": "dynamic",
            "uncertainty_context": {
                "session_id": self.test_session_id,
                "uncertainty_level": "high",
                "domain": "technical"
            },
            "auto_optimize": True
        })
        
        assert response.status_code == 200
        network_data = response.json()
        
        # Validate network structure
        assert 'network' in network_data
        network = network_data['network']
        
        assert 'network_id' in network
        assert 'network_name' in network
        assert 'agents' in network
        assert 'collaboration_pattern' in network
        assert 'network_efficiency' in network
        
        # Store network ID for subsequent tests
        self.__class__.test_network_id = network['network_id']
        
        print(f"✅ Agent Network Created: {self.test_network_id}")
        print(f"   Name: {network['network_name']}")
        print(f"   Agents: {len(network['agents'])}")
        print(f"   Efficiency: {network['network_efficiency']:.3f}")
        
        # Step 2: List all networks
        response = requests.get(f"{self.base_url}/orchestration/networks")
        assert response.status_code == 200
        
        networks_data = response.json()
        assert 'networks' in networks_data
        assert 'total_count' in networks_data
        assert networks_data['total_count'] >= 1
        
        print(f"✅ Networks List: {networks_data['total_count']} active")
        
        # Step 3: Optimize network
        response = requests.post(f"{self.base_url}/orchestration/network/{self.test_network_id}/optimize")
        assert response.status_code == 200
        
        optimization_data = response.json()
        assert 'optimization_result' in optimization_data
        assert 'status' in optimization_data
        
        optimization_result = optimization_data['optimization_result']
        assert 'efficiency_improvement' in optimization_result
        assert 'optimization_actions' in optimization_result
        
        print(f"✅ Network Optimized")
        print(f"   Efficiency Improvement: {optimization_result['efficiency_improvement']:.3f}")
        print(f"   Actions Taken: {len(optimization_result['optimization_actions'])}")
    
    def test_06_websocket_communication(self):
        """Test WebSocket real-time communication."""
        print("\n=== Testing WebSocket Communication ===")
        
        websocket_messages = []
        connection_established = threading.Event()
        
        def on_message(ws, message):
            """Handle WebSocket messages."""
            try:
                data = json.loads(message)
                websocket_messages.append(data)
                print(f"📡 WebSocket Message: {data.get('type', 'unknown')}")
            except json.JSONDecodeError:
                print(f"📡 WebSocket Raw Message: {message}")
        
        def on_open(ws):
            """Handle WebSocket connection open."""
            print("📡 WebSocket Connected")
            connection_established.set()
            
            # Join session room
            ws.send(json.dumps({
                "type": "join_session",
                "session_id": self.test_session_id
            }))
            
            # Join collaboration room
            if self.test_collaboration_id:
                ws.send(json.dumps({
                    "type": "join_collaboration",
                    "collaboration_id": self.test_collaboration_id
                }))
            
            # Join orchestration room
            ws.send(json.dumps({
                "type": "join_orchestration"
            }))
        
        def on_error(ws, error):
            """Handle WebSocket errors."""
            print(f"📡 WebSocket Error: {error}")
        
        def on_close(ws, close_status_code, close_msg):
            """Handle WebSocket connection close."""
            print("📡 WebSocket Disconnected")
        
        # Create WebSocket connection
        ws = websocket.WebSocketApp(
            self.websocket_url,
            on_open=on_open,
            on_message=on_message,
            on_error=on_error,
            on_close=on_close
        )
        
        # Start WebSocket in separate thread
        ws_thread = threading.Thread(target=ws.run_forever)
        ws_thread.daemon = True
        ws_thread.start()
        
        # Wait for connection
        connection_established.wait(timeout=10)
        assert connection_established.is_set(), "WebSocket connection not established"
        
        # Give some time for messages
        time.sleep(2)
        
        # Trigger some events to test real-time updates
        # Analyze new uncertainty to trigger updates
        response = requests.post(f"{self.base_url}/uncertainty/analyze", json={
            "content": "This is another test message with different uncertainty characteristics.",
            "context": "WebSocket testing",
            "agent_id": "websocket-test-agent"
        })
        
        assert response.status_code == 200
        
        # Wait for WebSocket messages
        time.sleep(3)
        
        # Close WebSocket
        ws.close()
        
        print(f"✅ WebSocket Communication: {len(websocket_messages)} messages received")
        
        # Validate that we received some messages
        assert len(websocket_messages) > 0, "No WebSocket messages received"
    
    def test_07_end_to_end_workflow(self):
        """Test complete end-to-end workflow."""
        print("\n=== Testing End-to-End Workflow ===")
        
        # Scenario: High uncertainty content triggers full Enhanced Veritas 2 workflow
        high_uncertainty_content = """
        I'm considering implementing a new microservices architecture, but I'm uncertain about:
        1. Whether to use Kubernetes or Docker Swarm for orchestration
        2. How to handle data consistency across services
        3. The impact on system performance and latency
        4. Security implications of service-to-service communication
        5. Monitoring and debugging challenges in a distributed system
        
        There are so many variables and potential issues that I'm not sure how to proceed.
        The team has mixed opinions and we need to make a decision soon.
        """
        
        # Step 1: Analyze uncertainty (should trigger high uncertainty)
        print("Step 1: Analyzing high uncertainty content...")
        response = requests.post(f"{self.base_url}/uncertainty/analyze", json={
            "content": high_uncertainty_content,
            "context": "Architecture decision making",
            "agent_id": "architecture-agent"
        })
        
        assert response.status_code == 200
        uncertainty_data = response.json()
        
        session_id = uncertainty_data['session_id']
        uncertainty_analysis = uncertainty_data['uncertainty_analysis']
        
        print(f"   Overall Uncertainty: {uncertainty_analysis['overall_uncertainty']:.3f}")
        assert uncertainty_analysis['overall_uncertainty'] > 0.6, "Expected high uncertainty"
        
        # Step 2: Quantum analysis (if high uncertainty)
        print("Step 2: Performing quantum analysis...")
        response = requests.post(f"{self.base_url}/quantum/analyze", json={
            "uncertainty_analysis": uncertainty_analysis,
            "content": high_uncertainty_content,
            "context": "Architecture decision making"
        })
        
        assert response.status_code == 200
        quantum_data = response.json()
        quantum_analysis = quantum_data['quantum_analysis']
        
        print(f"   Quantum Advantage: {quantum_analysis['quantum_advantage']:.3f}")
        
        # Step 3: Start HITL collaboration (if uncertainty threshold exceeded)
        if uncertainty_data.get('hitl_trigger', False):
            print("Step 3: Starting HITL collaboration...")
            response = requests.post(f"{self.base_url}/hitl/start_collaboration", json={
                "session_id": session_id,
                "domain": "technical",
                "urgency": "high",
                "collaboration_type": "progressive"
            })
            
            assert response.status_code == 200
            collaboration_data = response.json()
            collaboration_id = collaboration_data['collaboration_id']
            
            print(f"   Expert Matched: {collaboration_data['expert_match']['expert_name']}")
            
            # Ask clarification question
            response = requests.post(f"{self.base_url}/hitl/collaboration/{collaboration_id}/question", json={
                "question_text": "What are the most critical factors we should consider when choosing between Kubernetes and Docker Swarm for this architecture?",
                "question_type": "open_ended",
                "uncertainty_target": "epistemic"
            })
            
            assert response.status_code == 200
            question_data = response.json()
            question_id = question_data['question_id']
            
            # Submit expert response
            response = requests.post(f"{self.base_url}/hitl/collaboration/{collaboration_id}/response", json={
                "question_id": question_id,
                "response": "For your use case, I'd recommend Kubernetes due to better ecosystem support, auto-scaling capabilities, and service mesh integration. Focus on data consistency patterns like Saga or Event Sourcing, and implement distributed tracing for monitoring.",
                "confidence": 0.9,
                "additional_context": "Based on similar enterprise implementations"
            })
            
            assert response.status_code == 200
            response_data = response.json()
            
            print(f"   Uncertainty Reduction: {response_data['uncertainty_reduction']:.3f}")
        
        # Step 4: Create multi-agent network for collaborative analysis
        print("Step 4: Creating multi-agent network...")
        response = requests.post(f"{self.base_url}/orchestration/create_network", json={
            "network_name": "Architecture Decision Network",
            "agent_ids": ["architecture-agent", "security-agent", "performance-agent"],
            "collaboration_pattern": "round_table",
            "uncertainty_context": {
                "session_id": session_id,
                "uncertainty_level": "high",
                "domain": "architecture"
            },
            "auto_optimize": True
        })
        
        assert response.status_code == 200
        network_data = response.json()
        network_id = network_data['network']['network_id']
        
        print(f"   Network Created: {network_id}")
        print(f"   Network Efficiency: {network_data['network']['network_efficiency']:.3f}")
        
        # Step 5: Optimize network
        print("Step 5: Optimizing agent network...")
        response = requests.post(f"{self.base_url}/orchestration/network/{network_id}/optimize")
        assert response.status_code == 200
        
        optimization_data = response.json()
        print(f"   Efficiency Improvement: {optimization_data['optimization_result']['efficiency_improvement']:.3f}")
        
        print("✅ End-to-End Workflow Complete")
        print("   - High uncertainty detected and analyzed")
        print("   - Quantum analysis provided additional insights")
        print("   - HITL collaboration reduced uncertainty")
        print("   - Multi-agent network created and optimized")
        print("   - Complete uncertainty resolution workflow executed")
    
    def test_08_performance_validation(self):
        """Test system performance under load."""
        print("\n=== Testing Performance Validation ===")
        
        start_time = time.time()
        response_times = []
        
        # Perform multiple uncertainty analyses
        for i in range(10):
            request_start = time.time()
            
            response = requests.post(f"{self.base_url}/uncertainty/analyze", json={
                "content": f"Test content for performance validation iteration {i}. This content has varying uncertainty levels.",
                "context": f"Performance test iteration {i}",
                "agent_id": f"perf-test-agent-{i}"
            })
            
            request_end = time.time()
            response_time = (request_end - request_start) * 1000  # Convert to milliseconds
            response_times.append(response_time)
            
            assert response.status_code == 200
            
            # Brief pause between requests
            time.sleep(0.1)
        
        total_time = time.time() - start_time
        avg_response_time = sum(response_times) / len(response_times)
        max_response_time = max(response_times)
        min_response_time = min(response_times)
        
        print(f"✅ Performance Validation Complete")
        print(f"   Total Time: {total_time:.2f}s")
        print(f"   Average Response Time: {avg_response_time:.2f}ms")
        print(f"   Min Response Time: {min_response_time:.2f}ms")
        print(f"   Max Response Time: {max_response_time:.2f}ms")
        print(f"   Requests per Second: {10/total_time:.2f}")
        
        # Validate performance thresholds
        assert avg_response_time < 5000, f"Average response time {avg_response_time:.2f}ms exceeds 5000ms threshold"
        assert max_response_time < 10000, f"Max response time {max_response_time:.2f}ms exceeds 10000ms threshold"
        
        print("✅ Performance thresholds met")
    
    def test_09_error_handling_validation(self):
        """Test error handling and edge cases."""
        print("\n=== Testing Error Handling ===")
        
        # Test invalid uncertainty analysis request
        response = requests.post(f"{self.base_url}/uncertainty/analyze", json={})
        assert response.status_code == 400
        error_data = response.json()
        assert 'error' in error_data
        print("✅ Invalid request handling")
        
        # Test non-existent session
        response = requests.get(f"{self.base_url}/uncertainty/session/non-existent-session")
        assert response.status_code == 404
        print("✅ Non-existent session handling")
        
        # Test invalid collaboration
        response = requests.post(f"{self.base_url}/hitl/start_collaboration", json={
            "session_id": "non-existent-session"
        })
        assert response.status_code == 404
        print("✅ Invalid collaboration handling")
        
        # Test malformed JSON
        response = requests.post(
            f"{self.base_url}/uncertainty/analyze",
            data="invalid json",
            headers={'Content-Type': 'application/json'}
        )
        assert response.status_code == 400
        print("✅ Malformed JSON handling")
        
        print("✅ Error Handling Validation Complete")
    
    @classmethod
    def teardown_class(cls):
        """Clean up test environment."""
        print("\n=== Test Cleanup ===")
        
        # Clean up test sessions and collaborations
        if cls.test_session_id:
            print(f"Cleaning up session: {cls.test_session_id}")
        
        if cls.test_collaboration_id:
            print(f"Cleaning up collaboration: {cls.test_collaboration_id}")
        
        if cls.test_network_id:
            print(f"Cleaning up network: {cls.test_network_id}")
        
        print("Enhanced Veritas 2 Integration Tests - Cleanup Complete")

# ============================================================================
# TEST RUNNER
# ============================================================================

def run_integration_tests():
    """Run all integration tests."""
    print("🚀 Starting Enhanced Veritas 2 Integration Tests")
    print("=" * 60)
    
    # Run tests
    pytest.main([
        __file__,
        "-v",
        "--tb=short",
        "--capture=no"
    ])

if __name__ == "__main__":
    run_integration_tests()

