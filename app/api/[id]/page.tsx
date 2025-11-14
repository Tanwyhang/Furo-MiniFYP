'use client';

import { useState, useRef, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Button } from '@/components/ui/button';
import AnimatedBeam from '@/components/ui/animated-beam';
import { PaymentModal } from '@/components/payment-modal';
import { ProviderGuard } from '@/components/provider-guard';

// Dynamic imports to avoid SSR issues
const Header = dynamic(() => import('@/components/header').then(mod => ({ default: mod.Header })), {
  ssr: false
});

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Alert,
  AlertDescription,
} from '@/components/ui/alert';
import {
  Star,
  Activity,
  DollarSign,
  Shield,
  AlertCircle,
  ArrowLeft,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useParams } from 'next/navigation';
import { furoClient, API } from '@/lib/api-client';
import { useX402Payment } from '@/hooks/use-x402-payment';
import { formatEther } from 'viem';

// Web3 Component - wrapped in provider guard
function Web3EnabledPage({
  apiId,
}: {
  apiId: string;
}) {
  const [api, setAPI] = useState<API | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [apiCallResult, setAPICallResult] = useState<any>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [apiParams, setApiParams] = useState<Record<string, any>>({});

  // Refs for animation
  const beamContainerRef = useRef<HTMLDivElement>(null);
  const walletRef = useRef<HTMLDivElement>(null);
  const apiRef = useRef<HTMLDivElement>(null);

  // Router for navigation
  const router = useRouter();

  // X402 payment hook
  const {
    callAPI,
    isLoading: isPaymentLoading,
    isProcessingPayment,
    currentPayment,
    transactionHash,
    error: paymentError,
    isReady,
  } = useX402Payment({
    onSuccess: (result) => {
      setAPICallResult(result);
      setIsPaymentModalOpen(false);
    },
    onError: (error) => {
      console.error('API call failed:', error);
    },
  });

  // Load API details
  useEffect(() => {
    const loadAPI = async () => {
      try {
        const apiData = await furoClient.getAPI(apiId);
        setAPI(apiData.data);
      } catch (err) {
        console.error('Error loading API:', err);
        setError(err instanceof Error ? err.message : 'Failed to load API');
      } finally {
        setIsLoading(false);
      }
    };

    loadAPI();
  }, [apiId]);

  // Handlers
  const handlePayAndCall = () => {
    if (!api || !isReady) return;
    setIsPaymentModalOpen(true);
  };

  const handleBackClick = () => {
    router.back();
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background text-foreground overflow-hidden dark">
        <Header theme="dark" />
        <main className="container mx-auto px-4 py-8">
          <div className="space-y-6">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-96 w-full" />
          </div>
        </main>
      </div>
    );
  }

  // Error state
  if (error || !api) {
    return (
      <div className="min-h-screen bg-background text-foreground overflow-hidden dark">
        <Header theme="dark" />
        <main className="container mx-auto px-4 py-8">
          <Alert variant="destructive" className="max-w-2xl">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {error || 'API not found'}
            </AlertDescription>
          </Alert>
          <Button
            variant="outline"
            onClick={handleBackClick}
            className="mt-4 flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Marketplace
          </Button>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground overflow-hidden dark">
      <Header theme="dark" />

      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* API Header */}
            <Card>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-2xl mb-2">{api.name}</CardTitle>
                    <div className="flex items-center gap-4 mb-4">
                      <Badge variant="secondary">{api.category}</Badge>
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                        <span className="font-medium">
                          {api.averageRating?.toFixed(1) || '0.0'}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Activity className="h-4 w-4" />
                        {api.totalCalls.toLocaleString()} calls
                      </div>
                    </div>
                  </div>
                  <Badge variant={api.isActive ? 'default' : 'secondary'}>
                    {api.isActive ? 'active' : 'inactive'}
                  </Badge>
                </div>
                <p className="text-muted-foreground">{api.description}</p>
              </CardHeader>
            </Card>

            {/* API Call Result */}
            {apiCallResult && (
              <Card className="border-green-200 bg-green-50 dark:bg-green-950/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-green-700 dark:text-green-400">
                    <Shield className="h-5 w-5" />
                    API Response
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <pre className="bg-white dark:bg-gray-900 p-4 rounded text-sm overflow-x-auto border">
                    {JSON.stringify(apiCallResult, null, 2)}
                  </pre>
                </CardContent>
              </Card>
            )}

            {/* Tabs */}
            <Tabs defaultValue="overview">
              <TabsList>
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="documentation">Documentation</TabsTrigger>
                <TabsTrigger value="test">Test API</TabsTrigger>
                <TabsTrigger value="pricing">Pricing</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle>API Overview</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Method</p>
                        <p className="font-medium">{api.method}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Category</p>
                        <p className="font-medium">{api.category}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Average Response Time</p>
                        <p className="font-medium">{api.averageResponseTime}ms</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Uptime</p>
                        <p className="font-medium">{api.uptime}%</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="documentation" className="mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Documentation</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {api.documentation ? (
                      <div className="prose dark:prose-invert max-w-none">
                        <pre className="bg-muted p-4 rounded overflow-x-auto">
                          {JSON.stringify(JSON.parse(api.documentation), null, 2)}
                        </pre>
                      </div>
                    ) : (
                      <p className="text-muted-foreground">No documentation available</p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="test" className="mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Test API</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        API Parameters (JSON)
                      </label>
                      <textarea
                        className="w-full h-24 p-2 border rounded-md"
                        placeholder='{"key": "value"}'
                        value={JSON.stringify(apiParams, null, 2)}
                        onChange={(e) => {
                          try {
                            setApiParams(JSON.parse(e.target.value));
                          } catch {
                            // Invalid JSON, keep previous state
                          }
                        }}
                      />
                    </div>
                    <Button
                      onClick={handlePayAndCall}
                      disabled={!isReady || isPaymentLoading || isProcessingPayment}
                      className="w-full"
                    >
                      {isPaymentLoading || isProcessingPayment
                        ? 'Processing...'
                        : 'Pay & Call API'
                      }
                    </Button>
                    {!isReady && (
                      <div className="text-xs text-orange-600 text-center">
                        Connect your wallet to make API calls
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="pricing" className="mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Pricing</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4" />
                        <span>Price per call</span>
                      </div>
                      <span className="font-medium">
                        {formatEther(BigInt(api.pricePerCall))} ETH
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Payment Flow</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="relative" ref={beamContainerRef}>
                  {/* Animated beams in the background */}
                  <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <AnimatedBeam
                      containerRef={beamContainerRef}
                      fromRef={walletRef}
                      toRef={apiRef}
                      duration={3}
                      delay={0}
                      pathColor="rgba(59, 130, 246, 0.2)"
                      pathWidth={2}
                      gradientStartColor="#3b82f6"
                      gradientStopColor="#8b5cf6"
                    />
                  </div>

                  {/* Flow steps */}
                  <div className="space-y-4 relative z-10">
                    <div className="flex items-center gap-2">
                      <div
                        ref={walletRef}
                        className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center"
                      >
                        <span className="text-xs text-white">W</span>
                      </div>
                      <span className="text-sm">1. Connect Wallet</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-purple-500 rounded-full"></div>
                      <span className="text-sm">2. Pay with Crypto</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div
                        ref={apiRef}
                        className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center"
                      >
                        <span className="text-xs text-white">API</span>
                      </div>
                      <span className="text-sm">3. Get API Response</span>
                    </div>
                  </div>
                </div>

                <Button
                  onClick={handlePayAndCall}
                  disabled={!isReady || isPaymentLoading || isProcessingPayment}
                  className="w-full mt-6"
                >
                  {isPaymentLoading || isProcessingPayment
                    ? 'Processing...'
                    : 'Pay & Call API'
                  }
                </Button>

                {!isReady && (
                  <div className="text-xs text-orange-600 text-center mt-2">
                    Connect your wallet to make API calls
                  </div>
                )}

                <div className="text-xs text-muted-foreground text-center mt-4">
                  Powered by x402 protocol. Payment required before each API call.
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Payment Modal */}
      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        paymentDetails={currentPayment}
        isProcessing={isProcessingPayment}
        transactionHash={transactionHash}
        error={paymentError}
      />
    </div>
  );
}

// Main page component with provider guard
export default function APIDetailsPage() {
  const params = useParams();
  const apiId = params.id as string;

  if (!apiId) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Invalid API ID</h2>
          <p className="text-muted-foreground">Please provide a valid API identifier.</p>
        </div>
      </div>
    );
  }

  return (
    <ProviderGuard>
      <Web3EnabledPage apiId={apiId} />
    </ProviderGuard>
  );
}