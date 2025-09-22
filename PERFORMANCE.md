# Performance Guide for BailBondPro

This document outlines performance optimization strategies, monitoring practices, and best practices for maintaining optimal performance in the BailBondPro bail bond management system.

## Table of Contents

- [Performance Philosophy](#performance-philosophy)
- [Performance Metrics](#performance-metrics)
- [Frontend Performance](#frontend-performance)
- [Backend Performance](#backend-performance)
- [Database Optimization](#database-optimization)
- [Caching Strategies](#caching-strategies)
- [Monitoring and Observability](#monitoring-and-observability)
- [Load Testing](#load-testing)
- [Performance Budgets](#performance-budgets)
- [Optimization Checklist](#optimization-checklist)
- [Troubleshooting](#troubleshooting)

## Performance Philosophy

### Core Principles

1. **User-Centric**: Optimize for user experience and perceived performance
2. **Measure First**: Always measure before optimizing
3. **Progressive Enhancement**: Build fast by default, enhance progressively
4. **Continuous Monitoring**: Monitor performance continuously in production
5. **Performance Budget**: Set and maintain performance budgets

### Performance Goals

| Metric | Target | Measurement |
|--------|--------|-------------|
| First Contentful Paint (FCP) | < 1.5s | Lighthouse |
| Largest Contentful Paint (LCP) | < 2.5s | Core Web Vitals |
| First Input Delay (FID) | < 100ms | Core Web Vitals |
| Cumulative Layout Shift (CLS) | < 0.1 | Core Web Vitals |
| Time to Interactive (TTI) | < 3s | Lighthouse |
| API Response Time | < 200ms | 95th percentile |
| Database Query Time | < 50ms | Average |

## Performance Metrics

### Core Web Vitals

**Largest Contentful Paint (LCP)**
- Measures loading performance
- Target: < 2.5 seconds
- Optimization: Optimize images, reduce server response times, eliminate render-blocking resources

**First Input Delay (FID)**
- Measures interactivity
- Target: < 100 milliseconds
- Optimization: Minimize JavaScript execution time, code splitting, web workers

**Cumulative Layout Shift (CLS)**
- Measures visual stability
- Target: < 0.1
- Optimization: Set dimensions for images/videos, avoid inserting content above existing content

### Additional Metrics

**Time to First Byte (TTFB)**
- Server response time
- Target: < 200ms
- Optimization: CDN, server optimization, database optimization

**Speed Index**
- How quickly content is visually displayed
- Target: < 3s
- Optimization: Critical CSS, progressive loading

## Frontend Performance

### React Optimization

**Component Optimization**
```typescript
// Use React.memo for expensive components
const ExpensiveBondList = React.memo(({ bonds, onBondClick }) => {
  return (
    <div>
      {bonds.map(bond => (
        <BondCard key={bond.id} bond={bond} onClick={onBondClick} />
      ))}
    </div>
  )
}, (prevProps, nextProps) => {
  // Custom comparison function
  return prevProps.bonds.length === nextProps.bonds.length &&
         prevProps.bonds.every((bond, index) => 
           bond.id === nextProps.bonds[index].id
         )
})

// Use useMemo for expensive calculations
const BondSummary = ({ bonds }) => {
  const summary = useMemo(() => {
    return bonds.reduce((acc, bond) => ({
      totalAmount: acc.totalAmount + bond.amount,
      activeBonds: acc.activeBonds + (bond.status === 'active' ? 1 : 0),
      totalFees: acc.totalFees + bond.fees
    }), { totalAmount: 0, activeBonds: 0, totalFees: 0 })
  }, [bonds])

  return <div>{/* Render summary */}</div>
}

// Use useCallback for event handlers
const BondManager = () => {
  const [bonds, setBonds] = useState([])

  const handleBondUpdate = useCallback((bondId, updates) => {
    setBonds(prevBonds => 
      prevBonds.map(bond => 
        bond.id === bondId ? { ...bond, ...updates } : bond
      )
    )
  }, [])

  return <BondList bonds={bonds} onUpdate={handleBondUpdate} />
}
```

**Code Splitting**
```typescript
// Route-based code splitting
import { lazy, Suspense } from 'react'

const BondDetails = lazy(() => import('./components/BondDetails'))
const ClientManagement = lazy(() => import('./pages/ClientManagement'))
const Reports = lazy(() => import('./pages/Reports'))

function App() {
  return (
    <Router>
      <Suspense fallback={<LoadingSpinner />}>
        <Routes>
          <Route path="/bonds/:id" element={<BondDetails />} />
          <Route path="/clients" element={<ClientManagement />} />
          <Route path="/reports" element={<Reports />} />
        </Routes>
      </Suspense>
    </Router>
  )
}

// Component-based code splitting
const HeavyChart = lazy(() => 
  import('./HeavyChart').then(module => ({ default: module.HeavyChart }))
)
```

**Virtual Scrolling**
```typescript
// For large lists of bonds/clients
import { FixedSizeList as List } from 'react-window'

const BondList = ({ bonds }) => {
  const Row = ({ index, style }) => (
    <div style={style}>
      <BondCard bond={bonds[index]} />
    </div>
  )

  return (
    <List
      height={600}
      itemCount={bonds.length}
      itemSize={120}
      width="100%"
    >
      {Row}
    </List>
  )
}
```

### Bundle Optimization

**Webpack Configuration**
```javascript
// webpack.config.js
const path = require('path')

module.exports = {
  optimization: {
    splitChunks: {
      chunks: 'all',
      cacheGroups: {
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          chunks: 'all',
        },
        common: {
          name: 'common',
          minChunks: 2,
          chunks: 'all',
          enforce: true,
        },
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
}
```

**Tree Shaking**
```typescript
// Import only what you need
import { format } from 'date-fns' // ✅ Good
import * as dateFns from 'date-fns' // ❌ Bad

// Use ES modules
export const calculateBondAmount = (amount) => amount * 0.1 // ✅ Good
module.exports = { calculateBondAmount } // ❌ Bad for tree shaking
```

### Image Optimization

```typescript
// Next.js Image component
import Image from 'next/image'

const ClientPhoto = ({ client }) => (
  <Image
    src={client.photoUrl}
    alt={`${client.name} photo`}
    width={150}
    height={150}
    placeholder="blur"
    blurDataURL="data:image/jpeg;base64,..."
    priority={client.isPriority}
  />
)

// Responsive images
const DocumentPreview = ({ document }) => (
  <picture>
    <source
      media="(min-width: 768px)"
      srcSet={`${document.url}?w=800 1x, ${document.url}?w=1600 2x`}
    />
    <source
      media="(max-width: 767px)"
      srcSet={`${document.url}?w=400 1x, ${document.url}?w=800 2x`}
    />
    <img
      src={`${document.url}?w=400`}
      alt={document.title}
      loading="lazy"
    />
  </picture>
)
```

## Backend Performance

### API Optimization

**Response Optimization**
```typescript
// Efficient pagination
export async function getBonds(req: Request, res: Response) {
  const { page = 1, limit = 20, cursor } = req.query

  // Cursor-based pagination for better performance
  const bonds = await prisma.bond.findMany({
    take: Number(limit),
    ...(cursor && { 
      cursor: { id: cursor as string },
      skip: 1 
    }),
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      clientId: true,
      amount: true,
      status: true,
      createdAt: true,
      client: {
        select: {
          id: true,
          name: true,
          phone: true
        }
      }
    }
  })

  // Add pagination metadata
  const hasMore = bonds.length === Number(limit)
  const nextCursor = hasMore ? bonds[bonds.length - 1].id : null

  res.json({
    data: bonds,
    pagination: {
      hasMore,
      nextCursor,
      limit: Number(limit)
    }
  })
}

// Field selection to reduce payload
export async function getBondDetails(req: Request, res: Response) {
  const { id } = req.params
  const { include } = req.query

  const includeOptions = {
    client: include?.includes('client'),
    payments: include?.includes('payments'),
    documents: include?.includes('documents')
  }

  const bond = await prisma.bond.findUnique({
    where: { id },
    include: includeOptions
  })

  res.json(bond)
}
```

**Request Batching**
```typescript
// GraphQL-style field resolution
export async function getBondsWithDetails(bondIds: string[]) {
  // Batch database queries
  const [bonds, clients, payments] = await Promise.all([
    prisma.bond.findMany({
      where: { id: { in: bondIds } }
    }),
    prisma.client.findMany({
      where: { bonds: { some: { id: { in: bondIds } } } }
    }),
    prisma.payment.findMany({
      where: { bondId: { in: bondIds } }
    })
  ])

  // Combine results efficiently
  return bonds.map(bond => ({
    ...bond,
    client: clients.find(c => c.id === bond.clientId),
    payments: payments.filter(p => p.bondId === bond.id)
  }))
}

// DataLoader pattern for N+1 query prevention
import DataLoader from 'dataloader'

const clientLoader = new DataLoader(async (clientIds: string[]) => {
  const clients = await prisma.client.findMany({
    where: { id: { in: clientIds } }
  })
  
  return clientIds.map(id => clients.find(client => client.id === id))
})

// Usage in resolver
const bond = await getBond(bondId)
const client = await clientLoader.load(bond.clientId)
```

### Middleware Optimization

```typescript
// Compression middleware
import compression from 'compression'
app.use(compression({
  level: 6,
  threshold: 1024,
  filter: (req, res) => {
    if (req.headers['x-no-compression']) return false
    return compression.filter(req, res)
  }
}))

// Rate limiting
import rateLimit from 'express-rate-limit'

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP',
  standardHeaders: true,
  legacyHeaders: false,
})

app.use('/api/', apiLimiter)

// Request timeout
import timeout from 'connect-timeout'

app.use(timeout('30s'))
app.use((req, res, next) => {
  if (!req.timedout) next()
})
```

## Database Optimization

### Query Optimization

```sql
-- Efficient indexes
CREATE INDEX CONCURRENTLY idx_bonds_client_status 
ON bonds(client_id, status) 
WHERE status IN ('active', 'pending');

CREATE INDEX CONCURRENTLY idx_bonds_created_at_desc 
ON bonds(created_at DESC);

CREATE INDEX CONCURRENTLY idx_clients_search 
ON clients USING gin(to_tsvector('english', name || ' ' || email));

-- Partial indexes for common queries
CREATE INDEX CONCURRENTLY idx_active_bonds 
ON bonds(created_at DESC) 
WHERE status = 'active';

-- Composite indexes for complex queries
CREATE INDEX CONCURRENTLY idx_bonds_complex 
ON bonds(status, created_at DESC, client_id) 
WHERE status IN ('active', 'pending');
```

**Prisma Query Optimization**
```typescript
// Efficient queries with Prisma
export class OptimizedBondService {
  // Use select to limit fields
  async getBondSummary(bondId: string) {
    return prisma.bond.findUnique({
      where: { id: bondId },
      select: {
        id: true,
        amount: true,
        status: true,
        client: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })
  }

  // Use include strategically
  async getBondWithPayments(bondId: string) {
    return prisma.bond.findUnique({
      where: { id: bondId },
      include: {
        payments: {
          orderBy: { createdAt: 'desc' },
          take: 10 // Limit related records
        }
      }
    })
  }

  // Efficient search with full-text search
  async searchBonds(query: string, limit = 20) {
    return prisma.$queryRaw`
      SELECT b.*, c.name as client_name
      FROM bonds b
      JOIN clients c ON b.client_id = c.id
      WHERE to_tsvector('english', c.name || ' ' || b.notes) 
            @@ plainto_tsquery('english', ${query})
      ORDER BY ts_rank(
        to_tsvector('english', c.name || ' ' || b.notes),
        plainto_tsquery('english', ${query})
      ) DESC
      LIMIT ${limit}
    `
  }

  // Batch operations
  async createMultipleBonds(bondsData: CreateBondData[]) {
    return prisma.$transaction(
      bondsData.map(bondData => 
        prisma.bond.create({ data: bondData })
      )
    )
  }

  // Efficient aggregations
  async getBondStatistics(clientId?: string) {
    const where = clientId ? { clientId } : {}
    
    return prisma.bond.aggregate({
      where,
      _sum: { amount: true },
      _count: { id: true },
      _avg: { amount: true }
    })
  }
}
```

### Connection Pooling

```typescript
// Prisma connection pooling
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  },
  log: process.env.NODE_ENV === 'development' ? ['query'] : [],
})

// Connection pool configuration
// DATABASE_URL="postgresql://user:password@localhost:5432/db?connection_limit=20&pool_timeout=20"

// Manual connection pool with pg
import { Pool } from 'pg'

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20, // Maximum number of connections
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
})

export const query = (text: string, params?: any[]) => {
  return pool.query(text, params)
}
```

## Caching Strategies

### Redis Caching

```typescript
import Redis from 'ioredis'

const redis = new Redis(process.env.REDIS_URL)

export class CacheService {
  // Cache frequently accessed data
  async getBondWithCache(bondId: string) {
    const cacheKey = `bond:${bondId}`
    
    // Try cache first
    const cached = await redis.get(cacheKey)
    if (cached) {
      return JSON.parse(cached)
    }

    // Fetch from database
    const bond = await prisma.bond.findUnique({
      where: { id: bondId },
      include: { client: true }
    })

    // Cache for 5 minutes
    await redis.setex(cacheKey, 300, JSON.stringify(bond))
    
    return bond
  }

  // Cache invalidation
  async invalidateBondCache(bondId: string) {
    await redis.del(`bond:${bondId}`)
    await redis.del(`client:bonds:${bondId}`)
  }

  // Cache with tags for bulk invalidation
  async setBondCache(bondId: string, data: any) {
    const cacheKey = `bond:${bondId}`
    const tagKey = `tag:bonds`
    
    await Promise.all([
      redis.setex(cacheKey, 300, JSON.stringify(data)),
      redis.sadd(tagKey, cacheKey)
    ])
  }

  async invalidateBondsByTag() {
    const tagKey = `tag:bonds`
    const keys = await redis.smembers(tagKey)
    
    if (keys.length > 0) {
      await redis.del(...keys, tagKey)
    }
  }
}
```

### HTTP Caching

```typescript
// Response caching middleware
export const cacheMiddleware = (duration: number) => {
  return (req: Request, res: Response, next: NextFunction) => {
    res.set('Cache-Control', `public, max-age=${duration}`)
    next()
  }
}

// ETags for conditional requests
export const etagMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const originalSend = res.send

  res.send = function(data) {
    const etag = generateETag(data)
    res.set('ETag', etag)

    if (req.headers['if-none-match'] === etag) {
      res.status(304).end()
      return res
    }

    return originalSend.call(this, data)
  }

  next()
}

// Usage
app.get('/api/bonds/:id', 
  cacheMiddleware(300), // 5 minutes
  etagMiddleware,
  getBondDetails
)
```

### Application-Level Caching

```typescript
// In-memory cache with LRU eviction
import LRU from 'lru-cache'

const cache = new LRU<string, any>({
  max: 1000,
  ttl: 1000 * 60 * 5 // 5 minutes
})

export class BondService {
  async getBond(id: string) {
    const cacheKey = `bond:${id}`
    
    // Check cache
    let bond = cache.get(cacheKey)
    if (bond) return bond

    // Fetch from database
    bond = await prisma.bond.findUnique({
      where: { id },
      include: { client: true }
    })

    // Cache result
    if (bond) {
      cache.set(cacheKey, bond)
    }

    return bond
  }

  async updateBond(id: string, data: any) {
    const bond = await prisma.bond.update({
      where: { id },
      data
    })

    // Invalidate cache
    cache.delete(`bond:${id}`)
    
    return bond
  }
}
```

## Monitoring and Observability

### Performance Monitoring

```typescript
// Custom performance middleware
export const performanceMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now()

  res.on('finish', () => {
    const duration = Date.now() - start
    const route = req.route?.path || req.path

    // Log slow requests
    if (duration > 1000) {
      console.warn(`Slow request: ${req.method} ${route} - ${duration}ms`)
    }

    // Send metrics to monitoring service
    metrics.timing('http.request.duration', duration, {
      method: req.method,
      route,
      status: res.statusCode.toString()
    })
  })

  next()
}

// Database query monitoring
const originalQuery = prisma.$queryRaw
prisma.$queryRaw = async function(...args) {
  const start = Date.now()
  
  try {
    const result = await originalQuery.apply(this, args)
    const duration = Date.now() - start
    
    metrics.timing('database.query.duration', duration)
    
    return result
  } catch (error) {
    metrics.increment('database.query.error')
    throw error
  }
}
```

### Health Checks

```typescript
// Health check endpoint
export const healthCheck = async (req: Request, res: Response) => {
  const checks = {
    database: false,
    redis: false,
    external_api: false
  }

  try {
    // Database check
    await prisma.$queryRaw`SELECT 1`
    checks.database = true
  } catch (error) {
    console.error('Database health check failed:', error)
  }

  try {
    // Redis check
    await redis.ping()
    checks.redis = true
  } catch (error) {
    console.error('Redis health check failed:', error)
  }

  try {
    // External API check
    const response = await fetch('https://api.external-service.com/health', {
      timeout: 5000
    })
    checks.external_api = response.ok
  } catch (error) {
    console.error('External API health check failed:', error)
  }

  const isHealthy = Object.values(checks).every(Boolean)
  const status = isHealthy ? 200 : 503

  res.status(status).json({
    status: isHealthy ? 'healthy' : 'unhealthy',
    timestamp: new Date().toISOString(),
    checks
  })
}
```

## Load Testing

### K6 Load Tests

```javascript
// tests/performance/api-load-test.js
import http from 'k6/http'
import { check, sleep } from 'k6'

export let options = {
  stages: [
    { duration: '2m', target: 100 },
    { duration: '5m', target: 100 },
    { duration: '2m', target: 200 },
    { duration: '5m', target: 200 },
    { duration: '2m', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'],
    http_req_failed: ['rate<0.01'],
  },
}

const BASE_URL = 'http://localhost:3000'

export function setup() {
  // Login and get token
  const loginRes = http.post(`${BASE_URL}/api/auth/login`, {
    email: 'test@example.com',
    password: 'password123'
  })
  
  return { token: loginRes.json('token') }
}

export default function(data) {
  const headers = {
    'Authorization': `Bearer ${data.token}`,
    'Content-Type': 'application/json'
  }

  // Test different endpoints
  const responses = http.batch([
    ['GET', `${BASE_URL}/api/bonds`, null, { headers }],
    ['GET', `${BASE_URL}/api/clients`, null, { headers }],
    ['GET', `${BASE_URL}/api/dashboard/stats`, null, { headers }],
  ])

  responses.forEach(response => {
    check(response, {
      'status is 200': (r) => r.status === 200,
      'response time < 500ms': (r) => r.timings.duration < 500,
    })
  })

  sleep(1)
}
```

### Artillery Load Tests

```yaml
# tests/performance/artillery-config.yml
config:
  target: 'http://localhost:3000'
  phases:
    - duration: 60
      arrivalRate: 10
    - duration: 120
      arrivalRate: 20
    - duration: 60
      arrivalRate: 10
  defaults:
    headers:
      Authorization: 'Bearer {{ token }}'

scenarios:
  - name: "Bond Management Flow"
    weight: 70
    flow:
      - post:
          url: "/api/auth/login"
          json:
            email: "test@example.com"
            password: "password123"
          capture:
            - json: "$.token"
              as: "token"
      - get:
          url: "/api/bonds"
      - get:
          url: "/api/clients"
      - post:
          url: "/api/bonds"
          json:
            clientId: "{{ $randomUUID }}"
            amount: 10000
            type: "standard"

  - name: "Search Operations"
    weight: 30
    flow:
      - get:
          url: "/api/search/bonds?q=john"
      - get:
          url: "/api/search/clients?q=doe"
```

## Performance Budgets

### Bundle Size Budgets

```json
{
  "budgets": [
    {
      "type": "initial",
      "maximumWarning": "500kb",
      "maximumError": "1mb"
    },
    {
      "type": "anyComponentStyle",
      "maximumWarning": "2kb",
      "maximumError": "4kb"
    },
    {
      "type": "bundle",
      "name": "vendor",
      "maximumWarning": "300kb",
      "maximumError": "500kb"
    }
  ]
}
```

### Performance Budget Monitoring

```typescript
// Performance budget checker
export class PerformanceBudget {
  private budgets = {
    lcp: 2500, // ms
    fid: 100,  // ms
    cls: 0.1,  // score
    ttfb: 200, // ms
    bundleSize: 1024 * 1024, // 1MB
  }

  async checkBudgets(metrics: PerformanceMetrics) {
    const violations = []

    if (metrics.lcp > this.budgets.lcp) {
      violations.push(`LCP: ${metrics.lcp}ms > ${this.budgets.lcp}ms`)
    }

    if (metrics.fid > this.budgets.fid) {
      violations.push(`FID: ${metrics.fid}ms > ${this.budgets.fid}ms`)
    }

    if (metrics.cls > this.budgets.cls) {
      violations.push(`CLS: ${metrics.cls} > ${this.budgets.cls}`)
    }

    if (violations.length > 0) {
      await this.alertTeam(violations)
    }

    return violations
  }

  private async alertTeam(violations: string[]) {
    // Send alert to team
    console.error('Performance budget violations:', violations)
    // Could integrate with Slack, email, etc.
  }
}
```

## Optimization Checklist

### Frontend Checklist

- [ ] **Bundle Analysis**: Analyze bundle size and eliminate unused code
- [ ] **Code Splitting**: Implement route and component-based code splitting
- [ ] **Image Optimization**: Use optimized images with proper formats and sizes
- [ ] **Lazy Loading**: Implement lazy loading for images and components
- [ ] **Caching**: Implement proper HTTP caching headers
- [ ] **Compression**: Enable gzip/brotli compression
- [ ] **CDN**: Use CDN for static assets
- [ ] **Critical CSS**: Inline critical CSS and defer non-critical CSS
- [ ] **Font Optimization**: Optimize web fonts with font-display: swap
- [ ] **Service Worker**: Implement service worker for caching

### Backend Checklist

- [ ] **Database Indexes**: Add appropriate database indexes
- [ ] **Query Optimization**: Optimize slow database queries
- [ ] **Connection Pooling**: Implement database connection pooling
- [ ] **Caching**: Implement Redis/memory caching for frequently accessed data
- [ ] **API Optimization**: Optimize API responses and reduce payload size
- [ ] **Rate Limiting**: Implement rate limiting to prevent abuse
- [ ] **Compression**: Enable response compression
- [ ] **Monitoring**: Set up performance monitoring and alerting
- [ ] **Load Balancing**: Implement load balancing for high availability
- [ ] **Auto-scaling**: Configure auto-scaling based on metrics

### Database Checklist

- [ ] **Query Performance**: Analyze and optimize slow queries
- [ ] **Index Strategy**: Review and optimize database indexes
- [ ] **Connection Management**: Optimize connection pooling settings
- [ ] **Query Caching**: Enable query result caching
- [ ] **Partitioning**: Consider table partitioning for large tables
- [ ] **Archiving**: Implement data archiving for old records
- [ ] **Monitoring**: Set up database performance monitoring
- [ ] **Backup Strategy**: Optimize backup and recovery procedures

## Troubleshooting

### Common Performance Issues

**Slow API Responses**
1. Check database query performance
2. Verify proper indexes exist
3. Check for N+1 query problems
4. Review caching strategy
5. Monitor server resources

**High Memory Usage**
1. Check for memory leaks in Node.js
2. Review database connection pooling
3. Optimize caching strategies
4. Monitor garbage collection

**Slow Frontend Loading**
1. Analyze bundle size
2. Check for render-blocking resources
3. Optimize images and assets
4. Review caching headers
5. Check CDN configuration

### Performance Debugging Tools

**Frontend Tools**
- Chrome DevTools Performance tab
- Lighthouse audits
- WebPageTest
- Bundle analyzers (webpack-bundle-analyzer)

**Backend Tools**
- Node.js profiler (--prof flag)
- APM tools (New Relic, DataDog)
- Database query analyzers
- Load testing tools (K6, Artillery)

**Database Tools**
- PostgreSQL pg_stat_statements
- Query execution plans (EXPLAIN ANALYZE)
- Database monitoring tools

### Performance Monitoring Queries

```sql
-- Find slow queries
SELECT query, mean_time, calls, total_time
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 10;

-- Check index usage
SELECT schemaname, tablename, attname, n_distinct, correlation
FROM pg_stats
WHERE tablename = 'bonds';

-- Monitor connection usage
SELECT count(*) as connections,
       state,
       application_name
FROM pg_stat_activity
GROUP BY state, application_name;
```

## Resources

- [Web.dev Performance](https://web.dev/performance/)
- [Core Web Vitals](https://web.dev/vitals/)
- [React Performance](https://react.dev/learn/render-and-commit)
- [Node.js Performance](https://nodejs.org/en/docs/guides/simple-profiling/)
- [PostgreSQL Performance](https://www.postgresql.org/docs/current/performance-tips.html)

---

For performance-related questions or issues, please create an issue with the `performance` label or reach out to the development team.