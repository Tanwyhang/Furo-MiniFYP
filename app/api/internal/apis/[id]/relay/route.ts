import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@/lib/generated/prisma/client';

const prisma = new PrismaClient();

// POST /api/internal/apis/[id]/relay - Internal relay to provider's hidden API
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const {
      tokenHash,
      method = 'GET',
      headers = {},
      params: queryParams = {},
      body: requestBody,
      developerAddress
    } = body;

    // Internal security: Validate this is an internal request
    const internalAuthHeader = request.headers.get('X-Internal-Auth');
    if (internalAuthHeader !== process.env.INTERNAL_RELAY_SECRET) {
      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized internal relay request'
        },
        { status: 401 }
      );
    }

    // Validate required fields
    if (!tokenHash || !developerAddress) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields: tokenHash and developerAddress are required'
        },
        { status: 400 }
      );
    }

    // Find the API with double relay configuration
    const api = await prisma.api.findUnique({
      where: { id },
      include: {
        Provider: true
      }
    });

    if (!api) {
      return NextResponse.json(
        {
          success: false,
          error: 'API not found'
        },
        { status: 404 }
      );
    }

    // Validate API is configured for double relay
    if (api.isDirectRelay) {
      return NextResponse.json(
        {
          success: false,
          error: 'API is configured for direct relay, not double relay'
        },
        { status: 400 }
      );
    }

    if (!api.internalEndpoint) {
      return NextResponse.json(
        {
          success: false,
          error: 'API is not configured with internal endpoint'
        },
        { status: 400 }
      );
    }

    // Validate token and developer address (double-check security)
    const token = await prisma.token.findUnique({
      where: { tokenHash },
      include: {
        Api: true,
        Payment: true
      }
    });

    if (!token) {
      return NextResponse.json(
        {
          success: false,
          error: 'Token validation failed',
          details: 'Invalid token: token not found'
        },
        { status: 404 }
      );
    }

    // Validate token properties
    if (token.isUsed) {
      return NextResponse.json(
        {
          success: false,
          error: 'Token validation failed',
          details: 'Token has already been used',
          usedAt: token.usedAt
        },
        { status: 410 }
      );
    }

    if (token.expiresAt < new Date()) {
      return NextResponse.json(
        {
          success: false,
          error: 'Token validation failed',
          details: 'Token has expired',
          expiredAt: token.expiresAt
        },
        { status: 410 }
      );
    }

    if (token.apiId !== id) {
      return NextResponse.json(
        {
          success: false,
          error: 'Token validation failed',
          details: 'Token is not valid for this API'
        },
        { status: 403 }
      );
    }

    if (token.developerAddress.toLowerCase() !== developerAddress.toLowerCase()) {
      return NextResponse.json(
        {
          success: false,
          error: 'Token validation failed',
          details: 'Token does not belong to this developer'
        },
        { status: 403 }
      );
    }

    if (!api.isActive || !api.Provider.isActive) {
      return NextResponse.json(
        {
          success: false,
          error: 'API validation failed',
          details: 'API or provider is inactive'
        },
        { status: 403 }
      );
    }

    // Token is valid - consume it atomically
    const updatedToken = await prisma.token.update({
      where: {
        id: token.id,
        isUsed: false // Prevent race condition
      },
      data: {
        isUsed: true,
        usedAt: new Date()
      }
    });

    // Create usage log entry
    const usageLog = await prisma.usageLog.create({
      data: {
        id: `usage_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
        tokenId: updatedToken.id,
        apiId: api.id,
        providerId: api.Provider.id,
        developerAddress: developerAddress.toLowerCase(),
        requestHeaders: headers,
        requestParams: queryParams,
        requestBody: requestBody ? JSON.stringify(requestBody) : null,
        responseStatus: 0, // Will be updated by the actual API call
        responseTime: 0, // Will be updated by the actual API call
        responseSize: 0, // Will be updated by the actual API call
        success: false, // Will be updated by the actual API call
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'internal-relay',
        userAgent: request.headers.get('user-agent') || 'Furo-Internal-Relay/1.0'
      }
    });

    // Token consumed successfully, now make the actual API call to provider
    const startTime = Date.now();
    let apiResponse: Response;
    let responseText: string = '';
    let errorMessage: string | null = null;

    try {
      // Prepare request to actual provider endpoint (hidden from developers)
      const apiUrl = new URL(api.endpoint);

      // Add query parameters if provided
      if (queryParams && Object.keys(queryParams).length > 0) {
        Object.entries(queryParams).forEach(([key, value]) => {
          apiUrl.searchParams.append(key, String(value));
        });
      }

      // Prepare headers for the provider API call
      const requestHeaders = {
        // Include internal authentication if configured
        ...(api.internalAuth ? JSON.parse(JSON.stringify(api.internalAuth)) : {}),
        // Pass through original headers (except internal ones)
        ...headers,
        'User-Agent': 'Furo-Internal-Relay/1.0',
        'X-Furo-Api-Id': api.id,
        'X-Furo-Request-Id': `relay_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
        'X-Furo-Token-Hash': tokenHash,
        'X-Furo-Internal': 'true'
      };

      // Remove any internal headers that shouldn't reach provider
      delete requestHeaders['X-Internal-Auth'];
      delete requestHeaders['X-Developer-Address'];
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

      // Make the actual API call to provider's hidden endpoint
      apiResponse = await fetch(apiUrl.toString(), requestOptions);
      responseText = await apiResponse.text();

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
          updatedAt: new Date()
        }
      });

      // Prepare response to internal caller
      const internalResponse = {
        success,
        data: success ? (responseText ? JSON.parse(responseText) : null) : responseText,
        status: apiResponse.status,
        statusText: apiResponse.statusText,
        headers: Object.fromEntries(apiResponse.headers.entries()),
        meta: {
          apiId: api.id,
          apiName: api.name,
          provider: api.Provider.name,
          requestId: usageLog.id,
          responseTime,
          processedAt: new Date().toISOString(),
          tokenConsumed: true,
          tokenHash,
          relayType: 'double',
          internalEndpoint: api.internalEndpoint
        }
      };

      return NextResponse.json(internalResponse);

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
          error: 'Failed to call provider endpoint',
          details: errorMessage,
          meta: {
            apiId: api.id,
            apiName: api.name,
            provider: api.Provider.name,
            responseTime,
            tokenConsumed: true,
            tokenHash,
            relayType: 'double',
            internalEndpoint: api.internalEndpoint
          }
        },
        { status: 502 } // Bad Gateway
      );
    }

  } catch (error) {
    console.error('Error in internal relay route:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error in relay',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}