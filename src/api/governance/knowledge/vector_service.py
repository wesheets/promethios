"""
Vector Database Service for Universal Knowledge Management

Real implementation of vector database operations with:
- ChromaDB integration for local development and production
- OpenAI embedding generation with governance oversight
- Vector search with similarity scoring
- Collection management with governance metadata
"""

import os
import uuid
import asyncio
from typing import Dict, List, Any, Optional, Tuple
from datetime import datetime, timezone

import chromadb
from chromadb.config import Settings
import openai
import httpx

class VectorService:
    """
    Vector database service with ChromaDB and OpenAI embeddings
    """
    
    def __init__(self):
        # Initialize ChromaDB client
        self.chroma_client = chromadb.Client(Settings(
            chroma_db_impl="duckdb+parquet",
            persist_directory="./data/chroma_db"
        ))
        
        # Initialize OpenAI client
        self.openai_client = openai.OpenAI(
            api_key=os.getenv("OPENAI_API_KEY"),
            base_url=os.getenv("OPENAI_API_BASE", "https://api.openai.com/v1")
        )
        
        # Embedding configuration
        self.embedding_model = "text-embedding-ada-002"
        self.embedding_dimensions = 1536
        self.max_tokens_per_request = 8000
        
        # Collection cache
        self._collections = {}
    
    async def create_collection(
        self, 
        collection_name: str, 
        metadata: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Create a new vector collection"""
        try:
            # Add governance metadata
            collection_metadata = {
                "created_at": datetime.now(timezone.utc).isoformat(),
                "embedding_model": self.embedding_model,
                "dimensions": self.embedding_dimensions,
                **(metadata or {})
            }
            
            # Create ChromaDB collection
            collection = self.chroma_client.create_collection(
                name=collection_name,
                metadata=collection_metadata
            )
            
            # Cache collection
            self._collections[collection_name] = collection
            
            return {
                "collection_id": collection_name,
                "collection_name": collection_name,
                "metadata": collection_metadata,
                "status": "created"
            }
            
        except Exception as e:
            raise Exception(f"Failed to create collection: {str(e)}")
    
    async def get_collection(self, collection_name: str):
        """Get or retrieve a collection"""
        try:
            if collection_name not in self._collections:
                self._collections[collection_name] = self.chroma_client.get_collection(
                    name=collection_name
                )
            return self._collections[collection_name]
        except Exception as e:
            raise Exception(f"Collection not found: {str(e)}")
    
    async def generate_embeddings(
        self, 
        texts: List[str], 
        batch_size: int = 100
    ) -> List[List[float]]:
        """Generate embeddings using OpenAI API with batching"""
        try:
            all_embeddings = []
            
            # Process in batches to respect API limits
            for i in range(0, len(texts), batch_size):
                batch_texts = texts[i:i + batch_size]
                
                # Filter out empty texts
                valid_texts = [text for text in batch_texts if text.strip()]
                if not valid_texts:
                    continue
                
                # Call OpenAI embedding API
                response = self.openai_client.embeddings.create(
                    model=self.embedding_model,
                    input=valid_texts
                )
                
                # Extract embeddings
                batch_embeddings = [item.embedding for item in response.data]
                all_embeddings.extend(batch_embeddings)
                
                # Add small delay to respect rate limits
                await asyncio.sleep(0.1)
            
            return all_embeddings
            
        except Exception as e:
            raise Exception(f"Embedding generation failed: {str(e)}")
    
    async def add_vectors(
        self,
        collection_name: str,
        documents: List[str],
        metadatas: List[Dict[str, Any]],
        ids: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        """Add vectors to collection with embeddings"""
        try:
            collection = await self.get_collection(collection_name)
            
            # Generate IDs if not provided
            if not ids:
                ids = [str(uuid.uuid4()) for _ in documents]
            
            # Generate embeddings
            embeddings = await self.generate_embeddings(documents)
            
            # Add governance metadata to each document
            enhanced_metadatas = []
            for i, metadata in enumerate(metadatas):
                enhanced_metadata = {
                    "added_at": datetime.now(timezone.utc).isoformat(),
                    "embedding_model": self.embedding_model,
                    "document_index": i,
                    **metadata
                }
                enhanced_metadatas.append(enhanced_metadata)
            
            # Add to ChromaDB
            collection.add(
                embeddings=embeddings,
                documents=documents,
                metadatas=enhanced_metadatas,
                ids=ids
            )
            
            return {
                "added_count": len(documents),
                "collection_name": collection_name,
                "ids": ids,
                "status": "success"
            }
            
        except Exception as e:
            raise Exception(f"Failed to add vectors: {str(e)}")
    
    async def search_vectors(
        self,
        collection_name: str,
        query_text: str,
        max_results: int = 5,
        similarity_threshold: float = 0.0,
        filter_metadata: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Search vectors with similarity scoring"""
        try:
            collection = await self.get_collection(collection_name)
            
            # Generate query embedding
            query_embeddings = await self.generate_embeddings([query_text])
            if not query_embeddings:
                raise Exception("Failed to generate query embedding")
            
            query_embedding = query_embeddings[0]
            
            # Prepare ChromaDB query
            query_params = {
                "query_embeddings": [query_embedding],
                "n_results": max_results
            }
            
            # Add metadata filtering if provided
            if filter_metadata:
                query_params["where"] = filter_metadata
            
            # Execute search
            results = collection.query(**query_params)
            
            # Process results
            search_results = []
            if results["ids"] and results["ids"][0]:  # Check if we have results
                for i in range(len(results["ids"][0])):
                    similarity_score = 1.0 - results["distances"][0][i]  # Convert distance to similarity
                    
                    # Apply similarity threshold
                    if similarity_score >= similarity_threshold:
                        result = {
                            "id": results["ids"][0][i],
                            "document": results["documents"][0][i] if results["documents"] else "",
                            "metadata": results["metadatas"][0][i] if results["metadatas"] else {},
                            "similarity_score": similarity_score,
                            "distance": results["distances"][0][i]
                        }
                        search_results.append(result)
            
            return {
                "results": search_results,
                "query": query_text,
                "total_results": len(search_results),
                "collection_name": collection_name,
                "status": "success"
            }
            
        except Exception as e:
            raise Exception(f"Vector search failed: {str(e)}")
    
    async def update_vector(
        self,
        collection_name: str,
        vector_id: str,
        document: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Update a vector in the collection"""
        try:
            collection = await self.get_collection(collection_name)
            
            update_params = {"ids": [vector_id]}
            
            if document is not None:
                # Generate new embedding for updated document
                embeddings = await self.generate_embeddings([document])
                update_params["embeddings"] = embeddings
                update_params["documents"] = [document]
            
            if metadata is not None:
                # Add update timestamp to metadata
                enhanced_metadata = {
                    "updated_at": datetime.now(timezone.utc).isoformat(),
                    **metadata
                }
                update_params["metadatas"] = [enhanced_metadata]
            
            # Update in ChromaDB
            collection.update(**update_params)
            
            return {
                "vector_id": vector_id,
                "collection_name": collection_name,
                "status": "updated"
            }
            
        except Exception as e:
            raise Exception(f"Failed to update vector: {str(e)}")
    
    async def delete_vectors(
        self,
        collection_name: str,
        vector_ids: List[str]
    ) -> Dict[str, Any]:
        """Delete vectors from collection"""
        try:
            collection = await self.get_collection(collection_name)
            
            # Delete from ChromaDB
            collection.delete(ids=vector_ids)
            
            return {
                "deleted_count": len(vector_ids),
                "collection_name": collection_name,
                "status": "deleted"
            }
            
        except Exception as e:
            raise Exception(f"Failed to delete vectors: {str(e)}")
    
    async def get_collection_stats(self, collection_name: str) -> Dict[str, Any]:
        """Get statistics for a collection"""
        try:
            collection = await self.get_collection(collection_name)
            
            # Get collection count
            count_result = collection.count()
            
            # Get collection metadata
            collection_metadata = collection.metadata or {}
            
            return {
                "collection_name": collection_name,
                "document_count": count_result,
                "metadata": collection_metadata,
                "embedding_model": collection_metadata.get("embedding_model", self.embedding_model),
                "dimensions": collection_metadata.get("dimensions", self.embedding_dimensions),
                "created_at": collection_metadata.get("created_at"),
                "status": "active"
            }
            
        except Exception as e:
            raise Exception(f"Failed to get collection stats: {str(e)}")
    
    async def delete_collection(self, collection_name: str) -> Dict[str, Any]:
        """Delete an entire collection"""
        try:
            # Delete from ChromaDB
            self.chroma_client.delete_collection(name=collection_name)
            
            # Remove from cache
            if collection_name in self._collections:
                del self._collections[collection_name]
            
            return {
                "collection_name": collection_name,
                "status": "deleted"
            }
            
        except Exception as e:
            raise Exception(f"Failed to delete collection: {str(e)}")
    
    async def health_check(self) -> Dict[str, Any]:
        """Check health of vector service"""
        try:
            # Test ChromaDB connection
            collections = self.chroma_client.list_collections()
            
            # Test OpenAI API connection
            try:
                test_embedding = await self.generate_embeddings(["test"])
                openai_status = "healthy" if test_embedding else "unhealthy"
            except:
                openai_status = "unhealthy"
            
            return {
                "status": "healthy",
                "chromadb_status": "healthy",
                "openai_status": openai_status,
                "collections_count": len(collections),
                "embedding_model": self.embedding_model,
                "timestamp": datetime.now(timezone.utc).isoformat()
            }
            
        except Exception as e:
            return {
                "status": "unhealthy",
                "error": str(e),
                "timestamp": datetime.now(timezone.utc).isoformat()
            }

# Global vector service instance
vector_service = VectorService()

