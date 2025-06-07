"""
Rate limiting framework for Promethios.

This module provides a centralized rate limiting framework to protect against
denial of service attacks and ensure fair resource usage across the system.
It implements token bucket and sliding window algorithms for flexible rate control.
"""

import time
import threading
import logging
from typing import Dict, List, Optional, Tuple, Callable, Any
from enum import Enum
from datetime import datetime, timedelta
from collections import deque, defaultdict

# Configure logging
logger = logging.getLogger(__name__)

class RateLimitExceededError(Exception):
    """Exception raised when a rate limit is exceeded."""
    
    def __init__(self, limit_key: str, retry_after: float):
        """
        Initialize a rate limit exceeded error.
        
        Args:
            limit_key: The key that was rate limited
            retry_after: Seconds until the rate limit resets
        """
        self.limit_key = limit_key
        self.retry_after = retry_after
        super().__init__(f"Rate limit exceeded for {limit_key}. Retry after {retry_after:.1f} seconds.")

class RateLimitAlgorithm(Enum):
    """Enumeration of rate limiting algorithms."""
    TOKEN_BUCKET = 1
    SLIDING_WINDOW = 2
    FIXED_WINDOW = 3

class RateLimitScope(Enum):
    """Enumeration of rate limit scopes."""
    GLOBAL = 1
    IP = 2
    USER = 3
    API_KEY = 4
    ENDPOINT = 5
    CUSTOM = 6

class TokenBucket:
    """
    Token bucket rate limiting algorithm implementation.
    
    The token bucket algorithm uses the analogy of a bucket that is filled with tokens
    at a constant rate. Each request consumes a token, and if there are no tokens left,
    the request is rejected. This allows for bursts of traffic up to the bucket capacity.
    """
    
    def __init__(self, capacity: float, refill_rate: float):
        """
        Initialize a token bucket.
        
        Args:
            capacity: Maximum number of tokens the bucket can hold
            refill_rate: Rate at which tokens are added to the bucket (tokens per second)
        """
        self.capacity = capacity
        self.refill_rate = refill_rate
        self.tokens = capacity
        self.last_refill = time.time()
        self.lock = threading.RLock()
    
    def _refill(self):
        """Refill the bucket based on elapsed time."""
        now = time.time()
        elapsed = now - self.last_refill
        
        # Calculate new tokens to add
        new_tokens = elapsed * self.refill_rate
        
        # Update token count and timestamp
        self.tokens = min(self.capacity, self.tokens + new_tokens)
        self.last_refill = now
    
    def consume(self, tokens: float = 1.0) -> bool:
        """
        Attempt to consume tokens from the bucket.
        
        Args:
            tokens: Number of tokens to consume
            
        Returns:
            True if tokens were consumed, False if not enough tokens
        """
        with self.lock:
            self._refill()
            
            if self.tokens >= tokens:
                self.tokens -= tokens
                return True
            else:
                return False
    
    def get_retry_after(self) -> float:
        """
        Calculate time until enough tokens are available.
        
        Returns:
            Seconds until a token will be available
        """
        with self.lock:
            self._refill()
            
            # If we have tokens, no wait time
            if self.tokens >= 1.0:
                return 0.0
            
            # Calculate time until next token
            tokens_needed = 1.0 - self.tokens
            return tokens_needed / self.refill_rate

class SlidingWindow:
    """
    Sliding window rate limiting algorithm implementation.
    
    The sliding window algorithm tracks requests over a rolling time window,
    providing more accurate rate limiting than fixed windows while being
    more memory efficient than tracking every individual request timestamp.
    """
    
    def __init__(self, max_requests: int, window_seconds: float):
        """
        Initialize a sliding window.
        
        Args:
            max_requests: Maximum number of requests allowed in the window
            window_seconds: Size of the window in seconds
        """
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        self.window_size_ms = int(window_seconds * 1000)
        self.current_window_count = 0
        self.previous_window_count = 0
        self.current_window_start_ms = self._current_time_ms()
        self.lock = threading.RLock()
    
    def _current_time_ms(self) -> int:
        """Get current time in milliseconds."""
        return int(time.time() * 1000)
    
    def _roll_window(self, now_ms: int):
        """
        Roll the window forward based on elapsed time.
        
        Args:
            now_ms: Current time in milliseconds
        """
        elapsed_ms = now_ms - self.current_window_start_ms
        
        # If we've moved beyond the window, slide it forward
        if elapsed_ms >= self.window_size_ms:
            # Complete window roll
            self.previous_window_count = self.current_window_count
            self.current_window_count = 0
            self.current_window_start_ms = now_ms
        elif elapsed_ms > 0:
            # Partial window roll - not used in this implementation
            # but kept for future enhancements
            pass
    
    def allow_request(self) -> bool:
        """
        Check if a request is allowed under the rate limit.
        
        Returns:
            True if request is allowed, False otherwise
        """
        with self.lock:
            now_ms = self._current_time_ms()
            self._roll_window(now_ms)
            
            # Calculate the weighted count based on the position in the window
            elapsed_ms = now_ms - self.current_window_start_ms
            weight = 1.0 - (elapsed_ms / self.window_size_ms)
            weighted_previous_count = self.previous_window_count * weight
            
            # Total count is current window plus weighted previous window
            count = self.current_window_count + weighted_previous_count
            
            if count < self.max_requests:
                self.current_window_count += 1
                return True
            else:
                return False
    
    def get_retry_after(self) -> float:
        """
        Calculate time until a request would be allowed.
        
        Returns:
            Seconds until a request would be allowed
        """
        with self.lock:
            now_ms = self._current_time_ms()
            elapsed_ms = now_ms - self.current_window_start_ms
            
            # If we're already under the limit, no wait time
            if self.current_window_count < self.max_requests:
                return 0.0
            
            # Otherwise, wait until the window rolls forward enough
            # to allow another request
            return (self.window_size_ms - elapsed_ms) / 1000.0

class RateLimiter:
    """
    Central rate limiting service that manages multiple rate limits.
    
    This class provides a unified interface for applying rate limits across
    different scopes and with different algorithms.
    """
    
    def __init__(self):
        """Initialize the rate limiter."""
        self.limits: Dict[str, Dict[str, Any]] = {}
        self.lock = threading.RLock()
    
    def add_limit(self, 
                 limit_key: str, 
                 algorithm: RateLimitAlgorithm, 
                 scope: RateLimitScope,
                 **kwargs) -> None:
        """
        Add a new rate limit.
        
        Args:
            limit_key: Unique identifier for this limit
            algorithm: Rate limiting algorithm to use
            scope: Scope of the rate limit
            **kwargs: Algorithm-specific parameters
        """
        with self.lock:
            if algorithm == RateLimitAlgorithm.TOKEN_BUCKET:
                capacity = kwargs.get('capacity', 10)
                refill_rate = kwargs.get('refill_rate', 1.0)
                limiter = TokenBucket(capacity, refill_rate)
            elif algorithm == RateLimitAlgorithm.SLIDING_WINDOW:
                max_requests = kwargs.get('max_requests', 10)
                window_seconds = kwargs.get('window_seconds', 60.0)
                limiter = SlidingWindow(max_requests, window_seconds)
            else:
                raise ValueError(f"Unsupported algorithm: {algorithm}")
            
            self.limits[limit_key] = {
                'algorithm': algorithm,
                'scope': scope,
                'limiter': limiter,
                'instances': defaultdict(lambda: self._create_limiter_instance(algorithm, **kwargs))
            }
    
    def _create_limiter_instance(self, algorithm: RateLimitAlgorithm, **kwargs) -> Any:
        """
        Create a new instance of a rate limiter algorithm.
        
        Args:
            algorithm: Rate limiting algorithm to use
            **kwargs: Algorithm-specific parameters
            
        Returns:
            New rate limiter instance
        """
        if algorithm == RateLimitAlgorithm.TOKEN_BUCKET:
            capacity = kwargs.get('capacity', 10)
            refill_rate = kwargs.get('refill_rate', 1.0)
            return TokenBucket(capacity, refill_rate)
        elif algorithm == RateLimitAlgorithm.SLIDING_WINDOW:
            max_requests = kwargs.get('max_requests', 10)
            window_seconds = kwargs.get('window_seconds', 60.0)
            return SlidingWindow(max_requests, window_seconds)
        else:
            raise ValueError(f"Unsupported algorithm: {algorithm}")
    
    def check_limit(self, 
                   limit_key: str, 
                   instance_key: str = None, 
                   tokens: float = 1.0,
                   raise_on_limit: bool = True) -> bool:
        """
        Check if a request is allowed under the rate limit.
        
        Args:
            limit_key: Identifier for the limit to check
            instance_key: Instance-specific key (e.g., IP address, user ID)
            tokens: Number of tokens to consume (for token bucket)
            raise_on_limit: Whether to raise an exception if limit is exceeded
            
        Returns:
            True if request is allowed, False otherwise
            
        Raises:
            RateLimitExceededError: If limit is exceeded and raise_on_limit is True
            KeyError: If the limit_key doesn't exist
        """
        with self.lock:
            if limit_key not in self.limits:
                raise KeyError(f"Rate limit not found: {limit_key}")
            
            limit = self.limits[limit_key]
            algorithm = limit['algorithm']
            scope = limit['scope']
            
            # Determine which limiter instance to use
            if scope == RateLimitScope.GLOBAL:
                limiter = limit['limiter']
            else:
                if instance_key is None:
                    raise ValueError(f"Instance key required for scope: {scope}")
                limiter = limit['instances'][instance_key]
            
            # Check the limit based on algorithm
            allowed = False
            if algorithm == RateLimitAlgorithm.TOKEN_BUCKET:
                allowed = limiter.consume(tokens)
            elif algorithm == RateLimitAlgorithm.SLIDING_WINDOW:
                allowed = limiter.allow_request()
            
            # Handle limit exceeded
            if not allowed and raise_on_limit:
                retry_after = limiter.get_retry_after()
                raise RateLimitExceededError(limit_key, retry_after)
            
            return allowed
    
    def get_retry_after(self, limit_key: str, instance_key: str = None) -> float:
        """
        Get the time until a request would be allowed.
        
        Args:
            limit_key: Identifier for the limit to check
            instance_key: Instance-specific key (e.g., IP address, user ID)
            
        Returns:
            Seconds until a request would be allowed
            
        Raises:
            KeyError: If the limit_key doesn't exist
        """
        with self.lock:
            if limit_key not in self.limits:
                raise KeyError(f"Rate limit not found: {limit_key}")
            
            limit = self.limits[limit_key]
            scope = limit['scope']
            
            # Determine which limiter instance to use
            if scope == RateLimitScope.GLOBAL:
                limiter = limit['limiter']
            else:
                if instance_key is None:
                    raise ValueError(f"Instance key required for scope: {scope}")
                limiter = limit['instances'][instance_key]
            
            return limiter.get_retry_after()

# Create a global rate limiter instance
global_rate_limiter = RateLimiter()

def rate_limit(limit_key: str, 
              instance_key_func: Callable = None, 
              tokens: float = 1.0) -> Callable:
    """
    Decorator for rate limiting function calls.
    
    Args:
        limit_key: Identifier for the limit to check
        instance_key_func: Function to extract instance key from args/kwargs
        tokens: Number of tokens to consume (for token bucket)
        
    Returns:
        Decorated function
        
    Example:
        @rate_limit('api.get_user', lambda *args, **kwargs: kwargs.get('user_id'))
        def get_user(user_id):
            # Function implementation
    """
    def decorator(func):
        def wrapper(*args, **kwargs):
            # Get instance key if needed
            instance_key = None
            if instance_key_func is not None:
                instance_key = instance_key_func(*args, **kwargs)
            
            # Check rate limit
            try:
                global_rate_limiter.check_limit(limit_key, instance_key, tokens)
            except RateLimitExceededError as e:
                # Log the rate limit event
                logger.warning(f"Rate limit exceeded: {e}")
                raise
            
            # Call the original function
            return func(*args, **kwargs)
        
        return wrapper
    
    return decorator

def configure_default_limits():
    """Configure default rate limits for the system."""
    # Global API rate limit (100 requests per minute)
    global_rate_limiter.add_limit(
        'api.global',
        RateLimitAlgorithm.SLIDING_WINDOW,
        RateLimitScope.GLOBAL,
        max_requests=100,
        window_seconds=60.0
    )
    
    # Per-IP rate limit (30 requests per minute)
    global_rate_limiter.add_limit(
        'api.per_ip',
        RateLimitAlgorithm.SLIDING_WINDOW,
        RateLimitScope.IP,
        max_requests=30,
        window_seconds=60.0
    )
    
    # Authentication endpoint limit (5 attempts per minute per IP)
    global_rate_limiter.add_limit(
        'api.auth',
        RateLimitAlgorithm.SLIDING_WINDOW,
        RateLimitScope.IP,
        max_requests=5,
        window_seconds=60.0
    )
    
    # Extension registration limit (10 per hour)
    global_rate_limiter.add_limit(
        'api.extension_registration',
        RateLimitAlgorithm.TOKEN_BUCKET,
        RateLimitScope.GLOBAL,
        capacity=10,
        refill_rate=10/3600.0  # 10 per hour
    )
    
    # Interoperability connector limit (50 requests per minute)
    global_rate_limiter.add_limit(
        'api.interop_connector',
        RateLimitAlgorithm.TOKEN_BUCKET,
        RateLimitScope.GLOBAL,
        capacity=50,
        refill_rate=50/60.0  # 50 per minute
    )
    
    logger.info("Default rate limits configured")

# Configure default limits when module is imported
configure_default_limits()
