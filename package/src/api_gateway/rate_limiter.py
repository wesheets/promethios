"""
API Gateway Integration - Rate Limiting

This module provides rate limiting functionality for API gateway integration.
"""

import logging
import time
from typing import Dict, List, Optional, Any, Union
from datetime import datetime, timedelta
from collections import defaultdict

from src.access_tier.exceptions import RateLimitExceededError

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class RateLimiter:
    """
    Rate limiter for API requests.
    
    This class provides functionality for:
    - Tracking request rates
    - Enforcing rate limits
    - Generating rate limit headers
    """
    
    def __init__(self):
        """Initialize the rate limiter."""
        # Store request counts by user, window, and endpoint
        self.request_counts = defaultdict(lambda: defaultdict(lambda: defaultdict(int)))
        
        # Store window timestamps
        self.window_timestamps = {}
        
        logger.info("Initialized rate limiter")
    
    def check_limit(self, user_id: str, tier_limits: Dict[str, int], endpoint: Optional[str] = None) -> bool:
        """
        Check if a user has exceeded their rate limit.
        
        Args:
            user_id: The ID of the user
            tier_limits: Rate limits for the user's tier
            endpoint: The API endpoint (optional)
            
        Returns:
            bool: True if the user is within their rate limit, False otherwise
            
        Raises:
            RateLimitExceededError: If the rate limit is exceeded
        """
        now = datetime.now()
        
        # Check per-minute limit
        if 'requests_per_minute' in tier_limits:
            minute_window = now.strftime('%Y-%m-%d-%H-%M')
            minute_key = f"{user_id}:minute:{minute_window}"
            
            # Initialize window if needed
            if minute_key not in self.window_timestamps:
                self.window_timestamps[minute_key] = now
            
            # Get current count
            current_count = self.request_counts[user_id]['minute'][minute_window]
            
            # Check if limit is exceeded
            if current_count >= tier_limits['requests_per_minute']:
                # Calculate reset time
                reset_time = self.window_timestamps[minute_key] + timedelta(minutes=1)
                seconds_until_reset = max(0, (reset_time - now).total_seconds())
                
                raise RateLimitExceededError(
                    user_id, 
                    f"{tier_limits['requests_per_minute']} requests per minute (resets in {int(seconds_until_reset)} seconds)"
                )
        
        # Check per-day limit
        if 'requests_per_day' in tier_limits:
            day_window = now.strftime('%Y-%m-%d')
            day_key = f"{user_id}:day:{day_window}"
            
            # Initialize window if needed
            if day_key not in self.window_timestamps:
                self.window_timestamps[day_key] = now
            
            # Get current count
            current_count = self.request_counts[user_id]['day'][day_window]
            
            # Check if limit is exceeded
            if current_count >= tier_limits['requests_per_day']:
                # Calculate reset time
                reset_time = datetime(now.year, now.month, now.day) + timedelta(days=1)
                seconds_until_reset = max(0, (reset_time - now).total_seconds())
                
                raise RateLimitExceededError(
                    user_id, 
                    f"{tier_limits['requests_per_day']} requests per day (resets in {int(seconds_until_reset)} seconds)"
                )
        
        # Check concurrent requests limit
        if 'concurrent_requests' in tier_limits:
            # This would require tracking active requests, which is more complex
            # and would typically be implemented at the application level
            pass
        
        return True
    
    def track_request(self, user_id: str, endpoint: Optional[str] = None) -> None:
        """
        Track an API request for rate limiting.
        
        Args:
            user_id: The ID of the user
            endpoint: The API endpoint (optional)
        """
        now = datetime.now()
        
        # Track per-minute request
        minute_window = now.strftime('%Y-%m-%d-%H-%M')
        self.request_counts[user_id]['minute'][minute_window] += 1
        
        # Track per-day request
        day_window = now.strftime('%Y-%m-%d')
        self.request_counts[user_id]['day'][day_window] += 1
        
        # Initialize window timestamps if needed
        minute_key = f"{user_id}:minute:{minute_window}"
        if minute_key not in self.window_timestamps:
            self.window_timestamps[minute_key] = now
        
        day_key = f"{user_id}:day:{day_window}"
        if day_key not in self.window_timestamps:
            self.window_timestamps[day_key] = now
        
        # Clean up old windows periodically
        if now.second == 0 and now.microsecond < 100000:  # Approximately once per minute
            self._cleanup_old_windows()
    
    def get_rate_limit_headers(self, user_id: str, tier_limits: Dict[str, int]) -> Dict[str, str]:
        """
        Get rate limit headers for a user.
        
        Args:
            user_id: The ID of the user
            tier_limits: Rate limits for the user's tier
            
        Returns:
            Dict: Rate limit headers
        """
        now = datetime.now()
        headers = {}
        
        # Add per-minute limit headers
        if 'requests_per_minute' in tier_limits:
            minute_window = now.strftime('%Y-%m-%d-%H-%M')
            current_count = self.request_counts[user_id]['minute'][minute_window]
            remaining = max(0, tier_limits['requests_per_minute'] - current_count)
            
            # Calculate reset time
            minute_key = f"{user_id}:minute:{minute_window}"
            if minute_key in self.window_timestamps:
                reset_time = self.window_timestamps[minute_key] + timedelta(minutes=1)
            else:
                reset_time = now + timedelta(minutes=1)
            
            reset_timestamp = int(reset_time.timestamp())
            
            headers["X-RateLimit-Limit"] = str(tier_limits['requests_per_minute'])
            headers["X-RateLimit-Remaining"] = str(remaining)
            headers["X-RateLimit-Reset"] = str(reset_timestamp)
        
        # Add per-day limit headers
        if 'requests_per_day' in tier_limits:
            day_window = now.strftime('%Y-%m-%d')
            current_count = self.request_counts[user_id]['day'][day_window]
            remaining = max(0, tier_limits['requests_per_day'] - current_count)
            
            # Calculate reset time
            day_key = f"{user_id}:day:{day_window}"
            if day_key in self.window_timestamps:
                # Reset at midnight
                reset_time = datetime(now.year, now.month, now.day) + timedelta(days=1)
            else:
                reset_time = datetime(now.year, now.month, now.day) + timedelta(days=1)
            
            reset_timestamp = int(reset_time.timestamp())
            
            headers["X-RateLimit-Daily-Limit"] = str(tier_limits['requests_per_day'])
            headers["X-RateLimit-Daily-Remaining"] = str(remaining)
            headers["X-RateLimit-Daily-Reset"] = str(reset_timestamp)
        
        return headers
    
    def _cleanup_old_windows(self) -> None:
        """Clean up old rate limit windows to prevent memory leaks."""
        now = datetime.now()
        keys_to_remove = []
        
        # Find old windows
        for key, timestamp in self.window_timestamps.items():
            parts = key.split(':')
            if len(parts) != 3:
                continue
            
            user_id, window_type, window = parts
            
            if window_type == 'minute' and (now - timestamp).total_seconds() > 300:  # 5 minutes
                keys_to_remove.append(key)
                # Also remove from request counts
                try:
                    del self.request_counts[user_id]['minute'][window]
                except KeyError:
                    pass
            
            elif window_type == 'day' and (now - timestamp).total_seconds() > 172800:  # 2 days
                keys_to_remove.append(key)
                # Also remove from request counts
                try:
                    del self.request_counts[user_id]['day'][window]
                except KeyError:
                    pass
        
        # Remove old windows
        for key in keys_to_remove:
            try:
                del self.window_timestamps[key]
            except KeyError:
                pass
        
        # Clean up empty user entries
        users_to_remove = []
        for user_id, windows in self.request_counts.items():
            if not windows['minute'] and not windows['day']:
                users_to_remove.append(user_id)
        
        for user_id in users_to_remove:
            del self.request_counts[user_id]
        
        if keys_to_remove:
            logger.debug(f"Cleaned up {len(keys_to_remove)} old rate limit windows")
