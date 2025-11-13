# Furo - Crypto-Native API Gateway

Furo is a **crypto-native API gateway and payment relay** that enables developers to make **paid API requests** to registered providers through a single unified endpoint. The platform implements the **x402 protocol** - a crypto micropayment standard where API calls require verified on-chain payments.

## 🚀 Features

- **Zero setup for providers** - No code, SDKs, or proxy configuration required
- **x402 Protocol** - Industry-standard crypto micropayment for API access
- **Automatic, instant payouts** - Direct on-chain payment to providers
- **Simple for developers** - Standard HTTP calls with x402 payment flow
- **Endpoint protection** - APIs remain private and secure behind Furo
- **Transparent and fair** - One token equals one call, with on-chain proof of payment

## 🛠 Tech Stack

- **Next.js 16.0.1** - React framework with App Router and API Routes
- **React 19.2.0** - Frontend library
- **TypeScript** - Type safety throughout
- **Prisma ORM** - Database client and migrations
- **PostgreSQL** - Primary database (Docker)
- **Tailwind CSS 4.0** - Utility-first CSS framework
- **Shadcn/ui** - Component library
- **Web3 Integration** - RainbowKit, Wagmi, Viem

## 📋 Prerequisites

- Node.js 18-24 (Required for Prisma 6.x compatibility)
- pnpm package manager
- Docker and Docker Compose
- Web3 wallet (MetaMask, RainbowKit-supported wallets) for testing

## 🚀 Quick Start

### 1. Clone and Install

```bash
git clone <repository-url>
cd furo
pnpm install
```

### 2. Environment Setup

Create a `.env.local` file with:

```env
# Required for RainbowKit Web3 integration
NEXT_PUBLIC_PROJECT_ID=your_project_id_here

# Database URL (Docker Compose setup)
DATABASE_URL="postgresql://postgres:password@localhost:5432/furo"
```

### 3. Database Setup

Start PostgreSQL with Docker Compose:

```bash
docker-compose up -d
```

Run database migrations:

```bash
pnpm prisma generate
pnpm prisma db push
```

### 4. Start Development Server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## 🧪 Testing

Run the complete test suite to verify the x402 implementation:

```bash
# Database connectivity test
pnpm tsx test/test-prisma.ts

# Integration tests
pnpm tsx test/integration-test-db-fixed.ts

# Complete x402 flow test
pnpm tsx test/test-complete-x402-flow.ts
```

## 📖 Documentation

- **[CLAUDE.md](./CLAUDE.md)** - Comprehensive development guide and API documentation
- **[Architecture](./CLAUDE.md#architecture)** - Project structure and implementation details
- **[API Documentation](./CLAUDE.md#api-documentation)** - Complete API reference
- **[x402 Protocol](./CLAUDE.md#x402-protocol-flow)** - Payment flow implementation

## 🔧 Development Commands

```bash
# Development server
pnpm dev

# Production build
pnpm build

# Start production server
pnpm start

# Linting
pnpm lint

# Database operations
pnpm prisma studio    # Open database browser
pnpm prisma generate  # Generate Prisma client
pnpm prisma db push   # Push schema to database
```

## 🏗 Project Structure

```
app/                     # Next.js App Router
├── api/                 # API Routes (Backend)
│   ├── providers/       # Provider management endpoints
│   ├── apis/           # API management endpoints
│   ├── payments/       # Payment processing endpoints
│   └── tokens/         # Token validation and consumption
├── dashboard/          # Provider dashboard
├── list-api/           # API listing form
└── page.tsx            # Homepage marketplace

components/
├── ui/                 # Shadcn/ui components
├── api-card.tsx        # API marketplace cards
└── header.tsx          # Main navigation

prisma/
├── schema.prisma       # Database schema with 9 models
└── migrations/         # Database migrations

test/                   # Integration and flow tests
proxy.ts                # Next.js 16 proxy (x402 payment protection)
```

## ✨ How It Works

### x402 Payment Flow

1. **Provider Registration** - Providers register API endpoints and wallet addresses
2. **Developer API Call** - Initial calls receive `402 Payment Required` responses
3. **On-Chain Payment** - Developers send crypto directly to provider wallets
4. **Token Issuance** - Payment verification creates single-use tokens (1 token = 1 call)
5. **API Access** - Developers include tokens in API calls for access
6. **Secure Relay** - Furo forwards requests to actual provider endpoints
7. **Response Delivery** - Provider responses return through Furo with usage tracking

### Key Security Features

- **Single-Use Tokens** - Each token can only be used once
- **Developer Address Verification** - Tokens bound to specific developer addresses
- **Token Expiration** - Tokens expire after 24 hours
- **Atomic Operations** - Token consumption prevents race conditions
- **Usage Logging** - All API calls tracked for analytics and auditing

## 🎯 Current Status

### ✅ Completed

- Complete x402 payment protocol implementation
- Full Next.js API routes with Prisma ORM and PostgreSQL
- Comprehensive database schema with 9 models
- Token management system (issuance, validation, consumption)
- API relay service with usage analytics
- Security system with replay protection
- Complete test suite for end-to-end flows
- Next.js 16 proxy implementation (deprecated middleware removed)

### 🔄 In Progress

- Frontend UI polish and UX improvements
- On-chain payment verification (currently simulated for testing)

### ⏳ TODO

- Real blockchain integration
- Reputation and review system
- Rate limiting and advanced security measures
- Production deployment configuration

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:

- Check the [development guide](./CLAUDE.md) for comprehensive documentation
- Open an issue on GitHub for bugs and feature requests
- Review the [API documentation](./CLAUDE.md#api-documentation) for integration details

---

Built with ❤️ using Next.js 16, TypeScript, and the x402 protocol.