# Production Deployment Guide

This guide outlines the steps to deploy the LexNova Legal platform to a production environment. The production setup is designed to be run using Docker Compose and is orchestrated via `docker-compose.prod.yml`.

**Last Updated:** 2025-12-02

## Architecture Overview

The production architecture consists of the following containerized services:

-   `nginx`: A reverse proxy to manage incoming traffic, handle SSL termination, and serve the static frontend build.
-   `backend`: The FastAPI application running with Gunicorn.
-   `agent`: The Python-based LiveKit AI agent worker.
-   `db`: The PostgreSQL database.
-   `livekit`: The LiveKit media server (it is assumed this is running and accessible).

## 1. Prerequisites

-   A server with Docker and Docker Compose installed.
-   A registered domain name pointing to your server's IP address.
-   SSL certificate and key files for your domain.
-   A running LiveKit instance.

## 2. Configuration

### a. Environment Variables (`.env.prod`)

Create a production environment file named `.env.prod` in the project root. **This file should never be committed to source control.**

```env
# --- GENERAL ---
SECRET_KEY=a_very_long_and_random_secret_for_jwt

# --- DATABASE ---
POSTGRES_USER=lexnova_prod
POSTGPOSTGRES_PASSWORD=a_very_strong_and_random_password
POSTGRES_DB=lexnova_prod_db
DATABASE_URL=postgresql+asyncpg://lexnova_prod:a_very_strong_and_random_password@db:5432/lexnova_prod_db

# --- LIVEKIT ---
# URL should be the public-facing URL of your LiveKit instance
LIVEKIT_URL="wss://your-livekit-domain.com"
LIVEKIT_API_KEY="your_livekit_api_key"
LIVEKIT_API_SECRET="your_livekit_secret"

# --- AI SERVICES ---
DEEPGRAM_API_KEY="your_deepgram_api_key"
ELEVENLABS_API_KEY="your_elevenlabs_api_key"
GEMINI_API_KEY="your_google_gemini_api_key"

# --- FRONTEND (build-time args) ---
# The API URL should be the public domain of your application
VITE_API_URL="https://your-lexnova-domain.com/api"
VITE_LIVEKIT_URL="wss://your-livekit-domain.com"
```

### b. NGINX Configuration

The `nginx/nginx-ssl.conf` file is provided as a template for production. You must:

1.  **Place SSL Certificates:** Add your SSL certificate (`fullchain.pem`) and private key (`privkey.pem`) to the `nginx/ssl/` directory.
2.  **Update Domain Name:** In `nginx/nginx-ssl.conf`, replace `your_domain.com` with your actual domain name.

## 3. Building and Running Production Containers

Use the `docker-compose.prod.yml` file to build and run the services in production mode.

```bash
# Build the production images
docker-compose -f docker-compose.prod.yml build

# Start all services in detached mode
docker-compose -f docker-compose.prod.yml up -d
```

### What this command does:

-   It builds the frontend into a set of static files (`frontend/dist`).
-   The `nginx` service copies these static files and serves them directly.
-   The `backend` service runs using Gunicorn with multiple workers for better performance.
-   All services are configured to restart automatically (`restart: always`).

## 4. Database Migrations

After the initial launch, you may need to run database migrations manually if the schema changes.

```bash
# Execute the migration script inside the running backend container
docker-compose -f docker-compose.prod.yml exec backend alembic upgrade head
```

## 5. Monitoring and Maintenance

-   **Logs:** To view the logs for all running services:
    ```bash
    docker-compose -f docker-compose.prod.yml logs -f
    ```
-   **Updates:** To update the application, pull the latest code, rebuild the images, and restart the services:
    ```bash
    git pull
    docker-compose -f docker-compose.prod.yml build
    docker-compose -f docker-compose.prod.yml up -d
    # Run migrations if necessary
    docker-compose -f docker-compose.prod.yml exec backend alembic upgrade head
    ```

## 6. Security Hardening

-   **Firewall:** Ensure your server's firewall only exposes necessary ports (typically `80` for HTTP and `443` for HTTPS).
-   **Environment File:** Secure the `.env.prod` file with strict file permissions (`chmod 600 .env.prod`).
-   **CORS:** In `backend/main.py`, tighten the `CORSMiddleware` `allow_origins` setting to only include your application's domain instead of `["*"]`.
-   **Regular Backups:** Implement a regular backup strategy for your PostgreSQL database volume.