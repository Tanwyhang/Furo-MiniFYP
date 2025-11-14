/**
 * Furo API Gateway Client
 *
 * This client handles the x402 payment protocol and API calls to the Furo gateway.
 * It manages payment verification, token issuance, and API calls with proper authentication.
 */

export interface API {
  id: string;
  providerId: string;
  name: string;
  description: string;
  category: string;
  endpoint: string;
  publicPath: string;
  method: string;
  pricePerCall: string;
  currency: string;
  isActive: boolean;
  totalCalls: number;
  totalRevenue: string;
  averageResponseTime: number;
  uptime: number;
  documentation?: any;
  headers?: any;
  queryParams?: any;
  internalEndpoint?: string;
  internalAuth?: any;
  relayConfiguration?: any;
  isDirectRelay: boolean;
  fallbackEndpoint?: string;
  createdAt: string;
  updatedAt: string;
  Provider: {
    id: string;
    name: string;
    walletAddress: string;
    reputationScore: number;
    isActive: boolean;
  };
  averageRating?: number;
  reviewCount?: number;
}

export interface PaymentRequest {
  apiId: string;
  amount: string;
  currency?: string;
  numberOfTokens?: number;
  developerAddress: string;
}

export interface PaymentResponse {
  id: string;
  providerId: string;
  developerAddress: string;
  transactionHash: string;
  amount: string;
  currency: string;
  numberOfTokens: number;
  tokensIssued: number;
  isVerified: boolean;
  providerWalletAddress: string;
  networkId?: number;
  gasUsed?: string;
  blockNumber?: string;
  blockTimestamp?: string;
  createdAt: string;
}

export interface Token {
  id: string;
  paymentId: string;
  apiId: string;
  providerId: string;
  developerAddress: string;
  tokenHash: string;
  isUsed: boolean;
  usedAt?: string;
  expiresAt: string;
  lastValidAfter: string;
  requestMetadata?: any;
  createdAt: string;
}

export interface APICallRequest {
  apiId: string;
  tokenHash?: string;
  params?: Record<string, any>;
  headers?: Record<string, string>;
}

export interface APICallResponse {
  success: boolean;
  data?: any;
  error?: string;
  metadata?: {
    tokenId: string;
    responseTime: number;
    responseSize: number;
    providerResponseTime: number;
  };
}

export interface X402PaymentRequired {
  error: string;
  paymentDetails: {
    providerId: string;
    providerWalletAddress: string;
    requiredAmount: string;
    currency: string;
    networkId?: number;
    paymentMemo?: string;
    expiresAt?: string;
  };
}

class FuroAPIClient {
  private baseURL: string;
  private developerAddress?: string;

  constructor(baseURL: string = '/api') {
    this.baseURL = baseURL;
  }

  setDeveloperAddress(address: string) {
    this.developerAddress = address;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;

    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    if (this.developerAddress) {
      config.headers = {
        ...config.headers,
        'X-Developer-Address': this.developerAddress,
      };
    }

    const response = await fetch(url, config);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || `HTTP ${response.status}: ${response.statusText}`);
    }

    return data;
  }

  // API Discovery
  async getAPIs(params: {
    page?: number;
    limit?: number;
    search?: string;
    category?: string;
    isActive?: boolean;
    providerId?: string;
    minPrice?: string;
    maxPrice?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  } = {}): Promise<{
    success: boolean;
    data: API[];
    meta: {
      page: number;
      limit: number;
      total: number;
      pages: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
  }> {
    const searchParams = new URLSearchParams();

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, value.toString());
      }
    });

    const query = searchParams.toString();
    const endpoint = `/apis${query ? `?${query}` : ''}`;

    return this.request(endpoint);
  }

  async getAPI(id: string): Promise<{ success: boolean; data: API }> {
    return this.request(`/apis/${id}`);
  }

  // Payment Processing
  async initiatePayment(paymentRequest: PaymentRequest): Promise<PaymentResponse> {
    const response = await this.request<PaymentResponse>('/payments/process', {
      method: 'POST',
      body: JSON.stringify(paymentRequest),
    });

    return response;
  }

  async verifyPayment(transactionHash: string, apiId: string): Promise<{
    success: boolean;
    payment?: PaymentResponse;
    tokens?: Token[];
  }> {
    return this.request(`/payments/verify`, {
      method: 'POST',
      body: JSON.stringify({
        transactionHash,
        apiId,
        developerAddress: this.developerAddress,
      }),
    });
  }

  // Token Management
  async getTokens(params: {
    apiId?: string;
    isUsed?: boolean;
    developerAddress?: string;
    page?: number;
    limit?: number;
  } = {}): Promise<{
    success: boolean;
    data: Token[];
    meta: any;
  }> {
    const searchParams = new URLSearchParams();

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, value.toString());
      }
    });

    const query = searchParams.toString();
    const endpoint = `/tokens${query ? `?${query}` : ''}`;

    return this.request(endpoint);
  }

  async validateToken(tokenHash: string): Promise<{
    success: boolean;
    token?: Token;
    isValid?: boolean;
  }> {
    return this.request(`/tokens/validate`, {
      method: 'POST',
      body: JSON.stringify({ tokenHash }),
    });
  }

  // API Calls with x402 Protocol
  async callAPI(request: APICallRequest): Promise<APICallResponse | X402PaymentRequired> {
    try {
      const response = await this.request<APICallResponse>(`/apis/${request.apiId}/call`, {
        method: 'POST',
        body: JSON.stringify({
          tokenHash: request.tokenHash,
          params: request.params,
          headers: request.headers,
        }),
      });

      return response;
    } catch (error: any) {
      // Check if this is a 402 Payment Required response
      if (error.message.includes('402') || error.message.includes('Payment Required')) {
        try {
          const errorData = JSON.parse(error.message);
          if (errorData.paymentDetails) {
            return errorData as X402PaymentRequired;
          }
        } catch {
          // If we can't parse the error, continue with normal error handling
        }
      }

      throw error;
    }
  }

  // Complete x402 Payment Flow
  async executeAPICallWithPayment(
    apiId: string,
    params?: Record<string, any>,
    onPaymentRequired?: (paymentDetails: X402PaymentRequired['paymentDetails']) => Promise<string>
  ): Promise<any> {
    if (!this.developerAddress) {
      throw new Error('Developer address must be set before executing API calls');
    }

    // Step 1: Try to call the API directly
    try {
      const response = await this.callAPI({
        apiId,
        params,
        headers: {},
      });

      if ('paymentDetails' in response) {
        // Step 2: Payment required - initiate payment flow
        if (!onPaymentRequired) {
          throw new Error('Payment required but no payment handler provided');
        }

        const transactionHash = await onPaymentRequired(response.paymentDetails);

        // Step 3: Verify payment and get tokens
        const verificationResult = await this.verifyPayment(transactionHash, apiId);

        if (!verificationResult.success || !verificationResult.tokens || verificationResult.tokens.length === 0) {
          throw new Error('Payment verification failed or no tokens issued');
        }

        // Step 4: Use first available token to make the API call
        const token = verificationResult.tokens[0];
        const apiResponse = await this.callAPI({
          apiId,
          tokenHash: token.tokenHash,
          params,
          headers: {},
        });

        if ('data' in apiResponse && apiResponse.success) {
          return apiResponse.data;
        } else {
          throw new Error(apiResponse.error || 'API call failed after payment');
        }
      } else {
        // No payment required (unlikely in production)
        return response.data;
      }
    } catch (error: any) {
      if (error.message.includes('Payment required but no payment handler')) {
        throw error;
      }

      // Handle other errors
      console.error('API call failed:', error);
      throw new Error(`API call failed: ${error.message}`);
    }
  }

  // Provider Analytics
  async getProviderAnalytics(providerId: string): Promise<{
    success: boolean;
    data: {
      totalAPIs: number;
      totalCalls: number;
      totalRevenue: string;
      averageRating: number;
      activeTokens: number;
      recentUsage: any[];
      revenueChart: any[];
      categoryBreakdown: any[];
    };
  }> {
    return this.request(`/providers/${providerId}/analytics`);
  }

  // API Analytics
  async getAPIAnalytics(apiId: string): Promise<{
    success: boolean;
    data: {
      totalCalls: number;
      totalRevenue: string;
      averageResponseTime: number;
      uptime: number;
      successRate: number;
      recentUsage: any[];
      usageByTime: any[];
      errorBreakdown: any[];
      geographicDistribution: any[];
    };
  }> {
    return this.request(`/apis/${apiId}/analytics`);
  }

  // Favorites
  async toggleFavorite(apiId: string): Promise<{
    success: boolean;
    isFavorited: boolean;
  }> {
    return this.request(`/favorites/${apiId}`, {
      method: 'POST',
    });
  }

  async getFavorites(): Promise<{
    success: boolean;
    data: API[];
  }> {
    return this.request('/favorites');
  }

  // Categories
  async getCategories(): Promise<{
    success: boolean;
    data: Array<{
      name: string;
      count: number;
    }>;
  }> {
    return this.request('/categories');
  }

  // Search
  async searchAPIs(query: string, filters?: {
    category?: string;
    minPrice?: string;
    maxPrice?: string;
    minRating?: number;
    isActive?: boolean;
  }): Promise<{
    success: boolean;
    data: API[];
    meta: any;
  }> {
    const searchParams = new URLSearchParams({
      q: query,
      ...filters,
    });

    return this.request(`/search?${searchParams}`);
  }
}

// Create singleton instance
export const furoClient = new FuroAPIClient();

// Helper functions for wallet integration
export const createPaymentHandler = (
  signTransaction: (to: string, value: string, data?: string) => Promise<string>,
  getNetworkId: () => Promise<number>
) => {
  return async (paymentDetails: X402PaymentRequired['paymentDetails']): Promise<string> => {
    try {
      // Validate network
      const currentNetworkId = await getNetworkId();
      if (paymentDetails.networkId && currentNetworkId !== paymentDetails.networkId) {
        throw new Error(`Wrong network. Please switch to network ${paymentDetails.networkId}`);
      }

      // Create and sign transaction
      const transactionHash = await signTransaction(
        paymentDetails.providerWalletAddress,
        paymentDetails.requiredAmount,
        paymentDetails.paymentMemo
      );

      return transactionHash;
    } catch (error) {
      console.error('Payment failed:', error);
      throw new Error(`Payment failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };
};

export default furoClient;