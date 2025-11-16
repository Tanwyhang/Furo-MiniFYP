import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@/lib/generated/prisma/client';
import { distributePaymentToProvider } from '@/lib/payment-distributor';
import { formatEther } from 'viem';
import { createPublicClient, http } from 'viem';

const prisma = new PrismaClient();

// Network configuration for public clients
function getPublicClient(network: string) {
  switch (network.toLowerCase()) {
    case 'mainnet':
      return createPublicClient({
        chain: {
          id: 1,
          name: 'Ethereum',
          nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
          rpcUrls: {
            default: { http: ['https://mainnet.infura.io/v3/' + process.env.NEXT_PUBLIC_INFURA_ID] },
            public: { http: ['https://eth-mainnet.g.alchemy.com/v2/' + process.env.NEXT_PUBLIC_ALCHEMY_ID] }
          }
        },
        transport: http()
      });
    case 'sepolia':
      return createPublicClient({
        chain: {
          id: 11155111,
          name: 'Sepolia',
          nativeCurrency: { name: 'Sepolia Ether', symbol: 'ETH', decimals: 18 },
          rpcUrls: {
            default: { http: ['https://sepolia.infura.io/v3/' + process.env.NEXT_PUBLIC_INFURA_ID] },
            public: { http: ['https://eth-sepolia.g.alchemy.com/v2/' + process.env.NEXT_PUBLIC_ALCHEMY_ID] }
          }
        },
        transport: http()
      });
    case 'polygon':
      return createPublicClient({
        chain: {
          id: 137,
          name: 'Polygon',
          nativeCurrency: { name: 'MATIC', symbol: 'MATIC', decimals: 18 },
          rpcUrls: {
            default: { http: ['https://polygon-mainnet.infura.io/v3/' + process.env.NEXT_PUBLIC_INFURA_ID] },
            public: { http: ['https://polygon-mainnet.g.alchemy.com/v2/' + process.env.NEXT_PUBLIC_ALCHEMY_ID] }
          }
        },
        transport: http()
      });
    case 'base':
      return createPublicClient({
        chain: {
          id: 8453,
          name: 'Base',
          nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
          rpcUrls: {
            default: { http: ['https://mainnet.base.org'] },
            public: { http: ['https://mainnet.base.org'] }
          }
        },
        transport: http()
      });
    case 'base-sepolia':
      return createPublicClient({
        chain: {
          id: 84532,
          name: 'Base Sepolia',
          nativeCurrency: { name: 'Sepolia Ether', symbol: 'ETH', decimals: 18 },
          rpcUrls: {
            default: { http: ['https://sepolia.base.org'] },
            public: { http: ['https://sepolia.base.org'] }
          }
        },
        transport: http()
      });
    default:
      throw new Error(`Unsupported network: ${network}`);
  }
}

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

    // P2P Direct Model - Always go to provider wallet
    const expectedRecipient = existingPayment.provider.walletAddress;

    // Real on-chain transaction verification
    console.log(`🔗 Verifying P2P transaction on ${network} network`);
    console.log(`📝 Transaction: ${transactionHash}`);
    console.log(`💰 Payment Amount: ${formatEther(BigInt(paymentAmount))} ${currency}`);
    console.log(`📍 Expected Recipient: ${expectedRecipient}`);
    console.log(`💳 Payment Model: P2P Direct (Zero Fees, 100% to Provider)`);

    let transactionDetails = null;
    let isTransactionValid = false;
    let blockNumber: bigint | null = null;
    let blockTimestamp: Date | null = null;

    try {
      // Get public client for the network
      const publicClient = getPublicClient(network);

      if (!publicClient) {
        throw new Error(`No public client available for network: ${network}`);
      }

      // Get transaction details
      const transaction = await publicClient.getTransaction({ hash: transactionHash as `0x${string}` });

      if (!transaction) {
        throw new Error('Transaction not found on blockchain');
      }

      // Get transaction receipt
      const receipt = await publicClient.getTransactionReceipt({ hash: transactionHash as `0x${string}` });

      if (!receipt) {
        throw new Error('Transaction receipt not found');
      }

      // Verify transaction details
      const actualRecipient = transaction.to?.toLowerCase();
      const expectedRecipientAddress = expectedRecipient.toLowerCase();
      const actualAmount = transaction.value;
      const expectedAmount = BigInt(paymentAmount);

      // Validate recipient
      if (actualRecipient !== expectedRecipientAddress) {
        throw new Error(`Invalid recipient. Expected: ${expectedRecipientAddress}, Got: ${actualRecipient}`);
      }

      // Validate amount
      if (actualAmount < expectedAmount) {
        throw new Error(`Insufficient amount. Expected: ${formatEther(expectedAmount)}, Got: ${formatEther(actualAmount)}`);
      }

      // Validate transaction status
      if (receipt.status !== 'success') {
        throw new Error('Transaction failed on blockchain');
      }

      // All validations passed
      isTransactionValid = true;
      blockNumber = receipt.blockNumber;
      blockTimestamp = new Date(); // We could get actual block timestamp, but this is sufficient

      transactionDetails = {
        hash: transactionHash,
        from: transaction.from,
        to: transaction.to,
        amount: transaction.value.toString(),
        blockNumber: blockNumber?.toString(),
        status: receipt.status,
        gasUsed: receipt.gasUsed.toString()
      };

      console.log('✅ Transaction verified successfully:', {
        from: transaction.from,
        to: transaction.to,
        amount: formatEther(transaction.value),
        blockNumber: blockNumber?.toString(),
        status: receipt.status
      });

    } catch (verificationError: any) {
      console.error('❌ Transaction verification failed:', verificationError.message);

      return NextResponse.json(
        {
          success: false,
          error: `Transaction verification failed: ${verificationError.message}`
        },
        { status: 400 }
      );
    }

    if (!isTransactionValid) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid transaction: verification failed'
        },
        { status: 400 }
      );
    }

    // P2P Direct Model - Zero Platform Fees!
    const platformFeePercentage = 0; // P2P means no platform fees
    const paymentAmountBigInt = BigInt(paymentAmount);
    const platformFeeAmount = BigInt(0); // Zero fees
    const providerAmount = paymentAmountBigInt; // 100% to provider!

    console.log(`💰 P2P Payment breakdown:`);
    console.log(`  Total Payment: ${formatEther(paymentAmountBigInt)} ${currency}`);
    console.log(`  Platform Fee (0%): ${formatEther(platformFeeAmount)} ${currency} ✨`);
    console.log(`  Provider Amount (100%): ${formatEther(providerAmount)} ${currency} ✅`);

    // Calculate number of tokens based on full payment amount (no fees!)
    const apiPrice = BigInt(api.pricePerCall);
    const numberOfTokens = Number(paymentAmountBigInt / apiPrice);

    if (numberOfTokens === 0) {
      return NextResponse.json(
        {
          success: false,
          error: `Insufficient payment amount. Minimum: ${apiPrice.toString()} ${currency} for 1 token after platform fees`
        },
        { status: 400 }
      );
    }

    // Payment model is already validated above - FURO aggregator or direct provider
    // The expectedRecipient is already set correctly based on FURO wallet configuration

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
        isVerified: isTransactionValid, // Based on real blockchain verification
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

    console.log(`🎉 P2P Payment processed on ${network} network: ${transactionHash}`);
    console.log(`✅ Provider receives 100% of payment directly!`);

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

    // Update API total revenue (full payment - P2P direct!)
    const currentRevenue = BigInt(api.totalRevenue || '0');
    await prisma.api.update({
      where: { id: api.id },
      data: {
        totalRevenue: (currentRevenue + paymentAmountBigInt).toString(), // Full amount!
        updatedAt: new Date()
      }
    });

    // Update provider total earnings (full payment - P2P direct!)
    const currentEarnings = BigInt(api.Provider.totalEarnings || '0');
    await prisma.provider.update({
      where: { id: api.Provider.id },
      data: {
        totalEarnings: (currentEarnings + paymentAmountBigInt).toString(), // Full amount!
        updatedAt: new Date()
      }
    });

    console.log(`💰 Provider earnings updated: +${formatEther(paymentAmountBigInt)} ${currency}`);
    console.log(`🎊 P2P Model: No platform fees, 100% direct payment!`);

    // No distribution needed - provider received payment directly!
    // P2P means no FURO intermediary transactions
    console.log(`✅ No distribution needed - P2P direct payment complete!`);

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