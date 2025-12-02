# Backend Quick Reference

## 🚀 Quick Start Commands

```bash
# Start everything with Docker
./start-backend.sh

# Or manually
docker-compose up --build

# Run locally (development)
uvicorn backend.main:app --reload
```

## 📁 File Structure

```
backend/
├── __init__.py
├── main.py                 # FastAPI app entry point
├── config.py              # Environment configuration
├── database.py            # PostgreSQL connection & operations
├── models.py              # SQLAlchemy models
├── schemas.py             # Pydantic schemas
├── agent.py               # AI Agent worker (STT→LLM→TTS)
├── routers/
│   ├── sessions.py        # Session CRUD endpoints
│   ├── documents.py       # Script upload & parsing
│   └── rooms.py           # LiveKit token generation
├── README.md
├── IMPLEMENTATION_SUMMARY.md
└── BACKEND_IMPLEMENTATION_PLAN.md
```

## 🔌 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| POST | `/api/sessions` | Create new session |
| GET | `/api/sessions` | List all sessions |
| POST | `/api/sessions/{id}/script` | Upload script (PDF/JSON) |
| POST | `/api/sessions/{id}/start` | Start interview & get tokens |

## 🗄️ Database Models

### Session

- `id`: Unique session identifier
- `groom_name`, `bride_name`: Participant names
- `script_content`: Parsed interview script
- `status`: pending → ready → active → completed
- `ai_voice_style`, `ai_strictness`: AI configuration

### User

- Lawyer accounts (for future auth)

### Transcript

- Conversation logs for legal records

## 🤖 AI Agent Flow

1. Session starts → Agent receives job
2. Agent fetches script from database
3. Agent joins LiveKit room
4. Pipeline: Audio → Deepgram → Gemini → ElevenLabs → Audio
5. Agent follows script and validates responses

## 🔧 Environment Variables

```bash
# Database
DATABASE_URL=postgresql+asyncpg://...

# LiveKit
LIVEKIT_URL=ws://localhost:7880
LIVEKIT_API_KEY=...
LIVEKIT_API_SECRET=...

# AI Services
GEMINI_API_KEY=...
ELEVENLABS_API_KEY=...
DEEPGRAM_API_KEY=...
```

## 🐳 Docker Services

| Service | Port | Description |
|---------|------|-------------|
| postgres | 5432 | PostgreSQL database |
| redis | 6379 | Redis cache |
| api | 8000 | FastAPI backend |
| agent | - | AI worker (no exposed port) |

## 📝 Common Tasks

### View Logs

```bash
docker-compose logs -f api
docker-compose logs -f agent
```

### Database Shell

```bash
docker-compose exec postgres psql -U postgres -d lexnova
```

### Restart Services

```bash
docker-compose restart api
docker-compose restart agent
```

### Stop Everything

```bash
docker-compose down
```

### Clean Rebuild

```bash
docker-compose down -v
docker-compose up --build
```

## 🧪 Testing

### Test API

```bash
# Health check
curl http://localhost:8000/health

# Create session
curl -X POST http://localhost:8000/api/sessions \
  -H "Content-Type: application/json" \
  -d '{
    "groomName": "John Doe",
    "brideName": "Jane Smith",
    "date": "2024-12-15",
    "aiConfig": {
      "voiceStyle": "warm",
      "strictness": "high"
    }
  }'

# List sessions
curl http://localhost:8000/api/sessions
```

## 🔍 Troubleshooting

**Port already in use:**

```bash
# Find process using port 8000
lsof -i :8000
# Kill it
kill -9 <PID>
```

**Database connection failed:**

- Check if PostgreSQL is running: `docker-compose ps`
- Check logs: `docker-compose logs postgres`

**Agent not joining room:**

- Verify LiveKit server is running
- Check API keys in `.env`
- View agent logs: `docker-compose logs agent`

## 📚 Resources

- [FastAPI Docs](https://fastapi.tiangolo.com/)
- [LiveKit Docs](https://docs.livekit.io/)
- [LiveKit Agents](https://docs.livekit.io/agents/)
- [SQLAlchemy Docs](https://docs.sqlalchemy.org/)
