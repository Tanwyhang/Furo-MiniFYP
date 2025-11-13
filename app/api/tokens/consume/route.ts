import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@/lib/generated/prisma/client';

const prisma = new PrismaClient();

// POST /api/tokens/consume - Consume a token for API access
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      tokenHash,
      apiId,
      developerAddress,
      requestHeaders = {},
      requestParams = {},
      requestBody = null
    } = body;

    // Validation
    if (!tokenHash || !apiId || !developerAddress) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields: tokenHash, apiId, and developerAddress are required'
        },
        { status: 400 }
      );
    }

    // Find and validate the token
    const token = await prisma.token.findUnique({
      where: { tokenHash },
      include: {
        Api: {
          include: {
            Provider: {
              select: {
                id: true,
                name: true,
                walletAddress: true,
                isActive: true
              }
            }
          }
        },
        Payment: true
      }
    });

    if (!token) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid token: token not found'
        },
        { status: 404 }
      );
    }

    // All token validations
    if (token.isUsed) {
      return NextResponse.json(
        {
          success: false,
          error: 'Token has already been used',
          usedAt: token.usedAt
        },
        { status: 410 }
      );
    }

    if (token.expiresAt < new Date()) {
      return NextResponse.json(
        {
          success: false,
          error: 'Token has expired',
          expiredAt: token.expiresAt
        },
        { status: 410 }
      );
    }

    if (token.apiId !== apiId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Token is not valid for this API'
        },
        { status: 403 }
      );
    }

    if (token.developerAddress.toLowerCase() !== developerAddress.toLowerCase()) {
      return NextResponse.json(
        {
          success: false,
          error: 'Token does not belong to this developer'
        },
        { status: 403 }
      );
    }

    if (!token.Api.isActive || !token.Api.Provider.isActive) {
      return NextResponse.json(
        {
          success: false,
          error: 'API or provider is inactive'
        },
        { status: 403 }
      );
    }

    // Mark token as used (atomic operation)
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
        apiId: token.Api.id,
        providerId: token.Provider.id,
        developerAddress: developerAddress.toLowerCase(),
        requestHeaders,
        requestParams,
        requestBody: requestBody ? JSON.stringify(requestBody) : null,
        responseStatus: 0, // Will be updated by the actual API call
        responseTime: 0, // Will be updated by the actual API call
        responseSize: 0, // Will be updated by the actual API call
        success: false, // Will be updated by the actual API call
        ipAddress: request.ip || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown'
      }
    });

    // Update API statistics
    await prisma.api.update({
      where: { id: token.Api.id },
      data: {
        totalCalls: { increment: 1 },
        updatedAt: new Date()
      }
    });

    // Update provider statistics
    await prisma.provider.update({
      where: { id: token.Provider.id },
      data: {
        totalCalls: { increment: 1 },
        updatedAt: new Date()
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        consumed: true,
        usageLogId: usageLog.id,
        token: {
          id: updatedToken.id,
          tokenHash: updatedToken.tokenHash,
          usedAt: updatedToken.usedAt
        },
        api: {
          id: token.Api.id,
          name: token.Api.name,
          endpoint: token.Api.endpoint,
          method: token.Api.method
        },
        provider: {
          id: token.Provider.id,
          name: token.Provider.name,
          walletAddress: token.Provider.walletAddress
        }
      }
    });

  } catch (error) {
    console.error('Error consuming token:', error);

    // Handle race condition where token was already used
    if (error instanceof Error && error.message.includes('Record to update not found')) {
      return NextResponse.json(
        {
          success: false,
          error: 'Token was already used by another request'
        },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to consume token' },
      { status: 500 }
    );
  }
}