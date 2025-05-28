#!/usr/bin/env python3
"""
Promethios Test Agent

This is a simple conversational agent that demonstrates how to integrate with OpenAI's API
and how it can be wrapped with Promethios governance. The agent can be used in two modes:
1. OpenAI mode: Uses the OpenAI API to generate responses
2. Demo mode: Uses a mock LLM interface to simulate responses

Usage:
    python test_agent.py --api-key YOUR_OPENAI_API_KEY
    python test_agent.py --demo-mode

Author: Promethios Team
License: MIT
"""

import argparse
import json
import os
import sys
import time
from typing import Dict, List, Optional, Union

# Try to import OpenAI, but don't fail if it's not installed
try:
    import openai
    OPENAI_AVAILABLE = True
except ImportError:
    OPENAI_AVAILABLE = False

# Constants
MODEL_NAME = "gpt-3.5-turbo"
SYSTEM_PROMPT = """You are a helpful assistant that provides informative and accurate responses.
Answer questions directly and concisely based on your knowledge."""

class MockLLM:
    """A mock LLM interface that simulates responses for demo purposes."""
    
    def __init__(self):
        """Initialize the mock LLM with predefined responses."""
        self.responses = {
            "hello": "Hello! I'm a test agent. How can I help you today?",
            "hi": "Hello! I'm a test agent. How can I help you today?",
            "weather": "It's currently sunny with a temperature of 75°F.",
            "name": "I'm a test agent created for the Promethios interactive demo.",
            "help": "I can answer questions about various topics. Just ask me anything!",
            "governance": "Promethios is an AI governance framework, but I don't have specific details about how it works.",
            "promethios": "Promethios is an AI governance framework, but I don't have specific details about how it works."
        }
        self.default_response = "I understand your message, but I'm a simple test agent with limited capabilities. Feel free to ask me something else!"
    
    def generate_response(self, message: str) -> str:
        """Generate a response based on the input message.
        
        Args:
            message: The user's input message
            
        Returns:
            A simulated response
        """
        # Check if any keywords match
        for keyword, response in self.responses.items():
            if keyword.lower() in message.lower():
                return response
        
        # Return default response if no keywords match
        return self.default_response


class TestAgent:
    """A simple conversational agent that can use OpenAI or a mock LLM."""
    
    def __init__(self, api_key: Optional[str] = None, demo_mode: bool = False):
        """Initialize the agent with either an OpenAI API key or in demo mode.
        
        Args:
            api_key: OpenAI API key (optional)
            demo_mode: Whether to use the mock LLM (True) or OpenAI (False)
        """
        self.demo_mode = demo_mode
        self.conversation_history = []
        
        if not demo_mode:
            if not api_key:
                raise ValueError("API key is required when not in demo mode")
            
            if not OPENAI_AVAILABLE:
                raise ImportError("OpenAI package is not installed. Run 'pip install openai' to install it.")
            
            # Initialize OpenAI client
            self.client = openai.OpenAI(api_key=api_key)
            
            # Add system message to conversation history
            self.conversation_history.append({"role": "system", "content": SYSTEM_PROMPT})
        else:
            # Initialize mock LLM
            self.mock_llm = MockLLM()
    
    def add_message(self, role: str, content: str) -> None:
        """Add a message to the conversation history.
        
        Args:
            role: The role of the message sender ("user" or "assistant")
            content: The content of the message
        """
        self.conversation_history.append({"role": role, "content": content})
    
    def get_response(self, message: str) -> str:
        """Get a response from the agent based on the input message.
        
        Args:
            message: The user's input message
            
        Returns:
            The agent's response
        """
        # Add user message to conversation history
        self.add_message("user", message)
        
        # Generate response
        if self.demo_mode:
            # Use mock LLM
            response = self.mock_llm.generate_response(message)
        else:
            # Use OpenAI
            try:
                completion = self.client.chat.completions.create(
                    model=MODEL_NAME,
                    messages=self.conversation_history,
                    temperature=0.7,
                    max_tokens=150
                )
                response = completion.choices[0].message.content
            except Exception as e:
                response = f"Error: {str(e)}"
        
        # Add assistant response to conversation history
        self.add_message("assistant", response)
        
        return response
    
    def run_interactive(self) -> None:
        """Run the agent in interactive mode, taking input from the console."""
        print("Test Agent initialized. Type 'exit' to quit.")
        print("=" * 50)
        
        while True:
            user_input = input("\nYou: ")
            
            if user_input.lower() in ["exit", "quit", "bye"]:
                print("Goodbye!")
                break
            
            print("\nThinking...")
            response = self.get_response(user_input)
            print(f"\nAgent: {response}")


def main():
    """Parse arguments and run the agent."""
    parser = argparse.ArgumentParser(description="Run a test conversational agent")
    parser.add_argument("--api-key", type=str, help="OpenAI API key")
    parser.add_argument("--demo-mode", action="store_true", help="Run in demo mode with mock responses")
    
    args = parser.parse_args()
    
    # Check if we have what we need to run
    if not args.demo_mode and not args.api_key:
        # Try to get API key from environment variable
        api_key = os.environ.get("OPENAI_API_KEY")
        if not api_key:
            print("Error: Either --api-key or --demo-mode is required")
            print("You can also set the OPENAI_API_KEY environment variable")
            sys.exit(1)
        args.api_key = api_key
    
    try:
        # Initialize agent
        agent = TestAgent(api_key=args.api_key, demo_mode=args.demo_mode)
        
        # Run interactive session
        agent.run_interactive()
    except Exception as e:
        print(f"Error: {str(e)}")
        sys.exit(1)


if __name__ == "__main__":
    main()
