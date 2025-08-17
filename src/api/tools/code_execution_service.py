"""
Real Code Execution Service for Promethios Agents

Provides actual code execution capabilities with governance oversight and security controls.
Implements the same capabilities as Manus agents for autonomous code development and testing.
"""

import os
import subprocess
import asyncio
import tempfile
import shutil
import json
from pathlib import Path
from typing import Dict, List, Any, Optional, Union
from datetime import datetime
import logging
import docker
import sys

logger = logging.getLogger(__name__)

class CodeExecutionService:
    """Real code execution service with governance integration."""
    
    def __init__(self, governance_adapter=None, base_workspace: str = None):
        """Initialize code execution service.
        
        Args:
            governance_adapter: Universal Governance Adapter for oversight
            base_workspace: Base workspace directory for code execution
        """
        self.governance_adapter = governance_adapter
        self.base_workspace = base_workspace or "/tmp/promethios_workspace"
        
        # Create workspace if it doesn't exist
        os.makedirs(self.base_workspace, exist_ok=True)
        
        # Security settings
        self.max_execution_time = 300  # 5 minutes
        self.max_output_size = 10 * 1024 * 1024  # 10MB
        self.max_memory_mb = 512  # 512MB memory limit
        
        # Supported languages and their configurations
        self.supported_languages = {
            "python": {
                "extension": ".py",
                "command": ["python3"],
                "docker_image": "python:3.11-slim",
                "packages": ["pip", "requests", "numpy", "pandas", "matplotlib"]
            },
            "javascript": {
                "extension": ".js",
                "command": ["node"],
                "docker_image": "node:18-slim",
                "packages": ["npm", "axios", "lodash", "moment"]
            },
            "typescript": {
                "extension": ".ts",
                "command": ["npx", "ts-node"],
                "docker_image": "node:18-slim",
                "packages": ["npm", "typescript", "ts-node", "@types/node"]
            },
            "bash": {
                "extension": ".sh",
                "command": ["bash"],
                "docker_image": "ubuntu:22.04",
                "packages": []
            },
            "sql": {
                "extension": ".sql",
                "command": ["sqlite3", ":memory:"],
                "docker_image": "alpine:latest",
                "packages": ["sqlite"]
            }
        }
        
        # Try to initialize Docker client
        self.docker_client = None
        try:
            self.docker_client = docker.from_env()
            logger.info("Docker client initialized successfully")
        except Exception as e:
            logger.warning(f"Docker not available: {e}. Will use local execution.")
        
        logger.info(f"CodeExecutionService initialized with workspace: {self.base_workspace}")
    
    async def execute_code(self, code: str, language: str, agent_id: str,
                          use_docker: bool = True, timeout: int = None) -> Dict[str, Any]:
        """Execute code with governance oversight."""
        try:
            # Governance check
            if self.governance_adapter:
                governance_result = await self.governance_adapter.validate_action(
                    agent_id=agent_id,
                    action_type="code_execute",
                    parameters={"language": language, "code_length": len(code)}
                )
                if not governance_result.get("approved", False):
                    return {
                        "success": False,
                        "error": f"Governance denied code execution: {governance_result.get('reason', 'Unknown')}"
                    }
            
            # Validate language
            if language not in self.supported_languages:
                return {
                    "success": False,
                    "error": f"Unsupported language: {language}. Supported: {list(self.supported_languages.keys())}"
                }
            
            lang_config = self.supported_languages[language]
            exec_timeout = timeout or self.max_execution_time
            
            # Create temporary file for code
            with tempfile.NamedTemporaryFile(
                mode='w',
                suffix=lang_config["extension"],
                dir=self.base_workspace,
                delete=False
            ) as temp_file:
                temp_file.write(code)
                temp_file_path = temp_file.name
            
            try:
                # Choose execution method
                if use_docker and self.docker_client:
                    result = await self._execute_in_docker(
                        temp_file_path, language, lang_config, exec_timeout, agent_id
                    )
                else:
                    result = await self._execute_locally(
                        temp_file_path, language, lang_config, exec_timeout, agent_id
                    )
                
                # Add metadata
                result.update({
                    "language": language,
                    "execution_method": "docker" if (use_docker and self.docker_client) else "local",
                    "code_length": len(code),
                    "executed_at": datetime.now().isoformat()
                })
                
                return result
                
            finally:
                # Clean up temporary file
                try:
                    os.unlink(temp_file_path)
                except Exception:
                    pass
                    
        except Exception as e:
            logger.error(f"Error executing {language} code: {str(e)}")
            return {"success": False, "error": f"Code execution failed: {str(e)}"}
    
    async def _execute_locally(self, file_path: str, language: str, 
                              lang_config: Dict, timeout: int, agent_id: str) -> Dict[str, Any]:
        """Execute code locally with subprocess."""
        try:
            start_time = datetime.now()
            
            # Prepare command
            if language == "sql":
                # Special handling for SQL
                command = ["sqlite3", ":memory:", f".read {file_path}"]
            else:
                command = lang_config["command"] + [file_path]
            
            # Execute with timeout
            process = await asyncio.create_subprocess_exec(
                *command,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE,
                cwd=os.path.dirname(file_path)
            )
            
            try:
                stdout, stderr = await asyncio.wait_for(
                    process.communicate(),
                    timeout=timeout
                )
            except asyncio.TimeoutError:
                try:
                    process.terminate()
                    await asyncio.sleep(1)
                    if process.returncode is None:
                        process.kill()
                except Exception:
                    pass
                
                return {
                    "success": False,
                    "error": f"Code execution timed out after {timeout} seconds",
                    "timeout": True
                }
            
            # Process output
            stdout_text = stdout.decode('utf-8', errors='replace') if stdout else ""
            stderr_text = stderr.decode('utf-8', errors='replace') if stderr else ""
            
            # Truncate if too large
            if len(stdout_text) > self.max_output_size:
                stdout_text = stdout_text[:self.max_output_size] + "\n... (output truncated)"
            
            if len(stderr_text) > self.max_output_size:
                stderr_text = stderr_text[:self.max_output_size] + "\n... (output truncated)"
            
            end_time = datetime.now()
            execution_time = (end_time - start_time).total_seconds()
            
            return {
                "success": True,
                "return_code": process.returncode,
                "stdout": stdout_text,
                "stderr": stderr_text,
                "execution_time": execution_time,
                "started_at": start_time.isoformat(),
                "completed_at": end_time.isoformat()
            }
            
        except Exception as e:
            return {"success": False, "error": f"Local execution failed: {str(e)}"}
    
    async def _execute_in_docker(self, file_path: str, language: str,
                                lang_config: Dict, timeout: int, agent_id: str) -> Dict[str, Any]:
        """Execute code in Docker container for isolation."""
        try:
            start_time = datetime.now()
            
            # Prepare Docker execution
            docker_image = lang_config["docker_image"]
            file_name = os.path.basename(file_path)
            
            # Create container configuration
            container_config = {
                "image": docker_image,
                "command": lang_config["command"] + [f"/workspace/{file_name}"],
                "volumes": {
                    os.path.dirname(file_path): {"bind": "/workspace", "mode": "ro"}
                },
                "working_dir": "/workspace",
                "mem_limit": f"{self.max_memory_mb}m",
                "network_disabled": True,  # No network access for security
                "remove": True,  # Auto-remove container
                "detach": False
            }
            
            # Special handling for different languages
            if language == "sql":
                container_config["command"] = ["sqlite3", ":memory:", f".read /workspace/{file_name}"]
            elif language == "typescript":
                # Install TypeScript dependencies first
                container_config["command"] = ["sh", "-c", 
                    f"npm install -g typescript ts-node && ts-node /workspace/{file_name}"]
            
            # Run container
            try:
                container = self.docker_client.containers.run(**container_config)
                
                # Get output (container.logs returns bytes)
                output = container.logs(stdout=True, stderr=True).decode('utf-8', errors='replace')
                
                # For Docker, we get combined stdout/stderr, so we'll put it in stdout
                stdout_text = output
                stderr_text = ""
                
                # Truncate if too large
                if len(stdout_text) > self.max_output_size:
                    stdout_text = stdout_text[:self.max_output_size] + "\n... (output truncated)"
                
                end_time = datetime.now()
                execution_time = (end_time - start_time).total_seconds()
                
                return {
                    "success": True,
                    "return_code": 0,  # Docker run succeeded
                    "stdout": stdout_text,
                    "stderr": stderr_text,
                    "execution_time": execution_time,
                    "started_at": start_time.isoformat(),
                    "completed_at": end_time.isoformat()
                }
                
            except docker.errors.ContainerError as e:
                # Container exited with non-zero code
                return {
                    "success": False,
                    "return_code": e.exit_status,
                    "stdout": "",
                    "stderr": e.stderr.decode('utf-8', errors='replace') if e.stderr else str(e),
                    "execution_time": (datetime.now() - start_time).total_seconds()
                }
                
            except Exception as e:
                return {"success": False, "error": f"Docker execution failed: {str(e)}"}
                
        except Exception as e:
            return {"success": False, "error": f"Docker setup failed: {str(e)}"}
    
    async def install_package(self, package_name: str, language: str, 
                            agent_id: str) -> Dict[str, Any]:
        """Install package for specific language with governance oversight."""
        try:
            # Governance check
            if self.governance_adapter:
                governance_result = await self.governance_adapter.validate_action(
                    agent_id=agent_id,
                    action_type="package_install",
                    parameters={"package": package_name, "language": language}
                )
                if not governance_result.get("approved", False):
                    return {
                        "success": False,
                        "error": f"Governance denied package installation: {governance_result.get('reason', 'Unknown')}"
                    }
            
            # Validate language
            if language not in self.supported_languages:
                return {"success": False, "error": f"Unsupported language: {language}"}
            
            # Install based on language
            if language == "python":
                command = ["pip3", "install", package_name]
            elif language in ["javascript", "typescript"]:
                command = ["npm", "install", package_name]
            else:
                return {"success": False, "error": f"Package installation not supported for {language}"}
            
            # Execute installation
            process = await asyncio.create_subprocess_exec(
                *command,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE,
                cwd=self.base_workspace
            )
            
            stdout, stderr = await asyncio.wait_for(
                process.communicate(),
                timeout=600  # 10 minutes for package installation
            )
            
            stdout_text = stdout.decode('utf-8', errors='replace') if stdout else ""
            stderr_text = stderr.decode('utf-8', errors='replace') if stderr else ""
            
            return {
                "success": process.returncode == 0,
                "package": package_name,
                "language": language,
                "return_code": process.returncode,
                "stdout": stdout_text,
                "stderr": stderr_text,
                "installed_at": datetime.now().isoformat()
            }
            
        except asyncio.TimeoutError:
            return {
                "success": False,
                "error": "Package installation timed out",
                "timeout": True
            }
        except Exception as e:
            logger.error(f"Error installing {package_name} for {language}: {str(e)}")
            return {"success": False, "error": f"Package installation failed: {str(e)}"}
    
    async def validate_syntax(self, code: str, language: str, agent_id: str) -> Dict[str, Any]:
        """Validate code syntax without execution."""
        try:
            # Governance check
            if self.governance_adapter:
                governance_result = await self.governance_adapter.validate_action(
                    agent_id=agent_id,
                    action_type="code_validate",
                    parameters={"language": language, "code_length": len(code)}
                )
                if not governance_result.get("approved", False):
                    return {
                        "success": False,
                        "error": f"Governance denied code validation: {governance_result.get('reason', 'Unknown')}"
                    }
            
            # Validate language
            if language not in self.supported_languages:
                return {"success": False, "error": f"Unsupported language: {language}"}
            
            # Language-specific syntax validation
            if language == "python":
                try:
                    compile(code, '<string>', 'exec')
                    return {"success": True, "valid": True, "message": "Python syntax is valid"}
                except SyntaxError as e:
                    return {
                        "success": True,
                        "valid": False,
                        "error": f"Python syntax error: {str(e)}",
                        "line": getattr(e, 'lineno', None),
                        "column": getattr(e, 'offset', None)
                    }
            
            elif language == "javascript":
                # Use Node.js to check syntax
                with tempfile.NamedTemporaryFile(mode='w', suffix='.js', delete=False) as temp_file:
                    temp_file.write(code)
                    temp_file_path = temp_file.name
                
                try:
                    process = await asyncio.create_subprocess_exec(
                        "node", "--check", temp_file_path,
                        stdout=asyncio.subprocess.PIPE,
                        stderr=asyncio.subprocess.PIPE
                    )
                    
                    stdout, stderr = await process.communicate()
                    
                    if process.returncode == 0:
                        return {"success": True, "valid": True, "message": "JavaScript syntax is valid"}
                    else:
                        error_text = stderr.decode('utf-8', errors='replace')
                        return {
                            "success": True,
                            "valid": False,
                            "error": f"JavaScript syntax error: {error_text}"
                        }
                finally:
                    os.unlink(temp_file_path)
            
            else:
                return {
                    "success": True,
                    "valid": True,
                    "message": f"Syntax validation not implemented for {language}, assuming valid"
                }
                
        except Exception as e:
            logger.error(f"Error validating {language} syntax: {str(e)}")
            return {"success": False, "error": f"Syntax validation failed: {str(e)}"}
    
    async def get_supported_languages(self) -> Dict[str, Any]:
        """Get list of supported programming languages."""
        return {
            "success": True,
            "supported_languages": list(self.supported_languages.keys()),
            "language_details": self.supported_languages,
            "docker_available": self.docker_client is not None
        }

