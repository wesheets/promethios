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

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

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
            "mapped_components": {},
            "coverage_by_control": {},
            "overall_coverage": 0.0,
            "gaps": []
        }
        
        # Analyze control coverage
        total_coverage = 0.0
        for control_mapping in mapping.get("mappings", []):
            control_id = control_mapping.get("control_id")
            components = control_mapping.get("promethios_components", [])
            
            # Calculate control coverage
            if not components:
                coverage = 0.0
                report["gaps"].append({
                    "control_id": control_id,
                    "control_name": control_mapping.get("control_name"),
                    "reason": "No components mapped"
                })
            else:
                # If components have coverage_percentage, use weighted average
                coverage_values = [c.get("coverage_percentage", 100) for c in components]
                if any(cv < 100 for cv in coverage_values):
                    coverage = sum(coverage_values) / len(components)
                else:
                    coverage = 100.0
                    
                # Check for partial coverage
                if coverage < 100.0:
                    report["gaps"].append({
                        "control_id": control_id,
                        "control_name": control_mapping.get("control_name"),
                        "reason": f"Partial coverage ({coverage:.1f}%)"
                    })
            
            report["coverage_by_control"][control_id] = coverage
            total_coverage += coverage
            
            # Track components by type
            for component in components:
                component_type = component.get("component_type")
                if component_type not in report["mapped_components"]:
                    report["mapped_components"][component_type] = 0
                report["mapped_components"][component_type] += 1
        
        # Calculate overall coverage
        if report["total_controls"] > 0:
            report["overall_coverage"] = total_coverage / report["total_controls"]
            
        return report
    
    def generate_component_compliance_report(self, component_type: str, 
                                           component_id: str) -> Dict[str, Any]:
        """
        Generate a compliance report for a specific component.
        
        Args:
            component_type: Type of component (e.g., "policy", "rule")
            component_id: ID of the component
            
        Returns:
            Compliance report as a dictionary
        """
        component_key = f"{component_type}:{component_id}"
        controls = self.component_mappings.get(component_key, {})
        
        if not controls:
            return {
                "component_type": component_type,
                "component_id": component_id,
                "error": f"No compliance mappings found for {component_key}"
            }
            
        # Initialize report
        report = {
            "component_type": component_type,
            "component_id": component_id,
            "generated_at": datetime.now().isoformat(),
            "standards": {},
            "total_controls": 0
        }
        
        # Analyze standards and controls
        for standard, control_ids in controls.items():
            report["standards"][standard] = {
                "control_count": len(control_ids),
                "controls": control_ids
            }
            report["total_controls"] += len(control_ids)
            
        return report
    
    def map_component_to_control(self, standard: str, control_id: str, 
                               component_type: str, component_id: str,
                               coverage_percentage: float = 100.0,
                               implementation_details: str = None,
                               version: str = None) -> bool:
        """
        Map a component to a compliance control.
        
        Args:
            standard: Compliance standard name
            control_id: ID of the control
            component_type: Type of component (e.g., "policy", "rule")
            component_id: ID of the component
            coverage_percentage: Percentage of the control covered by this component
            implementation_details: Details of how this component implements the control
            version: Version of the standard (if None, uses latest version)
            
        Returns:
            True if successful, False otherwise
        """
        mapping = self.get_mapping(standard, version)
        if not mapping:
            logger.error(f"Mapping not found for {standard} (version {version})")
            return False
            
        # Find the control mapping
        control_mapping = None
        for cm in mapping.get("mappings", []):
            if cm.get("control_id") == control_id:
                control_mapping = cm
                break
                
        if not control_mapping:
            logger.error(f"Control {control_id} not found in {standard} mapping")
            return False
            
        # Create component mapping
        component = {
            "component_type": component_type,
            "component_id": component_id,
            "coverage_percentage": coverage_percentage
        }
        
        if implementation_details:
            component["implementation_details"] = implementation_details
            
        # Add component name if available based on component type
        if component_type == "policy":
            component["component_name"] = f"Policy {component_id}"
        elif component_type == "rule":
            component["component_name"] = f"Rule {component_id}"
        elif component_type == "api":
            component["component_name"] = f"API {component_id}"
        
        # Check if component already exists
        components = control_mapping.get("promethios_components", [])
        for i, existing in enumerate(components):
            if (existing.get("component_type") == component_type and 
                existing.get("component_id") == component_id):
                # Update existing component
                components[i] = component
                break
        else:
            # Add new component
            if "promethios_components" not in control_mapping:
                control_mapping["promethios_components"] = []
            control_mapping["promethios_components"].append(component)
            
        # Update mapping
        self.register_mapping(mapping)
        
        # Save to file
        return self.save_mapping(mapping)
    
    def remove_component_from_control(self, standard: str, control_id: str,
                                    component_type: str, component_id: str,
                                    version: str = None) -> bool:
        """
        Remove a component mapping from a compliance control.
        
        Args:
            standard: Compliance standard name
            control_id: ID of the control
            component_type: Type of component (e.g., "policy", "rule")
            component_id: ID of the component
            version: Version of the standard (if None, uses latest version)
            
        Returns:
            True if successful, False otherwise
        """
        mapping = self.get_mapping(standard, version)
        if not mapping:
            logger.error(f"Mapping not found for {standard} (version {version})")
            return False
            
        # Find the control mapping
        control_mapping = None
        for cm in mapping.get("mappings", []):
            if cm.get("control_id") == control_id:
                control_mapping = cm
                break
                
        if not control_mapping:
            logger.error(f"Control {control_id} not found in {standard} mapping")
            return False
            
        # Remove component
        components = control_mapping.get("promethios_components", [])
        for i, existing in enumerate(components):
            if (existing.get("component_type") == component_type and 
                existing.get("component_id") == component_id):
                components.pop(i)
                break
        else:
            logger.warning(f"Component {component_type}:{component_id} not found in control {control_id}")
            return False
            
        # Update mapping
        self.register_mapping(mapping)
        
        # Save to file
        return self.save_mapping(mapping)
    
    def create_standard_mapping(self, standard: str, version: str,
                              description: str = None) -> Dict[str, Any]:
        """
        Create a new compliance standard mapping.
        
        Args:
            standard: Compliance standard name
            version: Version of the standard
            description: Description of the standard
            
        Returns:
            New mapping as a dictionary
        """
        # Generate mapping ID
        mapping_id = f"cmp-{standard.lower()}{version.replace('.', '')}"
        
        # Create mapping
        mapping = {
            "mapping_id": mapping_id,
            "standard": standard,
            "version": version,
            "description": description or f"{standard} version {version} compliance mapping",
            "mappings": [],
            "metadata": {
                "created_at": datetime.now().isoformat(),
                "created_by": "compliance_mapping_framework"
            }
        }
        
        return mapping
    
    def add_control_to_mapping(self, mapping: Dict[str, Any], control_id: str,
                             control_name: str, control_description: str = None) -> Dict[str, Any]:
        """
        Add a control to a compliance mapping.
        
        Args:
            mapping: Compliance mapping to update
            control_id: ID of the control
            control_name: Name of the control
            control_description: Description of the control
            
        Returns:
            Updated mapping
        """
        # Check if control already exists
        for control in mapping.get("mappings", []):
            if control.get("control_id") == control_id:
                logger.warning(f"Control {control_id} already exists in mapping")
                return mapping
                
        # Create control
        control = {
            "control_id": control_id,
            "control_name": control_name,
            "promethios_components": []
        }
        
        if control_description:
            control["control_description"] = control_description
            
        # Add to mapping
        if "mappings" not in mapping:
            mapping["mappings"] = []
        mapping["mappings"].append(control)
        
        return mapping
    
    def import_mapping_from_file(self, filepath: str) -> bool:
        """
        Import a compliance mapping from a file.
        
        Args:
            filepath: Path to the mapping file
            
        Returns:
            True if successful, False otherwise
        """
        try:
            with open(filepath, 'r') as f:
                mapping = json.load(f)
                
            # Validate the mapping
            is_valid, errors = self.validate_mapping(mapping)
            if not is_valid:
                logger.error(f"Invalid mapping in {filepath}: {', '.join(errors)}")
                return False
                
            # Register and save the mapping
            self.register_mapping(mapping)
            return self.save_mapping(mapping)
        except Exception as e:
            logger.error(f"Error importing mapping from {filepath}: {str(e)}")
            return False
    
    def export_mapping_to_file(self, standard: str, filepath: str,
                             version: str = None, format: str = "json") -> bool:
        """
        Export a compliance mapping to a file.
        
        Args:
            standard: Compliance standard name
            filepath: Path to save the mapping file
            version: Version of the standard (if None, uses latest version)
            format: Output format ("json" or "yaml")
            
        Returns:
            True if successful, False otherwise
        """
        mapping = self.get_mapping(standard, version)
        if not mapping:
            logger.error(f"Mapping not found for {standard} (version {version})")
            return False
            
        try:
            if format.lower() == "json":
                with open(filepath, 'w') as f:
                    json.dump(mapping, f, indent=2)
            elif format.lower() == "yaml":
                try:
                    import yaml
                    with open(filepath, 'w') as f:
                        yaml.dump(mapping, f)
                except ImportError:
                    logger.error("PyYAML not installed, falling back to JSON")
                    with open(filepath, 'w') as f:
                        json.dump(mapping, f, indent=2)
            else:
                logger.error(f"Unsupported format: {format}")
                return False
                
            logger.info(f"Exported {standard} mapping to {filepath}")
            return True
        except Exception as e:
            logger.error(f"Error exporting mapping to {filepath}: {str(e)}")
            return False
    
    def analyze_compliance_gaps(self, standard: str, version: str = None) -> Dict[str, Any]:
        """
        Analyze compliance gaps for a specific standard.
        
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
            
        # Initialize report
        report = {
            "standard": standard,
            "version": version or self.get_latest_version(standard),
            "generated_at": datetime.now().isoformat(),
            "total_controls": len(mapping.get("mappings", [])),
            "unmapped_controls": [],
            "partially_mapped_controls": [],
            "fully_mapped_controls": [],
            "coverage_summary": {
                "unmapped_count": 0,
                "partially_mapped_count": 0,
                "fully_mapped_count": 0,
                "overall_coverage_percentage": 0.0
            }
        }
        
        # Analyze control coverage
        total_coverage = 0.0
        for control_mapping in mapping.get("mappings", []):
            control_id = control_mapping.get("control_id")
            control_name = control_mapping.get("control_name")
            components = control_mapping.get("promethios_components", [])
            
            control_info = {
                "control_id": control_id,
                "control_name": control_name
            }
            
            # Calculate control coverage
            if not components:
                coverage = 0.0
                report["unmapped_controls"].append(control_info)
            else:
                # If components have coverage_percentage, use weighted average
                coverage_values = [c.get("coverage_percentage", 100) for c in components]
                coverage = sum(coverage_values) / len(components)
                
                if coverage < 100.0:
                    control_info["coverage_percentage"] = coverage
                    control_info["mapped_components"] = len(components)
                    report["partially_mapped_controls"].append(control_info)
                else:
                    control_info["mapped_components"] = len(components)
                    report["fully_mapped_controls"].append(control_info)
                    
            total_coverage += coverage
            
        # Update coverage summary
        report["coverage_summary"]["unmapped_count"] = len(report["unmapped_controls"])
        report["coverage_summary"]["partially_mapped_count"] = len(report["partially_mapped_controls"])
        report["coverage_summary"]["fully_mapped_count"] = len(report["fully_mapped_controls"])
        
        if report["total_controls"] > 0:
            report["coverage_summary"]["overall_coverage_percentage"] = (
                total_coverage / report["total_controls"]
            )
            
        return report
    
    def get_compliance_status(self, component_type: str, component_id: str) -> Dict[str, Any]:
        """
        Get compliance status for a specific component.
        
        Args:
            component_type: Type of component (e.g., "policy", "rule")
            component_id: ID of the component
            
        Returns:
            Compliance status as a dictionary
        """
        component_key = f"{component_type}:{component_id}"
        controls = self.component_mappings.get(component_key, {})
        
        status = {
            "component_type": component_type,
            "component_id": component_id,
            "compliant_with": [],
            "standards_count": len(controls),
            "controls_count": sum(len(ids) for ids in controls.values())
        }
        
        for standard, control_ids in controls.items():
            status["compliant_with"].append({
                "standard": standard,
                "version": self.get_latest_version(standard),
                "controls": control_ids,
                "controls_count": len(control_ids)
            })
            
        return status


# Singleton instance
_framework_instance = None

def get_framework() -> ComplianceMappingFramework:
    """
    Get the singleton instance of the compliance mapping framework.
    
    Returns:
        ComplianceMappingFramework instance
    """
    global _framework_instance
    if _framework_instance is None:
        _framework_instance = ComplianceMappingFramework()
    return _framework_instance
