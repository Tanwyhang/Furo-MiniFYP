import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@/lib/generated/prisma/client';

const prisma = new PrismaClient();

// GET /api/apis - List all APIs
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const category = searchParams.get('category') || '';
    const isActive = searchParams.get('isActive');
    const providerId = searchParams.get('providerId');
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');
    const sortBy = searchParams.get('sortBy') || 'totalCalls';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    const skip = (page - 1) * limit;

    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { category: { contains: search, mode: 'insensitive' } }
      ];
    }

    if (category) {
      where.category = { contains: category, mode: 'insensitive' };
    }

    if (isActive !== null) {
      where.isActive = isActive === 'true';
    }

    if (providerId) {
      where.providerId = providerId;
    }

    if (minPrice || maxPrice) {
      where.pricePerCall = {};
      if (minPrice) where.pricePerCall.gte = minPrice;
      if (maxPrice) where.pricePerCall.lte = maxPrice;
    }

    const orderBy: any = {};
    orderBy[sortBy] = sortOrder;

    const [apis, total] = await Promise.all([
      prisma.api.findMany({
        where,
        skip,
        take: limit,
        include: {
          Provider: {
            select: {
              id: true,
              name: true,
              walletAddress: true,
              reputationScore: true,
              isActive: true
            }
          },
          _count: {
            select: {
              Payment: true,
              Token: true,
              UsageLog: {
                where: {
                  createdAt: {
                    gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
                  }
                }
              },
                            Review: {
                where: { isVerified: true }
              }
            }
          },
          Review: {
            where: { isVerified: true },
            take: 3,
            select: {
              id: true,
              rating: true,
              comment: true,
              createdAt: true,
              reviewerAddress: true
            }
          }
        },
        orderBy: [orderBy, { createdAt: 'desc' }]
      }),
      prisma.api.count({ where })
    ]);

    // Calculate average rating for each API
    const apisWithRatings = apis.map(api => ({
      ...api,
      averageRating: api.Review.length > 0
        ? api.Review.reduce((sum, review) => sum + review.rating, 0) / api.Review.length
        : 0,
      reviewCount: api._count.Review
    }));

    // Get favorite counts for all APIs
    const favoriteCounts = await prisma.favorite.groupBy({
      by: ['apiId'],
      _count: {
        id: true
      },
      where: {
        apiId: {
          in: apisWithRatings.map(api => api.id)
        }
      }
    });

    // Create a map of API ID to favorite count
    const favoriteCountMap = favoriteCounts.reduce((acc, item) => {
      acc[item.apiId] = item._count.id;
      return acc;
    }, {} as Record<string, number>);

    // Add favorite counts to APIs
    const apisWithFavorites = apisWithRatings.map(api => ({
      ...api,
      favoriteCount: favoriteCountMap[api.id] || 0
    }));

    return NextResponse.json({
      success: true,
      data: apisWithFavorites,
      meta: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1
      }
    });

  } catch (error) {
    console.error('Error fetching APIs:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch APIs' },
      { status: 500 }
    );
  }
}

// POST /api/apis - Create a new API
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      providerId,
      name,
      description,
      category,
      endpoint,
      publicPath,
      method,
      pricePerCall,
      currency,
      documentation,
      headers,
      queryParams,
      // Double relay fields
      internalEndpoint,
      internalAuth,
      relayConfiguration,
      isDirectRelay,
      fallbackEndpoint
    } = body;

    // Validation
    if (!providerId || !name || !endpoint || !publicPath || !pricePerCall) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields: providerId, name, endpoint, publicPath, and pricePerCall are required'
        },
        { status: 400 }
      );
    }

    // Verify provider exists and is active
    const provider = await prisma.provider.findUnique({
      where: { id: providerId }
    });

    if (!provider || !provider.isActive) {
      return NextResponse.json(
        { success: false, error: 'Provider not found or inactive' },
        { status: 404 }
      );
    }

    // Check if publicPath already exists
    const existingApi = await prisma.api.findUnique({
      where: { publicPath }
    });

    if (existingApi) {
      return NextResponse.json(
        { success: false, error: 'API with this public path already exists' },
        { status: 409 }
      );
    }

    // Validate endpoint URL format
    try {
      new URL(endpoint);
    } catch {
      return NextResponse.json(
        { success: false, error: 'Invalid endpoint URL format' },
        { status: 400 }
      );
    }

    // Create API
    const api = await prisma.api.create({
      data: {
        id: `api_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
        providerId,
        name: name.trim(),
        description: description?.trim() || '',
        category: category?.trim() || 'General',
        endpoint: endpoint.trim(),
        publicPath: publicPath.trim(),
        method: method?.trim() || 'GET',
        pricePerCall: pricePerCall.toString(),
        currency: currency?.trim() || 'ETH',
        documentation: documentation || null,
        headers: headers || null,
        queryParams: queryParams || null,
        isActive: true,
        totalCalls: 0,
        totalRevenue: '0',
        averageResponseTime: 0,
        uptime: 100.0,
        // Double relay fields
        internalEndpoint: internalEndpoint?.trim() || null,
        internalAuth: internalAuth || null,
        relayConfiguration: relayConfiguration || null,
        isDirectRelay: isDirectRelay !== undefined ? isDirectRelay : false,
        fallbackEndpoint: fallbackEndpoint?.trim() || null,
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
      where: { id: providerId },
      data: { updatedAt: new Date() }
    });

    return NextResponse.json({
      success: true,
      data: api
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating API:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create API' },
      { status: 500 }
    );
  }
}