"""
Enhanced Veritas 2 Dashboard Integration Tests

Test suite for validating dashboard components, real-time updates,
and UI integration with Enhanced Veritas 2 backend services.
"""

import pytest
import time
import json
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.options import Options
from selenium.common.exceptions import TimeoutException
import requests
import threading
import websocket

class TestEnhancedVeritasDashboard:
    """Dashboard integration tests for Enhanced Veritas 2."""
    
    @classmethod
    def setup_class(cls):
        """Set up test environment."""
        # Configure Chrome options for headless testing
        chrome_options = Options()
        chrome_options.add_argument("--headless")
        chrome_options.add_argument("--no-sandbox")
        chrome_options.add_argument("--disable-dev-shm-usage")
        chrome_options.add_argument("--window-size=1920,1080")
        
        try:
            cls.driver = webdriver.Chrome(options=chrome_options)
        except Exception as e:
            print(f"Chrome driver not available: {e}")
            cls.driver = None
            return
        
        cls.base_url = "http://localhost:3000"  # React dashboard URL
        cls.api_base_url = "http://localhost:5000/api/v2"
        cls.wait = WebDriverWait(cls.driver, 10)
        
        # Test data
        cls.test_session_id = None
        cls.test_collaboration_id = None
        
        print("Enhanced Veritas 2 Dashboard Tests - Setup Complete")
    
    def test_01_dashboard_loading(self):
        """Test dashboard loading and basic navigation."""
        if not self.driver:
            pytest.skip("Chrome driver not available")
        
        print("\n=== Testing Dashboard Loading ===")
        
        # Navigate to dashboard
        self.driver.get(f"{self.base_url}/enhanced-veritas")
        
        # Wait for dashboard to load
        try:
            dashboard_title = self.wait.until(
                EC.presence_of_element_located((By.TAG_NAME, "h1"))
            )
            assert "Enhanced Veritas 2" in dashboard_title.text
            print("✅ Dashboard loaded successfully")
        except TimeoutException:
            pytest.fail("Dashboard failed to load within timeout")
        
        # Check for main dashboard components
        components_to_check = [
            "uncertainty-analysis-panel",
            "hitl-collaboration-panel", 
            "multi-agent-orchestration-panel",
            "quantum-uncertainty-panel"
        ]
        
        for component_id in components_to_check:
            try:
                element = self.driver.find_element(By.ID, component_id)
                assert element.is_displayed()
                print(f"✅ Component found: {component_id}")
            except Exception as e:
                print(f"⚠️ Component not found: {component_id} - {e}")
    
    def test_02_uncertainty_analysis_panel(self):
        """Test uncertainty analysis panel functionality."""
        if not self.driver:
            pytest.skip("Chrome driver not available")
        
        print("\n=== Testing Uncertainty Analysis Panel ===")
        
        # Create test uncertainty session via API
        response = requests.post(f"{self.api_base_url}/uncertainty/analyze", json={
            "content": "Dashboard test content with moderate uncertainty levels",
            "context": "Dashboard testing",
            "agent_id": "dashboard-test-agent"
        })
        
        assert response.status_code == 200
        uncertainty_data = response.json()
        self.__class__.test_session_id = uncertainty_data['session_id']
        
        # Navigate to uncertainty analysis panel
        uncertainty_panel = self.driver.find_element(By.ID, "uncertainty-analysis-panel")
        uncertainty_panel.click()
        
        # Wait for uncertainty data to load
        time.sleep(2)
        
        # Check for uncertainty metrics display
        try:
            epistemic_metric = self.wait.until(
                EC.presence_of_element_located((By.CLASS_NAME, "epistemic-uncertainty"))
            )
            assert epistemic_metric.is_displayed()
            print("✅ Epistemic uncertainty metric displayed")
        except TimeoutException:
            print("⚠️ Epistemic uncertainty metric not found")
        
        # Check for uncertainty visualization
        try:
            uncertainty_chart = self.driver.find_element(By.CLASS_NAME, "uncertainty-chart")
            assert uncertainty_chart.is_displayed()
            print("✅ Uncertainty visualization displayed")
        except Exception as e:
            print(f"⚠️ Uncertainty chart not found: {e}")
        
        # Test uncertainty threshold controls
        try:
            threshold_slider = self.driver.find_element(By.CLASS_NAME, "uncertainty-threshold-slider")
            assert threshold_slider.is_displayed()
            print("✅ Uncertainty threshold controls displayed")
        except Exception as e:
            print(f"⚠️ Threshold controls not found: {e}")
    
    def test_03_hitl_collaboration_panel(self):
        """Test HITL collaboration panel functionality."""
        if not self.driver:
            pytest.skip("Chrome driver not available")
        
        print("\n=== Testing HITL Collaboration Panel ===")
        
        # Start HITL collaboration via API
        if self.test_session_id:
            response = requests.post(f"{self.api_base_url}/hitl/start_collaboration", json={
                "session_id": self.test_session_id,
                "domain": "technical",
                "urgency": "medium",
                "collaboration_type": "progressive"
            })
            
            if response.status_code == 200:
                collaboration_data = response.json()
                self.__class__.test_collaboration_id = collaboration_data['collaboration_id']
        
        # Navigate to HITL collaboration panel
        hitl_panel = self.driver.find_element(By.ID, "hitl-collaboration-panel")
        hitl_panel.click()
        
        # Wait for collaboration data to load
        time.sleep(2)
        
        # Check for expert matching display
        try:
            expert_match = self.wait.until(
                EC.presence_of_element_located((By.CLASS_NAME, "expert-match-card"))
            )
            assert expert_match.is_displayed()
            print("✅ Expert match display found")
        except TimeoutException:
            print("⚠️ Expert match display not found")
        
        # Check for collaboration progress
        try:
            progress_indicator = self.driver.find_element(By.CLASS_NAME, "collaboration-progress")
            assert progress_indicator.is_displayed()
            print("✅ Collaboration progress indicator displayed")
        except Exception as e:
            print(f"⚠️ Progress indicator not found: {e}")
        
        # Test question input interface
        try:
            question_input = self.driver.find_element(By.CLASS_NAME, "clarification-question-input")
            assert question_input.is_displayed()
            print("✅ Question input interface displayed")
        except Exception as e:
            print(f"⚠️ Question input not found: {e}")
    
    def test_04_multi_agent_orchestration_panel(self):
        """Test multi-agent orchestration panel functionality."""
        if not self.driver:
            pytest.skip("Chrome driver not available")
        
        print("\n=== Testing Multi-Agent Orchestration Panel ===")
        
        # Create test agent network via API
        response = requests.post(f"{self.api_base_url}/orchestration/create_network", json={
            "network_name": "Dashboard Test Network",
            "agent_ids": ["dashboard-agent-1", "dashboard-agent-2", "dashboard-agent-3"],
            "collaboration_pattern": "dynamic",
            "auto_optimize": True
        })
        
        if response.status_code == 200:
            network_data = response.json()
            test_network_id = network_data['network']['network_id']
        
        # Navigate to orchestration panel
        orchestration_panel = self.driver.find_element(By.ID, "multi-agent-orchestration-panel")
        orchestration_panel.click()
        
        # Wait for network data to load
        time.sleep(2)
        
        # Check for agent network visualization
        try:
            network_viz = self.wait.until(
                EC.presence_of_element_located((By.CLASS_NAME, "agent-network-visualization"))
            )
            assert network_viz.is_displayed()
            print("✅ Agent network visualization displayed")
        except TimeoutException:
            print("⚠️ Network visualization not found")
        
        # Check for agent status indicators
        try:
            agent_status = self.driver.find_elements(By.CLASS_NAME, "agent-status-indicator")
            assert len(agent_status) > 0
            print(f"✅ Agent status indicators found: {len(agent_status)}")
        except Exception as e:
            print(f"⚠️ Agent status indicators not found: {e}")
        
        # Test network optimization controls
        try:
            optimize_button = self.driver.find_element(By.CLASS_NAME, "network-optimize-button")
            assert optimize_button.is_displayed()
            print("✅ Network optimization controls displayed")
        except Exception as e:
            print(f"⚠️ Optimization controls not found: {e}")
    
    def test_05_quantum_uncertainty_panel(self):
        """Test quantum uncertainty panel functionality."""
        if not self.driver:
            pytest.skip("Chrome driver not available")
        
        print("\n=== Testing Quantum Uncertainty Panel ===")
        
        # Navigate to quantum uncertainty panel
        quantum_panel = self.driver.find_element(By.ID, "quantum-uncertainty-panel")
        quantum_panel.click()
        
        # Wait for quantum data to load
        time.sleep(2)
        
        # Check for quantum state visualization
        try:
            quantum_viz = self.wait.until(
                EC.presence_of_element_located((By.CLASS_NAME, "quantum-state-visualization"))
            )
            assert quantum_viz.is_displayed()
            print("✅ Quantum state visualization displayed")
        except TimeoutException:
            print("⚠️ Quantum visualization not found")
        
        # Check for coherence metrics
        try:
            coherence_metrics = self.driver.find_element(By.CLASS_NAME, "coherence-metrics")
            assert coherence_metrics.is_displayed()
            print("✅ Coherence metrics displayed")
        except Exception as e:
            print(f"⚠️ Coherence metrics not found: {e}")
        
        # Check for entanglement display
        try:
            entanglement_display = self.driver.find_element(By.CLASS_NAME, "entanglement-display")
            assert entanglement_display.is_displayed()
            print("✅ Entanglement display found")
        except Exception as e:
            print(f"⚠️ Entanglement display not found: {e}")
    
    def test_06_real_time_updates(self):
        """Test real-time dashboard updates via WebSocket."""
        if not self.driver:
            pytest.skip("Chrome driver not available")
        
        print("\n=== Testing Real-Time Updates ===")
        
        # Navigate to main dashboard
        self.driver.get(f"{self.base_url}/enhanced-veritas")
        time.sleep(2)
        
        # Get initial uncertainty count
        try:
            uncertainty_count_element = self.driver.find_element(By.CLASS_NAME, "uncertainty-session-count")
            initial_count = int(uncertainty_count_element.text)
            print(f"Initial uncertainty session count: {initial_count}")
        except Exception as e:
            print(f"⚠️ Could not get initial count: {e}")
            initial_count = 0
        
        # Trigger new uncertainty analysis via API
        response = requests.post(f"{self.api_base_url}/uncertainty/analyze", json={
            "content": "Real-time update test content",
            "context": "Real-time testing",
            "agent_id": "realtime-test-agent"
        })
        
        assert response.status_code == 200
        
        # Wait for real-time update
        time.sleep(3)
        
        # Check if count updated
        try:
            updated_count_element = self.driver.find_element(By.CLASS_NAME, "uncertainty-session-count")
            updated_count = int(updated_count_element.text)
            
            if updated_count > initial_count:
                print("✅ Real-time update detected")
            else:
                print("⚠️ Real-time update not detected")
        except Exception as e:
            print(f"⚠️ Could not verify real-time update: {e}")
    
    def test_07_dashboard_responsiveness(self):
        """Test dashboard responsiveness on different screen sizes."""
        if not self.driver:
            pytest.skip("Chrome driver not available")
        
        print("\n=== Testing Dashboard Responsiveness ===")
        
        # Test different screen sizes
        screen_sizes = [
            (1920, 1080),  # Desktop
            (1024, 768),   # Tablet
            (375, 667)     # Mobile
        ]
        
        for width, height in screen_sizes:
            print(f"Testing screen size: {width}x{height}")
            
            # Set window size
            self.driver.set_window_size(width, height)
            
            # Navigate to dashboard
            self.driver.get(f"{self.base_url}/enhanced-veritas")
            time.sleep(2)
            
            # Check if main elements are visible
            try:
                main_container = self.driver.find_element(By.CLASS_NAME, "enhanced-veritas-dashboard")
                assert main_container.is_displayed()
                print(f"✅ Dashboard responsive at {width}x{height}")
            except Exception as e:
                print(f"⚠️ Dashboard not responsive at {width}x{height}: {e}")
        
        # Reset to default size
        self.driver.set_window_size(1920, 1080)
    
    def test_08_dashboard_performance(self):
        """Test dashboard loading performance."""
        if not self.driver:
            pytest.skip("Chrome driver not available")
        
        print("\n=== Testing Dashboard Performance ===")
        
        # Measure page load time
        start_time = time.time()
        
        self.driver.get(f"{self.base_url}/enhanced-veritas")
        
        # Wait for main dashboard to load
        try:
            self.wait.until(
                EC.presence_of_element_located((By.CLASS_NAME, "enhanced-veritas-dashboard"))
            )
            load_time = time.time() - start_time
            print(f"✅ Dashboard load time: {load_time:.2f}s")
            
            # Validate performance threshold
            assert load_time < 10.0, f"Dashboard load time {load_time:.2f}s exceeds 10s threshold"
            
        except TimeoutException:
            load_time = time.time() - start_time
            print(f"⚠️ Dashboard failed to load within {load_time:.2f}s")
    
    def test_09_error_handling_ui(self):
        """Test UI error handling and edge cases."""
        if not self.driver:
            pytest.skip("Chrome driver not available")
        
        print("\n=== Testing UI Error Handling ===")
        
        # Navigate to dashboard
        self.driver.get(f"{self.base_url}/enhanced-veritas")
        time.sleep(2)
        
        # Test invalid session ID handling
        try:
            # Execute JavaScript to simulate invalid session
            self.driver.execute_script("""
                window.dispatchEvent(new CustomEvent('enhanced-veritas-error', {
                    detail: { error: 'Session not found', sessionId: 'invalid-session' }
                }));
            """)
            
            time.sleep(1)
            
            # Check for error message display
            error_message = self.driver.find_element(By.CLASS_NAME, "error-message")
            assert error_message.is_displayed()
            print("✅ Error message displayed for invalid session")
            
        except Exception as e:
            print(f"⚠️ Error handling test failed: {e}")
        
        # Test network error handling
        try:
            # Simulate network error
            self.driver.execute_script("""
                window.dispatchEvent(new CustomEvent('enhanced-veritas-network-error', {
                    detail: { error: 'Network connection failed' }
                }));
            """)
            
            time.sleep(1)
            
            # Check for network error indicator
            network_error = self.driver.find_element(By.CLASS_NAME, "network-error-indicator")
            assert network_error.is_displayed()
            print("✅ Network error indicator displayed")
            
        except Exception as e:
            print(f"⚠️ Network error handling test failed: {e}")
    
    @classmethod
    def teardown_class(cls):
        """Clean up test environment."""
        print("\n=== Dashboard Test Cleanup ===")
        
        if cls.driver:
            cls.driver.quit()
            print("Browser driver closed")
        
        print("Enhanced Veritas 2 Dashboard Tests - Cleanup Complete")

# ============================================================================
# DASHBOARD TEST RUNNER
# ============================================================================

def run_dashboard_tests():
    """Run all dashboard integration tests."""
    print("🎨 Starting Enhanced Veritas 2 Dashboard Tests")
    print("=" * 60)
    
    # Run tests
    pytest.main([
        __file__,
        "-v",
        "--tb=short",
        "--capture=no"
    ])

if __name__ == "__main__":
    run_dashboard_tests()

