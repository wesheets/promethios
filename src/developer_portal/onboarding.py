"""
Developer Experience Portal - Onboarding Workflows

This module implements the onboarding workflows for the Developer Experience Portal,
providing guided experiences for new developers to get started with the Promethios APIs.
"""

import logging
import json
import uuid
from typing import Dict, List, Optional, Any, Union
from datetime import datetime
import os

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class OnboardingWorkflow:
    """
    Onboarding Workflows for the Developer Experience Portal.
    
    This class provides functionality for:
    - Creating guided onboarding experiences
    - Tracking developer progress through onboarding steps
    - Customizing onboarding based on developer needs
    - Integrating with access tier progression
    """
    
    def __init__(self, config: Dict[str, Any] = None):
        """
        Initialize the onboarding workflow manager.
        
        Args:
            config: Configuration dictionary
        """
        self.config = config or {}
        
        # Extract configuration values
        self.workflows_dir = self.config.get('workflows_dir', 'onboarding_workflows')
        self.registration_enabled = self.config.get('registration_workflow_enabled', True)
        self.guided_tour_enabled = self.config.get('guided_tour_enabled', True)
        self.feedback_enabled = self.config.get('feedback_collection_enabled', True)
        
        # Store workflow definitions
        self.workflows = {}
        
        # Store user progress
        self.user_progress = {}
        
        logger.info(f"Initialized onboarding workflow manager")
        logger.info(f"Registration workflow enabled: {self.registration_enabled}")
        logger.info(f"Guided tour enabled: {self.guided_tour_enabled}")
    
    def load_workflows(self, workflows_dir: str = None) -> Dict[str, Any]:
        """
        Load workflow definitions from files.
        
        Args:
            workflows_dir: Workflows directory (optional)
            
        Returns:
            Dict: Loaded workflow definitions
        """
        workflows_dir = workflows_dir or self.workflows_dir
        
        try:
            if os.path.exists(workflows_dir):
                for workflow_file in os.listdir(workflows_dir):
                    if workflow_file.endswith('.json'):
                        workflow_id = workflow_file[:-5]  # Remove .json extension
                        workflow_path = os.path.join(workflows_dir, workflow_file)
                        
                        with open(workflow_path, 'r') as f:
                            self.workflows[workflow_id] = json.load(f)
                
                logger.info(f"Loaded {len(self.workflows)} workflow definitions from {workflows_dir}")
            else:
                logger.warning(f"Workflows directory not found: {workflows_dir}")
                
                # Create default workflows
                self._create_default_workflows()
        except Exception as e:
            logger.error(f"Error loading workflows: {str(e)}")
            
            # Create default workflows
            self._create_default_workflows()
        
        return self.workflows
    
    def get_workflow(self, workflow_id: str) -> Optional[Dict[str, Any]]:
        """
        Get a specific workflow definition.
        
        Args:
            workflow_id: Workflow ID
            
        Returns:
            Dict: Workflow definition or None if not found
        """
        return self.workflows.get(workflow_id)
    
    def get_available_workflows(self, user_id: str = None, tier_id: str = None) -> List[Dict[str, Any]]:
        """
        Get available workflows for a user.
        
        Args:
            user_id: User ID (optional)
            tier_id: Access tier ID (optional)
            
        Returns:
            List: Available workflow summaries
        """
        available = []
        
        for workflow_id, workflow in self.workflows.items():
            # Check if workflow is enabled
            if not workflow.get('enabled', True):
                continue
            
            # Check if workflow is appropriate for the user's tier
            if tier_id and 'tiers' in workflow:
                if tier_id not in workflow['tiers']:
                    continue
            
            # Check if user has already completed the workflow
            if user_id and user_id in self.user_progress:
                user_workflows = self.user_progress[user_id]
                if workflow_id in user_workflows and user_workflows[workflow_id].get('completed', False):
                    # Include but mark as completed
                    available.append({
                        'id': workflow_id,
                        'title': workflow.get('title', workflow_id),
                        'description': workflow.get('description', ''),
                        'steps_count': len(workflow.get('steps', [])),
                        'estimated_time': workflow.get('estimated_time', '10 minutes'),
                        'completed': True,
                        'completion_date': user_workflows[workflow_id].get('completion_date')
                    })
                    continue
            
            # Add to available workflows
            available.append({
                'id': workflow_id,
                'title': workflow.get('title', workflow_id),
                'description': workflow.get('description', ''),
                'steps_count': len(workflow.get('steps', [])),
                'estimated_time': workflow.get('estimated_time', '10 minutes'),
                'completed': False
            })
        
        return available
    
    def start_workflow(self, user_id: str, workflow_id: str) -> Dict[str, Any]:
        """
        Start a workflow for a user.
        
        Args:
            user_id: User ID
            workflow_id: Workflow ID
            
        Returns:
            Dict: Workflow session data
        """
        workflow = self.get_workflow(workflow_id)
        
        if not workflow:
            return {
                'error': f"Workflow not found: {workflow_id}"
            }
        
        # Initialize user progress if not exists
        if user_id not in self.user_progress:
            self.user_progress[user_id] = {}
        
        # Create or reset workflow progress
        session_id = str(uuid.uuid4())
        
        self.user_progress[user_id][workflow_id] = {
            'session_id': session_id,
            'started_at': datetime.now().isoformat(),
            'current_step': 0,
            'completed': False,
            'steps_completed': []
        }
        
        # Get first step
        first_step = workflow['steps'][0] if workflow.get('steps') else None
        
        logger.info(f"User {user_id} started workflow {workflow_id} with session {session_id}")
        
        return {
            'session_id': session_id,
            'workflow_id': workflow_id,
            'title': workflow.get('title', workflow_id),
            'description': workflow.get('description', ''),
            'current_step': 0,
            'total_steps': len(workflow.get('steps', [])),
            'step': first_step
        }
    
    def get_workflow_progress(self, user_id: str, workflow_id: str) -> Dict[str, Any]:
        """
        Get a user's progress in a workflow.
        
        Args:
            user_id: User ID
            workflow_id: Workflow ID
            
        Returns:
            Dict: Workflow progress data
        """
        if user_id not in self.user_progress or workflow_id not in self.user_progress[user_id]:
            return {
                'error': f"No progress found for workflow {workflow_id}"
            }
        
        progress = self.user_progress[user_id][workflow_id]
        workflow = self.get_workflow(workflow_id)
        
        if not workflow:
            return {
                'error': f"Workflow not found: {workflow_id}"
            }
        
        # Get current step
        current_step_index = progress.get('current_step', 0)
        current_step = workflow['steps'][current_step_index] if current_step_index < len(workflow.get('steps', [])) else None
        
        return {
            'session_id': progress.get('session_id'),
            'workflow_id': workflow_id,
            'title': workflow.get('title', workflow_id),
            'description': workflow.get('description', ''),
            'current_step': current_step_index,
            'total_steps': len(workflow.get('steps', [])),
            'step': current_step,
            'completed': progress.get('completed', False),
            'steps_completed': progress.get('steps_completed', []),
            'started_at': progress.get('started_at'),
            'completed_at': progress.get('completed_at')
        }
    
    def advance_workflow(self, user_id: str, workflow_id: str, 
                       session_id: str, step_data: Dict[str, Any] = None) -> Dict[str, Any]:
        """
        Advance a user to the next step in a workflow.
        
        Args:
            user_id: User ID
            workflow_id: Workflow ID
            session_id: Session ID
            step_data: Data collected from the current step
            
        Returns:
            Dict: Next step data
        """
        if user_id not in self.user_progress or workflow_id not in self.user_progress[user_id]:
            return {
                'error': f"No progress found for workflow {workflow_id}"
            }
        
        progress = self.user_progress[user_id][workflow_id]
        
        # Verify session ID
        if progress.get('session_id') != session_id:
            return {
                'error': f"Invalid session ID: {session_id}"
            }
        
        workflow = self.get_workflow(workflow_id)
        
        if not workflow:
            return {
                'error': f"Workflow not found: {workflow_id}"
            }
        
        # Get current step
        current_step_index = progress.get('current_step', 0)
        
        # Mark current step as completed
        if 'steps_completed' not in progress:
            progress['steps_completed'] = []
        
        if current_step_index not in progress['steps_completed']:
            progress['steps_completed'].append(current_step_index)
        
        # Store step data if provided
        if step_data:
            if 'step_data' not in progress:
                progress['step_data'] = {}
            progress['step_data'][current_step_index] = step_data
        
        # Advance to next step
        next_step_index = current_step_index + 1
        progress['current_step'] = next_step_index
        
        # Check if workflow is completed
        if next_step_index >= len(workflow.get('steps', [])):
            progress['completed'] = True
            progress['completed_at'] = datetime.now().isoformat()
            
            logger.info(f"User {user_id} completed workflow {workflow_id}")
            
            return {
                'session_id': session_id,
                'workflow_id': workflow_id,
                'completed': True,
                'completion_message': workflow.get('completion_message', 'Workflow completed!'),
                'next_steps': workflow.get('next_steps', [])
            }
        
        # Get next step
        next_step = workflow['steps'][next_step_index]
        
        return {
            'session_id': session_id,
            'workflow_id': workflow_id,
            'title': workflow.get('title', workflow_id),
            'description': workflow.get('description', ''),
            'current_step': next_step_index,
            'total_steps': len(workflow.get('steps', [])),
            'step': next_step,
            'completed': False
        }
    
    def reset_workflow(self, user_id: str, workflow_id: str) -> Dict[str, Any]:
        """
        Reset a user's progress in a workflow.
        
        Args:
            user_id: User ID
            workflow_id: Workflow ID
            
        Returns:
            Dict: Result
        """
        if user_id not in self.user_progress or workflow_id not in self.user_progress[user_id]:
            return {
                'error': f"No progress found for workflow {workflow_id}"
            }
        
        # Delete progress
        del self.user_progress[user_id][workflow_id]
        
        logger.info(f"Reset workflow progress for user {user_id}, workflow {workflow_id}")
        
        return {
            'success': True,
            'message': f"Progress for workflow {workflow_id} has been reset"
        }
    
    def get_user_workflows(self, user_id: str) -> Dict[str, Any]:
        """
        Get all workflows for a user.
        
        Args:
            user_id: User ID
            
        Returns:
            Dict: User workflows data
        """
        if user_id not in self.user_progress:
            return {
                'in_progress': [],
                'completed': []
            }
        
        in_progress = []
        completed = []
        
        for workflow_id, progress in self.user_progress[user_id].items():
            workflow = self.get_workflow(workflow_id)
            
            if not workflow:
                continue
            
            workflow_summary = {
                'id': workflow_id,
                'title': workflow.get('title', workflow_id),
                'description': workflow.get('description', ''),
                'steps_count': len(workflow.get('steps', [])),
                'current_step': progress.get('current_step', 0),
                'steps_completed': len(progress.get('steps_completed', [])),
                'started_at': progress.get('started_at')
            }
            
            if progress.get('completed', False):
                workflow_summary['completed_at'] = progress.get('completed_at')
                completed.append(workflow_summary)
            else:
                in_progress.append(workflow_summary)
        
        return {
            'in_progress': in_progress,
            'completed': completed
        }
    
    def create_workflow(self, workflow_id: str, workflow_definition: Dict[str, Any]) -> Dict[str, Any]:
        """
        Create or update a workflow definition.
        
        Args:
            workflow_id: Workflow ID
            workflow_definition: Workflow definition
            
        Returns:
            Dict: Result
        """
        # Validate workflow definition
        if 'title' not in workflow_definition:
            return {
                'error': "Workflow definition must include a title"
            }
        
        if 'steps' not in workflow_definition or not isinstance(workflow_definition['steps'], list):
            return {
                'error': "Workflow definition must include steps as a list"
            }
        
        # Add or update workflow
        self.workflows[workflow_id] = workflow_definition
        
        # Save workflow to file
        try:
            os.makedirs(self.workflows_dir, exist_ok=True)
            
            workflow_path = os.path.join(self.workflows_dir, f"{workflow_id}.json")
            with open(workflow_path, 'w') as f:
                json.dump(workflow_definition, f, indent=2)
            
            logger.info(f"Created/updated workflow: {workflow_id}")
            
            return {
                'success': True,
                'workflow_id': workflow_id
            }
        except Exception as e:
            logger.error(f"Error saving workflow: {str(e)}")
            
            return {
                'error': f"Error saving workflow: {str(e)}"
            }
    
    def delete_workflow(self, workflow_id: str) -> Dict[str, Any]:
        """
        Delete a workflow definition.
        
        Args:
            workflow_id: Workflow ID
            
        Returns:
            Dict: Result
        """
        if workflow_id not in self.workflows:
            return {
                'error': f"Workflow not found: {workflow_id}"
            }
        
        # Delete workflow
        del self.workflows[workflow_id]
        
        # Delete workflow file
        try:
            workflow_path = os.path.join(self.workflows_dir, f"{workflow_id}.json")
            if os.path.exists(workflow_path):
                os.remove(workflow_path)
            
            logger.info(f"Deleted workflow: {workflow_id}")
            
            return {
                'success': True,
                'workflow_id': workflow_id
            }
        except Exception as e:
            logger.error(f"Error deleting workflow file: {str(e)}")
            
            return {
                'error': f"Error deleting workflow file: {str(e)}"
            }
    
    def save_user_progress(self, progress_dir: str = None) -> bool:
        """
        Save user progress to files.
        
        Args:
            progress_dir: Progress directory (optional)
            
        Returns:
            bool: True if successful, False otherwise
        """
        progress_dir = progress_dir or os.path.join(self.workflows_dir, 'progress')
        
        try:
            # Ensure directory exists
            os.makedirs(progress_dir, exist_ok=True)
            
            # Save progress for each user
            for user_id, user_workflows in self.user_progress.items():
                user_file = os.path.join(progress_dir, f"{user_id}.json")
                with open(user_file, 'w') as f:
                    json.dump(user_workflows, f, indent=2)
            
            logger.info(f"Saved user progress to {progress_dir}")
            return True
        except Exception as e:
            logger.error(f"Error saving user progress: {str(e)}")
            return False
    
    def load_user_progress(self, progress_dir: str = None) -> Dict[str, Dict[str, Any]]:
        """
        Load user progress from files.
        
        Args:
            progress_dir: Progress directory (optional)
            
        Returns:
            Dict: Loaded user progress
        """
        progress_dir = progress_dir or os.path.join(self.workflows_dir, 'progress')
        
        try:
            if os.path.exists(progress_dir):
                for user_file in os.listdir(progress_dir):
                    if user_file.endswith('.json'):
                        user_id = user_file[:-5]  # Remove .json extension
                        user_path = os.path.join(progress_dir, user_file)
                        
                        with open(user_path, 'r') as f:
                            self.user_progress[user_id] = json.load(f)
                
                logger.info(f"Loaded user progress for {len(self.user_progress)} users from {progress_dir}")
            else:
                logger.warning(f"Progress directory not found: {progress_dir}")
        except Exception as e:
            logger.error(f"Error loading user progress: {str(e)}")
        
        return self.user_progress
    
    def _create_default_workflows(self) -> None:
        """
        Create default workflow definitions.
        """
        # Registration workflow
        registration_workflow = {
            'id': 'registration',
            'title': 'API Registration',
            'description': 'Register for API access and set up your developer account',
            'enabled': self.registration_enabled,
            'estimated_time': '5 minutes',
            'steps': [
                {
                    'id': 'welcome',
                    'title': 'Welcome to Promethios API',
                    'description': 'Welcome to the Promethios API Developer Portal! This guided workflow will help you register for API access and set up your developer account.',
                    'type': 'information',
                    'content': 'The Promethios API provides access to advanced AI governance and benchmarking capabilities. By registering for API access, you\'ll be able to integrate these capabilities into your own applications and services.',
                    'actions': [
                        {
                            'label': 'Continue',
                            'action': 'next'
                        }
                    ]
                },
                {
                    'id': 'account_creation',
                    'title': 'Create Your Account',
                    'description': 'Create your developer account to access the API',
                    'type': 'form',
                    'fields': [
                        {
                            'id': 'name',
                            'label': 'Full Name',
                            'type': 'text',
                            'required': True
                        },
                        {
                            'id': 'email',
                            'label': 'Email Address',
                            'type': 'email',
                            'required': True
                        },
                        {
                            'id': 'organization',
                            'label': 'Organization',
                            'type': 'text',
                            'required': False
                        },
                        {
                            'id': 'use_case',
                            'label': 'Primary Use Case',
                            'type': 'select',
                            'options': [
                                'AI Governance',
                                'Benchmarking',
                                'Research',
                                'Education',
                                'Commercial Application',
                                'Other'
                            ],
                            'required': True
                        }
                    ],
                    'actions': [
                        {
                            'label': 'Create Account',
                            'action': 'submit'
                        }
                    ]
                },
                {
                    'id': 'verify_email',
                    'title': 'Verify Your Email',
                    'description': 'Check your inbox for a verification email',
                    'type': 'verification',
                    'content': 'We\'ve sent a verification email to your inbox. Please click the link in the email to verify your account. If you don\'t see the email, check your spam folder.',
                    'verification_type': 'email',
                    'actions': [
                        {
                            'label': 'I\'ve Verified My Email',
                            'action': 'verify'
                        },
                        {
                            'label': 'Resend Verification Email',
                            'action': 'resend'
                        }
                    ]
                },
                {
                    'id': 'api_key_generation',
                    'title': 'Generate API Key',
                    'description': 'Generate your API key to access the Promethios API',
                    'type': 'api_key',
                    'content': 'Your API key is your credential for accessing the Promethios API. Keep it secure and don\'t share it with others.',
                    'actions': [
                        {
                            'label': 'Generate API Key',
                            'action': 'generate'
                        }
                    ]
                },
                {
                    'id': 'tier_selection',
                    'title': 'Select Access Tier',
                    'description': 'Choose your initial access tier',
                    'type': 'tier_selection',
                    'content': 'Promethios offers different access tiers based on your needs. You can upgrade your tier as your usage grows.',
                    'tiers': [
                        {
                            'id': 'developer_preview',
                            'name': 'Developer Preview',
                            'description': 'Limited access for early development and testing',
                            'features': [
                                'Basic API access',
                                'Limited request rate',
                                'Community support'
                            ]
                        },
                        {
                            'id': 'standard',
                            'name': 'Standard',
                            'description': 'Standard access for production applications',
                            'features': [
                                'Full API access',
                                'Higher request rate',
                                'Email support',
                                'Production SLA'
                            ]
                        },
                        {
                            'id': 'enterprise',
                            'name': 'Enterprise',
                            'description': 'Enterprise-grade access with dedicated support',
                            'features': [
                                'Full API access',
                                'Highest request rate',
                                'Dedicated support',
                                'Custom SLA',
                                'On-premises deployment option'
                            ]
                        }
                    ],
                    'actions': [
                        {
                            'label': 'Select Tier',
                            'action': 'select'
                        }
                    ]
                }
            ],
            'completion_message': 'Congratulations! You\'ve successfully registered for API access. You can now start using the Promethios API.',
            'next_steps': [
                {
                    'title': 'Explore API Documentation',
                    'description': 'Learn about the available API endpoints and how to use them',
                    'link': '/docs'
                },
                {
                    'title': 'Try the API Explorer',
                    'description': 'Test API calls directly from your browser',
                    'link': '/explorer'
                },
                {
                    'title': 'View Code Samples',
                    'description': 'See example code for common use cases',
                    'link': '/samples'
                }
            ]
        }
        
        # Guided tour workflow
        guided_tour_workflow = {
            'id': 'guided_tour',
            'title': 'API Guided Tour',
            'description': 'Take a guided tour of the Promethios API and its capabilities',
            'enabled': self.guided_tour_enabled,
            'estimated_time': '15 minutes',
            'steps': [
                {
                    'id': 'welcome',
                    'title': 'Welcome to the Guided Tour',
                    'description': 'Get started with a tour of the Promethios API',
                    'type': 'information',
                    'content': 'This guided tour will introduce you to the key features and capabilities of the Promethios API. You\'ll learn about the available endpoints, how to authenticate, and how to make your first API call.',
                    'actions': [
                        {
                            'label': 'Start Tour',
                            'action': 'next'
                        }
                    ]
                },
                {
                    'id': 'api_overview',
                    'title': 'API Overview',
                    'description': 'Learn about the Promethios API architecture',
                    'type': 'information',
                    'content': 'The Promethios API is organized around REST principles. It uses standard HTTP methods, returns JSON responses, and uses standard HTTP status codes to indicate success or failure.',
                    'actions': [
                        {
                            'label': 'Continue',
                            'action': 'next'
                        }
                    ]
                },
                {
                    'id': 'authentication',
                    'title': 'Authentication',
                    'description': 'Learn how to authenticate with the API',
                    'type': 'information',
                    'content': 'The Promethios API uses API keys for authentication. You can include your API key in the request header or as a query parameter.',
                    'code_sample': {
                        'language': 'python',
                        'code': 'import requests\n\napi_key = "your_api_key"\nheaders = {\n    "Authorization": f"Bearer {api_key}"\n}\n\nresponse = requests.get("https://api.promethios.ai/v1/governance/policies", headers=headers)\n'
                    },
                    'actions': [
                        {
                            'label': 'Continue',
                            'action': 'next'
                        }
                    ]
                },
                {
                    'id': 'first_request',
                    'title': 'Your First API Request',
                    'description': 'Make your first API request',
                    'type': 'interactive',
                    'content': 'Let\'s make your first API request to get a list of governance policies.',
                    'interactive_type': 'api_explorer',
                    'endpoint': '/v1/governance/policies',
                    'method': 'GET',
                    'actions': [
                        {
                            'label': 'Try It',
                            'action': 'execute'
                        },
                        {
                            'label': 'Continue',
                            'action': 'next'
                        }
                    ]
                },
                {
                    'id': 'error_handling',
                    'title': 'Error Handling',
                    'description': 'Learn how to handle API errors',
                    'type': 'information',
                    'content': 'The Promethios API uses standard HTTP status codes to indicate success or failure. 2xx codes indicate success, 4xx codes indicate client errors, and 5xx codes indicate server errors.',
                    'code_sample': {
                        'language': 'python',
                        'code': 'import requests\n\napi_key = "your_api_key"\nheaders = {\n    "Authorization": f"Bearer {api_key}"\n}\n\ntry:\n    response = requests.get("https://api.promethios.ai/v1/governance/policies", headers=headers)\n    response.raise_for_status()  # Raise exception for 4xx/5xx responses\n    data = response.json()\n    print(data)\nexcept requests.exceptions.HTTPError as e:\n    print(f"HTTP error: {e}")\nexcept requests.exceptions.RequestException as e:\n    print(f"Request error: {e}")\n'
                    },
                    'actions': [
                        {
                            'label': 'Continue',
                            'action': 'next'
                        }
                    ]
                },
                {
                    'id': 'rate_limits',
                    'title': 'Rate Limits',
                    'description': 'Understand API rate limits',
                    'type': 'information',
                    'content': 'The Promethios API has rate limits based on your access tier. Rate limits are applied per API key and are reset on a per-minute basis.',
                    'actions': [
                        {
                            'label': 'Continue',
                            'action': 'next'
                        }
                    ]
                },
                {
                    'id': 'next_steps',
                    'title': 'Next Steps',
                    'description': 'Learn what to do next',
                    'type': 'information',
                    'content': 'Now that you\'ve completed the guided tour, you\'re ready to start using the Promethios API in your applications. Check out the API documentation for detailed information about each endpoint, and use the API explorer to test API calls.',
                    'actions': [
                        {
                            'label': 'Finish Tour',
                            'action': 'next'
                        }
                    ]
                }
            ],
            'completion_message': 'Congratulations! You\'ve completed the Promethios API guided tour. You\'re now ready to start using the API in your applications.',
            'next_steps': [
                {
                    'title': 'Explore API Documentation',
                    'description': 'Learn about the available API endpoints and how to use them',
                    'link': '/docs'
                },
                {
                    'title': 'Try the API Explorer',
                    'description': 'Test API calls directly from your browser',
                    'link': '/explorer'
                },
                {
                    'title': 'View Code Samples',
                    'description': 'See example code for common use cases',
                    'link': '/samples'
                }
            ]
        }
        
        # Add default workflows
        self.workflows['registration'] = registration_workflow
        self.workflows['guided_tour'] = guided_tour_workflow
        
        logger.info("Created default workflows")
        
        # Save default workflows
        try:
            os.makedirs(self.workflows_dir, exist_ok=True)
            
            with open(os.path.join(self.workflows_dir, 'registration.json'), 'w') as f:
                json.dump(registration_workflow, f, indent=2)
            
            with open(os.path.join(self.workflows_dir, 'guided_tour.json'), 'w') as f:
                json.dump(guided_tour_workflow, f, indent=2)
            
            logger.info("Saved default workflows to files")
        except Exception as e:
            logger.error(f"Error saving default workflows: {str(e)}")
"""
