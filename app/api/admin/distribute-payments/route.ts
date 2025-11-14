import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@/lib/generated/prisma/client';
import { batchDistributePayments } from '@/lib/payment-distributor';

const prisma = new PrismaClient();

// POST /api/admin/distribute-payments - Process pending payment distributions
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { limit = 50, providerId } = body;

    console.log('🔄 Starting batch payment distribution...');

    // Find payments that haven't been distributed yet
    // For now, we'll process recent payments that don't have distribution records
    // TODO: Update this query once PaymentDistribution model is added to schema
    const whereCondition: any = {
      isVerified: true,
      createdAt: {
        gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
      }
    };

    if (providerId) {
      whereCondition.providerId = providerId;
    }

    const undistributedPayments = await prisma.payment.findMany({
      where: whereCondition,
      include: {
        Api: {
          select: {
            id: true,
            name: true
          }
        },
        Provider: {
          select: {
            id: true,
            name: true,
            walletAddress: true,
            isActive: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: limit
    });

    if (undistributedPayments.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No pending payments found for distribution',
        processed: 0,
        results: []
      });
    }

    console.log(`📋 Found ${undistributedPayments.length} payments to distribute`);

    // Prepare distribution requests
    const distributionRequests = undistributedPayments.map(payment => ({
      paymentId: payment.id,
      providerId: payment.Provider.id,
      totalAmount: payment.amount,
      currency: payment.currency,
      transactionHash: payment.transactionHash
    }));

    // Execute batch distribution
    const distributionResults = await batchDistributePayments(distributionRequests);

    // Process results
    const successful = distributionResults.filter(r => r.success);
    const failed = distributionResults.filter(r => !r.success);

    console.log(`📊 Batch distribution results: ${successful.length} successful, ${failed.length} failed`);

    // Return detailed results
    return NextResponse.json({
      success: true,
      message: `Processed ${distributionResults.length} payment distributions`,
      summary: {
        total: distributionResults.length,
        successful: successful.length,
        failed: failed.length,
        totalAmount: undistributedPayments.reduce((sum, p) => sum + BigInt(p.amount), BigInt(0)).toString()
      },
      results: undistributedPayments.map((payment, index) => ({
        paymentId: payment.id,
        providerName: payment.Provider.name,
        apiName: payment.Api.name,
        amount: payment.amount,
        currency: payment.currency,
        distribution: distributionResults[index]
      })),
      failedDistributions: failed.map((result, index) => ({
        paymentId: distributionRequests[distributionResults.indexOf(result)].paymentId,
        error: result.error
      }))
    }, { status: 200 });

  } catch (error) {
    console.error('Error in batch payment distribution:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to process batch payment distribution',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// GET /api/admin/distribute-payments - Get distribution status
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const providerId = searchParams.get('providerId');
    const limit = parseInt(searchParams.get('limit') || '100');

    console.log('📊 Fetching payment distribution status...');

    // Get recent payments with their distribution status
    const whereCondition: any = {
      isVerified: true,
      createdAt: {
        gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
      }
    };

    if (providerId) {
      whereCondition.providerId = providerId;
    }

    const recentPayments = await prisma.payment.findMany({
      where: whereCondition,
      include: {
        Api: {
          select: {
            id: true,
            name: true
          }
        },
        Provider: {
          select: {
            id: true,
            name: true,
            walletAddress: true
          }
        },
        _count: {
          select: {
            Token: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: limit
    });

    // Calculate totals
    const totalAmount = recentPayments.reduce((sum, p) => sum + BigInt(p.amount), BigInt(0));
    const totalTokensIssued = recentPayments.reduce((sum, p) => sum + p.tokensIssued, 0);

    return NextResponse.json({
      success: true,
      data: {
        summary: {
          totalPayments: recentPayments.length,
          totalAmount: totalAmount.toString(),
          totalTokensIssued,
          dateRange: {
            from: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
            to: new Date().toISOString()
          }
        },
        payments: recentPayments.map(payment => ({
          id: payment.id,
          providerName: payment.Provider.name,
          providerAddress: payment.Provider.walletAddress,
          apiName: payment.Api.name,
          amount: payment.amount,
          currency: payment.currency,
          numberOfTokens: payment.numberOfTokens,
          tokensIssued: payment.tokensIssued,
          transactionHash: payment.transactionHash,
          createdAt: payment.createdAt,
          // TODO: Add actual distribution status when PaymentDistribution model is implemented
          distributionStatus: 'unknown' // Would be 'completed', 'pending', or 'failed'
        }))
      }
    });

  } catch (error) {
    console.error('Error fetching distribution status:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch distribution status',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}