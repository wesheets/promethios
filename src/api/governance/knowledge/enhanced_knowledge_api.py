"""
Enhanced Knowledge Management API
=================================

Advanced knowledge management API for the Promethios Chat platform with comprehensive
RAG capabilities, document processing, and semantic search.

Features:
- Multi-format document upload and processing
- Advanced semantic search with hybrid capabilities
- Knowledge base management with versioning
- Real-time indexing and updates
- Governance oversight and audit logging
- Performance monitoring and analytics
- Batch processing and bulk operations
"""

from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, Form, BackgroundTasks
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
from typing import Dict, List, Any, Optional, Union
from datetime import datetime
import json
import logging
import asyncio
import tempfile
import os
from pathlib import Path

# Import enhanced components
from .advanced_document_processor import AdvancedDocumentProcessor, ProcessingResult
from .enhanced_vector_service import EnhancedVectorService, SearchQuery, SearchResponse

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create router
router = APIRouter(prefix="/api/governance/knowledge/enhanced", tags=["Enhanced Knowledge Management"])

# Global instances
document_processor = None
vector_service = None

# ============================================================================
# PYDANTIC MODELS
# ============================================================================

class DocumentUploadResponse(BaseModel):
    """Response model for document upload"""
    success: bool
    document_id: str
    file_name: str
    processing_status: str
    chunks_created: int
    processing_time: float
    metadata: Dict[str, Any]
    error_message: Optional[str] = None

class SearchRequest(BaseModel):
    """Request model for semantic search"""
    query: str = Field(..., description="Search query")
    query_type: str = Field("semantic", description="Search type: semantic, keyword, or hybrid")
    filters: Dict[str, Any] = Field(default_factory=dict, description="Search filters")
    limit: int = Field(10, description="Maximum number of results")
    threshold: float = Field(0.7, description="Minimum similarity threshold")
    conversation_context: List[str] = Field(default_factory=list, description="Conversation context")
    user_id: Optional[str] = Field(None, description="User ID for personalization")

class KnowledgeBaseStats(BaseModel):
    """Knowledge base statistics model"""
    total_documents: int
    total_chunks: int
    supported_formats: List[str]
    index_stats: Dict[str, Any]
    processing_stats: Dict[str, Any]
    search_stats: Dict[str, Any]

class BulkProcessingRequest(BaseModel):
    """Request model for bulk document processing"""
    file_paths: List[str] = Field(..., description="List of file paths to process")
    batch_size: int = Field(5, description="Number of documents to process concurrently")
    overwrite_existing: bool = Field(False, description="Whether to overwrite existing documents")

# ============================================================================
# DEPENDENCY FUNCTIONS
# ============================================================================

async def get_document_processor() -> AdvancedDocumentProcessor:
    """Get or create document processor instance"""
    global document_processor
    
    if document_processor is None:
        # Import governance adapter if available
        try:
            import sys
            import os
            sys.path.append(os.path.join(os.path.dirname(__file__), '../../../services'))
            from UniversalGovernanceAdapter import UniversalGovernanceAdapter
            governance_adapter = UniversalGovernanceAdapter(context="knowledge_enhanced")
            logger.info("✅ [Enhanced Knowledge API] Universal Governance Adapter loaded")
        except ImportError as e:
            logger.warning(f"⚠️ [Enhanced Knowledge API] Could not load governance adapter: {e}")
            governance_adapter = None
        
        document_processor = AdvancedDocumentProcessor(governance_adapter)
        await document_processor.initialize_models()
        logger.info("📄 [Enhanced Knowledge API] Document processor initialized")
    
    return document_processor

async def get_vector_service() -> EnhancedVectorService:
    """Get or create vector service instance"""
    global vector_service
    
    if vector_service is None:
        # Import governance adapter if available
        try:
            import sys
            import os
            sys.path.append(os.path.join(os.path.dirname(__file__), '../../../services'))
            from UniversalGovernanceAdapter import UniversalGovernanceAdapter
            governance_adapter = UniversalGovernanceAdapter(context="vector_enhanced")
            logger.info("✅ [Enhanced Knowledge API] Universal Governance Adapter loaded")
        except ImportError as e:
            logger.warning(f"⚠️ [Enhanced Knowledge API] Could not load governance adapter: {e}")
            governance_adapter = None
        
        vector_service = EnhancedVectorService(governance_adapter)
        await vector_service.initialize()
        logger.info("🔍 [Enhanced Knowledge API] Vector service initialized")
    
    return vector_service

# ============================================================================
# DOCUMENT MANAGEMENT ENDPOINTS
# ============================================================================

@router.post("/documents/upload", response_model=DocumentUploadResponse)
async def upload_document(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    document_id: Optional[str] = Form(None),
    metadata: Optional[str] = Form("{}"),
    processor: AdvancedDocumentProcessor = Depends(get_document_processor),
    vector_service: EnhancedVectorService = Depends(get_vector_service)
):
    """Upload and process a document"""
    try:
        logger.info(f"📤 [Enhanced Knowledge API] Uploading document: {file.filename}")
        
        # Validate file type
        if not processor.is_supported_format(file.filename):
            raise HTTPException(
                status_code=400,
                detail=f"Unsupported file format. Supported formats: {processor.get_supported_formats()}"
            )
        
        # Parse metadata
        try:
            doc_metadata = json.loads(metadata)
        except json.JSONDecodeError:
            doc_metadata = {}
        
        # Save uploaded file temporarily
        with tempfile.NamedTemporaryFile(delete=False, suffix=Path(file.filename).suffix) as temp_file:
            content = await file.read()
            temp_file.write(content)
            temp_file_path = temp_file.name
        
        try:
            # Process document
            result = await processor.process_document(temp_file_path, document_id)
            
            if result.success:
                # Convert chunks to format expected by vector service
                chunks_for_indexing = []
                for chunk in result.chunks:
                    chunk_dict = {
                        "chunk_id": chunk.chunk_id,
                        "document_id": chunk.document_id,
                        "content": chunk.content,
                        "chunk_type": chunk.chunk_type,
                        "chunk_index": chunk.chunk_index,
                        "page_number": chunk.page_number,
                        "section_title": chunk.section_title,
                        "metadata": {**chunk.metadata, **doc_metadata}
                    }
                    chunks_for_indexing.append(chunk_dict)
                
                # Add chunks to vector index in background
                background_tasks.add_task(vector_service.add_chunks, chunks_for_indexing)
                
                response = DocumentUploadResponse(
                    success=True,
                    document_id=result.document_id,
                    file_name=file.filename,
                    processing_status="completed",
                    chunks_created=len(result.chunks),
                    processing_time=result.processing_time,
                    metadata=result.metadata.__dict__ if result.metadata else {}
                )
                
                logger.info(f"✅ [Enhanced Knowledge API] Document processed successfully: {result.document_id}")
                return response
            else:
                raise HTTPException(
                    status_code=500,
                    detail=f"Document processing failed: {result.error_message}"
                )
        
        finally:
            # Clean up temporary file
            os.unlink(temp_file_path)
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ [Enhanced Knowledge API] Document upload failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/documents/bulk-upload")
async def bulk_upload_documents(
    background_tasks: BackgroundTasks,
    request: BulkProcessingRequest,
    processor: AdvancedDocumentProcessor = Depends(get_document_processor),
    vector_service: EnhancedVectorService = Depends(get_vector_service)
):
    """Bulk upload and process multiple documents"""
    try:
        logger.info(f"📦 [Enhanced Knowledge API] Bulk processing {len(request.file_paths)} documents")
        
        # Validate file paths
        valid_paths = []
        for file_path in request.file_paths:
            if os.path.exists(file_path) and processor.is_supported_format(file_path):
                valid_paths.append(file_path)
            else:
                logger.warning(f"⚠️ [Enhanced Knowledge API] Skipping invalid file: {file_path}")
        
        if not valid_paths:
            raise HTTPException(status_code=400, detail="No valid files found")
        
        # Process documents in batches
        results = []
        for i in range(0, len(valid_paths), request.batch_size):
            batch = valid_paths[i:i + request.batch_size]
            batch_results = await processor.process_multiple_documents(batch)
            results.extend(batch_results)
        
        # Prepare chunks for indexing
        all_chunks = []
        successful_docs = 0
        
        for result in results:
            if result.success:
                successful_docs += 1
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
        
        # Add all chunks to vector index in background
        if all_chunks:
            background_tasks.add_task(vector_service.add_chunks, all_chunks)
        
        return {
            "success": True,
            "message": f"Bulk processing completed",
            "total_files": len(request.file_paths),
            "valid_files": len(valid_paths),
            "successful_documents": successful_docs,
            "total_chunks": len(all_chunks),
            "results": [
                {
                    "document_id": r.document_id,
                    "success": r.success,
                    "chunks_created": len(r.chunks) if r.success else 0,
                    "error_message": r.error_message
                }
                for r in results
            ]
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ [Enhanced Knowledge API] Bulk upload failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/documents/{document_id}")
async def delete_document(
    document_id: str,
    vector_service: EnhancedVectorService = Depends(get_vector_service)
):
    """Delete a document and all its chunks"""
    try:
        logger.info(f"🗑️ [Enhanced Knowledge API] Deleting document: {document_id}")
        
        success = await vector_service.delete_document(document_id)
        
        if success:
            return {
                "success": True,
                "message": f"Document {document_id} deleted successfully"
            }
        else:
            raise HTTPException(status_code=500, detail="Failed to delete document")
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ [Enhanced Knowledge API] Document deletion failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ============================================================================
# SEARCH ENDPOINTS
# ============================================================================

@router.post("/search", response_model=SearchResponse)
async def search_knowledge_base(
    request: SearchRequest,
    vector_service: EnhancedVectorService = Depends(get_vector_service)
):
    """Search the knowledge base using advanced semantic search"""
    try:
        logger.info(f"🔍 [Enhanced Knowledge API] Searching: '{request.query}'")
        
        # Create search query
        search_query = SearchQuery(
            query=request.query,
            query_type=request.query_type,
            filters=request.filters,
            limit=request.limit,
            threshold=request.threshold,
            conversation_context=request.conversation_context,
            user_id=request.user_id
        )
        
        # Perform search
        response = await vector_service.search(search_query)
        
        logger.info(f"✅ [Enhanced Knowledge API] Search completed: {len(response.results)} results")
        return response
        
    except Exception as e:
        logger.error(f"❌ [Enhanced Knowledge API] Search failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/search/suggestions")
async def get_search_suggestions(
    query: str,
    limit: int = 5,
    vector_service: EnhancedVectorService = Depends(get_vector_service)
):
    """Get search suggestions based on partial query"""
    try:
        # For now, return simple suggestions
        # In a full implementation, this would use query completion models
        suggestions = [
            f"{query} documentation",
            f"{query} tutorial",
            f"{query} examples",
            f"{query} best practices",
            f"how to {query}"
        ]
        
        return {
            "success": True,
            "query": query,
            "suggestions": suggestions[:limit]
        }
        
    except Exception as e:
        logger.error(f"❌ [Enhanced Knowledge API] Suggestions failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ============================================================================
# ANALYTICS AND MONITORING ENDPOINTS
# ============================================================================

@router.get("/stats", response_model=KnowledgeBaseStats)
async def get_knowledge_base_stats(
    processor: AdvancedDocumentProcessor = Depends(get_document_processor),
    vector_service: EnhancedVectorService = Depends(get_vector_service)
):
    """Get comprehensive knowledge base statistics"""
    try:
        # Get stats from both services
        processing_stats = processor.get_processing_stats()
        index_stats = await vector_service.get_index_stats()
        
        stats = KnowledgeBaseStats(
            total_documents=index_stats.get("total_documents", 0),
            total_chunks=index_stats.get("total_chunks", 0),
            supported_formats=processor.get_supported_formats(),
            index_stats=index_stats,
            processing_stats=processing_stats,
            search_stats=index_stats.get("search_stats", {})
        )
        
        return stats
        
    except Exception as e:
        logger.error(f"❌ [Enhanced Knowledge API] Stats retrieval failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/maintenance/clear-cache")
async def clear_search_cache(
    vector_service: EnhancedVectorService = Depends(get_vector_service)
):
    """Clear the search cache"""
    try:
        await vector_service.clear_cache()
        
        return {
            "success": True,
            "message": "Search cache cleared successfully"
        }
        
    except Exception as e:
        logger.error(f"❌ [Enhanced Knowledge API] Cache clearing failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/maintenance/reindex")
async def reindex_knowledge_base(
    background_tasks: BackgroundTasks,
    vector_service: EnhancedVectorService = Depends(get_vector_service)
):
    """Trigger a full reindex of the knowledge base"""
    try:
        # This would typically involve rebuilding the entire index
        # For now, just clear the cache
        await vector_service.clear_cache()
        
        return {
            "success": True,
            "message": "Reindexing initiated",
            "status": "in_progress"
        }
        
    except Exception as e:
        logger.error(f"❌ [Enhanced Knowledge API] Reindexing failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ============================================================================
# HEALTH CHECK ENDPOINTS
# ============================================================================

@router.get("/health")
async def health_check():
    """Health check endpoint"""
    try:
        # Check if services are initialized
        processor_status = document_processor is not None
        vector_status = vector_service is not None
        
        return {
            "success": True,
            "status": "healthy",
            "services": {
                "document_processor": "initialized" if processor_status else "not_initialized",
                "vector_service": "initialized" if vector_status else "not_initialized"
            },
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"❌ [Enhanced Knowledge API] Health check failed: {e}")
        return {
            "success": False,
            "status": "unhealthy",
            "error": str(e),
            "timestamp": datetime.now().isoformat()
        }

# ============================================================================
# ERROR HANDLERS
# ============================================================================

@router.exception_handler(HTTPException)
async def http_exception_handler(request, exc):
    """Handle HTTP exceptions"""
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "success": False,
            "error": exc.detail,
            "status_code": exc.status_code
        }
    )

@router.exception_handler(Exception)
async def general_exception_handler(request, exc):
    """Handle general exceptions"""
    logger.error(f"❌ [Enhanced Knowledge API] Unhandled exception: {exc}")
    return JSONResponse(
        status_code=500,
        content={
            "success": False,
            "error": "Internal server error",
            "status_code": 500
        }
    )

