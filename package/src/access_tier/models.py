"""
Access Tier Management System - Data Models

This module defines the core data models for the Access Tier Management System,
including TierDefinition and TierAssignment classes.
"""

from datetime import datetime
from typing import Dict, List, Optional, Any, Union
from pydantic import BaseModel, Field


class RateLimits(BaseModel):
    """Rate limits configuration for an access tier."""
    
    requests_per_minute: int = Field(..., description="Maximum requests per minute", ge=1)
    requests_per_day: Optional[int] = Field(None, description="Maximum requests per day", ge=1)
    concurrent_requests: Optional[int] = Field(None, description="Maximum concurrent requests", ge=1)


class ProgressionCriteria(BaseModel):
    """Criteria for progressing from one tier to another."""
    
    min_days_in_tier: Optional[int] = Field(None, description="Minimum days in current tier", ge=1)
    min_successful_requests: Optional[int] = Field(None, description="Minimum successful requests", ge=1)
    max_error_rate: Optional[float] = Field(None, description="Maximum error rate (0.0-1.0)", ge=0, le=1)


class TierDefinition(BaseModel):
    """Definition of an access tier with permissions and rate limits."""
    
    id: str = Field(..., description="Unique identifier for the tier")
    name: str = Field(..., description="Display name for the tier")
    description: Optional[str] = Field(None, description="Detailed description of the tier")
    permissions: List[str] = Field(..., description="List of permissions granted to this tier")
    rate_limits: RateLimits = Field(..., description="Rate limits for this tier")
    progression_criteria: Optional[ProgressionCriteria] = Field(None, description="Criteria for progressing to the next tier")
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert the tier definition to a dictionary."""
        return self.model_dump()


class TierAssignment(BaseModel):
    """Assignment of a user to an access tier."""
    
    user_id: str = Field(..., description="Unique identifier of the user")
    tier_id: str = Field(..., description="Identifier of the assigned tier")
    assigned_by: str = Field(..., description="Identifier of the user or system that made the assignment")
    assigned_at: datetime = Field(default_factory=datetime.now, description="When the assignment was made")
    expires_at: Optional[datetime] = Field(None, description="When the assignment expires (if applicable)")
    metadata: Dict[str, Any] = Field(default_factory=dict, description="Additional metadata for the assignment")


class UsageRecord(BaseModel):
    """Record of API usage for quota tracking."""
    
    user_id: str = Field(..., description="Unique identifier of the user")
    endpoint: str = Field(..., description="API endpoint that was accessed")
    method: str = Field(..., description="HTTP method used")
    timestamp: datetime = Field(default_factory=datetime.now, description="When the request was made")
    status_code: int = Field(..., description="HTTP status code of the response")
    response_time: int = Field(..., description="Response time in milliseconds")
    request_size: Optional[int] = Field(None, description="Size of the request in bytes")
    response_size: Optional[int] = Field(None, description="Size of the response in bytes")


class ProgressionCandidate(BaseModel):
    """A user who is a candidate for tier progression."""
    
    user_id: str = Field(..., description="Unique identifier of the user")
    current_tier_id: str = Field(..., description="Current tier of the user")
    next_tier_id: str = Field(..., description="Proposed next tier for the user")
    criteria_met: Dict[str, bool] = Field(..., description="Map of criteria to whether they were met")
    evaluation_timestamp: datetime = Field(default_factory=datetime.now, description="When the evaluation was performed")


# Classes required by the test suite

class Feature(BaseModel):
    """Feature available in an access tier."""
    
    id: str = Field(..., description="Unique identifier for the feature")
    name: str = Field(..., description="Display name for the feature")
    description: Optional[str] = Field(None, description="Detailed description of the feature")
    enabled: bool = Field(True, description="Whether the feature is enabled")
    quota: Optional[int] = Field(None, description="Usage quota for this feature")
    rate_limit: Optional[int] = Field(None, description="Rate limit for this feature")
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert the feature to a dictionary."""
        return self.model_dump()


class AccessLevel(BaseModel):
    """Access level with a set of features."""
    
    id: str = Field(..., description="Unique identifier for the access level")
    name: str = Field(..., description="Display name for the access level")
    description: Optional[str] = Field(None, description="Detailed description of the access level")
    features: List[Feature] = Field(default_factory=list, description="Features available at this access level")
    
    def has_feature(self, feature_id: str) -> bool:
        """Check if this access level has a specific feature."""
        return any(feature.id == feature_id for feature in self.features)
    
    def get_feature(self, feature_id: str) -> Optional[Feature]:
        """Get a specific feature by ID."""
        for feature in self.features:
            if feature.id == feature_id:
                return feature
        return None
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert the access level to a dictionary."""
        return self.model_dump()


class AccessTier(BaseModel):
    """Access tier with an access level and progression criteria."""
    
    id: str = Field(..., description="Unique identifier for the tier")
    name: str = Field(..., description="Display name for the tier")
    description: Optional[str] = Field(None, description="Detailed description of the tier")
    access_level: AccessLevel = Field(..., description="Access level for this tier")
    progression_criteria: Dict[str, Union[int, float]] = Field(
        default_factory=dict, 
        description="Criteria for progressing to the next tier"
    )
    
    def has_feature(self, feature_id: str) -> bool:
        """Check if this tier has a specific feature."""
        return self.access_level.has_feature(feature_id)
    
    def get_feature(self, feature_id: str) -> Optional[Feature]:
        """Get a specific feature by ID."""
        return self.access_level.get_feature(feature_id)
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert the tier to a dictionary."""
        return self.model_dump()
