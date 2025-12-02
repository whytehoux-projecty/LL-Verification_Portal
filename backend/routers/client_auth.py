"""
Client authentication endpoints for joining sessions
"""
from fastapi import APIRouter, HTTPException, status, Depends, Request
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from ..database import get_db
from ..models import Session
from .rooms import generate_livekit_token
from ..utils.session_codes import is_code_expired, validate_session_code_format
from ..middleware.rate_limit import limiter

router = APIRouter(tags=["Client Authentication"])


class ClientJoinRequest(BaseModel):
    session_code: str
    participant_name: str
    participant_type: str  # "groom" or "bride"


class ClientJoinResponse(BaseModel):
    token: str
    session_id: str
    room_name: str
    groom_name: str
    bride_name: str


@router.post("/api/client/join", response_model=ClientJoinResponse)
@limiter.limit("10/minute")
async def client_join_session(
    request: Request,
    join_request: ClientJoinRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Allow clients (bride/groom) to join a session using a session code
    
    Args:
        join_request: Contains session code, participant name, and type
        db: Database session
        
    Returns:
        LiveKit token and session information
        
    Raises:
        404: Session code not found
        400: Session code expired or invalid participant type
    """
    # Validate session code format
    code = join_request.session_code.upper().replace("-", "")
    if not validate_session_code_format(code):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid session code format. Code must be 6 alphanumeric characters."
        )
    
    # Find session by code
    result = await db.execute(
        select(Session).where(Session.session_code == code)
    )
    session = result.scalar_one_or_none()
    
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invalid session code. Please check the code and try again."
        )
    
    # Check if code has expired
    if session.session_code_expires and is_code_expired(session.session_code_expires):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Session code has expired. Please contact your lawyer for a new code."
        )
    
    # Validate participant type
    if join_request.participant_type not in ["groom", "bride"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid participant type. Must be 'groom' or 'bride'."
        )
    
    # Generate LiveKit token
    room_name = session.livekit_room_name or session.id
    token = generate_livekit_token(
        room_name=room_name,
        participant_name=join_request.participant_name,
        metadata={
            "type": join_request.participant_type,
            "session_id": session.id
        }
    )
    
    return ClientJoinResponse(
        token=token,
        session_id=session.id,
        room_name=room_name,
        groom_name=session.groom_name,
        bride_name=session.bride_name
    )


@router.get("/api/client/session/{session_code}")
@limiter.limit("20/minute")
async def get_session_info(
    request: Request,
    session_code: str,
    db: AsyncSession = Depends(get_db)
):
    """
    Get basic session information using a session code (without joining)
    
    Args:
        session_code: 6-character session code
        db: Database session
        
    Returns:
        Basic session information
    """
    code = session_code.upper().replace("-", "")
    
    result = await db.execute(
        select(Session).where(Session.session_code == code)
    )
    session = result.scalar_one_or_none()
    
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found"
        )
    
    if session.session_code_expires and is_code_expired(session.session_code_expires):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Session code has expired"
        )
    
    return {
        "session_id": session.id,
        "groom_name": session.groom_name,
        "bride_name": session.bride_name,
        "date": session.date,
        "status": session.status.value,
        "code_expires": session.session_code_expires.isoformat() if session.session_code_expires else None
    }
