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
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AnimatedBeam from '@/components/ui/animated-beam';
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
  paymentDetails: X402PaymentRequired['paymentDetails'] | null;
  isProcessing: boolean;
  transactionHash?: string | null;
  error?: string | null;
}

export function PaymentModal({
  isOpen,
  onClose,
  paymentDetails,
  isProcessing,
  transactionHash,
  error,
}: PaymentModalProps) {
  const [copiedAddress, setCopiedAddress] = useState(false);

  useEffect(() => {
    if (copiedAddress) {
      const timer = setTimeout(() => setCopiedAddress(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [copiedAddress]);

  if (!paymentDetails) return null;

  const amount = formatEther(paymentDetails.requiredAmount as `0x${string}`);
  const truncatedAddress = `${paymentDetails.providerWalletAddress.slice(0, 6)}...${paymentDetails.providerWalletAddress.slice(-4)}`;

  const copyAddress = async () => {
    try {
      await navigator.clipboard.writeText(paymentDetails.providerWalletAddress);
      setCopiedAddress(true);
    } catch (error) {
      console.error('Failed to copy address:', error);
    }
  };

  const viewOnEtherscan = () => {
    const baseUrl = paymentDetails.networkId === 1
      ? 'https://etherscan.io'
      : paymentDetails.networkId === 137
      ? 'https://polygonscan.com'
      : paymentDetails.networkId === 11155111
      ? 'https://sepolia.etherscan.io'
      : 'https://etherscan.io';

    if (transactionHash) {
      window.open(`${baseUrl}/tx/${transactionHash}`, '_blank');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            x402 Payment Required
          </DialogTitle>
          <DialogDescription>
            Complete the payment to access this API. Each token provides one API call.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {error && (
            <Card className="border-red-200 bg-red-50 dark:bg-red-950/20">
              <CardContent className="pt-6">
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

          {isProcessing && (
            <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950/20">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 text-blue-700 dark:text-blue-400">
                  <div className="animate-spin">
                    <Zap className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-medium">Processing Payment</p>
                    <p className="text-sm opacity-90">
                      {transactionHash ? 'Confirming transaction...' : 'Awaiting wallet confirmation...'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {transactionHash && !isProcessing && (
            <Card className="border-green-200 bg-green-50 dark:bg-green-950/20">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 text-green-700 dark:text-green-400">
                  <CheckCircle className="h-5 w-5" />
                  <div className="flex-1">
                    <p className="font-medium">Payment Successful!</p>
                    <p className="text-sm opacity-90">Your API call is now being processed.</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={viewOnEtherscan}
                    className="flex items-center gap-2"
                  >
                    <ExternalLink className="h-4 w-4" />
                    View on Etherscan
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          <Tabs defaultValue="payment" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="payment">Payment Details</TabsTrigger>
              <TabsTrigger value="flow">Payment Flow</TabsTrigger>
            </TabsList>

            <TabsContent value="payment" className="space-y-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Amount to Pay</span>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-primary">
                          {amount} ETH
                        </div>
                        <Badge variant="secondary" className="text-xs">
                          {paymentDetails.numberOfTokens || 1} token{(paymentDetails.numberOfTokens || 1) > 1 ? 's' : ''}
                        </Badge>
                      </div>
                    </div>

                    <div className="border-t pt-4">
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Recipient</span>
                          <div className="flex items-center gap-2">
                            <code className="text-xs bg-muted px-2 py-1 rounded">
                              {truncatedAddress}
                            </code>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={copyAddress}
                              className="h-6 w-6 p-0"
                            >
                              {copiedAddress ? (
                                <CheckCircle className="h-3 w-3 text-green-600" />
                              ) : (
                                <Wallet className="h-3 w-3" />
                              )}
                            </Button>
                          </div>
                        </div>

                        {paymentDetails.networkId && (
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-muted-foreground">Network</span>
                            <Badge variant="outline">
                              {paymentDetails.networkId === 1 ? 'Ethereum' :
                               paymentDetails.networkId === 137 ? 'Polygon' :
                               paymentDetails.networkId === 11155111 ? 'Sepolia Testnet' :
                               `Chain ID: ${paymentDetails.networkId}`}
                            </Badge>
                          </div>
                        )}

                        {paymentDetails.expiresAt && (
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-muted-foreground">Expires</span>
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              <span className="text-xs">
                                {new Date(paymentDetails.expiresAt).toLocaleString()}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="flow" className="space-y-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <div className="text-center">
                      <h4 className="font-medium mb-4">x402 Payment Flow</h4>
                    </div>

                    <div className="relative h-32">
                      <AnimatedBeam
                        containerRef={null}
                        fromRef={null}
                        toRef={null}
                        reverse={false}
                        duration={3}
                        gradientStartColor="#3b82f6ff"
                        pathColor="#3b82f6ff"
                        pathOpacity={0.3}
                        className="absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-500 via-blue-300 to-green-500"
                      />

                      <div className="absolute top-0 left-0 right-0 flex justify-between items-center">
                        <div className="flex flex-col items-center">
                          <div className="flex items-center justify-center w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full">
                            <Wallet className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                          </div>
                          <span className="text-xs font-medium mt-2">Your Wallet</span>
                        </div>

                        <div className="flex flex-col items-center">
                          <div className="flex items-center justify-center w-12 h-12 bg-orange-100 dark:bg-orange-900 rounded-full">
                            <Shield className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                          </div>
                          <span className="text-xs font-medium mt-2">x402 Protocol</span>
                        </div>

                        <div className="flex flex-col items-center">
                          <div className="flex items-center justify-center w-12 h-12 bg-green-100 dark:bg-green-900 rounded-full">
                            <Zap className="h-6 w-6 text-green-600 dark:text-green-400" />
                          </div>
                          <span className="text-xs font-medium mt-2">API Access</span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-xs text-center">
                      <div>
                        <div className="font-medium">1. Pay</div>
                        <div className="text-muted-foreground">Send ETH payment</div>
                      </div>
                      <div>
                        <div className="font-medium">2. Verify</div>
                        <div className="text-muted-foreground">Transaction confirmed</div>
                      </div>
                      <div>
                        <div className="font-medium">3. Access</div>
                        <div className="text-muted-foreground">Receive API token</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-muted/30">
                <CardContent className="pt-6">
                  <div className="space-y-2">
                    <h5 className="font-medium text-sm">How it works:</h5>
                    <ul className="text-xs text-muted-foreground space-y-1">
                      <li>• Payment is sent directly to the API provider</li>
                      <li>• Furo verifies the transaction on-chain</li>
                      <li>• You receive single-use tokens for API calls</li>
                      <li>• Each token = one valid API call</li>
                      <li>• Tokens expire after 24 hours</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

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