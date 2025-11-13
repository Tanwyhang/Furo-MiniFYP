import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@/lib/generated/prisma/client';

const prisma = new PrismaClient();

// GET /api/apis/public/[path] - Get API by public path
export async function GET(
  request: NextRequest,
  { params }: { params: { path: string } }
) {
  try {
    const { path } = await params;

    if (!path) {
      return NextResponse.json(
        { success: false, error: 'Public path is required' },
        { status: 400 }
      );
    }

    const publicPath = path.startsWith('/') ? path : `/${path}`;

    const api = await prisma.api.findUnique({
      where: { publicPath },
      include: {
        Provider: {
          select: {
            id: true,
            name: true,
            walletAddress: true,
            reputationScore: true,
            isActive: true,
            avatarUrl: true,
            website: true
          }
        },
        Review: {
          where: { isVerified: true },
          take: 5,
          orderBy: { helpfulCount: 'desc' },
          select: {
            id: true,
            rating: true,
            comment: true,
            helpfulCount: true,
            createdAt: true,
            reviewerAddress: true
          }
        },
        _count: {
          select: {
            Token: true,
            UsageLog: {
              where: {
                createdAt: {
                  gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
                }
              }
            },
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
        { success: false, error: 'API not found for this public path' },
        { status: 404 }
      );
    }

    if (!api.isActive || !api.Provider.isActive) {
      return NextResponse.json(
        { success: false, error: 'API is currently inactive' },
        { status: 403 }
      );
    }

    // Calculate average rating and recent usage
    const averageRating = api.Review.length > 0
      ? api.Review.reduce((sum, review) => sum + review.rating, 0) / api.Review.length
      : 0;

    // Get usage statistics
    const [recentUsage, errorRate] = await Promise.all([
      prisma.usageLog.aggregate({
        where: {
          apiId: api.id,
          createdAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
          },
          success: true
        },
        _count: { id: true },
        _avg: { responseTime: true }
      }),
      prisma.usageLog.aggregate({
        where: {
          apiId: api.id,
          createdAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
          },
          success: false
        },
        _count: { id: true }
      })
    ]);

    const totalRecentRequests = recentUsage._count.id + errorRate._count.id;
    const successRate = totalRecentRequests > 0
      ? (recentUsage._count.id / totalRecentRequests) * 100
      : api.uptime;

    const responseData = {
      id: api.id,
      name: api.name,
      description: api.description,
      category: api.category,
      method: api.method,
      pricePerCall: api.pricePerCall,
      currency: api.currency,
      documentation: api.documentation,
      provider: api.Provider,
      performance: {
        averageResponseTime: Math.round(recentUsage._avg.responseTime || api.averageResponseTime),
        uptime: Math.round(successRate * 100) / 100,
        totalCalls: api.totalCalls,
        recentCalls: totalRecentRequests
      },
      engagement: {
        averageRating: Math.round(averageRating * 100) / 100,
        reviewCount: api._count.Review,
        favoriteCount: api._count.Favorite,
        activeTokens: api._count.Token
      },
      reviews: api.Review.slice(0, 3), // Return only top 3 reviews
      createdAt: api.createdAt
    };

    return NextResponse.json({
      success: true,
      data: responseData
    });

  } catch (error) {
    console.error('Error fetching API by public path:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch API' },
      { status: 500 }
    );
  }
}