# Monitoring and Observability Guide for BailBondPro

This document outlines the monitoring, logging, and observability strategies for the BailBondPro bail bond management system to ensure optimal performance, reliability, and security.

## Table of Contents

- [Monitoring Philosophy](#monitoring-philosophy)
- [Metrics and KPIs](#metrics-and-kpis)
- [Logging Strategy](#logging-strategy)
- [Alerting and Notifications](#alerting-and-notifications)
- [Health Checks](#health-checks)
- [Application Performance Monitoring](#application-performance-monitoring)
- [Infrastructure Monitoring](#infrastructure-monitoring)
- [Security Monitoring](#security-monitoring)
- [Business Metrics](#business-metrics)
- [Dashboards](#dashboards)
- [Incident Response](#incident-response)
- [Tools and Technologies](#tools-and-technologies)

## Monitoring Philosophy

### Core Principles

1. **Proactive Monitoring**: Detect issues before they impact users
2. **Comprehensive Coverage**: Monitor all layers of the application stack
3. **Actionable Alerts**: Only alert on issues that require immediate action
4. **Data-Driven Decisions**: Use metrics to guide optimization efforts
5. **Continuous Improvement**: Regularly review and improve monitoring strategies

### The Four Golden Signals

1. **Latency**: How long it takes to service a request
2. **Traffic**: How much demand is being placed on the system
3. **Errors**: The rate of requests that fail
4. **Saturation**: How "full" the service is

### SLI/SLO Framework

**Service Level Indicators (SLIs)**
- API response time (95th percentile)
- Error rate
- Availability
- Throughput

**Service Level Objectives (SLOs)**
- 99.9% availability
- 95% of API requests complete within 200ms
- Error rate < 0.1%
- Support 1000 concurrent users

## Metrics and KPIs

### Application Metrics

**Performance Metrics**
```typescript
// Custom metrics collection
import { createPrometheusMetrics } from './metrics'

const metrics = createPrometheusMetrics({
  // Request duration histogram
  httpRequestDuration: {
    type: 'histogram',
    name: 'http_request_duration_seconds',
    help: 'Duration of HTTP requests in seconds',
    labelNames: ['method', 'route', 'status_code'],
    buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10]
  },

  // Request counter
  httpRequestsTotal: {
    type: 'counter',
    name: 'http_requests_total',
    help: 'Total number of HTTP requests',
    labelNames: ['method', 'route', 'status_code']
  },

  // Active connections gauge
  activeConnections: {
    type: 'gauge',
    name: 'active_connections',
    help: 'Number of active connections'
  },

  // Database query duration
  dbQueryDuration: {
    type: 'histogram',
    name: 'db_query_duration_seconds',
    help: 'Duration of database queries in seconds',
    labelNames: ['query_type', 'table'],
    buckets: [0.01, 0.05, 0.1, 0.3, 0.5, 1, 3, 5]
  }
})

// Middleware to collect HTTP metrics
export const metricsMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now()

  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000
    const route = req.route?.path || req.path

    metrics.httpRequestDuration
      .labels(req.method, route, res.statusCode.toString())
      .observe(duration)

    metrics.httpRequestsTotal
      .labels(req.method, route, res.statusCode.toString())
      .inc()
  })

  next()
}
```

**Business Metrics**
```typescript
// Business-specific metrics
export class BusinessMetrics {
  private metrics = createPrometheusMetrics({
    bondsCreated: {
      type: 'counter',
      name: 'bonds_created_total',
      help: 'Total number of bonds created',
      labelNames: ['bond_type', 'agent_id']
    },

    bondAmount: {
      type: 'histogram',
      name: 'bond_amount_dollars',
      help: 'Bond amounts in dollars',
      buckets: [1000, 5000, 10000, 25000, 50000, 100000, 250000, 500000]
    },

    paymentProcessed: {
      type: 'counter',
      name: 'payments_processed_total',
      help: 'Total payments processed',
      labelNames: ['payment_method', 'status']
    },

    clientsActive: {
      type: 'gauge',
      name: 'clients_active',
      help: 'Number of active clients'
    }
  })

  recordBondCreation(bondType: string, amount: number, agentId: string) {
    this.metrics.bondsCreated.labels(bondType, agentId).inc()
    this.metrics.bondAmount.observe(amount)
  }

  recordPayment(method: string, status: string) {
    this.metrics.paymentProcessed.labels(method, status).inc()
  }

  updateActiveClients(count: number) {
    this.metrics.clientsActive.set(count)
  }
}
```

### System Metrics

**Resource Utilization**
```typescript
// System metrics collection
import os from 'os'
import process from 'process'

export class SystemMetrics {
  private metrics = createPrometheusMetrics({
    cpuUsage: {
      type: 'gauge',
      name: 'cpu_usage_percent',
      help: 'CPU usage percentage'
    },

    memoryUsage: {
      type: 'gauge',
      name: 'memory_usage_bytes',
      help: 'Memory usage in bytes',
      labelNames: ['type']
    },

    diskUsage: {
      type: 'gauge',
      name: 'disk_usage_bytes',
      help: 'Disk usage in bytes',
      labelNames: ['mount_point']
    }
  })

  startCollection() {
    setInterval(() => {
      this.collectCPUMetrics()
      this.collectMemoryMetrics()
      this.collectDiskMetrics()
    }, 30000) // Every 30 seconds
  }

  private collectCPUMetrics() {
    const cpus = os.cpus()
    let totalIdle = 0
    let totalTick = 0

    cpus.forEach(cpu => {
      for (const type in cpu.times) {
        totalTick += cpu.times[type as keyof typeof cpu.times]
      }
      totalIdle += cpu.times.idle
    })

    const idle = totalIdle / cpus.length
    const total = totalTick / cpus.length
    const usage = 100 - ~~(100 * idle / total)

    this.metrics.cpuUsage.set(usage)
  }

  private collectMemoryMetrics() {
    const memUsage = process.memoryUsage()
    
    this.metrics.memoryUsage.labels('rss').set(memUsage.rss)
    this.metrics.memoryUsage.labels('heap_used').set(memUsage.heapUsed)
    this.metrics.memoryUsage.labels('heap_total').set(memUsage.heapTotal)
    this.metrics.memoryUsage.labels('external').set(memUsage.external)
  }

  private collectDiskMetrics() {
    // Implementation depends on the platform
    // Could use libraries like 'node-disk-info' or system commands
  }
}
```

## Logging Strategy

### Structured Logging

```typescript
// Winston logger configuration
import winston from 'winston'
import { ElasticsearchTransport } from 'winston-elasticsearch'

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: {
    service: 'bailbondpro',
    version: process.env.APP_VERSION,
    environment: process.env.NODE_ENV
  },
  transports: [
    // Console transport for development
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    }),

    // File transport for production
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error'
    }),
    new winston.transports.File({
      filename: 'logs/combined.log'
    }),

    // Elasticsearch transport for centralized logging
    new ElasticsearchTransport({
      level: 'info',
      clientOpts: {
        node: process.env.ELASTICSEARCH_URL
      },
      index: 'bailbondpro-logs'
    })
  ]
})

// Request logging middleware
export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now()

  res.on('finish', () => {
    const duration = Date.now() - start
    const logData = {
      method: req.method,
      url: req.url,
      status: res.statusCode,
      duration,
      userAgent: req.get('User-Agent'),
      ip: req.ip,
      userId: req.user?.id
    }

    if (res.statusCode >= 400) {
      logger.error('HTTP Error', logData)
    } else {
      logger.info('HTTP Request', logData)
    }
  })

  next()
}
```

### Application Logging

```typescript
// Application-specific logging
export class ApplicationLogger {
  private logger = winston.createLogger({
    // ... configuration
  })

  // Bond-related logging
  logBondCreation(bondData: any, userId: string) {
    this.logger.info('Bond created', {
      event: 'bond_created',
      bondId: bondData.id,
      clientId: bondData.clientId,
      amount: bondData.amount,
      userId,
      timestamp: new Date().toISOString()
    })
  }

  logPaymentProcessed(paymentData: any) {
    this.logger.info('Payment processed', {
      event: 'payment_processed',
      paymentId: paymentData.id,
      bondId: paymentData.bondId,
      amount: paymentData.amount,
      method: paymentData.method,
      status: paymentData.status
    })
  }

  // Security logging
  logSecurityEvent(event: string, details: any, severity: 'low' | 'medium' | 'high' | 'critical') {
    this.logger.warn('Security event', {
      event: 'security_event',
      type: event,
      severity,
      details,
      timestamp: new Date().toISOString()
    })
  }

  // Error logging with context
  logError(error: Error, context: any = {}) {
    this.logger.error('Application error', {
      event: 'error',
      message: error.message,
      stack: error.stack,
      context,
      timestamp: new Date().toISOString()
    })
  }
}
```

### Database Query Logging

```typescript
// Prisma query logging
const prisma = new PrismaClient({
  log: [
    {
      emit: 'event',
      level: 'query',
    },
    {
      emit: 'event',
      level: 'error',
    },
    {
      emit: 'event',
      level: 'info',
    },
    {
      emit: 'event',
      level: 'warn',
    },
  ],
})

prisma.$on('query', (e) => {
  if (e.duration > 1000) { // Log slow queries
    logger.warn('Slow database query', {
      event: 'slow_query',
      query: e.query,
      params: e.params,
      duration: e.duration,
      timestamp: e.timestamp
    })
  }
})

prisma.$on('error', (e) => {
  logger.error('Database error', {
    event: 'db_error',
    message: e.message,
    target: e.target,
    timestamp: e.timestamp
  })
})
```

## Alerting and Notifications

### Alert Configuration

```typescript
// Alert rules configuration
export const alertRules = {
  // High error rate
  highErrorRate: {
    condition: 'error_rate > 0.05', // 5% error rate
    duration: '5m',
    severity: 'critical',
    message: 'High error rate detected: {{ $value }}%'
  },

  // High response time
  highResponseTime: {
    condition: 'http_request_duration_seconds{quantile="0.95"} > 1',
    duration: '5m',
    severity: 'warning',
    message: 'High response time: {{ $value }}s'
  },

  // Low availability
  lowAvailability: {
    condition: 'up == 0',
    duration: '1m',
    severity: 'critical',
    message: 'Service is down'
  },

  // High memory usage
  highMemoryUsage: {
    condition: 'memory_usage_percent > 85',
    duration: '10m',
    severity: 'warning',
    message: 'High memory usage: {{ $value }}%'
  },

  // Database connection issues
  dbConnectionIssues: {
    condition: 'db_connections_active / db_connections_max > 0.8',
    duration: '5m',
    severity: 'warning',
    message: 'Database connection pool nearly exhausted'
  }
}

// Alert manager
export class AlertManager {
  private channels = {
    slack: new SlackNotifier(process.env.SLACK_WEBHOOK_URL),
    email: new EmailNotifier(),
    pagerduty: new PagerDutyNotifier(process.env.PAGERDUTY_API_KEY)
  }

  async sendAlert(alert: Alert) {
    const { severity, message, details } = alert

    // Route alerts based on severity
    switch (severity) {
      case 'critical':
        await Promise.all([
          this.channels.slack.send(message, details),
          this.channels.email.send(message, details),
          this.channels.pagerduty.send(message, details)
        ])
        break

      case 'warning':
        await Promise.all([
          this.channels.slack.send(message, details),
          this.channels.email.send(message, details)
        ])
        break

      case 'info':
        await this.channels.slack.send(message, details)
        break
    }
  }
}
```

### Notification Channels

```typescript
// Slack notifications
export class SlackNotifier {
  constructor(private webhookUrl: string) {}

  async send(message: string, details: any) {
    const payload = {
      text: message,
      attachments: [
        {
          color: this.getColorBySeverity(details.severity),
          fields: [
            {
              title: 'Service',
              value: details.service,
              short: true
            },
            {
              title: 'Environment',
              value: details.environment,
              short: true
            },
            {
              title: 'Timestamp',
              value: new Date().toISOString(),
              short: true
            }
          ]
        }
      ]
    }

    await fetch(this.webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
  }

  private getColorBySeverity(severity: string): string {
    const colors = {
      critical: 'danger',
      warning: 'warning',
      info: 'good'
    }
    return colors[severity] || 'good'
  }
}

// Email notifications
export class EmailNotifier {
  async send(message: string, details: any) {
    // Implementation using nodemailer or similar
    const transporter = nodemailer.createTransporter({
      // ... configuration
    })

    await transporter.sendMail({
      from: 'alerts@bailbondpro.com',
      to: process.env.ALERT_EMAIL_RECIPIENTS,
      subject: `[${details.severity.toUpperCase()}] BailBondPro Alert`,
      html: this.generateEmailTemplate(message, details)
    })
  }

  private generateEmailTemplate(message: string, details: any): string {
    return `
      <h2>BailBondPro Alert</h2>
      <p><strong>Message:</strong> ${message}</p>
      <p><strong>Severity:</strong> ${details.severity}</p>
      <p><strong>Service:</strong> ${details.service}</p>
      <p><strong>Environment:</strong> ${details.environment}</p>
      <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
      <hr>
      <p>Please investigate and take appropriate action.</p>
    `
  }
}
```

## Health Checks

### Application Health Checks

```typescript
// Comprehensive health check system
export class HealthCheckService {
  private checks = new Map<string, HealthCheck>()

  registerCheck(name: string, check: HealthCheck) {
    this.checks.set(name, check)
  }

  async runAllChecks(): Promise<HealthCheckResult> {
    const results = new Map<string, CheckResult>()
    const promises = Array.from(this.checks.entries()).map(async ([name, check]) => {
      try {
        const start = Date.now()
        await check.execute()
        const duration = Date.now() - start

        results.set(name, {
          status: 'healthy',
          duration,
          message: 'OK'
        })
      } catch (error) {
        results.set(name, {
          status: 'unhealthy',
          duration: 0,
          message: error.message,
          error: error.stack
        })
      }
    })

    await Promise.all(promises)

    const overallStatus = Array.from(results.values()).every(r => r.status === 'healthy')
      ? 'healthy'
      : 'unhealthy'

    return {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      checks: Object.fromEntries(results)
    }
  }
}

// Database health check
export class DatabaseHealthCheck implements HealthCheck {
  async execute(): Promise<void> {
    await prisma.$queryRaw`SELECT 1`
  }
}

// Redis health check
export class RedisHealthCheck implements HealthCheck {
  constructor(private redis: Redis) {}

  async execute(): Promise<void> {
    await this.redis.ping()
  }
}

// External API health check
export class ExternalAPIHealthCheck implements HealthCheck {
  constructor(private apiUrl: string) {}

  async execute(): Promise<void> {
    const response = await fetch(`${this.apiUrl}/health`, {
      timeout: 5000
    })

    if (!response.ok) {
      throw new Error(`API returned ${response.status}`)
    }
  }
}

// Health check endpoint
export const healthCheckHandler = async (req: Request, res: Response) => {
  const healthService = new HealthCheckService()

  // Register checks
  healthService.registerCheck('database', new DatabaseHealthCheck())
  healthService.registerCheck('redis', new RedisHealthCheck(redis))
  healthService.registerCheck('external-api', new ExternalAPIHealthCheck('https://api.example.com'))

  const result = await healthService.runAllChecks()
  const statusCode = result.status === 'healthy' ? 200 : 503

  res.status(statusCode).json(result)
}
```

### Readiness and Liveness Probes

```typescript
// Kubernetes-style probes
export const livenessProbe = async (req: Request, res: Response) => {
  // Basic liveness check - is the application running?
  try {
    // Check if the application can handle requests
    const memUsage = process.memoryUsage()
    const uptime = process.uptime()

    res.status(200).json({
      status: 'alive',
      uptime,
      memory: memUsage,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    res.status(503).json({
      status: 'dead',
      error: error.message,
      timestamp: new Date().toISOString()
    })
  }
}

export const readinessProbe = async (req: Request, res: Response) => {
  // Readiness check - is the application ready to serve traffic?
  try {
    // Check dependencies
    await Promise.all([
      prisma.$queryRaw`SELECT 1`, // Database
      redis.ping(), // Redis
      // Add other critical dependencies
    ])

    res.status(200).json({
      status: 'ready',
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    res.status(503).json({
      status: 'not_ready',
      error: error.message,
      timestamp: new Date().toISOString()
    })
  }
}
```

## Application Performance Monitoring

### Custom APM Implementation

```typescript
// Transaction tracing
export class TransactionTracer {
  private activeTransactions = new Map<string, Transaction>()

  startTransaction(name: string, type: string): Transaction {
    const transaction = new Transaction(name, type)
    this.activeTransactions.set(transaction.id, transaction)
    return transaction
  }

  endTransaction(transactionId: string) {
    const transaction = this.activeTransactions.get(transactionId)
    if (transaction) {
      transaction.end()
      this.activeTransactions.delete(transactionId)
      this.sendToAPM(transaction)
    }
  }

  private sendToAPM(transaction: Transaction) {
    // Send transaction data to APM service
    logger.info('Transaction completed', {
      event: 'transaction',
      name: transaction.name,
      type: transaction.type,
      duration: transaction.duration,
      spans: transaction.spans.length
    })
  }
}

export class Transaction {
  public id: string
  public spans: Span[] = []
  private startTime: number

  constructor(public name: string, public type: string) {
    this.id = generateId()
    this.startTime = Date.now()
  }

  startSpan(name: string, type: string): Span {
    const span = new Span(name, type, this.id)
    this.spans.push(span)
    return span
  }

  end() {
    this.duration = Date.now() - this.startTime
  }
}

// Usage in middleware
export const apmMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const transaction = tracer.startTransaction(`${req.method} ${req.route?.path}`, 'request')
  
  req.transaction = transaction

  res.on('finish', () => {
    tracer.endTransaction(transaction.id)
  })

  next()
}
```

### Error Tracking

```typescript
// Error tracking service
export class ErrorTracker {
  private errors = new Map<string, ErrorInfo>()

  trackError(error: Error, context: any = {}) {
    const errorHash = this.generateErrorHash(error)
    const existingError = this.errors.get(errorHash)

    if (existingError) {
      existingError.count++
      existingError.lastSeen = new Date()
    } else {
      this.errors.set(errorHash, {
        hash: errorHash,
        message: error.message,
        stack: error.stack,
        count: 1,
        firstSeen: new Date(),
        lastSeen: new Date(),
        context
      })
    }

    // Send to external error tracking service
    this.sendToErrorService(error, context)
  }

  private generateErrorHash(error: Error): string {
    return crypto
      .createHash('md5')
      .update(error.message + error.stack)
      .digest('hex')
  }

  private sendToErrorService(error: Error, context: any) {
    // Integration with Sentry, Bugsnag, etc.
    logger.error('Application error tracked', {
      event: 'error_tracked',
      message: error.message,
      stack: error.stack,
      context
    })
  }
}

// Global error handler
process.on('uncaughtException', (error) => {
  errorTracker.trackError(error, { type: 'uncaught_exception' })
  logger.error('Uncaught exception', { error: error.message, stack: error.stack })
  process.exit(1)
})

process.on('unhandledRejection', (reason, promise) => {
  const error = reason instanceof Error ? reason : new Error(String(reason))
  errorTracker.trackError(error, { type: 'unhandled_rejection', promise })
  logger.error('Unhandled rejection', { reason, promise })
})
```

## Infrastructure Monitoring

### Docker Container Monitoring

```yaml
# docker-compose.monitoring.yml
version: '3.8'

services:
  prometheus:
    image: prom/prometheus:latest
    ports:
      - "9090:9090"
    volumes:
      - ./monitoring/prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus_data:/prometheus
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
      - '--web.console.libraries=/etc/prometheus/console_libraries'
      - '--web.console.templates=/etc/prometheus/consoles'

  grafana:
    image: grafana/grafana:latest
    ports:
      - "3001:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
    volumes:
      - grafana_data:/var/lib/grafana
      - ./monitoring/grafana/dashboards:/etc/grafana/provisioning/dashboards
      - ./monitoring/grafana/datasources:/etc/grafana/provisioning/datasources

  node-exporter:
    image: prom/node-exporter:latest
    ports:
      - "9100:9100"
    volumes:
      - /proc:/host/proc:ro
      - /sys:/host/sys:ro
      - /:/rootfs:ro
    command:
      - '--path.procfs=/host/proc'
      - '--path.sysfs=/host/sys'
      - '--collector.filesystem.ignored-mount-points=^/(sys|proc|dev|host|etc)($$|/)'

volumes:
  prometheus_data:
  grafana_data:
```

### Prometheus Configuration

```yaml
# monitoring/prometheus.yml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

rule_files:
  - "alert_rules.yml"

alerting:
  alertmanagers:
    - static_configs:
        - targets:
          - alertmanager:9093

scrape_configs:
  - job_name: 'bailbondpro-api'
    static_configs:
      - targets: ['localhost:3000']
    metrics_path: '/metrics'
    scrape_interval: 30s

  - job_name: 'node-exporter'
    static_configs:
      - targets: ['node-exporter:9100']

  - job_name: 'postgres-exporter'
    static_configs:
      - targets: ['postgres-exporter:9187']

  - job_name: 'redis-exporter'
    static_configs:
      - targets: ['redis-exporter:9121']
```

## Security Monitoring

### Security Event Monitoring

```typescript
// Security monitoring service
export class SecurityMonitor {
  private suspiciousActivities = new Map<string, SuspiciousActivity>()

  monitorLoginAttempts(ip: string, success: boolean, userId?: string) {
    const key = `login_${ip}`
    const activity = this.suspiciousActivities.get(key) || {
      type: 'login_attempts',
      ip,
      count: 0,
      firstSeen: new Date(),
      lastSeen: new Date()
    }

    activity.count++
    activity.lastSeen = new Date()

    if (!success) {
      activity.failedCount = (activity.failedCount || 0) + 1
    }

    this.suspiciousActivities.set(key, activity)

    // Alert on suspicious activity
    if (activity.failedCount >= 5) {
      this.alertSecurityTeam('Multiple failed login attempts', {
        ip,
        attempts: activity.failedCount,
        timeWindow: '15 minutes'
      })
    }
  }

  monitorDataAccess(userId: string, resource: string, action: string) {
    logger.info('Data access', {
      event: 'data_access',
      userId,
      resource,
      action,
      timestamp: new Date().toISOString()
    })

    // Monitor for unusual access patterns
    this.detectUnusualAccess(userId, resource, action)
  }

  private detectUnusualAccess(userId: string, resource: string, action: string) {
    // Implement anomaly detection logic
    // Could use machine learning or rule-based detection
  }

  private alertSecurityTeam(message: string, details: any) {
    logger.warn('Security alert', {
      event: 'security_alert',
      message,
      details,
      severity: 'high'
    })

    // Send immediate notification
    // Could integrate with security tools like Splunk, SIEM, etc.
  }
}

// Security middleware
export const securityMonitoringMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const securityMonitor = new SecurityMonitor()

  // Monitor all requests
  securityMonitor.monitorRequest(req)

  // Monitor authentication events
  res.on('finish', () => {
    if (req.path === '/api/auth/login') {
      const success = res.statusCode === 200
      securityMonitor.monitorLoginAttempts(req.ip, success, req.body?.userId)
    }
  })

  next()
}
```

### Audit Logging

```typescript
// Audit logging for compliance
export class AuditLogger {
  private auditLog = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.json()
    ),
    transports: [
      new winston.transports.File({
        filename: 'logs/audit.log'
      }),
      // Could also send to secure external service
    ]
  })

  logUserAction(userId: string, action: string, resource: string, details: any = {}) {
    this.auditLog.info('User action', {
      event: 'user_action',
      userId,
      action,
      resource,
      details,
      timestamp: new Date().toISOString(),
      ip: details.ip,
      userAgent: details.userAgent
    })
  }

  logDataModification(userId: string, table: string, recordId: string, changes: any) {
    this.auditLog.info('Data modification', {
      event: 'data_modification',
      userId,
      table,
      recordId,
      changes,
      timestamp: new Date().toISOString()
    })
  }

  logSystemEvent(event: string, details: any) {
    this.auditLog.info('System event', {
      event: 'system_event',
      type: event,
      details,
      timestamp: new Date().toISOString()
    })
  }
}
```

## Business Metrics

### Key Performance Indicators

```typescript
// Business KPI tracking
export class BusinessKPITracker {
  private metrics = createPrometheusMetrics({
    // Revenue metrics
    revenueGenerated: {
      type: 'counter',
      name: 'revenue_generated_dollars',
      help: 'Total revenue generated',
      labelNames: ['source', 'agent_id']
    },

    // Operational metrics
    bondsActive: {
      type: 'gauge',
      name: 'bonds_active_count',
      help: 'Number of active bonds'
    },

    clientSatisfaction: {
      type: 'histogram',
      name: 'client_satisfaction_score',
      help: 'Client satisfaction scores',
      buckets: [1, 2, 3, 4, 5]
    },

    // Process efficiency
    bondProcessingTime: {
      type: 'histogram',
      name: 'bond_processing_time_minutes',
      help: 'Time to process bond applications',
      buckets: [5, 10, 15, 30, 60, 120, 240]
    }
  })

  trackRevenue(amount: number, source: string, agentId: string) {
    this.metrics.revenueGenerated.labels(source, agentId).inc(amount)
  }

  updateActiveBonds(count: number) {
    this.metrics.bondsActive.set(count)
  }

  recordClientSatisfaction(score: number) {
    this.metrics.clientSatisfaction.observe(score)
  }

  recordBondProcessingTime(minutes: number) {
    this.metrics.bondProcessingTime.observe(minutes)
  }
}

// Daily business report
export class BusinessReportGenerator {
  async generateDailyReport(): Promise<BusinessReport> {
    const today = new Date()
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000)

    const [
      bondsCreated,
      revenueGenerated,
      clientsAdded,
      paymentsProcessed
    ] = await Promise.all([
      this.getBondsCreatedCount(yesterday, today),
      this.getRevenueGenerated(yesterday, today),
      this.getClientsAddedCount(yesterday, today),
      this.getPaymentsProcessedCount(yesterday, today)
    ])

    return {
      date: today.toISOString().split('T')[0],
      bondsCreated,
      revenueGenerated,
      clientsAdded,
      paymentsProcessed,
      generatedAt: new Date().toISOString()
    }
  }

  private async getBondsCreatedCount(from: Date, to: Date): Promise<number> {
    return prisma.bond.count({
      where: {
        createdAt: {
          gte: from,
          lt: to
        }
      }
    })
  }

  // ... other report methods
}
```

## Dashboards

### Grafana Dashboard Configuration

```json
{
  "dashboard": {
    "title": "BailBondPro - Application Overview",
    "panels": [
      {
        "title": "Request Rate",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(http_requests_total[5m])",
            "legendFormat": "{{method}} {{route}}"
          }
        ]
      },
      {
        "title": "Response Time",
        "type": "graph",
        "targets": [
          {
            "expr": "histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))",
            "legendFormat": "95th percentile"
          },
          {
            "expr": "histogram_quantile(0.50, rate(http_request_duration_seconds_bucket[5m]))",
            "legendFormat": "50th percentile"
          }
        ]
      },
      {
        "title": "Error Rate",
        "type": "singlestat",
        "targets": [
          {
            "expr": "rate(http_requests_total{status_code=~\"5..\"}[5m]) / rate(http_requests_total[5m]) * 100",
            "legendFormat": "Error Rate %"
          }
        ]
      },
      {
        "title": "Active Bonds",
        "type": "singlestat",
        "targets": [
          {
            "expr": "bonds_active_count",
            "legendFormat": "Active Bonds"
          }
        ]
      }
    ]
  }
}
```

### Custom Dashboard Components

```typescript
// React dashboard components
export const MetricsDashboard = () => {
  const [metrics, setMetrics] = useState<Metrics>()

  useEffect(() => {
    const fetchMetrics = async () => {
      const response = await fetch('/api/metrics/summary')
      const data = await response.json()
      setMetrics(data)
    }

    fetchMetrics()
    const interval = setInterval(fetchMetrics, 30000) // Update every 30 seconds

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="dashboard-grid">
      <MetricCard
        title="Active Bonds"
        value={metrics?.activeBonds}
        trend={metrics?.bondsTrend}
        icon={<BondIcon />}
      />
      <MetricCard
        title="Revenue Today"
        value={formatCurrency(metrics?.revenueToday)}
        trend={metrics?.revenueTrend}
        icon={<DollarIcon />}
      />
      <MetricCard
        title="Response Time"
        value={`${metrics?.avgResponseTime}ms`}
        trend={metrics?.responseTimeTrend}
        icon={<ClockIcon />}
      />
      <MetricCard
        title="Error Rate"
        value={`${metrics?.errorRate}%`}
        trend={metrics?.errorRateTrend}
        icon={<AlertIcon />}
      />
    </div>
  )
}
```

## Incident Response

### Incident Management

```typescript
// Incident management system
export class IncidentManager {
  private incidents = new Map<string, Incident>()

  createIncident(title: string, severity: IncidentSeverity, description: string): Incident {
    const incident = new Incident(title, severity, description)
    this.incidents.set(incident.id, incident)

    // Notify incident response team
    this.notifyIncidentTeam(incident)

    return incident
  }

  updateIncident(incidentId: string, update: IncidentUpdate) {
    const incident = this.incidents.get(incidentId)
    if (incident) {
      incident.addUpdate(update)
      this.notifyStakeholders(incident, update)
    }
  }

  resolveIncident(incidentId: string, resolution: string) {
    const incident = this.incidents.get(incidentId)
    if (incident) {
      incident.resolve(resolution)
      this.notifyResolution(incident)
    }
  }

  private notifyIncidentTeam(incident: Incident) {
    // Send notifications to incident response team
    logger.error('Incident created', {
      event: 'incident_created',
      incidentId: incident.id,
      title: incident.title,
      severity: incident.severity
    })
  }

  private notifyStakeholders(incident: Incident, update: IncidentUpdate) {
    // Send updates to stakeholders
    logger.info('Incident updated', {
      event: 'incident_updated',
      incidentId: incident.id,
      update: update.message
    })
  }

  private notifyResolution(incident: Incident) {
    // Send resolution notification
    logger.info('Incident resolved', {
      event: 'incident_resolved',
      incidentId: incident.id,
      resolution: incident.resolution,
      duration: incident.duration
    })
  }
}

export class Incident {
  public id: string
  public updates: IncidentUpdate[] = []
  public createdAt: Date
  public resolvedAt?: Date
  public resolution?: string

  constructor(
    public title: string,
    public severity: IncidentSeverity,
    public description: string
  ) {
    this.id = generateId()
    this.createdAt = new Date()
  }

  addUpdate(update: IncidentUpdate) {
    this.updates.push({
      ...update,
      timestamp: new Date()
    })
  }

  resolve(resolution: string) {
    this.resolution = resolution
    this.resolvedAt = new Date()
  }

  get duration(): number {
    if (!this.resolvedAt) return 0
    return this.resolvedAt.getTime() - this.createdAt.getTime()
  }
}
```

### Runbooks

```typescript
// Automated runbook execution
export class RunbookExecutor {
  private runbooks = new Map<string, Runbook>()

  registerRunbook(name: string, runbook: Runbook) {
    this.runbooks.set(name, runbook)
  }

  async executeRunbook(name: string, context: any): Promise<RunbookResult> {
    const runbook = this.runbooks.get(name)
    if (!runbook) {
      throw new Error(`Runbook ${name} not found`)
    }

    logger.info('Executing runbook', {
      event: 'runbook_execution_start',
      runbook: name,
      context
    })

    try {
      const result = await runbook.execute(context)
      
      logger.info('Runbook execution completed', {
        event: 'runbook_execution_complete',
        runbook: name,
        success: result.success
      })

      return result
    } catch (error) {
      logger.error('Runbook execution failed', {
        event: 'runbook_execution_failed',
        runbook: name,
        error: error.message
      })

      throw error
    }
  }
}

// Example runbook for high memory usage
export class HighMemoryUsageRunbook implements Runbook {
  async execute(context: any): Promise<RunbookResult> {
    const steps = [
      'Check current memory usage',
      'Identify memory-intensive processes',
      'Restart application if necessary',
      'Scale up resources if needed'
    ]

    const results = []

    // Step 1: Check memory usage
    const memUsage = process.memoryUsage()
    results.push(`Current memory usage: ${Math.round(memUsage.heapUsed / 1024 / 1024)}MB`)

    // Step 2: Identify processes (simplified)
    results.push('Identified high memory usage in application')

    // Step 3: Restart if memory usage is critical
    if (memUsage.heapUsed > 1024 * 1024 * 1024) { // 1GB
      results.push('Memory usage critical - restart recommended')
      // Could trigger application restart
    }

    return {
      success: true,
      steps,
      results,
      executedAt: new Date()
    }
  }
}
```

## Tools and Technologies

### Recommended Monitoring Stack

**Metrics Collection**
- Prometheus for metrics collection and storage
- Grafana for visualization and dashboards
- Node Exporter for system metrics
- Custom application metrics

**Logging**
- Winston for application logging
- Elasticsearch for log storage and search
- Kibana for log visualization
- Fluentd/Fluent Bit for log forwarding

**APM and Tracing**
- Jaeger or Zipkin for distributed tracing
- New Relic or DataDog for APM
- Custom transaction tracing

**Alerting**
- Prometheus Alertmanager
- PagerDuty for incident management
- Slack for team notifications
- Email for stakeholder updates

**Infrastructure Monitoring**
- Docker and Kubernetes monitoring
- Cloud provider monitoring (AWS CloudWatch, etc.)
- Database monitoring tools
- Network monitoring

### Configuration Examples

```yaml
# Kubernetes monitoring configuration
apiVersion: v1
kind: ConfigMap
metadata:
  name: prometheus-config
data:
  prometheus.yml: |
    global:
      scrape_interval: 15s
    scrape_configs:
      - job_name: 'bailbondpro'
        kubernetes_sd_configs:
          - role: pod
        relabel_configs:
          - source_labels: [__meta_kubernetes_pod_annotation_prometheus_io_scrape]
            action: keep
            regex: true
```

## Best Practices

1. **Start Simple**: Begin with basic metrics and gradually add complexity
2. **Monitor What Matters**: Focus on metrics that directly impact user experience
3. **Set Meaningful Alerts**: Avoid alert fatigue by only alerting on actionable issues
4. **Document Everything**: Maintain runbooks and incident response procedures
5. **Regular Reviews**: Regularly review and update monitoring strategies
6. **Test Monitoring**: Test alerts and monitoring systems regularly
7. **Correlate Data**: Use multiple data sources to get complete picture
8. **Automate Response**: Automate common incident response tasks

---

For monitoring-related questions or issues, please create an issue with the `monitoring` label or reach out to the DevOps team.