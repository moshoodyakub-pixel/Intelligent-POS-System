"""
Middleware for rate limiting, error handling, and request logging.
"""
import os
import time
from collections import defaultdict
from typing import Callable
from fastapi import Request, Response, HTTPException
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
import logging

from .config import settings

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class RateLimitMiddleware(BaseHTTPMiddleware):
    """
    Rate limiting middleware using a sliding window approach.
    Limits requests per client IP within a configurable time window.
    """
    
    def __init__(self, app, requests_limit: int = None, window_seconds: int = None):
        super().__init__(app)
        self.requests_limit = requests_limit or settings.RATE_LIMIT_REQUESTS
        self.window_seconds = window_seconds or settings.RATE_LIMIT_WINDOW_SECONDS
        self.requests = defaultdict(list)
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        # Skip rate limiting for health check endpoints and during testing
        if (request.url.path in ["/", "/health", "/docs", "/redoc", "/openapi.json"] or
            os.environ.get("TESTING")):
            return await call_next(request)
        
        client_ip = self._get_client_ip(request)
        current_time = time.time()
        
        # Clean old requests outside the window
        self.requests[client_ip] = [
            req_time for req_time in self.requests[client_ip]
            if current_time - req_time < self.window_seconds
        ]
        
        # Check if rate limit exceeded
        if len(self.requests[client_ip]) >= self.requests_limit:
            logger.warning(f"Rate limit exceeded for IP: {client_ip}")
            return JSONResponse(
                status_code=429,
                content={
                    "detail": "Rate limit exceeded. Please try again later.",
                    "retry_after": self.window_seconds
                },
                headers={
                    "Retry-After": str(self.window_seconds),
                    "X-RateLimit-Limit": str(self.requests_limit),
                    "X-RateLimit-Remaining": "0",
                    "X-RateLimit-Reset": str(int(current_time + self.window_seconds))
                }
            )
        
        # Record this request
        self.requests[client_ip].append(current_time)
        
        # Add rate limit headers to response
        response = await call_next(request)
        remaining = self.requests_limit - len(self.requests[client_ip])
        response.headers["X-RateLimit-Limit"] = str(self.requests_limit)
        response.headers["X-RateLimit-Remaining"] = str(remaining)
        response.headers["X-RateLimit-Reset"] = str(int(current_time + self.window_seconds))
        
        return response
    
    def _get_client_ip(self, request: Request) -> str:
        """Get client IP from request, handling proxies."""
        forwarded = request.headers.get("X-Forwarded-For")
        if forwarded:
            return forwarded.split(",")[0].strip()
        return request.client.host if request.client else "unknown"


class ErrorHandlingMiddleware(BaseHTTPMiddleware):
    """
    Global error handling middleware for catching unhandled exceptions.
    """
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        try:
            response = await call_next(request)
            return response
        except HTTPException as exc:
            # Let HTTP exceptions pass through
            return JSONResponse(
                status_code=exc.status_code,
                content={"detail": exc.detail}
            )
        except Exception as exc:
            # Log the error
            logger.error(f"Unhandled error: {str(exc)}", exc_info=True)
            
            # Return a generic error response in production
            if settings.DEBUG:
                return JSONResponse(
                    status_code=500,
                    content={
                        "detail": "Internal server error",
                        "error": str(exc),
                        "type": type(exc).__name__
                    }
                )
            else:
                return JSONResponse(
                    status_code=500,
                    content={"detail": "Internal server error"}
                )


class RequestLoggingMiddleware(BaseHTTPMiddleware):
    """
    Middleware for logging request and response information.
    """
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        start_time = time.time()
        
        # Log request
        logger.info(f"Request: {request.method} {request.url.path}")
        
        response = await call_next(request)
        
        # Log response
        process_time = time.time() - start_time
        logger.info(
            f"Response: {request.method} {request.url.path} "
            f"- Status: {response.status_code} - Time: {process_time:.4f}s"
        )
        
        # Add processing time header
        response.headers["X-Process-Time"] = str(process_time)
        
        return response
