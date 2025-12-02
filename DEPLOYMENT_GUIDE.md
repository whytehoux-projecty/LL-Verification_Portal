# Deployment Guide

## Prerequisites

- Docker and Docker Compose
- Node.js 18+ (for local development)
- Python 3.11+ (for local development)

## Environment Setup

1. **Backend**:
   - Copy `backend/.env.example` to `backend/.env` (if not already done).
   - Set `LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET`, `GEMINI_API_KEY`, etc.

2. **Frontend**:
   - Copy `frontend/.env.example` (or create one) to `frontend/.env`.
   - Set `VITE_API_URL=http://localhost:8000/api`
   - Set `VITE_LIVEKIT_URL=ws://localhost:7880`

## Running with Docker Compose

To start the entire stack (Postgres, Redis, API, Worker, Frontend):

```bash
docker-compose up --build
```

- **Frontend**: <http://localhost:3000>
- **Backend API**: <http://localhost:8000/docs>
- **LiveKit Dashboard**: <http://localhost:7880>

## Local Development

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python main.py
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

## Troubleshooting

- **LiveKit Connection**: Ensure `VITE_LIVEKIT_URL` matches your LiveKit server websocket URL.
- **Audio/Video**: Ensure your browser allows camera/microphone access.
- **Agent**: Check the `worker` service logs to see if the AI agent joins the room.
