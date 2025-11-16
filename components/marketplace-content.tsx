'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAccount } from 'wagmi';
import { APICard } from '@/components/api-card';
import { categories } from '@/lib/mock-data'; // Keep categories for now
import { Button } from '@/components/ui/button';
import { furoClient, API } from '@/lib/api-client';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, RefreshCw, Search } from 'lucide-react';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { getUserFavorites, addFavorite, removeFavorite } from '@/lib/api/favorites';

interface MarketplaceContentProps {
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  searchQuery?: string;
}

export function MarketplaceContent({ selectedCategory, onCategoryChange, searchQuery = '' }: MarketplaceContentProps) {
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [apis, setApis] = useState<API[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalAPIs, setTotalAPIs] = useState(0);
  const [pageSize] = useState(8);

  // Use Wagmi hooks to check wallet connection
  const { address, isConnected } = useAccount();

  // Load user favorites when wallet is connected
  const loadUserFavorites = useCallback(async () => {
    if (!address) return;

    try {
      const response = await getUserFavorites(address);
      if (response.success && response.data) {
        setFavorites(new Set(response.data.apiIds));
      }
    } catch (error) {
      console.error('Error loading favorites:', error);
    }
  }, [address]);

  // Set developer address when wallet is connected
  useEffect(() => {
    if (address) {
      furoClient.setDeveloperAddress(address);
      loadUserFavorites();
    } else {
      // Clear favorites when wallet disconnects
      setFavorites(new Set());
    }
  }, [address, loadUserFavorites]);

  // Load favorite APIs first
  const loadFavoriteAPIs = useCallback(async (pageNum = 1) => {
    if (!address || favorites.size === 0) return;

    try {
      // For favorites users, we need to load enough data to include all favorites and additional APIs
      // We must ensure ALL favorites are loaded, regardless of how many there are
      let requiredLimit;

      if (pageNum === 1) {
        // Page 1: Load enough to include ALL favorites + additional non-favorites to fill the page
        requiredLimit = favorites.size + pageSize;
      } else {
        // Page > 1: Load enough to skip all favorites + first page's non-favorites + current page's data
        const firstPageNonFavorites = Math.max(0, pageSize - favorites.size);
        const totalToSkip = favorites.size + firstPageNonFavorites + ((pageNum - 1) * pageSize);
        requiredLimit = totalToSkip + pageSize;
      }

      const params: any = {
        page: 1, // Always start from page 1 since we're doing custom pagination
        limit: requiredLimit,
        sortBy: 'totalCalls',
        sortOrder: 'desc',
      };

      if (selectedCategory !== 'All') {
        params.category = selectedCategory;
      }

      if (searchQuery.trim()) {
        params.search = searchQuery.trim();
      }

      const response = await furoClient.getAPIs(params);
      if (response.success && response.data) {
        // Separate favorites and non-favorites
        const favoriteAPIs = response.data.filter(api => favorites.has(api.id));
        const nonFavoriteAPIs = response.data.filter(api => !favorites.has(api.id));

        console.log(`Page ${pageNum}: Found ${favoriteAPIs.length} favorites, ${nonFavoriteAPIs.length} non-favorites`);

        if (pageNum === 1) {
          // Page 1: Show favorites first, then fill remaining spots with non-favorites
          const remainingSpots = Math.max(0, pageSize - favoriteAPIs.length);
          const nonFavoritesForPage = nonFavoriteAPIs.slice(0, remainingSpots);
          setApis([...favoriteAPIs, ...nonFavoritesForPage]);
          console.log(`Page 1: Setting ${favoriteAPIs.length + nonFavoritesForPage.length} APIs (${favoriteAPIs.length} favorites + ${nonFavoritesForPage.length} regular)`);
        } else {
          // Page > 1: Show only non-favorites, skipping favorites and first page's non-favorites
          const firstPageNonFavorites = Math.max(0, pageSize - favoriteAPIs.length);
          const skipCount = favoriteAPIs.length + firstPageNonFavorites + ((pageNum - 2) * pageSize);
          const pageAPIs = nonFavoriteAPIs.slice(skipCount, skipCount + pageSize);
          setApis(pageAPIs);
          console.log(`Page ${pageNum}: Setting ${pageAPIs.length} APIs, skipping ${skipCount} items`);
        }

        // Update pagination info
        setTotalAPIs(response.meta.total);

        // Calculate total pages: pageSize items per page, with favorites prioritized on page 1
        const totalPages = Math.ceil(response.meta.total / pageSize);
        setTotalPages(totalPages);

        console.log(`Total APIs: ${response.meta.total}, Favorites: ${favorites.size}, Total Pages: ${totalPages}`);
      }
    } catch (error) {
      console.error('Error loading favorite APIs:', error);
    }
  }, [address, favorites, selectedCategory, searchQuery, pageSize]);

  // Load APIs from backend
  const loadAPIs = async (pageNum = 1) => {
    try {
      setIsLoading(true);
      setError(null);

      // If user has favorites, use the special pagination logic
      if (address && favorites.size > 0) {
        await loadFavoriteAPIs(pageNum);
      } else {
        // Normal pagination for users without favorites
        const params: any = {
          page: pageNum,
          limit: pageSize,
          sortBy: 'totalCalls',
          sortOrder: 'desc',
        };

        if (selectedCategory !== 'All') {
          params.category = selectedCategory;
        }

        if (searchQuery.trim()) {
          params.search = searchQuery.trim();
        }

        const response = await furoClient.getAPIs(params);

        if (response.success) {
          setApis(response.data);
          setTotalAPIs(response.meta.total);
          setTotalPages(response.meta.pages);
        } else {
          throw new Error('Failed to load APIs');
        }
      }

      setCurrentPage(pageNum);
    } catch (err) {
      console.error('Error loading APIs:', err);
      setError(err instanceof Error ? err.message : 'Failed to load APIs');
    } finally {
      setIsLoading(false);
    }
  };

  // Initial load and category change
  useEffect(() => {
    setCurrentPage(1);
    loadAPIs(1);
  }, [selectedCategory, searchQuery, address]);

  // Reload APIs when favorites change (to update pagination)
  useEffect(() => {
    if (address) {
      loadAPIs(currentPage);
    }
  }, [favorites]);

  // Handle page change
  const handlePageChange = (page: number) => {
    if (page !== currentPage && !isLoading) {
      loadAPIs(page);
    }
  };

  // Refresh APIs
  const refresh = () => {
    setCurrentPage(1);
    loadAPIs(1);
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

      // If API call succeeded, force a refetch to get updated favorite counts
      if (response.success) {
        // Force immediate refetch of current page to get updated favorite counts
        await loadAPIs(currentPage);
      } else {
        // If API call failed, revert the optimistic update
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

      {/* Search Results Feedback */}
      {(searchQuery.trim() || selectedCategory !== 'All') && (
        <div className="mb-6 p-4 bg-muted/30 rounded-lg border border-border/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {searchQuery.trim() && (
                <div className="flex items-center gap-2">
                  <Search className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    Searching for: <span className="text-foreground font-medium">"{searchQuery}"</span>
                  </span>
                </div>
              )}
              {selectedCategory !== 'All' && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    Category: <span className="text-foreground font-medium">{selectedCategory}</span>
                  </span>
                </div>
              )}
            </div>
            <div className="flex items-center gap-3">
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <RefreshCw className="h-4 w-4 animate-spin text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Searching...</span>
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">
                  {totalAPIs > 0 ? (
                    <span>
                      {displayAPIs.length} of {totalAPIs} results
                    </span>
                  ) : (
                    <span>No results found</span>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Loading State */}
      {isLoading && apis.length === 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-8">
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-8 transition-all duration-500 ease-in-out">
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

      {/* Pagination */}
      {!isLoading && !error && (displayAPIs.length > 0 || currentPage > 1) && totalPages > 1 && (
        <div className="flex justify-center mt-8 mb-8">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    handlePageChange(currentPage - 1);
                  }}
                  className={currentPage === 1 ? "pointer-events-none opacity-50 text-white" : "cursor-pointer text-white hover:bg-white hover:text-foreground"}
                />
              </PaginationItem>

              {/* Page Numbers */}
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNumber;
                if (totalPages <= 5) {
                  pageNumber = i + 1;
                } else if (currentPage <= 3) {
                  pageNumber = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNumber = totalPages - 4 + i;
                } else {
                  pageNumber = currentPage - 2 + i;
                }

                return (
                  <PaginationItem key={pageNumber}>
                    <PaginationLink
                      href="#"
                      isActive={currentPage === pageNumber}
                      onClick={(e) => {
                        e.preventDefault();
                        handlePageChange(pageNumber);
                      }}
                      className={`${
                        currentPage === pageNumber
                          ? "bg-white text-foreground"
                          : "text-white hover:bg-white hover:text-foreground"
                      }`}
                    >
                      {pageNumber}
                    </PaginationLink>
                  </PaginationItem>
                );
              })}

            {/* Ellipsis */}
              {totalPages > 5 && currentPage < totalPages - 2 && (
                <>
                  <PaginationItem>
                    <PaginationEllipsis className="text-white" />
                  </PaginationItem>
                  <PaginationItem>
                    <PaginationLink
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        handlePageChange(totalPages);
                      }}
                      className={`${
                        currentPage === totalPages
                          ? "bg-white text-foreground"
                          : "text-white hover:bg-white hover:text-foreground"
                      }`}
                    >
                      {totalPages}
                    </PaginationLink>
                  </PaginationItem>
                </>
              )}

              <PaginationItem>
                <PaginationNext
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    handlePageChange(currentPage + 1);
                  }}
                  className={currentPage === totalPages ? "pointer-events-none opacity-50 text-white" : "cursor-pointer text-white hover:bg-white hover:text-foreground"}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </>
  );
}