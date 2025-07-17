#!/usr/bin/env python3
"""
Promethios Model Inference Service
Loads and runs the fine-tuned CodeLlama model for Promethios AI responses
"""

import os
import sys
import json
import torch
from transformers import AutoTokenizer, AutoModelForCausalLM
from peft import PeftModel
import argparse
from datetime import datetime

class PrometheosModelService:
    def __init__(self, model_path=None):
        """Initialize the Promethios model service"""
        self.model_path = model_path or os.path.join(os.path.dirname(__file__), '../../models/promethios/checkpoint-1000')
        self.base_model_name = "codellama/CodeLlama-7b-Instruct-hf"
        self.tokenizer = None
        self.model = None
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        
        print(f"🤖 Initializing Promethios Model Service")
        print(f"📁 Model path: {self.model_path}")
        print(f"💻 Device: {self.device}")
        
    def load_model(self):
        """Load the base model and LoRA adapters"""
        try:
            print(f"🔄 Loading base model: {self.base_model_name}")
            
            # Load tokenizer
            self.tokenizer = AutoTokenizer.from_pretrained(
                self.base_model_name,
                trust_remote_code=True,
                padding_side="left"
            )
            
            # Add pad token if it doesn't exist
            if self.tokenizer.pad_token is None:
                self.tokenizer.pad_token = self.tokenizer.eos_token
            
            # Load base model
            self.model = AutoModelForCausalLM.from_pretrained(
                self.base_model_name,
                torch_dtype=torch.float16 if self.device == "cuda" else torch.float32,
                device_map="auto" if self.device == "cuda" else None,
                trust_remote_code=True,
                low_cpu_mem_usage=True
            )
            
            # Load LoRA adapters
            print(f"🔧 Loading LoRA adapters from: {self.model_path}")
            self.model = PeftModel.from_pretrained(
                self.model,
                self.model_path,
                torch_dtype=torch.float16 if self.device == "cuda" else torch.float32
            )
            
            # Move to device if not using device_map
            if self.device == "cpu":
                self.model = self.model.to(self.device)
            
            print(f"✅ Promethios model loaded successfully!")
            return True
            
        except Exception as e:
            print(f"❌ Error loading model: {str(e)}")
            return False
    
    def generate_response(self, prompt, max_length=512, temperature=0.7, top_p=0.9):
        """Generate a response using the Promethios model"""
        if self.model is None or self.tokenizer is None:
            return "Error: Model not loaded. Please initialize the model first."
        
        try:
            # Format the prompt for CodeLlama instruction format
            formatted_prompt = f"[INST] You are Promethios AI Assistant, a helpful and knowledgeable AI assistant focused on providing accurate, ethical, and governance-compliant responses. {prompt} [/INST]"
            
            # Tokenize input
            inputs = self.tokenizer(
                formatted_prompt,
                return_tensors="pt",
                truncation=True,
                max_length=2048,
                padding=True
            ).to(self.device)
            
            # Generate response
            with torch.no_grad():
                outputs = self.model.generate(
                    **inputs,
                    max_new_tokens=max_length,
                    temperature=temperature,
                    top_p=top_p,
                    do_sample=True,
                    pad_token_id=self.tokenizer.eos_token_id,
                    eos_token_id=self.tokenizer.eos_token_id,
                    repetition_penalty=1.1
                )
            
            # Decode response
            full_response = self.tokenizer.decode(outputs[0], skip_special_tokens=True)
            
            # Extract only the generated part (after [/INST])
            if "[/INST]" in full_response:
                response = full_response.split("[/INST]")[-1].strip()
            else:
                response = full_response.strip()
            
            # Clean up the response
            response = self._clean_response(response)
            
            return response
            
        except Exception as e:
            print(f"❌ Error generating response: {str(e)}")
            return f"I apologize, but I encountered a technical issue while processing your request. Please try again."
    
    def _clean_response(self, response):
        """Clean and format the model response"""
        # Remove any remaining special tokens or artifacts
        response = response.replace("<s>", "").replace("</s>", "")
        response = response.replace("[INST]", "").replace("[/INST]", "")
        
        # Remove excessive whitespace
        response = " ".join(response.split())
        
        # Ensure the response starts appropriately
        if not response:
            return "I'm here to help! How can I assist you today?"
        
        return response
    
    def get_model_info(self):
        """Get information about the loaded model"""
        return {
            "model_name": "Promethios AI Assistant",
            "base_model": self.base_model_name,
            "adapter_path": self.model_path,
            "device": self.device,
            "loaded": self.model is not None,
            "timestamp": datetime.now().isoformat()
        }

def main():
    """Main function for command-line usage"""
    parser = argparse.ArgumentParser(description="Promethios Model Inference Service")
    parser.add_argument("--prompt", type=str, help="Input prompt for generation")
    parser.add_argument("--model-path", type=str, help="Path to model adapters")
    parser.add_argument("--max-length", type=int, default=512, help="Maximum response length")
    parser.add_argument("--temperature", type=float, default=0.7, help="Generation temperature")
    parser.add_argument("--info", action="store_true", help="Show model information")
    
    args = parser.parse_args()
    
    # Initialize service
    service = PrometheosModelService(args.model_path)
    
    # Load model
    if not service.load_model():
        print("Failed to load model. Exiting.")
        sys.exit(1)
    
    # Show model info if requested
    if args.info:
        info = service.get_model_info()
        print(json.dumps(info, indent=2))
        return
    
    # Generate response if prompt provided
    if args.prompt:
        response = service.generate_response(
            args.prompt,
            max_length=args.max_length,
            temperature=args.temperature
        )
        print(response)
    else:
        # Interactive mode
        print("🤖 Promethios AI Assistant - Interactive Mode")
        print("Type 'quit' to exit")
        
        while True:
            try:
                prompt = input("\nYou: ").strip()
                if prompt.lower() in ['quit', 'exit', 'q']:
                    break
                
                if prompt:
                    response = service.generate_response(prompt)
                    print(f"\nPromethios: {response}")
                    
            except KeyboardInterrupt:
                print("\nGoodbye!")
                break

if __name__ == "__main__":
    main()

