"""
API Developer Portal for Promethios.

This module provides the developer portal for the API Governance Framework,
enabling developers to register, manage applications, and access API documentation.
"""

import logging
import json
import os
import time
import uuid
from typing import Dict, List, Any, Optional, Tuple

logger = logging.getLogger(__name__)

class APIDeveloperPortal:
    """
    Developer portal for the API Governance Framework.
    
    Provides a centralized interface for developers to register,
    manage applications, and access API documentation.
    """
    
    def __init__(self, config_path: str):
        """
        Initialize the API Developer Portal with the specified configuration.
        
        Args:
            config_path: Path to the configuration file
        """
        self.logger = logging.getLogger(__name__)
        self.logger.info("Initializing API Developer Portal")
        
        # Load configuration
        with open(config_path, 'r') as f:
            self.config = json.load(f)
        
        # Initialize developer registry
        self.developer_registry = {}
        
        # Initialize application registry
        self.application_registry = {}
        
        # Initialize API registry
        self.api_registry = {}
        
        # Initialize directories
        os.makedirs(self.config.get('developer_directory', 'config/api_developers'), exist_ok=True)
        os.makedirs(self.config.get('application_directory', 'config/api_applications'), exist_ok=True)
        os.makedirs(self.config.get('api_directory', 'config/api_registry'), exist_ok=True)
        
        # Load registries from disk
        self._load_developer_registry()
        self._load_application_registry()
        self._load_api_registry()
        
        self.logger.info("API Developer Portal initialized")
    
    def register_developer(self, developer_data: Dict[str, Any]) -> str:
        """
        Register a developer in the portal.
        
        Args:
            developer_data: Data about the developer
            
        Returns:
            str: Developer ID
        """
        self.logger.info(f"Registering developer: {developer_data.get('name')}")
        
        # Generate developer ID if not provided
        developer_id = developer_data.get('id', str(uuid.uuid4()))
        
        # Add timestamps
        developer_data['registration_timestamp'] = time.time()
        developer_data['last_updated_timestamp'] = time.time()
        developer_data['id'] = developer_id
        
        # Set initial status
        developer_data['status'] = developer_data.get('status', 'pending')
        
        # Add to registry
        self.developer_registry[developer_id] = developer_data
        
        # Save registry
        self._save_developer_registry()
        
        return developer_id
    
    def update_developer(self, developer_id: str, developer_data: Dict[str, Any]) -> bool:
        """
        Update a developer in the portal.
        
        Args:
            developer_id: ID of the developer to update
            developer_data: Updated developer data
            
        Returns:
            bool: True if successful
        """
        self.logger.info(f"Updating developer: {developer_id}")
        
        # Check if developer exists
        if developer_id not in self.developer_registry:
            self.logger.error(f"Developer not found: {developer_id}")
            return False
        
        # Get existing data
        existing_data = self.developer_registry[developer_id]
        
        # Update data
        updated_data = existing_data.copy()
        for key, value in developer_data.items():
            if key != 'id' and key != 'registration_timestamp':
                updated_data[key] = value
        
        # Update timestamp
        updated_data['last_updated_timestamp'] = time.time()
        
        # Update registry
        self.developer_registry[developer_id] = updated_data
        
        # Save registry
        self._save_developer_registry()
        
        return True
    
    def get_developer(self, developer_id: str) -> Optional[Dict[str, Any]]:
        """
        Get information about a registered developer.
        
        Args:
            developer_id: ID of the developer to retrieve
            
        Returns:
            dict: Developer data or None if not found
        """
        self.logger.info(f"Getting developer: {developer_id}")
        
        # Check if developer exists
        if developer_id not in self.developer_registry:
            self.logger.error(f"Developer not found: {developer_id}")
            return None
        
        return self.developer_registry[developer_id]
    
    def list_developers(self, filter_params: Dict[str, Any] = None) -> List[Dict[str, Any]]:
        """
        List registered developers, optionally filtered by parameters.
        
        Args:
            filter_params: Parameters to filter the developers by
            
        Returns:
            list: List of developer data
        """
        self.logger.info("Listing developers")
        
        # Initialize result
        result = []
        
        # Apply filters if provided
        if filter_params:
            for developer_id, developer_data in self.developer_registry.items():
                match = True
                for key, value in filter_params.items():
                    if key not in developer_data or developer_data[key] != value:
                        match = False
                        break
                if match:
                    result.append(developer_data)
        else:
            result = list(self.developer_registry.values())
        
        return result
    
    def register_application(self, application_data: Dict[str, Any]) -> str:
        """
        Register an application in the portal.
        
        Args:
            application_data: Data about the application
            
        Returns:
            str: Application ID
        """
        self.logger.info(f"Registering application: {application_data.get('name')}")
        
        # Generate application ID if not provided
        application_id = application_data.get('id', str(uuid.uuid4()))
        
        # Add timestamps
        application_data['registration_timestamp'] = time.time()
        application_data['last_updated_timestamp'] = time.time()
        application_data['id'] = application_id
        
        # Set initial status
        application_data['status'] = application_data.get('status', 'pending')
        
        # Add to registry
        self.application_registry[application_id] = application_data
        
        # Save registry
        self._save_application_registry()
        
        return application_id
    
    def update_application(self, application_id: str, application_data: Dict[str, Any]) -> bool:
        """
        Update an application in the portal.
        
        Args:
            application_id: ID of the application to update
            application_data: Updated application data
            
        Returns:
            bool: True if successful
        """
        self.logger.info(f"Updating application: {application_id}")
        
        # Check if application exists
        if application_id not in self.application_registry:
            self.logger.error(f"Application not found: {application_id}")
            return False
        
        # Get existing data
        existing_data = self.application_registry[application_id]
        
        # Update data
        updated_data = existing_data.copy()
        for key, value in application_data.items():
            if key != 'id' and key != 'registration_timestamp':
                updated_data[key] = value
        
        # Update timestamp
        updated_data['last_updated_timestamp'] = time.time()
        
        # Update registry
        self.application_registry[application_id] = updated_data
        
        # Save registry
        self._save_application_registry()
        
        return True
    
    def get_application(self, application_id: str) -> Optional[Dict[str, Any]]:
        """
        Get information about a registered application.
        
        Args:
            application_id: ID of the application to retrieve
            
        Returns:
            dict: Application data or None if not found
        """
        self.logger.info(f"Getting application: {application_id}")
        
        # Check if application exists
        if application_id not in self.application_registry:
            self.logger.error(f"Application not found: {application_id}")
            return None
        
        return self.application_registry[application_id]
    
    def list_applications(self, filter_params: Dict[str, Any] = None) -> List[Dict[str, Any]]:
        """
        List registered applications, optionally filtered by parameters.
        
        Args:
            filter_params: Parameters to filter the applications by
            
        Returns:
            list: List of application data
        """
        self.logger.info("Listing applications")
        
        # Initialize result
        result = []
        
        # Apply filters if provided
        if filter_params:
            for application_id, application_data in self.application_registry.items():
                match = True
                for key, value in filter_params.items():
                    if key not in application_data or application_data[key] != value:
                        match = False
                        break
                if match:
                    result.append(application_data)
        else:
            result = list(self.application_registry.values())
        
        return result
    
    def register_api(self, api_data: Dict[str, Any]) -> str:
        """
        Register an API in the portal.
        
        Args:
            api_data: Data about the API
            
        Returns:
            str: API ID
        """
        self.logger.info(f"Registering API: {api_data.get('name')}")
        
        # Generate API ID if not provided
        api_id = api_data.get('id', str(uuid.uuid4()))
        
        # Add timestamps
        api_data['registration_timestamp'] = time.time()
        api_data['last_updated_timestamp'] = time.time()
        api_data['id'] = api_id
        
        # Set initial status
        api_data['status'] = api_data.get('status', 'draft')
        
        # Add to registry
        self.api_registry[api_id] = api_data
        
        # Save registry
        self._save_api_registry()
        
        return api_id
    
    def update_api(self, api_id: str, api_data: Dict[str, Any]) -> bool:
        """
        Update an API in the portal.
        
        Args:
            api_id: ID of the API to update
            api_data: Updated API data
            
        Returns:
            bool: True if successful
        """
        self.logger.info(f"Updating API: {api_id}")
        
        # Check if API exists
        if api_id not in self.api_registry:
            self.logger.error(f"API not found: {api_id}")
            return False
        
        # Get existing data
        existing_data = self.api_registry[api_id]
        
        # Update data
        updated_data = existing_data.copy()
        for key, value in api_data.items():
            if key != 'id' and key != 'registration_timestamp':
                updated_data[key] = value
        
        # Update timestamp
        updated_data['last_updated_timestamp'] = time.time()
        
        # Update registry
        self.api_registry[api_id] = updated_data
        
        # Save registry
        self._save_api_registry()
        
        return True
    
    def get_api(self, api_id: str) -> Optional[Dict[str, Any]]:
        """
        Get information about a registered API.
        
        Args:
            api_id: ID of the API to retrieve
            
        Returns:
            dict: API data or None if not found
        """
        self.logger.info(f"Getting API: {api_id}")
        
        # Check if API exists
        if api_id not in self.api_registry:
            self.logger.error(f"API not found: {api_id}")
            return None
        
        return self.api_registry[api_id]
    
    def list_apis(self, filter_params: Dict[str, Any] = None) -> List[Dict[str, Any]]:
        """
        List registered APIs, optionally filtered by parameters.
        
        Args:
            filter_params: Parameters to filter the APIs by
            
        Returns:
            list: List of API data
        """
        self.logger.info("Listing APIs")
        
        # Initialize result
        result = []
        
        # Apply filters if provided
        if filter_params:
            for api_id, api_data in self.api_registry.items():
                match = True
                for key, value in filter_params.items():
                    if key not in api_data or api_data[key] != value:
                        match = False
                        break
                if match:
                    result.append(api_data)
        else:
            result = list(self.api_registry.values())
        
        return result
    
    def get_api_documentation(self, api_id: str, version: str = None) -> Optional[Dict[str, Any]]:
        """
        Get documentation for an API.
        
        Args:
            api_id: ID of the API
            version: Version of the API documentation to retrieve
            
        Returns:
            dict: API documentation or None if not found
        """
        self.logger.info(f"Getting API documentation: {api_id}")
        
        # Check if API exists
        if api_id not in self.api_registry:
            self.logger.error(f"API not found: {api_id}")
            return None
        
        # Get API data
        api_data = self.api_registry[api_id]
        
        # Get documentation
        documentation = api_data.get('documentation', {})
        
        # If version specified, get that version
        if version and 'versions' in documentation:
            for doc_version in documentation.get('versions', []):
                if doc_version.get('version') == version:
                    return doc_version
            
            # Version not found
            self.logger.error(f"API documentation version not found: {version}")
            return None
        
        return documentation
    
    def get_api_schema(self, api_id: str, version: str = None) -> Optional[Dict[str, Any]]:
        """
        Get schema for an API.
        
        Args:
            api_id: ID of the API
            version: Version of the API schema to retrieve
            
        Returns:
            dict: API schema or None if not found
        """
        self.logger.info(f"Getting API schema: {api_id}")
        
        # Check if API exists
        if api_id not in self.api_registry:
            self.logger.error(f"API not found: {api_id}")
            return None
        
        # Get API data
        api_data = self.api_registry[api_id]
        
        # Get schema
        schema = api_data.get('schema', {})
        
        # If version specified, get that version
        if version and 'versions' in schema:
            for schema_version in schema.get('versions', []):
                if schema_version.get('version') == version:
                    return schema_version
            
            # Version not found
            self.logger.error(f"API schema version not found: {version}")
            return None
        
        return schema
    
    def get_developer_apis(self, developer_id: str) -> List[Dict[str, Any]]:
        """
        Get APIs accessible to a developer.
        
        Args:
            developer_id: ID of the developer
            
        Returns:
            list: List of API data
        """
        self.logger.info(f"Getting APIs for developer: {developer_id}")
        
        # Check if developer exists
        if developer_id not in self.developer_registry:
            self.logger.error(f"Developer not found: {developer_id}")
            return []
        
        # Get developer data
        developer_data = self.developer_registry[developer_id]
        
        # Get developer applications
        developer_applications = []
        for application_id, application_data in self.application_registry.items():
            if application_data.get('developer_id') == developer_id:
                developer_applications.append(application_id)
        
        # Get APIs accessible to developer applications
        accessible_apis = []
        for api_id, api_data in self.api_registry.items():
            # Skip non-published APIs
            if api_data.get('status') != 'published':
                continue
            
            # Check if API is accessible to any developer application
            api_applications = api_data.get('authorized_applications', [])
            for application_id in developer_applications:
                if application_id in api_applications or '*' in api_applications:
                    accessible_apis.append(api_data)
                    break
        
        return accessible_apis
    
    def get_application_apis(self, application_id: str) -> List[Dict[str, Any]]:
        """
        Get APIs accessible to an application.
        
        Args:
            application_id: ID of the application
            
        Returns:
            list: List of API data
        """
        self.logger.info(f"Getting APIs for application: {application_id}")
        
        # Check if application exists
        if application_id not in self.application_registry:
            self.logger.error(f"Application not found: {application_id}")
            return []
        
        # Get application data
        application_data = self.application_registry[application_id]
        
        # Get APIs accessible to application
        accessible_apis = []
        for api_id, api_data in self.api_registry.items():
            # Skip non-published APIs
            if api_data.get('status') != 'published':
                continue
            
            # Check if API is accessible to application
            api_applications = api_data.get('authorized_applications', [])
            if application_id in api_applications or '*' in api_applications:
                accessible_apis.append(api_data)
        
        return accessible_apis
    
    def _load_developer_registry(self):
        """Load developer registry from disk."""
        developer_directory = self.config.get('developer_directory', 'config/api_developers')
        if not os.path.exists(developer_directory):
            return
        
        for filename in os.listdir(developer_directory):
            if filename.endswith('.json'):
                developer_path = os.path.join(developer_directory, filename)
                try:
                    with open(developer_path, 'r') as f:
                        developer_data = json.load(f)
                    
                    developer_id = developer_data.get('id')
                    if developer_id:
                        self.developer_registry[developer_id] = developer_data
                except Exception as e:
                    self.logger.error(f"Error loading developer from {filename}: {str(e)}")
    
    def _save_developer_registry(self):
        """Save developer registry to disk."""
        developer_directory = self.config.get('developer_directory', 'config/api_developers')
        os.makedirs(developer_directory, exist_ok=True)
        
        for developer_id, developer_data in self.developer_registry.items():
            developer_path = os.path.join(developer_directory, f"{developer_id}.json")
            with open(developer_path, 'w') as f:
                json.dump(developer_data, f, indent=2)
    
    def _load_application_registry(self):
        """Load application registry from disk."""
        application_directory = self.config.get('application_directory', 'config/api_applications')
        if not os.path.exists(application_directory):
            return
        
        for filename in os.listdir(application_directory):
            if filename.endswith('.json'):
                application_path = os.path.join(application_directory, filename)
                try:
                    with open(application_path, 'r') as f:
                        application_data = json.load(f)
                    
                    application_id = application_data.get('id')
                    if application_id:
                        self.application_registry[application_id] = application_data
                except Exception as e:
                    self.logger.error(f"Error loading application from {filename}: {str(e)}")
    
    def _save_application_registry(self):
        """Save application registry to disk."""
        application_directory = self.config.get('application_directory', 'config/api_applications')
        os.makedirs(application_directory, exist_ok=True)
        
        for application_id, application_data in self.application_registry.items():
            application_path = os.path.join(application_directory, f"{application_id}.json")
            with open(application_path, 'w') as f:
                json.dump(application_data, f, indent=2)
    
    def _load_api_registry(self):
        """Load API registry from disk."""
        api_directory = self.config.get('api_directory', 'config/api_registry')
        if not os.path.exists(api_directory):
            return
        
        for filename in os.listdir(api_directory):
            if filename.endswith('.json'):
                api_path = os.path.join(api_directory, filename)
                try:
                    with open(api_path, 'r') as f:
                        api_data = json.load(f)
                    
                    api_id = api_data.get('id')
                    if api_id:
                        self.api_registry[api_id] = api_data
                except Exception as e:
                    self.logger.error(f"Error loading API from {filename}: {str(e)}")
    
    def _save_api_registry(self):
        """Save API registry to disk."""
        api_directory = self.config.get('api_directory', 'config/api_registry')
        os.makedirs(api_directory, exist_ok=True)
        
        for api_id, api_data in self.api_registry.items():
            api_path = os.path.join(api_directory, f"{api_id}.json")
            with open(api_path, 'w') as f:
                json.dump(api_data, f, indent=2)
