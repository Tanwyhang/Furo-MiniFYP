import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@/lib/generated/prisma/client';

const prisma = new PrismaClient();

// GET /api/providers/[id]/analytics - Get provider analytics
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || '30'; // days

    const days = parseInt(period);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Verify provider exists
    const provider = await prisma.provider.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        reputationScore: true,
        totalEarnings: true,
        totalCalls: true,
        isActive: true
      }
    });

    if (!provider) {
      return NextResponse.json(
        { success: false, error: 'Provider not found' },
        { status: 404 }
      );
    }

    // Get analytics data
    const [
      totalRevenue,
      recentPayments,
      totalTokensSold,
      activeTokens,
      apiPerformance,
      dailyStats,
      topApis
    ] = await Promise.all([
      // Total revenue from verified payments
      prisma.payment.aggregate({
        where: {
          providerId: id,
          isVerified: true
        },
        _sum: { amount: true },
        _count: { id: true }
      }),

      // Recent payments
      prisma.payment.findMany({
        where: {
          providerId: id,
          isVerified: true,
          createdAt: { gte: startDate }
        },
        take: 10,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          amount: true,
          currency: true,
          numberOfTokens: true,
          createdAt: true,
          Api: {
            select: {
              id: true,
              name: true
            }
          }
        }
      }),

      // Total tokens sold
      prisma.token.aggregate({
        where: {
          providerId: id,
          createdAt: { gte: startDate }
        },
        _count: { id: true }
      }),

      // Active unused tokens
      prisma.token.count({
        where: {
          providerId: id,
          isUsed: false,
          expiresAt: { gt: new Date() }
        }
      }),

      // API performance metrics
      prisma.api.findMany({
        where: { providerId: id },
        select: {
          id: true,
          name: true,
          category: true,
          totalCalls: true,
          averageResponseTime: true,
          uptime: true,
          totalRevenue: true,
          _count: {
            select: {
              Token: true,
              UsageLog: {
                where: {
                  createdAt: { gte: startDate }
                }
              },
              Review: true
            }
          }
        }
      }),

      // Daily usage statistics
      prisma.usageLog.groupBy({
        by: ['createdAt'],
        where: {
          providerId: id,
          createdAt: { gte: startDate }
        },
        _count: { id: true },
        _sum: { responseTime: true },
        orderBy: { createdAt: 'asc' }
      }),

      // Top performing APIs
      prisma.api.findMany({
        where: {
          providerId: id,
          isActive: true
        },
        orderBy: { totalCalls: 'desc' },
        take: 5,
        select: {
          id: true,
          name: true,
          category: true,
          totalCalls: true,
          averageResponseTime: true,
          uptime: true,
          totalRevenue: true,
          _count: {
            select: {
              Review: {
                where: { isVerified: true }
              }
            }
          }
        }
      })
    ]);

    // Calculate average rating
    const reviewStats = await prisma.review.aggregate({
      where: {
        Api: {
          providerId: id
        },
        isVerified: true
      },
      _avg: { rating: true },
      _count: { id: true }
    });

    const analytics = {
      provider: {
        ...provider,
        totalRevenue: totalRevenue._sum.amount || '0',
        totalPayments: totalRevenue._count
      },
      revenue: {
        total: totalRevenue._sum.amount || '0',
        recentPayments: recentPayments.length,
        recentRevenue: recentPayments.reduce((sum, payment) =>
          sum + BigInt(payment.amount), BigInt(0)
        ).toString()
      },
      tokens: {
        totalSold: totalTokensSold._count,
        activeUnsold: activeTokens
      },
      performance: {
        averageRating: reviewStats._avg.rating || 0,
        totalReviews: reviewStats._count,
        apis: apiPerformance.map(api => ({
          ...api,
          recentUsage: api._count.UsageLog,
          averageRating: api._count.Review > 0 ?
            (api._count.Review * 4.5) : 0 // Placeholder for actual rating calculation
        }))
      },
      usage: {
        dailyStats: dailyStats.map(stat => ({
          date: stat.createdAt,
          calls: stat._count.id,
          avgResponseTime: stat._sum.responseTime || 0
        })),
        totalApiCalls: apiPerformance.reduce((sum, api) => sum + api.totalCalls, 0)
      },
      topApis: topApis.map(api => ({
        ...api,
        averageRating: api._count.Review > 0 ? 4.5 : 0 // Placeholder
      }))
    };

    return NextResponse.json({
      success: true,
      data: analytics,
      meta: {
        period: `${days} days`,
        generatedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error fetching provider analytics:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch provider analytics' },
      { status: 500 }
    );
  }
}