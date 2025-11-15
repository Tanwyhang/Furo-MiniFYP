import { NextRequest, NextResponse } from 'next/server';
import { x402Middleware } from '@/lib/x402';
import { authenticateWithSignature, globalRateLimiter } from '@/lib/auth';

/**
 * Native x402 Payment Middleware
 * Replaces x402-next dependency with custom implementation
 */
export async function proxy(request: NextRequest) {
  const url = request.nextUrl;
  const pathname = url.pathname;

  // Check if this is a protected API endpoint
  if (pathname.startsWith('/api/apis/public/') || pathname.startsWith('/api/apis/') && pathname.includes('/call')) {

    // Extract API ID from the path
    let apiId: string | null = null;

    if (pathname.startsWith('/api/apis/public/')) {
      // For public path endpoints, extract path and find corresponding API
      const publicPath = pathname.replace('/api/apis/public/', '');
      apiId = await getApiIdFromPublicPath(publicPath);
    } else if (pathname.match(/^\/api\/apis\/[^\/]+\/call$/)) {
      // For /api/apis/[id]/call endpoints
      const pathParts = pathname.split('/');
      apiId = pathParts[3]; // /api/apis/[id]/call -> index 3 is the API ID
    }

    if (!apiId) {
      return NextResponse.json(
        { success: false, error: 'API ID could not be determined' },
        { status: 400 }
      );
    }

    // Apply rate limiting
    const clientIp = request.headers.get('x-forwarded-for') ||
                    request.headers.get('x-real-ip') ||
                    'unknown';

    if (!globalRateLimiter.isAllowed(clientIp)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Rate limit exceeded',
          details: 'Too many requests. Please try again later.'
        },
        { status: 429 }
      );
    }

    // Enhanced authentication with optional signature verification
    const authResult = await authenticateWithSignature(request, false);

    if (!authResult.authenticated) {
      return NextResponse.json(
        {
          success: false,
          error: 'Authentication failed',
          details: authResult.error || 'Invalid authentication credentials'
        },
        { status: 401 }
      );
    }

    const developerAddress = authResult.developerAddress!;

    // Apply x402 middleware
    const x402Response = await x402Middleware(request, apiId, developerAddress);

    if (x402Response) {
      // Payment required - return 402 response with authentication challenge
      const authChallenge = x402Response.headers.get('content-type');

      // Add authentication headers to response
      const responseHeaders = new Headers(x402Response.headers);
      responseHeaders.set('X-Developer-Address', developerAddress);
      responseHeaders.set('X-Auth-Required', 'true');

      return new NextResponse(x402Response.body, {
        status: x402Response.status,
        statusText: x402Response.statusText,
        headers: responseHeaders
      });
    }

    // Payment valid or token provided - continue to API endpoint
    // Add verified developer address to headers for downstream processing
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('X-Developer-Address-Verified', developerAddress);
    requestHeaders.set('X-Auth-Timestamp', Date.now().toString());

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  }

  // Non-protected endpoint - continue normally
  return NextResponse.next();
}

/**
 * Helper function to find API ID from public path
 */
async function getApiIdFromPublicPath(publicPath: string): Promise<string | null> {
  try {
    const { PrismaClient } = await import('@/lib/generated/prisma/client');
    const prisma = new PrismaClient();

    // Normalize the public path
    const normalizedPath = publicPath.startsWith('/') ? publicPath : `/${publicPath}`;

    const api = await prisma.api.findUnique({
      where: { publicPath: normalizedPath },
      select: { id: true }
    });

    return api?.id || null;
  } catch (error) {
    console.error('Error finding API from public path:', error);
    return null;
  }
}

// Configure which paths the middleware should run on
export const config = {
  matcher: [
    '/api/apis/public/:path*',
    '/api/apis/:id/call',
  ]
};