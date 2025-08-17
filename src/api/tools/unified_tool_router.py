"""
Unified Tool Router for Promethios Agents

Integrates all tool services and provides a single endpoint for tool execution.
Routes tool requests to appropriate service implementations with governance oversight.
"""

import asyncio
import logging
from typing import Dict, List, Any, Optional
from datetime import datetime

# Import all tool services
from .file_operations_service import FileOperationsService
from .code_execution_service import CodeExecutionService
from .shell_operations_service import ShellOperationsService
from .web_browsing_service import WebBrowsingService
from .comprehensive_tool_service import ComprehensiveToolService
from .governance_tool_adapter import GovernanceToolAdapter

logger = logging.getLogger(__name__)

class UnifiedToolRouter:
    """Unified router for all Promethios agent tools."""
    
    def __init__(self, governance_adapter=None, base_workspace: str = None):
        """Initialize unified tool router.
        
        Args:
            governance_adapter: Universal Governance Adapter for oversight
            base_workspace: Base workspace directory for all tool operations
        """
        self.base_workspace = base_workspace or "/tmp/promethios_workspace"
        
        # Initialize governance tool adapter
        self.governance_adapter = GovernanceToolAdapter(self)
        
        # Initialize all tool services with governance oversight
        self.file_service = FileOperationsService(self.governance_adapter, base_workspace)
        self.code_service = CodeExecutionService(self.governance_adapter, base_workspace)
        self.shell_service = ShellOperationsService(self.governance_adapter, base_workspace)
        self.web_service = WebBrowsingService(self.governance_adapter, base_workspace)
        self.comprehensive_service = ComprehensiveToolService(self.governance_adapter, base_workspace)
        
        # Tool routing map
        self.tool_routes = {
            # File Operations
            'file_read': self.file_service.read_file,
            'file_write': self.file_service.write_file,
            'file_delete': self.file_service.delete_file,
            'directory_create': self.file_service.create_directory,
            'directory_list': self.file_service.list_directory,
            
            # Code Execution
            'code_execute': self.code_service.execute_code,
            'code_install_package': self.code_service.install_package,
            'code_validate_syntax': self.code_service.validate_syntax,
            
            # Shell Operations
            'shell_execute': self.shell_service.execute_command,
            'shell_install_package': self.shell_service.install_package,
            'shell_system_info': self.shell_service.get_system_info,
            'shell_list_processes': self.shell_service.list_active_processes,
            
            # Web Browsing
            'web_navigate': self.web_service.navigate_to_url,
            'web_search': self.web_service.search_web,
            'web_screenshot': self.web_service.take_screenshot,
            'web_extract_data': self.web_service.extract_page_data,
            
            # Comprehensive Tools (all UI tools)
            'web_search_comprehensive': self.comprehensive_service.execute_tool,
            'web_scraping': self.comprehensive_service.execute_tool,
            'seo_analysis': self.comprehensive_service.execute_tool,
            'email_sending': self.comprehensive_service.execute_tool,
            'sms_messaging': self.comprehensive_service.execute_tool,
            'slack_integration': self.comprehensive_service.execute_tool,
            'shopify_integration': self.comprehensive_service.execute_tool,
            'stripe_payments': self.comprehensive_service.execute_tool,
            'woocommerce_integration': self.comprehensive_service.execute_tool,
            'salesforce_crm': self.comprehensive_service.execute_tool,
            'google_calendar': self.comprehensive_service.execute_tool,
            'document_generation': self.comprehensive_service.execute_tool,
            'twitter_posting': self.comprehensive_service.execute_tool,
            'linkedin_posting': self.comprehensive_service.execute_tool,
            'google_analytics': self.comprehensive_service.execute_tool,
            'data_visualization': self.comprehensive_service.execute_tool,
            'coding_programming': self.comprehensive_service.execute_tool,
            'zapier_integration': self.comprehensive_service.execute_tool,
            'workflow_automation': self.comprehensive_service.execute_tool,
        }
        
        # Tool usage tracking
        self.tool_usage_stats = {}
        
        logger.info(f"UnifiedToolRouter initialized with {len(self.tool_routes)} tools")
    
    async def execute_tool(self, tool_id: str, parameters: Dict[str, Any], agent_id: str) -> Dict[str, Any]:
        """Execute any tool through the unified router."""
        start_time = datetime.utcnow()
        
        try:
            # Track tool usage
            self._track_tool_usage(tool_id, agent_id)
            
            # Apply global governance oversight
            if self.governance_adapter:
                governance_result = await self.governance_adapter.evaluate_tool_usage(
                    tool_id, parameters, agent_id
                )
                if not governance_result.get('approved', True):
                    return {
                        'success': False,
                        'error': f"Tool usage blocked by governance: {governance_result.get('reason', 'Unknown')}",
                        'governance_score': governance_result.get('score', 0.0),
                        'tool_id': tool_id,
                        'agent_id': agent_id
                    }
            
            # Route to appropriate tool service
            if tool_id in self.tool_routes:
                tool_method = self.tool_routes[tool_id]
                
                # Handle different method signatures
                if tool_id in ['web_search', 'web_scraping', 'seo_analysis', 'email_sending', 
                              'sms_messaging', 'slack_integration', 'shopify_integration', 
                              'stripe_payments', 'woocommerce_integration', 'salesforce_crm',
                              'google_calendar', 'document_generation', 'twitter_posting',
                              'linkedin_posting', 'google_analytics', 'data_visualization',
                              'coding_programming', 'zapier_integration', 'workflow_automation']:
                    # Comprehensive service tools need tool_id as first parameter
                    result = await tool_method(tool_id, parameters, agent_id)
                else:
                    # Other services have direct method calls
                    result = await tool_method(parameters, agent_id)
            else:
                # Fallback to comprehensive service for unknown tools
                result = await self.comprehensive_service.execute_tool(tool_id, parameters, agent_id)
            
            # Add execution metadata
            execution_time = (datetime.utcnow() - start_time).total_seconds()
            result['execution_time_seconds'] = execution_time
            result['routed_through'] = 'UnifiedToolRouter'
            
            # Update usage statistics
            self._update_tool_stats(tool_id, True, execution_time)
            
            return result
            
        except Exception as e:
            execution_time = (datetime.utcnow() - start_time).total_seconds()
            error_result = {
                'success': False,
                'error': f"Tool execution failed: {str(e)}",
                'tool_id': tool_id,
                'agent_id': agent_id,
                'execution_time_seconds': execution_time,
                'timestamp': datetime.utcnow().isoformat()
            }
            
            # Update usage statistics
            self._update_tool_stats(tool_id, False, execution_time)
            
            logger.error(f"Tool execution error for {tool_id}: {str(e)}")
            return error_result
    
    def _track_tool_usage(self, tool_id: str, agent_id: str):
        """Track tool usage for analytics."""
        if tool_id not in self.tool_usage_stats:
            self.tool_usage_stats[tool_id] = {
                'total_calls': 0,
                'successful_calls': 0,
                'failed_calls': 0,
                'total_execution_time': 0.0,
                'average_execution_time': 0.0,
                'agents_used': set(),
                'first_used': datetime.utcnow(),
                'last_used': datetime.utcnow()
            }
        
        stats = self.tool_usage_stats[tool_id]
        stats['total_calls'] += 1
        stats['agents_used'].add(agent_id)
        stats['last_used'] = datetime.utcnow()
    
    def _update_tool_stats(self, tool_id: str, success: bool, execution_time: float):
        """Update tool statistics after execution."""
        if tool_id in self.tool_usage_stats:
            stats = self.tool_usage_stats[tool_id]
            
            if success:
                stats['successful_calls'] += 1
            else:
                stats['failed_calls'] += 1
            
            stats['total_execution_time'] += execution_time
            stats['average_execution_time'] = stats['total_execution_time'] / stats['total_calls']
    
    def get_tool_statistics(self) -> Dict[str, Any]:
        """Get comprehensive tool usage statistics."""
        stats = {}
        for tool_id, tool_stats in self.tool_usage_stats.items():
            stats[tool_id] = {
                **tool_stats,
                'agents_used': list(tool_stats['agents_used']),  # Convert set to list for JSON
                'success_rate': tool_stats['successful_calls'] / tool_stats['total_calls'] if tool_stats['total_calls'] > 0 else 0.0
            }
        
        return {
            'tool_statistics': stats,
            'total_tools_available': len(self.tool_routes),
            'total_tools_used': len(self.tool_usage_stats),
            'generated_at': datetime.utcnow().isoformat()
        }
    
    def get_available_tools(self) -> List[str]:
        """Get list of all available tools."""
        return list(self.tool_routes.keys())
    
    def is_tool_available(self, tool_id: str) -> bool:
        """Check if a tool is available."""
        return tool_id in self.tool_routes
    
    async def configure_tool(self, tool_id: str, configuration: Dict[str, Any]) -> bool:
        """Configure a specific tool."""
        try:
            # Route configuration to appropriate service
            if hasattr(self.comprehensive_service, 'configure_tool'):
                return self.comprehensive_service.configure_tool(tool_id, configuration)
            return True
        except Exception as e:
            logger.error(f"Failed to configure tool {tool_id}: {str(e)}")
            return False
    
    async def set_tool_credentials(self, tool_id: str, credentials: Dict[str, str]) -> bool:
        """Set credentials for a specific tool."""
        try:
            # Route credentials to appropriate service
            if hasattr(self.comprehensive_service, 'set_tool_credentials'):
                return self.comprehensive_service.set_tool_credentials(tool_id, credentials)
            return True
        except Exception as e:
            logger.error(f"Failed to set credentials for tool {tool_id}: {str(e)}")
            return False
    
    async def health_check(self) -> Dict[str, Any]:
        """Perform health check on all tool services."""
        health_status = {
            'unified_router': 'healthy',
            'services': {},
            'total_tools': len(self.tool_routes),
            'checked_at': datetime.utcnow().isoformat()
        }
        
        # Check each service
        services = {
            'file_service': self.file_service,
            'code_service': self.code_service,
            'shell_service': self.shell_service,
            'web_service': self.web_service,
            'comprehensive_service': self.comprehensive_service
        }
        
        for service_name, service in services.items():
            try:
                # Basic health check - verify service is initialized
                if hasattr(service, 'base_workspace') and service.base_workspace:
                    health_status['services'][service_name] = 'healthy'
                else:
                    health_status['services'][service_name] = 'unhealthy'
            except Exception as e:
                health_status['services'][service_name] = f'error: {str(e)}'
        
        return health_status

