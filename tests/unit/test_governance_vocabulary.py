import unittest
import sys
import os
import json
from unittest.mock import patch, MagicMock

# Add the src directory to the Python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../../src')))

from core.governance_inheritance import ExtensionBase
from ui.governance_vocabulary import GovernanceVocabulary, VocabularyManager, TermRenderer, VocabularySearch


class TestGovernanceVocabulary(unittest.TestCase):
    """Test the Shared Governance Vocabulary System UI extension."""
    
    def setUp(self):
        self.vocabulary = GovernanceVocabulary()
    
    def test_initialization(self):
        """Test that the vocabulary system is initialized correctly."""
        self.assertEqual(self.vocabulary.extension_id, "EXT-UI-003")
        self.assertEqual(self.vocabulary.extension_type, "UI")
        self.assertEqual(self.vocabulary.trust_impact, "Low")
        self.assertIsInstance(self.vocabulary.manager, VocabularyManager)
        self.assertIsInstance(self.vocabulary.renderer, TermRenderer)
        self.assertIsInstance(self.vocabulary.search, VocabularySearch)
    
    def test_get_term(self):
        """Test getting a governance term."""
        with patch.object(self.vocabulary.manager, 'get_term') as mock_get:
            mock_get.return_value = {
                "status": "success",
                "term": {
                    "id": "term1",
                    "name": "Governance",
                    "definition": "The system of rules, practices, and processes...",
                    "category": "core"
                }
            }
            
            result = self.vocabulary.get_term(term_id="term1")
            
            mock_get.assert_called_once_with(term_id="term1")
            self.assertEqual(result["status"], "success")
            self.assertEqual(result["term"]["name"], "Governance")
    
    def test_get_all_terms(self):
        """Test getting all governance terms."""
        with patch.object(self.vocabulary.manager, 'get_all_terms') as mock_get:
            mock_get.return_value = {
                "status": "success",
                "terms": [
                    {
                        "id": "term1",
                        "name": "Governance",
                        "definition": "The system of rules...",
                        "category": "core"
                    },
                    {
                        "id": "term2",
                        "name": "Trust Tier",
                        "definition": "A level of trust...",
                        "category": "access"
                    }
                ]
            }
            
            result = self.vocabulary.get_all_terms()
            
            mock_get.assert_called_once()
            self.assertEqual(result["status"], "success")
            self.assertEqual(len(result["terms"]), 2)
    
    def test_get_terms_by_category(self):
        """Test getting terms by category."""
        with patch.object(self.vocabulary.manager, 'get_terms_by_category') as mock_get:
            mock_get.return_value = {
                "status": "success",
                "terms": [
                    {
                        "id": "term1",
                        "name": "Governance",
                        "definition": "The system of rules...",
                        "category": "core"
                    }
                ]
            }
            
            result = self.vocabulary.get_terms_by_category(category="core")
            
            mock_get.assert_called_once_with(category="core")
            self.assertEqual(result["status"], "success")
            self.assertEqual(len(result["terms"]), 1)
    
    def test_search_terms(self):
        """Test searching for terms."""
        with patch.object(self.vocabulary.search, 'search_terms') as mock_search:
            mock_search.return_value = {
                "status": "success",
                "results": [
                    {
                        "id": "term1",
                        "name": "Governance",
                        "definition": "The system of rules...",
                        "category": "core",
                        "relevance": 0.95
                    }
                ]
            }
            
            result = self.vocabulary.search_terms(
                query="governance",
                categories=["core", "access"]
            )
            
            mock_search.assert_called_once_with(
                query="governance",
                categories=["core", "access"]
            )
            
            self.assertEqual(result["status"], "success")
            self.assertEqual(len(result["results"]), 1)
            self.assertEqual(result["results"][0]["name"], "Governance")
    
    def test_render_term_terminal(self):
        """Test rendering a term for terminal UI."""
        with patch.object(self.vocabulary.renderer, 'render_term_terminal') as mock_render:
            mock_render.return_value = "Rendered term for terminal"
            
            term_data = {
                "id": "term1",
                "name": "Governance",
                "definition": "The system of rules...",
                "category": "core"
            }
            
            result = self.vocabulary.render_term_terminal(term_data)
            
            mock_render.assert_called_once_with(term_data)
            self.assertEqual(result, "Rendered term for terminal")
    
    def test_render_term_cockpit(self):
        """Test rendering a term for cockpit UI."""
        with patch.object(self.vocabulary.renderer, 'render_term_cockpit') as mock_render:
            mock_render.return_value = "<div>Rendered term for cockpit</div>"
            
            term_data = {
                "id": "term1",
                "name": "Governance",
                "definition": "The system of rules...",
                "category": "core"
            }
            
            result = self.vocabulary.render_term_cockpit(term_data)
            
            mock_render.assert_called_once_with(term_data)
            self.assertEqual(result, "<div>Rendered term for cockpit</div>")
    
    def test_render_term_list_terminal(self):
        """Test rendering a term list for terminal UI."""
        with patch.object(self.vocabulary.renderer, 'render_term_list_terminal') as mock_render:
            mock_render.return_value = "Rendered term list for terminal"
            
            terms = [
                {
                    "id": "term1",
                    "name": "Governance",
                    "definition": "The system of rules...",
                    "category": "core"
                },
                {
                    "id": "term2",
                    "name": "Trust Tier",
                    "definition": "A level of trust...",
                    "category": "access"
                }
            ]
            
            result = self.vocabulary.render_term_list_terminal(terms)
            
            mock_render.assert_called_once_with(terms)
            self.assertEqual(result, "Rendered term list for terminal")
    
    def test_render_term_list_cockpit(self):
        """Test rendering a term list for cockpit UI."""
        with patch.object(self.vocabulary.renderer, 'render_term_list_cockpit') as mock_render:
            mock_render.return_value = "<div>Rendered term list for cockpit</div>"
            
            terms = [
                {
                    "id": "term1",
                    "name": "Governance",
                    "definition": "The system of rules...",
                    "category": "core"
                },
                {
                    "id": "term2",
                    "name": "Trust Tier",
                    "definition": "A level of trust...",
                    "category": "access"
                }
            ]
            
            result = self.vocabulary.render_term_list_cockpit(terms)
            
            mock_render.assert_called_once_with(terms)
            self.assertEqual(result, "<div>Rendered term list for cockpit</div>")
    
    def test_override_check(self):
        """Test that governance override checks work."""
        self.vocabulary.override_active = True
        
        result = self.vocabulary.get_term(term_id="term1")
        
        self.assertEqual(result["status"], "override_active")
    
    def test_reflect(self):
        """Test the reflection capability."""
        reflection = self.vocabulary.reflect()
        self.assertEqual(reflection["extension_id"], "EXT-UI-003")
        self.assertEqual(reflection["extension_type"], "UI")
        self.assertEqual(reflection["component"], "GovernanceVocabulary")


class TestVocabularyManager(unittest.TestCase):
    """Test the Vocabulary Manager component."""
    
    def setUp(self):
        self.manager = VocabularyManager()
        
        # Create a temporary data directory for testing
        os.makedirs("data", exist_ok=True)
    
    def tearDown(self):
        # Clean up test data
        if os.path.exists("data/vocabulary.json"):
            os.remove("data/vocabulary.json")
    
    def test_initialization(self):
        """Test that the manager is initialized correctly."""
        self.assertEqual(self.manager.extension_id, "EXT-UI-003")
        self.assertEqual(self.manager.extension_type, "UI")
    
    def test_get_term(self):
        """Test getting a governance term."""
        # Create test terms
        self.manager._save_vocabulary({
            "term1": {
                "id": "term1",
                "name": "Governance",
                "definition": "The system of rules...",
                "category": "core"
            },
            "term2": {
                "id": "term2",
                "name": "Trust Tier",
                "definition": "A level of trust...",
                "category": "access"
            }
        })
        
        # Get existing term
        result = self.manager.get_term(term_id="term1")
        
        self.assertEqual(result["status"], "success")
        self.assertEqual(result["term"]["name"], "Governance")
        
        # Get non-existent term
        result = self.manager.get_term(term_id="nonexistent")
        
        self.assertEqual(result["status"], "error")
    
    def test_get_all_terms(self):
        """Test getting all governance terms."""
        # Create test terms
        self.manager._save_vocabulary({
            "term1": {
                "id": "term1",
                "name": "Governance",
                "definition": "The system of rules...",
                "category": "core"
            },
            "term2": {
                "id": "term2",
                "name": "Trust Tier",
                "definition": "A level of trust...",
                "category": "access"
            }
        })
        
        result = self.manager.get_all_terms()
        
        self.assertEqual(result["status"], "success")
        self.assertEqual(len(result["terms"]), 2)
    
    def test_get_terms_by_category(self):
        """Test getting terms by category."""
        # Create test terms
        self.manager._save_vocabulary({
            "term1": {
                "id": "term1",
                "name": "Governance",
                "definition": "The system of rules...",
                "category": "core"
            },
            "term2": {
                "id": "term2",
                "name": "Trust Tier",
                "definition": "A level of trust...",
                "category": "access"
            },
            "term3": {
                "id": "term3",
                "name": "Preference",
                "definition": "A user setting...",
                "category": "core"
            }
        })
        
        # Get core terms
        result = self.manager.get_terms_by_category(category="core")
        
        self.assertEqual(result["status"], "success")
        self.assertEqual(len(result["terms"]), 2)
        
        # Get access terms
        result = self.manager.get_terms_by_category(category="access")
        
        self.assertEqual(result["status"], "success")
        self.assertEqual(len(result["terms"]), 1)
        
        # Get non-existent category
        result = self.manager.get_terms_by_category(category="nonexistent")
        
        self.assertEqual(result["status"], "success")
        self.assertEqual(len(result["terms"]), 0)
    
    def test_add_term(self):
        """Test adding a governance term."""
        # Add a term
        result = self.manager.add_term(
            name="Governance",
            definition="The system of rules...",
            category="core",
            related_terms=["trust"]
        )
        
        self.assertEqual(result["status"], "success")
        self.assertIn("term_id", result)
        
        # Verify term was added
        vocabulary = self.manager._load_vocabulary()
        self.assertIn(result["term_id"], vocabulary)
        self.assertEqual(vocabulary[result["term_id"]]["name"], "Governance")
        
        # Try to add a duplicate term
        result = self.manager.add_term(
            name="Governance",
            definition="Different definition...",
            category="core"
        )
        
        self.assertEqual(result["status"], "error")
    
    def test_update_term(self):
        """Test updating a governance term."""
        # Add a term
        add_result = self.manager.add_term(
            name="Governance",
            definition="The system of rules...",
            category="core"
        )
        
        term_id = add_result["term_id"]
        
        # Update the term
        result = self.manager.update_term(
            term_id=term_id,
            updates={
                "definition": "Updated definition...",
                "related_terms": ["trust"]
            }
        )
        
        self.assertEqual(result["status"], "success")
        
        # Verify term was updated
        vocabulary = self.manager._load_vocabulary()
        self.assertEqual(vocabulary[term_id]["definition"], "Updated definition...")
        self.assertEqual(vocabulary[term_id]["related_terms"], ["trust"])
        
        # Try to update a non-existent term
        result = self.manager.update_term(
            term_id="nonexistent",
            updates={"definition": "New definition"}
        )
        
        self.assertEqual(result["status"], "error")
    
    def test_delete_term(self):
        """Test deleting a governance term."""
        # Add a term
        add_result = self.manager.add_term(
            name="Governance",
            definition="The system of rules...",
            category="core"
        )
        
        term_id = add_result["term_id"]
        
        # Delete the term
        result = self.manager.delete_term(term_id=term_id)
        
        self.assertEqual(result["status"], "success")
        
        # Verify term was deleted
        vocabulary = self.manager._load_vocabulary()
        self.assertNotIn(term_id, vocabulary)
        
        # Try to delete a non-existent term
        result = self.manager.delete_term(term_id="nonexistent")
        
        self.assertEqual(result["status"], "error")


class TestTermRenderer(unittest.TestCase):
    """Test the Term Renderer component."""
    
    def setUp(self):
        self.renderer = TermRenderer()
    
    def test_initialization(self):
        """Test that the renderer is initialized correctly."""
        self.assertEqual(self.renderer.extension_id, "EXT-UI-003")
        self.assertEqual(self.renderer.extension_type, "UI")
    
    def test_render_term_terminal(self):
        """Test rendering a term for terminal UI."""
        term_data = {
            "id": "term1",
            "name": "Governance",
            "definition": "The system of rules...",
            "category": "core",
            "related_terms": ["trust"]
        }
        
        result = self.renderer.render_term_terminal(term_data)
        
        self.assertIn("GOVERNANCE", result)
        self.assertIn("The system of rules", result)
        self.assertIn("Category: core", result)
        self.assertIn("Related Terms: trust", result)
    
    def test_render_term_cockpit(self):
        """Test rendering a term for cockpit UI."""
        term_data = {
            "id": "term1",
            "name": "Governance",
            "definition": "The system of rules...",
            "category": "core",
            "related_terms": ["trust"]
        }
        
        result = self.renderer.render_term_cockpit(term_data)
        
        self.assertIn("<div class='governance-term'>", result)
        self.assertIn("<h2>Governance</h2>", result)
        self.assertIn("<p>The system of rules...</p>", result)
        self.assertIn("<span class='term-category'>core</span>", result)
        self.assertIn("<li>trust</li>", result)
    
    def test_render_term_list_terminal(self):
        """Test rendering a term list for terminal UI."""
        terms = [
            {
                "id": "term1",
                "name": "Governance",
                "definition": "The system of rules...",
                "category": "core"
            },
            {
                "id": "term2",
                "name": "Trust Tier",
                "definition": "A level of trust...",
                "category": "access"
            }
        ]
        
        result = self.renderer.render_term_list_terminal(terms)
        
        self.assertIn("GOVERNANCE VOCABULARY", result)
        self.assertIn("Governance", result)
        self.assertIn("Trust Tier", result)
        self.assertIn("core", result)
        self.assertIn("access", result)
    
    def test_render_term_list_cockpit(self):
        """Test rendering a term list for cockpit UI."""
        terms = [
            {
                "id": "term1",
                "name": "Governance",
                "definition": "The system of rules...",
                "category": "core"
            },
            {
                "id": "term2",
                "name": "Trust Tier",
                "definition": "A level of trust...",
                "category": "access"
            }
        ]
        
        result = self.renderer.render_term_list_cockpit(terms)
        
        self.assertIn("<div class='governance-vocabulary'>", result)
        self.assertIn("<div class='term-card'>", result)
        self.assertIn("Governance", result)
        self.assertIn("Trust Tier", result)
        self.assertIn("<span class='term-category'>core</span>", result)
        self.assertIn("<span class='term-category'>access</span>", result)


class TestVocabularySearch(unittest.TestCase):
    """Test the Vocabulary Search component."""
    
    def setUp(self):
        self.search = VocabularySearch()
        self.manager = VocabularyManager()
        
        # Set up dependencies
        self.search.manager = self.manager
        
        # Create a temporary data directory for testing
        os.makedirs("data", exist_ok=True)
    
    def tearDown(self):
        # Clean up test data
        if os.path.exists("data/vocabulary.json"):
            os.remove("data/vocabulary.json")
    
    def test_initialization(self):
        """Test that the search is initialized correctly."""
        self.assertEqual(self.search.extension_id, "EXT-UI-003")
        self.assertEqual(self.search.extension_type, "UI")
    
    def test_search_terms(self):
        """Test searching for terms."""
        # Create test terms
        self.manager._save_vocabulary({
            "term1": {
                "id": "term1",
                "name": "Governance",
                "definition": "The system of rules for ensuring ethical AI behavior.",
                "category": "core",
                "keywords": ["ethics", "rules", "system"]
            },
            "term2": {
                "id": "term2",
                "name": "Trust Tier",
                "definition": "A level of trust assigned to users based on their governance adherence.",
                "category": "access",
                "keywords": ["trust", "level", "access"]
            },
            "term3": {
                "id": "term3",
                "name": "Governance Framework",
                "definition": "The structure that supports governance implementation.",
                "category": "core",
                "keywords": ["structure", "implementation", "governance"]
            }
        })
        
        # Search for "governance"
        result = self.search.search_terms(query="governance")
        
        self.assertEqual(result["status"], "success")
        self.assertEqual(len(result["results"]), 2)  # Should find term1 and term3
        
        # Verify results are sorted by relevance
        self.assertEqual(result["results"][0]["id"], "term1")  # "Governance" should be first
        
        # Search with category filter
        result = self.search.search_terms(
            query="governance",
            categories=["access"]
        )
        
        self.assertEqual(result["status"], "success")
        self.assertEqual(len(result["results"]), 0)  # No access category terms with "governance"
        
        # Search for "trust"
        result = self.search.search_terms(query="trust")
        
        self.assertEqual(result["status"], "success")
        self.assertEqual(len(result["results"]), 1)  # Should find term2
        self.assertEqual(result["results"][0]["id"], "term2")
    
    def test_calculate_relevance(self):
        """Test calculating search relevance."""
        term = {
            "id": "term1",
            "name": "Governance",
            "definition": "The system of rules for ensuring ethical AI behavior.",
            "category": "core",
            "keywords": ["ethics", "rules", "system"]
        }
        
        # Exact match in name
        relevance = self.search._calculate_relevance(term, "governance")
        self.assertGreater(relevance, 0.9)  # Should be high relevance
        
        # Partial match in name
        relevance = self.search._calculate_relevance(term, "govern")
        self.assertGreater(relevance, 0.7)  # Should be medium-high relevance
        
        # Match in definition
        relevance = self.search._calculate_relevance(term, "ethical")
        self.assertGreater(relevance, 0.5)  # Should be medium relevance
        
        # Match in keywords
        relevance = self.search._calculate_relevance(term, "rules")
        self.assertGreater(relevance, 0.6)  # Should be medium-high relevance
        
        # No match
        relevance = self.search._calculate_relevance(term, "nonexistent")
        self.assertEqual(relevance, 0.0)  # Should be zero relevance


if __name__ == '__main__':
    unittest.main()
