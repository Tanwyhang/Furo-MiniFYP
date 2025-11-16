# Platform Fees Distribution Explained

## Overview

FURO implements a **3% platform fee** on all API payments. However, how this fee is collected and distributed depends on the payment model being used.

## Fee Calculation

### Current Implementation
```typescript
const platformFeePercentage = 3; // 3%
const totalPayment = BigInt(paymentAmount);
const platformFeeAmount = (totalPayment * BigInt(platformFeePercentage)) / BigInt(100);
const providerAmount = totalPayment - platformFeeAmount;
```

**Example:**
- Total Payment: 0.1 ETH (100,000,000,000,000,000 wei)
- Platform Fee (3%): 0.003 ETH (3,000,000,000,000,000 wei)
- Provider Amount: 0.097 ETH (97,000,000,000,000,000 wei)

## Payment Model Differences

### 1. Direct to Provider Model (Single Relay)

**Flow:**
```
Developer (0.1 ETH) → Provider Wallet (0.1 ETH)
                       ↓
                Platform Fee (0.003 ETH) - Not Collected!
```

**What Actually Happens:**
1. Developer pays full amount (0.1 ETH) directly to provider
2. System calculates 3% platform fee (0.003 ETH)
3. Provider receives full amount (0.1 ETH)
4. **Platform fee is calculated but NOT automatically collected**
5. FURO needs separate process to collect platform fees

**Current Status:** ⚠️ **Manual Collection Required**
- Platform fees are calculated and logged
- No automatic mechanism to collect them
- Requires manual intervention or separate system

### 2. FURO Aggregator Model (Double Relay)

**Flow:**
```
Developer (0.1 ETH) → FURO Wallet (0.1 ETH)
                       ↓
    Provider (0.097 ETH) ← FURO Distribution
    FURO Keeps (0.003 ETH) ← Platform Fee (Collected!)
```

**What Actually Happens:**
1. Developer pays full amount (0.1 ETH) to FURO wallet
2. System calculates 3% platform fee (0.003 ETH)
3. FURO automatically keeps platform fee
4. FURO distributes provider share (0.097 ETH) to provider
5. **Platform fee is automatically collected**

**Current Status:** ✅ **Automatic Collection**
- Platform fees are retained by FURO automatically
- No separate collection process needed

## Current Implementation Analysis

### What's Working ✅
1. **Fee Calculation**: Correctly calculates 3% platform fees
2. **Provider Revenue**: Only provider's share is counted in their earnings
3. **Fee Logging**: Platform fees are logged in console
4. **Distribution**: Has infrastructure for provider distribution

### What's Missing ❌
1. **Platform Fee Collection**: No automatic collection in Direct model
2. **Fee Storage**: No database table to track platform revenue
3. **Fee Analytics**: No reporting on platform fee earnings
4. **Fee Withdrawal**: No mechanism to withdraw collected fees

## Code Evidence

### Platform Fees are Calculated:
```typescript
// Calculate platform fees (3% commission)
const platformFeeAmount = (paymentAmountBigInt * BigInt(platformFeePercentage)) / BigInt(100);
const providerAmount = paymentAmountBigInt - platformFeeAmount;
```

### Provider Earnings Only Include Their Share:
```typescript
// Update provider total earnings (provider's share only)
await prisma.provider.update({
  where: { id: api.Provider.id },
  data: {
    totalEarnings: (currentEarnings + providerAmount).toString(), // NOT full payment!
  }
});
```

### Platform Fees are Logged But Not Stored:
```typescript
console.log(`💰 Platform fee accumulated: ${platformFeeAmount.toString()} ${currency}`);
// TODO: Create platform revenue tracking table
// await prisma.platformRevenue.create({ /* ... */ });
```

### Fee Distribution Infrastructure Exists:
```typescript
// Distribute payment to provider on-chain (provider's share only)
const distributionResult = await distributePaymentToProvider({
  totalAmount: providerAmount.toString(), // Only provider's share!
});
```

## Solutions Needed

### 1. Platform Fee Tracking Table
```sql
CREATE TABLE platform_revenue (
  id TEXT PRIMARY KEY,
  payment_id TEXT NOT NULL,
  fee_amount TEXT NOT NULL,
  currency TEXT NOT NULL,
  percentage INTEGER NOT NULL,
  payment_model TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  settled_at TIMESTAMP,
  settled BOOLEAN DEFAULT FALSE
);
```

### 2. Fee Collection Service
```typescript
// For Direct to Provider model - collect platform fees periodically
async function collectPlatformFees() {
  // Calculate total unpaid platform fees
  // Send collection transactions to FURO wallet
  // Mark fees as settled in database
}
```

### 3. Fee Analytics Dashboard
```typescript
// Platform fee analytics
async function getPlatformFeeStats(timeframe: 'daily' | 'weekly' | 'monthly') {
  // Total platform fees collected
  // Breakdown by payment model
  // Settlement status
  // Projected earnings
}
```

## Recommendations

### Short Term (Immediate)
1. **Use FURO Aggregator Model** - Automatic fee collection
2. **Add platform revenue tracking table** - Start storing fee data
3. **Implement basic fee analytics** - Track platform earnings

### Long Term (Production Ready)
1. **Hybrid Collection System** - Support both payment models
2. **Automated Fee Collection** - Periodic collection for Direct model
3. **Fee Settlement System** - Withdrawal and management of collected fees
4. **Advanced Analytics** - Comprehensive fee reporting

## Current State Summary

- **Fee Calculation**: ✅ Working correctly
- **Direct Model Collection**: ❌ Manual collection required
- **Aggregator Model Collection**: ✅ Automatic collection
- **Fee Storage**: ❌ Needs implementation
- **Fee Analytics**: ❌ Needs implementation

**Recommendation:** Use FURO Aggregator model for production to ensure automatic platform fee collection.