#!/bin/bash

# ========================================================================
# BailBondPro - Production Deployment Script
# Version: 1.0.0
# Author: BailBondPro Team
# Last Updated: 2024-12-19
# ========================================================================

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
DEPLOYMENT_LOG="$PROJECT_ROOT/logs/deployment_$TIMESTAMP.log"
BACKUP_DIR="$PROJECT_ROOT/backups/pre_deploy_$TIMESTAMP"

# Default values
ENVIRONMENT="production"
SKIP_TESTS=false
SKIP_BACKUP=false
SKIP_MIGRATION=false
FORCE_DEPLOY=false
ROLLBACK_VERSION=""
DRY_RUN=false
VERBOSE=false

# Functions
log() {
    local level=$1
    shift
    local message="$*"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    
    case $level in
        "INFO")
            echo -e "${GREEN}[INFO]${NC} $message" | tee -a "$DEPLOYMENT_LOG"
            ;;
        "WARN")
            echo -e "${YELLOW}[WARN]${NC} $message" | tee -a "$DEPLOYMENT_LOG"
            ;;
        "ERROR")
            echo -e "${RED}[ERROR]${NC} $message" | tee -a "$DEPLOYMENT_LOG"
            ;;
        "DEBUG")
            if [[ "$VERBOSE" == true ]]; then
                echo -e "${BLUE}[DEBUG]${NC} $message" | tee -a "$DEPLOYMENT_LOG"
            fi
            ;;
    esac
}

show_help() {
    cat << EOF
BailBondPro Deployment Script

Usage: $0 [OPTIONS]

OPTIONS:
    -e, --environment ENV       Target environment (production, staging, development)
    -s, --skip-tests           Skip running tests before deployment
    -b, --skip-backup          Skip database backup before deployment
    -m, --skip-migration       Skip database migrations
    -f, --force                Force deployment even if health checks fail
    -r, --rollback VERSION     Rollback to specific version
    -d, --dry-run              Show what would be deployed without executing
    -v, --verbose              Enable verbose logging
    -h, --help                 Show this help message

EXAMPLES:
    $0 -e production                    # Deploy to production
    $0 -e staging -s                    # Deploy to staging, skip tests
    $0 -r v1.2.3                       # Rollback to version 1.2.3
    $0 -d -e production                 # Dry run for production deployment

EOF
}

parse_arguments() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            -e|--environment)
                ENVIRONMENT="$2"
                shift 2
                ;;
            -s|--skip-tests)
                SKIP_TESTS=true
                shift
                ;;
            -b|--skip-backup)
                SKIP_BACKUP=true
                shift
                ;;
            -m|--skip-migration)
                SKIP_MIGRATION=true
                shift
                ;;
            -f|--force)
                FORCE_DEPLOY=true
                shift
                ;;
            -r|--rollback)
                ROLLBACK_VERSION="$2"
                shift 2
                ;;
            -d|--dry-run)
                DRY_RUN=true
                shift
                ;;
            -v|--verbose)
                VERBOSE=true
                shift
                ;;
            -h|--help)
                show_help
                exit 0
                ;;
            *)
                log "ERROR" "Unknown option: $1"
                show_help
                exit 1
                ;;
        esac
    done
}

validate_environment() {
    log "INFO" "Validating environment: $ENVIRONMENT"
    
    case $ENVIRONMENT in
        production|staging|development)
            ;;
        *)
            log "ERROR" "Invalid environment: $ENVIRONMENT"
            exit 1
            ;;
    esac
    
    # Check if environment file exists
    local env_file="$PROJECT_ROOT/.env.$ENVIRONMENT"
    if [[ ! -f "$env_file" ]]; then
        log "ERROR" "Environment file not found: $env_file"
        exit 1
    fi
    
    # Load environment variables
    set -a
    source "$env_file"
    set +a
    
    log "INFO" "Environment validation completed"
}

check_prerequisites() {
    log "INFO" "Checking prerequisites..."
    
    # Check required commands
    local required_commands=("docker" "docker-compose" "npm" "git" "curl" "jq")
    for cmd in "${required_commands[@]}"; do
        if ! command -v "$cmd" &> /dev/null; then
            log "ERROR" "Required command not found: $cmd"
            exit 1
        fi
    done
    
    # Check Docker daemon
    if ! docker info &> /dev/null; then
        log "ERROR" "Docker daemon is not running"
        exit 1
    fi
    
    # Check Git status
    if [[ -n "$(git status --porcelain)" ]] && [[ "$FORCE_DEPLOY" != true ]]; then
        log "ERROR" "Working directory is not clean. Commit or stash changes first."
        exit 1
    fi
    
    # Check if on correct branch for production
    if [[ "$ENVIRONMENT" == "production" ]]; then
        local current_branch=$(git branch --show-current)
        if [[ "$current_branch" != "main" ]] && [[ "$current_branch" != "master" ]] && [[ "$FORCE_DEPLOY" != true ]]; then
            log "ERROR" "Production deployments must be from main/master branch. Current: $current_branch"
            exit 1
        fi
    fi
    
    log "INFO" "Prerequisites check completed"
}

run_tests() {
    if [[ "$SKIP_TESTS" == true ]]; then
        log "INFO" "Skipping tests as requested"
        return 0
    fi
    
    log "INFO" "Running tests..."
    
    if [[ "$DRY_RUN" == true ]]; then
        log "INFO" "[DRY RUN] Would run: npm test"
        return 0
    fi
    
    # Install dependencies
    npm ci --only=dev
    
    # Run linting
    npm run lint
    
    # Run type checking
    npm run type-check
    
    # Run unit tests
    npm run test:unit
    
    # Run integration tests
    npm run test:integration
    
    # Run security audit
    npm audit --audit-level=high
    
    log "INFO" "All tests passed"
}

backup_database() {
    if [[ "$SKIP_BACKUP" == true ]]; then
        log "INFO" "Skipping database backup as requested"
        return 0
    fi
    
    log "INFO" "Creating database backup..."
    
    if [[ "$DRY_RUN" == true ]]; then
        log "INFO" "[DRY RUN] Would create database backup"
        return 0
    fi
    
    # Create backup directory
    mkdir -p "$BACKUP_DIR"
    
    # Database backup
    local backup_file="$BACKUP_DIR/database_$TIMESTAMP.sql"
    if [[ -n "${DATABASE_URL:-}" ]]; then
        pg_dump "$DATABASE_URL" > "$backup_file"
        gzip "$backup_file"
        log "INFO" "Database backup created: $backup_file.gz"
    else
        log "WARN" "DATABASE_URL not set, skipping database backup"
    fi
    
    # Application files backup
    local app_backup="$BACKUP_DIR/app_files_$TIMESTAMP.tar.gz"
    tar -czf "$app_backup" \
        --exclude=node_modules \
        --exclude=.git \
        --exclude=logs \
        --exclude=backups \
        --exclude=uploads \
        -C "$PROJECT_ROOT" .
    
    log "INFO" "Application backup created: $app_backup"
}

build_application() {
    log "INFO" "Building application..."
    
    if [[ "$DRY_RUN" == true ]]; then
        log "INFO" "[DRY RUN] Would build application"
        return 0
    fi
    
    # Install production dependencies
    npm ci --only=production
    
    # Build application
    npm run build
    
    # Build Docker image
    local image_tag="bailbondpro:$TIMESTAMP"
    docker build -t "$image_tag" -t "bailbondpro:latest" .
    
    log "INFO" "Application built successfully: $image_tag"
}

run_migrations() {
    if [[ "$SKIP_MIGRATION" == true ]]; then
        log "INFO" "Skipping database migrations as requested"
        return 0
    fi
    
    log "INFO" "Running database migrations..."
    
    if [[ "$DRY_RUN" == true ]]; then
        log "INFO" "[DRY RUN] Would run database migrations"
        return 0
    fi
    
    # Run migrations
    npm run db:migrate
    
    log "INFO" "Database migrations completed"
}

deploy_application() {
    log "INFO" "Deploying application to $ENVIRONMENT..."
    
    if [[ "$DRY_RUN" == true ]]; then
        log "INFO" "[DRY RUN] Would deploy application"
        return 0
    fi
    
    # Stop existing services
    docker-compose -f docker-compose.yml -f "docker-compose.$ENVIRONMENT.yml" down
    
    # Start new services
    docker-compose -f docker-compose.yml -f "docker-compose.$ENVIRONMENT.yml" up -d
    
    # Wait for services to be ready
    log "INFO" "Waiting for services to be ready..."
    sleep 30
    
    log "INFO" "Application deployed successfully"
}

health_check() {
    log "INFO" "Performing health checks..."
    
    local health_url="${APP_URL:-http://localhost:3000}/api/health"
    local max_attempts=30
    local attempt=1
    
    while [[ $attempt -le $max_attempts ]]; do
        log "DEBUG" "Health check attempt $attempt/$max_attempts"
        
        if curl -f -s "$health_url" > /dev/null; then
            log "INFO" "Health check passed"
            return 0
        fi
        
        sleep 10
        ((attempt++))
    done
    
    log "ERROR" "Health check failed after $max_attempts attempts"
    
    if [[ "$FORCE_DEPLOY" != true ]]; then
        log "ERROR" "Deployment failed health check. Use --force to override."
        return 1
    fi
    
    log "WARN" "Health check failed but continuing due to --force flag"
    return 0
}

smoke_tests() {
    log "INFO" "Running smoke tests..."
    
    if [[ "$DRY_RUN" == true ]]; then
        log "INFO" "[DRY RUN] Would run smoke tests"
        return 0
    fi
    
    # Basic API endpoints test
    local base_url="${APP_URL:-http://localhost:3000}"
    
    # Test health endpoint
    if ! curl -f -s "$base_url/api/health" | jq -e '.status == "ok"' > /dev/null; then
        log "ERROR" "Health endpoint test failed"
        return 1
    fi
    
    # Test API version endpoint
    if ! curl -f -s "$base_url/api/version" > /dev/null; then
        log "ERROR" "Version endpoint test failed"
        return 1
    fi
    
    log "INFO" "Smoke tests passed"
}

rollback() {
    local version="$1"
    log "INFO" "Rolling back to version: $version"
    
    if [[ "$DRY_RUN" == true ]]; then
        log "INFO" "[DRY RUN] Would rollback to version: $version"
        return 0
    fi
    
    # Stop current services
    docker-compose down
    
    # Deploy previous version
    docker tag "bailbondpro:$version" "bailbondpro:latest"
    docker-compose up -d
    
    # Wait and health check
    sleep 30
    health_check
    
    log "INFO" "Rollback completed successfully"
}

cleanup() {
    log "INFO" "Cleaning up..."
    
    # Remove old Docker images (keep last 5)
    docker images bailbondpro --format "table {{.Tag}}" | tail -n +6 | xargs -r docker rmi
    
    # Clean up old backups (keep last 10)
    find "$PROJECT_ROOT/backups" -name "pre_deploy_*" -type d | sort -r | tail -n +11 | xargs -r rm -rf
    
    # Clean up old logs (keep last 30 days)
    find "$PROJECT_ROOT/logs" -name "deployment_*.log" -mtime +30 -delete
    
    log "INFO" "Cleanup completed"
}

send_notification() {
    local status="$1"
    local message="$2"
    
    if [[ -n "${WEBHOOK_URL:-}" ]]; then
        curl -X POST "$WEBHOOK_URL" \
            -H "Content-Type: application/json" \
            -d "{
                \"environment\": \"$ENVIRONMENT\",
                \"status\": \"$status\",
                \"message\": \"$message\",
                \"timestamp\": \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\",
                \"version\": \"$(git rev-parse --short HEAD)\"
            }" || log "WARN" "Failed to send notification"
    fi
}

main() {
    # Create logs directory
    mkdir -p "$PROJECT_ROOT/logs"
    
    log "INFO" "Starting deployment process..."
    log "INFO" "Environment: $ENVIRONMENT"
    log "INFO" "Timestamp: $TIMESTAMP"
    log "INFO" "Dry Run: $DRY_RUN"
    
    # Handle rollback
    if [[ -n "$ROLLBACK_VERSION" ]]; then
        rollback "$ROLLBACK_VERSION"
        send_notification "success" "Rollback to $ROLLBACK_VERSION completed"
        exit 0
    fi
    
    # Main deployment flow
    validate_environment
    check_prerequisites
    run_tests
    backup_database
    build_application
    run_migrations
    deploy_application
    health_check
    smoke_tests
    cleanup
    
    local version=$(git rev-parse --short HEAD)
    log "INFO" "Deployment completed successfully!"
    log "INFO" "Version deployed: $version"
    
    send_notification "success" "Deployment to $ENVIRONMENT completed successfully (version: $version)"
}

# Error handling
trap 'log "ERROR" "Deployment failed at line $LINENO"; send_notification "error" "Deployment to $ENVIRONMENT failed"; exit 1' ERR

# Parse arguments and run
parse_arguments "$@"
main