# ============================================================================
# BailBondPro - Production Docker Configuration
# Multi-stage build optimized for security, performance, and scalability
# ============================================================================

# ============================================================================
# Stage 1: Base Dependencies
# ============================================================================
FROM node:20-alpine AS base
LABEL maintainer="Rick Jefferson <support@rjbizsolution.com>"
LABEL description="BailBondPro - Professional Bail Bond Management System"
LABEL version="1.0.0"

# Security: Install security updates and essential packages
RUN apk update && apk upgrade && apk add --no-cache \
    libc6-compat \
    dumb-init \
    curl \
    ca-certificates \
    openssl \
    && rm -rf /var/cache/apk/*

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Set working directory
WORKDIR /app

# Install pnpm globally
RUN npm install -g pnpm@latest

# Copy package files
COPY package.json pnpm-lock.yaml* ./
COPY tsconfig.json ./
COPY drizzle.config.ts ./
COPY client/package.json ./client/
COPY server/package.json ./server/

# ============================================================================
# Stage 2: Dependencies Installation
# ============================================================================
FROM base AS deps

# Copy package files for dependency installation
COPY --from=base /app/package.json /app/pnpm-lock.yaml* ./
COPY --from=base /app/client/package.json ./client/
COPY --from=base /app/server/package.json ./server/

# Install production dependencies
RUN pnpm install --frozen-lockfile --production=false

# Clean pnpm cache to reduce image size
RUN pnpm store prune

# ============================================================================
# Stage 3: Build Application
# ============================================================================
FROM base AS builder

# Install pnpm
RUN npm install -g pnpm@latest

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/client/node_modules ./client/node_modules
COPY --from=deps /app/server/node_modules ./server/node_modules

# Copy source code
COPY . .

# Set build environment
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Build client and server applications
RUN pnpm build:client
RUN pnpm build:server

# Generate database schema (if using Drizzle)
RUN pnpm db:generate || echo "No database generation needed"

# Create production build summary
RUN echo "Build completed successfully" > /app/build-summary.txt
RUN echo "Client build: $(ls -la client/dist 2>/dev/null | wc -l) files" >> /app/build-summary.txt
RUN echo "Server build: $(ls -la server/dist 2>/dev/null | wc -l) files" >> /app/build-summary.txt

# ============================================================================
# Stage 4: Production Runtime
# ============================================================================
FROM node:20-alpine AS runner

# Security: Install security updates and runtime dependencies
RUN apk update && apk upgrade && apk add --no-cache \
    dumb-init \
    curl \
    ca-certificates \
    && rm -rf /var/cache/apk/*

# Create app user for security
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Set working directory
WORKDIR /app

# Install pnpm
RUN npm install -g pnpm@latest

# Copy production dependencies
COPY --from=deps --chown=nextjs:nodejs /app/node_modules ./node_modules

# Copy built applications
COPY --from=builder --chown=nextjs:nodejs /app/dist ./dist
COPY --from=builder --chown=nextjs:nodejs /app/client/dist ./client/dist
COPY --from=builder --chown=nextjs:nodejs /app/server/dist ./server/dist

# Copy necessary configuration files
COPY --from=builder --chown=nextjs:nodejs /app/package.json ./package.json
COPY --from=builder --chown=nextjs:nodejs /app/drizzle.config.ts ./drizzle.config.ts
COPY --from=builder --chown=nextjs:nodejs /app/build-summary.txt ./build-summary.txt

# Copy additional server assets
COPY --chown=nextjs:nodejs server/public ./server/public
COPY --chown=nextjs:nodejs server/assets ./server/assets
COPY --chown=nextjs:nodejs server/locales ./server/locales
COPY --chown=nextjs:nodejs server/templates ./server/templates

# Create necessary directories with proper permissions
RUN mkdir -p uploads logs temp backups && \
    chown -R nextjs:nodejs uploads logs temp backups && \
    chmod 755 uploads logs temp backups

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
ENV NEXT_TELEMETRY_DISABLED=1

# Expose port
EXPOSE 3000

# Switch to non-root user
USER nextjs

# Enhanced health check script
COPY --chown=nextjs:nodejs <<EOF /app/healthcheck.js
const http = require('http');
const fs = require('fs');

const options = {
  hostname: 'localhost',
  port: process.env.PORT || 3000,
  path: '/health',
  method: 'GET',
  timeout: 10000
};

const req = http.request(options, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    if (res.statusCode === 200) {
      console.log('✅ Health check passed');
      process.exit(0);
    } else {
      console.error(\`❌ Health check failed with status: \${res.statusCode}\`);
      console.error(\`Response: \${data}\`);
      process.exit(1);
    }
  });
});

req.on('error', (err) => {
  console.error(\`❌ Health check error: \${err.message}\`);
  process.exit(1);
});

req.on('timeout', () => {
  console.error('❌ Health check timeout');
  req.destroy();
  process.exit(1);
});

req.end();
EOF

# Health check with improved configuration
HEALTHCHECK --interval=30s --timeout=15s --start-period=60s --retries=3 \
    CMD node /app/healthcheck.js

# Start application with dumb-init for proper signal handling
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "server/dist/index.js"]

# ============================================================================
# Development Stage (Optional)
# ============================================================================
FROM base AS development

# Install pnpm
RUN npm install -g pnpm@latest

# Install all dependencies including dev
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/client/node_modules ./client/node_modules
COPY --from=deps /app/server/node_modules ./server/node_modules

# Copy source code
COPY . .

# Create development directories
RUN mkdir -p uploads logs temp && \
    chown -R nextjs:nodejs uploads logs temp

# Set development environment
ENV NODE_ENV=development
ENV PORT=3000
ENV VITE_PORT=5173

# Switch to non-root user for development
USER nextjs

# Expose ports for development
EXPOSE 3000 5173 3001

# Development health check
HEALTHCHECK --interval=60s --timeout=10s --start-period=30s --retries=2 \
    CMD curl -f http://localhost:3000/health || curl -f http://localhost:5173 || exit 1

# Start development server
CMD ["pnpm", "dev"]

# ============================================================================
# Comprehensive Metadata and Labels
# ============================================================================
LABEL maintainer="Rick Jefferson <support@rjbizsolution.com>"
LABEL version="1.0.0"
LABEL description="BailBondPro - Professional Bail Bond Management System"
LABEL org.opencontainers.image.title="BailBondPro"
LABEL org.opencontainers.image.description="Professional Bail Bond Management System with AI-powered features"
LABEL org.opencontainers.image.version="1.0.0"
LABEL org.opencontainers.image.authors="Rick Jefferson <support@rjbizsolution.com>"
LABEL org.opencontainers.image.url="https://bailbondpro.com"
LABEL org.opencontainers.image.source="https://github.com/kalivibecoding/BailBondPro"
LABEL org.opencontainers.image.documentation="https://github.com/kalivibecoding/BailBondPro/wiki"
LABEL org.opencontainers.image.vendor="Rick Jefferson Solutions"
LABEL org.opencontainers.image.licenses="MIT"
LABEL org.opencontainers.image.created="2024-01-01T00:00:00Z"
LABEL org.opencontainers.image.revision="main"
LABEL com.bailbondpro.build.node-version="20"
LABEL com.bailbondpro.build.pnpm-version="latest"
LABEL com.bailbondpro.runtime.port="3000"
LABEL com.bailbondpro.security.user="nextjs"
LABEL com.bailbondpro.features="ai-powered,real-time,secure,scalable"