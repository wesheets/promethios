import unittest
import json
import os
import sys
from unittest.mock import patch, MagicMock

# Add the src directory to the Python path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..')))

from src.agent_preference.preference_elicitation import PreferenceElicitor
from src.agent_preference.preference_analysis import PreferenceAnalyzer


class TestPreferenceElicitor(unittest.TestCase):
    """Test cases for the PreferenceElicitor class."""

    def setUp(self):
        """Set up test fixtures."""
        # Create a test configuration
        self.config = {
            'elicitation_enabled': True,
            'prompt_templates': {
                'general': "What are your preferences regarding {topic}?",
                'specific': "On a scale of 1-5, how important is {feature} to you?",
                'comparative': "Do you prefer {option_a} or {option_b}?"
            },
            'topics': ['privacy', 'performance', 'features', 'interface'],
            'storage_path': 'test_preference_data'
        }
        
        # Create a temporary directory for testing
        os.makedirs(self.config['storage_path'], exist_ok=True)
        
        # Initialize the PreferenceElicitor with the test configuration
        self.elicitor = PreferenceElicitor(self.config)
    
    def tearDown(self):
        """Clean up after tests."""
        # Clean up the temporary directory
        import shutil
        if os.path.exists(self.config['storage_path']):
            shutil.rmtree(self.config['storage_path'])
    
    def test_initialization(self):
        """Test that the PreferenceElicitor initializes correctly."""
        self.assertEqual(self.elicitor.enabled, self.config['elicitation_enabled'])
        self.assertEqual(self.elicitor.prompt_templates, self.config['prompt_templates'])
        self.assertEqual(self.elicitor.topics, self.config['topics'])
        self.assertEqual(self.elicitor.storage_path, self.config['storage_path'])
    
    def test_generate_prompt(self):
        """Test generating a preference elicitation prompt."""
        # Generate a general prompt
        prompt_type = "general"
        params = {"topic": "privacy"}
        
        prompt = self.elicitor.generate_prompt(prompt_type, params)
        
        # Check the prompt
        self.assertEqual(prompt, "What are your preferences regarding privacy?")
        
        # Generate a specific prompt
        prompt_type = "specific"
        params = {"feature": "data encryption"}
        
        prompt = self.elicitor.generate_prompt(prompt_type, params)
        
        # Check the prompt
        self.assertEqual(prompt, "On a scale of 1-5, how important is data encryption to you?")
        
        # Generate a comparative prompt
        prompt_type = "comparative"
        params = {"option_a": "speed", "option_b": "accuracy"}
        
        prompt = self.elicitor.generate_prompt(prompt_type, params)
        
        # Check the prompt
        self.assertEqual(prompt, "Do you prefer speed or accuracy?")
        
        # Try to generate a prompt with an invalid type
        with self.assertRaises(ValueError):
            self.elicitor.generate_prompt("invalid_type", {})
    
    def test_elicit_preference(self):
        """Test eliciting a preference from a user."""
        # Mock the user response
        user_id = "test-user"
        prompt_type = "general"
        params = {"topic": "privacy"}
        response = "I prefer strong privacy controls and minimal data collection."
        
        # Elicit the preference
        preference = self.elicitor.elicit_preference(user_id, prompt_type, params, response)
        
        # Check the preference
        self.assertIsInstance(preference, dict)
        self.assertEqual(preference["user_id"], user_id)
        self.assertEqual(preference["prompt_type"], prompt_type)
        self.assertEqual(preference["params"], params)
        self.assertEqual(preference["response"], response)
        self.assertIn("timestamp", preference)
        self.assertIn("id", preference)
        
        # Check that the preference was saved
        preference_id = preference["id"]
        file_path = os.path.join(self.config['storage_path'], f"preference_{preference_id}.json")
        self.assertTrue(os.path.exists(file_path))
        
        # Check the content of the file
        with open(file_path, 'r') as f:
            saved_preference = json.load(f)
            self.assertEqual(saved_preference["id"], preference_id)
            self.assertEqual(saved_preference["user_id"], user_id)
            self.assertEqual(saved_preference["response"], response)
    
    def test_get_user_preferences(self):
        """Test getting a user's preferences."""
        user_id = "test-user"
        
        # Create some preferences for the user
        self.elicitor.elicit_preference(
            user_id, "general", {"topic": "privacy"}, "I prefer strong privacy controls."
        )
        self.elicitor.elicit_preference(
            user_id, "specific", {"feature": "data encryption"}, "5"
        )
        self.elicitor.elicit_preference(
            user_id, "comparative", {"option_a": "speed", "option_b": "accuracy"}, "accuracy"
        )
        
        # Create a preference for another user
        self.elicitor.elicit_preference(
            "other-user", "general", {"topic": "features"}, "I like advanced features."
        )
        
        # Get the user's preferences
        preferences = self.elicitor.get_user_preferences(user_id)
        
        # Check the preferences
        self.assertEqual(len(preferences), 3)
        self.assertEqual(preferences[0]["user_id"], user_id)
        self.assertEqual(preferences[1]["user_id"], user_id)
        self.assertEqual(preferences[2]["user_id"], user_id)
    
    def test_get_preference_by_id(self):
        """Test getting a preference by ID."""
        # Create a preference
        preference = self.elicitor.elicit_preference(
            "test-user", "general", {"topic": "privacy"}, "I prefer strong privacy controls."
        )
        preference_id = preference["id"]
        
        # Get the preference by ID
        retrieved = self.elicitor.get_preference_by_id(preference_id)
        
        # Check the preference
        self.assertEqual(retrieved["id"], preference_id)
        self.assertEqual(retrieved["user_id"], "test-user")
        self.assertEqual(retrieved["response"], "I prefer strong privacy controls.")
        
        # Try to get a non-existent preference
        with self.assertRaises(ValueError):
            self.elicitor.get_preference_by_id("non-existent-id")
    
    def test_get_preferences_by_topic(self):
        """Test getting preferences by topic."""
        user_id = "test-user"
        
        # Create preferences for different topics
        self.elicitor.elicit_preference(
            user_id, "general", {"topic": "privacy"}, "I prefer strong privacy controls."
        )
        self.elicitor.elicit_preference(
            user_id, "general", {"topic": "features"}, "I like advanced features."
        )
        self.elicitor.elicit_preference(
            user_id, "general", {"topic": "privacy"}, "I don't want my data shared."
        )
        
        # Get preferences by topic
        privacy_prefs = self.elicitor.get_preferences_by_topic(user_id, "privacy")
        
        # Check the preferences
        self.assertEqual(len(privacy_prefs), 2)
        self.assertEqual(privacy_prefs[0]["params"]["topic"], "privacy")
        self.assertEqual(privacy_prefs[1]["params"]["topic"], "privacy")
        
        features_prefs = self.elicitor.get_preferences_by_topic(user_id, "features")
        self.assertEqual(len(features_prefs), 1)
        self.assertEqual(features_prefs[0]["params"]["topic"], "features")
        
        # Try to get preferences for a non-existent topic
        non_existent = self.elicitor.get_preferences_by_topic(user_id, "non-existent")
        self.assertEqual(len(non_existent), 0)


class TestPreferenceAnalyzer(unittest.TestCase):
    """Test cases for the PreferenceAnalyzer class."""

    def setUp(self):
        """Set up test fixtures."""
        # Create a test configuration
        self.config = {
            'analysis_enabled': True,
            'visualization_enabled': True,
            'storage_path': 'test_preference_data'
        }
        
        # Create a temporary directory for testing
        os.makedirs(self.config['storage_path'], exist_ok=True)
        
        # Initialize the PreferenceAnalyzer with the test configuration
        self.analyzer = PreferenceAnalyzer(self.config)
    
    def tearDown(self):
        """Clean up after tests."""
        # Clean up the temporary directory
        import shutil
        if os.path.exists(self.config['storage_path']):
            shutil.rmtree(self.config['storage_path'])
    
    def test_initialization(self):
        """Test that the PreferenceAnalyzer initializes correctly."""
        self.assertEqual(self.analyzer.enabled, self.config['analysis_enabled'])
        self.assertEqual(self.analyzer.visualization_enabled, self.config['visualization_enabled'])
        self.assertEqual(self.analyzer.storage_path, self.config['storage_path'])
    
    def test_analyze_user_preferences(self):
        """Test analyzing a user's preferences."""
        # Create mock preferences
        preferences = [
            {
                "id": "pref1",
                "user_id": "test-user",
                "prompt_type": "specific",
                "params": {"feature": "data encryption"},
                "response": "5",
                "timestamp": "2025-05-23T10:00:00Z"
            },
            {
                "id": "pref2",
                "user_id": "test-user",
                "prompt_type": "specific",
                "params": {"feature": "performance"},
                "response": "4",
                "timestamp": "2025-05-23T10:01:00Z"
            },
            {
                "id": "pref3",
                "user_id": "test-user",
                "prompt_type": "specific",
                "params": {"feature": "ease of use"},
                "response": "3",
                "timestamp": "2025-05-23T10:02:00Z"
            },
            {
                "id": "pref4",
                "user_id": "test-user",
                "prompt_type": "comparative",
                "params": {"option_a": "speed", "option_b": "accuracy"},
                "response": "accuracy",
                "timestamp": "2025-05-23T10:03:00Z"
            }
        ]
        
        # Mock the preference elicitor
        mock_elicitor = MagicMock()
        mock_elicitor.get_user_preferences.return_value = preferences
        
        # Set the elicitor
        self.analyzer.preference_elicitor = mock_elicitor
        
        # Analyze the preferences
        analysis = self.analyzer.analyze_user_preferences("test-user")
        
        # Check that the elicitor was called
        mock_elicitor.get_user_preferences.assert_called_once_with("test-user")
        
        # Check the analysis
        self.assertIsInstance(analysis, dict)
        self.assertEqual(analysis["user_id"], "test-user")
        self.assertEqual(analysis["preference_count"], 4)
        self.assertIn("feature_preferences", analysis)
        self.assertIn("comparative_preferences", analysis)
        
        # Check feature preferences
        self.assertEqual(len(analysis["feature_preferences"]), 3)
        self.assertEqual(analysis["feature_preferences"]["data encryption"], 5)
        self.assertEqual(analysis["feature_preferences"]["performance"], 4)
        self.assertEqual(analysis["feature_preferences"]["ease of use"], 3)
        
        # Check comparative preferences
        self.assertEqual(len(analysis["comparative_preferences"]), 1)
        self.assertEqual(analysis["comparative_preferences"][0]["preference"], "accuracy")
    
    def test_generate_preference_profile(self):
        """Test generating a preference profile for a user."""
        # Create mock analysis
        analysis = {
            "user_id": "test-user",
            "preference_count": 4,
            "feature_preferences": {
                "data encryption": 5,
                "performance": 4,
                "ease of use": 3
            },
            "comparative_preferences": [
                {
                    "option_a": "speed",
                    "option_b": "accuracy",
                    "preference": "accuracy"
                }
            ]
        }
        
        # Generate the profile
        profile = self.analyzer.generate_preference_profile(analysis)
        
        # Check the profile
        self.assertIsInstance(profile, dict)
        self.assertEqual(profile["user_id"], "test-user")
        self.assertIn("top_preferences", profile)
        self.assertIn("preference_categories", profile)
        
        # Check top preferences
        self.assertEqual(len(profile["top_preferences"]), 3)
        self.assertEqual(profile["top_preferences"][0]["feature"], "data encryption")
        self.assertEqual(profile["top_preferences"][0]["score"], 5)
        
        # Check preference categories
        self.assertIn("security", profile["preference_categories"])
        self.assertIn("performance", profile["preference_categories"])
        self.assertIn("usability", profile["preference_categories"])
    
    def test_save_analysis_results(self):
        """Test saving analysis results."""
        # Create mock analysis
        analysis = {
            "user_id": "test-user",
            "preference_count": 4,
            "feature_preferences": {
                "data encryption": 5,
                "performance": 4,
                "ease of use": 3
            },
            "comparative_preferences": [
                {
                    "option_a": "speed",
                    "option_b": "accuracy",
                    "preference": "accuracy"
                }
            ]
        }
        
        # Save the analysis
        result = self.analyzer.save_analysis_results(analysis)
        
        # Check the result
        self.assertTrue(result["success"])
        self.assertIn("file_path", result)
        
        # Check that the file was created
        file_path = result["file_path"]
        self.assertTrue(os.path.exists(file_path))
        
        # Check the content of the file
        with open(file_path, 'r') as f:
            saved_analysis = json.load(f)
            self.assertEqual(saved_analysis["user_id"], "test-user")
            self.assertEqual(saved_analysis["preference_count"], 4)
    
    @patch('matplotlib.pyplot.savefig')
    def test_generate_visualization(self, mock_savefig):
        """Test generating a visualization of preferences."""
        # Skip if visualization is not enabled
        if not self.analyzer.visualization_enabled:
            self.skipTest("Visualization is not enabled")
        
        # Create mock analysis
        analysis = {
            "user_id": "test-user",
            "preference_count": 4,
            "feature_preferences": {
                "data encryption": 5,
                "performance": 4,
                "ease of use": 3,
                "customization": 2,
                "integration": 1
            },
            "comparative_preferences": [
                {
                    "option_a": "speed",
                    "option_b": "accuracy",
                    "preference": "accuracy"
                }
            ]
        }
        
        # Generate the visualization
        result = self.analyzer.generate_visualization(analysis)
        
        # Check the result
        self.assertTrue(result["success"])
        self.assertIn("file_path", result)
        
        # Check that savefig was called
        mock_savefig.assert_called_once()


if __name__ == '__main__':
    unittest.main()
