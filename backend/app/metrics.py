"""
Prometheus metrics module for monitoring application performance.

Tracks:
- HTTP request latency (histogram with p50, p90, p95, p99)
- HTTP request count by status code (counter)
- 5xx error rate (counter)
- Active requests (gauge)
"""
from prometheus_client import Counter, Histogram, Gauge, generate_latest, CONTENT_TYPE_LATEST
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response
import time

# HTTP Request metrics
REQUEST_COUNT = Counter(
    'http_requests_total',
    'Total HTTP requests',
    ['method', 'endpoint', 'status_code']
)

REQUEST_LATENCY = Histogram(
    'http_request_duration_seconds',
    'HTTP request latency in seconds',
    ['method', 'endpoint'],
    buckets=[0.005, 0.01, 0.025, 0.05, 0.075, 0.1, 0.25, 0.5, 0.75, 1.0, 2.5, 5.0, 7.5, 10.0]
)

ERROR_COUNT = Counter(
    'http_errors_total',
    'Total HTTP errors (4xx and 5xx)',
    ['method', 'endpoint', 'status_code']
)

SERVER_ERROR_COUNT = Counter(
    'http_5xx_errors_total',
    'Total HTTP 5xx server errors',
    ['method', 'endpoint']
)

ACTIVE_REQUESTS = Gauge(
    'http_requests_active',
    'Number of active HTTP requests'
)


class MetricsMiddleware(BaseHTTPMiddleware):
    """Middleware to collect Prometheus metrics for all HTTP requests."""
    
    async def dispatch(self, request: Request, call_next) -> Response:
        # Skip metrics for the /metrics endpoint itself
        if request.url.path == "/metrics":
            return await call_next(request)
        
        method = request.method
        # Normalize endpoint to avoid high cardinality (strip IDs)
        endpoint = self._normalize_path(request.url.path)
        
        ACTIVE_REQUESTS.inc()
        start_time = time.time()
        
        try:
            response = await call_next(request)
            status_code = str(response.status_code)
            
            # Record metrics
            REQUEST_COUNT.labels(method=method, endpoint=endpoint, status_code=status_code).inc()
            
            # Record errors
            if response.status_code >= 400:
                ERROR_COUNT.labels(method=method, endpoint=endpoint, status_code=status_code).inc()
            if response.status_code >= 500:
                SERVER_ERROR_COUNT.labels(method=method, endpoint=endpoint).inc()
            
            return response
        finally:
            # Record latency
            duration = time.time() - start_time
            REQUEST_LATENCY.labels(method=method, endpoint=endpoint).observe(duration)
            ACTIVE_REQUESTS.dec()
    
    def _normalize_path(self, path: str) -> str:
        """Normalize path to reduce metric cardinality by replacing IDs with placeholders."""
        import re
        # UUID pattern: 8-4-4-4-12 hex digits
        uuid_pattern = re.compile(r'^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$', re.IGNORECASE)
        
        parts = path.strip("/").split("/")
        normalized = []
        for part in parts:
            # Check if part looks like an ID (numeric or UUID)
            if part.isdigit() or uuid_pattern.match(part):
                normalized.append("{id}")
            else:
                normalized.append(part)
        return "/" + "/".join(normalized) if normalized else "/"


def get_metrics() -> bytes:
    """Generate Prometheus metrics output."""
    return generate_latest()


def get_metrics_content_type() -> str:
    """Get the content type for Prometheus metrics."""
    return CONTENT_TYPE_LATEST
