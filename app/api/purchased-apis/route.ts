import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@/lib/generated/prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const developerAddress = searchParams.get('developerAddress');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const status = searchParams.get('status'); // 'active', 'expired', 'all'

    if (!developerAddress) {
      return NextResponse.json(
        { success: false, error: 'Developer address is required' },
        { status: 400 }
      );
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Build where clause for status filtering
    let statusFilter = {};
    const now = new Date();

    if (status === 'active') {
      statusFilter = {
        tokens: {
          some: {
            isUsed: false,
            expiresAt: { gt: now }
          }
        }
      };
    } else if (status === 'expired') {
      statusFilter = {
        OR: [
          {
            tokens: {
              every: {
                OR: [
                  { isUsed: true },
                  { expiresAt: { lte: now } }
                ]
              }
            }
          },
          {
            tokens: {
              none: {}
            }
          }
        ]
      };
    }

    // Fetch payments with associated APIs and token information
    const [payments, total] = await Promise.all([
      prisma.payment.findMany({
        where: {
          developerAddress,
          isVerified: true,
          ...statusFilter,
        },
        include: {
          Api: {
            include: {
              Provider: {
                select: {
                  id: true,
                  name: true,
                  walletAddress: true,
                }
              }
            }
          },
          Token: {
            select: {
              id: true,
              tokenHash: true,
              isUsed: true,
              usedAt: true,
              expiresAt: true,
            }
          },
          _count: {
            select: {
              Token: {
                where: {
                  isUsed: false,
                  expiresAt: { gt: now }
                }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.payment.count({
        where: {
          developerAddress,
          isVerified: true,
          ...statusFilter,
        },
      }),
    ]);

    // Transform the data for better frontend consumption
    const purchasedAPIs = payments.map(payment => {
      const api = payment.Api;
      if (!api) return null;

      const activeTokens = payment.Token.filter(token => !token.isUsed && token.expiresAt > now);
      const usedTokens = payment.Token.filter(token => token.isUsed);
      const expiredTokens = payment.Token.filter(token => !token.isUsed && token.expiresAt <= now);

      return {
        id: payment.id,
        apiId: api.id,
        apiName: api.name,
        apiDescription: api.description,
        apiCategory: api.category,
        apiEndpoint: api.publicPath,
        pricePerCall: api.pricePerCall,
        currency: api.currency,
        provider: {
          id: api.Provider.id,
          name: api.Provider.name || 'Unknown Provider',
          walletAddress: api.Provider.walletAddress,
        },
        purchase: {
          transactionHash: payment.transactionHash,
          amountPaid: payment.amount,
          currency: payment.currency,
          tokensPurchased: payment.numberOfTokens,
          tokensIssued: payment.tokensIssued,
          purchasedAt: payment.createdAt,
          blockTimestamp: payment.blockTimestamp,
        },
        tokens: {
          total: payment.Token.length,
          active: activeTokens.length,
          used: usedTokens.length,
          expired: expiredTokens.length,
          available: payment._count.Token,
        },
        status: activeTokens.length > 0 ? 'active' : 'expired',
        expiresAt: activeTokens.length > 0 ?
          Math.max(...activeTokens.map(token => token.expiresAt.getTime())) : null,
      };
    }).filter(Boolean);

    // Calculate summary statistics
    const summary = {
      totalAPIsPurchased: purchasedAPIs.length,
      totalTokensPurchased: purchasedAPIs.reduce((sum, api) => sum + (api?.tokens.total || 0), 0),
      activeTokens: purchasedAPIs.reduce((sum, api) => sum + (api?.tokens.active || 0), 0),
      usedTokens: purchasedAPIs.reduce((sum, api) => sum + (api?.tokens.used || 0), 0),
      expiredTokens: purchasedAPIs.reduce((sum, api) => sum + (api?.tokens.expired || 0), 0),
      totalSpent: purchasedAPIs.reduce((sum, api) => sum + parseFloat(api?.purchase.amountPaid || '0'), 0),
      activeAPIs: purchasedAPIs.filter(api => api?.status === 'active').length,
    };

    return NextResponse.json({
      success: true,
      data: purchasedAPIs,
      summary,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });

  } catch (error) {
    console.error('Error fetching purchased APIs:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch purchased APIs' },
      { status: 500 }
    );
  }
}