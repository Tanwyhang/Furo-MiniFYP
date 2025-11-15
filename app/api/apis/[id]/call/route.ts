import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@/lib/generated/prisma/client';
import { validatePaymentRetry, consumeTokenWithX402 } from '@/lib/x402';

const prisma = new PrismaClient();

// POST /api/apis/[id]/call - Call an API using x402 protocol
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const {
      tokenHash,
      method = 'GET',
      headers = {},
      params: queryParams = {},
      body: requestBody
    } = body;

    // Get developer address (middleware should have validated this)
    const developerAddress = request.headers.get('X-Developer-Address-Verified') ||
                           request.headers.get('X-Developer-Address');

    if (!developerAddress) {
      return NextResponse.json(
        { success: false, error: 'Developer address required' },
        { status: 401 }
      );
    }

    // Check for payment retry scenario (transaction hash in headers)
    const transactionHash = request.headers.get('X-Payment') || body.transactionHash;
    if (transactionHash && !tokenHash) {
      const paymentValidation = await validatePaymentRetry(transactionHash, id, developerAddress);

      if (paymentValidation.valid && paymentValidation.tokens && paymentValidation.tokens.length > 0) {
        // Valid payment found - proceed with the first available token
        return await executeApiCallWithToken(
          request,
          id,
          developerAddress,
          paymentValidation.tokens[0].tokenHash,
          { method, headers, queryParams, requestBody }
        );
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

    // Check for token-based access
    if (!tokenHash) {
      return NextResponse.json(
        {
          success: false,
          error: 'Payment or token required',
          details: 'Include token hash in request body or transaction hash in X-Payment header'
        },
        { status: 400 }
      );
    }

    // Execute API call with token
    return await executeApiCallWithToken(
      request,
      id,
      developerAddress,
      tokenHash,
      { method, headers, queryParams, requestBody }
    );
  } catch (error) {
    console.error('Error in API call route:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * Execute API call with token consumption
 */
async function executeApiCallWithToken(
  request: NextRequest,
  apiId: string,
  developerAddress: string,
  tokenHash: string,
  options: {
    method: string;
    headers: any;
    queryParams: any;
    requestBody?: any;
  }
) {
  try {
    const { method, headers, queryParams, requestBody } = options;

    // Consume token with x402 flow
    const tokenResult = await consumeTokenWithX402(
      tokenHash,
      apiId,
      developerAddress,
      {
        headers,
        params: queryParams,
        body: requestBody,
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown'
      }
    );

    if (!tokenResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Token consumption failed',
          details: tokenResult.error || 'Invalid token'
        },
        { status: 403 }
      );
    }

    const { api, provider, usageLog } = tokenResult;

    // Execute the actual API call
    const startTime = Date.now();
    let apiResponse: Response;
    let responseText: string = '';
    let errorMessage: string | null = null;

    try {
      // Check if API uses double relay or direct relay
      if (!api.isDirectRelay && api.internalEndpoint) {
        // DOUBLE RELAY: Call our internal relay endpoint
        const internalUrl = `http://localhost:3000${api.internalEndpoint}/${apiId}/relay`;

        const internalRequestOptions = {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Internal-Auth': process.env.INTERNAL_RELAY_SECRET || 'internal-secret-key',
            'X-Developer-Address': developerAddress
          },
          body: JSON.stringify({
            tokenHash,
            method,
            headers,
            params: queryParams,
            body: requestBody,
            developerAddress
          })
        };

        console.log(`🔄 Using double relay: ${internalUrl}`);
        apiResponse = await fetch(internalUrl, internalRequestOptions);
        responseText = await apiResponse.text();

        // If internal relay call fails, try fallback endpoint if configured
        if (!apiResponse.ok && api.fallbackEndpoint && api.fallbackEndpoint !== api.internalEndpoint) {
          console.log(`🔄 Trying fallback endpoint: ${api.fallbackEndpoint}`);
          const fallbackUrl = `http://localhost:3000${api.fallbackEndpoint}/${apiId}/relay`;

          const fallbackRequestOptions = {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Internal-Auth': process.env.INTERNAL_RELAY_SECRET || 'internal-secret-key',
              'X-Developer-Address': developerAddress
            },
            body: JSON.stringify({
              tokenHash,
              method,
              headers,
              params: queryParams,
              body: requestBody,
              developerAddress
            })
          };

          apiResponse = await fetch(fallbackUrl, fallbackRequestOptions);
          responseText = await apiResponse.text();
        }

      } else {
        // DIRECT RELAY: Call provider endpoint directly
        console.log(`🔄 Using direct relay: ${api.endpoint}`);

        // Prepare request to actual API endpoint
        const apiUrl = new URL(api.endpoint);

        // Add query parameters if provided
        if (queryParams && Object.keys(queryParams).length > 0) {
          Object.entries(queryParams).forEach(([key, value]) => {
            apiUrl.searchParams.append(key, String(value));
          });
        }

        // Prepare headers for the actual API call
        const requestHeaders = {
          ...headers,
          'User-Agent': 'Furo-Gateway/1.0',
          'X-Furo-Api-Id': api.id,
          'X-Furo-Request-Id': `req_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`
        };

        // Remove Furo-specific headers
        delete requestHeaders['X-Developer-Address'];
        delete requestHeaders['X-PAYMENT'];
        delete requestHeaders['X-Token-Hash'];

        // Prepare request options
        const requestOptions: RequestInit = {
          method: method.toUpperCase(),
          headers: requestHeaders
        };

        // Add body for POST/PUT requests
        if (requestBody && ['POST', 'PUT', 'PATCH'].includes(method.toUpperCase())) {
          if (typeof requestBody === 'string') {
            requestOptions.body = requestBody;
            requestHeaders['Content-Type'] = 'application/json';
          } else {
            requestOptions.body = JSON.stringify(requestBody);
            requestHeaders['Content-Type'] = 'application/json';
          }
        }

        // Make the actual API call
        apiResponse = await fetch(apiUrl.toString(), requestOptions);
        responseText = await apiResponse.text();
      }

      const responseTime = Date.now() - startTime;
      const responseSize = apiResponse.headers.get('content-length')
        ? parseInt(apiResponse.headers.get('content-length')!)
        : responseText.length;

      const success = apiResponse.ok && apiResponse.status < 400;

      // Update the usage log with the actual API call results
      await prisma.usageLog.update({
        where: { id: usageLog.id },
        data: {
          responseStatus: apiResponse.status,
          responseTime,
          responseSize,
          errorMessage: success ? null : `HTTP ${apiResponse.status}: ${apiResponse.statusText}`,
          success
        }
      });

      // Update API performance metrics
      const currentAvgResponseTime = api.averageResponseTime || 0;
      const totalCalls = api.totalCalls || 0;
      const newAvgResponseTime = Math.round(
        (currentAvgResponseTime * totalCalls + responseTime) / (totalCalls + 1)
      );

      await prisma.api.update({
        where: { id: api.id },
        data: {
          averageResponseTime: newAvgResponseTime,
          totalCalls: { increment: 1 },
          updatedAt: new Date()
        }
      });

      // Update provider statistics
      await prisma.provider.update({
        where: { id: provider.id },
        data: {
          totalCalls: { increment: 1 },
          updatedAt: new Date()
        }
      });

      // Prepare response to client
      const clientResponse = {
        success,
        data: success ? (responseText ? JSON.parse(responseText) : null) : responseText,
        status: apiResponse.status,
        statusText: apiResponse.statusText,
        headers: Object.fromEntries(apiResponse.headers.entries()),
        meta: {
          apiId: api.id,
          apiName: api.name,
          provider: provider.name,
          requestId: usageLog.id,
          responseTime,
          processedAt: new Date().toISOString(),
          tokenConsumed: true,
          tokenHash
        }
      };

      return NextResponse.json(clientResponse);

    } catch (fetchError) {
      const responseTime = Date.now() - startTime;
      errorMessage = fetchError instanceof Error ? fetchError.message : 'Network error';

      // Update usage log with error
      await prisma.usageLog.update({
        where: { id: usageLog.id },
        data: {
          responseStatus: 0,
          responseTime,
          responseSize: 0,
          errorMessage,
          success: false
        }
      });

      return NextResponse.json(
        {
          success: false,
          error: 'Failed to call API endpoint',
          details: errorMessage,
          meta: {
            apiId: api.id,
            apiName: api.name,
            provider: provider.name,
            responseTime,
            tokenConsumed: true,
            tokenHash
          }
        },
        { status: 502 } // Bad Gateway
      );
    }

  } catch (error) {
    console.error('Error in executeApiCallWithToken:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to execute API call',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}