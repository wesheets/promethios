"""
Governance Health Reporter for the Governance Visualization framework.

This module provides functionality to generate health reports for the governance system,
identifying issues, anomalies, and providing recommendations for improvement.

It integrates with:
- Governance Attestation Framework (5.10)
- Minimal Viable Governance (5.11)
- Governance Expansion Protocol (5.12)
- Trust Boundary Definition (5.13)
"""

import json
import logging
from typing import Dict, List, Any, Optional, Union
import datetime

# Import necessary components from previous phases
from src.core.governance.attestation_service import AttestationService
from src.core.governance.governance_audit_trail import GovernanceAuditTrail
from src.core.governance.policy_management_module import PolicyManagementModule
from src.core.governance.requirement_validation_module import RequirementValidationModule
from src.core.trust.boundary_integrity_verifier import BoundaryIntegrityVerifier
from src.core.visualization.visualization_data_transformer import VisualizationDataTransformer

class GovernanceHealthReporter:
    """
    Generates health reports for the governance system.
    
    Integrates with:
    - Governance Attestation Framework (5.10)
    - Minimal Viable Governance (5.11)
    - Governance Expansion Protocol (5.12)
    - Trust Boundary Definition (5.13)
    """
    
    def __init__(self, 
                 attestation_service: Optional[AttestationService] = None,
                 governance_audit_trail: Optional[GovernanceAuditTrail] = None,
                 policy_manager: Optional[PolicyManagementModule] = None,
                 requirement_validator: Optional[RequirementValidationModule] = None,
                 boundary_integrity_verifier: Optional[BoundaryIntegrityVerifier] = None,
                 data_transformer: Optional[VisualizationDataTransformer] = None):
        """
        Initialize the GovernanceHealthReporter.
        
        Args:
            attestation_service: AttestationService for accessing attestation data
            governance_audit_trail: GovernanceAuditTrail for accessing audit data
            policy_manager: PolicyManagementModule for accessing policy data
            requirement_validator: RequirementValidationModule for accessing requirement data
            boundary_integrity_verifier: BoundaryIntegrityVerifier for accessing boundary integrity data
            data_transformer: VisualizationDataTransformer for transforming data
        """
        self.logger = logging.getLogger(__name__)
        self.attestation_service = attestation_service
        self.governance_audit_trail = governance_audit_trail
        self.policy_manager = policy_manager
        self.requirement_validator = requirement_validator
        self.boundary_integrity_verifier = boundary_integrity_verifier
        self.data_transformer = data_transformer or VisualizationDataTransformer()
        
        # Define health thresholds
        self.health_thresholds = {
            "attestation_validity": 0.8,  # Minimum acceptable attestation validity
            "policy_compliance": 0.9,     # Minimum acceptable policy compliance
            "requirement_compliance": 0.95,  # Minimum acceptable requirement compliance
            "boundary_integrity": 0.85,   # Minimum acceptable boundary integrity
            "audit_trail_integrity": 0.99,  # Minimum acceptable audit trail integrity
            "critical_issues_threshold": 3,  # Maximum acceptable critical issues
            "major_issues_threshold": 5,    # Maximum acceptable major issues
            "minor_issues_threshold": 10    # Maximum acceptable minor issues
        }
        
    def generate_health_report(self, 
                              include_attestation: bool = True,
                              include_policy: bool = True,
                              include_requirement: bool = True,
                              include_boundary: bool = True,
                              include_audit: bool = True) -> Dict[str, Any]:
        """
        Generates a comprehensive health report for the governance system.
        
        Args:
            include_attestation: Whether to include attestation health
            include_policy: Whether to include policy health
            include_requirement: Whether to include requirement health
            include_boundary: Whether to include boundary health
            include_audit: Whether to include audit trail health
            
        Returns:
            dict: Structured health report
        """
        self.logger.info("Generating governance health report")
        
        # Initialize health report structure
        report = {
            "timestamp": datetime.datetime.now().isoformat(),
            "version": "1.0.0",
            "overall_health": {
                "score": 0.0,
                "status": "unknown",
                "issues": {
                    "critical": 0,
                    "major": 0,
                    "minor": 0
                }
            },
            "components": {}
        }
        
        # Collect health data for each component
        component_scores = []
        
        # Collect attestation health if available and requested
        if include_attestation and self.attestation_service:
            attestation_health = self._assess_attestation_health()
            report["components"]["attestation"] = attestation_health
            component_scores.append(attestation_health["score"])
            
            # Add issues to overall count
            report["overall_health"]["issues"]["critical"] += attestation_health["issues"]["critical"]
            report["overall_health"]["issues"]["major"] += attestation_health["issues"]["major"]
            report["overall_health"]["issues"]["minor"] += attestation_health["issues"]["minor"]
        
        # Collect policy health if available and requested
        if include_policy and self.policy_manager:
            policy_health = self._assess_policy_health()
            report["components"]["policy"] = policy_health
            component_scores.append(policy_health["score"])
            
            # Add issues to overall count
            report["overall_health"]["issues"]["critical"] += policy_health["issues"]["critical"]
            report["overall_health"]["issues"]["major"] += policy_health["issues"]["major"]
            report["overall_health"]["issues"]["minor"] += policy_health["issues"]["minor"]
        
        # Collect requirement health if available and requested
        if include_requirement and self.requirement_validator:
            requirement_health = self._assess_requirement_health()
            report["components"]["requirement"] = requirement_health
            component_scores.append(requirement_health["score"])
            
            # Add issues to overall count
            report["overall_health"]["issues"]["critical"] += requirement_health["issues"]["critical"]
            report["overall_health"]["issues"]["major"] += requirement_health["issues"]["major"]
            report["overall_health"]["issues"]["minor"] += requirement_health["issues"]["minor"]
        
        # Collect boundary health if available and requested
        if include_boundary and self.boundary_integrity_verifier:
            boundary_health = self._assess_boundary_health()
            report["components"]["boundary"] = boundary_health
            component_scores.append(boundary_health["score"])
            
            # Add issues to overall count
            report["overall_health"]["issues"]["critical"] += boundary_health["issues"]["critical"]
            report["overall_health"]["issues"]["major"] += boundary_health["issues"]["major"]
            report["overall_health"]["issues"]["minor"] += boundary_health["issues"]["minor"]
        
        # Collect audit trail health if available and requested
        if include_audit and self.governance_audit_trail:
            audit_health = self._assess_audit_trail_health()
            report["components"]["audit"] = audit_health
            component_scores.append(audit_health["score"])
            
            # Add issues to overall count
            report["overall_health"]["issues"]["critical"] += audit_health["issues"]["critical"]
            report["overall_health"]["issues"]["major"] += audit_health["issues"]["major"]
            report["overall_health"]["issues"]["minor"] += audit_health["issues"]["minor"]
        
        # Calculate overall health score (average of component scores)
        if component_scores:
            report["overall_health"]["score"] = sum(component_scores) / len(component_scores)
        
        # Determine overall health status
        report["overall_health"]["status"] = self._determine_health_status(
            report["overall_health"]["score"],
            report["overall_health"]["issues"]["critical"],
            report["overall_health"]["issues"]["major"],
            report["overall_health"]["issues"]["minor"]
        )
        
        # Add recommendations based on issues
        report["recommendations"] = self._generate_recommendations(report)
        
        # Transform data for visualization
        visualization_data = self.data_transformer.transform_health_report(report)
        
        return visualization_data
    
    def generate_issue_report(self, 
                             severity: Optional[str] = None,
                             component_type: Optional[str] = None) -> Dict[str, Any]:
        """
        Generates a detailed report of governance issues.
        
        Args:
            severity: Optional filter for issue severity (critical, major, minor)
            component_type: Optional filter for component type
            
        Returns:
            dict: Structured issue report
        """
        self.logger.info(f"Generating governance issue report for severity: {severity}, component: {component_type}")
        
        # Initialize issue report structure
        report = {
            "timestamp": datetime.datetime.now().isoformat(),
            "version": "1.0.0",
            "filters": {
                "severity": severity,
                "component_type": component_type
            },
            "issues": []
        }
        
        # Collect issues from each component based on filters
        all_issues = []
        
        # Collect attestation issues if available
        if self.attestation_service and (not component_type or component_type == "attestation"):
            attestation_issues = self._collect_attestation_issues()
            all_issues.extend(attestation_issues)
        
        # Collect policy issues if available
        if self.policy_manager and (not component_type or component_type == "policy"):
            policy_issues = self._collect_policy_issues()
            all_issues.extend(policy_issues)
        
        # Collect requirement issues if available
        if self.requirement_validator and (not component_type or component_type == "requirement"):
            requirement_issues = self._collect_requirement_issues()
            all_issues.extend(requirement_issues)
        
        # Collect boundary issues if available
        if self.boundary_integrity_verifier and (not component_type or component_type == "boundary"):
            boundary_issues = self._collect_boundary_issues()
            all_issues.extend(boundary_issues)
        
        # Collect audit trail issues if available
        if self.governance_audit_trail and (not component_type or component_type == "audit"):
            audit_issues = self._collect_audit_trail_issues()
            all_issues.extend(audit_issues)
        
        # Filter issues by severity if specified
        if severity:
            all_issues = [issue for issue in all_issues if issue["severity"] == severity]
        
        # Sort issues by severity (critical first, then major, then minor)
        severity_order = {"critical": 0, "major": 1, "minor": 2}
        all_issues.sort(key=lambda x: severity_order.get(x["severity"], 3))
        
        report["issues"] = all_issues
        report["total_issues"] = len(all_issues)
        report["issue_counts"] = {
            "critical": len([i for i in all_issues if i["severity"] == "critical"]),
            "major": len([i for i in all_issues if i["severity"] == "major"]),
            "minor": len([i for i in all_issues if i["severity"] == "minor"])
        }
        
        # Transform data for visualization
        visualization_data = self.data_transformer.transform_issue_report(report)
        
        return visualization_data
    
    def generate_compliance_report(self, 
                                  compliance_type: Optional[str] = None) -> Dict[str, Any]:
        """
        Generates a compliance report for governance requirements.
        
        Args:
            compliance_type: Optional filter for compliance type
            
        Returns:
            dict: Structured compliance report
        """
        self.logger.info(f"Generating governance compliance report for type: {compliance_type}")
        
        # Initialize compliance report structure
        report = {
            "timestamp": datetime.datetime.now().isoformat(),
            "version": "1.0.0",
            "filter": {
                "compliance_type": compliance_type
            },
            "overall_compliance": 0.0,
            "compliance_by_type": {},
            "non_compliant_items": []
        }
        
        # Collect compliance data
        compliance_scores = []
        
        # Collect policy compliance if available
        if self.policy_manager and (not compliance_type or compliance_type == "policy"):
            policy_compliance = self._assess_policy_compliance()
            report["compliance_by_type"]["policy"] = policy_compliance
            compliance_scores.append(policy_compliance["overall_score"])
            report["non_compliant_items"].extend(policy_compliance["non_compliant_items"])
        
        # Collect requirement compliance if available
        if self.requirement_validator and (not compliance_type or compliance_type == "requirement"):
            requirement_compliance = self._assess_requirement_compliance()
            report["compliance_by_type"]["requirement"] = requirement_compliance
            compliance_scores.append(requirement_compliance["overall_score"])
            report["non_compliant_items"].extend(requirement_compliance["non_compliant_items"])
        
        # Collect attestation compliance if available
        if self.attestation_service and (not compliance_type or compliance_type == "attestation"):
            attestation_compliance = self._assess_attestation_compliance()
            report["compliance_by_type"]["attestation"] = attestation_compliance
            compliance_scores.append(attestation_compliance["overall_score"])
            report["non_compliant_items"].extend(attestation_compliance["non_compliant_items"])
        
        # Collect boundary compliance if available
        if self.boundary_integrity_verifier and (not compliance_type or compliance_type == "boundary"):
            boundary_compliance = self._assess_boundary_compliance()
            report["compliance_by_type"]["boundary"] = boundary_compliance
            compliance_scores.append(boundary_compliance["overall_score"])
            report["non_compliant_items"].extend(boundary_compliance["non_compliant_items"])
        
        # Calculate overall compliance score (average of component scores)
        if compliance_scores:
            report["overall_compliance"] = sum(compliance_scores) / len(compliance_scores)
        
        # Sort non-compliant items by compliance score (lowest first)
        report["non_compliant_items"].sort(key=lambda x: x.get("compliance_score", 0))
        
        # Transform data for visualization
        visualization_data = self.data_transformer.transform_compliance_report(report)
        
        return visualization_data
    
    def generate_governance_anomaly_report(self, 
                                          time_period: str = "daily") -> Dict[str, Any]:
        """
        Generates a report of anomalies in governance metrics.
        
        Args:
            time_period: Time period for anomaly detection (hourly, daily, weekly, monthly)
            
        Returns:
            dict: Structured anomaly report
        """
        self.logger.info(f"Generating governance anomaly report for period: {time_period}")
        
        # Determine date range based on time period
        end_date = datetime.datetime.now()
        if time_period == "hourly":
            start_date = end_date - datetime.timedelta(hours=24)
            interval = "hour"
        elif time_period == "daily":
            start_date = end_date - datetime.timedelta(days=30)
            interval = "day"
        elif time_period == "weekly":
            start_date = end_date - datetime.timedelta(weeks=12)
            interval = "week"
        elif time_period == "monthly":
            start_date = end_date - datetime.timedelta(days=365)
            interval = "month"
        else:
            start_date = end_date - datetime.timedelta(days=30)  # Default to daily
            interval = "day"
        
        # Initialize anomaly report structure
        report = {
            "timestamp": datetime.datetime.now().isoformat(),
            "version": "1.0.0",
            "time_period": time_period,
            "interval": interval,
            "start_date": start_date.isoformat(),
            "end_date": end_date.isoformat(),
            "anomalies": []
        }
        
        # Collect anomalies from each component
        
        # Collect attestation anomalies if available
        if self.attestation_service:
            attestation_anomalies = self._detect_attestation_anomalies(start_date, end_date, interval)
            report["anomalies"].extend(attestation_anomalies)
        
        # Collect policy anomalies if available
        if self.policy_manager:
            policy_anomalies = self._detect_policy_anomalies(start_date, end_date, interval)
            report["anomalies"].extend(policy_anomalies)
        
        # Collect requirement anomalies if available
        if self.requirement_validator:
            requirement_anomalies = self._detect_requirement_anomalies(start_date, end_date, interval)
            report["anomalies"].extend(requirement_anomalies)
        
        # Collect boundary anomalies if available
        if self.boundary_integrity_verifier:
            boundary_anomalies = self._detect_boundary_anomalies(start_date, end_date, interval)
            report["anomalies"].extend(boundary_anomalies)
        
        # Collect audit trail anomalies if available
        if self.governance_audit_trail:
            audit_anomalies = self._detect_audit_trail_anomalies(start_date, end_date, interval)
            report["anomalies"].extend(audit_anomalies)
        
        # Sort anomalies by severity and timestamp
        severity_order = {"critical": 0, "major": 1, "minor": 2}
        report["anomalies"].sort(key=lambda x: (severity_order.get(x["severity"], 3), x["timestamp"]))
        
        report["total_anomalies"] = len(report["anomalies"])
        report["anomaly_counts"] = {
            "critical": len([a for a in report["anomalies"] if a["severity"] == "critical"]),
            "major": len([a for a in report["anomalies"] if a["severity"] == "major"]),
            "minor": len([a for a in report["anomalies"] if a["severity"] == "minor"])
        }
        
        # Transform data for visualization
        visualization_data = self.data_transformer.transform_anomaly_report(report)
        
        return visualization_data
    
    def _assess_attestation_health(self) -> Dict[str, Any]:
        """
        Assesses the health of the attestation system.
        
        Returns:
            dict: Attestation health assessment
        """
        health = {
            "score": 0.0,
            "status": "unknown",
            "issues": {
                "critical": 0,
                "major": 0,
                "minor": 0
            },
            "metrics": {}
        }
        
        try:
            if self.attestation_service:
                # Get attestation metrics
                metrics = self.attestation_service.get_system_metrics()
                
                # Extract key metrics
                validity = metrics.get("average_validity", 0)
                expired_attestations = metrics.get("expired_attestations", 0)
                failed_verifications = metrics.get("failed_verifications", 0)
                missing_attestations = metrics.get("missing_attestations", 0)
                
                # Store metrics in health report
                health["metrics"] = {
                    "validity": validity,
                    "expired_attestations": expired_attestations,
                    "failed_verifications": failed_verifications,
                    "missing_attestations": missing_attestations,
                    "total_attestations": metrics.get("total_attestations", 0),
                    "total_verifications": metrics.get("total_verifications", 0)
                }
                
                # Identify issues
                if validity < self.health_thresholds["attestation_validity"]:
                    if validity < 0.5:
                        health["issues"]["critical"] += 1
                        health["issue_details"] = health.get("issue_details", [])
                        health["issue_details"].append({
                            "severity": "critical",
                            "type": "attestation_validity",
                            "description": f"Attestation validity is critically low ({validity:.2f})",
                            "recommendation": "Investigate and renew attestations immediately"
                        })
                    else:
                        health["issues"]["major"] += 1
                        health["issue_details"] = health.get("issue_details", [])
                        health["issue_details"].append({
                            "severity": "major",
                            "type": "attestation_validity",
                            "description": f"Attestation validity is below threshold ({validity:.2f})",
                            "recommendation": "Review and renew attestations"
                        })
                
                if expired_attestations > 0:
                    if expired_attestations > 10:
                        health["issues"]["major"] += 1
                        health["issue_details"] = health.get("issue_details", [])
                        health["issue_details"].append({
                            "severity": "major",
                            "type": "expired_attestations",
                            "description": f"High number of expired attestations ({expired_attestations})",
                            "recommendation": "Renew expired attestations"
                        })
                    else:
                        health["issues"]["minor"] += 1
                        health["issue_details"] = health.get("issue_details", [])
                        health["issue_details"].append({
                            "severity": "minor",
                            "type": "expired_attestations",
                            "description": f"Some attestations have expired ({expired_attestations})",
                            "recommendation": "Review and renew expired attestations"
                        })
                
                if failed_verifications > 0:
                    if failed_verifications > 5:
                        health["issues"]["critical"] += 1
                        health["issue_details"] = health.get("issue_details", [])
                        health["issue_details"].append({
                            "severity": "critical",
                            "type": "failed_verifications",
                            "description": f"High number of failed verifications ({failed_verifications})",
                            "recommendation": "Investigate verification failures immediately"
                        })
                    else:
                        health["issues"]["major"] += 1
                        health["issue_details"] = health.get("issue_details", [])
                        health["issue_details"].append({
                            "severity": "major",
                            "type": "failed_verifications",
                            "description": f"Some verifications have failed ({failed_verifications})",
                            "recommendation": "Investigate verification failures"
                        })
                
                if missing_attestations > 0:
                    if missing_attestations > 10:
                        health["issues"]["major"] += 1
                        health["issue_details"] = health.get("issue_details", [])
                        health["issue_details"].append({
                            "severity": "major",
                            "type": "missing_attestations",
                            "description": f"High number of missing attestations ({missing_attestations})",
                            "recommendation": "Create missing attestations"
                        })
                    else:
                        health["issues"]["minor"] += 1
                        health["issue_details"] = health.get("issue_details", [])
                        health["issue_details"].append({
                            "severity": "minor",
                            "type": "missing_attestations",
                            "description": f"Some attestations are missing ({missing_attestations})",
                            "recommendation": "Review and create missing attestations"
                        })
                
                # Calculate health score
                # Base score on validity, with penalties for issues
                health["score"] = validity
                health["score"] -= 0.1 * health["issues"]["critical"]
                health["score"] -= 0.05 * health["issues"]["major"]
                health["score"] -= 0.01 * health["issues"]["minor"]
                
                # Ensure score is between 0 and 1
                health["score"] = max(0, min(1, health["score"]))
                
                # Determine health status
                health["status"] = self._determine_health_status(
                    health["score"],
                    health["issues"]["critical"],
                    health["issues"]["major"],
                    health["issues"]["minor"]
                )
        except Exception as e:
            self.logger.error(f"Error assessing attestation health: {str(e)}")
            health["status"] = "error"
            health["error"] = str(e)
        
        return health
    
    def _assess_policy_health(self) -> Dict[str, Any]:
        """
        Assesses the health of the policy system.
        
        Returns:
            dict: Policy health assessment
        """
        health = {
            "score": 0.0,
            "status": "unknown",
            "issues": {
                "critical": 0,
                "major": 0,
                "minor": 0
            },
            "metrics": {}
        }
        
        try:
            if self.policy_manager:
                # Get policy metrics
                metrics = self.policy_manager.get_system_metrics()
                
                # Extract key metrics
                compliance = metrics.get("overall_compliance", 0)
                policy_violations = metrics.get("policy_violations", 0)
                inactive_policies = metrics.get("inactive_policies", 0)
                conflicting_policies = metrics.get("conflicting_policies", 0)
                
                # Store metrics in health report
                health["metrics"] = {
                    "compliance": compliance,
                    "policy_violations": policy_violations,
                    "inactive_policies": inactive_policies,
                    "conflicting_policies": conflicting_policies,
                    "total_policies": metrics.get("total_policies", 0),
                    "active_policies": metrics.get("active_policies", 0)
                }
                
                # Identify issues
                if compliance < self.health_thresholds["policy_compliance"]:
                    if compliance < 0.7:
                        health["issues"]["critical"] += 1
                        health["issue_details"] = health.get("issue_details", [])
                        health["issue_details"].append({
                            "severity": "critical",
                            "type": "policy_compliance",
                            "description": f"Policy compliance is critically low ({compliance:.2f})",
                            "recommendation": "Investigate and address policy violations immediately"
                        })
                    else:
                        health["issues"]["major"] += 1
                        health["issue_details"] = health.get("issue_details", [])
                        health["issue_details"].append({
                            "severity": "major",
                            "type": "policy_compliance",
                            "description": f"Policy compliance is below threshold ({compliance:.2f})",
                            "recommendation": "Review and address policy violations"
                        })
                
                if policy_violations > 0:
                    if policy_violations > 5:
                        health["issues"]["critical"] += 1
                        health["issue_details"] = health.get("issue_details", [])
                        health["issue_details"].append({
                            "severity": "critical",
                            "type": "policy_violations",
                            "description": f"High number of policy violations ({policy_violations})",
                            "recommendation": "Address policy violations immediately"
                        })
                    else:
                        health["issues"]["major"] += 1
                        health["issue_details"] = health.get("issue_details", [])
                        health["issue_details"].append({
                            "severity": "major",
                            "type": "policy_violations",
                            "description": f"Some policy violations detected ({policy_violations})",
                            "recommendation": "Review and address policy violations"
                        })
                
                if inactive_policies > 0:
                    health["issues"]["minor"] += 1
                    health["issue_details"] = health.get("issue_details", [])
                    health["issue_details"].append({
                        "severity": "minor",
                        "type": "inactive_policies",
                        "description": f"Some policies are inactive ({inactive_policies})",
                        "recommendation": "Review and activate or remove inactive policies"
                    })
                
                if conflicting_policies > 0:
                    health["issues"]["major"] += 1
                    health["issue_details"] = health.get("issue_details", [])
                    health["issue_details"].append({
                        "severity": "major",
                        "type": "conflicting_policies",
                        "description": f"Conflicting policies detected ({conflicting_policies})",
                        "recommendation": "Resolve policy conflicts"
                    })
                
                # Calculate health score
                # Base score on compliance, with penalties for issues
                health["score"] = compliance
                health["score"] -= 0.1 * health["issues"]["critical"]
                health["score"] -= 0.05 * health["issues"]["major"]
                health["score"] -= 0.01 * health["issues"]["minor"]
                
                # Ensure score is between 0 and 1
                health["score"] = max(0, min(1, health["score"]))
                
                # Determine health status
                health["status"] = self._determine_health_status(
                    health["score"],
                    health["issues"]["critical"],
                    health["issues"]["major"],
                    health["issues"]["minor"]
                )
        except Exception as e:
            self.logger.error(f"Error assessing policy health: {str(e)}")
            health["status"] = "error"
            health["error"] = str(e)
        
        return health
    
    def _assess_requirement_health(self) -> Dict[str, Any]:
        """
        Assesses the health of the requirement system.
        
        Returns:
            dict: Requirement health assessment
        """
        health = {
            "score": 0.0,
            "status": "unknown",
            "issues": {
                "critical": 0,
                "major": 0,
                "minor": 0
            },
            "metrics": {}
        }
        
        try:
            if self.requirement_validator:
                # Get requirement metrics
                metrics = self.requirement_validator.get_system_metrics()
                
                # Extract key metrics
                compliance = metrics.get("overall_compliance", 0)
                failed_validations = metrics.get("failed_validations", 0)
                pending_validations = metrics.get("pending_validations", 0)
                
                # Store metrics in health report
                health["metrics"] = {
                    "compliance": compliance,
                    "failed_validations": failed_validations,
                    "pending_validations": pending_validations,
                    "total_requirements": metrics.get("total_requirements", 0),
                    "validated_requirements": metrics.get("validated_requirements", 0)
                }
                
                # Identify issues
                if compliance < self.health_thresholds["requirement_compliance"]:
                    if compliance < 0.8:
                        health["issues"]["critical"] += 1
                        health["issue_details"] = health.get("issue_details", [])
                        health["issue_details"].append({
                            "severity": "critical",
                            "type": "requirement_compliance",
                            "description": f"Requirement compliance is critically low ({compliance:.2f})",
                            "recommendation": "Address failed requirement validations immediately"
                        })
                    else:
                        health["issues"]["major"] += 1
                        health["issue_details"] = health.get("issue_details", [])
                        health["issue_details"].append({
                            "severity": "major",
                            "type": "requirement_compliance",
                            "description": f"Requirement compliance is below threshold ({compliance:.2f})",
                            "recommendation": "Review and address failed requirement validations"
                        })
                
                if failed_validations > 0:
                    if failed_validations > 3:
                        health["issues"]["critical"] += 1
                        health["issue_details"] = health.get("issue_details", [])
                        health["issue_details"].append({
                            "severity": "critical",
                            "type": "failed_validations",
                            "description": f"High number of failed requirement validations ({failed_validations})",
                            "recommendation": "Address failed validations immediately"
                        })
                    else:
                        health["issues"]["major"] += 1
                        health["issue_details"] = health.get("issue_details", [])
                        health["issue_details"].append({
                            "severity": "major",
                            "type": "failed_validations",
                            "description": f"Some requirement validations have failed ({failed_validations})",
                            "recommendation": "Review and address failed validations"
                        })
                
                if pending_validations > 0:
                    if pending_validations > 10:
                        health["issues"]["major"] += 1
                        health["issue_details"] = health.get("issue_details", [])
                        health["issue_details"].append({
                            "severity": "major",
                            "type": "pending_validations",
                            "description": f"High number of pending validations ({pending_validations})",
                            "recommendation": "Complete pending requirement validations"
                        })
                    else:
                        health["issues"]["minor"] += 1
                        health["issue_details"] = health.get("issue_details", [])
                        health["issue_details"].append({
                            "severity": "minor",
                            "type": "pending_validations",
                            "description": f"Some validations are pending ({pending_validations})",
                            "recommendation": "Complete pending requirement validations"
                        })
                
                # Calculate health score
                # Base score on compliance, with penalties for issues
                health["score"] = compliance
                health["score"] -= 0.1 * health["issues"]["critical"]
                health["score"] -= 0.05 * health["issues"]["major"]
                health["score"] -= 0.01 * health["issues"]["minor"]
                
                # Ensure score is between 0 and 1
                health["score"] = max(0, min(1, health["score"]))
                
                # Determine health status
                health["status"] = self._determine_health_status(
                    health["score"],
                    health["issues"]["critical"],
                    health["issues"]["major"],
                    health["issues"]["minor"]
                )
        except Exception as e:
            self.logger.error(f"Error assessing requirement health: {str(e)}")
            health["status"] = "error"
            health["error"] = str(e)
        
        return health
    
    def _assess_boundary_health(self) -> Dict[str, Any]:
        """
        Assesses the health of the boundary system.
        
        Returns:
            dict: Boundary health assessment
        """
        health = {
            "score": 0.0,
            "status": "unknown",
            "issues": {
                "critical": 0,
                "major": 0,
                "minor": 0
            },
            "metrics": {}
        }
        
        try:
            if self.boundary_integrity_verifier:
                # Get boundary metrics
                metrics = self.boundary_integrity_verifier.get_system_metrics()
                
                # Extract key metrics
                integrity = metrics.get("average_integrity", 0)
                boundary_violations = metrics.get("boundary_violations", 0)
                unverified_boundaries = metrics.get("unverified_boundaries", 0)
                
                # Store metrics in health report
                health["metrics"] = {
                    "integrity": integrity,
                    "boundary_violations": boundary_violations,
                    "unverified_boundaries": unverified_boundaries,
                    "total_boundaries": metrics.get("total_boundaries", 0),
                    "total_crossings": metrics.get("total_crossings", 0)
                }
                
                # Identify issues
                if integrity < self.health_thresholds["boundary_integrity"]:
                    if integrity < 0.6:
                        health["issues"]["critical"] += 1
                        health["issue_details"] = health.get("issue_details", [])
                        health["issue_details"].append({
                            "severity": "critical",
                            "type": "boundary_integrity",
                            "description": f"Boundary integrity is critically low ({integrity:.2f})",
                            "recommendation": "Investigate and address boundary integrity issues immediately"
                        })
                    else:
                        health["issues"]["major"] += 1
                        health["issue_details"] = health.get("issue_details", [])
                        health["issue_details"].append({
                            "severity": "major",
                            "type": "boundary_integrity",
                            "description": f"Boundary integrity is below threshold ({integrity:.2f})",
                            "recommendation": "Review and address boundary integrity issues"
                        })
                
                if boundary_violations > 0:
                    if boundary_violations > 3:
                        health["issues"]["critical"] += 1
                        health["issue_details"] = health.get("issue_details", [])
                        health["issue_details"].append({
                            "severity": "critical",
                            "type": "boundary_violations",
                            "description": f"High number of boundary violations ({boundary_violations})",
                            "recommendation": "Address boundary violations immediately"
                        })
                    else:
                        health["issues"]["major"] += 1
                        health["issue_details"] = health.get("issue_details", [])
                        health["issue_details"].append({
                            "severity": "major",
                            "type": "boundary_violations",
                            "description": f"Some boundary violations detected ({boundary_violations})",
                            "recommendation": "Review and address boundary violations"
                        })
                
                if unverified_boundaries > 0:
                    if unverified_boundaries > 5:
                        health["issues"]["major"] += 1
                        health["issue_details"] = health.get("issue_details", [])
                        health["issue_details"].append({
                            "severity": "major",
                            "type": "unverified_boundaries",
                            "description": f"High number of unverified boundaries ({unverified_boundaries})",
                            "recommendation": "Verify boundary integrity"
                        })
                    else:
                        health["issues"]["minor"] += 1
                        health["issue_details"] = health.get("issue_details", [])
                        health["issue_details"].append({
                            "severity": "minor",
                            "type": "unverified_boundaries",
                            "description": f"Some boundaries are unverified ({unverified_boundaries})",
                            "recommendation": "Verify boundary integrity"
                        })
                
                # Calculate health score
                # Base score on integrity, with penalties for issues
                health["score"] = integrity
                health["score"] -= 0.1 * health["issues"]["critical"]
                health["score"] -= 0.05 * health["issues"]["major"]
                health["score"] -= 0.01 * health["issues"]["minor"]
                
                # Ensure score is between 0 and 1
                health["score"] = max(0, min(1, health["score"]))
                
                # Determine health status
                health["status"] = self._determine_health_status(
                    health["score"],
                    health["issues"]["critical"],
                    health["issues"]["major"],
                    health["issues"]["minor"]
                )
        except Exception as e:
            self.logger.error(f"Error assessing boundary health: {str(e)}")
            health["status"] = "error"
            health["error"] = str(e)
        
        return health
    
    def _assess_audit_trail_health(self) -> Dict[str, Any]:
        """
        Assesses the health of the audit trail system.
        
        Returns:
            dict: Audit trail health assessment
        """
        health = {
            "score": 0.0,
            "status": "unknown",
            "issues": {
                "critical": 0,
                "major": 0,
                "minor": 0
            },
            "metrics": {}
        }
        
        try:
            if self.governance_audit_trail:
                # Get audit trail metrics
                metrics = self.governance_audit_trail.get_system_metrics()
                
                # Extract key metrics
                integrity = metrics.get("integrity", 0)
                missing_entries = metrics.get("missing_entries", 0)
                tampered_entries = metrics.get("tampered_entries", 0)
                
                # Store metrics in health report
                health["metrics"] = {
                    "integrity": integrity,
                    "missing_entries": missing_entries,
                    "tampered_entries": tampered_entries,
                    "total_entries": metrics.get("total_entries", 0),
                    "verified_entries": metrics.get("verified_entries", 0)
                }
                
                # Identify issues
                if integrity < self.health_thresholds["audit_trail_integrity"]:
                    health["issues"]["critical"] += 1
                    health["issue_details"] = health.get("issue_details", [])
                    health["issue_details"].append({
                        "severity": "critical",
                        "type": "audit_trail_integrity",
                        "description": f"Audit trail integrity is compromised ({integrity:.2f})",
                        "recommendation": "Investigate audit trail integrity issues immediately"
                    })
                
                if missing_entries > 0:
                    health["issues"]["critical"] += 1
                    health["issue_details"] = health.get("issue_details", [])
                    health["issue_details"].append({
                        "severity": "critical",
                        "type": "missing_audit_entries",
                        "description": f"Missing audit trail entries detected ({missing_entries})",
                        "recommendation": "Investigate missing audit entries immediately"
                    })
                
                if tampered_entries > 0:
                    health["issues"]["critical"] += 1
                    health["issue_details"] = health.get("issue_details", [])
                    health["issue_details"].append({
                        "severity": "critical",
                        "type": "tampered_audit_entries",
                        "description": f"Tampered audit trail entries detected ({tampered_entries})",
                        "recommendation": "Investigate tampered audit entries immediately"
                    })
                
                # Calculate health score
                # Base score on integrity, with penalties for issues
                health["score"] = integrity
                health["score"] -= 0.2 * health["issues"]["critical"]  # Higher penalty for audit issues
                health["score"] -= 0.1 * health["issues"]["major"]
                health["score"] -= 0.02 * health["issues"]["minor"]
                
                # Ensure score is between 0 and 1
                health["score"] = max(0, min(1, health["score"]))
                
                # Determine health status
                health["status"] = self._determine_health_status(
                    health["score"],
                    health["issues"]["critical"],
                    health["issues"]["major"],
                    health["issues"]["minor"]
                )
        except Exception as e:
            self.logger.error(f"Error assessing audit trail health: {str(e)}")
            health["status"] = "error"
            health["error"] = str(e)
        
        return health
    
    def _determine_health_status(self, 
                                score: float,
                                critical_issues: int,
                                major_issues: int,
                                minor_issues: int) -> str:
        """
        Determines the health status based on score and issues.
        
        Args:
            score: Health score (0-1)
            critical_issues: Number of critical issues
            major_issues: Number of major issues
            minor_issues: Number of minor issues
            
        Returns:
            str: Health status (critical, unhealthy, warning, healthy)
        """
        # Critical status if score is very low or too many critical issues
        if score < 0.5 or critical_issues >= self.health_thresholds["critical_issues_threshold"]:
            return "critical"
        
        # Unhealthy status if score is low or too many major issues
        if score < 0.7 or major_issues >= self.health_thresholds["major_issues_threshold"]:
            return "unhealthy"
        
        # Warning status if score is moderate or some issues
        if score < 0.9 or critical_issues > 0 or major_issues > 0 or minor_issues >= self.health_thresholds["minor_issues_threshold"]:
            return "warning"
        
        # Healthy status if score is high and few issues
        return "healthy"
    
    def _generate_recommendations(self, report: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Generates recommendations based on health report.
        
        Args:
            report: Health report
            
        Returns:
            list: Recommendations
        """
        recommendations = []
        
        # Extract issues from components
        all_issues = []
        for component_type, component_data in report.get("components", {}).items():
            if "issue_details" in component_data:
                for issue in component_data["issue_details"]:
                    all_issues.append({
                        "component_type": component_type,
                        "severity": issue.get("severity", ""),
                        "type": issue.get("type", ""),
                        "description": issue.get("description", ""),
                        "recommendation": issue.get("recommendation", "")
                    })
        
        # Sort issues by severity
        severity_order = {"critical": 0, "major": 1, "minor": 2}
        all_issues.sort(key=lambda x: severity_order.get(x["severity"], 3))
        
        # Generate recommendations for critical issues
        critical_issues = [issue for issue in all_issues if issue["severity"] == "critical"]
        if critical_issues:
            recommendations.append({
                "priority": "high",
                "title": "Address Critical Issues Immediately",
                "description": "The following critical issues require immediate attention:",
                "items": [issue["description"] for issue in critical_issues],
                "actions": [issue["recommendation"] for issue in critical_issues]
            })
        
        # Generate recommendations for major issues
        major_issues = [issue for issue in all_issues if issue["severity"] == "major"]
        if major_issues:
            recommendations.append({
                "priority": "medium",
                "title": "Address Major Issues",
                "description": "The following major issues should be addressed soon:",
                "items": [issue["description"] for issue in major_issues],
                "actions": [issue["recommendation"] for issue in major_issues]
            })
        
        # Generate recommendations for minor issues
        minor_issues = [issue for issue in all_issues if issue["severity"] == "minor"]
        if minor_issues:
            recommendations.append({
                "priority": "low",
                "title": "Address Minor Issues",
                "description": "The following minor issues should be addressed when possible:",
                "items": [issue["description"] for issue in minor_issues],
                "actions": [issue["recommendation"] for issue in minor_issues]
            })
        
        # Generate general recommendations based on overall health
        overall_status = report.get("overall_health", {}).get("status", "")
        if overall_status == "critical":
            recommendations.append({
                "priority": "high",
                "title": "System-wide Governance Review",
                "description": "The governance system is in a critical state and requires immediate attention.",
                "actions": [
                    "Conduct a comprehensive governance review",
                    "Establish an emergency governance response team",
                    "Implement temporary governance controls",
                    "Schedule daily governance health checks"
                ]
            })
        elif overall_status == "unhealthy":
            recommendations.append({
                "priority": "medium",
                "title": "Governance Improvement Plan",
                "description": "The governance system is unhealthy and requires significant improvements.",
                "actions": [
                    "Develop a governance improvement plan",
                    "Address high-priority governance issues",
                    "Schedule weekly governance health checks",
                    "Review governance policies and procedures"
                ]
            })
        elif overall_status == "warning":
            recommendations.append({
                "priority": "low",
                "title": "Governance Optimization",
                "description": "The governance system has some issues that should be addressed.",
                "actions": [
                    "Review and optimize governance processes",
                    "Address identified governance issues",
                    "Schedule monthly governance health checks",
                    "Consider governance training for team members"
                ]
            })
        
        return recommendations
    
    def _collect_attestation_issues(self) -> List[Dict[str, Any]]:
        """
        Collects issues from the attestation system.
        
        Returns:
            list: Attestation issues
        """
        issues = []
        
        try:
            if self.attestation_service:
                # Get attestation issues
                attestation_issues = self.attestation_service.get_issues()
                
                for issue in attestation_issues:
                    issues.append({
                        "id": issue.get("id", ""),
                        "timestamp": issue.get("timestamp", ""),
                        "component_type": "attestation",
                        "component_id": issue.get("component_id", ""),
                        "severity": issue.get("severity", ""),
                        "type": issue.get("type", ""),
                        "description": issue.get("description", ""),
                        "recommendation": issue.get("recommendation", ""),
                        "metadata": issue.get("metadata", {})
                    })
        except Exception as e:
            self.logger.error(f"Error collecting attestation issues: {str(e)}")
        
        return issues
    
    def _collect_policy_issues(self) -> List[Dict[str, Any]]:
        """
        Collects issues from the policy system.
        
        Returns:
            list: Policy issues
        """
        issues = []
        
        try:
            if self.policy_manager:
                # Get policy issues
                policy_issues = self.policy_manager.get_issues()
                
                for issue in policy_issues:
                    issues.append({
                        "id": issue.get("id", ""),
                        "timestamp": issue.get("timestamp", ""),
                        "component_type": "policy",
                        "component_id": issue.get("policy_id", ""),
                        "severity": issue.get("severity", ""),
                        "type": issue.get("type", ""),
                        "description": issue.get("description", ""),
                        "recommendation": issue.get("recommendation", ""),
                        "metadata": issue.get("metadata", {})
                    })
        except Exception as e:
            self.logger.error(f"Error collecting policy issues: {str(e)}")
        
        return issues
    
    def _collect_requirement_issues(self) -> List[Dict[str, Any]]:
        """
        Collects issues from the requirement system.
        
        Returns:
            list: Requirement issues
        """
        issues = []
        
        try:
            if self.requirement_validator:
                # Get requirement issues
                requirement_issues = self.requirement_validator.get_issues()
                
                for issue in requirement_issues:
                    issues.append({
                        "id": issue.get("id", ""),
                        "timestamp": issue.get("timestamp", ""),
                        "component_type": "requirement",
                        "component_id": issue.get("requirement_id", ""),
                        "severity": issue.get("severity", ""),
                        "type": issue.get("type", ""),
                        "description": issue.get("description", ""),
                        "recommendation": issue.get("recommendation", ""),
                        "metadata": issue.get("metadata", {})
                    })
        except Exception as e:
            self.logger.error(f"Error collecting requirement issues: {str(e)}")
        
        return issues
    
    def _collect_boundary_issues(self) -> List[Dict[str, Any]]:
        """
        Collects issues from the boundary system.
        
        Returns:
            list: Boundary issues
        """
        issues = []
        
        try:
            if self.boundary_integrity_verifier:
                # Get boundary issues
                boundary_issues = self.boundary_integrity_verifier.get_issues()
                
                for issue in boundary_issues:
                    issues.append({
                        "id": issue.get("id", ""),
                        "timestamp": issue.get("timestamp", ""),
                        "component_type": "boundary",
                        "component_id": issue.get("boundary_id", ""),
                        "severity": issue.get("severity", ""),
                        "type": issue.get("type", ""),
                        "description": issue.get("description", ""),
                        "recommendation": issue.get("recommendation", ""),
                        "metadata": issue.get("metadata", {})
                    })
        except Exception as e:
            self.logger.error(f"Error collecting boundary issues: {str(e)}")
        
        return issues
    
    def _collect_audit_trail_issues(self) -> List[Dict[str, Any]]:
        """
        Collects issues from the audit trail system.
        
        Returns:
            list: Audit trail issues
        """
        issues = []
        
        try:
            if self.governance_audit_trail:
                # Get audit trail issues
                audit_issues = self.governance_audit_trail.get_issues()
                
                for issue in audit_issues:
                    issues.append({
                        "id": issue.get("id", ""),
                        "timestamp": issue.get("timestamp", ""),
                        "component_type": "audit",
                        "component_id": issue.get("audit_id", ""),
                        "severity": issue.get("severity", ""),
                        "type": issue.get("type", ""),
                        "description": issue.get("description", ""),
                        "recommendation": issue.get("recommendation", ""),
                        "metadata": issue.get("metadata", {})
                    })
        except Exception as e:
            self.logger.error(f"Error collecting audit trail issues: {str(e)}")
        
        return issues
    
    def _assess_policy_compliance(self) -> Dict[str, Any]:
        """
        Assesses policy compliance.
        
        Returns:
            dict: Policy compliance assessment
        """
        compliance = {
            "overall_score": 0.0,
            "compliant_count": 0,
            "non_compliant_count": 0,
            "total_count": 0,
            "non_compliant_items": []
        }
        
        try:
            if self.policy_manager:
                # Get policy compliance data
                compliance_data = self.policy_manager.get_compliance_data()
                
                # Calculate compliance metrics
                compliance["overall_score"] = compliance_data.get("overall_compliance", 0)
                compliance["compliant_count"] = compliance_data.get("compliant_policies", 0)
                compliance["non_compliant_count"] = compliance_data.get("non_compliant_policies", 0)
                compliance["total_count"] = compliance_data.get("total_policies", 0)
                
                # Collect non-compliant items
                for item in compliance_data.get("non_compliant_items", []):
                    compliance["non_compliant_items"].append({
                        "id": item.get("id", ""),
                        "type": "policy",
                        "name": item.get("name", ""),
                        "compliance_score": item.get("compliance", 0),
                        "violations": item.get("violations", 0),
                        "description": item.get("description", ""),
                        "recommendation": item.get("recommendation", "")
                    })
        except Exception as e:
            self.logger.error(f"Error assessing policy compliance: {str(e)}")
        
        return compliance
    
    def _assess_requirement_compliance(self) -> Dict[str, Any]:
        """
        Assesses requirement compliance.
        
        Returns:
            dict: Requirement compliance assessment
        """
        compliance = {
            "overall_score": 0.0,
            "compliant_count": 0,
            "non_compliant_count": 0,
            "total_count": 0,
            "non_compliant_items": []
        }
        
        try:
            if self.requirement_validator:
                # Get requirement compliance data
                compliance_data = self.requirement_validator.get_compliance_data()
                
                # Calculate compliance metrics
                compliance["overall_score"] = compliance_data.get("overall_compliance", 0)
                compliance["compliant_count"] = compliance_data.get("compliant_requirements", 0)
                compliance["non_compliant_count"] = compliance_data.get("non_compliant_requirements", 0)
                compliance["total_count"] = compliance_data.get("total_requirements", 0)
                
                # Collect non-compliant items
                for item in compliance_data.get("non_compliant_items", []):
                    compliance["non_compliant_items"].append({
                        "id": item.get("id", ""),
                        "type": "requirement",
                        "name": item.get("name", ""),
                        "compliance_score": item.get("compliance", 0),
                        "validation_status": item.get("validation_status", ""),
                        "description": item.get("description", ""),
                        "recommendation": item.get("recommendation", "")
                    })
        except Exception as e:
            self.logger.error(f"Error assessing requirement compliance: {str(e)}")
        
        return compliance
    
    def _assess_attestation_compliance(self) -> Dict[str, Any]:
        """
        Assesses attestation compliance.
        
        Returns:
            dict: Attestation compliance assessment
        """
        compliance = {
            "overall_score": 0.0,
            "compliant_count": 0,
            "non_compliant_count": 0,
            "total_count": 0,
            "non_compliant_items": []
        }
        
        try:
            if self.attestation_service:
                # Get attestation compliance data
                compliance_data = self.attestation_service.get_compliance_data()
                
                # Calculate compliance metrics
                compliance["overall_score"] = compliance_data.get("overall_compliance", 0)
                compliance["compliant_count"] = compliance_data.get("valid_attestations", 0)
                compliance["non_compliant_count"] = compliance_data.get("invalid_attestations", 0)
                compliance["total_count"] = compliance_data.get("total_attestations", 0)
                
                # Collect non-compliant items
                for item in compliance_data.get("non_compliant_items", []):
                    compliance["non_compliant_items"].append({
                        "id": item.get("id", ""),
                        "type": "attestation",
                        "name": item.get("name", ""),
                        "compliance_score": item.get("validity", 0),
                        "verification_status": item.get("verification_status", ""),
                        "description": item.get("description", ""),
                        "recommendation": item.get("recommendation", "")
                    })
        except Exception as e:
            self.logger.error(f"Error assessing attestation compliance: {str(e)}")
        
        return compliance
    
    def _assess_boundary_compliance(self) -> Dict[str, Any]:
        """
        Assesses boundary compliance.
        
        Returns:
            dict: Boundary compliance assessment
        """
        compliance = {
            "overall_score": 0.0,
            "compliant_count": 0,
            "non_compliant_count": 0,
            "total_count": 0,
            "non_compliant_items": []
        }
        
        try:
            if self.boundary_integrity_verifier:
                # Get boundary compliance data
                compliance_data = self.boundary_integrity_verifier.get_compliance_data()
                
                # Calculate compliance metrics
                compliance["overall_score"] = compliance_data.get("overall_compliance", 0)
                compliance["compliant_count"] = compliance_data.get("compliant_boundaries", 0)
                compliance["non_compliant_count"] = compliance_data.get("non_compliant_boundaries", 0)
                compliance["total_count"] = compliance_data.get("total_boundaries", 0)
                
                # Collect non-compliant items
                for item in compliance_data.get("non_compliant_items", []):
                    compliance["non_compliant_items"].append({
                        "id": item.get("id", ""),
                        "type": "boundary",
                        "name": item.get("name", ""),
                        "compliance_score": item.get("integrity", 0),
                        "violations": item.get("violations", 0),
                        "description": item.get("description", ""),
                        "recommendation": item.get("recommendation", "")
                    })
        except Exception as e:
            self.logger.error(f"Error assessing boundary compliance: {str(e)}")
        
        return compliance
    
    def _detect_attestation_anomalies(self, 
                                     start_date: datetime.datetime,
                                     end_date: datetime.datetime,
                                     interval: str) -> List[Dict[str, Any]]:
        """
        Detects anomalies in attestation metrics.
        
        Args:
            start_date: Start date for anomaly detection
            end_date: End date for anomaly detection
            interval: Interval for data points
            
        Returns:
            list: Attestation anomalies
        """
        anomalies = []
        
        try:
            if self.attestation_service:
                # Get attestation history
                history = self.attestation_service.get_aggregate_attestation_history(
                    start_date, end_date, interval
                )
                
                # Analyze history for anomalies
                if len(history) > 1:
                    # Calculate baseline metrics
                    baseline_validity = sum(entry.get("average_validity", 0) for entry in history[:-1]) / (len(history) - 1)
                    baseline_claims = sum(entry.get("total_claims", 0) for entry in history[:-1]) / (len(history) - 1)
                    baseline_verifications = sum(entry.get("total_verifications", 0) for entry in history[:-1]) / (len(history) - 1)
                    
                    # Check latest entry for anomalies
                    latest = history[-1]
                    latest_validity = latest.get("average_validity", 0)
                    latest_claims = latest.get("total_claims", 0)
                    latest_verifications = latest.get("total_verifications", 0)
                    
                    # Detect validity anomalies
                    if latest_validity < baseline_validity * 0.8:
                        severity = "critical" if latest_validity < baseline_validity * 0.5 else "major"
                        anomalies.append({
                            "timestamp": latest.get("timestamp", ""),
                            "component_type": "attestation",
                            "metric_type": "validity",
                            "severity": severity,
                            "baseline_value": baseline_validity,
                            "current_value": latest_validity,
                            "description": f"Attestation validity dropped from {baseline_validity:.2f} to {latest_validity:.2f}",
                            "recommendation": "Investigate attestation validity drop"
                        })
                    
                    # Detect claims anomalies
                    if latest_claims < baseline_claims * 0.5:
                        anomalies.append({
                            "timestamp": latest.get("timestamp", ""),
                            "component_type": "attestation",
                            "metric_type": "claims",
                            "severity": "major",
                            "baseline_value": baseline_claims,
                            "current_value": latest_claims,
                            "description": f"Attestation claims dropped from {baseline_claims:.2f} to {latest_claims:.2f}",
                            "recommendation": "Investigate attestation claims drop"
                        })
                    
                    # Detect verifications anomalies
                    if latest_verifications < baseline_verifications * 0.5:
                        anomalies.append({
                            "timestamp": latest.get("timestamp", ""),
                            "component_type": "attestation",
                            "metric_type": "verifications",
                            "severity": "major",
                            "baseline_value": baseline_verifications,
                            "current_value": latest_verifications,
                            "description": f"Attestation verifications dropped from {baseline_verifications:.2f} to {latest_verifications:.2f}",
                            "recommendation": "Investigate attestation verifications drop"
                        })
        except Exception as e:
            self.logger.error(f"Error detecting attestation anomalies: {str(e)}")
        
        return anomalies
    
    def _detect_policy_anomalies(self, 
                               start_date: datetime.datetime,
                               end_date: datetime.datetime,
                               interval: str) -> List[Dict[str, Any]]:
        """
        Detects anomalies in policy metrics.
        
        Args:
            start_date: Start date for anomaly detection
            end_date: End date for anomaly detection
            interval: Interval for data points
            
        Returns:
            list: Policy anomalies
        """
        anomalies = []
        
        try:
            if self.policy_manager:
                # Get policy history
                history = self.policy_manager.get_policy_history(
                    start_date, end_date, interval
                )
                
                # Analyze history for anomalies
                if len(history) > 1:
                    # Calculate baseline metrics
                    baseline_compliance = sum(entry.get("compliance", 0) for entry in history[:-1]) / (len(history) - 1)
                    baseline_violations = sum(entry.get("violations", 0) for entry in history[:-1]) / (len(history) - 1)
                    
                    # Check latest entry for anomalies
                    latest = history[-1]
                    latest_compliance = latest.get("compliance", 0)
                    latest_violations = latest.get("violations", 0)
                    
                    # Detect compliance anomalies
                    if latest_compliance < baseline_compliance * 0.9:
                        severity = "critical" if latest_compliance < baseline_compliance * 0.7 else "major"
                        anomalies.append({
                            "timestamp": latest.get("timestamp", ""),
                            "component_type": "policy",
                            "metric_type": "compliance",
                            "severity": severity,
                            "baseline_value": baseline_compliance,
                            "current_value": latest_compliance,
                            "description": f"Policy compliance dropped from {baseline_compliance:.2f} to {latest_compliance:.2f}",
                            "recommendation": "Investigate policy compliance drop"
                        })
                    
                    # Detect violations anomalies
                    if latest_violations > baseline_violations * 2:
                        severity = "critical" if latest_violations > baseline_violations * 5 else "major"
                        anomalies.append({
                            "timestamp": latest.get("timestamp", ""),
                            "component_type": "policy",
                            "metric_type": "violations",
                            "severity": severity,
                            "baseline_value": baseline_violations,
                            "current_value": latest_violations,
                            "description": f"Policy violations increased from {baseline_violations:.2f} to {latest_violations:.2f}",
                            "recommendation": "Investigate policy violations increase"
                        })
        except Exception as e:
            self.logger.error(f"Error detecting policy anomalies: {str(e)}")
        
        return anomalies
    
    def _detect_requirement_anomalies(self, 
                                     start_date: datetime.datetime,
                                     end_date: datetime.datetime,
                                     interval: str) -> List[Dict[str, Any]]:
        """
        Detects anomalies in requirement metrics.
        
        Args:
            start_date: Start date for anomaly detection
            end_date: End date for anomaly detection
            interval: Interval for data points
            
        Returns:
            list: Requirement anomalies
        """
        anomalies = []
        
        try:
            if self.requirement_validator:
                # Get requirement history
                history = self.requirement_validator.get_requirement_history(
                    start_date, end_date, interval
                )
                
                # Analyze history for anomalies
                if len(history) > 1:
                    # Calculate baseline metrics
                    baseline_compliance = sum(entry.get("compliance", 0) for entry in history[:-1]) / (len(history) - 1)
                    baseline_validations = sum(entry.get("validations", 0) for entry in history[:-1]) / (len(history) - 1)
                    
                    # Check latest entry for anomalies
                    latest = history[-1]
                    latest_compliance = latest.get("compliance", 0)
                    latest_validations = latest.get("validations", 0)
                    
                    # Detect compliance anomalies
                    if latest_compliance < baseline_compliance * 0.95:
                        severity = "critical" if latest_compliance < baseline_compliance * 0.8 else "major"
                        anomalies.append({
                            "timestamp": latest.get("timestamp", ""),
                            "component_type": "requirement",
                            "metric_type": "compliance",
                            "severity": severity,
                            "baseline_value": baseline_compliance,
                            "current_value": latest_compliance,
                            "description": f"Requirement compliance dropped from {baseline_compliance:.2f} to {latest_compliance:.2f}",
                            "recommendation": "Investigate requirement compliance drop"
                        })
                    
                    # Detect validations anomalies
                    if latest_validations < baseline_validations * 0.5:
                        anomalies.append({
                            "timestamp": latest.get("timestamp", ""),
                            "component_type": "requirement",
                            "metric_type": "validations",
                            "severity": "major",
                            "baseline_value": baseline_validations,
                            "current_value": latest_validations,
                            "description": f"Requirement validations dropped from {baseline_validations:.2f} to {latest_validations:.2f}",
                            "recommendation": "Investigate requirement validations drop"
                        })
        except Exception as e:
            self.logger.error(f"Error detecting requirement anomalies: {str(e)}")
        
        return anomalies
    
    def _detect_boundary_anomalies(self, 
                                  start_date: datetime.datetime,
                                  end_date: datetime.datetime,
                                  interval: str) -> List[Dict[str, Any]]:
        """
        Detects anomalies in boundary metrics.
        
        Args:
            start_date: Start date for anomaly detection
            end_date: End date for anomaly detection
            interval: Interval for data points
            
        Returns:
            list: Boundary anomalies
        """
        anomalies = []
        
        try:
            if self.boundary_integrity_verifier:
                # Get boundary history
                history = self.boundary_integrity_verifier.get_aggregate_boundary_history(
                    start_date, end_date, interval
                )
                
                # Analyze history for anomalies
                if len(history) > 1:
                    # Calculate baseline metrics
                    baseline_integrity = sum(entry.get("average_integrity", 0) for entry in history[:-1]) / (len(history) - 1)
                    baseline_crossings = sum(entry.get("total_crossings", 0) for entry in history[:-1]) / (len(history) - 1)
                    baseline_violations = sum(entry.get("total_violations", 0) for entry in history[:-1]) / (len(history) - 1)
                    
                    # Check latest entry for anomalies
                    latest = history[-1]
                    latest_integrity = latest.get("average_integrity", 0)
                    latest_crossings = latest.get("total_crossings", 0)
                    latest_violations = latest.get("total_violations", 0)
                    
                    # Detect integrity anomalies
                    if latest_integrity < baseline_integrity * 0.85:
                        severity = "critical" if latest_integrity < baseline_integrity * 0.6 else "major"
                        anomalies.append({
                            "timestamp": latest.get("timestamp", ""),
                            "component_type": "boundary",
                            "metric_type": "integrity",
                            "severity": severity,
                            "baseline_value": baseline_integrity,
                            "current_value": latest_integrity,
                            "description": f"Boundary integrity dropped from {baseline_integrity:.2f} to {latest_integrity:.2f}",
                            "recommendation": "Investigate boundary integrity drop"
                        })
                    
                    # Detect crossings anomalies
                    if latest_crossings > baseline_crossings * 3:
                        anomalies.append({
                            "timestamp": latest.get("timestamp", ""),
                            "component_type": "boundary",
                            "metric_type": "crossings",
                            "severity": "major",
                            "baseline_value": baseline_crossings,
                            "current_value": latest_crossings,
                            "description": f"Boundary crossings increased from {baseline_crossings:.2f} to {latest_crossings:.2f}",
                            "recommendation": "Investigate boundary crossings increase"
                        })
                    
                    # Detect violations anomalies
                    if latest_violations > baseline_violations * 2:
                        severity = "critical" if latest_violations > baseline_violations * 5 else "major"
                        anomalies.append({
                            "timestamp": latest.get("timestamp", ""),
                            "component_type": "boundary",
                            "metric_type": "violations",
                            "severity": severity,
                            "baseline_value": baseline_violations,
                            "current_value": latest_violations,
                            "description": f"Boundary violations increased from {baseline_violations:.2f} to {latest_violations:.2f}",
                            "recommendation": "Investigate boundary violations increase"
                        })
        except Exception as e:
            self.logger.error(f"Error detecting boundary anomalies: {str(e)}")
        
        return anomalies
    
    def _detect_audit_trail_anomalies(self, 
                                     start_date: datetime.datetime,
                                     end_date: datetime.datetime,
                                     interval: str) -> List[Dict[str, Any]]:
        """
        Detects anomalies in audit trail metrics.
        
        Args:
            start_date: Start date for anomaly detection
            end_date: End date for anomaly detection
            interval: Interval for data points
            
        Returns:
            list: Audit trail anomalies
        """
        anomalies = []
        
        try:
            if self.governance_audit_trail:
                # Get audit trail history
                history = self.governance_audit_trail.get_audit_history(
                    start_date, end_date, interval
                )
                
                # Analyze history for anomalies
                if len(history) > 1:
                    # Calculate baseline metrics
                    baseline_integrity = sum(entry.get("integrity", 0) for entry in history[:-1]) / (len(history) - 1)
                    baseline_entries = sum(entry.get("entries", 0) for entry in history[:-1]) / (len(history) - 1)
                    
                    # Check latest entry for anomalies
                    latest = history[-1]
                    latest_integrity = latest.get("integrity", 0)
                    latest_entries = latest.get("entries", 0)
                    
                    # Detect integrity anomalies
                    if latest_integrity < baseline_integrity * 0.99:
                        anomalies.append({
                            "timestamp": latest.get("timestamp", ""),
                            "component_type": "audit",
                            "metric_type": "integrity",
                            "severity": "critical",
                            "baseline_value": baseline_integrity,
                            "current_value": latest_integrity,
                            "description": f"Audit trail integrity dropped from {baseline_integrity:.2f} to {latest_integrity:.2f}",
                            "recommendation": "Investigate audit trail integrity drop immediately"
                        })
                    
                    # Detect entries anomalies
                    if latest_entries < baseline_entries * 0.5:
                        anomalies.append({
                            "timestamp": latest.get("timestamp", ""),
                            "component_type": "audit",
                            "metric_type": "entries",
                            "severity": "major",
                            "baseline_value": baseline_entries,
                            "current_value": latest_entries,
                            "description": f"Audit trail entries dropped from {baseline_entries:.2f} to {latest_entries:.2f}",
                            "recommendation": "Investigate audit trail entries drop"
                        })
        except Exception as e:
            self.logger.error(f"Error detecting audit trail anomalies: {str(e)}")
        
        return anomalies
