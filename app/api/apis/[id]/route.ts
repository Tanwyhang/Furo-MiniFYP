import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@/lib/generated/prisma/client';

const prisma = new PrismaClient();

// GET /api/apis/[id] - Get a specific API
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const api = await prisma.api.findUnique({
      where: { id },
      include: {
        Provider: {
          select: {
            id: true,
            name: true,
            walletAddress: true,
            reputationScore: true,
            totalEarnings: true,
            isActive: true,
            website: true,
            avatarUrl: true
          }
        },
        Review: {
          where: { isVerified: true },
          orderBy: { helpfulCount: 'desc' },
          include: {
            reviewer: {
              select: {
                name: true,
                avatarUrl: true
              }
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
            createdAt: true
          }
        },
        _count: {
          select: {
            Token: true,
            UsageLog: true,
            Favorite: true,
            Review: {
              where: { isVerified: true }
            }
          }
        }
      }
    });

    if (!api) {
      return NextResponse.json(
        { success: false, error: 'API not found' },
        { status: 404 }
      );
    }

    // Calculate average rating
    const averageRating = api.Review.length > 0
      ? api.Review.reduce((sum, review) => sum + review.rating, 0) / api.Review.length
      : 0;

    const responseData = {
      ...api,
      averageRating,
      reviewCount: api._count.Review
    };

    return NextResponse.json({
      success: true,
      data: responseData
    });

  } catch (error) {
    console.error('Error fetching API:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch API' },
      { status: 500 }
    );
  }
}

// PUT /api/apis/[id] - Update an API
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
      category,
      endpoint,
      method,
      pricePerCall,
      currency,
      documentation,
      headers,
      queryParams,
      isActive
    } = body;

    // Check if API exists
    const existingApi = await prisma.api.findUnique({
      where: { id },
      include: { Provider: true }
    });

    if (!existingApi) {
      return NextResponse.json(
        { success: false, error: 'API not found' },
        { status: 404 }
      );
    }

    // Validate endpoint URL format if provided
    if (endpoint) {
      try {
        new URL(endpoint);
      } catch {
        return NextResponse.json(
          { success: false, error: 'Invalid endpoint URL format' },
          { status: 400 }
        );
      }
    }

    // Update API
    const updatedApi = await prisma.api.update({
      where: { id },
      data: {
        ...(name !== undefined && { name: name.trim() }),
        ...(description !== undefined && { description: description?.trim() || '' }),
        ...(category !== undefined && { category: category?.trim() || 'General' }),
        ...(endpoint !== undefined && { endpoint: endpoint.trim() }),
        ...(method !== undefined && { method: method?.trim() || 'GET' }),
        ...(pricePerCall !== undefined && { pricePerCall: pricePerCall.toString() }),
        ...(currency !== undefined && { currency: currency?.trim() || 'ETH' }),
        ...(documentation !== undefined && { documentation: documentation || null }),
        ...(headers !== undefined && { headers: headers || null }),
        ...(queryParams !== undefined && { queryParams: queryParams || null }),
        ...(isActive !== undefined && { isActive }),
        updatedAt: new Date()
      },
      include: {
        Provider: {
          select: {
            id: true,
            name: true,
            walletAddress: true,
            reputationScore: true
          }
        }
      }
    });

    // Update provider's updatedAt timestamp
    await prisma.provider.update({
      where: { id: existingApi.Provider.id },
      data: { updatedAt: new Date() }
    });

    return NextResponse.json({
      success: true,
      data: updatedApi
    });

  } catch (error) {
    console.error('Error updating API:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update API' },
      { status: 500 }
    );
  }
}

// DELETE /api/apis/[id] - Delete an API
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // Check if API exists
    const existingApi = await prisma.api.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            Token: {
              where: { isUsed: false }
            },
            Payment: true,
            UsageLog: true
          }
        }
      }
    });

    if (!existingApi) {
      return NextResponse.json(
        { success: false, error: 'API not found' },
        { status: 404 }
      );
    }

    // Check if there are active tokens
    if (existingApi._count.Token > 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Cannot delete API with active tokens. Please deactivate the API instead.'
        },
        { status: 409 }
      );
    }

    // Soft delete by deactivating
    const deactivatedApi = await prisma.api.update({
      where: { id },
      data: {
        isActive: false,
        updatedAt: new Date()
      }
    });

    return NextResponse.json({
      success: true,
      message: 'API deactivated successfully',
      data: deactivatedApi
    });

  } catch (error) {
    console.error('Error deactivating API:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to deactivate API' },
      { status: 500 }
    );
  }
}