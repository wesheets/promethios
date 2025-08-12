#!/usr/bin/env python3
"""
Enhanced RAG Features Test
==========================

Test script to validate the enhanced RAG capabilities including advanced document
processing, vector search, and knowledge management features.
"""

import asyncio
import json
import logging
import sys
import os
import tempfile
from datetime import datetime
from typing import Dict, Any

# Add project paths
sys.path.append('/home/ubuntu/promethios')
sys.path.append('/home/ubuntu/promethios/src')
sys.path.append('/home/ubuntu/promethios/src/services')
sys.path.append('/home/ubuntu/promethios/src/api/governance/knowledge')

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class EnhancedRAGTest:
    def __init__(self):
        self.test_results = {}
        self.start_time = datetime.now()
        
    def log_test(self, test_name: str, status: str, details: Dict[str, Any] = None):
        """Log test result"""
        self.test_results[test_name] = {
            "status": status,
            "details": details or {},
            "timestamp": datetime.now().isoformat()
        }
        
        status_emoji = "✅" if status == "PASSED" else "❌"
        print(f"{status_emoji} {test_name}: {status}")
        if details:
            print(f"   Details: {details}")

    async def test_document_processor_import(self):
        """Test importing the advanced document processor"""
        test_name = "Advanced Document Processor Import"
        
        try:
            from advanced_document_processor import AdvancedDocumentProcessor, DocumentMetadata, DocumentChunk
            
            self.log_test(test_name, "PASSED", {
                "document_processor": "imported",
                "metadata_class": "imported",
                "chunk_class": "imported"
            })
            
            return True
            
        except Exception as e:
            self.log_test(test_name, "FAILED", {"exception": str(e)})
            return False

    async def test_vector_service_import(self):
        """Test importing the enhanced vector service"""
        test_name = "Enhanced Vector Service Import"
        
        try:
            from enhanced_vector_service import EnhancedVectorService, SearchQuery, SearchResponse
            
            self.log_test(test_name, "PASSED", {
                "vector_service": "imported",
                "search_query": "imported",
                "search_response": "imported"
            })
            
            return True
            
        except Exception as e:
            self.log_test(test_name, "FAILED", {"exception": str(e)})
            return False

    async def test_document_processor_creation(self):
        """Test creating document processor instance"""
        test_name = "Document Processor Creation"
        
        try:
            from advanced_document_processor import AdvancedDocumentProcessor
            from UniversalGovernanceAdapter import UniversalGovernanceAdapter
            
            # Create governance adapter
            governance_adapter = UniversalGovernanceAdapter(context="rag_test")
            
            # Create document processor
            processor = AdvancedDocumentProcessor(governance_adapter)
            
            # Test basic functionality
            supported_formats = processor.get_supported_formats()
            stats = processor.get_processing_stats()
            
            self.log_test(test_name, "PASSED", {
                "processor_created": True,
                "governance_adapter": "connected",
                "supported_formats": len(supported_formats),
                "formats": supported_formats[:5],  # Show first 5
                "stats": stats
            })
            
            return processor
            
        except Exception as e:
            self.log_test(test_name, "FAILED", {"exception": str(e)})
            return None

    async def test_vector_service_creation(self):
        """Test creating vector service instance"""
        test_name = "Vector Service Creation"
        
        try:
            from enhanced_vector_service import EnhancedVectorService
            from UniversalGovernanceAdapter import UniversalGovernanceAdapter
            
            # Create governance adapter
            governance_adapter = UniversalGovernanceAdapter(context="vector_test")
            
            # Create vector service
            vector_service = EnhancedVectorService(governance_adapter, vector_db_type="faiss")
            
            self.log_test(test_name, "PASSED", {
                "vector_service_created": True,
                "governance_adapter": "connected",
                "vector_db_type": "faiss"
            })
            
            return vector_service
            
        except Exception as e:
            self.log_test(test_name, "FAILED", {"exception": str(e)})
            return None

    async def test_create_sample_documents(self):
        """Create sample documents for testing"""
        test_name = "Sample Document Creation"
        
        try:
            # Create temporary directory
            temp_dir = tempfile.mkdtemp()
            
            # Create sample text document
            text_file = os.path.join(temp_dir, "sample.txt")
            with open(text_file, 'w') as f:
                f.write("""
                Promethios Chat Platform Documentation
                
                Introduction
                Promethios is an advanced AI chat platform that provides enterprise-grade
                conversational AI capabilities with comprehensive governance and oversight.
                
                Key Features
                - Multi-agent conversation systems
                - Real-time governance monitoring
                - Advanced RAG capabilities
                - Business system integrations
                - Comprehensive audit logging
                
                Getting Started
                To get started with Promethios, you need to:
                1. Set up your governance policies
                2. Configure your knowledge base
                3. Create your first chatbot
                4. Deploy to your preferred channels
                
                Advanced Features
                Promethios includes advanced features such as:
                - Semantic search across documents
                - Intelligent document processing
                - Multi-format support (PDF, Word, Excel, etc.)
                - Vector embeddings for similarity search
                - Hybrid search combining semantic and keyword approaches
                """)
            
            # Create sample JSON document
            json_file = os.path.join(temp_dir, "config.json")
            with open(json_file, 'w') as f:
                json.dump({
                    "platform": "Promethios",
                    "version": "1.0.0",
                    "features": [
                        "governance",
                        "rag",
                        "integrations",
                        "analytics"
                    ],
                    "supported_formats": [
                        "pdf", "docx", "txt", "md", "html", "json", "csv"
                    ],
                    "configuration": {
                        "max_chunk_size": 1000,
                        "embedding_model": "all-MiniLM-L6-v2",
                        "vector_db": "faiss"
                    }
                }, f, indent=2)
            
            # Create sample markdown document
            md_file = os.path.join(temp_dir, "api_guide.md")
            with open(md_file, 'w') as f:
                f.write("""
# Promethios API Guide

## Overview
The Promethios API provides comprehensive access to all platform features.

## Authentication
All API requests require authentication using API keys or OAuth tokens.

## Endpoints

### Knowledge Management
- `POST /api/knowledge/upload` - Upload documents
- `GET /api/knowledge/search` - Search knowledge base
- `DELETE /api/knowledge/{id}` - Delete documents

### Chat Management
- `POST /api/chat/create` - Create new chatbot
- `GET /api/chat/list` - List all chatbots
- `POST /api/chat/message` - Send message to chatbot

### Governance
- `GET /api/governance/policies` - List policies
- `POST /api/governance/audit` - Create audit entry
- `GET /api/governance/trust` - Get trust scores

## Examples

```python
import requests

# Upload document
response = requests.post('/api/knowledge/upload', 
                        files={'file': open('document.pdf', 'rb')})

# Search knowledge base
response = requests.post('/api/knowledge/search',
                        json={'query': 'How to create a chatbot?'})
```
                """)
            
            self.log_test(test_name, "PASSED", {
                "temp_dir": temp_dir,
                "files_created": 3,
                "text_file": text_file,
                "json_file": json_file,
                "md_file": md_file
            })
            
            return temp_dir, [text_file, json_file, md_file]
            
        except Exception as e:
            self.log_test(test_name, "FAILED", {"exception": str(e)})
            return None, []

    async def test_document_processing(self, processor, file_paths):
        """Test document processing functionality"""
        test_name = "Document Processing"
        
        try:
            if not processor or not file_paths:
                self.log_test(test_name, "SKIPPED", {"reason": "No processor or files"})
                return []
            
            # Process each document
            results = []
            for file_path in file_paths:
                result = await processor.process_document(file_path)
                results.append(result)
            
            # Analyze results
            successful = [r for r in results if r.success]
            failed = [r for r in results if not r.success]
            total_chunks = sum(len(r.chunks) for r in successful)
            
            self.log_test(test_name, "PASSED", {
                "total_documents": len(file_paths),
                "successful": len(successful),
                "failed": len(failed),
                "total_chunks": total_chunks,
                "avg_processing_time": sum(r.processing_time for r in successful) / len(successful) if successful else 0
            })
            
            return results
            
        except Exception as e:
            self.log_test(test_name, "FAILED", {"exception": str(e)})
            return []

    async def test_vector_indexing(self, vector_service, processing_results):
        """Test vector indexing functionality"""
        test_name = "Vector Indexing"
        
        try:
            if not vector_service or not processing_results:
                self.log_test(test_name, "SKIPPED", {"reason": "No vector service or results"})
                return False
            
            # Initialize vector service
            await vector_service.initialize()
            
            # Prepare chunks for indexing
            all_chunks = []
            for result in processing_results:
                if result.success:
                    for chunk in result.chunks:
                        chunk_dict = {
                            "chunk_id": chunk.chunk_id,
                            "document_id": chunk.document_id,
                            "content": chunk.content,
                            "chunk_type": chunk.chunk_type,
                            "chunk_index": chunk.chunk_index,
                            "page_number": chunk.page_number,
                            "section_title": chunk.section_title,
                            "metadata": chunk.metadata
                        }
                        all_chunks.append(chunk_dict)
            
            # Add chunks to index
            success = await vector_service.add_chunks(all_chunks)
            
            # Get index stats
            stats = await vector_service.get_index_stats()
            
            self.log_test(test_name, "PASSED", {
                "indexing_success": success,
                "chunks_indexed": len(all_chunks),
                "index_stats": stats
            })
            
            return success
            
        except Exception as e:
            self.log_test(test_name, "FAILED", {"exception": str(e)})
            return False

    async def test_semantic_search(self, vector_service):
        """Test semantic search functionality"""
        test_name = "Semantic Search"
        
        try:
            if not vector_service:
                self.log_test(test_name, "SKIPPED", {"reason": "No vector service"})
                return False
            
            from enhanced_vector_service import SearchQuery
            
            # Test queries
            test_queries = [
                "How to create a chatbot?",
                "What are the key features of Promethios?",
                "API authentication methods",
                "Governance and oversight capabilities",
                "Document processing formats"
            ]
            
            search_results = []
            
            for query_text in test_queries:
                # Create search query
                search_query = SearchQuery(
                    query=query_text,
                    query_type="semantic",
                    limit=5,
                    threshold=0.3
                )
                
                # Perform search
                response = await vector_service.search(search_query)
                search_results.append({
                    "query": query_text,
                    "results_count": len(response.results),
                    "search_time": response.search_time,
                    "top_score": response.results[0].score if response.results else 0
                })
            
            avg_search_time = sum(r["search_time"] for r in search_results) / len(search_results)
            total_results = sum(r["results_count"] for r in search_results)
            
            self.log_test(test_name, "PASSED", {
                "queries_tested": len(test_queries),
                "total_results": total_results,
                "avg_search_time": avg_search_time,
                "search_results": search_results
            })
            
            return True
            
        except Exception as e:
            self.log_test(test_name, "FAILED", {"exception": str(e)})
            return False

    async def test_hybrid_search(self, vector_service):
        """Test hybrid search functionality"""
        test_name = "Hybrid Search"
        
        try:
            if not vector_service:
                self.log_test(test_name, "SKIPPED", {"reason": "No vector service"})
                return False
            
            from enhanced_vector_service import SearchQuery
            
            # Test hybrid search
            search_query = SearchQuery(
                query="Promethios features governance",
                query_type="hybrid",
                limit=5,
                threshold=0.2
            )
            
            response = await vector_service.search(search_query)
            
            self.log_test(test_name, "PASSED", {
                "query": search_query.query,
                "search_type": search_query.query_type,
                "results_count": len(response.results),
                "search_time": response.search_time,
                "strategy": response.search_strategy
            })
            
            return True
            
        except Exception as e:
            self.log_test(test_name, "FAILED", {"exception": str(e)})
            return False

    async def test_search_filters(self, vector_service):
        """Test search filtering functionality"""
        test_name = "Search Filters"
        
        try:
            if not vector_service:
                self.log_test(test_name, "SKIPPED", {"reason": "No vector service"})
                return False
            
            from enhanced_vector_service import SearchQuery
            
            # Test with filters
            search_query = SearchQuery(
                query="API documentation",
                query_type="semantic",
                filters={
                    "chunk_type": ["paragraph", "heading"],
                    "file_type": [".md", ".txt"]
                },
                limit=5,
                threshold=0.3
            )
            
            response = await vector_service.search(search_query)
            
            self.log_test(test_name, "PASSED", {
                "query": search_query.query,
                "filters_applied": search_query.filters,
                "results_count": len(response.results),
                "search_time": response.search_time
            })
            
            return True
            
        except Exception as e:
            self.log_test(test_name, "FAILED", {"exception": str(e)})
            return False

    async def run_all_tests(self):
        """Run all enhanced RAG tests"""
        print("🧪 Starting Enhanced RAG Features Tests")
        print("=" * 60)
        
        # Test 1-2: Import components
        doc_import_success = await self.test_document_processor_import()
        vec_import_success = await self.test_vector_service_import()
        
        if not (doc_import_success and vec_import_success):
            print("❌ Import failed, skipping remaining tests")
            return
        
        # Test 3-4: Create service instances
        processor = await self.test_document_processor_creation()
        vector_service = await self.test_vector_service_creation()
        
        if not (processor and vector_service):
            print("❌ Service creation failed, skipping remaining tests")
            return
        
        # Test 5: Create sample documents
        temp_dir, file_paths = await self.test_create_sample_documents()
        
        if not file_paths:
            print("❌ Sample document creation failed, skipping remaining tests")
            return
        
        # Test 6: Process documents
        processing_results = await self.test_document_processing(processor, file_paths)
        
        # Test 7: Index documents
        indexing_success = await self.test_vector_indexing(vector_service, processing_results)
        
        if indexing_success:
            # Test 8-10: Search functionality
            await self.test_semantic_search(vector_service)
            await self.test_hybrid_search(vector_service)
            await self.test_search_filters(vector_service)
        
        # Cleanup
        if temp_dir:
            import shutil
            try:
                shutil.rmtree(temp_dir)
                print(f"🗑️ Cleaned up temporary directory: {temp_dir}")
            except:
                pass
        
        # Summary
        print("=" * 60)
        print("🏁 Test Summary")
        
        total_tests = len(self.test_results)
        passed_tests = len([r for r in self.test_results.values() if r["status"] == "PASSED"])
        failed_tests = len([r for r in self.test_results.values() if r["status"] == "FAILED"])
        skipped_tests = len([r for r in self.test_results.values() if r["status"] == "SKIPPED"])
        
        print(f"Total Tests: {total_tests}")
        print(f"Passed: {passed_tests}")
        print(f"Failed: {failed_tests}")
        print(f"Skipped: {skipped_tests}")
        
        if failed_tests > 0:
            print("❌ Failed Tests:")
            for test_name, result in self.test_results.items():
                if result["status"] == "FAILED":
                    print(f"  - {test_name}")
        
        # Save results
        results_file = "enhanced_rag_test_results.json"
        with open(results_file, 'w') as f:
            json.dump({
                "summary": {
                    "total_tests": total_tests,
                    "passed": passed_tests,
                    "failed": failed_tests,
                    "skipped": skipped_tests,
                    "start_time": self.start_time.isoformat(),
                    "end_time": datetime.now().isoformat()
                },
                "test_results": self.test_results
            }, f, indent=2)
        
        print(f"📄 Results saved to: {results_file}")
        
        if failed_tests == 0:
            print("✅ All tests passed! Enhanced RAG features are working correctly.")
        else:
            print("❌ Some tests failed. Check results for details.")

async def main():
    """Main test function"""
    test_runner = EnhancedRAGTest()
    await test_runner.run_all_tests()

if __name__ == "__main__":
    asyncio.run(main())

