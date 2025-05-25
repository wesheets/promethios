"""
Compliance Mapping Framework for Promethios Phase 6.1

This module provides a comprehensive framework for mapping Promethios governance
components to various compliance standards, ensuring regulatory alignment and
facilitating audit processes.
"""

import json
import os
import logging
from typing import Dict, Any, List, Optional, Tuple, Union, Set
from datetime import datetime
import re
from enum import Enum

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Define compliance status for backward compatibility
class ComplianceStatus(Enum):
    """Compliance status values."""
    COMPLIANT = "compliant"
    NON_COMPLIANT = "non_compliant"
    PARTIALLY_COMPLIANT = "partially_compliant"
    UNKNOWN = "unknown"
    EXEMPT = "exempt"

# Define compliance standard for backward compatibility
class ComplianceStandard:
    """Compliance standard information."""
    def __init__(self, name, version="1.0", description=None):
        self.name = name
        self.version = version
        self.description = description or f"{name} compliance standard"
        
    def to_dict(self):
        """Convert to dictionary representation."""
        return {
            "name": self.name,
            "version": self.version,
            "description": self.description
        }

# Define compliance control for backward compatibility
class ComplianceControl:
    """Compliance control information."""
    def __init__(self, control_id, name, description=None, standard=None):
        self.control_id = control_id
        self.name = name
        self.description = description or name
        self.standard = standard
        
    def to_dict(self):
        """Convert to dictionary representation."""
        return {
            "control_id": self.control_id,
            "name": self.name,
            "description": self.description,
            "standard": self.standard.to_dict() if self.standard else None
        }

# Define compliance mapping for backward compatibility
class ComplianceMapping:
    """Mapping between Promethios components and compliance controls."""
    def __init__(self, component_type, component_id, control, coverage=100):
        self.component_type = component_type
        self.component_id = component_id
        self.control = control
        self.coverage = coverage
        
    def to_dict(self):
        """Convert to dictionary representation."""
        return {
            "component_type": self.component_type,
            "component_id": self.component_id,
            "control": self.control.to_dict() if self.control else None,
            "coverage_percentage": self.coverage
        }

# Define compliance report for backward compatibility
class ComplianceReport:
    """Compliance assessment report."""
    def __init__(self, standard, mappings=None, timestamp=None):
        self.standard = standard
        self.mappings = mappings or []
        self.timestamp = timestamp or datetime.now().isoformat()
        
    def to_dict(self):
        """Convert to dictionary representation."""
        return {
            "standard": self.standard.to_dict() if self.standard else None,
            "mappings": [m.to_dict() for m in self.mappings],
            "timestamp": self.timestamp,
            "total_controls": len(self.mappings)
        }

class ComplianceMappingFramework:
    """
    Framework for mapping Promethios components to compliance standards.
    
    This class provides functionality to define, manage, and validate compliance
    mappings between Promethios governance components and external regulatory
    standards such as SOC2, GDPR, HIPAA, and ISO27001.
    """
    
    def __init__(self, mappings_directory: str = None):
        """
        Initialize the compliance mapping framework.
        
        Args:
            mappings_directory: Directory containing compliance mapping files.
                               If None, uses default.
        """
        self.mappings: Dict[str, Dict[str, Any]] = {}
        self.mappings_directory = mappings_directory or os.path.join(
            os.path.dirname(os.path.abspath(__file__)), "..", "..", "data", "compliance_mappings"
        )
        self.standards_metadata: Dict[str, Dict[str, Any]] = {}
        self.component_mappings: Dict[str, Dict[str, List[str]]] = {}
        self.load_mappings()
        
    def load_mappings(self) -> None:
        """
        Load all compliance mapping files from the mappings directory.
        """
        logger.info(f"Loading compliance mappings from {self.mappings_directory}")
        if not os.path.exists(self.mappings_directory):
            logger.warning(f"Mappings directory {self.mappings_directory} does not exist")
            os.makedirs(self.mappings_directory, exist_ok=True)
            return
            
        for filename in os.listdir(self.mappings_directory):
            if filename.endswith(".json"):
                mapping_path = os.path.join(self.mappings_directory, filename)
                try:
                    with open(mapping_path, 'r') as f:
                        mapping = json.load(f)
                    
                    # Extract standard name and version
                    standard = mapping.get("standard")
                    version = mapping.get("version")
                    
                    if not standard:
                        logger.warning(f"Skipping mapping file {filename}: missing standard name")
                        continue
                    
                    self.register_mapping(mapping)
                    logger.info(f"Loaded compliance mapping: {standard} (version {version})")
                except Exception as e:
                    logger.error(f"Error loading mapping {filename}: {str(e)}")
    
    def register_mapping(self, mapping: Dict[str, Any]) -> None:
        """
        Register a new compliance mapping or update an existing one.
        
        Args:
            mapping: Compliance mapping definition as a dictionary
        """
        standard = mapping.get("standard")
        version = mapping.get("version", "latest")
        mapping_id = mapping.get("mapping_id")
        
        if not standard or not mapping_id:
            logger.error("Cannot register mapping: missing standard name or mapping_id")
            return
            
        # Store the mapping
        if standard not in self.mappings:
            self.mappings[standard] = {}
            
        self.mappings[standard][version] = mapping
        
        # Store metadata about the standard
        self.standards_metadata[standard] = {
            "name": standard,
            "versions": list(self.mappings[standard].keys()),
            "latest_version": version,
            "description": mapping.get("description", ""),
            "mapping_count": len(self.mappings[standard])
        }
        
        # Build component mappings index for quick lookups
        self._index_component_mappings(mapping)
    
    def _index_component_mappings(self, mapping: Dict[str, Any]) -> None:
        """
        Index component mappings for efficient lookups.
        
        Args:
            mapping: Compliance mapping to index
        """
        standard = mapping.get("standard")
        version = mapping.get("version", "latest")
        
        for control_mapping in mapping.get("mappings", []):
            control_id = control_mapping.get("control_id")
            
            if not control_id:
                continue
                
            # Format as standard:control_id (e.g., "SOC2:CC1.1")
            control_key = f"{standard}:{control_id}"
            
            for component in control_mapping.get("promethios_components", []):
                component_type = component.get("component_type")
                component_id = component.get("component_id")
                
                if not component_type or not component_id:
                    continue
                    
                # Format as type:id (e.g., "policy:pol-1234")
                component_key = f"{component_type}:{component_id}"
                
                # Add to component mappings index
                if component_key not in self.component_mappings:
                    self.component_mappings[component_key] = {}
                    
                if standard not in self.component_mappings[component_key]:
                    self.component_mappings[component_key][standard] = []
                    
                if control_id not in self.component_mappings[component_key][standard]:
                    self.component_mappings[component_key][standard].append(control_id)
    
    def get_mapping(self, standard: str, version: str = None) -> Optional[Dict[str, Any]]:
        """
        Get a compliance mapping by standard and version.
        
        Args:
            standard: Compliance standard name
            version: Version of the standard (if None, returns latest version)
            
        Returns:
            Compliance mapping as a dictionary, or None if not found
        """
        if standard not in self.mappings:
            logger.warning(f"Compliance standard {standard} not found")
            return None
            
        if version is None:
            # Get the latest version
            version = self.get_latest_version(standard)
            
        if version not in self.mappings[standard]:
            logger.warning(f"Version {version} of standard {standard} not found")
            return None
            
        return self.mappings[standard][version]
    
    def get_latest_version(self, standard: str) -> Optional[str]:
        """
        Get the latest version of a compliance standard.
        
        Args:
            standard: Compliance standard name
            
        Returns:
            Latest version string, or None if standard not found
        """
        if standard not in self.standards_metadata:
            return None
        return self.standards_metadata[standard].get("latest_version")
    
    def get_all_standards(self) -> List[str]:
        """
        Get names of all registered compliance standards.
        
        Returns:
            List of standard names
        """
        return list(self.mappings.keys())
    
    def get_standard_versions(self, standard: str) -> List[str]:
        """
        Get all versions of a compliance standard.
        
        Args:
            standard: Compliance standard name
            
        Returns:
            List of version strings, or empty list if standard not found
        """
        if standard not in self.standards_metadata:
            return []
        return self.standards_metadata[standard].get("versions", [])
    
    def get_controls_for_component(self, component_type: str, component_id: str) -> Dict[str, List[str]]:
        """
        Get all compliance controls mapped to a specific component.
        
        Args:
            component_type: Type of component (e.g., "policy", "rule")
            component_id: ID of the component
            
        Returns:
            Dictionary mapping standard names to lists of control IDs
        """
        component_key = f"{component_type}:{component_id}"
        return self.component_mappings.get(component_key, {})
    
    def get_components_for_control(self, standard: str, control_id: str, 
                                  version: str = None) -> List[Dict[str, Any]]:
        """
        Get all components mapped to a specific compliance control.
        
        Args:
            standard: Compliance standard name
            control_id: ID of the control
            version: Version of the standard (if None, uses latest version)
            
        Returns:
            List of component mappings
        """
        mapping = self.get_mapping(standard, version)
        if not mapping:
            return []
            
        for control_mapping in mapping.get("mappings", []):
            if control_mapping.get("control_id") == control_id:
                return control_mapping.get("promethios_components", [])
                
        return []
    
    def validate_mapping(self, mapping: Dict[str, Any]) -> Tuple[bool, List[str]]:
        """
        Validate a compliance mapping against the schema.
        
        Args:
            mapping: Compliance mapping to validate
            
        Returns:
            Tuple of (is_valid, error_messages)
        """
        errors = []
        
        # Check required fields
        required_fields = ["mapping_id", "standard", "version", "mappings"]
        for field in required_fields:
            if field not in mapping:
                errors.append(f"Missing required field: {field}")
                
        if errors:
            return False, errors
            
        # Validate mapping_id format
        mapping_id = mapping.get("mapping_id")
        if not re.match(r"^cmp-[a-zA-Z0-9]{4,}$", mapping_id):
            errors.append(f"Invalid mapping_id format: {mapping_id}")
            
        # Validate mappings array
        mappings = mapping.get("mappings", [])
        if not isinstance(mappings, list):
            errors.append("'mappings' must be an array")
        elif len(mappings) == 0:
            errors.append("'mappings' array cannot be empty")
        else:
            # Validate each control mapping
            for i, control_mapping in enumerate(mappings):
                control_errors = self._validate_control_mapping(control_mapping)
                if control_errors:
                    errors.append(f"Control mapping {i}: {', '.join(control_errors)}")
                    
        return len(errors) == 0, errors
    
    def _validate_control_mapping(self, control_mapping: Dict[str, Any]) -> List[str]:
        """
        Validate a control mapping.
        
        Args:
            control_mapping: Control mapping to validate
            
        Returns:
            List of error messages, or empty list if valid
        """
        errors = []
        
        # Check required fields
        required_fields = ["control_id", "control_name", "promethios_components"]
        for field in required_fields:
            if field not in control_mapping:
                errors.append(f"Missing required field: {field}")
                
        if errors:
            return errors
            
        # Validate promethios_components array
        components = control_mapping.get("promethios_components", [])
        if not isinstance(components, list):
            errors.append("'promethios_components' must be an array")
        elif len(components) == 0:
            errors.append("'promethios_components' array cannot be empty")
        else:
            # Validate each component mapping
            for i, component in enumerate(components):
                component_errors = self._validate_component_mapping(component)
                if component_errors:
                    errors.append(f"Component {i}: {', '.join(component_errors)}")
                    
        return errors
    
    def _validate_component_mapping(self, component: Dict[str, Any]) -> List[str]:
        """
        Validate a component mapping.
        
        Args:
            component: Component mapping to validate
            
        Returns:
            List of error messages, or empty list if valid
        """
        errors = []
        
        # Check required fields
        required_fields = ["component_type", "component_id"]
        for field in required_fields:
            if field not in component:
                errors.append(f"Missing required field: {field}")
                
        if errors:
            return errors
            
        # Validate component_type
        valid_types = ["policy", "rule", "api", "feature", "process", "documentation"]
        component_type = component.get("component_type")
        if component_type not in valid_types:
            errors.append(f"Invalid component_type: {component_type}")
            
        # Validate coverage_percentage if present
        coverage = component.get("coverage_percentage")
        if coverage is not None:
            if not isinstance(coverage, (int, float)):
                errors.append("coverage_percentage must be a number")
            elif coverage < 0 or coverage > 100:
                errors.append("coverage_percentage must be between 0 and 100")
                
        return errors
    
    def save_mapping(self, mapping: Dict[str, Any]) -> bool:
        """
        Save a compliance mapping to file.
        
        Args:
            mapping: Compliance mapping to save
            
        Returns:
            True if successful, False otherwise
        """
        # Validate the mapping first
        is_valid, errors = self.validate_mapping(mapping)
        if not is_valid:
            logger.error(f"Cannot save invalid mapping: {', '.join(errors)}")
            return False
            
        standard = mapping.get("standard")
        version = mapping.get("version", "latest")
        mapping_id = mapping.get("mapping_id")
        
        # Ensure mappings directory exists
        os.makedirs(self.mappings_directory, exist_ok=True)
        
        # Save to file
        filename = f"{mapping_id}.json"
        filepath = os.path.join(self.mappings_directory, filename)
        
        try:
            with open(filepath, 'w') as f:
                json.dump(mapping, f, indent=2)
            
            # Register the mapping
            self.register_mapping(mapping)
            logger.info(f"Saved compliance mapping: {standard} (version {version})")
            return True
        except Exception as e:
            logger.error(f"Error saving mapping {filename}: {str(e)}")
            return False
    
    def generate_compliance_report(self, standard: str, version: str = None) -> Dict[str, Any]:
        """
        Generate a compliance report for a specific standard.
        
        Args:
            standard: Compliance standard name
            version: Version of the standard (if None, uses latest version)
            
        Returns:
            Compliance report as a dictionary
        """
        mapping = self.get_mapping(standard, version)
        if not mapping:
            return {
                "standard": standard,
                "version": version,
                "error": f"Mapping not found for {standard} (version {version})"
            }
            
        # Initialize report
        report = {
            "standard": standard,
            "version": version or self.get_latest_version(standard),
            "generated_at": datetime.now().isoformat(),
            "total_controls": len(mapping.get("mappings", [])),
            "controls_coverage": {},
            "components_coverage": {}
        }
        
        # Calculate coverage statistics
        total_components = 0
        covered_components = set()
        
        for control_mapping in mapping.get("mappings", []):
            control_id = control_mapping.get("control_id")
            components = control_mapping.get("promethios_components", [])
            
            # Add to controls coverage
            report["controls_coverage"][control_id] = {
                "component_count": len(components),
                "components": [f"{c.get('component_type')}:{c.get('component_id')}" for c in components]
            }
            
            # Add to components coverage
            for component in components:
                component_type = component.get("component_type")
                component_id = component.get("component_id")
                component_key = f"{component_type}:{component_id}"
                
                if component_key not in report["components_coverage"]:
                    report["components_coverage"][component_key] = {
                        "controls": []
                    }
                    
                report["components_coverage"][component_key]["controls"].append(control_id)
                covered_components.add(component_key)
                
            total_components += len(components)
            
        # Add summary statistics
        report["summary"] = {
            "total_controls": len(mapping.get("mappings", [])),
            "total_component_mappings": total_components,
            "unique_components": len(covered_components),
            "average_components_per_control": total_components / max(1, len(mapping.get("mappings", [])))
        }
        
        return report
    
    def find_gaps(self, standard: str, version: str = None) -> Dict[str, Any]:
        """
        Find gaps in compliance coverage.
        
        Args:
            standard: Compliance standard name
            version: Version of the standard (if None, uses latest version)
            
        Returns:
            Gap analysis report as a dictionary
        """
        mapping = self.get_mapping(standard, version)
        if not mapping:
            return {
                "standard": standard,
                "version": version,
                "error": f"Mapping not found for {standard} (version {version})"
            }
            
        # Initialize gap report
        gap_report = {
            "standard": standard,
            "version": version or self.get_latest_version(standard),
            "generated_at": datetime.now().isoformat(),
            "unmapped_controls": [],
            "partially_mapped_controls": [],
            "fully_mapped_controls": []
        }
        
        # Analyze each control
        for control_mapping in mapping.get("mappings", []):
            control_id = control_mapping.get("control_id")
            control_name = control_mapping.get("control_name")
            components = control_mapping.get("promethios_components", [])
            
            control_info = {
                "control_id": control_id,
                "control_name": control_name
            }
            
            if not components:
                # Unmapped control
                gap_report["unmapped_controls"].append(control_info)
            else:
                # Check if any component has less than 100% coverage
                partial = False
                for component in components:
                    coverage = component.get("coverage_percentage")
                    if coverage is not None and coverage < 100:
                        partial = True
                        break
                        
                if partial:
                    control_info["components"] = components
                    gap_report["partially_mapped_controls"].append(control_info)
                else:
                    control_info["components"] = components
                    gap_report["fully_mapped_controls"].append(control_info)
                    
        # Add summary statistics
        total_controls = len(mapping.get("mappings", []))
        gap_report["summary"] = {
            "total_controls": total_controls,
            "unmapped_count": len(gap_report["unmapped_controls"]),
            "partially_mapped_count": len(gap_report["partially_mapped_controls"]),
            "fully_mapped_count": len(gap_report["fully_mapped_controls"]),
            "unmapped_percentage": 100 * len(gap_report["unmapped_controls"]) / max(1, total_controls),
            "partially_mapped_percentage": 100 * len(gap_report["partially_mapped_controls"]) / max(1, total_controls),
            "fully_mapped_percentage": 100 * len(gap_report["fully_mapped_controls"]) / max(1, total_controls)
        }
        
        return gap_report
    
    def export_mapping(self, standard: str, version: str = None, format: str = "json") -> Optional[str]:
        """
        Export a compliance mapping to a string in the specified format.
        
        Args:
            standard: Compliance standard name
            version: Version of the standard (if None, uses latest version)
            format: Output format ("json" or "csv")
            
        Returns:
            Mapping as a string, or None if not found
        """
        mapping = self.get_mapping(standard, version)
        if not mapping:
            return None
            
        if format.lower() == "json":
            return json.dumps(mapping, indent=2)
        elif format.lower() == "csv":
            # Generate CSV representation
            csv_lines = ["standard,version,control_id,control_name,component_type,component_id,coverage"]
            
            for control_mapping in mapping.get("mappings", []):
                control_id = control_mapping.get("control_id")
                control_name = control_mapping.get("control_name", "").replace(",", ";")
                
                for component in control_mapping.get("promethios_components", []):
                    component_type = component.get("component_type")
                    component_id = component.get("component_id")
                    coverage = component.get("coverage_percentage", 100)
                    
                    csv_lines.append(f"{standard},{version},{control_id},{control_name},{component_type},{component_id},{coverage}")
                    
            return "\n".join(csv_lines)
        else:
            logger.error(f"Unsupported format: {format}")
            return None

# For backward compatibility with legacy code
ComplianceFramework = ComplianceMappingFramework

# Singleton instance for global access
_framework = None

def get_framework():
    """Get the singleton instance of the compliance mapping framework."""
    global _framework
    if _framework is None:
        _framework = ComplianceMappingFramework()
    return _framework
