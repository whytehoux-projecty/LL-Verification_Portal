# Backend Documentation

**Last Updated:** 2025-12-02

This document provides a high-level overview of the backend system for the LexNova Legal platform. For a complete and detailed analysis of the architecture, please refer to the main project review document.

**[Comprehensive Project Review](../../docs/COMPREHENSIVE_REVIEW.md)**

---

## 1. Technology Stack

-   **Framework:** Python 3.11 with FastAPI
-   **Database:** PostgreSQL with SQLAlchemy (ORM) and Alembic (Migrations)
-   **Authentication:** JWT (for lawyers) and Session Codes (for clients)
-   **Real-time Agent:** `livekit-agents` SDK for the AI worker
-   **Containerization:** Docker & Docker Compose

## 2. Architecture

The backend is a monolithic FastAPI application structured with a clear separation of concerns. Its primary responsibilities are:

1.  **Serving the REST API:** Providing endpoints for the frontend to manage users, sessions, and documents.
2.  **Managing Authentication:** Handling the two distinct authentication flows for lawyers and their clients.
3.  **Controlling Real-Time Sessions:** Interfacing with the LiveKit Server API to create rooms and generate access tokens.
4.  **Orchestrating the AI Agent:** Triggering the AI agent worker to join sessions when they become active.

## 3. API Structure

The API is organized into logical modules using FastAPI's `APIRouter`:

-   `/api/auth`: Handles lawyer registration and login.
-   `/api/client`: Handles client authentication via session codes.
-   `/api/sessions`: Manages the creation and listing of verification sessions.
-   `/api/documents`: Manages the uploading of legal scripts for sessions.
-   `/api/rooms`: Handles the starting of sessions and generation of LiveKit tokens.

## 4. Database Schema

The database consists of three primary models:

-   `User`: Represents a lawyer/administrator account.
-   `Session`: The central model, linking a lawyer, clients, a script, and a LiveKit room.
-   `Transcript`: Stores the conversation from a completed session (intended to be populated by the AI agent).

## 5. AI Agent (`agent.py`)

The AI agent is a separate worker process that connects to LiveKit. It uses a VAD-STT-LLM-TTS pipeline to function as the automated verification officer in the call.

-   **VAD:** Silero
-   **STT:** Deepgram (with diarization)
-   **LLM:** Google Gemini
--   **TTS:** ElevenLabs

The agent's behavior is dynamically configured for each session via a system prompt generated from the session's script and settings.