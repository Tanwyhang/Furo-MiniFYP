import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@/lib/generated/prisma/client';
import { distributePaymentToProvider } from '@/lib/payment-distributor';

const prisma = new PrismaClient();

// POST /api/facilitator/settle - Settle payment to provider
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      paymentId,
      providerAddress,
      amount,
      currency = 'ETH',
      network = 'sepolia',
      // Settlement metadata
      sessionId,
      developerAddress,
      resourceId
    } = body;

    // Validation
    if (!paymentId || !providerAddress || !amount) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields: paymentId, providerAddress, amount'
        },
        { status: 400 }
      );
    }

    console.log(`💰 Initiating settlement for payment: ${paymentId}`);
    console.log(`📤 Provider: ${providerAddress}`);
    console.log(`💵 Amount: ${amount} ${currency} on ${network}`);

    // Verify payment exists and is verified
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        Api: {
          include: { Provider: true }
        }
      }
    });

    if (!payment) {
      return NextResponse.json(
        {
          success: false,
          error: 'Payment not found'
        },
        { status: 404 }
      );
    }

    if (!payment.isVerified) {
      return NextResponse.json(
        {
          success: false,
          error: 'Payment is not verified, cannot settle'
        },
        { status: 400 }
      );
    }

    // Check if already settled
    if (payment.tokensIssued > 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Payment already settled',
          tokensIssued: payment.tokensIssued
        },
        { status: 409 }
      );
    }

    // Initiate on-chain settlement to provider
    let settlementResult = { success: false, error: null, txHash: null };

    try {
      // Use existing payment distributor for on-chain settlement
      settlementResult = await distributePaymentToProvider({
        paymentId: payment.id,
        providerId: payment.Api.Provider.id,
        totalAmount: amount,
        currency: currency,
        transactionHash: payment.transactionHash,
        network: network
      });

      if (settlementResult.success) {
        console.log(`✅ Settlement successful: ${settlementResult.distributionTxHash}`);
      } else {
        console.error(`⚠️ Settlement failed: ${settlementResult.error}`);
      }

    } catch (error) {
      console.error('Settlement error:', error);
      settlementResult.error = error instanceof Error ? error.message : 'Settlement failed';
    }

    // Create settlement record
    const settlementRecord = {
      paymentId: payment.id,
      providerAddress,
      amount,
      currency,
      network,
      status: settlementResult.success ? 'completed' : 'failed',
      transactionHash: settlementResult.distributionTxHash || null,
      errorMessage: settlementResult.error || null,
      settledAt: settlementResult.success ? new Date() : null,
      metadata: {
        sessionId,
        developerAddress,
        resourceId,
        originalTransactionHash: payment.transactionHash
      }
    };

    // Log settlement attempt
    console.log('📊 Settlement record:', settlementRecord);

    // Return settlement result
    return NextResponse.json({
      success: settlementResult.success,
      settlement: settlementRecord,
      payment: {
        id: payment.id,
        transactionHash: payment.transactionHash,
        amount: payment.amount,
        currency: payment.currency,
        isVerified: payment.isVerified
      },
      provider: {
        id: payment.Api.Provider.id,
        name: payment.Api.Provider.name,
        walletAddress: payment.Api.Provider.walletAddress
      }
    });

  } catch (error) {
    console.error('Error in facilitator settlement:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error during settlement',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}