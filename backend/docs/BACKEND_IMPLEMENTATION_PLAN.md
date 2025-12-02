# Backend Implementation Plan

**Goal:** Transition the `lexnova-legal` backend from a prototype to a fully functional, production-ready system.

## Phase 1: Foundation & Infrastructure

**Objective:** Replace mocks with real infrastructure and robust configuration.

1. **Environment Configuration**
    * Create `config.py` using `pydantic-settings` to manage environment variables:
        * `DATABASE_URL`
        * `LIVEKIT_URL`, `LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET`
        * `GEMINI_API_KEY`
        * `ELEVENLABS_API_KEY`
        * `DEEPGRAM_API_KEY`
        * `REDIS_URL`

2. **Database Layer (PostgreSQL)**
    * Install `sqlalchemy`, `alembic`, `asyncpg`.
    * Define `Base` model and `SessionLocal` in `database.py`.
    * **Models (`models.py`):**
        * `User` (Lawyers)
        * `Session` (The interview instance)
        * `Script` (Parsed content linked to session)
    * Set up Alembic for migrations.

3. **Dockerization**
    * Create `Dockerfile.api` for the FastAPI service.
    * Create `Dockerfile.worker` for the AI Agent process.
    * Create `docker-compose.yml` to spin up:
        * `postgres`
        * `redis`
        * `fastapi-server`
        * `ai-worker`

## Phase 2: Core API Implementation

**Objective:** Enable real data persistence and room management.

1. **Session Management (`routers/sessions.py`)**
    * Update `create_session` to write to PostgreSQL.
    * Update `list_sessions` to read from PostgreSQL.

2. **Document Processing (`routers/documents.py`)**
    * Refine `pdfplumber` logic.
    * Store extracted text in the `Session` table (or a dedicated `Script` table).
    * Add error handling for malformed files.

3. **LiveKit Integration (`routers/rooms.py`)**
    * Install `livekit-server-sdk`.
    * Implement `start_session`:
        * Verify session status in DB.
        * Generate **real** Access Tokens for:
            * Lawyer (Permissions: `canPublish`, `canSubscribe`, `canManage`)
            * Client (Permissions: `canPublish`, `canSubscribe`)
        * Return tokens to frontend.

## Phase 3: The AI Agent (The "Brain")

**Objective:** Implement the `agent.py` worker to handle the interview logic.

1. **Worker Setup**
    * Use `livekit-agents` SDK.
    * Create the entry point `entrypoint(ctx: JobContext)`.
    * Implement connection logic to join the room defined in the job.

2. **Pipeline Construction**
    * **STT:** Configure `deepgram` plugin for real-time transcription.
    * **LLM:** Configure `google-generativeai` (Gemini 1.5 Flash) with a system prompt that includes the specific session's script.
    * **TTS:** Configure `elevenlabs` plugin for voice output.

3. **Conversation Logic (State Machine)**
    * Implement the "Interviewer" persona.
    * **Script Injection:** Fetch the script from the DB based on the `room_name` (Session ID).
    * **Step Tracking:**
        * Agent speaks current question.
        * Agent listens for answer.
        * Agent validates answer (using Gemini function calling or simple prompt logic).
        * Agent moves to next question.
    * **Data Sync:** Send `DataPacket` to the frontend to update the "Script Progress" UI.

## Phase 4: Integration & Verification

**Objective:** Connect all pieces and verify end-to-end flow.

1. **Frontend Connection**
    * Update frontend to use the real API endpoints.
    * Verify video/audio flows with the AI agent in the room.

2. **Testing**
    * **Unit Tests:** Test DB models and API endpoints.
    * **Integration Tests:** Simulate a full session flow (Upload -> Start -> Chat).

## Dependencies to Add

```text
fastapi
uvicorn
sqlalchemy
alembic
asyncpg
pydantic-settings
python-multipart
pdfplumber
livekit-server-sdk
livekit-agents
livekit-plugins-deepgram
livekit-plugins-elevenlabs
livekit-plugins-google-ai
google-generativeai
```
