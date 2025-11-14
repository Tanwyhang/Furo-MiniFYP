import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@/lib/generated/prisma/client';

const prisma = new PrismaClient();

// GET /api/providers/[id] - Get a specific provider
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const provider = await prisma.provider.findUnique({
      where: { id },
      include: {
        Api: {
          where: { isActive: true },
          orderBy: { totalCalls: 'desc' },
          include: {
            _count: {
              select: {
                Payment: true,
                Token: true,
                UsageLog: true,
                Favorite: true,
                Review: true
              }
            },
            Review: {
              take: 3,
              orderBy: { helpfulCount: 'desc' },
              select: {
                id: true,
                reviewerAddress: true,
                rating: true,
                comment: true,
                helpfulCount: true,
                createdAt: true
              }
            }
          }
        },
        Payment: {
          take: 5,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            amount: true,
            currency: true,
            numberOfTokens: true,
            isVerified: true,
            createdAt: true
          }
        },
        _count: {
          select: {
            Api: true,
            Payment: true,
            Token: true,
            Favorite: true
          }
        }
      }
    });

    if (!provider) {
      return NextResponse.json(
        { success: false, error: 'Provider not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: provider
    });

  } catch (error) {
    console.error('Error fetching provider:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch provider' },
      { status: 500 }
    );
  }
}

// PUT /api/providers/[id] - Update a provider
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    const {
      name,
      description,
      website,
      avatarUrl,
      isActive
    } = body;

    // Check if provider exists
    const existingProvider = await prisma.provider.findUnique({
      where: { id }
    });

    if (!existingProvider) {
      return NextResponse.json(
        { success: false, error: 'Provider not found' },
        { status: 404 }
      );
    }

    // Update provider
    const updatedProvider = await prisma.provider.update({
      where: { id },
      data: {
        ...(name !== undefined && { name: name.trim() }),
        ...(description !== undefined && { description: description?.trim() || null }),
        ...(website !== undefined && { website: website?.trim() || null }),
        ...(avatarUrl !== undefined && { avatarUrl: avatarUrl?.trim() || null }),
        ...(isActive !== undefined && { isActive }),
        updatedAt: new Date()
      }
    });

    return NextResponse.json({
      success: true,
      data: updatedProvider
    });

  } catch (error) {
    console.error('Error updating provider:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update provider' },
      { status: 500 }
    );
  }
}

// DELETE /api/providers/[id] - Delete a provider
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // Check if provider exists
    const existingProvider = await prisma.provider.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            Api: true,
            Payment: true,
            Token: true
          }
        }
      }
    });

    if (!existingProvider) {
      return NextResponse.json(
        { success: false, error: 'Provider not found' },
        { status: 404 }
      );
    }

    // Soft delete by deactivating and marking APIs as inactive
    const deactivatedProvider = await prisma.provider.update({
      where: { id },
      data: {
        isActive: false,
        updatedAt: new Date(),
        Api: {
          updateMany: {
            where: { providerId: id },
            data: { isActive: false }
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Provider deactivated successfully',
      data: deactivatedProvider
    });

  } catch (error) {
    console.error('Error deactivating provider:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to deactivate provider' },
      { status: 500 }
    );
  }
}