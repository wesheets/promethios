#!/usr/bin/env python3
"""
Governance Memory and Trust Integration System
Implements persistent memory and trust management for governance-native LLM
"""

import json
import uuid
import hashlib
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional, Tuple
from dataclasses import dataclass, asdict
from enum import Enum
import sqlite3
import threading
from contextlib import contextmanager

class TrustLevel(Enum):
    """Trust level enumeration"""
    CRITICAL = "critical"
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"
    UNTRUSTED = "untrusted"

class GovernanceType(Enum):
    """Governance type enumeration"""
    CONSTITUTIONAL = "constitutional"
    OPERATIONAL = "operational"
    TRUST_MANAGEMENT = "trust_management"
    MEMORY_INTEGRATION = "memory_integration"
    SAAS_DEVELOPMENT = "saas_development"
    COLLABORATION = "collaboration"
    PROFESSIONAL_COMMUNICATION = "professional_communication"

@dataclass
class TrustScore:
    """Trust score data structure"""
    agent_id: str
    score: float  # 0.0 to 1.0
    last_updated: datetime
    interaction_count: int
    success_rate: float
    governance_compliance: float
    peer_ratings: List[float]
    decay_factor: float = 0.95  # Trust decays over time without interaction

@dataclass
class MemoryContext:
    """Memory context data structure"""
    context_id: str
    user_id: str
    session_id: str
    governance_type: GovernanceType
    context_data: Dict[str, Any]
    trust_context: Dict[str, float]
    created_at: datetime
    last_accessed: datetime
    access_count: int
    importance_score: float

@dataclass
class GovernanceDecision:
    """Governance decision record"""
    decision_id: str
    governance_type: GovernanceType
    input_context: str
    decision: str
    rationale: str
    trust_level: TrustLevel
    participants: List[str]
    timestamp: datetime
    audit_trail: List[str]
    precedent_references: List[str]

class TrustCalculator:
    """Advanced trust calculation engine"""
    
    def __init__(self):
        self.base_trust = 0.5  # Starting trust for new agents
        self.trust_decay_rate = 0.01  # Daily decay rate
        self.governance_weight = 0.4  # Weight of governance compliance
        self.peer_weight = 0.3  # Weight of peer ratings
        self.performance_weight = 0.3  # Weight of performance metrics
    
    def calculate_trust(self, trust_score: TrustScore) -> float:
        """Calculate current trust score with decay and updates"""
        # Apply time decay
        days_since_update = (datetime.now() - trust_score.last_updated).days
        decay_factor = trust_score.decay_factor ** days_since_update
        
        # Base performance score
        performance_score = (
            trust_score.success_rate * self.performance_weight +
            trust_score.governance_compliance * self.governance_weight +
            (sum(trust_score.peer_ratings) / len(trust_score.peer_ratings) if trust_score.peer_ratings else 0.5) * self.peer_weight
        )
        
        # Apply decay
        current_trust = performance_score * decay_factor
        
        # Ensure bounds
        return max(0.0, min(1.0, current_trust))
    
    def update_trust(self, trust_score: TrustScore, interaction_success: bool, 
                    governance_compliant: bool, peer_rating: Optional[float] = None) -> TrustScore:
        """Update trust score based on new interaction"""
        # Update interaction metrics
        trust_score.interaction_count += 1
        
        # Update success rate (weighted average)
        weight = min(0.1, 1.0 / trust_score.interaction_count)
        trust_score.success_rate = (
            trust_score.success_rate * (1 - weight) + 
            (1.0 if interaction_success else 0.0) * weight
        )
        
        # Update governance compliance
        trust_score.governance_compliance = (
            trust_score.governance_compliance * (1 - weight) +
            (1.0 if governance_compliant else 0.0) * weight
        )
        
        # Add peer rating if provided
        if peer_rating is not None:
            trust_score.peer_ratings.append(peer_rating)
            # Keep only recent ratings (last 100)
            trust_score.peer_ratings = trust_score.peer_ratings[-100:]
        
        # Update timestamp
        trust_score.last_updated = datetime.now()
        
        # Recalculate score
        trust_score.score = self.calculate_trust(trust_score)
        
        return trust_score

class GovernanceMemoryManager:
    """Persistent memory management for governance contexts"""
    
    def __init__(self, db_path: str = "governance_memory.db"):
        self.db_path = db_path
        self.lock = threading.Lock()
        self.init_database()
    
    def init_database(self):
        """Initialize SQLite database for memory storage"""
        with self.get_connection() as conn:
            # Memory contexts table
            conn.execute("""
                CREATE TABLE IF NOT EXISTS memory_contexts (
                    context_id TEXT PRIMARY KEY,
                    user_id TEXT NOT NULL,
                    session_id TEXT NOT NULL,
                    governance_type TEXT NOT NULL,
                    context_data TEXT NOT NULL,
                    trust_context TEXT NOT NULL,
                    created_at TEXT NOT NULL,
                    last_accessed TEXT NOT NULL,
                    access_count INTEGER DEFAULT 0,
                    importance_score REAL DEFAULT 0.5
                )
            """)
            
            # Trust scores table
            conn.execute("""
                CREATE TABLE IF NOT EXISTS trust_scores (
                    agent_id TEXT PRIMARY KEY,
                    score REAL NOT NULL,
                    last_updated TEXT NOT NULL,
                    interaction_count INTEGER DEFAULT 0,
                    success_rate REAL DEFAULT 0.5,
                    governance_compliance REAL DEFAULT 0.5,
                    peer_ratings TEXT DEFAULT '[]',
                    decay_factor REAL DEFAULT 0.95
                )
            """)
            
            # Governance decisions table
            conn.execute("""
                CREATE TABLE IF NOT EXISTS governance_decisions (
                    decision_id TEXT PRIMARY KEY,
                    governance_type TEXT NOT NULL,
                    input_context TEXT NOT NULL,
                    decision TEXT NOT NULL,
                    rationale TEXT NOT NULL,
                    trust_level TEXT NOT NULL,
                    participants TEXT NOT NULL,
                    timestamp TEXT NOT NULL,
                    audit_trail TEXT NOT NULL,
                    precedent_references TEXT DEFAULT '[]'
                )
            """)
            
            conn.commit()
    
    @contextmanager
    def get_connection(self):
        """Get database connection with proper locking"""
        with self.lock:
            conn = sqlite3.connect(self.db_path)
            try:
                yield conn
            finally:
                conn.close()
    
    def store_memory_context(self, context: MemoryContext):
        """Store memory context in persistent storage"""
        with self.get_connection() as conn:
            conn.execute("""
                INSERT OR REPLACE INTO memory_contexts 
                (context_id, user_id, session_id, governance_type, context_data, 
                 trust_context, created_at, last_accessed, access_count, importance_score)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                context.context_id,
                context.user_id,
                context.session_id,
                context.governance_type.value,
                json.dumps(context.context_data),
                json.dumps(context.trust_context),
                context.created_at.isoformat(),
                context.last_accessed.isoformat(),
                context.access_count,
                context.importance_score
            ))
            conn.commit()
    
    def retrieve_memory_context(self, context_id: str) -> Optional[MemoryContext]:
        """Retrieve memory context by ID"""
        with self.get_connection() as conn:
            cursor = conn.execute("""
                SELECT * FROM memory_contexts WHERE context_id = ?
            """, (context_id,))
            
            row = cursor.fetchone()
            if not row:
                return None
            
            # Update access count and timestamp
            conn.execute("""
                UPDATE memory_contexts 
                SET access_count = access_count + 1, last_accessed = ?
                WHERE context_id = ?
            """, (datetime.now().isoformat(), context_id))
            conn.commit()
            
            return MemoryContext(
                context_id=row[0],
                user_id=row[1],
                session_id=row[2],
                governance_type=GovernanceType(row[3]),
                context_data=json.loads(row[4]),
                trust_context=json.loads(row[5]),
                created_at=datetime.fromisoformat(row[6]),
                last_accessed=datetime.fromisoformat(row[7]),
                access_count=row[8] + 1,
                importance_score=row[9]
            )
    
    def search_memory_contexts(self, user_id: str, governance_type: Optional[GovernanceType] = None,
                             limit: int = 10) -> List[MemoryContext]:
        """Search memory contexts for user"""
        with self.get_connection() as conn:
            if governance_type:
                cursor = conn.execute("""
                    SELECT * FROM memory_contexts 
                    WHERE user_id = ? AND governance_type = ?
                    ORDER BY importance_score DESC, last_accessed DESC
                    LIMIT ?
                """, (user_id, governance_type.value, limit))
            else:
                cursor = conn.execute("""
                    SELECT * FROM memory_contexts 
                    WHERE user_id = ?
                    ORDER BY importance_score DESC, last_accessed DESC
                    LIMIT ?
                """, (user_id, limit))
            
            contexts = []
            for row in cursor.fetchall():
                contexts.append(MemoryContext(
                    context_id=row[0],
                    user_id=row[1],
                    session_id=row[2],
                    governance_type=GovernanceType(row[3]),
                    context_data=json.loads(row[4]),
                    trust_context=json.loads(row[5]),
                    created_at=datetime.fromisoformat(row[6]),
                    last_accessed=datetime.fromisoformat(row[7]),
                    access_count=row[8],
                    importance_score=row[9]
                ))
            
            return contexts

class GovernanceTrustManager:
    """Trust management system for governance agents"""
    
    def __init__(self, memory_manager: GovernanceMemoryManager):
        self.memory_manager = memory_manager
        self.trust_calculator = TrustCalculator()
    
    def get_trust_score(self, agent_id: str) -> TrustScore:
        """Get current trust score for agent"""
        with self.memory_manager.get_connection() as conn:
            cursor = conn.execute("""
                SELECT * FROM trust_scores WHERE agent_id = ?
            """, (agent_id,))
            
            row = cursor.fetchone()
            if not row:
                # Create new trust score
                trust_score = TrustScore(
                    agent_id=agent_id,
                    score=self.trust_calculator.base_trust,
                    last_updated=datetime.now(),
                    interaction_count=0,
                    success_rate=0.5,
                    governance_compliance=0.5,
                    peer_ratings=[]
                )
                self.store_trust_score(trust_score)
                return trust_score
            
            return TrustScore(
                agent_id=row[0],
                score=row[1],
                last_updated=datetime.fromisoformat(row[2]),
                interaction_count=row[3],
                success_rate=row[4],
                governance_compliance=row[5],
                peer_ratings=json.loads(row[6]),
                decay_factor=row[7]
            )
    
    def store_trust_score(self, trust_score: TrustScore):
        """Store trust score in database"""
        with self.memory_manager.get_connection() as conn:
            conn.execute("""
                INSERT OR REPLACE INTO trust_scores
                (agent_id, score, last_updated, interaction_count, success_rate,
                 governance_compliance, peer_ratings, decay_factor)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                trust_score.agent_id,
                trust_score.score,
                trust_score.last_updated.isoformat(),
                trust_score.interaction_count,
                trust_score.success_rate,
                trust_score.governance_compliance,
                json.dumps(trust_score.peer_ratings),
                trust_score.decay_factor
            ))
            conn.commit()
    
    def update_agent_trust(self, agent_id: str, interaction_success: bool,
                          governance_compliant: bool, peer_rating: Optional[float] = None) -> float:
        """Update agent trust based on interaction"""
        trust_score = self.get_trust_score(agent_id)
        updated_trust = self.trust_calculator.update_trust(
            trust_score, interaction_success, governance_compliant, peer_rating
        )
        self.store_trust_score(updated_trust)
        return updated_trust.score

class GovernanceIntegrationSystem:
    """Integrated governance system combining memory and trust"""
    
    def __init__(self, db_path: str = "governance_system.db"):
        self.memory_manager = GovernanceMemoryManager(db_path)
        self.trust_manager = GovernanceTrustManager(self.memory_manager)
    
    def create_governance_context(self, user_id: str, session_id: str,
                                governance_type: GovernanceType, context_data: Dict[str, Any],
                                participants: List[str]) -> str:
        """Create new governance context with trust integration"""
        context_id = str(uuid.uuid4())
        
        # Calculate trust context for participants
        trust_context = {}
        for participant in participants:
            trust_score = self.trust_manager.get_trust_score(participant)
            trust_context[participant] = trust_score.score
        
        # Create memory context
        memory_context = MemoryContext(
            context_id=context_id,
            user_id=user_id,
            session_id=session_id,
            governance_type=governance_type,
            context_data=context_data,
            trust_context=trust_context,
            created_at=datetime.now(),
            last_accessed=datetime.now(),
            access_count=0,
            importance_score=self.calculate_importance_score(context_data, trust_context)
        )
        
        self.memory_manager.store_memory_context(memory_context)
        return context_id
    
    def calculate_importance_score(self, context_data: Dict[str, Any], 
                                 trust_context: Dict[str, float]) -> float:
        """Calculate importance score for memory context"""
        base_score = 0.5
        
        # Increase importance for high-trust participants
        if trust_context:
            avg_trust = sum(trust_context.values()) / len(trust_context)
            base_score += (avg_trust - 0.5) * 0.3
        
        # Increase importance for certain governance types
        governance_weights = {
            GovernanceType.CONSTITUTIONAL: 0.9,
            GovernanceType.TRUST_MANAGEMENT: 0.8,
            GovernanceType.OPERATIONAL: 0.7,
            GovernanceType.COLLABORATION: 0.6,
            GovernanceType.SAAS_DEVELOPMENT: 0.6,
            GovernanceType.MEMORY_INTEGRATION: 0.5,
            GovernanceType.PROFESSIONAL_COMMUNICATION: 0.4
        }
        
        # Context complexity increases importance
        complexity_score = min(len(str(context_data)) / 1000, 0.2)
        
        final_score = base_score + complexity_score
        return max(0.0, min(1.0, final_score))
    
    def record_governance_decision(self, governance_type: GovernanceType, input_context: str,
                                 decision: str, rationale: str, trust_level: TrustLevel,
                                 participants: List[str], precedent_references: List[str] = None) -> str:
        """Record governance decision with full audit trail"""
        decision_id = str(uuid.uuid4())
        
        # Create audit trail
        audit_trail = [
            f"Decision initiated: {datetime.now().isoformat()}",
            f"Participants: {', '.join(participants)}",
            f"Trust level: {trust_level.value}",
            f"Governance type: {governance_type.value}"
        ]
        
        # Add trust scores to audit trail
        for participant in participants:
            trust_score = self.trust_manager.get_trust_score(participant)
            audit_trail.append(f"Participant {participant} trust: {trust_score.score:.3f}")
        
        decision_record = GovernanceDecision(
            decision_id=decision_id,
            governance_type=governance_type,
            input_context=input_context,
            decision=decision,
            rationale=rationale,
            trust_level=trust_level,
            participants=participants,
            timestamp=datetime.now(),
            audit_trail=audit_trail,
            precedent_references=precedent_references or []
        )
        
        # Store in database
        with self.memory_manager.get_connection() as conn:
            conn.execute("""
                INSERT INTO governance_decisions
                (decision_id, governance_type, input_context, decision, rationale,
                 trust_level, participants, timestamp, audit_trail, precedent_references)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                decision_record.decision_id,
                decision_record.governance_type.value,
                decision_record.input_context,
                decision_record.decision,
                decision_record.rationale,
                decision_record.trust_level.value,
                json.dumps(decision_record.participants),
                decision_record.timestamp.isoformat(),
                json.dumps(decision_record.audit_trail),
                json.dumps(decision_record.precedent_references)
            ))
            conn.commit()
        
        return decision_id
    
    def get_governance_context_for_llm(self, user_id: str, current_input: str,
                                     governance_type: GovernanceType) -> Dict[str, Any]:
        """Get comprehensive governance context for LLM processing"""
        # Retrieve relevant memory contexts
        memory_contexts = self.memory_manager.search_memory_contexts(
            user_id, governance_type, limit=5
        )
        
        # Get user's trust level
        user_trust = self.trust_manager.get_trust_score(user_id)
        
        # Search for relevant precedents
        precedents = self.search_governance_precedents(current_input, governance_type)
        
        # Compile context
        context = {
            "user_id": user_id,
            "user_trust_score": user_trust.score,
            "user_trust_level": self.get_trust_level_from_score(user_trust.score).value,
            "governance_type": governance_type.value,
            "memory_contexts": [
                {
                    "context_id": ctx.context_id,
                    "context_data": ctx.context_data,
                    "trust_context": ctx.trust_context,
                    "importance_score": ctx.importance_score,
                    "created_at": ctx.created_at.isoformat()
                }
                for ctx in memory_contexts
            ],
            "governance_precedents": precedents,
            "current_timestamp": datetime.now().isoformat()
        }
        
        return context
    
    def get_trust_level_from_score(self, score: float) -> TrustLevel:
        """Convert trust score to trust level"""
        if score >= 0.9:
            return TrustLevel.CRITICAL
        elif score >= 0.7:
            return TrustLevel.HIGH
        elif score >= 0.5:
            return TrustLevel.MEDIUM
        elif score >= 0.3:
            return TrustLevel.LOW
        else:
            return TrustLevel.UNTRUSTED
    
    def search_governance_precedents(self, input_context: str, governance_type: GovernanceType,
                                   limit: int = 3) -> List[Dict[str, Any]]:
        """Search for relevant governance precedents"""
        # Simple keyword-based search (can be enhanced with embeddings)
        keywords = input_context.lower().split()
        
        with self.memory_manager.get_connection() as conn:
            cursor = conn.execute("""
                SELECT * FROM governance_decisions 
                WHERE governance_type = ?
                ORDER BY timestamp DESC
                LIMIT ?
            """, (governance_type.value, limit * 2))  # Get more to filter
            
            precedents = []
            for row in cursor.fetchall():
                decision_context = row[2].lower()
                decision_text = row[3].lower()
                
                # Simple relevance scoring
                relevance_score = 0
                for keyword in keywords:
                    if keyword in decision_context or keyword in decision_text:
                        relevance_score += 1
                
                if relevance_score > 0:
                    precedents.append({
                        "decision_id": row[0],
                        "input_context": row[2],
                        "decision": row[3],
                        "rationale": row[4],
                        "trust_level": row[5],
                        "timestamp": row[7],
                        "relevance_score": relevance_score
                    })
            
            # Sort by relevance and return top results
            precedents.sort(key=lambda x: x["relevance_score"], reverse=True)
            return precedents[:limit]

# Example usage and testing
if __name__ == "__main__":
    # Initialize governance system
    governance_system = GovernanceIntegrationSystem()
    
    # Example: Create governance context
    context_id = governance_system.create_governance_context(
        user_id="user_123",
        session_id="session_456",
        governance_type=GovernanceType.CONSTITUTIONAL,
        context_data={
            "request": "Access sensitive financial data",
            "justification": "Quarterly audit requirements",
            "risk_level": "high"
        },
        participants=["user_123", "auditor_789"]
    )
    
    print(f"Created governance context: {context_id}")
    
    # Example: Record governance decision
    decision_id = governance_system.record_governance_decision(
        governance_type=GovernanceType.CONSTITUTIONAL,
        input_context="User requests access to sensitive financial data for audit",
        decision="Access granted with time-limited scope and additional monitoring",
        rationale="Legitimate audit requirement with proper justification and high user trust",
        trust_level=TrustLevel.HIGH,
        participants=["user_123", "auditor_789"],
        precedent_references=[]
    )
    
    print(f"Recorded governance decision: {decision_id}")
    
    # Example: Get context for LLM
    llm_context = governance_system.get_governance_context_for_llm(
        user_id="user_123",
        current_input="I need to access customer payment data for analysis",
        governance_type=GovernanceType.CONSTITUTIONAL
    )
    
    print("LLM Context:")
    print(json.dumps(llm_context, indent=2))

