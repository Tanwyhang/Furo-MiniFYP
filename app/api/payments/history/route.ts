import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@/lib/generated/prisma/client';

const prisma = new PrismaClient();

// GET /api/payments/history - Get payment history for a developer
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const developerAddress = searchParams.get('developerAddress');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const status = searchParams.get('status'); // 'verified', 'pending', 'failed'

    if (!developerAddress) {
      return NextResponse.json(
        {
          success: false,
          error: 'Developer address is required'
        },
        { status: 400 }
      );
    }

    // Build where clause
    const where: any = {
      developerAddress: developerAddress.toLowerCase()
    };

    if (status === 'verified') {
      where.isVerified = true;
    } else if (status === 'pending') {
      where.isVerified = false;
      where.blockNumber = { not: null };
    } else if (status === 'failed') {
      where.isVerified = false;
      where.blockNumber = null;
    }

    // Get total count for pagination
    const total = await prisma.payment.count({ where });

    // Get transactions with API details
    const payments = await prisma.payment.findMany({
      where,
      include: {
        Api: {
          select: {
            id: true,
            name: true,
            category: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit
    });

    // Format transactions
    const transactions = payments.map(payment => ({
      id: payment.id,
      transactionHash: payment.transactionHash,
      amount: payment.amount,
      currency: payment.currency,
      numberOfTokens: payment.tokensIssued,
      isVerified: payment.isVerified,
      createdAt: payment.createdAt.toISOString(),
      blockNumber: payment.blockNumber,
      blockTimestamp: payment.blockTimestamp?.toISOString(),
      network: 'sepolia', // Default network, could be stored in payment
      apiId: payment.apiId,
      apiName: payment.Api?.name || 'Unknown API'
    }));

    return NextResponse.json({
      success: true,
      data: transactions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Error fetching payment history:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch payment history'
      },
      { status: 500 }
    );
  }
}