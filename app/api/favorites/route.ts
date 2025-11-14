import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@/lib/generated/prisma/client';

const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

export async function POST(request: NextRequest) {
  try {
    const { apiId, userAddress } = await request.json();

    if (!apiId || !userAddress) {
      return NextResponse.json(
        { success: false, error: 'API ID and user address are required' },
        { status: 400 }
      );
    }

    // Check if API exists
    const api = await prisma.api.findUnique({
      where: { id: apiId },
      include: { Provider: true },
    });

    if (!api) {
      return NextResponse.json(
        { success: false, error: 'API not found' },
        { status: 404 }
      );
    }

    // Check if already favorited
    const existingFavorite = await prisma.favorite.findUnique({
      where: {
        userId_apiId: {
          userId: userAddress.toLowerCase(),
          apiId,
        },
      },
    });

    if (existingFavorite) {
      return NextResponse.json(
        { success: false, error: 'API already favorited' },
        { status: 409 }
      );
    }

    // Create favorite
    const favorite = await prisma.favorite.create({
      data: {
        id: `fav_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
        userId: userAddress.toLowerCase(),
        apiId,
      },
      include: {
        Api: {
          include: {
            Provider: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: favorite,
    });
  } catch (error) {
    console.error('Error creating favorite:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : 'No stack trace',
      name: error instanceof Error ? error.name : 'Unknown error type'
    });
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create favorite',
        details: error instanceof Error ? error.stack : 'No details available'
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const apiId = searchParams.get('apiId');
    const userAddress = searchParams.get('userAddress');

    if (!apiId || !userAddress) {
      return NextResponse.json(
        { success: false, error: 'API ID and user address are required' },
        { status: 400 }
      );
    }

    // Delete favorite
    const favorite = await prisma.favorite.delete({
      where: {
        userId_apiId: {
          userId: userAddress.toLowerCase(),
          apiId,
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: favorite,
    });
  } catch (error) {
    console.error('Error deleting favorite:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete favorite' },
      { status: 500 }
    );
  }
}