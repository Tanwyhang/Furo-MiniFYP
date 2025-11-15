# Network Configuration

## Supported Networks

Furo currently supports the following networks for x402 payments:

### Active Network
- **Ethereum Sepolia** (`sepolia`) - ETH Testnet
  - Chain ID: 11155111
  - Explorer: https://sepolia.etherscan.io
  - Faucet: https://sepoliafaucet.com/

### Previously Supported
- **Base Sepolia** (`base-sepolia`) - Previously supported, migrated to ETH Sepolia

## Configuration

### Proxy Configuration (proxy.ts)
```typescript
export const proxy = paymentMiddleware(
  platformWalletAddress,
  {
    '/api/apis/public/[path]': {
      price: '0.000001',
      network: 'sepolia', // ETH Sepolia
      config: {
        description: 'Access to premium API endpoints'
      }
    },
    '/api/apis/[id]/call': {
      price: '0.000001',
      network: 'sepolia', // ETH Sepolia
      config: {
        description: 'Execute API call with verified token'
      }
    }
  },
  {
    url: 'https://api.x402.org',
    createAuthHeaders: async () => ({...})
  }
);
```

### Environment Variables
```bash
# Platform wallet for receiving payments
FURO_PLATFORM_WALLET="0xYourPlatformWalletAddressHere"
```

### Web3 Configuration
The wallet connection already supports Sepolia through the RainbowKit configuration:
```typescript
chains: [mainnet, polygon, optimism, arbitrum, base, sepolia]
```

## Payment Flow

1. **User Request** → API endpoint
2. **402 Response** → Payment required with metadata
3. **Payment** → User sends ETH to provider wallet on Sepolia
4. **Verification** → Transaction verified on Sepolia
5. **Token Issuance** → Single-use tokens created
6. **API Access** → Token consumed for API call

## Testing on Sepolia

1. **Get Test ETH**: Use Sepolia faucet (https://sepoliafaucet.com/)
2. **Connect Wallet**: Ensure wallet is on Sepolia network
3. **Make API Call**: Trigger 402 payment response
4. **Complete Payment**: Send ETH to provider address
5. **Verify Access**: Use token to make API call

## Network Migration (Base Sepolia → ETH Sepolia)

- Changed `network: "base-sepolia"` to `network: "sepolia"`
- Updated payment processing default network
- Maintained same token economics and pricing
- All existing functionality preserved

## Production Readiness

To move to mainnet:
1. Change `network: "sepolia"` to `network: "mainnet"`
2. Update facilitator configuration for production
3. Use real provider wallet addresses
4. Implement on-chain transaction verification