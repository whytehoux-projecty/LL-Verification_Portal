# backend/transcript.py

import uuid
from datetime import datetime
from .database import AsyncSessionLocal
from .models import Transcript as TranscriptModel

class TranscriptManager:
    """Manages saving transcript entries to the database for a specific session."""

    def __init__(self, session_id: str):
        if not session_id:
            raise ValueError("session_id cannot be empty")
        self._session_id = session_id

    async def add_entry(self, speaker: str, text: str):
        """
        Saves a single transcript entry to the database.

        Args:
            speaker: The name of the speaker (e.g., "Groom", "Bride", "AI Officer").
            text: The utterance text.
        """
        if not speaker or not text:
            return

        async with AsyncSessionLocal() as db:
            new_entry = TranscriptModel(
                id=str(uuid.uuid4()),
                session_id=self._session_id,
                speaker=speaker,
                text=text,
                timestamp=datetime.utcnow(),
            )
            db.add(new_entry)
            await db.commit()
