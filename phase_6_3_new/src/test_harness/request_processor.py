"""
Request Processor for the Promethios Test Harness.

This module provides functionality for handling construction and execution of API requests
with proper authentication and validation.
"""

import json
import logging
import requests
from typing import Dict, Any, Optional, Union
from datetime import datetime
import time

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class RequestProcessor:
    """
    Processor for handling API requests in the Promethios test harness.
    
    The RequestProcessor provides functionality for constructing, authenticating,
    and executing API requests against the Promethios API endpoints.
    """
    
    def __init__(self, base_url: str, auth_config: Dict = None):
        """
        Initialize the RequestProcessor.
        
        Args:
            base_url: Base URL for the API.
            auth_config: Authentication configuration.
        """
        self.base_url = base_url.rstrip('/')
        self.auth_config = auth_config or {}
        self.session = requests.Session()
        self.auth_token = None
        self.token_expiry = None
        
        logger.info(f"RequestProcessor initialized with base URL: {self.base_url}")
    
    def _ensure_authentication(self) -> None:
        """
        Ensure that authentication is valid, refreshing if necessary.
        
        Raises:
            ValueError: If authentication fails.
        """
        # Check if we need to authenticate or refresh token
        if not self.auth_token or (self.token_expiry and datetime.now() >= self.token_expiry):
            self._authenticate()
    
    def _authenticate(self) -> None:
        """
        Authenticate with the API.
        
        Raises:
            ValueError: If authentication fails.
        """
        if not self.auth_config:
            logger.warning("No authentication configuration provided")
            return
        
        auth_endpoint = self.auth_config.get('endpoint', '/auth/token')
        auth_method = self.auth_config.get('method', 'POST')
        auth_payload = self.auth_config.get('payload', {})
        
        try:
            url = f"{self.base_url}{auth_endpoint}"
            response = self.session.request(
                method=auth_method,
                url=url,
                json=auth_payload,
                headers={'Content-Type': 'application/json'}
            )
            
            response.raise_for_status()
            auth_data = response.json()
            
            self.auth_token = auth_data.get('token')
            
            # Set token expiry if provided
            expires_in = auth_data.get('expires_in')
            if expires_in:
                self.token_expiry = datetime.now() + datetime.timedelta(seconds=expires_in)
            
            logger.info("Authentication successful")
        except Exception as e:
            logger.error(f"Authentication failed: {e}")
            raise ValueError(f"Authentication failed: {e}")
    
    def authenticate_request(self, request: Dict) -> Dict:
        """
        Add authentication to a request.
        
        Args:
            request: The request to authenticate.
            
        Returns:
            The authenticated request.
        """
        self._ensure_authentication()
        
        if not self.auth_token:
            return request
        
        # Clone the request to avoid modifying the original
        authenticated_request = request.copy()
        
        # Add authentication header
        headers = authenticated_request.get('headers', {})
        headers['Authorization'] = f"Bearer {self.auth_token}"
        authenticated_request['headers'] = headers
        
        return authenticated_request
    
    def process_request(self, endpoint: str, method: str, payload: Dict = None, 
                       headers: Dict = None, authenticate: bool = True) -> Dict:
        """
        Process an API request.
        
        Args:
            endpoint: API endpoint to call.
            method: HTTP method to use.
            payload: Request payload.
            headers: Request headers.
            authenticate: Whether to authenticate the request.
            
        Returns:
            Dictionary containing the request details.
        """
        # Construct the request
        request = {
            'url': f"{self.base_url}{endpoint}",
            'method': method,
            'headers': headers or {},
            'payload': payload
        }
        
        # Add content type if not present
        if 'Content-Type' not in request['headers']:
            request['headers']['Content-Type'] = 'application/json'
        
        # Authenticate if required
        if authenticate:
            request = self.authenticate_request(request)
        
        return request
    
    def execute_request(self, request: Dict, timeout: int = 30, 
                       retry_attempts: int = 0, retry_delay: int = 1) -> Dict:
        """
        Execute a request and return the response.
        
        Args:
            request: The request to execute.
            timeout: Request timeout in seconds.
            retry_attempts: Number of retry attempts for failed requests.
            retry_delay: Delay between retries in seconds.
            
        Returns:
            Dictionary containing the response details.
        """
        url = request['url']
        method = request['method']
        headers = request['headers']
        payload = request.get('payload')
        
        attempt = 0
        while True:
            attempt += 1
            start_time = time.time()
            
            try:
                response = self.session.request(
                    method=method,
                    url=url,
                    json=payload if payload else None,
                    headers=headers,
                    timeout=timeout
                )
                
                duration = time.time() - start_time
                
                # Construct response object
                result = {
                    'status_code': response.status_code,
                    'headers': dict(response.headers),
                    'duration': duration,
                    'timestamp': datetime.now().isoformat()
                }
                
                # Try to parse JSON response
                try:
                    result['body'] = response.json()
                except ValueError:
                    result['body'] = response.text
                
                logger.info(f"Request to {url} completed with status {response.status_code} in {duration:.2f}s")
                return result
                
            except requests.exceptions.RequestException as e:
                duration = time.time() - start_time
                logger.warning(f"Request to {url} failed: {e}")
                
                if attempt <= retry_attempts:
                    logger.info(f"Retrying in {retry_delay}s (attempt {attempt}/{retry_attempts})")
                    time.sleep(retry_delay)
                else:
                    logger.error(f"Request to {url} failed after {attempt} attempts")
                    return {
                        'error': str(e),
                        'duration': duration,
                        'timestamp': datetime.now().isoformat()
                    }
    
    def execute_step(self, step: Dict, context: Dict = None) -> Dict:
        """
        Execute a test step.
        
        Args:
            step: The test step to execute.
            context: Optional context from previous steps.
            
        Returns:
            Dictionary containing the step execution results.
        """
        context = context or {}
        
        # Extract step details
        endpoint = step['endpoint']
        method = step['method']
        payload = step.get('payload', {})
        headers = step.get('headers', {})
        
        # Process template variables in endpoint, payload, and headers
        endpoint = self._process_templates(endpoint, context)
        payload = self._process_templates(payload, context)
        headers = self._process_templates(headers, context)
        
        # Process the request
        request = self.process_request(
            endpoint=endpoint,
            method=method,
            payload=payload,
            headers=headers
        )
        
        # Execute the request
        timeout = step.get('timeout', 30)
        retry = step.get('retry', {})
        retry_attempts = retry.get('attempts', 0)
        retry_delay = retry.get('delay', 1)
        
        response = self.execute_request(
            request=request,
            timeout=timeout,
            retry_attempts=retry_attempts,
            retry_delay=retry_delay
        )
        
        # Return the result
        return {
            'step_id': step['id'],
            'request': request,
            'response': response,
            'timestamp': datetime.now().isoformat()
        }
    
    def _process_templates(self, obj: Any, context: Dict) -> Any:
        """
        Process template variables in strings, dictionaries, or lists.
        
        Args:
            obj: The object to process.
            context: The context containing variable values.
            
        Returns:
            The processed object.
        """
        if isinstance(obj, str):
            # Replace template variables in strings
            for key, value in context.items():
                obj = obj.replace(f"${{{key}}}", str(value))
            return obj
        elif isinstance(obj, dict):
            # Process each value in the dictionary
            return {k: self._process_templates(v, context) for k, v in obj.items()}
        elif isinstance(obj, list):
            # Process each item in the list
            return [self._process_templates(item, context) for item in obj]
        else:
            # Return other types unchanged
            return obj


# Example usage
if __name__ == "__main__":
    processor = RequestProcessor(base_url="http://localhost:8000")
    
    # Example request
    request = processor.process_request(
        endpoint="/api/v1/status",
        method="GET"
    )
    
    # Execute the request
    response = processor.execute_request(request)
    print(json.dumps(response, indent=2))
