# LexNova Legal Backend

Complete FastAPI backend implementation with AI agent for automated marriage verification interviews.

## 🏗️ Architecture

- **FastAPI**: REST API for session management and document processing
- **PostgreSQL**: Persistent data storage
- **LiveKit**: Real-time WebRTC media server
- **AI Agent**: Python worker using Gemini LLM, Deepgram STT, and ElevenLabs TTS

## 📋 Prerequisites

1. **LiveKit Server**: You need a running LiveKit server
   - Option 1: Use [LiveKit Cloud](https://livekit.io/)
   - Option 2: Self-host with Docker: `docker run --rm -p 7880:7880 livekit/livekit-server --dev`

2. **API Keys**:
   - Google Gemini API key
   - ElevenLabs API key
   - Deepgram API key

## 🚀 Quick Start

### 1. Environment Setup

Copy the example environment file and fill in your credentials:

```bash
cp .env.example .env
```

Edit `.env` with your actual API keys.

### 2. Run with Docker Compose

```bash
# Build and start all services
docker-compose up --build

# Or run in detached mode
docker-compose up -d
```

This will start:

- PostgreSQL database (port 5432)
- Redis (port 6379)
- FastAPI backend (port 8000)
- AI Agent worker

### 3. Run Locally (Development)

```bash
# Install dependencies
pip install -r requirements.txt

# Start PostgreSQL and Redis
docker-compose up postgres redis -d

# Run the API server
uvicorn backend.main:app --reload --port 8000

# In another terminal, run the AI agent
python -m backend.agent
```

## 📡 API Endpoints

### Health Check

```
GET /health
```

### Sessions

```
POST /api/sessions
GET /api/sessions
```

### Document Upload

```
POST /api/sessions/{session_id}/script
```

### Start Interview

```
POST /api/sessions/{session_id}/start
```

Returns LiveKit tokens for lawyer, bride, and groom.

## 🤖 AI Agent

The AI agent (`backend/agent.py`) is a LiveKit participant that:

1. Joins the room when a session starts
2. Fetches the script from the database
3. Conducts the interview using:
   - **Deepgram** for speech-to-text
   - **Gemini 1.5 Flash** for conversation logic
   - **ElevenLabs** for text-to-speech
4. Follows the script precisely and validates responses

## 🗄️ Database Schema

### Users Table

- Lawyer accounts

### Sessions Table

- Interview sessions with bride/groom info
- Script content
- AI configuration
- Status tracking

### Transcripts Table

- Full conversation logs for legal records

## 🔧 Configuration

All configuration is managed through environment variables (see `.env.example`).

Key settings in `backend/config.py`:

- Database connection
- LiveKit credentials
- AI service API keys

## 📝 Development Notes

### Database Migrations

The app auto-creates tables on startup. For production, use Alembic:

```bash
# Initialize Alembic
alembic init alembic

# Create migration
alembic revision --autogenerate -m "Initial schema"

# Apply migration
alembic upgrade head
```

### Testing the AI Agent

1. Start a session via the API
2. Upload a script
3. Call `/api/sessions/{id}/start` to get tokens
4. Join the room with a WebRTC client
5. The AI agent will automatically join and begin the interview

## 🐛 Troubleshooting

**Database connection errors:**

- Ensure PostgreSQL is running
- Check `DATABASE_URL` in `.env`

**LiveKit connection errors:**

- Verify LiveKit server is running
- Check `LIVEKIT_URL`, `LIVEKIT_API_KEY`, and `LIVEKIT_API_SECRET`

**AI agent not joining:**

- Ensure all AI service API keys are valid
- Check agent logs: `docker-compose logs agent`

## 📚 Next Steps

- [ ] Implement user authentication (JWT)
- [ ] Add session recording to cloud storage
- [ ] Implement real-time transcript storage
- [ ] Add webhook notifications for session events
- [ ] Create admin dashboard for monitoring
