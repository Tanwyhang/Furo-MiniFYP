# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Furo is a **crypto-native API gateway and payment relay** that enables developers to make **paid API requests** to registered providers through a single unified endpoint. Providers do not need to host any proxy, integrate SDKs, or modify their infrastructure. They simply register their **API endpoint** and **wallet address**, while the platform manages all payment verification, access control, and API delivery on their behalf.

The platform implements the **x402 protocol** - a crypto micropayment standard where API calls require verified on-chain payments. When developers call Furo's APIs, they receive **402 Payment Required** responses with payment details. Upon payment confirmation, Furo securely relays the request to the actual provider API and returns the response.

Developers interact exclusively with the platform rather than directly accessing provider APIs. Each API call requires a **verified crypto payment**, ensuring providers receive **on-chain funds directly** without intermediaries. The system operates through **peer-to-peer (P2P) transactions**, where developers pay providers directly, and the platform only verifies the transaction before granting temporary access. This enables **instant decentralized payouts** while maintaining a seamless developer experience.

### Core Architecture

The system involves three main participants:

* **Developer (API Consumer)**
* **Furo Gateway (the platform)**
* **Provider (API Owner)**

#### x402 Payment and Relay Flow

**One token equals one valid API call.** Developers can purchase multiple tokens for the same API, but each token remains single-use (one token = one call).

1. **Provider Registration**: Providers connect their crypto wallet and submit their API endpoint together with a price per API call. The wallet address serves as their **unique identifier**, **payout address**, and **verification key**.

2. **Developer API Call**: Developers call Furo's unified API endpoints (e.g., `api.furo.io/weather`). The initial call receives a **402 Payment Required** response with:
   - Provider's wallet address
   - Required payment amount
   - Payment instructions

3. **On-Chain Payment**: Developers send crypto payment directly to the provider's wallet. They can pay for multiple calls in advance (e.g., 5× the price for 5 tokens).

4. **Payment Confirmation**: Developers retry the API call with the transaction hash in the `X-Payment` header. Furo verifies the on-chain payment and issues **single-use tokens**.

5. **Secure Relay**: Upon successful verification, Furo securely forwards the request to the provider's actual API endpoint, maintaining the original request parameters and headers.

6. **Response Delivery**: The provider's response returns through Furo to the developer. The used token is marked as **consumed** and cannot be reused.

#### x402 Protocol Implementation

Furo implements the x402 protocol as follows:

* **402 Response**: Initial API calls return HTTP 402 with payment metadata
* **Payment Verification**: Transaction hashes are verified on-chain before token issuance
* **Token Management**: Single-use tokens prevent replay attacks and ensure one-call-per-token
* **Secure Proxy**: Provider endpoints remain hidden; all traffic flows through Furo

### Key Features

* **Zero setup for providers:** No code, SDKs, or proxy configuration required
* **x402 Protocol:** Industry-standard crypto micropayment for API access
* **Automatic, instant payouts:** Direct on-chain payment to providers
* **Simple for developers:** Standard HTTP calls with x402 payment flow
* **Endpoint protection:** APIs remain private and secure behind Furo
* **Transparent and fair:** One token equals one call, with on-chain proof of payment

### A Note on Showcasing Skills
To better demonstrate core software engineering skills and reduce reliance on external SDKs, this project focuses on building key components from scratch, including a custom backend API and implementing the core x402 payment protocol manually.

---

## Modules Overview

1. **Backend API (Next.js API Routes)** – Custom-built backend using Next.js 16 API routes with Prisma ORM and PostgreSQL
2. **Manual x402 Payment Gateway** – Complete from-scratch implementation of the x402 protocol with 402 responses and payment verification
3. **Token Management System** – Single-use token issuance, validation, and consumption with atomic operations
4. **API Relay Service** – Secure proxy that forwards requests to provider endpoints after payment verification
5. **Frontend (Marketplace UI)** – API discovery, payments, onboarding, and dashboards
6. **Database Schema** – Comprehensive Prisma schema with 9 models (Provider, Api, Payment, Token, UsageLog, Favorite, Review, ApiKey, Configuration)
7. **Usage Analytics** – Real-time API usage tracking, response time monitoring, and revenue analytics
8. **Security and Rate Limiting** – API protection, replay prevention, and developer address verification
9. **Next.js 16 Proxy System** – Modern proxy implementation replacing deprecated middleware pattern

---

## Development Commands

```bash
# Development server
pnpm dev

# Production build
pnpm build

# Start production server
pnpm start

# Linting
pnpm lint
```

## Tech Stack

- **Next.js 16.0.1** - React framework with App Router and API Routes
- **React 19.2.0** - Frontend library
- **TypeScript** - Type safety throughout
- **Tailwind CSS 4.0** - Utility-first CSS framework
- **Shadcn/ui** - Component library (New York style)
- **Prisma ORM** - Database client and migrations
- **PostgreSQL** - Primary database (Docker)
- **Web3 Integration** - RainbowKit, Wagmi, Viem, Thirdweb
- **State Management** - TanStack Query (React Query)
- **Package Manager** - pnpm
- **x402 Protocol** - Manual implementation (no external SDKs)

## Architecture

### Core Structure
```
app/                     # Next.js App Router
├── api/                 # API Routes (Backend)
│   ├── providers/       # Provider management endpoints
│   ├── apis/           # API management endpoints
│   ├── payments/       # Payment processing endpoints
│   ├── tokens/         # Token validation and consumption
│   └── [id]/           # Dynamic API detail pages
├── dashboard/          # Provider dashboard
├── list-api/           # API listing form
├── layout.tsx          # Root layout with Web3 providers
└── page.tsx            # Homepage marketplace

components/
├── ui/                 # Shadcn/ui components
├── api-card.tsx        # API marketplace cards
└── header.tsx          # Main navigation

lib/
├── mock-data.ts        # Mock API data (legacy)
├── providers.tsx       # Web3 providers configuration
└── utils.ts            # Shared utilities

prisma/
├── schema.prisma       # Database schema with 9 models
└── migrations/         # Database migrations

test/                   # Integration and flow tests
├── test-prisma.ts      # Database connectivity tests
├── integration-test-db-fixed.ts  # API integration tests
└── test-complete-x402-flow.ts  # End-to-end x402 flow tests

proxy.ts                # Next.js 16 proxy (x402 payment protection)
```

### Key Features
- **Homepage (`/`)** - API marketplace with search, filtering, and API cards
- **API Detail Pages (`/api/[id]`)** - Individual API showcase with documentation and "Pay & Call" functionality
- **Provider Dashboard (`/dashboard`)** - Analytics, earnings, and API management
- **API Listing Form (`/list-api`)** - Provider onboarding with pricing configuration

### Web3 Configuration
- Uses RainbowKit for wallet connectivity
- Supports multiple chains: Mainnet, Polygon, Optimism, Arbitrum, Base, Sepolia
- Project ID configuration required: `NEXT_PUBLIC_PROJECT_ID`
- Most Web3 components loaded with `ssr: false`

## Mock Data

Currently uses mock APIs including:
- Weather Data API
- Crypto Price Feed
- AI Text Generator
- Image Recognition API

Located in `lib/mock-data.ts`.

## Configuration Notes

- **Tailwind CSS v4.0** with custom color palette and CSS variables
- **TypeScript strict mode** enabled
- **Path aliases:** `@/*` maps to root directory
- **Dark mode:** Uses class strategy (`dark:` prefixes)
- **Responsive:** Mobile-first approach

## Development Requirements

- Node.js 18-24 **Required for Prisma 6.x compatibility**
- pnpm package manager
- Environment variable: `NEXT_PUBLIC_PROJECT_ID` for RainbowKit
- Web3 wallet (MetaMask, RainbowKit-supported wallets) for testing

---

## Development Roadmap & Checklist

### Phase 1: Frontend Foundation (Module 4) ✅ COMPLETED

- [x] **Project Setup:** Initialize Next.js project with TypeScript, Tailwind CSS, and ESLint
- [x] **Shadcn/ui Components Implemented:**
    - **UI Components:** `button`, `separator`, `sheet`, `tooltip`, `input`, `skeleton`, `breadcrumb`, `label`, `card`, `select`, `tabs`, `table`, `toggle`, `badge`, `checkbox`, `dropdown-menu`, `drawer`, `avatar`, `sonner`, `toggle-group`
    - **Application Components:** `app-sidebar`, `chart-area-interactive`, `data-table`, `nav-documents`, `nav-main`, `nav-secondary`, `nav-user`, `section-cards`, `site-header`
    - **Pages/Data:** `app/dashboard/page.tsx`, `app/dashboard/data.json`
    - **Hooks:** `hooks/use-mobile.ts`
- [x] **Core Components:** Build reusable UI components (Header, Footer, Buttons, Cards)
- [x] **Main Layout:** Implement the main application shell with navigation
- [x] **Homepage:** Create the API marketplace discovery page with search bar and grid/list of available APIs
- [x] **API Details Page:** Develop the page that displays detailed information for a single API
- [x] **Wallet Integration:** Integrate RainbowKit and Wagmi for user authentication
- [x] **Provider Dashboard:** Create a basic dashboard for authenticated users to view their listed APIs
- [x] **"List an API" Form:** Build the initial form for providers to submit new APIs (UI only)

### Phase 2: Custom Backend and Database (Module 1) ✅ COMPLETED

- [x] **Database Schema:** Complete Prisma schema with 9 models (Provider, Api, Payment, Token, UsageLog, Favorite, Review, ApiKey, Configuration)
- [x] **Database Setup:** PostgreSQL with Docker Compose and automated migrations
- [x] **Backend API Core:** Complete Next.js API routes for providers, APIs, payments, and tokens
- [x] **Authentication:** Developer address verification and token-based access control
- [x] **Connect Frontend to Backend:** All frontend components connected to real API endpoints

### Phase 3: From-Scratch x402 Payments and API Relay (Module 2 & 3) ✅ COMPLETED

- [x] **Server: x402 Proxy:** Next.js 16 proxy with `402 Payment Required` responses and payment metadata
- [x] **API Relay Service:** Secure proxy that forwards requests to provider endpoints after payment verification
- [x] **Payment Processing:** Payment processing endpoint with token issuance (1 token = 1 API call)
- [x] **Token Management System:** Single-use token issuance, validation, and consumption with atomic operations
- [x] **Token Validation:** Comprehensive token validation endpoint with security checks
- [x] **Token Consumption:** Atomic token consumption with usage logging and replay protection
- [x] **Usage Analytics:** Real-time API usage tracking, response time monitoring, and revenue analytics
- [x] **Endpoint Security:** All API endpoints protected, traffic flows through Furo proxy
- [x] **End-to-End Testing:** Complete test suite for x402 flow with real API endpoints
- [x] **Next.js 16 Compatibility:** Migrated from deprecated middleware to modern proxy pattern

### Phase 4: Core Features and Deployment ⏳ TODO

- [ ] **Reputation System:** Implement user rating and review system for APIs
- [ ] **Security:** Implement rate limiting and security measures on backend API
- [ ] **UI Polish:** Refine user interface and improve user experience
- [ ] **Deployment:** Deploy Next.js frontend (Vercel) and backend API (Fly.io, Railway)
- [ ] **Testing:** Conduct end-to-end testing in production-like environment
- [ ] **Monitoring:** Set up basic logging and monitoring for the application

---

## Current Implementation Status

### Completed ✅
- **Complete x402 Payment Protocol**: Manual implementation from scratch with 402 responses
- **Backend API**: Full Next.js API routes with Prisma ORM and PostgreSQL
- **Database Schema**: Comprehensive 9-model schema with relationships and constraints
- **Token Management**: Single-use token issuance, validation, and consumption
- **API Relay Service**: Secure proxy that forwards requests to provider endpoints
- **Payment Processing**: Complete payment verification and token issuance system
- **Usage Analytics**: Real-time API usage tracking and revenue monitoring
- **Security System**: Developer address verification and replay protection
- **Testing Suite**: Complete end-to-end tests for x402 flow
- **Next.js 16 Proxy**: Modern proxy implementation (deprecated middleware removed)
- **Frontend Integration**: All components connected to real backend APIs
- **Database Setup**: Docker Compose with automated migrations
- **TypeScript**: Full type safety throughout the application

### In Progress 🔄
- Frontend UI polish and UX improvements
- On-chain payment verification (currently simulated for testing)

### TODO/Placeholder ⏳
- Real blockchain integration (currently using simulated payments)
- Reputation and review system
- Rate limiting and advanced security measures
- Production deployment configuration

---

## Favorites System Implementation

### Current State (Client-Side Only)
- Favorites are stored in React component state using `useState<Set<string>>()`
- Wallet connection is required but not used for persistence
- Favorites reset on page refresh/component unmount
- No backend integration or database storage

### Required Implementation for Wallet-Based Favorites

1. **Database Storage**: Save favorites to a backend linked to the wallet address
   - Create `favorites` table with columns: `wallet_address`, `api_id`, `created_at`
   - Implement proper indexing for fast lookups

2. **API Integration**:
   - `GET /api/favorites/{address}` - fetch user's favorites
   - `POST /api/favorites` - save favorite with address
   - `DELETE /api/favorites/{address}/{api_id}` - remove favorite

3. **State Persistence**: Load favorites on component mount based on connected wallet
   - Use `useEffect` with wallet address dependency to fetch user favorites
   - Sync local state with backend data

4. **Real-time Updates**: Sync across devices using the wallet address as identifier
   - Implement optimistic updates for better UX
   - Handle race conditions and concurrent modifications

### Files to Update
- `components/marketplace-content.tsx` - Add backend integration
- `lib/api/favorites.ts` - Create API client functions
- `app/api/favorites/` - Create Next.js API routes
- Database schema - Add favorites table
- move all test in to /test directory
- move/create all markdown file into /markdown directory
- all markdown file except read me and claude.md should be in /markdown
- minimise the use of hardcoding, use placeholder instead
- remember we using nextjs api route , This approach keeps everything in one codebase and
  leverages Next.js's strengths.

---

## API Documentation

### Provider Management

#### `GET /api/providers`
List all providers with pagination and search.

**Query Parameters:**
- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 10)
- `search` (string): Search term for provider names
- `isActive` (boolean): Filter by active status

**Response:**
```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 50,
    "totalPages": 5
  }
}
```

#### `POST /api/providers`
Create a new provider.

**Request Body:**
```json
{
  "name": "Provider Name",
  "description": "Provider description",
  "walletAddress": "0x...",
  "website": "https://example.com",
  "supportEmail": "support@example.com"
}
```

### API Management

#### `GET /api/apis`
List all APIs with filtering and pagination.

#### `POST /api/apis`
Create a new API endpoint.

**Request Body:**
```json
{
  "providerId": "provider_123",
  "name": "API Name",
  "description": "API description",
  "endpoint": "https://api.example.com/endpoint",
  "publicPath": "/public-path",
  "method": "GET",
  "categoryId": "category_123",
  "pricePerCall": "100000000000000",
  "currency": "ETH"
}
```

#### `POST /api/apis/[id]/call`
Make an API call using x402 protocol.

**Headers:**
- `X-Developer-Address`: Developer's wallet address

**Request Body:**
```json
{
  "tokenHash": "tkn_...",
  "method": "GET",
  "params": {...},
  "headers": {...}
}
```

**Response:**
```json
{
  "success": true,
  "data": {...},
  "meta": {
    "apiId": "api_123",
    "apiName": "API Name",
    "provider": "Provider Name",
    "responseTime": 150,
    "tokenConsumed": true
  }
}
```

### Payment Processing

#### `POST /api/payments/process`
Process a payment and issue tokens.

**Request Body:**
```json
{
  "transactionHash": "0x...",
  "apiId": "api_123",
  "developerAddress": "0x...",
  "paymentAmount": "200000000000000",
  "currency": "ETH",
  "network": "base-sepolia"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "payment": {...},
    "tokens": [
      {
        "id": "token_123",
        "tokenHash": "tkn_...",
        "expiresAt": "2025-11-14T18:32:22.990Z"
      }
    ]
  }
}
```

### Token Management

#### `POST /api/tokens/validate`
Validate a token without consuming it.

**Request Body:**
```json
{
  "tokenHash": "tkn_...",
  "apiId": "api_123",
  "developerAddress": "0x..."
}
```

#### `POST /api/tokens/consume`
Consume a token (mark as used).

#### `GET /api/tokens`
List tokens for debugging purposes.

---

## Testing

### Running Tests

```bash
# Database connectivity test
pnpm tsx test/test-prisma.ts

# Integration tests
pnpm tsx test/integration-test-db-fixed.ts

# Complete x402 flow test
pnpm tsx test/test-complete-x402-flow.ts
```

### Test Coverage

- ✅ Database connectivity and schema validation
- ✅ Provider and API CRUD operations
- ✅ Payment processing and token issuance
- ✅ Token validation and consumption
- ✅ Complete end-to-end x402 flow
- ✅ Token reuse protection
- ✅ API relay with real endpoints
- ✅ Error handling and edge cases

---

## Development Notes

### x402 Protocol Flow

1. **Initial Call**: API calls return 402 Payment Required with payment metadata
2. **Payment**: Developer sends crypto payment to provider's wallet
3. **Token Issuance**: Payment processing creates single-use tokens (1 token = 1 API call)
4. **API Access**: Developer includes token hash in subsequent API calls
5. **Token Validation**: System validates token and developer address
6. **API Relay**: Request forwarded to provider endpoint with usage tracking
7. **Token Consumption**: Token marked as used to prevent replay attacks

### Security Features

- **Single-Use Tokens**: Each token can only be used once
- **Developer Address Verification**: Tokens are bound to specific developer addresses
- **Token Expiration**: Tokens expire after 24 hours
- **Atomic Operations**: Token consumption prevents race conditions
- **Usage Logging**: All API calls are tracked for analytics and auditing

### Database Schema Highlights

- **Provider**: API provider information and wallet addresses
- **Api**: API endpoints, pricing, and configuration
- **Payment**: Transaction records and verification status
- **Token**: Single-use access tokens with expiration
- **UsageLog**: Detailed API call logs and analytics
- **Favorite**: User favorites linked to wallet addresses