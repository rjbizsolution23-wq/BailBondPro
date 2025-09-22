# Backup and Disaster Recovery Guide

This document outlines the comprehensive backup and disaster recovery procedures for the BailBondPro bail bond management system, ensuring business continuity and data protection.

## Table of Contents

- [Overview](#overview)
- [Backup Strategy](#backup-strategy)
- [Database Backups](#database-backups)
- [Application Backups](#application-backups)
- [File System Backups](#file-system-backups)
- [Automated Backup Scripts](#automated-backup-scripts)
- [Backup Verification](#backup-verification)
- [Disaster Recovery](#disaster-recovery)
- [Recovery Testing](#recovery-testing)
- [Monitoring and Alerting](#monitoring-and-alerting)
- [Compliance and Retention](#compliance-and-retention)
- [Emergency Procedures](#emergency-procedures)

## Overview

### Backup Objectives

- **Recovery Time Objective (RTO)**: 4 hours maximum downtime
- **Recovery Point Objective (RPO)**: 1 hour maximum data loss
- **Backup Frequency**: Database every 4 hours, files daily
- **Retention Period**: 90 days for daily, 12 months for monthly
- **Geographic Distribution**: Primary and secondary backup locations

### Critical Data Classification

| Data Type | Criticality | Backup Frequency | Retention |
|-----------|-------------|------------------|-----------|
| Client Records | Critical | Every 4 hours | 7 years |
| Bond Information | Critical | Every 4 hours | 7 years |
| Payment Data | Critical | Every 4 hours | 7 years |
| System Logs | High | Daily | 1 year |
| Configuration | High | Daily | 1 year |
| Application Code | Medium | On change | 2 years |
| Static Assets | Low | Weekly | 6 months |

## Backup Strategy

### 3-2-1 Backup Rule

- **3** copies of important data
- **2** different storage media types
- **1** offsite backup location

### Backup Types

1. **Full Backup**: Complete system backup (weekly)
2. **Incremental Backup**: Changes since last backup (daily)
3. **Differential Backup**: Changes since last full backup (twice daily)
4. **Transaction Log Backup**: Database transaction logs (every 15 minutes)

### Storage Locations

```bash
# Primary backup storage
PRIMARY_BACKUP="/backups/primary"

# Secondary backup storage (NAS)
SECONDARY_BACKUP="/mnt/nas/backups"

# Cloud backup storage
CLOUD_BACKUP="s3://bailbondpro-backups"

# Archive storage
ARCHIVE_BACKUP="s3://bailbondpro-archive"
```

## Database Backups

### PostgreSQL Backup Configuration

```bash
#!/bin/bash
# database-backup.sh

# Configuration
DB_HOST="localhost"
DB_PORT="5432"
DB_NAME="bailbondpro"
DB_USER="backup_user"
BACKUP_DIR="/backups/database"
DATE=$(date +%Y%m%d_%H%M%S)
RETENTION_DAYS=90

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Full database backup
perform_full_backup() {
    echo "Starting full database backup..."
    
    pg_dump \
        --host="$DB_HOST" \
        --port="$DB_PORT" \
        --username="$DB_USER" \
        --dbname="$DB_NAME" \
        --format=custom \
        --compress=9 \
        --verbose \
        --file="$BACKUP_DIR/full_backup_$DATE.dump"
    
    if [ $? -eq 0 ]; then
        echo "✓ Full backup completed: full_backup_$DATE.dump"
        
        # Create checksum
        md5sum "$BACKUP_DIR/full_backup_$DATE.dump" > "$BACKUP_DIR/full_backup_$DATE.dump.md5"
        
        # Compress backup
        gzip "$BACKUP_DIR/full_backup_$DATE.dump"
        
        return 0
    else
        echo "✗ Full backup failed"
        return 1
    fi
}

# Schema-only backup
perform_schema_backup() {
    echo "Starting schema backup..."
    
    pg_dump \
        --host="$DB_HOST" \
        --port="$DB_PORT" \
        --username="$DB_USER" \
        --dbname="$DB_NAME" \
        --schema-only \
        --file="$BACKUP_DIR/schema_backup_$DATE.sql"
    
    if [ $? -eq 0 ]; then
        echo "✓ Schema backup completed"
        gzip "$BACKUP_DIR/schema_backup_$DATE.sql"
    else
        echo "✗ Schema backup failed"
    fi
}

# Data-only backup
perform_data_backup() {
    echo "Starting data-only backup..."
    
    pg_dump \
        --host="$DB_HOST" \
        --port="$DB_PORT" \
        --username="$DB_USER" \
        --dbname="$DB_NAME" \
        --data-only \
        --format=custom \
        --compress=9 \
        --file="$BACKUP_DIR/data_backup_$DATE.dump"
    
    if [ $? -eq 0 ]; then
        echo "✓ Data backup completed"
        gzip "$BACKUP_DIR/data_backup_$DATE.dump"
    else
        echo "✗ Data backup failed"
    fi
}

# Transaction log backup
perform_wal_backup() {
    echo "Starting WAL backup..."
    
    # Archive WAL files
    pg_receivewal \
        --host="$DB_HOST" \
        --port="$DB_PORT" \
        --username="$DB_USER" \
        --directory="$BACKUP_DIR/wal" \
        --compress=9 \
        --verbose
}

# Cleanup old backups
cleanup_old_backups() {
    echo "Cleaning up backups older than $RETENTION_DAYS days..."
    
    find "$BACKUP_DIR" -name "*.dump.gz" -mtime +$RETENTION_DAYS -delete
    find "$BACKUP_DIR" -name "*.sql.gz" -mtime +$RETENTION_DAYS -delete
    find "$BACKUP_DIR" -name "*.md5" -mtime +$RETENTION_DAYS -delete
    
    echo "✓ Cleanup completed"
}

# Main execution
case "$1" in
    full)
        perform_full_backup
        ;;
    schema)
        perform_schema_backup
        ;;
    data)
        perform_data_backup
        ;;
    wal)
        perform_wal_backup
        ;;
    cleanup)
        cleanup_old_backups
        ;;
    all)
        perform_full_backup
        perform_schema_backup
        perform_data_backup
        cleanup_old_backups
        ;;
    *)
        echo "Usage: $0 {full|schema|data|wal|cleanup|all}"
        exit 1
        ;;
esac
```

### Database Backup Verification

```sql
-- Create backup verification function
CREATE OR REPLACE FUNCTION verify_backup_integrity()
RETURNS TABLE(
    table_name TEXT,
    row_count BIGINT,
    checksum TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        t.table_name::TEXT,
        (SELECT COUNT(*) FROM information_schema.tables WHERE table_name = t.table_name) as row_count,
        md5(array_to_string(array_agg(t.table_name ORDER BY t.table_name), ''))::TEXT as checksum
    FROM information_schema.tables t
    WHERE t.table_schema = 'public'
    GROUP BY t.table_name
    ORDER BY t.table_name;
END;
$$ LANGUAGE plpgsql;

-- Generate backup verification report
SELECT * FROM verify_backup_integrity();
```

### Point-in-Time Recovery Setup

```bash
#!/bin/bash
# setup-pitr.sh

# Configure PostgreSQL for PITR
echo "Configuring PostgreSQL for Point-in-Time Recovery..."

# Update postgresql.conf
cat >> /etc/postgresql/15/main/postgresql.conf << EOF
# PITR Configuration
wal_level = replica
archive_mode = on
archive_command = 'cp %p /backups/wal/%f'
max_wal_senders = 3
wal_keep_size = 1GB
EOF

# Restart PostgreSQL
systemctl restart postgresql

echo "✓ PITR configuration completed"
```

## Application Backups

### Application Code Backup

```bash
#!/bin/bash
# application-backup.sh

APP_DIR="/opt/bailbondpro"
BACKUP_DIR="/backups/application"
DATE=$(date +%Y%m%d_%H%M%S)
RETENTION_DAYS=30

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Application backup
backup_application() {
    echo "Starting application backup..."
    
    # Create tar archive excluding unnecessary files
    tar -czf "$BACKUP_DIR/app_backup_$DATE.tar.gz" \
        --exclude="node_modules" \
        --exclude=".git" \
        --exclude="logs" \
        --exclude="tmp" \
        --exclude="*.log" \
        -C "$APP_DIR" .
    
    if [ $? -eq 0 ]; then
        echo "✓ Application backup completed: app_backup_$DATE.tar.gz"
        
        # Create checksum
        md5sum "$BACKUP_DIR/app_backup_$DATE.tar.gz" > "$BACKUP_DIR/app_backup_$DATE.tar.gz.md5"
        
        return 0
    else
        echo "✗ Application backup failed"
        return 1
    fi
}

# Configuration backup
backup_configuration() {
    echo "Starting configuration backup..."
    
    # Backup configuration files
    tar -czf "$BACKUP_DIR/config_backup_$DATE.tar.gz" \
        /etc/nginx/sites-available/bailbondpro \
        /etc/systemd/system/bailbondpro.service \
        "$APP_DIR/.env.production" \
        "$APP_DIR/docker-compose.yml" \
        2>/dev/null
    
    if [ $? -eq 0 ]; then
        echo "✓ Configuration backup completed"
    else
        echo "✗ Configuration backup failed"
    fi
}

# SSL certificates backup
backup_ssl() {
    echo "Starting SSL certificates backup..."
    
    tar -czf "$BACKUP_DIR/ssl_backup_$DATE.tar.gz" \
        /etc/ssl/certs/bailbondpro.crt \
        /etc/ssl/private/bailbondpro.key \
        2>/dev/null
    
    if [ $? -eq 0 ]; then
        echo "✓ SSL backup completed"
    else
        echo "✗ SSL backup failed"
    fi
}

# Cleanup old backups
cleanup_old_backups() {
    echo "Cleaning up application backups older than $RETENTION_DAYS days..."
    
    find "$BACKUP_DIR" -name "*.tar.gz" -mtime +$RETENTION_DAYS -delete
    find "$BACKUP_DIR" -name "*.md5" -mtime +$RETENTION_DAYS -delete
    
    echo "✓ Cleanup completed"
}

# Execute based on argument
case "$1" in
    app)
        backup_application
        ;;
    config)
        backup_configuration
        ;;
    ssl)
        backup_ssl
        ;;
    cleanup)
        cleanup_old_backups
        ;;
    all)
        backup_application
        backup_configuration
        backup_ssl
        cleanup_old_backups
        ;;
    *)
        echo "Usage: $0 {app|config|ssl|cleanup|all}"
        exit 1
        ;;
esac
```

### Docker Container Backups

```bash
#!/bin/bash
# docker-backup.sh

BACKUP_DIR="/backups/docker"
DATE=$(date +%Y%m%d_%H%M%S)

# Backup Docker images
backup_images() {
    echo "Backing up Docker images..."
    
    # Get list of images
    docker images --format "table {{.Repository}}:{{.Tag}}" | grep -v REPOSITORY > /tmp/docker_images.txt
    
    # Save each image
    while read -r image; do
        if [ "$image" != "<none>:<none>" ]; then
            image_name=$(echo "$image" | tr '/' '_' | tr ':' '_')
            echo "Saving image: $image"
            docker save "$image" | gzip > "$BACKUP_DIR/image_${image_name}_$DATE.tar.gz"
        fi
    done < /tmp/docker_images.txt
    
    rm /tmp/docker_images.txt
    echo "✓ Docker images backup completed"
}

# Backup Docker volumes
backup_volumes() {
    echo "Backing up Docker volumes..."
    
    # Get list of volumes
    docker volume ls --format "{{.Name}}" > /tmp/docker_volumes.txt
    
    # Backup each volume
    while read -r volume; do
        echo "Backing up volume: $volume"
        docker run --rm \
            -v "$volume":/data \
            -v "$BACKUP_DIR":/backup \
            alpine tar czf "/backup/volume_${volume}_$DATE.tar.gz" -C /data .
    done < /tmp/docker_volumes.txt
    
    rm /tmp/docker_volumes.txt
    echo "✓ Docker volumes backup completed"
}

# Backup Docker Compose configurations
backup_compose() {
    echo "Backing up Docker Compose configurations..."
    
    find /opt -name "docker-compose*.yml" -exec cp {} "$BACKUP_DIR/" \;
    
    echo "✓ Docker Compose backup completed"
}

# Execute based on argument
case "$1" in
    images)
        backup_images
        ;;
    volumes)
        backup_volumes
        ;;
    compose)
        backup_compose
        ;;
    all)
        backup_images
        backup_volumes
        backup_compose
        ;;
    *)
        echo "Usage: $0 {images|volumes|compose|all}"
        exit 1
        ;;
esac
```

## File System Backups

### System Files Backup

```bash
#!/bin/bash
# system-backup.sh

BACKUP_DIR="/backups/system"
DATE=$(date +%Y%m%d_%H%M%S)
RETENTION_DAYS=60

# System configuration backup
backup_system_config() {
    echo "Starting system configuration backup..."
    
    tar -czf "$BACKUP_DIR/system_config_$DATE.tar.gz" \
        /etc/hosts \
        /etc/hostname \
        /etc/fstab \
        /etc/crontab \
        /etc/systemd/system/ \
        /etc/nginx/ \
        /etc/postgresql/ \
        /etc/ssl/ \
        2>/dev/null
    
    if [ $? -eq 0 ]; then
        echo "✓ System configuration backup completed"
    else
        echo "✗ System configuration backup failed"
    fi
}

# User data backup
backup_user_data() {
    echo "Starting user data backup..."
    
    # Backup application user home directory
    tar -czf "$BACKUP_DIR/user_data_$DATE.tar.gz" \
        --exclude="*.log" \
        --exclude="tmp" \
        /home/bailbondpro/ \
        2>/dev/null
    
    if [ $? -eq 0 ]; then
        echo "✓ User data backup completed"
    else
        echo "✗ User data backup failed"
    fi
}

# Log files backup
backup_logs() {
    echo "Starting log files backup..."
    
    tar -czf "$BACKUP_DIR/logs_backup_$DATE.tar.gz" \
        /var/log/nginx/ \
        /var/log/postgresql/ \
        /opt/bailbondpro/logs/ \
        2>/dev/null
    
    if [ $? -eq 0 ]; then
        echo "✓ Log files backup completed"
    else
        echo "✗ Log files backup failed"
    fi
}

# Execute based on argument
case "$1" in
    config)
        backup_system_config
        ;;
    users)
        backup_user_data
        ;;
    logs)
        backup_logs
        ;;
    all)
        backup_system_config
        backup_user_data
        backup_logs
        ;;
    *)
        echo "Usage: $0 {config|users|logs|all}"
        exit 1
        ;;
esac
```

## Automated Backup Scripts

### Master Backup Script

```bash
#!/bin/bash
# master-backup.sh

# Configuration
SCRIPT_DIR="/opt/bailbondpro/scripts"
LOG_FILE="/var/log/bailbondpro-backup.log"
EMAIL_ALERT="admin@bailbondpro.com"
BACKUP_SUCCESS=true

# Logging function
log_message() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" | tee -a "$LOG_FILE"
}

# Error handling
handle_error() {
    log_message "ERROR: $1"
    BACKUP_SUCCESS=false
}

# Send notification
send_notification() {
    local subject="$1"
    local message="$2"
    
    echo "$message" | mail -s "$subject" "$EMAIL_ALERT"
}

# Main backup execution
main() {
    log_message "Starting BailBondPro backup process"
    
    # Database backup
    log_message "Starting database backup..."
    if ! "$SCRIPT_DIR/database-backup.sh" all; then
        handle_error "Database backup failed"
    fi
    
    # Application backup
    log_message "Starting application backup..."
    if ! "$SCRIPT_DIR/application-backup.sh" all; then
        handle_error "Application backup failed"
    fi
    
    # System backup
    log_message "Starting system backup..."
    if ! "$SCRIPT_DIR/system-backup.sh" all; then
        handle_error "System backup failed"
    fi
    
    # Docker backup
    log_message "Starting Docker backup..."
    if ! "$SCRIPT_DIR/docker-backup.sh" all; then
        handle_error "Docker backup failed"
    fi
    
    # Cloud sync
    log_message "Starting cloud sync..."
    if ! "$SCRIPT_DIR/cloud-sync.sh"; then
        handle_error "Cloud sync failed"
    fi
    
    # Backup verification
    log_message "Starting backup verification..."
    if ! "$SCRIPT_DIR/verify-backups.sh"; then
        handle_error "Backup verification failed"
    fi
    
    # Send notification
    if [ "$BACKUP_SUCCESS" = true ]; then
        log_message "Backup process completed successfully"
        send_notification "BailBondPro Backup Success" "All backups completed successfully at $(date)"
    else
        log_message "Backup process completed with errors"
        send_notification "BailBondPro Backup Failed" "Backup process failed. Check logs at $LOG_FILE"
    fi
}

# Execute main function
main "$@"
```

### Cloud Sync Script

```bash
#!/bin/bash
# cloud-sync.sh

# AWS S3 Configuration
S3_BUCKET="bailbondpro-backups"
AWS_PROFILE="backup"
LOCAL_BACKUP_DIR="/backups"
RETENTION_DAYS=90

# Sync to S3
sync_to_s3() {
    echo "Syncing backups to S3..."
    
    # Sync all backup directories
    aws s3 sync "$LOCAL_BACKUP_DIR" "s3://$S3_BUCKET/" \
        --profile "$AWS_PROFILE" \
        --storage-class STANDARD_IA \
        --exclude "*.tmp" \
        --exclude "*.log"
    
    if [ $? -eq 0 ]; then
        echo "✓ S3 sync completed"
    else
        echo "✗ S3 sync failed"
        return 1
    fi
}

# Archive old backups to Glacier
archive_to_glacier() {
    echo "Archiving old backups to Glacier..."
    
    # Move backups older than 30 days to Glacier
    aws s3 cp "s3://$S3_BUCKET/" "s3://$S3_BUCKET-archive/" \
        --recursive \
        --profile "$AWS_PROFILE" \
        --storage-class GLACIER \
        --exclude "*" \
        --include "*$(date -d '30 days ago' +%Y%m%d)*"
    
    if [ $? -eq 0 ]; then
        echo "✓ Glacier archiving completed"
    else
        echo "✗ Glacier archiving failed"
        return 1
    fi
}

# Cleanup old cloud backups
cleanup_cloud_backups() {
    echo "Cleaning up old cloud backups..."
    
    # Delete backups older than retention period
    aws s3 ls "s3://$S3_BUCKET/" --recursive --profile "$AWS_PROFILE" | \
    while read -r line; do
        createDate=$(echo "$line" | awk '{print $1" "$2}')
        createDate=$(date -d "$createDate" +%s)
        olderThan=$(date -d "$RETENTION_DAYS days ago" +%s)
        
        if [[ $createDate -lt $olderThan ]]; then
            fileName=$(echo "$line" | awk '{$1=$2=$3=""; print $0}' | sed 's/^[ \t]*//')
            if [[ $fileName != "" ]]; then
                aws s3 rm "s3://$S3_BUCKET/$fileName" --profile "$AWS_PROFILE"
            fi
        fi
    done
    
    echo "✓ Cloud cleanup completed"
}

# Execute based on argument
case "$1" in
    sync)
        sync_to_s3
        ;;
    archive)
        archive_to_glacier
        ;;
    cleanup)
        cleanup_cloud_backups
        ;;
    all)
        sync_to_s3
        archive_to_glacier
        cleanup_cloud_backups
        ;;
    *)
        echo "Usage: $0 {sync|archive|cleanup|all}"
        exit 1
        ;;
esac
```

### Cron Configuration

```bash
# /etc/cron.d/bailbondpro-backup

# Database backups every 4 hours
0 */4 * * * root /opt/bailbondpro/scripts/database-backup.sh full >> /var/log/bailbondpro-backup.log 2>&1

# Transaction log backup every 15 minutes
*/15 * * * * root /opt/bailbondpro/scripts/database-backup.sh wal >> /var/log/bailbondpro-backup.log 2>&1

# Application backup daily at 2 AM
0 2 * * * root /opt/bailbondpro/scripts/application-backup.sh all >> /var/log/bailbondpro-backup.log 2>&1

# System backup daily at 3 AM
0 3 * * * root /opt/bailbondpro/scripts/system-backup.sh all >> /var/log/bailbondpro-backup.log 2>&1

# Full backup weekly on Sunday at 1 AM
0 1 * * 0 root /opt/bailbondpro/scripts/master-backup.sh >> /var/log/bailbondpro-backup.log 2>&1

# Cloud sync daily at 4 AM
0 4 * * * root /opt/bailbondpro/scripts/cloud-sync.sh all >> /var/log/bailbondpro-backup.log 2>&1

# Cleanup old backups weekly on Monday at 5 AM
0 5 * * 1 root /opt/bailbondpro/scripts/database-backup.sh cleanup >> /var/log/bailbondpro-backup.log 2>&1
0 5 * * 1 root /opt/bailbondpro/scripts/application-backup.sh cleanup >> /var/log/bailbondpro-backup.log 2>&1
```

## Backup Verification

### Verification Script

```bash
#!/bin/bash
# verify-backups.sh

BACKUP_DIR="/backups"
LOG_FILE="/var/log/backup-verification.log"
VERIFICATION_SUCCESS=true

# Logging function
log_message() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" | tee -a "$LOG_FILE"
}

# Verify file integrity
verify_file_integrity() {
    local backup_file="$1"
    local checksum_file="$1.md5"
    
    if [ -f "$checksum_file" ]; then
        if md5sum -c "$checksum_file" >/dev/null 2>&1; then
            log_message "✓ Integrity verified: $(basename "$backup_file")"
            return 0
        else
            log_message "✗ Integrity check failed: $(basename "$backup_file")"
            return 1
        fi
    else
        log_message "⚠ No checksum file found: $(basename "$backup_file")"
        return 1
    fi
}

# Test database backup restore
test_database_restore() {
    local backup_file="$1"
    local test_db="bailbondpro_test_restore"
    
    log_message "Testing database restore: $(basename "$backup_file")"
    
    # Create test database
    createdb "$test_db" 2>/dev/null
    
    # Restore backup to test database
    if [[ "$backup_file" == *.gz ]]; then
        gunzip -c "$backup_file" | pg_restore -d "$test_db" 2>/dev/null
    else
        pg_restore -d "$test_db" "$backup_file" 2>/dev/null
    fi
    
    if [ $? -eq 0 ]; then
        # Verify data integrity
        table_count=$(psql -d "$test_db" -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" 2>/dev/null)
        
        if [ "$table_count" -gt 0 ]; then
            log_message "✓ Database restore test successful: $table_count tables restored"
            dropdb "$test_db" 2>/dev/null
            return 0
        else
            log_message "✗ Database restore test failed: No tables found"
            dropdb "$test_db" 2>/dev/null
            return 1
        fi
    else
        log_message "✗ Database restore test failed: Restore command failed"
        dropdb "$test_db" 2>/dev/null
        return 1
    fi
}

# Test application backup
test_application_backup() {
    local backup_file="$1"
    local test_dir="/tmp/app_restore_test"
    
    log_message "Testing application backup: $(basename "$backup_file")"
    
    # Create test directory
    mkdir -p "$test_dir"
    
    # Extract backup
    if tar -tzf "$backup_file" >/dev/null 2>&1; then
        tar -xzf "$backup_file" -C "$test_dir" 2>/dev/null
        
        if [ $? -eq 0 ]; then
            # Check for essential files
            if [ -f "$test_dir/package.json" ] && [ -d "$test_dir/src" ]; then
                log_message "✓ Application backup test successful"
                rm -rf "$test_dir"
                return 0
            else
                log_message "✗ Application backup test failed: Missing essential files"
                rm -rf "$test_dir"
                return 1
            fi
        else
            log_message "✗ Application backup test failed: Extraction failed"
            rm -rf "$test_dir"
            return 1
        fi
    else
        log_message "✗ Application backup test failed: Invalid tar file"
        return 1
    fi
}

# Main verification process
main() {
    log_message "Starting backup verification process"
    
    # Verify database backups
    log_message "Verifying database backups..."
    for backup_file in "$BACKUP_DIR"/database/*.dump.gz; do
        if [ -f "$backup_file" ]; then
            if ! verify_file_integrity "$backup_file"; then
                VERIFICATION_SUCCESS=false
            fi
            
            if ! test_database_restore "$backup_file"; then
                VERIFICATION_SUCCESS=false
            fi
        fi
    done
    
    # Verify application backups
    log_message "Verifying application backups..."
    for backup_file in "$BACKUP_DIR"/application/*.tar.gz; do
        if [ -f "$backup_file" ]; then
            if ! verify_file_integrity "$backup_file"; then
                VERIFICATION_SUCCESS=false
            fi
            
            if ! test_application_backup "$backup_file"; then
                VERIFICATION_SUCCESS=false
            fi
        fi
    done
    
    # Report results
    if [ "$VERIFICATION_SUCCESS" = true ]; then
        log_message "✓ All backup verifications passed"
        exit 0
    else
        log_message "✗ Some backup verifications failed"
        exit 1
    fi
}

# Execute main function
main "$@"
```

## Disaster Recovery

### Recovery Procedures

```bash
#!/bin/bash
# disaster-recovery.sh

BACKUP_DIR="/backups"
RECOVERY_LOG="/var/log/disaster-recovery.log"
APP_DIR="/opt/bailbondpro"

# Logging function
log_message() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" | tee -a "$RECOVERY_LOG"
}

# Full system recovery
full_system_recovery() {
    local backup_date="$1"
    
    if [ -z "$backup_date" ]; then
        echo "Usage: full_system_recovery YYYYMMDD_HHMMSS"
        exit 1
    fi
    
    log_message "Starting full system recovery for backup date: $backup_date"
    
    # Stop services
    log_message "Stopping services..."
    systemctl stop bailbondpro
    systemctl stop nginx
    systemctl stop postgresql
    
    # Recover database
    log_message "Recovering database..."
    if ! recover_database "$backup_date"; then
        log_message "Database recovery failed"
        exit 1
    fi
    
    # Recover application
    log_message "Recovering application..."
    if ! recover_application "$backup_date"; then
        log_message "Application recovery failed"
        exit 1
    fi
    
    # Recover system configuration
    log_message "Recovering system configuration..."
    if ! recover_system_config "$backup_date"; then
        log_message "System configuration recovery failed"
        exit 1
    fi
    
    # Start services
    log_message "Starting services..."
    systemctl start postgresql
    sleep 10
    systemctl start bailbondpro
    systemctl start nginx
    
    # Verify recovery
    log_message "Verifying recovery..."
    if verify_recovery; then
        log_message "✓ Full system recovery completed successfully"
    else
        log_message "✗ Recovery verification failed"
        exit 1
    fi
}

# Database recovery
recover_database() {
    local backup_date="$1"
    local backup_file="$BACKUP_DIR/database/full_backup_${backup_date}.dump.gz"
    
    if [ ! -f "$backup_file" ]; then
        log_message "Database backup file not found: $backup_file"
        return 1
    fi
    
    log_message "Restoring database from: $backup_file"
    
    # Drop existing database
    dropdb bailbondpro 2>/dev/null
    
    # Create new database
    createdb bailbondpro
    
    # Restore from backup
    gunzip -c "$backup_file" | pg_restore -d bailbondpro
    
    if [ $? -eq 0 ]; then
        log_message "✓ Database recovery completed"
        return 0
    else
        log_message "✗ Database recovery failed"
        return 1
    fi
}

# Application recovery
recover_application() {
    local backup_date="$1"
    local backup_file="$BACKUP_DIR/application/app_backup_${backup_date}.tar.gz"
    
    if [ ! -f "$backup_file" ]; then
        log_message "Application backup file not found: $backup_file"
        return 1
    fi
    
    log_message "Restoring application from: $backup_file"
    
    # Backup current application (if exists)
    if [ -d "$APP_DIR" ]; then
        mv "$APP_DIR" "${APP_DIR}.backup.$(date +%Y%m%d_%H%M%S)"
    fi
    
    # Create application directory
    mkdir -p "$APP_DIR"
    
    # Extract backup
    tar -xzf "$backup_file" -C "$APP_DIR"
    
    if [ $? -eq 0 ]; then
        # Set permissions
        chown -R bailbondpro:bailbondpro "$APP_DIR"
        chmod +x "$APP_DIR/scripts/"*.sh
        
        # Install dependencies
        cd "$APP_DIR"
        npm install --production
        
        log_message "✓ Application recovery completed"
        return 0
    else
        log_message "✗ Application recovery failed"
        return 1
    fi
}

# System configuration recovery
recover_system_config() {
    local backup_date="$1"
    local backup_file="$BACKUP_DIR/system/system_config_${backup_date}.tar.gz"
    
    if [ ! -f "$backup_file" ]; then
        log_message "System config backup file not found: $backup_file"
        return 1
    fi
    
    log_message "Restoring system configuration from: $backup_file"
    
    # Extract configuration files
    tar -xzf "$backup_file" -C /
    
    if [ $? -eq 0 ]; then
        # Reload systemd
        systemctl daemon-reload
        
        # Reload nginx configuration
        nginx -t && systemctl reload nginx
        
        log_message "✓ System configuration recovery completed"
        return 0
    else
        log_message "✗ System configuration recovery failed"
        return 1
    fi
}

# Point-in-time recovery
point_in_time_recovery() {
    local target_time="$1"
    
    if [ -z "$target_time" ]; then
        echo "Usage: point_in_time_recovery 'YYYY-MM-DD HH:MM:SS'"
        exit 1
    fi
    
    log_message "Starting point-in-time recovery to: $target_time"
    
    # Stop PostgreSQL
    systemctl stop postgresql
    
    # Remove current data directory
    rm -rf /var/lib/postgresql/15/main/*
    
    # Restore base backup
    latest_backup=$(ls -t "$BACKUP_DIR"/database/full_backup_*.dump.gz | head -1)
    gunzip -c "$latest_backup" | pg_restore -d template1
    
    # Configure recovery
    cat > /var/lib/postgresql/15/main/recovery.conf << EOF
restore_command = 'cp /backups/wal/%f %p'
recovery_target_time = '$target_time'
recovery_target_action = 'promote'
EOF
    
    # Start PostgreSQL
    systemctl start postgresql
    
    log_message "✓ Point-in-time recovery initiated"
}

# Verify recovery
verify_recovery() {
    log_message "Verifying system recovery..."
    
    # Check database connectivity
    if ! pg_isready -h localhost -p 5432; then
        log_message "✗ Database is not accessible"
        return 1
    fi
    
    # Check application response
    sleep 30  # Wait for application to start
    if ! curl -f http://localhost:3000/health >/dev/null 2>&1; then
        log_message "✗ Application is not responding"
        return 1
    fi
    
    # Check data integrity
    table_count=$(psql -d bailbondpro -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" 2>/dev/null)
    if [ "$table_count" -lt 10 ]; then
        log_message "✗ Database appears incomplete (only $table_count tables)"
        return 1
    fi
    
    log_message "✓ Recovery verification passed"
    return 0
}

# Execute based on argument
case "$1" in
    full)
        full_system_recovery "$2"
        ;;
    database)
        recover_database "$2"
        ;;
    application)
        recover_application "$2"
        ;;
    system)
        recover_system_config "$2"
        ;;
    pitr)
        point_in_time_recovery "$2"
        ;;
    verify)
        verify_recovery
        ;;
    *)
        echo "Usage: $0 {full|database|application|system|pitr|verify} [backup_date|target_time]"
        echo "Examples:"
        echo "  $0 full 20231201_020000"
        echo "  $0 pitr '2023-12-01 14:30:00'"
        exit 1
        ;;
esac
```

## Recovery Testing

### Automated Recovery Testing

```bash
#!/bin/bash
# recovery-test.sh

TEST_ENV="/tmp/recovery_test"
TEST_LOG="/var/log/recovery-test.log"
TEST_SUCCESS=true

# Logging function
log_message() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" | tee -a "$TEST_LOG"
}

# Setup test environment
setup_test_environment() {
    log_message "Setting up test environment..."
    
    # Create test directory
    mkdir -p "$TEST_ENV"
    
    # Create test database
    createdb bailbondpro_recovery_test 2>/dev/null
    
    log_message "✓ Test environment ready"
}

# Test database recovery
test_database_recovery() {
    local backup_file="$1"
    
    log_message "Testing database recovery with: $(basename "$backup_file")"
    
    # Restore to test database
    if [[ "$backup_file" == *.gz ]]; then
        gunzip -c "$backup_file" | pg_restore -d bailbondpro_recovery_test 2>/dev/null
    else
        pg_restore -d bailbondpro_recovery_test "$backup_file" 2>/dev/null
    fi
    
    if [ $? -eq 0 ]; then
        # Verify data
        table_count=$(psql -d bailbondpro_recovery_test -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" 2>/dev/null)
        client_count=$(psql -d bailbondpro_recovery_test -t -c "SELECT COUNT(*) FROM clients;" 2>/dev/null)
        
        log_message "Database recovery test results:"
        log_message "  Tables: $table_count"
        log_message "  Clients: $client_count"
        
        if [ "$table_count" -gt 0 ] && [ "$client_count" -ge 0 ]; then
            log_message "✓ Database recovery test passed"
            return 0
        else
            log_message "✗ Database recovery test failed: Invalid data"
            return 1
        fi
    else
        log_message "✗ Database recovery test failed: Restore failed"
        return 1
    fi
}

# Test application recovery
test_application_recovery() {
    local backup_file="$1"
    
    log_message "Testing application recovery with: $(basename "$backup_file")"
    
    # Extract to test directory
    local test_app_dir="$TEST_ENV/app"
    mkdir -p "$test_app_dir"
    
    tar -xzf "$backup_file" -C "$test_app_dir" 2>/dev/null
    
    if [ $? -eq 0 ]; then
        # Check essential files
        if [ -f "$test_app_dir/package.json" ] && [ -d "$test_app_dir/src" ]; then
            # Try to install dependencies
            cd "$test_app_dir"
            npm install --production >/dev/null 2>&1
            
            if [ $? -eq 0 ]; then
                log_message "✓ Application recovery test passed"
                return 0
            else
                log_message "✗ Application recovery test failed: Dependency installation failed"
                return 1
            fi
        else
            log_message "✗ Application recovery test failed: Missing essential files"
            return 1
        fi
    else
        log_message "✗ Application recovery test failed: Extraction failed"
        return 1
    fi
}

# Run recovery tests
run_recovery_tests() {
    log_message "Starting recovery tests..."
    
    # Test latest database backup
    latest_db_backup=$(ls -t /backups/database/full_backup_*.dump.gz 2>/dev/null | head -1)
    if [ -f "$latest_db_backup" ]; then
        if ! test_database_recovery "$latest_db_backup"; then
            TEST_SUCCESS=false
        fi
    else
        log_message "✗ No database backup found for testing"
        TEST_SUCCESS=false
    fi
    
    # Test latest application backup
    latest_app_backup=$(ls -t /backups/application/app_backup_*.tar.gz 2>/dev/null | head -1)
    if [ -f "$latest_app_backup" ]; then
        if ! test_application_recovery "$latest_app_backup"; then
            TEST_SUCCESS=false
        fi
    else
        log_message "✗ No application backup found for testing"
        TEST_SUCCESS=false
    fi
    
    # Report results
    if [ "$TEST_SUCCESS" = true ]; then
        log_message "✓ All recovery tests passed"
    else
        log_message "✗ Some recovery tests failed"
    fi
}

# Cleanup test environment
cleanup_test_environment() {
    log_message "Cleaning up test environment..."
    
    # Remove test database
    dropdb bailbondpro_recovery_test 2>/dev/null
    
    # Remove test directory
    rm -rf "$TEST_ENV"
    
    log_message "✓ Test environment cleaned up"
}

# Main execution
main() {
    setup_test_environment
    run_recovery_tests
    cleanup_test_environment
    
    if [ "$TEST_SUCCESS" = true ]; then
        exit 0
    else
        exit 1
    fi
}

# Execute main function
main "$@"
```

## Monitoring and Alerting

### Backup Monitoring

```typescript
// backup-monitor.ts
import { promises as fs } from 'fs'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

interface BackupStatus {
  type: string
  lastBackup: Date
  size: number
  status: 'success' | 'failed' | 'missing'
  location: string
}

export class BackupMonitor {
  private backupDir = '/backups'
  private alertThresholds = {
    database: 4 * 60 * 60 * 1000, // 4 hours
    application: 24 * 60 * 60 * 1000, // 24 hours
    system: 24 * 60 * 60 * 1000 // 24 hours
  }

  async checkBackupStatus(): Promise<BackupStatus[]> {
    const statuses: BackupStatus[] = []

    // Check database backups
    statuses.push(await this.checkDatabaseBackups())
    
    // Check application backups
    statuses.push(await this.checkApplicationBackups())
    
    // Check system backups
    statuses.push(await this.checkSystemBackups())

    return statuses
  }

  private async checkDatabaseBackups(): Promise<BackupStatus> {
    try {
      const { stdout } = await execAsync(`ls -t ${this.backupDir}/database/full_backup_*.dump.gz | head -1`)
      const latestBackup = stdout.trim()
      
      if (latestBackup) {
        const stats = await fs.stat(latestBackup)
        const age = Date.now() - stats.mtime.getTime()
        
        return {
          type: 'database',
          lastBackup: stats.mtime,
          size: stats.size,
          status: age > this.alertThresholds.database ? 'failed' : 'success',
          location: latestBackup
        }
      }
    } catch (error) {
      console.error('Error checking database backups:', error)
    }

    return {
      type: 'database',
      lastBackup: new Date(0),
      size: 0,
      status: 'missing',
      location: ''
    }
  }

  private async checkApplicationBackups(): Promise<BackupStatus> {
    try {
      const { stdout } = await execAsync(`ls -t ${this.backupDir}/application/app_backup_*.tar.gz | head -1`)
      const latestBackup = stdout.trim()
      
      if (latestBackup) {
        const stats = await fs.stat(latestBackup)
        const age = Date.now() - stats.mtime.getTime()
        
        return {
          type: 'application',
          lastBackup: stats.mtime,
          size: stats.size,
          status: age > this.alertThresholds.application ? 'failed' : 'success',
          location: latestBackup
        }
      }
    } catch (error) {
      console.error('Error checking application backups:', error)
    }

    return {
      type: 'application',
      lastBackup: new Date(0),
      size: 0,
      status: 'missing',
      location: ''
    }
  }

  private async checkSystemBackups(): Promise<BackupStatus> {
    try {
      const { stdout } = await execAsync(`ls -t ${this.backupDir}/system/system_config_*.tar.gz | head -1`)
      const latestBackup = stdout.trim()
      
      if (latestBackup) {
        const stats = await fs.stat(latestBackup)
        const age = Date.now() - stats.mtime.getTime()
        
        return {
          type: 'system',
          lastBackup: stats.mtime,
          size: stats.size,
          status: age > this.alertThresholds.system ? 'failed' : 'success',
          location: latestBackup
        }
      }
    } catch (error) {
      console.error('Error checking system backups:', error)
    }

    return {
      type: 'system',
      lastBackup: new Date(0),
      size: 0,
      status: 'missing',
      location: ''
    }
  }

  async generateReport(): Promise<string> {
    const statuses = await this.checkBackupStatus()
    
    let report = 'BailBondPro Backup Status Report\n'
    report += '================================\n\n'
    
    for (const status of statuses) {
      report += `${status.type.toUpperCase()} BACKUP:\n`
      report += `  Status: ${status.status}\n`
      report += `  Last Backup: ${status.lastBackup.toISOString()}\n`
      report += `  Size: ${this.formatBytes(status.size)}\n`
      report += `  Location: ${status.location}\n\n`
    }
    
    return report
  }

  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes'
    
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }
}

// Usage
const monitor = new BackupMonitor()
monitor.generateReport().then(report => {
  console.log(report)
})
```

## Compliance and Retention

### Data Retention Policy

```typescript
// retention-policy.ts
interface RetentionRule {
  dataType: string
  retentionPeriod: number // in days
  archivePeriod: number // in days
  legalHold: boolean
  encryptionRequired: boolean
}

export class RetentionManager {
  private rules: RetentionRule[] = [
    {
      dataType: 'client_records',
      retentionPeriod: 2555, // 7 years
      archivePeriod: 1825, // 5 years
      legalHold: true,
      encryptionRequired: true
    },
    {
      dataType: 'bond_information',
      retentionPeriod: 2555, // 7 years
      archivePeriod: 1825, // 5 years
      legalHold: true,
      encryptionRequired: true
    },
    {
      dataType: 'payment_records',
      retentionPeriod: 2555, // 7 years
      archivePeriod: 1825, // 5 years
      legalHold: true,
      encryptionRequired: true
    },
    {
      dataType: 'system_logs',
      retentionPeriod: 365, // 1 year
      archivePeriod: 90, // 3 months
      legalHold: false,
      encryptionRequired: false
    },
    {
      dataType: 'audit_logs',
      retentionPeriod: 2555, // 7 years
      archivePeriod: 1825, // 5 years
      legalHold: true,
      encryptionRequired: true
    }
  ]

  getRetentionRule(dataType: string): RetentionRule | undefined {
    return this.rules.find(rule => rule.dataType === dataType)
  }

  shouldArchive(dataType: string, createdDate: Date): boolean {
    const rule = this.getRetentionRule(dataType)
    if (!rule) return false

    const ageInDays = (Date.now() - createdDate.getTime()) / (1000 * 60 * 60 * 24)
    return ageInDays > rule.archivePeriod
  }

  shouldDelete(dataType: string, createdDate: Date): boolean {
    const rule = this.getRetentionRule(dataType)
    if (!rule || rule.legalHold) return false

    const ageInDays = (Date.now() - createdDate.getTime()) / (1000 * 60 * 60 * 24)
    return ageInDays > rule.retentionPeriod
  }

  generateComplianceReport(): string {
    let report = 'Data Retention Compliance Report\n'
    report += '================================\n\n'

    for (const rule of this.rules) {
      report += `Data Type: ${rule.dataType}\n`
      report += `  Retention Period: ${rule.retentionPeriod} days\n`
      report += `  Archive Period: ${rule.archivePeriod} days\n`
      report += `  Legal Hold: ${rule.legalHold ? 'Yes' : 'No'}\n`
      report += `  Encryption Required: ${rule.encryptionRequired ? 'Yes' : 'No'}\n\n`
    }

    return report
  }
}
```

## Emergency Procedures

### Emergency Response Plan

```markdown
# Emergency Response Plan

## Severity Levels

### P1 - Critical (Complete System Failure)
- **Response Time**: 15 minutes
- **Escalation**: Immediate
- **Actions**:
  1. Execute emergency recovery procedures
  2. Notify all stakeholders
  3. Activate disaster recovery site if needed
  4. Implement business continuity plan

### P2 - High (Partial System Failure)
- **Response Time**: 1 hour
- **Escalation**: Within 30 minutes
- **Actions**:
  1. Isolate affected components
  2. Implement workarounds
  3. Begin recovery procedures
  4. Monitor system stability

### P3 - Medium (Performance Degradation)
- **Response Time**: 4 hours
- **Escalation**: Within 2 hours
- **Actions**:
  1. Identify performance bottlenecks
  2. Implement temporary fixes
  3. Schedule permanent resolution
  4. Monitor performance metrics

### P4 - Low (Minor Issues)
- **Response Time**: 24 hours
- **Escalation**: As needed
- **Actions**:
  1. Document issue
  2. Schedule resolution
  3. Implement fix during maintenance window
  4. Verify resolution

## Emergency Contacts

| Role | Primary | Secondary | Phone | Email |
|------|---------|-----------|-------|-------|
| System Administrator | John Doe | Jane Smith | +1-555-0101 | admin@bailbondpro.com |
| Database Administrator | Bob Johnson | Alice Brown | +1-555-0102 | dba@bailbondpro.com |
| Security Officer | Mike Wilson | Sarah Davis | +1-555-0103 | security@bailbondpro.com |
| Business Owner | Rick Jefferson | - | +1-555-0100 | rick@bailbondpro.com |

## Recovery Procedures

### Immediate Actions (0-15 minutes)
1. Assess the situation
2. Determine severity level
3. Notify emergency response team
4. Begin containment procedures
5. Document all actions

### Short-term Actions (15 minutes - 4 hours)
1. Execute recovery procedures
2. Restore critical services
3. Verify data integrity
4. Communicate status updates
5. Monitor system stability

### Long-term Actions (4+ hours)
1. Complete full system recovery
2. Conduct post-incident review
3. Update procedures based on lessons learned
4. Implement preventive measures
5. Generate incident report
```

---

This backup and disaster recovery guide provides comprehensive procedures for protecting and recovering the BailBondPro system. Regular testing and updates of these procedures are essential for maintaining system reliability and business continuity.

For questions or assistance with backup and recovery procedures, contact the system administration team at admin@bailbondpro.com.