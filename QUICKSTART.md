# Quick Start Guide

## Prerequisites

- Docker & Docker Compose installed
- LiveKit server running (or use the embedded one in docker-compose)

## 1. Clone and Setup

```bash
cd /Volumes/Project\ Disk/lexnova-legal
```

## 2. Configure Environment

The project is already configured with `.env` files. Verify they exist:

- `backend/.env` - Backend configuration
- `frontend/.env` - Frontend configuration

## 3. Start the Application

### Option A: Full Stack with Docker (Recommended)

```bash
docker-compose up --build
```

This will start:

- PostgreSQL database (port 5432)
- Redis (port 6379)
- Backend API (port 8000)
- AI Agent Worker
- Frontend (port 3000)

### Option B: Development Mode

**Terminal 1 - Backend:**

```bash
cd backend
source venv/bin/activate  # or create: python -m venv venv
pip install -r requirements.txt
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

**Terminal 2 - Agent Worker:**

```bash
cd backend
source venv/bin/activate
python agent.py
```

**Terminal 3 - Frontend:**

```bash
cd frontend
npm install
npm run dev
```

## 4. Access the Application

- **Frontend**: <http://localhost:3000>
- **Backend API Docs**: <http://localhost:8000/docs>
- **Health Check**: <http://localhost:8000/health>

## 5. Test the Flow

### Register a Lawyer Account

1. Go to <http://localhost:3000/login>
2. Click "Register" (or use API directly)
3. Login with credentials

### Create a Session

1. Navigate to Dashboard
2. Click "New Session"
3. Fill in groom/bride names
4. Upload a script (or use default)
5. Click "Start Session"

### Join the Interview

1. After starting, you'll be redirected to the LiveKit room
2. Allow camera/microphone access
3. The AI agent will join automatically
4. The agent will conduct the interview following the script

## 6. Verify Everything Works

### Check Backend

```bash
curl http://localhost:8000/health
# Should return: {"status":"healthy"}
```

### Check Database

```bash
docker-compose exec postgres psql -U postgres -d lexnova -c "SELECT * FROM users;"
```

### Check Logs

```bash
# API logs
docker-compose logs -f api

# Agent logs
docker-compose logs -f agent

# Frontend logs
docker-compose logs -f frontend
```

## 7. Troubleshooting

### Frontend won't connect to backend

- Check `frontend/.env` has `VITE_API_URL=http://localhost:8000/api`
- Verify backend is running on port 8000

### Agent won't join room

- Check `backend/.env` has correct LiveKit credentials
- Verify LiveKit server is running
- Check agent logs: `docker-compose logs agent`

### Database connection errors

- Ensure PostgreSQL is running
- Check `DATABASE_URL` in `backend/.env`
- Run migrations: `cd backend && alembic upgrade head`

### Build errors

```bash
# Frontend
cd frontend
rm -rf node_modules package-lock.json
npm install
npm run build

# Backend
cd backend
rm -rf venv
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

## 8. Stop the Application

```bash
# Docker
docker-compose down

# Or with volume cleanup
docker-compose down -v
```

## Next Steps

- Read [IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md) for architecture details
- Check [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) for production deployment
- Review API documentation at <http://localhost:8000/docs>
- Explore the codebase in `frontend/` and `backend/`

## Support

For issues or questions:

1. Check the logs first
2. Review the documentation
3. Verify environment variables
4. Ensure all services are running
