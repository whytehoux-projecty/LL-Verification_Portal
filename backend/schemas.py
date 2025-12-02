from pydantic import BaseModel
from typing import Optional, Literal


class AIConfig(BaseModel):
    voiceStyle: Literal["warm", "authoritative"]
    strictness: Literal["high", "low"]


class SessionCreate(BaseModel):
    groomName: str
    brideName: str
    date: str
    aiConfig: Optional[AIConfig] = None


class SessionOut(BaseModel):
    id: str
    groomName: str
    brideName: str
    date: str
    status: Literal["pending", "ready", "active", "completed"]
    scriptContent: Optional[str] = None
    aiConfig: Optional[AIConfig] = None
    sessionCode: Optional[str] = None  # 6-character code for client join
