'use client';

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { APICard } from '@/components/api-card';
import { categories } from '@/lib/mock-data'; // Keep categories for now
import { Button } from '@/components/ui/button';
import { furoClient, API } from '@/lib/api-client';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { getUserFavorites, addFavorite, removeFavorite } from '@/lib/api/favorites';

interface MarketplaceContentProps {
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
}

export function MarketplaceContent({ selectedCategory, onCategoryChange }: MarketplaceContentProps) {
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [apis, setApis] = useState<API[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  // Use Wagmi hooks to check wallet connection
  const { address, isConnected } = useAccount();

  // Load user favorites when wallet is connected
  const loadUserFavorites = async () => {
    if (!address) return;

    try {
      const response = await getUserFavorites(address);
      if (response.success && response.data) {
        setFavorites(new Set(response.data.apiIds));
      }
    } catch (error) {
      console.error('Error loading favorites:', error);
    }
  };

  // Set developer address when wallet is connected
  useEffect(() => {
    if (address) {
      furoClient.setDeveloperAddress(address);
      loadUserFavorites();
    } else {
      // Clear favorites when wallet disconnects
      setFavorites(new Set());
    }
  }, [address]);

  // Load APIs from backend
  const loadAPIs = async (pageNum = 1, append = false) => {
    try {
      setIsLoading(true);
      setError(null);

      const params: any = {
        page: pageNum,
        limit: 12,
        sortBy: 'totalCalls',
        sortOrder: 'desc',
        isActive: true,
      };

      if (selectedCategory !== 'All') {
        params.category = selectedCategory;
      }

      const response = await furoClient.getAPIs(params);

      if (response.success) {
        const newAPIs = response.data;
        setApis(prev => append ? [...prev, ...newAPIs] : newAPIs);
        setHasMore(response.meta.hasNext);
        setPage(pageNum);
      } else {
        throw new Error('Failed to load APIs');
      }
    } catch (err) {
      console.error('Error loading APIs:', err);
      setError(err instanceof Error ? err.message : 'Failed to load APIs');
    } finally {
      setIsLoading(false);
    }
  };

  // Initial load and category change
  useEffect(() => {
    setPage(1);
    setHasMore(true);
    loadAPIs(1, false);
  }, [selectedCategory, address]);

  // Load more APIs
  const loadMore = () => {
    if (!isLoading && hasMore) {
      loadAPIs(page + 1, true);
    }
  };

  // Refresh APIs
  const refresh = () => {
    setPage(1);
    setHasMore(true);
    loadAPIs(1, false);
  };

  // Filter APIs based on category (client-side for now)
  const filteredAPIs = selectedCategory === 'All'
    ? apis
    : apis.filter(api => api.category.toLowerCase() === selectedCategory.toLowerCase());

  const handleToggleFavorite = async (apiId: string, favorited: boolean) => {
    if (!isConnected || !address) return;

    try {
      // Optimistic update
      setFavorites(prev => {
        const newFavorites = new Set(prev);
        if (favorited) {
          newFavorites.add(apiId);
        } else {
          newFavorites.delete(apiId);
        }
        return newFavorites;
      });

      // Call API
      const response = favorited
        ? await addFavorite(apiId, address)
        : await removeFavorite(apiId, address);

      // If API call failed, revert the optimistic update
      if (!response.success) {
        setFavorites(prev => {
          const newFavorites = new Set(prev);
          if (favorited) {
            newFavorites.delete(apiId);
          } else {
            newFavorites.add(apiId);
          }
          return newFavorites;
        });
        console.error('Failed to toggle favorite:', response.error);
      }
    } catch (error) {
      // Revert optimistic update on error
      setFavorites(prev => {
        const newFavorites = new Set(prev);
        if (favorited) {
          newFavorites.delete(apiId);
        } else {
          newFavorites.add(apiId);
        }
        return newFavorites;
      });
      console.error('Failed to toggle favorite:', error);
    }
  };

  // Transform API data for APICard component
  const transformAPIForCard = (api: API) => ({
    id: api.id,
    name: api.name,
    description: api.description,
    category: api.category,
    endpoint: api.endpoint,
    price: api.pricePerCall,
    currency: api.currency,
    rating: api.averageRating || 0,
    totalCalls: api.totalCalls,
    status: (api.isActive ? 'active' : 'inactive') as 'active' | 'inactive',
    provider: api.Provider.name,
    providerId: api.providerId,
    publicPath: api.publicPath,
    documentation: api.documentation,
    favoriteCount: api.favoriteCount || 0,
    // Add any other fields required by APICard
  });

  // Separate favorited and non-favorited APIs
  const favoritedAPIs = filteredAPIs.filter(api => favorites.has(api.id));
  const nonFavoritedAPIs = filteredAPIs.filter(api => !favorites.has(api.id));
  const displayAPIs = [...favoritedAPIs, ...nonFavoritedAPIs];

  return (
    <>
      <div className="flex justify-between items-start mb-8">
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => (
            <Button
              key={category}
              variant={selectedCategory === category ? "default" : "outline"}
              size="sm"
              onClick={() => onCategoryChange(category)}
              className={selectedCategory !== category ? "text-white hover:text-white" : ""}
              disabled={isLoading}
            >
              {category}
            </Button>
          ))}
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={refresh}
          disabled={isLoading}
          className="flex text-white items-center gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Error State */}
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Loading State */}
      {isLoading && apis.length === 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, index) => (
            <div key={index} className="space-y-3">
              <Skeleton className="h-48 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ))}
        </div>
      )}

      {/* API List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 transition-all duration-500 ease-in-out">
        {displayAPIs.map((api, index) => (
          <div
            key={api.id}
            className="transform transition-all duration-500 ease-out h-[240px]"
            style={{
              transitionDelay: `${index * 50}ms`, // Staggered animation
            }}
          >
            <div className="h-full flex flex-col">
              <APICard
                api={transformAPIForCard(api)}
                isFavorited={favorites.has(api.id)}
                onToggleFavorite={handleToggleFavorite}
                isConnected={isConnected}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {!isLoading && !error && displayAPIs.length === 0 && (
        <div className="text-center py-12">
          <div className="text-muted-foreground mb-4">
            No APIs found in {selectedCategory === 'All' ? 'any category' : selectedCategory}
          </div>
          <Button variant="outline" className="text-white" onClick={refresh}>
            Try Again
          </Button>
        </div>
      )}

      {/* Load More Button */}
      {!isLoading && !error && displayAPIs.length > 0 && hasMore && (
        <div className="text-center mt-8">
          <Button
            variant="outline"
            onClick={loadMore}
            disabled={isLoading}
            className="flex items-center gap-2 mx-auto"
          >
            {isLoading ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                Loading...
              </>
            ) : (
              <>
                Load More APIs
              </>
            )}
          </Button>
        </div>
      )}
    </>
  );
}