#!/usr/bin/env python3
"""
Trust Decay Dashboard Integration for Promethios Phase 5.9

This module integrates the Trust Decay Dashboard components with the
main Trust Surface Dashboard.

Codex Contract: v2025.05.21
Phase ID: 5.9
"""

import json
import os
import re
import logging
from dash import html, dcc, callback, Input, Output, State

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class TrustDecayDashboardIntegration:
    """
    Integrates Trust Decay Dashboard components with the main Trust Surface Dashboard.
    
    This component is responsible for integrating the Trust Decay Dashboard
    components with the existing Trust Surface Dashboard, including adding
    new tabs, menu items, and data flows.
    
    Codex Contract: v2025.05.21
    Phase ID: 5.9
    """
    
    def __init__(self, trust_decay_dashboard, trust_surface_dashboard, config=None):
        """
        Initialize the Trust Decay Dashboard Integration.
        
        Args:
            trust_decay_dashboard (TrustDecayDashboard): Instance of TrustDecayDashboard
            trust_surface_dashboard: Instance of the main Trust Surface Dashboard
            config (dict, optional): Configuration dictionary for integration parameters
        """
        # Codex contract tethering
        self.contract_version = "v2025.05.21"
        self.phase_id = "5.9"
        self.codex_clauses = ["5.9", "11.3", "11.7"]
        
        # Store component instances
        self.trust_decay_dashboard = trust_decay_dashboard
        self.trust_surface_dashboard = trust_surface_dashboard
        
        # Initialize configuration
        self.config = config or self._load_default_config()
        
        # Perform pre-loop tether check
        if not self._pre_loop_tether_check():
            raise ValueError("Pre-loop tether check failed for TrustDecayDashboardIntegration")
        
        logger.info("TrustDecayDashboardIntegration initialized with contract version %s", self.contract_version)
    
    def _pre_loop_tether_check(self):
        """
        Perform pre-loop tether check to verify contract compliance.
        
        Returns:
            bool: True if tether check passes, False otherwise.
        """
        # Verify contract version format
        if not re.match(r"v\d{4}\.\d{2}\.\d{2}", self.contract_version):
            logger.error("Invalid contract version format: %s", self.contract_version)
            return False
            
        # Verify phase ID format
        if not re.match(r"5\.\d+", self.phase_id):
            logger.error("Invalid phase ID format: %s", self.phase_id)
            return False
            
        # Verify codex clauses
        if "5.9" not in self.codex_clauses:
            logger.error("Missing required codex clause 5.9")
            return False
            
        # Verify required components
        if not self.trust_decay_dashboard or not self.trust_surface_dashboard:
            logger.error("Missing required components")
            return False
            
        return True
    
    def _load_default_config(self):
        """
        Load default configuration for the Trust Decay Dashboard Integration.
        
        Returns:
            dict: Default configuration dictionary.
        """
        return {
            "integration": {
                "tab_name": "Trust Decay",
                "tab_order": 2,
                "menu_item_name": "Trust Decay",
                "menu_item_order": 2,
                "enable_surface_overlay": True
            }
        }
    
    def integrate(self):
        """
        Integrate Trust Decay Dashboard with the main Trust Surface Dashboard.
        
        This method adds the Trust Decay Dashboard as a new tab in the main
        Trust Surface Dashboard, adds a menu item, and sets up data flows.
        
        Returns:
            bool: True if integration was successful, False otherwise
        """
        try:
            # Add Trust Decay tab to main dashboard
            self._add_trust_decay_tab()
            
            # Add Trust Decay menu item
            self._add_trust_decay_menu_item()
            
            # Set up data flows
            self._setup_data_flows()
            
            # Set up callbacks
            self._setup_callbacks()
            
            logger.info("Trust Decay Dashboard successfully integrated with Trust Surface Dashboard")
            return True
        except Exception as e:
            logger.error("Failed to integrate Trust Decay Dashboard: %s", str(e))
            return False
    
    def _add_trust_decay_tab(self):
        """
        Add Trust Decay tab to the main dashboard.
        """
        # Create Trust Decay tab content
        trust_decay_tab = html.Div([
            self.trust_decay_dashboard.create_dashboard_layout()
        ], id="trust-decay-tab", className="dashboard-tab")
        
        # Add tab to main dashboard
        self.trust_surface_dashboard.add_tab(
            tab_id="trust-decay",
            tab_label=self.config["integration"]["tab_name"],
            tab_content=trust_decay_tab,
            tab_order=self.config["integration"]["tab_order"]
        )
        
        logger.info("Added Trust Decay tab to main dashboard")
    
    def _add_trust_decay_menu_item(self):
        """
        Add Trust Decay menu item to the main dashboard.
        """
        # Add menu item to main dashboard
        self.trust_surface_dashboard.add_menu_item(
            item_id="trust-decay-menu",
            item_label=self.config["integration"]["menu_item_name"],
            item_icon="chart-line",  # Font Awesome icon name
            item_order=self.config["integration"]["menu_item_order"],
            item_action="trust-decay"  # Tab ID to activate
        )
        
        logger.info("Added Trust Decay menu item to main dashboard")
    
    def _setup_data_flows(self):
        """
        Set up data flows between Trust Decay Dashboard and Trust Surface Dashboard.
        """
        # If surface overlay is enabled, set up data flow for trust level overlay
        if self.config["integration"]["enable_surface_overlay"]:
            self.trust_surface_dashboard.register_overlay_provider(
                provider_id="trust-decay",
                provider_name="Trust Decay",
                provider_function=self.trust_decay_dashboard.visualization.get_trust_surface_overlay
            )
            
            logger.info("Registered Trust Decay overlay provider with Trust Surface Dashboard")
        
        # Set up data flow for entity selection
        self.trust_surface_dashboard.register_entity_selection_handler(
            handler_id="trust-decay",
            handler_function=self._handle_entity_selection
        )
        
        logger.info("Registered entity selection handler with Trust Surface Dashboard")
    
    def _handle_entity_selection(self, entity_id):
        """
        Handle entity selection from Trust Surface Dashboard.
        
        Args:
            entity_id (str): ID of the selected entity
            
        Returns:
            dict: Entity data for Trust Decay Dashboard
        """
        # Get entity trust data
        entity_data = self.trust_decay_dashboard.visualization.get_entity_trust_data(entity_id)
        
        # Return entity data
        return {
            "entity_id": entity_id,
            "trust_data": entity_data
        }
    
    def _setup_callbacks(self):
        """
        Set up callbacks for Trust Decay Dashboard.
        """
        # Register callbacks with the app
        app = self.trust_surface_dashboard.get_app()
        self.trust_decay_dashboard.register_callbacks(app)
        
        logger.info("Registered Trust Decay Dashboard callbacks with app")
    
    def verify_contract_integrity(self):
        """
        Verify the integrity of the contract tethering.
        
        Returns:
            bool: True if contract integrity is verified, False otherwise
        """
        return self._pre_loop_tether_check()
