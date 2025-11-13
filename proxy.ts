import { NextRequest, NextResponse } from 'next/server';

// Manual x402 proxy for API routes (replaces deprecated middleware)
export async function handle(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const method = request.method.toUpperCase();

  // Define which routes require x402 payment protection
  const protectedRoutes = [
    '/api/apis/',
    '/api/providers/'
  ];

  // Check if this is a protected route
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));
  const isAnalyticsEndpoint = pathname.includes('/analytics');
  const isCallEndpoint = pathname.includes('/call');

  // Only apply x402 protection to call endpoints, not analytics
  if (!isProtectedRoute || !isCallEndpoint) {
    // Pass through to Next.js routes (including analytics)
    return NextResponse.next();
  }

  // Extract API ID from pathname
  const pathParts = pathname.split('/');
  const apiId = pathParts[3]; // /api/apis/[id]/...
  const endpointType = pathParts[4]; // call, analytics, etc.

  if (!apiId || !endpointType) {
    // Pass through to Next.js routes
    return NextResponse.next();
  }

  // Check for X-PAYMENT header (blockchain payment) or token-based access
  const paymentHeader = request.headers.get("X-PAYMENT");
  const tokenHash = request.headers.get("X-Token-Hash");

  // Allow token-based access to bypass payment requirement
  if (tokenHash) {
    console.log('Token-based access requested:', tokenHash);
    const response = NextResponse.next();
    response.headers.set('X-Token-Access', 'true');
    response.headers.set('X-API-ID', apiId);
    return response;
  }

  // For POST requests to /call endpoints, check if they might contain token in body
  // Let the API route handle token validation directly
  if (method === 'POST' && endpointType === 'call') {
    const response = NextResponse.next();
    response.headers.set('X-API-ID', apiId);
    return response;
  }

  if (!paymentHeader) {
    // Return 402 Payment Required response
    const paymentRequirements = {
      x402Version: 1,
      accepts: [{
        scheme: "exact",
        network: "base-sepolia", // Default to testnet
        maxAmountRequired: "100000000000000", // 0.0001 ETH in Wei (will be overridden by API route)
        resource: `${request.nextUrl.protocol}//${request.nextUrl.host}${pathname}`,
        description: `Access API endpoint - payment required`,
        mimeType: "application/json",
        payTo: "0x1234567890123456789012345678901234567890", // Will be overridden by API route
        maxTimeoutSeconds: 300,
        asset: "0x4200000000000000000000000000000000000006", // USDC on Base Sepolia
        outputSchema: {
          input: {
            type: "http",
            method,
            discoverable: true
          },
          output: {
            type: "application/json"
          }
        }
      }]
    };

    // Check if browser request for HTML paywall
    const accept = request.headers.get("Accept");
    if (accept?.includes("text/html")) {
      const userAgent = request.headers.get("User-Agent");
      if (userAgent?.includes("Mozilla")) {
        // Return HTML paywall (simplified version)
        const paywallHtml = `
          <!DOCTYPE html>
          <html>
          <head>
            <title>Payment Required - Furo</title>
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <style>
              body { font-family: system-ui, -apple-system, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
              .container { max-width: 400px; margin: 50px auto; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
              h1 { color: #333; margin-bottom: 20px; }
              .price { font-size: 24px; font-weight: bold; color: #007bff; margin: 20px 0; }
              .description { color: #666; margin-bottom: 30px; }
              .pay-button { background: #007bff; color: white; padding: 12px 24px; border: none; border-radius: 6px; font-size: 16px; cursor: pointer; }
              .pay-button:hover { background: #0056b3; }
            </style>
          </head>
          <body>
            <div class="container">
              <h1>Payment Required</h1>
              <div class="description">API access requires payment to continue</div>
              <div class="price">Price: 0.0001 ETH</div>
              <p>This API requires payment to access. Please complete the payment to continue.</p>
              <button class="pay-button" onclick="alert('Integration with wallet provider needed')">Pay Now</button>
            </div>
            <script>
              console.log('Payment Requirements:', ${JSON.stringify(paymentRequirements)});
            </script>
          </body>
          </html>
        `;

        return new NextResponse(paywallHtml, {
          status: 402,
          headers: { "Content-Type": "text/html" }
        });
      }
    }

    // Return JSON 402 response for API clients
    return new NextResponse(
      JSON.stringify(paymentRequirements),
      { status: 402, headers: { "Content-Type": "application/json" } }
    );
  }

  // TODO: In a full implementation, we would:
  // 1. Decode and verify the payment header using x402 utilities
  // 2. Check with facilitator service for payment validation

  // For now, we'll simulate payment verification and proceed
  console.log('Payment header received:', paymentHeader);

  // Add payment metadata to headers for downstream routes
  const response = NextResponse.next();
  response.headers.set('X-Payment-Verified', 'true');
  response.headers.set('X-API-ID', apiId);

  return response;
}

// Export the handler function for Next.js proxy
export default handle;