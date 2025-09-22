#!/bin/bash

# ========================================================================
# BailBondPro - Restore Script
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
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="$PROJECT_ROOT/backups"
TEMP_DIR="/tmp/bailbondpro_restore_$TIMESTAMP"
RESTORE_LOG="$PROJECT_ROOT/logs/restore_$TIMESTAMP.log"

# Default values
BACKUP_FILE=""
ENVIRONMENT="production"
RESTORE_TYPE="full"
FORCE=false
VERIFY_ONLY=false
CREATE_ROLLBACK=true
VERBOSE=false
DRY_RUN=false

# Restore configuration
RESTORE_DATABASE=true
RESTORE_FILES=true
RESTORE_CONFIG=true

# Functions
log() {
    local level=$1
    shift
    local message="$*"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    
    # Log to file
    mkdir -p "$(dirname "$RESTORE_LOG")"
    echo "[$timestamp] [$level] $message" >> "$RESTORE_LOG"
    
    case $level in
        "INFO")
            echo -e "${GREEN}[INFO]${NC} $message"
            ;;
        "WARN")
            echo -e "${YELLOW}[WARN]${NC} $message"
            ;;
        "ERROR")
            echo -e "${RED}[ERROR]${NC} $message"
            ;;
        "DEBUG")
            if [[ "$VERBOSE" == true ]]; then
                echo -e "${BLUE}[DEBUG]${NC} $message"
            fi
            ;;
        "SUCCESS")
            echo -e "${GREEN}[SUCCESS]${NC} $message"
            ;;
        "STEP")
            echo -e "${CYAN}[STEP]${NC} $message"
            ;;
    esac
}

show_banner() {
    echo -e "${PURPLE}"
    cat << 'EOF'
    ____            _                 
   |  _ \          | |                
   | |_) | __ _  __| |_ ___  _ __ ___ 
   |  _ < / _` |/ _` | / _ \| '__/ _ \
   | |_) | (_| | (_| | | (_) | | |  __/
   |____/ \__,_|\__,_|_|\___/|_|  \___|
                                      
   BailBondPro Restore System         
EOF
    echo -e "${NC}"
}

show_help() {
    cat << EOF
BailBondPro Restore Script

Usage: $0 [OPTIONS] BACKUP_FILE

OPTIONS:
    -e, --environment ENV     Target environment (production, staging, development)
    -t, --type TYPE           Restore type (full, database, files, config)
    -f, --force               Force restore without confirmation
    -v, --verify-only         Verify backup integrity without restoring
    -n, --no-rollback         Skip creating rollback backup
    -d, --dry-run             Show what would be restored without executing
    --verbose                 Enable verbose logging
    -h, --help                Show this help message

RESTORE TYPES:
    full                      Complete restore (database + files + config)
    database                  Database only
    files                     Application files only
    config                    Configuration files only

EXAMPLES:
    $0 backup.tar.gz                    # Full restore from backup
    $0 -t database backup.tar.gz        # Database restore only
    $0 -e staging backup.tar.gz         # Restore to staging environment
    $0 -v backup.tar.gz                 # Verify backup integrity only
    $0 -d backup.tar.gz                 # Dry run to see what would be restored

ENVIRONMENT VARIABLES:
    DATABASE_URL              PostgreSQL connection string
    REDIS_URL                 Redis connection string
    BACKUP_ENCRYPTION_KEY     Key for backup decryption
    WEBHOOK_URL               Webhook for restore notifications

SAFETY FEATURES:
    - Automatic rollback backup creation
    - Backup integrity verification
    - Service health checks
    - Rollback capability on failure

EOF
}

parse_arguments() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            -e|--environment)
                ENVIRONMENT="$2"
                shift 2
                ;;
            -t|--type)
                RESTORE_TYPE="$2"
                shift 2
                ;;
            -f|--force)
                FORCE=true
                shift
                ;;
            -v|--verify-only)
                VERIFY_ONLY=true
                shift
                ;;
            -n|--no-rollback)
                CREATE_ROLLBACK=false
                shift
                ;;
            -d|--dry-run)
                DRY_RUN=true
                shift
                ;;
            --verbose)
                VERBOSE=true
                shift
                ;;
            -h|--help)
                show_help
                exit 0
                ;;
            -*)
                log "ERROR" "Unknown option: $1"
                show_help
                exit 1
                ;;
            *)
                if [[ -z "$BACKUP_FILE" ]]; then
                    BACKUP_FILE="$1"
                else
                    log "ERROR" "Multiple backup files specified"
                    exit 1
                fi
                shift
                ;;
        esac
    done
    
    if [[ -z "$BACKUP_FILE" ]]; then
        log "ERROR" "Backup file not specified"
        show_help
        exit 1
    fi
}

validate_environment() {
    log "STEP" "Validating environment..."
    
    # Load environment variables
    local env_file="$PROJECT_ROOT/.env.$ENVIRONMENT"
    if [[ -f "$env_file" ]]; then
        set -a
        source "$env_file"
        set +a
        log "INFO" "Loaded environment: $ENVIRONMENT"
    else
        log "WARN" "Environment file not found: $env_file"
    fi
    
    # Validate restore type
    case $RESTORE_TYPE in
        full)
            RESTORE_DATABASE=true
            RESTORE_FILES=true
            RESTORE_CONFIG=true
            ;;
        database)
            RESTORE_DATABASE=true
            RESTORE_FILES=false
            RESTORE_CONFIG=false
            ;;
        files)
            RESTORE_DATABASE=false
            RESTORE_FILES=true
            RESTORE_CONFIG=false
            ;;
        config)
            RESTORE_DATABASE=false
            RESTORE_FILES=false
            RESTORE_CONFIG=true
            ;;
        *)
            log "ERROR" "Invalid restore type: $RESTORE_TYPE"
            exit 1
            ;;
    esac
    
    # Validate backup file
    if [[ ! -f "$BACKUP_FILE" ]]; then
        log "ERROR" "Backup file not found: $BACKUP_FILE"
        exit 1
    fi
    
    log "SUCCESS" "Environment validation completed"
}

check_prerequisites() {
    log "STEP" "Checking prerequisites..."
    
    # Check required commands
    local required_commands=("tar" "gzip")
    
    if [[ "$RESTORE_DATABASE" == true ]]; then
        required_commands+=("psql" "pg_restore")
        if [[ -n "${REDIS_URL:-}" ]]; then
            required_commands+=("redis-cli")
        fi
    fi
    
    # Check if backup is encrypted
    if file "$BACKUP_FILE" | grep -q "openssl"; then
        required_commands+=("openssl")
        if [[ -z "${BACKUP_ENCRYPTION_KEY:-}" ]]; then
            log "ERROR" "Backup is encrypted but BACKUP_ENCRYPTION_KEY not provided"
            exit 1
        fi
    fi
    
    for cmd in "${required_commands[@]}"; do
        if ! command -v "$cmd" &> /dev/null; then
            log "ERROR" "Required command not found: $cmd"
            exit 1
        fi
    done
    
    # Check disk space
    local backup_size=$(du -b "$BACKUP_FILE" | cut -f1)
    local required_space=$((backup_size * 3)) # 3x for extraction + processing
    local available_space=$(df -B1 "$PROJECT_ROOT" | awk 'NR==2 {print $4}')
    
    if [[ $available_space -lt $required_space ]]; then
        log "ERROR" "Insufficient disk space: $(($required_space / 1024 / 1024))MB required, $(($available_space / 1024 / 1024))MB available"
        exit 1
    fi
    
    log "SUCCESS" "Prerequisites check completed"
}

verify_backup_integrity() {
    log "STEP" "Verifying backup integrity..."
    
    # Check if checksum file exists
    local checksum_file="$BACKUP_FILE.sha256"
    if [[ -f "$checksum_file" ]]; then
        log "INFO" "Verifying backup checksum..."
        if sha256sum -c "$checksum_file"; then
            log "SUCCESS" "Backup checksum verified"
        else
            log "ERROR" "Backup checksum verification failed"
            exit 1
        fi
    else
        log "WARN" "No checksum file found, skipping integrity check"
    fi
    
    # Test archive extraction
    log "INFO" "Testing backup archive..."
    if tar -tzf "$BACKUP_FILE" >/dev/null 2>&1; then
        log "SUCCESS" "Backup archive is valid"
    else
        log "ERROR" "Backup archive is corrupted"
        exit 1
    fi
    
    # Extract and validate backup metadata
    mkdir -p "$TEMP_DIR"
    tar -xzf "$BACKUP_FILE" -C "$TEMP_DIR" backup_info.json 2>/dev/null || true
    
    if [[ -f "$TEMP_DIR/backup_info.json" ]]; then
        log "INFO" "Backup metadata found:"
        if command -v jq &> /dev/null; then
            jq . "$TEMP_DIR/backup_info.json" | while read -r line; do
                log "DEBUG" "  $line"
            done
        else
            cat "$TEMP_DIR/backup_info.json"
        fi
    else
        log "WARN" "No backup metadata found"
    fi
    
    log "SUCCESS" "Backup integrity verification completed"
}

confirm_restore() {
    if [[ "$FORCE" == true ]] || [[ "$DRY_RUN" == true ]]; then
        return 0
    fi
    
    echo
    log "WARN" "⚠️  RESTORE OPERATION CONFIRMATION ⚠️"
    echo
    echo "This will restore data to the $ENVIRONMENT environment:"
    echo "  Backup file: $BACKUP_FILE"
    echo "  Restore type: $RESTORE_TYPE"
    echo "  Database: $RESTORE_DATABASE"
    echo "  Files: $RESTORE_FILES"
    echo "  Config: $RESTORE_CONFIG"
    echo "  Rollback backup: $CREATE_ROLLBACK"
    echo
    log "WARN" "This operation will OVERWRITE existing data!"
    echo
    
    read -p "Are you sure you want to continue? (yes/no): " -r
    if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
        log "INFO" "Restore operation cancelled by user"
        exit 0
    fi
}

create_rollback_backup() {
    if [[ "$CREATE_ROLLBACK" != true ]] || [[ "$DRY_RUN" == true ]]; then
        return 0
    fi
    
    log "STEP" "Creating rollback backup..."
    
    local rollback_script="$SCRIPT_DIR/backup.sh"
    if [[ -f "$rollback_script" ]]; then
        log "INFO" "Creating rollback backup before restore..."
        "$rollback_script" -t "$RESTORE_TYPE" -e "$ENVIRONMENT" || {
            log "ERROR" "Failed to create rollback backup"
            exit 1
        }
        log "SUCCESS" "Rollback backup created"
    else
        log "WARN" "Backup script not found, skipping rollback backup creation"
    fi
}

extract_backup() {
    log "STEP" "Extracting backup archive..."
    
    if [[ "$DRY_RUN" == true ]]; then
        log "INFO" "[DRY RUN] Would extract backup archive"
        return 0
    fi
    
    # Clean and create temp directory
    rm -rf "$TEMP_DIR"
    mkdir -p "$TEMP_DIR"
    
    # Extract backup
    log "INFO" "Extracting: $BACKUP_FILE"
    tar -xzf "$BACKUP_FILE" -C "$TEMP_DIR"
    
    # List extracted files
    log "DEBUG" "Extracted files:"
    find "$TEMP_DIR" -type f | while read -r file; do
        local size=$(du -h "$file" | cut -f1)
        log "DEBUG" "  $(basename "$file") ($size)"
    done
    
    log "SUCCESS" "Backup extraction completed"
}

decrypt_files() {
    log "STEP" "Checking for encrypted files..."
    
    local encrypted_files=()
    while IFS= read -r -d '' file; do
        encrypted_files+=("$file")
    done < <(find "$TEMP_DIR" -name "*.enc" -print0 2>/dev/null)
    
    if [[ ${#encrypted_files[@]} -eq 0 ]]; then
        log "INFO" "No encrypted files found"
        return 0
    fi
    
    if [[ "$DRY_RUN" == true ]]; then
        log "INFO" "[DRY RUN] Would decrypt ${#encrypted_files[@]} files"
        return 0
    fi
    
    if [[ -z "${BACKUP_ENCRYPTION_KEY:-}" ]]; then
        log "ERROR" "Encrypted files found but BACKUP_ENCRYPTION_KEY not provided"
        exit 1
    fi
    
    log "INFO" "Decrypting ${#encrypted_files[@]} files..."
    
    for encrypted_file in "${encrypted_files[@]}"; do
        local decrypted_file="${encrypted_file%.enc}"
        log "DEBUG" "Decrypting: $(basename "$encrypted_file")"
        
        openssl enc -aes-256-cbc -d -in "$encrypted_file" -out "$decrypted_file" -k "$BACKUP_ENCRYPTION_KEY"
        rm "$encrypted_file"
    done
    
    log "SUCCESS" "File decryption completed"
}

stop_services() {
    if [[ "$DRY_RUN" == true ]]; then
        log "INFO" "[DRY RUN] Would stop services"
        return 0
    fi
    
    log "STEP" "Stopping services..."
    
    # Stop application services
    local services=("bailbondpro" "nginx" "redis" "postgresql")
    
    for service in "${services[@]}"; do
        if systemctl is-active --quiet "$service" 2>/dev/null; then
            log "INFO" "Stopping service: $service"
            sudo systemctl stop "$service" || log "WARN" "Failed to stop $service"
        elif pgrep -f "$service" >/dev/null; then
            log "INFO" "Stopping process: $service"
            pkill -f "$service" || log "WARN" "Failed to stop $service process"
        fi
    done
    
    # Stop Docker containers if running
    if command -v docker &> /dev/null && docker ps -q --filter "name=bailbondpro" | grep -q .; then
        log "INFO" "Stopping Docker containers..."
        docker-compose -f "$PROJECT_ROOT/docker-compose.yml" down || true
        docker-compose -f "$PROJECT_ROOT/docker-compose.prod.yml" down || true
    fi
    
    log "SUCCESS" "Services stopped"
}

restore_database() {
    if [[ "$RESTORE_DATABASE" != true ]]; then
        return 0
    fi
    
    log "STEP" "Restoring database..."
    
    if [[ "$DRY_RUN" == true ]]; then
        log "INFO" "[DRY RUN] Would restore database"
        return 0
    fi
    
    # PostgreSQL restore
    local pg_backup_files=()
    while IFS= read -r -d '' file; do
        pg_backup_files+=("$file")
    done < <(find "$TEMP_DIR" -name "postgresql_*.sql*" -print0 2>/dev/null)
    
    if [[ ${#pg_backup_files[@]} -gt 0 ]]; then
        local pg_backup="${pg_backup_files[0]}"
        log "INFO" "Restoring PostgreSQL database from: $(basename "$pg_backup")"
        
        # Decompress if needed
        if [[ "$pg_backup" == *.gz ]]; then
            gunzip "$pg_backup"
            pg_backup="${pg_backup%.gz}"
        fi
        
        # Drop existing database and recreate (with confirmation)
        if [[ -n "${DATABASE_URL:-}" ]]; then
            local db_name=$(echo "$DATABASE_URL" | sed -n 's/.*\/\([^?]*\).*/\1/p')
            log "WARN" "Dropping and recreating database: $db_name"
            
            # Create a temporary connection URL for postgres database
            local postgres_url=$(echo "$DATABASE_URL" | sed "s|/$db_name|/postgres|")
            
            psql "$postgres_url" -c "DROP DATABASE IF EXISTS \"$db_name\";"
            psql "$postgres_url" -c "CREATE DATABASE \"$db_name\";"
            
            # Restore database
            psql "$DATABASE_URL" < "$pg_backup"
            
            log "SUCCESS" "PostgreSQL database restored"
        else
            log "ERROR" "DATABASE_URL not set, cannot restore PostgreSQL"
            exit 1
        fi
    else
        log "WARN" "No PostgreSQL backup found"
    fi
    
    # Redis restore
    local redis_backup_files=()
    while IFS= read -r -d '' file; do
        redis_backup_files+=("$file")
    done < <(find "$TEMP_DIR" -name "redis_*.rdb*" -print0 2>/dev/null)
    
    if [[ ${#redis_backup_files[@]} -gt 0 ]]; then
        local redis_backup="${redis_backup_files[0]}"
        log "INFO" "Restoring Redis database from: $(basename "$redis_backup")"
        
        # Decompress if needed
        if [[ "$redis_backup" == *.gz ]]; then
            gunzip "$redis_backup"
            redis_backup="${redis_backup%.gz}"
        fi
        
        if [[ -n "${REDIS_URL:-}" ]]; then
            # Extract Redis connection details
            local redis_host=$(echo "$REDIS_URL" | sed -n 's/.*@\([^:]*\):.*/\1/p')
            local redis_port=$(echo "$REDIS_URL" | sed -n 's/.*:\([0-9]*\).*/\1/p')
            local redis_password=$(echo "$REDIS_URL" | sed -n 's/.*:\([^@]*\)@.*/\1/p')
            
            # Flush existing data
            if [[ -n "$redis_password" ]]; then
                redis-cli -h "$redis_host" -p "$redis_port" -a "$redis_password" FLUSHALL
            else
                redis-cli -h "$redis_host" -p "$redis_port" FLUSHALL
            fi
            
            # Copy RDB file to Redis data directory (this requires Redis to be stopped)
            log "WARN" "Redis restore requires manual RDB file placement and service restart"
            log "INFO" "RDB file location: $redis_backup"
            
            log "SUCCESS" "Redis database restore prepared"
        else
            log "WARN" "REDIS_URL not set, skipping Redis restore"
        fi
    else
        log "WARN" "No Redis backup found"
    fi
}

restore_files() {
    if [[ "$RESTORE_FILES" != true ]]; then
        return 0
    fi
    
    log "STEP" "Restoring application files..."
    
    if [[ "$DRY_RUN" == true ]]; then
        log "INFO" "[DRY RUN] Would restore application files"
        return 0
    fi
    
    local files_backup_files=()
    while IFS= read -r -d '' file; do
        files_backup_files+=("$file")
    done < <(find "$TEMP_DIR" -name "files_*.tar*" -print0 2>/dev/null)
    
    if [[ ${#files_backup_files[@]} -eq 0 ]]; then
        log "WARN" "No files backup found"
        return 0
    fi
    
    local files_backup="${files_backup_files[0]}"
    log "INFO" "Restoring files from: $(basename "$files_backup")"
    
    # Decompress if needed
    if [[ "$files_backup" == *.gz ]]; then
        gunzip "$files_backup"
        files_backup="${files_backup%.gz}"
    fi
    
    # Create backup of current files
    local current_backup="$PROJECT_ROOT/backups/current_files_$TIMESTAMP.tar.gz"
    mkdir -p "$(dirname "$current_backup")"
    
    log "INFO" "Backing up current files to: $(basename "$current_backup")"
    tar -czf "$current_backup" -C "$PROJECT_ROOT" \
        --exclude="node_modules" \
        --exclude=".git" \
        --exclude=".next" \
        --exclude="dist" \
        --exclude="build" \
        --exclude="logs" \
        --exclude="backups" \
        --exclude="temp" \
        . 2>/dev/null || log "WARN" "Some files may not have been backed up"
    
    # Extract files backup
    log "INFO" "Extracting files to project root..."
    tar -xf "$files_backup" -C "$PROJECT_ROOT"
    
    # Set proper permissions
    find "$PROJECT_ROOT" -type f -name "*.sh" -exec chmod +x {} \;
    
    log "SUCCESS" "Application files restored"
}

restore_config() {
    if [[ "$RESTORE_CONFIG" != true ]]; then
        return 0
    fi
    
    log "STEP" "Restoring configuration files..."
    
    if [[ "$DRY_RUN" == true ]]; then
        log "INFO" "[DRY RUN] Would restore configuration files"
        return 0
    fi
    
    local config_backup_files=()
    while IFS= read -r -d '' file; do
        config_backup_files+=("$file")
    done < <(find "$TEMP_DIR" -name "config_*.tar*" -print0 2>/dev/null)
    
    if [[ ${#config_backup_files[@]} -eq 0 ]]; then
        log "WARN" "No configuration backup found"
        return 0
    fi
    
    local config_backup="${config_backup_files[0]}"
    log "INFO" "Restoring configuration from: $(basename "$config_backup")"
    
    # Decompress if needed
    if [[ "$config_backup" == *.gz ]]; then
        gunzip "$config_backup"
        config_backup="${config_backup%.gz}"
    fi
    
    # Extract configuration backup
    log "INFO" "Extracting configuration files..."
    tar -xf "$config_backup" -C "$PROJECT_ROOT"
    
    log "SUCCESS" "Configuration files restored"
}

start_services() {
    if [[ "$DRY_RUN" == true ]]; then
        log "INFO" "[DRY RUN] Would start services"
        return 0
    fi
    
    log "STEP" "Starting services..."
    
    # Start database services first
    local db_services=("postgresql" "redis")
    for service in "${db_services[@]}"; do
        if systemctl list-unit-files --type=service | grep -q "^$service.service"; then
            log "INFO" "Starting service: $service"
            sudo systemctl start "$service" || log "WARN" "Failed to start $service"
            sleep 2
        fi
    done
    
    # Start application services
    local app_services=("nginx" "bailbondpro")
    for service in "${app_services[@]}"; do
        if systemctl list-unit-files --type=service | grep -q "^$service.service"; then
            log "INFO" "Starting service: $service"
            sudo systemctl start "$service" || log "WARN" "Failed to start $service"
            sleep 2
        fi
    done
    
    # Start Docker containers if compose files exist
    if [[ -f "$PROJECT_ROOT/docker-compose.yml" ]]; then
        log "INFO" "Starting Docker containers..."
        cd "$PROJECT_ROOT"
        docker-compose up -d || log "WARN" "Failed to start Docker containers"
    fi
    
    log "SUCCESS" "Services started"
}

verify_restore() {
    log "STEP" "Verifying restore..."
    
    local verification_failed=false
    
    # Database verification
    if [[ "$RESTORE_DATABASE" == true ]]; then
        if [[ -n "${DATABASE_URL:-}" ]]; then
            log "INFO" "Verifying database connection..."
            if psql "$DATABASE_URL" -c "SELECT 1;" >/dev/null 2>&1; then
                log "SUCCESS" "Database connection verified"
            else
                log "ERROR" "Database connection failed"
                verification_failed=true
            fi
        fi
        
        if [[ -n "${REDIS_URL:-}" ]]; then
            log "INFO" "Verifying Redis connection..."
            local redis_host=$(echo "$REDIS_URL" | sed -n 's/.*@\([^:]*\):.*/\1/p')
            local redis_port=$(echo "$REDIS_URL" | sed -n 's/.*:\([0-9]*\).*/\1/p')
            local redis_password=$(echo "$REDIS_URL" | sed -n 's/.*:\([^@]*\)@.*/\1/p')
            
            if [[ -n "$redis_password" ]]; then
                redis_test=$(redis-cli -h "$redis_host" -p "$redis_port" -a "$redis_password" ping 2>/dev/null || echo "FAILED")
            else
                redis_test=$(redis-cli -h "$redis_host" -p "$redis_port" ping 2>/dev/null || echo "FAILED")
            fi
            
            if [[ "$redis_test" == "PONG" ]]; then
                log "SUCCESS" "Redis connection verified"
            else
                log "ERROR" "Redis connection failed"
                verification_failed=true
            fi
        fi
    fi
    
    # Application verification
    if [[ "$RESTORE_FILES" == true ]]; then
        log "INFO" "Verifying application files..."
        
        local critical_files=("package.json" "src/" "public/")
        for file in "${critical_files[@]}"; do
            if [[ -e "$PROJECT_ROOT/$file" ]]; then
                log "DEBUG" "Found: $file"
            else
                log "WARN" "Missing: $file"
            fi
        done
    fi
    
    # Service health checks
    log "INFO" "Performing health checks..."
    
    # Wait for services to be ready
    sleep 10
    
    # Check if application is responding
    local health_endpoints=("http://localhost:3000/health" "http://localhost:8080/health")
    for endpoint in "${health_endpoints[@]}"; do
        if curl -f -s "$endpoint" >/dev/null 2>&1; then
            log "SUCCESS" "Health check passed: $endpoint"
            break
        else
            log "DEBUG" "Health check failed: $endpoint"
        fi
    done
    
    if [[ "$verification_failed" == true ]]; then
        log "ERROR" "Restore verification failed"
        return 1
    else
        log "SUCCESS" "Restore verification completed"
        return 0
    fi
}

send_notification() {
    local status="$1"
    local message="$2"
    
    if [[ -n "${WEBHOOK_URL:-}" ]]; then
        curl -X POST "$WEBHOOK_URL" \
            -H "Content-Type: application/json" \
            -d "{
                \"type\": \"restore\",
                \"environment\": \"$ENVIRONMENT\",
                \"restore_type\": \"$RESTORE_TYPE\",
                \"backup_file\": \"$(basename "$BACKUP_FILE")\",
                \"status\": \"$status\",
                \"message\": \"$message\",
                \"timestamp\": \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\",
                \"hostname\": \"$(hostname)\"
            }" || log "WARN" "Failed to send notification"
    fi
}

cleanup_temp() {
    if [[ -d "$TEMP_DIR" ]]; then
        rm -rf "$TEMP_DIR"
        log "DEBUG" "Temporary directory cleaned up"
    fi
}

main() {
    show_banner
    
    log "INFO" "Starting BailBondPro restore process..."
    log "INFO" "Backup file: $BACKUP_FILE"
    log "INFO" "Restore type: $RESTORE_TYPE"
    log "INFO" "Environment: $ENVIRONMENT"
    log "INFO" "Timestamp: $TIMESTAMP"
    
    validate_environment
    check_prerequisites
    verify_backup_integrity
    
    if [[ "$VERIFY_ONLY" == true ]]; then
        log "SUCCESS" "🎉 Backup verification completed successfully!"
        exit 0
    fi
    
    confirm_restore
    create_rollback_backup
    extract_backup
    decrypt_files
    
    stop_services
    
    # Perform restore
    restore_database
    restore_files
    restore_config
    
    start_services
    
    # Verify restore
    if verify_restore; then
        log "SUCCESS" "🎉 Restore completed successfully!"
        log "INFO" "Restore log: $RESTORE_LOG"
        send_notification "success" "Restore completed successfully"
    else
        log "ERROR" "Restore verification failed"
        send_notification "error" "Restore verification failed"
        exit 1
    fi
    
    cleanup_temp
}

# Error handling
trap 'log "ERROR" "Restore failed at line $LINENO"; send_notification "error" "Restore failed"; cleanup_temp; exit 1' ERR
trap 'cleanup_temp' EXIT

# Parse arguments and run
parse_arguments "$@"
main