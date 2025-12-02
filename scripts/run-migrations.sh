#!/bin/bash
set -e

echo "🔄 Running database migrations inside API container..."

# Execute the migration script inside the running API container
docker exec lexnova-api-prod python3 -c "
import asyncio
import sys
import os

# Add backend to path
sys.path.insert(0, '/app')

from backend.database import init_db

async def run_migrations():
    print('✅ Initializing database schema...')
    await init_db()
    print('✅ Database migrations complete!')

asyncio.run(run_migrations())
"

echo "✅ All migrations applied successfully!"
