import { Card, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Star, Heart } from 'lucide-react';
import Link from 'next/link';
import { formatEther } from 'viem';

// Update the API interface to match our transformed data
interface API {
  id: string;
  name: string;
  description: string;
  category: string;
  endpoint: string;
  price: string;
  currency: string;
  rating: number;
  totalCalls: number;
  status: 'active' | 'inactive';
  provider: string;
  providerId: string;
  publicPath: string;
  documentation?: any;
  favoriteCount?: number;
}

interface APICardProps {
  api: API;
  isFavorited?: boolean;
  onToggleFavorite?: (apiId: string, favorited: boolean) => void;
  isConnected?: boolean;
}

export function APICard({ api, isFavorited = false, onToggleFavorite, isConnected = false }: APICardProps) {
  const isActive = api.status === 'active';
  const formatCalls = (calls: number) => (calls / 1000).toFixed(1);

  const cardContent = (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="mb-4 flex-grow">
        <div className="flex items-start justify-between mb-2">
          <CardTitle className="text-lg font-medium text-foreground">
            {api.name}
          </CardTitle>
          <StatusIndicator status={api.status} />
        </div>
        <p className="text-sm text-muted-foreground line-clamp-3 h-[3.5rem] leading-5">
          {api.description}
        </p>
      </div>

      {/* Metadata */}
      <div className="flex items-center gap-4 mb-4 text-xs text-muted-foreground flex-shrink-0">
        <Badge variant="secondary" className="text-xs">
          {api.category}
        </Badge>
        <span>•</span>
        <span>{formatCalls(api.totalCalls)} calls</span>
        <span>•</span>
        <MetricIcon icon={Star} value={api.rating.toFixed(1)} label="rating" />
        {api.favoriteCount !== undefined && (
          <>
            <span>•</span>
            <MetricIcon icon={Heart} value={api.favoriteCount.toString()} label="favorites" />
          </>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between flex-shrink-0">
        <PriceDisplay api={api} isActive={isActive} />
        <ActionsSection
          api={api}
          isActive={isActive}
          isConnected={isConnected}
          isFavorited={isFavorited}
          onToggleFavorite={onToggleFavorite}
        />
      </div>
    </div>
  );

  return isActive ? (
    <ActiveCard href={`/api/${api.id}`} isFavorited={isFavorited}>
      {cardContent}
    </ActiveCard>
  ) : (
    <InactiveCard>
      {cardContent}
    </InactiveCard>
  );
}

// Helper Components
function StatusIndicator({ status }: { status: string }) {
  return (
    <div
      className={`w-2 h-2 rounded-full ${
        status === 'active' ? 'bg-green-500' : 'bg-gray-400'
      }`}
      aria-label={`API is ${status}`}
    />
  );
}

function MetricIcon({ icon: Icon, value, label }: {
  icon: any;
  value: number | string;
  label: string;
}) {
  return (
    <div className="flex items-center gap-1" title={label}>
      <Icon className="h-3 w-3 fill-current text-white" />
      <span>{value}</span>
    </div>
  );
}

function PriceDisplay({ api, isActive }: { api: API; isActive: boolean }) {
  // Try to format the price, fall back to original if it fails
  const formattedPrice = (() => {
    try {
      return formatEther(api.price as `0x${string}`);
    } catch {
      return api.price;
    }
  })();

  return (
    <div className="flex items-baseline gap-1">
      <span className={`text-lg font-semibold ${
        isActive ? 'text-foreground' : 'text-muted-foreground opacity-50'
      }`}>
        {formattedPrice}
      </span>
      <span className="text-xs text-muted-foreground">
        {api.currency}/call
      </span>
      {!isActive && (
        <span className="text-xs text-muted-foreground ml-2">(inactive)</span>
      )}
    </div>
  );
}

function ActionsSection({
  api,
  isActive,
  isConnected,
  isFavorited,
  onToggleFavorite
}: {
  api: API;
  isActive: boolean;
  isConnected: boolean;
  isFavorited: boolean;
  onToggleFavorite?: (apiId: string, favorited: boolean) => void;
}) {
  return (
    <div className="flex items-center gap-3">
      {isConnected && (
        <button
          onClick={(e) => {
            e.stopPropagation(); // Prevent link navigation
            e.preventDefault(); // Prevent default link behavior
            onToggleFavorite?.(api.id, !isFavorited);
          }}
          className="text-muted-foreground hover:text-red-500 transition-colors z-10 relative"
          aria-label="Toggle favorite"
          title={isFavorited ? "Remove from favorites" : "Add to favorites"}
        >
          <Heart className={`h-4 w-4 transition-all duration-300 ease-in-out transform ${isFavorited ? 'fill-current text-red-500 scale-110' : 'hover:scale-110'}`} />
        </button>
      )}

      <Button
        variant="ghost"
        size="sm"
        className="text-xs h-7 px-3"
        onClick={(e) => e.stopPropagation()}
        disabled={!isActive}
      >
        View
      </Button>
    </div>
  );
}

function ActiveCard({ href, children, isFavorited }: { href: string; children: React.ReactNode; isFavorited?: boolean }) {
  return (
    <Card className={`h-full p-6 border shadow-sm hover:shadow-md hover:border-white transition-all duration-300 ease-in-out bg-card group relative flex flex-col ${
      isFavorited ? 'border-red-200 shadow-red-100' : ''
    }`}>
      <Link href={href} className="block h-full flex flex-col">
        {children}
      </Link>
    </Card>
  );
}

function InactiveCard({ children }: { children: React.ReactNode }) {
  return (
    <Card className="h-full p-6 border shadow-sm cursor-default transition-shadow bg-card flex flex-col">
      {children}
    </Card>
  );
}