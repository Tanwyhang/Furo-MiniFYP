'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const Header = dynamic(() => import('@/components/header').then(mod => ({ default: mod.Header })), {
  ssr: false
});
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { mockAPIs } from '@/lib/mock-data';
import { DollarSign, Activity, Eye, Settings, Power } from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
  // Mock user's APIs (in real app, this would be filtered by connected wallet)
  const [userAPIs, setUserAPIs] = useState(mockAPIs.slice(0, 2));
  
  const totalEarnings = userAPIs.reduce((sum, api) => sum + (api.totalCalls * api.price), 0);
  const totalCalls = userAPIs.reduce((sum, api) => sum + api.totalCalls, 0);

  const toggleAPIStatus = (apiId: string) => {
    setUserAPIs(prevAPIs =>
      prevAPIs.map(api =>
        api.id === apiId
          ? { ...api, status: api.status === 'active' ? 'inactive' : 'active' }
          : api
      )
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Provider Dashboard</h1>
          <p className="text-muted-foreground">Manage your APIs and track earnings</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalEarnings.toFixed(4)} ETH</div>
              <p className="text-xs text-muted-foreground">+12% from last month</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total API Calls</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalCalls.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">+8% from last month</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active APIs</CardTitle>
              <Eye className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{userAPIs.filter(api => api.status === 'active').length}</div>
              <p className="text-xs text-muted-foreground">of {userAPIs.length} total APIs</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Your APIs</CardTitle>
              <Link href="/list-api">
                <Button>List New API</Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {userAPIs.map((api) => (
                <div key={api.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-medium">{api.name}</h3>
                      <Badge variant="secondary">{api.category}</Badge>
                      <Badge variant={api.status === 'active' ? 'default' : 'secondary'}>
                        {api.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{api.description}</p>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>{api.totalCalls.toLocaleString()} calls</span>
                      <span>{api.price} {api.currency} per call</span>
                      <span>Earned: {(api.totalCalls * api.price).toFixed(4)} {api.currency}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleAPIStatus(api.id)}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                        api.status === 'active'
                          ? 'bg-green-100 text-green-700 hover:bg-green-200'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      <Power className="h-3 w-3" />
                      {api.status === 'active' ? 'Active' : 'Inactive'}
                    </button>
                    <Link href={`/api/${api.id}`}>
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4 mr-2" />
                        View
                      </Button>
                    </Link>
                    <Button variant="outline" size="sm">
                      <Settings className="h-4 w-4 mr-2" />
                      Settings
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}