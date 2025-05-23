"""
Access Tier Management System - Persistence Layer

This module provides functionality for persisting access tier data to storage.
"""

import json
import logging
import os
from datetime import datetime
from typing import Dict, List, Optional, Any, Union

from .models import TierDefinition, TierAssignment, UsageRecord, ProgressionCandidate, AccessTier

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class TierPersistence:
    """
    Handles persistence of access tier data to storage.
    
    This implementation uses a database connection for storage.
    """
    
    def __init__(self, db_connection):
        """
        Initialize the persistence layer.
        
        Args:
            db_connection: Database connection object
        """
        self.db = db_connection
    
    def save_tier(self, tier: AccessTier) -> bool:
        """
        Save a tier to the database.
        
        Args:
            tier: The tier to save
            
        Returns:
            bool: True if successful, False otherwise
        """
        try:
            # In a real implementation, this would save to a database
            self.db.save_tier(tier.id, tier.to_dict())
            logger.info(f"Saved tier {tier.id} to database")
            return True
        except Exception as e:
            logger.error(f"Failed to save tier {tier.id}: {str(e)}")
            return False
    
    def get_tier(self, tier_id: str) -> Optional[AccessTier]:
        """
        Get a tier from the database.
        
        Args:
            tier_id: ID of the tier to get
            
        Returns:
            Optional[AccessTier]: The tier, or None if not found
        """
        try:
            # In a real implementation, this would query a database
            tier_data = self.db.get_tier(tier_id)
            if tier_data:
                return AccessTier(**tier_data)
            return None
        except Exception as e:
            logger.error(f"Failed to get tier {tier_id}: {str(e)}")
            return None
    
    def get_all_tiers(self) -> List[AccessTier]:
        """
        Get all tiers from the database.
        
        Returns:
            List[AccessTier]: List of all tiers
        """
        try:
            # In a real implementation, this would query a database
            tier_data_list = self.db.get_all_tiers()
            return [AccessTier(**tier_data) for tier_data in tier_data_list]
        except Exception as e:
            logger.error(f"Failed to get all tiers: {str(e)}")
            return []
    
    def delete_tier(self, tier_id: str) -> bool:
        """
        Delete a tier from the database.
        
        Args:
            tier_id: ID of the tier to delete
            
        Returns:
            bool: True if successful, False otherwise
        """
        try:
            # In a real implementation, this would delete from a database
            self.db.delete_tier(tier_id)
            logger.info(f"Deleted tier {tier_id} from database")
            return True
        except Exception as e:
            logger.error(f"Failed to delete tier {tier_id}: {str(e)}")
            return False
    
    def update_user_tier(self, user_id: str, tier_id: str) -> bool:
        """
        Update a user's tier in the database.
        
        Args:
            user_id: ID of the user
            tier_id: ID of the new tier
            
        Returns:
            bool: True if successful, False otherwise
        """
        try:
            # In a real implementation, this would update a database
            self.db.update_user_tier(user_id, tier_id)
            logger.info(f"Updated user {user_id} to tier {tier_id}")
            return True
        except Exception as e:
            logger.error(f"Failed to update user {user_id} to tier {tier_id}: {str(e)}")
            return False
    
    def get_user_metrics(self, user_id: str) -> Dict[str, Any]:
        """
        Get usage metrics for a user.
        
        Args:
            user_id: ID of the user
            
        Returns:
            Dict[str, Any]: User metrics
        """
        try:
            # In a real implementation, this would query a database
            return self.db.get_user_metrics(user_id)
        except Exception as e:
            logger.error(f"Failed to get metrics for user {user_id}: {str(e)}")
            return {}


class AccessTierPersistence:
    """
    Handles persistence of access tier data to storage.
    
    This implementation uses JSON files for storage, but could be extended
    to use a database or other storage mechanisms.
    """
    
    def __init__(self, data_dir: str):
        """
        Initialize the persistence layer.
        
        Args:
            data_dir: Directory for storing data files
        """
        self.data_dir = data_dir
        
        # Create data directory if it doesn't exist
        os.makedirs(data_dir, exist_ok=True)
        
        # Define file paths
        self.tiers_file = os.path.join(data_dir, 'tiers.json')
        self.assignments_file = os.path.join(data_dir, 'assignments.json')
        self.usage_dir = os.path.join(data_dir, 'usage')
        
        # Create usage directory if it doesn't exist
        os.makedirs(self.usage_dir, exist_ok=True)
    
    def save_tiers(self, tiers: Dict[str, TierDefinition]) -> bool:
        """
        Save tier definitions to storage.
        
        Args:
            tiers: Dictionary of tier definitions
            
        Returns:
            bool: True if successful, False otherwise
        """
        try:
            # Convert tiers to serializable format
            serializable_tiers = {
                tier_id: tier.model_dump() for tier_id, tier in tiers.items()
            }
            
            with open(self.tiers_file, 'w') as f:
                json.dump(serializable_tiers, f, indent=2, default=self._json_serializer)
            
            logger.info(f"Saved {len(tiers)} tiers to {self.tiers_file}")
            return True
        except Exception as e:
            logger.error(f"Failed to save tiers: {str(e)}")
            return False
    
    def load_tiers(self) -> Dict[str, TierDefinition]:
        """
        Load tier definitions from storage.
        
        Returns:
            Dict[str, TierDefinition]: Dictionary of tier definitions
        """
        if not os.path.exists(self.tiers_file):
            logger.info(f"Tiers file not found: {self.tiers_file}")
            return {}
        
        try:
            with open(self.tiers_file, 'r') as f:
                serialized_tiers = json.load(f)
            
            tiers = {}
            for tier_id, tier_data in serialized_tiers.items():
                tiers[tier_id] = TierDefinition(**tier_data)
            
            logger.info(f"Loaded {len(tiers)} tiers from {self.tiers_file}")
            return tiers
        except Exception as e:
            logger.error(f"Failed to load tiers: {str(e)}")
            return {}
    
    def save_assignments(self, assignments: Dict[str, TierAssignment]) -> bool:
        """
        Save tier assignments to storage.
        
        Args:
            assignments: Dictionary of tier assignments
            
        Returns:
            bool: True if successful, False otherwise
        """
        try:
            # Convert assignments to serializable format
            serializable_assignments = {
                user_id: assignment.model_dump() for user_id, assignment in assignments.items()
            }
            
            with open(self.assignments_file, 'w') as f:
                json.dump(serializable_assignments, f, indent=2, default=self._json_serializer)
            
            logger.info(f"Saved {len(assignments)} assignments to {self.assignments_file}")
            return True
        except Exception as e:
            logger.error(f"Failed to save assignments: {str(e)}")
            return False
    
    def load_assignments(self) -> Dict[str, TierAssignment]:
        """
        Load tier assignments from storage.
        
        Returns:
            Dict[str, TierAssignment]: Dictionary of tier assignments
        """
        if not os.path.exists(self.assignments_file):
            logger.info(f"Assignments file not found: {self.assignments_file}")
            return {}
        
        try:
            with open(self.assignments_file, 'r') as f:
                serialized_assignments = json.load(f)
            
            assignments = {}
            for user_id, assignment_data in serialized_assignments.items():
                # Convert ISO format strings back to datetime objects
                if 'assigned_at' in assignment_data and isinstance(assignment_data['assigned_at'], str):
                    assignment_data['assigned_at'] = datetime.fromisoformat(assignment_data['assigned_at'])
                
                if 'expires_at' in assignment_data and assignment_data['expires_at'] and isinstance(assignment_data['expires_at'], str):
                    assignment_data['expires_at'] = datetime.fromisoformat(assignment_data['expires_at'])
                
                assignments[user_id] = TierAssignment(**assignment_data)
            
            logger.info(f"Loaded {len(assignments)} assignments from {self.assignments_file}")
            return assignments
        except Exception as e:
            logger.error(f"Failed to load assignments: {str(e)}")
            return {}
    
    def save_usage_records(self, records: List[UsageRecord], batch_size: int = 1000) -> bool:
        """
        Save usage records to storage.
        
        Args:
            records: List of usage records
            batch_size: Number of records per file
            
        Returns:
            bool: True if successful, False otherwise
        """
        try:
            # Group records by date for better organization
            records_by_date = {}
            for record in records:
                date_str = record.timestamp.strftime('%Y-%m-%d')
                if date_str not in records_by_date:
                    records_by_date[date_str] = []
                records_by_date[date_str].append(record)
            
            # Save records for each date
            for date_str, date_records in records_by_date.items():
                # Split into batches
                for i in range(0, len(date_records), batch_size):
                    batch = date_records[i:i+batch_size]
                    
                    # Create a unique filename
                    timestamp = datetime.now().strftime('%H%M%S')
                    filename = f"usage_{date_str}_{timestamp}_{i//batch_size}.json"
                    filepath = os.path.join(self.usage_dir, filename)
                    
                    # Convert records to serializable format
                    serializable_records = [record.model_dump() for record in batch]
                    
                    with open(filepath, 'w') as f:
                        json.dump(serializable_records, f, indent=2, default=self._json_serializer)
            
            logger.info(f"Saved {len(records)} usage records")
            return True
        except Exception as e:
            logger.error(f"Failed to save usage records: {str(e)}")
            return False
    
    def load_usage_records(self, start_date: Optional[datetime] = None, 
                          end_date: Optional[datetime] = None) -> List[UsageRecord]:
        """
        Load usage records from storage.
        
        Args:
            start_date: Start date for filtering records (optional)
            end_date: End date for filtering records (optional)
            
        Returns:
            List[UsageRecord]: List of usage records
        """
        records = []
        
        try:
            # List all usage files
            usage_files = [f for f in os.listdir(self.usage_dir) if f.startswith('usage_') and f.endswith('.json')]
            
            # Filter files by date if specified
            if start_date or end_date:
                filtered_files = []
                for filename in usage_files:
                    # Extract date from filename (format: usage_YYYY-MM-DD_*)
                    parts = filename.split('_')
                    if len(parts) >= 3:
                        try:
                            file_date = datetime.strptime(parts[1], '%Y-%m-%d')
                            
                            if start_date and file_date < start_date.replace(hour=0, minute=0, second=0, microsecond=0):
                                continue
                            
                            if end_date and file_date > end_date.replace(hour=0, minute=0, second=0, microsecond=0):
                                continue
                            
                            filtered_files.append(filename)
                        except ValueError:
                            # Skip files with invalid date format
                            continue
                
                usage_files = filtered_files
            
            # Load records from each file
            for filename in usage_files:
                filepath = os.path.join(self.usage_dir, filename)
                
                with open(filepath, 'r') as f:
                    serialized_records = json.load(f)
                
                for record_data in serialized_records:
                    # Convert ISO format strings back to datetime objects
                    if 'timestamp' in record_data and isinstance(record_data['timestamp'], str):
                        record_data['timestamp'] = datetime.fromisoformat(record_data['timestamp'])
                    
                    record = UsageRecord(**record_data)
                    
                    # Apply date filtering at the record level for more precise filtering
                    if start_date and record.timestamp < start_date:
                        continue
                    
                    if end_date and record.timestamp > end_date:
                        continue
                    
                    records.append(record)
            
            logger.info(f"Loaded {len(records)} usage records")
            return records
        except Exception as e:
            logger.error(f"Failed to load usage records: {str(e)}")
            return []
    
    def _json_serializer(self, obj: Any) -> Any:
        """
        Custom JSON serializer for objects not serializable by default json code.
        
        Args:
            obj: Object to serialize
            
        Returns:
            Serialized object
        """
        if isinstance(obj, datetime):
            return obj.isoformat()
        
        raise TypeError(f"Type {type(obj)} not serializable")
