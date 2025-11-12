'use client';

import { useState } from 'react';
import { useAccount } from 'wagmi';
import { APICard } from '@/components/api-card';
import { mockAPIs, categories } from '@/lib/mock-data';
import { Button } from '@/components/ui/button';

interface MarketplaceContentProps {
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
}

export function MarketplaceContent({ selectedCategory, onCategoryChange }: MarketplaceContentProps) {
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  // Use Wagmi hooks to check wallet connection
  const { address, isConnected } = useAccount();

  const filteredAPIs = selectedCategory === 'All'
    ? mockAPIs
    : mockAPIs.filter(api => api.category === selectedCategory);

  const handleToggleFavorite = (apiId: string, favorited: boolean) => {
    if (!isConnected || !address) return;

    setFavorites(prev => {
      const newFavorites = new Set(prev);
      if (favorited) {
        newFavorites.add(apiId);
      } else {
        newFavorites.delete(apiId);
      }
      return newFavorites;
    });
  };

  return (
    <>
      <div className="flex flex-wrap gap-2 mb-8">
        {categories.map((category) => (
          <Button
            key={category}
            variant={selectedCategory === category ? "default" : "outline"}
            size="sm"
            onClick={() => onCategoryChange(category)}
            className={selectedCategory !== category ? "text-white hover:text-white" : ""}
          >
            {category}
          </Button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {filteredAPIs.map((api) => (
          <APICard
            key={api.id}
            api={api}
            isFavorited={favorites.has(api.id)}
            onToggleFavorite={handleToggleFavorite}
            isConnected={isConnected}
          />
        ))}
      </div>
    </>
  );
}