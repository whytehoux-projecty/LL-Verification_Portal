from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .routers import documents, rooms, client_auth
from .routers.sessions import router as sessions_router
from .routers.auth import router as auth_router
from .database import init_db
from .metrics import MetricsMiddleware, metrics_endpoint
from .middleware.rate_limit import limiter, rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
import os


app = FastAPI(title="LexNova Legal API", version="1.0.0")

# Add rate limiter to app state
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, rate_limit_exceeded_handler)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Add metrics middleware if enabled
if os.getenv("ENABLE_METRICS", "true").lower() == "true":
    app.add_middleware(MetricsMiddleware)



@app.on_event("startup")
async def startup_event():
    """Initialize database on startup"""
    await init_db()
    print("✅ Database initialized")


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": "lexnova-legal-api"}


@app.get("/metrics")
async def metrics():
    """Prometheus metrics endpoint"""
    return metrics_endpoint()


# Register routers
app.include_router(auth_router, prefix="/api/auth", tags=["Authentication"])
app.include_router(client_auth.router, tags=["Client"])
app.include_router(sessions_router, prefix="/api", tags=["Sessions"])
app.include_router(documents.router, prefix="/api", tags=["Documents"])
app.include_router(rooms.router, prefix="/api", tags=["Rooms"])

