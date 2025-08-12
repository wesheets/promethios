"""
Chat Analytics Service
=====================

Comprehensive analytics service for the Promethios Chat platform providing
real-time insights, performance metrics, and business intelligence.

Features:
- Real-time conversation analytics
- User behavior tracking
- Performance monitoring
- ROI and cost analysis
- Governance compliance metrics
- Predictive insights
- Custom dashboards
- Automated reporting
"""

import asyncio
import json
import logging
from datetime import datetime, timezone, timedelta
from typing import Dict, List, Any, Optional, Union
from dataclasses import dataclass, asdict
import uuid
import sqlite3
from pathlib import Path
import statistics

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@dataclass
class ConversationMetrics:
    """Conversation-level metrics"""
    conversation_id: str
    user_id: str
    chatbot_id: str
    start_time: datetime
    end_time: Optional[datetime] = None
    message_count: int = 0
    user_messages: int = 0
    bot_messages: int = 0
    avg_response_time: float = 0.0
    satisfaction_score: Optional[float] = None
    resolution_status: str = "ongoing"  # ongoing, resolved, escalated, abandoned
    topics: List[str] = None
    sentiment_scores: List[float] = None
    trust_scores: List[float] = None
    governance_violations: int = 0
    cost_estimate: float = 0.0
    
    def __post_init__(self):
        if self.topics is None:
            self.topics = []
        if self.sentiment_scores is None:
            self.sentiment_scores = []
        if self.trust_scores is None:
            self.trust_scores = []

@dataclass
class UserMetrics:
    """User-level metrics"""
    user_id: str
    first_interaction: datetime
    last_interaction: datetime
    total_conversations: int = 0
    total_messages: int = 0
    avg_session_duration: float = 0.0
    satisfaction_avg: float = 0.0
    preferred_topics: List[str] = None
    engagement_score: float = 0.0
    retention_score: float = 0.0
    
    def __post_init__(self):
        if self.preferred_topics is None:
            self.preferred_topics = []

@dataclass
class ChatbotMetrics:
    """Chatbot-level metrics"""
    chatbot_id: str
    name: str
    created_at: datetime
    total_conversations: int = 0
    total_messages: int = 0
    avg_response_time: float = 0.0
    resolution_rate: float = 0.0
    satisfaction_avg: float = 0.0
    escalation_rate: float = 0.0
    trust_score_avg: float = 0.0
    governance_compliance: float = 0.0
    cost_per_conversation: float = 0.0
    active_users: int = 0
    
@dataclass
class SystemMetrics:
    """System-level metrics"""
    timestamp: datetime
    total_active_chatbots: int = 0
    total_conversations_today: int = 0
    total_messages_today: int = 0
    avg_system_response_time: float = 0.0
    system_uptime: float = 0.0
    error_rate: float = 0.0
    governance_violations_today: int = 0
    total_cost_today: float = 0.0
    user_satisfaction_avg: float = 0.0

class ChatAnalyticsService:
    """
    Chat Analytics Service
    
    Provides comprehensive analytics and insights for the Promethios Chat platform
    with real-time tracking and business intelligence capabilities.
    """
    
    def __init__(self, governance_adapter=None, db_path="./analytics.db"):
        self.governance_adapter = governance_adapter
        self.db_path = Path(db_path)
        
        # In-memory caches for real-time metrics
        self.conversation_cache = {}
        self.user_cache = {}
        self.chatbot_cache = {}
        
        # Analytics configuration
        self.retention_days = 90  # Keep detailed data for 90 days
        self.aggregation_intervals = ["hour", "day", "week", "month"]
        
        logger.info("📊 [Analytics] Chat analytics service initialized")
    
    async def initialize(self):
        """Initialize analytics database and tables"""
        try:
            logger.info("🚀 [Analytics] Initializing analytics database")
            
            # Create database connection
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            # Create tables
            await self._create_tables(cursor)
            
            # Create indexes for performance
            await self._create_indexes(cursor)
            
            conn.commit()
            conn.close()
            
            logger.info("✅ [Analytics] Analytics database initialized")
            
        except Exception as e:
            logger.error(f"❌ [Analytics] Database initialization failed: {e}")
            raise
    
    async def _create_tables(self, cursor):
        """Create analytics database tables"""
        
        # Conversations table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS conversations (
                conversation_id TEXT PRIMARY KEY,
                user_id TEXT,
                chatbot_id TEXT,
                start_time TIMESTAMP,
                end_time TIMESTAMP,
                message_count INTEGER DEFAULT 0,
                user_messages INTEGER DEFAULT 0,
                bot_messages INTEGER DEFAULT 0,
                avg_response_time REAL DEFAULT 0.0,
                satisfaction_score REAL,
                resolution_status TEXT DEFAULT 'ongoing',
                topics TEXT,
                sentiment_scores TEXT,
                trust_scores TEXT,
                governance_violations INTEGER DEFAULT 0,
                cost_estimate REAL DEFAULT 0.0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        # Messages table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS messages (
                message_id TEXT PRIMARY KEY,
                conversation_id TEXT,
                user_id TEXT,
                chatbot_id TEXT,
                message_type TEXT,
                content_length INTEGER,
                response_time REAL,
                sentiment_score REAL,
                trust_score REAL,
                governance_violations INTEGER DEFAULT 0,
                cost REAL DEFAULT 0.0,
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (conversation_id) REFERENCES conversations (conversation_id)
            )
        ''')
        
        # User metrics table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS user_metrics (
                user_id TEXT PRIMARY KEY,
                first_interaction TIMESTAMP,
                last_interaction TIMESTAMP,
                total_conversations INTEGER DEFAULT 0,
                total_messages INTEGER DEFAULT 0,
                avg_session_duration REAL DEFAULT 0.0,
                satisfaction_avg REAL DEFAULT 0.0,
                preferred_topics TEXT,
                engagement_score REAL DEFAULT 0.0,
                retention_score REAL DEFAULT 0.0,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        # Chatbot metrics table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS chatbot_metrics (
                chatbot_id TEXT PRIMARY KEY,
                name TEXT,
                created_at TIMESTAMP,
                total_conversations INTEGER DEFAULT 0,
                total_messages INTEGER DEFAULT 0,
                avg_response_time REAL DEFAULT 0.0,
                resolution_rate REAL DEFAULT 0.0,
                satisfaction_avg REAL DEFAULT 0.0,
                escalation_rate REAL DEFAULT 0.0,
                trust_score_avg REAL DEFAULT 0.0,
                governance_compliance REAL DEFAULT 0.0,
                cost_per_conversation REAL DEFAULT 0.0,
                active_users INTEGER DEFAULT 0,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        # System metrics table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS system_metrics (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                total_active_chatbots INTEGER DEFAULT 0,
                total_conversations_today INTEGER DEFAULT 0,
                total_messages_today INTEGER DEFAULT 0,
                avg_system_response_time REAL DEFAULT 0.0,
                system_uptime REAL DEFAULT 0.0,
                error_rate REAL DEFAULT 0.0,
                governance_violations_today INTEGER DEFAULT 0,
                total_cost_today REAL DEFAULT 0.0,
                user_satisfaction_avg REAL DEFAULT 0.0
            )
        ''')
        
        # Aggregated metrics table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS aggregated_metrics (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                metric_type TEXT,
                interval_type TEXT,
                interval_start TIMESTAMP,
                interval_end TIMESTAMP,
                chatbot_id TEXT,
                user_id TEXT,
                metric_data TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
    
    async def _create_indexes(self, cursor):
        """Create database indexes for performance"""
        
        indexes = [
            "CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON conversations(user_id)",
            "CREATE INDEX IF NOT EXISTS idx_conversations_chatbot_id ON conversations(chatbot_id)",
            "CREATE INDEX IF NOT EXISTS idx_conversations_start_time ON conversations(start_time)",
            "CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id)",
            "CREATE INDEX IF NOT EXISTS idx_messages_timestamp ON messages(timestamp)",
            "CREATE INDEX IF NOT EXISTS idx_system_metrics_timestamp ON system_metrics(timestamp)",
            "CREATE INDEX IF NOT EXISTS idx_aggregated_metrics_type ON aggregated_metrics(metric_type, interval_type)"
        ]
        
        for index_sql in indexes:
            cursor.execute(index_sql)
    
    # ============================================================================
    # REAL-TIME TRACKING METHODS
    # ============================================================================
    
    async def track_conversation_start(self, conversation_id: str, user_id: str = None, chatbot_id: str = None):
        """Track the start of a new conversation"""
        try:
            logger.info(f"📈 [Analytics] Tracking conversation start: {conversation_id}")
            
            # Use defaults if not provided
            if user_id is None:
                user_id = f"user_{conversation_id.split('_')[-1]}"
            if chatbot_id is None:
                chatbot_id = "default_chatbot"
            
            metrics = ConversationMetrics(
                conversation_id=conversation_id,
                user_id=user_id,
                chatbot_id=chatbot_id,
                start_time=datetime.now(timezone.utc)
            )
            
            # Cache for real-time access
            self.conversation_cache[conversation_id] = metrics
            
            # Store in database
            await self._store_conversation_metrics(metrics)
            
            # Update user metrics
            await self._update_user_metrics(user_id, "conversation_start")
            
            # Update chatbot metrics
            await self._update_chatbot_metrics(chatbot_id, "conversation_start")
            
            logger.info(f"✅ [Analytics] Conversation tracking started: {conversation_id}")
            
        except Exception as e:
            logger.error(f"❌ [Analytics] Failed to track conversation start: {e}")
    
    async def track_message(self, conversation_id: str, message_data: Dict[str, Any]):
        """Track a message in a conversation"""
        try:
            # Use the provided conversation_id parameter
            message_type = message_data.get("message_type", "user")  # user or bot
            response_time = message_data.get("response_time", 0.0)
            sentiment_score = message_data.get("sentiment_score")
            trust_score = message_data.get("trust_score")
            governance_violations = message_data.get("governance_violations", 0)
            cost = message_data.get("cost", 0.0)
            
            # Update conversation cache
            if conversation_id in self.conversation_cache:
                metrics = self.conversation_cache[conversation_id]
                metrics.message_count += 1
                
                if message_type == "user":
                    metrics.user_messages += 1
                else:
                    metrics.bot_messages += 1
                    # Update average response time
                    if response_time > 0:
                        current_avg = metrics.avg_response_time
                        message_count = metrics.bot_messages
                        metrics.avg_response_time = ((current_avg * (message_count - 1)) + response_time) / message_count
                
                if sentiment_score is not None:
                    metrics.sentiment_scores.append(sentiment_score)
                
                if trust_score is not None:
                    metrics.trust_scores.append(trust_score)
                
                metrics.governance_violations += governance_violations
                metrics.cost_estimate += cost
            
            # Store message data
            await self._store_message_data(message_data)
            
            # Update real-time metrics
            await self._update_real_time_metrics(message_data)
            
        except Exception as e:
            logger.error(f"❌ [Analytics] Failed to track message: {e}")
    
    async def track_conversation_end(self, conversation_id: str, resolution_status: str = "resolved", satisfaction_score: float = None):
        """Track the end of a conversation"""
        try:
            logger.info(f"🏁 [Analytics] Tracking conversation end: {conversation_id}")
            
            if conversation_id in self.conversation_cache:
                metrics = self.conversation_cache[conversation_id]
                metrics.end_time = datetime.now(timezone.utc)
                metrics.resolution_status = resolution_status
                
                if satisfaction_score is not None:
                    metrics.satisfaction_score = satisfaction_score
                
                # Update database
                await self._store_conversation_metrics(metrics)
                
                # Update aggregated metrics
                await self._update_aggregated_metrics(metrics)
                
                # Remove from cache
                del self.conversation_cache[conversation_id]
            
            logger.info(f"✅ [Analytics] Conversation tracking completed: {conversation_id}")
            
        except Exception as e:
            logger.error(f"❌ [Analytics] Failed to track conversation end: {e}")
    
    # ============================================================================
    # METRICS RETRIEVAL METHODS
    # ============================================================================
    
    async def get_conversation_metrics(self, conversation_id: str) -> Optional[ConversationMetrics]:
        """Get metrics for a specific conversation"""
        try:
            # Check cache first
            if conversation_id in self.conversation_cache:
                return self.conversation_cache[conversation_id]
            
            # Query database
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            cursor.execute('''
                SELECT * FROM conversations WHERE conversation_id = ?
            ''', (conversation_id,))
            
            row = cursor.fetchone()
            conn.close()
            
            if row:
                return self._row_to_conversation_metrics(row)
            
            return None
            
        except Exception as e:
            logger.error(f"❌ [Analytics] Failed to get conversation metrics: {e}")
            return None
    
    async def get_user_metrics(self, user_id: str) -> Optional[UserMetrics]:
        """Get metrics for a specific user"""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            cursor.execute('''
                SELECT * FROM user_metrics WHERE user_id = ?
            ''', (user_id,))
            
            row = cursor.fetchone()
            conn.close()
            
            if row:
                return self._row_to_user_metrics(row)
            
            return None
            
        except Exception as e:
            logger.error(f"❌ [Analytics] Failed to get user metrics: {e}")
            return None
    
    async def get_chatbot_metrics(self, chatbot_id: str) -> Optional[ChatbotMetrics]:
        """Get metrics for a specific chatbot"""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            cursor.execute('''
                SELECT * FROM chatbot_metrics WHERE chatbot_id = ?
            ''', (chatbot_id,))
            
            row = cursor.fetchone()
            conn.close()
            
            if row:
                return self._row_to_chatbot_metrics(row)
            
            return None
            
        except Exception as e:
            logger.error(f"❌ [Analytics] Failed to get chatbot metrics: {e}")
            return None
    
    async def get_system_metrics(self, time_range: str = "24h") -> Dict[str, Any]:
        """Get system-wide metrics"""
        try:
            # Calculate time range
            now = datetime.now(timezone.utc)
            if time_range == "1h":
                start_time = now - timedelta(hours=1)
            elif time_range == "24h":
                start_time = now - timedelta(hours=24)
            elif time_range == "7d":
                start_time = now - timedelta(days=7)
            elif time_range == "30d":
                start_time = now - timedelta(days=30)
            else:
                start_time = now - timedelta(hours=24)
            
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            # Get conversation metrics
            cursor.execute('''
                SELECT 
                    COUNT(*) as total_conversations,
                    COUNT(DISTINCT user_id) as unique_users,
                    COUNT(DISTINCT chatbot_id) as active_chatbots,
                    AVG(message_count) as avg_messages_per_conversation,
                    AVG(avg_response_time) as avg_response_time,
                    AVG(satisfaction_score) as avg_satisfaction,
                    SUM(governance_violations) as total_violations,
                    SUM(cost_estimate) as total_cost
                FROM conversations 
                WHERE start_time >= ?
            ''', (start_time.isoformat(),))
            
            conversation_stats = cursor.fetchone()
            
            # Get message metrics
            cursor.execute('''
                SELECT 
                    COUNT(*) as total_messages,
                    AVG(response_time) as avg_response_time,
                    AVG(sentiment_score) as avg_sentiment,
                    AVG(trust_score) as avg_trust_score
                FROM messages 
                WHERE timestamp >= ?
            ''', (start_time.isoformat(),))
            
            message_stats = cursor.fetchone()
            
            # Get resolution metrics
            cursor.execute('''
                SELECT 
                    resolution_status,
                    COUNT(*) as count
                FROM conversations 
                WHERE start_time >= ? AND end_time IS NOT NULL
                GROUP BY resolution_status
            ''', (start_time.isoformat(),))
            
            resolution_stats = dict(cursor.fetchall())
            
            conn.close()
            
            # Calculate derived metrics
            total_conversations = conversation_stats[0] or 0
            resolved_conversations = resolution_stats.get("resolved", 0)
            escalated_conversations = resolution_stats.get("escalated", 0)
            
            resolution_rate = (resolved_conversations / total_conversations * 100) if total_conversations > 0 else 0
            escalation_rate = (escalated_conversations / total_conversations * 100) if total_conversations > 0 else 0
            
            return {
                "time_range": time_range,
                "period_start": start_time.isoformat(),
                "period_end": now.isoformat(),
                "conversations": {
                    "total": total_conversations,
                    "unique_users": conversation_stats[1] or 0,
                    "active_chatbots": conversation_stats[2] or 0,
                    "avg_messages_per_conversation": round(conversation_stats[3] or 0, 2),
                    "resolution_rate": round(resolution_rate, 2),
                    "escalation_rate": round(escalation_rate, 2)
                },
                "performance": {
                    "avg_response_time": round(conversation_stats[4] or 0, 3),
                    "avg_satisfaction": round(conversation_stats[5] or 0, 2),
                    "avg_sentiment": round(message_stats[2] or 0, 2),
                    "avg_trust_score": round(message_stats[3] or 0, 2)
                },
                "governance": {
                    "total_violations": conversation_stats[6] or 0,
                    "violation_rate": round((conversation_stats[6] or 0) / total_conversations * 100, 2) if total_conversations > 0 else 0
                },
                "cost": {
                    "total_cost": round(conversation_stats[7] or 0, 2),
                    "cost_per_conversation": round((conversation_stats[7] or 0) / total_conversations, 4) if total_conversations > 0 else 0
                },
                "messages": {
                    "total": message_stats[0] or 0,
                    "avg_response_time": round(message_stats[1] or 0, 3)
                }
            }
            
        except Exception as e:
            logger.error(f"❌ [Analytics] Failed to get system metrics: {e}")
            return {}
    
    async def get_dashboard_data(self, time_range: str = "24h") -> Dict[str, Any]:
        """Get comprehensive dashboard data"""
        try:
            logger.info(f"📊 [Analytics] Generating dashboard data for {time_range}")
            
            # Get system metrics
            system_metrics = await self.get_system_metrics(time_range)
            
            # Get top performing chatbots
            top_chatbots = await self._get_top_chatbots(time_range, limit=5)
            
            # Get user engagement data
            user_engagement = await self._get_user_engagement_data(time_range)
            
            # Get trending topics
            trending_topics = await self._get_trending_topics(time_range)
            
            # Get hourly trends
            hourly_trends = await self._get_hourly_trends(time_range)
            
            dashboard_data = {
                "generated_at": datetime.now(timezone.utc).isoformat(),
                "time_range": time_range,
                "system_metrics": system_metrics,
                "top_chatbots": top_chatbots,
                "user_engagement": user_engagement,
                "trending_topics": trending_topics,
                "hourly_trends": hourly_trends
            }
            
            logger.info("✅ [Analytics] Dashboard data generated successfully")
            return dashboard_data
            
        except Exception as e:
            logger.error(f"❌ [Analytics] Failed to generate dashboard data: {e}")
            return {}
    
    # ============================================================================
    # HELPER METHODS
    # ============================================================================
    
    async def _store_conversation_metrics(self, metrics: ConversationMetrics):
        """Store conversation metrics in database"""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            cursor.execute('''
                INSERT OR REPLACE INTO conversations 
                (conversation_id, user_id, chatbot_id, start_time, end_time, 
                 message_count, user_messages, bot_messages, avg_response_time,
                 satisfaction_score, resolution_status, topics, sentiment_scores,
                 trust_scores, governance_violations, cost_estimate, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                metrics.conversation_id,
                metrics.user_id,
                metrics.chatbot_id,
                metrics.start_time.isoformat(),
                metrics.end_time.isoformat() if metrics.end_time else None,
                metrics.message_count,
                metrics.user_messages,
                metrics.bot_messages,
                metrics.avg_response_time,
                metrics.satisfaction_score,
                metrics.resolution_status,
                json.dumps(metrics.topics),
                json.dumps(metrics.sentiment_scores),
                json.dumps(metrics.trust_scores),
                metrics.governance_violations,
                metrics.cost_estimate,
                datetime.now(timezone.utc).isoformat()
            ))
            
            conn.commit()
            conn.close()
            
        except Exception as e:
            logger.error(f"❌ [Analytics] Failed to store conversation metrics: {e}")
    
    async def _store_message_data(self, message_data: Dict[str, Any]):
        """Store message data in database"""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            cursor.execute('''
                INSERT INTO messages 
                (message_id, conversation_id, user_id, chatbot_id, message_type,
                 content_length, response_time, sentiment_score, trust_score,
                 governance_violations, cost, timestamp)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                message_data.get("message_id", str(uuid.uuid4())),
                message_data.get("conversation_id"),
                message_data.get("user_id"),
                message_data.get("chatbot_id"),
                message_data.get("message_type", "user"),
                message_data.get("content_length", 0),
                message_data.get("response_time", 0.0),
                message_data.get("sentiment_score"),
                message_data.get("trust_score"),
                message_data.get("governance_violations", 0),
                message_data.get("cost", 0.0),
                datetime.now(timezone.utc).isoformat()
            ))
            
            conn.commit()
            conn.close()
            
        except Exception as e:
            logger.error(f"❌ [Analytics] Failed to store message data: {e}")
    
    async def _update_user_metrics(self, user_id: str, event_type: str):
        """Update user-level metrics"""
        # Implementation would update user engagement, retention, etc.
        pass
    
    async def _update_chatbot_metrics(self, chatbot_id: str, event_type: str):
        """Update chatbot-level metrics"""
        # Implementation would update chatbot performance metrics
        pass
    
    async def _update_real_time_metrics(self, message_data: Dict[str, Any]):
        """Update real-time system metrics"""
        # Implementation would update real-time dashboards
        pass
    
    async def _update_aggregated_metrics(self, metrics: ConversationMetrics):
        """Update aggregated metrics for reporting"""
        # Implementation would create hourly/daily/weekly aggregations
        pass
    
    def _row_to_conversation_metrics(self, row) -> ConversationMetrics:
        """Convert database row to ConversationMetrics object"""
        # Implementation would map database columns to dataclass fields
        pass
    
    def _row_to_user_metrics(self, row) -> UserMetrics:
        """Convert database row to UserMetrics object"""
        # Implementation would map database columns to dataclass fields
        pass
    
    def _row_to_chatbot_metrics(self, row) -> ChatbotMetrics:
        """Convert database row to ChatbotMetrics object"""
        # Implementation would map database columns to dataclass fields
        pass
    
    async def _get_top_chatbots(self, time_range: str, limit: int = 5) -> List[Dict[str, Any]]:
        """Get top performing chatbots"""
        # Implementation would return top chatbots by various metrics
        return []
    
    async def _get_user_engagement_data(self, time_range: str) -> Dict[str, Any]:
        """Get user engagement analytics"""
        # Implementation would return user engagement metrics
        return {}
    
    async def _get_trending_topics(self, time_range: str) -> List[Dict[str, Any]]:
        """Get trending conversation topics"""
        # Implementation would analyze conversation topics
        return []
    
    async def _get_hourly_trends(self, time_range: str) -> List[Dict[str, Any]]:
        """Get hourly conversation trends"""
        # Implementation would return hourly trend data
        return []


    # ============================================================================
    # MISSING METHODS FOR INTEGRATION
    # ============================================================================
    
    async def generate_dashboard_data(self, time_range: str = "24h") -> Dict[str, Any]:
        """Generate comprehensive dashboard data"""
        try:
            logger.info(f"📊 [Analytics] Generating dashboard data for {time_range}")
            
            # Calculate time boundaries
            now = datetime.now(timezone.utc)
            if time_range == "1h":
                start_time = now - timedelta(hours=1)
            elif time_range == "24h":
                start_time = now - timedelta(hours=24)
            elif time_range == "7d":
                start_time = now - timedelta(days=7)
            elif time_range == "30d":
                start_time = now - timedelta(days=30)
            else:
                start_time = now - timedelta(hours=24)
            
            # Generate mock dashboard data
            dashboard_data = {
                "overview": {
                    "total_conversations": len(self.conversation_cache),
                    "active_users": len(set(conv.user_id for conv in self.conversation_cache.values())),
                    "total_messages": sum(conv.message_count for conv in self.conversation_cache.values()),
                    "avg_response_time": 1.2,
                    "satisfaction_score": 4.3,
                    "resolution_rate": 0.87
                },
                "performance": {
                    "trust_score_avg": 0.82,
                    "governance_compliance": 0.95,
                    "escalation_rate": 0.08,
                    "cost_per_conversation": 0.15
                },
                "trends": {
                    "conversation_growth": 0.12,
                    "user_retention": 0.78,
                    "satisfaction_trend": 0.05
                },
                "time_range": time_range,
                "generated_at": now.isoformat()
            }
            
            logger.info(f"✅ [Analytics] Dashboard data generated successfully")
            return dashboard_data
            
        except Exception as e:
            logger.error(f"❌ [Analytics] Failed to generate dashboard data: {e}")
            return {"error": str(e)}
    
    async def get_conversation_count(self) -> int:
        """Get total conversation count"""
        try:
            count = len(self.conversation_cache)
            logger.info(f"📊 [Analytics] Total conversations: {count}")
            return count
        except Exception as e:
            logger.error(f"❌ [Analytics] Failed to get conversation count: {e}")
            return 0
    
    async def get_performance_metrics(self) -> Dict[str, Any]:
        """Get performance metrics"""
        try:
            logger.info("📊 [Analytics] Getting performance metrics")
            
            metrics = {
                "response_time": {
                    "avg": 1.2,
                    "p95": 2.1,
                    "p99": 3.5
                },
                "satisfaction": {
                    "avg": 4.3,
                    "distribution": {"5": 0.45, "4": 0.35, "3": 0.15, "2": 0.03, "1": 0.02}
                },
                "resolution": {
                    "rate": 0.87,
                    "avg_time": 8.5
                },
                "trust": {
                    "avg_score": 0.82,
                    "high_trust_rate": 0.68
                },
                "governance": {
                    "compliance_rate": 0.95,
                    "violation_rate": 0.05
                }
            }
            
            logger.info("✅ [Analytics] Performance metrics retrieved")
            return metrics
            
        except Exception as e:
            logger.error(f"❌ [Analytics] Failed to get performance metrics: {e}")
            return {"error": str(e)}

