'use client';

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Package,
  Clock,
  CheckCircle,
  XCircle,
  TrendingUp,
  DollarSign,
  ExternalLink,
  Filter,
  RefreshCw,
  Wallet,
  AlertCircle,
  Activity,
  BarChart3,
  Eye,
  ShoppingBag
} from 'lucide-react';

const Header = dynamic(() => import('@/components/header').then(mod => ({ default: mod.Header })), {
  ssr: false
});

interface PurchasedAPI {
  id: string;
  apiId: string;
  apiName: string;
  apiDescription: string;
  apiCategory: string;
  apiEndpoint: string;
  pricePerCall: string;
  currency: string;
  provider: {
    id: string;
    name: string;
    walletAddress: string;
  };
  purchase: {
    transactionHash: string;
    amountPaid: string;
    currency: string;
    tokensPurchased: number;
    tokensIssued: number;
    purchasedAt: string;
    blockTimestamp?: string;
  };
  tokens: {
    total: number;
    active: number;
    used: number;
    expired: number;
    available: number;
  };
  status: 'active' | 'expired';
  expiresAt?: number;
}

interface PurchasedAPIsResponse {
  success: boolean;
  data: PurchasedAPI[];
  summary: {
    totalAPIsPurchased: number;
    totalTokensPurchased: number;
    activeTokens: number;
    usedTokens: number;
    expiredTokens: number;
    totalSpent: number;
    activeAPIs: number;
  };
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export default function PurchasedAPIsPage() {
  const { address, isConnected } = useAccount();
  const [purchasedAPIs, setPurchasedAPIs] = useState<PurchasedAPI[]>([]);
  const [summary, setSummary] = useState<PurchasedAPIsResponse['summary'] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [callingAPI, setCallingAPI] = useState<string | null>(null);
  const [apiCallResults, setApiCallResults] = useState<Record<string, any>>({});

  useEffect(() => {
    if (isConnected && address) {
      loadPurchasedAPIs();
    }
  }, [isConnected, address, activeTab, currentPage]);

  const loadPurchasedAPIs = async () => {
    if (!address) return;

    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        developerAddress: address,
        page: currentPage.toString(),
        limit: '10',
        status: activeTab === 'all' ? '' : activeTab,
      });

      const response = await fetch(`/api/purchased-apis?${params}`);
      const data: PurchasedAPIsResponse = await response.json();

      if (data.success) {
        setPurchasedAPIs(data.data);
        setSummary(data.summary);
        setTotalPages(data.pagination.totalPages);
      }
    } catch (error) {
      console.error('Error loading purchased APIs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatTokenExpiry = (timestamp?: number) => {
    if (!timestamp) return null;
    const expiryDate = new Date(timestamp);
    const now = new Date();
    const hoursLeft = Math.max(0, Math.floor((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60)));

    if (hoursLeft === 0) return 'Expired';
    if (hoursLeft < 1) return '< 1 hour';
    if (hoursLeft < 24) return `${hoursLeft}h`;
    return `${Math.floor(hoursLeft / 24)}d ${hoursLeft % 24}h`;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-200">Active</Badge>;
      case 'expired':
        return <Badge variant="secondary">Expired</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const truncateHash = (hash: string) => {
    return `${hash.slice(0, 6)}...${hash.slice(-4)}`;
  };

  // Function to call API programmatically
  const callAPI = async (api: PurchasedAPI) => {
    if (!address) return;

    setCallingAPI(api.id);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_URL}/api/apis/public/${api.apiEndpoint}`, {
        method: 'GET',
        headers: {
          'X-Developer-Address': address,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (data.success) {
        setApiCallResults(prev => ({
          ...prev,
          [api.id]: { success: true, data: data.data, timestamp: new Date().toISOString() }
        }));
      } else {
        setApiCallResults(prev => ({
          ...prev,
          [api.id]: { success: false, error: data.error, timestamp: new Date().toISOString() }
        }));
      }
    } catch (error) {
      setApiCallResults(prev => ({
        ...prev,
        [api.id]: { success: false, error: error instanceof Error ? error.message : 'Unknown error', timestamp: new Date().toISOString() }
      }));
    } finally {
      setCallingAPI(null);
    }
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-background dark">
        <Header theme="dark" />
        <main className="container mx-auto px-4 py-16 max-w-4xl">
          <div className="text-center">
            <Wallet className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h1 className="text-4xl font-bold mb-4">Connect Your Wallet</h1>
            <p className="text-muted-foreground text-lg mb-8">
              Connect your wallet to view your purchased APIs and token usage
            </p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background dark">
      <Header theme="dark" />

      <main className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">Your Purchased APIs</h1>
            <p className="text-muted-foreground text-lg">
              Manage your API tokens and track usage across your purchased services
            </p>
          </div>
          <Button
            onClick={loadPurchasedAPIs}
            variant="outline"
            disabled={isLoading}
            className="flex items-center gap-2 text-white"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {isLoading ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <Card key={i}>
                  <CardHeader className="pb-2">
                    <Skeleton className="h-4 w-20" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-8 w-16 mb-2" />
                    <Skeleton className="h-4 w-24" />
                  </CardContent>
                </Card>
              ))}
            </div>
            <div className="grid grid-cols-1 gap-6">
              {[...Array(3)].map((_, i) => (
                <Card key={i}>
                  <CardContent className="pt-6">
                    <Skeleton className="h-32 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ) : summary && purchasedAPIs.length > 0 ? (
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">APIs Purchased</CardTitle>
                  <Package className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{summary.totalAPIsPurchased}</div>
                  <p className="text-xs text-muted-foreground">
                    {summary.activeAPIs} active
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Tokens</CardTitle>
                  <Activity className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{summary.totalTokensPurchased}</div>
                  <p className="text-xs text-muted-foreground">
                    {summary.activeTokens} available
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Used Tokens</CardTitle>
                  <CheckCircle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{summary.usedTokens}</div>
                  <p className="text-xs text-muted-foreground">
                    {summary.totalTokensPurchased > 0 ?
                      Math.round((summary.usedTokens / summary.totalTokensPurchased) * 100) : 0
                    }% used
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{summary.totalSpent.toFixed(4)} ETH</div>
                  <p className="text-xs text-muted-foreground">
                    Across all purchases
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Tabs for filtering */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
              <div className="flex items-center justify-between">
                <TabsList>
                  <TabsTrigger value="all">All APIs</TabsTrigger>
                  <TabsTrigger value="active">Active</TabsTrigger>
                  <TabsTrigger value="expired">Expired</TabsTrigger>
                </TabsList>
                <div className="text-sm text-muted-foreground">
                  {purchasedAPIs.length} APIs
                </div>
              </div>

              <TabsContent value={activeTab} className="space-y-4">
                {/* Purchased APIs List */}
                <div className="grid gap-4">
                  {purchasedAPIs.map((api) => (
                    <Card key={api.id} className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-semibold">{api.apiName}</h3>
                            {getStatusBadge(api.status)}
                            <Badge variant="outline">{api.apiCategory}</Badge>
                          </div>

                          <p className="text-muted-foreground mb-4 line-clamp-2">
                            {api.apiDescription}
                          </p>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                            {/* Token Information */}
                            <div className="space-y-2">
                              <div className="flex items-center gap-2 text-sm">
                                <Activity className="h-4 w-4 text-blue-500" />
                                <span className="font-medium">Tokens:</span>
                                <span>{api.tokens.active}/{api.tokens.total}</span>
                              </div>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <CheckCircle className="h-3 w-3 text-green-500" />
                                <span>Used: {api.tokens.used}</span>
                              </div>
                              {api.tokens.expired > 0 && (
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                  <XCircle className="h-3 w-3 text-red-500" />
                                  <span>Expired: {api.tokens.expired}</span>
                                </div>
                              )}
                            </div>

                            {/* Purchase Information */}
                            <div className="space-y-2">
                              <div className="flex items-center gap-2 text-sm">
                                <DollarSign className="h-4 w-4 text-green-500" />
                                <span className="font-medium">Paid:</span>
                                <span>{parseFloat(api.purchase.amountPaid).toFixed(4)} {api.purchase.currency}</span>
                              </div>
                              <div className="text-sm text-muted-foreground">
                                Purchased: {formatDate(api.purchase.purchasedAt)}
                              </div>
                              {api.expiresAt && (
                                <div className="text-sm text-muted-foreground">
                                  Expires: {formatTokenExpiry(api.expiresAt)}
                                </div>
                              )}
                            </div>

                            {/* Provider Information */}
                            <div className="space-y-2">
                              <div className="flex items-center gap-2 text-sm">
                                <Wallet className="h-4 w-4 text-purple-500" />
                                <span className="font-medium">Provider:</span>
                                <span>{api.provider.name}</span>
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {truncateHash(api.provider.walletAddress)}
                              </div>
                            </div>
                          </div>

                          {/* API Call Results */}
                          {apiCallResults[api.id] && (
                            <div className={`p-3 rounded-lg mb-3 ${apiCallResults[api.id].success ? 'bg-green-50 dark:bg-green-950/20 border border-green-200' : 'bg-red-50 dark:bg-red-950/20 border border-red-200'}`}>
                              <div className="flex items-center gap-2 text-sm">
                                {apiCallResults[api.id].success ? (
                                  <CheckCircle className="h-4 w-4 text-green-600" />
                                ) : (
                                  <XCircle className="h-4 w-4 text-red-600" />
                                )}
                                <span className={apiCallResults[api.id].success ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'}>
                                  {apiCallResults[api.id].success ? 'API Call Successful' : 'API Call Failed'}
                                </span>
                              </div>
                              <div className="text-xs text-muted-foreground mt-1">
                                {apiCallResults[api.id].timestamp}
                              </div>
                              {apiCallResults[api.id].success && apiCallResults[api.id].data && (
                                <div className="mt-2">
                                  <pre className="text-xs bg-white dark:bg-gray-900 p-2 rounded border overflow-x-auto">
                                    {JSON.stringify(apiCallResults[api.id].data, null, 2)}
                                  </pre>
                                </div>
                              )}
                              {!apiCallResults[api.id].success && (
                                <div className="mt-1 text-xs text-red-600">
                                  Error: {apiCallResults[api.id].error}
                                </div>
                              )}
                            </div>
                          )}

                          {/* Action Buttons */}
                          <div className="flex items-center gap-3 pt-4 border-t">
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() => callAPI(api)}
                              disabled={callingAPI === api.id || api.status === 'expired'}
                              className="flex items-center gap-2"
                            >
                              {callingAPI === api.id ? (
                                <>
                                  <div className="animate-spin h-3 w-3 border border-current border-t-transparent rounded-full" />
                                  Calling...
                                </>
                              ) : (
                                <>
                                  <BarChart3 className="h-4 w-4" />
                                  Call API
                                </>
                              )}
                            </Button>

                            <Link href={`/api/${api.apiId}`}>
                              <Button variant="outline" size="sm">
                                <Eye className="h-4 w-4 mr-1" />
                                View Details
                              </Button>
                            </Link>

                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => window.open(`https://sepolia.etherscan.io/tx/${api.purchase.transactionHash}`, '_blank')}
                            >
                              <ExternalLink className="h-4 w-4 mr-1" />
                              Transaction
                            </Button>

                            {api.status === 'expired' && (
                              <Badge variant="destructive" className="ml-auto">
                                <AlertCircle className="h-3 w-3 mr-1" />
                                Expired
                              </Badge>
                            )}
                          </div>

                          {/* Programmatic Access Info */}
                          <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                            <div className="flex items-center gap-2 text-sm mb-2">
                              <Package className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                              <span className="font-medium text-blue-700 dark:text-blue-300">Programmatic Access</span>
                            </div>
                            <div className="space-y-1 text-xs">
                              <div className="flex items-center justify-between">
                                <span className="text-muted-foreground">Endpoint:</span>
                                <code className="bg-white dark:bg-gray-900 px-2 py-1 rounded">
                                  {api.apiEndpoint}
                                </code>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-muted-foreground">Method:</span>
                                <code className="bg-white dark:bg-gray-900 px-2 py-1 rounded">
                                  GET
                                </code>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-muted-foreground">Auth Header:</span>
                                <code className="bg-white dark:bg-gray-900 px-2 py-1 rounded text-xs">
                                  X-Developer-Address
                                </code>
                              </div>
                              <div className="mt-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    const code = `curl -H "X-Developer-Address: ${address}" "${window.location.origin}/api/apis/public/${api.apiEndpoint}"`;
                                    navigator.clipboard.writeText(code);
                                  }}
                                  className="text-xs"
                                >
                                  Copy cURL Command
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex justify-center items-center gap-2 pt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                    >
                      Previous
                    </Button>
                    <span className="text-sm text-muted-foreground">
                      Page {currentPage} of {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                    >
                      Next
                    </Button>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        ) : (
          <div className="text-center py-16">
            <Package className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-2xl font-semibold mb-2">No Purchased APIs</h2>
            <p className="text-muted-foreground mb-6">
              You haven't purchased any API access yet. Start by exploring the marketplace.
            </p>
            <Link href="/marketplace">
              <Button>
                <ShoppingBag className="h-4 w-4 mr-2" />
                Browse Marketplace
              </Button>
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}