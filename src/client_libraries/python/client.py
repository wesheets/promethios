"""
Python Client Library for API Access

This module provides a Python client library for accessing the API,
with support for authentication, request handling, and response parsing.
"""

import requests
import json
import time
import logging
from typing import Dict, List, Optional, Any, Union, Callable
from datetime import datetime, timedelta
import os

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class ApiClient:
    """
    Python client for API access.
    
    This class provides functionality for:
    - API authentication
    - Request handling with automatic retries
    - Response parsing and error handling
    - Rate limiting compliance
    """
    
    def __init__(self, api_key: str = None, base_url: str = None, config: Dict[str, Any] = None):
        """
        Initialize the API client.
        
        Args:
            api_key: API key for authentication
            base_url: Base URL for API requests
            config: Additional configuration options
        """
        self.api_key = api_key or os.environ.get('API_KEY')
        self.base_url = base_url or os.environ.get('API_BASE_URL', 'https://api.example.com/v1')
        self.config = config or {}
        
        # Extract configuration values
        self.timeout = self.config.get('timeout', 30)
        self.max_retries = self.config.get('max_retries', 3)
        self.retry_delay = self.config.get('retry_delay', 1)
        self.retry_backoff = self.config.get('retry_backoff', 2)
        self.verify_ssl = self.config.get('verify_ssl', True)
        
        # Initialize session
        self.session = requests.Session()
        
        # Set default headers
        self.session.headers.update({
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'User-Agent': f'Python-ApiClient/1.0'
        })
        
        # Set API key if provided
        if self.api_key:
            self.session.headers.update({
                'Authorization': f'Bearer {self.api_key}'
            })
        
        logger.info(f"Initialized API client with base URL: {self.base_url}")
    
    def request(self, method: str, endpoint: str, params: Dict[str, Any] = None, 
               data: Dict[str, Any] = None, headers: Dict[str, str] = None, 
               files: Dict[str, Any] = None) -> Dict[str, Any]:
        """
        Send a request to the API.
        
        Args:
            method: HTTP method (GET, POST, PUT, DELETE, etc.)
            endpoint: API endpoint (without base URL)
            params: Query parameters
            data: Request body data
            headers: Additional headers
            files: Files to upload
            
        Returns:
            Dict: API response
            
        Raises:
            ApiError: If the API returns an error
            ConnectionError: If there's a network error
            TimeoutError: If the request times out
        """
        url = f"{self.base_url}/{endpoint.lstrip('/')}"
        request_headers = headers or {}
        
        # Convert data to JSON if it's a dict
        json_data = None
        if data is not None and not files:
            if isinstance(data, dict):
                json_data = data
                data = None
        
        # Retry logic
        retries = 0
        while True:
            try:
                response = self.session.request(
                    method=method,
                    url=url,
                    params=params,
                    data=data,
                    json=json_data,
                    headers=request_headers,
                    files=files,
                    timeout=self.timeout,
                    verify=self.verify_ssl
                )
                
                # Check for rate limiting
                if response.status_code == 429:
                    retry_after = int(response.headers.get('Retry-After', self.retry_delay))
                    logger.warning(f"Rate limited. Retrying after {retry_after} seconds.")
                    time.sleep(retry_after)
                    continue
                
                # Parse response
                try:
                    response_data = response.json() if response.content else {}
                except ValueError:
                    response_data = {'raw_content': response.text}
                
                # Check for errors
                if response.status_code >= 400:
                    error_message = response_data.get('error', {}).get('message', 'Unknown error')
                    error_code = response_data.get('error', {}).get('code', response.status_code)
                    
                    if response.status_code >= 500:
                        # Server error, can retry
                        if retries < self.max_retries:
                            retries += 1
                            delay = self.retry_delay * (self.retry_backoff ** retries)
                            logger.warning(f"Server error: {error_message}. Retrying in {delay} seconds.")
                            time.sleep(delay)
                            continue
                    
                    # Client error or max retries reached
                    raise ApiError(error_message, error_code, response_data)
                
                # Success
                return response_data
            
            except requests.exceptions.Timeout:
                if retries < self.max_retries:
                    retries += 1
                    delay = self.retry_delay * (self.retry_backoff ** retries)
                    logger.warning(f"Request timed out. Retrying in {delay} seconds.")
                    time.sleep(delay)
                else:
                    raise TimeoutError(f"Request timed out after {self.max_retries} retries")
            
            except requests.exceptions.ConnectionError as e:
                if retries < self.max_retries:
                    retries += 1
                    delay = self.retry_delay * (self.retry_backoff ** retries)
                    logger.warning(f"Connection error: {str(e)}. Retrying in {delay} seconds.")
                    time.sleep(delay)
                else:
                    raise ConnectionError(f"Connection failed after {self.max_retries} retries: {str(e)}")
            
            except Exception as e:
                # Unexpected error, don't retry
                logger.error(f"Unexpected error: {str(e)}")
                raise
    
    def get(self, endpoint: str, params: Dict[str, Any] = None, 
           headers: Dict[str, str] = None) -> Dict[str, Any]:
        """
        Send a GET request to the API.
        
        Args:
            endpoint: API endpoint
            params: Query parameters
            headers: Additional headers
            
        Returns:
            Dict: API response
        """
        return self.request('GET', endpoint, params=params, headers=headers)
    
    def post(self, endpoint: str, data: Dict[str, Any] = None, 
            params: Dict[str, Any] = None, headers: Dict[str, str] = None,
            files: Dict[str, Any] = None) -> Dict[str, Any]:
        """
        Send a POST request to the API.
        
        Args:
            endpoint: API endpoint
            data: Request body data
            params: Query parameters
            headers: Additional headers
            files: Files to upload
            
        Returns:
            Dict: API response
        """
        return self.request('POST', endpoint, params=params, data=data, headers=headers, files=files)
    
    def put(self, endpoint: str, data: Dict[str, Any] = None, 
           params: Dict[str, Any] = None, headers: Dict[str, str] = None) -> Dict[str, Any]:
        """
        Send a PUT request to the API.
        
        Args:
            endpoint: API endpoint
            data: Request body data
            params: Query parameters
            headers: Additional headers
            
        Returns:
            Dict: API response
        """
        return self.request('PUT', endpoint, params=params, data=data, headers=headers)
    
    def delete(self, endpoint: str, params: Dict[str, Any] = None, 
              headers: Dict[str, str] = None) -> Dict[str, Any]:
        """
        Send a DELETE request to the API.
        
        Args:
            endpoint: API endpoint
            params: Query parameters
            headers: Additional headers
            
        Returns:
            Dict: API response
        """
        return self.request('DELETE', endpoint, params=params, headers=headers)
    
    def patch(self, endpoint: str, data: Dict[str, Any] = None, 
             params: Dict[str, Any] = None, headers: Dict[str, str] = None) -> Dict[str, Any]:
        """
        Send a PATCH request to the API.
        
        Args:
            endpoint: API endpoint
            data: Request body data
            params: Query parameters
            headers: Additional headers
            
        Returns:
            Dict: API response
        """
        return self.request('PATCH', endpoint, params=params, data=data, headers=headers)
    
    def set_api_key(self, api_key: str) -> None:
        """
        Set the API key for authentication.
        
        Args:
            api_key: API key
        """
        self.api_key = api_key
        self.session.headers.update({
            'Authorization': f'Bearer {api_key}'
        })
        logger.info("Updated API key")
    
    def set_base_url(self, base_url: str) -> None:
        """
        Set the base URL for API requests.
        
        Args:
            base_url: Base URL
        """
        self.base_url = base_url
        logger.info(f"Updated base URL: {base_url}")


class ApiError(Exception):
    """
    Exception raised for API errors.
    
    Attributes:
        message: Error message
        code: Error code
        response: Full API response
    """
    
    def __init__(self, message: str, code: int, response: Dict[str, Any] = None):
        self.message = message
        self.code = code
        self.response = response
        super().__init__(f"API Error {code}: {message}")


class Resource:
    """
    Base class for API resources.
    
    This class provides common functionality for API resources.
    """
    
    def __init__(self, client: ApiClient, base_endpoint: str):
        """
        Initialize the resource.
        
        Args:
            client: API client
            base_endpoint: Base endpoint for this resource
        """
        self.client = client
        self.base_endpoint = base_endpoint.rstrip('/')
    
    def _get_endpoint(self, path: str = '') -> str:
        """
        Get the full endpoint for a path.
        
        Args:
            path: Path to append to base endpoint
            
        Returns:
            str: Full endpoint
        """
        if not path:
            return self.base_endpoint
        
        return f"{self.base_endpoint}/{path.lstrip('/')}"
    
    def list(self, params: Dict[str, Any] = None) -> Dict[str, Any]:
        """
        List resources.
        
        Args:
            params: Query parameters
            
        Returns:
            Dict: API response
        """
        return self.client.get(self._get_endpoint(), params=params)
    
    def get(self, resource_id: str, params: Dict[str, Any] = None) -> Dict[str, Any]:
        """
        Get a resource by ID.
        
        Args:
            resource_id: Resource ID
            params: Query parameters
            
        Returns:
            Dict: API response
        """
        return self.client.get(self._get_endpoint(resource_id), params=params)
    
    def create(self, data: Dict[str, Any], params: Dict[str, Any] = None) -> Dict[str, Any]:
        """
        Create a resource.
        
        Args:
            data: Resource data
            params: Query parameters
            
        Returns:
            Dict: API response
        """
        return self.client.post(self._get_endpoint(), data=data, params=params)
    
    def update(self, resource_id: str, data: Dict[str, Any], 
              params: Dict[str, Any] = None) -> Dict[str, Any]:
        """
        Update a resource.
        
        Args:
            resource_id: Resource ID
            data: Resource data
            params: Query parameters
            
        Returns:
            Dict: API response
        """
        return self.client.put(self._get_endpoint(resource_id), data=data, params=params)
    
    def delete(self, resource_id: str, params: Dict[str, Any] = None) -> Dict[str, Any]:
        """
        Delete a resource.
        
        Args:
            resource_id: Resource ID
            params: Query parameters
            
        Returns:
            Dict: API response
        """
        return self.client.delete(self._get_endpoint(resource_id), params=params)
    
    def patch(self, resource_id: str, data: Dict[str, Any], 
             params: Dict[str, Any] = None) -> Dict[str, Any]:
        """
        Partially update a resource.
        
        Args:
            resource_id: Resource ID
            data: Resource data
            params: Query parameters
            
        Returns:
            Dict: API response
        """
        return self.client.patch(self._get_endpoint(resource_id), data=data, params=params)


class AccessTierResource(Resource):
    """
    Access tier resource for the API.
    
    This class provides functionality for managing access tiers.
    """
    
    def __init__(self, client: ApiClient):
        """
        Initialize the access tier resource.
        
        Args:
            client: API client
        """
        super().__init__(client, 'access-tiers')
    
    def get_current(self) -> Dict[str, Any]:
        """
        Get the current user's access tier.
        
        Returns:
            Dict: API response
        """
        return self.client.get(self._get_endpoint('current'))
    
    def request_upgrade(self, tier_id: str) -> Dict[str, Any]:
        """
        Request an upgrade to a new tier.
        
        Args:
            tier_id: Target tier ID
            
        Returns:
            Dict: API response
        """
        return self.client.post(self._get_endpoint('request-upgrade'), data={'tier_id': tier_id})
    
    def get_upgrade_status(self, request_id: str) -> Dict[str, Any]:
        """
        Get the status of a tier upgrade request.
        
        Args:
            request_id: Request ID
            
        Returns:
            Dict: API response
        """
        return self.client.get(self._get_endpoint(f'upgrade-status/{request_id}'))
    
    def get_quota_usage(self) -> Dict[str, Any]:
        """
        Get the current user's quota usage.
        
        Returns:
            Dict: API response
        """
        return self.client.get(self._get_endpoint('quota-usage'))


class ApiKeyResource(Resource):
    """
    API key resource for the API.
    
    This class provides functionality for managing API keys.
    """
    
    def __init__(self, client: ApiClient):
        """
        Initialize the API key resource.
        
        Args:
            client: API client
        """
        super().__init__(client, 'api-keys')
    
    def create_key(self, name: str = None, expiry_days: int = None) -> Dict[str, Any]:
        """
        Create a new API key.
        
        Args:
            name: Key name
            expiry_days: Number of days until expiry
            
        Returns:
            Dict: API response
        """
        data = {}
        if name:
            data['name'] = name
        if expiry_days:
            data['expiry_days'] = expiry_days
        
        return self.client.post(self._get_endpoint(), data=data)
    
    def revoke_key(self, key_id: str) -> Dict[str, Any]:
        """
        Revoke an API key.
        
        Args:
            key_id: Key ID
            
        Returns:
            Dict: API response
        """
        return self.client.delete(self._get_endpoint(key_id))
    
    def get_current(self) -> Dict[str, Any]:
        """
        Get the current API key information.
        
        Returns:
            Dict: API response
        """
        return self.client.get(self._get_endpoint('current'))


class UserResource(Resource):
    """
    User resource for the API.
    
    This class provides functionality for managing user accounts.
    """
    
    def __init__(self, client: ApiClient):
        """
        Initialize the user resource.
        
        Args:
            client: API client
        """
        super().__init__(client, 'users')
    
    def get_profile(self) -> Dict[str, Any]:
        """
        Get the current user's profile.
        
        Returns:
            Dict: API response
        """
        return self.client.get(self._get_endpoint('profile'))
    
    def update_profile(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Update the current user's profile.
        
        Args:
            data: Profile data
            
        Returns:
            Dict: API response
        """
        return self.client.put(self._get_endpoint('profile'), data=data)
    
    def get_preferences(self) -> Dict[str, Any]:
        """
        Get the current user's preferences.
        
        Returns:
            Dict: API response
        """
        return self.client.get(self._get_endpoint('preferences'))
    
    def update_preferences(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Update the current user's preferences.
        
        Args:
            data: Preference data
            
        Returns:
            Dict: API response
        """
        return self.client.put(self._get_endpoint('preferences'), data=data)


class SandboxResource(Resource):
    """
    Sandbox resource for the API.
    
    This class provides functionality for interacting with the sandbox environment.
    """
    
    def __init__(self, client: ApiClient):
        """
        Initialize the sandbox resource.
        
        Args:
            client: API client
        """
        super().__init__(client, 'sandbox')
    
    def create_environment(self, name: str = None, template: str = None) -> Dict[str, Any]:
        """
        Create a new sandbox environment.
        
        Args:
            name: Environment name
            template: Template to use
            
        Returns:
            Dict: API response
        """
        data = {}
        if name:
            data['name'] = name
        if template:
            data['template'] = template
        
        return self.client.post(self._get_endpoint('environments'), data=data)
    
    def get_environment(self, environment_id: str) -> Dict[str, Any]:
        """
        Get a sandbox environment.
        
        Args:
            environment_id: Environment ID
            
        Returns:
            Dict: API response
        """
        return self.client.get(self._get_endpoint(f'environments/{environment_id}'))
    
    def delete_environment(self, environment_id: str) -> Dict[str, Any]:
        """
        Delete a sandbox environment.
        
        Args:
            environment_id: Environment ID
            
        Returns:
            Dict: API response
        """
        return self.client.delete(self._get_endpoint(f'environments/{environment_id}'))
    
    def execute_request(self, environment_id: str, endpoint: str, method: str = 'GET',
                      data: Dict[str, Any] = None) -> Dict[str, Any]:
        """
        Execute a request in the sandbox environment.
        
        Args:
            environment_id: Environment ID
            endpoint: API endpoint
            method: HTTP method
            data: Request data
            
        Returns:
            Dict: API response
        """
        request_data = {
            'endpoint': endpoint,
            'method': method
        }
        
        if data:
            request_data['data'] = data
        
        return self.client.post(self._get_endpoint(f'environments/{environment_id}/execute'), data=request_data)


class FeedbackResource(Resource):
    """
    Feedback resource for the API.
    
    This class provides functionality for submitting and managing feedback.
    """
    
    def __init__(self, client: ApiClient):
        """
        Initialize the feedback resource.
        
        Args:
            client: API client
        """
        super().__init__(client, 'feedback')
    
    def submit(self, feedback_type: str, content: str, 
              metadata: Dict[str, Any] = None) -> Dict[str, Any]:
        """
        Submit feedback.
        
        Args:
            feedback_type: Type of feedback
            content: Feedback content
            metadata: Additional metadata
            
        Returns:
            Dict: API response
        """
        data = {
            'type': feedback_type,
            'content': content
        }
        
        if metadata:
            data['metadata'] = metadata
        
        return self.client.post(self._get_endpoint(), data=data)
    
    def get_submissions(self) -> Dict[str, Any]:
        """
        Get the current user's feedback submissions.
        
        Returns:
            Dict: API response
        """
        return self.client.get(self._get_endpoint('submissions'))
    
    def get_submission(self, submission_id: str) -> Dict[str, Any]:
        """
        Get a feedback submission.
        
        Args:
            submission_id: Submission ID
            
        Returns:
            Dict: API response
        """
        return self.client.get(self._get_endpoint(f'submissions/{submission_id}'))


class Client:
    """
    Main client for the API.
    
    This class provides access to all API resources.
    """
    
    def __init__(self, api_key: str = None, base_url: str = None, config: Dict[str, Any] = None):
        """
        Initialize the client.
        
        Args:
            api_key: API key for authentication
            base_url: Base URL for API requests
            config: Additional configuration options
        """
        self.api_client = ApiClient(api_key, base_url, config)
        
        # Initialize resources
        self.access_tiers = AccessTierResource(self.api_client)
        self.api_keys = ApiKeyResource(self.api_client)
        self.users = UserResource(self.api_client)
        self.sandbox = SandboxResource(self.api_client)
        self.feedback = FeedbackResource(self.api_client)
    
    def set_api_key(self, api_key: str) -> None:
        """
        Set the API key for authentication.
        
        Args:
            api_key: API key
        """
        self.api_client.set_api_key(api_key)
    
    def set_base_url(self, base_url: str) -> None:
        """
        Set the base URL for API requests.
        
        Args:
            base_url: Base URL
        """
        self.api_client.set_base_url(base_url)
