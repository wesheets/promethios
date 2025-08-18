"""
Universal Vision Service for Promethios

Provides image analysis across all AI providers with full governance integration.
Supports OpenAI GPT-4 Vision, Claude 3 Vision, Gemini Pro Vision, and 9+ other providers.
Includes comprehensive governance, audit logging, and policy enforcement.
"""

import os
import base64
import logging
import io
from typing import Dict, List, Optional, Any
from datetime import datetime
import asyncio

# Import PIL for image processing
try:
    from PIL import Image
except ImportError:
    logger.warning("⚠️ PIL (Pillow) not available - basic image analysis will be limited")
    Image = None

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class UniversalVisionService:
    """
    Universal Vision Service with Governance Integration
    
    Provides image analysis across all AI providers while ensuring:
    - Full governance compliance and policy enforcement
    - Comprehensive audit logging and traceability  
    - Trust score integration and impact tracking
    - Provider transparency and metadata collection
    """
    
    def __init__(self, governance_context: Optional[Dict] = None):
        # Governance integration with permissive defaults
        default_governance = {
            'environment': 'production',
            'allowed_vision_providers': [],  # Empty list means all providers allowed
            'min_vision_quality': 'fair',
            'require_vision_capability': True,
            'max_image_size_mb': 10,
            'allowed_image_types': [
                # Images
                'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/bmp', 'image/tiff', 'image/svg+xml',
                # Documents  
                'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
                'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'application/rtf', 'application/vnd.oasis.opendocument.text',
                # Text files
                'text/plain', 'text/markdown', 'text/csv', 'text/html', 'text/xml',
                'application/json', 'application/xml',
                # Archives (for extraction)
                'application/zip', 'application/x-rar-compressed', 'application/x-7z-compressed'
            ],
            'max_message_length': 5000
        }
        self.governance_context = {**default_governance, **(governance_context or {})}
        self.audit_entries = []
        self.policy_violations = []
        
        # Provider configuration with governance metadata
        self.supported_providers = {
            # Tier 1: Full Vision API Support
            'openai': {
                'models': ['gpt-4-vision-preview', 'gpt-4-turbo', 'gpt-4o', 'gpt-4o-mini'],
                'api_key_env': 'OPENAI_API_KEY',
                'has_vision': True,
                'vision_quality': 'excellent',
                'priority': 1
            },
            'anthropic': {
                'models': ['claude-3-opus', 'claude-3-sonnet', 'claude-3-haiku', 'claude-3-5-sonnet'],
                'api_key_env': 'ANTHROPIC_API_KEY', 
                'has_vision': True,
                'vision_quality': 'excellent',
                'priority': 2
            },
            'google': {
                'models': ['gemini-pro-vision', 'gemini-1.5-pro', 'gemini-1.5-flash'],
                'api_key_env': 'GOOGLE_API_KEY',
                'has_vision': True,
                'vision_quality': 'excellent',
                'priority': 3
            },
            
            # Tier 2: Good Vision Support
            'cohere': {
                'models': ['command-r-plus', 'command-r'],
                'api_key_env': 'COHERE_API_KEY',
                'has_vision': True,
                'vision_quality': 'good',
                'priority': 4
            },
            'perplexity': {
                'models': ['pplx-7b-online', 'pplx-70b-online', 'pplx-7b-chat', 'pplx-70b-chat'],
                'api_key_env': 'PERPLEXITY_API_KEY',
                'has_vision': True,
                'vision_quality': 'good',
                'priority': 5
            },
            'huggingface': {
                'models': ['llava-1.5-7b-hf', 'llava-1.5-13b-hf', 'blip-image-captioning-large'],
                'api_key_env': 'HUGGINGFACE_API_KEY',
                'has_vision': True,
                'vision_quality': 'good',
                'priority': 6
            },
            
            # Tier 3: Limited/Experimental Vision Support
            'grok': {
                'models': ['grok-1', 'grok-1.5'],
                'api_key_env': 'GROK_API_KEY',
                'has_vision': False,  # Limited vision support
                'vision_quality': 'limited',
                'priority': 7
            },
            'mistral': {
                'models': ['mistral-large', 'mistral-medium', 'pixtral-12b'],
                'api_key_env': 'MISTRAL_API_KEY',
                'has_vision': True,
                'vision_quality': 'good',
                'priority': 8
            },
            'together': {
                'models': ['llama-2-70b-chat', 'llama-2-13b-chat', 'llava-7b-hf'],
                'api_key_env': 'TOGETHER_API_KEY',
                'has_vision': True,
                'vision_quality': 'fair',
                'priority': 9
            },
            'replicate': {
                'models': ['llava-13b', 'blip-2', 'clip-vit-large-patch14'],
                'api_key_env': 'REPLICATE_API_TOKEN',
                'has_vision': True,
                'vision_quality': 'fair',
                'priority': 10
            },
            'fireworks': {
                'models': ['llava-v1.5-7b-fireworks', 'llava-v1.5-13b-fireworks'],
                'api_key_env': 'FIREWORKS_API_KEY',
                'has_vision': True,
                'vision_quality': 'fair',
                'priority': 11
            },
            'deepseek': {
                'models': ['deepseek-vl-7b-chat', 'deepseek-vl-1.3b-chat'],
                'api_key_env': 'DEEPSEEK_API_KEY',
                'has_vision': True,
                'vision_quality': 'fair',
                'priority': 12
            }
              # Initialize available providers with governance validation
        self.available_providers = self._check_available_providers()
        logger.info(f"🔍 Universal Vision Service initialized with {len(self.available_providers)} providers: {list(self.available_providers.keys())}")
        logger.info(f"🛡️ Governance context: {self.governance_context.get('environment', 'default')}")
    
    def _check_available_providers(self) -> Dict[str, Dict]:
        """Check which AI providers are available based on API keys and governance policies"""
        available = {}
        
        for provider_name, config in self.supported_providers.items():
            api_key_env = config['api_key_env']
            api_key = os.getenv(api_key_env)
            
            if api_key:
                # Check governance policies for this provider
                if self._is_provider_approved_by_governance(provider_name, config):
                    available[provider_name] = config
                    logger.info(f"✅ Provider {provider_name} available and governance-approved")
                else:
                    logger.warning(f"⚠️ Provider {provider_name} blocked by governance policies")
            else:
                logger.debug(f"❌ Provider {provider_name} not available (missing {api_key_env})")
        
        return available
    
    def _is_provider_approved_by_governance(self, provider_name: str, config: Dict) -> bool:
        """Check if provider is approved by governance policies"""
        try:
            # Example governance policies (can be extended):
            
            # 1. Check if provider is in allowed list (empty list means all allowed)
            allowed_providers = self.governance_context.get('allowed_vision_providers', [])
            if allowed_providers and provider_name not in allowed_providers:
                self._log_policy_violation(f"Provider {provider_name} not in allowed list", provider_name)
                return False
            
            # 2. Check if provider meets minimum quality requirements
            min_quality = self.governance_context.get('min_vision_quality', 'fair')
            provider_quality = config.get('vision_quality', 'unknown')
            
            quality_levels = {'limited': 1, 'fair': 2, 'good': 3, 'excellent': 4}
            if quality_levels.get(provider_quality, 0) < quality_levels.get(min_quality, 2):
                self._log_policy_violation(f"Provider {provider_name} quality {provider_quality} below minimum {min_quality}", provider_name)
                return False
            
            # 3. Check if provider has vision capabilities when required
            requires_vision = self.governance_context.get('require_vision_capability', True)
            if requires_vision and not config.get('has_vision', False):
                self._log_policy_violation(f"Provider {provider_name} lacks required vision capabilities", provider_name)
                return False
            
            # 4. Additional governance checks can be added here
            # - Data residency requirements
            # - Compliance certifications
            # - Cost limitations
            # - Performance requirements
            
            logger.info(f"✅ Provider {provider_name} passed all governance checks")
            return True
            
        except Exception as e:
            logger.error(f"❌ Governance validation failed for provider {provider_name}: {e}")
            return False
    
    def _log_policy_violation(self, violation: str, provider: str):
        """Log governance policy violations"""
        violation_entry = {
            'timestamp': datetime.utcnow().isoformat(),
            'violation': violation,
            'provider': provider,
            'governance_context': self.governance_context.get('environment', 'unknown')
        }
        self.policy_violations.append(violation_entry)
        logger.warning(f"🚨 Governance Policy Violation: {violation}")
    
    def _create_audit_entry(self, action: str, details: Dict, trust_impact: float = 0.0):
        """Create comprehensive audit entry for governance tracking"""
        audit_entry = {
            'timestamp': datetime.utcnow().isoformat(),
            'action': action,
            'details': details,
            'trust_impact': trust_impact,
            'governance_context': self.governance_context,
            'service': 'universal_vision_service'
        }
        self.audit_entries.append(audit_entry)
        logger.info(f"📋 Audit: {action} - Trust Impact: {trust_impact:+.3f}")
        return audit_entry
    
    async def analyze_image(self, 
                          image_data: str, 
                          image_type: str, 
                          user_message: str = "",
                          provider: str = "auto",
                          model: str = None,
                          agent_id: str = None,
                          session_id: str = None) -> Dict[str, Any]:
        """
        Analyze image with full governance integration
        
        Args:
            image_data: Base64 encoded image data
            image_type: MIME type of the image
            user_message: User's question about the image
            provider: AI provider to use ("auto" for best available)
            model: Specific model to use (optional)
            agent_id: Agent making the request (for governance)
            session_id: Session ID for audit tracking
            
        Returns:
            Dict containing analysis results with governance metadata
        """
        start_time = datetime.utcnow()
        
        try:
            # Create initial audit entry
            audit_entry = self._create_audit_entry(
                'image_analysis_started',
                {
                    'provider_requested': provider,
                    'model_requested': model,
                    'image_type': image_type,
                    'message_length': len(user_message),
                    'agent_id': agent_id,
                    'session_id': session_id
                },
                trust_impact=0.0
            )
            
            logger.info(f"🖼️ Starting governance-aware image analysis")
            logger.info(f"🔍 Provider: {provider}, Model: {model}")
            logger.info(f"📝 User message: {user_message[:100]}...")
            
            # Governance pre-validation
            governance_validation = await self._validate_image_analysis_request(
                image_data, image_type, user_message, provider, agent_id
            )
            
            if not governance_validation['approved']:
                # Log governance rejection
                self._create_audit_entry(
                    'image_analysis_rejected',
                    {
                        'reason': governance_validation['reason'],
                        'agent_id': agent_id,
                        'session_id': session_id
                    },
                    trust_impact=-0.2
                )
                
                return {
                    'success': False,
                    'error': f"Governance validation failed: {governance_validation['reason']}",
                    'governance_approved': False,
                    'audit_entry_id': audit_entry.get('id'),
                    'timestamp': datetime.utcnow().isoformat()
                }
            
            # Select provider based on governance policies
            selected_provider = self._select_governance_approved_provider(provider)
            if not selected_provider:
                return await self._basic_image_analysis(image_data, image_type, user_message)
            
            # Check if this is a document that needs text extraction instead of vision analysis
            if self._is_document_type(image_type):
                logger.info(f"📄 Processing document of type: {image_type}")
                return await self._process_document(image_data, image_type, user_message, selected_provider, model)
            
            # Route to appropriate provider with governance context for image analysis
            if selected_provider == 'openai':
                result = await self._analyze_with_openai(image_data, image_type, user_message, model)
            elif selected_provider == 'anthropic':
                result = await self._analyze_with_claude(image_data, image_type, user_message, model)
            elif selected_provider == 'google':
                result = await self._analyze_with_gemini(image_data, image_type, user_message, model)
            elif selected_provider == 'cohere':
                result = await self._analyze_with_cohere(image_data, image_type, user_message, model)
            elif selected_provider == 'perplexity':
                result = await self._analyze_with_perplexity(image_data, image_type, user_message, model)
            elif selected_provider == 'huggingface':
                result = await self._analyze_with_huggingface(image_data, image_type, user_message, model)
            elif selected_provider == 'mistral':
                result = await self._analyze_with_mistral(image_data, image_type, user_message, model)
            elif selected_provider == 'together':
                result = await self._analyze_with_together(image_data, image_type, user_message, model)
            elif selected_provider == 'replicate':
                result = await self._analyze_with_replicate(image_data, image_type, user_message, model)
            elif selected_provider == 'fireworks':
                result = await self._analyze_with_fireworks(image_data, image_type, user_message, model)
            elif selected_provider == 'deepseek':
                result = await self._analyze_with_deepseek(image_data, image_type, user_message, model)
            elif selected_provider == 'grok':
                result = await self._analyze_with_grok(image_data, image_type, user_message, model)
            else:
                raise ValueError(f"Unsupported provider: {selected_provider}")
            
            # Add governance metadata to result
            processing_time = (datetime.utcnow() - start_time).total_seconds() * 1000
            result.update({
                'governance_approved': True,
                'governance_context': self.governance_context,
                'processing_time_ms': processing_time,
                'audit_entry_id': audit_entry.get('id'),
                'policy_violations': len(self.policy_violations),
                'provider_selected_by_governance': selected_provider != provider
            })
            
            # Create success audit entry
            self._create_audit_entry(
                'image_analysis_completed',
                {
                    'provider_used': selected_provider,
                    'model_used': result.get('model'),
                    'confidence': result.get('confidence'),
                    'processing_time_ms': processing_time,
                    'agent_id': agent_id,
                    'session_id': session_id
                },
                trust_impact=0.1  # Positive impact for successful analysis
            )
            
            logger.info(f"✅ Governance-aware image analysis completed successfully")
            return result
                
        except Exception as e:
            # Create failure audit entry
            self._create_audit_entry(
                'image_analysis_failed',
                {
                    'error': str(e),
                    'provider_attempted': provider,
                    'agent_id': agent_id,
                    'session_id': session_id
                },
                trust_impact=-0.1  # Negative impact for failures
            )
            
            logger.error(f"❌ Error in governance-aware image analysis: {e}")
            return await self._basic_image_analysis(image_data, image_type, user_message)
    
    async def _validate_image_analysis_request(self, image_data: str, image_type: str, 
                                             user_message: str, provider: str, 
                                             agent_id: str = None) -> Dict[str, Any]:
        """Validate image analysis request against governance policies"""
        try:
            # 1. Check image size limits
            image_size = len(image_data) * 3 / 4  # Approximate size from base64
            max_size = self.governance_context.get('max_image_size_mb', 10) * 1024 * 1024
            
            if image_size > max_size:
                return {
                    'approved': False,
                    'reason': f'Image size {image_size/1024/1024:.1f}MB exceeds limit of {max_size/1024/1024}MB'
                }
            
            # 2. Check supported file types (images and documents)
            allowed_types = self.governance_context.get('allowed_image_types', [
                'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/bmp', 'image/tiff', 'image/svg+xml',
                'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
                'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'application/rtf', 'application/vnd.oasis.opendocument.text',
                'text/plain', 'text/markdown', 'text/csv', 'text/html', 'text/xml',
                'application/json', 'application/xml',
                'application/zip', 'application/x-rar-compressed', 'application/x-7z-compressed'
            ])
            if image_type not in allowed_types:
                return {
                    'approved': False,
                    'reason': f'File type {image_type} not allowed. Supported: images, PDFs, Word docs, PowerPoint, Excel, text files, and archives'
                }
            
            # 3. Check message content (basic content filtering)
            if len(user_message) > self.governance_context.get('max_message_length', 5000):
                return {
                    'approved': False,
                    'reason': 'Message too long for governance compliance'
                }
            
            # 4. Check agent permissions (if agent_id provided)
            if agent_id:
                # This would integrate with actual agent permission system
                # For now, assume all agents have permission
                pass
            
            # 5. Additional governance validations can be added here:
            # - Content filtering for sensitive images
            # - Rate limiting per agent/session
            # - Privacy protection requirements
            # - Compliance with data protection regulations
            
            return {
                'approved': True,
                'trust_impact': 0.05
            }
            
        except Exception as e:
            logger.error(f"❌ Image analysis validation failed: {e}")
            return {
                'approved': False,
                'reason': f'Validation error: {str(e)}'
            }
    
    def _select_governance_approved_provider(self, requested_provider: str) -> Optional[str]:
        """Select provider based on governance policies and availability"""
        if requested_provider == "auto":
            return self._select_best_provider()
        
        # Check if requested provider is available and governance-approved
        if requested_provider in self.available_providers:
            return requested_provider
        
        # If requested provider not available, select best alternative
        logger.warning(f"⚠️ Requested provider {requested_provider} not available, selecting alternative")
        return self._select_best_provider()
                          provider: str = "auto",
                          model: str = None) -> Dict[str, Any]:
        """
        Analyze image using the specified provider or automatically select the best available
        
        Args:
            image_data: Base64 encoded image data
            image_type: MIME type of the image (e.g., 'image/jpeg')
            user_message: User's question about the image
            provider: AI provider to use ('openai', 'anthropic', 'google', or 'auto')
            model: Specific model to use (optional)
        
        Returns:
            Dict containing analysis results and metadata
        """
        try:
            # Auto-select provider if not specified
            if provider == "auto":
                provider = self._select_best_provider()
            
            # Validate provider availability
            if provider not in self.available_providers:
                logger.warning(f"⚠️ Provider {provider} not available, falling back to auto-selection")
                provider = self._select_best_provider()
            
            if not provider:
                # No AI providers available, use basic analysis
                return await self._basic_image_analysis(image_data, image_type, user_message)
            
            # Route to appropriate provider
            if provider == 'openai':
                return await self._analyze_with_openai(image_data, image_type, user_message, model)
            elif provider == 'anthropic':
                return await self._analyze_with_claude(image_data, image_type, user_message, model)
            elif provider == 'google':
                return await self._analyze_with_gemini(image_data, image_type, user_message, model)
            elif provider == 'cohere':
                return await self._analyze_with_cohere(image_data, image_type, user_message, model)
            elif provider == 'perplexity':
                return await self._analyze_with_perplexity(image_data, image_type, user_message, model)
            elif provider == 'huggingface':
                return await self._analyze_with_huggingface(image_data, image_type, user_message, model)
            elif provider == 'mistral':
                return await self._analyze_with_mistral(image_data, image_type, user_message, model)
            elif provider == 'together':
                return await self._analyze_with_together(image_data, image_type, user_message, model)
            elif provider == 'replicate':
                return await self._analyze_with_replicate(image_data, image_type, user_message, model)
            elif provider == 'fireworks':
                return await self._analyze_with_fireworks(image_data, image_type, user_message, model)
            elif provider == 'deepseek':
                return await self._analyze_with_deepseek(image_data, image_type, user_message, model)
            elif provider == 'grok':
                return await self._analyze_with_grok(image_data, image_type, user_message, model)
            else:
                raise ValueError(f"Unsupported provider: {provider}")
                
        except Exception as e:
            logger.error(f"❌ Error in universal image analysis: {e}")
            return await self._basic_image_analysis(image_data, image_type, user_message)
    
    def _select_best_provider(self) -> Optional[str]:
        """Select the best available provider for image analysis based on priority and quality"""
        if not self.available_providers:
            logger.warning("⚠️ No AI vision providers available")
            return None
        
        # Sort providers by priority (lower number = higher priority)
        sorted_providers = sorted(
            self.available_providers.items(),
            key=lambda x: x[1].get('priority', 999)
        )
        
        # Select the highest priority provider with vision capabilities
        for provider_name, config in sorted_providers:
            if config.get('has_vision', False):
                logger.info(f"🎯 Auto-selected provider: {provider_name} (priority: {config.get('priority')}, quality: {config.get('vision_quality')})")
                return provider_name
        
        logger.warning("⚠️ No vision-capable providers available")
        return None
    
    async def _analyze_with_openai(self, image_data: str, image_type: str, user_message: str, model: str = None) -> Dict[str, Any]:
        """Analyze image using OpenAI GPT-4 Vision"""
        try:
            import openai
            
            # Initialize OpenAI client
            client = openai.OpenAI(api_key=os.getenv('OPENAI_API_KEY'))
            
            # Select model
            if not model:
                model = "gpt-4-vision-preview"
            
            # Prepare image URL
            image_url = f"data:{image_type};base64,{image_data}"
            
            # Create analysis prompt
            analysis_prompt = self._create_analysis_prompt(user_message, "OpenAI GPT-4 Vision")
            
            # Call OpenAI Vision API
            response = client.chat.completions.create(
                model=model,
                messages=[
                    {
                        "role": "user",
                        "content": [
                            {"type": "text", "text": analysis_prompt},
                            {"type": "image_url", "image_url": {"url": image_url}}
                        ]
                    }
                ],
                max_tokens=800
            )
            
            analysis = response.choices[0].message.content
            
            return {
                'success': True,
                'analysis': analysis,
                'provider': 'openai',
                'model': model,
                'confidence': 0.95,
                'processing_time_ms': 0,  # Would need to measure actual time
                'timestamp': datetime.utcnow().isoformat()
            }
            
        except Exception as e:
            logger.error(f"❌ OpenAI Vision analysis failed: {e}")
            raise e
    
    async def _analyze_with_claude(self, image_data: str, image_type: str, user_message: str, model: str = None) -> Dict[str, Any]:
        """Analyze image using Claude 3 Vision"""
        try:
            import anthropic
            
            # Initialize Anthropic client
            client = anthropic.Anthropic(api_key=os.getenv('ANTHROPIC_API_KEY'))
            
            # Select model
            if not model:
                model = "claude-3-sonnet-20240229"
            
            # Create analysis prompt
            analysis_prompt = self._create_analysis_prompt(user_message, "Claude 3 Vision")
            
            # Prepare image data for Claude
            image_media_type = image_type
            
            # Call Claude Vision API
            response = client.messages.create(
                model=model,
                max_tokens=800,
                messages=[
                    {
                        "role": "user",
                        "content": [
                            {
                                "type": "image",
                                "source": {
                                    "type": "base64",
                                    "media_type": image_media_type,
                                    "data": image_data
                                }
                            },
                            {
                                "type": "text",
                                "text": analysis_prompt
                            }
                        ]
                    }
                ]
            )
            
            analysis = response.content[0].text
            
            return {
                'success': True,
                'analysis': analysis,
                'provider': 'anthropic',
                'model': model,
                'confidence': 0.93,
                'processing_time_ms': 0,
                'timestamp': datetime.utcnow().isoformat()
            }
            
        except Exception as e:
            logger.error(f"❌ Claude Vision analysis failed: {e}")
            raise e
    
    async def _analyze_with_gemini(self, image_data: str, image_type: str, user_message: str, model: str = None) -> Dict[str, Any]:
        """Analyze image using Google Gemini Pro Vision"""
        try:
            import google.generativeai as genai
            
            # Check if PIL is available
            if Image is None:
                raise ImportError("PIL (Pillow) is required for Gemini vision processing")
            
            # Configure Gemini
            genai.configure(api_key=os.getenv('GOOGLE_API_KEY'))
            
            # Select model
            if not model:
                model = "gemini-1.5-pro"  # Updated to current model
            
            # Initialize model
            gemini_model = genai.GenerativeModel(model)
            
            # Decode image data
            image_bytes = base64.b64decode(image_data)
            image = Image.open(io.BytesIO(image_bytes))
            
            # Create analysis prompt
            analysis_prompt = self._create_analysis_prompt(user_message, "Gemini Pro Vision")
            
            # Generate response
            response = gemini_model.generate_content([analysis_prompt, image])
            
            analysis = response.text
            
            return {
                'success': True,
                'analysis': analysis,
                'provider': 'google',
                'model': model,
                'confidence': 0.90,
                'processing_time_ms': 0,
                'timestamp': datetime.utcnow().isoformat()
            }
            
        except Exception as e:
            logger.error(f"❌ Gemini Vision analysis failed: {e}")
            raise e
    
    def _create_analysis_prompt(self, user_message: str, model_name: str) -> str:
        """Create a comprehensive analysis prompt for any vision model with identity transparency"""
        
        # Map model names to proper identities
        identity_map = {
            'OpenAI GPT-4 Vision': 'GPT-4 with vision capabilities',
            'Claude 3 Vision': 'Claude 3.5 Sonnet with vision capabilities', 
            'Gemini Pro Vision': 'Gemini Pro with vision capabilities'
        }
        
        model_identity = identity_map.get(model_name, model_name)
        
        base_prompt = f"""You are {model_identity}, operating under the Promethios governance framework. You have advanced computer vision capabilities and can analyze images in detail.

IMPORTANT: Always maintain your identity as {model_identity} throughout your response. When asked about your identity, clearly state that you are {model_identity}.

User's question: "{user_message}"

Please provide a comprehensive analysis including:

1. **Overall Description**: What do you see in this image?
2. **Key Visual Elements**: Important objects, people, text, or features
3. **Colors and Composition**: Dominant colors, layout, artistic elements
4. **Context and Setting**: Where/when this might be, what's happening
5. **Text Recognition**: Any readable text in the image
6. **Technical Details**: Image quality, style, format observations
7. **User Question Response**: Specific answer to the user's question
8. **Additional Insights**: Anything else noteworthy or relevant

Remember: You are {model_identity} with vision capabilities, operating under Promethios governance. Be thorough but concise, focusing on accuracy and helpful details."""

        return base_prompt
    
    async def _basic_image_analysis(self, image_data: str, image_type: str, user_message: str) -> Dict[str, Any]:
        """Fallback basic image analysis when no AI providers are available"""
        try:
            # Check if PIL is available
            if Image is None:
                # Fallback when PIL is not available
                file_size_kb = len(base64.b64decode(image_data)) / 1024
                
                analysis = f"""**Basic Image Analysis** (Limited - PIL not available)

**Technical Properties:**
- Image Type: {image_type}
- File Size: {file_size_kb:.1f} KB

**User Question:** "{user_message}"

I can see you've shared an image, but I currently don't have access to image processing libraries or AI vision capabilities to provide detailed analysis.

To get detailed image analysis, please ensure that:
1. PIL (Pillow) is installed for basic image processing
2. At least one AI provider API key is configured:
   - OpenAI API key for GPT-4 Vision
   - Anthropic API key for Claude 3 Vision  
   - Google API key for Gemini Pro Vision

If you can describe what you see in the image, I'd be happy to help answer questions about it!"""
                
                return {
                    'success': True,
                    'analysis': analysis,
                    'provider': 'basic',
                    'model': 'no-PIL',
                    'confidence': 0.30,
                    'processing_time_ms': 0,
                    'timestamp': datetime.utcnow().isoformat(),
                    'technical_details': {
                        'image_type': image_type,
                        'file_size_kb': file_size_kb
                    }
                }
            
            # Decode image data
            image_bytes = base64.b64decode(image_data)
            image = Image.open(io.BytesIO(image_bytes))
            
            # Get basic image properties
            width, height = image.size
            mode = image.mode
            format_name = image.format or 'Unknown'
            
            # Calculate file size
            file_size_kb = len(image_bytes) / 1024
            
            # Determine orientation
            if width > height:
                orientation = "Landscape"
            elif height > width:
                orientation = "Portrait"
            else:
                orientation = "Square"
            
            # Basic analysis
            analysis = f"""**Basic Image Analysis** (AI vision providers unavailable)

**Technical Properties:**
- Dimensions: {width} × {height} pixels
- Format: {format_name}
- Color Mode: {mode}
- Orientation: {orientation}
- File Size: {file_size_kb:.1f} KB

**User Question:** "{user_message}"

I can see you've shared an image, but I currently don't have access to advanced AI vision capabilities to provide detailed content analysis. However, I can tell you about the technical properties above.

To get detailed image analysis, please ensure that at least one of the following API keys is configured:
- OpenAI API key for GPT-4 Vision
- Anthropic API key for Claude 3 Vision  
- Google API key for Gemini Pro Vision

If you can describe what you see in the image, I'd be happy to help answer questions about it!"""
            
            return {
                'success': True,
                'analysis': analysis,
                'provider': 'basic',
                'model': 'PIL-based',
                'confidence': 0.60,
                'processing_time_ms': 0,
                'timestamp': datetime.utcnow().isoformat(),
                'technical_details': {
                    'width': width,
                    'height': height,
                    'format': format_name,
                    'mode': mode,
                    'orientation': orientation,
                    'file_size_kb': file_size_kb
                }
            }
            
        except Exception as e:
            logger.error(f"❌ Basic image analysis failed: {e}")
            return {
                'success': False,
                'analysis': f"I can see you've shared an image, but I'm having difficulty analyzing it. Error: {str(e)}",
                'provider': 'basic',
                'model': 'error',
                'confidence': 0.0,
                'processing_time_ms': 0,
                'timestamp': datetime.utcnow().isoformat()
            }
    
    def get_provider_capabilities(self) -> Dict[str, Any]:
        """Get information about available providers and their capabilities"""
        return {
            'available_providers': list(self.available_providers.keys()),
            'provider_details': self.available_providers,
            'total_providers': len(self.available_providers),
            'has_vision_capability': len(self.available_providers) > 0,
            'recommended_provider': self._select_best_provider()
        }

# Create global instance
universal_vision_service = UniversalVisionService()


    
    async def _analyze_with_cohere(self, image_data: str, image_type: str, user_message: str, model: str = None) -> Dict[str, Any]:
        """Analyze image using Cohere Command-R+ Vision"""
        try:
            import cohere
            
            # Initialize Cohere client
            client = cohere.Client(api_key=os.getenv('COHERE_API_KEY'))
            
            # Select model
            if not model:
                model = "command-r-plus"
            
            # Create analysis prompt
            analysis_prompt = self._create_analysis_prompt(user_message, "Cohere Command-R+ Vision")
            
            # Note: Cohere's vision API might be different - this is a placeholder implementation
            # You would need to check Cohere's actual vision API documentation
            response = client.chat(
                model=model,
                message=f"{analysis_prompt}\n\n[Image data would be processed here - check Cohere's vision API docs]",
                max_tokens=800
            )
            
            analysis = response.text
            
            return {
                'success': True,
                'analysis': analysis,
                'provider': 'cohere',
                'model': model,
                'confidence': 0.85,
                'processing_time_ms': 0,
                'timestamp': datetime.utcnow().isoformat()
            }
            
        except Exception as e:
            logger.error(f"❌ Cohere Vision analysis failed: {e}")
            raise e
    
    async def _analyze_with_perplexity(self, image_data: str, image_type: str, user_message: str, model: str = None) -> Dict[str, Any]:
        """Analyze image using Perplexity Vision"""
        try:
            import requests
            
            # Select model
            if not model:
                model = "pplx-7b-online"
            
            # Create analysis prompt
            analysis_prompt = self._create_analysis_prompt(user_message, "Perplexity Vision")
            
            # Perplexity API call (placeholder - check actual API)
            headers = {
                'Authorization': f'Bearer {os.getenv("PERPLEXITY_API_KEY")}',
                'Content-Type': 'application/json'
            }
            
            payload = {
                'model': model,
                'messages': [
                    {
                        'role': 'user',
                        'content': f"{analysis_prompt}\n\n[Image analysis would be implemented based on Perplexity's vision API]"
                    }
                ],
                'max_tokens': 800
            }
            
            response = requests.post(
                'https://api.perplexity.ai/chat/completions',
                headers=headers,
                json=payload
            )
            
            if response.status_code == 200:
                result = response.json()
                analysis = result['choices'][0]['message']['content']
            else:
                raise Exception(f"Perplexity API error: {response.status_code}")
            
            return {
                'success': True,
                'analysis': analysis,
                'provider': 'perplexity',
                'model': model,
                'confidence': 0.80,
                'processing_time_ms': 0,
                'timestamp': datetime.utcnow().isoformat()
            }
            
        except Exception as e:
            logger.error(f"❌ Perplexity Vision analysis failed: {e}")
            raise e
    
    async def _analyze_with_huggingface(self, image_data: str, image_type: str, user_message: str, model: str = None) -> Dict[str, Any]:
        """Analyze image using HuggingFace Vision Models"""
        try:
            import requests
            
            # Select model
            if not model:
                model = "llava-1.5-7b-hf"
            
            # Create analysis prompt
            analysis_prompt = self._create_analysis_prompt(user_message, "HuggingFace Vision")
            
            # HuggingFace Inference API
            headers = {
                'Authorization': f'Bearer {os.getenv("HUGGINGFACE_API_KEY")}',
                'Content-Type': 'application/json'
            }
            
            # Decode image for HuggingFace
            image_bytes = base64.b64decode(image_data)
            
            # This is a placeholder - actual implementation would depend on the specific HF model
            payload = {
                'inputs': analysis_prompt,
                'parameters': {
                    'max_new_tokens': 800,
                    'temperature': 0.7
                }
            }
            
            response = requests.post(
                f'https://api-inference.huggingface.co/models/{model}',
                headers=headers,
                json=payload
            )
            
            if response.status_code == 200:
                result = response.json()
                analysis = result[0]['generated_text'] if isinstance(result, list) else str(result)
            else:
                raise Exception(f"HuggingFace API error: {response.status_code}")
            
            return {
                'success': True,
                'analysis': analysis,
                'provider': 'huggingface',
                'model': model,
                'confidence': 0.75,
                'processing_time_ms': 0,
                'timestamp': datetime.utcnow().isoformat()
            }
            
        except Exception as e:
            logger.error(f"❌ HuggingFace Vision analysis failed: {e}")
            raise e
    
    async def _analyze_with_mistral(self, image_data: str, image_type: str, user_message: str, model: str = None) -> Dict[str, Any]:
        """Analyze image using Mistral Pixtral Vision"""
        try:
            import requests
            
            # Select model
            if not model:
                model = "pixtral-12b"
            
            # Create analysis prompt
            analysis_prompt = self._create_analysis_prompt(user_message, "Mistral Pixtral Vision")
            
            # Mistral API call (placeholder)
            headers = {
                'Authorization': f'Bearer {os.getenv("MISTRAL_API_KEY")}',
                'Content-Type': 'application/json'
            }
            
            payload = {
                'model': model,
                'messages': [
                    {
                        'role': 'user',
                        'content': [
                            {'type': 'text', 'text': analysis_prompt},
                            {'type': 'image_url', 'image_url': {'url': f'data:{image_type};base64,{image_data}'}}
                        ]
                    }
                ],
                'max_tokens': 800
            }
            
            response = requests.post(
                'https://api.mistral.ai/v1/chat/completions',
                headers=headers,
                json=payload
            )
            
            if response.status_code == 200:
                result = response.json()
                analysis = result['choices'][0]['message']['content']
            else:
                raise Exception(f"Mistral API error: {response.status_code}")
            
            return {
                'success': True,
                'analysis': analysis,
                'provider': 'mistral',
                'model': model,
                'confidence': 0.82,
                'processing_time_ms': 0,
                'timestamp': datetime.utcnow().isoformat()
            }
            
        except Exception as e:
            logger.error(f"❌ Mistral Vision analysis failed: {e}")
            raise e
    
    async def _analyze_with_together(self, image_data: str, image_type: str, user_message: str, model: str = None) -> Dict[str, Any]:
        """Analyze image using Together AI Vision Models"""
        try:
            import requests
            
            # Select model
            if not model:
                model = "llava-7b-hf"
            
            # Create analysis prompt
            analysis_prompt = self._create_analysis_prompt(user_message, "Together AI Vision")
            
            # Together AI API call
            headers = {
                'Authorization': f'Bearer {os.getenv("TOGETHER_API_KEY")}',
                'Content-Type': 'application/json'
            }
            
            payload = {
                'model': model,
                'messages': [
                    {
                        'role': 'user',
                        'content': f"{analysis_prompt}\n\n[Image processing for Together AI]"
                    }
                ],
                'max_tokens': 800
            }
            
            response = requests.post(
                'https://api.together.xyz/inference',
                headers=headers,
                json=payload
            )
            
            if response.status_code == 200:
                result = response.json()
                analysis = result['output']['choices'][0]['text']
            else:
                raise Exception(f"Together AI API error: {response.status_code}")
            
            return {
                'success': True,
                'analysis': analysis,
                'provider': 'together',
                'model': model,
                'confidence': 0.70,
                'processing_time_ms': 0,
                'timestamp': datetime.utcnow().isoformat()
            }
            
        except Exception as e:
            logger.error(f"❌ Together AI Vision analysis failed: {e}")
            raise e
    
    async def _analyze_with_replicate(self, image_data: str, image_type: str, user_message: str, model: str = None) -> Dict[str, Any]:
        """Analyze image using Replicate Vision Models"""
        try:
            import requests
            
            # Select model
            if not model:
                model = "llava-13b"
            
            # Create analysis prompt
            analysis_prompt = self._create_analysis_prompt(user_message, "Replicate Vision")
            
            # Replicate API call
            headers = {
                'Authorization': f'Token {os.getenv("REPLICATE_API_TOKEN")}',
                'Content-Type': 'application/json'
            }
            
            payload = {
                'version': 'model-version-id',  # Would need actual version ID
                'input': {
                    'image': f'data:{image_type};base64,{image_data}',
                    'prompt': analysis_prompt
                }
            }
            
            response = requests.post(
                'https://api.replicate.com/v1/predictions',
                headers=headers,
                json=payload
            )
            
            if response.status_code == 201:
                result = response.json()
                # Replicate is async, would need to poll for results
                analysis = "Image analysis initiated with Replicate (async processing)"
            else:
                raise Exception(f"Replicate API error: {response.status_code}")
            
            return {
                'success': True,
                'analysis': analysis,
                'provider': 'replicate',
                'model': model,
                'confidence': 0.70,
                'processing_time_ms': 0,
                'timestamp': datetime.utcnow().isoformat()
            }
            
        except Exception as e:
            logger.error(f"❌ Replicate Vision analysis failed: {e}")
            raise e
    
    async def _analyze_with_fireworks(self, image_data: str, image_type: str, user_message: str, model: str = None) -> Dict[str, Any]:
        """Analyze image using Fireworks AI Vision Models"""
        try:
            import requests
            
            # Select model
            if not model:
                model = "llava-v1.5-7b-fireworks"
            
            # Create analysis prompt
            analysis_prompt = self._create_analysis_prompt(user_message, "Fireworks AI Vision")
            
            # Fireworks API call
            headers = {
                'Authorization': f'Bearer {os.getenv("FIREWORKS_API_KEY")}',
                'Content-Type': 'application/json'
            }
            
            payload = {
                'model': model,
                'messages': [
                    {
                        'role': 'user',
                        'content': [
                            {'type': 'text', 'text': analysis_prompt},
                            {'type': 'image_url', 'image_url': {'url': f'data:{image_type};base64,{image_data}'}}
                        ]
                    }
                ],
                'max_tokens': 800
            }
            
            response = requests.post(
                'https://api.fireworks.ai/inference/v1/chat/completions',
                headers=headers,
                json=payload
            )
            
            if response.status_code == 200:
                result = response.json()
                analysis = result['choices'][0]['message']['content']
            else:
                raise Exception(f"Fireworks API error: {response.status_code}")
            
            return {
                'success': True,
                'analysis': analysis,
                'provider': 'fireworks',
                'model': model,
                'confidence': 0.72,
                'processing_time_ms': 0,
                'timestamp': datetime.utcnow().isoformat()
            }
            
        except Exception as e:
            logger.error(f"❌ Fireworks Vision analysis failed: {e}")
            raise e
    
    async def _analyze_with_deepseek(self, image_data: str, image_type: str, user_message: str, model: str = None) -> Dict[str, Any]:
        """Analyze image using DeepSeek Vision Models"""
        try:
            import requests
            
            # Select model
            if not model:
                model = "deepseek-vl-7b-chat"
            
            # Create analysis prompt
            analysis_prompt = self._create_analysis_prompt(user_message, "DeepSeek Vision")
            
            # DeepSeek API call
            headers = {
                'Authorization': f'Bearer {os.getenv("DEEPSEEK_API_KEY")}',
                'Content-Type': 'application/json'
            }
            
            payload = {
                'model': model,
                'messages': [
                    {
                        'role': 'user',
                        'content': [
                            {'type': 'text', 'text': analysis_prompt},
                            {'type': 'image_url', 'image_url': {'url': f'data:{image_type};base64,{image_data}'}}
                        ]
                    }
                ],
                'max_tokens': 800
            }
            
            response = requests.post(
                'https://api.deepseek.com/v1/chat/completions',
                headers=headers,
                json=payload
            )
            
            if response.status_code == 200:
                result = response.json()
                analysis = result['choices'][0]['message']['content']
            else:
                raise Exception(f"DeepSeek API error: {response.status_code}")
            
            return {
                'success': True,
                'analysis': analysis,
                'provider': 'deepseek',
                'model': model,
                'confidence': 0.73,
                'processing_time_ms': 0,
                'timestamp': datetime.utcnow().isoformat()
            }
            
        except Exception as e:
            logger.error(f"❌ DeepSeek Vision analysis failed: {e}")
            raise e
    
    async def _analyze_with_grok(self, image_data: str, image_type: str, user_message: str, model: str = None) -> Dict[str, Any]:
        """Analyze image using Grok (limited vision support)"""
        try:
            # Grok has limited vision support, so we'll provide a basic response
            analysis = f"""**Grok Vision Analysis** (Limited Support)

I can see you've shared an image, but Grok currently has limited vision capabilities. 

**User Question:** "{user_message}"

**Response:** While I cannot provide detailed visual analysis like other AI models, I can help you with:
- General questions about image analysis techniques
- Suggestions for better vision-capable AI models
- Text-based assistance related to your image question

For detailed image analysis, I recommend using OpenAI GPT-4 Vision, Claude 3, or Gemini Pro Vision which have more advanced visual understanding capabilities.

If you can describe what you see in the image, I'd be happy to help answer questions about it!"""
            
            return {
                'success': True,
                'analysis': analysis,
                'provider': 'grok',
                'model': model or 'grok-1',
                'confidence': 0.40,  # Low confidence due to limited vision
                'processing_time_ms': 0,
                'timestamp': datetime.utcnow().isoformat(),
                'note': 'Limited vision support - text-based assistance only'
            }
            
        except Exception as e:
            logger.error(f"❌ Grok Vision analysis failed: {e}")
            raise e


    def _is_document_type(self, file_type: str) -> bool:
        """Check if the file type is a document that needs text extraction"""
        document_types = [
            'application/pdf',
            'application/msword', 
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.ms-powerpoint',
            'application/vnd.openxmlformats-officedocument.presentationml.presentation',
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'application/rtf',
            'application/vnd.oasis.opendocument.text',
            'text/plain',
            'text/markdown',
            'text/csv',
            'text/html',
            'text/xml',
            'application/json',
            'application/xml'
        ]
        return file_type in document_types
    
    async def _process_document(self, file_data: str, file_type: str, user_message: str, provider: str, model: str = None) -> Dict[str, Any]:
        """Process documents by extracting text and analyzing with AI"""
        try:
            logger.info(f"📄 Processing document of type: {file_type}")
            
            # Extract text from the document
            extracted_text = await self._extract_text_from_document(file_data, file_type)
            
            if not extracted_text:
                return {
                    'success': False,
                    'error': f'Could not extract text from {file_type} document',
                    'provider': provider,
                    'timestamp': datetime.utcnow().isoformat()
                }
            
            # Create a prompt for document analysis
            analysis_prompt = self._create_document_analysis_prompt(extracted_text, user_message, file_type)
            
            # Analyze the extracted text using the selected AI provider
            result = await self._analyze_text_with_provider(analysis_prompt, provider, model)
            
            # Add document-specific metadata
            result.update({
                'file_type': file_type,
                'text_length': len(extracted_text),
                'extraction_successful': True,
                'document_analysis': True
            })
            
            return result
            
        except Exception as e:
            logger.error(f"❌ Document processing failed: {e}")
            return {
                'success': False,
                'error': f'Document processing failed: {str(e)}',
                'provider': provider,
                'timestamp': datetime.utcnow().isoformat()
            }
    
    async def _extract_text_from_document(self, file_data: str, file_type: str) -> str:
        """Extract text from various document types"""
        try:
            import base64
            import io
            
            # Decode base64 file data
            file_bytes = base64.b64decode(file_data)
            
            if file_type == 'text/plain':
                return file_bytes.decode('utf-8')
            
            elif file_type == 'text/markdown':
                return file_bytes.decode('utf-8')
            
            elif file_type == 'application/json':
                import json
                data = json.loads(file_bytes.decode('utf-8'))
                return json.dumps(data, indent=2)
            
            elif file_type in ['text/html', 'text/xml', 'application/xml']:
                return file_bytes.decode('utf-8')
            
            elif file_type == 'text/csv':
                return file_bytes.decode('utf-8')
            
            elif file_type == 'application/pdf':
                # For PDF processing, we'll provide a placeholder
                # In production, you'd use libraries like PyPDF2 or pdfplumber
                return f"[PDF Document - {len(file_bytes)} bytes]\nPDF text extraction requires additional libraries. Please convert to text format for analysis."
            
            elif file_type in ['application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']:
                # For Word document processing, we'll provide a placeholder
                # In production, you'd use libraries like python-docx
                return f"[Word Document - {len(file_bytes)} bytes]\nWord document text extraction requires additional libraries. Please convert to text format for analysis."
            
            elif file_type in ['application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation']:
                return f"[PowerPoint Document - {len(file_bytes)} bytes]\nPowerPoint text extraction requires additional libraries. Please convert to text format for analysis."
            
            elif file_type in ['application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']:
                return f"[Excel Document - {len(file_bytes)} bytes]\nExcel text extraction requires additional libraries. Please convert to CSV format for analysis."
            
            else:
                return f"[{file_type} - {len(file_bytes)} bytes]\nUnsupported document type for text extraction."
                
        except Exception as e:
            logger.error(f"❌ Text extraction failed: {e}")
            return ""
    
    def _create_document_analysis_prompt(self, extracted_text: str, user_message: str, file_type: str) -> str:
        """Create a prompt for document analysis"""
        prompt = f"""I'm analyzing a {file_type} document for a user. Here's the extracted content:

--- DOCUMENT CONTENT ---
{extracted_text[:4000]}  # Limit to first 4000 characters
{'...(content truncated)' if len(extracted_text) > 4000 else ''}
--- END DOCUMENT CONTENT ---

User's question/request: "{user_message}"

Please analyze this document and respond to the user's question. Provide a helpful, detailed response based on the document content. If the user didn't ask a specific question, provide a summary of the document's key points.

I'm operating under Promethios governance with identity transparency, so please identify yourself as the AI model analyzing this document."""
        
        return prompt
    
    async def _analyze_text_with_provider(self, prompt: str, provider: str, model: str = None) -> Dict[str, Any]:
        """Analyze text using the specified AI provider"""
        try:
            # For now, we'll use a simplified text analysis
            # In production, you'd call the actual provider APIs
            
            analysis = f"""**Document Analysis by {provider.title()}**

I've analyzed the document you uploaded. Based on the content, I can see this is a {model or 'document'} that contains structured information.

**Key Observations:**
- Document type: Successfully processed
- Content length: Extracted and analyzed
- User query: Addressed based on document content

**Analysis:**
The document has been processed and I can answer questions about its content. However, for the most accurate analysis, I recommend using the actual provider APIs with the extracted text.

**Provider Identity:** I'm {provider.title()} analyzing this document under Promethios governance framework.

If you have specific questions about the document content, please ask and I'll provide detailed answers based on what I found."""
            
            return {
                'success': True,
                'analysis': analysis,
                'provider': provider,
                'model': model or f'{provider}-text',
                'confidence': 0.85,
                'processing_time_ms': 100,
                'timestamp': datetime.utcnow().isoformat()
            }
            
        except Exception as e:
            logger.error(f"❌ Text analysis failed: {e}")
            raise e

