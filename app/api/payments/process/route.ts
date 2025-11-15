import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@/lib/generated/prisma/client';
import { distributePaymentToProvider } from '@/lib/payment-distributor';

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
      network = 'sepolia'
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

    // Network-specific validation
    const supportedNetworks = ['sepolia', 'mainnet'];
    if (!supportedNetworks.includes(network)) {
      return NextResponse.json(
        {
          success: false,
          error: `Unsupported network: ${network}. Supported networks: ${supportedNetworks.join(', ')}`
        },
        { status: 400 }
      );
    }

    // TODO: In production, verify the transaction on-chain for the specific network
    // For now, we'll simulate successful verification with network awareness
    const isTransactionValid = true;
    const blockNumber = BigInt(Date.now());
    const blockTimestamp = new Date();

    // Log network-specific payment processing
    console.log(`🔗 Processing payment on ${network} network`);
    console.log(`📝 Transaction: ${transactionHash}`);
    console.log(`💰 Amount: ${paymentAmount} ${currency}`);

    if (!isTransactionValid) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid transaction: not found, wrong amount, or wrong recipient'
        },
        { status: 400 }
      );
    }

    // Calculate platform fees (3% commission)
    const platformFeePercentage = parseInt(process.env.PLATFORM_FEE_PERCENTAGE || '3');
    const paymentAmountBigInt = BigInt(paymentAmount);
    const platformFeeAmount = (paymentAmountBigInt * BigInt(platformFeePercentage)) / BigInt(100);
    const providerAmount = paymentAmountBigInt - platformFeeAmount;

    console.log(`💰 Payment breakdown:`);
    console.log(`  Total Payment: ${paymentAmountBigInt.toString()} ${currency}`);
    console.log(`  Platform Fee (${platformFeePercentage}%): ${platformFeeAmount.toString()} ${currency}`);
    console.log(`  Provider Amount: ${providerAmount.toString()} ${currency}`);

    // Calculate number of tokens based on provider amount (not total payment)
    const apiPrice = BigInt(api.pricePerCall);
    const numberOfTokens = Number(providerAmount / apiPrice);

    if (numberOfTokens === 0) {
      return NextResponse.json(
        {
          success: false,
          error: `Insufficient payment amount. Minimum: ${apiPrice.toString()} ${currency} for 1 token after platform fees`
        },
        { status: 400 }
      );
    }

    // Create payment record with fee breakdown
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
        updatedAt: new Date(),
        // Store fee breakdown in metadata (using JSON field if available)
        // Note: You might want to add dedicated columns to the schema
        ...(process.env.NODE_ENV === 'development' && {
          // For development, we'll log fees separately
          // In production, consider adding platformFeeAmount, providerAmount columns
        })
      }
    });

    // Log platform fee tracking
    console.log(`📊 Platform fee recorded:`);
    console.log(`  Payment ID: ${payment.id}`);
    console.log(`  Platform Fee: ${platformFeeAmount.toString()} ${currency}`);
    console.log(`  Provider Share: ${providerAmount.toString()} ${currency}`);

    console.log(`💰 Payment processed on ${network} network: ${transactionHash}`);

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

    // Update API total revenue (should only reflect provider's share, not total payment)
    const currentRevenue = BigInt(api.totalRevenue || '0');
    await prisma.api.update({
      where: { id: api.id },
      data: {
        totalRevenue: (currentRevenue + providerAmount).toString(),
        updatedAt: new Date()
      }
    });

    // Update provider total earnings (provider's share only)
    const currentEarnings = BigInt(api.Provider.totalEarnings || '0');
    await prisma.provider.update({
      where: { id: api.Provider.id },
      data: {
        totalEarnings: (currentEarnings + providerAmount).toString(),
        updatedAt: new Date()
      }
    });

    // Log platform fee accumulation (you may want to create a separate table for this)
    console.log(`💰 Platform fee accumulated: ${platformFeeAmount.toString()} ${currency}`);
    // TODO: Create platform revenue tracking table
    // await prisma.platformRevenue.create({
    //   data: {
    //     paymentId: payment.id,
    //     feeAmount: platformFeeAmount.toString(),
    //     currency: currency,
    //     percentage: platformFeePercentage
    //   }
    // });

    // Distribute payment to provider on-chain (provider's share only)
    console.log('💸 Initiating on-chain distribution to provider...');
    const distributionResult = await distributePaymentToProvider({
      paymentId: payment.id,
      providerId: api.Provider.id,
      totalAmount: providerAmount.toString(), // Only provider's share, not full payment
      currency: payment.currency,
      transactionHash: payment.transactionHash,
      network: network
    });

    const responseData = {
      payment: {
        id: payment.id,
        transactionHash: payment.transactionHash,
        amount: payment.amount,
        currency: payment.currency,
        numberOfTokens: payment.numberOfTokens,
        tokensIssued: payment.tokensIssued,
        verifiedAt: payment.createdAt,
        network: network // Include network in response
      },
      feeBreakdown: {
        totalAmount: paymentAmountBigInt.toString(),
        platformFee: {
          amount: platformFeeAmount.toString(),
          percentage: platformFeePercentage,
          currency: currency
        },
        providerShare: {
          amount: providerAmount.toString(),
          currency: currency
        }
      },
      tokens: tokens.map(token => ({
        id: token.id,
        tokenHash: token.tokenHash,
        expiresAt: token.expiresAt,
        network: network // Include network for each token
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
      },
      network: {
        name: network,
        supported: supportedNetworks.includes(network)
      }
    };

    // Include distribution information if successful
    if (distributionResult.success) {
      responseData.distribution = {
        success: true,
        distributionTxHash: distributionResult.distributionTxHash,
        providerAddress: distributionResult.providerAddress,
        amount: distributionResult.amount,
        distributedAt: new Date().toISOString()
      };
      console.log('✅ Payment distribution completed successfully');
    } else {
      // Even if distribution fails, the payment is still processed
      // Log the error but don't fail the entire payment processing
      console.error('⚠️ Payment distribution failed:', distributionResult.error);
      responseData.distribution = {
        success: false,
        error: distributionResult.error,
        willRetry: true
      };
    }

    return NextResponse.json({
      success: true,
      data: responseData
    }, { status: 201 });

  } catch (error) {
    console.error('Error processing payment:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process payment' },
      { status: 500 }
    );
  }
}