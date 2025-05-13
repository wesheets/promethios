import json
import datetime
import uuid

class GovernanceCore:
    def __init__(self):
        self.agent_id = "Promethios_MGC_v1_mock"

    def execute_loop(self, plan_input: dict, operator_override_signal: dict | None = None) -> tuple[dict, dict, dict]:
        """Mocks the execution of the governance core loop."""
        loop_id = str(uuid.uuid4())
        timestamp = datetime.datetime.utcnow().isoformat() + "Z"

        # Mock direct output
        core_output = {
            "status": "mock_success",
            "details": "GovernanceCore mock executed successfully.",
            "received_plan_input": plan_input,
            "received_override": operator_override_signal
        }

        # Mock emotion telemetry
        emotion_telemetry = {
            "timestamp": timestamp,
            "current_emotion_state": "MOCK_FOCUSED",
            "contributing_factors": [
                {"factor": "Mock Clarity of Task", "influence": 0.9}
            ],
            "trust_score": 0.95
        }

        # Mock justification log
        justification_log = {
            "agent_id": self.agent_id,
            "timestamp": timestamp,
            "plan_id": plan_input.get("plan_id", "mock_plan_id_" + str(uuid.uuid4())),
            "loop_id": loop_id,
            "decision_outcome": "MOCK_ACCEPTED",
            "rejection_reason": None,
            "override_required": operator_override_signal is not None,
            "trust_score_at_decision": 0.95,
            "emotion_state_at_decision": "MOCK_FOCUSED",
            "validation_passed": True, # This will be set by runtime_executor after actual validation
            "schema_versions": {
                "emotion_telemetry": "mgc_emotion_telemetry.schema.json#v_mock",
                "justification_log": "loop_justification_log.schema.v1.json#v1.2.0_mock"
            }
        }

        return core_output, emotion_telemetry, justification_log

# Example usage (for testing purposes, not part of the actual runtime)
if __name__ == "__main__":
    gc = GovernanceCore()
    mock_plan = {"task_description": "Test task"}
    output, emotion, justification = gc.execute_loop(plan_input=mock_plan)
    print("Core Output:", json.dumps(output, indent=2))
    print("Emotion Telemetry:", json.dumps(emotion, indent=2))
    print("Justification Log:", json.dumps(justification, indent=2))

    mock_override = {
        "override_type": "MOCK_HALT",
        "reason": "Mock reason"
    }
    output_override, emotion_override, justification_override = gc.execute_loop(plan_input=mock_plan, operator_override_signal=mock_override)
    print("\nWith Override:")
    print("Core Output:", json.dumps(output_override, indent=2))
    print("Emotion Telemetry:", json.dumps(emotion_override, indent=2))
    print("Justification Log:", json.dumps(justification_override, indent=2))

