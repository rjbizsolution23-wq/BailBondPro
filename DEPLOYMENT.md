# BailBondPro Deployment Guide

## Overview

This guide provides comprehensive instructions for deploying BailBondPro across different environments, from local development to production. It covers infrastructure setup, CI/CD pipelines, security configurations, and operational procedures.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Environment Overview](#environment-overview)
- [Local Development](#local-development)
- [Staging Deployment](#staging-deployment)
- [Production Deployment](#production-deployment)
- [Infrastructure as Code](#infrastructure-as-code)
- [CI/CD Pipeline](#cicd-pipeline)
- [Database Deployment](#database-deployment)
- [Security Configuration](#security-configuration)
- [Monitoring Setup](#monitoring-setup)
- [Backup Configuration](#backup-configuration)
- [Troubleshooting](#troubleshooting)

## Prerequisites

### System Requirements

- **Node.js**: 18.x or higher
- **Docker**: 20.x or higher
- **Docker Compose**: 2.x or higher
- **Git**: Latest version
- **SSL Certificates**: For production deployment

### Required Accounts & Services

- **Cloud Provider**: AWS, Azure, or GCP account
- **Domain**: Registered domain for production
- **SSL Certificate**: Let's Encrypt or commercial SSL
- **Email Service**: SendGrid, AWS SES, or similar
- **Payment Gateway**: Stripe account
- **Monitoring**: DataDog, New Relic, or similar

### Development Tools

```bash
# Install required CLI tools
npm install -g @vercel/cli
npm install -g pm2
npm install -g docker-compose

# Install Terraform (for IaC)
brew install terraform  # macOS
# or
sudo apt-get install terraform  # Ubuntu
```

## Environment Overview

### Environment Types

| Environment | Purpose | URL Pattern | Database | Monitoring |
|-------------|---------|-------------|----------|------------|
| Development | Local development | localhost:3000 | Local PostgreSQL | Basic logging |
| Staging | Testing & QA | staging.bailbondpro.com | Staging DB | Full monitoring |
| Production | Live system | bailbondpro.com | Production DB | Full monitoring + alerts |

### Environment Variables

Create environment-specific `.env` files:

```bash
# .env.development
NODE_ENV=development
PORT=3000
DATABASE_URL=postgresql://user:pass@localhost:5432/bailbondpro_dev
REDIS_URL=redis://localhost:6379
JWT_SECRET=dev-secret-key
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
EMAIL_SERVICE_API_KEY=dev-key
LOG_LEVEL=debug

# .env.staging
NODE_ENV=staging
PORT=3000
DATABASE_URL=postgresql://user:pass@staging-db:5432/bailbondpro_staging
REDIS_URL=redis://staging-redis:6379
JWT_SECRET=staging-secret-key
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
EMAIL_SERVICE_API_KEY=staging-key
LOG_LEVEL=info

# .env.production
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://user:pass@prod-db:5432/bailbondpro_prod
REDIS_URL=redis://prod-redis:6379
JWT_SECRET=super-secure-production-secret
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
EMAIL_SERVICE_API_KEY=prod-key
LOG_LEVEL=warn
```

## Local Development

### Quick Start

```bash
# Clone repository
git clone https://github.com/your-org/bailbondpro.git
cd bailbondpro

# Install dependencies
npm install

# Start local services
docker-compose -f docker-compose.dev.yml up -d

# Run database migrations
npm run db:migrate

# Seed development data
npm run db:seed

# Start development server
npm run dev
```

### Docker Development Setup

```yaml
# docker-compose.dev.yml
version: '3.8'

services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: bailbondpro_dev
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

  mailhog:
    image: mailhog/mailhog
    ports:
      - "1025:1025"
      - "8025:8025"

volumes:
  postgres_data:
  redis_data:
```

### Development Scripts

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:e2e": "playwright test",
    "db:migrate": "prisma migrate dev",
    "db:seed": "prisma db seed",
    "db:studio": "prisma studio",
    "lint": "eslint . --ext .ts,.tsx",
    "lint:fix": "eslint . --ext .ts,.tsx --fix",
    "type-check": "tsc --noEmit"
  }
}
```

## Staging Deployment

### Staging Infrastructure

```yaml
# docker-compose.staging.yml
version: '3.8'

services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=staging
    env_file:
      - .env.staging
    depends_on:
      - postgres
      - redis
    restart: unless-stopped

  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: bailbondpro_staging
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_staging:/var/lib/postgresql/data
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    volumes:
      - redis_staging:/data
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/staging.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/ssl/certs
    depends_on:
      - app
    restart: unless-stopped

volumes:
  postgres_staging:
  redis_staging:
```

### Staging Deployment Script

```bash
#!/bin/bash
# deploy-staging.sh

set -e

echo "🚀 Deploying to Staging Environment"

# Pull latest code
git pull origin develop

# Build and deploy
docker-compose -f docker-compose.staging.yml down
docker-compose -f docker-compose.staging.yml build --no-cache
docker-compose -f docker-compose.staging.yml up -d

# Run migrations
docker-compose -f docker-compose.staging.yml exec app npm run db:migrate

# Health check
sleep 30
curl -f http://staging.bailbondpro.com/api/health || exit 1

echo "✅ Staging deployment completed successfully"
```

## Production Deployment

### Production Architecture

```mermaid
graph TB
    A[Load Balancer] --> B[App Server 1]
    A --> C[App Server 2]
    A --> D[App Server 3]
    
    B --> E[Primary Database]
    C --> E
    D --> E
    
    E --> F[Read Replica 1]
    E --> G[Read Replica 2]
    
    B --> H[Redis Cluster]
    C --> H
    D --> H
    
    I[CDN] --> A
    J[Monitoring] --> B
    J --> C
    J --> D
    
    K[Backup Storage] --> E
```

### Production Docker Configuration

```yaml
# docker-compose.prod.yml
version: '3.8'

services:
  app:
    build:
      context: .
      dockerfile: Dockerfile.prod
    deploy:
      replicas: 3
      restart_policy:
        condition: on-failure
        delay: 5s
        max_attempts: 3
    environment:
      - NODE_ENV=production
    env_file:
      - .env.production
    depends_on:
      - postgres
      - redis
    networks:
      - app-network

  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: bailbondpro_prod
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_prod:/var/lib/postgresql/data
      - ./backups:/backups
    networks:
      - app-network
    deploy:
      restart_policy:
        condition: on-failure

  redis:
    image: redis:7-alpine
    command: redis-server --appendonly yes --requirepass ${REDIS_PASSWORD}
    volumes:
      - redis_prod:/data
    networks:
      - app-network
    deploy:
      restart_policy:
        condition: on-failure

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/prod.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/ssl/certs
      - ./logs/nginx:/var/log/nginx
    depends_on:
      - app
    networks:
      - app-network
    deploy:
      restart_policy:
        condition: on-failure

networks:
  app-network:
    driver: overlay

volumes:
  postgres_prod:
  redis_prod:
```

### Production Dockerfile

```dockerfile
# Dockerfile.prod
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

FROM node:18-alpine AS runner

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

WORKDIR /app

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV NODE_ENV production

CMD ["node", "server.js"]
```

### Production Deployment Script

```bash
#!/bin/bash
# deploy-production.sh

set -e

echo "🚀 Deploying to Production Environment"

# Backup current deployment
./scripts/backup-production.sh

# Pull latest stable code
git checkout main
git pull origin main

# Build and test
npm run build
npm run test:prod

# Deploy with zero downtime
docker stack deploy -c docker-compose.prod.yml bailbondpro

# Run migrations
docker exec $(docker ps -q -f name=bailbondpro_app) npm run db:migrate

# Health check
sleep 60
for i in {1..5}; do
  if curl -f https://bailbondpro.com/api/health; then
    echo "✅ Health check passed"
    break
  fi
  echo "⏳ Waiting for health check... ($i/5)"
  sleep 30
done

# Cleanup old images
docker image prune -f

echo "✅ Production deployment completed successfully"
```

## Infrastructure as Code

### Terraform Configuration

```hcl
# main.tf
terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

# VPC Configuration
resource "aws_vpc" "main" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name = "bailbondpro-vpc"
  }
}

# Subnets
resource "aws_subnet" "public" {
  count             = 2
  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.0.${count.index + 1}.0/24"
  availability_zone = data.aws_availability_zones.available.names[count.index]

  map_public_ip_on_launch = true

  tags = {
    Name = "bailbondpro-public-${count.index + 1}"
  }
}

resource "aws_subnet" "private" {
  count             = 2
  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.0.${count.index + 10}.0/24"
  availability_zone = data.aws_availability_zones.available.names[count.index]

  tags = {
    Name = "bailbondpro-private-${count.index + 1}"
  }
}

# RDS Database
resource "aws_db_instance" "main" {
  identifier = "bailbondpro-db"
  
  engine         = "postgres"
  engine_version = "15.4"
  instance_class = "db.t3.medium"
  
  allocated_storage     = 100
  max_allocated_storage = 1000
  storage_type          = "gp2"
  storage_encrypted     = true
  
  db_name  = "bailbondpro"
  username = var.db_username
  password = var.db_password
  
  vpc_security_group_ids = [aws_security_group.rds.id]
  db_subnet_group_name   = aws_db_subnet_group.main.name
  
  backup_retention_period = 7
  backup_window          = "03:00-04:00"
  maintenance_window     = "sun:04:00-sun:05:00"
  
  skip_final_snapshot = false
  final_snapshot_identifier = "bailbondpro-final-snapshot"
  
  tags = {
    Name = "bailbondpro-database"
  }
}

# ElastiCache Redis
resource "aws_elasticache_subnet_group" "main" {
  name       = "bailbondpro-cache-subnet"
  subnet_ids = aws_subnet.private[*].id
}

resource "aws_elasticache_cluster" "main" {
  cluster_id           = "bailbondpro-cache"
  engine               = "redis"
  node_type            = "cache.t3.micro"
  num_cache_nodes      = 1
  parameter_group_name = "default.redis7"
  port                 = 6379
  subnet_group_name    = aws_elasticache_subnet_group.main.name
  security_group_ids   = [aws_security_group.redis.id]
}

# Load Balancer
resource "aws_lb" "main" {
  name               = "bailbondpro-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb.id]
  subnets            = aws_subnet.public[*].id

  enable_deletion_protection = true

  tags = {
    Name = "bailbondpro-alb"
  }
}
```

### Terraform Variables

```hcl
# variables.tf
variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-west-2"
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "production"
}

variable "db_username" {
  description = "Database username"
  type        = string
  sensitive   = true
}

variable "db_password" {
  description = "Database password"
  type        = string
  sensitive   = true
}

variable "domain_name" {
  description = "Domain name for the application"
  type        = string
  default     = "bailbondpro.com"
}
```

## CI/CD Pipeline

### GitHub Actions Workflow

```yaml
# .github/workflows/deploy.yml
name: Deploy BailBondPro

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

env:
  NODE_VERSION: '18'
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }}

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: test_db
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432

    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run linting
        run: npm run lint
      
      - name: Run type checking
        run: npm run type-check
      
      - name: Run unit tests
        run: npm run test
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test_db
      
      - name: Run E2E tests
        run: npm run test:e2e
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test_db

  build:
    needs: test
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build application
        run: npm run build
      
      - name: Log in to Container Registry
        uses: docker/login-action@v3
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}
      
      - name: Extract metadata
        id: meta
        uses: docker/metadata-action@v5
        with:
          images: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}
          tags: |
            type=ref,event=branch
            type=ref,event=pr
            type=sha
      
      - name: Build and push Docker image
        uses: docker/build-push-action@v5
        with:
          context: .
          file: ./Dockerfile.prod
          push: true
          tags: ${{ steps.meta.outputs.tags }}
          labels: ${{ steps.meta.outputs.labels }}

  deploy-staging:
    if: github.ref == 'refs/heads/develop'
    needs: [test, build]
    runs-on: ubuntu-latest
    environment: staging
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Deploy to staging
        run: |
          echo "Deploying to staging environment"
          # Add staging deployment commands here
        env:
          STAGING_HOST: ${{ secrets.STAGING_HOST }}
          STAGING_USER: ${{ secrets.STAGING_USER }}
          STAGING_KEY: ${{ secrets.STAGING_KEY }}

  deploy-production:
    if: github.ref == 'refs/heads/main'
    needs: [test, build]
    runs-on: ubuntu-latest
    environment: production
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Deploy to production
        run: |
          echo "Deploying to production environment"
          # Add production deployment commands here
        env:
          PROD_HOST: ${{ secrets.PROD_HOST }}
          PROD_USER: ${{ secrets.PROD_USER }}
          PROD_KEY: ${{ secrets.PROD_KEY }}
```

## Database Deployment

### Migration Strategy

```typescript
// scripts/migrate.ts
import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';

const prisma = new PrismaClient();

async function runMigrations() {
  try {
    console.log('🔄 Running database migrations...');
    
    // Check database connection
    await prisma.$connect();
    console.log('✅ Database connection established');
    
    // Run migrations
    execSync('npx prisma migrate deploy', { stdio: 'inherit' });
    console.log('✅ Migrations completed successfully');
    
    // Verify migration status
    const migrations = await prisma.$queryRaw`
      SELECT * FROM _prisma_migrations 
      WHERE finished_at IS NULL
    `;
    
    if (Array.isArray(migrations) && migrations.length > 0) {
      throw new Error('Some migrations failed to complete');
    }
    
    console.log('✅ All migrations verified');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runMigrations();
```

### Database Seeding

```typescript
// prisma/seed.ts
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');
  
  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@bailbondpro.com' },
    update: {},
    create: {
      email: 'admin@bailbondpro.com',
      firstName: 'System',
      lastName: 'Administrator',
      password: adminPassword,
      role: 'ADMIN',
      isActive: true,
    },
  });
  
  console.log('✅ Admin user created:', admin.email);
  
  // Create sample data for development
  if (process.env.NODE_ENV === 'development') {
    // Create sample clients
    const sampleClients = await Promise.all([
      prisma.client.create({
        data: {
          firstName: 'John',
          lastName: 'Doe',
          email: 'john.doe@example.com',
          phone: '+1234567890',
          dateOfBirth: new Date('1990-01-15'),
          address: {
            street: '123 Main St',
            city: 'Anytown',
            state: 'CA',
            zip: '12345',
          },
        },
      }),
    ]);
    
    console.log('✅ Sample data created');
  }
  
  console.log('🎉 Database seeding completed');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

## Security Configuration

### SSL/TLS Setup

```nginx
# nginx/prod.conf
server {
    listen 80;
    server_name bailbondpro.com www.bailbondpro.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name bailbondpro.com www.bailbondpro.com;
    
    ssl_certificate /etc/ssl/certs/bailbondpro.com.crt;
    ssl_certificate_key /etc/ssl/private/bailbondpro.com.key;
    
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    
    add_header Strict-Transport-Security "max-age=63072000" always;
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    
    location / {
        proxy_pass http://app:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### Environment Security

```bash
#!/bin/bash
# scripts/secure-env.sh

# Set secure file permissions
chmod 600 .env*
chmod 700 scripts/
chmod 600 ssl/*

# Generate secure secrets
openssl rand -hex 32 > .jwt_secret
openssl rand -hex 32 > .session_secret

# Set up firewall rules
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

echo "✅ Security configuration completed"
```

## Monitoring Setup

### Health Check Endpoint

```typescript
// pages/api/health.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
import Redis from 'ioredis';

const prisma = new PrismaClient();
const redis = new Redis(process.env.REDIS_URL!);

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  const checks = {
    database: false,
    redis: false,
    timestamp: new Date().toISOString(),
  };
  
  try {
    // Database health check
    await prisma.$queryRaw`SELECT 1`;
    checks.database = true;
  } catch (error) {
    console.error('Database health check failed:', error);
  }
  
  try {
    // Redis health check
    await redis.ping();
    checks.redis = true;
  } catch (error) {
    console.error('Redis health check failed:', error);
  }
  
  const isHealthy = checks.database && checks.redis;
  const status = isHealthy ? 200 : 503;
  
  res.status(status).json({
    status: isHealthy ? 'healthy' : 'unhealthy',
    checks,
  });
}
```

### Monitoring Configuration

```yaml
# monitoring/docker-compose.yml
version: '3.8'

services:
  prometheus:
    image: prom/prometheus
    ports:
      - "9090:9090"
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus_data:/prometheus
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
      - '--web.console.libraries=/etc/prometheus/console_libraries'
      - '--web.console.templates=/etc/prometheus/consoles'

  grafana:
    image: grafana/grafana
    ports:
      - "3001:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
    volumes:
      - grafana_data:/var/lib/grafana
      - ./grafana/dashboards:/etc/grafana/provisioning/dashboards
      - ./grafana/datasources:/etc/grafana/provisioning/datasources

volumes:
  prometheus_data:
  grafana_data:
```

## Backup Configuration

### Automated Backup Script

```bash
#!/bin/bash
# scripts/backup-production.sh

set -e

BACKUP_DIR="/backups"
DATE=$(date +%Y%m%d_%H%M%S)
DB_BACKUP_FILE="bailbondpro_${DATE}.sql"
FILES_BACKUP_FILE="bailbondpro_files_${DATE}.tar.gz"

echo "🔄 Starting backup process..."

# Database backup
docker exec bailbondpro_postgres pg_dump -U ${DB_USER} bailbondpro_prod > "${BACKUP_DIR}/${DB_BACKUP_FILE}"
echo "✅ Database backup completed: ${DB_BACKUP_FILE}"

# Files backup
tar -czf "${BACKUP_DIR}/${FILES_BACKUP_FILE}" \
  --exclude='node_modules' \
  --exclude='.git' \
  --exclude='logs' \
  /app

echo "✅ Files backup completed: ${FILES_BACKUP_FILE}"

# Upload to S3 (optional)
if [ ! -z "$AWS_S3_BUCKET" ]; then
  aws s3 cp "${BACKUP_DIR}/${DB_BACKUP_FILE}" "s3://${AWS_S3_BUCKET}/backups/"
  aws s3 cp "${BACKUP_DIR}/${FILES_BACKUP_FILE}" "s3://${AWS_S3_BUCKET}/backups/"
  echo "✅ Backups uploaded to S3"
fi

# Cleanup old backups (keep last 7 days)
find ${BACKUP_DIR} -name "bailbondpro_*.sql" -mtime +7 -delete
find ${BACKUP_DIR} -name "bailbondpro_files_*.tar.gz" -mtime +7 -delete

echo "🎉 Backup process completed successfully"
```

## Troubleshooting

### Common Deployment Issues

#### 1. Database Connection Issues

```bash
# Check database connectivity
docker exec -it bailbondpro_postgres psql -U postgres -d bailbondpro_prod

# Check database logs
docker logs bailbondpro_postgres

# Test connection from app
docker exec -it bailbondpro_app npm run db:test-connection
```

#### 2. SSL Certificate Issues

```bash
# Check certificate validity
openssl x509 -in /etc/ssl/certs/bailbondpro.com.crt -text -noout

# Test SSL configuration
curl -I https://bailbondpro.com

# Renew Let's Encrypt certificate
certbot renew --nginx
```

#### 3. Memory Issues

```bash
# Check memory usage
docker stats

# Increase Node.js memory limit
NODE_OPTIONS="--max-old-space-size=4096" npm start

# Monitor memory leaks
docker exec -it bailbondpro_app node --inspect=0.0.0.0:9229 server.js
```

### Rollback Procedures

```bash
#!/bin/bash
# scripts/rollback.sh

set -e

PREVIOUS_VERSION=$1

if [ -z "$PREVIOUS_VERSION" ]; then
  echo "Usage: ./rollback.sh <previous_version>"
  exit 1
fi

echo "🔄 Rolling back to version: $PREVIOUS_VERSION"

# Stop current deployment
docker stack rm bailbondpro

# Deploy previous version
git checkout $PREVIOUS_VERSION
docker stack deploy -c docker-compose.prod.yml bailbondpro

# Verify rollback
sleep 60
curl -f https://bailbondpro.com/api/health || exit 1

echo "✅ Rollback completed successfully"
```

### Performance Optimization

```bash
#!/bin/bash
# scripts/optimize-production.sh

# Enable gzip compression
echo "Enabling gzip compression..."
docker exec bailbondpro_nginx nginx -s reload

# Optimize database
echo "Optimizing database..."
docker exec bailbondpro_postgres psql -U postgres -d bailbondpro_prod -c "VACUUM ANALYZE;"

# Clear Redis cache
echo "Clearing Redis cache..."
docker exec bailbondpro_redis redis-cli FLUSHALL

# Restart application with optimizations
echo "Restarting application..."
docker service update --force bailbondpro_app

echo "✅ Performance optimization completed"
```

## Conclusion

This deployment guide provides comprehensive instructions for deploying BailBondPro across different environments. Key points to remember:

1. **Security First**: Always use HTTPS, secure environment variables, and follow security best practices
2. **Monitoring**: Implement comprehensive monitoring and alerting from day one
3. **Backup Strategy**: Regular automated backups with tested restore procedures
4. **CI/CD Pipeline**: Automated testing and deployment for consistent releases
5. **Documentation**: Keep deployment procedures documented and up-to-date

For additional support or questions about deployment, refer to the [troubleshooting section](#troubleshooting) or contact the development team.

---

**Next Steps:**
- Set up monitoring dashboards
- Configure automated backups
- Implement security scanning
- Set up performance monitoring
- Create disaster recovery procedures
      max: 20,
      min: 5,
      acquire: 30000,
      idle: 10000
    }
  }
};
```

#### Redis Configuration
```javascript
// config/redis.js
module.exports = {
  development: {
    host: 'localhost',
    port: 6379,
    db: 0
  },
  staging: {
    url: process.env.REDIS_URL,
    retryDelayOnFailover: 100,
    maxRetriesPerRequest: 3
  },
  production: {
    url: process.env.REDIS_URL,
    retryDelayOnFailover: 100,
    maxRetriesPerRequest: 3,
    lazyConnect: true
  }
};
```

## Local Development

### Quick Start

```bash
# Clone the repository
git clone https://github.com/your-org/bailbondpro.git
cd bailbondpro

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local

# Start database and Redis (using Docker)
docker-compose up -d postgres redis

# Run database migrations
npm run db:migrate

# Seed the database (optional)
npm run db:seed

# Start the development server
npm run dev
```

### Development Services

#### Start All Services
```bash
# Using Docker Compose
docker-compose up -d

# Or start services individually
npm run dev:db      # Start PostgreSQL
npm run dev:redis   # Start Redis
npm run dev:server  # Start application server
npm run dev:client  # Start client development server
```

#### Database Operations
```bash
# Create migration
npm run db:migration:create -- --name create-users-table

# Run migrations
npm run db:migrate

# Rollback migration
npm run db:migrate:undo

# Seed database
npm run db:seed

# Reset database
npm run db:reset
```

## Staging Deployment

### Manual Deployment

#### 1. Server Setup
```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PostgreSQL
sudo apt install postgresql postgresql-contrib

# Install Redis
sudo apt install redis-server

# Install PM2 for process management
sudo npm install -g pm2
```

#### 2. Application Deployment
```bash
# Clone repository
git clone https://github.com/your-org/bailbondpro.git
cd bailbondpro

# Install dependencies
npm ci --only=production

# Build application
npm run build

# Set up environment variables
cp .env.example .env.staging
# Edit .env.staging with staging-specific values

# Run database migrations
npm run db:migrate

# Start application with PM2
pm2 start ecosystem.config.js --env staging
pm2 save
pm2 startup
```

#### 3. Nginx Configuration
```nginx
# /etc/nginx/sites-available/bailbondpro-staging
server {
    listen 80;
    server_name staging.bailbondpro.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### Automated Deployment

#### GitHub Actions Workflow
```yaml
# .github/workflows/deploy-staging.yml
name: Deploy to Staging

on:
  push:
    branches: [develop]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run tests
        run: npm test
      
      - name: Build application
        run: npm run build
      
      - name: Deploy to staging
        uses: appleboy/ssh-action@v0.1.5
        with:
          host: ${{ secrets.STAGING_HOST }}
          username: ${{ secrets.STAGING_USER }}
          key: ${{ secrets.STAGING_SSH_KEY }}
          script: |
            cd /var/www/bailbondpro
            git pull origin develop
            npm ci --only=production
            npm run build
            npm run db:migrate
            pm2 reload ecosystem.config.js --env staging
```

## Production Deployment

### High Availability Setup

#### Load Balancer Configuration
```nginx
# /etc/nginx/nginx.conf
upstream bailbondpro_backend {
    least_conn;
    server 10.0.1.10:3000 weight=1 max_fails=3 fail_timeout=30s;
    server 10.0.1.11:3000 weight=1 max_fails=3 fail_timeout=30s;
    server 10.0.1.12:3000 weight=1 max_fails=3 fail_timeout=30s;
}

server {
    listen 443 ssl http2;
    server_name bailbondpro.com www.bailbondpro.com;

    ssl_certificate /etc/ssl/certs/bailbondpro.crt;
    ssl_certificate_key /etc/ssl/private/bailbondpro.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512;

    location / {
        proxy_pass http://bailbondpro_backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Health check
        proxy_next_upstream error timeout invalid_header http_500 http_502 http_503;
        proxy_connect_timeout 5s;
        proxy_send_timeout 10s;
        proxy_read_timeout 10s;
    }
}
```

#### Database Clustering
```bash
# PostgreSQL Master-Slave Setup
# Master configuration (postgresql.conf)
wal_level = replica
max_wal_senders = 3
wal_keep_segments = 64
archive_mode = on
archive_command = 'cp %p /var/lib/postgresql/archive/%f'

# Slave configuration
standby_mode = 'on'
primary_conninfo = 'host=master-ip port=5432 user=replicator'
restore_command = 'cp /var/lib/postgresql/archive/%f %p'
```

### Blue-Green Deployment

#### Deployment Script
```bash
#!/bin/bash
# deploy-production.sh

set -e

BLUE_PORT=3000
GREEN_PORT=3001
CURRENT_PORT=$(curl -s http://localhost/health | jq -r '.port' || echo $BLUE_PORT)

if [ "$CURRENT_PORT" = "$BLUE_PORT" ]; then
    DEPLOY_PORT=$GREEN_PORT
    SWITCH_FROM=$BLUE_PORT
else
    DEPLOY_PORT=$BLUE_PORT
    SWITCH_FROM=$GREEN_PORT
fi

echo "Deploying to port $DEPLOY_PORT"

# Deploy to inactive environment
PORT=$DEPLOY_PORT npm run build
PORT=$DEPLOY_PORT pm2 start ecosystem.config.js --name "bailbondpro-$DEPLOY_PORT"

# Health check
sleep 10
if curl -f http://localhost:$DEPLOY_PORT/health; then
    echo "Health check passed, switching traffic"
    
    # Update load balancer
    sed -i "s/:$SWITCH_FROM/:$DEPLOY_PORT/g" /etc/nginx/sites-available/bailbondpro
    nginx -s reload
    
    # Stop old version
    sleep 30
    pm2 stop "bailbondpro-$SWITCH_FROM"
    pm2 delete "bailbondpro-$SWITCH_FROM"
    
    echo "Deployment successful"
else
    echo "Health check failed, rolling back"
    pm2 stop "bailbondpro-$DEPLOY_PORT"
    pm2 delete "bailbondpro-$DEPLOY_PORT"
    exit 1
fi
```

## Docker Deployment

### Dockerfile
```dockerfile
# Dockerfile
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

FROM node:18-alpine AS runner

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

WORKDIR /app

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000

CMD ["node", "server.js"]
```

### Docker Compose
```yaml
# docker-compose.prod.yml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://user:pass@postgres:5432/bailbondpro
      - REDIS_URL=redis://redis:6379
    depends_on:
      - postgres
      - redis
    restart: unless-stopped

  postgres:
    image: postgres:13
    environment:
      POSTGRES_DB: bailbondpro
      POSTGRES_USER: user
      POSTGRES_PASSWORD: password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped

  redis:
    image: redis:6-alpine
    volumes:
      - redis_data:/data
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/ssl
    depends_on:
      - app
    restart: unless-stopped

volumes:
  postgres_data:
  redis_data:
```

### Kubernetes Deployment
```yaml
# k8s/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: bailbondpro
spec:
  replicas: 3
  selector:
    matchLabels:
      app: bailbondpro
  template:
    metadata:
      labels:
        app: bailbondpro
    spec:
      containers:
      - name: bailbondpro
        image: bailbondpro:latest
        ports:
        - containerPort: 3000
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: bailbondpro-secrets
              key: database-url
        - name: REDIS_URL
          valueFrom:
            secretKeyRef:
              name: bailbondpro-secrets
              key: redis-url
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /ready
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5
---
apiVersion: v1
kind: Service
metadata:
  name: bailbondpro-service
spec:
  selector:
    app: bailbondpro
  ports:
  - port: 80
    targetPort: 3000
  type: LoadBalancer
```

## Cloud Deployments

### AWS Deployment

#### Using AWS ECS
```json
{
  "family": "bailbondpro",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "512",
  "memory": "1024",
  "executionRoleArn": "arn:aws:iam::account:role/ecsTaskExecutionRole",
  "taskRoleArn": "arn:aws:iam::account:role/ecsTaskRole",
  "containerDefinitions": [
    {
      "name": "bailbondpro",
      "image": "your-account.dkr.ecr.region.amazonaws.com/bailbondpro:latest",
      "portMappings": [
        {
          "containerPort": 3000,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "NODE_ENV",
          "value": "production"
        }
      ],
      "secrets": [
        {
          "name": "DATABASE_URL",
          "valueFrom": "arn:aws:secretsmanager:region:account:secret:bailbondpro/database-url"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/bailbondpro",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "ecs"
        }
      }
    }
  ]
}
```

#### Terraform Configuration
```hcl
# terraform/main.tf
provider "aws" {
  region = "us-east-1"
}

resource "aws_ecs_cluster" "bailbondpro" {
  name = "bailbondpro"
}

resource "aws_ecs_service" "bailbondpro" {
  name            = "bailbondpro"
  cluster         = aws_ecs_cluster.bailbondpro.id
  task_definition = aws_ecs_task_definition.bailbondpro.arn
  desired_count   = 3
  launch_type     = "FARGATE"

  network_configuration {
    subnets         = var.subnet_ids
    security_groups = [aws_security_group.bailbondpro.id]
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.bailbondpro.arn
    container_name   = "bailbondpro"
    container_port   = 3000
  }
}
```

### Vercel Deployment

#### vercel.json
```json
{
  "version": 2,
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/next"
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "/api/$1"
    },
    {
      "src": "/(.*)",
      "dest": "/$1"
    }
  ],
  "env": {
    "NODE_ENV": "production"
  },
  "functions": {
    "pages/api/**/*.js": {
      "maxDuration": 30
    }
  }
}
```

#### Deployment Commands
```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy to preview
vercel

# Deploy to production
vercel --prod

# Set environment variables
vercel env add DATABASE_URL production
vercel env add REDIS_URL production
```

### Railway Deployment

#### railway.json
```json
{
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "npm start",
    "healthcheckPath": "/health",
    "healthcheckTimeout": 100,
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

## Database Setup

### PostgreSQL Setup

#### Production Configuration
```sql
-- Create database and user
CREATE DATABASE bailbondpro_production;
CREATE USER bailbondpro WITH ENCRYPTED PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE bailbondpro_production TO bailbondpro;

-- Performance tuning
ALTER SYSTEM SET shared_buffers = '256MB';
ALTER SYSTEM SET effective_cache_size = '1GB';
ALTER SYSTEM SET maintenance_work_mem = '64MB';
ALTER SYSTEM SET checkpoint_completion_target = 0.9;
ALTER SYSTEM SET wal_buffers = '16MB';
ALTER SYSTEM SET default_statistics_target = 100;
ALTER SYSTEM SET random_page_cost = 1.1;
ALTER SYSTEM SET effective_io_concurrency = 200;

-- Reload configuration
SELECT pg_reload_conf();
```

#### Backup Strategy
```bash
#!/bin/bash
# backup-db.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/var/backups/postgresql"
DB_NAME="bailbondpro_production"

# Create backup directory
mkdir -p $BACKUP_DIR

# Create backup
pg_dump -h localhost -U bailbondpro -d $DB_NAME | gzip > $BACKUP_DIR/bailbondpro_$DATE.sql.gz

# Upload to S3
aws s3 cp $BACKUP_DIR/bailbondpro_$DATE.sql.gz s3://bailbondpro-backups/database/

# Clean up old backups (keep last 30 days)
find $BACKUP_DIR -name "bailbondpro_*.sql.gz" -mtime +30 -delete

# Clean up old S3 backups
aws s3 ls s3://bailbondpro-backups/database/ | while read -r line; do
  createDate=$(echo $line | awk '{print $1" "$2}')
  createDate=$(date -d "$createDate" +%s)
  olderThan=$(date -d "30 days ago" +%s)
  if [[ $createDate -lt $olderThan ]]; then
    fileName=$(echo $line | awk '{print $4}')
    aws s3 rm s3://bailbondpro-backups/database/$fileName
  fi
done
```

### Redis Setup

#### Production Configuration
```conf
# /etc/redis/redis.conf

# Network
bind 127.0.0.1
port 6379
protected-mode yes

# General
daemonize yes
supervised systemd
pidfile /var/run/redis/redis-server.pid
loglevel notice
logfile /var/log/redis/redis-server.log

# Snapshotting
save 900 1
save 300 10
save 60 10000
stop-writes-on-bgsave-error yes
rdbcompression yes
rdbchecksum yes
dbfilename dump.rdb
dir /var/lib/redis

# Security
requirepass your_secure_redis_password

# Memory
maxmemory 256mb
maxmemory-policy allkeys-lru

# Append only file
appendonly yes
appendfilename "appendonly.aof"
appendfsync everysec
```

## Monitoring & Logging

### Application Monitoring

#### Health Check Endpoint
```javascript
// pages/api/health.js
export default function handler(req, res) {
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.env.npm_package_version,
    environment: process.env.NODE_ENV,
    port: process.env.PORT || 3000
  };

  // Check database connection
  try {
    // Add database health check
    health.database = 'connected';
  } catch (error) {
    health.database = 'disconnected';
    health.status = 'error';
  }

  // Check Redis connection
  try {
    // Add Redis health check
    health.redis = 'connected';
  } catch (error) {
    health.redis = 'disconnected';
    health.status = 'error';
  }

  const statusCode = health.status === 'ok' ? 200 : 503;
  res.status(statusCode).json(health);
}
```

#### Prometheus Metrics
```javascript
// lib/metrics.js
const client = require('prom-client');

// Create a Registry
const register = new client.Registry();

// Add default metrics
client.collectDefaultMetrics({ register });

// Custom metrics
const httpRequestDuration = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10]
});

const httpRequestTotal = new client.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code']
});

register.registerMetric(httpRequestDuration);
register.registerMetric(httpRequestTotal);

module.exports = { register, httpRequestDuration, httpRequestTotal };
```

### Logging Configuration

#### Winston Logger Setup
```javascript
// lib/logger.js
const winston = require('winston');

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'bailbondpro' },
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' })
  ]
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}

module.exports = logger;
```

#### Log Rotation
```bash
# /etc/logrotate.d/bailbondpro
/var/log/bailbondpro/*.log {
    daily
    missingok
    rotate 52
    compress
    delaycompress
    notifempty
    create 644 bailbondpro bailbondpro
    postrotate
        systemctl reload bailbondpro
    endscript
}
```

## Troubleshooting

### Common Issues

#### Database Connection Issues
```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Check PostgreSQL logs
sudo tail -f /var/log/postgresql/postgresql-13-main.log

# Test connection
psql -h localhost -U bailbondpro -d bailbondpro_production -c "SELECT 1;"
```

#### Redis Connection Issues
```bash
# Check Redis status
sudo systemctl status redis

# Test Redis connection
redis-cli ping

# Check Redis logs
sudo tail -f /var/log/redis/redis-server.log
```

#### Application Issues
```bash
# Check application logs
pm2 logs bailbondpro

# Check system resources
htop
df -h
free -m

# Check network connectivity
netstat -tlnp | grep :3000
```

### Performance Optimization

#### Database Optimization
```sql
-- Analyze query performance
EXPLAIN ANALYZE SELECT * FROM users WHERE email = 'user@example.com';

-- Update table statistics
ANALYZE users;

-- Reindex tables
REINDEX TABLE users;

-- Check for slow queries
SELECT query, mean_time, calls 
FROM pg_stat_statements 
ORDER BY mean_time DESC 
LIMIT 10;
```

#### Application Optimization
```bash
# Profile application
npm run build:analyze

# Check bundle size
npm run bundle-analyzer

# Monitor memory usage
node --inspect server.js
```

### Rollback Procedures

#### Application Rollback
```bash
# Using PM2
pm2 stop bailbondpro
git checkout previous-stable-tag
npm ci --only=production
npm run build
pm2 start bailbondpro

# Using Docker
docker stop bailbondpro-current
docker run -d --name bailbondpro-rollback bailbondpro:previous-tag
```

#### Database Rollback
```bash
# Rollback migration
npm run db:migrate:undo

# Restore from backup
gunzip -c /var/backups/postgresql/bailbondpro_20240115_120000.sql.gz | psql -U bailbondpro -d bailbondpro_production
```

## Support

For deployment support and questions:

- **Documentation**: https://docs.bailbondpro.com/deployment
- **Support Email**: support@bailbondpro.com
- **Emergency**: +1 (555) 911-SUPPORT (24/7)
- **Slack**: #deployment-support

---

**Last Updated**: January 2024  
**Version**: 1.0  
**Next Review**: July 2024