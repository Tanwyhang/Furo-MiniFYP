import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@/lib/generated/prisma/client';

const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ address: string }> }
) {
  try {
    const { address } = await params;

    if (!address) {
      return NextResponse.json(
        { success: false, error: 'Wallet address is required' },
        { status: 400 }
      );
    }

    const favorites = await prisma.favorite.findMany({
      where: {
        userId: address.toLowerCase(),
      },
      include: {
        Api: {
          include: {
            Provider: {
              select: {
                name: true,
                walletAddress: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Return just the API IDs for easy frontend usage
    const favoriteApiIds = favorites.map(fav => fav.apiId);
    const favoriteApis = favorites.map(fav => fav.Api);

    return NextResponse.json({
      success: true,
      data: {
        apiIds: favoriteApiIds,
        apis: favoriteApis,
      },
    });
  } catch (error) {
    console.error('Error fetching favorites:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch favorites' },
      { status: 500 }
    );
  }
}