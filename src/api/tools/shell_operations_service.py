"""
Real Shell Operations Service for Promethios Agents

Provides actual shell command execution with governance oversight and security controls.
Implements the same capabilities as Manus agents for autonomous system operations.
"""

import os
import subprocess
import asyncio
import signal
import tempfile
import shlex
from typing import Dict, List, Any, Optional, Union
from datetime import datetime
import logging
import threading
import time
import psutil

logger = logging.getLogger(__name__)

class ShellOperationsService:
    """Real shell operations service with governance integration."""
    
    def __init__(self, governance_adapter=None, base_workspace: str = None):
        """Initialize shell operations service.
        
        Args:
            governance_adapter: Universal Governance Adapter for oversight
            base_workspace: Base workspace directory for shell operations
        """
        self.governance_adapter = governance_adapter
        self.base_workspace = base_workspace or "/tmp/promethios_workspace"
        
        # Create workspace if it doesn't exist
        os.makedirs(self.base_workspace, exist_ok=True)
        
        # Security settings
        self.max_execution_time = 300  # 5 minutes
        self.max_output_size = 10 * 1024 * 1024  # 10MB
        
        # Allowed commands (whitelist approach)
        self.allowed_commands = {
            # File operations
            'ls', 'cat', 'head', 'tail', 'find', 'grep', 'wc', 'sort', 'uniq',
            'mkdir', 'rmdir', 'cp', 'mv', 'rm', 'chmod', 'chown',
            
            # Text processing
            'sed', 'awk', 'cut', 'tr', 'paste', 'join',
            
            # Archive operations
            'tar', 'gzip', 'gunzip', 'zip', 'unzip',
            
            # Network operations (limited)
            'curl', 'wget', 'ping',
            
            # Development tools
            'git', 'npm', 'pip', 'python', 'python3', 'node', 'tsc',
            
            # System info
            'ps', 'top', 'df', 'du', 'free', 'uname', 'whoami', 'pwd', 'date',
            
            # Package management (limited)
            'apt', 'yum', 'brew', 'pip3', 'npm'
        }
        
        # Dangerous commands (blacklist)
        self.dangerous_commands = {
            'sudo', 'su', 'passwd', 'useradd', 'userdel', 'usermod',
            'mount', 'umount', 'fdisk', 'mkfs', 'fsck',
            'iptables', 'netfilter', 'systemctl', 'service',
            'reboot', 'shutdown', 'halt', 'poweroff',
            'dd', 'shred', 'wipe', 'format'
        }
        
        # Active processes tracking
        self.active_processes = {}
        
        logger.info(f"ShellOperationsService initialized with workspace: {self.base_workspace}")
    
    async def execute_command(self, command: str, agent_id: str, 
                            working_dir: str = None, timeout: int = None) -> Dict[str, Any]:
        """Execute shell command with governance oversight."""
        try:
            # Governance check
            if self.governance_adapter:
                governance_result = await self.governance_adapter.validate_action(
                    agent_id=agent_id,
                    action_type="shell_execute",
                    parameters={"command": command, "working_dir": working_dir}
                )
                if not governance_result.get("approved", False):
                    return {
                        "success": False,
                        "error": f"Governance denied command execution: {governance_result.get('reason', 'Unknown')}"
                    }
            
            # Parse and validate command
            command_parts = shlex.split(command)
            if not command_parts:
                return {"success": False, "error": "Empty command"}
            
            base_command = command_parts[0]
            
            # Security checks
            if base_command in self.dangerous_commands:
                return {"success": False, "error": f"Command not allowed: {base_command}"}
            
            if base_command not in self.allowed_commands:
                return {"success": False, "error": f"Command not in whitelist: {base_command}"}
            
            # Set working directory
            if working_dir:
                work_dir = os.path.join(self.base_workspace, working_dir)
                if not os.path.exists(work_dir):
                    os.makedirs(work_dir, exist_ok=True)
            else:
                work_dir = self.base_workspace
            
            # Set timeout
            exec_timeout = timeout or self.max_execution_time
            
            # Execute command
            start_time = datetime.now()
            process_id = f"{agent_id}_{int(time.time())}"
            
            try:
                process = await asyncio.create_subprocess_shell(
                    command,
                    stdout=asyncio.subprocess.PIPE,
                    stderr=asyncio.subprocess.PIPE,
                    cwd=work_dir,
                    env=dict(os.environ, HOME=work_dir, PWD=work_dir)
                )
                
                # Track active process
                self.active_processes[process_id] = {
                    "process": process,
                    "agent_id": agent_id,
                    "command": command,
                    "start_time": start_time,
                    "working_dir": work_dir
                }
                
                # Wait for completion with timeout
                try:
                    stdout, stderr = await asyncio.wait_for(
                        process.communicate(), 
                        timeout=exec_timeout
                    )
                except asyncio.TimeoutError:
                    # Kill process if timeout
                    try:
                        process.terminate()
                        await asyncio.sleep(1)
                        if process.returncode is None:
                            process.kill()
                    except Exception:
                        pass
                    
                    return {
                        "success": False,
                        "error": f"Command timed out after {exec_timeout} seconds",
                        "timeout": True
                    }
                
                # Clean up process tracking
                if process_id in self.active_processes:
                    del self.active_processes[process_id]
                
                # Decode output
                stdout_text = stdout.decode('utf-8', errors='replace') if stdout else ""
                stderr_text = stderr.decode('utf-8', errors='replace') if stderr else ""
                
                # Check output size limits
                if len(stdout_text) > self.max_output_size:
                    stdout_text = stdout_text[:self.max_output_size] + "\n... (output truncated)"
                
                if len(stderr_text) > self.max_output_size:
                    stderr_text = stderr_text[:self.max_output_size] + "\n... (output truncated)"
                
                end_time = datetime.now()
                execution_time = (end_time - start_time).total_seconds()
                
                return {
                    "success": True,
                    "command": command,
                    "return_code": process.returncode,
                    "stdout": stdout_text,
                    "stderr": stderr_text,
                    "execution_time": execution_time,
                    "working_directory": work_dir,
                    "started_at": start_time.isoformat(),
                    "completed_at": end_time.isoformat()
                }
                
            except Exception as e:
                # Clean up process tracking
                if process_id in self.active_processes:
                    del self.active_processes[process_id]
                
                logger.error(f"Error executing command '{command}': {str(e)}")
                return {"success": False, "error": f"Command execution failed: {str(e)}"}
                
        except Exception as e:
            logger.error(f"Error in execute_command: {str(e)}")
            return {"success": False, "error": f"Shell operation failed: {str(e)}"}
    
    async def install_package(self, package_name: str, package_manager: str, 
                            agent_id: str) -> Dict[str, Any]:
        """Install package with governance oversight."""
        try:
            # Governance check
            if self.governance_adapter:
                governance_result = await self.governance_adapter.validate_action(
                    agent_id=agent_id,
                    action_type="package_install",
                    parameters={"package": package_name, "manager": package_manager}
                )
                if not governance_result.get("approved", False):
                    return {
                        "success": False,
                        "error": f"Governance denied package installation: {governance_result.get('reason', 'Unknown')}"
                    }
            
            # Validate package manager
            valid_managers = {"pip", "pip3", "npm", "yarn"}
            if package_manager not in valid_managers:
                return {"success": False, "error": f"Package manager not allowed: {package_manager}"}
            
            # Construct install command
            if package_manager in ["pip", "pip3"]:
                command = f"{package_manager} install {shlex.quote(package_name)}"
            elif package_manager == "npm":
                command = f"npm install {shlex.quote(package_name)}"
            elif package_manager == "yarn":
                command = f"yarn add {shlex.quote(package_name)}"
            
            # Execute installation
            result = await self.execute_command(command, agent_id, timeout=600)  # 10 minutes for installs
            
            if result["success"]:
                result["package_installed"] = package_name
                result["package_manager"] = package_manager
            
            return result
            
        except Exception as e:
            logger.error(f"Error installing package {package_name}: {str(e)}")
            return {"success": False, "error": f"Package installation failed: {str(e)}"}
    
    async def get_system_info(self, agent_id: str) -> Dict[str, Any]:
        """Get system information with governance oversight."""
        try:
            # Governance check
            if self.governance_adapter:
                governance_result = await self.governance_adapter.validate_action(
                    agent_id=agent_id,
                    action_type="system_info",
                    parameters={}
                )
                if not governance_result.get("approved", False):
                    return {
                        "success": False,
                        "error": f"Governance denied system info access: {governance_result.get('reason', 'Unknown')}"
                    }
            
            # Gather system information
            system_info = {
                "platform": os.name,
                "working_directory": self.base_workspace,
                "environment_variables": dict(os.environ),
                "python_version": subprocess.check_output(["python3", "--version"], text=True).strip(),
                "disk_usage": {},
                "memory_info": {},
                "cpu_info": {}
            }
            
            # Get disk usage
            try:
                disk_usage = psutil.disk_usage(self.base_workspace)
                system_info["disk_usage"] = {
                    "total": disk_usage.total,
                    "used": disk_usage.used,
                    "free": disk_usage.free,
                    "percent": (disk_usage.used / disk_usage.total) * 100
                }
            except Exception:
                pass
            
            # Get memory info
            try:
                memory = psutil.virtual_memory()
                system_info["memory_info"] = {
                    "total": memory.total,
                    "available": memory.available,
                    "percent": memory.percent,
                    "used": memory.used,
                    "free": memory.free
                }
            except Exception:
                pass
            
            # Get CPU info
            try:
                system_info["cpu_info"] = {
                    "cpu_count": psutil.cpu_count(),
                    "cpu_percent": psutil.cpu_percent(interval=1)
                }
            except Exception:
                pass
            
            return {
                "success": True,
                "system_info": system_info,
                "retrieved_at": datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Error getting system info: {str(e)}")
            return {"success": False, "error": f"Failed to get system info: {str(e)}"}
    
    async def kill_process(self, process_id: str, agent_id: str) -> Dict[str, Any]:
        """Kill active process with governance oversight."""
        try:
            # Governance check
            if self.governance_adapter:
                governance_result = await self.governance_adapter.validate_action(
                    agent_id=agent_id,
                    action_type="process_kill",
                    parameters={"process_id": process_id}
                )
                if not governance_result.get("approved", False):
                    return {
                        "success": False,
                        "error": f"Governance denied process termination: {governance_result.get('reason', 'Unknown')}"
                    }
            
            # Check if process exists and belongs to agent
            if process_id not in self.active_processes:
                return {"success": False, "error": f"Process not found: {process_id}"}
            
            process_info = self.active_processes[process_id]
            if process_info["agent_id"] != agent_id:
                return {"success": False, "error": "Access denied: Process belongs to different agent"}
            
            # Kill process
            try:
                process = process_info["process"]
                process.terminate()
                await asyncio.sleep(1)
                if process.returncode is None:
                    process.kill()
                
                # Clean up
                del self.active_processes[process_id]
                
                return {
                    "success": True,
                    "process_id": process_id,
                    "killed_at": datetime.now().isoformat()
                }
                
            except Exception as e:
                return {"success": False, "error": f"Failed to kill process: {str(e)}"}
                
        except Exception as e:
            logger.error(f"Error killing process {process_id}: {str(e)}")
            return {"success": False, "error": f"Process termination failed: {str(e)}"}
    
    async def list_active_processes(self, agent_id: str) -> Dict[str, Any]:
        """List active processes for agent."""
        try:
            agent_processes = []
            for process_id, process_info in self.active_processes.items():
                if process_info["agent_id"] == agent_id:
                    agent_processes.append({
                        "process_id": process_id,
                        "command": process_info["command"],
                        "start_time": process_info["start_time"].isoformat(),
                        "working_dir": process_info["working_dir"]
                    })
            
            return {
                "success": True,
                "active_processes": agent_processes,
                "total_processes": len(agent_processes)
            }
            
        except Exception as e:
            logger.error(f"Error listing processes for agent {agent_id}: {str(e)}")
            return {"success": False, "error": f"Failed to list processes: {str(e)}"}

