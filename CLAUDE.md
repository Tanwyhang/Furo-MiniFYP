# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Furo is a Data and API Marketplace DApp that allows developers and data providers to monetize their APIs and data streams using crypto micropayments (x402). The platform enables providers to publish endpoints and set pricing, enforce pay-per-call access through x402 paywalls, verify on-chain payments, and manage settlements and payouts. It also provides a marketplace for discovery, ratings, and analytics. The MVP will be a centrally hosted app (Next.js and Node) with blockchain-native payments.

### A Note on Showcasing Skills
To better demonstrate core software engineering skills and reduce reliance on external SDKs, this project focuses on building key components from scratch, including a custom backend API and implementing the core x402 payment protocol manually.

---

## Modules Overview

1. **Marketplace Core (Custom Backend API)** – Custom-built backend using Node.js, Express.js, and Prisma to manage PostgreSQL database
2. **Custom x402 Payment Gateway** – From-scratch implementation of the L402 protocol
3. **Provider Sandbox and SDK** – Plug-and-play middleware and SDK tools for providers
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

- Node.js 18+
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

### Phase 3: From-Scratch x402 Payments (Module 2) ⏳ TODO

- [ ] **Server: Paywall Middleware:** Create Express middleware to protect routes with `402 Payment Required` challenges
- [ ] **Client: HTTP Interceptor:** Create wrapper for `fetch`/`axios` that intercepts `402` responses
- [ ] **Client: Payment UI:** On `402`, trigger UI modal for user transaction approval
- [ ] **Client: Transaction Handling:** Use `ethers.js`/`viem` to send transactions on user approval
- [ ] **Client: Retry with Proof:** Construct Payment Payload with `txHash`, Base64-encode, re-send with `X-PAYMENT` header
- [ ] **Server: Payment Verification:** Decode `X-PAYMENT` header, verify `txHash` on-chain using `ethers.js`/`viem`
- [ ] **Server: Verify & Prevent Replay:** Confirm transaction details and check against `verified_payments` table
- [ ] **Developer Testing:** Create mock API requests and testing environment for x402 flow
- [ ] **Testnet Integration:** Configure system to use blockchain testnet (e.g., Sepolia) for payment operations

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
- x402 payment protocol implementation
- Custom backend API with Node.js/Express
- Database connectivity (PostgreSQL + Prisma)
- User authentication system
- Real blockchain payment processing
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