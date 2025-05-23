# API Gateway Integration Module

## Overview

This module provides integration with API gateways to enforce access controls, rate limits, and security policies for the Phased API Exposure framework.

## Key Components

- Authentication Middleware
- Rate Limiting Implementation
- Monitoring Setup
- Security Controls

## Usage

```python
from promethios.api.gateway import APIGateway, AuthConfig, RateLimitConfig

# Initialize the API gateway integration
gateway = APIGateway(
    auth_config=AuthConfig(
        jwt_secret="YOUR_JWT_SECRET",
        token_expiration=3600,  # 1 hour
        refresh_enabled=True
    ),
    rate_limit_config=RateLimitConfig(
        default_limit=100,  # requests per minute
        tier_based=True,
        headers_enabled=True
    )
)

# Register middleware with your web framework
# Example for Flask:
from flask import Flask, request, g
app = Flask(__name__)

@app.before_request
def authenticate():
    token = request.headers.get('Authorization', '').replace('Bearer ', '')
    auth_result = gateway.authenticate(token)
    if not auth_result.is_authenticated:
        return {"error": "Unauthorized"}, 401
    g.user = auth_result.user
    g.tier = auth_result.tier

@app.before_request
def check_rate_limit():
    if hasattr(g, 'user') and hasattr(g, 'tier'):
        rate_limit_result = gateway.check_rate_limit(
            user_id=g.user.id,
            tier_id=g.tier.id,
            endpoint=request.path,
            method=request.method
        )
        if not rate_limit_result.is_allowed:
            return {
                "error": "Rate limit exceeded",
                "retry_after": rate_limit_result.retry_after
            }, 429

# Example API endpoint
@app.route('/api/v1/governance/policies', methods=['GET'])
def get_policies():
    # Access control check
    if not gateway.check_access(
        user_id=g.user.id,
        tier_id=g.tier.id,
        endpoint=request.path,
        method=request.method
    ):
        return {"error": "Access denied"}, 403
    
    # Your API logic here
    return {"policies": [...]}
```
