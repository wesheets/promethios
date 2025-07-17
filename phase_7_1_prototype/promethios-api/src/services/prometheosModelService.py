#!/usr/bin/env python3
"""
Promethios Model Inference Service
Handles loading and inference for the fine-tuned CodeLlama model
Now supports GPU instance integration for real governance capabilities
"""

import sys
import json
import os
import requests
from datetime import datetime

# GPU Instance Configuration
GPU_INSTANCE_URL = "http://114.236.8.93:8000"
GPU_INSTANCE_ENABLED = True

def check_gpu_instance():
    """Check if GPU instance is available"""
    try:
        response = requests.get(f"{GPU_INSTANCE_URL}/health", timeout=5)
        return response.status_code == 200
    except:
        return False

def generate_gpu_response(prompt):
    """Generate response using GPU instance"""
    try:
        payload = {
            "message": prompt,
            "conversation_history": [],
            "governance_level": "standard",
            "user_context": {}
        }
        
        response = requests.post(
            f"{GPU_INSTANCE_URL}/chat",
            json=payload,
            headers={"Content-Type": "application/json"},
            timeout=15
        )
        
        if response.status_code == 200:
            result = response.json()
            return {
                "response": result.get("response", ""),
                "governance_applied": result.get("governance_applied", False),
                "risk_score": result.get("risk_score", 0.0),
                "governance_reason": result.get("governance_reason", ""),
                "processing_time": result.get("processing_time", 0.0),
                "gpu_instance": True
            }
        else:
            print(f"GPU instance error: {response.status_code}", file=sys.stderr)
            return None
            
    except Exception as e:
        print(f"GPU instance connection error: {e}", file=sys.stderr)
        return None

def load_model():
    """Load the Promethios model (CodeLlama + LoRA adapters) or use GPU instance"""
    # First try GPU instance
    if GPU_INSTANCE_ENABLED and check_gpu_instance():
        print("Using GPU instance for inference", file=sys.stderr)
        return {"gpu_instance": True}
    
    # Fallback to local model loading
    try:
        model_path = os.path.join(os.path.dirname(__file__), '../../models/promethios/checkpoint-1000')
        config_path = os.path.join(model_path, 'adapter_config.json')
        model_file_path = os.path.join(model_path, 'adapter_model.safetensors')
        
        # Check if model files exist
        if not os.path.exists(config_path) or not os.path.exists(model_file_path):
            print(f"Model files not found at {model_path}", file=sys.stderr)
            return None
            
        # Try to load the actual model
        try:
            from transformers import AutoTokenizer, AutoModelForCausalLM
            from peft import PeftModel
            import torch
            
            print("Loading base model...", file=sys.stderr)
            base_model = AutoModelForCausalLM.from_pretrained(
                "codellama/CodeLlama-7b-Instruct-hf",
                torch_dtype=torch.float16,
                device_map="auto"
            )
            
            print("Loading tokenizer...", file=sys.stderr)
            tokenizer = AutoTokenizer.from_pretrained("codellama/CodeLlama-7b-Instruct-hf")
            
            print("Loading LoRA adapters...", file=sys.stderr)
            model = PeftModel.from_pretrained(base_model, model_path)
            
            print("Model loaded successfully!", file=sys.stderr)
            return {"model": model, "tokenizer": tokenizer, "gpu_instance": False}
            
        except ImportError as e:
            print(f"Required packages not installed: {e}", file=sys.stderr)
            return None
        except Exception as e:
            print(f"Error loading model: {e}", file=sys.stderr)
            return None
            
    except Exception as e:
        print(f"Error in load_model: {e}", file=sys.stderr)
        return None

def generate_response(prompt, model_data=None):
    """Generate a response using GPU instance, local model, or mock response"""
    try:
        # Try GPU instance first
        if GPU_INSTANCE_ENABLED and check_gpu_instance():
            gpu_result = generate_gpu_response(prompt)
            if gpu_result:
                return gpu_result["response"]
        
        # Fallback to local model
        if model_data and "model" in model_data:
            model = model_data["model"]
            tokenizer = model_data["tokenizer"]
            
            # Format prompt for CodeLlama
            formatted_prompt = f"[INST] {prompt} [/INST]"
            
            # Tokenize
            inputs = tokenizer(formatted_prompt, return_tensors="pt")
            
            # Generate
            with torch.no_grad():
                outputs = model.generate(
                    **inputs,
                    max_new_tokens=512,
                    temperature=0.7,
                    do_sample=True,
                    pad_token_id=tokenizer.eos_token_id
                )
            
            # Decode response
            response = tokenizer.decode(outputs[0], skip_special_tokens=True)
            
            # Extract just the response part
            if "[/INST]" in response:
                response = response.split("[/INST]")[-1].strip()
            
            return response
        
        # Final fallback to mock
        return generate_mock_response(prompt)
        
    except Exception as e:
        print(f"Error generating response: {e}", file=sys.stderr)
        return generate_mock_response(prompt)

def generate_mock_response(prompt):
    """Generate a mock Promethios response for testing"""
    responses = [
        "Hello! I'm Promethios AI Assistant, your governance-focused AI companion. I'm designed to help with compliance, risk assessment, and ethical decision-making. How can I assist you today?",
        
        "As Promethios AI Assistant, I specialize in governance and compliance matters. I can help you navigate regulatory requirements, assess risks, and ensure your decisions align with best practices.",
        
        "I'm Promethios AI Assistant, built specifically for governance and compliance tasks. I'm here to help you make informed, ethical decisions while maintaining regulatory compliance.",
        
        "Greetings! I'm Promethios AI Assistant, your dedicated governance AI. I focus on helping organizations maintain compliance, assess risks, and make ethical decisions. What governance challenge can I help you with?",
        
        "Hello! I'm Promethios AI Assistant, specialized in governance, compliance, and risk management. I'm designed to help you navigate complex regulatory landscapes and make sound decisions."
    ]
    
    # Simple hash-based selection for consistency
    import hashlib
    hash_val = int(hashlib.md5(prompt.encode()).hexdigest(), 16)
    selected_response = responses[hash_val % len(responses)]
    
    return selected_response

def main():
    """Main function to handle command line interface"""
    if len(sys.argv) < 2:
        print(json.dumps({"error": "No command provided"}))
        sys.exit(1)
    
    command = sys.argv[1]
    
    if command == "status":
        # Check GPU instance first
        gpu_available = check_gpu_instance()
        
        # Check local model status
        model_path = os.path.join(os.path.dirname(__file__), '../../models/promethios/checkpoint-1000')
        config_exists = os.path.exists(os.path.join(model_path, 'adapter_config.json'))
        model_exists = os.path.exists(os.path.join(model_path, 'adapter_model.safetensors'))
        
        status = {
            "model_name": "Promethios AI Assistant",
            "base_model": "codellama/CodeLlama-7b-Instruct-hf",
            "gpu_instance_available": gpu_available,
            "gpu_instance_url": GPU_INSTANCE_URL if gpu_available else None,
            "local_model_available": config_exists and model_exists,
            "status": "gpu_instance" if gpu_available else ("loaded" if (config_exists and model_exists) else "mock_mode"),
            "available": True,  # Always available (GPU, local, or mock)
            "mock_mode": not gpu_available and not (config_exists and model_exists),
            "timestamp": datetime.now().isoformat()
        }
        
        print(json.dumps(status))
        
    elif command == "generate":
        if len(sys.argv) < 3:
            print(json.dumps({"error": "No prompt provided"}))
            sys.exit(1)
            
        prompt = sys.argv[2]
        
        # Try to load model (GPU or local), fall back to mock if not available
        model_data = load_model()
        response = generate_response(prompt, model_data)
        
        result = {
            "response": response,
            "model": "Promethios AI Assistant",
            "gpu_instance": model_data and model_data.get("gpu_instance", False),
            "mock_mode": model_data is None,
            "timestamp": datetime.now().isoformat()
        }
        
        print(json.dumps(result))
        
    else:
        print(json.dumps({"error": f"Unknown command: {command}"}))
        sys.exit(1)

if __name__ == "__main__":
    main()

