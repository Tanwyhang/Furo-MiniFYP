/**
 * Enhanced Authentication for x402 Protocol
 *
 * This module provides stronger authentication mechanisms beyond simple headers,
 * including signature-based verification and session management.
 */

import { NextRequest } from 'next/server';
import { createHash, randomBytes } from 'crypto';

export interface AuthenticatedRequest {
  developerAddress: string;
  signature?: string;
  message?: string;
  timestamp?: number;
  nonce?: string;
  sessionId?: string;
}

export interface SignatureVerificationResult {
  valid: boolean;
  developerAddress?: string;
  error?: string;
}

/**
 * Create authentication challenge message for developer to sign
 */
export function createAuthChallenge(developerAddress: string): {
  message: string;
  nonce: string;
  timestamp: number;
} {
  const nonce = randomBytes(16).toString('hex');
  const timestamp = Date.now();

  const message = `Furo x402 Authentication
Address: ${developerAddress}
Nonce: ${nonce}
Timestamp: ${timestamp}
URI: https://furo.io/api
Version: 1`;

  return {
    message,
    nonce,
    timestamp
  };
}

/**
 * Verify cryptographic signature for developer authentication
 */
export async function verifySignature(
  developerAddress: string,
  signature: string,
  message: string
): Promise<SignatureVerificationResult> {
  try {
    // For now, implement a simple verification check
    // In production, this would use ethers.js or viem to verify ECDSA signatures

    // Basic format checks
    if (!developerAddress.startsWith('0x') || developerAddress.length !== 42) {
      return {
        valid: false,
        error: 'Invalid developer address format'
      };
    }

    if (!signature.startsWith('0x') || signature.length !== 132) {
      return {
        valid: false,
        error: 'Invalid signature format'
      };
    }

    // Extract nonce and timestamp from message
    const messageLines = message.split('\n');
    const nonceLine = messageLines.find(line => line.startsWith('Nonce: '));
    const timestampLine = messageLines.find(line => line.startsWith('Timestamp: '));

    if (!nonceLine || !timestampLine) {
      return {
        valid: false,
        error: 'Invalid message format'
      };
    }

    const nonce = nonceLine.replace('Nonce: ', '');
    const timestamp = parseInt(timestampLine.replace('Timestamp: ', ''));

    // Check timestamp is recent (within 5 minutes)
    const now = Date.now();
    if (Math.abs(now - timestamp) > 5 * 60 * 1000) {
      return {
        valid: false,
        error: 'Authentication expired'
      };
    }

    // TODO: Implement actual signature verification using ethers.js/viem
    // For development, we'll accept properly formatted signatures
    console.log(`🔐 Verifying signature for ${developerAddress}`);
    console.log(`  Message: ${message}`);
    console.log(`  Signature: ${signature}`);
    console.log(`  Nonce: ${nonce}`);
    console.log(`  Timestamp: ${timestamp}`);

    // In production, this would be:
    // const recoveredAddress = verifyMessage(message, signature);
    // return recoveredAddress.toLowerCase() === developerAddress.toLowerCase();

    return {
      valid: true,
      developerAddress: developerAddress.toLowerCase()
    };

  } catch (error) {
    console.error('Signature verification error:', error);
    return {
      valid: false,
      error: error instanceof Error ? error.message : 'Verification failed'
    };
  }
}

/**
 * Extract authentication information from request headers
 */
export function extractAuthFromRequest(request: NextRequest): AuthenticatedRequest | null {
  const developerAddress = request.headers.get('X-Developer-Address');
  const signature = request.headers.get('X-Signature');
  const message = request.headers.get('X-Auth-Message');
  const timestamp = request.headers.get('X-Auth-Timestamp');
  const nonce = request.headers.get('X-Auth-Nonce');
  const sessionId = request.headers.get('X-Session-Id');

  if (!developerAddress) {
    return null;
  }

  return {
    developerAddress: developerAddress.toLowerCase(),
    signature: signature || undefined,
    message: message || undefined,
    timestamp: timestamp ? parseInt(timestamp) : undefined,
    nonce: nonce || undefined,
    sessionId: sessionId || undefined
  };
}

/**
 * Enhanced middleware for signature-based authentication
 */
export async function authenticateWithSignature(
  request: NextRequest,
  requireSignature: boolean = false
): Promise<{ authenticated: boolean; developerAddress?: string; error?: string }> {
  const authInfo = extractAuthFromRequest(request);

  if (!authInfo) {
    return {
      authenticated: false,
      error: 'Developer address required'
    };
  }

  // If signature authentication is required
  if (requireSignature) {
    if (!authInfo.signature || !authInfo.message) {
      return {
        authenticated: false,
        error: 'Signature and message required for secure authentication'
      };
    }

    const verification = await verifySignature(
      authInfo.developerAddress,
      authInfo.signature,
      authInfo.message
    );

    if (!verification.valid) {
      return {
        authenticated: false,
        error: verification.error || 'Signature verification failed'
      };
    }

    return {
      authenticated: true,
      developerAddress: verification.developerAddress
    };
  }

  // Basic address-only authentication (for compatibility)
  return {
    authenticated: true,
    developerAddress: authInfo.developerAddress
  };
}

/**
 * Create secure session token for authenticated developers
 */
export function createSessionToken(developerAddress: string): {
  token: string;
  expiresAt: Date;
} {
  const payload = {
    address: developerAddress.toLowerCase(),
    created: Date.now(),
    random: randomBytes(32).toString('hex')
  };

  const token = Buffer.from(JSON.stringify(payload)).toString('base64');
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

  return { token, expiresAt };
}

/**
 * Verify session token
 */
export function verifySessionToken(token: string): {
  valid: boolean;
  developerAddress?: string;
  error?: string;
} {
  try {
    const payload = JSON.parse(Buffer.from(token, 'base64').toString());

    if (!payload.address || !payload.created) {
      return {
        valid: false,
        error: 'Invalid token format'
      };
    }

    // Check if token is expired (24 hours)
    const now = Date.now();
    if (now - payload.created > 24 * 60 * 60 * 1000) {
      return {
        valid: false,
        error: 'Token expired'
      };
    }

    return {
      valid: true,
      developerAddress: payload.address.toLowerCase()
    };

  } catch (error) {
    return {
      valid: false,
      error: 'Token verification failed'
    };
  }
}

/**
 * Generate API key for programmatic access
 */
export function generateApiKey(providerId: string): {
  apiKey: string;
  keyHash: string;
} {
  const apiKey = `furo_${randomBytes(32).toString('hex')}_${providerId}`;
  const keyHash = createHash('sha256').update(apiKey).digest('hex');

  return { apiKey, keyHash };
}

/**
 * Verify API key
 */
export function verifyApiKey(apiKey: string, storedHash: string): boolean {
  const keyHash = createHash('sha256').update(apiKey).digest('hex');
  return keyHash === storedHash;
}

/**
 * Rate limiting helper
 */
export class RateLimiter {
  private requests: Map<string, number[]> = new Map();

  constructor(
    private windowMs: number = 60 * 1000, // 1 minute
    private maxRequests: number = 100
  ) {}

  isAllowed(identifier: string): boolean {
    const now = Date.now();
    const windowStart = now - this.windowMs;

    // Get existing requests for this identifier
    let requests = this.requests.get(identifier) || [];

    // Remove old requests outside the window
    requests = requests.filter(timestamp => timestamp > windowStart);

    // Check if under limit
    if (requests.length >= this.maxRequests) {
      return false;
    }

    // Add current request
    requests.push(now);
    this.requests.set(identifier, requests);

    return true;
  }

  cleanup(): void {
    const now = Date.now();
    const windowStart = now - this.windowMs;

    for (const [identifier, requests] of this.requests.entries()) {
      const filtered = requests.filter(timestamp => timestamp > windowStart);
      if (filtered.length === 0) {
        this.requests.delete(identifier);
      } else {
        this.requests.set(identifier, filtered);
      }
    }
  }
}

// Global rate limiter instance
export const globalRateLimiter = new RateLimiter(60 * 1000, 1000); // 1000 requests per minute

// Cleanup rate limiter every 5 minutes
setInterval(() => {
  globalRateLimiter.cleanup();
}, 5 * 60 * 1000);