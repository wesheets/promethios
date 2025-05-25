"""
Implementation of create_trust_boundary method for TrustPropagationManager

This adds the missing create_trust_boundary method to the TrustPropagationManager class
to support the end-to-end test suite.
"""

def create_trust_boundary(self, boundary_id: str, min_trust_score: float, description: str = "") -> 'TrustBoundary':
    """
    Create a trust boundary and register it with the propagation manager.
    
    Args:
        boundary_id: Unique identifier for the boundary
        min_trust_score: Minimum trust score required (0.0-1.0)
        description: Optional description of the boundary
        
    Returns:
        TrustBoundary: The created trust boundary
    """
    from trust_verification_system import TrustBoundary
    
    # Create the boundary
    boundary = TrustBoundary(
        boundary_id=boundary_id,
        min_trust_score=min_trust_score
    )
    
    # Register the boundary
    self._register_boundary(boundary)
    
    return boundary

# Add the method to TrustPropagationManager
from trust_propagation_manager import TrustPropagationManager
TrustPropagationManager.create_trust_boundary = create_trust_boundary
