#!/bin/bash

# LexNova Legal Backend Startup Script

echo "🚀 Starting LexNova Legal Backend..."
echo ""

# Navigate to project root
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$DIR/.."


# Check if .env exists
if [ ! -f .env ]; then
    echo "⚠️  .env file not found!"
    echo "Creating .env from .env.example..."
    cp .env.example .env
    echo "✅ Created .env file"
    echo "⚠️  Please edit .env and add your API keys before continuing."
    echo ""
    exit 1
fi

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker and try again."
    exit 1
fi

echo "📦 Building Docker images..."
docker-compose build

echo ""
echo "🔄 Starting services..."
docker-compose up -d postgres redis

echo "⏳ Waiting for database to be ready..."
sleep 5

echo ""
echo "🌐 Starting API server..."
docker-compose up -d api

echo ""
echo "🤖 Starting AI Agent worker..."
docker-compose up -d agent

echo ""
echo "✅ All services started!"
echo ""
echo "📊 Service Status:"
docker-compose ps

echo ""
echo "🔗 API: http://localhost:8000"
echo "🔗 Health Check: http://localhost:8000/health"
echo "🔗 API Docs: http://localhost:8000/docs"
echo ""
echo "📝 View logs:"
echo "  - All services: docker-compose logs -f"
echo "  - API only: docker-compose logs -f api"
echo "  - Agent only: docker-compose logs -f agent"
echo ""
echo "🛑 Stop services: docker-compose down"
