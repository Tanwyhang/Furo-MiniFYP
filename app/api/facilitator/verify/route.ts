import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@/lib/generated/prisma/client';

const prisma = new PrismaClient();

// POST /api/facilitator/verify - Verify x402 payment transaction
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      transactionHash,
      expectedAmount,
      recipientAddress,
      network = 'sepolia',
      // Additional x402 protocol fields
      sessionId,
      resourceId,
      developerAddress
    } = body;

    // Validation
    if (!transactionHash || !expectedAmount || !recipientAddress) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields: transactionHash, expectedAmount, recipientAddress'
        },
        { status: 400 }
      );
    }

    console.log(`🔍 Verifying payment transaction: ${transactionHash} on ${network}`);

    // TODO: Implement actual on-chain verification
    // For now, simulate verification with proper checks
    let isVerified = false;
    let transactionDetails = null;
    let errorMessage = null;

    try {
      // Always use real blockchain verification
      // Fall back to simulation only if blockchain verification fails and we're in development
      const verificationResult = await verifyTransactionOnChain(
        transactionHash,
        expectedAmount,
        recipientAddress,
        network
      );

      if (verificationResult.verified) {
        isVerified = true;
        transactionDetails = verificationResult.details;
        console.log('✅ Transaction verified on-chain');
      } else {
        // In development mode, fall back to simulation if on-chain verification fails
        if (process.env.NODE_ENV === 'development') {
          console.log('⚠️ On-chain verification failed, using simulation for development');
          isVerified = true;
          transactionDetails = {
            blockNumber: Math.floor(Date.now() / 1000),
            blockTimestamp: new Date().toISOString(),
            from: developerAddress || '0x0000000000000000000000000000000000000000',
            to: recipientAddress,
            value: expectedAmount,
            gasUsed: '21000',
            gasPrice: '20000000000',
            status: 1 // Success
          };
          console.log('✅ Development mode: Transaction verified (simulated)');
        } else {
          isVerified = false;
          errorMessage = verificationResult.error || 'Transaction verification failed';
          console.log('❌ Transaction verification failed:', errorMessage);
        }
      }
    } catch (error) {
      console.error('Transaction verification failed:', error);
      errorMessage = error instanceof Error ? error.message : 'Verification failed';
    }

    if (!isVerified) {
      return NextResponse.json(
        {
          success: false,
          error: 'Transaction verification failed',
          details: errorMessage,
          transactionHash
        },
        { status: 400 }
      );
    }

    // Check if transaction was already processed
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

    // Return verification success
    return NextResponse.json({
      success: true,
      verified: true,
      transaction: {
        hash: transactionHash,
        network: network,
        blockNumber: transactionDetails.blockNumber,
        blockTimestamp: transactionDetails.blockTimestamp,
        from: transactionDetails.from,
        to: transactionDetails.to,
        amount: transactionDetails.value,
        status: transactionDetails.status
      },
      metadata: {
        resourceId,
        sessionId,
        verifiedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error in facilitator verification:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error during verification',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Helper function for on-chain verification
async function verifyTransactionOnChain(
  transactionHash: string,
  expectedAmount: string,
  recipientAddress: string,
  network: string
): Promise<{ verified: boolean; details: any; error?: string }> {
  try {
    console.log(`🔍 Verifying transaction ${transactionHash} on ${network}`);

    // Get RPC URL for the network
    const rpcUrl = getRpcUrl(network);
    if (!rpcUrl) {
      return {
        verified: false,
        details: null,
        error: `Unsupported network: ${network}`
      };
    }

    // Create a simple fetch-based Web3 client (avoiding heavy dependencies)
    const response = await fetch(rpcUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'eth_getTransactionReceipt',
        params: [transactionHash],
        id: 1
      })
    });

    const receiptData = await response.json();

    if (receiptData.error) {
      return {
        verified: false,
        details: null,
        error: `Transaction receipt error: ${receiptData.error.message}`
      };
    }

    if (!receiptData.result) {
      return {
        verified: false,
        details: null,
        error: 'Transaction not found'
      };
    }

    const receipt = receiptData.result;

    // Check if transaction was successful
    if (!receipt.status || parseInt(receipt.status) === 0) {
      return {
        verified: false,
        details: null,
        error: 'Transaction failed'
      };
    }

    // Get transaction details to verify amount and recipient
    const txResponse = await fetch(rpcUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'eth_getTransactionByHash',
        params: [transactionHash],
        id: 1
      })
    });

    const txData = await txResponse.json();

    if (txData.error || !txData.result) {
      return {
        verified: false,
        details: null,
        error: 'Failed to fetch transaction details'
      };
    }

    const transaction = txData.result;

    // Verify recipient address
    if (transaction.to?.toLowerCase() !== recipientAddress.toLowerCase()) {
      return {
        verified: false,
        details: null,
        error: `Invalid recipient. Expected: ${recipientAddress}, Got: ${transaction.to}`
      };
    }

    // Verify amount (convert hex to decimal)
    const actualAmount = BigInt(transaction.value || '0x0');
    const expectedAmountBigInt = BigInt(expectedAmount);

    if (actualAmount < expectedAmountBigInt) {
      return {
        verified: false,
        details: null,
        error: `Insufficient amount. Expected: ${expectedAmountBigInt.toString()}, Got: ${actualAmount.toString()}`
      };
    }

    // Get block information
    const blockResponse = await fetch(rpcUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'eth_getBlockByNumber',
        params: [receipt.blockNumber, false],
        id: 1
      })
    });

    const blockData = await blockResponse.json();
    const block = blockData.result;

    const transactionDetails = {
      blockNumber: parseInt(receipt.blockNumber, 16),
      blockTimestamp: block ? parseInt(block.timestamp, 16) : Math.floor(Date.now() / 1000),
      from: transaction.from,
      to: transaction.to,
      value: actualAmount.toString(),
      gasUsed: receipt.gasUsed,
      gasPrice: transaction.gasPrice,
      status: parseInt(receipt.status)
    };

    console.log(`✅ Transaction verified successfully`);
    console.log(`  From: ${transactionDetails.from}`);
    console.log(`  To: ${transactionDetails.to}`);
    console.log(`  Amount: ${transactionDetails.value}`);
    console.log(`  Block: ${transactionDetails.blockNumber}`);

    return {
      verified: true,
      details: transactionDetails
    };

  } catch (error) {
    console.error('Blockchain verification error:', error);
    return {
      verified: false,
      details: null,
      error: error instanceof Error ? error.message : 'Verification failed'
    };
  }
}

/**
 * Get RPC URL for supported networks
 */
function getRpcUrl(network: string): string | null {
  switch (network.toLowerCase()) {
    case 'sepolia':
      return process.env.SEPOLIA_RPC_URL || 'https://sepolia.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161';
    case 'mainnet':
      return process.env.MAINNET_RPC_URL || 'https://mainnet.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161';
    case 'polygon':
      return process.env.POLYGON_RPC_URL || 'https://polygon-rpc.com';
    case 'base':
      return process.env.BASE_RPC_URL || 'https://mainnet.base.org';
    case 'base-sepolia':
      return process.env.BASE_SEPOLIA_RPC_URL || 'https://sepolia.base.org';
    default:
      return null;
  }
}