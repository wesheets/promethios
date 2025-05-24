import unittest
import sys
import os
import json
from unittest.mock import patch, MagicMock

# Add the src directory to the Python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../../src')))

from core.governance_inheritance import ExtensionBase
from preference.preference_collection import PreferenceDataCollectionFramework, PreferenceCollector, PreferenceAnalyzer, PreferenceStorage


class TestExtensionBase(unittest.TestCase):
    """Test the base extension class that provides governance inheritance."""
    
    def setUp(self):
        self.extension = ExtensionBase(
            extension_id="TEST-001",
            extension_type="TEST",
            trust_impact="Minimal"
        )
    
    def test_initialization(self):
        """Test that the extension is initialized with correct properties."""
        self.assertEqual(self.extension.extension_id, "TEST-001")
        self.assertEqual(self.extension.extension_type, "TEST")
        self.assertEqual(self.extension.trust_impact, "Minimal")
        self.assertFalse(self.extension.override_active)
    
    def test_check_override(self):
        """Test the override checking functionality."""
        # Default should be False
        self.assertFalse(self.extension.check_override())
        
        # Set override and check again
        self.extension.override_active = True
        self.assertTrue(self.extension.check_override())
    
    def test_log_memory(self):
        """Test the memory logging functionality."""
        with patch('core.governance_inheritance.logging.info') as mock_log:
            self.extension.log_memory("test_action", {"key": "value"})
            mock_log.assert_called_once()
    
    def test_reflect(self):
        """Test the reflection capability."""
        reflection = self.extension.reflect()
        self.assertEqual(reflection["extension_id"], "TEST-001")
        self.assertEqual(reflection["extension_type"], "TEST")
        self.assertEqual(reflection["trust_impact"], "Minimal")
        self.assertIn("timestamp", reflection)


class TestPreferenceDataCollectionFramework(unittest.TestCase):
    """Test the Preference Data Collection Framework extension."""
    
    def setUp(self):
        self.framework = PreferenceDataCollectionFramework()
    
    def test_initialization(self):
        """Test that the framework is initialized correctly."""
        self.assertEqual(self.framework.extension_id, "EXT-CORE-001")
        self.assertEqual(self.framework.extension_type, "CORE")
        self.assertEqual(self.framework.trust_impact, "Medium")
        self.assertIsInstance(self.framework.collector, PreferenceCollector)
        self.assertIsInstance(self.framework.analyzer, PreferenceAnalyzer)
        self.assertIsInstance(self.framework.storage, PreferenceStorage)
    
    def test_collect_explicit_preference(self):
        """Test collecting explicit preferences."""
        with patch.object(self.framework.collector, 'collect_explicit_preference') as mock_collect:
            mock_collect.return_value = {"status": "success", "preference_id": "test_id"}
            
            result = self.framework.collect_explicit_preference(
                user_id="user123",
                preference_type="test_type",
                preference_value="test_value"
            )
            
            mock_collect.assert_called_once_with(
                user_id="user123",
                preference_type="test_type",
                preference_value="test_value"
            )
            
            self.assertEqual(result["status"], "success")
    
    def test_collect_implicit_preference(self):
        """Test collecting implicit preferences."""
        with patch.object(self.framework.collector, 'collect_implicit_preference') as mock_collect:
            mock_collect.return_value = {"status": "success", "preference_id": "test_id"}
            
            result = self.framework.collect_implicit_preference(
                user_id="user123",
                context="test_context",
                behavior="test_behavior",
                inferred_preference="test_preference"
            )
            
            mock_collect.assert_called_once_with(
                user_id="user123",
                context="test_context",
                behavior="test_behavior",
                inferred_preference="test_preference"
            )
            
            self.assertEqual(result["status"], "success")
    
    def test_analyze_preferences(self):
        """Test analyzing preferences."""
        with patch.object(self.framework.analyzer, 'analyze_preferences') as mock_analyze:
            mock_analyze.return_value = {"status": "success", "analysis": {"key": "value"}}
            
            result = self.framework.analyze_preferences(user_id="user123")
            
            mock_analyze.assert_called_once_with(user_id="user123")
            self.assertEqual(result["status"], "success")
    
    def test_get_preference_profile(self):
        """Test getting preference profiles."""
        with patch.object(self.framework.analyzer, 'get_preference_profile') as mock_get:
            mock_get.return_value = {"status": "success", "profile": {"key": "value"}}
            
            result = self.framework.get_preference_profile(user_id="user123")
            
            mock_get.assert_called_once_with(user_id="user123")
            self.assertEqual(result["status"], "success")
    
    def test_store_preference(self):
        """Test storing preferences."""
        with patch.object(self.framework.storage, 'store_preference') as mock_store:
            mock_store.return_value = {"status": "success", "preference_id": "test_id"}
            
            result = self.framework.store_preference(
                user_id="user123",
                preference_data={"type": "test", "value": "test_value"}
            )
            
            mock_store.assert_called_once_with(
                user_id="user123",
                preference_data={"type": "test", "value": "test_value"}
            )
            
            self.assertEqual(result["status"], "success")
    
    def test_get_preferences(self):
        """Test retrieving preferences."""
        with patch.object(self.framework.storage, 'get_preferences') as mock_get:
            mock_get.return_value = {"status": "success", "preferences": [{"key": "value"}]}
            
            result = self.framework.get_preferences(user_id="user123")
            
            mock_get.assert_called_once_with(user_id="user123")
            self.assertEqual(result["status"], "success")
    
    def test_override_check(self):
        """Test that governance override checks work."""
        self.framework.override_active = True
        
        result = self.framework.collect_explicit_preference(
            user_id="user123",
            preference_type="test_type",
            preference_value="test_value"
        )
        
        self.assertEqual(result["status"], "override_active")
    
    def test_reflect(self):
        """Test the reflection capability."""
        reflection = self.framework.reflect()
        self.assertEqual(reflection["extension_id"], "EXT-CORE-001")
        self.assertEqual(reflection["extension_type"], "CORE")
        self.assertEqual(reflection["component"], "PreferenceDataCollectionFramework")


class TestPreferenceCollector(unittest.TestCase):
    """Test the Preference Collector component."""
    
    def setUp(self):
        self.collector = PreferenceCollector()
    
    def test_initialization(self):
        """Test that the collector is initialized correctly."""
        self.assertEqual(self.collector.extension_id, "EXT-CORE-001")
        self.assertEqual(self.collector.extension_type, "CORE")
    
    def test_collect_explicit_preference(self):
        """Test collecting explicit preferences."""
        with patch('preference.preference_collection.uuid.uuid4') as mock_uuid:
            mock_uuid.return_value = "test-uuid"
            
            result = self.collector.collect_explicit_preference(
                user_id="user123",
                preference_type="test_type",
                preference_value="test_value"
            )
            
            self.assertEqual(result["status"], "success")
            self.assertEqual(result["preference_id"], "test-uuid")
            self.assertEqual(result["preference_data"]["user_id"], "user123")
            self.assertEqual(result["preference_data"]["type"], "test_type")
            self.assertEqual(result["preference_data"]["value"], "test_value")
            self.assertEqual(result["preference_data"]["source"], "explicit")
    
    def test_collect_implicit_preference(self):
        """Test collecting implicit preferences."""
        with patch('preference.preference_collection.uuid.uuid4') as mock_uuid:
            mock_uuid.return_value = "test-uuid"
            
            result = self.collector.collect_implicit_preference(
                user_id="user123",
                context="test_context",
                behavior="test_behavior",
                inferred_preference="test_preference"
            )
            
            self.assertEqual(result["status"], "success")
            self.assertEqual(result["preference_id"], "test-uuid")
            self.assertEqual(result["preference_data"]["user_id"], "user123")
            self.assertEqual(result["preference_data"]["context"], "test_context")
            self.assertEqual(result["preference_data"]["behavior"], "test_behavior")
            self.assertEqual(result["preference_data"]["inferred_preference"], "test_preference")
            self.assertEqual(result["preference_data"]["source"], "implicit")
    
    def test_validate_preference_data(self):
        """Test preference data validation."""
        # Valid data
        valid_data = {
            "user_id": "user123",
            "type": "test_type",
            "value": "test_value"
        }
        self.assertTrue(self.collector._validate_preference_data(valid_data))
        
        # Invalid data (missing required field)
        invalid_data = {
            "user_id": "user123",
            "value": "test_value"
        }
        self.assertFalse(self.collector._validate_preference_data(invalid_data))


class TestPreferenceAnalyzer(unittest.TestCase):
    """Test the Preference Analyzer component."""
    
    def setUp(self):
        self.analyzer = PreferenceAnalyzer()
    
    def test_initialization(self):
        """Test that the analyzer is initialized correctly."""
        self.assertEqual(self.analyzer.extension_id, "EXT-CORE-001")
        self.assertEqual(self.analyzer.extension_type, "CORE")
    
    def test_analyze_preferences(self):
        """Test analyzing preferences."""
        # Mock the storage get_preferences method
        mock_storage = MagicMock()
        mock_storage.get_preferences.return_value = {
            "status": "success",
            "preferences": [
                {
                    "id": "pref1",
                    "user_id": "user123",
                    "type": "color",
                    "value": "blue",
                    "source": "explicit",
                    "timestamp": "2025-05-23T10:00:00Z"
                },
                {
                    "id": "pref2",
                    "user_id": "user123",
                    "type": "theme",
                    "value": "dark",
                    "source": "explicit",
                    "timestamp": "2025-05-23T11:00:00Z"
                }
            ]
        }
        
        self.analyzer.storage = mock_storage
        
        result = self.analyzer.analyze_preferences(user_id="user123")
        
        self.assertEqual(result["status"], "success")
        self.assertIn("analysis", result)
        self.assertIn("preference_count", result["analysis"])
        self.assertEqual(result["analysis"]["preference_count"], 2)
    
    def test_get_preference_profile(self):
        """Test getting preference profiles."""
        # Debug module identity and patching
        import sys
        print(f"DEBUG: Module identity check - PreferenceAnalyzer in sys.modules: {'preference.preference_collection' in sys.modules}")
        print(f"DEBUG: Module path: {sys.modules.get('preference.preference_collection', 'Not found')}")
        print(f"DEBUG: Analyzer instance memory address: {id(self.analyzer)}")
        print(f"DEBUG: Analyzer class memory address: {id(self.analyzer.__class__)}")
        print(f"DEBUG: analyze_preferences method memory address: {id(self.analyzer.analyze_preferences)}")
        
        # Mock the analyze_preferences method at the module level instead of instance level
        with patch('preference.preference_collection.PreferenceAnalyzer.analyze_preferences') as mock_analyze:
            print(f"DEBUG: Mock object created: {mock_analyze}")
            mock_analyze.return_value = {
                "status": "success",
                "analysis": {
                    "preference_count": 2,
                    "explicit_count": 2,
                    "implicit_count": 0,
                    "preference_types": ["color", "theme"],
                    "preference_values": {"color": "blue", "theme": "dark"}
                }
            }
            
            result = self.analyzer.get_preference_profile(user_id="user123")
            print(f"DEBUG: After get_preference_profile call, mock called: {mock_analyze.call_count} times")
            print(f"DEBUG: Mock call args: {mock_analyze.call_args_list}")
            
            mock_analyze.assert_called_once_with(user_id="user123")
            self.assertEqual(result["status"], "success")
            self.assertIn("profile", result)
            self.assertEqual(result["profile"]["color"], "blue")
            self.assertEqual(result["profile"]["theme"], "dark")


class TestPreferenceStorage(unittest.TestCase):
    """Test the Preference Storage component."""
    
    def setUp(self):
        self.storage = PreferenceStorage()
        
        # Create a temporary data directory for testing
        os.makedirs("data", exist_ok=True)
    
    def tearDown(self):
        # Clean up test data
        if os.path.exists("data/preferences.json"):
            os.remove("data/preferences.json")
    
    def test_initialization(self):
        """Test that the storage is initialized correctly."""
        self.assertEqual(self.storage.extension_id, "EXT-CORE-001")
        self.assertEqual(self.storage.extension_type, "CORE")
    
    def test_store_preference(self):
        """Test storing preferences."""
        with patch('preference.preference_collection.uuid.uuid4') as mock_uuid:
            mock_uuid.return_value = "test-uuid"
            
            result = self.storage.store_preference(
                user_id="user123",
                preference_data={"type": "test_type", "value": "test_value"}
            )
            
            self.assertEqual(result["status"], "success")
            self.assertEqual(result["preference_id"], "test-uuid")
    
    def test_get_preferences(self):
        """Test retrieving preferences."""
        # Store a test preference
        with patch('preference.preference_collection.uuid.uuid4') as mock_uuid:
            mock_uuid.return_value = "test-uuid"
            
            self.storage.store_preference(
                user_id="user123",
                preference_data={"type": "test_type", "value": "test_value"}
            )
            
            # Get preferences for the user
            result = self.storage.get_preferences(user_id="user123")
            
            self.assertEqual(result["status"], "success")
            self.assertEqual(len(result["preferences"]), 1)
            self.assertEqual(result["preferences"][0]["id"], "test-uuid")
            self.assertEqual(result["preferences"][0]["user_id"], "user123")
            self.assertEqual(result["preferences"][0]["type"], "test_type")
            self.assertEqual(result["preferences"][0]["value"], "test_value")
    
    def test_get_preferences_nonexistent_user(self):
        """Test retrieving preferences for a nonexistent user."""
        result = self.storage.get_preferences(user_id="nonexistent")
        
        self.assertEqual(result["status"], "success")
        self.assertEqual(result["preferences"], [])


if __name__ == '__main__':
    unittest.main()
