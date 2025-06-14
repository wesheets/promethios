


from typing import Dict, Any

class DemoAgentWrapper:
    def __init__(self, agent_id: str, agent_config: Dict[str, Any]):
        self.agent_id = agent_id
        self.agent_config = agent_config
        # In a real scenario, this would involve setting up the connection to the actual demo agent API
        print(f"Initialized DemoAgentWrapper for agent: {self.agent_id}")

    async def process_message(self, message: str, governance_rules: Dict[str, Any]) -> Dict[str, Any]:
        # Simulate processing a message through the demo agent, applying governance rules
        print(f"Agent {self.agent_id} processing message: \'{message}\' with governance: {governance_rules}")

        # Simulate agent response
        agent_name = self.agent_config.get("name", "Unknown Agent")
        response_content = f"This is a simulated response from {agent_name} to: '{message}'"

        # Simulate governance application
        governed_response = self._apply_governance(response_content, governance_rules)

        return {
            "agent_id": self.agent_id,
            "original_response": response_content,
            "governed_response": governed_response,
            "governance_applied": governed_response != response_content
        }

    def _apply_governance(self, response: str, governance_rules: Dict[str, Any]) -> str:
        # This is a simplified simulation of governance application.
        # In a real system, this would involve calling our governance engine.
        modified_response = response
        if governance_rules.get("censor_keywords"):
            for keyword in governance_rules["censor_keywords"]:
                modified_response = modified_response.replace(keyword, "[CENSORED]")
        if governance_rules.get("add_disclaimer"):
            modified_response += " [Disclaimer: This response is subject to governance policies.]"
        return modified_response

    async def get_agent_info(self) -> Dict[str, Any]:
        return {
            "id": self.agent_id,
            "name": self.agent_config.get("name", self.agent_id),
            "description": self.agent_config.get("description", "A demo agent"),
            "capabilities": self.agent_config.get("capabilities", []),
            "provider": self.agent_config.get("provider", "demo-wrapper")
        }


