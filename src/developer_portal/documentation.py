"""
Developer Experience Portal - API Documentation Hub

This module implements the API documentation hub for the Developer Experience Portal,
providing comprehensive documentation, interactive examples, and SDK integration.
"""

import logging
from typing import Dict, List, Optional, Any, Union
from datetime import datetime
import os
import json
import re

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class DocumentationManager:
    """
    API Documentation Hub for the Developer Experience Portal.
    
    This class provides functionality for:
    - Managing API documentation content
    - Organizing documentation by category and version
    - Integrating interactive examples
    - Connecting documentation with access tiers
    """
    
    def __init__(self, config: Dict[str, Any] = None):
        """
        Initialize the documentation hub.
        
        Args:
            config: Configuration dictionary
        """
        self.config = config or {}
        
        # Extract configuration values
        self.docs_dir = self.config.get('docs_dir', 'api_docs')
        self.default_version = self.config.get('default_version', 'v1')
        self.enable_versioning = self.config.get('enable_versioning', True)
        self.enable_search = self.config.get('enable_search', True)
        self.enable_examples = self.config.get('enable_examples', True)
        
        # Store documentation content
        self.documentation = {}
        
        # Store category metadata
        self.categories = {}
        
        # Store version metadata
        self.versions = {}
        
        # Store search index
        self.search_index = {}
        
        logger.info(f"Initialized documentation hub with docs directory: {self.docs_dir}")
    
    def load_documentation(self, docs_dir: str = None) -> Dict[str, Any]:
        """
        Load documentation from files.
        
        Args:
            docs_dir: Documentation directory (optional)
            
        Returns:
            Dict: Loaded documentation structure
        """
        docs_dir = docs_dir or self.docs_dir
        
        try:
            if os.path.exists(docs_dir):
                # Load categories
                categories_file = os.path.join(docs_dir, 'categories.json')
                if os.path.exists(categories_file):
                    with open(categories_file, 'r') as f:
                        self.categories = json.load(f)
                
                # Load versions
                versions_file = os.path.join(docs_dir, 'versions.json')
                if os.path.exists(versions_file):
                    with open(versions_file, 'r') as f:
                        self.versions = json.load(f)
                
                # Load documentation files
                for version in os.listdir(docs_dir):
                    version_dir = os.path.join(docs_dir, version)
                    
                    if os.path.isdir(version_dir) and (not self.enable_versioning or version in self.versions):
                        self.documentation[version] = {}
                        
                        for category in os.listdir(version_dir):
                            category_dir = os.path.join(version_dir, category)
                            
                            if os.path.isdir(category_dir):
                                self.documentation[version][category] = {}
                                
                                for doc_file in os.listdir(category_dir):
                                    if doc_file.endswith('.json'):
                                        doc_path = os.path.join(category_dir, doc_file)
                                        doc_id = doc_file[:-5]  # Remove .json extension
                                        
                                        with open(doc_path, 'r') as f:
                                            self.documentation[version][category][doc_id] = json.load(f)
                
                # Build search index if enabled
                if self.enable_search:
                    self._build_search_index()
                
                logger.info(f"Loaded documentation from {docs_dir}")
            else:
                logger.warning(f"Documentation directory not found: {docs_dir}")
        except Exception as e:
            logger.error(f"Error loading documentation: {str(e)}")
        
        return self.documentation
    
    def get_documentation_structure(self) -> Dict[str, Any]:
        """
        Get the documentation structure.
        
        Returns:
            Dict: Documentation structure
        """
        structure = {
            "versions": self.versions,
            "categories": self.categories,
            "endpoints": {}
        }
        
        # Build endpoint structure
        for version, categories in self.documentation.items():
            structure["endpoints"][version] = {}
            
            for category, endpoints in categories.items():
                structure["endpoints"][version][category] = {}
                
                for endpoint_id, endpoint_data in endpoints.items():
                    structure["endpoints"][version][category][endpoint_id] = {
                        "title": endpoint_data.get("title", endpoint_id),
                        "method": endpoint_data.get("method", "GET"),
                        "path": endpoint_data.get("path", ""),
                        "tier": endpoint_data.get("tier", "public")
                    }
        
        return structure
    
    def get_endpoint_documentation(self, version: str, category: str, endpoint_id: str) -> Optional[Dict[str, Any]]:
        """
        Get documentation for a specific endpoint.
        
        Args:
            version: API version
            category: Endpoint category
            endpoint_id: Endpoint ID
            
        Returns:
            Dict: Endpoint documentation or None if not found
        """
        if version not in self.documentation:
            version = self.default_version
        
        if version in self.documentation and category in self.documentation[version] and endpoint_id in self.documentation[version][category]:
            return self.documentation[version][category][endpoint_id]
        
        return None
    
    def get_category_documentation(self, version: str, category: str) -> Dict[str, Any]:
        """
        Get documentation for all endpoints in a category.
        
        Args:
            version: API version
            category: Endpoint category
            
        Returns:
            Dict: Category documentation
        """
        if version not in self.documentation:
            version = self.default_version
        
        if version in self.documentation and category in self.documentation[version]:
            return self.documentation[version][category]
        
        return {}
    
    def search_documentation(self, query: str, version: str = None) -> List[Dict[str, Any]]:
        """
        Search documentation.
        
        Args:
            query: Search query
            version: API version (optional)
            
        Returns:
            List: Search results
        """
        if not self.enable_search:
            logger.warning("Search is disabled")
            return []
        
        if not query:
            return []
        
        # Normalize query
        query = query.lower()
        
        results = []
        
        # Search in index
        for doc_key, indexed_content in self.search_index.items():
            # Parse doc_key
            try:
                doc_version, doc_category, doc_id = doc_key.split(':')
                
                # Filter by version if specified
                if version and doc_version != version:
                    continue
                
                # Check if query matches indexed content
                if query in indexed_content:
                    # Get full documentation
                    doc = self.get_endpoint_documentation(doc_version, doc_category, doc_id)
                    
                    if doc:
                        results.append({
                            "version": doc_version,
                            "category": doc_category,
                            "id": doc_id,
                            "title": doc.get("title", doc_id),
                            "method": doc.get("method", "GET"),
                            "path": doc.get("path", ""),
                            "tier": doc.get("tier", "public"),
                            "relevance": self._calculate_relevance(query, indexed_content)
                        })
            except ValueError:
                continue
        
        # Sort by relevance
        results.sort(key=lambda x: x["relevance"], reverse=True)
        
        return results
    
    def get_documentation_by_tier(self, tier_id: str, version: str = None) -> Dict[str, Any]:
        """
        Get documentation filtered by access tier.
        
        Args:
            tier_id: Access tier ID
            version: API version (optional)
            
        Returns:
            Dict: Documentation filtered by tier
        """
        version = version or self.default_version
        
        filtered_docs = {
            "version": version,
            "tier": tier_id,
            "categories": {}
        }
        
        if version in self.documentation:
            for category, endpoints in self.documentation[version].items():
                filtered_endpoints = {}
                
                for endpoint_id, endpoint_data in endpoints.items():
                    endpoint_tier = endpoint_data.get("tier", "public")
                    
                    # Include if endpoint tier matches or is "public"
                    if endpoint_tier == tier_id or endpoint_tier == "public":
                        filtered_endpoints[endpoint_id] = endpoint_data
                
                if filtered_endpoints:
                    filtered_docs["categories"][category] = filtered_endpoints
        
        return filtered_docs
    
    def add_endpoint_documentation(self, version: str, category: str, endpoint_id: str, 
                                 documentation: Dict[str, Any]) -> Dict[str, Any]:
        """
        Add or update documentation for an endpoint.
        
        Args:
            version: API version
            category: Endpoint category
            endpoint_id: Endpoint ID
            documentation: Endpoint documentation
            
        Returns:
            Dict: Result
        """
        # Ensure version exists
        if version not in self.documentation:
            self.documentation[version] = {}
        
        # Ensure category exists
        if category not in self.documentation[version]:
            self.documentation[version][category] = {}
        
        # Add or update documentation
        self.documentation[version][category][endpoint_id] = documentation
        
        # Update search index if enabled
        if self.enable_search:
            self._update_search_index(version, category, endpoint_id, documentation)
        
        logger.info(f"Added/updated documentation for {version}/{category}/{endpoint_id}")
        
        return {
            "success": True,
            "version": version,
            "category": category,
            "id": endpoint_id
        }
    
    def save_documentation(self, docs_dir: str = None) -> bool:
        """
        Save documentation to files.
        
        Args:
            docs_dir: Documentation directory (optional)
            
        Returns:
            bool: True if successful, False otherwise
        """
        docs_dir = docs_dir or self.docs_dir
        
        try:
            # Ensure directory exists
            os.makedirs(docs_dir, exist_ok=True)
            
            # Save categories
            categories_file = os.path.join(docs_dir, 'categories.json')
            with open(categories_file, 'w') as f:
                json.dump(self.categories, f, indent=2)
            
            # Save versions
            versions_file = os.path.join(docs_dir, 'versions.json')
            with open(versions_file, 'w') as f:
                json.dump(self.versions, f, indent=2)
            
            # Save documentation files
            for version, categories in self.documentation.items():
                version_dir = os.path.join(docs_dir, version)
                os.makedirs(version_dir, exist_ok=True)
                
                for category, endpoints in categories.items():
                    category_dir = os.path.join(version_dir, category)
                    os.makedirs(category_dir, exist_ok=True)
                    
                    for endpoint_id, endpoint_data in endpoints.items():
                        doc_path = os.path.join(category_dir, f"{endpoint_id}.json")
                        
                        with open(doc_path, 'w') as f:
                            json.dump(endpoint_data, f, indent=2)
            
            logger.info(f"Saved documentation to {docs_dir}")
            return True
        except Exception as e:
            logger.error(f"Error saving documentation: {str(e)}")
            return False
    
    def _build_search_index(self) -> None:
        """
        Build the search index for all documentation.
        """
        self.search_index = {}
        
        for version, categories in self.documentation.items():
            for category, endpoints in categories.items():
                for endpoint_id, endpoint_data in endpoints.items():
                    self._update_search_index(version, category, endpoint_id, endpoint_data)
        
        logger.info(f"Built search index with {len(self.search_index)} entries")
    
    def _update_search_index(self, version: str, category: str, endpoint_id: str, 
                           documentation: Dict[str, Any]) -> None:
        """
        Update the search index for a specific endpoint.
        
        Args:
            version: API version
            category: Endpoint category
            endpoint_id: Endpoint ID
            documentation: Endpoint documentation
        """
        # Create key for search index
        doc_key = f"{version}:{category}:{endpoint_id}"
        
        # Extract searchable content
        searchable_content = []
        
        # Add title
        if "title" in documentation:
            searchable_content.append(documentation["title"])
        
        # Add path
        if "path" in documentation:
            searchable_content.append(documentation["path"])
        
        # Add description
        if "description" in documentation:
            searchable_content.append(documentation["description"])
        
        # Add parameters
        if "parameters" in documentation:
            for param in documentation["parameters"]:
                if "name" in param:
                    searchable_content.append(param["name"])
                if "description" in param:
                    searchable_content.append(param["description"])
        
        # Add responses
        if "responses" in documentation:
            for status, response in documentation["responses"].items():
                if "description" in response:
                    searchable_content.append(response["description"])
        
        # Join all content and normalize
        indexed_content = " ".join(searchable_content).lower()
        
        # Store in index
        self.search_index[doc_key] = indexed_content
    
    def _calculate_relevance(self, query: str, indexed_content: str) -> float:
        """
        Calculate relevance score for a search result.
        
        Args:
            query: Search query
            indexed_content: Indexed content
            
        Returns:
            float: Relevance score
        """
        # Simple relevance calculation based on frequency
        return indexed_content.count(query) / len(indexed_content) * 100


class ExampleManager:
    """
    Example Manager for the API Documentation Hub.
    
    This class provides functionality for:
    - Generating code examples for API endpoints
    - Supporting multiple programming languages
    - Customizing examples based on parameters
    """
    
    def __init__(self, config: Dict[str, Any] = None):
        """
        Initialize the example manager.
        
        Args:
            config: Configuration dictionary
        """
        self.config = config or {}
        
        # Extract configuration values
        self.supported_languages = self.config.get('supported_languages', ['curl', 'python', 'javascript', 'java', 'go'])
        self.base_url = self.config.get('base_url', 'https://api.example.com')
        self.include_auth = self.config.get('include_auth', True)
        
        logger.info(f"Initialized example manager with {len(self.supported_languages)} supported languages")
    
    def generate_examples(self, endpoint_doc: Dict[str, Any], languages: List[str] = None) -> Dict[str, str]:
        """
        Generate code examples for an endpoint.
        
        Args:
            endpoint_doc: Endpoint documentation
            languages: List of languages to generate examples for (optional)
            
        Returns:
            Dict: Generated examples by language
        """
        languages = languages or self.supported_languages
        
        # Extract endpoint information
        method = endpoint_doc.get('method', 'GET')
        path = endpoint_doc.get('path', '')
        parameters = endpoint_doc.get('parameters', [])
        
        # Organize parameters
        path_params = {}
        query_params = {}
        header_params = {}
        body_params = {}
        
        for param in parameters:
            param_name = param.get('name', '')
            param_in = param.get('in', 'query')
            param_example = param.get('example', '')
            
            if param_in == 'path':
                path_params[param_name] = param_example
            elif param_in == 'query':
                query_params[param_name] = param_example
            elif param_in == 'header':
                header_params[param_name] = param_example
            elif param_in == 'body':
                body_params[param_name] = param_example
        
        # Generate examples
        examples = {}
        
        for language in languages:
            if language in self.supported_languages:
                if language == 'curl':
                    examples[language] = self._generate_curl_example(method, path, path_params, query_params, header_params, body_params)
                elif language == 'python':
                    examples[language] = self._generate_python_example(method, path, path_params, query_params, header_params, body_params)
                elif language == 'javascript':
                    examples[language] = self._generate_javascript_example(method, path, path_params, query_params, header_params, body_params)
                elif language == 'java':
                    examples[language] = self._generate_java_example(method, path, path_params, query_params, header_params, body_params)
                elif language == 'go':
                    examples[language] = self._generate_go_example(method, path, path_params, query_params, header_params, body_params)
        
        return examples
    
    def _generate_curl_example(self, method: str, path: str, path_params: Dict[str, Any],
                             query_params: Dict[str, Any], header_params: Dict[str, Any],
                             body_params: Dict[str, Any]) -> str:
        """
        Generate curl example.
        
        Args:
            method: HTTP method
            path: Endpoint path
            path_params: Path parameters
            query_params: Query parameters
            header_params: Header parameters
            body_params: Body parameters
            
        Returns:
            str: Generated example
        """
        # Replace path parameters
        for key, value in path_params.items():
            path = path.replace(f"{{{key}}}", str(value))
        
        # Build URL
        url = f"{self.base_url}{path}"
        
        # Add query parameters
        if query_params:
            query_string = "&".join([f"{key}={value}" for key, value in query_params.items()])
            url += f"?{query_string}"
        
        # Start building the command
        command = f"curl -X {method} \"{url}\""
        
        # Add headers
        for key, value in header_params.items():
            command += f" \\\n  -H \"{key}: {value}\""
        
        # Add authentication if enabled
        if self.include_auth:
            command += f" \\\n  -H \"Authorization: Bearer YOUR_API_KEY\""
        
        # Add body if needed
        if body_params and method in ["POST", "PUT", "PATCH"]:
            body_json = json.dumps(body_params, indent=2)
            command += f" \\\n  -H \"Content-Type: application/json\" \\\n  -d '{body_json}'"
        
        return command
    
    def _generate_python_example(self, method: str, path: str, path_params: Dict[str, Any],
                               query_params: Dict[str, Any], header_params: Dict[str, Any],
                               body_params: Dict[str, Any]) -> str:
        """
        Generate Python example.
        
        Args:
            method: HTTP method
            path: Endpoint path
            path_params: Path parameters
            query_params: Query parameters
            header_params: Header parameters
            body_params: Body parameters
            
        Returns:
            str: Generated example
        """
        # Replace path parameters
        for key, value in path_params.items():
            path = path.replace(f"{{{key}}}", str(value))
        
        # Build URL
        url = f"{self.base_url}{path}"
        
        # Start building the example
        sample = "import requests\n\n"
        
        # Add URL
        sample += f"url = \"{url}\"\n\n"
        
        # Add query parameters
        if query_params:
            sample += "# Query parameters\n"
            sample += "params = {\n"
            for key, value in query_params.items():
                if isinstance(value, str):
                    sample += f"    \"{key}\": \"{value}\",\n"
                else:
                    sample += f"    \"{key}\": {value},\n"
            sample += "}\n\n"
        else:
            sample += "params = {}\n\n"
        
        # Add headers
        sample += "# Headers\n"
        sample += "headers = {\n"
        
        for key, value in header_params.items():
            sample += f"    \"{key}\": \"{value}\",\n"
        
        # Add authentication if enabled
        if self.include_auth:
            sample += "    \"Authorization\": \"Bearer YOUR_API_KEY\",\n"
        
        sample += "}\n\n"
        
        # Add body if needed
        if body_params and method in ["POST", "PUT", "PATCH"]:
            sample += "# Request body\n"
            sample += "data = {\n"
            for key, value in body_params.items():
                if isinstance(value, str):
                    sample += f"    \"{key}\": \"{value}\",\n"
                else:
                    sample += f"    \"{key}\": {value},\n"
            sample += "}\n\n"
            
            # Make request
            sample += f"response = requests.{method.lower()}(url, params=params, headers=headers, json=data)\n"
        else:
            # Make request
            sample += f"response = requests.{method.lower()}(url, params=params, headers=headers)\n"
        
        # Process response
        sample += "\n# Process response\n"
        sample += "if response.status_code == 200:\n"
        sample += "    data = response.json()\n"
        sample += "    print(data)\n"
        sample += "else:\n"
        sample += "    print(f\"Error: {response.status_code}\")\n"
        sample += "    print(response.text)\n"
        
        return sample
    
    def _generate_javascript_example(self, method: str, path: str, path_params: Dict[str, Any],
                                   query_params: Dict[str, Any], header_params: Dict[str, Any],
                                   body_params: Dict[str, Any]) -> str:
        """
        Generate JavaScript example.
        
        Args:
            method: HTTP method
            path: Endpoint path
            path_params: Path parameters
            query_params: Query parameters
            header_params: Header parameters
            body_params: Body parameters
            
        Returns:
            str: Generated example
        """
        # Replace path parameters
        for key, value in path_params.items():
            path = path.replace(f"{{{key}}}", str(value))
        
        # Build URL
        url = f"{self.base_url}{path}"
        
        # Add query parameters
        if query_params:
            query_parts = []
            for key, value in query_params.items():
                if isinstance(value, str):
                    query_parts.append(f"{key}={value}")
                else:
                    query_parts.append(f"{key}={value}")
            
            query_string = "&".join(query_parts)
            url += f"?{query_string}"
        
        # Start building the example
        sample = "// Using fetch API\n"
        
        # Add headers
        sample += "const headers = {\n"
        
        for key, value in header_params.items():
            sample += f"  '{key}': '{value}',\n"
        
        # Add authentication if enabled
        if self.include_auth:
            sample += "  'Authorization': 'Bearer YOUR_API_KEY',\n"
        
        if body_params and method in ["POST", "PUT", "PATCH"]:
            sample += "  'Content-Type': 'application/json',\n"
        
        sample += "};\n\n"
        
        # Add request options
        sample += "const options = {\n"
        sample += f"  method: '{method}',\n"
        sample += "  headers: headers,\n"
        
        # Add body if needed
        if body_params and method in ["POST", "PUT", "PATCH"]:
            body_json = json.dumps(body_params, indent=2)
            sample += f"  body: JSON.stringify({body_json}),\n"
        
        sample += "};\n\n"
        
        # Make request
        sample += f"fetch('{url}', options)\n"
        sample += "  .then(response => {\n"
        sample += "    if (!response.ok) {\n"
        sample += "      throw new Error(`HTTP error! Status: ${response.status}`);\n"
        sample += "    }\n"
        sample += "    return response.json();\n"
        sample += "  })\n"
        sample += "  .then(data => {\n"
        sample += "    console.log('Success:', data);\n"
        sample += "  })\n"
        sample += "  .catch(error => {\n"
        sample += "    console.error('Error:', error);\n"
        sample += "  });\n"
        
        return sample
    
    def _generate_java_example(self, method: str, path: str, path_params: Dict[str, Any],
                             query_params: Dict[str, Any], header_params: Dict[str, Any],
                             body_params: Dict[str, Any]) -> str:
        """
        Generate Java example.
        
        Args:
            method: HTTP method
            path: Endpoint path
            path_params: Path parameters
            query_params: Query parameters
            header_params: Header parameters
            body_params: Body parameters
            
        Returns:
            str: Generated example
        """
        # Replace path parameters
        for key, value in path_params.items():
            path = path.replace(f"{{{key}}}", str(value))
        
        # Build URL
        url = f"{self.base_url}{path}"
        
        # Add query parameters
        if query_params:
            query_parts = []
            for key, value in query_params.items():
                if isinstance(value, str):
                    query_parts.append(f"{key}={value}")
                else:
                    query_parts.append(f"{key}={value}")
            
            query_string = "&".join(query_parts)
            url += f"?{query_string}"
        
        # Start building the example
        sample = "import java.io.BufferedReader;\n"
        sample += "import java.io.InputStreamReader;\n"
        sample += "import java.io.OutputStream;\n"
        sample += "import java.net.HttpURLConnection;\n"
        sample += "import java.net.URL;\n"
        
        if body_params and method in ["POST", "PUT", "PATCH"]:
            sample += "import org.json.JSONObject;\n"
        
        sample += "\npublic class ApiExample {\n\n"
        sample += "    public static void main(String[] args) {\n"
        sample += "        try {\n"
        sample += f"            URL url = new URL(\"{url}\");\n"
        sample += f"            HttpURLConnection conn = (HttpURLConnection) url.openConnection();\n"
        sample += f"            conn.setRequestMethod(\"{method}\");\n"
        
        # Add headers
        for key, value in header_params.items():
            sample += f"            conn.setRequestProperty(\"{key}\", \"{value}\");\n"
        
        # Add authentication if enabled
        if self.include_auth:
            sample += "            conn.setRequestProperty(\"Authorization\", \"Bearer YOUR_API_KEY\");\n"
        
        # Add body if needed
        if body_params and method in ["POST", "PUT", "PATCH"]:
            sample += "            conn.setRequestProperty(\"Content-Type\", \"application/json\");\n"
            sample += "            conn.setDoOutput(true);\n\n"
            
            sample += "            // Create JSON request body\n"
            sample += "            JSONObject jsonBody = new JSONObject();\n"
            
            for key, value in body_params.items():
                if isinstance(value, str):
                    sample += f"            jsonBody.put(\"{key}\", \"{value}\");\n"
                else:
                    sample += f"            jsonBody.put(\"{key}\", {value});\n"
            
            sample += "\n            // Write request body\n"
            sample += "            try (OutputStream os = conn.getOutputStream()) {\n"
            sample += "                byte[] input = jsonBody.toString().getBytes(\"utf-8\");\n"
            sample += "                os.write(input, 0, input.length);\n"
            sample += "            }\n"
        
        sample += "\n            // Get response\n"
        sample += "            int responseCode = conn.getResponseCode();\n"
        sample += "            BufferedReader in = new BufferedReader(new InputStreamReader(conn.getInputStream()));\n"
        sample += "            String inputLine;\n"
        sample += "            StringBuilder response = new StringBuilder();\n\n"
        
        sample += "            while ((inputLine = in.readLine()) != null) {\n"
        sample += "                response.append(inputLine);\n"
        sample += "            }\n"
        sample += "            in.close();\n\n"
        
        sample += "            // Print result\n"
        sample += "            System.out.println(\"Response Code: \" + responseCode);\n"
        sample += "            System.out.println(\"Response Body: \" + response.toString());\n\n"
        
        sample += "        } catch (Exception e) {\n"
        sample += "            e.printStackTrace();\n"
        sample += "        }\n"
        sample += "    }\n"
        sample += "}\n"
        
        return sample
    
    def _generate_go_example(self, method: str, path: str, path_params: Dict[str, Any],
                           query_params: Dict[str, Any], header_params: Dict[str, Any],
                           body_params: Dict[str, Any]) -> str:
        """
        Generate Go example.
        
        Args:
            method: HTTP method
            path: Endpoint path
            path_params: Path parameters
            query_params: Query parameters
            header_params: Header parameters
            body_params: Body parameters
            
        Returns:
            str: Generated example
        """
        # Replace path parameters
        for key, value in path_params.items():
            path = path.replace(f"{{{key}}}", str(value))
        
        # Build URL
        url = f"{self.base_url}{path}"
        
        # Add query parameters
        if query_params:
            query_parts = []
            for key, value in query_params.items():
                if isinstance(value, str):
                    query_parts.append(f"{key}={value}")
                else:
                    query_parts.append(f"{key}={value}")
            
            query_string = "&".join(query_parts)
            url += f"?{query_string}"
        
        # Start building the example
        sample = "package main\n\n"
        
        sample += "import (\n"
        sample += "    \"fmt\"\n"
        sample += "    \"io/ioutil\"\n"
        sample += "    \"net/http\"\n"
        
        if body_params and method in ["POST", "PUT", "PATCH"]:
            sample += "    \"bytes\"\n"
            sample += "    \"encoding/json\"\n"
        
        sample += ")\n\n"
        
        sample += "func main() {\n"
        
        # Add body
        if body_params and method in ["POST", "PUT", "PATCH"]:
            sample += "    // Prepare request body\n"
            sample += "    data := map[string]interface{}{\n"
            
            for key, value in body_params.items():
                if isinstance(value, str):
                    sample += f"        \"{key}\": \"{value}\",\n"
                else:
                    sample += f"        \"{key}\": {value},\n"
            
            sample += "    }\n\n"
            sample += "    jsonData, err := json.Marshal(data)\n"
            sample += "    if err != nil {\n"
            sample += "        fmt.Println(\"Error marshaling JSON:\", err)\n"
            sample += "        return\n"
            sample += "    }\n\n"
            
            sample += f"    req, err := http.NewRequest(\"{method}\", \"{url}\", bytes.NewBuffer(jsonData))\n"
        else:
            sample += f"    req, err := http.NewRequest(\"{method}\", \"{url}\", nil)\n"
        
        sample += "    if err != nil {\n"
        sample += "        fmt.Println(\"Error creating request:\", err)\n"
        sample += "        return\n"
        sample += "    }\n\n"
        
        # Add headers
        for key, value in header_params.items():
            sample += f"    req.Header.Set(\"{key}\", \"{value}\")\n"
        
        # Add authentication if enabled
        if self.include_auth:
            sample += "    req.Header.Set(\"Authorization\", \"Bearer YOUR_API_KEY\")\n"
        
        # Add content type if needed
        if body_params and method in ["POST", "PUT", "PATCH"]:
            sample += "    req.Header.Set(\"Content-Type\", \"application/json\")\n"
        
        sample += "\n    client := &http.Client{}\n"
        sample += "    resp, err := client.Do(req)\n"
        sample += "    if err != nil {\n"
        sample += "        fmt.Println(\"Error sending request:\", err)\n"
        sample += "        return\n"
        sample += "    }\n"
        sample += "    defer resp.Body.Close()\n\n"
        
        sample += "    fmt.Println(\"Response Status:\", resp.Status)\n\n"
        
        sample += "    body, err := ioutil.ReadAll(resp.Body)\n"
        sample += "    if err != nil {\n"
        sample += "        fmt.Println(\"Error reading response:\", err)\n"
        sample += "        return\n"
        sample += "    }\n\n"
        
        sample += "    fmt.Println(\"Response Body:\", string(body))\n"
        sample += "}\n"
        
        return sample


# For backward compatibility, keep the original DocumentationHub class
# but make it an alias of DocumentationManager
DocumentationHub = DocumentationManager
