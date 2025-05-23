import unittest
import json
import os
import sys
from unittest.mock import patch, MagicMock

# Add the src directory to the Python path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..')))

from src.sandbox.sandbox_manager import SandboxManager
from src.sandbox.test_data_generator import TestDataGenerator
from src.sandbox.scenario_simulator import ScenarioSimulator


class TestSandboxManager(unittest.TestCase):
    """Test cases for the SandboxManager class."""

    def setUp(self):
        """Set up test fixtures."""
        # Create a test configuration
        self.config = {
            'sandbox_root_dir': 'test_sandbox_environments',
            'max_environments': 5,
            'environment_ttl': 3600,  # 1 hour in seconds
            'cleanup_interval': 300,  # 5 minutes in seconds
            'monitoring_interval': 60  # 1 minute in seconds
        }
        
        # Create a temporary directory for testing
        os.makedirs(self.config['sandbox_root_dir'], exist_ok=True)
        
        # Initialize the SandboxManager with the test configuration
        self.manager = SandboxManager(self.config)
    
    def tearDown(self):
        """Clean up after tests."""
        # Clean up the temporary directory
        import shutil
        if os.path.exists(self.config['sandbox_root_dir']):
            shutil.rmtree(self.config['sandbox_root_dir'])
    
    def test_initialization(self):
        """Test that the SandboxManager initializes correctly."""
        self.assertEqual(self.manager.sandbox_root_dir, self.config['sandbox_root_dir'])
        self.assertEqual(self.manager.max_environments, self.config['max_environments'])
        self.assertEqual(self.manager.environment_ttl, self.config['environment_ttl'])
        self.assertEqual(self.manager.cleanup_interval, self.config['cleanup_interval'])
        self.assertEqual(self.manager.monitoring_interval, self.config['monitoring_interval'])
        self.assertIsInstance(self.manager.environments, dict)
    
    def test_create_environment(self):
        """Test creating a sandbox environment."""
        # Create an environment
        name = "test-environment"
        template = "minimal"
        user_id = "test-user"
        
        environment = self.manager.create_environment(name, template, user_id)
        
        # Check the environment
        self.assertIsInstance(environment, dict)
        self.assertEqual(environment['name'], name)
        self.assertEqual(environment['template'], template)
        self.assertEqual(environment['user_id'], user_id)
        self.assertEqual(environment['status'], 'active')
        
        # Check that the environment directory was created
        env_dir = environment['directory']
        self.assertTrue(os.path.exists(env_dir))
        
        # Check that the environment was added to the registry
        env_id = environment['id']
        self.assertIn(env_id, self.manager.environments)
        self.assertEqual(self.manager.environments[env_id], environment)
    
    def test_get_environment(self):
        """Test getting a sandbox environment."""
        # Create an environment
        environment = self.manager.create_environment("test-env", "minimal", "test-user")
        env_id = environment['id']
        
        # Get the environment
        retrieved_env = self.manager.get_environment(env_id)
        
        # Check that the retrieved environment matches the created one
        self.assertEqual(retrieved_env, environment)
        
        # Try to get a non-existent environment
        non_existent_env = self.manager.get_environment("non-existent-id")
        self.assertIsNone(non_existent_env)
    
    def test_list_environments(self):
        """Test listing sandbox environments."""
        # Create some environments
        env1 = self.manager.create_environment("env1", "minimal", "user1")
        env2 = self.manager.create_environment("env2", "standard", "user2")
        env3 = self.manager.create_environment("env3", "minimal", "user1")
        
        # List all environments
        all_envs = self.manager.list_environments()
        self.assertEqual(len(all_envs), 3)
        
        # List environments for a specific user
        user1_envs = self.manager.list_environments("user1")
        self.assertEqual(len(user1_envs), 2)
        self.assertEqual(user1_envs[0]['name'], "env1")
        self.assertEqual(user1_envs[1]['name'], "env3")
        
        user2_envs = self.manager.list_environments("user2")
        self.assertEqual(len(user2_envs), 1)
        self.assertEqual(user2_envs[0]['name'], "env2")
    
    def test_reset_environment(self):
        """Test resetting a sandbox environment."""
        # Create an environment
        environment = self.manager.create_environment("test-env", "minimal", "test-user")
        env_id = environment['id']
        env_dir = environment['directory']
        
        # Create a test file in the environment directory
        test_file_path = os.path.join(env_dir, "test_file.txt")
        with open(test_file_path, 'w') as f:
            f.write("Test content")
        
        # Reset the environment
        reset_env = self.manager.reset_environment(env_id)
        
        # Check that the test file was removed
        self.assertFalse(os.path.exists(test_file_path))
        
        # Check that the environment was updated
        self.assertEqual(reset_env['id'], env_id)
        self.assertIn('reset_at', reset_env)
        
        # Try to reset a non-existent environment
        with self.assertRaises(ValueError):
            self.manager.reset_environment("non-existent-id")
    
    def test_delete_environment(self):
        """Test deleting a sandbox environment."""
        # Create an environment
        environment = self.manager.create_environment("test-env", "minimal", "test-user")
        env_id = environment['id']
        env_dir = environment['directory']
        
        # Delete the environment
        result = self.manager.delete_environment(env_id)
        
        # Check the result
        self.assertTrue(result)
        
        # Check that the environment directory was removed
        self.assertFalse(os.path.exists(env_dir))
        
        # Check that the environment was removed from the registry
        self.assertNotIn(env_id, self.manager.environments)
        
        # Try to delete a non-existent environment
        result = self.manager.delete_environment("non-existent-id")
        self.assertFalse(result)
    
    def test_get_environment_status(self):
        """Test getting the status of a sandbox environment."""
        # Create an environment
        environment = self.manager.create_environment("test-env", "minimal", "test-user")
        env_id = environment['id']
        
        # Get the environment status
        status = self.manager.get_environment_status(env_id)
        
        # Check the status
        self.assertEqual(status['id'], env_id)
        self.assertEqual(status['name'], "test-env")
        self.assertEqual(status['status'], "active")
        self.assertIn('time_remaining', status)
        self.assertIn('data_counts', status)
        self.assertIn('disk_usage_bytes', status)
        self.assertIn('disk_usage_formatted', status)
        
        # Try to get the status of a non-existent environment
        with self.assertRaises(ValueError):
            self.manager.get_environment_status("non-existent-id")
    
    def test_monitor_environments(self):
        """Test monitoring sandbox environments."""
        # Create some environments
        self.manager.create_environment("env1", "minimal", "user1")
        self.manager.create_environment("env2", "standard", "user2")
        
        # Monitor environments
        monitoring_info = self.manager.monitor_environments()
        
        # Check the monitoring information
        self.assertEqual(monitoring_info['total_environments'], 2)
        self.assertEqual(monitoring_info['active_environments'], 2)
        self.assertEqual(monitoring_info['expired_environments'], 0)
        self.assertEqual(len(monitoring_info['environments']), 2)
        self.assertIn('total_disk_usage_bytes', monitoring_info)
        self.assertIn('total_disk_usage_formatted', monitoring_info)
    
    @patch('time.time')
    def test_cleanup_expired_environments(self, mock_time):
        """Test cleaning up expired sandbox environments."""
        # Set the current time
        current_time = 1000000
        mock_time.return_value = current_time
        
        # Create some environments
        env1 = self.manager.create_environment("env1", "minimal", "user1")
        env2 = self.manager.create_environment("env2", "standard", "user2")
        
        # Set one environment to be expired
        env1_id = env1['id']
        self.manager.environments[env1_id]['expires_at'] = current_time - 100  # Expired
        
        # Set the other environment to not be expired
        env2_id = env2['id']
        self.manager.environments[env2_id]['expires_at'] = current_time + 3600  # Not expired
        
        # Clean up expired environments
        num_cleaned = self.manager.cleanup_expired_environments()
        
        # Check the result
        self.assertEqual(num_cleaned, 1)
        self.assertNotIn(env1_id, self.manager.environments)
        self.assertIn(env2_id, self.manager.environments)


class TestTestDataGenerator(unittest.TestCase):
    """Test cases for the TestDataGenerator class."""

    def setUp(self):
        """Set up test fixtures."""
        # Initialize the TestDataGenerator
        self.generator = TestDataGenerator(seed=42)  # Use a fixed seed for reproducibility
    
    def test_initialization(self):
        """Test that the TestDataGenerator initializes correctly."""
        self.assertEqual(self.generator.seed, 42)
    
    def test_generate_user(self):
        """Test generating a user."""
        user = self.generator.generate_user()
        
        # Check the user
        self.assertIsInstance(user, dict)
        self.assertIn('id', user)
        self.assertIn('name', user)
        self.assertIn('email', user)
        self.assertIn('created_at', user)
        self.assertIn('status', user)
    
    def test_generate_resource(self):
        """Test generating a resource."""
        resource = self.generator.generate_resource()
        
        # Check the resource
        self.assertIsInstance(resource, dict)
        self.assertIn('id', resource)
        self.assertIn('name', resource)
        self.assertIn('type', resource)
        self.assertIn('created_at', resource)
        self.assertIn('status', resource)
    
    def test_generate_usage_record(self):
        """Test generating a usage record."""
        user_id = "test-user"
        record = self.generator.generate_usage_record(user_id)
        
        # Check the record
        self.assertIsInstance(record, dict)
        self.assertIn('id', record)
        self.assertIn('user_id', record)
        self.assertEqual(record['user_id'], user_id)
        self.assertIn('endpoint', record)
        self.assertIn('method', record)
        self.assertIn('timestamp', record)
        self.assertIn('status_code', record)
        self.assertIn('response_time', record)
    
    def test_generate_dataset(self):
        """Test generating a complete dataset."""
        dataset = self.generator.generate_dataset(num_users=2, num_resources=3, num_usage_records=5)
        
        # Check the dataset
        self.assertIsInstance(dataset, dict)
        self.assertIn('users', dataset)
        self.assertIn('resources', dataset)
        self.assertIn('usage_records', dataset)
        
        self.assertEqual(len(dataset['users']), 2)
        self.assertEqual(len(dataset['resources']), 3)
        self.assertEqual(len(dataset['usage_records']), 5)
    
    def test_generate_api_request(self):
        """Test generating an API request."""
        endpoint = "/users"
        method = "GET"
        request = self.generator.generate_api_request(endpoint, method)
        
        # Check the request
        self.assertIsInstance(request, dict)
        self.assertEqual(request['endpoint'], endpoint)
        self.assertEqual(request['method'], method)
        self.assertIn('headers', request)
        self.assertIn('params', request)
        
        # Test POST request with body
        post_request = self.generator.generate_api_request("/users", "POST")
        self.assertIn('body', post_request)
    
    def test_generate_api_response(self):
        """Test generating an API response."""
        request = {
            'endpoint': "/users",
            'method': "GET",
            'headers': {'Authorization': 'Bearer token'},
            'params': {'page': 1}
        }
        
        response = self.generator.generate_api_response(request)
        
        # Check the response
        self.assertIsInstance(response, dict)
        self.assertIn('status_code', response)
        self.assertIn('headers', response)
        self.assertIn('body', response)
        
        # Check that the response matches the request
        if request['method'] == "GET" and request['endpoint'] == "/users":
            self.assertIn('items', response['body'])
            self.assertIsInstance(response['body']['items'], list)


class TestScenarioSimulator(unittest.TestCase):
    """Test cases for the ScenarioSimulator class."""

    def setUp(self):
        """Set up test fixtures."""
        # Create a test configuration
        self.config = {
            'error_probability': 0.1,
            'latency_range': (50, 500),
            'rate_limit_threshold': 10,
            'rate_limit_window': 60
        }
        
        # Initialize the ScenarioSimulator with the test configuration
        self.simulator = ScenarioSimulator(self.config, seed=42)  # Use a fixed seed for reproducibility
    
    def test_initialization(self):
        """Test that the ScenarioSimulator initializes correctly."""
        self.assertEqual(self.simulator.error_probability, self.config['error_probability'])
        self.assertEqual(self.simulator.latency_range, self.config['latency_range'])
        self.assertEqual(self.simulator.rate_limit_threshold, self.config['rate_limit_threshold'])
        self.assertEqual(self.simulator.rate_limit_window, self.config['rate_limit_window'])
        self.assertIsInstance(self.simulator.data_generator, TestDataGenerator)
        self.assertIsInstance(self.simulator.request_counters, dict)
    
    def test_simulate_normal_operation(self):
        """Test simulating normal API operation."""
        endpoint = "/users"
        method = "GET"
        
        result = self.simulator.simulate_normal_operation(endpoint, method)
        
        # Check the result
        self.assertIsInstance(result, dict)
        self.assertIn('request', result)
        self.assertIn('response', result)
        self.assertEqual(result['scenario'], "normal_operation")
        
        # Check the request
        self.assertEqual(result['request']['endpoint'], endpoint)
        self.assertEqual(result['request']['method'], method)
        
        # Check the response
        self.assertEqual(result['response']['status_code'], 200)
        self.assertIn('latency_ms', result['response'])
    
    def test_simulate_rate_limiting(self):
        """Test simulating rate limiting."""
        user_id = "test-user"
        endpoint = "/users"
        method = "GET"
        
        # First request should not be rate limited
        result1 = self.simulator.simulate_rate_limiting(user_id, endpoint, method)
        
        # Check the result
        self.assertIsInstance(result1, dict)
        self.assertEqual(result1['scenario'], "rate_limiting")
        self.assertIn('rate_limit_info', result1)
        self.assertTrue(result1['rate_limit_info']['remaining'] > 0)
        
        # Make enough requests to exceed the rate limit
        for _ in range(self.simulator.rate_limit_threshold):
            self.simulator.simulate_rate_limiting(user_id, endpoint, method)
        
        # Next request should be rate limited
        result2 = self.simulator.simulate_rate_limiting(user_id, endpoint, method)
        
        # Check the result
        self.assertEqual(result2['response']['status_code'], 429)
        self.assertEqual(result2['rate_limit_info']['remaining'], 0)
    
    def test_simulate_authentication_failure(self):
        """Test simulating authentication failure."""
        endpoint = "/users"
        method = "GET"
        
        result = self.simulator.simulate_authentication_failure(endpoint, method)
        
        # Check the result
        self.assertIsInstance(result, dict)
        self.assertEqual(result['scenario'], "authentication_failure")
        self.assertEqual(result['response']['status_code'], 401)
        self.assertIn('WWW-Authenticate', result['response']['headers'])
    
    def test_simulate_server_error(self):
        """Test simulating server error."""
        endpoint = "/users"
        method = "GET"
        
        result = self.simulator.simulate_server_error(endpoint, method)
        
        # Check the result
        self.assertIsInstance(result, dict)
        self.assertEqual(result['scenario'], "server_error")
        self.assertTrue(500 <= result['response']['status_code'] <= 599)
        self.assertIn('error', result['response']['body'])
    
    def test_simulate_network_latency(self):
        """Test simulating high network latency."""
        endpoint = "/users"
        method = "GET"
        min_latency = 1000
        max_latency = 2000
        
        result = self.simulator.simulate_network_latency(endpoint, method, min_latency, max_latency)
        
        # Check the result
        self.assertIsInstance(result, dict)
        self.assertEqual(result['scenario'], "network_latency")
        self.assertTrue(min_latency <= result['response']['latency_ms'] <= max_latency)
    
    def test_simulate_validation_error(self):
        """Test simulating data validation error."""
        endpoint = "/users"
        method = "POST"
        
        result = self.simulator.simulate_validation_error(endpoint, method)
        
        # Check the result
        self.assertIsInstance(result, dict)
        self.assertEqual(result['scenario'], "validation_error")
        self.assertEqual(result['response']['status_code'], 400)
        self.assertIn('details', result['response']['body']['error'])
        self.assertTrue(len(result['response']['body']['error']['details']) > 0)


if __name__ == '__main__':
    unittest.main()
