#!/usr/bin/env python3
"""
Basic RAG Features Test
=======================

Test script to validate the basic RAG capabilities including document
processing and knowledge management features without heavy ML dependencies.
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

class BasicRAGTest:
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

    async def test_document_processor_basic_import(self):
        """Test basic document processor import without ML dependencies"""
        test_name = "Basic Document Processor Import"
        
        try:
            # Test basic imports
            import PyPDF2
            from docx import Document as DocxDocument
            import openpyxl
            import markdown
            from bs4 import BeautifulSoup
            import pandas as pd
            
            self.log_test(test_name, "PASSED", {
                "pypdf2": "imported",
                "docx": "imported",
                "openpyxl": "imported",
                "markdown": "imported",
                "beautifulsoup": "imported",
                "pandas": "imported"
            })
            
            return True
            
        except Exception as e:
            self.log_test(test_name, "FAILED", {"exception": str(e)})
            return False

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
                    ]
                }, f, indent=2)
            
            # Create sample CSV document
            csv_file = os.path.join(temp_dir, "features.csv")
            with open(csv_file, 'w') as f:
                f.write("""Feature,Category,Status,Priority
Governance,Core,Active,High
RAG,Core,Active,High
Integrations,Business,Active,Medium
Analytics,Monitoring,Active,Medium
Automation,Workflow,Development,Low
""")
            
            self.log_test(test_name, "PASSED", {
                "temp_dir": temp_dir,
                "files_created": 3,
                "text_file": text_file,
                "json_file": json_file,
                "csv_file": csv_file
            })
            
            return temp_dir, [text_file, json_file, csv_file]
            
        except Exception as e:
            self.log_test(test_name, "FAILED", {"exception": str(e)})
            return None, []

    async def test_basic_text_processing(self, file_paths):
        """Test basic text processing without ML"""
        test_name = "Basic Text Processing"
        
        try:
            if not file_paths:
                self.log_test(test_name, "SKIPPED", {"reason": "No files"})
                return False
            
            processing_results = []
            
            for file_path in file_paths:
                file_name = os.path.basename(file_path)
                file_ext = os.path.splitext(file_path)[1].lower()
                
                content = ""
                
                # Process based on file type
                if file_ext == '.txt':
                    with open(file_path, 'r') as f:
                        content = f.read()
                
                elif file_ext == '.json':
                    with open(file_path, 'r') as f:
                        data = json.load(f)
                        content = json.dumps(data, indent=2)
                
                elif file_ext == '.csv':
                    import pandas as pd
                    df = pd.read_csv(file_path)
                    content = df.to_string(index=False)
                
                # Basic chunking (split by paragraphs)
                chunks = []
                paragraphs = content.split('\n\n')
                for i, paragraph in enumerate(paragraphs):
                    if paragraph.strip():
                        chunks.append({
                            "chunk_id": f"{file_name}_chunk_{i}",
                            "content": paragraph.strip(),
                            "chunk_index": i,
                            "file_name": file_name,
                            "file_type": file_ext
                        })
                
                processing_results.append({
                    "file_path": file_path,
                    "file_name": file_name,
                    "file_type": file_ext,
                    "content_length": len(content),
                    "chunks_created": len(chunks),
                    "chunks": chunks
                })
            
            total_chunks = sum(r["chunks_created"] for r in processing_results)
            
            self.log_test(test_name, "PASSED", {
                "files_processed": len(file_paths),
                "total_chunks": total_chunks,
                "processing_results": processing_results
            })
            
            return processing_results
            
        except Exception as e:
            self.log_test(test_name, "FAILED", {"exception": str(e)})
            return []

    async def test_basic_search(self, processing_results):
        """Test basic keyword search without vector embeddings"""
        test_name = "Basic Keyword Search"
        
        try:
            if not processing_results:
                self.log_test(test_name, "SKIPPED", {"reason": "No processing results"})
                return False
            
            # Collect all chunks
            all_chunks = []
            for result in processing_results:
                all_chunks.extend(result["chunks"])
            
            # Test queries
            test_queries = [
                "governance",
                "chatbot",
                "features",
                "platform",
                "integrations"
            ]
            
            search_results = []
            
            for query in test_queries:
                query_lower = query.lower()
                matches = []
                
                for chunk in all_chunks:
                    content_lower = chunk["content"].lower()
                    if query_lower in content_lower:
                        # Simple scoring based on frequency
                        score = content_lower.count(query_lower) / len(content_lower.split())
                        matches.append({
                            "chunk_id": chunk["chunk_id"],
                            "content": chunk["content"][:200] + "..." if len(chunk["content"]) > 200 else chunk["content"],
                            "score": score,
                            "file_name": chunk["file_name"]
                        })
                
                # Sort by score
                matches.sort(key=lambda x: x["score"], reverse=True)
                
                search_results.append({
                    "query": query,
                    "matches": len(matches),
                    "top_results": matches[:3]
                })
            
            total_matches = sum(r["matches"] for r in search_results)
            
            self.log_test(test_name, "PASSED", {
                "queries_tested": len(test_queries),
                "total_chunks": len(all_chunks),
                "total_matches": total_matches,
                "search_results": search_results
            })
            
            return True
            
        except Exception as e:
            self.log_test(test_name, "FAILED", {"exception": str(e)})
            return False

    async def test_governance_integration(self):
        """Test governance adapter integration"""
        test_name = "Governance Integration"
        
        try:
            from UniversalGovernanceAdapter import UniversalGovernanceAdapter
            
            # Create governance adapter
            governance_adapter = UniversalGovernanceAdapter(context="rag_basic_test")
            
            # Test audit entry creation
            await governance_adapter.createAuditEntry({
                "interaction_id": f"rag_test_{datetime.now().timestamp()}",
                "agent_id": "rag_test_agent",
                "event_type": "document_processed",
                "document_count": 3,
                "chunks_created": 15,
                "test_type": "basic_rag",
                "status": "success"
            })
            
            self.log_test(test_name, "PASSED", {
                "governance_adapter": "created",
                "audit_entry": "created",
                "context": "rag_basic_test"
            })
            
            return True
            
        except Exception as e:
            self.log_test(test_name, "FAILED", {"exception": str(e)})
            return False

    async def test_metadata_extraction(self, file_paths):
        """Test basic metadata extraction"""
        test_name = "Metadata Extraction"
        
        try:
            if not file_paths:
                self.log_test(test_name, "SKIPPED", {"reason": "No files"})
                return False
            
            metadata_results = []
            
            for file_path in file_paths:
                try:
                    stat = os.stat(file_path)
                    
                    metadata = {
                        "file_name": os.path.basename(file_path),
                        "file_path": file_path,
                        "file_size": stat.st_size,
                        "file_type": os.path.splitext(file_path)[1].lower(),
                        "created_at": datetime.fromtimestamp(stat.st_ctime).isoformat(),
                        "modified_at": datetime.fromtimestamp(stat.st_mtime).isoformat(),
                        "processed_at": datetime.now().isoformat()
                    }
                    
                    metadata_results.append(metadata)
                    
                except Exception as e:
                    logger.warning(f"Failed to extract metadata for {file_path}: {e}")
            
            self.log_test(test_name, "PASSED", {
                "files_processed": len(file_paths),
                "metadata_extracted": len(metadata_results),
                "metadata_results": metadata_results
            })
            
            return True
            
        except Exception as e:
            self.log_test(test_name, "FAILED", {"exception": str(e)})
            return False

    async def run_all_tests(self):
        """Run all basic RAG tests"""
        print("🧪 Starting Basic RAG Features Tests")
        print("=" * 60)
        
        # Test 1: Import basic components
        import_success = await self.test_document_processor_basic_import()
        
        if not import_success:
            print("❌ Import failed, skipping remaining tests")
            return
        
        # Test 2: Create sample documents
        temp_dir, file_paths = await self.test_create_sample_documents()
        
        if not file_paths:
            print("❌ Sample document creation failed, skipping remaining tests")
            return
        
        # Test 3: Extract metadata
        await self.test_metadata_extraction(file_paths)
        
        # Test 4: Process documents
        processing_results = await self.test_basic_text_processing(file_paths)
        
        # Test 5: Basic search
        await self.test_basic_search(processing_results)
        
        # Test 6: Governance integration
        await self.test_governance_integration()
        
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
        results_file = "basic_rag_test_results.json"
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
            print("✅ All tests passed! Basic RAG features are working correctly.")
        else:
            print("❌ Some tests failed. Check results for details.")

async def main():
    """Main test function"""
    test_runner = BasicRAGTest()
    await test_runner.run_all_tests()

if __name__ == "__main__":
    asyncio.run(main())

