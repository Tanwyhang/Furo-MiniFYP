import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@/lib/generated/prisma/client';

const prisma = new PrismaClient();

// GET /api/providers/wallet/[address] - Get provider by wallet address
export async function GET(
  request: NextRequest,
  { params }: { params: { address: string } }
) {
  try {
    const { address } = params;

    if (!address || !address.startsWith('0x') || address.length !== 42) {
      return NextResponse.json(
        { success: false, error: 'Invalid wallet address format' },
        { status: 400 }
      );
    }

    const normalizedAddress = address.toLowerCase();

    const provider = await prisma.provider.findUnique({
      where: { walletAddress: normalizedAddress },
      include: {
        Api: {
          orderBy: { totalCalls: 'desc' },
          include: {
            _count: {
              select: {
                Payment: true,
                Token: true,
                UsageLog: true,
                Review: true
              }
            },
            Review: {
              take: 3,
              orderBy: { helpfulCount: 'desc' }
            }
          }
        },
        Payment: {
          take: 10,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            amount: true,
            currency: true,
            numberOfTokens: true,
            isVerified: true,
            createdAt: true,
            Api: {
              select: {
                id: true,
                name: true
              }
            }
          }
        },
        _count: {
          select: {
            Api: true,
            Payment: true,
            Token: true,
            Review: true
          }
        }
      }
    });

    if (!provider) {
      return NextResponse.json(
        { success: false, error: 'Provider not found for this wallet address' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: provider
    });

  } catch (error) {
    console.error('Error fetching provider by wallet:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch provider' },
      { status: 500 }
    );
  }
}