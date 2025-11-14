'use client';

import { useState, useCallback, useEffect } from 'react';
import { useAccount, useWalletClient, useChainId, useSwitchChain, usePublicClient } from 'wagmi';
import { parseEther, formatEther } from 'viem';
import { toast } from 'sonner';
import { furoClient, X402PaymentRequired, PaymentResponse } from '@/lib/api-client';

interface UseX402PaymentOptions {
  onSuccess?: (data: any) => void;
  onError?: (error: Error) => void;
  onPaymentRequired?: (paymentDetails: X402PaymentRequired['paymentDetails']) => void;
}

interface PaymentState {
  isLoading: boolean;
  isProcessingPayment: boolean;
  currentPayment: X402PaymentRequired['paymentDetails'] | null;
  transactionHash: string | null;
  error: string | null;
}

export const useX402Payment = (options: UseX402PaymentOptions = {}) => {
  // Default values for when wagmi context is not available
  const defaultState = {
    address: null as string | null,
    isConnected: false,
    walletClient: null as any,
    chainId: null as number | null,
    switchChain: null as any,
    publicClient: null as any
  };

  let wagmiData = defaultState;
  let hasWagmiContext = false;

  try {
    const account = useAccount();
    wagmiData = {
      address: account.address || null,
      isConnected: account.isConnected,
      walletClient: useWalletClient().data,
      chainId: useChainId(),
      switchChain: useSwitchChain(),
      publicClient: usePublicClient()
    };
    hasWagmiContext = true;
  } catch (error) {
    console.warn('Wagmi context not available:', error);
    // Hook will return default values
  }

  // Safely extract values with fallbacks
  const address = wagmiData.address;
  const isConnected = wagmiData.isConnected;
  const walletClient = wagmiData.walletClient;
  const chainId = wagmiData.chainId;
  const { switchChain } = wagmiData;
  const publicClient = wagmiData.publicClient;

  const [paymentState, setPaymentState] = useState<PaymentState>({
    isLoading: false,
    isProcessingPayment: false,
    currentPayment: null,
    transactionHash: null,
    error: null,
  });

  const resetPaymentState = useCallback(() => {
    setPaymentState({
      isLoading: false,
      isProcessingPayment: false,
      currentPayment: null,
      transactionHash: null,
      error: null,
    });
  }, []);

  const handlePaymentRequired = useCallback(async (
    paymentDetails: X402PaymentRequired['paymentDetails']
  ): Promise<string> => {
    return new Promise(async (resolve, reject) => {
      try {
        // Check if wallet is connected
        if (!isConnected || !address) {
          throw new Error('Please connect your wallet to make payments');
        }

        // Check if wallet client is available
        if (!walletClient) {
          throw new Error('Wallet client not available');
        }

        // Check network compatibility
        if (paymentDetails.networkId && chainId !== paymentDetails.networkId) {
          toast.error(`Please switch to the correct network (ID: ${paymentDetails.networkId})`);

          // Try to switch network
          if (switchChain && paymentDetails.networkId) {
            try {
              await switchChain({ chainId: paymentDetails.networkId });
              toast.success('Network switched successfully');
            } catch (switchError) {
              throw new Error(`Please switch to network ${paymentDetails.networkId} manually`);
            }
          } else {
            throw new Error(`Please switch to network ${paymentDetails.networkId}`);
          }
        }

        // Format the amount
        const amountInWei = paymentDetails.requiredAmount.startsWith('0x')
          ? BigInt(paymentDetails.requiredAmount)
          : parseEther(paymentDetails.requiredAmount);

        // Create transaction request
        const transactionRequest = {
          to: paymentDetails.providerWalletAddress as `0x${string}`,
          value: amountInWei,
          data: paymentDetails.paymentMemo ? (`0x${Buffer.from(paymentDetails.paymentMemo).toString('hex')}` as `0x${string}`) : '0x',
        };

        setPaymentState(prev => ({
          ...prev,
          currentPayment: paymentDetails,
          isProcessingPayment: true,
          error: null,
        }));

        // Notify about payment requirement
        if (options.onPaymentRequired) {
          options.onPaymentRequired(paymentDetails);
        }

        toast.info(`Payment required: ${formatEther(amountInWei)} ETH`);

        // Request user approval and send transaction
        const transaction = await walletClient.sendTransaction(transactionRequest);

        toast.loading('Processing payment...');

        // Wait for transaction confirmation
        const receipt = await publicClient?.waitForTransactionReceipt({ hash: transaction });

        if (!receipt || receipt.status === 'reverted') {
          throw new Error('Transaction failed');
        }

        const transactionHash = transaction;

        setPaymentState(prev => ({
          ...prev,
          transactionHash,
          isProcessingPayment: false,
        }));

        toast.success('Payment processed successfully!');

        resolve(transactionHash);

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Payment failed';

        setPaymentState(prev => ({
          ...prev,
          error: errorMessage,
          isProcessingPayment: false,
        }));

        toast.error(errorMessage);
        reject(new Error(errorMessage));
      }
    });
  }, [isConnected, address, walletClient, chainId, switchChain, publicClient, options, hasWagmiContext]);

  const executeAPICall = useCallback(async (
    apiId: string,
    params?: Record<string, any>
  ) => {
    if (!address) {
      const error = new Error('Please connect your wallet');
      options.onError?.(error);
      toast.error('Please connect your wallet');
      throw error;
    }

    setPaymentState(prev => ({
      ...prev,
      isLoading: true,
      error: null,
    }));

    try {
      // Set developer address in client
      furoClient.setDeveloperAddress(address);

      // Execute API call with automatic payment handling
      const result = await furoClient.executeAPICallWithPayment(
        apiId,
        params,
        handlePaymentRequired
      );

      setPaymentState(prev => ({
        ...prev,
        isLoading: false,
      }));

      options.onSuccess?.(result);
      toast.success('API call executed successfully!');

      return result;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'API call failed';

      setPaymentState(prev => ({
        ...prev,
        error: errorMessage,
        isLoading: false,
      }));

      options.onError?.(error instanceof Error ? error : new Error(errorMessage));
      toast.error(errorMessage);

      throw error;
    }
  }, [address, handlePaymentRequired, options]);

  const callAPI = useCallback(executeAPICall, [executeAPICall]);

  return {
    // State
    isLoading: paymentState.isLoading,
    isProcessingPayment: paymentState.isProcessingPayment,
    currentPayment: paymentState.currentPayment,
    transactionHash: paymentState.transactionHash,
    error: paymentState.error,

    // Actions
    callAPI,
    resetPaymentState,

    // Helpers
    isReady: isConnected && !!address,
    isConnected,
    address,
    chainId,
  };
};

export default useX402Payment;