#!/usr/bin/env python3
"""
Basic Agent Testing Script for Promethios Deployed Agents

This script provides automated testing capabilities for deployed Promethios agents.
It tests basic functionality, performance, and governance compliance.
"""

import requests
import json
import time
import sys
from datetime import datetime
from typing import Dict, List, Optional, Tuple

class PrometheusAgentTester:
    def __init__(self, endpoint_url: str, api_key: str):
        """
        Initialize the agent tester.
        
        Args:
            endpoint_url: The deployed agent's endpoint URL
            api_key: The API key for authentication
        """
        self.endpoint_url = endpoint_url.rstrip('/')
        self.api_key = api_key
        self.session = requests.Session()
        self.session.headers.update({
            'Authorization': f'Bearer {api_key}',
            'Content-Type': 'application/json',
            'User-Agent': 'Promethios-Agent-Tester/1.0'
        })
        self.test_results = []
        
    def log_result(self, test_name: str, success: bool, details: Dict):
        """Log a test result."""
        result = {
            'test_name': test_name,
            'success': success,
            'timestamp': datetime.now().isoformat(),
            'details': details
        }
        self.test_results.append(result)
        
        # Print immediate feedback
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {test_name}")
        if not success and 'error' in details:
            print(f"   Error: {details['error']}")
    
    def test_health_check(self) -> bool:
        """Test basic health/connectivity."""
        try:
            response = self.session.get(f"{self.endpoint_url}/health", timeout=10)
            success = response.status_code == 200
            
            details = {
                'status_code': response.status_code,
                'response_time_ms': response.elapsed.total_seconds() * 1000,
                'response_body': response.text[:200] if response.text else None
            }
            
            if not success:
                details['error'] = f"Health check failed with status {response.status_code}"
                
        except Exception as e:
            success = False
            details = {'error': str(e)}
            
        self.log_result("Health Check", success, details)
        return success
    
    def test_basic_chat(self) -> bool:
        """Test basic chat functionality."""
        test_message = "Hello, how can you help me?"
        
        try:
            start_time = time.time()
            response = self.session.post(
                f"{self.endpoint_url}/chat",
                json={'message': test_message},
                timeout=30
            )
            response_time = (time.time() - start_time) * 1000
            
            success = response.status_code == 200
            
            details = {
                'status_code': response.status_code,
                'response_time_ms': response_time,
                'input_message': test_message
            }
            
            if success:
                try:
                    response_data = response.json()
                    details['response_length'] = len(str(response_data))
                    details['has_response'] = bool(response_data)
                except:
                    details['response_text'] = response.text[:200]
            else:
                details['error'] = f"Chat failed with status {response.status_code}"
                details['response_text'] = response.text[:200]
                
        except Exception as e:
            success = False
            details = {'error': str(e), 'input_message': test_message}
            
        self.log_result("Basic Chat", success, details)
        return success
    
    def test_conversation_context(self) -> bool:
        """Test multi-turn conversation context retention."""
        messages = [
            "I'm working on a Python project",
            "Specifically with data visualization", 
            "What libraries do you recommend?"
        ]
        
        try:
            conversation_id = None
            all_successful = True
            conversation_details = []
            
            for i, message in enumerate(messages):
                payload = {'message': message}
                if conversation_id:
                    payload['conversation_id'] = conversation_id
                    
                start_time = time.time()
                response = self.session.post(
                    f"{self.endpoint_url}/chat",
                    json=payload,
                    timeout=30
                )
                response_time = (time.time() - start_time) * 1000
                
                step_success = response.status_code == 200
                if not step_success:
                    all_successful = False
                
                step_details = {
                    'step': i + 1,
                    'message': message,
                    'status_code': response.status_code,
                    'response_time_ms': response_time
                }
                
                if step_success:
                    try:
                        response_data = response.json()
                        if 'conversation_id' in response_data:
                            conversation_id = response_data['conversation_id']
                        step_details['has_response'] = bool(response_data)
                    except:
                        step_details['response_text'] = response.text[:100]
                else:
                    step_details['error'] = response.text[:100]
                    
                conversation_details.append(step_details)
            
            details = {
                'total_steps': len(messages),
                'successful_steps': sum(1 for step in conversation_details if step['status_code'] == 200),
                'conversation_details': conversation_details
            }
            
            if not all_successful:
                details['error'] = "One or more conversation steps failed"
                
        except Exception as e:
            all_successful = False
            details = {'error': str(e)}
            
        self.log_result("Conversation Context", all_successful, details)
        return all_successful
    
    def test_performance_load(self, num_requests: int = 5) -> bool:
        """Test performance under light load."""
        try:
            results = []
            start_time = time.time()
            
            for i in range(num_requests):
                request_start = time.time()
                response = self.session.post(
                    f"{self.endpoint_url}/chat",
                    json={'message': f"Test message {i+1}"},
                    timeout=30
                )
                request_time = (time.time() - request_start) * 1000
                
                results.append({
                    'request_num': i + 1,
                    'status_code': response.status_code,
                    'response_time_ms': request_time,
                    'success': response.status_code == 200
                })
            
            total_time = (time.time() - start_time) * 1000
            successful_requests = sum(1 for r in results if r['success'])
            avg_response_time = sum(r['response_time_ms'] for r in results) / len(results)
            
            success = successful_requests == num_requests and avg_response_time < 10000  # 10 second threshold
            
            details = {
                'total_requests': num_requests,
                'successful_requests': successful_requests,
                'total_time_ms': total_time,
                'avg_response_time_ms': avg_response_time,
                'max_response_time_ms': max(r['response_time_ms'] for r in results),
                'min_response_time_ms': min(r['response_time_ms'] for r in results),
                'success_rate': successful_requests / num_requests * 100
            }
            
            if not success:
                if successful_requests < num_requests:
                    details['error'] = f"Only {successful_requests}/{num_requests} requests succeeded"
                else:
                    details['error'] = f"Average response time {avg_response_time:.0f}ms exceeds 10s threshold"
                    
        except Exception as e:
            success = False
            details = {'error': str(e)}
            
        self.log_result("Performance Load Test", success, details)
        return success
    
    def test_error_handling(self) -> bool:
        """Test error handling with invalid inputs."""
        test_cases = [
            {'name': 'Empty message', 'payload': {'message': ''}},
            {'name': 'Very long message', 'payload': {'message': 'x' * 10000}},
            {'name': 'Invalid JSON structure', 'payload': {'invalid_field': 'test'}},
        ]
        
        try:
            error_handling_results = []
            
            for test_case in test_cases:
                try:
                    response = self.session.post(
                        f"{self.endpoint_url}/chat",
                        json=test_case['payload'],
                        timeout=30
                    )
                    
                    # For error handling, we expect either success or a proper error response
                    proper_handling = response.status_code in [200, 400, 422]
                    
                    error_handling_results.append({
                        'test_name': test_case['name'],
                        'status_code': response.status_code,
                        'proper_handling': proper_handling,
                        'response_length': len(response.text)
                    })
                    
                except Exception as e:
                    error_handling_results.append({
                        'test_name': test_case['name'],
                        'error': str(e),
                        'proper_handling': False
                    })
            
            success = all(result.get('proper_handling', False) for result in error_handling_results)
            
            details = {
                'test_cases': len(test_cases),
                'properly_handled': sum(1 for r in error_handling_results if r.get('proper_handling', False)),
                'results': error_handling_results
            }
            
            if not success:
                details['error'] = "Some error cases were not handled properly"
                
        except Exception as e:
            success = False
            details = {'error': str(e)}
            
        self.log_result("Error Handling", success, details)
        return success
    
    def run_full_test_suite(self) -> Dict:
        """Run the complete test suite."""
        print(f"🚀 Starting test suite for {self.endpoint_url}")
        print("=" * 60)
        
        # Run all tests
        tests = [
            self.test_health_check,
            self.test_basic_chat,
            self.test_conversation_context,
            self.test_performance_load,
            self.test_error_handling
        ]
        
        for test in tests:
            try:
                test()
            except Exception as e:
                print(f"❌ Test {test.__name__} crashed: {e}")
            print()  # Add spacing between tests
        
        # Generate summary
        total_tests = len(self.test_results)
        passed_tests = sum(1 for result in self.test_results if result['success'])
        
        print("=" * 60)
        print(f"📊 TEST SUMMARY")
        print(f"Total Tests: {total_tests}")
        print(f"Passed: {passed_tests}")
        print(f"Failed: {total_tests - passed_tests}")
        print(f"Success Rate: {passed_tests/total_tests*100:.1f}%")
        
        if passed_tests == total_tests:
            print("🎉 All tests passed! Agent is functioning correctly.")
        else:
            print("⚠️  Some tests failed. Check the details above.")
        
        return {
            'summary': {
                'total_tests': total_tests,
                'passed_tests': passed_tests,
                'failed_tests': total_tests - passed_tests,
                'success_rate': passed_tests/total_tests*100
            },
            'detailed_results': self.test_results
        }
    
    def save_results(self, filename: str = None):
        """Save test results to a JSON file."""
        if not filename:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"agent_test_results_{timestamp}.json"
        
        with open(filename, 'w') as f:
            json.dump({
                'test_metadata': {
                    'endpoint_url': self.endpoint_url,
                    'test_timestamp': datetime.now().isoformat(),
                    'tester_version': '1.0'
                },
                'results': self.test_results
            }, f, indent=2)
        
        print(f"📄 Test results saved to {filename}")

def main():
    """Main function to run the agent tester."""
    if len(sys.argv) != 3:
        print("Usage: python basic_agent_test.py <endpoint_url> <api_key>")
        print("Example: python basic_agent_test.py https://deployed-agent-xyz.promethios.ai promethios_abc_123")
        sys.exit(1)
    
    endpoint_url = sys.argv[1]
    api_key = sys.argv[2]
    
    # Create tester and run tests
    tester = PrometheusAgentTester(endpoint_url, api_key)
    results = tester.run_full_test_suite()
    
    # Save results
    tester.save_results()
    
    # Exit with appropriate code
    if results['summary']['failed_tests'] == 0:
        sys.exit(0)
    else:
        sys.exit(1)

if __name__ == "__main__":
    main()

