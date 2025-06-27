#!/usr/bin/env python3
"""
Governance AI Extension Installer
Installs and configures the Governance AI extension module
"""

import os
import sys
import json
import subprocess
import argparse
from pathlib import Path
from typing import Dict, Any, List

class GovernanceExtensionInstaller:
    """
    Installer for the Governance AI Extension Module
    Handles installation, configuration, and deployment
    """
    
    def __init__(self, install_path: str = None):
        """
        Initialize the installer
        
        Args:
            install_path: Path where the extension should be installed
        """
        self.install_path = Path(install_path) if install_path else Path.cwd()
        self.extension_name = "governance_ai_extension"
        self.config = self._load_default_config()
        
    def _load_default_config(self) -> Dict[str, Any]:
        """Load default configuration"""
        return {
            "extension": {
                "name": "governance_ai_extension",
                "version": "1.0.0",
                "type": "governance_ai",
                "enabled": True
            },
            "models": {
                "ultimate_governance": {
                    "path": "./models/ultimate_governance_llm",
                    "enabled": True,
                    "priority": 1,
                    "auto_load": True
                },
                "constitutional_governance": {
                    "path": "./models/constitutional_governance_llm",
                    "enabled": False,
                    "priority": 2,
                    "auto_load": False
                },
                "operational_governance": {
                    "path": "./models/operational_governance_llm", 
                    "enabled": False,
                    "priority": 3,
                    "auto_load": False
                }
            },
            "api": {
                "host": "0.0.0.0",
                "port": 8080,
                "workers": 1,
                "auto_start": False
            },
            "dependencies": [
                "transformers>=4.30.0",
                "torch>=2.0.0",
                "peft>=0.4.0",
                "fastapi>=0.100.0",
                "uvicorn>=0.23.0",
                "pydantic>=2.0.0"
            ]
        }
    
    def install(self, config_file: str = None) -> bool:
        """
        Install the Governance AI Extension
        
        Args:
            config_file: Optional configuration file path
            
        Returns:
            True if installation successful, False otherwise
        """
        try:
            print("🚀 Installing Governance AI Extension...")
            
            # Load custom config if provided
            if config_file and os.path.exists(config_file):
                with open(config_file, 'r') as f:
                    custom_config = json.load(f)
                self.config.update(custom_config)
            
            # Create installation directory
            self._create_directories()
            
            # Install dependencies
            self._install_dependencies()
            
            # Copy extension files
            self._copy_extension_files()
            
            # Create configuration files
            self._create_config_files()
            
            # Setup environment
            self._setup_environment()
            
            print("✅ Governance AI Extension installed successfully!")
            print(f"📁 Installation path: {self.install_path}")
            print(f"⚙️  Configuration: {self.install_path / 'config' / 'governance_extension.json'}")
            
            return True
            
        except Exception as e:
            print(f"❌ Installation failed: {e}")
            return False
    
    def _create_directories(self):
        """Create necessary directories"""
        directories = [
            "models",
            "api",
            "config",
            "logs",
            "data",
            "deployment"
        ]
        
        for directory in directories:
            dir_path = self.install_path / directory
            dir_path.mkdir(parents=True, exist_ok=True)
            print(f"📁 Created directory: {dir_path}")
    
    def _install_dependencies(self):
        """Install required dependencies"""
        print("📦 Installing dependencies...")
        
        dependencies = self.config.get("dependencies", [])
        for dependency in dependencies:
            try:
                subprocess.run([
                    sys.executable, "-m", "pip", "install", dependency
                ], check=True, capture_output=True)
                print(f"✅ Installed: {dependency}")
            except subprocess.CalledProcessError as e:
                print(f"⚠️  Warning: Failed to install {dependency}: {e}")
    
    def _copy_extension_files(self):
        """Copy extension files to installation directory"""
        print("📋 Copying extension files...")
        
        # This would copy the actual extension files
        # For now, we'll create placeholder structure
        extension_structure = {
            "models/ultimate_governance_llm": [
                "__init__.py",
                "model_config.json",
                "model_loader.py",
                "api_integration.py"
            ],
            "api": [
                "__init__.py",
                "governance_api.py",
                "model_router.py"
            ],
            "api/endpoints": [
                "__init__.py",
                "ultimate_governance.py",
                "constitutional.py",
                "operational.py"
            ]
        }
        
        for directory, files in extension_structure.items():
            dir_path = self.install_path / directory
            dir_path.mkdir(parents=True, exist_ok=True)
            
            for file_name in files:
                file_path = dir_path / file_name
                if not file_path.exists():
                    file_path.touch()
                print(f"📄 Created: {file_path}")
    
    def _create_config_files(self):
        """Create configuration files"""
        print("⚙️  Creating configuration files...")
        
        # Main extension configuration
        config_path = self.install_path / "config" / "governance_extension.json"
        with open(config_path, 'w') as f:
            json.dump(self.config, f, indent=2)
        print(f"⚙️  Created: {config_path}")
        
        # API configuration
        api_config = {
            "title": "Promethios Governance AI API",
            "description": "AI-powered governance analysis and decision support",
            "version": "1.0.0",
            "host": self.config["api"]["host"],
            "port": self.config["api"]["port"],
            "workers": self.config["api"]["workers"]
        }
        
        api_config_path = self.install_path / "config" / "api_config.json"
        with open(api_config_path, 'w') as f:
            json.dump(api_config, f, indent=2)
        print(f"⚙️  Created: {api_config_path}")
    
    def _setup_environment(self):
        """Setup environment variables and scripts"""
        print("🔧 Setting up environment...")
        
        # Create startup script
        startup_script = f"""#!/bin/bash
# Governance AI Extension Startup Script

export GOVERNANCE_EXTENSION_PATH="{self.install_path}"
export GOVERNANCE_CONFIG_PATH="{self.install_path}/config"
export GOVERNANCE_MODELS_PATH="{self.install_path}/models"

echo "🚀 Starting Governance AI Extension..."
cd "{self.install_path}"
python -m api.governance_api --config config/api_config.json
"""
        
        startup_path = self.install_path / "start_governance_api.sh"
        with open(startup_path, 'w') as f:
            f.write(startup_script)
        os.chmod(startup_path, 0o755)
        print(f"🔧 Created startup script: {startup_path}")
    
    def configure_model(self, model_name: str, model_path: str, enabled: bool = True):
        """
        Configure a governance model
        
        Args:
            model_name: Name of the model
            model_path: Path to the model files
            enabled: Whether the model should be enabled
        """
        if model_name in self.config["models"]:
            self.config["models"][model_name]["path"] = model_path
            self.config["models"][model_name]["enabled"] = enabled
            print(f"⚙️  Configured model: {model_name}")
        else:
            print(f"⚠️  Unknown model: {model_name}")
    
    def start_api(self):
        """Start the Governance API server"""
        try:
            print("🚀 Starting Governance API server...")
            startup_script = self.install_path / "start_governance_api.sh"
            subprocess.run([str(startup_script)], check=True)
        except subprocess.CalledProcessError as e:
            print(f"❌ Failed to start API server: {e}")
    
    def status(self):
        """Check extension status"""
        print("📊 Governance AI Extension Status:")
        print(f"📁 Installation path: {self.install_path}")
        print(f"⚙️  Configuration: {self.install_path / 'config' / 'governance_extension.json'}")
        
        # Check models
        print("\n🤖 Models:")
        for model_name, model_config in self.config["models"].items():
            status = "✅ Enabled" if model_config["enabled"] else "❌ Disabled"
            path = model_config["path"]
            print(f"  {model_name}: {status} ({path})")
        
        # Check API
        print(f"\n🌐 API Configuration:")
        print(f"  Host: {self.config['api']['host']}")
        print(f"  Port: {self.config['api']['port']}")
        print(f"  Workers: {self.config['api']['workers']}")

def main():
    """Main CLI entry point"""
    parser = argparse.ArgumentParser(description="Governance AI Extension Installer")
    parser.add_argument("command", choices=["install", "configure", "start", "status"], 
                       help="Command to execute")
    parser.add_argument("--install-path", help="Installation path")
    parser.add_argument("--config", help="Configuration file path")
    parser.add_argument("--model-name", help="Model name for configuration")
    parser.add_argument("--model-path", help="Model path for configuration")
    parser.add_argument("--enable-model", action="store_true", help="Enable model")
    
    args = parser.parse_args()
    
    installer = GovernanceExtensionInstaller(args.install_path)
    
    if args.command == "install":
        installer.install(args.config)
    elif args.command == "configure":
        if args.model_name and args.model_path:
            installer.configure_model(args.model_name, args.model_path, args.enable_model)
        else:
            print("❌ Model name and path required for configuration")
    elif args.command == "start":
        installer.start_api()
    elif args.command == "status":
        installer.status()

if __name__ == "__main__":
    main()

