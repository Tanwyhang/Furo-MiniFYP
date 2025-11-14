'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';

// Dynamic import the actual providers with ssr: false
const DynamicProviders = dynamic(() => import('@/lib/providers').then(mod => ({ default: mod.Providers })), {
  ssr: false
});

export function ClientProviders({ children }: { children: React.ReactNode }) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Only render providers on client side
  if (!isClient) {
    return <>{children}</>;
  }

  return <DynamicProviders>{children}</DynamicProviders>;
}