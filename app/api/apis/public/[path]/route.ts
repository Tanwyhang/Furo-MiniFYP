import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@/lib/generated/prisma/client';
import { validatePaymentRetry } from '@/lib/x402';

const prisma = new PrismaClient();

// GET /api/apis/public/[path] - Execute API call by public path (x402 protected)
export async function GET(
  request: NextRequest,
  { params }: { params: { path: string } }
) {
  try {
    const { path } = await params;

    if (!path) {
      return NextResponse.json(
        { success: false, error: 'Public path is required' },
        { status: 400 }
      );
    }

    const publicPath = path.startsWith('/') ? path : `/${path}`;

    // Get developer address (middleware should have validated this)
    const developerAddress = request.headers.get('X-Developer-Address-Verified') ||
                           request.headers.get('X-Developer-Address');

    if (!developerAddress) {
      return NextResponse.json(
        { success: false, error: 'Developer address required' },
        { status: 401 }
      );
    }

    // Find the API by public path
    const api = await prisma.api.findUnique({
      where: { publicPath },
      include: { Provider: true }
    });

    if (!api) {
      return NextResponse.json(
        { success: false, error: 'API not found for this public path' },
        { status: 404 }
      );
    }

    if (!api.isActive || !api.Provider.isActive) {
      return NextResponse.json(
        { success: false, error: 'API is currently inactive' },
        { status: 403 }
      );
    }

    // Check for payment retry scenario (transaction hash in X-Payment header)
    const transactionHash = request.headers.get('X-Payment');
    if (transactionHash) {
      const paymentValidation = await validatePaymentRetry(transactionHash, api.id, developerAddress);

      if (paymentValidation.valid && paymentValidation.tokens && paymentValidation.tokens.length > 0) {
        // Valid payment found - execute the API call with the first available token
        return await executeApiCall(request, api, developerAddress, paymentValidation.tokens[0].tokenHash);
      } else {
        return NextResponse.json(
          {
            success: false,
            error: 'Payment validation failed',
            details: paymentValidation.error || 'Invalid or expired payment'
          },
          { status: 402 }
        );
      }
    }

    // Check for token-based access (token hash in X-Token-Hash header)
    const tokenHash = request.headers.get('X-Token-Hash');
    if (tokenHash) {
      return await executeApiCall(request, api, developerAddress, tokenHash);
    }

    // If we reach here, the middleware should have caught this, but as a safety check:
    return NextResponse.json(
      {
        success: false,
        error: 'Payment required',
        details: 'This API requires payment. Please make a payment and retry with the transaction hash.',
        payment: {
          address: api.Provider.walletAddress,
          amount: api.pricePerCall,
          network: 'sepolia',
          currency: api.currency,
          resourceId: api.id
        }
      },
      { status: 402 }
    );

  } catch (error) {
    console.error('Error in public API call:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process API call' },
      { status: 500 }
    );
  }
}

/**
 * Execute the actual API call using a token
 */
async function executeApiCall(
  request: NextRequest,
  api: any,
  developerAddress: string,
  tokenHash: string
) {
  try {
    // Get request details
    const url = new URL(request.url);
    const queryParams: Record<string, string> = {};

    // Extract query parameters
    url.searchParams.forEach((value, key) => {
      queryParams[key] = value;
    });

    // Determine if this is double relay or direct relay
    const useDoubleRelay = !api.isDirectRelay && api.internalEndpoint;

    if (useDoubleRelay) {
      // Use internal relay endpoint
      const internalUrl = `http://localhost:3000${api.internalEndpoint}/${api.id}/relay`;

      const relayRequest = {
        tokenHash,
        method: 'GET',
        headers: Object.fromEntries(request.headers.entries()),
        params: queryParams,
        developerAddress
      };

      const response = await fetch(internalUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Internal-Auth': process.env.INTERNAL_RELAY_SECRET || 'internal-secret-key',
          'X-Developer-Address': developerAddress
        },
        body: JSON.stringify(relayRequest)
      });

      const result = await response.json();

      if (!response.ok) {
        return NextResponse.json(result, { status: response.status });
      }

      return NextResponse.json(result);

    } else {
      // Direct relay to provider endpoint
      const apiUrl = new URL(api.endpoint);

      // Add query parameters
      Object.entries(queryParams).forEach(([key, value]) => {
        apiUrl.searchParams.append(key, value);
      });

      // Prepare headers
      const headers = {
        'User-Agent': 'Furo-Gateway/1.0',
        'X-Furo-Api-Id': api.id,
        'X-Furo-Request-Id': `req_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`
      };

      // Make the API call
      const startTime = Date.now();
      const response = await fetch(apiUrl.toString(), { headers });
      const responseTime = Date.now() - startTime;
      const responseText = await response.text();

      // Log usage (token should already be consumed by middleware or internal relay)
      try {
        await prisma.usageLog.create({
          data: {
            id: `usage_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
            apiId: api.id,
            providerId: api.Provider.id,
            developerAddress: developerAddress.toLowerCase(),
            requestHeaders: headers,
            requestParams: queryParams,
            responseStatus: response.status,
            responseTime,
            responseSize: responseText.length,
            success: response.ok && response.status < 400,
            errorMessage: response.ok ? null : `HTTP ${response.status}: ${response.statusText}`,
            ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
            userAgent: request.headers.get('user-agent') || 'unknown'
          }
        });
      } catch (logError) {
        console.error('Failed to create usage log:', logError);
      }

      // Return response
      if (response.ok && responseText) {
        try {
          const jsonData = JSON.parse(responseText);
          return NextResponse.json({
            success: true,
            data: jsonData,
            meta: {
              apiId: api.id,
              apiName: api.name,
              provider: api.Provider.name,
              responseTime,
              tokenHash,
              processedAt: new Date().toISOString()
            }
          });
        } catch {
          // Return as text if not JSON
          return NextResponse.json({
            success: true,
            data: responseText,
            meta: {
              apiId: api.id,
              apiName: api.name,
              provider: api.Provider.name,
              responseTime,
              tokenHash,
              processedAt: new Date().toISOString()
            }
          });
        }
      } else {
        return NextResponse.json({
          success: false,
          error: 'API call failed',
          data: responseText,
          status: response.status,
          statusText: response.statusText,
          meta: {
            apiId: api.id,
            apiName: api.name,
            provider: api.Provider.name,
            responseTime,
            tokenHash,
            processedAt: new Date().toISOString()
          }
        }, { status: response.status });
      }
    }

  } catch (error) {
    console.error('Error executing API call:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to execute API call',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 502 }
    );
  }
}