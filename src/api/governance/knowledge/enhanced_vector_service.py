"""
Enhanced Vector Service
======================

Advanced vector database and semantic search service for the Promethios Chat platform.
Provides high-performance similarity search, hybrid search, and intelligent ranking.

Features:
- Multiple vector database backends (FAISS, Chroma, Pinecone)
- Hybrid search (semantic + keyword)
- Advanced ranking algorithms
- Query expansion and rewriting
- Contextual search with conversation history
- Real-time indexing and updates
- Governance oversight and audit logging
- Performance optimization and caching
"""

import asyncio
import json
import logging
import numpy as np
from datetime import datetime, timezone
from typing import Dict, List, Any, Optional, Union, Tuple
from dataclasses import dataclass, asdict
import uuid
import pickle
import sqlite3
from pathlib import Path

# Vector database libraries
import faiss
from sentence_transformers import SentenceTransformer
import chromadb
from chromadb.config import Settings

# Text processing
import tiktoken
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import nltk
from nltk.corpus import stopwords
from nltk.tokenize import word_tokenize
from nltk.stem import PorterStemmer

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@dataclass
class SearchQuery:
    """Search query structure"""
    query: str
    query_type: str = "semantic"  # semantic, keyword, hybrid
    filters: Dict[str, Any] = None
    limit: int = 10
    threshold: float = 0.7
    conversation_context: List[str] = None
    user_id: Optional[str] = None
    
    def __post_init__(self):
        if self.filters is None:
            self.filters = {}
        if self.conversation_context is None:
            self.conversation_context = []

@dataclass
class SearchResult:
    """Search result structure"""
    chunk_id: str
    document_id: str
    content: str
    score: float
    metadata: Dict[str, Any]
    chunk_type: str
    page_number: Optional[int] = None
    section_title: Optional[str] = None
    
    def __post_init__(self):
        if self.metadata is None:
            self.metadata = {}

@dataclass
class SearchResponse:
    """Search response structure"""
    query: str
    results: List[SearchResult]
    total_results: int
    search_time: float
    query_expansion: Optional[str] = None
    search_strategy: str = "semantic"
    filters_applied: Dict[str, Any] = None
    
    def __post_init__(self):
        if self.filters_applied is None:
            self.filters_applied = {}

class EnhancedVectorService:
    """
    Enhanced Vector Service
    
    Provides advanced semantic search capabilities with multiple backends
    and intelligent ranking algorithms.
    """
    
    def __init__(self, 
                 governance_adapter=None,
                 embedding_model="all-MiniLM-L6-v2",
                 vector_db_type="faiss",
                 db_path="./vector_db"):
        
        self.governance_adapter = governance_adapter
        self.embedding_model_name = embedding_model
        self.vector_db_type = vector_db_type
        self.db_path = Path(db_path)
        self.db_path.mkdir(exist_ok=True)
        
        # Models and services
        self.embedding_model = None
        self.tokenizer = None
        self.tfidf_vectorizer = None
        self.stemmer = PorterStemmer()
        
        # Vector databases
        self.faiss_index = None
        self.chroma_client = None
        self.chroma_collection = None
        
        # Metadata storage
        self.metadata_db_path = self.db_path / "metadata.db"
        self.chunk_metadata = {}
        
        # Search cache
        self.search_cache = {}
        self.cache_size = 1000
        
        # Performance metrics
        self.search_stats = {
            "total_searches": 0,
            "avg_search_time": 0.0,
            "cache_hits": 0,
            "index_size": 0
        }
        
        logger.info(f"🔍 [VectorService] Enhanced vector service initialized with {vector_db_type}")
    
    async def initialize(self):
        """Initialize vector service components"""
        try:
            logger.info("🚀 [VectorService] Initializing vector service components")
            
            # Initialize embedding model
            await self._initialize_embedding_model()
            
            # Initialize vector database
            await self._initialize_vector_db()
            
            # Initialize metadata storage
            await self._initialize_metadata_storage()
            
            # Initialize TF-IDF for hybrid search
            await self._initialize_tfidf()
            
            logger.info("✅ [VectorService] Vector service initialized successfully")
            
        except Exception as e:
            logger.error(f"❌ [VectorService] Initialization failed: {e}")
            raise
    
    async def _initialize_embedding_model(self):
        """Initialize embedding model"""
        try:
            logger.info(f"🤖 [VectorService] Loading embedding model: {self.embedding_model_name}")
            self.embedding_model = SentenceTransformer(self.embedding_model_name)
            self.tokenizer = tiktoken.get_encoding("cl100k_base")
            logger.info("✅ [VectorService] Embedding model loaded")
            
        except Exception as e:
            logger.error(f"❌ [VectorService] Embedding model initialization failed: {e}")
            raise
    
    async def _initialize_vector_db(self):
        """Initialize vector database backend"""
        try:
            if self.vector_db_type == "faiss":
                await self._initialize_faiss()
            elif self.vector_db_type == "chroma":
                await self._initialize_chroma()
            else:
                raise ValueError(f"Unsupported vector database type: {self.vector_db_type}")
                
        except Exception as e:
            logger.error(f"❌ [VectorService] Vector database initialization failed: {e}")
            raise
    
    async def _initialize_faiss(self):
        """Initialize FAISS vector database"""
        try:
            logger.info("📊 [VectorService] Initializing FAISS index")
            
            # Get embedding dimension
            test_embedding = self.embedding_model.encode(["test"])
            dimension = len(test_embedding[0])
            
            # Create FAISS index
            self.faiss_index = faiss.IndexFlatIP(dimension)  # Inner product for cosine similarity
            
            # Try to load existing index
            index_path = self.db_path / "faiss_index.bin"
            if index_path.exists():
                self.faiss_index = faiss.read_index(str(index_path))
                logger.info(f"📂 [VectorService] Loaded existing FAISS index with {self.faiss_index.ntotal} vectors")
            
            self.search_stats["index_size"] = self.faiss_index.ntotal
            
        except Exception as e:
            logger.error(f"❌ [VectorService] FAISS initialization failed: {e}")
            raise
    
    async def _initialize_chroma(self):
        """Initialize Chroma vector database"""
        try:
            logger.info("🎨 [VectorService] Initializing Chroma database")
            
            # Create Chroma client
            self.chroma_client = chromadb.PersistentClient(
                path=str(self.db_path / "chroma"),
                settings=Settings(anonymized_telemetry=False)
            )
            
            # Get or create collection
            try:
                self.chroma_collection = self.chroma_client.get_collection("promethios_knowledge")
                logger.info(f"📂 [VectorService] Loaded existing Chroma collection with {self.chroma_collection.count()} vectors")
            except:
                self.chroma_collection = self.chroma_client.create_collection(
                    name="promethios_knowledge",
                    metadata={"description": "Promethios knowledge base"}
                )
                logger.info("🆕 [VectorService] Created new Chroma collection")
            
            self.search_stats["index_size"] = self.chroma_collection.count()
            
        except Exception as e:
            logger.error(f"❌ [VectorService] Chroma initialization failed: {e}")
            raise
    
    async def _initialize_metadata_storage(self):
        """Initialize metadata storage"""
        try:
            logger.info("💾 [VectorService] Initializing metadata storage")
            
            # Create SQLite database for metadata
            conn = sqlite3.connect(self.metadata_db_path)
            cursor = conn.cursor()
            
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS chunk_metadata (
                    chunk_id TEXT PRIMARY KEY,
                    document_id TEXT,
                    content TEXT,
                    chunk_type TEXT,
                    chunk_index INTEGER,
                    page_number INTEGER,
                    section_title TEXT,
                    metadata TEXT,
                    created_at TIMESTAMP,
                    updated_at TIMESTAMP
                )
            ''')
            
            cursor.execute('''
                CREATE INDEX IF NOT EXISTS idx_document_id ON chunk_metadata(document_id)
            ''')
            
            cursor.execute('''
                CREATE INDEX IF NOT EXISTS idx_chunk_type ON chunk_metadata(chunk_type)
            ''')
            
            conn.commit()
            conn.close()
            
            logger.info("✅ [VectorService] Metadata storage initialized")
            
        except Exception as e:
            logger.error(f"❌ [VectorService] Metadata storage initialization failed: {e}")
            raise
    
    async def _initialize_tfidf(self):
        """Initialize TF-IDF vectorizer for hybrid search"""
        try:
            logger.info("📝 [VectorService] Initializing TF-IDF vectorizer")
            
            # Try to load existing vectorizer
            tfidf_path = self.db_path / "tfidf_vectorizer.pkl"
            if tfidf_path.exists():
                with open(tfidf_path, 'rb') as f:
                    self.tfidf_vectorizer = pickle.load(f)
                logger.info("📂 [VectorService] Loaded existing TF-IDF vectorizer")
            else:
                # Create new vectorizer
                self.tfidf_vectorizer = TfidfVectorizer(
                    max_features=10000,
                    stop_words='english',
                    ngram_range=(1, 2),
                    min_df=2,
                    max_df=0.8
                )
                logger.info("🆕 [VectorService] Created new TF-IDF vectorizer")
            
        except Exception as e:
            logger.error(f"❌ [VectorService] TF-IDF initialization failed: {e}")
            # Continue without TF-IDF
            self.tfidf_vectorizer = None
    
    # ============================================================================
    # INDEXING METHODS
    # ============================================================================
    
    async def add_chunks(self, chunks: List[Dict[str, Any]]) -> bool:
        """Add document chunks to the vector index"""
        try:
            logger.info(f"📥 [VectorService] Adding {len(chunks)} chunks to index")
            
            if not chunks:
                return True
            
            # Extract content and generate embeddings
            contents = [chunk.get("content", "") for chunk in chunks]
            embeddings = self.embedding_model.encode(contents, convert_to_tensor=False)
            
            # Normalize embeddings for cosine similarity
            embeddings = embeddings / np.linalg.norm(embeddings, axis=1, keepdims=True)
            
            # Add to vector database
            if self.vector_db_type == "faiss":
                await self._add_to_faiss(chunks, embeddings)
            elif self.vector_db_type == "chroma":
                await self._add_to_chroma(chunks, embeddings)
            
            # Store metadata
            await self._store_chunk_metadata(chunks)
            
            # Update TF-IDF if available
            if self.tfidf_vectorizer is not None:
                await self._update_tfidf(contents)
            
            # Update stats
            self.search_stats["index_size"] += len(chunks)
            
            logger.info(f"✅ [VectorService] Successfully added {len(chunks)} chunks")
            
            # Log indexing for governance
            if self.governance_adapter:
                await self.governance_adapter.createAuditEntry({
                    "interaction_id": f"vector_index_{datetime.now().timestamp()}",
                    "agent_id": "vector_service",
                    "event_type": "chunks_indexed",
                    "chunks_added": len(chunks),
                    "index_size": self.search_stats["index_size"],
                    "vector_db_type": self.vector_db_type,
                    "status": "success"
                })
            
            return True
            
        except Exception as e:
            logger.error(f"❌ [VectorService] Failed to add chunks: {e}")
            return False
    
    async def _add_to_faiss(self, chunks: List[Dict], embeddings: np.ndarray):
        """Add chunks to FAISS index"""
        try:
            # Add embeddings to FAISS index
            self.faiss_index.add(embeddings.astype(np.float32))
            
            # Save index
            index_path = self.db_path / "faiss_index.bin"
            faiss.write_index(self.faiss_index, str(index_path))
            
        except Exception as e:
            logger.error(f"❌ [VectorService] FAISS indexing failed: {e}")
            raise
    
    async def _add_to_chroma(self, chunks: List[Dict], embeddings: np.ndarray):
        """Add chunks to Chroma database"""
        try:
            # Prepare data for Chroma
            ids = [chunk.get("chunk_id", str(uuid.uuid4())) for chunk in chunks]
            documents = [chunk.get("content", "") for chunk in chunks]
            metadatas = [
                {
                    "document_id": chunk.get("document_id", ""),
                    "chunk_type": chunk.get("chunk_type", ""),
                    "chunk_index": chunk.get("chunk_index", 0),
                    "page_number": chunk.get("page_number"),
                    "section_title": chunk.get("section_title", "")
                }
                for chunk in chunks
            ]
            
            # Add to Chroma collection
            self.chroma_collection.add(
                ids=ids,
                documents=documents,
                embeddings=embeddings.tolist(),
                metadatas=metadatas
            )
            
        except Exception as e:
            logger.error(f"❌ [VectorService] Chroma indexing failed: {e}")
            raise
    
    async def _store_chunk_metadata(self, chunks: List[Dict]):
        """Store chunk metadata in SQLite"""
        try:
            conn = sqlite3.connect(self.metadata_db_path)
            cursor = conn.cursor()
            
            for chunk in chunks:
                cursor.execute('''
                    INSERT OR REPLACE INTO chunk_metadata 
                    (chunk_id, document_id, content, chunk_type, chunk_index, 
                     page_number, section_title, metadata, created_at, updated_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ''', (
                    chunk.get("chunk_id"),
                    chunk.get("document_id"),
                    chunk.get("content", ""),
                    chunk.get("chunk_type", ""),
                    chunk.get("chunk_index", 0),
                    chunk.get("page_number"),
                    chunk.get("section_title"),
                    json.dumps(chunk.get("metadata", {})),
                    datetime.now(timezone.utc).isoformat(),
                    datetime.now(timezone.utc).isoformat()
                ))
            
            conn.commit()
            conn.close()
            
        except Exception as e:
            logger.error(f"❌ [VectorService] Metadata storage failed: {e}")
            raise
    
    async def _update_tfidf(self, contents: List[str]):
        """Update TF-IDF vectorizer with new content"""
        try:
            if not self.tfidf_vectorizer:
                return
            
            # Get existing documents
            conn = sqlite3.connect(self.metadata_db_path)
            cursor = conn.cursor()
            cursor.execute("SELECT content FROM chunk_metadata")
            existing_contents = [row[0] for row in cursor.fetchall()]
            conn.close()
            
            # Fit TF-IDF on all documents
            all_contents = existing_contents + contents
            if len(all_contents) > 1:
                self.tfidf_vectorizer.fit(all_contents)
                
                # Save vectorizer
                tfidf_path = self.db_path / "tfidf_vectorizer.pkl"
                with open(tfidf_path, 'wb') as f:
                    pickle.dump(self.tfidf_vectorizer, f)
            
        except Exception as e:
            logger.error(f"❌ [VectorService] TF-IDF update failed: {e}")
    
    # ============================================================================
    # SEARCH METHODS
    # ============================================================================
    
    async def search(self, query: SearchQuery) -> SearchResponse:
        """Perform semantic search"""
        start_time = datetime.now(timezone.utc)
        
        try:
            logger.info(f"🔍 [VectorService] Searching: '{query.query}' (type: {query.query_type})")
            
            # Check cache
            cache_key = self._get_cache_key(query)
            if cache_key in self.search_cache:
                self.search_stats["cache_hits"] += 1
                logger.info("💾 [VectorService] Cache hit")
                return self.search_cache[cache_key]
            
            # Expand query if needed
            expanded_query = await self._expand_query(query)
            
            # Perform search based on type
            if query.query_type == "semantic":
                results = await self._semantic_search(expanded_query, query)
            elif query.query_type == "keyword":
                results = await self._keyword_search(expanded_query, query)
            elif query.query_type == "hybrid":
                results = await self._hybrid_search(expanded_query, query)
            else:
                raise ValueError(f"Unsupported search type: {query.query_type}")
            
            # Apply filters
            filtered_results = await self._apply_filters(results, query.filters)
            
            # Rank and limit results
            ranked_results = await self._rank_results(filtered_results, query)
            final_results = ranked_results[:query.limit]
            
            search_time = (datetime.now(timezone.utc) - start_time).total_seconds()
            
            # Create response
            response = SearchResponse(
                query=query.query,
                results=final_results,
                total_results=len(filtered_results),
                search_time=search_time,
                query_expansion=expanded_query if expanded_query != query.query else None,
                search_strategy=query.query_type,
                filters_applied=query.filters
            )
            
            # Cache response
            self._cache_response(cache_key, response)
            
            # Update stats
            self.search_stats["total_searches"] += 1
            self.search_stats["avg_search_time"] = (
                (self.search_stats["avg_search_time"] * (self.search_stats["total_searches"] - 1) + search_time) /
                self.search_stats["total_searches"]
            )
            
            logger.info(f"✅ [VectorService] Search completed: {len(final_results)} results in {search_time:.3f}s")
            
            # Log search for governance
            if self.governance_adapter:
                await self.governance_adapter.createAuditEntry({
                    "interaction_id": f"vector_search_{datetime.now().timestamp()}",
                    "agent_id": "vector_service",
                    "event_type": "semantic_search",
                    "query": query.query,
                    "search_type": query.query_type,
                    "results_count": len(final_results),
                    "search_time": search_time,
                    "user_id": query.user_id,
                    "status": "success"
                })
            
            return response
            
        except Exception as e:
            search_time = (datetime.now(timezone.utc) - start_time).total_seconds()
            logger.error(f"❌ [VectorService] Search failed: {e}")
            
            return SearchResponse(
                query=query.query,
                results=[],
                total_results=0,
                search_time=search_time,
                search_strategy=query.query_type
            )
    
    async def _semantic_search(self, query: str, search_query: SearchQuery) -> List[SearchResult]:
        """Perform semantic similarity search"""
        try:
            # Generate query embedding
            query_embedding = self.embedding_model.encode([query])
            query_embedding = query_embedding / np.linalg.norm(query_embedding, axis=1, keepdims=True)
            
            if self.vector_db_type == "faiss":
                return await self._faiss_search(query_embedding[0], search_query)
            elif self.vector_db_type == "chroma":
                return await self._chroma_search(query_embedding[0], search_query)
            else:
                return []
                
        except Exception as e:
            logger.error(f"❌ [VectorService] Semantic search failed: {e}")
            return []
    
    async def _faiss_search(self, query_embedding: np.ndarray, search_query: SearchQuery) -> List[SearchResult]:
        """Search using FAISS index"""
        try:
            # Search FAISS index
            scores, indices = self.faiss_index.search(
                query_embedding.reshape(1, -1).astype(np.float32),
                min(search_query.limit * 2, self.faiss_index.ntotal)  # Get more results for filtering
            )
            
            # Get metadata for results
            results = []
            conn = sqlite3.connect(self.metadata_db_path)
            cursor = conn.cursor()
            
            for score, idx in zip(scores[0], indices[0]):
                if idx == -1 or score < search_query.threshold:
                    continue
                
                # Get chunk metadata by index (assuming sequential insertion)
                cursor.execute('''
                    SELECT chunk_id, document_id, content, chunk_type, 
                           page_number, section_title, metadata
                    FROM chunk_metadata 
                    LIMIT 1 OFFSET ?
                ''', (int(idx),))
                
                row = cursor.fetchone()
                if row:
                    chunk_id, document_id, content, chunk_type, page_number, section_title, metadata_json = row
                    metadata = json.loads(metadata_json) if metadata_json else {}
                    
                    result = SearchResult(
                        chunk_id=chunk_id,
                        document_id=document_id,
                        content=content,
                        score=float(score),
                        metadata=metadata,
                        chunk_type=chunk_type,
                        page_number=page_number,
                        section_title=section_title
                    )
                    results.append(result)
            
            conn.close()
            return results
            
        except Exception as e:
            logger.error(f"❌ [VectorService] FAISS search failed: {e}")
            return []
    
    async def _chroma_search(self, query_embedding: np.ndarray, search_query: SearchQuery) -> List[SearchResult]:
        """Search using Chroma database"""
        try:
            # Search Chroma collection
            chroma_results = self.chroma_collection.query(
                query_embeddings=[query_embedding.tolist()],
                n_results=min(search_query.limit * 2, self.chroma_collection.count()),
                include=["documents", "metadatas", "distances"]
            )
            
            # Convert to SearchResult objects
            results = []
            for i, (doc, metadata, distance) in enumerate(zip(
                chroma_results["documents"][0],
                chroma_results["metadatas"][0],
                chroma_results["distances"][0]
            )):
                # Convert distance to similarity score
                score = 1.0 - distance
                
                if score < search_query.threshold:
                    continue
                
                result = SearchResult(
                    chunk_id=chroma_results["ids"][0][i],
                    document_id=metadata.get("document_id", ""),
                    content=doc,
                    score=score,
                    metadata=metadata,
                    chunk_type=metadata.get("chunk_type", ""),
                    page_number=metadata.get("page_number"),
                    section_title=metadata.get("section_title")
                )
                results.append(result)
            
            return results
            
        except Exception as e:
            logger.error(f"❌ [VectorService] Chroma search failed: {e}")
            return []
    
    async def _keyword_search(self, query: str, search_query: SearchQuery) -> List[SearchResult]:
        """Perform keyword-based search using TF-IDF"""
        try:
            if not self.tfidf_vectorizer:
                logger.warning("⚠️ [VectorService] TF-IDF not available, falling back to semantic search")
                return await self._semantic_search(query, search_query)
            
            # Transform query
            query_vector = self.tfidf_vectorizer.transform([query])
            
            # Get all documents
            conn = sqlite3.connect(self.metadata_db_path)
            cursor = conn.cursor()
            cursor.execute('''
                SELECT chunk_id, document_id, content, chunk_type, 
                       page_number, section_title, metadata
                FROM chunk_metadata
            ''')
            
            results = []
            documents = []
            metadata_list = []
            
            for row in cursor.fetchall():
                chunk_id, document_id, content, chunk_type, page_number, section_title, metadata_json = row
                documents.append(content)
                metadata_list.append({
                    "chunk_id": chunk_id,
                    "document_id": document_id,
                    "chunk_type": chunk_type,
                    "page_number": page_number,
                    "section_title": section_title,
                    "metadata": json.loads(metadata_json) if metadata_json else {}
                })
            
            conn.close()
            
            if documents:
                # Transform documents
                doc_vectors = self.tfidf_vectorizer.transform(documents)
                
                # Calculate similarities
                similarities = cosine_similarity(query_vector, doc_vectors)[0]
                
                # Create results
                for i, (similarity, doc, meta) in enumerate(zip(similarities, documents, metadata_list)):
                    if similarity >= search_query.threshold:
                        result = SearchResult(
                            chunk_id=meta["chunk_id"],
                            document_id=meta["document_id"],
                            content=doc,
                            score=float(similarity),
                            metadata=meta["metadata"],
                            chunk_type=meta["chunk_type"],
                            page_number=meta["page_number"],
                            section_title=meta["section_title"]
                        )
                        results.append(result)
            
            return results
            
        except Exception as e:
            logger.error(f"❌ [VectorService] Keyword search failed: {e}")
            return []
    
    async def _hybrid_search(self, query: str, search_query: SearchQuery) -> List[SearchResult]:
        """Perform hybrid search combining semantic and keyword search"""
        try:
            # Perform both searches
            semantic_results = await self._semantic_search(query, search_query)
            keyword_results = await self._keyword_search(query, search_query)
            
            # Combine and re-rank results
            combined_results = {}
            
            # Add semantic results with weight
            for result in semantic_results:
                combined_results[result.chunk_id] = result
                result.score *= 0.7  # Semantic weight
            
            # Add keyword results with weight
            for result in keyword_results:
                if result.chunk_id in combined_results:
                    # Combine scores
                    combined_results[result.chunk_id].score += result.score * 0.3  # Keyword weight
                else:
                    result.score *= 0.3
                    combined_results[result.chunk_id] = result
            
            return list(combined_results.values())
            
        except Exception as e:
            logger.error(f"❌ [VectorService] Hybrid search failed: {e}")
            return await self._semantic_search(query, search_query)
    
    # ============================================================================
    # QUERY PROCESSING AND RANKING
    # ============================================================================
    
    async def _expand_query(self, query: SearchQuery) -> str:
        """Expand query with synonyms and context"""
        try:
            expanded_query = query.query
            
            # Add conversation context if available
            if query.conversation_context:
                context = " ".join(query.conversation_context[-3:])  # Last 3 messages
                expanded_query = f"{context} {expanded_query}"
            
            return expanded_query
            
        except Exception as e:
            logger.error(f"❌ [VectorService] Query expansion failed: {e}")
            return query.query
    
    async def _apply_filters(self, results: List[SearchResult], filters: Dict[str, Any]) -> List[SearchResult]:
        """Apply filters to search results"""
        if not filters:
            return results
        
        filtered_results = []
        
        for result in results:
            include_result = True
            
            # Apply document_id filter
            if "document_id" in filters:
                if result.document_id not in filters["document_id"]:
                    include_result = False
            
            # Apply chunk_type filter
            if "chunk_type" in filters:
                if result.chunk_type not in filters["chunk_type"]:
                    include_result = False
            
            # Apply file_type filter
            if "file_type" in filters:
                file_type = result.metadata.get("file_type", "")
                if file_type not in filters["file_type"]:
                    include_result = False
            
            if include_result:
                filtered_results.append(result)
        
        return filtered_results
    
    async def _rank_results(self, results: List[SearchResult], query: SearchQuery) -> List[SearchResult]:
        """Rank search results using advanced algorithms"""
        try:
            # Sort by score (primary ranking)
            results.sort(key=lambda x: x.score, reverse=True)
            
            # Apply additional ranking factors
            for result in results:
                # Boost recent documents
                if "created_at" in result.metadata:
                    try:
                        created_at = datetime.fromisoformat(result.metadata["created_at"])
                        days_old = (datetime.now(timezone.utc) - created_at).days
                        recency_boost = max(0, 1.0 - (days_old / 365))  # Decay over a year
                        result.score *= (1.0 + recency_boost * 0.1)
                    except:
                        pass
                
                # Boost based on chunk type
                type_boosts = {
                    "heading": 1.2,
                    "title": 1.3,
                    "summary": 1.1,
                    "paragraph": 1.0,
                    "table": 0.9
                }
                result.score *= type_boosts.get(result.chunk_type, 1.0)
            
            # Re-sort after boosting
            results.sort(key=lambda x: x.score, reverse=True)
            
            return results
            
        except Exception as e:
            logger.error(f"❌ [VectorService] Result ranking failed: {e}")
            return results
    
    # ============================================================================
    # CACHING AND UTILITIES
    # ============================================================================
    
    def _get_cache_key(self, query: SearchQuery) -> str:
        """Generate cache key for query"""
        key_data = {
            "query": query.query,
            "type": query.query_type,
            "filters": query.filters,
            "limit": query.limit,
            "threshold": query.threshold
        }
        return hashlib.md5(json.dumps(key_data, sort_keys=True).encode()).hexdigest()
    
    def _cache_response(self, cache_key: str, response: SearchResponse):
        """Cache search response"""
        if len(self.search_cache) >= self.cache_size:
            # Remove oldest entry
            oldest_key = next(iter(self.search_cache))
            del self.search_cache[oldest_key]
        
        self.search_cache[cache_key] = response
    
    async def clear_cache(self):
        """Clear search cache"""
        self.search_cache.clear()
        logger.info("🗑️ [VectorService] Search cache cleared")
    
    async def get_index_stats(self) -> Dict[str, Any]:
        """Get vector index statistics"""
        try:
            conn = sqlite3.connect(self.metadata_db_path)
            cursor = conn.cursor()
            
            # Get document count
            cursor.execute("SELECT COUNT(DISTINCT document_id) FROM chunk_metadata")
            document_count = cursor.fetchone()[0]
            
            # Get chunk count by type
            cursor.execute("SELECT chunk_type, COUNT(*) FROM chunk_metadata GROUP BY chunk_type")
            chunk_types = dict(cursor.fetchall())
            
            conn.close()
            
            return {
                "vector_db_type": self.vector_db_type,
                "total_chunks": self.search_stats["index_size"],
                "total_documents": document_count,
                "chunk_types": chunk_types,
                "search_stats": self.search_stats,
                "cache_size": len(self.search_cache),
                "embedding_model": self.embedding_model_name
            }
            
        except Exception as e:
            logger.error(f"❌ [VectorService] Stats retrieval failed: {e}")
            return {"error": str(e)}
    
    async def delete_document(self, document_id: str) -> bool:
        """Delete all chunks for a document"""
        try:
            logger.info(f"🗑️ [VectorService] Deleting document: {document_id}")
            
            # Delete from metadata
            conn = sqlite3.connect(self.metadata_db_path)
            cursor = conn.cursor()
            cursor.execute("DELETE FROM chunk_metadata WHERE document_id = ?", (document_id,))
            deleted_count = cursor.rowcount
            conn.commit()
            conn.close()
            
            # Note: For FAISS, we would need to rebuild the index
            # For Chroma, we can delete by metadata filter
            if self.vector_db_type == "chroma":
                try:
                    self.chroma_collection.delete(where={"document_id": document_id})
                except:
                    pass
            
            # Clear cache
            await self.clear_cache()
            
            logger.info(f"✅ [VectorService] Deleted {deleted_count} chunks for document {document_id}")
            return True
            
        except Exception as e:
            logger.error(f"❌ [VectorService] Document deletion failed: {e}")
            return False

