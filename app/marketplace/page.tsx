'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';

const Header = dynamic(() => import('@/components/header').then(mod => ({ default: mod.Header })), {
  ssr: false
});

const MarketplaceContent = dynamic(() => import('@/components/marketplace-content').then(mod => ({ default: mod.MarketplaceContent })), {
  ssr: false
});

export default function MarketplacePage() {
  const [selectedCategory, setSelectedCategory] = useState('All');

  return (
    <div className="min-h-screen bg-background dark">
      <Header theme="dark" />

      <main className="container mx-auto px-4 py-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-foreground mb-4 mt-6">
            x402 Driven API Marketplace
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Pay for your own API calls using the x402 protocol.
          </p>
        </div>

        <MarketplaceContent
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
        />
      </main>
    </div>
  );
}