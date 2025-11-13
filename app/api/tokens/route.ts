import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@/lib/generated/prisma/client';

const prisma = new PrismaClient();

// GET /api/tokens - List tokens (for debugging)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');

    const tokens = await prisma.token.findMany({
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        Api: {
          select: {
            id: true,
            name: true,
            endpoint: true
          }
        },
        Payment: {
          select: {
            id: true,
            transactionHash: true,
            amount: true,
            currency: true
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      data: tokens,
      count: tokens.length
    });

  } catch (error) {
    console.error('Error fetching tokens:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch tokens' },
      { status: 500 }
    );
  }
}