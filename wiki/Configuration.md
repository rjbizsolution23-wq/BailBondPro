# ⚙️ Configuration Guide

This guide covers all configuration options for BailBondPro, including environment variables, database settings, and application customization.

## 📋 Environment Variables

### Core Application Settings

#### Database Configuration
```env
# PostgreSQL connection string
DATABASE_URL="postgresql://username:password@host:port/database"

# Alternative individual settings
DB_HOST="localhost"
DB_PORT="5432"
DB_NAME="bailbondpro"
DB_USER="bailbondpro"
DB_PASSWORD="your_secure_password"
DB_SSL="false"  # Set to "true" for production
```

#### Server Configuration
```env
# Server port (default: 3000)
PORT="3000"

# Environment mode
NODE_ENV="development"  # development | production | test

# API base path
API_BASE_PATH="/api"

# Enable API documentation
ENABLE_API_DOCS="true"

# Request timeout (milliseconds)
REQUEST_TIMEOUT="30000"

# Body parser limits
MAX_REQUEST_SIZE="50mb"
MAX_PARAMETER_LIMIT="1000"
```

#### Security Configuration
```env
# JWT settings
JWT_SECRET="your-super-secure-jwt-secret-minimum-32-characters"
JWT_EXPIRES_IN="7d"  # 7 days, 24h, 30m, etc.
JWT_REFRESH_EXPIRES_IN="30d"

# Password hashing
BCRYPT_ROUNDS="12"  # Higher = more secure but slower

# CORS settings
CORS_ORIGIN="http://localhost:5173"  # Frontend URL
CORS_CREDENTIALS="true"

# Rate limiting
RATE_LIMIT_WINDOW="15"  # minutes
RATE_LIMIT_MAX="100"    # requests per window

# Session configuration
SESSION_SECRET="your-session-secret-key"
SESSION_MAX_AGE="86400000"  # 24 hours in milliseconds
```

### Payment Processing

#### Stripe Configuration
```env
# Stripe API keys
STRIPE_SECRET_KEY="sk_test_your_stripe_secret_key"
STRIPE_PUBLISHABLE_KEY="pk_test_your_stripe_publishable_key"
STRIPE_WEBHOOK_SECRET="whsec_your_webhook_secret"

# Stripe settings
STRIPE_CURRENCY="usd"
STRIPE_PAYMENT_METHODS="card,ach_debit"
STRIPE_CAPTURE_METHOD="automatic"  # automatic | manual
```

### File Upload & Storage

#### Local Storage
```env
# Upload directory
UPLOAD_DIR="./uploads"

# File size limits (bytes)
MAX_FILE_SIZE="10485760"      # 10MB
MAX_FILES_PER_UPLOAD="5"

# Allowed file types
ALLOWED_FILE_TYPES="pdf,doc,docx,jpg,jpeg,png,gif"

# File retention (days)
FILE_RETENTION_DAYS="365"
```

#### Cloud Storage (AWS S3)
```env
# AWS S3 configuration
AWS_ACCESS_KEY_ID="your-aws-access-key"
AWS_SECRET_ACCESS_KEY="your-aws-secret-key"
AWS_REGION="us-east-1"
AWS_S3_BUCKET="bailbondpro-documents"
AWS_S3_ENDPOINT=""  # Optional for S3-compatible services

# S3 settings
S3_FORCE_PATH_STYLE="false"
S3_SIGNED_URL_EXPIRES="3600"  # 1 hour
```

### Email Configuration

#### SMTP Settings
```env
# SMTP server configuration
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_SECURE="false"  # true for 465, false for other ports
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"

# Email settings
EMAIL_FROM="noreply@yourdomain.com"
EMAIL_FROM_NAME="BailBondPro System"

# Email templates
EMAIL_TEMPLATE_DIR="./templates/email"
```

#### Email Service Providers
```env
# SendGrid
SENDGRID_API_KEY="your-sendgrid-api-key"

# Mailgun
MAILGUN_API_KEY="your-mailgun-api-key"
MAILGUN_DOMAIN="your-mailgun-domain"

# AWS SES
AWS_SES_REGION="us-east-1"
AWS_SES_ACCESS_KEY="your-ses-access-key"
AWS_SES_SECRET_KEY="your-ses-secret-key"
```

### External API Integration

#### Gibson Bail Bonds API
```env
# Gibson API configuration
GIBSON_API_KEY="your-gibson-api-key"
GIBSON_API_URL="https://api.gibsonbailbonds.com"
GIBSON_API_VERSION="v1"
GIBSON_TIMEOUT="10000"  # 10 seconds
```

#### Court System Integration
```env
# Court API settings
COURT_API_URL="https://court-system-api.gov"
COURT_API_KEY="your-court-api-key"
COURT_SYNC_INTERVAL="3600000"  # 1 hour in milliseconds
```

### Logging & Monitoring

#### Application Logging
```env
# Log level: error | warn | info | debug
LOG_LEVEL="info"

# Log format: json | simple
LOG_FORMAT="json"

# Log file settings
LOG_FILE="./logs/app.log"
LOG_MAX_SIZE="10m"
LOG_MAX_FILES="5"

# Enable request logging
LOG_REQUESTS="true"
LOG_RESPONSES="false"  # Be careful with sensitive data
```

#### Error Tracking
```env
# Sentry configuration
SENTRY_DSN="your-sentry-dsn"
SENTRY_ENVIRONMENT="development"
SENTRY_RELEASE="1.0.0"

# Error notification
ERROR_NOTIFICATION_EMAIL="admin@yourdomain.com"
```

### Internationalization

#### Language Settings
```env
# Default language
DEFAULT_LANGUAGE="en"

# Supported languages
SUPPORTED_LANGUAGES="en,es"

# Translation file directory
I18N_DIR="./locales"

# Auto-detect language from browser
AUTO_DETECT_LANGUAGE="true"
```

## 🗄️ Database Configuration

### Connection Pool Settings
```typescript
// drizzle.config.ts
export default {
  schema: "./shared/schema.ts",
  out: "./drizzle",
  driver: "pg",
  dbCredentials: {
    connectionString: process.env.DATABASE_URL!,
    ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
  },
  pool: {
    min: 2,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  },
} satisfies Config;
```

### Migration Settings
```env
# Migration configuration
DB_MIGRATE_ON_START="true"
DB_SEED_ON_START="false"  # Only for development
DB_BACKUP_BEFORE_MIGRATE="true"
```

## 🎨 Frontend Configuration

### Vite Configuration
```typescript
// vite.config.ts
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist/public',
    sourcemap: process.env.NODE_ENV === 'development',
    minify: process.env.NODE_ENV === 'production',
  },
  define: {
    'process.env.VITE_API_URL': JSON.stringify(process.env.VITE_API_URL || 'http://localhost:3000'),
    'process.env.VITE_STRIPE_PUBLISHABLE_KEY': JSON.stringify(process.env.STRIPE_PUBLISHABLE_KEY),
  },
});
```

### Environment Variables for Frontend
```env
# Frontend-specific variables (prefix with VITE_)
VITE_API_URL="http://localhost:3000"
VITE_APP_NAME="BailBondPro"
VITE_APP_VERSION="1.0.0"
VITE_STRIPE_PUBLISHABLE_KEY="pk_test_your_stripe_publishable_key"
VITE_ENABLE_ANALYTICS="false"
VITE_GOOGLE_ANALYTICS_ID=""
```

## 🔐 Security Configuration

### SSL/TLS Settings
```env
# HTTPS configuration
HTTPS_ENABLED="false"  # Set to true for production
SSL_CERT_PATH="./certs/cert.pem"
SSL_KEY_PATH="./certs/key.pem"

# Security headers
HELMET_ENABLED="true"
HSTS_MAX_AGE="31536000"  # 1 year
CONTENT_SECURITY_POLICY="default-src 'self'"
```

### Authentication Settings
```env
# Multi-factor authentication
MFA_ENABLED="false"
MFA_ISSUER="BailBondPro"

# Password policy
PASSWORD_MIN_LENGTH="8"
PASSWORD_REQUIRE_UPPERCASE="true"
PASSWORD_REQUIRE_LOWERCASE="true"
PASSWORD_REQUIRE_NUMBERS="true"
PASSWORD_REQUIRE_SYMBOLS="true"

# Account lockout
MAX_LOGIN_ATTEMPTS="5"
LOCKOUT_DURATION="900000"  # 15 minutes
```

## 📊 Performance Configuration

### Caching Settings
```env
# Redis cache (optional)
REDIS_URL="redis://localhost:6379"
REDIS_PASSWORD=""
REDIS_DB="0"

# Cache TTL (seconds)
CACHE_TTL_SHORT="300"    # 5 minutes
CACHE_TTL_MEDIUM="3600"  # 1 hour
CACHE_TTL_LONG="86400"   # 24 hours

# Enable query caching
ENABLE_QUERY_CACHE="true"
```

### Database Performance
```env
# Connection pool
DB_POOL_MIN="2"
DB_POOL_MAX="10"
DB_POOL_IDLE_TIMEOUT="30000"

# Query timeout
DB_QUERY_TIMEOUT="30000"  # 30 seconds

# Enable query logging (development only)
DB_LOG_QUERIES="false"
```

## 🌍 Environment-Specific Configurations

### Development Environment
```env
NODE_ENV="development"
LOG_LEVEL="debug"
ENABLE_API_DOCS="true"
DB_LOG_QUERIES="true"
CORS_ORIGIN="http://localhost:5173"
HTTPS_ENABLED="false"
```

### Staging Environment
```env
NODE_ENV="staging"
LOG_LEVEL="info"
ENABLE_API_DOCS="true"
DB_LOG_QUERIES="false"
CORS_ORIGIN="https://staging.yourdomain.com"
HTTPS_ENABLED="true"
```

### Production Environment
```env
NODE_ENV="production"
LOG_LEVEL="warn"
ENABLE_API_DOCS="false"
DB_LOG_QUERIES="false"
CORS_ORIGIN="https://yourdomain.com"
HTTPS_ENABLED="true"
DB_SSL="true"
```

## 🔧 Advanced Configuration

### Custom Business Rules
```typescript
// config/business-rules.ts
export const businessRules = {
  bond: {
    minimumAmount: 500,
    maximumAmount: 1000000,
    defaultFeePercentage: 10,
    collateralRequiredThreshold: 50000,
  },
  client: {
    maxActiveContracts: 5,
    creditCheckRequired: true,
    backgroundCheckRequired: true,
  },
  payment: {
    gracePeriodDays: 3,
    lateFeePercentage: 5,
    acceptedMethods: ['card', 'ach', 'cash'],
  },
};
```

### Feature Flags
```env
# Feature toggles
FEATURE_MOBILE_APP="true"
FEATURE_ADVANCED_REPORTING="true"
FEATURE_MULTI_LANGUAGE="true"
FEATURE_PAYMENT_PLANS="true"
FEATURE_AUTOMATED_REMINDERS="true"
FEATURE_COURT_INTEGRATION="false"
```

### Notification Settings
```env
# Email notifications
NOTIFY_NEW_CLIENT="true"
NOTIFY_PAYMENT_DUE="true"
NOTIFY_COURT_DATE="true"
NOTIFY_CONTRACT_EXPIRY="true"

# SMS notifications (Twilio)
TWILIO_ACCOUNT_SID="your-twilio-sid"
TWILIO_AUTH_TOKEN="your-twilio-token"
TWILIO_PHONE_NUMBER="+1234567890"
SMS_NOTIFICATIONS_ENABLED="false"
```

## 📝 Configuration Validation

### Environment Validation Script
```bash
# Run configuration validation
npm run validate:config

# Check required environment variables
npm run check:env

# Test database connection
npm run test:db

# Validate external API connections
npm run test:apis
```

### Configuration Checklist

#### Pre-deployment Checklist
- [ ] All required environment variables set
- [ ] Database connection tested
- [ ] JWT secret is secure (32+ characters)
- [ ] CORS origins configured correctly
- [ ] File upload limits appropriate
- [ ] Email configuration tested
- [ ] Payment processing configured
- [ ] SSL certificates installed (production)
- [ ] Logging configured appropriately
- [ ] Backup strategy implemented

## 🆘 Troubleshooting Configuration

### Common Configuration Issues

#### Database Connection Errors
```bash
# Test database connection
psql $DATABASE_URL

# Check connection string format
echo $DATABASE_URL
```

#### JWT Token Issues
```bash
# Generate secure JWT secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

#### File Upload Problems
```bash
# Check upload directory permissions
ls -la ./uploads
chmod 755 ./uploads
```

#### CORS Issues
```bash
# Check CORS configuration
curl -H "Origin: http://localhost:5173" \
     -H "Access-Control-Request-Method: POST" \
     -H "Access-Control-Request-Headers: X-Requested-With" \
     -X OPTIONS \
     http://localhost:3000/api/auth/login
```

## 📚 Next Steps

After configuration:

1. **[User Guide](User-Guide)** - Learn system usage
2. **[API Reference](API-Reference)** - Explore API endpoints
3. **[Deployment Guide](Deployment)** - Deploy to production
4. **[Monitoring Guide](Monitoring)** - Set up monitoring

---

**Configuration Complete!** 🎉 Your BailBondPro system is now properly configured and ready for use.