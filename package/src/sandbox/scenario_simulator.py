"""
Scenario Simulator for Developer Sandbox Environment

This module provides utilities for simulating various scenarios in the developer sandbox environment.
It allows developers to test their applications against different API behaviors, error conditions,
and edge cases without affecting production systems.
"""

import random
import time
import logging
import json
import datetime
from typing import Dict, List, Any, Optional, Union, Callable

from src.sandbox.test_data_generator import TestDataGenerator

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class ScenarioSimulator:
    """
    Simulator for API scenarios in the developer sandbox environment.
    
    This class provides methods for simulating various API scenarios:
    - Normal operation
    - Rate limiting
    - Authentication failures
    - Server errors
    - Network latency
    - Data validation errors
    - Progressive tier upgrades
    """
    
    def __init__(self, config: Optional[Dict[str, Any]] = None, seed: Optional[int] = None):
        """
        Initialize the scenario simulator.
        
        Args:
            config: Optional configuration dictionary
            seed: Optional random seed for reproducible scenarios
        """
        self.config = config or {}
        
        # Set random seed if provided
        if seed is not None:
            random.seed(seed)
        
        # Initialize test data generator
        self.data_generator = TestDataGenerator(seed)
        
        # Extract configuration values
        self.error_probability = self.config.get('error_probability', 0.1)
        self.latency_range = self.config.get('latency_range', (50, 500))  # ms
        self.rate_limit_threshold = self.config.get('rate_limit_threshold', 10)
        self.rate_limit_window = self.config.get('rate_limit_window', 60)  # seconds
        
        # Initialize request counters for rate limiting
        self.request_counters = {}
        
        logger.info("Initialized scenario simulator")
    
    def simulate_normal_operation(self, endpoint: str, method: str) -> Dict[str, Any]:
        """
        Simulate normal API operation.
        
        Args:
            endpoint: API endpoint
            method: HTTP method
            
        Returns:
            Dict: Simulated API response
        """
        # Generate request and response
        request = self.data_generator.generate_api_request(endpoint, method)
        response = self.data_generator.generate_api_response(request)
        
        # Ensure success status code
        if method == "GET":
            response["status_code"] = 200
        elif method == "POST":
            response["status_code"] = 201
        elif method == "PUT":
            response["status_code"] = 200
        elif method == "DELETE":
            response["status_code"] = 204
        
        # Add simulated latency
        latency = random.randint(*self.latency_range)
        response["latency_ms"] = latency
        
        return {
            "request": request,
            "response": response,
            "scenario": "normal_operation"
        }
    
    def simulate_rate_limiting(self, user_id: str, endpoint: str, method: str) -> Dict[str, Any]:
        """
        Simulate rate limiting.
        
        Args:
            user_id: User ID
            endpoint: API endpoint
            method: HTTP method
            
        Returns:
            Dict: Simulated API response with rate limiting
        """
        # Generate request
        request = self.data_generator.generate_api_request(endpoint, method)
        
        # Check if user is rate limited
        current_time = time.time()
        user_key = f"{user_id}:{endpoint}"
        
        if user_key not in self.request_counters:
            self.request_counters[user_key] = {
                "count": 0,
                "window_start": current_time
            }
        
        # Reset counter if window has expired
        if current_time - self.request_counters[user_key]["window_start"] > self.rate_limit_window:
            self.request_counters[user_key] = {
                "count": 0,
                "window_start": current_time
            }
        
        # Increment request count
        self.request_counters[user_key]["count"] += 1
        
        # Check if rate limit exceeded
        if self.request_counters[user_key]["count"] > self.rate_limit_threshold:
            # Generate rate limit response
            response = {
                "status_code": 429,
                "headers": {
                    "Content-Type": "application/json",
                    "X-RateLimit-Limit": str(self.rate_limit_threshold),
                    "X-RateLimit-Remaining": "0",
                    "X-RateLimit-Reset": str(int(self.request_counters[user_key]["window_start"] + self.rate_limit_window)),
                    "Retry-After": str(int(self.request_counters[user_key]["window_start"] + self.rate_limit_window - current_time))
                },
                "body": {
                    "error": {
                        "code": 429,
                        "message": "Rate limit exceeded. Please try again later."
                    }
                }
            }
        else:
            # Generate normal response
            response = self.data_generator.generate_api_response(request)
            
            # Add rate limit headers
            response["headers"]["X-RateLimit-Limit"] = str(self.rate_limit_threshold)
            response["headers"]["X-RateLimit-Remaining"] = str(self.rate_limit_threshold - self.request_counters[user_key]["count"])
            response["headers"]["X-RateLimit-Reset"] = str(int(self.request_counters[user_key]["window_start"] + self.rate_limit_window))
        
        # Add simulated latency
        latency = random.randint(*self.latency_range)
        response["latency_ms"] = latency
        
        return {
            "request": request,
            "response": response,
            "scenario": "rate_limiting",
            "rate_limit_info": {
                "limit": self.rate_limit_threshold,
                "remaining": self.rate_limit_threshold - self.request_counters[user_key]["count"],
                "reset": int(self.request_counters[user_key]["window_start"] + self.rate_limit_window)
            }
        }
    
    def simulate_authentication_failure(self, endpoint: str, method: str) -> Dict[str, Any]:
        """
        Simulate authentication failure.
        
        Args:
            endpoint: API endpoint
            method: HTTP method
            
        Returns:
            Dict: Simulated API response with authentication failure
        """
        # Generate request with invalid authentication
        request = self.data_generator.generate_api_request(endpoint, method)
        
        # Modify authorization header to be invalid
        if "Authorization" in request["headers"]:
            request["headers"]["Authorization"] = "Bearer invalid_token"
        
        # Generate authentication failure response
        response = {
            "status_code": 401,
            "headers": {
                "Content-Type": "application/json",
                "WWW-Authenticate": "Bearer error=\"invalid_token\", error_description=\"The access token is invalid\""
            },
            "body": {
                "error": {
                    "code": 401,
                    "message": "Invalid authentication credentials"
                }
            }
        }
        
        # Add simulated latency
        latency = random.randint(*self.latency_range)
        response["latency_ms"] = latency
        
        return {
            "request": request,
            "response": response,
            "scenario": "authentication_failure"
        }
    
    def simulate_server_error(self, endpoint: str, method: str) -> Dict[str, Any]:
        """
        Simulate server error.
        
        Args:
            endpoint: API endpoint
            method: HTTP method
            
        Returns:
            Dict: Simulated API response with server error
        """
        # Generate request
        request = self.data_generator.generate_api_request(endpoint, method)
        
        # Generate server error response
        error_types = [
            {
                "status_code": 500,
                "message": "Internal Server Error: An unexpected error occurred"
            },
            {
                "status_code": 502,
                "message": "Bad Gateway: The server received an invalid response from an upstream server"
            },
            {
                "status_code": 503,
                "message": "Service Unavailable: The server is temporarily unavailable"
            },
            {
                "status_code": 504,
                "message": "Gateway Timeout: The server timed out waiting for a response"
            }
        ]
        
        error = random.choice(error_types)
        
        response = {
            "status_code": error["status_code"],
            "headers": {
                "Content-Type": "application/json"
            },
            "body": {
                "error": {
                    "code": error["status_code"],
                    "message": error["message"]
                }
            }
        }
        
        # Add simulated latency (higher for server errors)
        latency = random.randint(500, 2000)
        response["latency_ms"] = latency
        
        return {
            "request": request,
            "response": response,
            "scenario": "server_error"
        }
    
    def simulate_network_latency(self, endpoint: str, method: str, min_latency: int = 1000, max_latency: int = 5000) -> Dict[str, Any]:
        """
        Simulate high network latency.
        
        Args:
            endpoint: API endpoint
            method: HTTP method
            min_latency: Minimum latency in milliseconds
            max_latency: Maximum latency in milliseconds
            
        Returns:
            Dict: Simulated API response with high latency
        """
        # Generate request and response
        request = self.data_generator.generate_api_request(endpoint, method)
        response = self.data_generator.generate_api_response(request)
        
        # Add simulated high latency
        latency = random.randint(min_latency, max_latency)
        response["latency_ms"] = latency
        
        return {
            "request": request,
            "response": response,
            "scenario": "network_latency"
        }
    
    def simulate_validation_error(self, endpoint: str, method: str) -> Dict[str, Any]:
        """
        Simulate data validation error.
        
        Args:
            endpoint: API endpoint
            method: HTTP method
            
        Returns:
            Dict: Simulated API response with validation error
        """
        # Generate request
        request = self.data_generator.generate_api_request(endpoint, method)
        
        # Ensure method is POST or PUT
        if method not in ["POST", "PUT"]:
            method = "POST"
            request["method"] = method
        
        # Add invalid data to request body
        if "body" not in request:
            request["body"] = {}
        
        # Determine resource type from endpoint
        resource_type = endpoint.split("/")[-1]
        
        # Add invalid fields based on resource type
        if resource_type == "users":
            request["body"]["email"] = "invalid-email"
            request["body"]["age"] = -5
        elif resource_type == "resources":
            request["body"]["name"] = ""  # Empty name
            request["body"]["priority"] = "not-a-number"
        else:
            request["body"]["invalid_field"] = "invalid_value"
            request["body"]["another_invalid"] = {"nested": None}
        
        # Generate validation error response
        response = {
            "status_code": 400,
            "headers": {
                "Content-Type": "application/json"
            },
            "body": {
                "error": {
                    "code": 400,
                    "message": "Validation failed",
                    "details": []
                }
            }
        }
        
        # Add validation error details
        for field, value in request["body"].items():
            if field == "email" and value == "invalid-email":
                response["body"]["error"]["details"].append({
                    "field": field,
                    "message": "Invalid email format"
                })
            elif field == "age" and value < 0:
                response["body"]["error"]["details"].append({
                    "field": field,
                    "message": "Age must be a positive number"
                })
            elif field == "name" and value == "":
                response["body"]["error"]["details"].append({
                    "field": field,
                    "message": "Name cannot be empty"
                })
            elif field == "priority" and value == "not-a-number":
                response["body"]["error"]["details"].append({
                    "field": field,
                    "message": "Priority must be a number"
                })
            elif field == "invalid_field":
                response["body"]["error"]["details"].append({
                    "field": field,
                    "message": "Unknown field"
                })
            elif field == "another_invalid":
                response["body"]["error"]["details"].append({
                    "field": field,
                    "message": "Invalid nested structure"
                })
        
        # Add simulated latency
        latency = random.randint(*self.latency_range)
        response["latency_ms"] = latency
        
        return {
            "request": request,
            "response": response,
            "scenario": "validation_error"
        }
    
    def simulate_tier_upgrade(self, user_id: str, current_tier_id: str, next_tier_id: str) -> Dict[str, Any]:
        """
        Simulate tier upgrade process.
        
        Args:
            user_id: User ID
            current_tier_id: Current tier ID
            next_tier_id: Next tier ID
            
        Returns:
            Dict: Simulated tier upgrade process
        """
        # Generate current tier assignment
        current_assignment = {
            "user_id": user_id,
            "tier_id": current_tier_id,
            "assigned_at": (datetime.datetime.now() - datetime.timedelta(days=90)).isoformat(),
            "status": "active"
        }
        
        # Generate usage records
        usage_records = [self.data_generator.generate_usage_record(user_id) for _ in range(20)]
        
        # Generate progression metrics
        metrics = {
            "api_calls_count": sum(1 for record in usage_records if record["status_code"] < 400),
            "successful_calls_percentage": random.uniform(95, 99),
            "unique_endpoints_used": len(set(record["endpoint"] for record in usage_records)),
            "days_active": random.randint(30, 90),
            "average_response_time": random.uniform(100, 300)
        }
        
        # Determine eligibility (random but weighted towards eligible)
        eligible = random.random() < 0.8
        
        # Generate progression request
        request = {
            "method": "POST",
            "endpoint": f"/api/v1/users/{user_id}/tier-progression",
            "headers": {
                "Content-Type": "application/json",
                "Authorization": f"Bearer {self._generate_random_string(32)}"
            },
            "body": {
                "user_id": user_id,
                "current_tier_id": current_tier_id,
                "requested_tier_id": next_tier_id
            }
        }
        
        # Generate progression response
        if eligible:
            response = {
                "status_code": 200,
                "headers": {
                    "Content-Type": "application/json"
                },
                "body": {
                    "user_id": user_id,
                    "eligible": True,
                    "current_tier": {
                        "id": current_tier_id,
                        "name": f"{current_tier_id.replace('tier_', '').capitalize()} Tier"
                    },
                    "next_tier": {
                        "id": next_tier_id,
                        "name": f"{next_tier_id.replace('tier_', '').capitalize()} Tier"
                    },
                    "request_id": f"prog_{self._generate_random_string(8)}",
                    "status": "approved",
                    "effective_date": (datetime.datetime.now() + datetime.timedelta(days=1)).isoformat()
                }
            }
        else:
            response = {
                "status_code": 200,
                "headers": {
                    "Content-Type": "application/json"
                },
                "body": {
                    "user_id": user_id,
                    "eligible": False,
                    "current_tier": {
                        "id": current_tier_id,
                        "name": f"{current_tier_id.replace('tier_', '').capitalize()} Tier"
                    },
                    "next_tier": {
                        "id": next_tier_id,
                        "name": f"{next_tier_id.replace('tier_', '').capitalize()} Tier"
                    },
                    "criteria_met": False,
                    "missing_criteria": [
                        "insufficient_usage_duration",
                        "low_api_call_volume"
                    ],
                    "recommended_actions": [
                        "Continue using the API for at least 30 more days",
                        "Increase API usage to at least 1000 calls per month"
                    ]
                }
            }
        
        # Add simulated latency
        latency = random.randint(*self.latency_range)
        response["latency_ms"] = latency
        
        return {
            "request": request,
            "response": response,
            "current_assignment": current_assignment,
            "usage_records": usage_records,
            "metrics": metrics,
            "eligible": eligible,
            "scenario": "tier_upgrade"
        }
    
    def simulate_random_scenario(self, endpoint: str = None, method: str = None) -> Dict[str, Any]:
        """
        Simulate a random scenario.
        
        Args:
            endpoint: Optional API endpoint
            method: Optional HTTP method
            
        Returns:
            Dict: Simulated API scenario
        """
        # Generate random endpoint and method if not provided
        if endpoint is None:
            endpoints = [
                "/api/v1/resources",
                "/api/v1/resources/{id}",
                "/api/v1/users",
                "/api/v1/users/{id}",
                "/api/v1/documents",
                "/api/v1/images"
            ]
            endpoint = random.choice(endpoints).replace("{id}", f"{random.randint(1, 1000)}")
        
        if method is None:
            method = random.choice(["GET", "POST", "PUT", "DELETE"])
        
        # Generate random user ID
        user_id = f"user_{self._generate_random_string(8)}"
        
        # Select random scenario
        scenarios = [
            (0.6, lambda: self.simulate_normal_operation(endpoint, method)),
            (0.1, lambda: self.simulate_rate_limiting(user_id, endpoint, method)),
            (0.1, lambda: self.simulate_authentication_failure(endpoint, method)),
            (0.05, lambda: self.simulate_server_error(endpoint, method)),
            (0.05, lambda: self.simulate_network_latency(endpoint, method)),
            (0.1, lambda: self.simulate_validation_error(endpoint, method))
        ]
        
        # Select scenario based on probability
        rand = random.random()
        cumulative_prob = 0
        for prob, scenario_func in scenarios:
            cumulative_prob += prob
            if rand < cumulative_prob:
                return scenario_func()
        
        # Fallback to normal operation
        return self.simulate_normal_operation(endpoint, method)
    
    def simulate_scenario_sequence(self, num_scenarios: int = 10) -> List[Dict[str, Any]]:
        """
        Simulate a sequence of scenarios.
        
        Args:
            num_scenarios: Number of scenarios to simulate
            
        Returns:
            List: Sequence of simulated API scenarios
        """
        return [self.simulate_random_scenario() for _ in range(num_scenarios)]
    
    def _generate_random_string(self, length: int) -> str:
        """
        Generate a random string of specified length.
        
        Args:
            length: Length of the string
            
        Returns:
            str: Random string
        """
        import string
        chars = string.ascii_letters + string.digits
        return ''.join(random.choice(chars) for _ in range(length))


def run_simulation(config: Optional[Dict[str, Any]] = None, output_file: Optional[str] = None, seed: Optional[int] = None) -> List[Dict[str, Any]]:
    """
    Run a simulation and optionally save results to a file.
    
    Args:
        config: Optional configuration dictionary
        output_file: Optional output filename
        seed: Optional random seed
        
    Returns:
        List: Simulation results
    """
    simulator = ScenarioSimulator(config, seed)
    results = simulator.simulate_scenario_sequence(num_scenarios=20)
    
    if output_file:
        with open(output_file, "w") as f:
            json.dump(results, f, indent=2)
    
    return results


if __name__ == "__main__":
    # Run simulation and save results to file
    output_file = "simulation_results.json"
    results = run_simulation(output_file=output_file)
    print(f"Simulation completed and results saved to {output_file}")
    print(f"Simulated {len(results)} scenarios")
    
    # Count scenario types
    scenario_counts = {}
    for result in results:
        scenario = result["scenario"]
        scenario_counts[scenario] = scenario_counts.get(scenario, 0) + 1
    
    print("Scenario distribution:")
    for scenario, count in scenario_counts.items():
        print(f"- {scenario}: {count} ({count/len(results)*100:.1f}%)")
