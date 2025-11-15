/**
 * Native x402 Protocol Implementation for Furo
 *
 * This module implements the x402 payment protocol from scratch,
 * providing proper 402 Payment Required responses and payment verification.
 */

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@/lib/generated/prisma/client';

const prisma = new PrismaClient();

export interface X402PaymentConfig {
  address: string;
  amount: string;
  network: string;
  currency: string;
  resourceId: string;
}

export interface X402PaymentResponse {
  payment: X402PaymentConfig;
  resource: string;
  session?: string;
  memo?: string;
}

export interface X402VerificationRequest {
  transactionHash: string;
  paymentAmount: string;
  recipientAddress: string;
  network: string;
  resourceId: string;
  developerAddress: string;
}

/**
 * Create a standard 402 Payment Required response
 */
export function create402Response(config: X402PaymentConfig, sessionId?: string): NextResponse {
  const response: X402PaymentResponse = {
    payment: config,
    resource: config.resourceId,
    session: sessionId,
    memo: `Payment for API access: ${config.resourceId}`
  };

  return NextResponse.json(response, {
    status: 402,
    statusText: 'Payment Required'
  });
}

/**
 * Check if an API call requires payment (based on existing tokens)
 */
export async function checkPaymentRequired(
  apiId: string,
  developerAddress: string,
  request: NextRequest
): Promise<{ required: boolean; reason?: string }> {
  // Check for valid token in X-Payment header (for retry after payment)
  const paymentHeader = request.headers.get('X-Payment');
  if (paymentHeader) {
    const tokenValidation = await validateTokenForPayment(paymentHeader, apiId, developerAddress);
    if (tokenValidation.valid) {
      return { required: false };
    }
  }

  // Check for valid token in X-Token-Hash header (alternative)
  const tokenHeader = request.headers.get('X-Token-Hash');
  if (tokenHeader) {
    const tokenValidation = await validateTokenForPayment(tokenHeader, apiId, developerAddress);
    if (tokenValidation.valid) {
      return { required: false };
    }
  }

  // No valid token found - payment required
  return { required: true, reason: 'No valid payment token found' };
}

/**
 * Validate a token for payment retry
 */
async function validateTokenForPayment(
  tokenHash: string,
  apiId: string,
  developerAddress: string
): Promise<{ valid: boolean; token?: any }> {
  try {
    const token = await prisma.token.findUnique({
      where: { tokenHash },
      include: {
        Api: {
          include: { Provider: true }
        }
      }
    });

    if (!token || token.isUsed || token.expiresAt < new Date()) {
      return { valid: false };
    }

    if (token.apiId !== apiId ||
        token.developerAddress.toLowerCase() !== developerAddress.toLowerCase()) {
      return { valid: false };
    }

    if (!token.Api.isActive || !token.Api.Provider.isActive) {
      return { valid: false };
    }

    return { valid: true, token };
  } catch (error) {
    console.error('Token validation error:', error);
    return { valid: false };
  }
}

/**
 * Get payment configuration for an API
 */
export async function getPaymentConfig(apiId: string): Promise<X402PaymentConfig | null> {
  try {
    const api = await prisma.api.findUnique({
      where: { id: apiId },
      include: { Provider: true }
    });

    if (!api || !api.isActive || !api.Provider.isActive) {
      return null;
    }

    return {
      address: api.Provider.walletAddress,
      amount: api.pricePerCall,
      network: 'sepolia', // Default network
      currency: api.currency || 'ETH',
      resourceId: api.id
    };
  } catch (error) {
    console.error('Error getting payment config:', error);
    return null;
  }
}

/**
 * Verify a transaction on the blockchain
 */
export async function verifyTransaction(
  transactionHash: string,
  expectedAmount: string,
  recipientAddress: string,
  network: string
): Promise<{ verified: boolean; details?: any; error?: string }> {
  try {
    // TODO: Implement actual blockchain verification
    // For now, simulate verification in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`🔍 Simulating verification for transaction: ${transactionHash}`);

      // Simulate a successful verification
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate network delay

      return {
        verified: true,
        details: {
          blockNumber: Math.floor(Date.now() / 1000),
          blockTimestamp: new Date().toISOString(),
          from: '0x0000000000000000000000000000000000000000',
          to: recipientAddress,
          value: expectedAmount,
          gasUsed: '21000',
          gasPrice: '20000000000',
          status: 1
        }
      };
    }

    // Production implementation would go here
    // 1. Connect to appropriate RPC endpoint
    // 2. Fetch transaction receipt
    // 3. Verify amount and recipient
    // 4. Check transaction status

    return {
      verified: false,
      error: 'On-chain verification not implemented for production'
    };

  } catch (error) {
    console.error('Transaction verification error:', error);
    return {
      verified: false,
      error: error instanceof Error ? error.message : 'Verification failed'
    };
  }
}

/**
 * Main middleware function for x402 payment protection
 */
export async function x402Middleware(
  request: NextRequest,
  apiId: string,
  developerAddress: string
): Promise<NextResponse | null> {
  // 1. Check if payment is required
  const paymentCheck = await checkPaymentRequired(apiId, developerAddress, request);

  if (!paymentCheck.required) {
    // Payment already made or valid token provided
    return null; // Continue with the request
  }

  // 2. Get payment configuration
  const paymentConfig = await getPaymentConfig(apiId);
  if (!paymentConfig) {
    return NextResponse.json(
      {
        success: false,
        error: 'API not found or inactive'
      },
      { status: 404 }
    );
  }

  // 3. Generate session ID for tracking
  const sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

  // 4. Return 402 Payment Required response
  return create402Response(paymentConfig, sessionId);
}

/**
 * Enhanced token consumption with x402 flow integration
 */
export async function consumeTokenWithX402(
  tokenHash: string,
  apiId: string,
  developerAddress: string,
  requestDetails: {
    headers: any;
    params: any;
    body?: any;
    ipAddress: string;
    userAgent: string;
  }
) {
  try {
    // 1. Validate token (same as before)
    const token = await prisma.token.findUnique({
      where: { tokenHash },
      include: {
        Api: { include: { Provider: true } },
        Payment: true
      }
    });

    if (!token || token.isUsed || token.expiresAt < new Date()) {
      throw new Error('Token is invalid or expired');
    }

    if (token.apiId !== apiId ||
        token.developerAddress.toLowerCase() !== developerAddress.toLowerCase()) {
      throw new Error('Token is not valid for this API or developer');
    }

    if (!token.Api.isActive || !token.Api.Provider.isActive) {
      throw new Error('API or provider is inactive');
    }

    // 2. Consume token atomically
    const updatedToken = await prisma.token.update({
      where: { id: token.id, isUsed: false },
      data: { isUsed: true, usedAt: new Date() }
    });

    // 3. Create usage log
    const usageLog = await prisma.usageLog.create({
      data: {
        id: `usage_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
        tokenId: updatedToken.id,
        apiId: token.Api.id,
        providerId: token.Api.Provider.id,
        developerAddress: developerAddress.toLowerCase(),
        requestHeaders: requestDetails.headers,
        requestParams: requestDetails.params,
        requestBody: requestDetails.body ? JSON.stringify(requestDetails.body) : null,
        responseStatus: 0, // Will be updated after API call
        responseTime: 0, // Will be updated after API call
        responseSize: 0, // Will be updated after API call
        success: false, // Will be updated after API call
        ipAddress: requestDetails.ipAddress,
        userAgent: requestDetails.userAgent
      }
    });

    return {
      success: true,
      token: updatedToken,
      usageLog,
      api: token.Api,
      provider: token.Api.Provider
    };

  } catch (error) {
    console.error('Token consumption error:', error);
    throw error;
  }
}

/**
 * Validate payment retry with transaction hash
 */
export async function validatePaymentRetry(
  transactionHash: string,
  apiId: string,
  developerAddress: string
): Promise<{ valid: boolean; tokens?: any[]; error?: string }> {
  try {
    // Check if payment was processed
    const payment = await prisma.payment.findUnique({
      where: { transactionHash },
      include: {
        Token: {
          where: {
            developerAddress: { equals: developerAddress.toLowerCase() },
            isUsed: { equals: false },
            expiresAt: { gt: new Date() }
          }
        }
      }
    });

    if (!payment) {
      return { valid: false, error: 'Payment not found' };
    }

    if (payment.apiId !== apiId) {
      return { valid: false, error: 'Payment is for a different API' };
    }

    if (payment.developerAddress.toLowerCase() !== developerAddress.toLowerCase()) {
      return { valid: false, error: 'Payment is from a different developer' };
    }

    if (payment.Token.length === 0) {
      return { valid: false, error: 'No valid tokens available for this payment' };
    }

    return { valid: true, tokens: payment.Token };

  } catch (error) {
    console.error('Payment retry validation error:', error);
    return {
      valid: false,
      error: error instanceof Error ? error.message : 'Validation failed'
    };
  }
}