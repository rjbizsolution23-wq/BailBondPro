#!/bin/bash

# ========================================================================
# BailBondPro - Backup Script
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
TEMP_DIR="/tmp/bailbondpro_backup_$TIMESTAMP"

# Default values
BACKUP_TYPE="full"
ENVIRONMENT="production"
ENCRYPT=true
COMPRESS=true
UPLOAD_TO_CLOUD=false
RETENTION_DAYS=30
VERBOSE=false
DRY_RUN=false

# Backup configuration
DATABASE_BACKUP=true
FILES_BACKUP=true
CONFIG_BACKUP=true
LOGS_BACKUP=false

# Cloud storage settings
AWS_S3_BUCKET=""
GOOGLE_CLOUD_BUCKET=""
AZURE_CONTAINER=""

# Functions
log() {
    local level=$1
    shift
    local message="$*"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    
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
    ____             _                 
   |  _ \           | |                
   | |_) | __ _  ___| | ___   _ _ __   
   |  _ < / _` |/ __| |/ / | | | '_ \  
   | |_) | (_| | (__|   <| |_| | |_) | 
   |____/ \__,_|\___|_|\_\\__,_| .__/  
                               | |     
   BailBondPro Backup System   |_|     
EOF
    echo -e "${NC}"
}

show_help() {
    cat << EOF
BailBondPro Backup Script

Usage: $0 [OPTIONS]

OPTIONS:
    -t, --type TYPE           Backup type (full, database, files, config)
    -e, --environment ENV     Environment (production, staging, development)
    -n, --no-encrypt          Disable encryption
    -c, --no-compress         Disable compression
    -u, --upload              Upload to cloud storage
    -r, --retention DAYS      Retention period in days (default: 30)
    -d, --dry-run             Show what would be backed up without executing
    -v, --verbose             Enable verbose logging
    -h, --help                Show this help message

BACKUP TYPES:
    full                      Complete backup (database + files + config)
    database                  Database only
    files                     Application files only
    config                    Configuration files only

EXAMPLES:
    $0                        # Full backup with default settings
    $0 -t database            # Database backup only
    $0 -e staging -u          # Staging backup with cloud upload
    $0 -d                     # Dry run to see what would be backed up

ENVIRONMENT VARIABLES:
    DATABASE_URL              PostgreSQL connection string
    REDIS_URL                 Redis connection string
    AWS_ACCESS_KEY_ID         AWS credentials for S3 upload
    AWS_SECRET_ACCESS_KEY     AWS credentials for S3 upload
    BACKUP_ENCRYPTION_KEY     Key for backup encryption
    WEBHOOK_URL               Webhook for backup notifications

EOF
}

parse_arguments() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            -t|--type)
                BACKUP_TYPE="$2"
                shift 2
                ;;
            -e|--environment)
                ENVIRONMENT="$2"
                shift 2
                ;;
            -n|--no-encrypt)
                ENCRYPT=false
                shift
                ;;
            -c|--no-compress)
                COMPRESS=false
                shift
                ;;
            -u|--upload)
                UPLOAD_TO_CLOUD=true
                shift
                ;;
            -r|--retention)
                RETENTION_DAYS="$2"
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
    
    # Validate backup type
    case $BACKUP_TYPE in
        full)
            DATABASE_BACKUP=true
            FILES_BACKUP=true
            CONFIG_BACKUP=true
            ;;
        database)
            DATABASE_BACKUP=true
            FILES_BACKUP=false
            CONFIG_BACKUP=false
            ;;
        files)
            DATABASE_BACKUP=false
            FILES_BACKUP=true
            CONFIG_BACKUP=false
            ;;
        config)
            DATABASE_BACKUP=false
            FILES_BACKUP=false
            CONFIG_BACKUP=true
            ;;
        *)
            log "ERROR" "Invalid backup type: $BACKUP_TYPE"
            exit 1
            ;;
    esac
    
    log "SUCCESS" "Environment validation completed"
}

check_prerequisites() {
    log "STEP" "Checking prerequisites..."
    
    # Check required commands
    local required_commands=("tar" "gzip")
    
    if [[ "$DATABASE_BACKUP" == true ]]; then
        required_commands+=("pg_dump")
        if [[ -n "${REDIS_URL:-}" ]]; then
            required_commands+=("redis-cli")
        fi
    fi
    
    if [[ "$ENCRYPT" == true ]]; then
        required_commands+=("openssl")
    fi
    
    if [[ "$UPLOAD_TO_CLOUD" == true ]]; then
        if [[ -n "${AWS_S3_BUCKET:-}" ]]; then
            required_commands+=("aws")
        fi
        if [[ -n "${GOOGLE_CLOUD_BUCKET:-}" ]]; then
            required_commands+=("gsutil")
        fi
        if [[ -n "${AZURE_CONTAINER:-}" ]]; then
            required_commands+=("az")
        fi
    fi
    
    for cmd in "${required_commands[@]}"; do
        if ! command -v "$cmd" &> /dev/null; then
            log "ERROR" "Required command not found: $cmd"
            exit 1
        fi
    done
    
    # Check disk space (minimum 1GB)
    local available_space
    if command -v df &> /dev/null; then
        available_space=$(df -h "$BACKUP_DIR" 2>/dev/null | awk 'NR==2 {print $4}' | sed 's/G.*//' || echo "0")
        if [[ "$available_space" -lt 1 ]]; then
            log "ERROR" "Insufficient disk space: ${available_space}GB available (minimum 1GB required)"
            exit 1
        fi
    fi
    
    log "SUCCESS" "Prerequisites check completed"
}

create_backup_structure() {
    log "STEP" "Creating backup structure..."
    
    # Create directories
    mkdir -p "$BACKUP_DIR"
    mkdir -p "$TEMP_DIR"
    
    # Create backup metadata
    cat > "$TEMP_DIR/backup_info.json" << EOF
{
    "timestamp": "$TIMESTAMP",
    "environment": "$ENVIRONMENT",
    "backup_type": "$BACKUP_TYPE",
    "version": "$(git rev-parse --short HEAD 2>/dev/null || echo 'unknown')",
    "hostname": "$(hostname)",
    "user": "$(whoami)",
    "encrypted": $ENCRYPT,
    "compressed": $COMPRESS,
    "components": {
        "database": $DATABASE_BACKUP,
        "files": $FILES_BACKUP,
        "config": $CONFIG_BACKUP,
        "logs": $LOGS_BACKUP
    }
}
EOF
    
    log "SUCCESS" "Backup structure created"
}

backup_database() {
    if [[ "$DATABASE_BACKUP" != true ]]; then
        return 0
    fi
    
    log "STEP" "Backing up database..."
    
    if [[ "$DRY_RUN" == true ]]; then
        log "INFO" "[DRY RUN] Would backup database"
        return 0
    fi
    
    # PostgreSQL backup
    if [[ -n "${DATABASE_URL:-}" ]]; then
        log "INFO" "Backing up PostgreSQL database..."
        local pg_backup_file="$TEMP_DIR/postgresql_$TIMESTAMP.sql"
        
        pg_dump "$DATABASE_URL" > "$pg_backup_file"
        
        if [[ "$COMPRESS" == true ]]; then
            gzip "$pg_backup_file"
            pg_backup_file="$pg_backup_file.gz"
        fi
        
        log "SUCCESS" "PostgreSQL backup completed: $(basename "$pg_backup_file")"
    else
        log "WARN" "DATABASE_URL not set, skipping PostgreSQL backup"
    fi
    
    # Redis backup
    if [[ -n "${REDIS_URL:-}" ]]; then
        log "INFO" "Backing up Redis database..."
        local redis_backup_file="$TEMP_DIR/redis_$TIMESTAMP.rdb"
        
        # Extract Redis connection details
        local redis_host=$(echo "$REDIS_URL" | sed -n 's/.*@\([^:]*\):.*/\1/p')
        local redis_port=$(echo "$REDIS_URL" | sed -n 's/.*:\([0-9]*\).*/\1/p')
        local redis_password=$(echo "$REDIS_URL" | sed -n 's/.*:\([^@]*\)@.*/\1/p')
        
        if [[ -n "$redis_password" ]]; then
            redis-cli -h "$redis_host" -p "$redis_port" -a "$redis_password" --rdb "$redis_backup_file"
        else
            redis-cli -h "$redis_host" -p "$redis_port" --rdb "$redis_backup_file"
        fi
        
        if [[ "$COMPRESS" == true ]]; then
            gzip "$redis_backup_file"
            redis_backup_file="$redis_backup_file.gz"
        fi
        
        log "SUCCESS" "Redis backup completed: $(basename "$redis_backup_file")"
    else
        log "WARN" "REDIS_URL not set, skipping Redis backup"
    fi
}

backup_files() {
    if [[ "$FILES_BACKUP" != true ]]; then
        return 0
    fi
    
    log "STEP" "Backing up application files..."
    
    if [[ "$DRY_RUN" == true ]]; then
        log "INFO" "[DRY RUN] Would backup application files"
        return 0
    fi
    
    local files_backup="$TEMP_DIR/files_$TIMESTAMP.tar"
    
    # Create list of files to backup
    local include_patterns=(
        "src/"
        "public/"
        "package.json"
        "package-lock.json"
        "tsconfig.json"
        "next.config.js"
        "tailwind.config.js"
        "prisma/"
        "docs/"
        "scripts/"
        "uploads/"
    )
    
    # Create list of files to exclude
    local exclude_patterns=(
        "node_modules"
        ".git"
        ".next"
        "dist"
        "build"
        "logs"
        "backups"
        "temp"
        ".env*"
        "*.log"
    )
    
    # Build tar command
    local tar_cmd="tar -cf $files_backup -C $PROJECT_ROOT"
    
    # Add exclude patterns
    for pattern in "${exclude_patterns[@]}"; do
        tar_cmd="$tar_cmd --exclude=$pattern"
    done
    
    # Add include patterns
    for pattern in "${include_patterns[@]}"; do
        if [[ -e "$PROJECT_ROOT/$pattern" ]]; then
            tar_cmd="$tar_cmd $pattern"
        fi
    done
    
    # Execute tar command
    eval "$tar_cmd" 2>/dev/null || log "WARN" "Some files may not have been backed up"
    
    if [[ "$COMPRESS" == true ]]; then
        gzip "$files_backup"
        files_backup="$files_backup.gz"
    fi
    
    local file_size=$(du -h "$files_backup" | cut -f1)
    log "SUCCESS" "Files backup completed: $(basename "$files_backup") ($file_size)"
}

backup_config() {
    if [[ "$CONFIG_BACKUP" != true ]]; then
        return 0
    fi
    
    log "STEP" "Backing up configuration files..."
    
    if [[ "$DRY_RUN" == true ]]; then
        log "INFO" "[DRY RUN] Would backup configuration files"
        return 0
    fi
    
    local config_backup="$TEMP_DIR/config_$TIMESTAMP.tar"
    
    # Configuration files to backup
    local config_files=(
        ".env.example"
        ".env.production"
        ".env.staging"
        "docker-compose.yml"
        "docker-compose.prod.yml"
        "Dockerfile"
        "vercel.json"
        "railway.json"
        ".github/"
        "nginx.conf"
        "prometheus.yml"
        "grafana/"
    )
    
    # Create tar archive
    tar -cf "$config_backup" -C "$PROJECT_ROOT" \
        $(for file in "${config_files[@]}"; do
            if [[ -e "$PROJECT_ROOT/$file" ]]; then
                echo "$file"
            fi
        done) 2>/dev/null || log "WARN" "Some config files may not have been backed up"
    
    if [[ "$COMPRESS" == true ]]; then
        gzip "$config_backup"
        config_backup="$config_backup.gz"
    fi
    
    local file_size=$(du -h "$config_backup" | cut -f1)
    log "SUCCESS" "Configuration backup completed: $(basename "$config_backup") ($file_size)"
}

encrypt_backup() {
    if [[ "$ENCRYPT" != true ]]; then
        return 0
    fi
    
    log "STEP" "Encrypting backup files..."
    
    if [[ "$DRY_RUN" == true ]]; then
        log "INFO" "[DRY RUN] Would encrypt backup files"
        return 0
    fi
    
    local encryption_key="${BACKUP_ENCRYPTION_KEY:-$(openssl rand -hex 32)}"
    
    # Encrypt all backup files
    for file in "$TEMP_DIR"/*.{sql,tar,rdb}*; do
        if [[ -f "$file" ]] && [[ "$file" != *.enc ]]; then
            log "DEBUG" "Encrypting: $(basename "$file")"
            openssl enc -aes-256-cbc -salt -in "$file" -out "$file.enc" -k "$encryption_key"
            rm "$file"
        fi
    done
    
    # Save encryption key securely (for recovery)
    if [[ -z "${BACKUP_ENCRYPTION_KEY:-}" ]]; then
        echo "$encryption_key" > "$TEMP_DIR/encryption_key.txt"
        log "WARN" "Encryption key saved to: $TEMP_DIR/encryption_key.txt"
        log "WARN" "Store this key securely - it's required for backup recovery!"
    fi
    
    log "SUCCESS" "Backup encryption completed"
}

create_final_archive() {
    log "STEP" "Creating final backup archive..."
    
    if [[ "$DRY_RUN" == true ]]; then
        log "INFO" "[DRY RUN] Would create final backup archive"
        return 0
    fi
    
    local final_backup="$BACKUP_DIR/bailbondpro_${BACKUP_TYPE}_${ENVIRONMENT}_$TIMESTAMP.tar.gz"
    
    # Create final compressed archive
    tar -czf "$final_backup" -C "$TEMP_DIR" .
    
    local file_size=$(du -h "$final_backup" | cut -f1)
    local file_count=$(find "$TEMP_DIR" -type f | wc -l)
    
    log "SUCCESS" "Final backup created: $(basename "$final_backup") ($file_size, $file_count files)"
    
    # Generate checksum
    local checksum_file="$final_backup.sha256"
    sha256sum "$final_backup" > "$checksum_file"
    log "INFO" "Checksum created: $(basename "$checksum_file")"
    
    # Store backup path for upload
    echo "$final_backup" > "$TEMP_DIR/backup_path.txt"
}

upload_to_cloud() {
    if [[ "$UPLOAD_TO_CLOUD" != true ]]; then
        return 0
    fi
    
    log "STEP" "Uploading backup to cloud storage..."
    
    if [[ "$DRY_RUN" == true ]]; then
        log "INFO" "[DRY RUN] Would upload backup to cloud storage"
        return 0
    fi
    
    local backup_file=$(cat "$TEMP_DIR/backup_path.txt")
    local backup_name=$(basename "$backup_file")
    
    # Upload to AWS S3
    if [[ -n "${AWS_S3_BUCKET:-}" ]] && command -v aws &> /dev/null; then
        log "INFO" "Uploading to AWS S3..."
        aws s3 cp "$backup_file" "s3://$AWS_S3_BUCKET/backups/$backup_name"
        aws s3 cp "$backup_file.sha256" "s3://$AWS_S3_BUCKET/backups/$backup_name.sha256"
        log "SUCCESS" "Uploaded to S3: s3://$AWS_S3_BUCKET/backups/$backup_name"
    fi
    
    # Upload to Google Cloud Storage
    if [[ -n "${GOOGLE_CLOUD_BUCKET:-}" ]] && command -v gsutil &> /dev/null; then
        log "INFO" "Uploading to Google Cloud Storage..."
        gsutil cp "$backup_file" "gs://$GOOGLE_CLOUD_BUCKET/backups/$backup_name"
        gsutil cp "$backup_file.sha256" "gs://$GOOGLE_CLOUD_BUCKET/backups/$backup_name.sha256"
        log "SUCCESS" "Uploaded to GCS: gs://$GOOGLE_CLOUD_BUCKET/backups/$backup_name"
    fi
    
    # Upload to Azure Blob Storage
    if [[ -n "${AZURE_CONTAINER:-}" ]] && command -v az &> /dev/null; then
        log "INFO" "Uploading to Azure Blob Storage..."
        az storage blob upload --file "$backup_file" --name "backups/$backup_name" --container-name "$AZURE_CONTAINER"
        az storage blob upload --file "$backup_file.sha256" --name "backups/$backup_name.sha256" --container-name "$AZURE_CONTAINER"
        log "SUCCESS" "Uploaded to Azure: $AZURE_CONTAINER/backups/$backup_name"
    fi
}

cleanup_old_backups() {
    log "STEP" "Cleaning up old backups..."
    
    if [[ "$DRY_RUN" == true ]]; then
        log "INFO" "[DRY RUN] Would clean up backups older than $RETENTION_DAYS days"
        return 0
    fi
    
    # Local cleanup
    local deleted_count=0
    while IFS= read -r -d '' file; do
        rm "$file"
        ((deleted_count++))
    done < <(find "$BACKUP_DIR" -name "bailbondpro_*.tar.gz" -mtime +$RETENTION_DAYS -print0 2>/dev/null)
    
    if [[ $deleted_count -gt 0 ]]; then
        log "INFO" "Deleted $deleted_count old local backups"
    fi
    
    # Cloud cleanup (if configured)
    if [[ "$UPLOAD_TO_CLOUD" == true ]]; then
        # AWS S3 cleanup
        if [[ -n "${AWS_S3_BUCKET:-}" ]] && command -v aws &> /dev/null; then
            local cutoff_date=$(date -d "$RETENTION_DAYS days ago" +%Y-%m-%d)
            aws s3 ls "s3://$AWS_S3_BUCKET/backups/" | while read -r line; do
                local file_date=$(echo "$line" | awk '{print $1}')
                local file_name=$(echo "$line" | awk '{print $4}')
                if [[ "$file_date" < "$cutoff_date" ]]; then
                    aws s3 rm "s3://$AWS_S3_BUCKET/backups/$file_name"
                    log "DEBUG" "Deleted from S3: $file_name"
                fi
            done
        fi
    fi
    
    log "SUCCESS" "Old backups cleanup completed"
}

send_notification() {
    local status="$1"
    local message="$2"
    local backup_file="$3"
    
    if [[ -n "${WEBHOOK_URL:-}" ]]; then
        local file_size=""
        if [[ -f "$backup_file" ]]; then
            file_size=$(du -h "$backup_file" | cut -f1)
        fi
        
        curl -X POST "$WEBHOOK_URL" \
            -H "Content-Type: application/json" \
            -d "{
                \"type\": \"backup\",
                \"environment\": \"$ENVIRONMENT\",
                \"backup_type\": \"$BACKUP_TYPE\",
                \"status\": \"$status\",
                \"message\": \"$message\",
                \"file_size\": \"$file_size\",
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
    
    log "INFO" "Starting BailBondPro backup process..."
    log "INFO" "Backup type: $BACKUP_TYPE"
    log "INFO" "Environment: $ENVIRONMENT"
    log "INFO" "Timestamp: $TIMESTAMP"
    
    validate_environment
    check_prerequisites
    create_backup_structure
    
    # Perform backups
    backup_database
    backup_files
    backup_config
    
    # Process backups
    encrypt_backup
    create_final_archive
    upload_to_cloud
    cleanup_old_backups
    
    # Get final backup file
    local final_backup=""
    if [[ -f "$TEMP_DIR/backup_path.txt" ]]; then
        final_backup=$(cat "$TEMP_DIR/backup_path.txt")
    fi
    
    log "SUCCESS" "🎉 Backup completed successfully!"
    if [[ -n "$final_backup" ]]; then
        log "INFO" "Backup location: $final_backup"
        local file_size=$(du -h "$final_backup" | cut -f1)
        log "INFO" "Backup size: $file_size"
    fi
    
    send_notification "success" "Backup completed successfully" "$final_backup"
    cleanup_temp
}

# Error handling
trap 'log "ERROR" "Backup failed at line $LINENO"; send_notification "error" "Backup failed" ""; cleanup_temp; exit 1' ERR
trap 'cleanup_temp' EXIT

# Parse arguments and run
parse_arguments "$@"
main