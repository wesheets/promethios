"""
Test helper for debugging the distribute_contract method.

This script will help debug the interaction between the mock side_effect
and the distribute_contract implementation.
"""

import sys
import os
import uuid
from unittest.mock import MagicMock, patch
from datetime import datetime

# Add parent directory to path to import modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from schemas.governance.governance_contract_sync import GovernanceContractSync
from src.core.common.schema_validator import SchemaValidator

def debug_distribute_contract():
    """Debug the distribute_contract method with a mock side_effect."""
    # Initialize dependencies
    schema_validator = SchemaValidator(schema_dir="/home/ubuntu/promethios_phase_5_5/schemas")
    contract_sync = GovernanceContractSync(schema_validator)
    
    # Test data
    source_node_id = str(uuid.uuid4())
    target_node_ids = [str(uuid.uuid4()), str(uuid.uuid4())]
    contract_hash = "a" * 64  # Mock SHA-256 hash
    
    # Create a mock for requests.post
    mock_post = MagicMock()
    
    # Define side effect function
    def side_effect(*args, **kwargs):
        print(f"Mock called with args: {args}")
        print(f"Target node IDs: {target_node_ids}")
        
        if args[0].endswith(target_node_ids[0]):
            print(f"Matched first target node: {target_node_ids[0]}")
            mock_success = MagicMock()
            mock_success.status_code = 200
            mock_success.json.return_value = {"status": "success"}
            return mock_success
        else:
            print(f"No match for first target, using second: {target_node_ids[1]}")
            mock_failure = MagicMock()
            mock_failure.status_code = 500
            return mock_failure
    
    # Set the side effect
    mock_post.side_effect = side_effect
    
    # Patch requests.post
    with patch('schemas.governance.governance_contract_sync.requests.post', mock_post):
        # Call distribute_contract
        result = contract_sync.distribute_contract(
            source_node_id,
            target_node_ids,
            "v2025.05.18",
            contract_hash,
            "contract_content"
        )
        
        # Print result
        print("\nDistribution result:")
        print(f"Successful nodes: {result['successful_nodes']}")
        print(f"Failed nodes: {result['failed_nodes']}")
        print(f"Status: {result['status']}")
        
        # Verify expected counts
        print("\nVerification:")
        print(f"Expected successful nodes: 1, Actual: {len(result['successful_nodes'])}")
        print(f"Expected failed nodes: 1, Actual: {len(result['failed_nodes'])}")

if __name__ == "__main__":
    debug_distribute_contract()
