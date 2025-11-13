# Local PostgreSQL Database Setup

This guide helps you set up a local PostgreSQL database for Furo development.

## Option 1: Docker Setup (Recommended)

### Prerequisites
- Docker Desktop installed and running

### Quick Start
```bash
# 1. Start Docker Desktop (if not already running)

# 2. Deploy the database
./scripts/deploy-db.sh start

# 3. Run database migrations
./scripts/deploy-db.sh migrate

# 4. Check status
./scripts/deploy-db.sh status
```

### Database Management
```bash
# Stop database
./scripts/deploy-db.sh stop

# Reset database (deletes all data)
./scripts/deploy-db.sh reset

# Connect to database
./scripts/deploy-db.sh connect

# View logs
./scripts/deploy-db.sh logs

# Run migrations
./scripts/deploy-db.sh migrate
```

### Access Details
- **PostgreSQL**: `localhost:5432`
- **Database**: `furo_db`
- **User**: `furo_user`
- **Password**: `furo_password`
- **pgAdmin**: http://localhost:5050 (admin@furo.io / admin123)

## Option 2: Local PostgreSQL Installation

### Install PostgreSQL
```bash
# macOS
brew install postgresql
brew services start postgresql

# Ubuntu/Debian
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql

# Windows
# Download from: https://www.postgresql.org/download/windows/
```

### Create Database
```bash
# Create user and database
sudo -u postgres psql << EOF
CREATE USER furo_user WITH PASSWORD 'furo_password';
CREATE DATABASE furo_db OWNER furo_user;
GRANT ALL PRIVILEGES ON DATABASE furo_db TO furo_user;
\q
EOF
```

### Update .env.local
```env
DATABASE_URL="postgresql://furo_user:furo_password@localhost:5432/furo_db"
```

### Run Migrations
```bash
npx prisma db push
```

## Option 3: Cloud Database (Neon, Supabase, etc.)

### Neon Setup
1. Go to [neon.tech](https://neon.tech)
2. Create new project
3. Copy connection string
4. Update `.env.local`:
   ```env
   DATABASE_URL="postgresql://user:password@ep-xxx.us-east-2.aws.neon.tech/dbname?sslmode=require"
   ```

### Supabase Setup
1. Go to [supabase.com](https://supabase.com)
2. Create new project
3. Go to Settings → Database
4. Copy connection string
5. Update `.env.local`

## Environment Configuration

The project uses `.env.local` for database configuration:

```env
# Local PostgreSQL via Docker
DATABASE_URL="postgresql://furo_user:furo_password@localhost:5432/furo_db"

# Alternative: Remote database
# DATABASE_URL="your_remote_connection_string"
```

## Testing the Database

### 1. Test Connection
```bash
# Test if database is accessible
./scripts/deploy-db.sh status

# Or manually test
npx prisma db pull
```

### 2. Run Integration Tests
```bash
# Run the full integration test
npx tsx test/integration-test-db.ts

# Run schema validation (no database required)
npx tsx test/schema-validation-test.ts
```

### 3. Database Operations
```bash
# Generate Prisma client
npx prisma generate

# Push schema changes
npx prisma db push

# View database in Prisma Studio
npx prisma studio
```

## Troubleshooting

### Docker Issues
```bash
# Check Docker status
docker info

# Restart Docker Desktop

# Clean up containers
docker-compose down -v
docker-compose up -d
```

### Connection Issues
```bash
# Check if PostgreSQL is running
pg_isready -h localhost -p 5432

# Test connection manually
psql -h localhost -p 5432 -U furo_user -d furo_db
```

### Migration Issues
```bash
# Reset and re-migrate
npx prisma db push --force-reset

# Or use Docker reset
./scripts/deploy-db.sh reset
```

### Port Conflicts
If port 5432 is already in use:
```bash
# Edit docker-compose.yml to use different port
ports:
  - "5433:5432"  # Use 5433 instead

# Update .env.local
DATABASE_URL="postgresql://furo_user:furo_password@localhost:5433/furo_db"
```

## Database Schema

The database includes 8 main tables:
- `providers` - API owners and their information
- `apis` - Individual API endpoints and pricing
- `payments` - Crypto transactions and token purchases
- `tokens` - Single-use tokens for API access
- `usage_logs` - API call tracking and performance
- `favorites` - User favorites (by wallet address)
- `reviews` - API ratings and reviews
- `api_keys` - Provider authentication keys
- `configurations` - System-wide settings

## Next Steps

1. **Deploy database** using one of the options above
2. **Run migrations** to create tables
3. **Test connection** with integration tests
4. **Start development** with the local database

## Production Considerations

- Use environment-specific database URLs
- Set up proper database backups
- Configure connection pooling
- Monitor database performance
- Use SSL in production
- Set up read replicas for scaling