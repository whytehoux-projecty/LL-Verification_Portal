
This is a technical backend design focusing on FastAPI (for the management layer) and a Python AI Worker (for the real-time intelligence layer).
We will separate the system into two distinct parts:
 1 The HTTP API (FastAPI): Handles file uploads, user management, and room provisioning.
 2 The Agent Worker: A dedicated Python process that connects to the media server, listens to audio, and streams AI responses.

1. High-Level Backend Architecture
code Mermaid
downloadcontent_copy
expand_less
    graph TD
    subgraph "FastAPI Server"
        Auth[Auth Service]
        DocProcessor[Document Processor]
        RoomMgr[Room Manager]
        DB[(PostgreSQL)]
        Redis[(Redis - State/Cache)]
    end

    subgraph "External Services"
        LiveKit[LiveKit Server (Media Transport)]
        Gemini[Google Gemini API]
        11Labs[ElevenLabs API]
        Deepgram[Deepgram STT]
    end

    subgraph "AI Agent Worker (Python)"
        Agent[Bot Process]
    end

    %% Flows
    Client -->|Upload Script| DocProcessor
    DocProcessor -->|Store Text| DB
    Client -->|Start Call| RoomMgr
    RoomMgr -->|Create Room| LiveKit
    RoomMgr -->|Trigger| Agent

    Agent -->|Join Room| LiveKit
    Agent -->|Get Context| DB
    Agent -->|Stream Audio/Text| Gemini & 11Labs
  
2. Tech Stack & Libraries
 • Web Framework: FastAPI (Async Python).
 • Database: PostgreSQL (User data, Session logs).
 • Async Tasks: Celery + Redis (For parsing large PDFs).
 • Media Server: LiveKit (We will use the livekit-server for WebRTC).
 • Agent Framework: livekit-agents (Python SDK).
 • LLM: google-generativeai (Gemini SDK).
 • TTS: elevenlabs (Official Python SDK).

3. Database Schema (SQLAlchemy)
You need to link the specific script to the specific meeting room.
code Python
downloadcontent_copy
expand_less

   # models.py

class InterviewSession(Base):
    __tablename__ = "sessions"
    id = Column(UUID, primary_key=True)
    lawyer_id = Column(UUID, ForeignKey("users.id"))
    groom_name = Column(String)
    bride_name = Column(String)
    # The extracted text from the PDF/JSON is stored here
    script_content = Column(Text)
    # Current status: pending, active, completed
    status = Column(String)
    livekit_room_name = Column(String)
  
4. Component 1: The FastAPI Service
This handles the "business" side: uploading the script and setting up the call.
A. Document Parsing Endpoint
When the lawyer uploads the PDF/JSON, we extract the text immediately to prepare the "Brain."
code Python
downloadcontent_copy
expand_less

   # routers/documents.py

from fastapi import UploadFile, APIRouter
import pdfplumber # For extracting text from PDF

router = APIRouter()

@router.post("/upload-script/{session_id}")
async def upload_script(session_id: str, file: UploadFile):
    # 1. Read file
    content = ""
    if file.filename.endswith(".pdf"):
        with pdfplumber.open(file.file) as pdf:
            for page in pdf.pages:
                content += page.extract_text()
    elif file.filename.endswith(".json"):
        import json
        data = json.load(file.file)
        content = json.dumps(data) # Convert JSON to string for context

    # 2. Save content to Database linked to this Session
    await db.update_session_script(session_id, content)
    
    return {"status": "Script processed and ready for AI"}
  
B. Room Creation Endpoint
This generates the tokens needed for the Bride, Groom, and the AI Agent to join.
code Python
downloadcontent_copy
expand_less
    # routers/rooms.py
import livekit.api

@router.post("/start-interview/{session_id}")
async def start_interview(session_id: str):
    # 1. Retrieve session data
    session = await db.get_session(session_id)

    # 2. Create LiveKit Room
    lk_api = livekit.api.LiveKitAPI(URL, API_KEY, API_SECRET)
    room = await lk_api.room.create_room(name=session_id)
    
    # 3. Spawn the AI Worker for this specific room
    # We send the Session ID so the worker knows which Script to fetch from DB
    await spawn_agent_worker(room_name=session_id, script_content=session.script_content)

    # 4. Return tokens for humans
    return {
        "groom_token": create_token(session_id, "Groom"),
        "bride_token": create_token(session_id, "Bride"),
        "lawyer_token": create_token(session_id, "Lawyer")
    }
  
5. Component 2: The AI Agent Logic (The Core)
This is a separate Python script/service running livekit-agents. It connects to the room as a "participant."
The Logic Flow:
 1 System Prompt: Inject the "Role" (Marriage Counselor) and the "Script" (from DB).
 2 Context Management: Maintain a history of what the bride/groom said.
 3 Pipeline: WebRTC Audio -> Deepgram (STT) -> Gemini (Logic) -> ElevenLabs (TTS) -> WebRTC Audio.
code Python
downloadcontent_copy
expand_less
    # agent_worker.py
from livekit.agents import AutoDisconnect, JobContext, WorkerOptions, cli
from livekit.agents.llm import LLM
from livekit.plugins import deepgram, elevenlabs, google_ai

async def entrypoint(ctx: JobContext):
    # 1. Connect to the Room
    await ctx.connect()

    # 2. Fetch the Script specific to this room (passed via job metadata)
    script_content = ctx.job.metadata.get("script_content")
    
    # 3. Configure the AI "Persona"
    # We use Google Gemini as the brain
    llm = google_ai.LLM(
        model="gemini-1.5-flash", # Fast and large context window
    )
    
    # 4. Define the System Prompt (The Instruction Manual)
    initial_context = [
        {
            "role": "system",
            "content": f"""
            You are a professional legal marriage counselor/officiant.
            Your task is to conduct a verification interview based EXACTLY on the text provided below.
            
            OFFICIAL SCRIPT:
            {script_content}
            
            RULES:
            1. Do not deviate from the script questions.
            2. Wait for the user to answer before moving to the next question.
            3. If the user's answer is unclear, ask them to clarify.
            4. Keep your tone formal but warm.
            """
        }
    ]

    # 5. Set up the Voice Assistant Pipeline
    # This automatically handles Listening -> STT -> LLM -> TTS -> Speaking
    agent = VoiceAssistant(
        vad=silero.VAD(), # Detects when humans stop talking
        stt=deepgram.STT(), # Transcribes human speech
        llm=llm, # Generates response
        tts=elevenlabs.TTS(voice_id="<Warm_Female_Voice_ID>"),
        chat_ctx=initial_context
    )

    # 6. Start the Assistant
    agent.start(ctx.room)
    
    # 7. Say the first line to kick off the meeting
    await agent.say("Good morning. I am the automated verification officer. Let us begin.")

if __name__ == "__main__":
    cli.run_app(WorkerOptions(entrypoint_fnc=entrypoint))
  
6. Handling the "Script" Logic (JSON vs PDF)
If the script is JSON, the logic is safer. You can use Gemini's Function Calling capabilities.
If your JSON looks like this:
code JSON
downloadcontent_copy
expand_less
    {"questions": ["State name", "Do you take this man?", "Sign here"]}
  
You can configure the backend to force Gemini to follow step-by-step:
code Python
downloadcontent_copy
expand_less
    # In the agent logic
current_step = 0
script_steps = json.loads(script_content)

async def on_user_speech(text):
    # Validate answer for current step
    verification = await gemini.verify_answer(text, expected=script_steps[current_step])

    if verification.is_valid:
        current_step += 1
        next_line = script_steps[current_step].text
        await agent.say(next_line)
    else:
        await agent.say("I didn't quite catch that. Could you repeat clearly?")
  
7. Deployment Plan (DevOps)
 1 Docker Container A (FastAPI):
 ◦ Exposes Port 8000.
 ◦ Connects to Postgres.
 2 Docker Container B (Agent Worker):
 ◦ No open ports needed (it makes outbound connections to LiveKit).
 ◦ Needs Environment Variables: LIVEKIT_URL, GEMINI_API_KEY, ELEVENLABS_API_KEY.
 3 LiveKit Server:
 ◦ Self-host on a distinct AWS EC2 instance or use LiveKit Cloud.
8. Summary of Flow
 1 Lawyer uploads PDF to FastAPI.
 2 FastAPI parses text -> DB.
 3 Lawyer clicks "Start". FastAPI creates room & spawns Python Worker.
 4 Python Worker joins room, reads DB script, initializes Gemini with script context.
 5 Bride/Groom join.
 6 Python Worker (Gemini) hears audio, checks script, sends audio (ElevenLabs) back to room.
———

Phase 1: The "Control Plane" (FastAPI & DB)
Before the AI can speak, you need the infrastructure to manage sessions and data.
 1 Scaffold the Backend:
 ◦ Create a backend/ directory.
 ◦ Set up SQLAlchemy with asyncpg for asynchronous PostgreSQL access.
 ◦ Implement the InterviewSession model exactly as defined in your design.
 2 Implement Document Processing (/upload-script):
 ◦ This is critical. You need to transform the user's PDF into the "System Prompt" for Gemini.
 ◦ Action: Implement the pdfplumber logic.
 ◦ Tip: Store the extracted text in the DB and allow the lawyer to edit it via a PUT endpoint before the session starts, just in case the PDF parsing was messy.
 3 Implement Room Provisioning (/start-interview):
 ◦ This endpoint is the bridge between your DB and LiveKit.
 ◦ Action: When called, it should:
 1 Create a room via livekit-server-sdk.
 2 Generate a JWT Token for the Lawyer and the Client.
 3 Trigger the Agent: Depending on how you host the worker, you might need to send a webhook or simply rely on the Worker listening for room events.
Phase 2: The "Intelligence Layer" (Python Agent)
This is the most complex part. It runs as a standalone process, not inside FastAPI.
 1 Agent Logic & State Machine:
 ◦ The agent needs to know where in the script it is.
 ◦ Action: Instead of a generic prompt, use a Stateful Loop:code Python    # Pseudo-code for agent logic
 ◦ steps = script_content.split("\n")
 ◦ for step in steps:
 ◦     await agent.say(step.question)
 ◦     answer = await agent.listen()
 ◦     # Optional: Ask Gemini to validate the answer before moving on
 ◦     validation = await gemini.validate(answer, context=step)
 ◦     if not validation.passed:
 ◦          await agent.say("Please clarify that.")
 ◦   
 2 Gemini & ElevenLabs Integration:
 ◦ Gemini 1.5 Flash is the right choice for speed.
 ◦ Latency Tuning: Ensure you are using stream=True for both Gemini generation and ElevenLabs TTS to minimize the pause between the user speaking and the bot replying.
Phase 3: Frontend Integration
Currently, your React app uses MOCK_SESSIONS and setTimeout.
 1 Replace Mocks with API Calls:
 ◦ In LawyerDashboard.tsx, replace handleFileUpload with a fetch('POST /api/upload-script').
 ◦ In App.tsx, when joining a room, fetch the token from your FastAPI backend.
 2 Real LiveKit Client:
 ◦ In LiveKitRoom.tsx, replace the simulated setTimeout transcript generation with the actual useLiveKitRoom and useParticipant hooks from @livekit/components-react. This will allow the frontend to display the actual audio levels and video streams.
Phase 4: DevOps / Deployment
 1 Dockerize:
 ◦ Create a Dockerfile for FastAPI.
 ◦ Create a Dockerfile for the Agent Worker (Note: The worker often needs robust audio libraries installed at the OS level, e.g., ffmpeg).
 ◦ Use docker-compose to spin up Postgres, Redis, FastAPI, and the Worker locally for testing.
