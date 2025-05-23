"""
Test Data Generator for Developer Sandbox Environment

This module provides utilities for generating test data for the developer sandbox environment.
It creates realistic but synthetic data for testing API endpoints, client libraries, and
other components of the system.
"""

import random
import string
import uuid
import json
import datetime
from typing import Dict, List, Any, Optional, Union

class TestDataGenerator:
    """
    Generator for test data used in the developer sandbox environment.
    
    This class provides methods for generating various types of test data:
    - User profiles
    - API resources
    - Access tier assignments
    - Usage records
    - API requests and responses
    """
    
    def __init__(self, seed: Optional[int] = None):
        """
        Initialize the test data generator.
        
        Args:
            seed: Optional random seed for reproducible data generation
        """
        if seed is not None:
            random.seed(seed)
        
        self.user_ids = []
        self.resource_ids = []
        self.tier_ids = ["tier_basic", "tier_standard", "tier_premium", "tier_enterprise"]
    
    def generate_user_profile(self) -> Dict[str, Any]:
        """
        Generate a random user profile.
        
        Returns:
            Dict: User profile data
        """
        # Generate a unique user ID
        user_id = f"user_{uuid.uuid4().hex[:8]}"
        self.user_ids.append(user_id)
        
        # Generate first and last name
        first_names = ["Alice", "Bob", "Charlie", "David", "Emma", "Frank", "Grace", "Henry", "Isabella", "Jack"]
        last_names = ["Smith", "Johnson", "Williams", "Jones", "Brown", "Davis", "Miller", "Wilson", "Moore", "Taylor"]
        
        first_name = random.choice(first_names)
        last_name = random.choice(last_names)
        
        # Generate email
        email_domains = ["example.com", "test.org", "demo.net", "sandbox.io"]
        email = f"{first_name.lower()}.{last_name.lower()}@{random.choice(email_domains)}"
        
        # Generate registration date (within the last year)
        days_ago = random.randint(1, 365)
        registration_date = (datetime.datetime.now() - datetime.timedelta(days=days_ago)).isoformat()
        
        # Generate profile
        return {
            "id": user_id,
            "first_name": first_name,
            "last_name": last_name,
            "email": email,
            "registration_date": registration_date,
            "status": random.choice(["active", "inactive", "pending"]),
            "preferences": {
                "notifications": random.choice([True, False]),
                "theme": random.choice(["light", "dark", "system"]),
                "language": random.choice(["en", "es", "fr", "de", "zh"])
            }
        }
    
    def generate_api_resource(self, resource_type: str = "generic") -> Dict[str, Any]:
        """
        Generate a random API resource.
        
        Args:
            resource_type: Type of resource to generate
            
        Returns:
            Dict: Resource data
        """
        # Generate a unique resource ID
        resource_id = f"{resource_type}_{uuid.uuid4().hex[:8]}"
        self.resource_ids.append(resource_id)
        
        # Generate creation date (within the last month)
        days_ago = random.randint(1, 30)
        creation_date = (datetime.datetime.now() - datetime.timedelta(days=days_ago)).isoformat()
        
        # Generate base resource
        resource = {
            "id": resource_id,
            "name": f"Test {resource_type.capitalize()} {random.randint(1, 1000)}",
            "description": f"This is a test {resource_type} resource for the developer sandbox.",
            "created_at": creation_date,
            "updated_at": creation_date,
            "status": random.choice(["active", "inactive", "archived"]),
            "tags": random.sample(["test", "demo", "sandbox", "example", "api", resource_type], k=random.randint(1, 3))
        }
        
        # Add resource-specific fields
        if resource_type == "document":
            resource.update({
                "content": "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
                "format": random.choice(["text", "markdown", "html"]),
                "size": random.randint(1024, 10240)
            })
        elif resource_type == "image":
            resource.update({
                "width": random.randint(800, 1920),
                "height": random.randint(600, 1080),
                "format": random.choice(["jpg", "png", "gif"]),
                "size": random.randint(50000, 500000)
            })
        elif resource_type == "user":
            user_profile = self.generate_user_profile()
            resource.update({
                "user_profile": user_profile,
                "last_login": (datetime.datetime.now() - datetime.timedelta(days=random.randint(0, 10))).isoformat()
            })
        
        return resource
    
    def generate_tier_assignment(self, user_id: Optional[str] = None) -> Dict[str, Any]:
        """
        Generate a random tier assignment.
        
        Args:
            user_id: Optional user ID to assign the tier to
            
        Returns:
            Dict: Tier assignment data
        """
        # Use provided user ID or select a random one
        if user_id is None:
            if not self.user_ids:
                # Generate a user if none exist
                user_profile = self.generate_user_profile()
                user_id = user_profile["id"]
            else:
                user_id = random.choice(self.user_ids)
        
        # Select a random tier
        tier_id = random.choice(self.tier_ids)
        
        # Generate assignment date (within the last 6 months)
        days_ago = random.randint(1, 180)
        assigned_at = (datetime.datetime.now() - datetime.timedelta(days=days_ago)).isoformat()
        
        # Generate expiration date (within the next year)
        days_ahead = random.randint(1, 365)
        expires_at = (datetime.datetime.now() + datetime.timedelta(days=days_ahead)).isoformat()
        
        # Generate tier assignment
        return {
            "user_id": user_id,
            "tier_id": tier_id,
            "assigned_at": assigned_at,
            "expires_at": expires_at,
            "status": random.choice(["active", "pending", "expired"]),
            "auto_renew": random.choice([True, False])
        }
    
    def generate_usage_record(self, user_id: Optional[str] = None) -> Dict[str, Any]:
        """
        Generate a random usage record.
        
        Args:
            user_id: Optional user ID to generate usage for
            
        Returns:
            Dict: Usage record data
        """
        # Use provided user ID or select a random one
        if user_id is None:
            if not self.user_ids:
                # Generate a user if none exist
                user_profile = self.generate_user_profile()
                user_id = user_profile["id"]
            else:
                user_id = random.choice(self.user_ids)
        
        # Generate timestamp (within the last week)
        minutes_ago = random.randint(1, 10080)  # Up to 1 week ago
        timestamp = (datetime.datetime.now() - datetime.timedelta(minutes=minutes_ago)).isoformat()
        
        # Define API endpoints
        endpoints = [
            "/api/v1/resources",
            "/api/v1/resources/{id}",
            "/api/v1/users",
            "/api/v1/users/{id}",
            "/api/v1/documents",
            "/api/v1/images"
        ]
        
        # Generate usage record
        return {
            "id": f"usage_{uuid.uuid4().hex[:8]}",
            "user_id": user_id,
            "timestamp": timestamp,
            "endpoint": random.choice(endpoints).replace("{id}", f"{random.randint(1, 1000)}"),
            "method": random.choice(["GET", "POST", "PUT", "DELETE"]),
            "status_code": random.choice([200, 201, 400, 401, 403, 404, 500]),
            "response_time_ms": random.randint(50, 500),
            "request_size_bytes": random.randint(100, 1000),
            "response_size_bytes": random.randint(100, 10000),
            "client_ip": f"192.168.{random.randint(1, 255)}.{random.randint(1, 255)}",
            "user_agent": random.choice([
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
                "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Safari/605.1.15",
                "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
                "Python Requests/2.25.1",
                "Node.js/14.17.0 (axios/0.21.1)",
                "Java/11.0.11 (okhttp/4.9.1)"
            ])
        }
    
    def generate_api_request(self, endpoint: Optional[str] = None, method: Optional[str] = None) -> Dict[str, Any]:
        """
        Generate a random API request.
        
        Args:
            endpoint: Optional API endpoint
            method: Optional HTTP method
            
        Returns:
            Dict: API request data
        """
        # Define API endpoints if not provided
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
        
        # Define HTTP method if not provided
        if method is None:
            method = random.choice(["GET", "POST", "PUT", "DELETE"])
        
        # Generate headers
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {self._generate_random_string(32)}",
            "User-Agent": random.choice([
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
                "Python Requests/2.25.1",
                "Node.js/14.17.0 (axios/0.21.1)",
                "Java/11.0.11 (okhttp/4.9.1)"
            ]),
            "Accept": "application/json"
        }
        
        # Generate request body for POST and PUT methods
        body = None
        if method in ["POST", "PUT"]:
            resource_type = endpoint.split("/")[-1]
            if resource_type == "resources":
                body = {
                    "name": f"New Resource {random.randint(1, 1000)}",
                    "description": "This is a new test resource.",
                    "tags": random.sample(["test", "demo", "sandbox", "example", "api"], k=random.randint(1, 3))
                }
            elif resource_type == "users":
                body = {
                    "first_name": random.choice(["Alice", "Bob", "Charlie", "David", "Emma"]),
                    "last_name": random.choice(["Smith", "Johnson", "Williams", "Jones", "Brown"]),
                    "email": f"user{random.randint(1, 1000)}@example.com",
                    "status": "active"
                }
        
        # Generate request
        request = {
            "method": method,
            "endpoint": endpoint,
            "headers": headers
        }
        
        if body is not None:
            request["body"] = body
        
        return request
    
    def generate_api_response(self, request: Dict[str, Any]) -> Dict[str, Any]:
        """
        Generate a random API response based on a request.
        
        Args:
            request: API request data
            
        Returns:
            Dict: API response data
        """
        method = request["method"]
        endpoint = request["endpoint"]
        
        # Determine response status code
        success_probability = 0.9  # 90% chance of success
        if random.random() < success_probability:
            if method == "GET":
                status_code = 200
            elif method == "POST":
                status_code = 201
            elif method == "PUT":
                status_code = 200
            elif method == "DELETE":
                status_code = 204
            else:
                status_code = 200
        else:
            status_code = random.choice([400, 401, 403, 404, 500])
        
        # Generate response headers
        headers = {
            "Content-Type": "application/json",
            "Server": "API Sandbox/1.0",
            "Date": datetime.datetime.now().strftime("%a, %d %b %Y %H:%M:%S GMT"),
            "X-Request-ID": f"{uuid.uuid4()}"
        }
        
        # Generate response body
        body = None
        if status_code < 300:  # Success responses
            if method == "GET":
                resource_type = endpoint.split("/")[-1]
                if "{id}" in endpoint:  # Single resource
                    body = self.generate_api_resource(resource_type)
                else:  # Collection of resources
                    items = [self.generate_api_resource(resource_type) for _ in range(random.randint(1, 5))]
                    body = {
                        "items": items,
                        "total": len(items),
                        "page": 1,
                        "page_size": 10
                    }
            elif method == "POST":
                resource_type = endpoint.split("/")[-1]
                body = self.generate_api_resource(resource_type)
            elif method == "PUT":
                resource_type = endpoint.split("/")[-1]
                body = self.generate_api_resource(resource_type)
                body["updated_at"] = datetime.datetime.now().isoformat()
            elif method == "DELETE":
                body = None  # No content for DELETE
        else:  # Error responses
            error_messages = {
                400: "Bad Request: Invalid input parameters",
                401: "Unauthorized: Authentication required",
                403: "Forbidden: Insufficient permissions",
                404: "Not Found: Resource does not exist",
                500: "Internal Server Error: Something went wrong"
            }
            body = {
                "error": {
                    "code": status_code,
                    "message": error_messages.get(status_code, "Unknown error")
                }
            }
        
        # Generate response
        response = {
            "status_code": status_code,
            "headers": headers
        }
        
        if body is not None:
            response["body"] = body
        
        return response
    
    def generate_dataset(self, num_users: int = 10, num_resources: int = 20, num_usage_records: int = 50) -> Dict[str, List[Dict[str, Any]]]:
        """
        Generate a complete dataset for testing.
        
        Args:
            num_users: Number of user profiles to generate
            num_resources: Number of API resources to generate
            num_usage_records: Number of usage records to generate
            
        Returns:
            Dict: Complete dataset with users, resources, tier assignments, and usage records
        """
        # Generate user profiles
        users = [self.generate_user_profile() for _ in range(num_users)]
        
        # Generate resources of different types
        resource_types = ["generic", "document", "image", "user"]
        resources = []
        for _ in range(num_resources):
            resource_type = random.choice(resource_types)
            resources.append(self.generate_api_resource(resource_type))
        
        # Generate tier assignments for each user
        tier_assignments = [self.generate_tier_assignment(user["id"]) for user in users]
        
        # Generate usage records
        usage_records = []
        for _ in range(num_usage_records):
            user_id = random.choice(users)["id"]
            usage_records.append(self.generate_usage_record(user_id))
        
        # Generate API requests and responses
        api_interactions = []
        for _ in range(num_usage_records // 2):
            request = self.generate_api_request()
            response = self.generate_api_response(request)
            api_interactions.append({
                "request": request,
                "response": response
            })
        
        # Return complete dataset
        return {
            "users": users,
            "resources": resources,
            "tier_assignments": tier_assignments,
            "usage_records": usage_records,
            "api_interactions": api_interactions
        }
    
    def save_dataset_to_file(self, dataset: Dict[str, List[Dict[str, Any]]], filename: str) -> None:
        """
        Save a dataset to a JSON file.
        
        Args:
            dataset: Dataset to save
            filename: Output filename
        """
        with open(filename, "w") as f:
            json.dump(dataset, f, indent=2)
    
    def _generate_random_string(self, length: int) -> str:
        """
        Generate a random string of specified length.
        
        Args:
            length: Length of the string
            
        Returns:
            str: Random string
        """
        chars = string.ascii_letters + string.digits
        return ''.join(random.choice(chars) for _ in range(length))


def generate_test_data(output_file: Optional[str] = None, seed: Optional[int] = None) -> Dict[str, List[Dict[str, Any]]]:
    """
    Generate test data and optionally save to a file.
    
    Args:
        output_file: Optional output filename
        seed: Optional random seed
        
    Returns:
        Dict: Generated dataset
    """
    generator = TestDataGenerator(seed)
    dataset = generator.generate_dataset()
    
    if output_file:
        generator.save_dataset_to_file(dataset, output_file)
    
    return dataset


if __name__ == "__main__":
    # Generate test data and save to file
    output_file = "test_data.json"
    dataset = generate_test_data(output_file)
    print(f"Generated test data and saved to {output_file}")
    print(f"Dataset contains:")
    print(f"- {len(dataset['users'])} users")
    print(f"- {len(dataset['resources'])} resources")
    print(f"- {len(dataset['tier_assignments'])} tier assignments")
    print(f"- {len(dataset['usage_records'])} usage records")
    print(f"- {len(dataset['api_interactions'])} API interactions")
