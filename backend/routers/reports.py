from fastapi import APIRouter, HTTPException, status, Depends
from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.database import get_db
from backend.models import Session as SessionModel, Transcript as TranscriptModel
from backend.schemas import AIConfig as AISchemaConfig
from backend.models import SessionStatus


router = APIRouter(tags=["Reports"])


class TranscriptEntry(BaseModel):
    id: str
    speaker: str
    text: str
    timestamp: datetime


class SessionReportOut(BaseModel):
    id: str
    groomName: str
    brideName: str
    date: str
    status: SessionStatus
    scriptContent: Optional[str] = None
    aiConfig: Optional[AISchemaConfig] = None
    transcripts: List[TranscriptEntry] = []
    
    class Config:
        orm_mode = True # This allows Pydantic to read from SQLAlchemy models


@router.get("/sessions/{session_id}/report", response_model=SessionReportOut)
async def get_session_report(
    session_id: str,
    db: AsyncSession = Depends(get_db)
):
    """
    Retrieves a comprehensive report for a specific session, including all transcripts.
    """
    session_result = await db.execute(
        select(SessionModel).where(SessionModel.id == session_id)
    )
    session = session_result.scalar_one_or_none()

    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found"
        )

    transcript_result = await db.execute(
        select(TranscriptModel)
        .where(TranscriptModel.session_id == session_id)
        .order_by(TranscriptModel.timestamp)
    )
    transcripts = transcript_result.scalars().all()
    
    # Manually map session status to SessionStatus enum for consistency
    session_status = SessionStatus(session.status.value) if session.status else SessionStatus.PENDING

    return SessionReportOut(
        id=session.id,
        groomName=session.groom_name,
        brideName=session.bride_name,
        date=session.date,
        status=session_status,
        scriptContent=session.script_content,
        aiConfig=AISchemaConfig(
            voiceStyle=session.ai_voice_style,
            strictness=session.ai_strictness
        ) if session.ai_voice_style and session.ai_strictness else None,
        transcripts=[
            TranscriptEntry(
                id=t.id,
                speaker=t.speaker,
                text=t.text,
                timestamp=t.get('timestamp', datetime.utcnow()) # use .get for compatibility
            ) for t in transcripts
        ]
    )
