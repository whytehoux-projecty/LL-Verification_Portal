"""
Prometheus metrics for monitoring the backend
"""
from prometheus_client import Counter, Histogram, Gauge, generate_latest, CONTENT_TYPE_LATEST
from fastapi import Response
import time


# Define metrics
request_count = Counter(
    'lexnova_http_requests_total',
    'Total HTTP requests',
    ['method', 'endpoint', 'status']
)

request_duration = Histogram(
    'lexnova_http_request_duration_seconds',
    'HTTP request duration in seconds',
    ['method', 'endpoint']
)

active_sessions = Gauge(
    'lexnova_active_sessions',
    'Number of active interview sessions'
)

ai_agent_connections = Gauge(
    'lexnova_ai_agent_connections',
    'Number of active AI agent connections'
)

database_connections = Gauge(
    'lexnova_database_connections',
    'Number of active database connections'
)


class MetricsMiddleware:
    """Middleware to track request metrics"""
    
    def __init__(self, app):
        self.app = app
    
    async def __call__(self, scope, receive, send):
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return
        
        method = scope["method"]
        path = scope["path"]
        
        # Skip metrics endpoint itself
        if path == "/metrics":
            await self.app(scope, receive, send)
            return
        
        start_time = time.time()
        
        async def send_wrapper(message):
            if message["type"] == "http.response.start":
                status_code = message["status"]
                duration = time.time() - start_time
                
                # Record metrics
                request_count.labels(
                    method=method,
                    endpoint=path,
                    status=status_code
                ).inc()
                
                request_duration.labels(
                    method=method,
                    endpoint=path
                ).observe(duration)
            
            await send(message)
        
        await self.app(scope, receive, send_wrapper)


def metrics_endpoint():
    """Endpoint to expose Prometheus metrics"""
    return Response(
        content=generate_latest(),
        media_type=CONTENT_TYPE_LATEST
    )
