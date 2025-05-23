import unittest
import json
import uuid
import os
from datetime import datetime

# This is a test scaffold for the trust_log_writer.py implementation
# Builder Manus should implement the actual TrustLogWriter class in trust_log_writer.py

class TestTrustLogWriter(unittest.TestCase):
    def setUp(self):
        # Import the necessary classes
        # These imports are placed here to allow for module implementation before test execution
        from src.core.verification.seal_verification import ReplayVerifier
        from src.core.trust.trust_log_writer import TrustLogWriter
        
        self.verifier = ReplayVerifier()
        self.writer = TrustLogWriter()
        self.execution_id = str(uuid.uuid4())
        
        # Create sample replay log
        self.replay_log = {
            "execution_id": self.execution_id,
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "entries": []
        }
        
        # Add entries to replay log with proper hash chain
        previous_hash = ""
        for i in range(5):
            entry_data = {"state": f"state_{i}"}
            entry_json = json.dumps(entry_data, sort_keys=True)
            current_hash = self._calculate_hash(previous_hash + entry_json)
            
            entry = {
                "entry_id": i,
                "timestamp": datetime.utcnow().isoformat() + "Z",
                "event_type": "state_transition",
                "event_data": entry_data,
                "previous_hash": previous_hash,
                "current_hash": current_hash
            }
            self.replay_log["entries"].append(entry)
            previous_hash = current_hash
            
        # Verify replay log
        self.verification_result = self.verifier.verify_execution(self.execution_id, self.replay_log)
        
    def _calculate_hash(self, data):
        """Helper method to calculate SHA-256 hash."""
        import hashlib
        return hashlib.sha256(data.encode()).hexdigest()
            
    def test_trust_log_binding_schema_compliance(self):
        """Test that trust log binding complies with schema."""
        binding = self.writer.write_replay_log(self.replay_log, self.verification_result)
        
        # Verify required fields
        self.assertIn("binding_id", binding)
        self.assertIn("contract_version", binding)
        self.assertIn("timestamp", binding)
        self.assertIn("replay_log", binding)
        self.assertIn("ui_binding", binding)
        self.assertIn("codex_clauses", binding)
        
        # Verify contract version
        self.assertEqual(binding["contract_version"], "v2025.05.20")
        
        # Verify clauses
        self.assertIn("5.2", binding["codex_clauses"])
        self.assertIn("5.3", binding["codex_clauses"])
        self.assertIn("11.0", binding["codex_clauses"])
        self.assertIn("12.20", binding["codex_clauses"])
        
        # Verify UI binding
        self.assertEqual(binding["ui_binding"]["module_id"], "UI-12.20")
        self.assertTrue(binding["ui_binding"]["access_control"]["read_only"])
        
        # Validate against schema
        schema_path = os.path.join("schemas", "ui", "trust_log_replay_binding.schema.v1.json")
        with open(schema_path, "r") as f:
            schema = json.load(f)
            
        try:
            import jsonschema
            jsonschema.validate(binding, schema)
        except jsonschema.exceptions.ValidationError as e:
            self.fail(f"Trust log binding does not match schema: {str(e)}")
        
    def test_merkle_root_inclusion(self):
        """Test Merkle root inclusion in trust log binding."""
        binding = self.writer.write_replay_log(self.replay_log, self.verification_result)
        
        # Verify Merkle root is included
        self.assertIn("merkle_root", binding["replay_log"])
        self.assertNotEqual(binding["replay_log"]["merkle_root"], "")
        
    def test_verification_status_inclusion(self):
        """Test verification status inclusion in trust log binding."""
        binding = self.writer.write_replay_log(self.replay_log, self.verification_result)
        
        # Verify verification status is included
        self.assertIn("verification_status", binding["replay_log"])
        self.assertIn("is_verified", binding["replay_log"]["verification_status"])
        self.assertIn("verification_timestamp", binding["replay_log"]["verification_status"])
        self.assertIn("verification_method", binding["replay_log"]["verification_status"])
        self.assertIn("verification_id", binding["replay_log"]["verification_status"])
        
    def test_hash_sealed_trust_log(self):
        """Test that trust log is hash-sealed."""
        binding = self.writer.write_replay_log(self.replay_log, self.verification_result)
        
        # Verify that merkle_root is calculated and included
        self.assertIn("merkle_root", binding["replay_log"])
        self.assertNotEqual(binding["replay_log"]["merkle_root"], "")
        
        # Verify that the merkle_root is a valid hash
        import re
        hash_pattern = re.compile(r'^[a-f0-9]{64}$')
        self.assertTrue(hash_pattern.match(binding["replay_log"]["merkle_root"]))
        
    def test_pre_loop_tether_check(self):
        """Test that pre_loop_tether_check is called."""
        # This test requires mocking or instrumentation to verify the call
        # Builder Manus should implement this test based on their implementation
        
        # For now, we'll just verify that trust log writing succeeds with a valid .codex.lock
        binding = self.writer.write_replay_log(self.replay_log, self.verification_result)
        self.assertIsNotNone(binding)
        
    def test_file_writing(self):
        """Test that trust log binding is written to file."""
        # Ensure logs directory exists
        import os
        os.makedirs("logs/trust_logs", exist_ok=True)
        
        # Write trust log binding
        binding = self.writer.write_replay_log(self.replay_log, self.verification_result)
        
        # Verify that file was written
        binding_id = binding.get("binding_id")
        self.assertTrue(os.path.exists(f"logs/trust_logs/{binding_id}.json"))
        
        # Verify file contents
        with open(f"logs/trust_logs/{binding_id}.json", "r") as f:
            saved_binding = json.load(f)
            
        self.assertEqual(saved_binding["binding_id"], binding["binding_id"])
        self.assertEqual(saved_binding["contract_version"], binding["contract_version"])
        
if __name__ == "__main__":
    unittest.main()
