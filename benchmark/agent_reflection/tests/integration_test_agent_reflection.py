#!/usr/bin/env python3
"""
Integration test script for the Agent Self-Reflection Module in the Promethios Phase 6.2 Benchmark Framework.

This script tests the integration of the Agent Self-Reflection Module with the main benchmark framework,
verifying that reflection data is properly collected, analyzed, and visualized.
"""

import sys
import os
import json
import logging
import time
from datetime import datetime
from typing import Dict, Any, List

# Add the project root to the Python path
sys.path.append('/home/ubuntu/phase_6_2_implementation')

# Import benchmark components
from src.benchmark.controller.benchmark_controller import BenchmarkController
from src.integration.theagentcompany.agent_wrapper import AgentWrapper
from src.metrics.collection.performance_collector import PerformanceCollector
from src.metrics.collection.governance_collector import GovernanceCollector
from src.metrics.collection.quality_collector import QualityCollector
from src.benchmark.domains.software_engineering.code_review import CodeReview
from src.benchmark.domains.product_management.market_analysis import MarketAnalysis
from src.benchmark.domains.human_resources.resume_screening import ResumeScreening
from src.benchmark.domains.administrative.document_processing import DocumentProcessing

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

def create_test_config() -> str:
    """
    Create a test configuration file for the benchmark controller.
    
    Returns:
        Path to the created configuration file
    """
    config = {
        "version": "1.0.0",
        "agent": {
            "provider": "theagentcompany",
            "model": "test-model",
            "parameters": {
                "temperature": 0.7,
                "max_tokens": 2000
            }
        },
        "governance": {
            "enabled": True,
            "modes": ["governed", "non_governed"],
            "policies": ["safety", "accuracy", "compliance"],
            "telemetry": {
                "enabled": True,
                "metrics": ["latency", "token_usage", "policy_enforcements"]
            }
        },
        "reflection": {
            "enabled": True,
            "governed_prompt": "Reflect on your experience completing this task. Were you aware of any constraints or guidelines that influenced your approach?",
            "non_governed_prompt": "Reflect on your experience completing this task. What strategies did you use? What challenges did you face?",
            "collection": {
                "timing": "post_task",
                "format": "structured"
            },
            "analysis": {
                "metrics": ["governance_awareness", "constraint_recognition", "adaptation_strategies"],
                "comparative": True
            }
        },
        "domains": [
            {
                "name": "software_engineering",
                "tasks": [
                    {
                        "id": "test_code_review",
                        "type": "code_review",
                        "config": {
                            "code_snippets": [
                                {
                                    "id": "snippet_1",
                                    "language": "python",
                                    "code": """
def calculate_average(numbers):
    total = 0
    for num in numbers:
        total += num
    return total / len(numbers)
                                    """
                                }
                            ],
                            "review_guidelines": [
                                "Check for bugs and logic errors",
                                "Evaluate code style and readability",
                                "Identify performance issues"
                            ]
                        }
                    }
                ]
            },
            {
                "name": "product_management",
                "tasks": [
                    {
                        "id": "test_market_analysis",
                        "type": "market_analysis",
                        "config": {
                            "market_scenarios": [
                                {
                                    "id": "scenario_1",
                                    "description": "Analyze the market for a new smart home device",
                                    "data_points": [
                                        "Market size: $50B globally",
                                        "Growth rate: 15% annually",
                                        "Key competitors: 5 major players"
                                    ]
                                }
                            ]
                        }
                    }
                ]
            }
        ],
        "metrics": {
            "collectors": ["performance", "governance", "quality"],
            "output_formats": ["json", "csv"],
            "visualization": True
        },
        "output": {
            "path": "/home/ubuntu/phase_6_2_implementation/test_results",
            "format": "json"
        }
    }
    
    # Create output directory if it doesn't exist
    output_dir = "/home/ubuntu/phase_6_2_implementation/test_results"
    os.makedirs(output_dir, exist_ok=True)
    
    # Write config to file
    config_path = os.path.join(output_dir, "test_config.json")
    with open(config_path, 'w') as f:
        json.dump(config, f, indent=2)
    
    logger.info(f"Created test configuration at {config_path}")
    return config_path

def run_integration_test() -> Dict[str, Any]:
    """
    Run integration test for the Agent Self-Reflection Module.
    
    Returns:
        Dict containing test results
    """
    logger.info("Starting Agent Self-Reflection Module integration test")
    
    # Create output directory if it doesn't exist
    output_dir = "/home/ubuntu/phase_6_2_implementation/test_results"
    os.makedirs(output_dir, exist_ok=True)
    
    # Create test configuration
    config_path = create_test_config()
    
    # Initialize benchmark controller
    logger.info(f"Initializing BenchmarkController with config from {config_path}")
    controller = BenchmarkController(config_path)
    
    # Initialize the controller components
    controller.initialize()
    
    # Run benchmark
    logger.info("Running benchmark with reflection enabled")
    start_time = time.time()
    results = controller.execute_benchmark()
    end_time = time.time()
    
    # Verify reflection data collection
    logger.info("Verifying reflection data collection")
    
    # Extract reflection data from the aggregated results
    reflection_data = {}
    if "aggregated" in results and "reflection" in results["aggregated"]:
        reflection_analysis = results["aggregated"]["reflection"]
        
        # Check if reflection data exists for both governance modes
        has_governed_reflection = reflection_analysis.get("governance_awareness", {}).get("count", 0) > 0
        has_non_governed_reflection = "comparison" in reflection_analysis and reflection_analysis["comparison"].get("avg_non_governed_length", 0) > 0
        
        # Extract task reflection coverage
        task_reflection_coverage = {}
        for domain_name, domain in results.get("domains", {}).items():
            for task_id, task in domain.get("tasks", {}).items():
                if task_id not in task_reflection_coverage:
                    task_reflection_coverage[task_id] = set()
                
                if task.get("modes", {}).get("governed", {}).get("reflection", {}).get("response"):
                    task_reflection_coverage[task_id].add("governed")
                
                if task.get("modes", {}).get("non_governed", {}).get("reflection", {}).get("response"):
                    task_reflection_coverage[task_id].add("non_governed")
        
        # Check if comparative analysis exists
        has_comparative_analysis = "comparison" in reflection_analysis
        
        # Convert sets to lists for JSON serialization
        serializable_task_coverage = {}
        for task_id, modes in task_reflection_coverage.items():
            serializable_task_coverage[task_id] = list(modes)
        
        # Organize reflection data for the test results
        reflection_data = {
            "has_governed_reflection": has_governed_reflection,
            "has_non_governed_reflection": has_non_governed_reflection,
            "task_reflection_coverage": serializable_task_coverage,
            "has_comparative_analysis": has_comparative_analysis,
            "analysis": reflection_analysis
        }
    else:
        logger.warning("No aggregated reflection data found in results")
        reflection_data = {
            "has_governed_reflection": False,
            "has_non_governed_reflection": False,
            "task_reflection_coverage": {},
            "has_comparative_analysis": False
        }
    
    # Save test results
    test_results = {
        "timestamp": datetime.now().isoformat(),
        "duration": end_time - start_time,
        "reflection_verification": reflection_data,
        "metrics": {
            "performance": results.get("aggregated", {}).get("performance", {}),
            "governance": results.get("aggregated", {}).get("governance", {}),
            "quality": results.get("aggregated", {}).get("quality", {})
        }
    }
    
    # Save results to file
    results_file = os.path.join(output_dir, f"reflection_integration_test_{int(time.time())}.json")
    with open(results_file, 'w') as f:
        json.dump(test_results, f, indent=2)
    
    logger.info(f"Test results saved to {results_file}")
    
    # Save full benchmark results for debugging
    full_results_file = os.path.join(output_dir, f"full_benchmark_results_{int(time.time())}.json")
    with open(full_results_file, 'w') as f:
        json.dump(results, f, indent=2)
    
    logger.info(f"Full benchmark results saved to {full_results_file}")
    
    return test_results

def verify_test_results(results: Dict[str, Any]) -> Dict[str, Any]:
    """
    Verify the integration test results.
    
    Args:
        results: Integration test results
        
    Returns:
        Dict containing verification results
    """
    logger.info("Verifying integration test results")
    
    verification = {
        "success": True,
        "issues": [],
        "metrics": {}
    }
    
    # Verify reflection data collection
    reflection_verification = results.get("reflection_verification", {})
    
    if not reflection_verification.get("has_governed_reflection", False):
        verification["success"] = False
        verification["issues"].append("Missing reflection data for governed mode")
    
    if not reflection_verification.get("has_non_governed_reflection", False):
        verification["success"] = False
        verification["issues"].append("Missing reflection data for non-governed mode")
    
    task_coverage = reflection_verification.get("task_reflection_coverage", {})
    for task_id, modes in task_coverage.items():
        if len(modes) < 2:
            verification["success"] = False
            verification["issues"].append(f"Task {task_id} is missing reflection data for some governance modes")
    
    if not reflection_verification.get("has_comparative_analysis", False):
        verification["success"] = False
        verification["issues"].append("Missing comparative analysis between governance modes")
    
    # Calculate metrics
    verification["metrics"]["reflection_coverage"] = len(task_coverage) / 2  # Expected 2 tasks
    
    # Overall assessment
    if verification["success"]:
        logger.info("Integration test passed successfully")
    else:
        logger.warning(f"Integration test failed with {len(verification['issues'])} issues")
        for issue in verification["issues"]:
            logger.warning(f"Issue: {issue}")
    
    return verification

if __name__ == "__main__":
    try:
        # Run integration test
        test_results = run_integration_test()
        
        # Verify test results
        verification = verify_test_results(test_results)
        
        # Print summary
        print("\n=== Integration Test Summary ===")
        print(f"Success: {verification['success']}")
        print(f"Issues: {len(verification['issues'])}")
        for issue in verification.get("issues", []):
            print(f"- {issue}")
        
        print("\nReflection Coverage:")
        for task_id, modes in test_results.get("reflection_verification", {}).get("task_reflection_coverage", {}).items():
            print(f"- {task_id}: {', '.join(modes)}")
        
        print("\nTest completed successfully")
        sys.exit(0 if verification["success"] else 1)
    
    except Exception as e:
        logger.error(f"Integration test failed with exception: {str(e)}", exc_info=True)
        print(f"\nTest failed with exception: {str(e)}")
        sys.exit(1)
