'use client';

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import dynamic from 'next/dynamic';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DollarSign,
  Activity,
  Eye,
  Settings,
  BarChart3,
  Globe,
  Star,
  TrendingUp,
  Users,
  AlertCircle,
  Power,
  Zap,
  Plus
} from 'lucide-react';
import Link from 'next/link';

const Header = dynamic(() => import('@/components/header').then(mod => ({ default: mod.Header })), {
  ssr: false
});

interface ProviderStats {
  totalAPIs: number;
  totalCalls: number;
  totalRevenue: string;
  averageRating: number;
  activeAPIs: number;
  totalEarnings: string;
  platformFees: string;
  netEarnings: string;
  recentActivity: Array<{
    date: string;
    calls: number;
    revenue: string;
    platformFee: string;
  }>;
  topPerformers: Array<{
    name: string;
    calls: number;
    revenue: string;
  }>;
}

interface API {
  id: string;
  name: string;
  category: string;
  status: 'active' | 'inactive';
  totalCalls: number;
  averageRating: number;
  totalRevenue: string;
  price: string;
  currency: string;
  createdAt: string;
}

export default function DashboardPage() {
  const { address, isConnected } = useAccount();
  const [providerStats, setProviderStats] = useState<ProviderStats | null>(null);
  const [providerAPIs, setProviderAPIs] = useState<API[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isConnected && address) {
      loadProviderData();
    }
  }, [isConnected, address]);

  const loadProviderData = async () => {
    if (!address) return;

    setIsLoading(true);
    try {
      // In a real implementation, these would be actual API calls to your backend
      // For now, we'll simulate the data with proper 3% platform fee calculations

      // Simulate provider stats with platform fee breakdown
      const mockStats: ProviderStats = {
        totalAPIs: 8,
        totalCalls: 3580,
        totalRevenue: '0.03580', // Total before platform fees
        totalEarnings: '0.03473', // After platform fees (97%)
        platformFees: '0.00107', // 3% platform commission
        netEarnings: '0.03473', // After platform fees (97%)
        averageRating: 4.6,
        activeAPIs: 6,
        recentActivity: [
          { date: '2024-01-15', calls: 420, revenue: '0.00420', platformFee: '0.00013' },
          { date: '2024-01-14', calls: 380, revenue: '0.00380', platformFee: '0.00011' },
          { date: '2024-01-13', calls: 290, revenue: '0.00290', platformFee: '0.00009' },
          { date: '2024-01-12', calls: 510, revenue: '0.00510', platformFee: '0.00015' },
          { date: '2024-01-11', calls: 450, revenue: '0.00450', platformFee: '0.00014' },
        ],
        topPerformers: [
          { name: 'Weather Data API', calls: 890, revenue: '0.00890' },
          { name: 'Image Recognition', calls: 750, revenue: '0.00750' },
          { name: 'Currency Converter', calls: 620, revenue: '0.00620' },
          { name: 'Email Validator', calls: 480, revenue: '0.00480' },
        ]
      };

      // Simulate provider APIs
      const mockAPIs: API[] = [
        {
          id: 'api_1',
          name: 'Weather Data API',
          category: 'Data',
          status: 'active',
          totalCalls: 890,
          averageRating: 4.8,
          totalRevenue: '0.00890',
          price: '0.000001',
          currency: 'ETH',
          createdAt: '2024-01-10'
        },
        {
          id: 'api_2',
          name: 'Image Recognition',
          category: 'AI',
          status: 'active',
          totalCalls: 750,
          averageRating: 4.6,
          totalRevenue: '0.00750',
          price: '0.000001',
          currency: 'ETH',
          createdAt: '2024-01-12'
        },
        {
          id: 'api_3',
          name: 'Geolocation Service',
          category: 'Utility',
          status: 'inactive',
          totalCalls: 120,
          averageRating: 4.2,
          totalRevenue: '0.00120',
          price: '0.000001',
          currency: 'ETH',
          createdAt: '2024-01-08'
        },
        {
          id: 'api_4',
          name: 'Currency Converter',
          category: 'Finance',
          status: 'active',
          totalCalls: 620,
          averageRating: 4.9,
          totalRevenue: '0.00620',
          price: '0.000001',
          currency: 'ETH',
          createdAt: '2024-01-05'
        },
        {
          id: 'api_5',
          name: 'Email Validator',
          category: 'Utility',
          status: 'active',
          totalCalls: 480,
          averageRating: 4.4,
          totalRevenue: '0.00480',
          price: '0.000001',
          currency: 'ETH',
          createdAt: '2024-01-14'
        },
        {
          id: 'api_6',
          name: 'Stock Price API',
          category: 'Finance',
          status: 'active',
          totalCalls: 350,
          averageRating: 4.5,
          totalRevenue: '0.00350',
          price: '0.000001',
          currency: 'ETH',
          createdAt: '2024-01-11'
        },
        {
          id: 'api_7',
          name: 'PDF Generator',
          category: 'Utility',
          status: 'active',
          totalCalls: 270,
          averageRating: 4.3,
          totalRevenue: '0.00270',
          price: '0.000001',
          currency: 'ETH',
          createdAt: '2024-01-09'
        },
        {
          id: 'api_8',
          name: 'QR Code Generator',
          category: 'Utility',
          status: 'inactive',
          totalCalls: 100,
          averageRating: 4.0,
          totalRevenue: '0.00100',
          price: '0.000001',
          currency: 'ETH',
          createdAt: '2024-01-07'
        }
      ];

      setProviderStats(mockStats);
      setProviderAPIs(mockAPIs);
    } catch (error) {
      console.error('Error loading provider data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-background dark">
        <Header theme="dark" />
        <main className="container mx-auto px-4 py-16 max-w-4xl">
          <div className="text-center">
            <div className="mb-8">
              <AlertCircle className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            </div>
            <h1 className="text-4xl font-bold mb-4 text-foreground">Connect Your Wallet</h1>
            <p className="text-muted-foreground text-lg mb-8">
              Connect your wallet to access your provider dashboard and view your API performance analytics
            </p>
            <div className="bg-muted/50 rounded-lg px-6 py-8 mb-8">
              <h3 className="text-xl font-semibold mb-4 text-foreground">Dashboard Features:</h3>
              <ul className="text-left space-y-2 text-muted-foreground max-w-md mx-auto">
                <li>• Real-time API performance metrics</li>
                <li>• Revenue tracking with 3% platform fees</li>
                <li>• Usage analytics and trends</li>
                <li>• User ratings and feedback</li>
                <li>• API management controls</li>
              </ul>
            </div>
            <div className="flex justify-center gap-4">
              <Button size="lg" className="bg-primary text-primary-foreground">
                Connect Wallet
              </Button>
              <Link href="/marketplace">
                <Button variant="outline" size="lg" className="text-white border-white hover:bg-white hover:text-foreground">
                  Browse Marketplace
                </Button>
              </Link>
            </div>
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
            <h1 className="text-4xl font-bold text-foreground mb-2">Provider Dashboard</h1>
            <p className="text-muted-foreground text-lg">
              Manage your APIs and track your performance with x402 micropayments
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/list-api">
              <Button variant="outline" className='text-white'>
                <Plus className="h-4 w-4 mr-2" />
                Add API
              </Button>
            </Link>
            <Link href="/marketplace">
              <Button variant="outline" className='text-white'>
                <Globe className="h-4 w-4 mr-2" />
                Marketplace
              </Button>
            </Link>
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
              {[...Array(5)].map((_, i) => (
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
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <Skeleton className="h-96 w-full" />
              </div>
              <div>
                <Skeleton className="h-96 w-full" />
              </div>
            </div>
          </div>
        ) : providerStats && (
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Total APIs</CardTitle>
                  <Globe className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-foreground">{providerStats.totalAPIs}</div>
                  <p className="text-xs text-muted-foreground">
                    {providerStats.activeAPIs} active
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Total Calls</CardTitle>
                  <Activity className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-foreground">{providerStats.totalCalls.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground">
                    +15% from last week
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Net Earnings</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-foreground">{providerStats.netEarnings} ETH</div>
                  <p className="text-xs text-muted-foreground">
                    97% of total revenue
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Platform Fees</CardTitle>
                  <Zap className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-foreground">{providerStats.platformFees} ETH</div>
                  <p className="text-xs text-muted-foreground">
                    3% commission
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Average Rating</CardTitle>
                  <Star className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-foreground">{providerStats.averageRating.toFixed(1)}</div>
                  <p className="text-xs text-muted-foreground">
                    From {providerStats.totalAPIs} reviews
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Main Content */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* API List */}
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="h-5 w-5" />
                      Your APIs
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {providerAPIs.map((api) => (
                        <div key={api.id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-medium text-foreground">{api.name}</h3>
                              <Badge variant={api.status === 'active' ? "default" : "secondary"}>
                                {api.status === 'active' ? 'Active' : 'Inactive'}
                              </Badge>
                              <Badge variant="outline">{api.category}</Badge>
                            </div>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Activity className="h-3 w-3" />
                                {api.totalCalls} calls
                              </span>
                              <span className="flex items-center gap-1">
                                <Star className="h-3 w-3" />
                                {(api.averageRating || 0).toFixed(1)}
                              </span>
                              <span className="flex items-center gap-1">
                                <DollarSign className="h-3 w-3" />
                                {api.totalRevenue} ETH
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Link href={`/api/${api.id}`}>
                              <Button variant="outline" size="sm">
                                <Eye className="h-4 w-4 mr-1" />
                                View
                              </Button>
                            </Link>
                            <Button variant="outline" size="sm">
                              <Settings className="h-4 w-4 mr-1" />
                              Edit
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Revenue Activity */}
              <div>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5" />
                      Revenue Activity
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="text-sm text-muted-foreground mb-4">
                        <div className="flex justify-between">
                          <span>Revenue Breakdown:</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Net (97%):</span>
                          <span className="font-medium text-foreground">{providerStats.netEarnings} ETH</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Platform (3%):</span>
                          <span className="font-medium text-foreground">{providerStats.platformFees} ETH</span>
                        </div>
                      </div>

                      <div className="space-y-3">
                        {providerStats.recentActivity.map((activity, index) => (
                          <div key={index} className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-foreground">{activity.date}</p>
                              <p className="text-xs text-muted-foreground">
                                {activity.calls} calls
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-medium text-foreground">{activity.revenue} ETH</p>
                              <p className="text-xs text-muted-foreground">+{activity.platformFee} ETH</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Top Performers */}
                <Card className="mt-6">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      Top Performers
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {providerStats.topPerformers.map((performer, index) => (
                        <div key={index} className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-foreground">{performer.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {performer.calls} calls
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium text-foreground">{performer.revenue} ETH</p>
                            <p className="text-xs text-muted-foreground">revenue</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Quick Actions */}
                <Card className="mt-6">
                  <CardHeader>
                    <CardTitle>Quick Actions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Link href="/list-api">
                      <Button className="w-full justify-start my-2" variant="outline">
                        <Plus className="h-4 w-4 mr-2" />
                        Add New API
                      </Button>
                    </Link>
                    <Link href="/list-api">
                      <Button className="w-full justify-start my-2" variant="outline">
                        <BarChart3 className="h-4 w-4 mr-2" />
                        Manage APIs
                      </Button>
                    </Link>
                    <Link href="/marketplace">
                      <Button className="w-full justify-start my-2" variant="outline">
                        <Globe className="h-4 w-4 mr-2" />
                        Browse Marketplace
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}