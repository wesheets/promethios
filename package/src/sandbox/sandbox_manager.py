"""
Sandbox Manager for Developer Sandbox Environment

This module provides functionality for managing the developer sandbox environment,
including environment creation, reset, monitoring, and cleanup.
"""

import os
import json
import logging
import time
import uuid
import shutil
import threading
import datetime
from typing import Dict, List, Any, Optional, Union, Callable

from src.sandbox.test_data_generator import TestDataGenerator
from src.sandbox.scenario_simulator import ScenarioSimulator

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class SandboxManager:
    """
    Manager for developer sandbox environments.
    
    This class provides functionality for:
    - Creating sandbox environments
    - Resetting environments to a clean state
    - Monitoring environment usage and resources
    - Cleaning up expired environments
    """
    
    def __init__(self, config: Optional[Dict[str, Any]] = None):
        """
        Initialize the sandbox manager.
        
        Args:
            config: Optional configuration dictionary
        """
        self.config = config or {}
        
        # Extract configuration values
        self.sandbox_root_dir = self.config.get('sandbox_root_dir', 'sandbox_environments')
        self.max_environments = self.config.get('max_environments', 10)
        self.environment_ttl = self.config.get('environment_ttl', 24 * 60 * 60)  # 24 hours in seconds
        self.cleanup_interval = self.config.get('cleanup_interval', 60 * 60)  # 1 hour in seconds
        self.monitoring_interval = self.config.get('monitoring_interval', 60)  # 1 minute in seconds
        
        # Create sandbox root directory if it doesn't exist
        os.makedirs(self.sandbox_root_dir, exist_ok=True)
        
        # Initialize environment registry
        self.environments = {}
        self._load_environments()
        
        # Start background tasks
        self._start_background_tasks()
        
        logger.info(f"Initialized sandbox manager with root directory: {self.sandbox_root_dir}")
    
    def create_environment(self, name: Optional[str] = None, template: Optional[str] = None, 
                         user_id: Optional[str] = None) -> Dict[str, Any]:
        """
        Create a new sandbox environment.
        
        Args:
            name: Optional environment name
            template: Optional template to use
            user_id: Optional user ID to associate with the environment
            
        Returns:
            Dict: Environment information
        """
        # Check if maximum number of environments reached
        if len(self.environments) >= self.max_environments:
            # Find and delete the oldest environment
            oldest_env_id = None
            oldest_time = float('inf')
            
            for env_id, env_info in self.environments.items():
                created_at = env_info.get('created_at', 0)
                if created_at < oldest_time:
                    oldest_time = created_at
                    oldest_env_id = env_id
            
            if oldest_env_id:
                self.delete_environment(oldest_env_id)
        
        # Generate environment ID
        env_id = str(uuid.uuid4())
        
        # Generate environment name if not provided
        if not name:
            name = f"sandbox-{env_id[:8]}"
        
        # Create environment directory
        env_dir = os.path.join(self.sandbox_root_dir, env_id)
        os.makedirs(env_dir, exist_ok=True)
        
        # Initialize environment
        created_at = time.time()
        expires_at = created_at + self.environment_ttl
        
        environment = {
            'id': env_id,
            'name': name,
            'template': template,
            'user_id': user_id,
            'created_at': created_at,
            'expires_at': expires_at,
            'status': 'active',
            'directory': env_dir
        }
        
        # Generate initial data based on template
        data_generator = TestDataGenerator()
        
        if template == 'empty':
            # No initial data
            pass
        elif template == 'minimal':
            # Generate minimal dataset
            dataset = data_generator.generate_dataset(num_users=2, num_resources=5, num_usage_records=10)
            self._save_dataset(env_dir, dataset)
        else:
            # Default template with standard dataset
            dataset = data_generator.generate_dataset(num_users=10, num_resources=20, num_usage_records=50)
            self._save_dataset(env_dir, dataset)
        
        # Save environment configuration
        env_config_path = os.path.join(env_dir, 'environment.json')
        with open(env_config_path, 'w') as f:
            json.dump(environment, f, indent=2)
        
        # Add to registry
        self.environments[env_id] = environment
        self._save_environments()
        
        logger.info(f"Created sandbox environment: {env_id} ({name})")
        
        return environment
    
    def get_environment(self, env_id: str) -> Optional[Dict[str, Any]]:
        """
        Get information about a sandbox environment.
        
        Args:
            env_id: Environment ID
            
        Returns:
            Dict: Environment information or None if not found
        """
        return self.environments.get(env_id)
    
    def list_environments(self, user_id: Optional[str] = None) -> List[Dict[str, Any]]:
        """
        List sandbox environments.
        
        Args:
            user_id: Optional user ID to filter by
            
        Returns:
            List: List of environment information
        """
        if user_id:
            return [env for env in self.environments.values() if env.get('user_id') == user_id]
        else:
            return list(self.environments.values())
    
    def reset_environment(self, env_id: str, template: Optional[str] = None) -> Dict[str, Any]:
        """
        Reset a sandbox environment to a clean state.
        
        Args:
            env_id: Environment ID
            template: Optional new template to use
            
        Returns:
            Dict: Updated environment information
        """
        # Check if environment exists
        if env_id not in self.environments:
            raise ValueError(f"Environment not found: {env_id}")
        
        environment = self.environments[env_id]
        env_dir = environment['directory']
        
        # Clear existing data files
        for filename in os.listdir(env_dir):
            if filename != 'environment.json':
                file_path = os.path.join(env_dir, filename)
                if os.path.isfile(file_path):
                    os.remove(file_path)
                elif os.path.isdir(file_path):
                    shutil.rmtree(file_path)
        
        # Update template if provided
        if template:
            environment['template'] = template
        
        # Reset expiration time
        environment['reset_at'] = time.time()
        environment['expires_at'] = environment['reset_at'] + self.environment_ttl
        
        # Generate new data based on template
        data_generator = TestDataGenerator()
        
        if environment['template'] == 'empty':
            # No initial data
            pass
        elif environment['template'] == 'minimal':
            # Generate minimal dataset
            dataset = data_generator.generate_dataset(num_users=2, num_resources=5, num_usage_records=10)
            self._save_dataset(env_dir, dataset)
        else:
            # Default template with standard dataset
            dataset = data_generator.generate_dataset(num_users=10, num_resources=20, num_usage_records=50)
            self._save_dataset(env_dir, dataset)
        
        # Save updated environment configuration
        env_config_path = os.path.join(env_dir, 'environment.json')
        with open(env_config_path, 'w') as f:
            json.dump(environment, f, indent=2)
        
        # Update registry
        self.environments[env_id] = environment
        self._save_environments()
        
        logger.info(f"Reset sandbox environment: {env_id}")
        
        return environment
    
    def delete_environment(self, env_id: str) -> bool:
        """
        Delete a sandbox environment.
        
        Args:
            env_id: Environment ID
            
        Returns:
            bool: True if deleted, False if not found
        """
        # Check if environment exists
        if env_id not in self.environments:
            return False
        
        environment = self.environments[env_id]
        env_dir = environment['directory']
        
        # Delete environment directory
        if os.path.exists(env_dir):
            shutil.rmtree(env_dir)
        
        # Remove from registry
        del self.environments[env_id]
        self._save_environments()
        
        logger.info(f"Deleted sandbox environment: {env_id}")
        
        return True
    
    def get_environment_status(self, env_id: str) -> Dict[str, Any]:
        """
        Get detailed status of a sandbox environment.
        
        Args:
            env_id: Environment ID
            
        Returns:
            Dict: Environment status information
        """
        # Check if environment exists
        if env_id not in self.environments:
            raise ValueError(f"Environment not found: {env_id}")
        
        environment = self.environments[env_id]
        env_dir = environment['directory']
        
        # Collect status information
        status = {
            'id': env_id,
            'name': environment['name'],
            'template': environment['template'],
            'created_at': environment['created_at'],
            'created_at_formatted': datetime.datetime.fromtimestamp(environment['created_at']).isoformat(),
            'expires_at': environment['expires_at'],
            'expires_at_formatted': datetime.datetime.fromtimestamp(environment['expires_at']).isoformat(),
            'time_remaining': max(0, environment['expires_at'] - time.time()),
            'status': environment['status']
        }
        
        # Add reset time if available
        if 'reset_at' in environment:
            status['reset_at'] = environment['reset_at']
            status['reset_at_formatted'] = datetime.datetime.fromtimestamp(environment['reset_at']).isoformat()
        
        # Count data files
        data_counts = {}
        for filename in os.listdir(env_dir):
            if filename.endswith('.json') and filename != 'environment.json':
                data_type = filename.split('.')[0]
                
                try:
                    with open(os.path.join(env_dir, filename), 'r') as f:
                        data = json.load(f)
                        if isinstance(data, list):
                            data_counts[data_type] = len(data)
                        elif isinstance(data, dict) and 'items' in data:
                            data_counts[data_type] = len(data['items'])
                        else:
                            data_counts[data_type] = 1
                except Exception as e:
                    logger.error(f"Error reading data file {filename}: {str(e)}")
                    data_counts[data_type] = 'error'
        
        status['data_counts'] = data_counts
        
        # Calculate disk usage
        disk_usage = 0
        for root, dirs, files in os.walk(env_dir):
            disk_usage += sum(os.path.getsize(os.path.join(root, name)) for name in files)
        
        status['disk_usage_bytes'] = disk_usage
        status['disk_usage_formatted'] = self._format_size(disk_usage)
        
        return status
    
    def monitor_environments(self) -> Dict[str, Any]:
        """
        Monitor all sandbox environments.
        
        Returns:
            Dict: Monitoring information
        """
        # Collect monitoring information
        monitoring_info = {
            'timestamp': time.time(),
            'timestamp_formatted': datetime.datetime.now().isoformat(),
            'total_environments': len(self.environments),
            'active_environments': sum(1 for env in self.environments.values() if env['status'] == 'active'),
            'expired_environments': sum(1 for env in self.environments.values() if time.time() > env['expires_at']),
            'environments': []
        }
        
        # Calculate total disk usage
        total_disk_usage = 0
        for env_id, environment in self.environments.items():
            env_dir = environment['directory']
            
            # Calculate disk usage for this environment
            disk_usage = 0
            if os.path.exists(env_dir):
                for root, dirs, files in os.walk(env_dir):
                    disk_usage += sum(os.path.getsize(os.path.join(root, name)) for name in files)
            
            total_disk_usage += disk_usage
            
            # Add environment info
            monitoring_info['environments'].append({
                'id': env_id,
                'name': environment['name'],
                'status': environment['status'],
                'expires_in': max(0, environment['expires_at'] - time.time()),
                'disk_usage_bytes': disk_usage,
                'disk_usage_formatted': self._format_size(disk_usage)
            })
        
        monitoring_info['total_disk_usage_bytes'] = total_disk_usage
        monitoring_info['total_disk_usage_formatted'] = self._format_size(total_disk_usage)
        
        return monitoring_info
    
    def cleanup_expired_environments(self) -> int:
        """
        Clean up expired sandbox environments.
        
        Returns:
            int: Number of environments cleaned up
        """
        current_time = time.time()
        expired_envs = [env_id for env_id, env in self.environments.items() if current_time > env['expires_at']]
        
        for env_id in expired_envs:
            self.delete_environment(env_id)
        
        if expired_envs:
            logger.info(f"Cleaned up {len(expired_envs)} expired environments")
        
        return len(expired_envs)
    
    def _load_environments(self) -> None:
        """
        Load environment registry from disk.
        """
        registry_path = os.path.join(self.sandbox_root_dir, 'registry.json')
        
        if os.path.exists(registry_path):
            try:
                with open(registry_path, 'r') as f:
                    self.environments = json.load(f)
                logger.info(f"Loaded {len(self.environments)} environments from registry")
            except Exception as e:
                logger.error(f"Error loading environment registry: {str(e)}")
                self.environments = {}
    
    def _save_environments(self) -> None:
        """
        Save environment registry to disk.
        """
        registry_path = os.path.join(self.sandbox_root_dir, 'registry.json')
        
        try:
            with open(registry_path, 'w') as f:
                json.dump(self.environments, f, indent=2)
        except Exception as e:
            logger.error(f"Error saving environment registry: {str(e)}")
    
    def _save_dataset(self, env_dir: str, dataset: Dict[str, List[Dict[str, Any]]]) -> None:
        """
        Save dataset to environment directory.
        
        Args:
            env_dir: Environment directory
            dataset: Dataset to save
        """
        for data_type, items in dataset.items():
            data_path = os.path.join(env_dir, f"{data_type}.json")
            with open(data_path, 'w') as f:
                json.dump(items, f, indent=2)
    
    def _start_background_tasks(self) -> None:
        """
        Start background tasks for monitoring and cleanup.
        """
        # Start cleanup task
        cleanup_thread = threading.Thread(target=self._cleanup_task)
        cleanup_thread.daemon = True
        cleanup_thread.start()
        
        # Start monitoring task
        monitoring_thread = threading.Thread(target=self._monitoring_task)
        monitoring_thread.daemon = True
        monitoring_thread.start()
    
    def _cleanup_task(self) -> None:
        """
        Background task for cleaning up expired environments.
        """
        while True:
            try:
                self.cleanup_expired_environments()
            except Exception as e:
                logger.error(f"Error in cleanup task: {str(e)}")
            
            time.sleep(self.cleanup_interval)
    
    def _monitoring_task(self) -> None:
        """
        Background task for monitoring environments.
        """
        while True:
            try:
                monitoring_info = self.monitor_environments()
                
                # Save monitoring information
                monitoring_dir = os.path.join(self.sandbox_root_dir, 'monitoring')
                os.makedirs(monitoring_dir, exist_ok=True)
                
                # Use timestamp for filename
                timestamp = int(time.time())
                monitoring_path = os.path.join(monitoring_dir, f"monitoring_{timestamp}.json")
                
                with open(monitoring_path, 'w') as f:
                    json.dump(monitoring_info, f, indent=2)
                
                # Keep only the last 24 monitoring files
                monitoring_files = sorted([
                    os.path.join(monitoring_dir, f) 
                    for f in os.listdir(monitoring_dir) 
                    if f.startswith('monitoring_')
                ])
                
                if len(monitoring_files) > 24:
                    for old_file in monitoring_files[:-24]:
                        os.remove(old_file)
            except Exception as e:
                logger.error(f"Error in monitoring task: {str(e)}")
            
            time.sleep(self.monitoring_interval)
    
    def _format_size(self, size_bytes: int) -> str:
        """
        Format size in bytes to human-readable format.
        
        Args:
            size_bytes: Size in bytes
            
        Returns:
            str: Formatted size
        """
        if size_bytes < 1024:
            return f"{size_bytes} B"
        elif size_bytes < 1024 * 1024:
            return f"{size_bytes / 1024:.2f} KB"
        elif size_bytes < 1024 * 1024 * 1024:
            return f"{size_bytes / (1024 * 1024):.2f} MB"
        else:
            return f"{size_bytes / (1024 * 1024 * 1024):.2f} GB"
"""
