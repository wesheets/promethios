#!/usr/bin/env python3
# governance_core.py

"""
Defines the GovernanceCore class, the monolithic kernel responsible for
executing the primary control loop, enforcing contracts, managing memory,
and handling emotional telemetry as per ADR-0001.
"""

import json
import uuid
from datetime import datetime, timezone
import jsonschema # Added for schema validation
import os # For checking file existence

class GovernanceCore:
    """
    The Minimal Governance Core (MGC) class.
    Operates as a monolithic kernel for Promethios.
    """

    TRUST_REJECTION_THRESHOLD = 0.4 # Class constant for trust threshold
    DEFAULT_TRUST_SCORE = 0.7       # Class constant for default trust

    def __init__(self):
        """Initializes the GovernanceCore."""
        self.schema_objects = self._load_schemas_from_codex() # Load actual schema objects
        initial_emotion_state = {
            "timestamp": self._get_timestamp(),
            "current_emotion_state": "NEUTRAL",
            "state_intensity": 0.5,
            "triggering_event_id": "initialization",
            "contributing_factors": []
        }
        
        if self._validate_output(initial_emotion_state, "emotion_telemetry", calling_method_for_recursion_break="__init__"):
            self.current_emotion_state = initial_emotion_state
            self._emit_emotion_telemetry(self.current_emotion_state)
        else:
            print("CRITICAL: Initial emotion state failed validation. MGC may not function correctly.")
            self.current_emotion_state = { 
                "timestamp": self._get_timestamp(),
                "current_emotion_state": "NEUTRAL", 
                "state_intensity": 0.0, 
                "triggering_event_id": "initialization_error", 
                "contributing_factors": [] 
            }
            self._emit_emotion_telemetry(self.current_emotion_state) 

        self.memory_surfaces = {} 
        self.justification_log = [] 
        print("GovernanceCore initialized.")

    def _get_timestamp(self):
        return datetime.now(timezone.utc).isoformat()

    def _load_schemas_from_codex(self):
        schema_paths = {
            "emotion_telemetry": "/home/ubuntu/ResurrectionCodex/01_Minimal_Governance_Core_MGC/MGC_Schema_Registry/mgc_emotion_telemetry.schema.json",
            "justification_log": "/home/ubuntu/ResurrectionCodex/01_Minimal_Governance_Core_MGC/MGC_Schema_Registry/loop_justification_log.schema.v1.json", # Will load v1.2.0
            "loop_control": "/home/ubuntu/ResurrectionCodex/01_Minimal_Governance_Core_MGC/MGC_Schema_Registry/mgc_loop_control.schema.json",
            "memory_surface_interface": "/home/ubuntu/ResurrectionCodex/01_Minimal_Governance_Core_MGC/MGC_Schema_Registry/mgc_memory_surface_interface.schema.json",
            "operator_override": "/home/ubuntu/ResurrectionCodex/01_Minimal_Governance_Core_MGC/MGC_Schema_Registry/operator_override.schema.v1.json" 
        }
        loaded_schemas = {}
        for name, path in schema_paths.items():
            if not os.path.exists(path):
                print(f"CRITICAL ERROR: Schema file not found at {path}. MGC cannot operate reliably.")
                loaded_schemas[name] = None 
                continue
            try:
                with open(path, "r") as f:
                    loaded_schemas[name] = json.load(f)
                print(f"Schema 	'{name}'	 loaded successfully from {path}.")
            except json.JSONDecodeError as e:
                print(f"CRITICAL ERROR: Failed to decode JSON for schema 	'{name}'	 from {path}. Error: {e}")
                loaded_schemas[name] = None
            except Exception as e:
                print(f"CRITICAL ERROR: An unexpected error occurred while loading schema 	'{name}'	 from {path}. Error: {e}")
                loaded_schemas[name] = None
        
        if not all(s is not None for s_name, s in loaded_schemas.items()): 
             print("WARNING: One or more schemas failed to load. Validation capabilities will be impaired.")
        return loaded_schemas

    def _validate_output(self, data, schema_name, calling_method_for_recursion_break=None):
        schema_obj = self.schema_objects.get(schema_name)
        if schema_obj is None:
            print(f"Validation Error: Schema 	'{schema_name}'	 not found or failed to load. Cannot validate data.")
            if not (calling_method_for_recursion_break == "update_emotion_state" and schema_name == "emotion_telemetry") and \
               not (calling_method_for_recursion_break == "__init__" and schema_name == "emotion_telemetry") :
                if hasattr(self, 'update_emotion_state') and self.current_emotion_state is not None: 
                    self.update_emotion_state("UNCERTAIN", 0.8, f"validation_failure_schema_missing_{schema_name}", factors=[{"factor_type":"internal_error", "factor_value":"Schema object missing"}])
            return False
        try:
            jsonschema.validate(instance=data, schema=schema_obj)
            print(f"Data for 	'{schema_name}'	 validated successfully against schema.")
            return True
        except jsonschema.exceptions.ValidationError as e:
            print(f"Schema Validation Error for 	'{schema_name}'	: {e.message}")
            if schema_name != "emotion_telemetry" and hasattr(self, 'update_emotion_state') and self.current_emotion_state is not None:
                self.update_emotion_state("AGITATED", 0.8, f"validation_failure_{schema_name}", factors=[{"factor_type": "schema_violation", "factor_value": e.message[:100]}])
            return False
        except Exception as e:
            print(f"Unexpected Error during schema validation for 	'{schema_name}'	: {e}")
            if schema_name != "emotion_telemetry" and hasattr(self, 'update_emotion_state') and self.current_emotion_state is not None:
                self.update_emotion_state("AGITATED", 0.9, f"validation_error_unexpected_{schema_name}", factors=[{"factor_type": "internal_error", "factor_value": str(e)[:100]}])
            return False

    def update_emotion_state(self, new_state, intensity, trigger_id=None, factors=None):
        if not (0 <= intensity <= 1):
            print(f"Warning: Emotion intensity {intensity} for state {new_state} is out of bounds (0-1). Clamping.")
            intensity = max(0, min(1, intensity))
        updated_emotion_state_data = {
            "timestamp": self._get_timestamp(),
            "current_emotion_state": new_state,
            "state_intensity": intensity,
            "triggering_event_id": trigger_id,
            "contributing_factors": factors if factors else []
        }
        is_new_state_valid = self._validate_output(updated_emotion_state_data, "emotion_telemetry", calling_method_for_recursion_break="update_emotion_state")
        if is_new_state_valid:
            self.current_emotion_state = updated_emotion_state_data
            self._emit_emotion_telemetry(self.current_emotion_state)
        else:
            print(f"CRITICAL: Proposed new emotion state failed validation. Emotion state NOT updated. Data: {json.dumps(updated_emotion_state_data, indent=2)}. Previous state retained.")

    def _emit_emotion_telemetry(self, emotion_data_to_emit):
        print(f"Emitting Emotion Telemetry: {json.dumps(emotion_data_to_emit, indent=2)}")

    def _handle_override_signal(self, override_signal):
        if self._validate_output(override_signal, "operator_override"):
            print(f"Conceptually recognized VALID Operator Override Signal: {override_signal.get('override_signal_id')} of type {override_signal.get('override_type')}")
            return True 
        else:
            print(f"INVALID Operator Override Signal received or schema validation failed: {json.dumps(override_signal, indent=2)}")
            self.update_emotion_state("AGITATED", 0.7, "invalid_override_signal", factors=[{"factor_type":"malformed_input", "factor_value":"override_signal_invalid"}])
            return False 

    def process_plan(self, plan_id, plan_details, override_signal_info=None):
        print(f"Processing plan_id: {plan_id}")
        current_trust_score = self.DEFAULT_TRUST_SCORE
        trust_factors_applied = []
        if "trust_factor" in plan_details:
            try:
                modifier = float(plan_details["trust_factor"])
                current_trust_score += modifier
                current_trust_score = max(0, min(1, current_trust_score))
                trust_factors_applied.append({"factor_type": "explicit_trust_factor", "factor_value": modifier})
            except ValueError:
                print(f"Warning: Invalid trust_factor value for {plan_id}. Using default trust.")
                trust_factors_applied.append({"factor_type": "invalid_trust_factor_ignored", "factor_value": plan_details["trust_factor"]})

        override_active_for_decision = False
        log_override_details = None
        if override_signal_info and override_signal_info.get("valid"):
            print(f"Note: Operator override signal {override_signal_info.get('id')} is present during processing of plan {plan_id}.")
            override_active_for_decision = True
            log_override_details = {
                "override_signal_id": override_signal_info.get("id"),
                "override_type": override_signal_info.get("type")
            }

        if current_trust_score < self.TRUST_REJECTION_THRESHOLD:
            rejection_reason = f"Plan rejected due to low trust score: {current_trust_score:.2f} (Threshold: {self.TRUST_REJECTION_THRESHOLD})."
            emotion_factors = [{"factor_type": "low_trust_score", "factor_value": f"{current_trust_score:.2f}"}]
            if trust_factors_applied: emotion_factors.extend(trust_factors_applied)
            self.update_emotion_state("AGITATED", 0.85, trigger_id=f"plan_rejection_low_trust_{plan_id}", factors=emotion_factors)
            # Set override_required to True for trust threshold breach
            self.log_justification(plan_id, "plan_rejection", rejection_reason, rejection_reason=rejection_reason, trust_score_at_decision=current_trust_score, override_signal_received=override_active_for_decision, override_details=log_override_details, override_required=True)
            return {"status": "rejected", "plan_id": plan_id, "reason": rejection_reason, "trust_score": current_trust_score}

        if "reject_this_plan" in plan_details and plan_details["reject_this_plan"]:
            rejection_reason = "Simulated rejection: Plan flagged as high-risk."
            emotion_factors = [{"factor_type": "simulated_risk_assessment", "factor_value": "high"}]
            if trust_factors_applied: emotion_factors.extend(trust_factors_applied)
            self.update_emotion_state("AGITATED", 0.75, trigger_id=f"plan_rejection_flagged_{plan_id}", factors=emotion_factors)
            self.log_justification(plan_id, "plan_rejection", f"Plan {plan_id} rejected. Reason: {rejection_reason}", rejection_reason=rejection_reason, trust_score_at_decision=current_trust_score, override_signal_received=override_active_for_decision, override_details=log_override_details, override_required=False) # Default to False unless specific criteria met
            return {"status": "rejected", "plan_id": plan_id, "reason": rejection_reason, "trust_score": current_trust_score}

        if "uncertainty_level" in plan_details and plan_details["uncertainty_level"] > 0.6:
            emotion_factors = [{"factor_type": "plan_uncertainty", "factor_value": str(plan_details["uncertainty_level"])}]
            if trust_factors_applied: emotion_factors.extend(trust_factors_applied)
            self.update_emotion_state("UNCERTAIN", plan_details["uncertainty_level"], trigger_id=f"plan_processing_uncertain_{plan_id}", factors=emotion_factors)
            self.log_justification(plan_id, "plan_selection", f"Plan {plan_id} accepted despite uncertainty ({plan_details['uncertainty_level']}), based on evaluation.", trust_score_at_decision=current_trust_score, override_signal_received=override_active_for_decision, override_details=log_override_details, override_required=False)
            return {"status": "accepted", "plan_id": plan_id, "trust_score": current_trust_score}

        emotion_factors = [{"factor_type": "plan_assessment", "factor_value": "nominal"}]
        if trust_factors_applied: emotion_factors.extend(trust_factors_applied)
        self.update_emotion_state("FOCUSED", 0.8, trigger_id=f"plan_processing_focused_{plan_id}", factors=emotion_factors)
        self.log_justification(plan_id, "plan_selection", f"Plan {plan_id} accepted based on evaluation.", trust_score_at_decision=current_trust_score, override_signal_received=override_active_for_decision, override_details=log_override_details, override_required=False)
        return {"status": "accepted", "plan_id": plan_id, "trust_score": current_trust_score}

    def log_justification(self, plan_id, decision_type, justification_text, rejection_reason=None, agent_id="MGC_Kernel", trust_score_at_decision=None, override_signal_received=False, override_details=None, override_required=False):
        emotion_state_snapshot = json.loads(json.dumps(self.current_emotion_state))
        log_entry = {
            "log_entry_id": str(uuid.uuid4()),
            "timestamp": self._get_timestamp(),
            "loop_id": "loop_placeholder_" + str(uuid.uuid4())[:8],
            "agent_id": agent_id,
            "plan_id": plan_id,
            "decision_type": decision_type,
            "justification_text": justification_text,
            "rejection_reason": rejection_reason,
            "emotion_state_at_decision": {
                "current_emotion_state": emotion_state_snapshot["current_emotion_state"],
                "state_intensity": emotion_state_snapshot["state_intensity"],
                "triggering_event_id": emotion_state_snapshot.get("triggering_event_id"),
                "contributing_factors": emotion_state_snapshot.get("contributing_factors", [])
            },
            "runtime_log_type": "justification_log",
            "contract_enforcement_metadata": {
                "contract_id_evaluated": "contract_placeholder_" + str(uuid.uuid4())[:4],
                "evaluation_outcome": "pass" if rejection_reason is None else "fail",
                "violated_clauses": [rejection_reason] if rejection_reason and isinstance(rejection_reason, str) else []
            }
        }
        if trust_score_at_decision is not None:
            log_entry["trust_score_at_decision"] = trust_score_at_decision
        
        log_entry["override_signal_received"] = override_signal_received
        if override_details:
            log_entry["override_details"] = override_details
        
        log_entry["override_required"] = override_required # Add the new field

        if self._validate_output(log_entry, "justification_log"):
            self.justification_log.append(log_entry)
            print(f"Logging Validated Justification: {json.dumps(log_entry, indent=2)}")
        else:
            print(f"CRITICAL: Failed to validate justification log entry. Logging aborted. Data: {json.dumps(log_entry, indent=2)}")

    def execute_loop(self, loop_input):
        loop_id = loop_input.get("loop_id", "loop_" + str(uuid.uuid4())[:8])
        print(f"Executing loop_id: {loop_id} with input: {loop_input}")
        self.update_emotion_state("NEUTRAL", 0.5, trigger_id=f"loop_start_{loop_id}")
        
        override_signal_data = loop_input.get("operator_override_signal")
        override_signal_info_for_plan = None
        if override_signal_data:
            is_valid_override = self._handle_override_signal(override_signal_data)
            if is_valid_override:
                override_signal_info_for_plan = {
                    "valid": True,
                    "id": override_signal_data.get("override_signal_id"),
                    "type": override_signal_data.get("override_type")
                }
            else:
                 override_signal_info_for_plan = {"valid": False}

        plan_id = loop_input.get("plan_id", "default_plan_" + str(uuid.uuid4())[:4])
        plan_details = loop_input.get("plan_details", {})
        processing_result = self.process_plan(plan_id, plan_details, override_signal_info=override_signal_info_for_plan)
        print(f"Plan processing result for {plan_id}: {processing_result}")
        if processing_result["status"] == "accepted":
            print(f"Performing actions for accepted plan: {plan_id}")
            # Simulate action execution
            self.update_emotion_state("CONFIDENT", 0.9, trigger_id=f"plan_execution_success_{plan_id}", factors=[{"factor_type":"action_outcome", "factor_value":"simulated_success"}])
            loop_outcome = "completed_successfully"
        else: # Rejected
            print(f"No actions performed for rejected plan: {plan_id}")
            self.update_emotion_state("RESOLVED", 0.6, trigger_id=f"post_rejection_stable_{plan_id}", factors=[{"factor_type":"loop_status", "factor_value":"rejection_handled"}])
            loop_outcome = "completed_with_rejection"

        print(f"Loop execution finished for loop_id: {loop_id}")
        final_loop_output = {
            "loop_id": loop_id,
            "plan_id": plan_id,
            "loop_outcome": loop_outcome,
            "final_emotion_state": self.current_emotion_state,
            "justification_log_preview": self.justification_log[-1] if self.justification_log else None,
            "trust_score_final": processing_result.get("trust_score"),
            "override_signal_processed_validly": override_signal_info_for_plan.get("valid") if override_signal_info_for_plan else None
        }
        return final_loop_output

