from fastapi import APIRouter, HTTPException
try:
    from livekit import api
except Exception:
    api = None
from ..database import db
from ..config import settings
from ..models import SessionStatus
from datetime import timedelta
from typing import Optional, Dict, Any

router = APIRouter()


def generate_livekit_token(
    room_name: str, 
    participant_name: str, 
    identity: Optional[str] = None,
    metadata: Optional[Dict[str, Any]] = None
) -> str:
    """
    Generate a LiveKit token for a participant
    
    Args:
        room_name: Name of the room to join
        participant_name: Display name of the participant
        identity: Unique identity (defaults to generated UUID if None)
        metadata: Optional metadata to attach to the participant
        
    Returns:
        JWT token string
    """
    if api is None or not settings.livekit_api_key or not settings.livekit_api_secret:
        return f"mock-token-{room_name}-{participant_name}"
        
    token = api.AccessToken(
        api_key=settings.livekit_api_key,
        api_secret=settings.livekit_api_secret
    )
    
    if not identity:
        import uuid
        identity = str(uuid.uuid4())
        
    token.with_identity(identity)
    token.with_name(participant_name)
    
    if metadata:
        import json
        token.with_metadata(json.dumps(metadata))
        
    token.with_grants(api.VideoGrants(
        room_join=True,
        room=room_name,
        can_publish=True,
        can_subscribe=True,
        can_publish_data=True
    ))
    
    token.with_ttl(timedelta(hours=2))
    
    return token.to_jwt()


@router.post("/sessions/{session_id}/start")
async def start_session(session_id: str):
    """Start an interview session and generate LiveKit tokens"""
    try:
        session = await db.get_session(session_id)
    except KeyError:
        raise HTTPException(status_code=404, detail="Session not found")
    
    # Verify session is ready
    if session.status != "ready":
        raise HTTPException(
            status_code=400, 
            detail=f"Session must be in 'ready' status. Current status: {session.status}"
        )
    
    # Update session status to active
    await db.update_session_status(session_id, SessionStatus.ACTIVE)
    
    # Generate LiveKit tokens
    room_name = session_id
    
    # Check if LiveKit is configured
    if api is None or not settings.livekit_api_key or not settings.livekit_api_secret:
        # Fallback to mock token for development
        return {
            "token": f"mock-token-{session_id}",
            "roomName": room_name,
            "url": settings.livekit_url,
            "warning": "LiveKit credentials not configured. Using mock token."
        }
    
    try:
        # Create LiveKit API client
        livekit_api = api.LiveKitAPI(
            url=settings.livekit_url,
            api_key=settings.livekit_api_key,
            api_secret=settings.livekit_api_secret
        )
        
        # Create or get room
        await livekit_api.room.create_room(
            api.CreateRoomRequest(name=room_name)
        )
        
        # Generate tokens using the helper function
        lawyer_token = generate_livekit_token(
            room_name=room_name,
            participant_name="Legal Officer",
            identity="lawyer",
            metadata={"role": "lawyer"}
        )
        
        groom_token = generate_livekit_token(
            room_name=room_name,
            participant_name=session.groomName,
            identity="groom",
            metadata={"role": "groom"}
        )
        
        bride_token = generate_livekit_token(
            room_name=room_name,
            participant_name=session.brideName,
            identity="bride",
            metadata={"role": "bride"}
        )
        
        return {
            "roomName": room_name,
            "url": settings.livekit_url,
            "tokens": {
                "lawyer": lawyer_token,
                "groom": groom_token,
                "bride": bride_token
            }
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to create LiveKit room: {str(e)}"
        )
