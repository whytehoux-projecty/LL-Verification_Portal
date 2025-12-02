from fastapi import APIRouter, Request
from schemas import SessionCreate, SessionOut
from database import db
from middleware.rate_limit import limiter

router = APIRouter()

@router.post("/sessions", response_model=SessionOut)
@limiter.limit("10/minute")
async def create_session(request: Request, payload: SessionCreate):
    return await db.create_session(payload)

@router.get("/sessions", response_model=list[SessionOut])
@limiter.limit("30/minute")
async def list_sessions(request: Request):
    return await db.list_sessions()

