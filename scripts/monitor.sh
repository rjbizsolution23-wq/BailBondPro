#!/bin/bash

# ========================================================================
# BailBondPro - System Monitor Script
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
WHITE='\033[1;37m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
MONITOR_LOG="$PROJECT_ROOT/logs/monitor_$TIMESTAMP.log"

# Default values
ENVIRONMENT="production"
REFRESH_INTERVAL=5
ALERT_THRESHOLD_CPU=80
ALERT_THRESHOLD_MEMORY=85
ALERT_THRESHOLD_DISK=90
ALERT_THRESHOLD_RESPONSE=2000
DASHBOARD_MODE=false
EXPORT_METRICS=false
METRICS_FILE=""
WEBHOOK_URL=""
SLACK_WEBHOOK=""
EMAIL_ALERTS=""
CONTINUOUS=true
MAX_LOG_SIZE="100M"
LOG_RETENTION_DAYS=7

# Monitoring flags
MONITOR_SYSTEM=true
MONITOR_SERVICES=true
MONITOR_NETWORK=true
MONITOR_PERFORMANCE=true
MONITOR_LOGS=true
MONITOR_SECURITY=true

# Data storage
declare -A METRICS_HISTORY
declare -A ALERT_COUNTS
declare -A LAST_ALERTS

# Functions
log() {
    local level=$1
    shift
    local message="$*"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    
    # Log to file
    mkdir -p "$(dirname "$MONITOR_LOG")"
    echo "[$timestamp] [$level] $message" >> "$MONITOR_LOG"
    
    # Console output with colors
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
            echo -e "${BLUE}[DEBUG]${NC} $message"
            ;;
        "ALERT")
            echo -e "${RED}[ALERT]${NC} $message"
            ;;
        "SUCCESS")
            echo -e "${GREEN}[SUCCESS]${NC} $message"
            ;;
    esac
}

show_banner() {
    clear
    echo -e "${PURPLE}"
    cat << 'EOF'
    ╔══════════════════════════════════════════════════════════════╗
    ║                    BailBondPro Monitor                       ║
    ║                  Real-time System Monitor                    ║
    ╚══════════════════════════════════════════════════════════════╝
EOF
    echo -e "${NC}"
}

show_help() {
    cat << EOF
BailBondPro System Monitor

Usage: $0 [OPTIONS]

OPTIONS:
    -e, --environment ENV     Environment to monitor (production, staging, development)
    -i, --interval SECONDS    Refresh interval in seconds (default: 5)
    -d, --dashboard           Enable dashboard mode with real-time display
    --export FILE             Export metrics to file
    --webhook URL             Webhook URL for alerts
    --slack URL               Slack webhook URL for notifications
    --email EMAIL             Email address for alerts
    --cpu-threshold N         CPU alert threshold percentage (default: 80)
    --memory-threshold N      Memory alert threshold percentage (default: 85)
    --disk-threshold N        Disk alert threshold percentage (default: 90)
    --response-threshold N    Response time threshold in ms (default: 2000)
    --max-log-size SIZE       Maximum log file size (default: 100M)
    --log-retention DAYS      Log retention in days (default: 7)
    -h, --help                Show this help message

MONITORING CATEGORIES:
    --no-system               Disable system resource monitoring
    --no-services             Disable service monitoring
    --no-network              Disable network monitoring
    --no-performance          Disable performance monitoring
    --no-logs                 Disable log monitoring
    --no-security             Disable security monitoring

EXAMPLES:
    $0                        # Basic monitoring
    $0 -d                     # Dashboard mode
    $0 --export metrics.json  # Export metrics to file
    $0 --webhook http://...   # Send alerts to webhook
    $0 -i 10 --cpu-threshold 70  # Custom intervals and thresholds

DASHBOARD CONTROLS:
    q, Ctrl+C                 Quit
    r                         Refresh now
    p                         Pause/Resume
    s                         Save current metrics
    h                         Show/Hide help

EOF
}

parse_arguments() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            -e|--environment)
                ENVIRONMENT="$2"
                shift 2
                ;;
            -i|--interval)
                REFRESH_INTERVAL="$2"
                shift 2
                ;;
            -d|--dashboard)
                DASHBOARD_MODE=true
                shift
                ;;
            --export)
                EXPORT_METRICS=true
                METRICS_FILE="$2"
                shift 2
                ;;
            --webhook)
                WEBHOOK_URL="$2"
                shift 2
                ;;
            --slack)
                SLACK_WEBHOOK="$2"
                shift 2
                ;;
            --email)
                EMAIL_ALERTS="$2"
                shift 2
                ;;
            --cpu-threshold)
                ALERT_THRESHOLD_CPU="$2"
                shift 2
                ;;
            --memory-threshold)
                ALERT_THRESHOLD_MEMORY="$2"
                shift 2
                ;;
            --disk-threshold)
                ALERT_THRESHOLD_DISK="$2"
                shift 2
                ;;
            --response-threshold)
                ALERT_THRESHOLD_RESPONSE="$2"
                shift 2
                ;;
            --max-log-size)
                MAX_LOG_SIZE="$2"
                shift 2
                ;;
            --log-retention)
                LOG_RETENTION_DAYS="$2"
                shift 2
                ;;
            --no-system)
                MONITOR_SYSTEM=false
                shift
                ;;
            --no-services)
                MONITOR_SERVICES=false
                shift
                ;;
            --no-network)
                MONITOR_NETWORK=false
                shift
                ;;
            --no-performance)
                MONITOR_PERFORMANCE=false
                shift
                ;;
            --no-logs)
                MONITOR_LOGS=false
                shift
                ;;
            --no-security)
                MONITOR_SECURITY=false
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
    fi
}

get_system_metrics() {
    if [[ "$MONITOR_SYSTEM" != true ]]; then
        return 0
    fi
    
    local cpu_usage=""
    local memory_usage=""
    local disk_usage=""
    local load_average=""
    local uptime=""
    
    # CPU Usage (macOS)
    if command -v top &> /dev/null; then
        cpu_usage=$(top -l 1 -n 0 | grep "CPU usage" | awk '{print $3}' | sed 's/%//' || echo "0")
    fi
    
    # Memory Usage (macOS)
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
    
    # System Uptime
    uptime=$(uptime | awk '{print $3,$4}' | sed 's/,//' || echo "unknown")
    
    # Store metrics
    METRICS_HISTORY["cpu_usage"]="$cpu_usage"
    METRICS_HISTORY["memory_usage"]="$memory_usage"
    METRICS_HISTORY["disk_usage"]="$disk_usage"
    METRICS_HISTORY["load_average"]="$load_average"
    METRICS_HISTORY["uptime"]="$uptime"
    
    # Check thresholds and alert
    check_threshold "CPU" "$cpu_usage" "$ALERT_THRESHOLD_CPU"
    check_threshold "Memory" "$memory_usage" "$ALERT_THRESHOLD_MEMORY"
    check_threshold "Disk" "$disk_usage" "$ALERT_THRESHOLD_DISK"
}

get_service_metrics() {
    if [[ "$MONITOR_SERVICES" != true ]]; then
        return 0
    fi
    
    local services=("postgresql" "redis" "nginx" "bailbondpro")
    local running_services=0
    local total_services=${#services[@]}
    
    for service in "${services[@]}"; do
        local status="down"
        
        # Check systemd service
        if systemctl is-active --quiet "$service" 2>/dev/null; then
            status="up"
            ((running_services++))
        # Check process
        elif pgrep -f "$service" >/dev/null 2>&1; then
            status="up"
            ((running_services++))
        # Check Docker container
        elif command -v docker &> /dev/null && docker ps --format "table {{.Names}}" | grep -q "$service"; then
            status="up"
            ((running_services++))
        fi
        
        METRICS_HISTORY["service_${service}"]="$status"
    done
    
    METRICS_HISTORY["services_running"]="$running_services"
    METRICS_HISTORY["services_total"]="$total_services"
    
    # Alert if services are down
    if [[ $running_services -lt $total_services ]]; then
        local down_services=$((total_services - running_services))
        send_alert "CRITICAL" "Services Down" "$down_services out of $total_services services are not running"
    fi
}

get_network_metrics() {
    if [[ "$MONITOR_NETWORK" != true ]]; then
        return 0
    fi
    
    local endpoints=("http://localhost:3000" "http://localhost:8080")
    local healthy_endpoints=0
    local total_response_time=0
    local successful_requests=0
    
    for endpoint in "${endpoints[@]}"; do
        local start_time=$(date +%s%3N)
        if timeout 10 curl -f -s "$endpoint/health" >/dev/null 2>&1 || timeout 10 curl -f -s "$endpoint" >/dev/null 2>&1; then
            local end_time=$(date +%s%3N)
            local response_time=$((end_time - start_time))
            total_response_time=$((total_response_time + response_time))
            ((successful_requests++))
            ((healthy_endpoints++))
            
            # Check response time threshold
            if [[ $response_time -gt $ALERT_THRESHOLD_RESPONSE ]]; then
                send_alert "WARNING" "Slow Response" "Endpoint $endpoint responded in ${response_time}ms (threshold: ${ALERT_THRESHOLD_RESPONSE}ms)"
            fi
        fi
    done
    
    local avg_response_time=0
    if [[ $successful_requests -gt 0 ]]; then
        avg_response_time=$((total_response_time / successful_requests))
    fi
    
    METRICS_HISTORY["network_healthy_endpoints"]="$healthy_endpoints"
    METRICS_HISTORY["network_total_endpoints"]="${#endpoints[@]}"
    METRICS_HISTORY["network_avg_response_time"]="$avg_response_time"
    
    # External connectivity check
    local external_connectivity="down"
    if timeout 5 ping -c 1 8.8.8.8 >/dev/null 2>&1; then
        external_connectivity="up"
    fi
    
    METRICS_HISTORY["network_external"]="$external_connectivity"
}

get_performance_metrics() {
    if [[ "$MONITOR_PERFORMANCE" != true ]]; then
        return 0
    fi
    
    # Database connection times
    local db_response_time=""
    local redis_response_time=""
    
    # PostgreSQL check
    if [[ -n "${DATABASE_URL:-}" ]]; then
        local start_time=$(date +%s%3N)
        if timeout 5 psql "$DATABASE_URL" -c "SELECT 1;" >/dev/null 2>&1; then
            local end_time=$(date +%s%3N)
            db_response_time=$((end_time - start_time))
        else
            db_response_time="timeout"
        fi
    fi
    
    # Redis check
    if [[ -n "${REDIS_URL:-}" ]]; then
        local redis_host=$(echo "$REDIS_URL" | sed -n 's/.*@\([^:]*\):.*/\1/p' || echo "localhost")
        local redis_port=$(echo "$REDIS_URL" | sed -n 's/.*:\([0-9]*\).*/\1/p' || echo "6379")
        
        local start_time=$(date +%s%3N)
        if timeout 5 redis-cli -h "$redis_host" -p "$redis_port" ping >/dev/null 2>&1; then
            local end_time=$(date +%s%3N)
            redis_response_time=$((end_time - start_time))
        else
            redis_response_time="timeout"
        fi
    fi
    
    METRICS_HISTORY["db_response_time"]="$db_response_time"
    METRICS_HISTORY["redis_response_time"]="$redis_response_time"
    
    # Process count
    local process_count=$(ps aux | wc -l || echo "0")
    METRICS_HISTORY["process_count"]="$process_count"
}

get_log_metrics() {
    if [[ "$MONITOR_LOGS" != true ]]; then
        return 0
    fi
    
    local log_files=("$PROJECT_ROOT/logs/error.log" "$PROJECT_ROOT/logs/app.log")
    local total_errors=0
    local total_warnings=0
    
    for log_file in "${log_files[@]}"; do
        if [[ -f "$log_file" ]]; then
            # Count recent errors (last 100 lines)
            local errors=$(tail -100 "$log_file" | grep -c "ERROR\|CRITICAL\|FATAL" 2>/dev/null || echo "0")
            local warnings=$(tail -100 "$log_file" | grep -c "WARN\|WARNING" 2>/dev/null || echo "0")
            
            total_errors=$((total_errors + errors))
            total_warnings=$((total_warnings + warnings))
        fi
    done
    
    METRICS_HISTORY["log_errors"]="$total_errors"
    METRICS_HISTORY["log_warnings"]="$total_warnings"
    
    # Alert on high error rates
    if [[ $total_errors -gt 10 ]]; then
        send_alert "CRITICAL" "High Error Rate" "$total_errors errors found in recent logs"
    elif [[ $total_errors -gt 5 ]]; then
        send_alert "WARNING" "Elevated Error Rate" "$total_errors errors found in recent logs"
    fi
}

get_security_metrics() {
    if [[ "$MONITOR_SECURITY" != true ]]; then
        return 0
    fi
    
    # Check failed login attempts (if auth logs exist)
    local failed_logins=0
    local auth_log="$PROJECT_ROOT/logs/auth.log"
    if [[ -f "$auth_log" ]]; then
        failed_logins=$(tail -100 "$auth_log" | grep -c "failed\|denied\|unauthorized" 2>/dev/null || echo "0")
    fi
    
    # Check for suspicious processes
    local suspicious_processes=0
    local suspicious_patterns=("nc -l" "ncat -l" "socat" "python -m http.server")
    for pattern in "${suspicious_patterns[@]}"; do
        if pgrep -f "$pattern" >/dev/null 2>&1; then
            ((suspicious_processes++))
        fi
    done
    
    METRICS_HISTORY["security_failed_logins"]="$failed_logins"
    METRICS_HISTORY["security_suspicious_processes"]="$suspicious_processes"
    
    # Alert on security issues
    if [[ $failed_logins -gt 10 ]]; then
        send_alert "CRITICAL" "Security Alert" "$failed_logins failed login attempts detected"
    fi
    
    if [[ $suspicious_processes -gt 0 ]]; then
        send_alert "WARNING" "Security Alert" "$suspicious_processes suspicious processes detected"
    fi
}

check_threshold() {
    local metric_name="$1"
    local current_value="$2"
    local threshold="$3"
    
    # Skip if value is not numeric
    if ! [[ "$current_value" =~ ^[0-9]+\.?[0-9]*$ ]]; then
        return 0
    fi
    
    local alert_key="${metric_name}_threshold"
    local current_time=$(date +%s)
    
    # Check if we've already alerted recently (within 5 minutes)
    if [[ -n "${LAST_ALERTS[$alert_key]:-}" ]]; then
        local last_alert_time="${LAST_ALERTS[$alert_key]}"
        local time_diff=$((current_time - last_alert_time))
        if [[ $time_diff -lt 300 ]]; then  # 5 minutes
            return 0
        fi
    fi
    
    if (( $(echo "$current_value > $threshold" | bc -l 2>/dev/null || echo "0") )); then
        send_alert "CRITICAL" "$metric_name Threshold Exceeded" "$metric_name is at ${current_value}% (threshold: ${threshold}%)"
        LAST_ALERTS[$alert_key]="$current_time"
        ALERT_COUNTS[$alert_key]=$((${ALERT_COUNTS[$alert_key]:-0} + 1))
    fi
}

send_alert() {
    local severity="$1"
    local title="$2"
    local message="$3"
    local timestamp=$(date -u +%Y-%m-%dT%H:%M:%SZ)
    
    log "ALERT" "[$severity] $title: $message"
    
    # Webhook alert
    if [[ -n "$WEBHOOK_URL" ]]; then
        curl -X POST "$WEBHOOK_URL" \
            -H "Content-Type: application/json" \
            -d "{
                \"severity\": \"$severity\",
                \"title\": \"$title\",
                \"message\": \"$message\",
                \"timestamp\": \"$timestamp\",
                \"environment\": \"$ENVIRONMENT\",
                \"hostname\": \"$(hostname)\"
            }" >/dev/null 2>&1 || true
    fi
    
    # Slack alert
    if [[ -n "$SLACK_WEBHOOK" ]]; then
        local color="danger"
        [[ "$severity" == "WARNING" ]] && color="warning"
        
        curl -X POST "$SLACK_WEBHOOK" \
            -H "Content-Type: application/json" \
            -d "{
                \"attachments\": [{
                    \"color\": \"$color\",
                    \"title\": \"BailBondPro Alert: $title\",
                    \"text\": \"$message\",
                    \"fields\": [
                        {\"title\": \"Environment\", \"value\": \"$ENVIRONMENT\", \"short\": true},
                        {\"title\": \"Severity\", \"value\": \"$severity\", \"short\": true},
                        {\"title\": \"Hostname\", \"value\": \"$(hostname)\", \"short\": true},
                        {\"title\": \"Time\", \"value\": \"$timestamp\", \"short\": true}
                    ]
                }]
            }" >/dev/null 2>&1 || true
    fi
    
    # Email alert (requires mail command)
    if [[ -n "$EMAIL_ALERTS" ]] && command -v mail &> /dev/null; then
        echo "Alert: $title
        
Severity: $severity
Message: $message
Environment: $ENVIRONMENT
Hostname: $(hostname)
Time: $timestamp

This is an automated alert from BailBondPro monitoring system." | mail -s "BailBondPro Alert: $title" "$EMAIL_ALERTS" || true
    fi
}

display_dashboard() {
    local current_time=$(date '+%Y-%m-%d %H:%M:%S')
    
    # Header
    echo -e "${WHITE}╔══════════════════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${WHITE}║                           BailBondPro System Monitor                         ║${NC}"
    echo -e "${WHITE}║ Environment: ${ENVIRONMENT}${NC}$(printf "%*s" $((50 - ${#ENVIRONMENT})) "")${WHITE}Time: ${current_time} ║${NC}"
    echo -e "${WHITE}╠══════════════════════════════════════════════════════════════════════════════╣${NC}"
    
    # System Resources
    if [[ "$MONITOR_SYSTEM" == true ]]; then
        echo -e "${WHITE}║ SYSTEM RESOURCES                                                             ║${NC}"
        echo -e "${WHITE}╠══════════════════════════════════════════════════════════════════════════════╣${NC}"
        
        local cpu="${METRICS_HISTORY[cpu_usage]:-0}"
        local memory="${METRICS_HISTORY[memory_usage]:-0}"
        local disk="${METRICS_HISTORY[disk_usage]:-0}"
        local load="${METRICS_HISTORY[load_average]:-0}"
        
        printf "${WHITE}║${NC} CPU Usage:    %s%-6s${NC} %s Memory Usage: %s%-6s${NC} %s Load Avg: %-8s ${WHITE}║${NC}\n" \
            "$(get_color_for_value "$cpu" "$ALERT_THRESHOLD_CPU")" "${cpu}%" \
            "$(printf "%*s" $((15 - ${#cpu})) "")" \
            "$(get_color_for_value "$memory" "$ALERT_THRESHOLD_MEMORY")" "${memory}%" \
            "$(printf "%*s" $((10 - ${#memory})) "")" "$load"
        
        printf "${WHITE}║${NC} Disk Usage:   %s%-6s${NC} %s Uptime: %-30s ${WHITE}║${NC}\n" \
            "$(get_color_for_value "$disk" "$ALERT_THRESHOLD_DISK")" "${disk}%" \
            "$(printf "%*s" $((15 - ${#disk})) "")" "${METRICS_HISTORY[uptime]:-unknown}"
        
        echo -e "${WHITE}╠══════════════════════════════════════════════════════════════════════════════╣${NC}"
    fi
    
    # Services
    if [[ "$MONITOR_SERVICES" == true ]]; then
        echo -e "${WHITE}║ SERVICES STATUS                                                              ║${NC}"
        echo -e "${WHITE}╠══════════════════════════════════════════════════════════════════════════════╣${NC}"
        
        local services=("postgresql" "redis" "nginx" "bailbondpro")
        local service_line=""
        
        for service in "${services[@]}"; do
            local status="${METRICS_HISTORY[service_${service}]:-down}"
            local color="${GREEN}"
            local symbol="●"
            
            if [[ "$status" == "down" ]]; then
                color="${RED}"
                symbol="●"
            fi
            
            service_line="${service_line} ${color}${symbol}${NC} ${service}"
        done
        
        printf "${WHITE}║${NC}%s%*s${WHITE}║${NC}\n" "$service_line" $((76 - $(echo "$service_line" | wc -c))) ""
        
        local running="${METRICS_HISTORY[services_running]:-0}"
        local total="${METRICS_HISTORY[services_total]:-0}"
        printf "${WHITE}║${NC} Services Running: %s%d/%d${NC}%*s${WHITE}║${NC}\n" \
            "$(get_color_for_services "$running" "$total")" "$running" "$total" \
            $((60 - ${#running} - ${#total})) ""
        
        echo -e "${WHITE}╠══════════════════════════════════════════════════════════════════════════════╣${NC}"
    fi
    
    # Network & Performance
    if [[ "$MONITOR_NETWORK" == true ]] || [[ "$MONITOR_PERFORMANCE" == true ]]; then
        echo -e "${WHITE}║ NETWORK & PERFORMANCE                                                        ║${NC}"
        echo -e "${WHITE}╠══════════════════════════════════════════════════════════════════════════════╣${NC}"
        
        local healthy_endpoints="${METRICS_HISTORY[network_healthy_endpoints]:-0}"
        local total_endpoints="${METRICS_HISTORY[network_total_endpoints]:-0}"
        local avg_response="${METRICS_HISTORY[network_avg_response_time]:-0}"
        local external="${METRICS_HISTORY[network_external]:-down}"
        
        printf "${WHITE}║${NC} Endpoints: %s%d/%d${NC} %s Avg Response: %s%-6s${NC} %s External: %s%-4s${NC} ${WHITE}║${NC}\n" \
            "$(get_color_for_services "$healthy_endpoints" "$total_endpoints")" "$healthy_endpoints" "$total_endpoints" \
            "$(printf "%*s" $((8 - ${#healthy_endpoints} - ${#total_endpoints})) "")" \
            "$(get_color_for_response "$avg_response")" "${avg_response}ms" \
            "$(printf "%*s" $((8 - ${#avg_response})) "")" \
            "$(get_color_for_status "$external")" "$external"
        
        local db_response="${METRICS_HISTORY[db_response_time]:-N/A}"
        local redis_response="${METRICS_HISTORY[redis_response_time]:-N/A}"
        
        printf "${WHITE}║${NC} DB Response: %s%-8s${NC} Redis Response: %s%-8s${NC}%*s${WHITE}║${NC}\n" \
            "$(get_color_for_response "$db_response")" "${db_response}ms" \
            "$(get_color_for_response "$redis_response")" "${redis_response}ms" \
            $((30 - ${#db_response} - ${#redis_response})) ""
        
        echo -e "${WHITE}╠══════════════════════════════════════════════════════════════════════════════╣${NC}"
    fi
    
    # Logs & Security
    if [[ "$MONITOR_LOGS" == true ]] || [[ "$MONITOR_SECURITY" == true ]]; then
        echo -e "${WHITE}║ LOGS & SECURITY                                                             ║${NC}"
        echo -e "${WHITE}╠══════════════════════════════════════════════════════════════════════════════╣${NC}"
        
        local errors="${METRICS_HISTORY[log_errors]:-0}"
        local warnings="${METRICS_HISTORY[log_warnings]:-0}"
        local failed_logins="${METRICS_HISTORY[security_failed_logins]:-0}"
        local suspicious="${METRICS_HISTORY[security_suspicious_processes]:-0}"
        
        printf "${WHITE}║${NC} Log Errors: %s%-4s${NC} %s Warnings: %s%-4s${NC} %s Failed Logins: %s%-4s${NC} %s Suspicious: %s%-4s${NC} ${WHITE}║${NC}\n" \
            "$(get_color_for_count "$errors")" "$errors" \
            "$(printf "%*s" $((6 - ${#errors})) "")" \
            "$(get_color_for_count "$warnings")" "$warnings" \
            "$(printf "%*s" $((6 - ${#warnings})) "")" \
            "$(get_color_for_count "$failed_logins")" "$failed_logins" \
            "$(printf "%*s" $((6 - ${#failed_logins})) "")" \
            "$(get_color_for_count "$suspicious")" "$suspicious"
        
        echo -e "${WHITE}╠══════════════════════════════════════════════════════════════════════════════╣${NC}"
    fi
    
    # Footer
    echo -e "${WHITE}║ Controls: [q]uit [r]efresh [p]ause [s]ave [h]elp                           ║${NC}"
    echo -e "${WHITE}╚══════════════════════════════════════════════════════════════════════════════╝${NC}"
    
    # Alert summary
    local total_alerts=0
    for count in "${ALERT_COUNTS[@]}"; do
        total_alerts=$((total_alerts + count))
    done
    
    if [[ $total_alerts -gt 0 ]]; then
        echo -e "${RED}⚠️  Total Alerts This Session: $total_alerts${NC}"
    fi
}

get_color_for_value() {
    local value="$1"
    local threshold="$2"
    
    if ! [[ "$value" =~ ^[0-9]+\.?[0-9]*$ ]]; then
        echo "${YELLOW}"
        return
    fi
    
    if (( $(echo "$value > $threshold" | bc -l 2>/dev/null || echo "0") )); then
        echo "${RED}"
    elif (( $(echo "$value > $(($threshold - 10))" | bc -l 2>/dev/null || echo "0") )); then
        echo "${YELLOW}"
    else
        echo "${GREEN}"
    fi
}

get_color_for_services() {
    local running="$1"
    local total="$2"
    
    if [[ "$running" == "$total" ]]; then
        echo "${GREEN}"
    elif [[ "$running" -gt 0 ]]; then
        echo "${YELLOW}"
    else
        echo "${RED}"
    fi
}

get_color_for_response() {
    local response="$1"
    
    if [[ "$response" == "timeout" ]] || [[ "$response" == "N/A" ]]; then
        echo "${RED}"
    elif ! [[ "$response" =~ ^[0-9]+$ ]]; then
        echo "${YELLOW}"
    elif [[ $response -gt $ALERT_THRESHOLD_RESPONSE ]]; then
        echo "${RED}"
    elif [[ $response -gt $((ALERT_THRESHOLD_RESPONSE / 2)) ]]; then
        echo "${YELLOW}"
    else
        echo "${GREEN}"
    fi
}

get_color_for_status() {
    local status="$1"
    
    if [[ "$status" == "up" ]]; then
        echo "${GREEN}"
    else
        echo "${RED}"
    fi
}

get_color_for_count() {
    local count="$1"
    
    if [[ $count -eq 0 ]]; then
        echo "${GREEN}"
    elif [[ $count -lt 5 ]]; then
        echo "${YELLOW}"
    else
        echo "${RED}"
    fi
}

export_metrics() {
    if [[ "$EXPORT_METRICS" != true ]] || [[ -z "$METRICS_FILE" ]]; then
        return 0
    fi
    
    local timestamp=$(date -u +%Y-%m-%dT%H:%M:%SZ)
    local json_output="{"
    json_output="$json_output\"timestamp\":\"$timestamp\","
    json_output="$json_output\"environment\":\"$ENVIRONMENT\","
    json_output="$json_output\"hostname\":\"$(hostname)\","
    json_output="$json_output\"metrics\":{"
    
    local first=true
    for key in "${!METRICS_HISTORY[@]}"; do
        if [[ "$first" == true ]]; then
            first=false
        else
            json_output="$json_output,"
        fi
        json_output="$json_output\"$key\":\"${METRICS_HISTORY[$key]}\""
    done
    
    json_output="$json_output}}"
    
    echo "$json_output" >> "$METRICS_FILE"
}

cleanup_logs() {
    # Rotate log files if they exceed max size
    if [[ -f "$MONITOR_LOG" ]]; then
        local log_size=$(stat -f%z "$MONITOR_LOG" 2>/dev/null || echo "0")
        local max_bytes=$(echo "$MAX_LOG_SIZE" | sed 's/M/*1024*1024/' | bc 2>/dev/null || echo "104857600")
        
        if [[ $log_size -gt $max_bytes ]]; then
            mv "$MONITOR_LOG" "${MONITOR_LOG}.old"
            touch "$MONITOR_LOG"
        fi
    fi
    
    # Clean up old log files
    find "$PROJECT_ROOT/logs" -name "monitor_*.log*" -mtime +$LOG_RETENTION_DAYS -delete 2>/dev/null || true
}

handle_dashboard_input() {
    local paused=false
    
    while true; do
        if [[ "$paused" == false ]]; then
            show_banner
            
            # Collect all metrics
            get_system_metrics
            get_service_metrics
            get_network_metrics
            get_performance_metrics
            get_log_metrics
            get_security_metrics
            
            # Display dashboard
            display_dashboard
            
            # Export metrics if enabled
            export_metrics
            
            # Cleanup logs
            cleanup_logs
        fi
        
        # Check for user input with timeout
        if read -t "$REFRESH_INTERVAL" -n 1 input 2>/dev/null; then
            case "$input" in
                q|Q)
                    log "INFO" "Monitoring stopped by user"
                    exit 0
                    ;;
                r|R)
                    continue
                    ;;
                p|P)
                    if [[ "$paused" == true ]]; then
                        paused=false
                        log "INFO" "Monitoring resumed"
                    else
                        paused=true
                        log "INFO" "Monitoring paused"
                    fi
                    ;;
                s|S)
                    local save_file="$PROJECT_ROOT/logs/metrics_$(date +%Y%m%d_%H%M%S).json"
                    export_metrics
                    log "INFO" "Metrics saved to $save_file"
                    ;;
                h|H)
                    show_help
                    read -p "Press Enter to continue..."
                    ;;
            esac
        fi
    done
}

run_continuous_monitoring() {
    log "INFO" "Starting continuous monitoring (interval: ${REFRESH_INTERVAL}s)"
    
    while true; do
        # Collect all metrics
        get_system_metrics
        get_service_metrics
        get_network_metrics
        get_performance_metrics
        get_log_metrics
        get_security_metrics
        
        # Export metrics if enabled
        export_metrics
        
        # Cleanup logs
        cleanup_logs
        
        sleep "$REFRESH_INTERVAL"
    done
}

main() {
    load_environment
    
    # Setup signal handlers
    trap 'log "INFO" "Monitoring stopped"; exit 0' SIGINT SIGTERM
    
    if [[ "$DASHBOARD_MODE" == true ]]; then
        handle_dashboard_input
    else
        run_continuous_monitoring
    fi
}

# Parse arguments and run
parse_arguments "$@"
main