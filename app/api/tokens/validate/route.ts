import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@/lib/generated/prisma/client';

const prisma = new PrismaClient();

// POST /api/tokens/validate - Validate a token for API access
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      tokenHash,
      apiId,
      developerAddress
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

    // Find the token
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

    // Check if token is already used
    if (token.isUsed) {
      return NextResponse.json(
        {
          success: false,
          error: 'Token has already been used',
          usedAt: token.usedAt
        },
        { status: 410 } // Gone
      );
    }

    // Check if token is expired
    if (token.expiresAt < new Date()) {
      return NextResponse.json(
        {
          success: false,
          error: 'Token has expired',
          expiredAt: token.expiresAt
        },
        { status: 410 } // Gone
      );
    }

    // Check if token is for the correct API
    if (token.apiId !== apiId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Token is not valid for this API'
        },
        { status: 403 }
      );
    }

    // Check if token belongs to the developer
    if (token.developerAddress.toLowerCase() !== developerAddress.toLowerCase()) {
      return NextResponse.json(
        {
          success: false,
          error: 'Token does not belong to this developer'
        },
        { status: 403 }
      );
    }

    // Check if API and provider are active
    if (!token.Api.isActive || !token.Api.Provider.isActive) {
      return NextResponse.json(
        {
          success: false,
          error: 'API or provider is inactive'
        },
        { status: 403 }
      );
    }

    // Token is valid - return validation success
    return NextResponse.json({
      success: true,
      data: {
        token: {
          id: token.id,
          tokenHash: token.tokenHash,
          apiId: token.apiId,
          providerId: token.providerId,
          expiresAt: token.expiresAt,
          isValid: true
        },
        api: {
          id: token.Api.id,
          name: token.Api.name,
          endpoint: token.Api.endpoint,
          method: token.Api.method,
          pricePerCall: token.Api.pricePerCall
        },
        provider: {
          id: token.Api.Provider.id,
          name: token.Api.Provider.name,
          walletAddress: token.Api.Provider.walletAddress
        },
        payment: {
          id: token.Payment.id,
          transactionHash: token.Payment.transactionHash,
          amount: token.Payment.amount,
          currency: token.Payment.currency
        }
      }
    });

  } catch (error) {
    console.error('Error validating token:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to validate token' },
      { status: 500 }
    );
  }
}