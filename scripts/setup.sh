#!/bin/bash

# ========================================================================
# BailBondPro - Development Environment Setup Script
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
NODE_VERSION="20"
PYTHON_VERSION="3.11"

# Default values
SKIP_DEPS=false
SKIP_DB=false
SKIP_ENV=false
FORCE_INSTALL=false
VERBOSE=false
ENVIRONMENT="development"

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
    ____        _ _ ____                 _ _____           
   |  _ \      (_) |  _ \               | |  __ \          
   | |_) | __ _ _| | |_) | ___  _ __  __| | |__) | __ ___  
   |  _ < / _` | | |  _ < / _ \| '_ \/ _` |  ___/ '__/ _ \ 
   | |_) | (_| | | | |_) | (_) | | | (_| | |   | | | (_) |
   |____/ \__,_|_|_|____/ \___/|_| |_\__,_|_|   |_|  \___/ 
                                                           
   Development Environment Setup
EOF
    echo -e "${NC}"
}

show_help() {
    cat << EOF
BailBondPro Development Environment Setup

Usage: $0 [OPTIONS]

OPTIONS:
    -e, --environment ENV      Target environment (development, staging, production)
    -s, --skip-deps           Skip dependency installation
    -d, --skip-db             Skip database setup
    -c, --skip-env            Skip environment configuration
    -f, --force               Force reinstall even if already installed
    -v, --verbose             Enable verbose logging
    -h, --help                Show this help message

EXAMPLES:
    $0                        # Full setup for development
    $0 -e staging             # Setup for staging environment
    $0 -s -d                  # Skip dependencies and database setup
    $0 -f                     # Force reinstall everything

EOF
}

parse_arguments() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            -e|--environment)
                ENVIRONMENT="$2"
                shift 2
                ;;
            -s|--skip-deps)
                SKIP_DEPS=true
                shift
                ;;
            -d|--skip-db)
                SKIP_DB=true
                shift
                ;;
            -c|--skip-env)
                SKIP_ENV=true
                shift
                ;;
            -f|--force)
                FORCE_INSTALL=true
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

check_system() {
    log "STEP" "Checking system requirements..."
    
    # Check OS
    case "$(uname -s)" in
        Darwin*)
            log "INFO" "Detected macOS"
            ;;
        Linux*)
            log "INFO" "Detected Linux"
            ;;
        CYGWIN*|MINGW32*|MSYS*|MINGW*)
            log "INFO" "Detected Windows"
            ;;
        *)
            log "WARN" "Unknown operating system: $(uname -s)"
            ;;
    esac
    
    # Check architecture
    log "INFO" "Architecture: $(uname -m)"
    
    # Check available disk space (minimum 5GB)
    local available_space
    if command -v df &> /dev/null; then
        available_space=$(df -h "$PROJECT_ROOT" | awk 'NR==2 {print $4}' | sed 's/G.*//')
        if [[ "$available_space" -lt 5 ]]; then
            log "WARN" "Low disk space: ${available_space}GB available (minimum 5GB recommended)"
        else
            log "INFO" "Disk space: ${available_space}GB available"
        fi
    fi
    
    log "SUCCESS" "System check completed"
}

install_homebrew() {
    if command -v brew &> /dev/null; then
        log "INFO" "Homebrew already installed"
        return 0
    fi
    
    log "STEP" "Installing Homebrew..."
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    
    # Add Homebrew to PATH
    if [[ -f "/opt/homebrew/bin/brew" ]]; then
        echo 'eval "$(/opt/homebrew/bin/brew shellenv)"' >> ~/.zprofile
        eval "$(/opt/homebrew/bin/brew shellenv)"
    fi
    
    log "SUCCESS" "Homebrew installed successfully"
}

install_node() {
    log "STEP" "Setting up Node.js..."
    
    # Install Node Version Manager (nvm) if not present
    if ! command -v nvm &> /dev/null && [[ ! -s "$HOME/.nvm/nvm.sh" ]]; then
        log "INFO" "Installing NVM..."
        curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
        export NVM_DIR="$HOME/.nvm"
        [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
    fi
    
    # Load nvm
    export NVM_DIR="$HOME/.nvm"
    [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
    
    # Install and use Node.js
    if command -v nvm &> /dev/null; then
        nvm install "$NODE_VERSION"
        nvm use "$NODE_VERSION"
        nvm alias default "$NODE_VERSION"
    else
        # Fallback to system package manager
        if command -v brew &> /dev/null; then
            brew install node@"$NODE_VERSION"
        elif command -v apt-get &> /dev/null; then
            curl -fsSL https://deb.nodesource.com/setup_"$NODE_VERSION".x | sudo -E bash -
            sudo apt-get install -y nodejs
        fi
    fi
    
    # Verify installation
    local node_version=$(node --version)
    local npm_version=$(npm --version)
    log "SUCCESS" "Node.js installed: $node_version, npm: $npm_version"
}

install_python() {
    log "STEP" "Setting up Python..."
    
    if command -v python3 &> /dev/null; then
        local current_version=$(python3 --version | cut -d' ' -f2 | cut -d'.' -f1,2)
        if [[ "$current_version" == "$PYTHON_VERSION" ]] && [[ "$FORCE_INSTALL" != true ]]; then
            log "INFO" "Python $PYTHON_VERSION already installed"
            return 0
        fi
    fi
    
    # Install Python using system package manager
    if command -v brew &> /dev/null; then
        brew install python@"$PYTHON_VERSION"
    elif command -v apt-get &> /dev/null; then
        sudo apt-get update
        sudo apt-get install -y python"$PYTHON_VERSION" python"$PYTHON_VERSION"-pip python"$PYTHON_VERSION"-venv
    fi
    
    # Install pipenv for virtual environment management
    pip3 install --user pipenv
    
    local python_version=$(python3 --version)
    log "SUCCESS" "Python installed: $python_version"
}

install_docker() {
    log "STEP" "Setting up Docker..."
    
    if command -v docker &> /dev/null && docker info &> /dev/null; then
        log "INFO" "Docker already installed and running"
        return 0
    fi
    
    # Install Docker based on OS
    case "$(uname -s)" in
        Darwin*)
            if command -v brew &> /dev/null; then
                brew install --cask docker
            else
                log "INFO" "Please install Docker Desktop from https://www.docker.com/products/docker-desktop"
                read -p "Press Enter after installing Docker Desktop..."
            fi
            ;;
        Linux*)
            # Install Docker Engine
            curl -fsSL https://get.docker.com -o get-docker.sh
            sudo sh get-docker.sh
            sudo usermod -aG docker "$USER"
            rm get-docker.sh
            
            # Install Docker Compose
            sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
            sudo chmod +x /usr/local/bin/docker-compose
            ;;
    esac
    
    log "SUCCESS" "Docker setup completed"
}

install_database_tools() {
    log "STEP" "Installing database tools..."
    
    # PostgreSQL client
    if ! command -v psql &> /dev/null; then
        if command -v brew &> /dev/null; then
            brew install postgresql
        elif command -v apt-get &> /dev/null; then
            sudo apt-get install -y postgresql-client
        fi
    fi
    
    # Redis client
    if ! command -v redis-cli &> /dev/null; then
        if command -v brew &> /dev/null; then
            brew install redis
        elif command -v apt-get &> /dev/null; then
            sudo apt-get install -y redis-tools
        fi
    fi
    
    log "SUCCESS" "Database tools installed"
}

install_dependencies() {
    if [[ "$SKIP_DEPS" == true ]]; then
        log "INFO" "Skipping dependency installation as requested"
        return 0
    fi
    
    log "STEP" "Installing project dependencies..."
    
    cd "$PROJECT_ROOT"
    
    # Install Node.js dependencies
    if [[ -f "package.json" ]]; then
        log "INFO" "Installing Node.js dependencies..."
        npm ci
        
        # Install global tools
        npm install -g @vercel/cli railway-cli
    fi
    
    # Install Python dependencies
    if [[ -f "requirements.txt" ]]; then
        log "INFO" "Installing Python dependencies..."
        pip3 install -r requirements.txt
    fi
    
    # Install Pipenv dependencies
    if [[ -f "Pipfile" ]]; then
        log "INFO" "Installing Pipenv dependencies..."
        pipenv install --dev
    fi
    
    log "SUCCESS" "Dependencies installed successfully"
}

setup_environment() {
    if [[ "$SKIP_ENV" == true ]]; then
        log "INFO" "Skipping environment setup as requested"
        return 0
    fi
    
    log "STEP" "Setting up environment configuration..."
    
    cd "$PROJECT_ROOT"
    
    # Create .env file from template
    local env_file=".env"
    local env_template=".env.example"
    
    if [[ -f "$env_template" ]] && [[ ! -f "$env_file" || "$FORCE_INSTALL" == true ]]; then
        cp "$env_template" "$env_file"
        log "INFO" "Created $env_file from template"
        
        # Generate random secrets
        if command -v openssl &> /dev/null; then
            local jwt_secret=$(openssl rand -hex 32)
            local encryption_key=$(openssl rand -hex 32)
            local session_secret=$(openssl rand -hex 32)
            
            # Replace placeholders in .env file
            if [[ "$(uname -s)" == "Darwin" ]]; then
                sed -i '' "s/your-jwt-secret-here/$jwt_secret/g" "$env_file"
                sed -i '' "s/your-encryption-key-here/$encryption_key/g" "$env_file"
                sed -i '' "s/your-session-secret-here/$session_secret/g" "$env_file"
            else
                sed -i "s/your-jwt-secret-here/$jwt_secret/g" "$env_file"
                sed -i "s/your-encryption-key-here/$encryption_key/g" "$env_file"
                sed -i "s/your-session-secret-here/$session_secret/g" "$env_file"
            fi
            
            log "INFO" "Generated secure random secrets"
        fi
    fi
    
    # Create environment-specific files
    for env in development staging production; do
        local env_specific=".env.$env"
        local env_template_specific=".env.$env.example"
        
        if [[ -f "$env_template_specific" ]] && [[ ! -f "$env_specific" || "$FORCE_INSTALL" == true ]]; then
            cp "$env_template_specific" "$env_specific"
            log "INFO" "Created $env_specific from template"
        fi
    done
    
    # Create necessary directories
    local directories=("logs" "uploads" "backups" "temp" "public/uploads")
    for dir in "${directories[@]}"; do
        mkdir -p "$dir"
        log "DEBUG" "Created directory: $dir"
    done
    
    log "SUCCESS" "Environment configuration completed"
}

setup_database() {
    if [[ "$SKIP_DB" == true ]]; then
        log "INFO" "Skipping database setup as requested"
        return 0
    fi
    
    log "STEP" "Setting up database..."
    
    cd "$PROJECT_ROOT"
    
    # Start database services with Docker Compose
    if [[ -f "docker-compose.yml" ]]; then
        log "INFO" "Starting database services..."
        docker-compose up -d postgres redis
        
        # Wait for services to be ready
        log "INFO" "Waiting for database services to be ready..."
        sleep 10
        
        # Run database migrations
        if [[ -f "package.json" ]] && npm run | grep -q "db:migrate"; then
            log "INFO" "Running database migrations..."
            npm run db:migrate
        fi
        
        # Seed database with initial data
        if [[ -f "package.json" ]] && npm run | grep -q "db:seed"; then
            log "INFO" "Seeding database with initial data..."
            npm run db:seed
        fi
    else
        log "WARN" "docker-compose.yml not found, skipping database setup"
    fi
    
    log "SUCCESS" "Database setup completed"
}

setup_git_hooks() {
    log "STEP" "Setting up Git hooks..."
    
    cd "$PROJECT_ROOT"
    
    # Install husky if present
    if [[ -f "package.json" ]] && grep -q "husky" package.json; then
        npx husky install
        log "INFO" "Husky Git hooks installed"
    fi
    
    # Set up pre-commit hooks
    if command -v pre-commit &> /dev/null && [[ -f ".pre-commit-config.yaml" ]]; then
        pre-commit install
        log "INFO" "Pre-commit hooks installed"
    fi
    
    log "SUCCESS" "Git hooks setup completed"
}

validate_setup() {
    log "STEP" "Validating setup..."
    
    local errors=0
    
    # Check Node.js
    if ! command -v node &> /dev/null; then
        log "ERROR" "Node.js not found"
        ((errors++))
    else
        log "INFO" "✓ Node.js: $(node --version)"
    fi
    
    # Check npm
    if ! command -v npm &> /dev/null; then
        log "ERROR" "npm not found"
        ((errors++))
    else
        log "INFO" "✓ npm: $(npm --version)"
    fi
    
    # Check Docker
    if ! command -v docker &> /dev/null; then
        log "ERROR" "Docker not found"
        ((errors++))
    else
        log "INFO" "✓ Docker: $(docker --version)"
    fi
    
    # Check environment file
    if [[ ! -f "$PROJECT_ROOT/.env" ]]; then
        log "ERROR" ".env file not found"
        ((errors++))
    else
        log "INFO" "✓ Environment file exists"
    fi
    
    # Check database connection
    if [[ -f "$PROJECT_ROOT/docker-compose.yml" ]]; then
        if docker-compose ps | grep -q "postgres.*Up"; then
            log "INFO" "✓ PostgreSQL is running"
        else
            log "WARN" "PostgreSQL is not running"
        fi
        
        if docker-compose ps | grep -q "redis.*Up"; then
            log "INFO" "✓ Redis is running"
        else
            log "WARN" "Redis is not running"
        fi
    fi
    
    if [[ $errors -eq 0 ]]; then
        log "SUCCESS" "Setup validation completed successfully"
        return 0
    else
        log "ERROR" "Setup validation failed with $errors errors"
        return 1
    fi
}

show_next_steps() {
    log "STEP" "Setup completed! Next steps:"
    echo
    echo -e "${GREEN}1. Review and update environment variables:${NC}"
    echo -e "   ${BLUE}nano .env${NC}"
    echo
    echo -e "${GREEN}2. Start the development server:${NC}"
    echo -e "   ${BLUE}npm run dev${NC}"
    echo
    echo -e "${GREEN}3. Access the application:${NC}"
    echo -e "   ${BLUE}http://localhost:3000${NC}"
    echo
    echo -e "${GREEN}4. Run tests:${NC}"
    echo -e "   ${BLUE}npm test${NC}"
    echo
    echo -e "${GREEN}5. View available scripts:${NC}"
    echo -e "   ${BLUE}npm run${NC}"
    echo
    echo -e "${GREEN}6. Check database status:${NC}"
    echo -e "   ${BLUE}docker-compose ps${NC}"
    echo
    echo -e "${YELLOW}For more information, check the README.md file.${NC}"
    echo
}

main() {
    show_banner
    
    log "INFO" "Starting BailBondPro development environment setup..."
    log "INFO" "Environment: $ENVIRONMENT"
    log "INFO" "Project root: $PROJECT_ROOT"
    
    check_system
    
    # Install system dependencies
    if [[ "$(uname -s)" == "Darwin" ]]; then
        install_homebrew
    fi
    
    install_node
    install_python
    install_docker
    install_database_tools
    
    # Setup project
    install_dependencies
    setup_environment
    setup_database
    setup_git_hooks
    
    # Validate and finish
    if validate_setup; then
        show_next_steps
        log "SUCCESS" "🎉 Development environment setup completed successfully!"
    else
        log "ERROR" "❌ Setup completed with errors. Please review the output above."
        exit 1
    fi
}

# Error handling
trap 'log "ERROR" "Setup failed at line $LINENO"; exit 1' ERR

# Parse arguments and run
parse_arguments "$@"
main