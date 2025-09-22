#!/bin/bash

# ========================================================================
# BailBondPro - Health Check Script
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
HEALTH_LOG="$PROJECT_ROOT/logs/health_$TIMESTAMP.log"

# Default values
ENVIRONMENT="production"
OUTPUT_FORMAT="console"
VERBOSE=false
CONTINUOUS=false
INTERVAL=30
ALERT_WEBHOOK=""
TIMEOUT=10
CRITICAL_ONLY=false

# Health check configuration
CHECK_SYSTEM=true
CHECK_SERVICES=true
CHECK_DATABASE=true
CHECK_NETWORK=true
CHECK_PERFORMANCE=true
CHECK_SECURITY=true

# Thresholds
CPU_THRESHOLD=80
MEMORY_THRESHOLD=85
DISK_THRESHOLD=90
RESPONSE_TIME_THRESHOLD=2000  # milliseconds
ERROR_RATE_THRESHOLD=5        # percentage

# Functions
log() {
    local level=$1
    shift
    local message="$*"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    
    # Log to file
    mkdir -p "$(dirname "$HEALTH_LOG")"
    echo "[$timestamp] [$level] $message" >> "$HEALTH_LOG"
    
    # Skip console output for JSON format unless it's an error
    if [[ "$OUTPUT_FORMAT" == "json" ]] && [[ "$level" != "ERROR" ]]; then
        return 0
    fi
    
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
        "CRITICAL")
            echo -e "${RED}[CRITICAL]${NC} $message"
            ;;
    esac
}

show_banner() {
    if [[ "$OUTPUT_FORMAT" == "json" ]]; then
        return 0
    fi
    
    echo -e "${PURPLE}"
    cat << 'EOF'
    _   _            _ _   _     
   | | | |          | | | |    
   | |_| | ___  __ _| | |_| |__ 
   |  _  |/ _ \/ _` | | __| '_ \
   | | | |  __/ (_| | | |_| | | |
   \_| |_/\___|\__,_|_|\__|_| |_|
                                
   BailBondPro Health Monitor   
EOF
    echo -e "${NC}"
}

show_help() {
    cat << EOF
BailBondPro Health Check Script

Usage: $0 [OPTIONS]

OPTIONS:
    -e, --environment ENV     Environment to check (production, staging, development)
    -f, --format FORMAT       Output format (console, json, prometheus)
    -c, --continuous          Run continuously with interval
    -i, --interval SECONDS    Interval for continuous mode (default: 30)
    -t, --timeout SECONDS     Timeout for checks (default: 10)
    -w, --webhook URL         Webhook URL for alerts
    --critical-only           Only report critical issues
    -v, --verbose             Enable verbose logging
    -h, --help                Show this help message

CHECK CATEGORIES:
    --no-system               Skip system resource checks
    --no-services             Skip service status checks
    --no-database             Skip database connectivity checks
    --no-network              Skip network connectivity checks
    --no-performance          Skip performance checks
    --no-security             Skip security checks

OUTPUT FORMATS:
    console                   Human-readable console output (default)
    json                      JSON format for monitoring systems
    prometheus                Prometheus metrics format

EXAMPLES:
    $0                        # Basic health check
    $0 -f json                # JSON output for monitoring
    $0 -c -i 60               # Continuous monitoring every 60 seconds
    $0 --critical-only        # Only show critical issues
    $0 -w http://webhook.url  # Send alerts to webhook

THRESHOLDS:
    CPU Usage: ${CPU_THRESHOLD}%
    Memory Usage: ${MEMORY_THRESHOLD}%
    Disk Usage: ${DISK_THRESHOLD}%
    Response Time: ${RESPONSE_TIME_THRESHOLD}ms
    Error Rate: ${ERROR_RATE_THRESHOLD}%

EOF
}

parse_arguments() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            -e|--environment)
                ENVIRONMENT="$2"
                shift 2
                ;;
            -f|--format)
                OUTPUT_FORMAT="$2"
                shift 2
                ;;
            -c|--continuous)
                CONTINUOUS=true
                shift
                ;;
            -i|--interval)
                INTERVAL="$2"
                shift 2
                ;;
            -t|--timeout)
                TIMEOUT="$2"
                shift 2
                ;;
            -w|--webhook)
                ALERT_WEBHOOK="$2"
                shift 2
                ;;
            --critical-only)
                CRITICAL_ONLY=true
                shift
                ;;
            --no-system)
                CHECK_SYSTEM=false
                shift
                ;;
            --no-services)
                CHECK_SERVICES=false
                shift
                ;;
            --no-database)
                CHECK_DATABASE=false
                shift
                ;;
            --no-network)
                CHECK_NETWORK=false
                shift
                ;;
            --no-performance)
                CHECK_PERFORMANCE=false
                shift
                ;;
            --no-security)
                CHECK_SECURITY=false
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

load_environment() {
    local env_file="$PROJECT_ROOT/.env.$ENVIRONMENT"
    if [[ -f "$env_file" ]]; then
        set -a
        source "$env_file"
        set +a
        log "DEBUG" "Loaded environment: $ENVIRONMENT"
    else
        log "WARN" "Environment file not found: $env_file"
    fi
}

# Health check results storage
declare -A HEALTH_RESULTS
OVERALL_STATUS="healthy"

update_overall_status() {
    local status="$1"
    
    case "$status" in
        "critical")
            OVERALL_STATUS="critical"
            ;;
        "warning")
            if [[ "$OVERALL_STATUS" != "critical" ]]; then
                OVERALL_STATUS="warning"
            fi
            ;;
        "healthy")
            # Keep current status
            ;;
    esac
}

check_system_resources() {
    if [[ "$CHECK_SYSTEM" != true ]]; then
        return 0
    fi
    
    log "DEBUG" "Checking system resources..."
    
    local cpu_usage=""
    local memory_usage=""
    local disk_usage=""
    local load_average=""
    
    # CPU Usage
    if command -v top &> /dev/null; then
        cpu_usage=$(top -l 1 -n 0 | grep "CPU usage" | awk '{print $3}' | sed 's/%//' || echo "0")
    elif command -v iostat &> /dev/null; then
        cpu_usage=$(iostat -c 1 1 | tail -1 | awk '{print 100-$6}' || echo "0")
    fi
    
    # Memory Usage
    if command -v vm_stat &> /dev/null; then
        local page_size=$(vm_stat | grep "page size" | awk '{print $8}' || echo "4096")
        local pages_free=$(vm_stat | grep "Pages free" | awk '{print $3}' | sed 's/\.//')
        local pages_active=$(vm_stat | grep "Pages active" | awk '{print $3}' | sed 's/\.//')
        local pages_inactive=$(vm_stat | grep "Pages inactive" | awk '{print $3}' | sed 's/\.//')
        local pages_wired=$(vm_stat | grep "Pages wired down" | awk '{print $4}' | sed 's/\.//')
        
        local total_pages=$((pages_free + pages_active + pages_inactive + pages_wired))
        local used_pages=$((pages_active + pages_inactive + pages_wired))
        memory_usage=$(echo "scale=1; $used_pages * 100 / $total_pages" | bc 2>/dev/null || echo "0")
    fi
    
    # Disk Usage
    disk_usage=$(df -h "$PROJECT_ROOT" | awk 'NR==2 {print $5}' | sed 's/%//' || echo "0")
    
    # Load Average
    load_average=$(uptime | awk -F'load average:' '{print $2}' | awk '{print $1}' | sed 's/,//' || echo "0")
    
    # Evaluate thresholds
    local cpu_status="healthy"
    local memory_status="healthy"
    local disk_status="healthy"
    
    if (( $(echo "$cpu_usage > $CPU_THRESHOLD" | bc -l 2>/dev/null || echo "0") )); then
        cpu_status="critical"
        log "CRITICAL" "High CPU usage: ${cpu_usage}%"
    elif (( $(echo "$cpu_usage > $(($CPU_THRESHOLD - 10))" | bc -l 2>/dev/null || echo "0") )); then
        cpu_status="warning"
        log "WARN" "Elevated CPU usage: ${cpu_usage}%"
    fi
    
    if (( $(echo "$memory_usage > $MEMORY_THRESHOLD" | bc -l 2>/dev/null || echo "0") )); then
        memory_status="critical"
        log "CRITICAL" "High memory usage: ${memory_usage}%"
    elif (( $(echo "$memory_usage > $(($MEMORY_THRESHOLD - 10))" | bc -l 2>/dev/null || echo "0") )); then
        memory_status="warning"
        log "WARN" "Elevated memory usage: ${memory_usage}%"
    fi
    
    if (( disk_usage > DISK_THRESHOLD )); then
        disk_status="critical"
        log "CRITICAL" "High disk usage: ${disk_usage}%"
    elif (( disk_usage > $((DISK_THRESHOLD - 10)) )); then
        disk_status="warning"
        log "WARN" "Elevated disk usage: ${disk_usage}%"
    fi
    
    # Store results
    HEALTH_RESULTS["system_cpu_usage"]="$cpu_usage"
    HEALTH_RESULTS["system_cpu_status"]="$cpu_status"
    HEALTH_RESULTS["system_memory_usage"]="$memory_usage"
    HEALTH_RESULTS["system_memory_status"]="$memory_status"
    HEALTH_RESULTS["system_disk_usage"]="$disk_usage"
    HEALTH_RESULTS["system_disk_status"]="$disk_status"
    HEALTH_RESULTS["system_load_average"]="$load_average"
    
    # Update overall status
    update_overall_status "$cpu_status"
    update_overall_status "$memory_status"
    update_overall_status "$disk_status"
    
    if [[ "$CRITICAL_ONLY" != true ]] || [[ "$cpu_status" == "critical" ]] || [[ "$memory_status" == "critical" ]] || [[ "$disk_status" == "critical" ]]; then
        log "INFO" "System Resources - CPU: ${cpu_usage}%, Memory: ${memory_usage}%, Disk: ${disk_usage}%, Load: $load_average"
    fi
}

check_services() {
    if [[ "$CHECK_SERVICES" != true ]]; then
        return 0
    fi
    
    log "DEBUG" "Checking services..."
    
    local services=("postgresql" "redis" "nginx" "bailbondpro")
    local service_status=""
    
    for service in "${services[@]}"; do
        local status="healthy"
        local running=false
        
        # Check systemd service
        if systemctl is-active --quiet "$service" 2>/dev/null; then
            running=true
        # Check process
        elif pgrep -f "$service" >/dev/null 2>&1; then
            running=true
        # Check Docker container
        elif command -v docker &> /dev/null && docker ps --format "table {{.Names}}" | grep -q "$service"; then
            running=true
        fi
        
        if [[ "$running" == true ]]; then
            log "DEBUG" "Service $service is running"
        else
            status="critical"
            log "CRITICAL" "Service $service is not running"
        fi
        
        HEALTH_RESULTS["service_${service}_status"]="$status"
        HEALTH_RESULTS["service_${service}_running"]="$running"
        
        update_overall_status "$status"
    done
    
    # Check Docker containers if compose files exist
    if command -v docker &> /dev/null; then
        local compose_files=("docker-compose.yml" "docker-compose.prod.yml")
        for compose_file in "${compose_files[@]}"; do
            if [[ -f "$PROJECT_ROOT/$compose_file" ]]; then
                local containers=$(docker-compose -f "$PROJECT_ROOT/$compose_file" ps -q 2>/dev/null || echo "")
                local running_containers=$(echo "$containers" | wc -l)
                
                HEALTH_RESULTS["docker_${compose_file}_containers"]="$running_containers"
                log "DEBUG" "Docker containers ($compose_file): $running_containers"
            fi
        done
    fi
}

check_database_connectivity() {
    if [[ "$CHECK_DATABASE" != true ]]; then
        return 0
    fi
    
    log "DEBUG" "Checking database connectivity..."
    
    # PostgreSQL check
    if [[ -n "${DATABASE_URL:-}" ]]; then
        local pg_status="healthy"
        local pg_response_time=""
        
        local start_time=$(date +%s%3N)
        if timeout "$TIMEOUT" psql "$DATABASE_URL" -c "SELECT 1;" >/dev/null 2>&1; then
            local end_time=$(date +%s%3N)
            pg_response_time=$((end_time - start_time))
            log "DEBUG" "PostgreSQL connection successful (${pg_response_time}ms)"
        else
            pg_status="critical"
            log "CRITICAL" "PostgreSQL connection failed"
        fi
        
        HEALTH_RESULTS["database_postgresql_status"]="$pg_status"
        HEALTH_RESULTS["database_postgresql_response_time"]="$pg_response_time"
        
        update_overall_status "$pg_status"
    fi
    
    # Redis check
    if [[ -n "${REDIS_URL:-}" ]]; then
        local redis_status="healthy"
        local redis_response_time=""
        
        # Extract Redis connection details
        local redis_host=$(echo "$REDIS_URL" | sed -n 's/.*@\([^:]*\):.*/\1/p' || echo "localhost")
        local redis_port=$(echo "$REDIS_URL" | sed -n 's/.*:\([0-9]*\).*/\1/p' || echo "6379")
        local redis_password=$(echo "$REDIS_URL" | sed -n 's/.*:\([^@]*\)@.*/\1/p' || echo "")
        
        local start_time=$(date +%s%3N)
        local redis_result=""
        if [[ -n "$redis_password" ]]; then
            redis_result=$(timeout "$TIMEOUT" redis-cli -h "$redis_host" -p "$redis_port" -a "$redis_password" ping 2>/dev/null || echo "FAILED")
        else
            redis_result=$(timeout "$TIMEOUT" redis-cli -h "$redis_host" -p "$redis_port" ping 2>/dev/null || echo "FAILED")
        fi
        
        if [[ "$redis_result" == "PONG" ]]; then
            local end_time=$(date +%s%3N)
            redis_response_time=$((end_time - start_time))
            log "DEBUG" "Redis connection successful (${redis_response_time}ms)"
        else
            redis_status="critical"
            log "CRITICAL" "Redis connection failed"
        fi
        
        HEALTH_RESULTS["database_redis_status"]="$redis_status"
        HEALTH_RESULTS["database_redis_response_time"]="$redis_response_time"
        
        update_overall_status "$redis_status"
    fi
}

check_network_connectivity() {
    if [[ "$CHECK_NETWORK" != true ]]; then
        return 0
    fi
    
    log "DEBUG" "Checking network connectivity..."
    
    # Application endpoints
    local endpoints=("http://localhost:3000" "http://localhost:8080" "http://localhost:80")
    local healthy_endpoints=0
    
    for endpoint in "${endpoints[@]}"; do
        local status="healthy"
        local response_time=""
        
        local start_time=$(date +%s%3N)
        if timeout "$TIMEOUT" curl -f -s "$endpoint/health" >/dev/null 2>&1 || timeout "$TIMEOUT" curl -f -s "$endpoint" >/dev/null 2>&1; then
            local end_time=$(date +%s%3N)
            response_time=$((end_time - start_time))
            ((healthy_endpoints++))
            log "DEBUG" "Endpoint $endpoint is healthy (${response_time}ms)"
        else
            status="warning"
            log "DEBUG" "Endpoint $endpoint is not responding"
        fi
        
        local endpoint_key=$(echo "$endpoint" | sed 's/[^a-zA-Z0-9]/_/g')
        HEALTH_RESULTS["network_${endpoint_key}_status"]="$status"
        HEALTH_RESULTS["network_${endpoint_key}_response_time"]="$response_time"
    done
    
    HEALTH_RESULTS["network_healthy_endpoints"]="$healthy_endpoints"
    
    if [[ $healthy_endpoints -eq 0 ]]; then
        update_overall_status "critical"
        log "CRITICAL" "No application endpoints are responding"
    elif [[ $healthy_endpoints -lt ${#endpoints[@]} ]]; then
        update_overall_status "warning"
        log "WARN" "Some application endpoints are not responding ($healthy_endpoints/${#endpoints[@]})"
    fi
    
    # External connectivity
    local external_hosts=("8.8.8.8" "1.1.1.1")
    local external_connectivity=false
    
    for host in "${external_hosts[@]}"; do
        if timeout 5 ping -c 1 "$host" >/dev/null 2>&1; then
            external_connectivity=true
            break
        fi
    done
    
    HEALTH_RESULTS["network_external_connectivity"]="$external_connectivity"
    
    if [[ "$external_connectivity" == false ]]; then
        update_overall_status "warning"
        log "WARN" "External network connectivity issues detected"
    fi
}

check_performance_metrics() {
    if [[ "$CHECK_PERFORMANCE" != true ]]; then
        return 0
    fi
    
    log "DEBUG" "Checking performance metrics..."
    
    # Application response time
    local app_endpoints=("http://localhost:3000/api/health" "http://localhost:8080/health")
    local total_response_time=0
    local successful_requests=0
    
    for endpoint in "${app_endpoints[@]}"; do
        local start_time=$(date +%s%3N)
        if timeout "$TIMEOUT" curl -f -s "$endpoint" >/dev/null 2>&1; then
            local end_time=$(date +%s%3N)
            local response_time=$((end_time - start_time))
            total_response_time=$((total_response_time + response_time))
            ((successful_requests++))
            
            if [[ $response_time -gt $RESPONSE_TIME_THRESHOLD ]]; then
                update_overall_status "warning"
                log "WARN" "Slow response time: ${response_time}ms for $endpoint"
            fi
        fi
    done
    
    local avg_response_time=0
    if [[ $successful_requests -gt 0 ]]; then
        avg_response_time=$((total_response_time / successful_requests))
    fi
    
    HEALTH_RESULTS["performance_avg_response_time"]="$avg_response_time"
    HEALTH_RESULTS["performance_successful_requests"]="$successful_requests"
    
    # Check log files for errors
    local log_files=("$PROJECT_ROOT/logs/error.log" "$PROJECT_ROOT/logs/app.log" "/var/log/nginx/error.log")
    local recent_errors=0
    
    for log_file in "${log_files[@]}"; do
        if [[ -f "$log_file" ]]; then
            # Count errors in the last 5 minutes
            local error_count=$(grep -c "ERROR\|CRITICAL\|FATAL" "$log_file" 2>/dev/null | tail -100 | wc -l || echo "0")
            recent_errors=$((recent_errors + error_count))
        fi
    done
    
    HEALTH_RESULTS["performance_recent_errors"]="$recent_errors"
    
    if [[ $recent_errors -gt 10 ]]; then
        update_overall_status "critical"
        log "CRITICAL" "High error rate detected: $recent_errors recent errors"
    elif [[ $recent_errors -gt 5 ]]; then
        update_overall_status "warning"
        log "WARN" "Elevated error rate: $recent_errors recent errors"
    fi
}

check_security_status() {
    if [[ "$CHECK_SECURITY" != true ]]; then
        return 0
    fi
    
    log "DEBUG" "Checking security status..."
    
    # Check for security-related files
    local security_files=(".env" ".env.production" ".env.staging")
    local exposed_files=0
    
    for file in "${security_files[@]}"; do
        if [[ -f "$PROJECT_ROOT/$file" ]]; then
            local permissions=$(stat -f "%A" "$PROJECT_ROOT/$file" 2>/dev/null || echo "000")
            if [[ "$permissions" != "600" ]] && [[ "$permissions" != "644" ]]; then
                ((exposed_files++))
                log "WARN" "Insecure permissions on $file: $permissions"
            fi
        fi
    done
    
    HEALTH_RESULTS["security_exposed_files"]="$exposed_files"
    
    if [[ $exposed_files -gt 0 ]]; then
        update_overall_status "warning"
    fi
    
    # Check SSL certificate (if HTTPS is configured)
    local ssl_status="healthy"
    local ssl_days_remaining=""
    
    if [[ -n "${SSL_CERT_PATH:-}" ]] && [[ -f "${SSL_CERT_PATH}" ]]; then
        local cert_expiry=$(openssl x509 -enddate -noout -in "${SSL_CERT_PATH}" 2>/dev/null | cut -d= -f2 || echo "")
        if [[ -n "$cert_expiry" ]]; then
            local expiry_timestamp=$(date -d "$cert_expiry" +%s 2>/dev/null || echo "0")
            local current_timestamp=$(date +%s)
            ssl_days_remaining=$(( (expiry_timestamp - current_timestamp) / 86400 ))
            
            if [[ $ssl_days_remaining -lt 7 ]]; then
                ssl_status="critical"
                log "CRITICAL" "SSL certificate expires in $ssl_days_remaining days"
            elif [[ $ssl_days_remaining -lt 30 ]]; then
                ssl_status="warning"
                log "WARN" "SSL certificate expires in $ssl_days_remaining days"
            fi
        fi
    fi
    
    HEALTH_RESULTS["security_ssl_status"]="$ssl_status"
    HEALTH_RESULTS["security_ssl_days_remaining"]="$ssl_days_remaining"
    
    update_overall_status "$ssl_status"
}

send_alert() {
    local status="$1"
    local message="$2"
    
    if [[ -n "$ALERT_WEBHOOK" ]] && [[ "$status" == "critical" ]]; then
        log "DEBUG" "Sending alert webhook..."
        
        curl -X POST "$ALERT_WEBHOOK" \
            -H "Content-Type: application/json" \
            -d "{
                \"type\": \"health_check\",
                \"environment\": \"$ENVIRONMENT\",
                \"status\": \"$status\",
                \"message\": \"$message\",
                \"timestamp\": \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\",
                \"hostname\": \"$(hostname)\",
                \"details\": $(format_json_output)
            }" || log "WARN" "Failed to send alert webhook"
    fi
}

format_json_output() {
    local json_output="{"
    json_output="$json_output\"timestamp\":\"$(date -u +%Y-%m-%dT%H:%M:%SZ)\","
    json_output="$json_output\"environment\":\"$ENVIRONMENT\","
    json_output="$json_output\"hostname\":\"$(hostname)\","
    json_output="$json_output\"overall_status\":\"$OVERALL_STATUS\","
    json_output="$json_output\"checks\":{"
    
    local first=true
    for key in "${!HEALTH_RESULTS[@]}"; do
        if [[ "$first" == true ]]; then
            first=false
        else
            json_output="$json_output,"
        fi
        json_output="$json_output\"$key\":\"${HEALTH_RESULTS[$key]}\""
    done
    
    json_output="$json_output}}"
    echo "$json_output"
}

format_prometheus_output() {
    echo "# HELP bailbondpro_health_status Overall health status (0=healthy, 1=warning, 2=critical)"
    echo "# TYPE bailbondpro_health_status gauge"
    
    local status_value=0
    case "$OVERALL_STATUS" in
        "warning") status_value=1 ;;
        "critical") status_value=2 ;;
    esac
    
    echo "bailbondpro_health_status{environment=\"$ENVIRONMENT\"} $status_value"
    
    # System metrics
    if [[ -n "${HEALTH_RESULTS[system_cpu_usage]:-}" ]]; then
        echo "# HELP bailbondpro_cpu_usage_percent CPU usage percentage"
        echo "# TYPE bailbondpro_cpu_usage_percent gauge"
        echo "bailbondpro_cpu_usage_percent{environment=\"$ENVIRONMENT\"} ${HEALTH_RESULTS[system_cpu_usage]}"
    fi
    
    if [[ -n "${HEALTH_RESULTS[system_memory_usage]:-}" ]]; then
        echo "# HELP bailbondpro_memory_usage_percent Memory usage percentage"
        echo "# TYPE bailbondpro_memory_usage_percent gauge"
        echo "bailbondpro_memory_usage_percent{environment=\"$ENVIRONMENT\"} ${HEALTH_RESULTS[system_memory_usage]}"
    fi
    
    if [[ -n "${HEALTH_RESULTS[system_disk_usage]:-}" ]]; then
        echo "# HELP bailbondpro_disk_usage_percent Disk usage percentage"
        echo "# TYPE bailbondpro_disk_usage_percent gauge"
        echo "bailbondpro_disk_usage_percent{environment=\"$ENVIRONMENT\"} ${HEALTH_RESULTS[system_disk_usage]}"
    fi
    
    # Database response times
    if [[ -n "${HEALTH_RESULTS[database_postgresql_response_time]:-}" ]]; then
        echo "# HELP bailbondpro_database_response_time_ms Database response time in milliseconds"
        echo "# TYPE bailbondpro_database_response_time_ms gauge"
        echo "bailbondpro_database_response_time_ms{database=\"postgresql\",environment=\"$ENVIRONMENT\"} ${HEALTH_RESULTS[database_postgresql_response_time]}"
    fi
    
    if [[ -n "${HEALTH_RESULTS[database_redis_response_time]:-}" ]]; then
        echo "bailbondpro_database_response_time_ms{database=\"redis\",environment=\"$ENVIRONMENT\"} ${HEALTH_RESULTS[database_redis_response_time]}"
    fi
}

output_results() {
    case "$OUTPUT_FORMAT" in
        "json")
            format_json_output
            ;;
        "prometheus")
            format_prometheus_output
            ;;
        "console"|*)
            echo
            log "INFO" "=== Health Check Summary ==="
            log "INFO" "Overall Status: $OVERALL_STATUS"
            log "INFO" "Environment: $ENVIRONMENT"
            log "INFO" "Timestamp: $(date)"
            echo
            
            if [[ "$OVERALL_STATUS" == "healthy" ]]; then
                log "SUCCESS" "🎉 All systems are healthy!"
            elif [[ "$OVERALL_STATUS" == "warning" ]]; then
                log "WARN" "⚠️  Some issues detected - review warnings above"
            else
                log "CRITICAL" "🚨 Critical issues detected - immediate attention required!"
            fi
            ;;
    esac
}

run_health_check() {
    load_environment
    
    # Run all health checks
    check_system_resources
    check_services
    check_database_connectivity
    check_network_connectivity
    check_performance_metrics
    check_security_status
    
    # Output results
    output_results
    
    # Send alerts if needed
    if [[ "$OVERALL_STATUS" == "critical" ]]; then
        send_alert "critical" "Critical health check failures detected"
    fi
    
    # Return appropriate exit code
    case "$OVERALL_STATUS" in
        "healthy") return 0 ;;
        "warning") return 1 ;;
        "critical") return 2 ;;
    esac
}

main() {
    if [[ "$CONTINUOUS" == true ]]; then
        log "INFO" "Starting continuous health monitoring (interval: ${INTERVAL}s)"
        
        while true; do
            show_banner
            run_health_check
            
            if [[ "$OUTPUT_FORMAT" == "console" ]]; then
                echo
                log "INFO" "Next check in ${INTERVAL} seconds... (Ctrl+C to stop)"
                echo
            fi
            
            sleep "$INTERVAL"
        done
    else
        show_banner
        run_health_check
    fi
}

# Parse arguments and run
parse_arguments "$@"
main