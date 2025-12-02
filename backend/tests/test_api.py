"""
Unit tests for the LexNova Legal backend
Run with: pytest backend/tests/
"""
import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from backend.main import app
from backend.models import Base
from backend.database import get_db
import asyncio


# Test database URL
TEST_DATABASE_URL = "postgresql+asyncpg://postgres:postgres@localhost:5432/lexnova_test"


@pytest.fixture(scope="session")
def event_loop():
    """Create an event loop for the test session"""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


@pytest.fixture(scope="function")
async def test_db():
    """Create a test database"""
    engine = create_async_engine(TEST_DATABASE_URL, echo=False)
    
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)
    
    async_session = sessionmaker(
        engine, class_=AsyncSession, expire_on_commit=False
    )
    
    async with async_session() as session:
        yield session
    
    await engine.dispose()


@pytest.fixture
async def client(test_db):
    """Create a test client"""
    async def override_get_db():
        yield test_db
    
    app.dependency_overrides[get_db] = override_get_db
    
    async with AsyncClient(app=app, base_url="http://test") as ac:
        yield ac
    
    app.dependency_overrides.clear()


class TestHealthCheck:
    """Test health check endpoint"""
    
    @pytest.mark.asyncio
    async def test_health_check(self, client):
        response = await client.get("/health")
        assert response.status_code == 200
        assert response.json()["status"] == "healthy"


class TestAuthentication:
    """Test authentication endpoints"""
    
    @pytest.mark.asyncio
    async def test_register_user(self, client):
        response = await client.post(
            "/api/auth/register",
            json={
                "email": "lawyer@example.com",
                "password": "securepassword123",
                "name": "John Lawyer"
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert data["email"] == "lawyer@example.com"
        assert data["name"] == "John Lawyer"
        assert "id" in data
    
    @pytest.mark.asyncio
    async def test_register_duplicate_email(self, client):
        # Register first user
        await client.post(
            "/api/auth/register",
            json={
                "email": "lawyer@example.com",
                "password": "password123",
                "name": "John Lawyer"
            }
        )
        
        # Try to register with same email
        response = await client.post(
            "/api/auth/register",
            json={
                "email": "lawyer@example.com",
                "password": "password456",
                "name": "Jane Lawyer"
            }
        )
        assert response.status_code == 400
    
    @pytest.mark.asyncio
    async def test_login_success(self, client):
        # Register user
        await client.post(
            "/api/auth/register",
            json={
                "email": "lawyer@example.com",
                "password": "password123",
                "name": "John Lawyer"
            }
        )
        
        # Login
        response = await client.post(
            "/api/auth/login",
            json={
                "email": "lawyer@example.com",
                "password": "password123"
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"
    
    @pytest.mark.asyncio
    async def test_login_wrong_password(self, client):
        # Register user
        await client.post(
            "/api/auth/register",
            json={
                "email": "lawyer@example.com",
                "password": "password123",
                "name": "John Lawyer"
            }
        )
        
        # Login with wrong password
        response = await client.post(
            "/api/auth/login",
            json={
                "email": "lawyer@example.com",
                "password": "wrongpassword"
            }
        )
        assert response.status_code == 401


class TestSessions:
    """Test session management endpoints"""
    
    @pytest.mark.asyncio
    async def test_create_session(self, client):
        response = await client.post(
            "/api/sessions",
            json={
                "groomName": "John Doe",
                "brideName": "Jane Smith",
                "date": "2024-12-15",
                "aiConfig": {
                    "voiceStyle": "warm",
                    "strictness": "high"
                }
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert data["groomName"] == "John Doe"
        assert data["brideName"] == "Jane Smith"
        assert data["status"] == "pending"
        assert "id" in data
    
    @pytest.mark.asyncio
    async def test_list_sessions(self, client):
        # Create a session
        await client.post(
            "/api/sessions",
            json={
                "groomName": "John Doe",
                "brideName": "Jane Smith",
                "date": "2024-12-15"
            }
        )
        
        # List sessions
        response = await client.get("/api/sessions")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) >= 1


class TestDocuments:
    """Test document upload endpoints"""
    
    @pytest.mark.asyncio
    async def test_upload_text_script(self, client):
        # Create a session first
        session_response = await client.post(
            "/api/sessions",
            json={
                "groomName": "John Doe",
                "brideName": "Jane Smith",
                "date": "2024-12-15"
            }
        )
        session_id = session_response.json()["id"]
        
        # Upload a text file
        files = {
            "file": ("script.txt", b"Question 1: State your name\nQuestion 2: Do you take...", "text/plain")
        }
        response = await client.post(
            f"/api/sessions/{session_id}/script",
            files=files
        )
        assert response.status_code == 200
        assert response.json()["status"] == "ready"
