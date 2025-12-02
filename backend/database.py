from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import sessionmaker
from .config import settings
from .models import Base, Session as SessionModel, SessionStatus
from .schemas import SessionCreate, SessionOut, AIConfig
from .utils.session_codes import generate_session_code, get_code_expiry
from typing import List
from urllib.parse import urlsplit, parse_qsl, urlencode, urlunsplit
import uuid
from datetime import datetime


# Create async engine
_db_url = settings.database_url
if _db_url.startswith("postgresql://"):
    _db_url = _db_url.replace("postgresql://", "postgresql+asyncpg://", 1)

# Strip psycopg-only query params when using asyncpg
parts = urlsplit(_db_url)
query_params = [(k, v) for k, v in parse_qsl(parts.query) if k != "sslmode"]
_db_url = urlunsplit((parts.scheme, parts.netloc, parts.path, urlencode(query_params), parts.fragment))

engine = create_async_engine(
    _db_url,
    echo=True,  # Set to False in production
    future=True
)

# Create async session factory
AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False
)


async def init_db():
    """Initialize database tables"""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


async def get_db():
    """Dependency for getting database session"""
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


class Database:
    """Database operations wrapper"""
    
    async def create_session(self, payload: SessionCreate) -> SessionOut:
        """Create a new interview session"""
        async with AsyncSessionLocal() as db:
            session_id = str(uuid.uuid4())[:8]
            
            # Generate unique session code
            session_code = generate_session_code()
            # Ensure uniqueness (retry if collision)
            from sqlalchemy import select
            max_retries = 5
            for _ in range(max_retries):
                result = await db.execute(
                    select(SessionModel).where(SessionModel.session_code == session_code)
                )
                if not result.scalar_one_or_none():
                    break
                session_code = generate_session_code()
            
            new_session = SessionModel(
                id=session_id,
                groom_name=payload.groomName,
                bride_name=payload.brideName,
                date=payload.date,
                status=SessionStatus.PENDING,
                ai_voice_style=payload.aiConfig.voiceStyle if payload.aiConfig else "warm",
                ai_strictness=payload.aiConfig.strictness if payload.aiConfig else "high",
                livekit_room_name=session_id,
                session_code=session_code,
                session_code_expires=get_code_expiry(hours=24)
            )
            
            db.add(new_session)
            await db.commit()
            await db.refresh(new_session)
            
            return self._to_session_out(new_session)
    
    async def list_sessions(self) -> List[SessionOut]:
        """List all sessions"""
        async with AsyncSessionLocal() as db:
            from sqlalchemy import select
            result = await db.execute(select(SessionModel).order_by(SessionModel.created_at.desc()))
            sessions = result.scalars().all()
            return [self._to_session_out(s) for s in sessions]
    
    async def get_session(self, session_id: str) -> SessionOut:
        """Get a specific session by ID"""
        async with AsyncSessionLocal() as db:
            from sqlalchemy import select
            result = await db.execute(select(SessionModel).where(SessionModel.id == session_id))
            session = result.scalar_one_or_none()
            
            if not session:
                raise KeyError("session_not_found")
            
            return self._to_session_out(session)
    
    async def update_session_script(self, session_id: str, content: str):
        """Update session with parsed script content"""
        async with AsyncSessionLocal() as db:
            from sqlalchemy import select
            result = await db.execute(select(SessionModel).where(SessionModel.id == session_id))
            session = result.scalar_one_or_none()
            
            if not session:
                raise KeyError("session_not_found")
            
            session.script_content = content
            session.status = SessionStatus.READY
            await db.commit()
    
    async def update_session_status(self, session_id: str, status: SessionStatus):
        """Update session status"""
        async with AsyncSessionLocal() as db:
            from sqlalchemy import select
            result = await db.execute(select(SessionModel).where(SessionModel.id == session_id))
            session = result.scalar_one_or_none()
            
            if not session:
                raise KeyError("session_not_found")
            
            session.status = status
            if status == SessionStatus.ACTIVE:
                session.started_at = datetime.utcnow()
            elif status == SessionStatus.COMPLETED:
                session.completed_at = datetime.utcnow()
            
            await db.commit()
    
    def _to_session_out(self, session: SessionModel) -> SessionOut:
        """Convert SQLAlchemy model to Pydantic schema"""
        return SessionOut(
            id=session.id,
            groomName=session.groom_name,
            brideName=session.bride_name,
            date=session.date,
            status=session.status.value,
            scriptContent=session.script_content,
            aiConfig=AIConfig(
                voiceStyle=session.ai_voice_style,
                strictness=session.ai_strictness
            ) if session.ai_voice_style else None,
            sessionCode=session.session_code
        )


# Global database instance
db = Database()
