'use client';

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Plus,
  TrendingUp,
  Users,
  DollarSign,
  Activity,
  ArrowUpRight,
  BarChart3,
  Globe,
  Star,
  Eye,
  PhoneCall
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';

const Header = dynamic(() => import('@/components/header').then(mod => ({ default: mod.Header })), {
  ssr: false
});

interface ProviderStats {
  totalAPIs: number;
  totalCalls: number;
  totalRevenue: string;
  averageRating: number;
  activeAPIs: number;
  recentActivity: Array<{
    date: string;
    calls: number;
    revenue: string;
  }>;
}

interface API {
  id: string;
  name: string;
  category: string;
  isActive: boolean;
  totalCalls: number;
  averageRating: number;
  totalRevenue: string;
  createdAt: string;
}

export default function AddAPIsPage() {
  const { address, isConnected } = useAccount();
  const [providerStats, setProviderStats] = useState<ProviderStats | null>(null);
  const [providerAPIs, setProviderAPIs] = useState<API[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);

  useEffect(() => {
    if (isConnected && address) {
      loadProviderData();
    }
  }, [isConnected, address]);

  const loadProviderData = async () => {
    if (!address) return;

    setIsLoading(true);
    try {
      // In a real implementation, these would be actual API calls
      // For now, we'll simulate the data

      // Simulate provider stats
      const mockStats: ProviderStats = {
        totalAPIs: 5,
        totalCalls: 1250,
        totalRevenue: '0.0125',
        averageRating: 4.7,
        activeAPIs: 4,
        recentActivity: [
          { date: '2024-01-15', calls: 156, revenue: '0.00156' },
          { date: '2024-01-14', calls: 142, revenue: '0.00142' },
          { date: '2024-01-13', calls: 98, revenue: '0.00098' },
          { date: '2024-01-12', calls: 203, revenue: '0.00203' },
          { date: '2024-01-11', calls: 178, revenue: '0.00178' },
        ]
      };

      // Simulate provider APIs
      const mockAPIs: API[] = [
        {
          id: 'api_1',
          name: 'Weather Data API',
          category: 'Data',
          isActive: true,
          totalCalls: 456,
          averageRating: 4.8,
          totalRevenue: '0.00456',
          createdAt: '2024-01-10'
        },
        {
          id: 'api_2',
          name: 'Image Recognition',
          category: 'AI',
          isActive: true,
          totalCalls: 321,
          averageRating: 4.6,
          totalRevenue: '0.00321',
          createdAt: '2024-01-12'
        },
        {
          id: 'api_3',
          name: 'Geolocation Service',
          category: 'Utility',
          isActive: false,
          totalCalls: 89,
          averageRating: 4.2,
          totalRevenue: '0.00089',
          createdAt: '2024-01-08'
        },
        {
          id: 'api_4',
          name: 'Currency Converter',
          category: 'Finance',
          isActive: true,
          totalCalls: 267,
          averageRating: 4.9,
          totalRevenue: '0.00267',
          createdAt: '2024-01-05'
        },
        {
          id: 'api_5',
          name: 'Email Validator',
          category: 'Utility',
          isActive: true,
          totalCalls: 117,
          averageRating: 4.4,
          totalRevenue: '0.00117',
          createdAt: '2024-01-14'
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
            <h1 className="text-4xl font-bold mb-4">Connect Your Wallet</h1>
            <p className="text-muted-foreground text-lg mb-8">
              Connect your wallet to manage your APIs and view your performance analytics
            </p>
          </div>
        </main>
      </div>
    );
  }

  if (showAddForm) {
    // Return the original form for adding APIs
    return <AddAPIForm onBack={() => setShowAddForm(false)} />;
  }

  return (
    <div className="min-h-screen bg-background dark">
      <Header theme="dark" />

      <main className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mt-6 mb-16">
            <Button
              onClick={() => setShowAddForm(true)}
              size="lg"
              className="flex items-center gap-2"
            >
              <Plus className="h-5 w-5" />
              Add New API
            </Button>
          </div>
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total APIs</CardTitle>
                  <Globe className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{providerStats.totalAPIs}</div>
                  <p className="text-xs text-muted-foreground">
                    {providerStats.activeAPIs} active
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Calls</CardTitle>
                  <PhoneCall className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{providerStats.totalCalls.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground">
                    +12% from last week
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{providerStats.totalRevenue} ETH</div>
                  <p className="text-xs text-muted-foreground">
                    +8% from last week
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
                  <Star className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{providerStats.averageRating.toFixed(1)}</div>
                  <p className="text-xs text-muted-foreground">
                    From user reviews
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Main Content */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* APIs List */}
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
                              <h3 className="font-medium">{api.name}</h3>
                              <Badge variant={api.isActive ? "default" : "secondary"}>
                                {api.isActive ? "Active" : "Inactive"}
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
                                {api.averageRating.toFixed(1)}
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
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Recent Activity */}
              <div>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5" />
                      Recent Activity
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {providerStats.recentActivity.map((activity, index) => (
                        <div key={index} className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium">{activity.date}</p>
                            <p className="text-xs text-muted-foreground">
                              {activity.calls} calls
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium">{activity.revenue} ETH</p>
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
                  <CardContent className="space-y-3">
                    <Button
                      onClick={() => setShowAddForm(true)}
                      className="w-full justify-start"
                      variant="outline"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add New API
                    </Button>
                    <Link href="/dashboard">
                      <Button className="w-full justify-start" variant="outline">
                        <BarChart3 className="h-4 w-4 mr-2" />
                        View Detailed Analytics
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

// Add API Form Component
function AddAPIForm({ onBack }: { onBack: () => void }) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    endpoint: '',
    price: '',
    currency: 'ETH',
    isActive: true
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Submitting API:', formData);
    // This will connect to backend in Phase 2
    onBack(); // Go back to dashboard after submission
  };

  return (
    <div className="min-h-screen bg-background dark">
      <Header theme="dark" />

      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="mb-6">
          <Button variant="ghost" onClick={onBack} className="mb-4">
            ← Back to Dashboard
          </Button>
          <h1 className="text-3xl font-bold">Add New API</h1>
          <p className="text-muted-foreground">
            Add your API to the marketplace and start earning with x402 micropayments
          </p>
        </div>

        <Card>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="text-sm font-medium mb-2 block">API Name</label>
                <input
                  className="w-full p-3 border rounded-md bg-background"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="e.g., Weather Data API"
                  required
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Description</label>
                <input
                  className="w-full p-3 border rounded-md bg-background"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="Brief description of your API"
                  required
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Category</label>
                <select
                  className="w-full p-3 border rounded-md bg-background"
                  value={formData.category}
                  onChange={(e) => setFormData({...formData, category: e.target.value})}
                  required
                >
                  <option value="">Select a category</option>
                  <option value="Data">Data</option>
                  <option value="AI">AI</option>
                  <option value="Finance">Finance</option>
                  <option value="Utility">Utility</option>
                  <option value="Gaming">Gaming</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">API Endpoint</label>
                <input
                  className="w-full p-3 border rounded-md bg-background"
                  value={formData.endpoint}
                  onChange={(e) => setFormData({...formData, endpoint: e.target.value})}
                  placeholder="https://api.example.com/v1/data"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Price per Call</label>
                  <input
                    className="w-full p-3 border rounded-md bg-background"
                    type="number"
                    step="0.0001"
                    value={formData.price}
                    onChange={(e) => setFormData({...formData, price: e.target.value})}
                    placeholder="0.001"
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Currency</label>
                  <select
                    className="w-full p-3 border rounded-md bg-background"
                    value={formData.currency}
                    onChange={(e) => setFormData({...formData, currency: e.target.value})}
                  >
                    <option value="ETH">ETH</option>
                    <option value="USDC">USDC</option>
                    <option value="USDT">USDT</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({...formData, isActive: e.target.checked})}
                  className="rounded"
                />
                <label htmlFor="isActive" className="text-sm">
                  Activate API immediately (you can change this later in your dashboard)
                </label>
              </div>

              <div className="flex gap-4">
                <Button type="button" variant="outline" onClick={onBack} className="flex-1">
                  Cancel
                </Button>
                <Button type="submit" className="flex-1" size="lg">
                  Add API to Marketplace
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}