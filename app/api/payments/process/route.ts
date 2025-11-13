import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@/lib/generated/prisma/client';

const prisma = new PrismaClient();

// POST /api/payments/process - Process payment and issue tokens
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      transactionHash,
      apiId,
      developerAddress,
      paymentAmount,
      currency = 'ETH',
      network = 'base-sepolia'
    } = body;

    // Validation
    if (!transactionHash || !apiId || !developerAddress || !paymentAmount) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields: transactionHash, apiId, developerAddress, and paymentAmount are required'
        },
        { status: 400 }
      );
    }

    // Check if payment already processed
    const existingPayment = await prisma.payment.findUnique({
      where: { transactionHash }
    });

    if (existingPayment) {
      return NextResponse.json(
        {
          success: false,
          error: 'Transaction already processed',
          paymentId: existingPayment.id,
          tokensIssued: existingPayment.tokensIssued
        },
        { status: 409 }
      );
    }

    // Verify API exists and is active
    const api = await prisma.api.findUnique({
      where: { id: apiId },
      include: { Provider: true }
    });

    if (!api || !api.isActive) {
      return NextResponse.json(
        { success: false, error: 'API not found or inactive' },
        { status: 404 }
      );
    }

    // Verify provider is active
    if (!api.Provider.isActive) {
      return NextResponse.json(
        { success: false, error: 'Provider is inactive' },
        { status: 403 }
      );
    }

    // TODO: In production, verify the transaction on-chain
    // For now, we'll simulate successful verification
    const isTransactionValid = true;
    const blockNumber = BigInt(Date.now());
    const blockTimestamp = new Date();

    if (!isTransactionValid) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid transaction: not found, wrong amount, or wrong recipient'
        },
        { status: 400 }
      );
    }

    // Calculate number of tokens based on amount and API price
    const apiPrice = BigInt(api.pricePerCall);
    const paymentAmountBigInt = BigInt(paymentAmount);
    const numberOfTokens = Number(paymentAmountBigInt / apiPrice);

    if (numberOfTokens === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Insufficient payment amount'
        },
        { status: 400 }
      );
    }

    // Create payment record
    const payment = await prisma.payment.create({
      data: {
        id: `payment_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
        providerId: api.Provider.id,
        apiId: api.id,
        developerAddress: developerAddress.toLowerCase(),
        transactionHash,
        amount: paymentAmountBigInt.toString(),
        currency,
        numberOfTokens,
        tokensIssued: 0, // Will be updated after tokens are created
        isVerified: true,
        isReplay: false,
        blockNumber,
        blockTimestamp,
        updatedAt: new Date()
      }
    });

    // Create single-use tokens
    const tokens = [];
    const tokenExpiryHours = 24; // Tokens expire in 24 hours

    for (let i = 0; i < numberOfTokens; i++) {
      const token = await prisma.token.create({
        data: {
          id: `token_${Date.now()}_${Math.random().toString(36).substring(2, 8)}_${i}`,
          paymentId: payment.id,
          apiId: api.id,
          providerId: api.Provider.id,
          developerAddress: developerAddress.toLowerCase(),
          tokenHash: `tkn_${Date.now()}_${Math.random().toString(36).substring(2, 8)}_${i}`,
          isUsed: false,
          expiresAt: new Date(Date.now() + tokenExpiryHours * 60 * 60 * 1000),
          lastValidAfter: new Date()
        }
      });
      tokens.push(token);
    }

    // Update payment with tokens issued count
    await prisma.payment.update({
      where: { id: payment.id },
      data: { tokensIssued: tokens.length }
    });

    // Update API total revenue
    const currentRevenue = BigInt(api.totalRevenue || '0');
    await prisma.api.update({
      where: { id: api.id },
      data: {
        totalRevenue: (currentRevenue + paymentAmountBigInt).toString(),
        updatedAt: new Date()
      }
    });

    // Update provider total earnings
    const currentEarnings = BigInt(api.Provider.totalEarnings || '0');
    await prisma.provider.update({
      where: { id: api.Provider.id },
      data: {
        totalEarnings: (currentEarnings + paymentAmountBigInt).toString(),
        updatedAt: new Date()
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        payment: {
          id: payment.id,
          transactionHash: payment.transactionHash,
          amount: payment.amount,
          currency: payment.currency,
          numberOfTokens: payment.numberOfTokens,
          tokensIssued: payment.tokensIssued,
          verifiedAt: payment.createdAt
        },
        tokens: tokens.map(token => ({
          id: token.id,
          tokenHash: token.tokenHash,
          expiresAt: token.expiresAt
        })),
        api: {
          id: api.id,
          name: api.name,
          pricePerCall: api.pricePerCall,
          currency: api.currency
        },
        provider: {
          id: api.Provider.id,
          name: api.Provider.name,
          walletAddress: api.Provider.walletAddress
        }
      }
    }, { status: 201 });

  } catch (error) {
    console.error('Error processing payment:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process payment' },
      { status: 500 }
    );
  }
}