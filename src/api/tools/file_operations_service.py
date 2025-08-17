"""
Real File Operations Service for Promethios Agents

Provides actual file system operations with governance oversight and security controls.
Implements the same capabilities as Manus agents for autonomous file management.
"""

import os
import json
import shutil
import tempfile
import mimetypes
from pathlib import Path
from typing import Dict, List, Any, Optional, Union
from datetime import datetime
import logging
import hashlib
import subprocess

logger = logging.getLogger(__name__)

class FileOperationsService:
    """Real file operations service with governance integration."""
    
    def __init__(self, governance_adapter=None, base_workspace: str = None):
        """Initialize file operations service.
        
        Args:
            governance_adapter: Universal Governance Adapter for oversight
            base_workspace: Base workspace directory for agent file operations
        """
        self.governance_adapter = governance_adapter
        self.base_workspace = base_workspace or "/tmp/promethios_workspace"
        
        # Create workspace if it doesn't exist
        os.makedirs(self.base_workspace, exist_ok=True)
        
        # Security settings
        self.max_file_size = 100 * 1024 * 1024  # 100MB
        self.allowed_extensions = {
            '.txt', '.md', '.json', '.yaml', '.yml', '.csv', '.xml',
            '.py', '.js', '.ts', '.html', '.css', '.sql',
            '.pdf', '.docx', '.xlsx', '.pptx',
            '.png', '.jpg', '.jpeg', '.gif', '.svg'
        }
        
        logger.info(f"FileOperationsService initialized with workspace: {self.base_workspace}")
    
    async def read_file(self, file_path: str, agent_id: str) -> Dict[str, Any]:
        """Read file content with governance oversight."""
        try:
            # Governance check
            if self.governance_adapter:
                governance_result = await self.governance_adapter.validate_action(
                    agent_id=agent_id,
                    action_type="file_read",
                    parameters={"file_path": file_path}
                )
                if not governance_result.get("approved", False):
                    return {
                        "success": False,
                        "error": f"Governance denied file read: {governance_result.get('reason', 'Unknown')}"
                    }
            
            # Resolve and validate path
            full_path = self._resolve_path(file_path)
            if not self._is_safe_path(full_path):
                return {"success": False, "error": "Access denied: Path outside workspace"}
            
            if not os.path.exists(full_path):
                return {"success": False, "error": f"File not found: {file_path}"}
            
            if not os.path.isfile(full_path):
                return {"success": False, "error": f"Path is not a file: {file_path}"}
            
            # Check file size
            file_size = os.path.getsize(full_path)
            if file_size > self.max_file_size:
                return {"success": False, "error": f"File too large: {file_size} bytes"}
            
            # Read file content
            try:
                with open(full_path, 'r', encoding='utf-8') as f:
                    content = f.read()
                
                return {
                    "success": True,
                    "content": content,
                    "file_path": file_path,
                    "size": file_size,
                    "mime_type": mimetypes.guess_type(full_path)[0],
                    "last_modified": datetime.fromtimestamp(os.path.getmtime(full_path)).isoformat()
                }
                
            except UnicodeDecodeError:
                # Try binary read for non-text files
                with open(full_path, 'rb') as f:
                    content = f.read()
                
                return {
                    "success": True,
                    "content": content.hex(),  # Return as hex for binary files
                    "file_path": file_path,
                    "size": file_size,
                    "mime_type": mimetypes.guess_type(full_path)[0],
                    "last_modified": datetime.fromtimestamp(os.path.getmtime(full_path)).isoformat(),
                    "encoding": "binary"
                }
                
        except Exception as e:
            logger.error(f"Error reading file {file_path}: {str(e)}")
            return {"success": False, "error": f"Failed to read file: {str(e)}"}
    
    async def write_file(self, file_path: str, content: str, agent_id: str, 
                        encoding: str = 'utf-8') -> Dict[str, Any]:
        """Write content to file with governance oversight."""
        try:
            # Governance check
            if self.governance_adapter:
                governance_result = await self.governance_adapter.validate_action(
                    agent_id=agent_id,
                    action_type="file_write",
                    parameters={"file_path": file_path, "content_length": len(content)}
                )
                if not governance_result.get("approved", False):
                    return {
                        "success": False,
                        "error": f"Governance denied file write: {governance_result.get('reason', 'Unknown')}"
                    }
            
            # Resolve and validate path
            full_path = self._resolve_path(file_path)
            if not self._is_safe_path(full_path):
                return {"success": False, "error": "Access denied: Path outside workspace"}
            
            # Check file extension
            file_ext = Path(full_path).suffix.lower()
            if file_ext and file_ext not in self.allowed_extensions:
                return {"success": False, "error": f"File extension not allowed: {file_ext}"}
            
            # Create directory if needed
            os.makedirs(os.path.dirname(full_path), exist_ok=True)
            
            # Write file
            if encoding == 'binary':
                # Handle binary content (hex string)
                binary_content = bytes.fromhex(content)
                with open(full_path, 'wb') as f:
                    f.write(binary_content)
                content_size = len(binary_content)
            else:
                with open(full_path, 'w', encoding=encoding) as f:
                    f.write(content)
                content_size = len(content.encode(encoding))
            
            return {
                "success": True,
                "file_path": file_path,
                "size": content_size,
                "created_at": datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Error writing file {file_path}: {str(e)}")
            return {"success": False, "error": f"Failed to write file: {str(e)}"}
    
    async def list_directory(self, dir_path: str, agent_id: str) -> Dict[str, Any]:
        """List directory contents with governance oversight."""
        try:
            # Governance check
            if self.governance_adapter:
                governance_result = await self.governance_adapter.validate_action(
                    agent_id=agent_id,
                    action_type="directory_list",
                    parameters={"dir_path": dir_path}
                )
                if not governance_result.get("approved", False):
                    return {
                        "success": False,
                        "error": f"Governance denied directory list: {governance_result.get('reason', 'Unknown')}"
                    }
            
            # Resolve and validate path
            full_path = self._resolve_path(dir_path)
            if not self._is_safe_path(full_path):
                return {"success": False, "error": "Access denied: Path outside workspace"}
            
            if not os.path.exists(full_path):
                return {"success": False, "error": f"Directory not found: {dir_path}"}
            
            if not os.path.isdir(full_path):
                return {"success": False, "error": f"Path is not a directory: {dir_path}"}
            
            # List contents
            items = []
            for item_name in os.listdir(full_path):
                item_path = os.path.join(full_path, item_name)
                item_stat = os.stat(item_path)
                
                items.append({
                    "name": item_name,
                    "type": "directory" if os.path.isdir(item_path) else "file",
                    "size": item_stat.st_size,
                    "last_modified": datetime.fromtimestamp(item_stat.st_mtime).isoformat(),
                    "permissions": oct(item_stat.st_mode)[-3:]
                })
            
            return {
                "success": True,
                "directory": dir_path,
                "items": items,
                "total_items": len(items)
            }
            
        except Exception as e:
            logger.error(f"Error listing directory {dir_path}: {str(e)}")
            return {"success": False, "error": f"Failed to list directory: {str(e)}"}
    
    async def create_directory(self, dir_path: str, agent_id: str) -> Dict[str, Any]:
        """Create directory with governance oversight."""
        try:
            # Governance check
            if self.governance_adapter:
                governance_result = await self.governance_adapter.validate_action(
                    agent_id=agent_id,
                    action_type="directory_create",
                    parameters={"dir_path": dir_path}
                )
                if not governance_result.get("approved", False):
                    return {
                        "success": False,
                        "error": f"Governance denied directory creation: {governance_result.get('reason', 'Unknown')}"
                    }
            
            # Resolve and validate path
            full_path = self._resolve_path(dir_path)
            if not self._is_safe_path(full_path):
                return {"success": False, "error": "Access denied: Path outside workspace"}
            
            # Create directory
            os.makedirs(full_path, exist_ok=True)
            
            return {
                "success": True,
                "directory": dir_path,
                "created_at": datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Error creating directory {dir_path}: {str(e)}")
            return {"success": False, "error": f"Failed to create directory: {str(e)}"}
    
    async def delete_file(self, file_path: str, agent_id: str) -> Dict[str, Any]:
        """Delete file with governance oversight."""
        try:
            # Governance check
            if self.governance_adapter:
                governance_result = await self.governance_adapter.validate_action(
                    agent_id=agent_id,
                    action_type="file_delete",
                    parameters={"file_path": file_path}
                )
                if not governance_result.get("approved", False):
                    return {
                        "success": False,
                        "error": f"Governance denied file deletion: {governance_result.get('reason', 'Unknown')}"
                    }
            
            # Resolve and validate path
            full_path = self._resolve_path(file_path)
            if not self._is_safe_path(full_path):
                return {"success": False, "error": "Access denied: Path outside workspace"}
            
            if not os.path.exists(full_path):
                return {"success": False, "error": f"File not found: {file_path}"}
            
            # Delete file or directory
            if os.path.isfile(full_path):
                os.remove(full_path)
            elif os.path.isdir(full_path):
                shutil.rmtree(full_path)
            
            return {
                "success": True,
                "deleted": file_path,
                "deleted_at": datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Error deleting {file_path}: {str(e)}")
            return {"success": False, "error": f"Failed to delete: {str(e)}"}
    
    def _resolve_path(self, path: str) -> str:
        """Resolve relative path to absolute path within workspace."""
        if os.path.isabs(path):
            return path
        return os.path.join(self.base_workspace, path)
    
    def _is_safe_path(self, path: str) -> bool:
        """Check if path is within the allowed workspace."""
        try:
            resolved_path = os.path.realpath(path)
            workspace_path = os.path.realpath(self.base_workspace)
            return resolved_path.startswith(workspace_path)
        except Exception:
            return False

