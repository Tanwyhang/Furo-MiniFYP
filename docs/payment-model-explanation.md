# FURO Payment Model Explanation

## Overview

FURO supports **two payment models** that can be configured via environment variables:

1. **Direct to Provider (Single Relay)** - Default
2. **FURO Aggregator (Double Relay)** - Optional

## Configuration

Add this to your `.env.local` file:

```bash
# For FURO Aggregator Model (Double Relay)
NEXT_PUBLIC_FURO_WALLET_ADDRESS=0xed1de7d3e83743ce708dc633bca0f63c37fe2ab7

# For Direct to Provider Model (Single Relay)
# Don't set NEXT_PUBLIC_FURO_WALLET_ADDRESS or leave it empty
```

## Payment Models

### 1. Direct to Provider (Single Relay) - Default

**Flow:**
```
Developer → Provider Wallet (Direct Payment)
```

**Process:**
1. Developer sends payment directly to provider's wallet
2. System verifies transaction on blockchain
3. Tokens are issued immediately
4. Platform fee is calculated but not distributed automatically

**Advantages:**
- ✅ Immediate access for developers
- ✅ No additional transactions needed
- ✅ Lower gas costs
- ✅ Provider receives funds directly

**Configuration:**
```bash
# Don't set NEXT_PUBLIC_FURO_WALLET_ADDRESS
# or leave it empty/uncommented
```

### 2. FURO Aggregator (Double Relay) - Optional

**Flow:**
```
Developer → FURO Wallet → Provider Wallet (Aggregated)
```

**Process:**
1. Developer sends payment to FURO platform wallet
2. System verifies transaction on blockchain
3. Tokens are issued immediately
4. FURO periodically batches and distributes funds to providers
5. Platform fee is automatically retained by FURO

**Advantages:**
- ✅ FURO can batch transactions to save gas
- ✅ Automatic platform fee collection
- ✅ Provider protection from direct payments
- ✅ Better analytics and control

**Configuration:**
```bash
NEXT_PUBLIC_FURO_WALLET_ADDRESS=0xed1de7d3e83743ce708dc633bca0f63c37fe2ab7
```

## Technical Implementation

### Payment Processing

Both models use the same verification logic:

```typescript
// Determine expected recipient
const furoWalletAddress = process.env.NEXT_PUBLIC_FURO_WALLET_ADDRESS;
const expectedRecipient = furoWalletAddress || provider.walletAddress;

// Verify transaction went to correct address
const actualRecipient = transaction.to?.toLowerCase();
if (actualRecipient !== expectedRecipient.toLowerCase()) {
  throw new Error('Invalid recipient');
}
```

### Fee Calculation

Platform fees are calculated the same way:

```typescript
const totalAmount = BigInt(paymentAmount);
const platformFeeAmount = (totalAmount * BigInt(3)) / BigInt(100); // 3% fee
const providerAmount = totalAmount - platformFeeAmount;
```

### Database Records

Payment records store:
- Total payment amount
- Platform fee amount
- Provider share amount
- Payment model used
- Transaction hash and block data

## User Interface

The payment modal shows the payment model:

```
Payment Model: FURO Aggregator     # When using FURO wallet
Payment Model: Direct to Provider # When paying provider directly

Recipient: 0xed1d...fe2ab7        # Truncated wallet address
```

## Fee Distribution

### Direct to Provider Model
- Platform fees are calculated but require manual distribution
- Providers receive full payment amount immediately
- FURO needs separate process to collect platform fees

### FURO Aggregator Model
- Platform fees are automatically retained
- Provider distribution happens via `distributePaymentToProvider()`
- FURO can batch multiple distributions for efficiency

## Transaction Verification

Both models verify:
1. Transaction exists on blockchain
2. Recipient address matches expected
3. Amount is sufficient
4. Transaction status is successful

## Recommendation

**For Development/Testing:** Use Direct to Provider model (simpler)

**For Production:** Consider FURO Aggregator model if:
- You want automatic fee collection
- You need better analytics and control
- You want to optimize gas costs via batching
- You want to protect providers from direct payment issues

## Current Status

The implementation currently supports both models. The FURO wallet address `0xed1de7d3e83743ce708dc633bca0f63c37fe2ab7` is configured and ready for testing.

To test the FURO Aggregator model:
1. Add the FURO wallet address to your `.env.local`
2. Restart your development server
3. The payment modal will show "FURO Aggregator" as the payment model
4. All payments will go to the FURO wallet first