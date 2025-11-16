# Testing Configuration Guide

## 🧪 Temporary Testing Setup

For testing purposes, all API provider wallet addresses are set to:

```
0x28adcf970a21f9fe1da1f5770670a55f76c4e995
```

This allows for consistent testing of the P2P direct payment model.

## 📝 How to Update Provider Wallet Addresses

### Method 1: Update Database Directly

```sql
-- Update all existing providers to use test wallet address
UPDATE "Provider"
SET "walletAddress" = '0x28adcf970a21f9fe1da1f5770670a55f76c4e995'
WHERE "walletAddress" != '0x28adcf970a21f9fe1da1f5770670a55f76c4e995';
```

### Method 2: Create Test API with Test Wallet

```javascript
// Create a test API with the specified wallet address
const testAPI = await prisma.api.create({
  data: {
    id: 'test-api-p2p-' + Date.now(),
    providerId: 'test-provider-id',
    name: 'Test P2P API',
    description: 'Test API for P2P direct payments',
    category: 'Testing',
    endpoint: 'https://api.example.com/test',
    publicPath: '/test-p2p-api',
    method: 'GET',
    pricePerCall: '10000000000000000', // 0.00001 ETH
    currency: 'ETH',
    isActive: true
  }
});

// Update or create provider with test wallet
await prisma.provider.upsert({
  where: { walletAddress: '0x28adcf970a21f9fe1da1f5770670a55f76c4e995' },
  update: {
    name: 'Test Provider P2P',
    isActive: true
  },
  create: {
    id: 'test-provider-p2p-' + Date.now(),
    walletAddress: '0x28adcf970a21f9fe1da1f5770670a55f76c4e995',
    name: 'Test Provider P2P',
    isActive: true
  }
});
```

### Method 3: Use Prisma Studio

1. Open Prisma Studio: `pnpm prisma studio`
2. Navigate to the Provider table
3. Update existing provider wallet addresses to: `0x28adcf970a21f9fe1da1f5770670a55f76c4e995`
4. Or create new test providers with this address

## 🧪 Testing Checklist

### Prerequisites
- [ ] Development server running (`pnpm dev`)
- [ ] Database connected
- [ ] At least one API with the test wallet address configured
- [ ] MetaMask or other wallet connected with test ETH

### Testing Steps
1. [ ] Verify API details page shows the test wallet address
2. [ ] Click "Pay & Call API"
3. [ ] Confirm payment modal shows correct recipient
4. [ ] Send test transaction to `0x28adcf970a21f9fe1da1f5770670a55f76c4e995`
5. [ ] Verify payment processing completes successfully
6. [ ] Check that tokens are issued correctly
7. [ ] Confirm API appears in purchased APIs

### Expected Results
- ✅ Payment recipient: `0x28ad...e995` (truncated)
- ✅ Platform fee: 0%
- ✅ Payment model: P2P Direct
- ✅ Tokens issued based on full payment amount
- ✅ Provider receives 100% of payment

## 🔄 Testing Commands

### Quick Test Script
```javascript
// Test the API endpoint
const response = await fetch('http://localhost:3000/api/apis/test-api-id/call', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-Developer-Address': '0xYourTestWalletAddress'
  },
  body: JSON.stringify({
    params: {},
    headers: {}
  })
});

console.log('Status:', response.status);
console.log('Response:', await response.json());
```

### Verify Database State
```sql
-- Check provider wallet address
SELECT "id", "name", "walletAddress", "isActive"
FROM "Provider"
WHERE "walletAddress" = '0x28adcf970a21f9fe1da1f5770670a55f76c4e995';

-- Check API payments
SELECT p."id", p."transactionHash", p."amount", p."isVerified",
       a."name" as "apiName", pr."name" as "providerName"
FROM "Payment" p
JOIN "Api" a ON p."apiId" = a."id"
JOIN "Provider" pr ON p."providerId" = pr."id"
WHERE pr."walletAddress" = '0x28adcf970a21f9fe1da1f5770670a55f76c4e995';
```

## 📋 Important Notes

### Testing Wallet Setup
- Use a wallet with test ETH on Sepolia network
- Ensure the wallet can send transactions to the test address
- Verify network is set to Sepolia in your wallet

### Test API Configuration
- Price per call should be reasonable for testing (e.g., 0.00001 ETH)
- Test endpoint should be accessible and return valid responses
- API should be set to active status

### Network Configuration
- Ensure Sepolia testnet is properly configured
- RPC endpoints should be working
- Transaction verification should be functional

## 🎯 Next Steps After Testing

Once P2P testing is complete and successful:

1. **Production Deployment**: Use real provider wallet addresses
2. **API Provider Onboarding**: Allow providers to register their own wallets
3. **Multiple Providers**: Test with various wallet addresses
4. **Network Expansion**: Test on additional networks (Mainnet, Polygon, etc.)

The P2P model is now ready for comprehensive testing with the unified test wallet address!