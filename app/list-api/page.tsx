'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { Button } from '@/components/ui/button';

const Header = dynamic(() => import('@/components/header').then(mod => ({ default: mod.Header })), {
  ssr: false
});
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { categories } from '@/lib/mock-data';

export default function ListAPIPage() {
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
  };

  return (
    <div className="min-h-screen bg-background dark">
      <Header theme="dark" />
      
      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">List Your API</CardTitle>
            <p className="text-muted-foreground">
              Add your API to the marketplace and start earning with x402 micropayments instantly
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Label htmlFor="name" className='mb-2'>API Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="e.g., Weather Data API"
                  required
                />
              </div>

              <div>
                <Label htmlFor="description" className='mb-2'>Description</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="Brief description of your API"
                  required
                />
              </div>

              <div>
                <Label htmlFor="category" className='mb-2'>Category</Label>
                <Select onValueChange={(value) => setFormData({...formData, category: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.filter(c => c !== 'All').map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="endpoint" className='mb-2'>API Endpoint</Label>
                <Input
                  id="endpoint"
                  value={formData.endpoint}
                  onChange={(e) => setFormData({...formData, endpoint: e.target.value})}
                  placeholder="https://api.example.com/v1/data"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="price" className='mb-2'>Price per Call</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.0001"
                    value={formData.price}
                    onChange={(e) => setFormData({...formData, price: e.target.value})}
                    placeholder="0.001"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="currency" className='mb-2'>Currency</Label>
                  <Select onValueChange={(value) => setFormData({...formData, currency: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="ETH" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ETH">ETH</SelectItem>
                      <SelectItem value="USDC">USDC</SelectItem>
                      <SelectItem value="USDT">USDT</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

                <div className="flex items-center space-x-2">
                <Checkbox
                  id="isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) => setFormData({...formData, isActive: checked === true})}
                />
                <Label htmlFor="isActive" className="text-sm">
                  Activate API immediately (you can change this later in your dashboard)
                </Label>
              </div>

              <Button type="submit" className="w-full" size="lg">
                Add API to Marketplace
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}