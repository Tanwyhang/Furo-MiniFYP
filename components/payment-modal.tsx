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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ArrowRight,
  Clock,
  AlertTriangle,
  CheckCircle,
  ExternalLink,
  Wallet,
  Shield,
  Zap,
} from 'lucide-react';
import { formatEther } from 'viem';
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
  // All hooks must be called at the top level
  const [isSendingPayment, setIsSendingPayment] = useState(false);
  const [copiedAddress, setCopiedAddress] = useState(false);
  const [completedTxHash, setCompletedTxHash] = useState<string | null>(null);

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
    }
  }, [isOpen]);

  // One-click payment function
  const handleOneClickPayment = async () => {
    if (!paymentDetails || isSendingPayment) return;

    setIsSendingPayment(true);

    try {
      // In production, this would use Web3 library (ethers.js, viem, etc.) to send transaction
      // For now, we'll simulate the transaction sending
      console.log('💳 Sending payment transaction...');

      // Simulate transaction sending
      setTimeout(() => {
        const simulatedTxHash = '0x' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
        setCompletedTxHash(simulatedTxHash);
        setIsSendingPayment(false);

        if (onPaymentComplete) {
          onPaymentComplete(simulatedTxHash);
        }
      }, 2000);

    } catch (error) {
      console.error('Payment failed:', error);
      setIsSendingPayment(false);
    }
  };

  // Early return after all hooks are declared
  if (!paymentDetails) return null;

  // Calculate payment breakdown
  const totalAmount = BigInt(paymentDetails.amount);
  const platformFeeAmount = (totalAmount * BigInt(platformFee)) / BigInt(100);
  const providerAmount = totalAmount - platformFeeAmount;

  // Use provider wallet address directly
  const paymentRecipient = providerWalletAddress || paymentDetails.address;
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
            <Shield className="h-5 w-5" />
            One-Click Payment
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

          {isSendingPayment && (
            <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950/20">
              <CardContent className="pt-6">
                <header>
                  <h3 className="text-lg font-medium mb-2">Processing Payment</h3>
                </header>
                <div className="flex items-center gap-3 text-blue-700 dark:text-blue-400">
                  <div className="animate-spin">
                    <Zap className="h-5 w-5" />
                  </div>
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
          )}

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
                          <span className="text-sm text-blue-100">Provider</span>
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
                        disabled={isSendingPayment}
                        className="w-full mt-6 bg-white text-blue-600 hover:bg-blue-50 font-semibold"
                        size="lg"
                      >
                        {isSendingPayment ? (
                          <>
                            <div className="animate-spin mr-2">
                              <Zap className="h-4 w-4" />
                            </div>
                            Processing Payment...
                          </>
                        ) : (
                          <>
                            <Shield className="h-4 w-4 mr-2" />
                            Pay Now - One Click
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>

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