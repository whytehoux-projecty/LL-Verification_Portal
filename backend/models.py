from sqlalchemy import Column, String, Text, DateTime, ForeignKey, Enum as SQLEnum
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from datetime import datetime
import enum

Base = declarative_base()


class SessionStatus(str, enum.Enum):
    PENDING = "pending"
    READY = "ready"
    ACTIVE = "active"
    COMPLETED = "completed"


class User(Base):
    """Lawyer/Admin users"""
    __tablename__ = "users"
    
    id = Column(String, primary_key=True)
    email = Column(String, unique=True, nullable=False)
    name = Column(String, nullable=False)
    password_hash = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    sessions = relationship("Session", back_populates="lawyer")



class Session(Base):
    """Interview session between bride, groom, and AI"""
    __tablename__ = "sessions"
    
    id = Column(String, primary_key=True)
    lawyer_id = Column(String, ForeignKey("users.id"), nullable=True)
    
    # Client information
    groom_name = Column(String, nullable=False)
    bride_name = Column(String, nullable=False)
    
    # Session metadata
    date = Column(String, nullable=False)
    status = Column(SQLEnum(SessionStatus), default=SessionStatus.PENDING)
    
    # Script content (extracted from PDF/JSON)
    script_content = Column(Text, nullable=True)
    
    # AI Configuration (stored as JSON)
    ai_voice_style = Column(String, default="warm")
    ai_strictness = Column(String, default="high")
    
    # LiveKit room name
    livekit_room_name = Column(String, nullable=True)
    
    # Session code for client join (6-character alphanumeric)
    session_code = Column(String(6), unique=True, index=True, nullable=True)
    session_code_expires = Column(DateTime, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    started_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    
    # Relationships
    lawyer = relationship("User", back_populates="sessions")


class Transcript(Base):
    """Store conversation transcripts for legal records"""
    __tablename__ = "transcripts"
    
    id = Column(String, primary_key=True)
    session_id = Column(String, ForeignKey("sessions.id"), nullable=False)
    
    speaker = Column(String, nullable=False)  # "AI", "GROOM", "BRIDE", "LAWYER"
    text = Column(Text, nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow)
