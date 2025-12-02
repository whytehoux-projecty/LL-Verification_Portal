import asyncio
import logging
import os
from typing import List, Tuple

from livekit.agents import (JobContext, VoicePipelineAgent, WorkerOptions, cli,
                             llm)
from livekit.agents.llm import LLMFunction, LLMFunctionTool
from livekit.agents.autosubscribe import AutoSubscribe
from livekit.plugins import deepgram, elevenlabs, silero
from livekit.plugins.google import LLM as GoogleLLM
from sqlalchemy import select

from backend.database import AsyncSessionLocal
from backend.models import Session as SessionModel
from backend.transcript import TranscriptManager

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class GeminiWithTools(llm.LLM):
    """
    Wrapper around a LiveKit LLM plugin to provide tools on each
    chat request.
    """
    def __init__(self, wrapped_llm: llm.LLM, tools: List[LLMFunction]):
        super().__init__(chat=self.chat)
        self._wrapped_llm = wrapped_llm
        self._tools = tools

    async def chat(
        self,
        history: llm.ChatContext,
        **kwargs
    ) -> llm.ChatCompletion:
        return await self._wrapped_llm.chat(
            history=history, tools=self._tools, **kwargs
        )


def _validate_env_vars():
    """Check for required environment variables."""
    required_vars = [
        "LIVEKIT_URL",
        "LIVEKIT_API_KEY",
        "LIVEKIT_API_SECRET",
        "DEEPGRAM_API_KEY",
        "ELEVENLABS_API_KEY",
        "GEMINI_API_KEY",
    ]
    missing_vars = [var for var in required_vars if not os.getenv(var)]
    if missing_vars:
        error_msg = f"Missing required environment variables: {', '.join(missing_vars)}"
        logger.error(error_msg)
        raise ValueError(error_msg)

def _create_system_prompt(
    script_content: str,
    groom_name: str,
    bride_name: str,
    strictness: str
) -> str:
    """Create the system prompt for the LLM."""
    return (
        "You are a professional legal marriage verification officer for LexNova Legal.\n"
        "Your role is to conduct a formal verification interview with two participants.\n\n"
        f"REGISTERED PARTICIPANTS:\n"
        f"- Groom: {groom_name}\n"
        f"- Bride: {bride_name}\n\n"
        f"STRICTNESS: {strictness}\n\n"
        f"OFFICIAL SCRIPT:\n{script_content}\n\n"
        "INSTRUCTIONS:\n"
        "1. Start by greeting the participants and asking them to state their full names one by one. This will help you associate their voice with their name.\n"
        "2. You will receive transcripts with speaker labels (e.g., 'Speaker 0', 'Speaker 1'). Use their initial name introductions to map speaker labels to the participant names ({groom_name} and {bride_name}).\n"
        "3. Once names are confirmed, follow the provided script EXACTLY. Address participants by their names.\n"
        "4. Wait for a clear response from one participant before asking the next question.\n"
        "5. If an answer is unclear or incomplete, politely ask the participant to repeat or clarify.\n"
        "6. Maintain a warm but professional tone throughout the interview.\n"
        "7. If a participant's answer conflicts with the registered information, flag it politely and ask for clarification.\n"
        "8. After the script is completed, conclude the interview professionally.\n"
        "9. Keep your responses concise and clear.\n\n"
        "CRITICAL FOR LEGAL RECORDS:\n"
        "After every single utterance from any participant (yourself, the groom, or the bride), you MUST call the `save_transcript_entry` function. Provide the speaker's name as either '{groom_name}', '{bride_name}', or 'AI Officer' and the exact text they said."
    )

def _create_voice_agent(
    system_prompt: str,
    voice_style: str,
    tools: List[LLMFunction]
) -> VoicePipelineAgent:
    """Initialize and return a VoicePipelineAgent."""
    gemini_api_key = os.getenv("GEMINI_API_KEY", "")
    deepgram_api_key = os.getenv("DEEPGRAM_API_KEY", "")
    elevenlabs_api_key = os.getenv("ELEVENLABS_API_KEY", "")

    gemini_llm = GoogleLLM(model="gemini-1.5-flash-latest", api_key=gemini_api_key)
    gemini_with_tools = GeminiWithTools(wrapped_llm=gemini_llm, tools=tools)

    voice_map = {"warm": "Rachel", "neutral": "Adam", "firm": "Domi"}
    selected_voice = voice_map.get(
        voice_style.lower() if voice_style else "warm", "Rachel"
    )

    return VoicePipelineAgent(
        vad=silero.VAD.load(),
        stt=deepgram.STT(
            api_key=deepgram_api_key,
            model="nova-2",
            language="en-US",
            smart_format=True,
            diarize=True,
        ),
        llm=gemini_with_tools,
        tts=elevenlabs.TTS(
            api_key=elevenlabs_api_key,
            voice=selected_voice,
            model_id="eleven_turbo_v2",
            encoding="mp3_44100_128",
        ),
        chat_ctx=llm.ChatContext(
            messages=[
                llm.ChatMessage(
                    role=llm.ChatRole.SYSTEM,
                    content=system_prompt,
                )
            ]
        ),
    )


async def get_session_script(
    session_id: str,
) -> Tuple[str, str, str, str, str]:
    """Fetch session script from the database."""
    try:
        async with AsyncSessionLocal() as db:
            result = await db.execute(
                select(SessionModel).where(SessionModel.id == session_id)
            )
            session = result.scalar_one_or_none()

            if not session:
                logger.error(f"Session {session_id} not found in database")
                return "", "", "", "", ""

            script = session.script_content or ""
            groom = session.groom_name or ""
            bride = session.bride_name or ""
            voice_style = session.ai_voice_style or "warm"
            strictness = session.ai_strictness or "high"
            return (
                str(script),
                str(groom),
                str(bride),
                str(voice_style),
                str(strictness),
            )
    except Exception as e:
        logger.error(f"Database error fetching session {session_id}: {e}")
        return "", "", "", "", ""


async def entrypoint(ctx: JobContext):
    """Main entry point for the AI agent."""
    try:
        _validate_env_vars()
        logger.info(f"Agent starting for room: {ctx.room.name}")

        await ctx.connect(auto_subscribe=AutoSubscribe.AUDIO_ONLY)
        logger.info("Agent connected to room")

        session_id = ctx.room.name
        (
            script_content,
            groom_name,
            bride_name,
            voice_style,
            strictness,
        ) = await get_session_script(session_id)

        if not all([script_content, groom_name, bride_name]):
            logger.error(
                f"Incomplete session data for session {session_id}. "
                "Script, groom name, and bride name are required. Shutting down."
            )
            return

        logger.info(f"Loaded script for session {session_id}")
        logger.info(f"Participants: {groom_name} & {bride_name}")

        # 1. Create TranscriptManager
        transcript_manager = TranscriptManager(session_id)

        # 2. Define the function for the LLM to call
        async def save_transcript_entry(speaker: str, text: str):
            """Saves a single entry to the session transcript for legal records."""
            await transcript_manager.add_entry(speaker, text)
            return f"Entry for {speaker} saved."

        # 3. Create the tool definition
        save_tool = LLMFunction(
            fn=save_transcript_entry,
            metadata=LLMFunctionTool(
                description="Save a single utterance from the conversation to the legal transcript.",
                parameters={
                    "type": "object",
                    "properties": {
                        "speaker": {
                            "type": "string",
                            "description": f"The speaker's name or role. Must be one of: '{groom_name}', '{bride_name}', or 'AI Officer'.",
                        },
                        "text": {
                            "type": "string",
                            "description": "The exact utterance from the speaker.",
                        },
                    },
                    "required": ["speaker", "text"],
                },
            ),
        )
        
        system_prompt = _create_system_prompt(
            script_content, groom_name, bride_name, strictness
        )

        agent = _create_voice_agent(
            system_prompt, voice_style, tools=[save_tool]
        )

        agent.start(ctx.room)
        logger.info("✅ AI Agent is now active in the room for all participants")

        # Initial greeting is also a transcript entry
        initial_greeting = (
            "Good day. I am the LexNova automated verification officer. "
            "This session is being recorded for legal purposes. "
            "To begin, could each of you please state your full name?"
        )
        await agent.say(initial_greeting, allow_interruptions=False)
        
        # Manually save the agent's first utterance
        await transcript_manager.add_entry("AI Officer", initial_greeting)

        while ctx.room.connection_state == "connected":
            await asyncio.sleep(1)

    except Exception as e:
        logger.error(f"Agent runtime error: {e}", exc_info=True)
    finally:
        logger.info("Agent shutting down.")


if __name__ == "__main__":
    cli.run_app(
        WorkerOptions(
            entrypoint_fnc=entrypoint,
            api_key=os.getenv("LIVEKIT_API_KEY", ""),
            api_secret=os.getenv("LIVEKIT_API_SECRET", ""),
            ws_url=os.getenv("LIVEKIT_URL", "ws://localhost:7880"),
            agent_name="LexNova AI Officer",
        )
    )
