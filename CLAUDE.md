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

1. **Marketplace Core (Custom Backend API)** – Custom-built backend using Node.js, Express.js, and Prisma to manage PostgreSQL database
2. **Custom x402 Payment Gateway** – From-scratch implementation of the x402 protocol with 402 responses and payment verification
3. **API Relay Service** – Secure proxy that forwards requests to provider endpoints after payment verification
4. **Frontend (Marketplace UI)** – API discovery, payments, onboarding, and dashboards
5. **Billing and Settlement Engine** – Records payments and manages payout flows
6. **Reputation, Dispute, and Governance** – Ratings, reviews, and dispute management
7. **Search, Indexing, and Analytics** – Fast API discovery and usage analytics
8. **Storage and Docs** – API documentation, schemas, and metadata storage
9. **Security and Rate Limiting** – API protection and replay prevention
10. **RAG AI pipeline** – Semantic search using AI for API discovery

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

- **Next.js 16.0.1** - React framework with App Router
- **React 19.2.0** - Frontend library
- **TypeScript** - Type safety throughout
- **Tailwind CSS 4.0** - Utility-first CSS framework
- **Shadcn/ui** - Component library (New York style)
- **Web3 Integration** - RainbowKit, Wagmi, Viem, Thirdweb
- **State Management** - TanStack Query (React Query)
- **Package Manager** - pnpm

## Architecture

### Core Structure
```
app/                     # Next.js App Router
├── api/[id]/           # Dynamic API detail pages
├── dashboard/          # Provider dashboard
├── list-api/           # API listing form
├── layout.tsx          # Root layout with Web3 providers
└── page.tsx            # Homepage marketplace

components/
├── ui/                 # Shadcn/ui components
├── api-card.tsx        # API marketplace cards
└── header.tsx          # Main navigation

lib/
├── mock-data.ts        # Mock API data (currently used)
├── providers.tsx       # Web3 providers configuration
└── utils.ts            # Shared utilities
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

### Phase 2: Custom Backend and Database (Module 1) ⏳ TODO

- [ ] **Database Schema:** Design and implement tables in Supabase using Prisma Schema (`providers`, `apis`, `verified_payments`)
- [ ] **Project Setup:** Set up Node.js/Express.js project for backend API
- [ ] **Backend API Core:** Develop core API endpoints (REST/GraphQL) for CRUD operations on APIs
- [ ] **Authentication:** Implement endpoint protection and user management logic
- [ ] **Connect Frontend to Backend:** Wire up frontend forms and data displays to custom backend

### Phase 3: From-Scratch x402 Payments and API Relay (Module 2 & 3) ⏳ TODO

- [ ] **Server: x402 Middleware:** Create Express middleware that returns `402 Payment Required` with payment metadata
- [ ] **API Relay Service:** Build secure proxy that forwards requests to provider endpoints after payment verification
- [ ] **Payment Verification Service:** Verify transaction hashes on-chain using `ethers.js`/`viem`
- [ ] **Token Management System:** Issue and track single-use tokens to prevent replay attacks
- [ ] **Client: HTTP Interceptor:** Create wrapper for `fetch`/`axios` that handles 402 responses and payment flows
- [ ] **Client: Payment UI:** On 402, trigger payment interface for transaction approval
- [ ] **Client: Transaction Handling:** Use `ethers.js`/`viem` to send transactions and retry with `X-Payment` header
- [ ] **Server: Payment Processing:** Decode `X-PAYMENT` header, verify on-chain, issue tokens, and relay requests
- [ ] **Endpoint Security:** Protect provider endpoints and ensure all access goes through Furo
- [ ] **Developer Testing:** Create mock APIs and test end-to-end x402 flow with relay
- [ ] **Testnet Integration:** Configure system to use blockchain testnet (e.g., Sepolia) for operations

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
- Next.js App Router structure with TypeScript
- Tailwind CSS + Shadcn/ui components with dark mode
- Web3 wallet integration (RainbowKit)
- API marketplace UI with search and filtering
- Responsive design
- Mock data system in `lib/mock-data.ts`
- Core UI components and layout
- Basic dashboard functionality
- API listing form (UI only)
- Favorites functionality (wallet-gated, client-side only)

### In Progress 🔄
- Frontend polish and UX improvements
- Integration testing with mock data

### TODO/Placeholder ⏳
- x402 payment protocol implementation with 402 responses
- API relay service for secure provider endpoint access
- Custom backend API with Node.js/Express
- Database connectivity (PostgreSQL + Prisma)
- User authentication system
- Real blockchain payment processing and verification
- Token management system for single-use access
- Reputation and review system

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