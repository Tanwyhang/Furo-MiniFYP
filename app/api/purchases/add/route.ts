import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@/lib/generated/prisma/client';
import { consumeTokenWithX402 } from '@/lib/x402';

const prisma = new PrismaClient();

// POST /api/purchases/add - Add API to user's purchased list after payment
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      apiId,
      transactionHash,
      developerAddress
    } = body;

    if (!apiId || !transactionHash || !developerAddress) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields: apiId, transactionHash, developerAddress'
        },
        { status: 400 }
      );
    }

    // Step 1: Verify payment and get tokens
    const paymentVerificationResponse = await fetch(`${process.env.NEXT_PUBLIC_URL}/api/payments/process`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        transactionHash,
        apiId,
        developerAddress,
        paymentAmount: '0', // We'll get this from the existing payment record
        currency: 'ETH',
        network: 'sepolia'
      })
    });

    const paymentData = await paymentVerificationResponse.json();

    if (!paymentData.success || !paymentData.data.tokens || paymentData.data.tokens.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Payment verification failed or no tokens available'
        },
        { status: 400 }
      );
    }

    // Step 2: Get API details
    const api = await prisma.api.findUnique({
      where: { id: apiId },
      include: { Provider: true }
    });

    if (!api || !api.isActive) {
      return NextResponse.json(
        {
          success: false,
          error: 'API not found or inactive'
        },
        { status: 404 }
      );
    }

    // Step 3: Create purchased API record
    const purchasedApi = await prisma.purchasedApi.create({
      data: {
        id: `purchase_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
        apiId: api.id,
        developerAddress: developerAddress.toLowerCase(),
        providerId: api.Provider.id,
        transactionHash,
        paymentAmount: api.pricePerCall,
        status: 'ACTIVE',
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        createdAt: new Date()
      }
    });

    // Step 4: Get the first available token
    const firstToken = paymentData.data.tokens[0];

    // Step 5: Return success response with public endpoint info
    return NextResponse.json({
      success: true,
      data: {
        purchasedApi,
        publicEndpoint: api.publicPath, // The public path for the API
        tokenHash: firstToken.tokenHash,
        apiName: api.name,
        pricePerCall: api.pricePerCall,
        expiresAt: purchasedApi.expiresAt
      }
    });

  } catch (error) {
    console.error('Error adding purchased API:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to add purchased API'
      },
      { status: 500 }
    );
  }
}

// GET /api/purchases/add - List purchased APIs for a developer
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const developerAddress = searchParams.get('developerAddress');

    if (!developerAddress) {
      return NextResponse.json(
        {
          success: false,
          error: 'Developer address is required'
        },
        { status: 400 }
      );
    }

    const purchasedApis = await prisma.purchasedApi.findMany({
      where: {
        developerAddress: developerAddress.toLowerCase(),
        status: 'ACTIVE',
        expiresAt: { gt: new Date() }
      },
      include: {
        Api: {
          include: {
            Provider: {
              select: {
                id: true,
                name: true,
                walletAddress: true
              }
            }
          }
        },
        Payment: true
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({
      success: true,
      data: purchasedApis,
      count: purchasedApis.length
    });

  } catch (error) {
    console.error('Error fetching purchased APIs:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch purchased APIs'
      },
      { status: 500 }
    );
  }
}