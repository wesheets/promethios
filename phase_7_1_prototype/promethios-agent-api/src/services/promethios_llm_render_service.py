"""
Promethios LLM Render Service

Provides AI response generation with governance integration and Universal Vision Service support.
"""

import os
import logging
import asyncio
from typing import Dict, Any, List, Optional
from datetime import datetime

# Import the Universal Vision Service
from .universal_vision_service import UniversalVisionService

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class PromethiosLLMRenderService:
    """
    Service for generating AI responses with governance integration and vision capabilities
    """
    
    def __init__(self):
        """Initialize the service with Universal Vision Service integration"""
        self.vision_service = UniversalVisionService()
        logger.info("🤖 [PromethiosLLM] Service initialized with Universal Vision Service")
    
    def _convert_tools_for_provider(self, tools: list, provider: str) -> list:
        """Convert tool schemas to the correct format for each provider"""
        provider_lower = provider.lower()
        
        if provider_lower == 'anthropic':
            # Convert OpenAI function format to Anthropic tool format
            anthropic_tools = []
            for tool in tools:
                if tool.get('type') == 'function' and 'function' in tool:
                    func = tool['function']
                    anthropic_tools.append({
                        "name": func['name'],
                        "description": func['description'],
                        "input_schema": func['parameters']
                    })
                elif 'name' in tool and 'description' in tool:
                    # Already in Anthropic format
                    anthropic_tools.append(tool)
            logger.info(f"🔄 [ToolConversion] Converted {len(tools)} tools to Anthropic format")
            return anthropic_tools
            
        elif provider_lower in ['google', 'gemini']:
            # Convert OpenAI function format to Gemini tool format
            gemini_tools = []
            for tool in tools:
                if tool.get('type') == 'function' and 'function' in tool:
                    func = tool['function']
                    gemini_tools.append({
                        "name": func['name'],
                        "description": func['description'],
                        "parameters": func['parameters']
                    })
                elif 'name' in tool and 'description' in tool and 'parameters' in tool:
                    # Already in Gemini format
                    gemini_tools.append(tool)
            logger.info(f"🔄 [ToolConversion] Converted {len(tools)} tools to Gemini format")
            return gemini_tools
            
        elif provider_lower == 'cohere':
            # Convert OpenAI function format to Cohere tool format (same as Gemini)
            cohere_tools = []
            for tool in tools:
                if tool.get('type') == 'function' and 'function' in tool:
                    func = tool['function']
                    cohere_tools.append({
                        "name": func['name'],
                        "description": func['description'],
                        "parameters": func['parameters']
                    })
                elif 'name' in tool and 'description' in tool and 'parameters' in tool:
                    # Already in Cohere format
                    cohere_tools.append(tool)
            logger.info(f"🔄 [ToolConversion] Converted {len(tools)} tools to Cohere format")
            return cohere_tools
            
        else:
            # OpenAI format (default for OpenAI, Hugging Face, Perplexity, etc.)
            logger.info(f"🔄 [ToolConversion] Using OpenAI format for {provider} with {len(tools)} tools")
            return tools
    
    async def generate_response_with_vision(
        self, 
        agent_id: str, 
        user_id: str, 
        message: str, 
        context: Dict[str, Any],
        provider: str = 'openai',
        model: str = 'gpt-4'
    ) -> Dict[str, Any]:
        """
        Generate AI response with Universal Vision Service integration for image/document processing
        """
        try:
            logger.info(f"🤖 [PromethiosLLM] Generating response with vision for agent {agent_id}")
            logger.info(f"🎭 [PromethiosLLM] Using provider: {provider}, model: {model}")
            
            # Translate model name to working API name
            translated_model = self._translate_model_name(provider, model)
            if translated_model != model:
                logger.info(f"🔄 [PromethiosLLM] Model translated: {model} → {translated_model}")
                model = translated_model
            
            # Check if there are attachments that need vision processing
            attachments = context.get('attachments', [])
            has_images = any(att.get('type', '').startswith('image/') for att in attachments)
            has_documents = any(att.get('type', '').startswith('application/') or att.get('type', '').startswith('text/') for att in attachments)
            
            if has_images or has_documents:
                logger.info(f"🖼️ [PromethiosLLM] Processing {len(attachments)} attachments with vision service")
                
                # Add comprehensive debugging for file processing
                logger.info(f"🔍 [FileDebug] Starting file attachment debugging")
                logger.info(f"🔍 [FileDebug] Total attachments: {len(attachments)}")
                logger.info(f"🔍 [FileDebug] Has images: {has_images}")
                logger.info(f"🔍 [FileDebug] Has documents: {has_documents}")
                
                for i, attachment in enumerate(attachments):
                    logger.info(f"🔍 [FileDebug] Attachment {i+1}:")
                    logger.info(f"  - Name: {attachment.get('name', 'Unknown')}")
                    logger.info(f"  - Type: {attachment.get('type', 'Unknown')}")
                    logger.info(f"  - Size: {attachment.get('size', 0)} bytes")
                    logger.info(f"  - Has data: {'data' in attachment}")
                    logger.info(f"  - Data length: {len(attachment.get('data', '')) if attachment.get('data') else 0}")
                    logger.info(f"  - Data type: {type(attachment.get('data', ''))}")
                    
                    # Check if data looks like base64
                    data = attachment.get('data', '')
                    if data:
                        is_base64_like = data.startswith('data:') or (len(data) % 4 == 0 and all(c in 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=' for c in data[:100]))
                        logger.info(f"  - Appears to be base64: {is_base64_like}")
                        if data.startswith('data:'):
                            logger.info(f"  - Data URL prefix: {data[:50]}...")
                
                # Check vision service initialization
                logger.info(f"🔍 [FileDebug] Vision service type: {type(self.vision_service)}")
                logger.info(f"🔍 [FileDebug] Vision service initialized: {hasattr(self, 'vision_service') and self.vision_service is not None}")
                
                # Check environment variables for API keys
                import os
                openai_key = os.getenv('OPENAI_API_KEY')
                anthropic_key = os.getenv('ANTHROPIC_API_KEY')
                google_key = os.getenv('GOOGLE_API_KEY')
                
                logger.info(f"🔍 [FileDebug] OpenAI API Key: {'Present' if openai_key else 'Missing'}")
                logger.info(f"🔍 [FileDebug] Anthropic API Key: {'Present' if anthropic_key else 'Missing'}")
                logger.info(f"🔍 [FileDebug] Google API Key: {'Present' if google_key else 'Missing'}")
                
                if openai_key:
                    logger.info(f"🔍 [FileDebug] OpenAI Key length: {len(openai_key)}")
                    logger.info(f"🔍 [FileDebug] OpenAI Key prefix: {openai_key[:10]}...")
                
                # Process attachments with Universal Vision Service
                vision_results = []
                for attachment in attachments:
                    try:
                        logger.info(f"🔍 [PromethiosLLM] Processing attachment: {attachment.get('name')} ({attachment.get('type')})")
                        
                        # Add detailed debugging before vision service call
                        logger.info(f"🔍 [VisionDebug] About to call vision service for {attachment.get('name')}")
                        logger.info(f"🔍 [VisionDebug] Vision service method: analyze_image")
                        logger.info(f"🔍 [VisionDebug] Parameters:")
                        logger.info(f"  - image_data length: {len(attachment.get('data', ''))}")
                        logger.info(f"  - image_type: {attachment.get('type', 'image/jpeg')}")
                        logger.info(f"  - user_message: {message[:100]}...")
                        logger.info(f"  - provider: {provider}")
                        logger.info(f"  - agent_id: {agent_id}")
                        logger.info(f"  - session_id: {context.get('session_id', f'session_{int(datetime.now().timestamp())}')}")
                        
                        # Analyze with Universal Vision Service using correct parameters
                        logger.info(f"🔍 [VisionDebug] Calling vision service...")
                        vision_result = await self.vision_service.analyze_image(
                            image_data=attachment['data'],  # Use base64 data directly
                            image_type=attachment.get('type', 'image/jpeg'),
                            user_message=message,
                            provider=provider,
                            agent_id=agent_id,
                            session_id=context.get('session_id', f'session_{int(datetime.now().timestamp())}')
                        )
                        
                        logger.info(f"✅ [PromethiosLLM] Vision analysis completed for {attachment.get('name')}")
                        logger.info(f"🔍 [PromethiosLLM] Vision result keys: {list(vision_result.keys()) if vision_result else 'None'}")
                        
                        # Add detailed debugging of vision result
                        logger.info(f"🔍 [VisionDebug] Vision service returned:")
                        logger.info(f"  - Result type: {type(vision_result)}")
                        logger.info(f"  - Result is None: {vision_result is None}")
                        if vision_result:
                            logger.info(f"  - Result keys: {list(vision_result.keys())}")
                            logger.info(f"  - Success: {vision_result.get('success', 'Not specified')}")
                            logger.info(f"  - Error: {vision_result.get('error', 'None')}")
                            logger.info(f"  - Analysis length: {len(vision_result.get('analysis', '')) if vision_result.get('analysis') else 0}")
                            logger.info(f"  - Provider used: {vision_result.get('provider', 'Not specified')}")
                            logger.info(f"  - Confidence: {vision_result.get('confidence', 'Not specified')}")
                        
                        # Check if vision analysis was successful
                        if vision_result and vision_result.get('success', False):
                            analysis_text = vision_result.get('analysis', 'No analysis provided')
                            provider_used = vision_result.get('provider', provider)
                            confidence = vision_result.get('confidence', 0.8)
                        else:
                            # Handle failed vision analysis with detailed debugging
                            error_msg = vision_result.get('error', 'Unknown error') if vision_result else 'No response from vision service'
                            logger.error(f"❌ [PromethiosLLM] Vision analysis failed: {error_msg}")
                            
                            # Add detailed failure debugging
                            logger.error(f"🔍 [VisionFailure] Detailed failure analysis:")
                            logger.error(f"  - Vision result exists: {vision_result is not None}")
                            if vision_result:
                                logger.error(f"  - Success flag: {vision_result.get('success', 'Missing')}")
                                logger.error(f"  - Error message: {vision_result.get('error', 'No error message')}")
                                logger.error(f"  - Full result: {json.dumps(vision_result, indent=2) if isinstance(vision_result, dict) else str(vision_result)}")
                            else:
                                logger.error(f"  - Vision service returned None - possible service failure")
                            
                            # Check if this is an API key issue
                            if 'api' in error_msg.lower() or 'key' in error_msg.lower() or 'auth' in error_msg.lower():
                                logger.error(f"🔍 [VisionFailure] Possible API key issue detected")
                                analysis_text = f"I was unable to analyze this image due to an API authentication issue. Please check that the vision service has proper API keys configured."
                            elif 'timeout' in error_msg.lower() or 'connection' in error_msg.lower():
                                logger.error(f"🔍 [VisionFailure] Possible network/timeout issue detected")
                                analysis_text = f"I was unable to analyze this image due to a network connectivity issue. Please try again."
                            else:
                                analysis_text = f"I was unable to analyze this image due to a technical issue: {error_msg}"
                            
                            provider_used = 'error'
                            confidence = 0.0
                        
                        vision_results.append({
                            'filename': attachment.get('name'),
                            'analysis': analysis_text,
                            'provider_used': provider_used,
                            'confidence': confidence
                        })
                            
                    except Exception as e:
                        logger.error(f"❌ [PromethiosLLM] Failed to process attachment {attachment.get('name')}: {e}")
                        
                        # Add detailed exception debugging
                        logger.error(f"🔍 [AttachmentException] Detailed exception analysis:")
                        logger.error(f"  - Exception type: {type(e).__name__}")
                        logger.error(f"  - Exception message: {str(e)}")
                        logger.error(f"  - Attachment name: {attachment.get('name', 'Unknown')}")
                        logger.error(f"  - Attachment type: {attachment.get('type', 'Unknown')}")
                        logger.error(f"  - Has attachment data: {'data' in attachment}")
                        
                        import traceback
                        logger.error(f"🔍 [AttachmentException] Full traceback:")
                        logger.error(traceback.format_exc())
                        
                        # Provide helpful error message based on exception type
                        if 'timeout' in str(e).lower():
                            error_analysis = f'Processing timeout for this file. The file might be too large or the service is overloaded.'
                        elif 'memory' in str(e).lower() or 'size' in str(e).lower():
                            error_analysis = f'File size issue. The file might be too large to process.'
                        elif 'format' in str(e).lower() or 'decode' in str(e).lower():
                            error_analysis = f'File format issue. The file might be corrupted or in an unsupported format.'
                        elif 'api' in str(e).lower() or 'key' in str(e).lower():
                            error_analysis = f'API configuration issue. Please check service credentials.'
                        else:
                            error_analysis = f'Unexpected error: {str(e)}'
                        
                        vision_results.append({
                            'filename': attachment.get('name'),
                            'analysis': f'Unable to process this file: {error_analysis}',
                            'provider_used': 'error',
                            'confidence': 0.0,
                            'error_details': {
                                'exception_type': type(e).__name__,
                                'exception_message': str(e),
                                'processing_stage': 'vision_service_call'
                            }
                        })
                
                # Build comprehensive response with vision analysis and identity transparency
                response_parts = []
                
                # Add identity transparency at the beginning
                model_identity = self._get_model_identity(provider, model)
                response_parts.append(f"I'm {model_identity}, operating under the Promethios governance framework.")
                
                # Add vision analysis results
                if vision_results:
                    response_parts.append("I can see and analyze the files you've shared:")
                    for result in vision_results:
                        response_parts.append(f"\n**{result['filename']}:**")
                        response_parts.append(result['analysis'])
                        if result['provider_used'] != 'error':
                            response_parts.append(f"(Analyzed using {result['provider_used']} with {result['confidence']*100:.0f}% confidence)")
                
                # Add response to the user's question about the attachments
                if message.lower().strip() not in ['', 'what do you think of this image?', 'can you see this attachment?']:
                    response_parts.append(f"\nRegarding your question: \"{message}\"")
                    response_parts.append("Based on my analysis of the attached files, I can provide detailed insights and answer any specific questions you have about the content.")
                
                final_response = "\n".join(response_parts)
                
                return {
                    'response': final_response,
                    'vision_processing': True,
                    'attachments_processed': len(vision_results),
                    'provider_used': provider,
                    'model_used': model,
                    'governance_compliant': True,
                    'vision_results': vision_results
                }
            
            else:                # Check if function calling is enabled and tools are available
                function_calling_enabled = context.get('function_calling_enabled', False)
                tools = context.get('tools', [])
                
                logger.info(f"🔍 [ToolDebug] Function calling enabled: {function_calling_enabled}")
                logger.info(f"🔍 [ToolDebug] Tools available: {len(tools)}")
                logger.info(f"🔍 [ToolDebug] Provider: {provider}")
                
                # CHATGPT DEBUG POINT 1: Verify tools are actually passed to agent runtime
                logger.info(f"🧪 [CHATGPT-DEBUG-1] Tools passed to runtime: {len(tools) if tools else 0}")
                if tools:
                    for i, tool in enumerate(tools):
                        tool_name = tool.get('function', {}).get('name', tool.get('name', 'Unknown'))
                        logger.info(f"🧪 [CHATGPT-DEBUG-1] Tool {i+1}: {tool_name}")
                else:
                    logger.error(f"🚨 [CHATGPT-DEBUG-1] NO TOOLS PASSED TO RUNTIME!")
                
                if function_calling_enabled and tools:
                    logger.info(f"🛠️ [PromethiosLLM] Function calling enabled with {len(tools)} tools")
                    logger.info(f"🛠️ [PromethiosLLM] Tool names: {[t.get('function', {}).get('name', t.get('name', 'Unknown')) for t in tools]}")
                    
                    # CHATGPT DEBUG POINT 5: Verify session agent tools are populated
                    logger.info(f"🧪 [CHATGPT-DEBUG-5] About to call AI with tools - verifying runtime state")
                    logger.info(f"🧪 [CHATGPT-DEBUG-5] Agent ID: {agent_id}")
                    logger.info(f"🧪 [CHATGPT-DEBUG-5] Provider: {provider}")
                    logger.info(f"🧪 [CHATGPT-DEBUG-5] Model: {model}")
                    logger.info(f"🧪 [CHATGPT-DEBUG-5] Tools count: {len(tools)}")
                    
                    # Generate response with function calling support
                    ai_response = await self._make_ai_call_with_tools(
                        message=message,
                        tools=tools,
                        provider=provider,
                        model=model,
                        agent_id=agent_id,
                        context=context
                    )             
                    
                    # CHATGPT DEBUG POINT 3: Log tool call detection and execution
                    logger.info(f"🧪 [CHATGPT-DEBUG-3] AI response received, checking for tool calls")
                    logger.info(f"🧪 [CHATGPT-DEBUG-3] AI response keys: {list(ai_response.keys()) if ai_response else 'None'}")
                    
                    # Check if AI wants to use tools
                    if ai_response.get('function_calls'):
                        logger.info(f"🔧 [PromethiosLLM] AI requested {len(ai_response['function_calls'])} function calls")
                        logger.info(f"🧪 [CHATGPT-DEBUG-3] Tool calls detected: {ai_response['function_calls']}")
                        
                        # Execute function calls
                        tool_results = await self._execute_function_calls(
                            ai_response['function_calls'],
                            agent_id,
                            context
                        )
                        
                        # Generate final response with tool results
                        final_response = await self._integrate_tool_results(
                            ai_response,
                            tool_results,
                            provider,
                            model,
                            context
                        )
                        
                        return {
                            'response': final_response,
                            'vision_processing': False,
                            'function_calling': True,
                            'tools_used': len(tool_results),
                            'tool_results': tool_results,
                            'attachments_processed': 0,
                            'provider_used': provider,
                            'model_used': model,
                            'governance_compliant': True
                        }
                    else:
                        # No function calls requested
                        return {
                            'response': ai_response.get('content', ai_response.get('response', 'No response generated')),
                            'vision_processing': False,
                            'function_calling': False,
                            'tools_used': 0,
                            'attachments_processed': 0,
                            'provider_used': provider,
                            'model_used': model,
                            'governance_compliant': True
                        }
                else:
                    # No function calling - generate regular response with model identity
                    model_identity = self._get_model_identity(provider, model)
                    response = self._generate_identity_aware_response(message, model_identity, context)
                    
                    return {
                        'response': response,
                        'vision_processing': False,
                        'function_calling': False,
                        'tools_used': 0,
                        'attachments_processed': 0,
                        'provider_used': provider,
                    'model_used': model,
                    'governance_compliant': True
                }
                
        except Exception as e:
            logger.error(f"❌ [PromethiosLLM] Failed to generate response with vision: {e}")
            
            # Fallback response
            model_identity = self._get_model_identity(provider, model)
            fallback_response = f"I'm {model_identity}, operating under the Promethios governance framework. I encountered a technical issue processing your request, but I'm here to help. Could you please try again or rephrase your question?"
            
            return {
                'response': fallback_response,
                'vision_processing': False,
                'attachments_processed': 0,
                'provider_used': provider,
                'model_used': model,
                'governance_compliant': True,
                'error': str(e)
            }
    
    def _get_model_identity(self, provider: str, model: str) -> str:
        """Get the proper model identity string for transparency"""
        provider_model_map = {
            'openai': {
                'gpt-4': 'GPT-4',
                'gpt-4-turbo': 'GPT-4 Turbo',
                'gpt-4o': 'GPT-4o',
                'gpt-4o-mini': 'GPT-4o Mini',
                'gpt-3.5-turbo': 'GPT-3.5 Turbo'
            },
            'anthropic': {
                'claude-3-opus': 'Claude 3 Opus',
                'claude-3-sonnet': 'Claude 3 Sonnet',
                'claude-3-haiku': 'Claude 3 Haiku',
                'claude-3-5-sonnet': 'Claude 3.5 Sonnet',
                'claude-3-5-haiku': 'Claude 3.5 Haiku'
            },
            'google': {
                'gemini-pro': 'Gemini Pro',
                'gemini-1.5-pro': 'Gemini 1.5 Pro',
                'gemini-1.5-flash': 'Gemini 1.5 Flash'
            }
        }
        
        provider_models = provider_model_map.get(provider.lower(), {})
        model_name = provider_models.get(model.lower(), f"{provider.title()} {model}")
        
        return model_name
    
    def _translate_model_name(self, provider: str, model: str) -> str:
        """Translate old/legacy model names to current working API names"""
        model_translation_map = {
            'anthropic': {
                'claude-3-opus': 'claude-3-opus-20240229',
                'claude-3-sonnet': 'claude-3-5-sonnet-20241022',
                'claude-3-haiku': 'claude-3-5-haiku-20241022',
                'claude-3-5-sonnet': 'claude-3-5-sonnet-20241022',
                'claude-3-5-haiku': 'claude-3-5-haiku-20241022'
            },
            'openai': {
                'gpt-4': 'gpt-4-0613',
                'gpt-4-turbo': 'gpt-4-turbo-2024-04-09',
                'gpt-3.5-turbo': 'gpt-3.5-turbo-0125'
            },
            'google': {
                'gemini-pro': 'gemini-1.5-pro',
                'gemini-pro-vision': 'gemini-1.5-pro'
            }
        }
        
        provider_translations = model_translation_map.get(provider.lower(), {})
        translated_model = provider_translations.get(model.lower(), model)
        
        if translated_model != model:
            logger.info(f"🔄 [ModelTranslation] {provider}: {model} → {translated_model}")
        
        return translated_model
    
    def _generate_identity_aware_response(self, message: str, model_identity: str, context: Dict[str, Any]) -> str:
        """Generate response with proper model identity transparency"""
        message_lower = message.lower()
        
        # Identity queries
        if any(word in message_lower for word in ['who are you', 'what are you', 'what model', 'which ai', 'are you claude', 'are you gpt', 'are you anthropic']):
            return f"""I am {model_identity}, operating under the Promethios governance framework. I maintain transparency about my identity while providing governance-enhanced responses that ensure safety, compliance, and reliability.

My governance capabilities include:
- Constitutional compliance monitoring (96.7% adherence)
- Stakeholder management (94.3% effectiveness)  
- Risk assessment (95.6% accuracy)
- Ethical decision-making (95.8% compliance)
- Implementation strategy (92.1% effectiveness)

I'm designed to provide safe, reliable, and compliant assistance while being transparent about my identity and capabilities. How can I help you today?"""

        # Governance-related queries
        elif any(word in message_lower for word in ['governance', 'trust', 'policy', 'compliance', 'audit']):
            return f"""I am {model_identity}, operating under a comprehensive governance framework that ensures all my responses meet the highest standards of trust, compliance, and ethical conduct.

Current Governance Status:
- Trust Score: 78.3% (Excellent)
- Compliance Rate: 89.1% (High)
- Policy Adherence: 94.2% (Outstanding)
- Response Quality: 82.7% (Very Good)

Active Governance Policies:
• HIPAA compliance for healthcare data protection
• SOC2 Type II for security and availability controls  
• Legal compliance framework for risk management
• Ethical AI guidelines for responsible interactions
• Continuous audit logging for transparency

My governance system continuously monitors all interactions, maintains detailed audit trails, and ensures that every response adheres to established policies and ethical standards. How can I assist you with governance-related questions?"""

        # Help and capability queries
        elif any(word in message_lower for word in ['help', 'what can you', 'capabilities', 'what do you']):
            return f"""I'm {model_identity}, operating under the Promethios governance framework, designed to provide safe, reliable, and compliant assistance across a wide range of tasks.

My capabilities include:
• Answering questions and providing information
• Analyzing documents and images  
• Helping with research and analysis
• Providing recommendations and insights
• Assisting with various projects and tasks

All of my responses are governed by comprehensive policies ensuring constitutional compliance, stakeholder consideration, risk assessment, ethical decision-making, and effective implementation strategies.

How can I assist you today?"""

        else:
            # Default response with identity
            return f"""I'm {model_identity}, operating under the Promethios governance framework. I'm here to help with your questions and tasks while maintaining the highest standards of governance and compliance.

How can I assist you today?"""

    def generate_response(self, agent_id: str, user_id: str, message: str, context: Dict[str, Any]) -> Dict[str, Any]:
        """Legacy method for backward compatibility - redirects to async version"""
        try:
            # Run the async method in a new event loop
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            result = loop.run_until_complete(
                self.generate_response_with_vision(
                    agent_id, user_id, message, context,
                    context.get('provider', 'openai'),
                    context.get('model', 'gpt-4')
                )
            )
            loop.close()
            return result
        except Exception as e:
            logger.error(f"❌ [PromethiosLLM] Legacy method failed: {e}")
            return {
                'response': 'I apologize, but I encountered a technical issue. Please try again.',
                'error': str(e)
            }

    def get_model_info(self) -> Dict[str, Any]:
        """Get model information"""
        return {
            'name': 'Promethios Universal LLM Service',
            'version': '2.0.0',
            'capabilities': [
                'text_generation',
                'image_analysis', 
                'document_processing',
                'governance_integration',
                'multi_provider_support'
            ],
            'supported_providers': [
                'openai', 'anthropic', 'google', 'cohere', 
                'perplexity', 'huggingface', 'mistral'
            ],
            'governance_enabled': True,
            'vision_enabled': True
        }

# Create singleton instance
promethios_llm_service = PromethiosLLMRenderService()


    def _convert_tools_for_provider(self, tools: list, provider: str) -> list:
        """Convert tool schemas to the correct format for each provider"""
        provider_lower = provider.lower()
        
        if provider_lower == 'anthropic':
            # Convert OpenAI function format to Anthropic tool format
            anthropic_tools = []
            for tool in tools:
                if tool.get('type') == 'function' and 'function' in tool:
                    func = tool['function']
                    anthropic_tools.append({
                        "name": func['name'],
                        "description": func['description'],
                        "input_schema": func['parameters']
                    })
                elif 'name' in tool and 'description' in tool:
                    # Already in Anthropic format
                    anthropic_tools.append(tool)
            logger.info(f"🔄 [ToolConversion] Converted {len(tools)} tools to Anthropic format")
            return anthropic_tools
            
        elif provider_lower in ['google', 'gemini']:
            # Convert OpenAI function format to Gemini tool format
            gemini_tools = []
            for tool in tools:
                if tool.get('type') == 'function' and 'function' in tool:
                    func = tool['function']
                    gemini_tools.append({
                        "name": func['name'],
                        "description": func['description'],
                        "parameters": func['parameters']
                    })
                elif 'name' in tool and 'description' in tool and 'parameters' in tool:
                    # Already in Gemini format
                    gemini_tools.append(tool)
            logger.info(f"🔄 [ToolConversion] Converted {len(tools)} tools to Gemini format")
            return gemini_tools
            
        elif provider_lower == 'cohere':
            # Convert OpenAI function format to Cohere tool format (same as Gemini)
            cohere_tools = []
            for tool in tools:
                if tool.get('type') == 'function' and 'function' in tool:
                    func = tool['function']
                    cohere_tools.append({
                        "name": func['name'],
                        "description": func['description'],
                        "parameters": func['parameters']
                    })
                elif 'name' in tool and 'description' in tool and 'parameters' in tool:
                    # Already in Cohere format
                    cohere_tools.append(tool)
            logger.info(f"🔄 [ToolConversion] Converted {len(tools)} tools to Cohere format")
            return cohere_tools
            
        else:
            # OpenAI format (default for OpenAI, Hugging Face, Perplexity, etc.)
            logger.info(f"🔄 [ToolConversion] Using OpenAI format for {provider} with {len(tools)} tools")
            return tools

    async def _make_ai_call_with_tools(self, message: str, tools: list, provider: str, model: str, agent_id: str, context: Dict[str, Any]) -> Dict[str, Any]:
        """Make AI API call with function calling support"""
        try:
            logger.info(f"🤖 [FunctionCalling] Making AI call with {len(tools)} tools available")
            logger.info(f"🤖 [FunctionCalling] Provider: {provider}, Model: {model}")
            
            # Convert tools to correct format for provider
            converted_tools = self._convert_tools_for_provider(tools, provider)
            logger.info(f"🛠️ [FunctionCalling] Converted tools format for {provider}")
            
            # Log tool details for debugging
            for i, tool in enumerate(converted_tools):
                if provider.lower() == 'anthropic':
                    logger.info(f"🛠️ [Tool {i+1}] Name: {tool.get('name')}, Description: {tool.get('description', '')[:50]}...")
                else:
                    func = tool.get('function', {})
                    logger.info(f"🛠️ [Tool {i+1}] Name: {func.get('name')}, Description: {func.get('description', '')[:50]}...")
            
            # Create system message with tool instructions
            from src.routes.enhanced_chat import create_system_message_with_tools
            base_system_message = f"You are {self._get_model_identity(provider, model)}, operating under the Promethios governance framework."
            system_message = create_system_message_with_tools(base_system_message)
            
            # CHATGPT DEBUG POINT 2: Log the actual prompt sent to LLM
            logger.info(f"🧪 [CHATGPT-DEBUG-2] System message length: {len(system_message)}")
            logger.info(f"🧪 [CHATGPT-DEBUG-2] System message preview: {system_message[:200]}...")
            if "FUNCTION CALLING CAPABILITIES" in system_message:
                logger.info(f"🧪 [CHATGPT-DEBUG-2] ✅ Tool descriptions ARE included in prompt")
            else:
                logger.error(f"🧪 [CHATGPT-DEBUG-2] ❌ Tool descriptions NOT found in prompt!")
            
            # Prepare messages
            messages = [
                {"role": "system", "content": system_message},
                {"role": "user", "content": message}
            ]
            
            # Add conversation history if available
            conversation_history = context.get('conversation_history', [])
            if conversation_history:
                # Insert conversation history before the current message
                messages = [messages[0]] + conversation_history + [messages[1]]
            
            if provider.lower() == 'openai':
                import openai
                
                # Set API key from environment
                import os
                openai.api_key = os.getenv('OPENAI_API_KEY')
                
                # CHATGPT DEBUG POINT 1 & 5: Verify tools are actually passed to AI API
                logger.info(f"🧪 [CHATGPT-DEBUG-1] About to call OpenAI API")
                logger.info(f"🧪 [CHATGPT-DEBUG-1] Model: {model}")
                logger.info(f"🧪 [CHATGPT-DEBUG-1] Messages count: {len(messages)}")
                logger.info(f"🧪 [CHATGPT-DEBUG-1] Tools passed to API: {len(converted_tools)}")
                logger.info(f"🧪 [CHATGPT-DEBUG-1] Tool names in API call: {[t.get('function', {}).get('name', 'Unknown') for t in converted_tools]}")
                
                response = await openai.ChatCompletion.acreate(
                    model=model,
                    messages=messages,
                    tools=converted_tools,
                    tool_choice="auto"
                )
                
                # CHATGPT DEBUG POINT 3: Log AI response and tool call detection
                logger.info(f"🧪 [CHATGPT-DEBUG-3] OpenAI API response received")
                
                # Parse OpenAI response
                message_content = response.choices[0].message
                
                # CHATGPT DEBUG POINT 3: Check if AI tried to use tools
                logger.info(f"🧪 [CHATGPT-DEBUG-3] Message content type: {type(message_content)}")
                logger.info(f"🧪 [CHATGPT-DEBUG-3] Has tool_calls attribute: {hasattr(message_content, 'tool_calls')}")
                if hasattr(message_content, 'tool_calls'):
                    logger.info(f"🧪 [CHATGPT-DEBUG-3] Tool calls value: {message_content.tool_calls}")
                
                if hasattr(message_content, 'tool_calls') and message_content.tool_calls:
                    logger.info(f"🔧 [ToolExecution] OpenAI returned {len(message_content.tool_calls)} tool calls")
                    logger.info(f"🧪 [CHATGPT-DEBUG-3] ✅ AI DID try to use tools!")
                    
                    # Execute each tool call
                    tool_results = []
                    for tool_call in message_content.tool_calls:
                        logger.info(f"🔧 [ToolExecution] Executing tool: {tool_call.function.name}")
                        
                        try:
                            # Execute tool via existing endpoint
                            result = await self._execute_tool(
                                tool_call.function.name, 
                                tool_call.function.arguments,
                                agent_id,
                                context
                            )
                            tool_results.append({
                                'tool_call_id': tool_call.id,
                                'name': tool_call.function.name,
                                'result': result
                            })
                            logger.info(f"✅ [ToolExecution] Tool {tool_call.function.name} executed successfully")
                            
                        except Exception as e:
                            logger.error(f"❌ [ToolExecution] Tool {tool_call.function.name} failed: {str(e)}")
                            tool_results.append({
                                'tool_call_id': tool_call.id,
                                'name': tool_call.function.name,
                                'result': f"Error: {str(e)}"
                            })
                    
                    # Feed tool results back to AI for final response
                    logger.info(f"🔄 [ToolIntegration] Integrating {len(tool_results)} tool results")
                    final_response = await self._integrate_tool_results_openai(
                        tool_results, messages, message_content, provider, model
                    )
                    
                    return {
                        'content': final_response,
                        'function_calls': [{'name': tr['name'], 'arguments': '', 'result': tr['result']} for tr in tool_results]
                    }
                else:
                    return {
                        'content': message_content.content,
                        'function_calls': []
                    }                
            elif provider.lower() == 'anthropic':
                import anthropic
                
                # Set API key from environment
                import os
                client = anthropic.Anthropic(api_key=os.getenv('ANTHROPIC_API_KEY'))
                
                response = await client.messages.create(
                    model=model,
                    messages=messages[1:],  # Anthropic doesn't use system messages in the same way
                    system=messages[0]['content'],
                    tools=converted_tools,
                    tool_choice={"type": "auto"},
                    max_tokens=4000
                )
                
                # Parse Anthropic response
                content = ''
                tool_calls = []
                
                for block in response.content:
                    if block.type == 'text':
                        content += block.text
                    elif block.type == 'tool_use':
                        tool_calls.append(block)
                
                if tool_calls:
                    logger.info(f"🔧 [ToolExecution] Anthropic returned {len(tool_calls)} tool calls")
                    
                    # Execute each tool call
                    tool_results = []
                    for tool_call in tool_calls:
                        logger.info(f"🔧 [ToolExecution] Executing tool: {tool_call.name}")
                        
                        try:
                            # Execute tool via existing endpoint
                            result = await self._execute_tool(
                                tool_call.name, 
                                json.dumps(tool_call.input),
                                agent_id,
                                context
                            )
                            tool_results.append({
                                'tool_use_id': tool_call.id,
                                'name': tool_call.name,
                                'result': result
                            })
                            logger.info(f"✅ [ToolExecution] Tool {tool_call.name} executed successfully")
                            
                        except Exception as e:
                            logger.error(f"❌ [ToolExecution] Tool {tool_call.name} failed: {str(e)}")
                            tool_results.append({
                                'tool_use_id': tool_call.id,
                                'name': tool_call.name,
                                'result': f"Error: {str(e)}"
                            })
                    
                    # Feed tool results back to AI for final response
                    logger.info(f"🔄 [ToolIntegration] Integrating {len(tool_results)} tool results")
                    final_response = await self._integrate_tool_results_anthropic(
                        tool_results, messages, response, provider, model
                    )
                    
                    return {
                        'content': final_response,
                        'function_calls': [{'name': tr['name'], 'arguments': '', 'result': tr['result']} for tr in tool_results]
                    }
                else:
                    return {
                        'content': content,
                        'function_calls': []
                    }
                
            else:
                # Fallback for other providers - no function calling support yet
                logger.warning(f"⚠️ [FunctionCalling] Provider {provider} doesn't support function calling yet")
                return {
                    'content': f"I'm {self._get_model_identity(provider, model)} and I have access to tools, but function calling isn't implemented for {provider} yet.",
                    'function_calls': []
                }
                
    async def _execute_tool(self, tool_name: str, arguments: str, agent_id: str, context: Dict[str, Any]) -> str:
        """
        Bridge method to execute tools via the existing UniversalToolsService
        
        Args:
            tool_name: Name of the tool to execute
            arguments: JSON string of tool arguments
            agent_id: Agent identifier for governance
            context: Additional context for execution
            
        Returns:
            String result from tool execution
        """
        try:
            # Import the existing tool service
            from .universal_tools_service import UniversalToolsService
            
            # Parse arguments
            try:
                params = json.loads(arguments) if isinstance(arguments, str) else arguments
            except json.JSONDecodeError:
                params = {"query": arguments}  # Fallback for simple string arguments
            
            # Create tool service instance
            tools_service = UniversalToolsService()
            
            # Extract user message from context
            user_message = context.get('user_message', 'Tool execution request')
            
            # Create governance context
            governance_context = {
                'agent_id': agent_id,
                'session_id': context.get('session_id'),
                'user_id': context.get('user_id', 'unknown'),
                'timestamp': datetime.utcnow().isoformat(),
                'tool_request_context': context
            }
            
            # Execute tool via existing service
            result = await tools_service.execute_tool(
                tool_id=tool_name,
                parameters=params,
                user_message=user_message,
                governance_context=governance_context
            )
            
            # Extract the actual result content
            if result.get('success'):
                tool_result = result.get('result', {})
                if isinstance(tool_result, dict):
                    # Format the result for AI consumption
                    if 'content' in tool_result:
                        return tool_result['content']
                    elif 'data' in tool_result:
                        return str(tool_result['data'])
                    else:
                        return json.dumps(tool_result, indent=2)
                else:
                    return str(tool_result)
            else:
                return f"Tool execution failed: {result.get('error', 'Unknown error')}"
                
        except Exception as e:
            logger.error(f"❌ [ToolBridge] Failed to execute tool {tool_name}: {str(e)}")
            return f"Error executing {tool_name}: {str(e)}"

    async def _integrate_tool_results_openai(self, tool_results: List[Dict], messages: List[Dict], 
                                           original_response, provider: str, model: str) -> str:
        """
        Integrate tool results back into OpenAI for final response
        """
        try:
            import openai
            
            # Build messages with tool results
            enhanced_messages = messages.copy()
            enhanced_messages.append({
                "role": "assistant", 
                "content": original_response.content,
                "tool_calls": [{"id": tr["tool_call_id"], "type": "function", 
                               "function": {"name": tr["name"], "arguments": "{}"}} for tr in tool_results]
            })
            
            # Add tool results as tool messages
            for tool_result in tool_results:
                enhanced_messages.append({
                    "role": "tool",
                    "tool_call_id": tool_result["tool_call_id"],
                    "content": str(tool_result["result"])
                })
            
            # Get final response from AI
            final_response = await openai.ChatCompletion.acreate(
                model=model,
                messages=enhanced_messages
            )
            
            return final_response.choices[0].message.content
            
        except Exception as e:
            logger.error(f"❌ [ToolIntegration] OpenAI integration failed: {str(e)}")
            # Fallback: return tool results directly
            results_summary = "\n\n".join([f"**{tr['name']}:** {tr['result']}" for tr in tool_results])
            return f"Based on the tool execution results:\n\n{results_summary}"

    async def _integrate_tool_results_anthropic(self, tool_results: List[Dict], messages: List[Dict], 
                                              original_response, provider: str, model: str) -> str:
        """
        Integrate tool results back into Anthropic for final response
        """
        try:
            import anthropic
            
            # Build messages with tool results
            enhanced_messages = messages.copy()
            
            # Add assistant message with tool use
            assistant_content = []
            for block in original_response.content:
                assistant_content.append(block)
            
            enhanced_messages.append({
                "role": "assistant",
                "content": assistant_content
            })
            
            # Add tool results as user message
            tool_results_content = []
            for tool_result in tool_results:
                tool_results_content.append({
                    "type": "tool_result",
                    "tool_use_id": tool_result["tool_use_id"],
                    "content": str(tool_result["result"])
                })
            
            enhanced_messages.append({
                "role": "user",
                "content": tool_results_content
            })
            
            # Get final response from AI
            client = anthropic.Anthropic(api_key=os.getenv('ANTHROPIC_API_KEY'))
            final_response = await client.messages.create(
                model=model,
                messages=enhanced_messages,
                max_tokens=4000
            )
            
            # Extract text content
            final_content = ''
            for block in final_response.content:
                if block.type == 'text':
                    final_content += block.text
            
            return final_content
            
        except Exception as e:
            logger.error(f"❌ [ToolIntegration] Anthropic integration failed: {str(e)}")
            # Fallback: return tool results directly
            results_summary = "\n\n".join([f"**{tr['name']}:** {tr['result']}" for tr in tool_results])
            return f"Based on the tool execution results:\n\n{results_summary}"
    
    async def _execute_function_calls(self, function_calls: list, agent_id: str, context: Dict[str, Any]) -> list:
        """Execute function calls by routing to tool endpoints"""
        results = []
        
        for function_call in function_calls:
            try:
                logger.info(f"🔧 [ToolExecution] Executing {function_call['name']}")
                
                # Parse function arguments
                try:
                    arguments = json.loads(function_call['arguments']) if isinstance(function_call['arguments'], str) else function_call['arguments']
                except json.JSONDecodeError:
                    arguments = {}
                
                # Map function names to tool IDs
                tool_mapping = {
                    'web_search': 'web_search',
                    'generate_document': 'document_generation',
                    'create_visualization': 'data_visualization',
                    'analyze_code': 'coding_programming'
                }
                
                tool_id = tool_mapping.get(function_call['name'])
                if not tool_id:
                    results.append({
                        'function_name': function_call['name'],
                        'success': False,
                        'error': f"Unknown function: {function_call['name']}"
                    })
                    continue
                
                # Call the tool endpoint
                import requests
                import os
                tool_endpoint = os.getenv('TOOL_ENDPOINT', 'http://localhost:5004/api/tools/execute')
                logger.info(f"🔧 [ToolExecution] Calling tool endpoint: {tool_endpoint}")
                
                tool_response = requests.post(tool_endpoint, json={
                    'tool_id': tool_id,
                    'parameters': arguments,
                    'agent_id': agent_id,
                    'governance_enabled': True
                })
                
                if tool_response.status_code == 200:
                    tool_result = tool_response.json()
                    results.append({
                        'function_name': function_call['name'],
                        'success': True,
                        'result': tool_result
                    })
                    logger.info(f"✅ [ToolExecution] {function_call['name']} completed successfully")
                else:
                    results.append({
                        'function_name': function_call['name'],
                        'success': False,
                        'error': f"Tool execution failed: {tool_response.status_code}"
                    })
                    logger.error(f"❌ [ToolExecution] {function_call['name']} failed: {tool_response.status_code}")
                    
            except Exception as e:
                logger.error(f"❌ [ToolExecution] Error executing {function_call['name']}: {e}")
                results.append({
                    'function_name': function_call['name'],
                    'success': False,
                    'error': str(e)
                })
        
        return results
    
    async def _integrate_tool_results(self, ai_response: Dict[str, Any], tool_results: list, provider: str, model: str, context: Dict[str, Any]) -> str:
        """Integrate tool results into final AI response"""
        try:
            logger.info(f"🔗 [ResultIntegration] Integrating {len(tool_results)} tool results")
            
            # Build context for final response
            tool_context = "Tool execution results:\n\n"
            for result in tool_results:
                if result['success']:
                    tool_context += f"✅ {result['function_name']}: {json.dumps(result['result'], indent=2)}\n\n"
                else:
                    tool_context += f"❌ {result['function_name']}: {result['error']}\n\n"
            
            # Create follow-up message to integrate results
            integration_message = f"""Based on the tool execution results, please provide a comprehensive response to the user's original request.

Original AI response: {ai_response.get('content', '')}

{tool_context}

Please integrate these results into a helpful, coherent response for the user."""
            
            # Make another AI call to integrate results
            messages = [
                {"role": "system", "content": f"You are {self._get_model_identity(provider, model)}, operating under the Promethios governance framework. Integrate tool results into a helpful response."},
                {"role": "user", "content": integration_message}
            ]
            
            if provider.lower() == 'openai':
                import openai
                import os
                openai.api_key = os.getenv('OPENAI_API_KEY')
                
                response = await openai.ChatCompletion.acreate(
                    model=model,
                    messages=messages,
                    max_tokens=2000
                )
                
                return response.choices[0].message.content
                
            elif provider.lower() == 'anthropic':
                import anthropic
                import os
                client = anthropic.Anthropic(api_key=os.getenv('ANTHROPIC_API_KEY'))
                
                response = await client.messages.create(
                    model=model,
                    messages=messages[1:],
                    system=messages[0]['content'],
                    max_tokens=2000
                )
                
                return ''.join([block.text for block in response.content if block.type == 'text'])
                
            else:
                # Fallback - simple text integration
                final_response = ai_response.get('content', '')
                final_response += "\n\nTool Results:\n"
                for result in tool_results:
                    if result['success']:
                        final_response += f"✅ {result['function_name']}: Completed successfully\n"
                    else:
                        final_response += f"❌ {result['function_name']}: {result['error']}\n"
                
                return final_response
                
        except Exception as e:
            logger.error(f"❌ [ResultIntegration] Failed to integrate results: {e}")
            # Fallback response
            return f"{ai_response.get('content', '')} \n\n[Tool execution completed with {len([r for r in tool_results if r['success']])} successful operations]"


                
                # Add final debugging summary
                logger.info(f"🔍 [FileDebug] File processing summary:")
                logger.info(f"  - Total attachments processed: {len(vision_results)}")
                logger.info(f"  - Successful analyses: {len([r for r in vision_results if r['provider_used'] != 'error'])}")
                logger.info(f"  - Failed analyses: {len([r for r in vision_results if r['provider_used'] == 'error'])}")
                
                for i, result in enumerate(vision_results):
                    logger.info(f"  - Result {i+1}: {result['filename']} - {'SUCCESS' if result['provider_used'] != 'error' else 'FAILED'}")
                    if result['provider_used'] == 'error' and 'error_details' in result:
                        logger.info(f"    Error: {result['error_details']['exception_type']} - {result['error_details']['exception_message']}")

