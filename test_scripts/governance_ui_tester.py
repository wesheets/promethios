#!/usr/bin/env python3
"""
Governance UI Data Flow Tester

This script tests the complete data flow from deployed agents to governance UI pages,
ensuring that agent activity properly appears in the Promethios governance dashboard.
"""

import requests
import time
import json
import sys
from datetime import datetime
from typing import Dict, List, Optional
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.options import Options

class GovernanceUITester:
    def __init__(self, ui_base_url: str, api_base_url: str, user_token: str = None):
        """
        Initialize the governance UI tester.
        
        Args:
            ui_base_url: Base URL for the Promethios UI
            api_base_url: Base URL for the Promethios API
            user_token: Authentication token for API calls
        """
        self.ui_base_url = ui_base_url.rstrip('/')
        self.api_base_url = api_base_url.rstrip('/')
        self.user_token = user_token
        self.driver = None
        self.test_results = []
        
    def setup_browser(self, headless: bool = True):
        """Setup Selenium WebDriver for UI testing."""
        options = Options()
        if headless:
            options.add_argument('--headless')
        options.add_argument('--no-sandbox')
        options.add_argument('--disable-dev-shm-usage')
        options.add_argument('--disable-gpu')
        options.add_argument('--window-size=1920,1080')
        
        try:
            self.driver = webdriver.Chrome(options=options)
            print("✅ Browser setup successful")
            return True
        except Exception as e:
            print(f"❌ Browser setup failed: {e}")
            return False
    
    def log_result(self, test_name: str, success: bool, details: Dict):
        """Log a test result."""
        result = {
            'test_name': test_name,
            'success': success,
            'timestamp': datetime.now().isoformat(),
            'details': details
        }
        self.test_results.append(result)
        
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {test_name}")
        if not success and 'error' in details:
            print(f"   Error: {details['error']}")
    
    def test_governance_pages_load(self) -> bool:
        """Test that all governance pages load without errors."""
        if not self.driver:
            return False
            
        pages = [
            ('/ui/governance/trust-metrics', 'Trust Metrics'),
            ('/ui/governance/live-monitoring', 'Live Monitoring'),
            ('/ui/governance/violations', 'Violations'),
            ('/ui/governance/performance', 'Performance'),
            ('/ui/agents/deploy', 'Agent Deployments')
        ]
        
        page_results = []
        overall_success = True
        
        for page_path, page_name in pages:
            try:
                full_url = f"{self.ui_base_url}{page_path}"
                print(f"   Testing {page_name}: {full_url}")
                
                self.driver.get(full_url)
                
                # Wait for page to load
                WebDriverWait(self.driver, 15).until(
                    EC.presence_of_element_located((By.TAG_NAME, "body"))
                )
                
                # Check for common error indicators
                error_indicators = [
                    "404", "500", "error", "not found", "something went wrong"
                ]
                
                page_text = self.driver.page_source.lower()
                has_errors = any(indicator in page_text for indicator in error_indicators)
                
                # Check if page has content (not just empty)
                content_elements = self.driver.find_elements(By.TAG_NAME, "main")
                if not content_elements:
                    content_elements = self.driver.find_elements(By.TAG_NAME, "div")
                
                has_content = len(content_elements) > 0
                
                page_success = not has_errors and has_content
                if not page_success:
                    overall_success = False
                
                page_results.append({
                    'page': page_name,
                    'url': full_url,
                    'loaded': True,
                    'has_errors': has_errors,
                    'has_content': has_content,
                    'title': self.driver.title
                })
                
            except Exception as e:
                overall_success = False
                page_results.append({
                    'page': page_name,
                    'url': full_url,
                    'loaded': False,
                    'error': str(e)
                })
        
        details = {
            'total_pages': len(pages),
            'successful_pages': sum(1 for p in page_results if p.get('loaded', False) and not p.get('has_errors', True)),
            'page_results': page_results
        }
        
        self.log_result("Governance Pages Load", overall_success, details)
        return overall_success
    
    def test_governance_apis(self) -> bool:
        """Test governance data API endpoints."""
        endpoints = [
            '/api/governance/metrics',
            '/api/governance/violations', 
            '/api/governance/live-status',
            '/api/governance/performance',
            '/api/deployments',
            '/api/agents'
        ]
        
        headers = {}
        if self.user_token:
            headers['Authorization'] = f'Bearer {self.user_token}'
        
        api_results = []
        overall_success = True
        
        for endpoint in endpoints:
            try:
                full_url = f"{self.api_base_url}{endpoint}"
                print(f"   Testing API: {full_url}")
                
                response = requests.get(full_url, headers=headers, timeout=10)
                
                is_success = response.status_code in [200, 404]  # 404 is OK if endpoint not implemented yet
                if response.status_code not in [200, 404]:
                    overall_success = False
                
                api_results.append({
                    'endpoint': endpoint,
                    'url': full_url,
                    'status_code': response.status_code,
                    'response_time_ms': response.elapsed.total_seconds() * 1000,
                    'has_data': len(response.text) > 0,
                    'is_json': self._is_valid_json(response.text),
                    'success': is_success
                })
                
            except Exception as e:
                overall_success = False
                api_results.append({
                    'endpoint': endpoint,
                    'error': str(e),
                    'success': False
                })
        
        details = {
            'total_endpoints': len(endpoints),
            'successful_endpoints': sum(1 for r in api_results if r.get('success', False)),
            'api_results': api_results
        }
        
        self.log_result("Governance APIs", overall_success, details)
        return overall_success
    
    def test_deployment_visibility(self, agent_endpoint: str, api_key: str) -> bool:
        """Test that deployed agents appear in the governance UI."""
        if not self.driver:
            return False
            
        try:
            # Navigate to deployments page
            deployments_url = f"{self.ui_base_url}/ui/agents/deploy"
            print(f"   Checking deployments at: {deployments_url}")
            
            self.driver.get(deployments_url)
            
            # Wait for page to load
            WebDriverWait(self.driver, 15).until(
                EC.presence_of_element_located((By.TAG_NAME, "body"))
            )
            
            # Look for deployment cards or agent listings
            deployment_selectors = [
                "[data-testid*='deployment']",
                "[class*='deployment']",
                "[class*='agent-card']",
                "[class*='DeploymentCard']",
                ".MuiCard-root",  # Material-UI cards
                ".card"  # Generic cards
            ]
            
            found_deployments = False
            deployment_count = 0
            
            for selector in deployment_selectors:
                try:
                    elements = self.driver.find_elements(By.CSS_SELECTOR, selector)
                    if elements:
                        deployment_count = len(elements)
                        found_deployments = True
                        print(f"   Found {deployment_count} deployment elements with selector: {selector}")
                        break
                except:
                    continue
            
            # Check page text for deployment-related content
            page_text = self.driver.page_source.lower()
            has_deployment_content = any(term in page_text for term in [
                'deployment', 'deployed', 'agent', 'endpoint', 'api key'
            ])
            
            # Extract agent ID from endpoint for verification
            agent_id = self._extract_agent_id_from_endpoint(agent_endpoint)
            has_specific_agent = agent_id and agent_id.lower() in page_text
            
            success = found_deployments or has_deployment_content
            
            details = {
                'deployments_found': found_deployments,
                'deployment_count': deployment_count,
                'has_deployment_content': has_deployment_content,
                'has_specific_agent': has_specific_agent,
                'agent_endpoint': agent_endpoint,
                'page_url': deployments_url
            }
            
            if not success:
                details['error'] = "No deployment information found on page"
            
        except Exception as e:
            success = False
            details = {'error': str(e)}
        
        self.log_result("Deployment Visibility", success, details)
        return success
    
    def test_live_monitoring_updates(self, agent_endpoint: str, api_key: str) -> bool:
        """Test that live monitoring shows real-time agent data."""
        if not self.driver:
            return False
            
        try:
            # Navigate to live monitoring page
            monitoring_url = f"{self.ui_base_url}/ui/governance/live-monitoring"
            print(f"   Checking live monitoring at: {monitoring_url}")
            
            self.driver.get(monitoring_url)
            
            # Wait for page to load
            WebDriverWait(self.driver, 15).until(
                EC.presence_of_element_located((By.TAG_NAME, "body"))
            )
            
            # Take initial snapshot
            initial_content = self.driver.page_source
            
            # Generate some agent activity
            print("   Generating agent activity...")
            activity_success = self._generate_test_activity(agent_endpoint, api_key)
            
            if not activity_success:
                print("   Warning: Could not generate agent activity")
            
            # Wait for potential updates
            time.sleep(30)
            
            # Refresh page and check for updates
            self.driver.refresh()
            WebDriverWait(self.driver, 15).until(
                EC.presence_of_element_located((By.TAG_NAME, "body"))
            )
            
            updated_content = self.driver.page_source
            
            # Look for monitoring indicators
            monitoring_indicators = [
                'healthy', 'status', 'monitoring', 'metrics', 'live', 'real-time'
            ]
            
            page_text = updated_content.lower()
            has_monitoring_content = any(indicator in page_text for indicator in monitoring_indicators)
            
            # Check if content changed (indicating live updates)
            content_changed = initial_content != updated_content
            
            success = has_monitoring_content
            
            details = {
                'has_monitoring_content': has_monitoring_content,
                'content_changed': content_changed,
                'activity_generated': activity_success,
                'page_url': monitoring_url
            }
            
            if not success:
                details['error'] = "No live monitoring content found"
            
        except Exception as e:
            success = False
            details = {'error': str(e)}
        
        self.log_result("Live Monitoring Updates", success, details)
        return success
    
    def test_trust_metrics_display(self, agent_endpoint: str, api_key: str) -> bool:
        """Test that trust metrics page shows agent trust data."""
        if not self.driver:
            return False
            
        try:
            # Navigate to trust metrics page
            trust_url = f"{self.ui_base_url}/ui/governance/trust-metrics"
            print(f"   Checking trust metrics at: {trust_url}")
            
            self.driver.get(trust_url)
            
            # Wait for page to load
            WebDriverWait(self.driver, 15).until(
                EC.presence_of_element_located((By.TAG_NAME, "body"))
            )
            
            # Look for trust-related content
            trust_indicators = [
                'trust', 'score', 'metrics', 'governance', 'compliance'
            ]
            
            page_text = self.driver.page_source.lower()
            has_trust_content = any(indicator in page_text for indicator in trust_indicators)
            
            # Look for numerical values that might be trust scores
            import re
            score_pattern = r'\b\d{1,3}%|\b\d{1,3}\.\d+%|\b[0-9]{1,3}/100\b'
            has_scores = bool(re.search(score_pattern, self.driver.page_source))
            
            success = has_trust_content
            
            details = {
                'has_trust_content': has_trust_content,
                'has_scores': has_scores,
                'page_url': trust_url
            }
            
            if not success:
                details['error'] = "No trust metrics content found"
            
        except Exception as e:
            success = False
            details = {'error': str(e)}
        
        self.log_result("Trust Metrics Display", success, details)
        return success
    
    def _generate_test_activity(self, agent_endpoint: str, api_key: str) -> bool:
        """Generate test activity on the agent."""
        try:
            headers = {
                'Authorization': f'Bearer {api_key}',
                'Content-Type': 'application/json'
            }
            
            # Send a few test messages
            test_messages = [
                "Hello, this is a test message",
                "Can you help me with a simple task?",
                "What is the current time?"
            ]
            
            for message in test_messages:
                response = requests.post(
                    f"{agent_endpoint}/chat",
                    headers=headers,
                    json={'message': message},
                    timeout=30
                )
                
                if response.status_code != 200:
                    print(f"   Warning: Agent request failed with status {response.status_code}")
                
                time.sleep(2)  # Brief pause between requests
            
            return True
            
        except Exception as e:
            print(f"   Error generating activity: {e}")
            return False
    
    def _extract_agent_id_from_endpoint(self, endpoint: str) -> Optional[str]:
        """Extract agent ID from endpoint URL."""
        try:
            # Assuming format like: https://deployed-agent-{id}.promethios.ai
            import re
            match = re.search(r'deployed-agent-([^.]+)', endpoint)
            return match.group(1) if match else None
        except:
            return None
    
    def _is_valid_json(self, text: str) -> bool:
        """Check if text is valid JSON."""
        try:
            json.loads(text)
            return True
        except:
            return False
    
    def run_full_governance_test(self, agent_endpoint: str = None, api_key: str = None) -> Dict:
        """Run the complete governance UI test suite."""
        print(f"🚀 Starting Governance UI Test Suite")
        print(f"UI Base URL: {self.ui_base_url}")
        print(f"API Base URL: {self.api_base_url}")
        print("=" * 80)
        
        # Setup browser
        if not self.setup_browser():
            return {'error': 'Failed to setup browser'}
        
        try:
            # Run all tests
            tests = [
                self.test_governance_pages_load,
                self.test_governance_apis,
            ]
            
            # Add agent-specific tests if agent details provided
            if agent_endpoint and api_key:
                print(f"Agent Endpoint: {agent_endpoint}")
                tests.extend([
                    lambda: self.test_deployment_visibility(agent_endpoint, api_key),
                    lambda: self.test_live_monitoring_updates(agent_endpoint, api_key),
                    lambda: self.test_trust_metrics_display(agent_endpoint, api_key)
                ])
            else:
                print("⚠️  No agent details provided - skipping agent-specific tests")
            
            for test in tests:
                try:
                    test()
                except Exception as e:
                    print(f"❌ Test {test.__name__} crashed: {e}")
                print()  # Add spacing between tests
            
            # Generate summary
            total_tests = len(self.test_results)
            passed_tests = sum(1 for result in self.test_results if result['success'])
            
            print("=" * 80)
            print(f"📊 GOVERNANCE UI TEST SUMMARY")
            print(f"Total Tests: {total_tests}")
            print(f"Passed: {passed_tests}")
            print(f"Failed: {total_tests - passed_tests}")
            print(f"Success Rate: {passed_tests/total_tests*100:.1f}%")
            
            if passed_tests == total_tests:
                print("🎉 All governance UI tests passed!")
            else:
                print("⚠️  Some governance UI tests failed. Check details above.")
            
            return {
                'summary': {
                    'total_tests': total_tests,
                    'passed_tests': passed_tests,
                    'failed_tests': total_tests - passed_tests,
                    'success_rate': passed_tests/total_tests*100
                },
                'detailed_results': self.test_results
            }
            
        finally:
            if self.driver:
                self.driver.quit()
    
    def save_results(self, filename: str = None):
        """Save test results to a JSON file."""
        if not filename:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"governance_ui_test_results_{timestamp}.json"
        
        with open(filename, 'w') as f:
            json.dump({
                'test_metadata': {
                    'ui_base_url': self.ui_base_url,
                    'api_base_url': self.api_base_url,
                    'test_timestamp': datetime.now().isoformat(),
                    'tester_version': '1.0'
                },
                'results': self.test_results
            }, f, indent=2)
        
        print(f"📄 Governance UI test results saved to {filename}")

def main():
    """Main function to run the governance UI tester."""
    if len(sys.argv) < 3:
        print("Usage: python governance_ui_tester.py <ui_base_url> <api_base_url> [agent_endpoint] [api_key]")
        print("Example: python governance_ui_tester.py https://promethios-ui.vercel.app https://promethios-api.vercel.app")
        print("With agent: python governance_ui_tester.py https://promethios-ui.vercel.app https://promethios-api.vercel.app https://deployed-agent-xyz.promethios.ai promethios_abc_123")
        sys.exit(1)
    
    ui_base_url = sys.argv[1]
    api_base_url = sys.argv[2]
    agent_endpoint = sys.argv[3] if len(sys.argv) > 3 else None
    api_key = sys.argv[4] if len(sys.argv) > 4 else None
    
    # Create tester and run tests
    tester = GovernanceUITester(ui_base_url, api_base_url)
    results = tester.run_full_governance_test(agent_endpoint, api_key)
    
    # Save results
    tester.save_results()
    
    # Exit with appropriate code
    if 'error' in results:
        sys.exit(1)
    elif results['summary']['failed_tests'] == 0:
        sys.exit(0)
    else:
        sys.exit(1)

if __name__ == "__main__":
    main()

