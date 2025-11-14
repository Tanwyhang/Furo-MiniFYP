'use client';

import { useState, useEffect, ReactNode } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, Loader2 } from 'lucide-react';

interface ProviderGuardProps {
  children: ReactNode;
  fallback?: ReactNode;
  loadingComponent?: ReactNode;
  errorComponent?: ReactNode;
}

export function ProviderGuard({
  children,
  fallback,
  loadingComponent,
  errorComponent
}: ProviderGuardProps) {
  const [isReady, setIsReady] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    // Ensure we're on client side
    setIsClient(true);

    try {
      // Check if we can access global window and wagmi provider
      if (typeof window !== 'undefined') {
        // Small delay to ensure providers have time to initialize
        const timeout = setTimeout(() => {
          try {
            // Try to detect if wagmi provider is available by checking for common indicators
            const hasWagmi = !!(window as any).wagmi ||
                           document.querySelector('[data-wagmi]') ||
                           // Check for RainbowKit or other Web3 provider indicators
                           document.querySelector('[data-rk]') ||
                           document.querySelector('.wagmi');

            if (hasWagmi || process.env.NODE_ENV === 'development') {
              setIsReady(true);
            } else {
              setHasError(true);
            }
          } catch (error) {
            console.warn('Provider guard check failed:', error);
            // In development, be more permissive
            if (process.env.NODE_ENV === 'development') {
              setIsReady(true);
            } else {
              setHasError(true);
            }
          }
        }, 100);

        return () => clearTimeout(timeout);
      } else {
        setHasError(true);
      }
    } catch (error) {
      console.warn('Provider guard initialization failed:', error);
      setHasError(true);
    }
  }, []);

  if (!isClient) {
    return fallback || (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse">Loading...</div>
      </div>
    );
  }

  if (hasError) {
    return errorComponent || (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 text-destructive">
              <AlertCircle className="h-5 w-5" />
              <div>
                <h3 className="font-medium">Web3 Provider Not Available</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Please ensure your wallet is connected and try refreshing the page.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isReady) {
    return loadingComponent || (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Initializing Web3 providers...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

// A simpler loading-only guard for specific components
export function Web3LoadingGuard({
  children,
  loadingText = "Loading..."
}: {
  children: ReactNode;
  loadingText?: string;
}) {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsReady(true);
    }, 50); // Very short delay, just enough for provider setup

    return () => clearTimeout(timer);
  }, []);

  if (!isReady) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>{loadingText}</span>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}