import { paymentMiddleware, Network } from 'x402-next';

export const proxy = paymentMiddleware(
  (process.env.FURO_PLATFORM_WALLET || "0x0000000000000000000000000000000000000000") as `0x${string}`,
  {
    '/api/apis/public/[path]': {
      price: '0.000001', // Small ETH amount for API access
      network: "base-sepolia",
      config: {
        description: 'Access to premium API endpoints'
      }
    },
    '/api/apis/[id]/call': {
      price: '0.000001', // Small ETH amount for API calls
      network: "base-sepolia",
      config: {
        description: 'Execute API call with verified token'
      }
    }
  },
  {
    // Facilitator Configuration
    url: 'https://api.x402.org', // x402 facilitator service URL
    createAuthHeaders: async () => ({
      verify: {
        'Authorization': `Bearer ${process.env.X402_API_KEY || 'default-key'}`,
        'Content-Type': 'application/json'
      },
      settle: {
        'Authorization': `Bearer ${process.env.X402_API_KEY || 'default-key'}`,
        'Content-Type': 'application/json'
      },
      supported: {
        'Authorization': `Bearer ${process.env.X402_API_KEY || 'default-key'}`,
        'Content-Type': 'application/json'
      }
    })
  },
  {
    // Paywall Configuration
    cdpClientKey: process.env.COINBASE_CDP_CLIENT_KEY,
    appName: 'Furo API Gateway',
    appLogo: '/logo.png',
    sessionTokenEndpoint: '/api/x402/session-token'
  }
);

// Configure which paths the proxy should run on
export const config = {
  matcher: [
    '/api/apis/public/:path*',
    '/api/apis/:id/call',
  ]
};