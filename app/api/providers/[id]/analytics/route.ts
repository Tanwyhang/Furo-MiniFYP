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
      totalRevenueData,
      recentPayments,
      totalTokensSold,
      activeTokens,
      apiPerformance,
      dailyStats,
      topApis
    ] = await Promise.all([
      // Total revenue from verified payments - use findMany and calculate manually
      prisma.payment.findMany({
        where: {
          providerId: id,
          isVerified: true
        },
        select: {
          amount: true,
          numberOfTokens: true,
          tokensIssued: true,
          createdAt: true
        }
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
              UsageLog: true,
              Review: true
            }
          }
        }
      }),

      // Daily usage statistics - use findMany with relation to filter by provider
      prisma.usageLog.findMany({
        where: {
          Api: {
            providerId: id
          },
          createdAt: { gte: startDate }
        },
        select: {
          createdAt: true,
          responseTime: true,
          success: true
        },
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

    // Calculate total revenue from payments data
    const totalRevenue = totalRevenueData.reduce((sum, payment) => {
      return sum + BigInt(payment.amount || '0');
    }, BigInt(0));

    const totalPayments = totalRevenueData.length;

    // Calculate daily stats - group by date manually
    const dailyStatsMap = dailyStats.reduce((acc, log) => {
      const date = log.createdAt.toISOString().split('T')[0]; // YYYY-MM-DD format
      if (!acc[date]) {
        acc[date] = {
          date,
          calls: 0,
          totalResponseTime: 0,
          successfulCalls: 0
        };
      }
      acc[date].calls += 1;
      acc[date].totalResponseTime += log.responseTime || 0;
      if (log.success) {
        acc[date].successfulCalls += 1;
      }
      return acc;
    }, {} as Record<string, any>);

    const processedDailyStats = Object.values(dailyStatsMap).map((stat: any) => ({
      date: stat.date,
      calls: stat.calls,
      avgResponseTime: Math.round(stat.totalResponseTime / stat.calls),
      successRate: Math.round((stat.successfulCalls / stat.calls) * 100 * 100) / 100
    }));

    const analytics = {
      provider: {
        ...provider,
        totalRevenue: totalRevenue.toString(),
        totalPayments: totalPayments
      },
      revenue: {
        total: totalRevenue.toString(),
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
        dailyStats: processedDailyStats,
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