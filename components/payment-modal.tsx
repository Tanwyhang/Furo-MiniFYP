'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import {
  ArrowRight,
  Clock,
  AlertTriangle,
  CheckCircle,
  ExternalLink,
  Wallet,
  Shield,
  Zap,
  Check,
  Copy,
} from 'lucide-react';
import { formatEther } from 'viem';
import { useAccount, useWalletClient, usePublicClient, useChainId, useSwitchChain } from 'wagmi';
import { X402PaymentRequired } from '@/lib/api-client';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  paymentDetails: any | null; // Updated to handle x402 response format
  isProcessing: boolean;
  transactionHash?: string | null;
  error?: string | null;
  onPaymentComplete?: (transactionHash: string) => void; // Add callback for payment completion
  providerWalletAddress?: string; // Provider wallet address
  platformFee?: number; // Platform fee percentage
}

export function PaymentModal({
  isOpen,
  onClose,
  paymentDetails,
  isProcessing,
  transactionHash,
  error,
  onPaymentComplete,
  providerWalletAddress,
  platformFee = 3, // Default 3% platform fee
}: PaymentModalProps) {
  // Web3 hooks
  const { address, isConnected } = useAccount();
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();

  // Component state
  const [isSendingPayment, setIsSendingPayment] = useState(false);
  const [copiedAddress, setCopiedAddress] = useState(false);
  const [completedTxHash, setCompletedTxHash] = useState<string | null>(null);
  const [networkError, setNetworkError] = useState<string | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);

  useEffect(() => {
    if (copiedAddress) {
      const timer = setTimeout(() => setCopiedAddress(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [copiedAddress]);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setCompletedTxHash(null);
      setIsSendingPayment(false);
      setCopiedAddress(false);
      setShowConfirmation(false);
    }
  }, [isOpen]);

  // Handle confirmation button click
  const handleConfirmSuccess = () => {
    console.log('🔄 User confirmed success, resetting modal state');

    // Reset all states to initial state
    setCompletedTxHash(null);
    setShowConfirmation(false);
    setNetworkError(null);
    setCopiedAddress(false);

    // Close the modal
    if (onClose) {
      onClose();
    }
  };

  // Network configuration
  const getNetworkChainId = (network: string): number => {
    switch (network?.toLowerCase()) {
      case 'mainnet': return 1;
      case 'polygon': return 137;
      case 'base': return 8453;
      case 'sepolia': return 11155111;
      case 'base-sepolia': return 84532;
      default: return 11155111; // Default to Sepolia
    }
  };

  // One-click payment function with real Web3 transaction
  const handleOneClickPayment = async () => {
    if (!paymentDetails || isSendingPayment || !walletClient || !publicClient) return;

    setIsSendingPayment(true);
    setNetworkError(null);

    try {
      console.log('💳 Initiating real Web3 transaction...');

      // Check if we're on the correct network
      const targetChainId = getNetworkChainId(paymentDetails.network || 'sepolia');
      if (chainId !== targetChainId) {
        console.log(`🔄 Switching to network: ${paymentDetails.network}`);
        await switchChain({ chainId: targetChainId });
      }

      // Prepare transaction
      const transactionParams = {
        to: paymentRecipient as `0x${string}`,
        value: BigInt(paymentDetails.amount),
        // You can add gas limit and other params here if needed
      };

      console.log('📝 Transaction params:', {
        to: transactionParams.to,
        value: formatEther(transactionParams.value),
        network: paymentDetails.network
      });

      // Send real transaction
      const transactionResult = await walletClient.sendTransaction(transactionParams);

      console.log('✅ Transaction sent:', transactionResult);

      // Wait for transaction confirmation
      console.log('⏳ Waiting for transaction confirmation...');
      const receipt = await publicClient.waitForTransactionReceipt({
        hash: transactionResult,
        confirmations: 1,
      });

      // Set completed hash AFTER confirmation to show success state
      setCompletedTxHash(transactionResult);

      console.log('🎉 Transaction confirmed:', {
        hash: receipt.transactionHash,
        blockNumber: receipt.blockNumber,
        status: receipt.status
      });

      // Important: Turn off processing state BEFORE showing success
      setIsSendingPayment(false);
      setShowConfirmation(true); // Show confirmation button
      console.log('✅ Processing state turned off, showing success message and confirmation');

      if (onPaymentComplete) {
        onPaymentComplete(transactionResult);
      }

    } catch (error: any) {
      console.error('❌ Payment failed:', error);
      setIsSendingPayment(false);

      // Handle specific error types
      if (error.code === 4001) {
        setNetworkError('Transaction rejected by user');
      } else if (error.code === -32603 || error.message?.includes('insufficient funds')) {
        setNetworkError('Insufficient funds for transaction');
      } else if (error.message?.includes('network')) {
        setNetworkError('Network error. Please try again');
      } else {
        setNetworkError(error.message || 'Payment transaction failed');
      }
    }
  };

  // Early return after all hooks are declared
  if (!paymentDetails) return null;

  // Calculate payment breakdown - P2P Zero Fees!
  const totalAmount = BigInt(paymentDetails.amount);
  const platformFeeAmount = BigInt(0); // Zero fees in P2P model
  const providerAmount = totalAmount; // 100% to provider!

  // P2P Direct Model - Always direct to provider
  const paymentRecipient = paymentDetails.address;
  const paymentModel = 'P2P Direct (0% Fees)';
  const amount = formatEther(totalAmount);
  const platformFeeFormatted = formatEther(platformFeeAmount);
  const providerAmountFormatted = formatEther(providerAmount);
  const truncatedAddress = `${paymentRecipient.slice(0, 6)}...${paymentRecipient.slice(-4)}`;

  const viewOnEtherscan = () => {
    const network = paymentDetails.network?.toLowerCase() || 'sepolia';
    const baseUrl = network === 'mainnet'
      ? 'https://etherscan.io'
      : network === 'polygon'
      ? 'https://polygonscan.com'
      : network === 'sepolia'
      ? 'https://sepolia.etherscan.io'
      : network === 'base'
      ? 'https://basescan.org'
      : 'https://sepolia.etherscan.io';

    if (completedTxHash) {
      window.open(`${baseUrl}/tx/${completedTxHash}`, '_blank');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader className="text-black rounded-t-lg">
          <DialogTitle className="flex items-center gap-2">
          </DialogTitle>
          <DialogDescription>
            Pay instantly to access this API. No manual transactions required.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {error && (
            <Card className="border-red-200 bg-red-50 dark:bg-red-950/20">
              <CardContent>
                <div className="flex items-center gap-3 text-red-700 dark:text-red-400">
                  <AlertTriangle className="h-5 w-5" />
                  <div>
                    <p className="font-medium">Payment Failed</p>
                    <p className="text-sm opacity-90">{error}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {networkError && (
            <Card className="border-orange-200 bg-orange-50 dark:bg-orange-950/20">
              <CardContent>
                <div className="flex items-center gap-3 text-orange-700 dark:text-orange-400">
                  <AlertTriangle className="h-5 w-5" />
                  <div>
                    <p className="font-medium">Network Error</p>
                    <p className="text-sm opacity-90">{networkError}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {isSendingPayment && (
            <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950/20">
              <CardContent>
                <div className="flex items-center gap-3 text-blue-700 dark:text-blue-400">
                  <Spinner size="md" className="text-blue-600" />
                  <div className="flex-1">
                    <p className="font-medium">Sending Payment...</p>
                    <p className="text-sm opacity-90">
                      Processing your transaction to the provider
                    </p>
                    <div className="mt-2">
                      <div className="w-full bg-blue-200 dark:bg-blue-800 rounded-full h-2">
                        <div className="bg-blue-600 h-2 rounded-full animate-pulse" style={{ width: '70%' }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {completedTxHash && !isSendingPayment && (
            <>
              <Card className="border-green-200 bg-green-50 dark:bg-green-950/20">
                <CardContent>
                  <div className="flex items-center gap-3 text-green-700 dark:text-green-400">
                    <CheckCircle className="h-5 w-5" />
                    <div className="flex-1">
                      <p className="font-medium">Payment Sent!</p>
                      <p className="text-sm opacity-90">
                        Transaction: {completedTxHash.slice(0, 10)}...
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={viewOnEtherscan}
                      className="flex items-center gap-2"
                    >
                      <ExternalLink className="h-4 w-4" />
                      View on Explorer
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {showConfirmation && (
                <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950/20">
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-green-700 dark:text-green-400 mb-2">
                        Payment Successful!
                      </h3>
                      <p className="text-sm text-green-600 dark:text-green-500 mb-4">
                        Your payment has been confirmed and the API has been added to your purchased list.
                      </p>
                      <Button
                        onClick={handleConfirmSuccess}
                        className="bg-green-600 hover:bg-green-700 text-white font-medium"
                        size="lg"
                      >
                        Confirm & Continue
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}

          {!completedTxHash && (
              <Card className="bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700 text-white">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 text-white text-2xl font-black font-sans">
                   <Shield className="h-6 w-6" />
                    X402 Payment
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-white">Total Payment</span>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-white">
                          {amount} {paymentDetails.currency || 'ETH'}
                        </div>
                        <Badge className="text-xs bg-white/20 text-white border-white/30">
                          1 API call
                        </Badge>
                      </div>
                    </div>

                    <div className="border-t border-white/20 pt-4">
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-blue-100">Payment Model</span>
                          <Badge className="bg-green-500 text-white border-green-600">
                            {paymentModel}
                          </Badge>
                        </div>

                        <div className="flex justify-between items-center">
                          <span className="text-sm text-blue-100">Platform Fee</span>
                          <div className="flex items-center gap-2">
                            <span className="text-green-300 font-bold">0% - P2P Direct!</span>
                            <div className="h-2 w-2 bg-green-400 rounded-full"></div>
                          </div>
                        </div>

                        <div className="flex justify-between items-center">
                          <span className="text-sm text-blue-100">Recipient</span>
                          <div className="flex items-center gap-2">
                            <code className="text-xs bg-white/20 px-2 py-1 rounded text-white">
                              {truncatedAddress}
                            </code>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                navigator.clipboard.writeText(paymentRecipient);
                                setCopiedAddress(true);
                              }}
                              className="h-6 w-6 p-0 text-white hover:bg-white/20"
                            >
                              {copiedAddress ? (
                                <CheckCircle className="h-3 w-3 text-green-300" />
                              ) : (
                                <Wallet className="h-3 w-3" />
                              )}
                            </Button>
                          </div>
                        </div>

                        <div className="flex justify-between items-center">
                          <span className="text-sm text-blue-100">Network</span>
                          <Badge className="bg-white/20 text-white border-white/30">
                            {paymentDetails.network?.toUpperCase() || 'SEPOLIA'}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    {!completedTxHash && (
                      <Button
                        onClick={handleOneClickPayment}
                        disabled={!walletClient || !isConnected}
                        className="w-full mt-6 bg-white text-blue-600 hover:bg-blue-50 font-semibold"
                        size="lg"
                      >
                        {!isConnected ? (
                          <>
                            <Wallet className="h-4 w-4 mr-2" />
                            Connect Wallet
                          </>
                        ) : !walletClient ? (
                          <>
                            <Wallet className="h-4 w-4 mr-2" />
                            Initializing Wallet...
                          </>
                        ) : (
                          <>
                            <Shield className="h-4 w-4 mr-2" />
                            Pay with Web3
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

          <div className="flex justify-between items-center pt-4 border-t">
            <div className="text-xs text-muted-foreground">
              Powered by x402 protocol • Secure, transparent, decentralized
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={isProcessing}
            >
              {transactionHash && !isProcessing ? 'Close' : 'Cancel'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default PaymentModal;