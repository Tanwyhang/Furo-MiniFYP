'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  ExternalLink,
  ArrowLeft,
  CheckCircle,
  Clock,
  AlertTriangle,
} from 'lucide-react';
import { formatEther } from 'viem';

interface Transaction {
  id: string;
  transactionHash: string;
  amount: string;
  currency: string;
  numberOfTokens: number;
  isVerified: boolean;
  createdAt: string;
  apiId?: string;
  apiName?: string;
  blockNumber?: bigint;
  blockTimestamp?: string;
  network?: string;
}

interface TransactionHistoryProps {
  developerAddress: string;
  onBack?: () => void;
}

export function TransactionHistory({ developerAddress, onBack }: TransactionHistoryProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadTransactions = async () => {
      if (!developerAddress) return;

      try {
        const response = await fetch(`/api/payments/history?developerAddress=${developerAddress}`);
        const data = await response.json();

        if (data.success) {
          setTransactions(data.data);
        } else {
          setError(data.error || 'Failed to load transaction history');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load transactions');
      } finally {
        setIsLoading(false);
      }
    };

    loadTransactions();
  }, [developerAddress]);

  const getStatusIcon = (transaction: Transaction) => {
    if (transaction.isVerified) {
      return <CheckCircle className="h-4 w-4 text-green-600" />;
    } else if (transaction.blockNumber) {
      return <Clock className="h-4 w-4 text-yellow-600" />;
    } else {
      return <AlertTriangle className="h-4 w-4 text-red-600" />;
    }
  };

  const getStatusText = (transaction: Transaction) => {
    if (transaction.isVerified) {
      return 'Verified';
    } else if (transaction.blockNumber) {
      return 'Pending';
    } else {
      return 'Failed';
    }
  };

  const viewOnExplorer = (transactionHash: string, network = 'sepolia') => {
    const baseUrl = network === 'mainnet'
      ? 'https://etherscan.io'
      : network === 'polygon'
      ? 'https://polygonscan.com'
      : network === 'base'
      ? 'https://basescan.org'
      : 'https://sepolia.etherscan.io';

    window.open(`${baseUrl}/tx/${transactionHash}`, '_blank');
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="pt-6">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-4 w-24" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-3 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            <div>
              <p className="font-medium">Error loading transactions</p>
              <p className="text-sm opacity-90">{error}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (transactions.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6 text-center">
          <p className="text-muted-foreground">No transactions found</p>
          <p className="text-sm text-muted-foreground mt-2">
            Your payment history will appear here once you make your first API purchase.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        {onBack && (
          <Button variant="outline" size="sm" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        )}
        <h2 className="text-2xl font-bold">Transaction History</h2>
      </div>

      <div className="space-y-3">
        {transactions.map((transaction) => (
          <Card key={transaction.id}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(transaction)}
                    <span className="font-medium">{transaction.apiName || 'API Purchase'}</span>
                    <Badge variant={transaction.isVerified ? 'default' : 'secondary'}>
                      {getStatusText(transaction)}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-6 text-sm text-muted-foreground">
                    <span>
                      {formatEther(BigInt(transaction.amount))} {transaction.currency}
                    </span>
                    <span>{transaction.numberOfTokens} token{transaction.numberOfTokens !== 1 ? 's' : ''}</span>
                    <span>{new Date(transaction.createdAt).toLocaleDateString()}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <code className="text-xs bg-muted px-2 py-1 rounded">
                      {transaction.transactionHash.slice(0, 10)}...{transaction.transactionHash.slice(-8)}
                    </code>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => viewOnExplorer(transaction.transactionHash, transaction.network)}
                      className="h-6 w-6 p-0"
                    >
                      <ExternalLink className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export default TransactionHistory;