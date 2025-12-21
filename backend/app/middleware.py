"""
Middleware for rate limiting, error handling, and request logging.
"""
import os
import time
import traceback
from collections import defaultdict
from typing import Callable, Optional
from fastapi import Request, Response, HTTPException
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
import logging

from .config import settings

# Configure logging with structured format
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Import sentry_sdk at module level if available
_sentry_sdk: Optional[object] = None
if settings.SENTRY_DSN:
    try:
        import sentry_sdk as _sentry_sdk
    except ImportError:
        logger.warning("sentry-sdk not installed, Sentry integration disabled")


def capture_exception_to_sentry(exc: Exception, request: Request = None):
    """Capture exception to Sentry if configured."""
    if _sentry_sdk is not None:
        try:
            with _sentry_sdk.push_scope() as scope:
                if request:
                    scope.set_tag("url", str(request.url))
                    scope.set_tag("method", request.method)
                    scope.set_extra("headers", dict(request.headers))
                _sentry_sdk.capture_exception(exc)
        except Exception as sentry_error:
            logger.warning(f"Failed to capture exception to Sentry: {sentry_error}")


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
        # Skip rate limiting for health check endpoints, metrics and during testing
        if (request.url.path in ["/", "/health", "/docs", "/redoc", "/openapi.json", "/metrics"] or
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
    Integrates with Sentry for error tracking when configured.
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
            # Log the error with full traceback
            error_id = str(int(time.time() * 1000))  # Simple error ID for tracking
            logger.error(
                f"Unhandled error [ID: {error_id}]: {type(exc).__name__}: {str(exc)}",
                exc_info=True,
                extra={
                    "error_id": error_id,
                    "path": str(request.url.path),
                    "method": request.method,
                }
            )
            
            # Capture to Sentry
            capture_exception_to_sentry(exc, request)
            
            # Return a generic error response in production
            if settings.DEBUG:
                return JSONResponse(
                    status_code=500,
                    content={
                        "detail": "Internal server error",
                        "error": str(exc),
                        "type": type(exc).__name__,
                        "error_id": error_id
                    }
                )
            else:
                return JSONResponse(
                    status_code=500,
                    content={
                        "detail": "Internal server error",
                        "error_id": error_id
                    }
                )


class RequestLoggingMiddleware(BaseHTTPMiddleware):
    """
    Middleware for structured logging of request and response information.
    Logs include timing, status codes, and are formatted for log aggregation.
    """
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        # Skip logging for metrics endpoint to reduce noise
        if request.url.path == "/metrics":
            return await call_next(request)
        
        start_time = time.time()
        client_ip = self._get_client_ip(request)
        
        # Log request
        logger.info(
            f"Request started",
            extra={
                "method": request.method,
                "path": request.url.path,
                "client_ip": client_ip,
            }
        )
        
        response = await call_next(request)
        
        # Calculate processing time
        process_time = time.time() - start_time
        process_time_ms = round(process_time * 1000, 2)
        
        # Log level based on status code
        log_level = logging.INFO
        if response.status_code >= 500:
            log_level = logging.ERROR
        elif response.status_code >= 400:
            log_level = logging.WARNING
        
        # Log response with structured data
        logger.log(
            log_level,
            f"Request completed: {request.method} {request.url.path} "
            f"- Status: {response.status_code} - Time: {process_time_ms}ms",
            extra={
                "method": request.method,
                "path": request.url.path,
                "status_code": response.status_code,
                "duration_ms": process_time_ms,
                "client_ip": client_ip,
            }
        )
        
        # Add processing time header
        response.headers["X-Process-Time"] = str(process_time)
        
        return response
    
    def _get_client_ip(self, request: Request) -> str:
        """Get client IP from request, handling proxies."""
        forwarded = request.headers.get("X-Forwarded-For")
        if forwarded:
            return forwarded.split(",")[0].strip()
        return request.client.host if request.client else "unknown"
