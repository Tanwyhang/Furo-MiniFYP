import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@/lib/generated/prisma/client';

const prisma = new PrismaClient();

// GET /api/apis/[id]/analytics - Get API analytics
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

    // Verify API exists
    const api = await prisma.api.findUnique({
      where: { id },
      include: {
        Provider: {
          select: {
            id: true,
            name: true,
            walletAddress: true
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

    // Get analytics data
    const [
      totalRevenue,
      recentUsage,
      totalTokensSold,
      activeTokens,
      reviewStats,
      performanceMetrics,
      dailyStats,
      errorStats,
      topUsers
    ] = await Promise.all([
      // Total revenue from payments
      prisma.payment.aggregate({
        where: {
          apiId: id,
          isVerified: true
        },
        _sum: { amount: true },
        _count: { id: true }
      }),

      // Recent usage logs
      prisma.usageLog.findMany({
        where: {
          apiId: id,
          createdAt: { gte: startDate }
        },
        take: 100,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          responseStatus: true,
          responseTime: true,
          responseSize: true,
          success: true,
          createdAt: true,
          developerAddress: true
        }
      }),

      // Total tokens sold
      prisma.token.aggregate({
        where: {
          apiId: id,
          createdAt: { gte: startDate }
        },
        _count: { id: true }
      }),

      // Active unused tokens
      prisma.token.count({
        where: {
          apiId: id,
          isUsed: false,
          expiresAt: { gt: new Date() }
        }
      }),

      // Review statistics
      prisma.review.aggregate({
        where: {
          apiId: id,
          isVerified: true
        },
        _avg: { rating: true },
        _count: { id: true },
        _sum: { helpfulCount: true }
      }),

      // Performance metrics
      prisma.usageLog.aggregate({
        where: {
          apiId: id,
          createdAt: { gte: startDate }
        },
        _avg: { responseTime: true },
        _sum: { responseSize: true },
        _count: { id: true },
        where: {
          apiId: id,
          createdAt: { gte: startDate },
          success: true
        }
      }),

      // Daily usage statistics
      prisma.usageLog.groupBy({
        by: ['createdAt'],
        where: {
          apiId: id,
          createdAt: { gte: startDate }
        },
        _count: { id: true },
        _avg: { responseTime: true },
        _sum: { responseSize: true },
        orderBy: { createdAt: 'asc' }
      }),

      // Error statistics
      prisma.usageLog.groupBy({
        by: ['responseStatus'],
        where: {
          apiId: id,
          createdAt: { gte: startDate },
          success: false
        },
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } }
      }),

      // Top users by usage
      prisma.usageLog.groupBy({
        by: ['developerAddress'],
        where: {
          apiId: id,
          createdAt: { gte: startDate },
          success: true
        },
        _count: { id: true },
        _sum: { responseSize: true },
        orderBy: { _count: { id: 'desc' } },
        take: 10
      })
    ]);

    // Calculate success rate
    const totalRequests = await prisma.usageLog.count({
      where: {
        apiId: id,
        createdAt: { gte: startDate }
      }
    });

    const successfulRequests = await prisma.usageLog.count({
      where: {
        apiId: id,
        createdAt: { gte: startDate },
        success: true
      }
    });

    const successRate = totalRequests > 0 ? (successfulRequests / totalRequests) * 100 : 0;

    // Calculate error rate by status code
    const errorBreakdown = errorStats.map(stat => ({
      statusCode: stat.responseStatus,
      count: stat._count.id,
      percentage: totalRequests > 0 ? (stat._count.id / totalRequests) * 100 : 0
    }));

    // Process daily stats
    const dailyUsageStats = dailyStats.map(stat => ({
      date: stat.createdAt,
      requests: stat._count.id,
      avgResponseTime: Math.round(stat._avg.responseTime || 0),
      totalDataTransferred: stat._sum.responseSize || 0
    }));

    // Process recent usage for trends
    const hourlyUsage = recentUsage.reduce((acc, usage) => {
      const hour = new Date(usage.createdAt).getHours();
      acc[hour] = (acc[hour] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);

    const analytics = {
      api: {
        id: api.id,
        name: api.name,
        category: api.category,
        endpoint: api.endpoint,
        provider: api.Provider
      },
      revenue: {
        total: totalRevenue._sum.amount || '0',
        totalPayments: totalRevenue._count,
        totalTokensSold: totalTokensSold._count,
        activeTokens: activeTokens
      },
      performance: {
        averageResponseTime: Math.round(performanceMetrics._avg.responseTime || 0),
        successRate: Math.round(successRate * 100) / 100,
        totalRequests: totalRequests,
        successfulRequests: successfulRequests,
        totalDataTransferred: performanceMetrics._sum.responseSize || 0
      },
      reviews: {
        averageRating: Math.round((reviewStats._avg.rating || 0) * 100) / 100,
        totalReviews: reviewStats._count,
        totalHelpfulVotes: reviewStats._sum.helpfulCount || 0
      },
      usage: {
        dailyStats: dailyUsageStats,
        hourlyDistribution: Array.from({ length: 24 }, (_, hour) => ({
          hour,
          requests: hourlyUsage[hour] || 0
        })),
        recentActivity: recentUsage.slice(0, 10)
      },
      errors: {
        breakdown: errorBreakdown,
        totalErrors: totalRequests - successfulRequests,
        errorRate: Math.round((100 - successRate) * 100) / 100
      },
      topUsers: topUsers.map(user => ({
        address: user.developerAddress,
        requests: user._count.id,
        dataUsage: user._sum.responseSize || 0
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
    console.error('Error fetching API analytics:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch API analytics' },
      { status: 500 }
    );
  }
}