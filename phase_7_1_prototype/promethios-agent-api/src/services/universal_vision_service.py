"""
Universal Vision Service for Promethios
Provides image analysis capabilities across all AI providers (OpenAI, Claude, Gemini)
"""

import asyncio
import json
import logging
import time
import base64
import io
from typing import Dict, List, Optional, Any, Union
from PIL import Image
import os
from datetime import datetime

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class UniversalVisionService:
    """
    Universal Vision Service that provides image analysis across all AI providers
    Supports OpenAI GPT-4 Vision, Claude 3 Vision, and Gemini Pro Vision
    """
    
    def __init__(self):
        self.supported_providers = {
            'openai': {
                'models': ['gpt-4-vision-preview', 'gpt-4-turbo', 'gpt-4o'],
                'api_key_env': 'OPENAI_API_KEY',
                'has_vision': True
            },
            'anthropic': {
                'models': ['claude-3-opus', 'claude-3-sonnet', 'claude-3-haiku'],
                'api_key_env': 'ANTHROPIC_API_KEY', 
                'has_vision': True
            },
            'google': {
                'models': ['gemini-pro-vision', 'gemini-1.5-pro'],
                'api_key_env': 'GOOGLE_API_KEY',
                'has_vision': True
            }
        }
        
        # Initialize available providers
        self.available_providers = self._check_available_providers()
        logger.info(f"🔍 Universal Vision Service initialized with providers: {list(self.available_providers.keys())}")
    
    def _check_available_providers(self) -> Dict[str, Dict]:
        """Check which AI providers are available based on API keys"""
        available = {}
        
        for provider, config in self.supported_providers.items():
            api_key = os.getenv(config['api_key_env'])
            if api_key:
                available[provider] = config
                logger.info(f"✅ {provider.title()} API key found - Vision capabilities available")
            else:
                logger.warning(f"⚠️ {provider.title()} API key not found - Vision capabilities unavailable")
        
        return available
    
    async def analyze_image(self, 
                          image_data: str, 
                          image_type: str, 
                          user_message: str = "",
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
            else:
                raise ValueError(f"Unsupported provider: {provider}")
                
        except Exception as e:
            logger.error(f"❌ Error in universal image analysis: {e}")
            return await self._basic_image_analysis(image_data, image_type, user_message)
    
    def _select_best_provider(self) -> Optional[str]:
        """Select the best available provider for image analysis"""
        # Priority order: OpenAI (most reliable) -> Claude (good vision) -> Gemini (backup)
        priority_order = ['openai', 'anthropic', 'google']
        
        for provider in priority_order:
            if provider in self.available_providers:
                logger.info(f"🎯 Auto-selected provider: {provider}")
                return provider
        
        logger.warning("⚠️ No AI vision providers available")
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
            
            # Configure Gemini
            genai.configure(api_key=os.getenv('GOOGLE_API_KEY'))
            
            # Select model
            if not model:
                model = "gemini-pro-vision"
            
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
        """Create a comprehensive analysis prompt for any vision model"""
        base_prompt = f"""You are {model_name}, an advanced AI with computer vision capabilities. Analyze this image in detail.

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

Be thorough but concise. Focus on accuracy and helpful details."""

        return base_prompt
    
    async def _basic_image_analysis(self, image_data: str, image_type: str, user_message: str) -> Dict[str, Any]:
        """Fallback basic image analysis when no AI providers are available"""
        try:
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

