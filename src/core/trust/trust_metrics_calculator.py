"""
Trust Metrics Calculator Module

This module provides the TrustMetricsCalculator class for calculating trust metrics
across various dimensions and entities.
"""

import copy
import logging
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)

class TrustMetricsCalculator:
    """
    TrustMetricsCalculator calculates and tracks trust metrics across various dimensions.
    
    This component is responsible for calculating trust metrics, storing historical
    data, and providing aggregated views of trust across the system.
    """
    
    def __init__(self, contract_sealer=None, config=None):
        """
        Initialize the TrustMetricsCalculator.
        
        Args:
            contract_sealer: The contract sealer for verification
            config (dict, optional): Configuration options
        """
        self.contract_sealer = contract_sealer
        self.config = config or {}
        
        # Initialize storage for metrics
        self.entity_metrics = {}
        self.dimension_history = {}
        self.aggregate_history = {}
        
        # Verify contract tether
        self._pre_loop_tether_check()
    
    def calculate_entity_metrics(self, entity_id, raw_data):
        """
        Calculate metrics for a specific entity.
        
        Args:
            entity_id (str): ID of the entity
            raw_data (dict): Raw data for metric calculation
            
        Returns:
            dict: Calculated metrics
        """
        if not raw_data:
            logger.warning("No raw data provided for entity: %s", entity_id)
            return {}
            
        # Initialize entity metrics if not exists
        if entity_id not in self.entity_metrics:
            self.entity_metrics[entity_id] = {
                "trust_score": 0.0,
                "dimensions": {},
                "last_updated": datetime.now().isoformat()
            }
            
        # Calculate metrics for each dimension
        for dimension, data in raw_data.items():
            dimension_score = self._calculate_dimension_score(dimension, data)
            
            # Store dimension score
            self.entity_metrics[entity_id]["dimensions"][dimension] = dimension_score
            
            # Add to dimension history
            self._add_to_dimension_history(entity_id, dimension, dimension_score)
            
        # Calculate aggregate trust score
        self.entity_metrics[entity_id]["trust_score"] = self._calculate_aggregate_score(
            self.entity_metrics[entity_id]["dimensions"]
        )
        
        # Update timestamp
        self.entity_metrics[entity_id]["last_updated"] = datetime.now().isoformat()
        
        # Add to aggregate history
        self._add_to_aggregate_history(entity_id, self.entity_metrics[entity_id])
        
        return copy.deepcopy(self.entity_metrics[entity_id])
    
    def get_entity_metrics(self, entity_id):
        """
        Get metrics for a specific entity.
        
        Args:
            entity_id (str): ID of the entity
            
        Returns:
            dict: Entity metrics, or None if entity not found
        """
        if entity_id not in self.entity_metrics:
            logger.warning("Metrics requested for unknown entity: %s", entity_id)
            return None
            
        return copy.deepcopy(self.entity_metrics[entity_id])
    
    def get_all_entities(self):
        """
        Get a list of all entity IDs with metrics.
        
        Returns:
            list: List of entity IDs
        """
        return list(self.entity_metrics.keys())
    
    def _calculate_dimension_score(self, dimension, data):
        """
        Calculate score for a specific dimension.
        
        Args:
            dimension (str): Dimension name
            data (dict): Raw data for the dimension
            
        Returns:
            float: Calculated dimension score
        """
        # Default implementation - can be overridden in subclasses
        # or configured via config
        
        # Check if we have a custom calculator for this dimension
        if "dimension_calculators" in self.config and dimension in self.config["dimension_calculators"]:
            calculator = self.config["dimension_calculators"][dimension]
            return calculator(data)
            
        # Default calculation based on data type
        if isinstance(data, dict) and "score" in data:
            return float(data["score"])
        elif isinstance(data, (int, float)):
            return float(data)
        else:
            logger.warning("Unable to calculate score for dimension: %s", dimension)
            return 0.0
    
    def _calculate_aggregate_score(self, dimensions):
        """
        Calculate aggregate score from dimension scores.
        
        Args:
            dimensions (dict): Dictionary of dimension scores
            
        Returns:
            float: Calculated aggregate score
        """
        if not dimensions:
            return 0.0
            
        # Get dimension weights from config
        weights = {}
        if "dimension_weights" in self.config:
            weights = self.config["dimension_weights"]
            
        # Calculate weighted average
        total_weight = 0.0
        weighted_sum = 0.0
        
        for dimension, score in dimensions.items():
            weight = weights.get(dimension, 1.0)
            weighted_sum += score * weight
            total_weight += weight
            
        if total_weight == 0.0:
            return 0.0
            
        return weighted_sum / total_weight
    
    def _add_to_dimension_history(self, entity_id, dimension, score):
        """
        Add a dimension score to history.
        
        Args:
            entity_id (str): ID of the entity
            dimension (str): Dimension name
            score (float): Dimension score
        """
        # Initialize history if not exists
        if entity_id not in self.dimension_history:
            self.dimension_history[entity_id] = {}
            
        if dimension not in self.dimension_history[entity_id]:
            self.dimension_history[entity_id][dimension] = []
            
        # Add entry
        entry = {
            "timestamp": datetime.now().isoformat(),
            "score": score
        }
        
        self.dimension_history[entity_id][dimension].append(entry)
        
        # Prune history if needed
        self._prune_dimension_history(entity_id, dimension)
    
    def _add_to_aggregate_history(self, entity_id, metrics):
        """
        Add aggregate metrics to history.
        
        Args:
            entity_id (str): ID of the entity
            metrics (dict): Entity metrics
        """
        # Initialize history if not exists
        if entity_id not in self.aggregate_history:
            self.aggregate_history[entity_id] = []
            
        # Add entry
        entry = {
            "timestamp": metrics["last_updated"],
            "trust_score": metrics["trust_score"],
            "dimensions": copy.deepcopy(metrics["dimensions"])
        }
        
        self.aggregate_history[entity_id].append(entry)
        
        # Prune history if needed
        self._prune_aggregate_history(entity_id)
    
    def _prune_dimension_history(self, entity_id, dimension):
        """
        Prune dimension history to stay within size limits.
        
        Args:
            entity_id (str): ID of the entity
            dimension (str): Dimension name
        """
        # Get max history size from config
        max_size = 100  # Default
        if "aggregation" in self.config and "max_dimension_history" in self.config["aggregation"]:
            max_size = self.config["aggregation"]["max_dimension_history"]
            
        # Prune if needed
        if len(self.dimension_history[entity_id][dimension]) > max_size:
            self.dimension_history[entity_id][dimension] = self.dimension_history[entity_id][dimension][-max_size:]
    
    def _prune_aggregate_history(self, entity_id):
        """
        Prune aggregate history to stay within size limits.
        
        Args:
            entity_id (str): ID of the entity
        """
        # Get max history size from config
        max_size = 100  # Default
        if "aggregation" in self.config and "max_aggregate_history" in self.config["aggregation"]:
            max_size = self.config["aggregation"]["max_aggregate_history"]
            
        # Prune if needed
        if len(self.aggregate_history[entity_id]) > max_size:
            self.aggregate_history[entity_id] = self.aggregate_history[entity_id][-max_size:]
    
    def get_dimension_history(self, entity_id, dimension, limit=None):
        """
        Get dimension history for an entity.
        
        Args:
            entity_id (str): ID of the entity
            dimension (str): Dimension name
            limit (int, optional): Maximum number of history entries to return
            
        Returns:
            list: Dimension history, or None if entity or dimension not found
        """
        if entity_id not in self.dimension_history:
            logger.warning("History requested for unknown entity: %s", entity_id)
            return None
            
        if dimension not in self.dimension_history[entity_id]:
            logger.warning("History requested for unknown dimension: %s", dimension)
            return None
            
        history = self.dimension_history[entity_id][dimension]
        
        if limit and limit > 0:
            history = history[-limit:]
            
        return copy.deepcopy(history)
    
    def get_aggregate_history(self, entity_id, limit=None):
        """
        Get aggregate history for an entity.
        
        Args:
            entity_id (str): ID of the entity
            limit (int, optional): Maximum number of history entries to return
            
        Returns:
            list: Aggregate history, or None if entity not found
        """
        if entity_id not in self.aggregate_history:
            logger.warning("History requested for unknown entity: %s", entity_id)
            return None
            
        history = self.aggregate_history[entity_id]
        
        if limit and limit > 0:
            history = history[-limit:]
            
        return copy.deepcopy(history)
    
    def update_config(self, new_config, auth_context=None):
        """
        Update the metrics calculator configuration.
        
        Args:
            new_config (dict): New configuration to apply
            auth_context (dict, optional): Authorization context
            
        Returns:
            dict: Updated configuration
        """
        # For partial updates, we need to validate the merged configuration
        # Create a temporary merged config for validation
        temp_config = copy.deepcopy(self.config)
        self._deep_update_config(temp_config, new_config)
        
        # Validate the merged configuration
        if not self._validate_config_structure(temp_config):
            raise ValueError("Invalid configuration structure")
        
        # Log the change
        logger.info(
            "Configuration update by %s",
            auth_context.get("user_id", "unknown") if auth_context else "system"
        )
        
        # Apply the update with deep merge for nested dictionaries
        self._deep_update_config(self.config, new_config)
        
        return self.config
        
    def _deep_update_config(self, target, source):
        """
        Deep update configuration dictionary, preserving nested structures.
        
        Args:
            target (dict): Target configuration to update
            source (dict): Source configuration with updates
        """
        for key, value in source.items():
            if key in target and isinstance(target[key], dict) and isinstance(value, dict):
                # Recursively update nested dictionaries
                self._deep_update_config(target[key], value)
            else:
                # Update or add key-value pair
                target[key] = value
    
    def prune_old_history(self):
        """
        Prune old history entries across all entities.
        
        Returns:
            int: Number of pruned entries
        """
        pruned_count = 0
        
        # Get retention days from config
        retention_days = 30  # Default
        if "aggregation" in self.config and "retention_days" in self.config["aggregation"]:
            retention_days = self.config["aggregation"]["retention_days"]
        
        # Calculate cutoff date
        cutoff_date = datetime.now() - timedelta(days=retention_days)
        
        # Prune dimension history by size and date
        for entity_id in self.dimension_history:
            for dimension in self.dimension_history[entity_id]:
                original_length = len(self.dimension_history[entity_id][dimension])
                
                # Prune by size
                self._prune_dimension_history(entity_id, dimension)
                
                # Prune by date
                if retention_days > 0:
                    self.dimension_history[entity_id][dimension] = [
                        entry for entry in self.dimension_history[entity_id][dimension]
                        if datetime.fromisoformat(entry["timestamp"]) >= cutoff_date
                    ]
                
                pruned_count += original_length - len(self.dimension_history[entity_id][dimension])
        
        # Prune aggregate history by size and date
        for entity_id in self.aggregate_history:
            original_length = len(self.aggregate_history[entity_id])
            
            # Prune by size
            self._prune_aggregate_history(entity_id)
            
            # Prune by date
            if retention_days > 0:
                self.aggregate_history[entity_id] = [
                    entry for entry in self.aggregate_history[entity_id]
                    if datetime.fromisoformat(entry["timestamp"]) >= cutoff_date
                ]
            
            pruned_count += original_length - len(self.aggregate_history[entity_id])
        
        logger.info("Pruned %d old history entries", pruned_count)
        return pruned_count
        
    def verify_contract_integrity(self):
        """
        Verify the integrity of the contract tethering.
        
        Returns:
            bool: True if contract integrity is verified, False otherwise
        """
        return self._pre_loop_tether_check()
        
    def _pre_loop_tether_check(self):
        """
        Perform pre-loop tether check.
        
        Returns:
            bool: True if tether check passes, False otherwise
        """
        # This is a placeholder for contract verification logic
        # In a real implementation, this would verify the integrity of the contract
        return True
        
    def _validate_config_structure(self, config):
        """
        Validate configuration structure.
        
        Args:
            config (dict): Configuration to validate
            
        Returns:
            bool: True if configuration is valid, False otherwise
        """
        # This is a placeholder for configuration validation logic
        # In a real implementation, this would validate the structure of the configuration
        return True
