# LexNova Legal - AI-Powered Marriage Verification Platform

> **Production-Ready Backend with AI Agent, Authentication, Monitoring, and CI/CD**

## 🎯 Overview

LexNova Legal is a sophisticated platform for conducting automated marriage verification interviews using AI. The system combines real-time video communication (LiveKit), AI conversation (Gemini LLM), speech processing (Deepgram STT, ElevenLabs TTS), and secure data management.

## ✨ Features

### Core Functionality

- ✅ **Real-time Video Interviews** - LiveKit WebRTC integration
- ✅ **AI Interview Conductor** - Automated verification using Gemini 1.5 Flash
- ✅ **Speech Processing** - Deepgram STT + ElevenLabs TTS
- ✅ **Document Processing** - PDF/JSON script parsing
- ✅ **Session Management** - Complete CRUD operations

### Production Features

- ✅ **JWT Authentication** - Secure lawyer accounts with bcrypt
- ✅ **Session Recording** - S3 storage for video/audio/transcripts
- ✅ **Monitoring** - Prometheus metrics + Grafana dashboards
- ✅ **CI/CD Pipeline** - Automated testing and deployment
- ✅ **Comprehensive Testing** - 80%+ code coverage

### Infrastructure

- ✅ **PostgreSQL** - Persistent data storage
- ✅ **Redis** - Caching and async tasks
- ✅ **Docker** - Containerized deployment
- ✅ **AWS S3** - Recording storage

## 🚀 Quick Start

### Prerequisites

- Docker and Docker Compose
- API keys for: Gemini, ElevenLabs, Deepgram, LiveKit

### 1. Clone and Configure

```bash
# Clone repository
git clone <your-repo-url>
cd lexnova-legal

# Copy environment file
cp .env.example .env

# Edit .env with your API keys
nano .env
```

### 2. Start the Backend

```bash
# Quick start (recommended)
./start-backend.sh

# Or manually with Docker Compose
docker-compose up --build
```

### 3. Verify Installation

```bash
# Run API tests
./test-api.sh

# Check health
curl http://localhost:8000/health

# View API docs
open http://localhost:8000/docs
```

## 📁 Project Structure

```
lexnova-legal/
├── backend/                    # FastAPI backend
│   ├── main.py                # Application entry point
│   ├── auth.py                # JWT authentication
│   ├── database.py            # PostgreSQL connection
│   ├── models.py              # SQLAlchemy models
│   ├── agent.py               # AI Agent worker
│   ├── recording.py           # S3 recording manager
│   ├── metrics.py             # Prometheus metrics
│   ├── routers/               # API endpoints
│   │   ├── auth.py           # Authentication
│   │   ├── sessions.py       # Session management
│   │   ├── documents.py      # Document upload
│   │   └── rooms.py          # LiveKit tokens
│   └── tests/                # Test suite
├── components/                # React components
├── pages/                     # React pages
├── docs/                      # Documentation
├── .github/workflows/         # CI/CD pipeline
├── docker-compose.yml         # Docker services
├── Dockerfile.api             # API container
├── Dockerfile.worker          # Agent container
└── requirements.txt           # Python dependencies
```

## 🔌 API Endpoints

### Authentication

```
POST   /api/auth/register     # Register lawyer account
POST   /api/auth/login        # Login and get JWT token
GET    /api/auth/me           # Get current user (protected)
```

### Sessions

```
POST   /api/sessions          # Create new session
GET    /api/sessions          # List all sessions
POST   /api/sessions/{id}/script    # Upload script
POST   /api/sessions/{id}/start     # Start interview
```

### System

```
GET    /health                # Health check
GET    /metrics               # Prometheus metrics
GET    /docs                  # API documentation
```

## 🤖 AI Agent Architecture

```
┌─────────────┐
│   Client    │
│ (Bride/Groom)│
└──────┬──────┘
       │ WebRTC
       ▼
┌─────────────┐
│  LiveKit    │
│    Room     │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  AI Agent   │
│   Worker    │
└──────┬──────┘
       │
   ┌───┴────┬────────┬────────┐
   │        │        │        │
   ▼        ▼        ▼        ▼
Deepgram  Gemini  ElevenLabs  DB
  (STT)    (LLM)    (TTS)  (Script)
```

## 🧪 Testing

### Run Unit Tests

```bash
# All tests
pytest backend/tests/ -v

# With coverage
pytest backend/tests/ --cov=backend --cov-report=html

# View coverage
open htmlcov/index.html
```

### Run API Tests

```bash
# Automated test script
./test-api.sh

# Manual testing
curl -X POST http://localhost:8000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"pass123","name":"Test"}'
```

## 📊 Monitoring

### Prometheus Metrics

```bash
# View metrics
curl http://localhost:8000/metrics
```

**Available Metrics:**

- `lexnova_http_requests_total` - Total HTTP requests
- `lexnova_http_request_duration_seconds` - Request latency
- `lexnova_active_sessions` - Active interview sessions
- `lexnova_ai_agent_connections` - AI agent connections

### Grafana Dashboard

1. Add Prometheus as data source
2. Import dashboard configuration
3. Monitor real-time metrics

## 🔒 Security

- **Authentication**: JWT tokens with bcrypt password hashing
- **Authorization**: Role-based access control
- **Data Protection**: PostgreSQL with encrypted connections
- **Secure Storage**: S3 with presigned URLs
- **HTTPS**: SSL/TLS in production
- **Input Validation**: Pydantic schemas

## 📚 Documentation

- **[Backend README](backend/README.md)** - Backend setup and architecture
- **[Implementation Summary](backend/IMPLEMENTATION_SUMMARY.md)** - What was built
- **[Quick Reference](backend/QUICK_REFERENCE.md)** - Common commands
- **[Production Deployment](PRODUCTION_DEPLOYMENT.md)** - Deployment guide
- **[Production Features](PRODUCTION_FEATURES_COMPLETE.md)** - Feature overview

## Deployment

See [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) for detailed instructions on how to run the application using Docker.
Development

```bash
./start-backend.sh
```

## 🚢 Deployment

### Development

```bash
./start-backend.sh
```

### Production

See [PRODUCTION_DEPLOYMENT.md](PRODUCTION_DEPLOYMENT.md) for detailed instructions.

**Quick Deploy:**

```bash
# Build images
docker-compose -f docker-compose.prod.yml build

# Deploy
docker-compose -f docker-compose.prod.yml up -d
```

## 🛠️ Technology Stack

### Backend

- **FastAPI** - Modern Python web framework
- **PostgreSQL** - Relational database
- **SQLAlchemy** - ORM
- **Redis** - Caching and queues

### AI & Media

- **LiveKit** - Real-time video/audio
- **Google Gemini** - LLM for conversation
- **Deepgram** - Speech-to-text
- **ElevenLabs** - Text-to-speech

### Infrastructure

- **Docker** - Containerization
- **AWS S3** - Recording storage
- **Prometheus** - Metrics
- **GitHub Actions** - CI/CD

## 📈 Roadmap

### Phase 1: Core ✅

- [x] Backend API
- [x] Database models
- [x] AI Agent worker
- [x] LiveKit integration

### Phase 2: Production ✅

- [x] JWT authentication
- [x] Session recording (S3)
- [x] Monitoring (Prometheus)
- [x] CI/CD pipeline
- [x] Comprehensive testing

### Phase 3: Enhancement (Future)

- [ ] Multi-language support
- [ ] Advanced analytics
- [ ] Mobile app integration
- [ ] Blockchain verification
- [ ] AI model fine-tuning

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests: `pytest backend/tests/`
5. Submit a pull request

## 📄 License

[Your License Here]

## 💬 Support

- **Documentation**: See `/docs` folder
- **API Docs**: <http://localhost:8000/docs>
- **Issues**: GitHub Issues

---

**Built with ❤️ for secure, AI-powered legal verification**

**Status**: ✅ Production Ready | 🚀 Fully Functional | 📊 Monitored | 🔒 Secure
