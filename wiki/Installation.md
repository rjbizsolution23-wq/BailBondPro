# 🚀 Installation Guide

This guide will walk you through setting up BailBondPro on your local development environment or production server.

## 📋 System Requirements

### Minimum Requirements
- **Node.js**: 18.0 or higher
- **npm**: 9.0 or higher (or yarn 1.22+)
- **PostgreSQL**: 14.0 or higher
- **Git**: 2.30 or higher
- **Memory**: 4GB RAM minimum, 8GB recommended
- **Storage**: 10GB free space minimum

### Recommended Development Environment
- **OS**: macOS, Linux, or Windows with WSL2
- **Editor**: VS Code with recommended extensions
- **Browser**: Chrome, Firefox, or Safari (latest versions)
- **Terminal**: Modern terminal with shell support

## 🛠️ Prerequisites

### 1. Install Node.js
Download and install Node.js from [nodejs.org](https://nodejs.org/)

```bash
# Verify installation
node --version  # Should be 18.0+
npm --version   # Should be 9.0+
```

### 2. Install PostgreSQL
Choose one of the following options:

#### Option A: Local PostgreSQL Installation
- **macOS**: `brew install postgresql`
- **Ubuntu/Debian**: `sudo apt-get install postgresql postgresql-contrib`
- **Windows**: Download from [postgresql.org](https://www.postgresql.org/download/)

#### Option B: Docker PostgreSQL
```bash
docker run --name bailbondpro-db \
  -e POSTGRES_DB=bailbondpro \
  -e POSTGRES_USER=bailbondpro \
  -e POSTGRES_PASSWORD=your_secure_password \
  -p 5432:5432 \
  -d postgres:15
```

#### Option C: Cloud PostgreSQL
- **Supabase**: [supabase.com](https://supabase.com)
- **Railway**: [railway.app](https://railway.app)
- **Neon**: [neon.tech](https://neon.tech)
- **PlanetScale**: [planetscale.com](https://planetscale.com)

### 3. Install Git
Download from [git-scm.com](https://git-scm.com/) if not already installed.

## 📥 Installation Steps

### 1. Clone the Repository
```bash
git clone https://github.com/rjbizsolution23-wq/BailBondPro.git
cd BailBondPro
```

### 2. Install Dependencies
```bash
# Install all dependencies
npm install

# Or using yarn
yarn install
```

### 3. Environment Configuration
Create environment files from templates:

```bash
# Copy environment template
cp .env.example .env
```

Edit the `.env` file with your configuration:

```env
# Database Configuration
DATABASE_URL="postgresql://username:password@localhost:5432/bailbondpro"

# JWT Configuration
JWT_SECRET="your-super-secure-jwt-secret-key-here"
JWT_EXPIRES_IN="7d"

# Server Configuration
PORT=3000
NODE_ENV="development"

# Stripe Configuration (for payments)
STRIPE_SECRET_KEY="sk_test_your_stripe_secret_key"
STRIPE_PUBLISHABLE_KEY="pk_test_your_stripe_publishable_key"
STRIPE_WEBHOOK_SECRET="whsec_your_webhook_secret"

# File Upload Configuration
UPLOAD_DIR="./uploads"
MAX_FILE_SIZE="10485760"  # 10MB in bytes

# Email Configuration (optional)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"

# Frontend URL (for CORS)
FRONTEND_URL="http://localhost:5173"

# Gibson Bail Bonds API (if using)
GIBSON_API_KEY="your-gibson-api-key"
GIBSON_API_URL="https://api.gibsonbailbonds.com"
```

### 4. Database Setup
```bash
# Generate database schema
npm run db:generate

# Run database migrations
npm run db:migrate

# Seed initial data (optional)
npm run db:seed
```

### 5. Build the Application
```bash
# Build both frontend and backend
npm run build

# Or build separately
npm run build:client
npm run build:server
```

### 6. Start the Application
```bash
# Development mode (with hot reload)
npm run dev

# Production mode
npm run start
```

The application will be available at:
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3000
- **API Documentation**: http://localhost:3000/api/docs

## 🔧 Development Setup

### VS Code Extensions
Install these recommended extensions:

```json
{
  "recommendations": [
    "bradlc.vscode-tailwindcss",
    "esbenp.prettier-vscode",
    "ms-vscode.vscode-typescript-next",
    "ms-vscode.vscode-json",
    "ms-vscode.vscode-eslint",
    "formulahendry.auto-rename-tag",
    "christian-kohler.path-intellisense",
    "ms-vscode.vscode-todo-highlight"
  ]
}
```

### Git Hooks Setup
```bash
# Install husky for git hooks
npm run prepare

# This will set up:
# - Pre-commit: ESLint and Prettier checks
# - Pre-push: Type checking and tests
```

### Database GUI Tools (Optional)
- **pgAdmin**: Web-based PostgreSQL administration
- **DBeaver**: Universal database tool
- **TablePlus**: Native database client (macOS/Windows)
- **Postico**: PostgreSQL client for macOS

## 🐳 Docker Installation

### Using Docker Compose
```bash
# Clone the repository
git clone https://github.com/rjbizsolution23-wq/BailBondPro.git
cd BailBondPro

# Copy environment file
cp .env.example .env

# Start with Docker Compose
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Manual Docker Setup
```bash
# Build the image
docker build -t bailbondpro .

# Run PostgreSQL
docker run --name bailbondpro-db \
  -e POSTGRES_DB=bailbondpro \
  -e POSTGRES_USER=bailbondpro \
  -e POSTGRES_PASSWORD=secure_password \
  -p 5432:5432 \
  -d postgres:15

# Run the application
docker run --name bailbondpro-app \
  --link bailbondpro-db:db \
  -p 3000:3000 \
  -e DATABASE_URL="postgresql://bailbondpro:secure_password@db:5432/bailbondpro" \
  -d bailbondpro
```

## 🚀 Production Deployment

### Environment Variables for Production
```env
NODE_ENV="production"
DATABASE_URL="your-production-database-url"
JWT_SECRET="your-production-jwt-secret"
FRONTEND_URL="https://your-domain.com"
```

### Deployment Platforms

#### Netlify (Frontend)
1. Connect your GitHub repository
2. Set build command: `npm run build:client`
3. Set publish directory: `dist/public`
4. Add environment variables in Netlify dashboard

#### Railway (Backend + Database)
1. Connect your GitHub repository
2. Railway will auto-detect and deploy
3. Add PostgreSQL service
4. Configure environment variables

#### Vercel (Full-stack)
1. Connect your GitHub repository
2. Configure build settings
3. Add PostgreSQL database
4. Set environment variables

#### Heroku (Full-stack)
```bash
# Install Heroku CLI
npm install -g heroku

# Login and create app
heroku login
heroku create your-app-name

# Add PostgreSQL addon
heroku addons:create heroku-postgresql:hobby-dev

# Set environment variables
heroku config:set JWT_SECRET="your-jwt-secret"
heroku config:set NODE_ENV="production"

# Deploy
git push heroku main
```

## ✅ Verification

### 1. Check Application Health
```bash
# Health check endpoint
curl http://localhost:3000/api/health

# Expected response:
{
  "status": "ok",
  "timestamp": "2025-01-20T10:30:00.000Z",
  "database": "connected",
  "version": "1.0.0"
}
```

### 2. Test Database Connection
```bash
# Run database test
npm run test:db

# Check database tables
npm run db:studio
```

### 3. Test Frontend
- Navigate to http://localhost:5173
- Verify login page loads
- Check responsive design
- Test navigation

### 4. Test API Endpoints
```bash
# Test user registration
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123","name":"Test User"}'

# Test login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

## 🔧 Troubleshooting

### Common Issues

#### Port Already in Use
```bash
# Find process using port 3000
lsof -i :3000

# Kill the process
kill -9 <PID>

# Or use different port
PORT=3001 npm run dev
```

#### Database Connection Issues
```bash
# Check PostgreSQL status
pg_isready -h localhost -p 5432

# Restart PostgreSQL (macOS)
brew services restart postgresql

# Check database exists
psql -h localhost -U postgres -l
```

#### Permission Issues
```bash
# Fix npm permissions (macOS/Linux)
sudo chown -R $(whoami) ~/.npm

# Clear npm cache
npm cache clean --force
```

#### Build Errors
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Clear build cache
rm -rf dist .vite
npm run build
```

## 📚 Next Steps

After successful installation:

1. **[Configuration Guide](Configuration)** - Customize your installation
2. **[User Guide](User-Guide)** - Learn how to use the system
3. **[API Documentation](API-Reference)** - Explore the API
4. **[Developer Guide](Developer-Guide)** - Start contributing

## 🆘 Getting Help

If you encounter issues:

1. Check the **[Troubleshooting Guide](Troubleshooting)**
2. Search **[GitHub Issues](https://github.com/rjbizsolution23-wq/BailBondPro/issues)**
3. Create a new issue with:
   - Operating system and version
   - Node.js and npm versions
   - Error messages and logs
   - Steps to reproduce

---

**Congratulations!** 🎉 You've successfully installed BailBondPro. Ready to streamline your bail bond operations!