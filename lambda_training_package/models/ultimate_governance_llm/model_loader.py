"""
Ultimate Governance LLM Model Loader
Extension module for loading and managing the Ultimate Governance LLM
"""

import json
import os
import torch
from typing import Optional, Dict, Any, List
from pathlib import Path
import logging
from transformers import (
    AutoTokenizer, 
    AutoModelForCausalLM,
    BitsAndBytesConfig,
    TrainingArguments
)
from peft import PeftModel, PeftConfig, get_peft_model, LoraConfig

logger = logging.getLogger(__name__)

class UltimateGovernanceLLMLoader:
    """
    Loader class for the Ultimate Governance LLM extension module
    Handles model loading, configuration, and inference setup
    """
    
    def __init__(self, model_path: str, config_path: Optional[str] = None):
        """
        Initialize the Ultimate Governance LLM loader
        
        Args:
            model_path: Path to the trained model directory
            config_path: Optional path to model configuration file
        """
        self.model_path = Path(model_path)
        self.config_path = config_path or self.model_path / "model_config.json"
        self.config = self._load_config()
        self.model = None
        self.tokenizer = None
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        
    def _load_config(self) -> Dict[str, Any]:
        """Load model configuration from JSON file"""
        try:
            with open(self.config_path, 'r') as f:
                config = json.load(f)
            logger.info(f"Loaded configuration for {config['model_name']} v{config['version']}")
            return config
        except Exception as e:
            logger.error(f"Failed to load configuration: {e}")
            raise
    
    def load_model(self, force_reload: bool = False) -> tuple:
        """
        Load the Ultimate Governance LLM model and tokenizer
        
        Args:
            force_reload: Force reload even if model is already loaded
            
        Returns:
            Tuple of (model, tokenizer)
        """
        if self.model is not None and self.tokenizer is not None and not force_reload:
            return self.model, self.tokenizer
            
        try:
            logger.info("Loading Ultimate Governance LLM...")
            
            # Load tokenizer
            self.tokenizer = self._load_tokenizer()
            
            # Load base model with optimizations
            base_model = self._load_base_model()
            
            # Load LoRA adapters if available
            self.model = self._load_lora_adapters(base_model)
            
            # Setup for inference
            self.model.eval()
            
            logger.info("Ultimate Governance LLM loaded successfully")
            return self.model, self.tokenizer
            
        except Exception as e:
            logger.error(f"Failed to load model: {e}")
            raise
    
    def _load_tokenizer(self) -> AutoTokenizer:
        """Load and configure tokenizer with governance tokens"""
        base_model_name = self.config["base_model"]
        
        # Check for local tokenizer files
        local_tokenizer_path = self.model_path / "tokenizer.json"
        if local_tokenizer_path.exists():
            tokenizer = AutoTokenizer.from_pretrained(str(self.model_path))
        else:
            tokenizer = AutoTokenizer.from_pretrained(base_model_name)
        
        # Add governance tokens
        governance_tokens = self.config.get("governance_tokens", [])
        if governance_tokens:
            tokenizer.add_tokens(governance_tokens)
            logger.info(f"Added {len(governance_tokens)} governance tokens")
        
        # Set padding token
        if tokenizer.pad_token is None:
            tokenizer.pad_token = tokenizer.eos_token
            
        return tokenizer
    
    def _load_base_model(self) -> AutoModelForCausalLM:
        """Load base model with memory optimizations"""
        base_model_name = self.config["base_model"]
        loading_config = self.config.get("loading_config", {})
        
        # Configure quantization if enabled
        quantization_config = None
        if loading_config.get("load_in_8bit", False):
            quantization_config = BitsAndBytesConfig(
                load_in_8bit=True,
                llm_int8_threshold=6.0,
                llm_int8_has_fp16_weight=False,
            )
        
        # Load model
        model = AutoModelForCausalLM.from_pretrained(
            base_model_name,
            quantization_config=quantization_config,
            device_map=loading_config.get("device_map", "auto"),
            torch_dtype=getattr(torch, loading_config.get("torch_dtype", "float16")),
            trust_remote_code=loading_config.get("trust_remote_code", False),
            use_cache=loading_config.get("use_cache", True)
        )
        
        # Resize token embeddings for governance tokens
        governance_tokens = self.config.get("governance_tokens", [])
        if governance_tokens:
            model.resize_token_embeddings(len(self.tokenizer))
        
        return model
    
    def _load_lora_adapters(self, base_model: AutoModelForCausalLM) -> AutoModelForCausalLM:
        """Load LoRA adapters if available"""
        adapter_config_path = self.model_path / "adapter_config.json"
        adapter_model_path = self.model_path / "adapter_model.safetensors"
        
        if adapter_config_path.exists() and adapter_model_path.exists():
            logger.info("Loading LoRA adapters...")
            try:
                # Load PEFT model with adapters
                model = PeftModel.from_pretrained(base_model, str(self.model_path))
                logger.info("LoRA adapters loaded successfully")
                return model
            except Exception as e:
                logger.warning(f"Failed to load LoRA adapters: {e}")
                logger.info("Continuing with base model only")
                return base_model
        else:
            logger.info("No LoRA adapters found, using base model")
            return base_model
    
    def generate_response(self, 
                         prompt: str, 
                         max_length: int = 1024,
                         temperature: float = 0.7,
                         top_p: float = 0.9,
                         do_sample: bool = True,
                         governance_domain: Optional[str] = None) -> str:
        """
        Generate governance response using the loaded model
        
        Args:
            prompt: Input prompt for governance analysis
            max_length: Maximum response length
            temperature: Sampling temperature
            top_p: Top-p sampling parameter
            do_sample: Whether to use sampling
            governance_domain: Specific governance domain to focus on
            
        Returns:
            Generated governance response
        """
        if self.model is None or self.tokenizer is None:
            raise RuntimeError("Model not loaded. Call load_model() first.")
        
        # Add governance domain token if specified
        if governance_domain:
            domain_token = f"<{governance_domain.upper()}>"
            if domain_token in self.config.get("governance_tokens", []):
                prompt = f"{domain_token} {prompt}"
        
        # Tokenize input
        inputs = self.tokenizer(
            prompt,
            return_tensors="pt",
            truncation=True,
            max_length=max_length // 2,  # Leave room for generation
            padding=True
        ).to(self.device)
        
        # Generate response
        with torch.no_grad():
            outputs = self.model.generate(
                **inputs,
                max_length=max_length,
                temperature=temperature,
                top_p=top_p,
                do_sample=do_sample,
                pad_token_id=self.tokenizer.eos_token_id,
                eos_token_id=self.tokenizer.eos_token_id,
                repetition_penalty=1.1
            )
        
        # Decode response
        response = self.tokenizer.decode(
            outputs[0][inputs['input_ids'].shape[1]:],
            skip_special_tokens=True
        ).strip()
        
        return response
    
    def get_model_info(self) -> Dict[str, Any]:
        """Get comprehensive model information"""
        return {
            "model_name": self.config["model_name"],
            "version": self.config["version"],
            "description": self.config["description"],
            "capabilities": self.config.get("capabilities", {}),
            "performance_score": self.config.get("training_info", {}).get("performance_score"),
            "memory_requirements": self.config.get("deployment", {}).get("memory_requirements"),
            "governance_layers": self.config.get("architecture", {}).get("layers", []),
            "loaded": self.model is not None and self.tokenizer is not None
        }
    
    def unload_model(self):
        """Unload model to free memory"""
        if self.model is not None:
            del self.model
            self.model = None
        if self.tokenizer is not None:
            del self.tokenizer
            self.tokenizer = None
        torch.cuda.empty_cache()
        logger.info("Model unloaded and memory cleared")

# Extension factory function
def create_ultimate_governance_llm(model_path: str, **kwargs) -> UltimateGovernanceLLMLoader:
    """
    Factory function to create Ultimate Governance LLM instance
    
    Args:
        model_path: Path to the trained model
        **kwargs: Additional configuration options
        
    Returns:
        Configured UltimateGovernanceLLMLoader instance
    """
    return UltimateGovernanceLLMLoader(model_path, **kwargs)

# Extension metadata
EXTENSION_INFO = {
    "name": "ultimate_governance_llm",
    "version": "1.0.0",
    "type": "governance_ai_model",
    "description": "Ultimate Governance LLM - Multi-domain governance reasoning engine",
    "author": "Promethios Team",
    "loader_class": UltimateGovernanceLLMLoader,
    "factory_function": create_ultimate_governance_llm,
    "required_dependencies": [
        "transformers>=4.30.0",
        "torch>=2.0.0", 
        "peft>=0.4.0",
        "bitsandbytes>=0.39.0"
    ]
}

