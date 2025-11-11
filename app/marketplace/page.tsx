'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { APICard } from '@/components/api-card';
import { Button } from '@/components/ui/button';
import { mockAPIs, categories } from '@/lib/mock-data';

const Header = dynamic(() => import('@/components/header').then(mod => ({ default: mod.Header })), {
  ssr: false
});

export default function MarketplacePage() {
  const [selectedCategory, setSelectedCategory] = useState('All');

  const filteredAPIs = selectedCategory === 'All'
    ? mockAPIs
    : mockAPIs.filter(api => api.category === selectedCategory);

  return (
    <div className="min-h-screen bg-background dark">
      <Header theme="dark" />

      <main className="container mx-auto px-4 py-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-foreground mb-4">
            Discover & Monetize APIs
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            The first marketplace for APIs with crypto micropayments.
            Pay per call using the x402 protocol.
          </p>
        </div>

        <div className="flex flex-wrap gap-2 mb-8 justify-center">
          {categories.map((category) => (
            <Button
              key={category}
              variant={selectedCategory === category ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(category)}
            >
              {category}
            </Button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAPIs.map((api) => (
            <APICard key={api.id} api={api} />
          ))}
        </div>
      </main>
    </div>
  );
}