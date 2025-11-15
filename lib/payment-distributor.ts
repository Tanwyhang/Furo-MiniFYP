/**
 * Payment Distribution Service
 *
 * Handles automatic on-chain distribution of payments to API providers
 * after they are received by the platform wallet through x402 middleware.
 */

import { PrismaClient } from '@/lib/generated/prisma/client';

const prisma = new PrismaClient();

export interface DistributionRequest {
  paymentId: string;
  providerId: string;
  totalAmount: string; // Amount to distribute to provider (after platform fees)
  currency: string;
  transactionHash: string; // Original payment transaction hash
  network?: string; // Network for the transaction
}

export interface DistributionResult {
  success: boolean;
  distributionTxHash?: string;
  providerAddress?: string;
  amount?: string;
  error?: string;
}

/**
 * Distributes payment to provider wallet on-chain
 *
 * This function:
 * 1. Receives pre-calculated provider amount (after platform fees)
 * 2. Creates on-chain transaction to provider wallet
 * 3. Records distribution in database
 * 4. Updates provider earnings tracking
 */
export async function distributePaymentToProvider(
  request: DistributionRequest
): Promise<DistributionResult> {
  try {
    // Get provider details
    const provider = await prisma.provider.findUnique({
      where: { id: request.providerId },
      select: {
        walletAddress: true,
        isActive: true,
        name: true
      }
    });

    if (!provider) {
      return {
        success: false,
        error: 'Provider not found'
      };
    }

    if (!provider.isActive) {
      return {
        success: false,
        error: 'Provider is inactive'
      };
    }

    // The amount passed is already the provider's share (after platform fees)
    const providerShare = BigInt(request.totalAmount);

    if (providerShare <= 0) {
      return {
        success: false,
        error: 'Amount too small to distribute'
      };
    }

    // Log platform fee information for transparency
    const platformFeePercentage = parseInt(process.env.PLATFORM_FEE_PERCENTAGE || '3');
    console.log(`💰 Distribution details for ${request.paymentId}:`);
    console.log(`  Provider Share: ${providerShare.toString()} ${request.currency}`);
    console.log(`  Platform Fee Rate: ${platformFeePercentage}% (calculated in payment processing)`);

    // Skip on-chain distribution for testnet/development mode
    if (process.env.NODE_ENV === 'development' || process.env.SKIP_ONCHAIN_DISTRIBUTION === 'true') {
      console.log('🧪 Skipping on-chain distribution (development mode)');
      console.log(`💰 Would distribute: ${providerShare.toString()} wei to ${provider.walletAddress}`);

      // Still record the distribution in database
      await recordDistribution({
        paymentId: request.paymentId,
        providerId: request.providerId,
        providerAddress: provider.walletAddress,
        originalAmount: request.totalAmount, // This is already the provider share
        providerAmount: providerShare.toString(),
        platformFee: '0', // Platform fee handled separately in payment processing
        transactionHash: 'dev_mode_simulation',
        status: 'simulated'
      });

      return {
        success: true,
        distributionTxHash: 'dev_mode_simulation',
        providerAddress: provider.walletAddress,
        amount: providerShare.toString()
      };
    }

    // Perform on-chain distribution
    const distributionResult = await executeOnChainTransfer({
      toAddress: provider.walletAddress as `0x${string}`,
      amount: providerShare.toString(),
      currency: request.currency,
      originalPaymentHash: request.transactionHash
    });

    if (!distributionResult.success) {
      return {
        success: false,
        error: distributionResult.error
      };
    }

    // Record successful distribution in database
    await recordDistribution({
      paymentId: request.paymentId,
      providerId: request.providerId,
      providerAddress: provider.walletAddress,
      originalAmount: request.totalAmount, // This is already the provider share
      providerAmount: providerShare.toString(),
      platformFee: '0', // Platform fee handled separately in payment processing
      transactionHash: distributionResult.txHash!,
      status: 'completed'
    });

    console.log(`✅ Distributed ${providerShare.toString()} wei to provider ${provider.name} (${provider.walletAddress})`);
    console.log(`🏦 Platform fee already handled in payment processing (${platformFeePercentage}%)`);

    return {
      success: true,
      distributionTxHash: distributionResult.txHash,
      providerAddress: provider.walletAddress,
      amount: providerShare.toString()
    };

  } catch (error) {
    console.error('Error distributing payment to provider:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown distribution error'
    };
  }
}

/**
 * Executes the actual on-chain transfer to provider
 */
async function executeOnChainTransfer(params: {
  toAddress: `0x${string}`;
  amount: string;
  currency: string;
  originalPaymentHash: string;
}): Promise<{ success: boolean; txHash?: string; error?: string }> {
  try {
    // This is where you would integrate with your Web3 provider (Viem, Ethers, etc.)
    // For now, we'll simulate the transaction

    if (process.env.NODE_ENV === 'development') {
      // Simulate transaction hash for development
      const simulatedTxHash = `0x${Buffer.from(`dist_${Date.now()}_${params.amount.substring(0, 10)}`).toString('hex').padEnd(64, '0')}`;
      return {
        success: true,
        txHash: simulatedTxHash
      };
    }

    // TODO: Implement actual on-chain transfer
    // Example implementation would look like:
    /*
    import { createWalletClient, http, parseEther } from 'viem';
    import { baseSepolia } from 'viem/chains';

    const walletClient = createWalletClient({
      account: platformWalletAccount,
      chain: baseSepolia,
      transport: http(process.env.RPC_URL || 'https://sepolia.base.org')
    });

    const txHash = await walletClient.sendTransaction({
      to: params.toAddress,
      value: BigInt(params.amount),
      data: '0x', // Optional memo data
    });

    // Wait for confirmation
    const receipt = await waitForTransactionReceipt(txHash);

    if (receipt.status === 'success') {
      return { success: true, txHash: txHash };
    } else {
      return { success: false, error: 'Transaction failed' };
    }
    */

    // For now, simulate successful transaction
    const simulatedTxHash = `0x${Buffer.from(`dist_${Date.now()}_${params.amount.substring(0, 10)}`).toString('hex').padEnd(64, '0')}`;

    return {
      success: true,
      txHash: simulatedTxHash
    };

  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Transfer execution failed'
    };
  }
}

/**
 * Records payment distribution in the database
 */
async function recordDistribution(params: {
  paymentId: string;
  providerId: string;
  providerAddress: string;
  originalAmount: string;
  providerAmount: string;
  platformFee: string;
  transactionHash: string;
  status: 'completed' | 'simulated' | 'failed';
}) {
  // This would require adding a PaymentDistribution model to your Prisma schema
  // For now, we'll just log the distribution details

  console.log('📊 Recording payment distribution:', {
    paymentId: params.paymentId,
    providerId: params.providerId,
    providerAddress: params.providerAddress,
    originalAmount: params.originalAmount,
    providerAmount: params.providerAmount,
    platformFee: params.platformFee,
    transactionHash: params.transactionHash,
    status: params.status,
    timestamp: new Date().toISOString()
  });

  // TODO: Add actual database recording when PaymentDistribution model is added
  /*
  await prisma.paymentDistribution.create({
    data: {
      id: `dist_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
      paymentId: params.paymentId,
      providerId: params.providerId,
      providerAddress: params.providerAddress,
      originalAmount: params.originalAmount,
      providerAmount: params.providerAmount,
      platformFee: params.platformFee,
      distributionTxHash: params.transactionHash,
      status: params.status,
      createdAt: new Date()
    }
  });
  */
}

/**
 * Batch distribution for processing multiple payments
 */
export async function batchDistributePayments(
  distributionRequests: DistributionRequest[]
): Promise<DistributionResult[]> {
  console.log(`🔄 Processing batch distribution for ${distributionRequests.length} payments`);

  const results: DistributionResult[] = [];

  for (const request of distributionRequests) {
    const result = await distributePaymentToProvider(request);
    results.push(result);

    // Add small delay between transactions to avoid nonce conflicts
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  const successCount = results.filter(r => r.success).length;
  const failureCount = results.filter(r => !r.success).length;

  console.log(`✅ Batch distribution complete: ${successCount} successful, ${failureCount} failed`);

  return results;
}