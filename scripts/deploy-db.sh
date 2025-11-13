#!/bin/bash

# Furo Database Deployment Script
# This script sets up and manages the local PostgreSQL database

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}🚀 $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if Docker is running
check_docker() {
    if ! docker info >/dev/null 2>&1; then
        print_error "Docker is not running. Please start Docker and try again."
        exit 1
    fi
    print_status "Docker is running"
}

# Start the database
start_db() {
    print_status "Starting PostgreSQL database..."

    check_docker

    # Stop any existing containers
    docker-compose down 2>/dev/null || true

    # Start the services
    docker-compose up -d

    print_status "Database containers started"

    # Wait for database to be ready
    print_info "Waiting for database to be ready..."
    for i in {1..30}; do
        if docker-compose exec -T postgres pg_isready -U furo_user -d furo_db >/dev/null 2>&1; then
            print_status "Database is ready! 🎉"
            break
        fi
        echo -n "."
        sleep 2
    done
    echo ""
}

# Stop the database
stop_db() {
    print_status "Stopping PostgreSQL database..."
    docker-compose down
    print_status "Database stopped"
}

# Reset the database
reset_db() {
    print_warning "This will delete all data in the database. Are you sure? (y/N)"
    read -r response
    if [[ "$response" =~ ^[Yy]$ ]]; then
        print_status "Resetting database..."
        docker-compose down -v
        docker-compose up -d
        sleep 5
        migrate_db
        print_status "Database reset complete"
    else
        print_info "Database reset cancelled"
    fi
}

# Run database migrations
migrate_db() {
    print_status "Running database migrations..."

    # Check if database is ready
    for i in {1..10}; do
        if docker-compose exec -T postgres pg_isready -U furo_user -d furo_db >/dev/null 2>&1; then
            break
        fi
        if [ $i -eq 10 ]; then
            print_error "Database is not ready. Please start the database first."
            exit 1
        fi
        sleep 2
    done

    # Push schema to database
    npx prisma db push
    print_status "Database migrations complete"
}

# Show database status
status_db() {
    print_status "Database Status:"
    echo ""

    if docker-compose ps | grep -q "Up"; then
        print_status "✅ Database is running"

        # Show connection info
        print_info "Connection Details:"
        echo "  Host: localhost"
        echo "  Port: 5432"
        echo "  Database: furo_db"
        echo "  User: furo_user"
        echo "  Password: furo_password"
        echo ""

        # Show pgAdmin info
        print_info "pgAdmin Dashboard:"
        echo "  URL: http://localhost:5050"
        echo "  Email: admin@furo.io"
        echo "  Password: admin123"
        echo ""

        # Test database connection
        if npx prisma db pull --force 2>/dev/null; then
            print_status "✅ Database connection successful"
        else
            print_warning "⚠️  Database connection failed - run migrations first"
        fi
    else
        print_error "❌ Database is not running"
    fi
}

# Connect to database
connect_db() {
    print_status "Connecting to database..."
    docker-compose exec postgres psql -U furo_user -d furo_db
}

# Show logs
logs_db() {
    print_status "Showing database logs..."
    docker-compose logs -f postgres
}

# Show help
show_help() {
    echo "Furo Database Management Script"
    echo ""
    echo "Usage: $0 {start|stop|reset|migrate|status|connect|logs|help}"
    echo ""
    echo "Commands:"
    echo "  start    - Start the PostgreSQL database"
    echo "  stop     - Stop the PostgreSQL database"
    echo "  reset    - Reset the database (deletes all data)"
    echo "  migrate  - Run database migrations"
    echo "  status   - Show database status"
    echo "  connect  - Connect to database with psql"
    echo "  logs     - Show database logs"
    echo "  help     - Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 start    # Start the database"
    echo "  $0 migrate  # Run migrations after starting"
    echo "  $0 status   # Check database status"
}

# Main script logic
case "${1:-help}" in
    start)
        start_db
        ;;
    stop)
        stop_db
        ;;
    reset)
        reset_db
        ;;
    migrate)
        migrate_db
        ;;
    status)
        status_db
        ;;
    connect)
        connect_db
        ;;
    logs)
        logs_db
        ;;
    help|--help|-h)
        show_help
        ;;
    *)
        print_error "Unknown command: $1"
        show_help
        exit 1
        ;;
esac