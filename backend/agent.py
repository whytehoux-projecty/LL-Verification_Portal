"""
LexNova Legal AI Agent Worker.

This agent joins LiveKit rooms and conducts automated marriage verification
interviews.
"""

import asyncio
import logging
import os
from typing import Any

from livekit.agents import JobContext, WorkerOptions, cli
from livekit.agents.voice_assistant import VoiceAssistant
from livekit.plugins import deepgram, elevenlabs, silero
from livekit.plugins.google import LLM
from sqlalchemy import select

from backend.database import AsyncSessionLocal
from backend.models import Session as SessionModel

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


async def get_session_script(session_id: str) -> tuple[Any, Any, Any]:
    """
    Fetch session script from database.

    Returns:
        tuple: (script_content, groom_name, bride_name)
    """
    try:
        async with AsyncSessionLocal() as db:
            result = await db.execute(select(SessionModel).where(SessionModel.id == session_id))
            session = result.scalar_one_or_none()

            if not session:
                logger.error(f"Session {session_id} not found in database")
                return ("", "", "")

            script = session.script_content or "No script provided."
            return (script, session.groom_name, session.bride_name)
    except Exception as e:
        logger.error(f"Database error fetching session {session_id}: {e}")
        return ("", "", "")


async def entrypoint(ctx: JobContext):
    """
    Main entry point for the AI agent.

    This function is called when the agent joins a room.
    """
    try:
        logger.info(f"Agent starting for room: {ctx.room.name}")

        # Connect to the room
        await ctx.connect(auto_subscribe=True)

        # Extract session ID from room name
        session_id = ctx.room.name

        # Fetch the script and session data from database
        script_content, groom_name, bride_name = await get_session_script(session_id)

        if not script_content:
            logger.warning(f"No script found for session {session_id}. Agent may not function correctly.")

        logger.info(f"Loaded script for session {session_id}")
        logger.info(f"Participants: {groom_name} & {bride_name}")

        # Build the system prompt with the script
        system_prompt = (
            "You are a professional legal marriage verification officer for "
            "LexNova Legal.\n"
            "Your role is to conduct a formal verification interview following "
            "the provided script EXACTLY.\n\n"
            f"PARTICIPANTS:\n"
            f"- Groom: {groom_name}\n"
            f"- Bride: {bride_name}\n\n"
            f"OFFICIAL SCRIPT:\n"
            f"{script_content}\n\n"
            "INSTRUCTIONS:\n"
            "1. Follow the script precisely. Do not deviate from the "
            "questions.\n"
            "2. Wait for clear responses before proceeding to the next "
            "question.\n"
            "3. If an answer is unclear or incomplete, politely ask the "
            "participant to repeat or clarify.\n"
            "4. Maintain a warm but professional tone throughout the "
            "interview.\n"
            "5. Verify that names match the registered participants.\n"
            "6. If a participant gives an answer that doesn't match expected "
            "information, flag it politely.\n"
            "7. Keep responses concise and clear.\n\n"
            "Begin the interview by greeting the participants and stating "
            "your role."
        )

        # Initialize the LLM (Gemini)
        llm = LLM(model="gemini-1.5-flash-latest", api_key=os.getenv("GEMINI_API_KEY", ""))

        # Initialize the Voice Assistant pipeline
        assistant = VoiceAssistant(
            vad=silero.VAD.load(),
            stt=deepgram.STT(
                api_key=os.getenv("DEEPGRAM_API_KEY", ""),
                model="nova-2",
                language="en-US",
                smart_format=True,
            ),
            llm=llm,
            tts=elevenlabs.TTS(
                api_key=os.getenv("ELEVENLABS_API_KEY", ""),
                voice="Rachel",
                model_id="eleven_turbo_v2",
                encoding="mp3_44100_128",
            ),
            chat_ctx=[
                {
                    "role": "system",
                    "content": system_prompt,
                }
            ],
        )

        # Start the assistant
        assistant.start(ctx.room)

        logger.info("✅ AI Agent is now active in the room")

        # Initial greeting
        await assistant.say(
            f"Good day. I am the LexNova automated verification officer. "
            f"This session is for {groom_name} and {bride_name}. "
            f"Let us begin the verification process."
        )

        # Keep the agent running
        await asyncio.sleep(3600)  # Run for up to 1 hour

    except Exception as e:
        logger.error(f"Agent runtime error: {e}", exc_info=True)


if __name__ == "__main__":
    # Run the agent worker
    cli.run_app(
        WorkerOptions(
            entrypoint_fnc=entrypoint,
            api_key=os.getenv("LIVEKIT_API_KEY", ""),
            api_secret=os.getenv("LIVEKIT_API_SECRET", ""),
            ws_url=os.getenv("LIVEKIT_URL", "ws://localhost:7880"),
            agent_name="LexNova AI Officer",
        )
    )
