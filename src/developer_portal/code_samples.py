"""
Developer Experience Portal - Code Samples Repository

This module implements the code samples repository for the Developer Experience Portal,
providing example code for common integration scenarios in multiple languages.
"""

import logging
import os
import json
import shutil
from typing import Dict, List, Optional, Any, Union
from datetime import datetime
import re

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class CodeSamplesRepository:
    """
    Code Samples Repository for the Developer Experience Portal.
    
    This class provides functionality for:
    - Managing code samples in multiple languages
    - Organizing samples by category and complexity
    - Providing searchable sample metadata
    - Integrating with API documentation
    """
    
    def __init__(self, config: Dict[str, Any] = None):
        """
        Initialize the code samples repository.
        
        Args:
            config: Configuration dictionary
        """
        self.config = config or {}
        
        # Extract configuration values
        self.samples_dir = self.config.get('samples_dir', 'code_samples')
        self.github_repo = self.config.get('github_repo', 'https://github.com/promethios/code-samples')
        self.supported_languages = self.config.get('supported_languages', ['python', 'javascript', 'java', 'go'])
        self.featured_samples = self.config.get('featured_samples', [])
        
        # Store samples metadata
        self.samples = {}
        
        # Store category metadata
        self.categories = {}
        
        # Store search index
        self.search_index = {}
        
        logger.info(f"Initialized code samples repository with samples directory: {self.samples_dir}")
    
    def load_samples(self, samples_dir: str = None) -> Dict[str, Any]:
        """
        Load code samples from files.
        
        Args:
            samples_dir: Samples directory (optional)
            
        Returns:
            Dict: Loaded samples structure
        """
        samples_dir = samples_dir or self.samples_dir
        
        try:
            if os.path.exists(samples_dir):
                # Load categories
                categories_file = os.path.join(samples_dir, 'categories.json')
                if os.path.exists(categories_file):
                    with open(categories_file, 'r') as f:
                        self.categories = json.load(f)
                
                # Load samples
                for language in os.listdir(samples_dir):
                    language_dir = os.path.join(samples_dir, language)
                    
                    if os.path.isdir(language_dir) and language in self.supported_languages:
                        self.samples[language] = {}
                        
                        for category in os.listdir(language_dir):
                            category_dir = os.path.join(language_dir, category)
                            
                            if os.path.isdir(category_dir):
                                self.samples[language][category] = {}
                                
                                for sample_dir in os.listdir(category_dir):
                                    sample_path = os.path.join(category_dir, sample_dir)
                                    
                                    if os.path.isdir(sample_path):
                                        # Load sample metadata
                                        metadata_file = os.path.join(sample_path, 'metadata.json')
                                        if os.path.exists(metadata_file):
                                            with open(metadata_file, 'r') as f:
                                                metadata = json.load(f)
                                                
                                                # Add sample files to metadata
                                                metadata['files'] = []
                                                for file_name in os.listdir(sample_path):
                                                    if file_name != 'metadata.json' and os.path.isfile(os.path.join(sample_path, file_name)):
                                                        metadata['files'].append(file_name)
                                                
                                                self.samples[language][category][sample_dir] = metadata
                
                # Build search index
                self._build_search_index()
                
                logger.info(f"Loaded samples from {samples_dir}")
            else:
                logger.warning(f"Samples directory not found: {samples_dir}")
        except Exception as e:
            logger.error(f"Error loading samples: {str(e)}")
        
        return self.samples
    
    def get_samples_structure(self) -> Dict[str, Any]:
        """
        Get the samples structure.
        
        Returns:
            Dict: Samples structure
        """
        structure = {
            "languages": {},
            "categories": self.categories,
            "featured_samples": []
        }
        
        # Build language structure
        for language, categories in self.samples.items():
            structure["languages"][language] = {}
            
            for category, samples in categories.items():
                structure["languages"][language][category] = {}
                
                for sample_id, sample_data in samples.items():
                    structure["languages"][language][category][sample_id] = {
                        "title": sample_data.get("title", sample_id),
                        "description": sample_data.get("description", ""),
                        "complexity": sample_data.get("complexity", "intermediate"),
                        "files": sample_data.get("files", [])
                    }
        
        # Add featured samples
        for featured_id in self.featured_samples:
            for language, categories in self.samples.items():
                for category, samples in categories.items():
                    if featured_id in samples:
                        structure["featured_samples"].append({
                            "id": featured_id,
                            "language": language,
                            "category": category,
                            "title": samples[featured_id].get("title", featured_id),
                            "description": samples[featured_id].get("description", ""),
                            "complexity": samples[featured_id].get("complexity", "intermediate")
                        })
        
        return structure
    
    def get_sample(self, language: str, category: str, sample_id: str) -> Optional[Dict[str, Any]]:
        """
        Get a specific sample.
        
        Args:
            language: Programming language
            category: Sample category
            sample_id: Sample ID
            
        Returns:
            Dict: Sample data or None if not found
        """
        if language in self.samples and category in self.samples[language] and sample_id in self.samples[language][category]:
            sample = self.samples[language][category][sample_id].copy()
            
            # Add file contents
            sample_dir = os.path.join(self.samples_dir, language, category, sample_id)
            file_contents = {}
            
            for file_name in sample.get("files", []):
                file_path = os.path.join(sample_dir, file_name)
                if os.path.exists(file_path):
                    with open(file_path, 'r') as f:
                        file_contents[file_name] = f.read()
            
            sample["file_contents"] = file_contents
            
            return sample
        
        return None
    
    def get_category_samples(self, language: str, category: str) -> Dict[str, Any]:
        """
        Get all samples in a category.
        
        Args:
            language: Programming language
            category: Sample category
            
        Returns:
            Dict: Category samples
        """
        if language in self.samples and category in self.samples[language]:
            return self.samples[language][category]
        
        return {}
    
    def search_samples(self, query: str, language: str = None) -> List[Dict[str, Any]]:
        """
        Search samples.
        
        Args:
            query: Search query
            language: Programming language (optional)
            
        Returns:
            List: Search results
        """
        if not query:
            return []
        
        # Normalize query
        query = query.lower()
        
        results = []
        
        # Search in index
        for sample_key, indexed_content in self.search_index.items():
            # Parse sample_key
            try:
                sample_language, sample_category, sample_id = sample_key.split(':')
                
                # Filter by language if specified
                if language and sample_language != language:
                    continue
                
                # Check if query matches indexed content
                if query in indexed_content:
                    # Get full sample metadata
                    sample = self.get_sample(sample_language, sample_category, sample_id)
                    
                    if sample:
                        results.append({
                            "language": sample_language,
                            "category": sample_category,
                            "id": sample_id,
                            "title": sample.get("title", sample_id),
                            "description": sample.get("description", ""),
                            "complexity": sample.get("complexity", "intermediate"),
                            "relevance": self._calculate_relevance(query, indexed_content)
                        })
            except ValueError:
                continue
        
        # Sort by relevance
        results.sort(key=lambda x: x["relevance"], reverse=True)
        
        return results
    
    def get_featured_samples(self) -> List[Dict[str, Any]]:
        """
        Get featured samples.
        
        Returns:
            List: Featured samples
        """
        featured = []
        
        for featured_id in self.featured_samples:
            for language, categories in self.samples.items():
                for category, samples in categories.items():
                    if featured_id in samples:
                        featured.append({
                            "id": featured_id,
                            "language": language,
                            "category": category,
                            "title": samples[featured_id].get("title", featured_id),
                            "description": samples[featured_id].get("description", ""),
                            "complexity": samples[featured_id].get("complexity", "intermediate")
                        })
        
        return featured
    
    def add_sample(self, language: str, category: str, sample_id: str, 
                 metadata: Dict[str, Any], files: Dict[str, str]) -> Dict[str, Any]:
        """
        Add or update a sample.
        
        Args:
            language: Programming language
            category: Sample category
            sample_id: Sample ID
            metadata: Sample metadata
            files: Sample files (name -> content)
            
        Returns:
            Dict: Result
        """
        if language not in self.supported_languages:
            return {
                "success": False,
                "error": f"Unsupported language: {language}"
            }
        
        # Ensure language exists
        if language not in self.samples:
            self.samples[language] = {}
        
        # Ensure category exists
        if category not in self.samples[language]:
            self.samples[language][category] = {}
        
        # Add or update sample metadata
        self.samples[language][category][sample_id] = metadata
        
        # Save sample files
        sample_dir = os.path.join(self.samples_dir, language, category, sample_id)
        os.makedirs(sample_dir, exist_ok=True)
        
        # Save metadata
        metadata_file = os.path.join(sample_dir, 'metadata.json')
        with open(metadata_file, 'w') as f:
            json.dump(metadata, f, indent=2)
        
        # Save files
        file_names = []
        for file_name, content in files.items():
            file_path = os.path.join(sample_dir, file_name)
            with open(file_path, 'w') as f:
                f.write(content)
            file_names.append(file_name)
        
        # Update metadata with file names
        metadata['files'] = file_names
        self.samples[language][category][sample_id] = metadata
        
        # Update search index
        self._update_search_index(language, category, sample_id, metadata, files)
        
        logger.info(f"Added/updated sample: {language}/{category}/{sample_id}")
        
        return {
            "success": True,
            "language": language,
            "category": category,
            "id": sample_id
        }
    
    def delete_sample(self, language: str, category: str, sample_id: str) -> Dict[str, Any]:
        """
        Delete a sample.
        
        Args:
            language: Programming language
            category: Sample category
            sample_id: Sample ID
            
        Returns:
            Dict: Result
        """
        if language in self.samples and category in self.samples[language] and sample_id in self.samples[language][category]:
            # Delete from samples
            del self.samples[language][category][sample_id]
            
            # Delete from search index
            sample_key = f"{language}:{category}:{sample_id}"
            if sample_key in self.search_index:
                del self.search_index[sample_key]
            
            # Delete files
            sample_dir = os.path.join(self.samples_dir, language, category, sample_id)
            if os.path.exists(sample_dir):
                shutil.rmtree(sample_dir)
            
            logger.info(f"Deleted sample: {language}/{category}/{sample_id}")
            
            return {
                "success": True,
                "language": language,
                "category": category,
                "id": sample_id
            }
        
        return {
            "success": False,
            "error": "Sample not found"
        }
    
    def save_samples(self, samples_dir: str = None) -> bool:
        """
        Save samples to files.
        
        Args:
            samples_dir: Samples directory (optional)
            
        Returns:
            bool: True if successful, False otherwise
        """
        samples_dir = samples_dir or self.samples_dir
        
        try:
            # Ensure directory exists
            os.makedirs(samples_dir, exist_ok=True)
            
            # Save categories
            categories_file = os.path.join(samples_dir, 'categories.json')
            with open(categories_file, 'w') as f:
                json.dump(self.categories, f, indent=2)
            
            logger.info(f"Saved samples to {samples_dir}")
            return True
        except Exception as e:
            logger.error(f"Error saving samples: {str(e)}")
            return False
    
    def _build_search_index(self) -> None:
        """
        Build the search index for all samples.
        """
        self.search_index = {}
        
        for language, categories in self.samples.items():
            for category, samples in categories.items():
                for sample_id, sample_data in samples.items():
                    # Get sample files
                    sample_dir = os.path.join(self.samples_dir, language, category, sample_id)
                    files = {}
                    
                    for file_name in sample_data.get("files", []):
                        file_path = os.path.join(sample_dir, file_name)
                        if os.path.exists(file_path):
                            with open(file_path, 'r') as f:
                                files[file_name] = f.read()
                    
                    self._update_search_index(language, category, sample_id, sample_data, files)
        
        logger.info(f"Built search index with {len(self.search_index)} entries")
    
    def _update_search_index(self, language: str, category: str, sample_id: str, 
                           metadata: Dict[str, Any], files: Dict[str, str]) -> None:
        """
        Update the search index for a specific sample.
        
        Args:
            language: Programming language
            category: Sample category
            sample_id: Sample ID
            metadata: Sample metadata
            files: Sample files (name -> content)
        """
        # Create key for search index
        sample_key = f"{language}:{category}:{sample_id}"
        
        # Extract searchable content
        searchable_content = []
        
        # Add title
        if "title" in metadata:
            searchable_content.append(metadata["title"])
        
        # Add description
        if "description" in metadata:
            searchable_content.append(metadata["description"])
        
        # Add tags
        if "tags" in metadata:
            searchable_content.extend(metadata["tags"])
        
        # Add API endpoints
        if "api_endpoints" in metadata:
            searchable_content.extend(metadata["api_endpoints"])
        
        # Add file content (first 1000 chars of each file)
        for file_name, content in files.items():
            searchable_content.append(file_name)
            searchable_content.append(content[:1000])
        
        # Join all content and normalize
        indexed_content = " ".join(searchable_content).lower()
        
        # Store in index
        self.search_index[sample_key] = indexed_content
    
    def _calculate_relevance(self, query: str, indexed_content: str) -> float:
        """
        Calculate relevance score for a search result.
        
        Args:
            query: Search query
            indexed_content: Indexed content
            
        Returns:
            float: Relevance score
        """
        # Simple relevance calculation based on occurrence count and position
        relevance = 0.0
        
        # Count occurrences
        occurrences = indexed_content.count(query)
        relevance += occurrences * 0.5
        
        # Check position of first occurrence (earlier is better)
        position = indexed_content.find(query)
        if position >= 0:
            # Normalize position (0 = start, 1 = end)
            normalized_position = position / len(indexed_content)
            # Earlier positions get higher score
            relevance += (1.0 - normalized_position)
        
        return relevance


class SampleTemplate:
    """
    Sample template for generating code samples.
    
    This class provides functionality for:
    - Generating code samples from templates
    - Customizing templates with parameters
    - Supporting multiple languages
    """
    
    def __init__(self, template_dir: str = None):
        """
        Initialize the sample template.
        
        Args:
            template_dir: Template directory
        """
        self.template_dir = template_dir or 'templates'
        self.templates = {}
        
        logger.info(f"Initialized sample template with template directory: {self.template_dir}")
    
    def load_templates(self, template_dir: str = None) -> Dict[str, Dict[str, str]]:
        """
        Load templates from files.
        
        Args:
            template_dir: Template directory (optional)
            
        Returns:
            Dict: Loaded templates
        """
        template_dir = template_dir or self.template_dir
        
        try:
            if os.path.exists(template_dir):
                for language in os.listdir(template_dir):
                    language_dir = os.path.join(template_dir, language)
                    
                    if os.path.isdir(language_dir):
                        self.templates[language] = {}
                        
                        for template_file in os.listdir(language_dir):
                            if template_file.endswith('.template'):
                                template_name = template_file[:-9]  # Remove .template extension
                                template_path = os.path.join(language_dir, template_file)
                                
                                with open(template_path, 'r') as f:
                                    self.templates[language][template_name] = f.read()
                
                logger.info(f"Loaded templates from {template_dir}")
            else:
                logger.warning(f"Template directory not found: {template_dir}")
        except Exception as e:
            logger.error(f"Error loading templates: {str(e)}")
        
        return self.templates
    
    def get_template(self, language: str, template_name: str) -> Optional[str]:
        """
        Get a specific template.
        
        Args:
            language: Programming language
            template_name: Template name
            
        Returns:
            str: Template content or None if not found
        """
        if language in self.templates and template_name in self.templates[language]:
            return self.templates[language][template_name]
        
        return None
    
    def generate_sample(self, language: str, template_name: str, 
                      parameters: Dict[str, Any]) -> Optional[str]:
        """
        Generate a sample from a template.
        
        Args:
            language: Programming language
            template_name: Template name
            parameters: Template parameters
            
        Returns:
            str: Generated sample or None if template not found
        """
        template = self.get_template(language, template_name)
        
        if not template:
            return None
        
        # Replace parameters
        sample = template
        
        for key, value in parameters.items():
            placeholder = f"{{{{${key}}}}}"
            sample = sample.replace(placeholder, str(value))
        
        return sample
    
    def add_template(self, language: str, template_name: str, template_content: str) -> bool:
        """
        Add or update a template.
        
        Args:
            language: Programming language
            template_name: Template name
            template_content: Template content
            
        Returns:
            bool: True if successful, False otherwise
        """
        try:
            # Ensure language exists
            if language not in self.templates:
                self.templates[language] = {}
            
            # Add or update template
            self.templates[language][template_name] = template_content
            
            # Save template to file
            language_dir = os.path.join(self.template_dir, language)
            os.makedirs(language_dir, exist_ok=True)
            
            template_path = os.path.join(language_dir, f"{template_name}.template")
            with open(template_path, 'w') as f:
                f.write(template_content)
            
            logger.info(f"Added/updated template: {language}/{template_name}")
            return True
        except Exception as e:
            logger.error(f"Error adding template: {str(e)}")
            return False
    
    def delete_template(self, language: str, template_name: str) -> bool:
        """
        Delete a template.
        
        Args:
            language: Programming language
            template_name: Template name
            
        Returns:
            bool: True if successful, False otherwise
        """
        try:
            if language in self.templates and template_name in self.templates[language]:
                # Delete from templates
                del self.templates[language][template_name]
                
                # Delete file
                template_path = os.path.join(self.template_dir, language, f"{template_name}.template")
                if os.path.exists(template_path):
                    os.remove(template_path)
                
                logger.info(f"Deleted template: {language}/{template_name}")
                return True
            
            return False
        except Exception as e:
            logger.error(f"Error deleting template: {str(e)}")
            return False
"""
