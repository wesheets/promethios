"""
Developer Experience Portal - Interactive API Explorer

This module implements the interactive API explorer for the Developer Experience Portal,
allowing developers to test API endpoints, view responses, and generate code snippets.
"""

import logging
import json
import requests
import time
from typing import Dict, List, Optional, Any, Union
from datetime import datetime
import os
import re
import base64
import hmac
import hashlib

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class ApiExplorer:
    """
    Interactive API Explorer for the Developer Experience Portal.
    
    This class provides functionality for:
    - Testing API endpoints with live responses
    - Generating code snippets in multiple languages
    - Saving and sharing API requests
    - Integrating with access tier permissions
    """
    
    def __init__(self, config: Dict[str, Any] = None):
        """
        Initialize the API explorer.
        
        Args:
            config: Configuration dictionary
        """
        self.config = config or {}
        
        # Extract configuration values
        self.base_url = self.config.get('base_url', 'https://api.promethios.ai')
        self.sandbox_mode = self.config.get('sandbox_mode', True)
        self.rate_limit = self.config.get('rate_limit', 60)  # requests per minute
        self.supported_languages = self.config.get('supported_languages', ['python', 'javascript', 'java', 'go'])
        self.default_language = self.config.get('default_language', 'python')
        
        # Store request history
        self.request_history = {}
        
        # Store rate limiting data
        self.request_timestamps = {}
        
        logger.info(f"Initialized API explorer with base URL: {self.base_url}")
        logger.info(f"Sandbox mode: {self.sandbox_mode}")
    
    def execute_request(self, user_id: str, endpoint: str, method: str, 
                      headers: Dict[str, str] = None, params: Dict[str, Any] = None, 
                      body: Dict[str, Any] = None) -> Dict[str, Any]:
        """
        Execute an API request.
        
        Args:
            user_id: User ID
            endpoint: API endpoint
            method: HTTP method
            headers: Request headers
            params: Query parameters
            body: Request body
            
        Returns:
            Dict: Response data
        """
        # Check rate limit
        if not self._check_rate_limit(user_id):
            return {
                "error": "Rate limit exceeded",
                "status_code": 429,
                "message": f"Maximum {self.rate_limit} requests per minute allowed"
            }
        
        # Prepare request URL
        if endpoint.startswith('/'):
            url = f"{self.base_url}{endpoint}"
        else:
            url = f"{self.base_url}/{endpoint}"
        
        # Prepare headers
        request_headers = {
            "User-Agent": "Promethios-API-Explorer/1.0",
            "Content-Type": "application/json"
        }
        
        if headers:
            request_headers.update(headers)
        
        # Add sandbox header if in sandbox mode
        if self.sandbox_mode:
            request_headers["X-Promethios-Sandbox"] = "true"
        
        # Prepare request data
        request_data = {
            "url": url,
            "method": method,
            "headers": request_headers,
            "params": params or {},
            "body": body or {}
        }
        
        # Execute request
        try:
            start_time = time.time()
            
            if method.upper() == "GET":
                response = requests.get(url, headers=request_headers, params=params)
            elif method.upper() == "POST":
                response = requests.post(url, headers=request_headers, params=params, json=body)
            elif method.upper() == "PUT":
                response = requests.put(url, headers=request_headers, params=params, json=body)
            elif method.upper() == "DELETE":
                response = requests.delete(url, headers=request_headers, params=params, json=body)
            elif method.upper() == "PATCH":
                response = requests.patch(url, headers=request_headers, params=params, json=body)
            else:
                return {
                    "error": "Unsupported method",
                    "status_code": 400,
                    "message": f"Method {method} is not supported"
                }
            
            end_time = time.time()
            duration_ms = int((end_time - start_time) * 1000)
            
            # Parse response
            try:
                response_body = response.json()
            except:
                response_body = {"raw": response.text}
            
            # Store in history
            request_id = self._store_request(user_id, request_data, {
                "status_code": response.status_code,
                "headers": dict(response.headers),
                "body": response_body,
                "duration_ms": duration_ms
            })
            
            # Return response data
            return {
                "request_id": request_id,
                "status_code": response.status_code,
                "headers": dict(response.headers),
                "body": response_body,
                "duration_ms": duration_ms
            }
        except Exception as e:
            logger.error(f"Error executing request: {str(e)}")
            
            return {
                "error": "Request failed",
                "status_code": 500,
                "message": str(e)
            }
    
    def generate_code_snippet(self, request_data: Dict[str, Any], language: str = None) -> str:
        """
        Generate a code snippet for an API request.
        
        Args:
            request_data: Request data
            language: Programming language
            
        Returns:
            str: Code snippet
        """
        language = language or self.default_language
        
        if language not in self.supported_languages:
            return f"Language '{language}' not supported. Supported languages: {', '.join(self.supported_languages)}"
        
        # Extract request data
        url = request_data.get("url", "")
        method = request_data.get("method", "GET")
        headers = request_data.get("headers", {})
        params = request_data.get("params", {})
        body = request_data.get("body", {})
        
        # Generate code snippet based on language
        if language == "python":
            return self._generate_python_snippet(url, method, headers, params, body)
        elif language == "javascript":
            return self._generate_javascript_snippet(url, method, headers, params, body)
        elif language == "java":
            return self._generate_java_snippet(url, method, headers, params, body)
        elif language == "go":
            return self._generate_go_snippet(url, method, headers, params, body)
        else:
            return f"Code generation for '{language}' not implemented"
    
    def get_request_history(self, user_id: str, limit: int = 10) -> List[Dict[str, Any]]:
        """
        Get request history for a user.
        
        Args:
            user_id: User ID
            limit: Maximum number of requests to return
            
        Returns:
            List: Request history
        """
        if user_id not in self.request_history:
            return []
        
        # Get user's request history
        history = self.request_history[user_id]
        
        # Sort by timestamp (newest first)
        sorted_history = sorted(history.values(), key=lambda x: x["timestamp"], reverse=True)
        
        # Limit results
        return sorted_history[:limit]
    
    def get_request_by_id(self, user_id: str, request_id: str) -> Optional[Dict[str, Any]]:
        """
        Get a specific request by ID.
        
        Args:
            user_id: User ID
            request_id: Request ID
            
        Returns:
            Dict: Request data or None if not found
        """
        if user_id not in self.request_history:
            return None
        
        return self.request_history[user_id].get(request_id)
    
    def save_request_as_favorite(self, user_id: str, request_id: str, name: str = None) -> Dict[str, Any]:
        """
        Save a request as a favorite.
        
        Args:
            user_id: User ID
            request_id: Request ID
            name: Favorite name
            
        Returns:
            Dict: Result
        """
        if user_id not in self.request_history:
            return {"success": False, "error": "User has no request history"}
        
        if request_id not in self.request_history[user_id]:
            return {"success": False, "error": "Request not found"}
        
        # Get request
        request = self.request_history[user_id][request_id]
        
        # Mark as favorite
        request["favorite"] = True
        request["favorite_name"] = name or f"Favorite {datetime.now().strftime('%Y-%m-%d %H:%M')}"
        
        return {
            "success": True,
            "request_id": request_id,
            "favorite_name": request["favorite_name"]
        }
    
    def get_favorites(self, user_id: str) -> List[Dict[str, Any]]:
        """
        Get favorite requests for a user.
        
        Args:
            user_id: User ID
            
        Returns:
            List: Favorite requests
        """
        if user_id not in self.request_history:
            return []
        
        # Filter favorites
        favorites = [
            request for request in self.request_history[user_id].values()
            if request.get("favorite", False)
        ]
        
        # Sort by timestamp (newest first)
        return sorted(favorites, key=lambda x: x["timestamp"], reverse=True)
    
    def _check_rate_limit(self, user_id: str) -> bool:
        """
        Check if a user has exceeded the rate limit.
        
        Args:
            user_id: User ID
            
        Returns:
            bool: True if within rate limit, False otherwise
        """
        now = time.time()
        
        # Initialize user's timestamps if not exists
        if user_id not in self.request_timestamps:
            self.request_timestamps[user_id] = []
        
        # Get user's timestamps
        timestamps = self.request_timestamps[user_id]
        
        # Remove timestamps older than 1 minute
        one_minute_ago = now - 60
        timestamps = [ts for ts in timestamps if ts > one_minute_ago]
        
        # Update timestamps
        self.request_timestamps[user_id] = timestamps
        
        # Check if within rate limit
        if len(timestamps) >= self.rate_limit:
            return False
        
        # Add current timestamp
        timestamps.append(now)
        
        return True
    
    def _store_request(self, user_id: str, request_data: Dict[str, Any], 
                     response_data: Dict[str, Any]) -> str:
        """
        Store a request in history.
        
        Args:
            user_id: User ID
            request_data: Request data
            response_data: Response data
            
        Returns:
            str: Request ID
        """
        # Generate request ID
        import uuid
        request_id = str(uuid.uuid4())
        
        # Initialize user's history if not exists
        if user_id not in self.request_history:
            self.request_history[user_id] = {}
        
        # Store request
        self.request_history[user_id][request_id] = {
            "id": request_id,
            "timestamp": datetime.now().isoformat(),
            "request": request_data,
            "response": response_data,
            "favorite": False
        }
        
        # Limit history size (keep last 100 requests)
        if len(self.request_history[user_id]) > 100:
            # Find oldest request
            oldest_id = min(
                self.request_history[user_id].keys(),
                key=lambda k: self.request_history[user_id][k]["timestamp"]
            )
            
            # Remove oldest request
            del self.request_history[user_id][oldest_id]
        
        return request_id
    
    def _generate_python_snippet(self, url: str, method: str, headers: Dict[str, str], 
                               params: Dict[str, Any], body: Dict[str, Any]) -> str:
        """
        Generate a Python code snippet.
        
        Args:
            url: Request URL
            method: HTTP method
            headers: Request headers
            params: Query parameters
            body: Request body
            
        Returns:
            str: Code snippet
        """
        snippet = [
            "import requests",
            "",
            f"url = '{url}'",
            f"method = '{method.upper()}'",
            ""
        ]
        
        # Add headers
        if headers:
            snippet.append("headers = {")
            for key, value in headers.items():
                snippet.append(f"    '{key}': '{value}',")
            snippet.append("}")
            snippet.append("")
        else:
            snippet.append("headers = {}")
            snippet.append("")
        
        # Add params
        if params:
            snippet.append("params = {")
            for key, value in params.items():
                if isinstance(value, str):
                    snippet.append(f"    '{key}': '{value}',")
                else:
                    snippet.append(f"    '{key}': {value},")
            snippet.append("}")
            snippet.append("")
        else:
            snippet.append("params = {}")
            snippet.append("")
        
        # Add body
        if body:
            snippet.append("body = {")
            for key, value in body.items():
                if isinstance(value, str):
                    snippet.append(f"    '{key}': '{value}',")
                else:
                    snippet.append(f"    '{key}': {value},")
            snippet.append("}")
            snippet.append("")
        else:
            snippet.append("body = {}")
            snippet.append("")
        
        # Add request
        snippet.append("try:")
        snippet.append("    if method == 'GET':")
        snippet.append("        response = requests.get(url, headers=headers, params=params)")
        snippet.append("    elif method == 'POST':")
        snippet.append("        response = requests.post(url, headers=headers, params=params, json=body)")
        snippet.append("    elif method == 'PUT':")
        snippet.append("        response = requests.put(url, headers=headers, params=params, json=body)")
        snippet.append("    elif method == 'DELETE':")
        snippet.append("        response = requests.delete(url, headers=headers, params=params, json=body)")
        snippet.append("    elif method == 'PATCH':")
        snippet.append("        response = requests.patch(url, headers=headers, params=params, json=body)")
        snippet.append("    else:")
        snippet.append("        print(f'Unsupported method: {method}')")
        snippet.append("        exit(1)")
        snippet.append("")
        snippet.append("    # Print status code")
        snippet.append("    print(f'Status code: {response.status_code}')")
        snippet.append("")
        snippet.append("    # Print response headers")
        snippet.append("    print('Response headers:')")
        snippet.append("    for key, value in response.headers.items():")
        snippet.append("        print(f'    {key}: {value}')")
        snippet.append("")
        snippet.append("    # Print response body")
        snippet.append("    print('Response body:')")
        snippet.append("    try:")
        snippet.append("        print(response.json())")
        snippet.append("    except:")
        snippet.append("        print(response.text)")
        snippet.append("except Exception as e:")
        snippet.append("    print(f'Error: {str(e)}')")
        
        return "\n".join(snippet)
    
    def _generate_javascript_snippet(self, url: str, method: str, headers: Dict[str, str], 
                                  params: Dict[str, Any], body: Dict[str, Any]) -> str:
        """
        Generate a JavaScript code snippet.
        
        Args:
            url: Request URL
            method: HTTP method
            headers: Request headers
            params: Query parameters
            body: Request body
            
        Returns:
            str: Code snippet
        """
        # Add query parameters to URL if present
        if params:
            param_parts = []
            for key, value in params.items():
                if isinstance(value, str):
                    param_parts.append(f"{key}={encodeURIComponent('{value}')}")
                else:
                    param_parts.append(f"{key}={value}")
            
            if "?" in url:
                url = f"{url}&{'&'.join(param_parts)}"
            else:
                url = f"{url}?{'&'.join(param_parts)}"
        
        snippet = [
            "// Using fetch API",
            "async function makeRequest() {",
            f"  const url = '{url}';",
            "  const options = {",
            f"    method: '{method.upper()}',",
            "    headers: {"
        ]
        
        # Add headers
        for key, value in headers.items():
            snippet.append(f"      '{key}': '{value}',")
        
        snippet.append("    },")
        
        # Add body
        if body and method.upper() != "GET":
            snippet.append("    body: JSON.stringify({")
            for key, value in body.items():
                if isinstance(value, str):
                    snippet.append(f"      '{key}': '{value}',")
                else:
                    snippet.append(f"      '{key}': {value},")
            snippet.append("    })")
        
        snippet.append("  };")
        snippet.append("")
        snippet.append("  try {")
        snippet.append("    const response = await fetch(url, options);")
        snippet.append("    const statusCode = response.status;")
        snippet.append("")
        snippet.append("    console.log(`Status code: ${statusCode}`);")
        snippet.append("")
        snippet.append("    console.log('Response headers:');")
        snippet.append("    for (const [key, value] of response.headers.entries()) {")
        snippet.append("      console.log(`    ${key}: ${value}`);")
        snippet.append("    }")
        snippet.append("")
        snippet.append("    console.log('Response body:');")
        snippet.append("    try {")
        snippet.append("      const data = await response.json();")
        snippet.append("      console.log(data);")
        snippet.append("    } catch (e) {")
        snippet.append("      const text = await response.text();")
        snippet.append("      console.log(text);")
        snippet.append("    }")
        snippet.append("  } catch (error) {")
        snippet.append("    console.error(`Error: ${error.message}`);")
        snippet.append("  }")
        snippet.append("}")
        snippet.append("")
        snippet.append("// Call the function")
        snippet.append("makeRequest();")
        
        return "\n".join(snippet)
    
    def _generate_java_snippet(self, url: str, method: str, headers: Dict[str, str], 
                            params: Dict[str, Any], body: Dict[str, Any]) -> str:
        """
        Generate a Java code snippet.
        
        Args:
            url: Request URL
            method: HTTP method
            headers: Request headers
            params: Query parameters
            body: Request body
            
        Returns:
            str: Code snippet
        """
        snippet = [
            "import java.io.BufferedReader;",
            "import java.io.InputStreamReader;",
            "import java.io.OutputStream;",
            "import java.net.HttpURLConnection;",
            "import java.net.URL;",
            "import java.net.URLEncoder;",
            "import java.nio.charset.StandardCharsets;",
            "import java.util.Map;",
            "import java.util.HashMap;",
            "",
            "public class ApiRequest {",
            "    public static void main(String[] args) {",
            "        try {"
        ]
        
        # Build URL with query parameters
        if params:
            snippet.append("            // Build query parameters")
            snippet.append("            StringBuilder queryParams = new StringBuilder();")
            first_param = True
            
            for key, value in params.items():
                if first_param:
                    snippet.append(f"            queryParams.append(\"{key}=\");")
                    first_param = False
                else:
                    snippet.append(f"            queryParams.append(\"&{key}=\");")
                
                if isinstance(value, str):
                    snippet.append(f"            queryParams.append(URLEncoder.encode(\"{value}\", StandardCharsets.UTF_8.toString()));")
                else:
                    snippet.append(f"            queryParams.append(\"{value}\");")
            
            if "?" in url:
                snippet.append(f"            URL url = new URL(\"{url}&\" + queryParams.toString());")
            else:
                snippet.append(f"            URL url = new URL(\"{url}?\" + queryParams.toString());")
        else:
            snippet.append(f"            URL url = new URL(\"{url}\");")
        
        # Create connection
        snippet.append("            HttpURLConnection conn = (HttpURLConnection) url.openConnection();")
        snippet.append(f"            conn.setRequestMethod(\"{method.upper()}\");")
        
        # Add headers
        for key, value in headers.items():
            snippet.append(f"            conn.setRequestProperty(\"{key}\", \"{value}\");")
        
        # Add body for non-GET requests
        if body and method.upper() != "GET":
            snippet.append("            conn.setDoOutput(true);")
            
            # Convert body to JSON
            json_body = json.dumps(body).replace('"', '\\"')
            
            snippet.append("            try (OutputStream os = conn.getOutputStream()) {")
            snippet.append(f"                byte[] input = \"{json_body}\".getBytes(StandardCharsets.UTF_8);")
            snippet.append("                os.write(input, 0, input.length);")
            snippet.append("            }")
        
        # Get response
        snippet.append("")
        snippet.append("            // Get response code")
        snippet.append("            int statusCode = conn.getResponseCode();")
        snippet.append("            System.out.println(\"Status code: \" + statusCode);")
        snippet.append("")
        snippet.append("            // Get response headers")
        snippet.append("            System.out.println(\"Response headers:\");")
        snippet.append("            conn.getHeaderFields().forEach((key, values) -> {")
        snippet.append("                if (key != null) {")
        snippet.append("                    System.out.println(\"    \" + key + \": \" + String.join(\", \", values));")
        snippet.append("                }")
        snippet.append("            });")
        snippet.append("")
        snippet.append("            // Get response body")
        snippet.append("            System.out.println(\"Response body:\");")
        snippet.append("            try (BufferedReader br = new BufferedReader(")
        snippet.append("                    new InputStreamReader(conn.getInputStream(), StandardCharsets.UTF_8))) {")
        snippet.append("                StringBuilder response = new StringBuilder();")
        snippet.append("                String responseLine;")
        snippet.append("                while ((responseLine = br.readLine()) != null) {")
        snippet.append("                    response.append(responseLine.trim());")
        snippet.append("                }")
        snippet.append("                System.out.println(response.toString());")
        snippet.append("            }")
        snippet.append("        } catch (Exception e) {")
        snippet.append("            System.out.println(\"Error: \" + e.getMessage());")
        snippet.append("            e.printStackTrace();")
        snippet.append("        }")
        snippet.append("    }")
        snippet.append("}")
        
        return "\n".join(snippet)
    
    def _generate_go_snippet(self, url: str, method: str, headers: Dict[str, str], 
                          params: Dict[str, Any], body: Dict[str, Any]) -> str:
        """
        Generate a Go code snippet.
        
        Args:
            url: Request URL
            method: HTTP method
            headers: Request headers
            params: Query parameters
            body: Request body
            
        Returns:
            str: Code snippet
        """
        snippet = [
            "package main",
            "",
            "import (",
            "    \"bytes\"",
            "    \"encoding/json\"",
            "    \"fmt\"",
            "    \"io/ioutil\"",
            "    \"net/http\"",
            "    \"net/url\"",
            ")",
            "",
            "func main() {"
        ]
        
        # Build URL with query parameters
        if params:
            snippet.append("    // Build query parameters")
            snippet.append("    baseURL, err := url.Parse(\"" + url + "\")")
            snippet.append("    if err != nil {")
            snippet.append("        fmt.Println(\"Error parsing URL:\", err)")
            snippet.append("        return")
            snippet.append("    }")
            snippet.append("")
            snippet.append("    params := url.Values{}")
            
            for key, value in params.items():
                if isinstance(value, str):
                    snippet.append(f"    params.Add(\"{key}\", \"{value}\")")
                else:
                    snippet.append(f"    params.Add(\"{key}\", fmt.Sprintf(\"%v\", {value}))")
            
            snippet.append("")
            snippet.append("    baseURL.RawQuery = params.Encode()")
            snippet.append("    url := baseURL.String()")
        else:
            snippet.append(f"    url := \"{url}\"")
        
        # Add body for non-GET requests
        if body and method.upper() != "GET":
            snippet.append("")
            snippet.append("    // Prepare request body")
            snippet.append("    requestBody := map[string]interface{}{")
            
            for key, value in body.items():
                if isinstance(value, str):
                    snippet.append(f"        \"{key}\": \"{value}\",")
                else:
                    snippet.append(f"        \"{key}\": {value},")
            
            snippet.append("    }")
            snippet.append("")
            snippet.append("    jsonBody, err := json.Marshal(requestBody)")
            snippet.append("    if err != nil {")
            snippet.append("        fmt.Println(\"Error creating request body:\", err)")
            snippet.append("        return")
            snippet.append("    }")
            snippet.append("")
            snippet.append("    // Create request")
            snippet.append(f"    req, err := http.NewRequest(\"{method.upper()}\", url, bytes.NewBuffer(jsonBody))")
        else:
            snippet.append("")
            snippet.append("    // Create request")
            snippet.append(f"    req, err := http.NewRequest(\"{method.upper()}\", url, nil)")
        
        snippet.append("    if err != nil {")
        snippet.append("        fmt.Println(\"Error creating request:\", err)")
        snippet.append("        return")
        snippet.append("    }")
        snippet.append("")
        
        # Add headers
        if headers:
            snippet.append("    // Add headers")
            for key, value in headers.items():
                snippet.append(f"    req.Header.Add(\"{key}\", \"{value}\")")
            snippet.append("")
        
        # Execute request
        snippet.append("    // Execute request")
        snippet.append("    client := &http.Client{}")
        snippet.append("    resp, err := client.Do(req)")
        snippet.append("    if err != nil {")
        snippet.append("        fmt.Println(\"Error executing request:\", err)")
        snippet.append("        return")
        snippet.append("    }")
        snippet.append("    defer resp.Body.Close()")
        snippet.append("")
        snippet.append("    // Print status code")
        snippet.append("    fmt.Println(\"Status code:\", resp.StatusCode)")
        snippet.append("")
        snippet.append("    // Print response headers")
        snippet.append("    fmt.Println(\"Response headers:\")")
        snippet.append("    for key, values := range resp.Header {")
        snippet.append("        fmt.Printf(\"    %s: %s\\n\", key, values[0])")
        snippet.append("    }")
        snippet.append("")
        snippet.append("    // Read response body")
        snippet.append("    body, err := ioutil.ReadAll(resp.Body)")
        snippet.append("    if err != nil {")
        snippet.append("        fmt.Println(\"Error reading response body:\", err)")
        snippet.append("        return")
        snippet.append("    }")
        snippet.append("")
        snippet.append("    // Print response body")
        snippet.append("    fmt.Println(\"Response body:\")")
        snippet.append("    var prettyJSON bytes.Buffer")
        snippet.append("    err = json.Indent(&prettyJSON, body, \"\", \"    \")")
        snippet.append("    if err != nil {")
        snippet.append("        fmt.Println(string(body))")
        snippet.append("    } else {")
        snippet.append("        fmt.Println(prettyJSON.String())")
        snippet.append("    }")
        snippet.append("}")
        
        return "\n".join(snippet)
