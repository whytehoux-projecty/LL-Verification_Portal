# Production Deployment Guide

## 🎯 Overview

This guide covers deploying LexNova Legal backend to production with all features enabled:

- ✅ JWT Authentication
- ✅ Session Recording (S3)
- ✅ Monitoring (Prometheus/Grafana)
- ✅ CI/CD (GitHub Actions)
- ✅ Comprehensive Testing

## 📋 Prerequisites

### 1. Infrastructure Requirements

- **Database**: PostgreSQL 15+ (managed service recommended: AWS RDS, DigitalOcean, etc.)
- **Cache**: Redis 7+ (AWS ElastiCache, Redis Cloud, etc.)
- **Storage**: AWS S3 bucket for session recordings
- **Compute**: Docker-capable server (AWS ECS, DigitalOcean Droplets, etc.)
- **LiveKit**: LiveKit Cloud account or self-hosted server

### 2. API Keys Required

- Google Gemini API key
- ElevenLabs API key
- Deepgram API key
- LiveKit API credentials
- AWS credentials (for S3)

## 🚀 Deployment Steps

### Step 1: Environment Configuration

Create a `.env` file with production values:

```bash
# Database (use managed PostgreSQL)
DATABASE_URL=postgresql+asyncpg://user:password@your-db-host:5432/lexnova

# LiveKit
LIVEKIT_URL=wss://your-livekit-server.com
LIVEKIT_API_KEY=your_production_key
LIVEKIT_API_SECRET=your_production_secret

# AI Services
GEMINI_API_KEY=your_production_gemini_key
ELEVENLABS_API_KEY=your_production_elevenlabs_key
DEEPGRAM_API_KEY=your_production_deepgram_key

# Redis
REDIS_URL=redis://your-redis-host:6379

# JWT (IMPORTANT: Generate a strong secret!)
JWT_SECRET_KEY=$(openssl rand -hex 32)
JWT_ALGORITHM=HS256
JWT_EXPIRATION_MINUTES=1440

# AWS S3
AWS_ACCESS_KEY_ID=your_aws_key
AWS_SECRET_ACCESS_KEY=your_aws_secret
AWS_REGION=us-east-1
S3_BUCKET_NAME=lexnova-prod-recordings

# Monitoring
ENABLE_METRICS=true
```

### Step 2: Database Setup

```bash
# Run migrations
alembic upgrade head

# Create initial admin user (optional)
python -c "
from backend.auth import get_password_hash
from backend.database import AsyncSessionLocal
from backend.models import User
import asyncio
import uuid

async def create_admin():
    async with AsyncSessionLocal() as db:
        admin = User(
            id=str(uuid.uuid4()),
            email='admin@lexnova.com',
            name='Admin',
            password_hash=get_password_hash('change-this-password')
        )
        db.add(admin)
        await db.commit()

asyncio.run(create_admin())
"
```

### Step 3: S3 Bucket Setup

```bash
# Create S3 bucket
aws s3 mb s3://lexnova-prod-recordings --region us-east-1

# Set bucket policy for private access
aws s3api put-bucket-policy --bucket lexnova-prod-recordings --policy '{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Principal": {"AWS": "arn:aws:iam::YOUR_ACCOUNT:user/lexnova-api"},
    "Action": ["s3:PutObject", "s3:GetObject"],
    "Resource": "arn:aws:s3:::lexnova-prod-recordings/*"
  }]
}'

# Enable versioning (recommended)
aws s3api put-bucket-versioning --bucket lexnova-prod-recordings \
  --versioning-configuration Status=Enabled
```

### Step 4: Docker Deployment

#### Option A: Docker Compose (Single Server)

```bash
# Build images
docker-compose -f docker-compose.prod.yml build

# Start services
docker-compose -f docker-compose.prod.yml up -d

# Check status
docker-compose -f docker-compose.prod.yml ps
```

#### Option B: AWS ECS (Recommended for Scale)

1. **Create ECR repositories:**

```bash
aws ecr create-repository --repository-name lexnova-api
aws ecr create-repository --repository-name lexnova-worker
```

2. **Build and push images:**

```bash
# Login to ECR
aws ecr get-login-password --region us-east-1 | \
  docker login --username AWS --password-stdin YOUR_ACCOUNT.dkr.ecr.us-east-1.amazonaws.com

# Build and tag
docker build -f Dockerfile.api -t lexnova-api:latest .
docker tag lexnova-api:latest YOUR_ACCOUNT.dkr.ecr.us-east-1.amazonaws.com/lexnova-api:latest

docker build -f Dockerfile.worker -t lexnova-worker:latest .
docker tag lexnova-worker:latest YOUR_ACCOUNT.dkr.ecr.us-east-1.amazonaws.com/lexnova-worker:latest

# Push
docker push YOUR_ACCOUNT.dkr.ecr.us-east-1.amazonaws.com/lexnova-api:latest
docker push YOUR_ACCOUNT.dkr.ecr.us-east-1.amazonaws.com/lexnova-worker:latest
```

3. **Create ECS task definitions and services** (use AWS Console or Terraform)

### Step 5: Monitoring Setup

#### Prometheus Configuration

Create `prometheus.yml`:

```yaml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'lexnova-api'
    static_configs:
      - targets: ['api:8000']
    metrics_path: '/metrics'
```

#### Grafana Dashboard

1. Add Prometheus as data source
2. Import dashboard JSON (create custom or use template)
3. Key metrics to monitor:
   - Request rate and latency
   - Active sessions
   - AI agent connections
   - Database connection pool
   - Error rates

### Step 6: CI/CD Setup

The GitHub Actions workflow (`.github/workflows/ci-cd.yml`) is already configured.

**To enable:**

1. Add secrets to GitHub repository:
   - `AWS_ACCESS_KEY_ID`
   - `AWS_SECRET_ACCESS_KEY`
   - `DOCKER_USERNAME`
   - `DOCKER_PASSWORD`

2. Push to `main` branch to trigger deployment

### Step 7: SSL/TLS Configuration

Use a reverse proxy (Nginx or Traefik) with Let's Encrypt:

```nginx
server {
    listen 443 ssl http2;
    server_name api.lexnova.com;

    ssl_certificate /etc/letsencrypt/live/api.lexnova.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.lexnova.com/privkey.pem;

    location / {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## 🧪 Testing in Production

### Run Health Checks

```bash
# API health
curl https://api.lexnova.com/health

# Metrics
curl https://api.lexnova.com/metrics

# API docs
open https://api.lexnova.com/docs
```

### Test Authentication

```bash
# Register user
curl -X POST https://api.lexnova.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "securepass123",
    "name": "Test User"
  }'

# Login
curl -X POST https://api.lexnova.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "securepass123"
  }'
```

## 📊 Monitoring Checklist

- [ ] Prometheus scraping metrics
- [ ] Grafana dashboards configured
- [ ] Alert rules set up (high error rate, low availability)
- [ ] Log aggregation (CloudWatch, ELK, etc.)
- [ ] Uptime monitoring (UptimeRobot, Pingdom)

## 🔒 Security Checklist

- [ ] Strong JWT secret key (32+ characters)
- [ ] Database credentials rotated
- [ ] S3 bucket private with IAM policies
- [ ] HTTPS/TLS enabled
- [ ] CORS configured for production domains only
- [ ] Rate limiting enabled
- [ ] API keys stored in secrets manager
- [ ] Regular security updates

## 📈 Scaling Considerations

### Horizontal Scaling

- Run multiple API instances behind a load balancer
- Use managed database with read replicas
- Scale AI agent workers independently

### Performance Optimization

- Enable database connection pooling
- Use Redis for caching
- CDN for static assets
- Optimize database queries

## 🐛 Troubleshooting

### Common Issues

**Database connection errors:**

```bash
# Check connection
psql $DATABASE_URL -c "SELECT 1"

# View logs
docker-compose logs api
```

**AI agent not connecting:**

```bash
# Check LiveKit connectivity
curl -I $LIVEKIT_URL

# View agent logs
docker-compose logs agent
```

**S3 upload failures:**

```bash
# Test AWS credentials
aws s3 ls s3://lexnova-prod-recordings

# Check IAM permissions
aws iam get-user
```

## 📝 Maintenance

### Regular Tasks

- **Daily**: Monitor error rates and performance
- **Weekly**: Review and rotate logs
- **Monthly**: Update dependencies and security patches
- **Quarterly**: Review and optimize costs

### Backup Strategy

- **Database**: Automated daily backups (AWS RDS)
- **S3 Recordings**: Versioning enabled
- **Configuration**: Store in version control

## 🎉 Production Checklist

- [ ] All environment variables configured
- [ ] Database migrated and seeded
- [ ] S3 bucket created and configured
- [ ] Docker images built and deployed
- [ ] Monitoring and alerts active
- [ ] SSL/TLS certificates installed
- [ ] CI/CD pipeline tested
- [ ] Load testing completed
- [ ] Documentation updated
- [ ] Team trained on operations

---

**Your backend is now production-ready! 🚀**
