/**
 * Comprehensive Error Handling for x402 Protocol
 *
 * This module provides standardized error handling, logging, and recovery
 * mechanisms for payment failures and other x402-related errors.
 */

import { NextResponse } from 'next/server';

export enum ErrorCode {
  // Authentication errors
  UNAUTHORIZED = 'UNAUTHORIZED',
  INVALID_SIGNATURE = 'INVALID_SIGNATURE',
  EXPIRED_SESSION = 'EXPIRED_SESSION',

  // Payment errors
  PAYMENT_REQUIRED = 'PAYMENT_REQUIRED',
  INSUFFICIENT_PAYMENT = 'INSUFFICIENT_PAYMENT',
  INVALID_TRANSACTION = 'INVALID_TRANSACTION',
  PAYMENT_VERIFICATION_FAILED = 'PAYMENT_VERIFICATION_FAILED',
  PAYMENT_ALREADY_PROCESSED = 'PAYMENT_ALREADY_PROCESSED',

  // Token errors
  TOKEN_NOT_FOUND = 'TOKEN_NOT_FOUND',
  TOKEN_ALREADY_USED = 'TOKEN_ALREADY_USED',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  INVALID_TOKEN = 'INVALID_TOKEN',

  // API errors
  API_NOT_FOUND = 'API_NOT_FOUND',
  API_INACTIVE = 'API_INACTIVE',
  PROVIDER_INACTIVE = 'PROVIDER_INACTIVE',

  // Rate limiting
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',

  // System errors
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  BLOCKCHAIN_ERROR = 'BLOCKCHAIN_ERROR'
}

export class X402Error extends Error {
  constructor(
    public code: ErrorCode,
    message: string,
    public details?: any,
    public statusCode: number = 400,
    public retryable: boolean = false
  ) {
    super(message);
    this.name = 'X402Error';
  }
}

/**
 * Standardized error response format
 */
export function createErrorResponse(
  error: X402Error | Error,
  requestId?: string
): NextResponse {
  const statusCode = error instanceof X402Error ? error.statusCode : 500;
  const code = error instanceof X402Error ? error.code : ErrorCode.INTERNAL_ERROR;
  const details = error instanceof X402Error ? error.details : error.message;

  const response = {
    success: false,
    error: error.message,
    code,
    details,
    requestId,
    timestamp: new Date().toISOString(),
    ...(error instanceof X402Error && error.retryable && {
      retryAfter: 60 // Suggest retry after 60 seconds
    })
  };

  // Log error for debugging
  console.error(`🚨 X402 Error [${code}]:`, {
    message: error.message,
    statusCode,
    details,
    requestId,
    stack: error.stack
  });

  return NextResponse.json(response, { status: statusCode });
}

/**
 * Payment error handlers
 */
export class PaymentErrorHandler {
  static handleInsufficientPayment(
    expected: string,
    actual: string,
    currency: string
  ): X402Error {
    return new X402Error(
      ErrorCode.INSUFFICIENT_PAYMENT,
      `Insufficient payment amount. Expected: ${expected} ${currency}, Received: ${actual} ${currency}`,
      { expected, actual, currency },
      402,
      true // Retryable - user can send more funds
    );
  }

  static handleInvalidTransaction(
    transactionHash: string,
    reason: string
  ): X402Error {
    return new X402Error(
      ErrorCode.INVALID_TRANSACTION,
      `Invalid transaction: ${reason}`,
      { transactionHash, reason },
      400,
      false // Not retryable - transaction is fundamentally invalid
    );
  }

  static handlePaymentVerificationFailed(
    transactionHash: string,
    network: string,
    error: string
  ): X402Error {
    return new X402Error(
      ErrorCode.PAYMENT_VERIFICATION_FAILED,
      `Payment verification failed on ${network}: ${error}`,
      { transactionHash, network, error },
      402,
      true // Retryable - might be temporary network issue
    );
  }

  static handlePaymentAlreadyProcessed(
    transactionHash: string,
    existingPaymentId: string
  ): X402Error {
    return new X402Error(
      ErrorCode.PAYMENT_ALREADY_PROCESSED,
      'Transaction has already been processed',
      { transactionHash, existingPaymentId },
      409, // Conflict
      false // Not retryable - payment already exists
    );
  }
}

/**
 * Token error handlers
 */
export class TokenErrorHandler {
  static handleTokenNotFound(tokenHash: string): X402Error {
    return new X402Error(
      ErrorCode.TOKEN_NOT_FOUND,
      'Token not found or invalid',
      { tokenHash },
      404,
      false
    );
  }

  static handleTokenAlreadyUsed(
    tokenHash: string,
    usedAt: Date
  ): X402Error {
    return new X402Error(
      ErrorCode.TOKEN_ALREADY_USED,
      'Token has already been used',
      { tokenHash, usedAt },
      410, // Gone
      false
    );
  }

  static handleTokenExpired(
    tokenHash: string,
    expiredAt: Date
  ): X402Error {
    return new X402Error(
      ErrorCode.TOKEN_EXPIRED,
      'Token has expired',
      { tokenHash, expiredAt },
      410, // Gone
      false
    );
  }

  static handleInvalidToken(
    tokenHash: string,
    reason: string
  ): X402Error {
    return new X402Error(
      ErrorCode.INVALID_TOKEN,
      `Invalid token: ${reason}`,
      { tokenHash, reason },
      400,
      false
    );
  }
}

/**
 * API error handlers
 */
export class ApiErrorHandler {
  static handleApiNotFound(apiId: string): X402Error {
    return new X402Error(
      ErrorCode.API_NOT_FOUND,
      'API not found',
      { apiId },
      404,
      false
    );
  }

  static handleApiInactive(apiId: string, apiName: string): X402Error {
    return new X402Error(
      ErrorCode.API_INACTIVE,
      `API "${apiName}" is currently inactive`,
      { apiId, apiName },
      403,
      false
    );
  }

  static handleProviderInactive(providerId: string, providerName: string): X402Error {
    return new X402Error(
      ErrorCode.PROVIDER_INACTIVE,
      `Provider "${providerName}" is currently inactive`,
      { providerId, providerName },
      403,
      false
    );
  }
}

/**
 * Authentication error handlers
 */
export class AuthErrorHandler {
  static handleUnauthorized(details?: string): X402Error {
    return new X402Error(
      ErrorCode.UNAUTHORIZED,
      'Authentication required',
      { details: details || 'Include valid developer address and signature' },
      401,
      true // Retryable - user can provide proper authentication
    );
  }

  static handleInvalidSignature(
    developerAddress: string,
    reason: string
  ): X402Error {
    return new X402Error(
      ErrorCode.INVALID_SIGNATURE,
      `Invalid signature: ${reason}`,
      { developerAddress, reason },
      401,
      false
    );
  }

  static handleExpiredSession(sessionId: string): X402Error {
    return new X402Error(
      ErrorCode.EXPIRED_SESSION,
      'Authentication session has expired',
      { sessionId },
      401,
      true // Retryable - user can re-authenticate
    );
  }
}

/**
 * System error handlers
 */
export class SystemErrorHandler {
  static handleDatabaseError(
    operation: string,
    error: any
  ): X402Error {
    return new X402Error(
      ErrorCode.DATABASE_ERROR,
      `Database operation failed: ${operation}`,
      { operation, error: error.message },
      500,
      true // Retryable - might be temporary database issue
    );
  }

  static handleNetworkError(
    operation: string,
    url: string,
    error: any
  ): X402Error {
    return new X402Error(
      ErrorCode.NETWORK_ERROR,
      `Network request failed: ${operation}`,
      { operation, url, error: error.message },
      502, // Bad Gateway
      true // Retryable - network issues are often temporary
    );
  }

  static handleBlockchainError(
    operation: string,
    network: string,
    error: any
  ): X402Error {
    return new X402Error(
      ErrorCode.BLOCKCHAIN_ERROR,
      `Blockchain operation failed on ${network}: ${operation}`,
      { operation, network, error: error.message },
      502,
      true // Retryable - blockchain RPC issues can be temporary
    );
  }

  static handleInternalError(
    operation: string,
    error: any
  ): X402Error {
    return new X402Error(
      ErrorCode.INTERNAL_ERROR,
      `Internal server error during: ${operation}`,
      { operation, error: error.message },
      500,
      false // Not retryable by default
    );
  }
}

/**
 * Error recovery suggestions
 */
export function getRecoverySuggestion(errorCode: ErrorCode): string {
  switch (errorCode) {
    case ErrorCode.PAYMENT_REQUIRED:
      return 'Please make the required payment and retry with the transaction hash in the X-Payment header.';

    case ErrorCode.INSUFFICIENT_PAYMENT:
      return 'Please send a larger payment amount to cover the API call cost.';

    case ErrorCode.INVALID_TRANSACTION:
      return 'Please check your transaction details and try again with a new transaction.';

    case ErrorCode.PAYMENT_VERIFICATION_FAILED:
      return 'Please wait a few minutes for the transaction to be confirmed and try again.';

    case ErrorCode.TOKEN_NOT_FOUND:
      return 'Please ensure you have a valid token or make a payment to obtain one.';

    case ErrorCode.TOKEN_ALREADY_USED:
      return 'This token has already been used. Please make a new payment for additional API calls.';

    case ErrorCode.TOKEN_EXPIRED:
      return 'This token has expired. Please make a new payment to obtain a fresh token.';

    case ErrorCode.UNAUTHORIZED:
      return 'Please include your developer address in the X-Developer-Address header.';

    case ErrorCode.INVALID_SIGNATURE:
      return 'Please provide a valid cryptographic signature for authentication.';

    case ErrorCode.RATE_LIMIT_EXCEEDED:
      return 'Please wait a moment before making more requests.';

    case ErrorCode.API_INACTIVE:
    case ErrorCode.PROVIDER_INACTIVE:
      return 'This API is temporarily unavailable. Please try again later.';

    default:
      return 'An error occurred. Please check the error details and try again.';
  }
}

/**
 * Centralized error logging
 */
export class ErrorLogger {
  static log(
    error: X402Error | Error,
    context: {
      requestId?: string;
      developerAddress?: string;
      apiId?: string;
      transactionHash?: string;
      ip?: string;
      userAgent?: string;
    }
  ) {
    const logData = {
      timestamp: new Date().toISOString(),
      level: 'error',
      code: error instanceof X402Error ? error.code : 'UNKNOWN',
      message: error.message,
      context,
      stack: error.stack
    };

    // Log to console (in production, this would go to a logging service)
    console.error('🔥 X402 Error Log:', JSON.stringify(logData, null, 2));

    // In production, you might want to:
    // - Send to Sentry, DataDog, or similar error tracking service
    // - Store in a database for analysis
    // - Trigger alerts for critical errors
  }

  static logPaymentFailure(
    transactionHash: string,
    reason: string,
    developerAddress?: string
  ) {
    console.warn(`💳 Payment Failure: ${transactionHash}`, {
      reason,
      developerAddress,
      timestamp: new Date().toISOString()
    });
  }

  static logTokenFailure(
    tokenHash: string,
    reason: string,
    developerAddress?: string
  ) {
    console.warn(`🎫 Token Failure: ${tokenHash}`, {
      reason,
      developerAddress,
      timestamp: new Date().toISOString()
    });
  }
}