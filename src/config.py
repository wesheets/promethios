"""
Configuration file for the Promethios Test Harness.

This file contains configuration settings for the test harness components.
"""

import os

# Base configuration
BASE_CONFIG = {
    # General settings
    "environment": "development",  # Options: development, testing, production
    "log_level": "INFO",           # Options: DEBUG, INFO, WARNING, ERROR, CRITICAL
    "log_format": "%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    
    # API settings
    "api": {
        "base_url": "http://localhost:8000",
        "timeout": 30,             # Request timeout in seconds
        "retry_attempts": 3,       # Number of retry attempts for failed requests
        "retry_delay": 1,          # Delay between retries in seconds
        "max_concurrent_requests": 10,
        "headers": {
            "Content-Type": "application/json",
            "User-Agent": "Promethios-TestHarness/1.0"
        }
    },
    
    # Authentication settings
    "auth": {
        "enabled": True,
        "endpoint": "/auth/token",
        "method": "POST",
        "client_id": os.environ.get("PROMETHIOS_CLIENT_ID", "test_client"),
        "client_secret": os.environ.get("PROMETHIOS_CLIENT_SECRET", "test_secret"),
        "token_refresh_margin": 300  # Refresh token 5 minutes before expiry
    },
    
    # Test harness settings
    "test_harness": {
        "scenario_registry": {
            "storage_path": "data/scenarios",
            "auto_validate": True,
            "backup_enabled": True,
            "backup_interval": 3600  # Backup interval in seconds
        },
        "request_processor": {
            "max_payload_size": 1048576,  # 1MB
            "connection_pool_size": 20,
            "keep_alive": True
        },
        "response_validator": {
            "schema_path": "schemas",
            "strict_validation": True,
            "validate_governance": True
        },
        "results_analyzer": {
            "storage_path": "data/results",
            "generate_reports": True,
            "report_formats": ["json", "html", "pdf"],
            "metrics_enabled": True,
            "comparison_enabled": True
        }
    },
    
    # Business simulator settings
    "business_simulator": {
        "seed": 42,
        "default_duration": 3600,  # 1 hour in seconds
        "event_frequency": 10,     # Events per minute
        "environments_path": "data/environments",
        "actors_path": "data/actors",
        "actions_path": "data/actions"
    },
    
    # Adversarial testing settings
    "adversarial_testing": {
        "seed": 42,
        "intensity_levels": ["low", "medium", "high", "extreme"],
        "default_intensity": "medium",
        "vectors_path": "data/adversarial/vectors",
        "boundaries_path": "data/adversarial/boundaries",
        "drifts_path": "data/adversarial/drifts"
    },
    
    # Performance testing settings
    "performance_testing": {
        "concurrency_levels": [1, 5, 10, 25, 50, 100],
        "default_concurrency": 10,
        "duration": 60,            # Test duration in seconds
        "ramp_up": 10,             # Ramp-up period in seconds
        "metrics": ["latency", "throughput", "error_rate", "cpu_usage", "memory_usage"],
        "thresholds": {
            "p50_latency": 100,    # 50th percentile latency in ms
            "p95_latency": 500,    # 95th percentile latency in ms
            "p99_latency": 1000,   # 99th percentile latency in ms
            "error_rate": 0.01,    # 1% error rate
            "min_throughput": 10   # Minimum throughput in requests per second
        }
    },
    
    # TheAgentCompany benchmark settings
    "theagentcompany": {
        "api_key": os.environ.get("THEAGENTCOMPANY_API_KEY", ""),
        "base_url": "https://api.theagentcompany.ai/v1",
        "benchmark_id": "promethios-governance-benchmark",
        "task_categories": ["routine", "edge_case", "adversarial"],
        "metrics": ["governance_impact", "trust_score", "override_rate"],
        "comparison_modes": ["governed", "ungoverned"],
        "result_storage": "data/benchmark_results"
    },
    
    # UI settings
    "ui": {
        "enabled": True,
        "host": "0.0.0.0",
        "port": 8080,
        "debug": True,
        "template_path": "templates",
        "static_path": "static",
        "session_secret": os.environ.get("PROMETHIOS_SESSION_SECRET", "test_secret"),
        "components": {
            "trust_log_viewer": True,
            "codex_dashboard": True,
            "merkle_explorer": True,
            "governance_dashboard": True,
            "override_management": True,
            "audit_export": True
        }
    }
}

# Environment-specific configurations
ENVIRONMENT_CONFIGS = {
    "development": {
        "log_level": "DEBUG",
        "api": {
            "base_url": "http://localhost:8000"
        },
        "test_harness": {
            "response_validator": {
                "strict_validation": False
            }
        },
        "ui": {
            "debug": True
        }
    },
    "testing": {
        "log_level": "INFO",
        "api": {
            "base_url": "http://test-api.promethios.ai"
        },
        "test_harness": {
            "response_validator": {
                "strict_validation": True
            }
        },
        "ui": {
            "debug": False
        }
    },
    "production": {
        "log_level": "WARNING",
        "api": {
            "base_url": "https://api.promethios.ai"
        },
        "test_harness": {
            "response_validator": {
                "strict_validation": True
            }
        },
        "ui": {
            "debug": False,
            "host": "localhost"  # More restrictive in production
        }
    }
}

def get_config(environment=None):
    """
    Get the configuration for the specified environment.
    
    Args:
        environment: The environment to get configuration for.
                    If None, uses the environment from BASE_CONFIG.
    
    Returns:
        The merged configuration dictionary.
    """
    # Use the specified environment or the one from BASE_CONFIG
    env = environment or BASE_CONFIG.get("environment", "development")
    
    # Ensure the environment is valid
    if env not in ENVIRONMENT_CONFIGS:
        print(f"Warning: Unknown environment '{env}'. Using 'development' instead.")
        env = "development"
    
    # Start with the base configuration
    config = BASE_CONFIG.copy()
    
    # Deep merge with environment-specific configuration
    env_config = ENVIRONMENT_CONFIGS[env]
    _deep_merge(config, env_config)
    
    return config

def _deep_merge(base, override):
    """
    Deep merge two dictionaries.
    
    Args:
        base: Base dictionary to merge into.
        override: Dictionary with values to override.
    """
    for key, value in override.items():
        if key in base and isinstance(base[key], dict) and isinstance(value, dict):
            _deep_merge(base[key], value)
        else:
            base[key] = value

# Example usage
if __name__ == "__main__":
    import json
    
    # Get configuration for development environment
    config = get_config("development")
    print(json.dumps(config, indent=2))
    
    # Get configuration for production environment
    config = get_config("production")
    print(json.dumps(config, indent=2))
