# Quickstart Guide

This guide provides instructions to get the LexNova Legal platform running locally for development purposes. The entire stack is containerized using Docker Compose.

**Last Updated:** 2025-12-02

## Prerequisites

-   [Docker](https://www.docker.com/get-started) and Docker Compose
-   A `.env` file with the necessary API keys and configuration.

## 1. Environment Configuration

Create a `.env` file in the root of the project directory. This file is essential for providing credentials for the various services used by the application.

```env
# LiveKit Credentials
LIVEKIT_URL="ws://localhost:7880"
LIVEKIT_API_KEY="your_livekit_api_key"
LIVEKIT_API_SECRET="your_livekit_secret"

# AI Service Credentials
DEEPGRAM_API_KEY="your_deepgram_api_key"
ELEVENLABS_API_KEY="your_elevenlabs_api_key"
GEMINI_API_KEY="your_google_gemini_api_key"

# Database Configuration (for Docker Compose)
POSTGRES_USER=lexnova
POSTGRES_PASSWORD=your_secure_password
POSTGRES_DB=lexnova_db

# Frontend API URL
VITE_API_URL="http://localhost:8000/api"
VITE_LIVEKIT_URL="ws://localhost:7880"
```

**Note:** For the AI services (Deepgram, ElevenLabs, Gemini) and LiveKit, you will need to obtain API keys from their respective platforms.

## 2. Running the Application

The `docker-compose.yml` file is configured to build and run all the necessary services for a local development environment.

### Start All Services

Open your terminal in the project root and run:

```bash
docker-compose up --build
```

This command will:
1.  Build the Docker images for the FastAPI backend (`backend`), the React frontend (`frontend`), and the AI agent worker (`agent`).
2.  Start all the services, including a PostgreSQL database.
3.  The backend API will be available at `http://localhost:8000`.
4.  The frontend application will be available at `http://localhost:3000`.

### Stopping the Application

To stop all running services, press `Ctrl+C` in the terminal where `docker-compose` is running. To remove the containers, run:

```bash
docker-compose down
```

## 3. Accessing the Application

-   **Frontend (Main App):** [http://localhost:3000](http://localhost:3000)
-   **Backend API Docs:** [http://localhost:8000/docs](http://localhost:8000/docs)

## 4. Development Workflow

-   **Backend:** The backend service in `docker-compose.yml` is configured with a volume mount and hot-reloading. Any changes you make to the Python files in the `backend/` directory will automatically restart the uvicorn server.
-   **Frontend:** The frontend Vite server also supports Hot Module Replacement (HMR). Changes to files in the `frontend/` directory will be reflected in your browser almost instantly without a full page reload.
-   **Database Migrations:** The backend automatically runs Alembic migrations on startup via the `run-migrations.sh` script, ensuring your database schema is always up-to-date with the models.