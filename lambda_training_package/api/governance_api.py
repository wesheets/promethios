"""
Main Governance API Server
Unified API for all governance AI models and capabilities
"""

from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import uvicorn
import logging
from typing import Dict, Any, Optional
from pathlib import Path
import os

from .model_router import GovernanceModelRouter
from .endpoints.ultimate_governance import ultimate_governance_router
from .endpoints.constitutional import constitutional_governance_router
from .endpoints.operational import operational_governance_router

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class GovernanceAPIServer:
    """
    Main Governance API Server
    Provides unified access to all governance AI models and capabilities
    """
    
    def __init__(self, config: Optional[Dict[str, Any]] = None):
        """
        Initialize the Governance API Server
        
        Args:
            config: Configuration dictionary for the server
        """
        self.config = config or self._load_default_config()
        self.app = FastAPI(
            title="Promethios Governance AI API",
            description="Unified API for AI-powered governance analysis and decision support",
            version="1.0.0",
            docs_url="/docs",
            redoc_url="/redoc"
        )
        
        # Initialize model router
        self.model_router = GovernanceModelRouter(self.config.get("models", {}))
        
        self._setup_middleware()
        self._setup_routes()
        self._setup_error_handlers()
    
    def _load_default_config(self) -> Dict[str, Any]:
        """Load default configuration"""
        return {
            "models": {
                "ultimate_governance": {
                    "path": "./ultimate_governance_llm",
                    "enabled": True,
                    "priority": 1
                },
                "constitutional_governance": {
                    "path": "./constitutional_governance_llm", 
                    "enabled": False,  # Will be enabled when model is available
                    "priority": 2
                },
                "operational_governance": {
                    "path": "./operational_governance_llm",
                    "enabled": False,  # Will be enabled when model is available
                    "priority": 3
                }
            },
            "server": {
                "host": "0.0.0.0",
                "port": 8080,
                "workers": 1
            },
            "cors": {
                "allow_origins": ["*"],
                "allow_methods": ["*"],
                "allow_headers": ["*"]
            }
        }
    
    def _setup_middleware(self):
        """Setup middleware"""
        cors_config = self.config.get("cors", {})
        self.app.add_middleware(
            CORSMiddleware,
            allow_origins=cors_config.get("allow_origins", ["*"]),
            allow_credentials=True,
            allow_methods=cors_config.get("allow_methods", ["*"]),
            allow_headers=cors_config.get("allow_headers", ["*"])
        )
    
    def _setup_routes(self):
        """Setup API routes"""
        
        @self.app.get("/")
        async def root():
            """Root endpoint"""
            return {
                "message": "Promethios Governance AI API",
                "version": "1.0.0",
                "status": "operational",
                "available_models": await self.model_router.get_available_models(),
                "docs": "/docs"
            }
        
        @self.app.get("/health")
        async def health_check():
            """Health check endpoint"""
            model_status = await self.model_router.get_model_status()
            return {
                "status": "healthy",
                "models": model_status,
                "timestamp": self._get_timestamp()
            }
        
        @self.app.get("/models")
        async def list_models():
            """List available governance models"""
            return await self.model_router.get_available_models()
        
        @self.app.get("/models/{model_name}/info")
        async def get_model_info(model_name: str):
            """Get information about a specific model"""
            try:
                return await self.model_router.get_model_info(model_name)
            except Exception as e:
                raise HTTPException(status_code=404, detail=str(e))
        
        @self.app.post("/governance/analyze")
        async def analyze_governance(
            scenario: str,
            domain: Optional[str] = None,
            model: Optional[str] = None,
            **kwargs
        ):
            """Unified governance analysis endpoint"""
            try:
                # Route to appropriate model
                selected_model = model or await self.model_router.select_best_model(domain)
                
                result = await self.model_router.analyze(
                    model_name=selected_model,
                    scenario=scenario,
                    domain=domain,
                    **kwargs
                )
                
                return result
                
            except Exception as e:
                logger.error(f"Error in governance analysis: {e}")
                raise HTTPException(status_code=500, detail=str(e))
        
        @self.app.post("/governance/evaluate")
        async def evaluate_governance(
            decision: str,
            criteria: Optional[list] = None,
            domain: Optional[str] = None,
            model: Optional[str] = None
        ):
            """Unified governance evaluation endpoint"""
            try:
                selected_model = model or await self.model_router.select_best_model(domain)
                
                result = await self.model_router.evaluate(
                    model_name=selected_model,
                    decision=decision,
                    criteria=criteria,
                    domain=domain
                )
                
                return result
                
            except Exception as e:
                logger.error(f"Error in governance evaluation: {e}")
                raise HTTPException(status_code=500, detail=str(e))
        
        @self.app.post("/governance/recommend")
        async def recommend_governance(
            scenario: str,
            domain: Optional[str] = None,
            model: Optional[str] = None
        ):
            """Unified governance recommendations endpoint"""
            try:
                selected_model = model or await self.model_router.select_best_model(domain)
                
                result = await self.model_router.recommend(
                    model_name=selected_model,
                    scenario=scenario,
                    domain=domain
                )
                
                return result
                
            except Exception as e:
                logger.error(f"Error in governance recommendations: {e}")
                raise HTTPException(status_code=500, detail=str(e))
        
        # Include specialized model routers
        self.app.include_router(
            ultimate_governance_router,
            prefix="/api/v1/ultimate",
            tags=["Ultimate Governance"]
        )
        
        self.app.include_router(
            constitutional_governance_router,
            prefix="/api/v1/constitutional",
            tags=["Constitutional Governance"]
        )
        
        self.app.include_router(
            operational_governance_router,
            prefix="/api/v1/operational", 
            tags=["Operational Governance"]
        )
    
    def _setup_error_handlers(self):
        """Setup error handlers"""
        
        @self.app.exception_handler(404)
        async def not_found_handler(request, exc):
            return JSONResponse(
                status_code=404,
                content={
                    "error": "Not Found",
                    "message": "The requested resource was not found",
                    "path": str(request.url.path)
                }
            )
        
        @self.app.exception_handler(500)
        async def internal_error_handler(request, exc):
            logger.error(f"Internal server error: {exc}")
            return JSONResponse(
                status_code=500,
                content={
                    "error": "Internal Server Error",
                    "message": "An internal error occurred while processing the request"
                }
            )
    
    def _get_timestamp(self) -> str:
        """Get current timestamp"""
        from datetime import datetime
        return datetime.utcnow().isoformat() + "Z"
    
    async def startup(self):
        """Startup tasks"""
        logger.info("Starting Governance API Server...")
        await self.model_router.initialize()
        logger.info("Governance API Server started successfully")
    
    async def shutdown(self):
        """Shutdown tasks"""
        logger.info("Shutting down Governance API Server...")
        await self.model_router.cleanup()
        logger.info("Governance API Server shut down successfully")
    
    def run(self, **kwargs):
        """Run the server"""
        server_config = self.config.get("server", {})
        
        # Override with any provided kwargs
        host = kwargs.get("host", server_config.get("host", "0.0.0.0"))
        port = kwargs.get("port", server_config.get("port", 8080))
        workers = kwargs.get("workers", server_config.get("workers", 1))
        
        # Setup startup and shutdown events
        @self.app.on_event("startup")
        async def startup_event():
            await self.startup()
        
        @self.app.on_event("shutdown") 
        async def shutdown_event():
            await self.shutdown()
        
        logger.info(f"Starting Governance API Server on {host}:{port}")
        uvicorn.run(
            self.app,
            host=host,
            port=port,
            workers=workers,
            log_level="info"
        )

# Factory function
def create_governance_api_server(config: Optional[Dict[str, Any]] = None) -> GovernanceAPIServer:
    """
    Factory function to create Governance API Server
    
    Args:
        config: Optional configuration dictionary
        
    Returns:
        Configured GovernanceAPIServer instance
    """
    return GovernanceAPIServer(config)

# CLI entry point
def main():
    """Main entry point for CLI"""
    import argparse
    
    parser = argparse.ArgumentParser(description="Promethios Governance AI API Server")
    parser.add_argument("--host", default="0.0.0.0", help="Host to bind to")
    parser.add_argument("--port", type=int, default=8080, help="Port to bind to")
    parser.add_argument("--workers", type=int, default=1, help="Number of workers")
    parser.add_argument("--config", help="Path to configuration file")
    
    args = parser.parse_args()
    
    # Load config if provided
    config = None
    if args.config and os.path.exists(args.config):
        import json
        with open(args.config, 'r') as f:
            config = json.load(f)
    
    # Create and run server
    server = create_governance_api_server(config)
    server.run(host=args.host, port=args.port, workers=args.workers)

if __name__ == "__main__":
    main()

